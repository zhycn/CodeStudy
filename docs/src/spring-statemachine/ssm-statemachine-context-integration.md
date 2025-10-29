# Spring Statemachine Context Integration 上下文集成详解与最佳实践

## 1. 概述

Spring Statemachine 是一个强大的状态机框架，它提供了丰富的功能来管理复杂的状态转换逻辑。上下文集成（Context Integration）是 Spring Statemachine 中一个至关重要的特性，它允许开发者在状态机的不同生命周期阶段访问和操作上下文信息。

在本教程中，我们将深入探讨 Spring Statemachine 4.x 的上下文集成机制，包括 `StateContext` 的使用、`@WithStateMachine` 注解的应用、监听器机制以及最佳实践方案。

## 2. StateContext 深入解析

### 2.1 StateContext 的作用

`StateContext` 是 Spring Statemachine 中最重要的上下文对象之一，它提供了对状态机当前执行环境的全面访问。通过 `StateContext`，您可以：

- 访问当前状态和转换信息
- 操作扩展状态变量（Extended State Variables）
- 获取事件消息和消息头
- 处理状态机错误信息

### 2.2 StateContext 的核心组件

```java
public interface StateContext<S, E> {
    // 获取状态机实例
    StateMachine<S, E> getStateMachine();

    // 获取扩展状态
    ExtendedState getExtendedState();

    // 获取当前消息（如果有）
    Message<E> getMessage();

    // 获取转换信息
    Transition<S, E> getTransition();

    // 获取源状态和目标状态
    State<S, E> getSource();
    State<S, E> getTarget();

    // 获取异常信息（如果有）
    Exception getException();

    // 获取当前阶段
    Stage getStage();
}
```

### 2.3 使用 StateContext 的示例

```java
public class OrderProcessingAction implements Action<String, String> {
    @Override
    public void execute(StateContext<String, String> context) {
        // 获取扩展状态变量
        ExtendedState extendedState = context.getExtendedState();
        Map<Object, Object> variables = extendedState.getVariables();

        // 获取当前订单ID
        Long orderId = (Long) variables.get("orderId");

        // 获取事件消息头
        Message<String> message = context.getMessage();
        String priority = (String) message.getHeaders().get("priority");

        // 记录状态转换信息
        State<String, String> source = context.getSource();
        State<String, String> target = context.getTarget();

        System.out.println("Processing order " + orderId + " from " +
            source.getId() + " to " + target.getId() + " with priority " + priority);

        // 设置处理结果到扩展状态
        extendedState.getVariables().put("processingResult", "SUCCESS");
    }
}
```

## 3. @WithStateMachine 注解详解

### 3.1 基本用法

`@WithStateMachine` 注解允许将普通的 Spring Bean 与状态机集成，使这些 Bean 能够响应状态机的事件和状态变化。

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {
    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
            .initial("START")
            .state("PROCESSING")
            .state("COMPLETED")
            .state("ERROR");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
            .source("START").target("PROCESSING").event("START_PROCESSING")
            .and()
            .withExternal()
            .source("PROCESSING").target("COMPLETED").event("PROCESSING_COMPLETE")
            .and()
            .withExternal()
            .source("PROCESSING").target("ERROR").event("PROCESSING_ERROR");
    }
}

// 使用 @WithStateMachine 注解的 Bean
@WithStateMachine
public class OrderProcessor {

    @OnTransition
    public void anyTransition() {
        System.out.println("Transition occurred");
    }

    @OnTransition(source = "START", target = "PROCESSING")
    public void startProcessing(StateContext<String, String> context) {
        ExtendedState extendedState = context.getExtendedState();
        Long orderId = (Long) extendedState.getVariables().get("orderId");
        System.out.println("Starting processing for order: " + orderId);
    }

    @OnTransition(source = "PROCESSING", target = "COMPLETED")
    public void completeProcessing() {
        System.out.println("Order processing completed successfully");
    }

    @OnTransition(source = "PROCESSING", target = "ERROR")
    public void processingError(StateContext<String, String> context) {
        Exception exception = context.getException();
        System.out.println("Processing error: " + exception.getMessage());
    }

    @OnStateChanged(source = "PROCESSING")
    public void onProcessingState() {
        System.out.println("Now in PROCESSING state");
    }
}
```

### 3.2 方法参数支持

`@WithStateMachine` 注解的方法可以接受多种类型的参数：

```java
@WithStateMachine
public class ComprehensiveExample {

    // 1. 基本状态变更通知
    @OnTransition
    public void onAnyTransition() {
        System.out.println("Any transition occurred");
    }

    // 2. 带 StateContext 参数
    @OnTransition(source = "S1", target = "S2")
    public void onSpecificTransition(StateContext<String, String> context) {
        System.out.println("Transition from S1 to S2");
    }

    // 3. 获取消息头
    @OnTransition
    public void withMessageHeaders(@EventHeaders Map<String, Object> headers) {
        System.out.println("Message headers: " + headers);
    }

    // 4. 获取特定消息头
    @OnTransition
    public void withSpecificHeader(@EventHeader("orderId") Long orderId) {
        System.out.println("Order ID: " + orderId);
    }

