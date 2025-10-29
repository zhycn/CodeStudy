# Spring Statemachine 状态机配置详解与最佳实践

## 1. 概述

Spring Statemachine 是一个强大的状态机框架，它帮助开发者将复杂的业务流程转换为清晰的状态转换模型。通过使用状态机，您可以更好地管理应用程序的状态流转，提高代码的可维护性和可测试性。

**状态机核心概念：**

- **状态（State）**：系统在特定时刻的条件或状况
- **事件（Event）**：触发状态转换的动作或信号
- **转换（Transition）**：从一个状态到另一个状态的过程
- **动作（Action）**：在状态转换期间执行的操作
- **守卫（Guard）**：决定转换是否应该发生的条件

## 2. 基础配置

### 2.1 添加依赖

```xml
<dependency>
    <groupId>org.springframework.statemachine</groupId>
    <artifactId>spring-statemachine-starter</artifactId>
    <version>4.0.0</version>
</dependency>
```

### 2.2 定义状态和事件枚举

```java
public enum OrderStates {
    INITIAL,          // 初始状态
    PAYMENT_PENDING,  // 待支付
    PAYED,            // 已支付
    SHIPPED,          // 已发货
    DELIVERED,        // 已送达
    CANCELLED         // 已取消
}

public enum OrderEvents {
    CREATE_ORDER,     // 创建订单
    PAY,              // 支付
    SHIP,             // 发货
    DELIVER,          // 送达
    CANCEL            // 取消订单
}
```

### 2.3 基础状态机配置

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states)
        throws Exception {

        states
            .withStates()
            .initial(OrderStates.INITIAL)
            .states(EnumSet.allOf(OrderStates.class))
            .end(OrderStates.DELIVERED)
            .end(OrderStates.CANCELLED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions)
        throws Exception {

        transitions
            .withExternal()
                .source(OrderStates.INITIAL)
                .target(OrderStates.PAYMENT_PENDING)
                .event(OrderEvents.CREATE_ORDER)
            .and()
            .withExternal()
                .source(OrderStates.PAYMENT_PENDING)
                .target(OrderStates.PAYED)
                .event(OrderEvents.PAY)
            .and()
            .withExternal()
                .source(OrderStates.PAYED)
                .target(OrderStates.SHIPPED)
                .event(OrderEvents.SHIP)
            .and()
            .withExternal()
                .source(OrderStates.SHIPPED)
                .target(OrderStates.DELIVERED)
                .event(OrderEvents.DELIVER)
            .and()
            .withExternal()
                .source(OrderStates.PAYMENT_PENDING)
                .target(OrderStates.CANCELLED)
                .event(OrderEvents.CANCEL)
            .and()
            .withExternal()
                .source(OrderStates.PAYED)
                .target(OrderStates.CANCELLED)
                .event(OrderEvents.CANCEL);
    }
}
```

## 3. 高级配置特性

### 3.1 层次状态配置

```java
@Override
public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states)
    throws Exception {

    states
        .withStates()
        .initial(OrderStates.INITIAL)
        .state(OrderStates.PAYMENT_PENDING)
        .state(OrderStates.PAYED)
        .and()
        .withStates()
            .parent(OrderStates.PAYED)
            .initial(OrderStates.PAYMENT_VERIFYING)
            .state(OrderStates.PAYMENT_VERIFIED)
        .and()
        .state(OrderStates.SHIPPED)
        .state(OrderStates.DELIVERED)
        .state(OrderStates.CANCELLED);
}
```

### 3.2 区域（Region）配置

```java
@Override
public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states)
    throws Exception {

    states
        .withStates()
        .initial(OrderStates.INITIAL)
        .state(OrderStates.PAYMENT_PENDING)
        .and()
        .withStates()
            .parent(OrderStates.PAYMENT_PENDING)
            .region("PAYMENT_REGION")
            .initial(OrderStates.PAYMENT_INITIATED)
            .state(OrderStates.PAYMENT_PROCESSING)
            .state(OrderStates.PAYMENT_COMPLETED)
        .and()
        .withStates()
            .parent(OrderStates.PAYMENT_PENDING)
            .region("VALIDATION_REGION")
            .initial(OrderStates.VALIDATION_PENDING)
            .state(OrderStates.VALIDATION_COMPLETED);
}
```

### 3.3 使用守卫条件

```java
@Bean
public Guard<OrderStates, OrderEvents> paymentValidationGuard() {
    return context -> {
        Order order = context.getExtendedState().get("order", Order.class);
        return order != null && order.getAmount() > 0;
    };
}

