# Spring Statemachine 状态机注解详解与最佳实践

## 1. 概述

Spring Statemachine 是 Spring 生态系统中的一个强大框架，用于在应用程序中实现状态机模式。通过使用注解驱动的方式，开发者可以更简洁、更直观地定义和管理复杂的状态转换逻辑。本文档将深入探讨 Spring Statemachine 4.x 的注解使用方式、最佳实践以及常见场景的解决方案。

## 2. 核心注解介绍

### 2.1 启用注解

#### @EnableStateMachine

用于启用状态机配置，通常用于配置类上（如果有多个状态机配置，应指定不同的名称）：

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {
    // 配置代码
}
```

#### @EnableStateMachineFactory

用于创建状态机工厂，适合需要多个状态机实例的场景：

```java
@Configuration
@EnableStateMachineFactory
public class StateMachineFactoryConfig extends StateMachineConfigurerAdapter<String, String> {
    // 配置代码
}
```

### 2.2 状态监听注解

Spring Statemachine 提供了一系列注解用于监听状态机的各种事件：

#### @OnTransition

监听状态转换事件：

```java
@OnTransition
public void onTransition() {
    System.out.println("Transition occurred");
}

@OnTransition(source = "S1", target = "S2")
public void fromS1ToS2() {
    System.out.println("Transition from S1 to S2");
}
```

#### @OnStateChanged

监听状态变化事件：

```java
@OnStateChanged
public void onStateChanged() {
    System.out.println("State changed");
}

@OnStateChanged(source = "S1", target = "S2")
public void stateChangeFromS1ToS2() {
    System.out.println("State changed from S1 to S2");
}
```

#### @OnStateEntry 和 @OnStateExit

监听状态进入和退出事件：

```java
@OnStateEntry(source = "S1")
public void onEntryS1() {
    System.out.println("Entering S1");
}

@OnStateExit(source = "S1")
public void onExitS1() {
    System.out.println("Exiting S1");
}
```

#### @OnEventNotAccepted

监听事件被拒绝的情况：

```java
@OnEventNotAccepted
public void onEventNotAccepted() {
    System.out.println("Event not accepted");
}
```

## 3. 启用状态机注解支持

要使用状态机注解，需要在配置中启用注解支持：

```java
@Configuration
@EnableStateMachine
@EnableWithStateMachine
public class Config extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withConfiguration()
            .autoStartup(true);
    }

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
            .initial("S1")
            .state("S2")
            .state("S3");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
            .source("S1").target("S2").event("E1")
            .and()
            .withExternal()
            .source("S2").target("S3").event("E2");
    }
}
```

## 4. 注解使用详解

### 4.1 基本用法

创建一个简单的状态机监听器：

```java
@Component
@WithStateMachine
public class MyStateMachineListener {

    @OnTransition
    public void anyTransition() {
        System.out.println("Transition occurred");
    }

    @OnTransition(source = "S1", target = "S2")
    public void fromS1ToS2() {
        System.out.println("Transition from S1 to S2");
    }

    @OnStateChanged(source = "S1", target = "S2")
    public void stateChangeFromS1ToS2() {
        System.out.println("State changed from S1 to S2");
    }
}
```

### 4.2 获取上下文信息

状态机注解方法可以获取丰富的上下文信息：

```java
@WithStateMachine
public class ContextAwareListener {

    @OnTransition
    public void onTransition(StateContext<String, String> context) {
        // 获取消息头
        Map<String, Object> headers = context.getMessage().getHeaders();

        // 获取扩展状态
        ExtendedState extendedState = context.getExtendedState();

        // 获取状态机实例
        StateMachine<String, String> stateMachine = context.getStateMachine();

        // 获取异常信息（如果有）
        Exception exception = context.getException();
    }

    @OnTransition
    public void onTransitionWithHeaders(@EventHeaders Map<String, Object> headers) {
        // 直接获取事件头信息
    }

    @OnTransition
    public void onTransitionWithExtendedState(ExtendedState extendedState) {
        // 直接获取扩展状态
    }
}
```

### 4.3 类型安全的注解

创建自定义注解以实现类型安全：

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@OnTransition
public @interface StatesOnTransition {
    States[] source() default {};
    States[] target() default {};
}

public enum States {
    S1, S2, S3
}

public enum Events {
    E1, E2, E3
}

@WithStateMachine
public class TypedSafeListener {

    @StatesOnTransition(source = States.S1, target = States.S2)
    public void fromS1ToS2() {
        System.out.println("Transition from S1 to S2");
    }
}
```

## 5. 最佳实践

### 5.1 组织监听器代码

