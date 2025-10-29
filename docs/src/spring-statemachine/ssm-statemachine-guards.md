# Spring Statemachine Guards 守卫及配置详解与最佳实践

## 1. 概述

在状态机中，Guard（守卫）是一种条件判断机制，用于控制状态转换是否能够执行。Spring Statemachine 提供了强大而灵活的 Guard 机制，允许开发者在状态转换时添加业务逻辑条件判断。

### 1.1 什么是 Guard？

Guard 是一个函数式接口，用于决定某个状态转换是否应该被执行。它基于当前状态机的状态、事件和扩展状态变量来做出决策，返回 `boolean` 值：

- `true`：允许状态转换
- `false`：阻止状态转换

### 1.2 Guard 的作用

1. **条件性转换**：根据业务条件决定是否执行状态转换
2. **业务验证**：验证当前上下文是否满足业务规则
3. **权限控制**：基于用户权限或其他安全因素控制状态流转
4. **数据验证**：检查扩展状态变量或事件载荷的有效性

## 2. Guard 的基本配置

### 2.1 实现 Guard 接口

最基本的方式是实现 `Guard` 接口：

```java
public class MyGuard implements Guard<String, String> {
    @Override
    public boolean evaluate(StateContext<String, String> context) {
        // 业务逻辑判断
        return someCondition;
    }
}
```

### 2.2 在配置中注册 Guard

在状态机配置中注册并使用 Guard：

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("S1")
                .target("S2")
                .event("E1")
                .guard(myGuard()) // 注册Guard
            .and()
            .withExternal()
                .source("S2")
                .target("S3")
                .event("E2")
                .guardExpression("extendedState.variables.get('myVar') == 'someValue'");
    }

    @Bean
    public Guard<String, String> myGuard() {
        return new MyGuard();
    }
}
```

### 2.3 使用 Lambda 表达式

对于简单的 Guard 逻辑，可以使用 Lambda 表达式：

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("S1")
                .target("S2")
                .event("E1")
                .guard(context -> {
                    // 简单的Guard逻辑
                    String value = (String) context.getExtendedState()
                        .getVariables().get("myVar");
                    return "expectedValue".equals(value);
                });
    }
}
```

## 3. 高级 Guard 配置

### 3.1 使用 SpEL 表达式

Spring Statemachine 支持使用 Spring Expression Language (SpEL) 来定义 Guard 条件：

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("S1")
                .target("S2")
                .event("E1")
                .guardExpression("extendedState.variables.get('approvalStatus') == 'APPROVED'")
            .and()
            .withExternal()
                .source("S2")
                .target("S3")
                .event("E2")
                .guardExpression("T(java.time.LocalTime).now().isAfter(T(java.time.LocalTime).of(9, 0))");
    }
}
```

#### 3.1.1 SpEL 表达式中可用的上下文对象

在 SpEL 表达式中，可以直接访问以下对象：

| 对象            | 描述       | 示例                                 |
| --------------- | ---------- | ------------------------------------ |
| `state`         | 当前状态   | `state.id == 'S1'`                   |
| `event`         | 当前事件   | `event.id == 'E1'`                   |
| `extendedState` | 扩展状态   | `extendedState.variables.get('key')` |
| `stateMachine`  | 状态机实例 | `stateMachine.getState().getId()`    |
| `message`       | 事件消息   | `message.headers.get('headerKey')`   |

### 3.2 基于注解的 Guard 配置

使用 `@WithStateMachine` 注解可以更声明式地配置 Guard：

```java
@WithStateMachine
public class OrderGuards {

    @OnTransition
    public boolean validateOrder(@EventHeaders Map<String, Object> headers,
                               ExtendedState extendedState) {
        // Guard逻辑
        return headers.containsKey("userId") &&
               extendedState.get("orderTotal", BigDecimal.class).compareTo(BigDecimal.ZERO) > 0;
    }
}
```

## 4. Guard 的最佳实践

### 4.1 保持 Guard 简洁单一

Guard 应该专注于单一责任原则，每个 Guard 只检查一个特定的条件：

```java
// 好的实践：每个Guard只负责一个验证
public class PaymentApprovedGuard implements Guard<String, String> {
    @Override
    public boolean evaluate(StateContext<String, String> context) {
        return "APPROVED".equals(context.getExtendedState()
            .getVariables().get("paymentStatus"));
    }
}

