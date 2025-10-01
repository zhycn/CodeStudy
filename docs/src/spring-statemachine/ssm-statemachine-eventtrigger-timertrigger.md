# Spring Statemachine EventTrigger & TimerTrigger 详解与最佳实践

## 1. 概述

在状态机的世界中，**触发器 (Trigger)** 是驱动状态转换的核心动力。Spring Statemachine 提供了强大而灵活的触发器机制，其中 `EventTrigger` 和 `TimerTrigger` 是最常用的两种。`EventTrigger` 允许我们通过显式发送事件来驱动状态机，而 `TimerTrigger` 则让状态机能够基于时间自动做出响应。

本文将深入探讨这两种触发器的原理、配置方法、使用场景，并提供经过验证的最佳实践和完整示例，帮助您在项目中高效、可靠地使用 Spring Statemachine。

## 2. EventTrigger (事件触发器)

### 2.1 核心概念

`EventTrigger` 是 Spring Statemachine 中最基本、最直接的触发器。它的工作原理是：当您向状态机发送一个事件（`Event`）时，状态机会检查当前状态是否存在基于该事件的转换（`Transition`）。如果存在且守卫条件（`Guard`）满足，则执行转换，并触发相应的动作（`Action`）。

### 2.2 配置与使用

#### 定义状态与事件枚举

```java
public enum States {
    SI, // Initial State
    S1,
    S2,
    SF  // Final State
}

public enum Events {
    E1,
    E2,
    EF
}
```

#### 配置状态机（Java Config）

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends EnumStateMachineConfigurerAdapter<States, Events> {

    @Override
    public void configure(StateMachineStateConfigurer<States, Events> states) throws Exception {
        states
            .withStates()
                .initial(States.SI)
                .states(EnumSet.allOf(States.class))
                .end(States.SF);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
        transitions
            .withExternal()
                .source(States.SI)
                .target(States.S1)
                .event(Events.E1)
                .and()
            .withExternal()
                .source(States.S1)
                .target(States.S2)
                .event(Events.E2)
                .and()
            .withExternal()
                .source(States.S2)
                .target(States.SF)
                .event(Events.EF);
    }
}
```

#### 发送事件

您可以通过自动注入的 `StateMachine` 实例来发送事件。

**1. 发送简单事件对象：**

```java
@Autowired
private StateMachine<States, Events> stateMachine;

public void sendSimpleEvent() {
    stateMachine.sendEvent(Events.E1);
}
```

**2. 发送带有消息头（Headers）的事件：**

事件通常需要携带一些附加信息（如订单ID、用户数据等），这时可以使用 `Message` 包装事件。

```java
import org.springframework.messaging.support.MessageBuilder;

public void sendEventWithHeaders() {
    Message<Events> message = MessageBuilder
        .withPayload(Events.E1)
        .setHeader("orderId", "ORD-12345")
        .setHeader("userId", "user-67890")
        .build();
    
    stateMachine.sendEvent(message);
}
```

在动作（Action）或守卫（Guard）中，您可以通过 `StateContext` 访问这些消息头：

```java
@Bean
public Action<States, Events> myAction() {
    return new Action<States, Events>() {
        @Override
        public void execute(StateContext<States, Events> context) {
            String orderId = (String) context.getMessageHeader("orderId");
            String userId = (String) context.getMessageHeader("userId");
            // 执行业务逻辑...
            System.out.println("Processing order: " + orderId + " for user: " + userId);
        }
    };
}
```

### 2.3 最佳实践

1. **事件设计**：将事件定义为枚举类型，以确保类型安全和代码清晰。事件名应能明确表达其意图（如 `ORDER_CREATED`, `PAYMENT_RECEIVED`）。
2. **消息头使用**：利用消息头来传递业务数据，保持事件对象本身的轻量和纯净。避免创建大量不同的事件类来承载数据。
3. **异常处理**：总是对 `sendEvent` 的调用进行异常处理。事件可能因为当前状态不接受、守卫条件不满足等原因而被忽略或导致错误。
4. **幂等性**：设计事件处理逻辑时，考虑幂等性。由于网络等原因，事件可能会被重复发送。

## 3. TimerTrigger (定时器触发器)

### 3.1 核心概念

`TimerTrigger` 允许状态机在进入某个状态后，自动地、基于时间地触发转换。这对于实现超时、轮询、定期任务等场景非常有用。Spring Statemachine 内部使用 `TaskScheduler` 来调度定时任务。

### 3.2 配置与使用

TimerTrigger 主要与 **内部转换 (Internal Transition)** 或 **自转换 (Self Transition)** 结合使用，因为它通常是在一个状态内部触发的行为，不改变当前状态（或状态改变后仍是自身）。

#### 周期性触发器 (timer)

```java
@Override
public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
    transitions
        .withInternal() // 内部转换，不离开当前状态
            .source(States.S1)
            .action(timedAction()) // 每次触发时执行的动作
            .timer(1000) // 每隔 1000ms 触发一次
            .and()
        .withExternal()
            .source(States.S1).target(States.S2).event(Events.E2);
}

