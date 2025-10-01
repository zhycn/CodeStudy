# Spring Statemachine StateContext 详解与最佳实践

## 1. 概述

在 Spring Statemachine 中，`StateContext` 是一个极其重要的核心接口。它封装了状态机在执行过程中某个特定时刻的完整上下文信息，为开发者提供了一个统一的视角来观察和干预状态机的行为。无论是执行动作（Action）、评估守卫（Guard），还是监听状态机事件，`StateContext` 都是获取当前执行状态、事件信息、扩展变量等关键数据的主要入口。

理解并熟练运用 `StateContext` 是编写强大、灵活且易于维护的状态机逻辑的关键。

## 2. StateContext 的核心作用与结构

`StateContext` 是一个泛型接口，定义为 `StateContext<S, E>`，其中 `S` 代表状态类型，`E` 代表事件类型。

它的主要作用是作为一个中心化的信息载体，在状态机生命周期内的各个阶段（如状态转换、状态进入/退出、动作执行等）被创建并传递给相关的组件（如 `Action`, `Guard`, `Listener`），从而让这些组件能够基于完整的上下文做出决策或执行操作。

## 3. StateContext 提供的关键信息

通过 `StateContext`，你可以访问以下核心信息：

### 3.1 状态信息

* `State<S, E> getSource()`: 获取转换的**源状态**。在状态进入/退出时，此方法可能返回 `null`。
* `State<S, E> getTarget()`: 获取转换的**目标状态**。在状态进入/退出时，此方法可能返回 `null`。

### 3.2 事件与消息

* `Message<E> getMessage()`: 获取触发当前操作的 `Message` 对象。如果操作不是由事件直接触发的（例如定时器触发），则可能返回 `null`。
* `E getEvent()`: 便捷方法，直接从 `getMessage()` 中提取事件 payload。等价于 `getMessage().getPayload()`。
* `MessageHeaders getMessageHeaders()`: 获取伴随事件消息的所有头信息（Headers）。这是一个强大的功能，可以在事件传递时附加任意元数据。

```java
// 在发送事件时附加头信息
Message<Events> message = MessageBuilder
    .withPayload(Events.PAYMENT_RECEIVED)
    .setHeader("orderId", order.getId())
    .setHeader("amount", order.getAmount())
    .build();
stateMachine.sendEvent(message);

// 在 Action 或 Guard 中获取头信息
public Action<States, Events> processPaymentAction() {
    return context -> {
        String orderId = (String) context.getMessageHeaders().get("orderId");
        BigDecimal amount = (BigDecimal) context.getMessageHeaders().get("amount");
        // ... 处理支付逻辑
    };
}
```

### 3.3 扩展状态 (Extended State)

* `ExtendedState getExtendedState()`: 获取状态机的扩展状态。扩展状态是一组存储在状态机内部的键值对（`Map<Object, Object>`），用于存储不属于状态定义本身但又会影响状态机行为的变量。

```java
// 在 Action 中操作扩展状态变量
public Action<States, Events> incrementRetryCountAction() {
    return context -> {
        ExtendedState extendedState = context.getExtendedState();
        Integer retries = (Integer) extendedState.getVariables().get("retryCount");
        if (retries == null) {
            retries = 0;
        }
        extendedState.getVariables().put("retryCount", retries + 1);
    };
}

// 在 Guard 中根据扩展状态做判断
public Guard<States, Events> isMaxRetriesReachedGuard() {
    return context -> {
        Integer retries = context.getExtendedState().get("retryCount", Integer.class);
        return retries != null && retries >= MAX_RETRIES;
    };
}
```

### 3.4 状态机实例

* `StateMachine<S, E> getStateMachine()`: 获取当前正在运行的状态机实例。这允许你在组件内部与状态机进行交互，例如发送新的事件。

```java
public Action<States, Events> triggerRetryAction() {
    return context -> {
        StateMachine<States, Events> sm = context.getStateMachine();
        // 检查条件，并决定发送新事件
        if (someCondition) {
            sm.sendEvent(Events.RETRY);
        }
    };
}
```

### 3.5 转换信息

* `Transition<S, E> getTransition()`: 获取与当前上下文相关的 `Transition` 对象。这在复杂的监听逻辑中非常有用。