public class InventoryAvailableGuard implements Guard<String, String> {
    @Override
    public boolean evaluate(StateContext<String, String> context) {
        Integer availableStock = context.getExtendedState()
            .getVariables().get("availableStock", Integer.class);
        Integer requestedQuantity = context.getExtendedState()
            .getVariables().get("requestedQuantity", Integer.class);
        return availableStock != null && requestedQuantity != null &&
               availableStock >= requestedQuantity;
    }
}
```

### 4.2 使用组合 Guard

对于复杂的条件判断，可以使用多个 Guard 组合：

```java
public class CompositeGuard implements Guard<String, String> {

    private final List<Guard<String, String>> guards;

    public CompositeGuard(List<Guard<String, String>> guards) {
        this.guards = guards;
    }

    @Override
    public boolean evaluate(StateContext<String, String> context) {
        return guards.stream().allMatch(guard -> guard.evaluate(context));
    }
}

// 配置组合Guard
@Bean
public Guard<String, String> orderValidationGuard() {
    return new CompositeGuard(Arrays.asList(
        paymentApprovedGuard(),
        inventoryAvailableGuard(),
        customerEligibilityGuard()
    ));
}
```

### 4.3 Guard 与业务服务集成

Guard 可以与 Spring Bean 集成，调用业务服务：

```java
@Component
public class BusinessRuleGuard implements Guard<String, String> {

    private final ValidationService validationService;
    private final SecurityService securityService;

    public BusinessRuleGuard(ValidationService validationService,
                            SecurityService securityService) {
        this.validationService = validationService;
        this.securityService = securityService;
    }

    @Override
    public boolean evaluate(StateContext<String, String> context) {
        String orderId = (String) context.getExtendedState()
            .getVariables().get("orderId");
        String userId = (String) context.getMessageHeaders().get("userId");

        return validationService.isOrderValid(orderId) &&
               securityService.hasPermission(userId, "APPROVE_ORDER");
    }
}
```

### 4.4 异常处理

Guard 应该妥善处理异常，避免因异常导致状态机不可用：

```java
public class SafeGuard implements Guard<String, String> {

    private final Guard<String, String> delegate;

    public SafeGuard(Guard<String, String> delegate) {
        this.delegate = delegate;
    }

    @Override
    public boolean evaluate(StateContext<String, String> context) {
        try {
            return delegate.evaluate(context);
        } catch (Exception e) {
            // 记录日志但不要抛出异常
            context.getStateMachine().getExtendedState()
                .getVariables().put("guardError", e.getMessage());
            return false;
        }
    }
}
```

## 5. 测试 Guard

### 5.1 单元测试

对 Guard 进行单元测试：

```java
public class PaymentApprovedGuardTest {

    @Test
    public void testGuardWithApprovedPayment() {
        // 准备
        PaymentApprovedGuard guard = new PaymentApprovedGuard();
        StateContext<String, String> context = mock(StateContext.class);
        ExtendedState extendedState = mock(ExtendedState.class);

        when(context.getExtendedState()).thenReturn(extendedState);
        when(extendedState.getVariables()).thenReturn(
            Collections.singletonMap("paymentStatus", "APPROVED"));

        // 执行和验证
        assertTrue(guard.evaluate(context));
    }

    @Test
    public void testGuardWithRejectedPayment() {
        // 准备
        PaymentApprovedGuard guard = new PaymentApprovedGuard();
        StateContext<String, String> context = mock(StateContext.class);
        ExtendedState extendedState = mock(ExtendedState.class);

        when(context.getExtendedState()).thenReturn(extendedState);
        when(extendedState.getVariables()).thenReturn(
            Collections.singletonMap("paymentStatus", "REJECTED"));

        // 执行和验证
        assertFalse(guard.evaluate(context));
    }
}
```

### 5.2 集成测试

测试 Guard 在状态机中的实际行为：

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class OrderStateMachineIntegrationTest {

    @Autowired
    private StateMachineFactory<String, String> stateMachineFactory;

    @Test
    public void testOrderApprovalFlowWithGuard() {
        StateMachine<String, String> stateMachine = stateMachineFactory.getStateMachine();
        stateMachine.start();

        // 设置扩展状态变量
        stateMachine.getExtendedState().getVariables().put("paymentStatus", "PENDING");
        stateMachine.getExtendedState().getVariables().put("orderTotal", new BigDecimal("100.00"));

        // 尝试转换 - 应该被Guard阻止
        stateMachine.sendEvent("APPROVE_ORDER");
        assertEquals("SUBMITTED", stateMachine.getState().getId());

        // 更新状态以满足Guard条件
        stateMachine.getExtendedState().getVariables().put("paymentStatus", "APPROVED");

        // 再次尝试转换 - 应该成功
        stateMachine.sendEvent("APPROVE_ORDER");
        assertEquals("APPROVED", stateMachine.getState().getId());
    }
}
```