@Bean
public Action<States, Events> timedAction() {
    return context -> {
        // 执行周期性任务，例如检查资源、发送心跳等
        System.out.println("Timer fired at state S1! Current time: " + System.currentTimeMillis());
    };
}
```

#### 一次性延迟触发器 (timerOnce)

```java
@Override
public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
    transitions
        .withInternal()
            .source(States.S2)
            .action(oneTimeAction()) // 延迟后执行一次的动作
            .timerOnce(3000) // 进入 S2 状态 3000ms 后触发一次
            .and()
        .withExternal()
            .source(States.S2).target(States.SF).event(Events.EF);
}

@Bean
public Action<States, Events> oneTimeAction() {
    return context -> {
        // 执行延迟任务，例如超时处理
        System.out.println("One-time timer fired! Initiating timeout process.");
        // 超时后，可以自动发送一个事件来驱动状态机离开当前状态
        context.getStateMachine().sendEvent(Events.EF);
    };
}
```

### 3.3 高级配置：使用 StateContext 设置动态超时

有时，超时时间可能需要动态决定。您可以在发送事件时，通过消息头指定超时时间。

```java
public void startProcessWithCustomTimeout() {
    Message<Events> message = MessageBuilder
        .withPayload(Events.START_PROCESS)
        .setHeader(StateMachineMessageHeaders.HEADER_DO_ACTION_TIMEOUT, 5000L) // 动态设置超时为 5 秒
        .build();
    
    stateMachine.sendEvent(message);
}
```

在配置中，您的定时器动作可以读取这个头信息（尽管配置阶段是固定的，此方法更适用于动态创建的机器或更复杂的逻辑）。更常见的做法是为不同业务场景配置不同的状态和定时器。

### 3.4 最佳实践

1. **资源清理**：当状态机离开配置了定时器的状态时，定时任务会自动取消。但如果您在动作中手动创建了线程或昂贵资源，请确保在 `Action` 中或通过监听状态退出事件来妥善清理它们。
2. **避免长时间运行的任务**：定时器触发的动作应快速执行完毕。长时间运行的任务会阻塞状态机线程（如果使用同步执行器），影响其他事件的处理。考虑将耗时任务提交给异步执行器。
3. **使用 timerOnce 实现超时**：`timerOnce` 是实现“在某个状态等待，若一段时间内没有收到预期事件则自动处理”模式的理想选择。
4. **分布式环境注意事项**：在集群环境中，单纯的本地内存定时器可能无法满足一致性要求。对于复杂的分布式定时需求，可能需要结合 Quartz、Spring Scheduler 或外部协调服务（如 Zookeeper）来触发事件，而非完全依赖 `TimerTrigger`。

## 4. 综合示例：订单处理状态机

下面是一个结合了 `EventTrigger` 和 `TimerTrigger` 的完整示例，模拟一个简单的订单处理流程。

### 4.1 定义状态、事件和配置

```java
// OrderStates.java
public enum OrderStates {
    INITIAL,
    WAITING_FOR_PAYMENT,
    PAYMENT_RECEIVED,
    PROCESSING,
    WAITING_FOR_SHIPMENT,
    SHIPPED,
    CANCELLED,
    COMPLETED
}