### 3.6 异常信息

* `Exception getException()`: 如果在操作执行过程中发生异常，可以通过此方法获取异常对象。常用于错误处理 Action 中。
* `Object getStage()`: (**Deprecated in later versions**) 获取当前操作所处的阶段（如 `TRANSITION_START`, `STATE_ENTRY`）。更推荐使用 `StateContext` 本身所传递的语义来推断阶段。

## 4. 使用场景与代码示例

### 4.1 在 Action 中使用

`Action` 是 `StateContext` 最常用的消费者。

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<States, Events> {

    @Override
    public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
        transitions
            .withExternal()
                .source(States.ORDER_PLACED)
                .target(States.PROCESSING)
                .event(Events.START_PROCESSING)
                .action(processOrderAction()) // 绑定 Action
                .and()
            .withInternal() // 内部转换，不改变状态
                .source(States.PROCESSING)
                .event(Events.RETRY)
                .action(retryAction());
    }

    @Bean
    public Action<States, Events> processOrderAction() {
        return context -> {
            // 1. 获取事件中的订单ID
            Long orderId = (Long) context.getMessageHeaders().get("orderId");
            
            // 2. 访问扩展状态
            ExtendedState extendedState = context.getExtendedState();
            extendedState.getVariables().put("currentOrderId", orderId);
            extendedState.getVariables().put("processingStartTime", Instant.now());
            
            // 3. 执行业务逻辑
            Order order = orderService.findById(orderId);
            try {
                orderProcessor.process(order);
                // 4. 业务成功，可以触发新事件（需注意异步风险）
                // context.getStateMachine().sendEvent(Events.PROCESSING_SUCCESS);
            } catch (Exception e) {
                extendedState.getVariables().put("lastError", e.getMessage());
                // 5. 业务失败，触发重试或失败事件
                context.getStateMachine().sendEvent(Events.PROCESSING_FAILED);
            }
        };
    }
    
    @Bean
    public Action<States, Events> retryAction() {
        return context -> {
            // 获取之前存储的订单ID
            Long orderId = context.getExtendedState().get("currentOrderId", Long.class);
            System.out.println("Retrying order: " + orderId);
            // 重试逻辑...
        };
    }
}
```

### 4.2 在 Guard 中使用

`Guard` 使用 `StateContext` 来动态决定转换是否应该发生。

```java
@Override
public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
    transitions
        .withExternal()
            .source(States.PROCESSING)
            .target(States.SUCCESS)
            .event(Events.PROCESSING_SUCCESS)
            .guard(processingSuccessGuard()) // 绑定Guard
            .and()
        .withExternal()
            .source(States.PROCESSING)
            .target(States.FAILED)
            .event(Events.PROCESSING_FAILED)
            .guard(processingFailedGuard());
}

@Bean
public Guard<States, Events> processingSuccessGuard() {
    return context -> {
        // 只有订单金额大于100且支付成功的订单才能进入SUCCESS
        Long orderId = context.getExtendedState().get("currentOrderId", Long.class);
        Order order = orderService.findById(orderId);
        
        boolean isPaymentValid = paymentService.validatePayment(order);
        boolean isAmountLargeEnough = order.getAmount().compareTo(BigDecimal.valueOf(100)) > 0;
        
        return isPaymentValid && isAmountLargeEnough;
    };
}

@Bean
public Guard<States, Events> processingFailedGuard() {
    return context -> {
        // 检查重试次数
        Integer retryCount = context.getExtendedState().get("retryCount", Integer.class);
        // 如果重试超过3次，才允许进入FAILED状态
        return retryCount != null && retryCount > 3;
    };
}
```

### 4.3 在监听器 (Listener) 中使用

虽然监听器有自己特定的方法参数，但许多方法也会提供 `StateContext` 或类似信息。

```java
@Component
public class StateMachineEventListener extends StateMachineListenerAdapter<States, Events> {

    @Override
    public void stateContext(StateContext<States, Events> stateContext) {
        // 这是一个通用回调，任何阶段的变化都会触发
        // 可以通过 stateContext 获取到当前阶段的所有信息
        Stage stage = stateContext.getStage(); // 注意：此方法已过时
        // 推荐通过监听更具体的事件（如下面的stateChanged）并自行推断阶段
    }