    // 5. 获取扩展状态
    @OnTransition
    public void withExtendedState(ExtendedState extendedState) {
        System.out.println("Extended state variables: " + extendedState.getVariables());
    }

    // 6. 获取状态机实例
    @OnTransition
    public void withStateMachine(StateMachine<String, String> stateMachine) {
        System.out.println("Current state: " + stateMachine.getState().getId());
    }

    // 7. 获取事件消息
    @OnTransition
    public void withMessage(Message<String> message) {
        System.out.println("Event payload: " + message.getPayload());
    }

    // 8. 异常处理
    @OnTransition
    public void withException(Exception exception) {
        if (exception != null) {
            System.out.println("Exception occurred: " + exception.getMessage());
        }
    }

    // 9. 状态进入监听
    @OnStateEntry(source = "PROCESSING")
    public void onEntryToProcessing() {
        System.out.println("Entered PROCESSING state");
    }

    // 10. 状态退出监听
    @OnStateExit(source = "PROCESSING")
    public void onExitFromProcessing() {
        System.out.println("Exited PROCESSING state");
    }
}
```

## 4. 监听器机制

### 4.1 StateMachineListener

Spring Statemachine 提供了完整的监听器机制，允许监听状态机的各种事件。

```java
public class ComprehensiveStateMachineListener implements StateMachineListener<String, String> {

    @Override
    public void stateChanged(State<String, String> from, State<String, String> to) {
        System.out.println("State changed from " + (from != null ? from.getId() : "null") +
                          " to " + to.getId());
    }

    @Override
    public void stateEntered(State<String, String> state) {
        System.out.println("Entered state: " + state.getId());
    }

    @Override
    public void stateExited(State<String, String> state) {
        System.out.println("Exited state: " + state.getId());
    }

    @Override
    public void eventNotAccepted(Message<String> event) {
        System.out.println("Event not accepted: " + event.getPayload());
    }

    @Override
    public void transition(Transition<String, String> transition) {
        System.out.println("Transition: " + transition.getKind());
    }

    @Override
    public void transitionStarted(Transition<String, String> transition) {
        System.out.println("Transition started: " + transition.getKind());
    }

    @Override
    public void transitionEnded(Transition<String, String> transition) {
        System.out.println("Transition ended: " + transition.getKind());
    }

    @Override
    public void stateMachineStarted(StateMachine<String, String> stateMachine) {
        System.out.println("State machine started");
    }

    @Override
    public void stateMachineStopped(StateMachine<String, String> stateMachine) {
        System.out.println("State machine stopped");
    }

    @Override
    public void extendedStateChanged(Object key, Object value) {
        System.out.println("Extended state changed - Key: " + key + ", Value: " + value);
    }

    @Override
    public void stateMachineError(StateMachine<String, String> stateMachine, Exception exception) {
        System.out.println("State machine error: " + exception.getMessage());
    }

    @Override
    public void stateContext(StateContext<String, String> stateContext) {
        System.out.println("State context stage: " + stateContext.getStage());
    }
}

// 注册监听器
@Configuration
@EnableStateMachine
public class ListenerConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withConfiguration()
            .listener(stateMachineListener());
    }

    @Bean
    public StateMachineListener<String, String> stateMachineListener() {
        return new ComprehensiveStateMachineListener();
    }
}
```

### 4.2 应用事件监听

Spring Statemachine 还会发布应用事件，可以通过 `@EventListener` 监听这些事件。

```java
@Component
public class ApplicationEventListener {

    @EventListener
    public void onStateMachineStart(OnStateMachineStart event) {
        System.out.println("State machine started: " + event.getStateMachine().getId());
    }

    @EventListener
    public void onStateMachineStop(OnStateMachineStop event) {
        System.out.println("State machine stopped: " + event.getStateMachine().getId());
    }

    @EventListener
    public void onStateChanged(OnStateChangedEvent<String, String> event) {
        System.out.println("State changed: " + event.getState().getId());
    }

    @EventListener
    public void onTransition(OnTransitionStartEvent<String, String> event) {
        System.out.println("Transition started: " + event.getTransition().getKind());
    }