// OrderEvents.java
public enum OrderEvents {
    ORDER_CREATED,
    PAYMENT_CONFIRMED,
    PAYMENT_FAILED,
    PROCESS_COMPLETED,
    SHIP,
    DELIVERED,
    CANCEL
}
```

```java
// OrderStateMachineConfig.java
@Configuration
@EnableStateMachine
public class OrderStateMachineConfig extends EnumStateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states) throws Exception {
        states
            .withStates()
                .initial(OrderStates.INITIAL)
                .state(OrderStates.WAITING_FOR_PAYMENT, null, paymentTimeoutAction()) // 退出WAITING_FOR_PAYMENT时取消定时器
                .state(OrderStates.PROCESSING, processEntryAction(), null)
                .state(OrderStates.WAITING_FOR_SHIPMENT)
                .end(OrderStates.COMPLETED)
                .end(OrderStates.CANCELLED)
                .states(EnumSet.allOf(OrderStates.class));
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions) throws Exception {
        transitions
            // 订单创建 -> 等待支付
            .withExternal()
                .source(OrderStates.INITIAL)
                .target(OrderStates.WAITING_FOR_PAYMENT)
                .event(OrderEvents.ORDER_CREATED)
                .and()
            // 支付成功 -> 处理中
            .withExternal()
                .source(OrderStates.WAITING_FOR_PAYMENT)
                .target(OrderStates.PROCESSING)
                .event(OrderEvents.PAYMENT_CONFIRMED)
                .and()
            // 支付失败/超时 -> 取消
            .withExternal()
                .source(OrderStates.WAITING_FOR_PAYMENT)
                .target(OrderStates.CANCELLED)
                .event(OrderEvents.PAYMENT_FAILED)
                .and()
            // 支付超时：使用内部转换和定时器来触发超时事件
            .withInternal()
                .source(OrderStates.WAITING_FOR_PAYMENT)
                .action(paymentTimeoutAction())
                .timerOnce(300000) // 5分钟超时 (300,000 ms)
                .and()
            // 处理完成 -> 等待发货
            .withExternal()
                .source(OrderStates.PROCESSING)
                .target(OrderStates.WAITING_FOR_SHIPMENT)
                .event(OrderEvents.PROCESS_COMPLETED)
                .and()
            // 发货 -> 已完成
            .withExternal()
                .source(OrderStates.WAITING_FOR_SHIPMENT)
                .target(OrderStates.COMPLETED)
                .event(OrderEvents.SHIPPED)
                .and()
            // 在任何可取消的状态都可以取消订单
            .withExternal()
                .source(OrderStates.WAITING_FOR_PAYMENT)
                .target(OrderStates.CANCELLED)
                .event(OrderEvents.CANCEL)
                .and()
            .withExternal()
                .source(OrderStates.PROCESSING)
                .target(OrderStates.CANCELLED)
                .event(OrderEvents.CANCEL)
                .and()
            .withExternal()
                .source(OrderStates.WAITING_FOR_SHIPMENT)
                .target(OrderStates.CANCELLED)
                .event(OrderEvents.CANCEL);
    }

    @Bean
    public Action<OrderStates, OrderEvents> paymentTimeoutAction() {
        return new Action<OrderStates, OrderEvents>() {
            @Override
            public void execute(StateContext<OrderStates, OrderEvents> context) {
                // 当定时器触发时，发送支付失败事件
                System.out.println("Payment timeout! Cancelling order.");
                context.getStateMachine().sendEvent(OrderEvents.PAYMENT_FAILED);
            }
        };
    }

    @Bean
    public Action<OrderStates, OrderEvents> processEntryAction() {
        return new Action<OrderStates, OrderEvents>() {
            @Override
            public void execute(StateContext<OrderStates, OrderEvents> context) {
                // 模拟处理订单需要一些时间，这里用定时器模拟
                System.out.println("Order processing started. Will take 10 seconds.");
                // 通常更佳实践是在外部系统处理完成后发送事件，这里仅作演示
                // 可以使用异步任务或真正的业务逻辑来替代
                new Thread(() -> {
                    try {
                        Thread.sleep(10000); // 模拟处理10秒
                        context.getStateMachine().sendEvent(OrderEvents.PROCESS_COMPLETED);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }).start();
            }
        };
    }
}
```

### 4.2 使用状态机服务

```java
// OrderService.java
@Service
public class OrderService {