**推荐做法**：按功能模块组织监听器

```java
// 订单状态监听器
@Component
@WithStateMachine(id = "orderStateMachine")
public class OrderStateListener {

    @OnTransition(source = "CREATED", target = "PAID")
    public void onOrderPaid() {
        System.out.println("Order paid, sending confirmation email");
    }

    @OnTransition(source = "PAID", target = "SHIPPED")
    public void onOrderShipped() {
        System.out.println("Order shipped, updating inventory");
    }
}

// 支付状态监听器
@Component
@WithStateMachine(id = "paymentStateMachine")
public class PaymentStateListener {

    @OnTransition(source = "PENDING", target = "COMPLETED")
    public void onPaymentCompleted() {
        System.out.println("Payment completed, processing order");
    }
}
```

### 5.2 异常处理

**推荐做法**：统一异常处理

```java
@WithStateMachine
public class ExceptionHandlingListener {

    @OnStateMachineError
    public void onError(StateMachine<String, String> stateMachine, Exception exception) {
        System.err.println("State machine error: " + exception.getMessage());
        // 记录日志、发送警报等
    }

    @OnTransition
    public void onTransition(StateContext<String, String> context) {
        try {
            // 业务逻辑
        } catch (Exception e) {
            context.getStateMachine().setStateMachineError(e);
        }
    }
}
```

### 5.3 性能优化

**推荐做法**：避免在注解方法中执行耗时操作

```java
@WithStateMachine
public class OptimizedListener {

    @Async // 使用异步处理
    @OnTransition(source = "S1", target = "S2")
    public void fromS1ToS2() {
        // 异步执行耗时操作
        processBackgroundTask();
    }

    private void processBackgroundTask() {
        // 耗时操作
    }
}
```

配置异步支持：

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(25);
        executor.initialize();
        return executor;
    }
}
```

### 5.4 测试策略

**推荐做法**：编写全面的单元测试

```java
@SpringBootTest
public class StateMachineListenerTest {

    @Autowired
    private StateMachine<String, String> stateMachine;

    @Autowired
    private MyStateMachineListener listener;

    @Test
    public void testTransitionListener() {
        stateMachine.start();

        // 添加测试监听器来验证注解方法被调用
        StateMachineListener<String, String> testListener = new StateMachineListenerAdapter<String, String>() {
            @Override
            public void stateChanged(State<String, String> from, State<String, String> to) {
                if ("S2".equals(to.getId())) {
                    // 验证业务逻辑
                    assertTrue(listener.isS2Reached());
                }
            }
        };

        stateMachine.addStateListener(testListener);
        stateMachine.sendEvent("E1");

        stateMachine.removeStateListener(testListener);
        stateMachine.stop();
    }
}
```

## 6. 常见场景解决方案

### 6.1 订单处理流程

```java
public enum OrderStates {
    CREATED, PAID, SHIPPED, DELIVERED, CANCELLED
}

public enum OrderEvents {
    PAY, SHIP, DELIVER, CANCEL
}

@Component
@WithStateMachine(id = "orderStateMachine")
public class OrderProcessListener {

    @OnTransition(source = "CREATED", target = "PAID")
    public void onPaymentReceived(StateContext<OrderStates, OrderEvents> context) {
        String orderId = (String) context.getMessage().getHeaders().get("orderId");
        System.out.println("Order " + orderId + " paid successfully");

        // 更新订单状态
        orderService.updateOrderStatus(orderId, OrderStates.PAID);
    }

    @OnTransition(source = "PAID", target = "SHIPPED")
    public void onOrderShipped(StateContext<OrderStates, OrderEvents> context) {
        String orderId = (String) context.getMessage().getHeaders().get("orderId");
        System.out.println("Order " + orderId + " shipped");

        // 发送发货通知
        notificationService.sendShippingNotification(orderId);
    }

    @OnEventNotAccepted
    public void onEventNotAccepted(StateContext<OrderStates, OrderEvents> context) {
        System.out.println("Event " + context.getEvent() + " not accepted in current state");

        // 处理无效事件，如已取消的订单不能发货
        if (context.getStateMachine().getState().getId() == OrderStates.CANCELLED) {
            throw new IllegalStateException("Cannot process event for cancelled order");
        }
    }
}
```

### 6.2 工作流审批

```java
public enum ApprovalStates {
    DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, REVISING
}

public enum ApprovalEvents {
    SUBMIT, APPROVE, REJECT, REQUEST_REVISION, RESUBMIT
}

@Component
@WithStateMachine(id = "approvalStateMachine")
public class ApprovalWorkflowListener {