@Override
public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions)
    throws Exception {

    transitions
        .withExternal()
            .source(OrderStates.PAYMENT_PENDING)
            .target(OrderStates.PAYED)
            .event(OrderEvents.PAY)
            .guard(paymentValidationGuard());
}
```

### 3.4 配置状态动作

```java
@Bean
public Action<OrderStates, OrderEvents> processPaymentAction() {
    return context -> {
        Order order = context.getExtendedState().get("order", Order.class);
        // 处理支付逻辑
        paymentService.processPayment(order);

        // 记录状态转换
        auditService.logStateChange(
            order.getId(),
            OrderStates.PAYMENT_PENDING,
            OrderStates.PAYED
        );
    };
}

@Override
public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions)
    throws Exception {

    transitions
        .withExternal()
            .source(OrderStates.PAYMENT_PENDING)
            .target(OrderStates.PAYED)
            .event(OrderEvents.PAY)
            .action(processPaymentAction())
            .guard(paymentValidationGuard());
}
```

### 3.5 错误处理配置

```java
@Bean
public Action<OrderStates, OrderEvents> errorAction() {
    return context -> {
        Exception exception = context.getException();
        log.error("状态机执行出错: {}", exception.getMessage());

        // 发送错误通知
        notificationService.sendErrorNotification(
            "状态机错误",
            exception.getMessage()
        );
    };
}

@Override
public void configure(StateMachineConfigurationConfigurer<OrderStates, OrderEvents> config)
    throws Exception {

    config
        .withConfiguration()
        .autoStartup(true)
        .listener(stateMachineListener())
        .and()
        .withPersistence()
            .runtimePersister(stateMachineRuntimePersister())
        .and()
        .withErrors()
            .errorAction(errorAction());
}
```

## 4. 持久化配置

### 4.1 JPA 持久化配置

```java
@Configuration
@EnableJpaRepositories(basePackages = "com.example.statemachine.repository")
public class JpaPersistenceConfig {

    @Bean
    public StateMachineRuntimePersister<OrderStates, OrderEvents, String> stateMachineRuntimePersister(
        JpaStateMachineRepository jpaStateMachineRepository) {
        return new JpaPersistingStateMachineInterceptor<>(jpaStateMachineRepository);
    }

    @Bean
    public StateMachinePersister<OrderStates, OrderEvents, String> stateMachinePersister(
        StateMachineRuntimePersister<OrderStates, OrderEvents, String> persister) {
        return new DefaultStateMachinePersister<>(persister);
    }
}
```

### 4.2 Redis 持久化配置

```java
@Configuration
public class RedisPersistenceConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory("localhost", 6379);
    }

    @Bean
    public StateMachineRuntimePersister<OrderStates, OrderEvents, String> stateMachineRuntimePersister(
        RedisConnectionFactory connectionFactory) {
        RedisStateMachineContextRepository<OrderStates, OrderEvents> repository =
            new RedisStateMachineContextRepository<>(connectionFactory);
        return new RedisPersistingStateMachineInterceptor<>(repository);
    }
}
```

## 5. 监听器配置

### 5.1 状态机监听器

```java
@Slf4j
@Component
public class OrderStateMachineListener implements StateMachineListener<OrderStates, OrderEvents> {

    @Override
    public void stateChanged(State<OrderStates, OrderEvents> from, State<OrderStates, OrderEvents> to) {
        log.info("状态变化: {} -> {}",
            from != null ? from.getId() : "NONE",
            to.getId());
    }