    @EventListener
    public void onExtendedStateChanged(OnExtendedStateChanged event) {
        System.out.println("Extended state changed: " + event.getKey() + " = " + event.getValue());
    }
}
```

## 5. 扩展状态（Extended State）管理

### 5.1 扩展状态的基本使用

扩展状态允许在状态机中存储和访问任意数据，这些数据在状态机的整个生命周期中保持可用。

```java
@Configuration
@EnableStateMachine
public class ExtendedStateConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
            .initial("START")
            .state("PROCESSING", extendedStateAction(), null)
            .state("COMPLETED");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
            .source("START").target("PROCESSING").event("START_PROCESSING")
            .action(initializeExtendedState())
            .and()
            .withExternal()
            .source("PROCESSING").target("COMPLETED").event("PROCESSING_COMPLETE")
            .action(processExtendedState());
    }

    @Bean
    public Action<String, String> initializeExtendedState() {
        return new Action<String, String>() {
            @Override
            public void execute(StateContext<String, String> context) {
                ExtendedState extendedState = context.getExtendedState();

                // 初始化扩展状态变量
                extendedState.getVariables().put("startTime", System.currentTimeMillis());
                extendedState.getVariables().put("attemptCount", 0);
                extendedState.getVariables().put("processingResult", "PENDING");

                // 从消息头获取数据
                Message<String> message = context.getMessage();
                if (message != null) {
                    Long orderId = (Long) message.getHeaders().get("orderId");
                    if (orderId != null) {
                        extendedState.getVariables().put("orderId", orderId);
                    }
                }
            }
        };
    }

    @Bean
    public Action<String, String> processExtendedState() {
        return new Action<String, String>() {
            @Override
            public void execute(StateContext<String, String> context) {
                ExtendedState extendedState = context.getExtendedState();
                Map<Object, Object> variables = extendedState.getVariables();

                // 更新处理结果
                variables.put("processingResult", "SUCCESS");
                variables.put("endTime", System.currentTimeMillis());

                // 计算处理时间
                Long startTime = (Long) variables.get("startTime");
                Long endTime = (Long) variables.get("endTime");
                Long duration = endTime - startTime;
                variables.put("processingDuration", duration);

                System.out.println("Order " + variables.get("orderId") +
                                 " processed in " + duration + "ms");
            }
        };
    }

    @Bean
    public Action<String, String> extendedStateAction() {
        return new Action<String, String>() {
            @Override
            public void execute(StateContext<String, String> context) {
                // 在状态进入时操作扩展状态
                ExtendedState extendedState = context.getExtendedState();
                Integer attemptCount = (Integer) extendedState.getVariables().get("attemptCount");
                if (attemptCount == null) {
                    attemptCount = 0;
                }
                attemptCount++;
                extendedState.getVariables().put("attemptCount", attemptCount);

                System.out.println("Processing attempt #" + attemptCount);
            }
        };
    }
}
```

### 5.2 扩展状态变更监听

可以监听扩展状态的变更事件：

```java
@Component
public class ExtendedStateChangeListener {

    @EventListener
    public void onExtendedStateChange(OnExtendedStateChanged event) {
        System.out.println("Extended state changed - Key: " + event.getKey() +
                          ", Value: " + event.getValue());
    }

    // 或者使用 StateMachineListener
    public class ExtendedStateListener extends StateMachineListenerAdapter<String, String> {
        @Override
        public void extendedStateChanged(Object key, Object value) {
            System.out.println("Extended state changed - Key: " + key + ", Value: " + value);
        }
    }
}
```

## 6. 最佳实践

### 6.1 上下文管理策略

**1. 使用清晰的键命名规范**

```java
public class StateMachineConstants {
    public static final String ORDER_ID = "orderId";
    public static final String PROCESSING_START_TIME = "processingStartTime";
    public static final String ATTEMPT_COUNT = "attemptCount";
    public static final String PROCESSING_RESULT = "processingResult";
    public static final String ERROR_MESSAGE = "errorMessage";
}

// 使用常量访问扩展状态
extendedState.getVariables().put(StateMachineConstants.ORDER_ID, orderId);
Object orderId = extendedState.getVariables().get(StateMachineConstants.ORDER_ID);
```

**2. 封装扩展状态访问逻辑**

```java
@Component
public class StateMachineContextHelper {

    public Long getOrderId(ExtendedState extendedState) {
        return (Long) extendedState.getVariables().get(StateMachineConstants.ORDER_ID);
    }

    public void setOrderId(ExtendedState extendedState, Long orderId) {
        extendedState.getVariables().put(StateMachineConstants.ORDER_ID, orderId);
    }

    public void incrementAttemptCount(ExtendedState extendedState) {
        Integer count = (Integer) extendedState.getVariables()
            .getOrDefault(StateMachineConstants.ATTEMPT_COUNT, 0);
        extendedState.getVariables().put(StateMachineConstants.ATTEMPT_COUNT, count + 1);
    }

    public void setProcessingResult(ExtendedState extendedState, String result) {
        extendedState.getVariables().put(StateMachineConstants.PROCESSING_RESULT, result);
    }