## 6. 性能考虑

### 6.1 Guard 的性能影响

Guard 在状态转换路径上执行，频繁调用的 Guard 应该优化性能：

```java
public class HighPerformanceGuard implements Guard<String, String> {

    private final Cache<String, Boolean> validationCache;

    public HighPerformanceGuard() {
        this.validationCache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .build();
    }

    @Override
    public boolean evaluate(StateContext<String, String> context) {
        String orderId = (String) context.getExtendedState()
            .getVariables().get("orderId");

        return validationCache.get(orderId, id -> {
            // 昂贵的验证逻辑
            return performExpensiveValidation(id);
        });
    }

    private boolean performExpensiveValidation(String orderId) {
        // 模拟昂贵的操作
        try {
            Thread.sleep(10); // 模拟I/O操作
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return orderId != null && orderId.startsWith("VALID");
    }
}
```

### 6.2 避免阻塞操作

避免在 Guard 中执行阻塞操作，或者使用异步处理：

```java
public class AsyncAwareGuard implements Guard<String, String> {

    private final ValidationService validationService;
    private final Executor asyncExecutor;

    public AsyncAwareGuard(ValidationService validationService, Executor asyncExecutor) {
        this.validationService = validationService;
        this.asyncExecutor = asyncExecutor;
    }

    @Override
    public boolean evaluate(StateContext<String, String> context) {
        // 对于可能阻塞的操作，检查是否已经在异步上下文中
        if (isAsyncContext(context)) {
            return performValidation(context);
        } else {
            // 同步执行
            return performValidation(context);
        }
    }

    private boolean isAsyncContext(StateContext<String, String> context) {
        return Boolean.TRUE.equals(context.getMessageHeaders()
            .get("asyncContext", Boolean.class));
    }

    private boolean performValidation(StateContext<String, String> context) {
        // 实际的验证逻辑
        String data = (String) context.getExtendedState()
            .getVariables().get("validationData");
        return validationService.validate(data);
    }
}
```

## 7. 常见问题与解决方案

### 7.1 Guard 不生效的可能原因

1. **配置错误**：检查 Guard 是否正确注册到转换上
2. **条件逻辑错误**：验证 Guard 逻辑是否正确
3. **状态机未启动**：确保状态机已启动
4. **扩展状态变量未设置**：确保所需的变量已正确设置

### 7.2 调试 Guard

添加日志和调试信息：

```java
public class DebuggableGuard implements Guard<String, String> {

    private final Guard<String, String> delegate;
    private final Logger logger = LoggerFactory.getLogger(DebuggableGuard.class);

    public DebuggableGuard(Guard<String, String> delegate) {
        this.delegate = delegate;
    }

    @Override
    public boolean evaluate(StateContext<String, String> context) {
        boolean result = delegate.evaluate(context);

        if (logger.isDebugEnabled()) {
            logger.debug("Guard evaluation: source={}, target={}, event={}, result={}",
                context.getSource() != null ? context.getSource().getId() : "null",
                context.getTarget() != null ? context.getTarget().getId() : "null",
                context.getEvent() != null ? context.getEvent() : "null",
                result);

            // 记录扩展状态
            context.getExtendedState().getVariables().forEach((key, value) -> {
                logger.debug("Extended state: {} = {}", key, value);
            });
        }

        return result;
    }
}
```

## 8. 完整示例

下面是一个完整的订单处理状态机示例，展示了多种 Guard 的使用方式：