    @Autowired
    private StateMachine<OrderStates, OrderEvents> stateMachine;

    public void createOrder(String orderId) {
        Message<OrderEvents> message = MessageBuilder
                .withPayload(OrderEvents.ORDER_CREATED)
                .setHeader("orderId", orderId)
                .build();
        stateMachine.sendEvent(message);
        System.out.println("Order " + orderId + " created. Waiting for payment.");
    }

    public void confirmPayment(String orderId) {
        Message<OrderEvents> message = MessageBuilder
                .withPayload(OrderEvents.PAYMENT_CONFIRMED)
                .setHeader("orderId", orderId)
                .build();
        stateMachine.sendEvent(message);
        System.out.println("Payment confirmed for order: " + orderId);
    }

    public void cancelOrder(String orderId) {
        Message<OrderEvents> message = MessageBuilder
                .withPayload(OrderEvents.CANCEL)
                .setHeader("orderId", orderId)
                .build();
        stateMachine.sendEvent(message);
        System.out.println("Order " + orderId + " cancelled.");
    }

    // 添加状态机监听器来跟踪状态变化
    @EventListener
    public void stateChanged(OnStateChangedEvent<OrderStates, OrderEvents> event) {
        System.out.println("Order state changed from " + event.getSource().getId() + " to " + event.getTarget().getId());
    }
}
```

### 4.3 测试控制器

```java
// OrderController.java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/{orderId}")
    public ResponseEntity<String> createOrder(@PathVariable String orderId) {
        orderService.createOrder(orderId);
        return ResponseEntity.accepted().body("Order creation initiated.");
    }

    @PostMapping("/{orderId}/payment")
    public ResponseEntity<String> confirmPayment(@PathVariable String orderId) {
        orderService.confirmPayment(orderId);
        return ResponseEntity.ok().body("Payment confirmed.");
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<String> cancelOrder(@PathVariable String orderId) {
        orderService.cancelOrder(orderId);
        return ResponseEntity.ok().body("Cancel request received.");
    }
}
```

## 5. 总结

| 特性 | EventTrigger | TimerTrigger |
| :--- | :--- | :--- |
| **驱动方式** | 外部显式调用 `sendEvent()` | 内部自动基于时间调度 |
| **主要用途** | 响应外部业务动作（用户支付、系统指令） | 处理超时、轮询、定期任务 |
| **配置方式** | `.event(...)` | `.timer(...)` 或 `.timerOnce(...)` |
| **数据传递** | 通过 `Message` 和消息头 | 主要通过扩展状态变量或业务上下文 |
| **资源管理** | 无特殊要求 | 需注意任务取消和资源清理 |

**选择建议：**

- 使用 **`EventTrigger`** 当状态转换是由**外部离散的业务动作**（如用户操作、消息队列消息、RPC 调用结果）直接触发时。
- 使用 **`TimerTrigger`** 当状态转换需要**基于时间条件**自动触发时，例如：
  - **超时控制**：在特定状态等待，若一段时间内未收到预期事件，则自动执行超时逻辑。
  - **轮询检查**：定期检查外部系统状态或资源可用性。
  - **延迟执行**：进入状态后，延迟一段时间再执行某个操作。

通过熟练结合 `EventTrigger` 和 `TimerTrigger`，您可以设计出既能响应外部刺激又能智能处理时间约束的健壮、清晰的状态机流程，从而有效地对复杂业务逻辑进行建模和管理。