    public void setError(ExtendedState extendedState, String errorMessage) {
        extendedState.getVariables().put(StateMachineConstants.ERROR_MESSAGE, errorMessage);
        extendedState.getVariables().put(StateMachineConstants.PROCESSING_RESULT, "ERROR");
    }
}
```

### 6.2 错误处理策略

```java
@Configuration
@EnableStateMachine
public class ErrorHandlingConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
            .initial("START")
            .state("PROCESSING")
            .state("COMPLETED")
            .state("ERROR", errorAction(), null);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
            .source("START").target("PROCESSING").event("START_PROCESSING")
            .and()
            .withExternal()
            .source("PROCESSING").target("COMPLETED").event("PROCESSING_COMPLETE")
            .and()
            .withExternal()
            .source("PROCESSING").target("ERROR").event("PROCESSING_ERROR")
            .action(errorHandlingAction());
    }

    @Bean
    public Action<String, String> errorHandlingAction() {
        return new Action<String, String>() {
            @Override
            public void execute(StateContext<String, String> context) {
                // 获取异常信息
                Exception exception = context.getException();

                // 记录错误信息到扩展状态
                ExtendedState extendedState = context.getExtendedState();
                extendedState.getVariables().put("errorTimestamp", System.currentTimeMillis());

                if (exception != null) {
                    extendedState.getVariables().put("errorMessage", exception.getMessage());
                    extendedState.getVariables().put("errorType", exception.getClass().getSimpleName());
                }

                // 可以根据异常类型进行不同的处理
                if (exception instanceof TimeoutException) {
                    extendedState.getVariables().put("errorSeverity", "RETRYABLE");
                } else if (exception instanceof ValidationException) {
                    extendedState.getVariables().put("errorSeverity", "FATAL");
                }
            }
        };
    }

    @Bean
    public Action<String, String> errorAction() {
        return new Action<String, String>() {
            @Override
            public void execute(StateContext<String, String> context) {
                ExtendedState extendedState = context.getExtendedState();
                Map<Object, Object> variables = extendedState.getVariables();

                System.out.println("Error occurred: " + variables.get("errorMessage"));
                System.out.println("Error type: " + variables.get("errorType"));
                System.out.println("Error severity: " + variables.get("errorSeverity"));

                // 可以在这里添加错误通知逻辑
                notifyErrorHandlingTeam(variables);
            }

            private void notifyErrorHandlingTeam(Map<Object, Object> errorDetails) {
                // 实现错误通知逻辑
            }
        };
    }
}
```

### 6.3 性能优化策略

**1. 避免在扩展状态中存储大数据**

```java
// 不推荐 - 存储大对象
extendedState.getVariables().put("largeData", veryLargeObject);

// 推荐 - 存储引用或标识符
extendedState.getVariables().put("dataReference", dataId);
// 从外部存储按需获取数据
```

**2. 使用类型安全的访问方式**

```java
public class TypedExtendedStateAccessor {
    private final ExtendedState extendedState;

    public TypedExtendedStateAccessor(ExtendedState extendedState) {
        this.extendedState = extendedState;
    }

    public Long getOrderId() {
        return get(StateMachineConstants.ORDER_ID, Long.class);
    }

    public void setOrderId(Long orderId) {
        put(StateMachineConstants.ORDER_ID, orderId);
    }

    public Integer getAttemptCount() {
        return get(StateMachineConstants.ATTEMPT_COUNT, Integer.class);
    }

    public void incrementAttemptCount() {
        Integer count = getAttemptCount();
        put(StateMachineConstants.ATTEMPT_COUNT, count != null ? count + 1 : 1);
    }

    private <T> T get(String key, Class<T> type) {
        Object value = extendedState.getVariables().get(key);
        return type.isInstance(value) ? type.cast(value) : null;
    }

    private void put(String key, Object value) {
        extendedState.getVariables().put(key, value);
    }
}
```

## 7. 实战示例：订单处理系统

下面是一个完整的订单处理系统示例，展示了上下文集成的最佳实践：

```java
// 订单状态定义
public enum OrderStates {
    START, VALIDATION, PROCESSING_PAYMENT, INVENTORY_CHECK,
    SHIPPING, COMPLETED, CANCELLED, ERROR
}

// 订单事件定义
public enum OrderEvents {
    START_PROCESSING, VALIDATION_SUCCESS, VALIDATION_FAILED,
    PAYMENT_SUCCESS, PAYMENT_FAILED, INVENTORY_AVAILABLE,
    INVENTORY_UNAVAILABLE, SHIPPING_SUCCESS, SHIPPING_FAILED,
    RETRY, CANCEL
}