```java
// 状态定义
public enum OrderStates {
    SUBMITTED, VALIDATED, PAYMENT_PENDING, PAYMENT_APPROVED,
    PAYMENT_REJECTED, FULFILLED, CANCELLED
}

// 事件定义
public enum OrderEvents {
    VALIDATE, APPROVE_PAYMENT, REJECT_PAYMENT, FULFILL, CANCEL
}

// 主配置类
@Configuration
@EnableStateMachine
public class OrderStateMachineConfig extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states) throws Exception {
        states
            .withStates()
                .initial(OrderStates.SUBMITTED)
                .states(EnumSet.allOf(OrderStates.class))
                .end(OrderStates.FULFILLED)
                .end(OrderStates.CANCELLED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions) throws Exception {
        transitions
            .withExternal()
                .source(OrderStates.SUBMITTED)
                .target(OrderStates.VALIDATED)
                .event(OrderEvents.VALIDATE)
                .guard(orderValidationGuard())
            .and()
            .withExternal()
                .source(OrderStates.VALIDATED)
                .target(OrderStates.PAYMENT_PENDING)
                .event(OrderEvents.APPROVE_PAYMENT)
                .guardExpression("extendedState.variables.get('amount') != null")
            .and()
            .withExternal()
                .source(OrderStates.PAYMENT_PENDING)
                .target(OrderStates.PAYMENT_APPROVED)
                .event(OrderEvents.APPROVE_PAYMENT)
                .guard(paymentApprovedGuard())
            .and()
            .withExternal()
                .source(OrderStates.PAYMENT_PENDING)
                .target(OrderStates.PAYMENT_REJECTED)
                .event(OrderEvents.REJECT_PAYMENT)
            .and()
            .withExternal()
                .source(OrderStates.PAYMENT_APPROVED)
                .target(OrderStates.FULFILLED)
                .event(OrderEvents.FULFILL)
                .guard(inventoryAvailableGuard())
            .and()
            .withExternal()
                .source(OrderStates.PAYMENT_REJECTED)
                .target(OrderStates.CANCELLED)
                .event(OrderEvents.CANCEL);
    }

    @Bean
    public Guard<OrderStates, OrderEvents> orderValidationGuard() {
        return context -> {
            BigDecimal amount = context.getExtendedState()
                .get("amount", BigDecimal.class);
            String customerId = context.getExtendedState()
                .get("customerId", String.class);

            return amount != null && amount.compareTo(BigDecimal.ZERO) > 0 &&
                   customerId != null && !customerId.trim().isEmpty();
        };
    }

    @Bean
    public Guard<OrderStates, OrderEvents> paymentApprovedGuard() {
        return context -> {
            String paymentStatus = context.getExtendedState()
                .get("paymentStatus", String.class);
            return "APPROVED".equals(paymentStatus);
        };
    }

    @Bean
    public Guard<OrderStates, OrderEvents> inventoryAvailableGuard() {
        return context -> {
            String productId = context.getExtendedState()
                .get("productId", String.class);
            Integer quantity = context.getExtendedState()
                .get("quantity", Integer.class);

            // 这里应该是调用库存服务的逻辑
            // 简化示例中我们假设总是有库存
            return productId != null && quantity != null && quantity > 0;
        };
    }
}

// 使用示例
@Service
public class OrderService {

    private final StateMachineFactory<OrderStates, OrderEvents> factory;

    public OrderService(StateMachineFactory<OrderStates, OrderEvents> factory) {
        this.factory = factory;
    }

    public void processOrder(Order order) {
        StateMachine<OrderStates, OrderEvents> stateMachine = factory.getStateMachine();
        stateMachine.start();

        // 设置订单数据到扩展状态
        stateMachine.getExtendedState().getVariables().put("orderId", order.getId());
        stateMachine.getExtendedState().getVariables().put("amount", order.getAmount());
        stateMachine.getExtendedState().getVariables().put("customerId", order.getCustomerId());
        stateMachine.getExtendedState().getVariables().put("productId", order.getProductId());
        stateMachine.getExtendedState().getVariables().put("quantity", order.getQuantity());

        try {
            // 执行状态转换
            if (!stateMachine.sendEvent(OrderEvents.VALIDATE)) {
                throw new IllegalStateException("订单验证失败");
            }

            // 设置支付状态并尝试批准
            stateMachine.getExtendedState().getVariables().put("paymentStatus", "APPROVED");
            if (!stateMachine.sendEvent(OrderEvents.APPROVE_PAYMENT)) {
                throw new IllegalStateException("支付批准失败");
            }

            // 完成订单
            if (!stateMachine.sendEvent(OrderEvents.FULFILL)) {
                throw new IllegalStateException("订单履行失败");
            }

        } finally {
            stateMachine.stop();
        }
    }
}
```

## 总结

Spring Statemachine 的 Guard 机制提供了强大而灵活的方式来控制状态转换的业务逻辑。通过合理使用 Guard，您可以：

1. **实现复杂的业务规则验证**
2. **保持状态机的清晰和可维护性**
3. **提高代码的可测试性**
4. **实现细粒度的权限控制**

遵循本文中的最佳实践，您可以构建出健壮、可维护且高效的状态机实现。记住保持 Guard 的简洁性、单一职责，并充分考虑性能和异常处理，这将帮助您创建出高质量的状态机应用。