    @OnStateEntry(source = "PENDING_APPROVAL")
    public void onPendingApproval(StateContext<ApprovalStates, ApprovalEvents> context) {
        String documentId = (String) context.getMessage().getHeaders().get("documentId");

        // 通知审批人
        approvalService.notifyApprovers(documentId);
    }

    @OnTransition(source = "PENDING_APPROVAL", target = "APPROVED")
    public void onApproved(StateContext<ApprovalStates, ApprovalEvents> context) {
        String documentId = (String) context.getMessage().getHeaders().get("documentId");

        // 记录审批结果
        auditService.logApproval(documentId, "APPROVED");

        // 执行后续操作
        workflowService.completeApproval(documentId);
    }

    @OnTransition(source = "PENDING_APPROVAL", target = "REJECTED")
    public void onRejected(StateContext<ApprovalStates, ApprovalEvents> context) {
        String documentId = (String) context.getMessage().getHeaders().get("documentId");
        String reason = (String) context.getMessage().getHeaders().get("rejectionReason");

        // 记录拒绝原因
        auditService.logRejection(documentId, reason);

        // 通知申请人
        notificationService.notifyRejection(documentId, reason);
    }
}
```

### 6.3 分布式环境下的注解使用

在分布式环境中，需要特别注意状态同步问题：

```java
@Configuration
@EnableStateMachine
public class DistributedStateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Autowired
    private StateMachineRuntimePersister<String, String, String> stateMachineRuntimePersister;

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withPersistence()
            .runtimePersister(stateMachineRuntimePersister);
    }
}

@Component
@WithStateMachine
public class DistributedStateListener {

    @OnTransition
    public void onDistributedTransition(StateContext<String, String> context) {
        // 在分布式环境中，确保操作是幂等的
        String transactionId = (String) context.getMessage().getHeaders().get("transactionId");

        if (!distributedLockService.tryLock(transactionId)) {
            // 另一个节点已经处理了这个转换
            return;
        }

        try {
            // 处理业务逻辑
            processBusinessLogic(context);
        } finally {
            distributedLockService.unlock(transactionId);
        }
    }

    private void processBusinessLogic(StateContext<String, String> context) {
        // 实现业务逻辑
    }
}
```

## 7. 常见问题与解决方案

### 7.1 注解不生效的问题

**问题**：注解方法没有被调用

**解决方案**：

1. 确保使用了 `@EnableWithStateMachine` 或 `@EnableStateMachine`
2. 检查监听器是否被 Spring 管理（使用 `@Component` 等注解）
3. 确认状态机 ID 匹配（如果使用了 `id` 或 `name` 属性）

```java
// 确保配置正确
@Configuration
@EnableStateMachine
@EnableWithStateMachine // 确保启用注解支持
public class Config extends StateMachineConfigurerAdapter<String, String> {
    // 配置
}

// 确保监听器是 Spring Bean
@Component
@WithStateMachine
public class MyListener {
    // 监听方法
}
```

### 7.2 顺序执行问题

**问题**：多个注解方法的执行顺序不确定

**解决方案**：使用 `@Order` 注解指定执行顺序

```java
@WithStateMachine
public class OrderedListener {

    @Order(1)
    @OnTransition
    public void firstListener() {
        System.out.println("This executes first");
    }

    @Order(2)
    @OnTransition
    public void secondListener() {
        System.out.println("This executes second");
    }
}
```

### 7.3 性能问题

**问题**：注解处理影响性能

**解决方案**：

1. 避免在注解方法中执行耗时操作
2. 使用异步处理
3. 批量处理状态转换

```java
@WithStateMachine
public class PerformanceOptimizedListener {

    @Async
    @OnTransition
    public void asyncProcessing(StateContext<String, String> context) {
        // 异步处理耗时操作
        heavyProcessingService.process(context);
    }