// 订单处理配置
@Configuration
@EnableStateMachine
public class OrderProcessingConfig extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states) throws Exception {
        states
            .withStates()
            .initial(OrderStates.START)
            .state(OrderStates.VALIDATION, validationAction(), null)
            .state(OrderStates.PROCESSING_PAYMENT, paymentAction(), null)
            .state(OrderStates.INVENTORY_CHECK, inventoryAction(), null)
            .state(OrderStates.SHIPPING, shippingAction(), null)
            .state(OrderStates.COMPLETED, completionAction(), null)
            .state(OrderStates.ERROR, errorAction(), null)
            .state(OrderStates.CANCELLED, cancellationAction(), null);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions) throws Exception {
        transitions
            .withExternal()
            .source(OrderStates.START).target(OrderStates.VALIDATION).event(OrderEvents.START_PROCESSING)
            .action(initializeOrderContext())
            .and()
            .withExternal()
            .source(OrderStates.VALIDATION).target(OrderStates.PROCESSING_PAYMENT).event(OrderEvents.VALIDATION_SUCCESS)
            .and()
            .withExternal()
            .source(OrderStates.VALIDATION).target(OrderStates.ERROR).event(OrderEvents.VALIDATION_FAILED)
            .action(handleValidationError())
            .and()
            .withExternal()
            .source(OrderStates.PROCESSING_PAYMENT).target(OrderStates.INVENTORY_CHECK).event(OrderEvents.PAYMENT_SUCCESS)
            .and()
            .withExternal()
            .source(OrderStates.PROCESSING_PAYMENT).target(OrderStates.ERROR).event(OrderEvents.PAYMENT_FAILED)
            .action(handlePaymentError())
            .and()
            .withExternal()
            .source(OrderStates.INVENTORY_CHECK).target(OrderStates.SHIPPING).event(OrderEvents.INVENTORY_AVAILABLE)
            .and()
            .withExternal()
            .source(OrderStates.INVENTORY_CHECK).target(OrderStates.ERROR).event(OrderEvents.INVENTORY_UNAVAILABLE)
            .action(handleInventoryError())
            .and()
            .withExternal()
            .source(OrderStates.SHIPPING).target(OrderStates.COMPLETED).event(OrderEvents.SHIPPING_SUCCESS)
            .and()
            .withExternal()
            .source(OrderStates.SHIPPING).target(OrderStates.ERROR).event(OrderEvents.SHIPPING_FAILED)
            .action(handleShippingError())
            .and()
            .withExternal()
            .source(OrderStates.ERROR).target(OrderStates.VALIDATION).event(OrderEvents.RETRY)
            .action(prepareForRetry())
            .and()
            .withExternal()
            .source(OrderStates.ERROR).target(OrderStates.CANCELLED).event(OrderEvents.CANCEL)
            .action(handleCancellation());
    }

    @Bean
    public Action<OrderStates, OrderEvents> initializeOrderContext() {
        return new Action<OrderStates, OrderEvents>() {
            @Override
            public void execute(StateContext<OrderStates, OrderEvents> context) {
                ExtendedState extendedState = context.getExtendedState();
                Message<OrderEvents> message = context.getMessage();

                // 从消息头获取订单信息
                Long orderId = (Long) message.getHeaders().get("orderId");
                String customerId = (String) message.getHeaders().get("customerId");

                // 初始化订单上下文
                extendedState.getVariables().put("orderId", orderId);
                extendedState.getVariables().put("customerId", customerId);
                extendedState.getVariables().put("startTime", System.currentTimeMillis());
                extendedState.getVariables().put("attemptCount", 0);
                extendedState.getVariables().put("processingHistory", new ArrayList<String>());

                addHistoryEntry(extendedState, "Order processing started");
            }
        };
    }

    // 其他Action bean定义...

    private void addHistoryEntry(ExtendedState extendedState, String entry) {
        @SuppressWarnings("unchecked")
        List<String> history = (List<String>) extendedState.getVariables()
            .getOrDefault("processingHistory", new ArrayList<String>());
        history.add(System.currentTimeMillis() + ": " + entry);
        extendedState.getVariables().put("processingHistory", history);
    }