    @Override
    public void stateEntered(State<OrderStates, OrderEvents> state) {
        log.info("进入状态: {}", state.getId());
    }

    @Override
    public void stateExited(State<OrderStates, OrderEvents> state) {
        log.info("退出状态: {}", state.getId());
    }

    @Override
    public void eventNotAccepted(Message<OrderEvents> event) {
        log.warn("事件被拒绝: {}", event.getPayload());
    }

    @Override
    public void transition(Transition<OrderStates, OrderEvents> transition) {
        log.debug("转换开始: {} -> {}",
            transition.getSource().getId(),
            transition.getTarget().getId());
    }

    @Override
    public void transitionStarted(Transition<OrderStates, OrderEvents> transition) {
        // 转换开始处理
    }

    @Override
    public void transitionEnded(Transition<OrderStates, OrderEvents> transition) {
        // 转换结束处理
    }

    @Override
    public void stateMachineStarted(StateMachine<OrderStates, OrderEvents> stateMachine) {
        log.info("状态机启动");
    }

    @Override
    public void stateMachineStopped(StateMachine<OrderStates, OrderEvents> stateMachine) {
        log.info("状态机停止");
    }
}
```

### 5.2 注解式监听器

```java
@WithStateMachine
@Slf4j
public class OrderStateChangeListener {

    @OnTransition
    public void anyTransition() {
        log.debug("状态转换发生");
    }

    @OnTransition(source = "PAYMENT_PENDING", target = "PAYED")
    public void fromPaymentPendingToPayed() {
        log.info("支付完成");
    }

    @OnStateChanged(source = "PAYMENT_PENDING")
    public void onPaymentPending() {
        log.info("进入待支付状态");
    }

    @OnEventNotAccepted
    public void onEventNotAccepted() {
        log.warn("有事件被拒绝处理");
    }
}
```

## 6. 测试配置

### 6.1 状态机测试工具

```java
@SpringBootTest
@EnableStateMachine
public class OrderStateMachineTest {

    @Autowired
    private StateMachine<OrderStates, OrderEvents> stateMachine;

    @Test
    public void testOrderLifecycle() {
        StateMachineTestPlan<OrderStates, OrderEvents> plan =
            StateMachineTestPlanBuilder.<OrderStates, OrderEvents>builder()
                .defaultAwaitTime(2)
                .stateMachine(stateMachine)
                .step()
                    .expectStates(OrderStates.INITIAL)
                .and()
                .step()
                    .sendEvent(OrderEvents.CREATE_ORDER)
                    .expectStateChanged(1)
                    .expectStates(OrderStates.PAYMENT_PENDING)
                .and()
                .step()
                    .sendEvent(OrderEvents.PAY)
                    .expectStateChanged(1)
                    .expectStates(OrderStates.PAYED)
                .and()
                .build();

        plan.test();
    }