    @OnTransition
    public void batchProcessing(StateContext<String, String> context) {
        // 批量处理状态转换
        batchProcessor.addToBatch(context);
    }
}
```

## 8. 总结

Spring Statemachine 的注解功能提供了强大而灵活的方式来定义和监听状态转换。通过合理使用各种注解，可以创建出清晰、 maintainable 的状态机实现。关键最佳实践包括：

1. **合理组织代码**：按功能模块组织监听器
2. **异常处理**：统一处理状态机异常
3. **性能优化**：避免阻塞操作，使用异步处理
4. **全面测试**：编写完整的单元和集成测试
5. **分布式考虑**：在分布式环境中确保操作幂等性

遵循这些实践将帮助您构建健壮、高效的状态机应用程序。

## 附录：注解参考手册

### 注解列表

| 注解名称                     | 用途                                                                           | 示例                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `@EnableStateMachine`        | 用于启用状态机配置，通常用于配置类上（如果有多个状态机配置，应指定不同的名称） | `@Configuration @EnableStateMachine public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {}`               |
| `@EnableWithStateMachine`    | 用于启用状态机注解支持                                                         | `@Configuration @EnableStateMachine @EnableWithStateMachine public class Config extends StateMachineConfigurerAdapter<String, String> {}`   |
| `@EnableStateMachineFactory` | 用于创建状态机工厂，适合需要多个状态机实例的场景                               | `@Configuration @EnableStateMachineFactory public class StateMachineFactoryConfig extends StateMachineConfigurerAdapter<String, String> {}` |
| `@WithStateMachine`          | 标识类为状态机监听器                                                           | `@WithStateMachine(name = "myStateMachine")`                                                                                                |
| `@OnTransition`              | 监听状态转换事件                                                               | `@OnTransition(source = "S1", target = "S2")`                                                                                               |
| `@OnTransitionStart`         | 监听状态转换开始事件                                                           | `@OnTransitionStart`                                                                                                                        |
| `@OnTransitionEnd`           | 监听状态转换结束事件                                                           | `@OnTransitionEnd`                                                                                                                          |
| `@OnStateChanged`            | 监听状态变化事件                                                               | `@OnStateChanged(source = "S1", target = "S2")`                                                                                             |
| `@OnStateEntry`              | 监听状态进入事件                                                               | `@OnStateEntry(source = "S1")`                                                                                                              |
| `@OnStateExit`               | 监听状态退出事件                                                               | `@OnStateExit(source = "S1")`                                                                                                               |
| `@OnEventNotAccepted`        | 监听事件被拒绝的情况                                                           | `@OnEventNotAccepted(event = "E1")`                                                                                                         |
| `@OnStateMachineStart`       | 监听状态机启动事件                                                             | `@OnStateMachineStart`                                                                                                                      |
| `@OnStateMachineStop`        | 监听状态机停止事件                                                             | `@OnStateMachineStop`                                                                                                                       |
| `@OnStateMachineError`       | 监听状态机错误事件                                                             | `@OnStateMachineError`                                                                                                                      |
| `@OnExtendedStateChanged`    | 监听扩展状态变量变化                                                           | `@OnExtendedStateChanged(key = "myVariable")`                                                                                               |
| `@EventHeaders`              | 获取事件头信息                                                                 | `@OnTransition public void method(@EventHeaders Map headers)`                                                                               |
| `@EventHeader`               | 获取特定事件头                                                                 | `@OnTransition public void method(@EventHeader("myHeader") String value)`                                                                   |

### 方法参数注解

| 参数类型                                | 用途                 | 示例                                                            |
| --------------------------------------- | -------------------- | --------------------------------------------------------------- |
| `StateContext<S, E>`                    | 获取完整的状态上下文 | `public void method(StateContext<String, String> context)`      |
| `Message<E>`                            | 获取事件消息         | `public void method(Message<String> message)`                   |
| `ExtendedState`                         | 获取扩展状态         | `public void method(ExtendedState extendedState)`               |
| `StateMachine<S, E>`                    | 获取状态机实例       | `public void method(StateMachine<String, String> stateMachine)` |
| `Map<String, Object>` + `@EventHeaders` | 获取所有事件头       | `public void method(@EventHeaders Map<String, Object> headers)` |
| 特定类型 + `@EventHeader`               | 获取特定事件头       | `public void method(@EventHeader("myHeader") String value)`     |
| `Exception`                             | 获取异常信息         | `public void method(Exception exception)`                       |

### 使用示例

```java
@Component
@WithStateMachine
public class ExampleListener {

    // 状态转换监听
    @OnTransition(source = "S1", target = "S2")
    public void onTransition(
        @EventHeaders Map<String, Object> headers,
        StateContext<String, String> context) {
        // 处理转换逻辑
    }

    // 状态进入监听
    @OnStateEntry(source = "S2")
    public void onStateEntry(ExtendedState extendedState) {
        // 处理状态进入逻辑
    }

    // 扩展状态变化监听
    @OnExtendedStateChanged(key = "counter")
    public void onCounterChange() {
        // 处理计数器变化
    }

    // 状态机错误监听
    @OnStateMachineError
    public void onError(Exception exception) {
        // 处理错误情况
    }
}
```

### 启用配置

```java
@Configuration
@EnableStateMachine
@EnableWithStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {
    // 状态机配置
}
```

此参考表格提供了 Spring Statemachine 中所有核心注解的快速查阅信息，帮助开发者更高效地使用状态机功能。