```

---

```java
    @Bean
    public Action<OrderStates, OrderEvents> validationAction() {
        return new Action<OrderStates, OrderEvents>() {
            @Override
            public void execute(StateContext<OrderStates, OrderEvents> context) {
                ExtendedState extendedState = context.getExtendedState();
                TypedExtendedStateAccessor accessor = new TypedExtendedStateAccessor(extendedState);

                // 获取订单信息
                Long orderId = accessor.getOrderId();
                String customerId = accessor.getCustomerId();

                addHistoryEntry(extendedState, "Starting order validation");

                try {
                    // 模拟验证逻辑
                    boolean isValid = validateOrder(orderId, customerId);

                    if (isValid) {
                        addHistoryEntry(extendedState, "Order validation successful");
                        context.getStateMachine().sendEvent(OrderEvents.VALIDATION_SUCCESS);
                    } else {
                        addHistoryEntry(extendedState, "Order validation failed");
                        context.getStateMachine().sendEvent(OrderEvents.VALIDATION_FAILED);
                    }
                } catch (Exception e) {
                    // 记录验证错误
                    extendedState.getVariables().put("validationError", e.getMessage());
                    addHistoryEntry(extendedState, "Validation error: " + e.getMessage());
                    context.getStateMachine().sendEvent(OrderEvents.VALIDATION_FAILED);
                }
            }

            private boolean validateOrder(Long orderId, String customerId) {
                // 实际项目中这里会调用验证服务
                return orderId != null && customerId != null && orderId > 0;
            }
        };
    }

    @Bean
    public Action<OrderStates, OrderEvents> handleValidationError() {
        return new Action<OrderStates, OrderEvents>() {
            @Override
            public void execute(StateContext<OrderStates, OrderEvents> context) {
                ExtendedState extendedState = context.getExtendedState();
                TypedExtendedStateAccessor accessor = new TypedExtendedStateAccessor(extendedState);

                // 增加尝试次数
                accessor.incrementAttemptCount();
                int attemptCount = accessor.getAttemptCount();

                String errorMessage = (String) extendedState.getVariables().get("validationError");
                addHistoryEntry(extendedState, "Validation failed (attempt " + attemptCount + "): " + errorMessage);

                // 设置错误信息
                extendedState.getVariables().put("lastError", "VALIDATION_ERROR");
                extendedState.getVariables().put("lastErrorMessage", errorMessage);
                extendedState.getVariables().put("lastErrorTimestamp", System.currentTimeMillis());
            }
        };
    }

    @Bean
    public Action<OrderStates, OrderEvents> prepareForRetry() {
        return new Action<OrderStates, OrderEvents>() {
            @Override
            public void execute(StateContext<OrderStates, OrderEvents> context) {
                ExtendedState extendedState = context.getExtendedState();

                // 清除之前的错误信息但保留历史
                extendedState.getVariables().remove("validationError");
                extendedState.getVariables().remove("paymentError");
                extendedState.getVariables().remove("inventoryError");
                extendedState.getVariables().remove("shippingError");

                addHistoryEntry(extendedState, "Preparing for retry after error resolution");
            }
        };
    }

    @Bean
    public Action<OrderStates, OrderEvents> completionAction() {
        return new Action<OrderStates, OrderEvents>() {
            @Override
            public void execute(StateContext<OrderStates, OrderEvents> context) {
                ExtendedState extendedState = context.getExtendedState();
                TypedExtendedStateAccessor accessor = new TypedExtendedStateAccessor(extendedState);

                // 计算总处理时间
                Long startTime = accessor.getStartTime();
                Long endTime = System.currentTimeMillis();
                Long processingTime = endTime - startTime;

                extendedState.getVariables().put("completionTime", endTime);
                extendedState.getVariables().put("totalProcessingTime", processingTime);
                extendedState.getVariables().put("finalStatus", "COMPLETED_SUCCESSFULLY");

                addHistoryEntry(extendedState, "Order processing completed successfully in " + processingTime + "ms");

                // 这里可以触发后续操作，如发送通知、更新数据库等
                sendCompletionNotification(accessor.getOrderId(), accessor.getCustomerId());
            }

            private void sendCompletionNotification(Long orderId, String customerId) {
                System.out.println("Sending completion notification for order: " + orderId + ", customer: " + customerId);
                // 实际项目中这里会调用通知服务
            }
        };
    }

    @Bean
    public Action<OrderStates, OrderEvents> errorAction() {
        return new Action<OrderStates, OrderEvents>() {
            @Override
            public void execute(StateContext<OrderStates, OrderEvents> context) {
                ExtendedState extendedState = context.getExtendedState();
                TypedExtendedStateAccessor accessor = new TypedExtendedStateAccessor(extendedState);

                // 记录错误发生时间
                extendedState.getVariables().put("errorTime", System.currentTimeMillis());
                extendedState.getVariables().put("finalStatus", "FAILED");

                addHistoryEntry(extendedState, "Order processing failed and entered ERROR state");

                // 触发错误处理流程
                handleOrderError(accessor.getOrderId(), accessor.getCustomerId());
            }

            private void handleOrderError(Long orderId, String customerId) {
                System.out.println("Initiating error handling for order: " + orderId + ", customer: " + customerId);
                // 实际项目中这里会调用错误处理服务
            }
        };
    }

    @Bean
    public Action<OrderStates, OrderEvents> cancellationAction() {
        return new Action<OrderStates, OrderEvents>() {
            @Override
            public void execute(StateContext<OrderStates, OrderEvents> context) {
                ExtendedState extendedState = context.getExtendedState();
                TypedExtendedStateAccessor accessor = new TypedExtendedStateAccessor(extendedState);

                // 记录取消时间和原因
                extendedState.getVariables().put("cancellationTime", System.currentTimeMillis());
                extendedState.getVariables().put("finalStatus", "CANCELLED");

                String cancellationReason = (String) extendedState.getVariables().get("cancellationReason");
                if (cancellationReason == null) {
                    cancellationReason = "User requested cancellation";
                }

                addHistoryEntry(extendedState, "Order cancelled: " + cancellationReason);

                // 触发取消处理流程
                handleOrderCancellation(accessor.getOrderId(), accessor.getCustomerId(), cancellationReason);
            }

            private void handleOrderCancellation(Long orderId, String customerId, String reason) {
                System.out.println("Processing cancellation for order: " + orderId +
                                 ", customer: " + customerId + ", reason: " + reason);
                // 实际项目中这里会调用取消处理服务
            }
        };
    }

    // 类型安全的扩展状态访问器
    public class TypedExtendedStateAccessor {
        private final ExtendedState extendedState;

        public TypedExtendedStateAccessor(ExtendedState extendedState) {
            this.extendedState = extendedState;
        }

        public Long getOrderId() {
            return get("orderId", Long.class);
        }

        public String getCustomerId() {
            return get("customerId", String.class);
        }

        public Long getStartTime() {
            return get("startTime", Long.class);
        }

        public Integer getAttemptCount() {
            return get("attemptCount", Integer.class);
        }

        public void incrementAttemptCount() {
            Integer count = getAttemptCount();
            put("attemptCount", count != null ? count + 1 : 1);
        }

        @SuppressWarnings("unchecked")
        public List<String> getProcessingHistory() {
            return get("processingHistory", List.class);
        }

        private <T> T get(String key, Class<T> type) {
            Object value = extendedState.getVariables().get(key);
            return type.isInstance(value) ? type.cast(value) : null;
        }

        private void put(String key, Object value) {
            extendedState.getVariables().put(key, value);
        }
    }

    private void addHistoryEntry(ExtendedState extendedState, String entry) {
        @SuppressWarnings("unchecked")
        List<String> history = (List<String>) extendedState.getVariables()
            .getOrDefault("processingHistory", new ArrayList<String>());
        history.add(System.currentTimeMillis() + ": " + entry);
        extendedState.getVariables().put("processingHistory", history);
    }
}

// 订单处理器（使用@WithStateMachine）
@WithStateMachine
public class OrderProcessor {

    private static final Logger logger = LoggerFactory.getLogger(OrderProcessor.class);