    @Test
    public void testOrderCancellation() {
        StateMachineTestPlan<OrderStates, OrderEvents> plan =
            StateMachineTestPlanBuilder.<OrderStates, OrderEvents>builder()
                .stateMachine(stateMachine)
                .step()
                    .sendEvent(OrderEvents.CREATE_ORDER)
                    .expectStates(OrderStates.PAYMENT_PENDING)
                .and()
                .step()
                    .sendEvent(OrderEvents.CANCEL)
                    .expectStateChanged(1)
                    .expectStates(OrderStates.CANCELLED)
                .and()
                .build();

        plan.test();
    }
}
```

## 7. 最佳实践

### 7.1 配置最佳实践

1. **使用枚举定义状态和事件**

   ```java
   // 推荐：使用枚举
   public enum OrderStates { INITIAL, PROCESSING, COMPLETED }

   // 不推荐：使用字符串
   // .state("initial")...
   ```

2. **合理使用层次状态**

   ```java
   // 使用层次状态简化复杂状态逻辑
   .withStates()
       .parent(OrderStates.PROCESSING)
       .initial(OrderStates.VALIDATING)
       .state(OrderStates.PROCESSING_PAYMENT)
       .state(OrderStates.UPDATING_INVENTORY)
   ```

3. **明确配置初始和结束状态**

   ```java
   .withStates()
       .initial(OrderStates.INITIAL)  // 明确初始状态
       .end(OrderStates.COMPLETED)    // 明确结束状态
       .end(OrderStates.CANCELLED)    // 多个结束状态
   ```

### 7.2 性能优化建议

1. **合理使用状态机范围**

   ```java
   // 对于无状态场景，使用单例
   @Scope(scopeName = "singleton")

   // 对于有状态场景，使用会话或请求范围
   @Scope(scopeName = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
   ```

2. **优化持久化策略**

   ```java
   @Override
   public void configure(StateMachineConfigurationConfigurer<OrderStates, OrderEvents> config)
       throws Exception {

       config
           .withPersistence()
               .runtimePersister(stateMachineRuntimePersister())
               .persistOnTransition(true)    // 只在转换时持久化
               .persistActionsOnTransition(true);  // 持久化动作
   }
   ```

### 7.3 安全实践

```java
@Configuration
@EnableStateMachine
public class SecureStateMachineConfig extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<OrderStates, OrderEvents> config)
        throws Exception {

        config
            .withSecurity()
                .enabled(true)
                .transition("hasRole('ADMIN')")  // 转换需要管理员权限
                .event("hasRole('USER')");       // 事件需要用户权限
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions)
        throws Exception {

        transitions
            .withExternal()
                .source(OrderStates.INITIAL)
                .target(OrderStates.PAYMENT_PENDING)
                .event(OrderEvents.CREATE_ORDER)
                .secured("ROLE_CREATE_ORDER", ComparisonType.ANY);
    }
}
```

## 8. 常见问题与解决方案

### 8.1 状态机无法启动

**问题**：状态机配置正确但无法启动。

**解决方案**：

```java
@Bean
public StateMachine<OrderStates, OrderEvents> stateMachine(
    StateMachineFactory<OrderStates, OrderEvents> factory) {

    StateMachine<OrderStates, OrderEvents> stateMachine = factory.getStateMachine();
    stateMachine.start();  // 明确调用start()
    return stateMachine;
}
```

### 8.2 事件不被接受

**问题**：发送的事件没有被状态机处理。

**解决方案**：

```java
// 检查当前状态是否接受该事件
if (stateMachine.sendEvent(OrderEvents.PAY)) {
    log.info("事件被接受");
} else {
    log.warn("事件被拒绝，当前状态: {}", stateMachine.getState().getId());
}
```

### 8.3 持久化数据不一致

**问题**：状态机状态与持久化存储不一致。

**解决方案**：

```java
@Bean
public StateMachinePersister<OrderStates, OrderEvents, String> stateMachinePersister() {
    return new DefaultStateMachinePersister<>(new StateMachinePersist<OrderStates, OrderEvents, String>() {
        @Override
        public void write(StateMachineContext<OrderStates, OrderEvents> context, String contextObj)
            throws Exception {
            // 实现自定义持久化逻辑
            jpaRepository.save(context);
        }

        @Override
        public StateMachineContext<OrderStates, OrderEvents> read(String contextObj)
            throws Exception {
            // 实现自定义读取逻辑
            return jpaRepository.findById(contextObj);
        }
    });
}
```

## 9. 总结

Spring Statemachine 提供了强大而灵活的状态机实现，通过合理的配置和最佳实践，可以构建出健壮、可维护的状态管理系统。关键点包括：

1. **清晰的状态和事件定义**：使用枚举明确状态和事件
2. **合理的层次结构**：利用层次状态简化复杂逻辑
3. **完善的监听机制**：通过监听器实现监控和日志记录
4. **可靠的持久化策略**：确保状态机状态的可靠性
5. **全面的测试覆盖**：使用测试工具验证状态机行为

遵循这些最佳实践，您可以构建出高效、可靠的状态机系统，有效管理复杂的业务流程。