    @Override
    public void stateChanged(State<States, Events> from, State<States, Events> to) {
        // 状态改变监听
    }
    
    @Override
    public void eventNotAccepted(Message<Events> event) {
        // 事件被拒绝监听
    }
    
    // 更推荐使用 @WithStateMachine 和注解驱动监听，它们的方法参数可以直接注入 StateContext
}
```

使用 `@WithStateMachine` 和注解：

```java
@WithStateMachine
@Component
public class OrderStateListener {

    @OnTransition
    public void anyTransition(StateContext<States, Events> context) {
        // 任何转换发生时触发
        States source = context.getSource() != null ? context.getSource().getId() : null;
        States target = context.getTarget() != null ? context.getTarget().getId() : null;
        Events event = context.getEvent();
        log.info("Transition: {} --{}--> {}", source, event, target);
    }

    @OnStateChanged(source = "PROCESSING", target = "SUCCESS")
    public void onProcessingSuccess(StateContext<States, Events> context) {
        Long orderId = (Long) context.getMessageHeaders().get("orderId");
        orderService.markAsSuccessful(orderId);
    }
}
```

## 5. 最佳实践

1. **优先使用扩展状态而非全局变量**：将与状态机流程相关的临时数据存储在 `ExtendedState` 中，而不是类的成员变量中。这保证了状态机的线程安全性和可序列化性，尤其是在分布式场景下。
2. **善用消息头（Message Headers）**：在发送事件时，使用 `MessageBuilder` 附加必要的上下文信息（如业务ID），而不是依赖全局状态或复杂的查询逻辑来在 Action/Guard 中获取它们。
3. **谨慎在 Action 中发送新事件**：在 Action 内部调用 `sendEvent()` 时要非常小心，尤其是同步状态机。这可能引发意想不到的递归或状态冲突。确保逻辑清晰，有时使用延迟事件（Deferred Event）或异步执行可能是更好的选择。
4. **保持 Guard 的纯净性**：`Guard` 应该是一个无副作用的函数，只根据 `StateContext` 提供的信息进行计算并返回布尔值。避免在 `Guard` 中修改状态机的状态或执行业务逻辑。
5. **考虑序列化**：如果你计划持久化（Persist）状态机（例如到数据库或Redis），存储在 `ExtendedState` 中的对象必须是可序列化的。
6. **性能考量**：虽然 `StateContext` 提供了丰富的信息，但在高性能场景下，频繁地从消息头或扩展状态中存取数据也会有一定开销。对于极其关键的路径，可以考虑优化数据存取方式。

## 6. 常见问题与陷阱 (FAQ)

* **Q: `getSource()` 或 `getTarget()` 返回 `null`？**
  * **A:** 这通常发生在状态进入（entry）或退出（exit）的 Action 中，因为这些 Action 并不直接关联于一个“转换”，而是关联于一个状态。此时应使用状态本身的ID或通过其他方式（如扩展状态）来获取所需信息。
* **Q: `getMessage()` 返回 `null`？**
  * **A:** 如果当前操作不是由显式发送的 `Message` 事件触发的（例如，由初始状态自动进入、定时器触发或历史状态恢复触发），则 `getMessage()` 会返回 `null`。你的代码需要能处理这种情况。
* **Q: 如何在不同状态间共享复杂数据？**
  * **A:** 最佳实践是使用 `ExtendedState`。将数据以键值对的形式存入，在需要的地方取出。对于复杂的对象，确保它是线程安全和可序列化的。

## 7. 总结

`StateContext` 是 Spring Statemachine 的“信息枢纽”，它贯穿了状态机执行的整个生命周期。通过熟练运用其提供的状态、事件、消息头、扩展状态等核心信息，开发者可以构建出高度灵活、解耦且易于维护的业务流程。

记住最佳实践：**用消息头传递触发数据，用扩展状态维护流程数据，保持 Guard 纯净，并谨慎地在 Action 中触发新事件**。这样，你就能充分利用 Spring Statemachine 的强大能力，优雅地处理复杂的业务状态流转。