    @OnTransition
    public void onAnyTransition(StateContext<OrderStates, OrderEvents> context) {
        if (logger.isDebugEnabled()) {
            logger.debug("Transition from {} to {}",
                context.getSource() != null ? context.getSource().getId() : "null",
                context.getTarget() != null ? context.getTarget().getId() : "null");
        }
    }

    @OnTransition(source = "START", target = "VALIDATION")
    public void onStartValidation(StateContext<OrderStates, OrderEvents> context) {
        ExtendedState extendedState = context.getExtendedState();
        Long orderId = (Long) extendedState.getVariables().get("orderId");
        logger.info("Starting validation for order: {}", orderId);
    }

    @OnTransition(target = "ERROR")
    public void onErrorState(StateContext<OrderStates, OrderEvents> context) {
        ExtendedState extendedState = context.getExtendedState();
        Long orderId = (Long) extendedState.getVariables().get("orderId");
        String errorMessage = (String) extendedState.getVariables().get("lastErrorMessage");

        logger.error("Order {} entered ERROR state: {}", orderId, errorMessage);

        // 可以在这里添加错误通知逻辑
        sendErrorNotification(orderId, errorMessage);
    }

    @OnTransition(target = "COMPLETED")
    public void onCompletion(StateContext<OrderStates, OrderEvents> context) {
        ExtendedState extendedState = context.getExtendedState();
        Long orderId = (Long) extendedState.getVariables().get("orderId");
        Long processingTime = (Long) extendedState.getVariables().get("totalProcessingTime");

        logger.info("Order {} completed successfully in {}ms", orderId, processingTime);
    }

    @OnExtendedStateChanged(key = "attemptCount")
    public void onAttemptCountChange(Object key, Object value) {
        logger.debug("Attempt count changed to: {}", value);
    }

    private void sendErrorNotification(Long orderId, String errorMessage) {
        // 实现错误通知逻辑
        System.out.println("Sending error notification for order " + orderId + ": " + errorMessage);
    }
}

// 订单服务
@Service
public class OrderService {

    @Autowired
    private StateMachine<OrderStates, OrderEvents> stateMachine;

    @Autowired
    private StateMachinePersister<OrderStates, OrderEvents, String> persister;

    public void processOrder(Long orderId, String customerId) {
        try {
            // 恢复或初始化状态机
            stateMachine.start();

            // 准备消息头
            Message<OrderEvents> message = MessageBuilder
                .withPayload(OrderEvents.START_PROCESSING)
                .setHeader("orderId", orderId)
                .setHeader("customerId", customerId)
                .build();

            // 发送启动事件
            stateMachine.sendEvent(message);

            // 持久化状态
            persister.persist(stateMachine, "order_" + orderId);

        } catch (Exception e) {
            throw new RuntimeException("Failed to process order: " + orderId, e);
        }
    }

    public void retryOrder(Long orderId) {
        try {
            // 恢复状态机
            persister.restore(stateMachine, "order_" + orderId);

            // 发送重试事件
            stateMachine.sendEvent(OrderEvents.RETRY);

            // 重新持久化状态
            persister.persist(stateMachine, "order_" + orderId);

        } catch (Exception e) {
            throw new RuntimeException("Failed to retry order: " + orderId, e);
        }
    }

    public void cancelOrder(Long orderId, String reason) {
        try {
            // 恢复状态机
            persister.restore(stateMachine, "order_" + orderId);

            // 设置取消原因
            stateMachine.getExtendedState().getVariables().put("cancellationReason", reason);

            // 发送取消事件
            stateMachine.sendEvent(OrderEvents.CANCEL);

            // 持久化最终状态
            persister.persist(stateMachine, "order_" + orderId);

        } catch (Exception e) {
            throw new RuntimeException("Failed to cancel order: " + orderId, e);
        }
    }

    public Map<String, Object> getOrderStatus(Long orderId) {
        try {
            // 恢复状态机以获取当前状态
            persister.restore(stateMachine, "order_" + orderId);

            Map<String, Object> status = new HashMap<>();
            status.put("currentState", stateMachine.getState().getId().toString());
            status.put("extendedState", stateMachine.getExtendedState().getVariables());

            return status;

        } catch (Exception e) {
            throw new RuntimeException("Failed to get status for order: " + orderId, e);
        }
    }
}
```

## 8. 测试策略

### 8.1 单元测试

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class OrderProcessingTest {

    @Autowired
    private StateMachine<OrderStates, OrderEvents> stateMachine;

    @Autowired
    private OrderService orderService;

    @Test
    public void testOrderProcessingFlow() {
        // 测试正常流程
        Long orderId = 12345L;
        String customerId = "customer-001";

        orderService.processOrder(orderId, customerId);

        // 验证状态机进入验证状态
        assertEquals(OrderStates.VALIDATION, stateMachine.getState().getId());

        // 验证扩展状态
        assertNotNull(stateMachine.getExtendedState().getVariables().get("orderId"));
        assertEquals(orderId, stateMachine.getExtendedState().getVariables().get("orderId"));

        // 模拟验证成功
        stateMachine.sendEvent(OrderEvents.VALIDATION_SUCCESS);

        // 验证进入支付处理状态
        assertEquals(OrderStates.PROCESSING_PAYMENT, stateMachine.getState().getId());
    }

    @Test
    public void testErrorHandling() {
        // 测试错误处理流程
        Long orderId = 12346L;
        String customerId = "customer-002";

        orderService.processOrder(orderId, customerId);

        // 模拟验证失败
        stateMachine.sendEvent(OrderEvents.VALIDATION_FAILED);

        // 验证进入错误状态
        assertEquals(OrderStates.ERROR, stateMachine.getState().getId());

        // 验证错误信息被记录
        assertNotNull(stateMachine.getExtendedState().getVariables().get("lastError"));
        assertNotNull(stateMachine.getExtendedState().getVariables().get("lastErrorMessage"));

        // 测试重试机制
        stateMachine.sendEvent(OrderEvents.RETRY);

        // 验证回到验证状态
        assertEquals(OrderStates.VALIDATION, stateMachine.getState().getId());
    }
}
```

### 8.2 集成测试

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class OrderServiceIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Test
    public void testCompleteOrderLifecycle() {
        Long orderId = 12347L;
        String customerId = "customer-003";

        // 开始处理订单
        orderService.processOrder(orderId, customerId);

        // 获取初始状态
        Map<String, Object> status = orderService.getOrderStatus(orderId);
        assertEquals("VALIDATION", status.get("currentState"));

        // 模拟完成各个处理阶段
        orderService.retryOrder(orderId); // 触发重试机制

        // 验证最终完成状态
        status = orderService.getOrderStatus(orderId);
        assertTrue(status.containsKey("extendedState"));

        @SuppressWarnings("unchecked")
        Map<String, Object> extendedState = (Map<String, Object>) status.get("extendedState");
        assertTrue(extendedState.containsKey("processingHistory"));
    }
}
```

## 9. 总结

Spring Statemachine 的上下文集成提供了强大的机制来管理复杂的状态转换逻辑和业务流程。通过合理使用 `StateContext`、扩展状态、监听器和注解驱动的方法，您可以构建灵活、可维护且强大的状态机应用。

### 关键要点

1. **充分利用 StateContext**：通过 `StateContext` 访问状态机的完整执行环境信息
2. **合理使用扩展状态**：在扩展状态中存储业务流程相关数据，但避免存储过大对象
3. **采用注解驱动开发**：使用 `@WithStateMachine` 和相关注解简化状态机集成
4. **实现全面的监听机制**：结合 `StateMachineListener` 和应用事件实现全方位监控
5. **建立错误处理策略**：设计健壮的错误处理和重试机制
6. **实施类型安全访问**：通过封装类确保对扩展状态的类型安全访问

### 最佳实践总结

- 使用常量定义状态和事件类型
- 封装扩展状态访问逻辑
- 实现完整的监听和监控
- 设计可重试的错误处理流程
- 编写全面的测试用例
- 使用持久化机制保持状态一致性

通过遵循这些最佳实践，您可以构建出高效、可靠且易于维护的基于状态机的应用程序，能够处理复杂的业务流程和状态转换需求。

## 附录：常用上下文操作工具类

```java
public class StateMachineContextUtils {

    /**
     * 安全获取扩展状态值
     */
    public static <T> T getExtendedStateValue(ExtendedState extendedState, String key, Class<T> type) {
        Object value = extendedState.getVariables().get(key);
        return type.isInstance(value) ? type.cast(value) : null;
    }

    /**
     * 安全获取消息头值
     */
    public static <T> T getMessageHeader(Message<?> message, String headerKey, Class<T> type) {
        Object value = message.getHeaders().get(headerKey);
        return type.isInstance(value) ? type.cast(value) : null;
    }

    /**
     * 创建状态历史记录条目
     */
    public static void addStateHistory(ExtendedState extendedState, String state, String action, String details) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> history = (List<Map<String, Object>>)
            extendedState.getVariables().getOrDefault("stateHistory", new ArrayList<>());

        Map<String, Object> entry = new HashMap<>();
        entry.put("timestamp", System.currentTimeMillis());
        entry.put("state", state);
        entry.put("action", action);
        entry.put("details", details);

        history.add(entry);
        extendedState.getVariables().put("stateHistory", history);
    }

    /**
     * 获取状态机性能指标
     */
    public static Map<String, Object> getPerformanceMetrics(StateMachine<?, ?> stateMachine) {
        Map<String, Object> metrics = new HashMap<>();
        ExtendedState extendedState = stateMachine.getExtendedState();

        Long startTime = getExtendedStateValue(extendedState, "startTime", Long.class);
        if (startTime != null) {
            metrics.put("uptime", System.currentTimeMillis() - startTime);
        }

        Integer transitionCount = getExtendedStateValue(extendedState, "transitionCount", Integer.class);
        metrics.put("transitionCount", transitionCount != null ? transitionCount : 0);

        @SuppressWarnings("unchecked")
        List<String> errorHistory = (List<String>) extendedState.getVariables().get("errorHistory");
        if (errorHistory != null) {
            metrics.put("errorCount", errorHistory.size());
        }

        return metrics;
    }
}
```

这个完整的实战示例展示了如何在真实的订单处理系统中应用 Spring Statemachine 的上下文集成功能，实现了从订单验证到完成的完整业务流程，包括错误处理、重试机制和状态持久化等高级功能。
