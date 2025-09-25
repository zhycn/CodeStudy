---
title: Spring Retry 详解与最佳实践
description: 本文详细介绍了 Spring 框架中 Retry 机制的核心概念、工作原理、使用场景以及最佳实践。Retry 机制是 Spring 生态系统中的一员，提供了一种声明式、注解驱动的高效重试解决方案，能让你的代码在应对短暂故障时变得更加健壮和优雅。
author: zhycn
---

# Spring Retry 详解与最佳实践

## 1. 重试机制概述

在现代分布式系统和微服务架构中，服务间的网络调用变得无比频繁。然而，网络是不可靠的，它可能因为瞬时故障（如网络抖动、服务短暂过载、资源临时不可用等）导致调用失败。简单地一失败就放弃，会严重降低系统的健壮性和用户体验，尤其在调用第三方接口时表现最明显。

重试机制成为构建 Resilient（弹性）系统不可或缺的一环。Spring Retry 作为 Spring 生态系统中的一员，提供了一种声明式、注解驱动的高效重试解决方案，能让你的代码在应对短暂故障时变得更加健壮和优雅。

### 1.1 重试机制的应用场景

- **远程服务调用**：当调用第三方 API 或微服务时，网络波动可能导致短暂失败
- **数据库操作**：数据库连接池耗尽或数据库短暂不可用时
- **文件/IO 操作**：文件系统临时不可访问或 IO 异常时
- **消息队列消费**：消息处理过程中遇到暂时性资源不足
- **分布式事务**：在最终一致性场景下需要重试补偿操作

## 2. Spring Retry 核心概念

### 2.1 工作原理

Spring Retry 的核心思想是 AOP（面向切面编程）。它通过代理（Proxy）机制，在目标方法的外部包裹一层重试逻辑。当你调用一个被 `@Retryable` 注解的方法时，实际上是在调用一个由 Spring 生成的代理对象，这个代理对象负责在方法执行失败时，根据你配置的策略进行重试。

其内部工作流程如下：

- **AOP 拦截器**：当一个方法被标记为需要重试，并且该方法抛出了指定类型的异常时，Spring AOP 拦截器会拦截该调用
- **异常捕获**：如果该方法抛出指定类型的异常，AOP 拦截器会检查是否符合重试条件
- **重试策略判断**：根据配置的 RetryPolicy 和 BackOffPolicy，决定是否进行重试以及重试的时间间隔
- **等待**：根据 BackOffPolicy 等待一段时间
- **重试**：再次调用目标方法
- **恢复逻辑**：如果所有重试都失败，则执行 `@Recover` 注解定义的恢复逻辑

### 2.2 核心组件

Spring Retry 的核心组件包括：

- **RetryTemplate**：核心类，封装了重试逻辑
- **RetryPolicy**：定义重试策略（如重试次数、异常类型等）
- **BackOffPolicy**：定义重试间隔策略（如固定间隔、指数退避等）
- **RetryCallback**：定义需要重试的业务逻辑
- **RecoveryCallback**：定义所有重试都失败后的恢复逻辑

## 3. 环境配置与依赖

### 3.1 Maven 依赖配置

在 Spring Boot 项目中，需要添加以下依赖：

```xml
<dependency>
    <groupId>org.springframework.retry</groupId>
    <artifactId>spring-retry</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

对于传统的 Spring 项目，则需要如下依赖：

```xml
<dependency>
    <groupId>org.springframework.retry</groupId>
    <artifactId>spring-retry</artifactId>
    <version>2.0.5</version>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-aop</artifactId>
</dependency>
<dependency>
    <groupId>org.aspectj</groupId>
    <artifactId>aspectjweaver</artifactId>
</dependency>
```

### 3.2 启用重试功能

在项目的配置类或者主启动类上添加 `@EnableRetry` 注解，以启用 Spring Retry 的自动代理功能：

```java
@SpringBootApplication
@EnableRetry
public class RetryApplication {
    public static void main(String[] args) {
        SpringApplication.run(RetryApplication.class, args);
    }
}
```

## 4. 声明式重试（注解方式）

### 4.1 @Retryable 注解详解

`@Retryable` 是最核心的注解，用于标注哪些方法在发生异常时需要重试。

**基本参数说明**：

- `value` / `include`：指定需要重试的异常类型数组。默认为空（重试所有异常）
- `exclude`：指定不需要重试的异常类型
- `maxAttempts`：最大重试次数（包括第一次调用）
- `backoff`：设置重试退避策略，通常与 `@Backoff` 注解联用
- `recover`：指定服务降级的方法

### 4.2 基础使用示例

```java
@Service
public class RetryServiceImpl implements RetryService {

    @Override
    @Retryable(value = RuntimeException.class, maxAttempts = 4,
               backoff = @Backoff(delay = 1000, multiplier = 2.0))
    public String invokeMethod(Integer status) {
        System.out.println("invokeMethod 调用时间：" +
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-dd-MM HH:mm:ss")));

        // 模拟异常
        if (status != null) {
            throw new RuntimeException("服务中断了......");
        }
        return "SUCCESS";
    }
}
```

上述配置表示：

- 只针对 `RuntimeException` 重试
- 最大尝试次数为 4 次（1 次初始调用 + 3 次重试）
- 使用指数退避策略：初始延迟 1 秒，乘数为 2.0，延迟序列为：1s, 2s, 4s...

### 4.3 @Backoff 退避策略

`@Backoff` 注解用于配置重试之间的等待策略：

**主要参数**：

- `delay`：延迟时间（毫秒）
- `maxDelay`：最大延迟时间（毫秒）
- `multiplier`：乘数，用于指数退避
- `random`：是否使用随机延迟

**退避策略类型**：

- **FixedBackOffPolicy**：固定延迟时间
- **ExponentialBackOffPolicy**：指数增长的延迟时间
- **ExponentialRandomBackOffPolicy**：指数随机退避策略
- **UniformRandomBackOffPolicy**：均匀随机策略

### 4.4 @Recover 降级处理

当所有重试都失败后，可以通过 `@Recover` 注解定义降级方法：

```java
@Service
public class RetryServiceImpl implements RetryService {

    @Override
    @Retryable(value = RuntimeException.class, maxAttempts = 3)
    public String processData(String data) {
        // 业务逻辑
        return externalService.call(data);
    }

    @Recover
    public String recoverProcessData(RuntimeException e, String data) {
        // 记录日志、发送告警等
        log.error("处理数据失败，数据: {}", data, e);
        // 返回默认值或执行其他补偿逻辑
        return "DEFAULT_RESULT";
    }
}
```

**@Recover 方法注意事项**：

- 必须与 `@Retryable` 方法在同一个类中
- 方法参数必须包含重试的异常类型，以及原方法的参数
- 返回值类型必须与原方法一致
- 可以通过 `recover` 参数指定特定的恢复方法

## 5. 编程式重试

### 5.1 RetryTemplate 基础使用

除了注解方式，Spring Retry 还提供了编程式的重试方式，通过 `RetryTemplate` 实现：

```java
@Test
void testRetryTemplate() throws Throwable {
    RetryTemplate retryTemplate = RetryTemplate.builder()
        .maxAttempts(4)
        .exponentialBackoff(1000, 2, 10000)
        .retryOn(RuntimeException.class)
        .build();

    String result = retryTemplate.execute(
        (RetryCallback<String, Throwable>) context -> {
            // 业务逻辑
            return externalService.invokeMethod(1);
        },
        context -> {
            // 所有重试失败后的恢复逻辑
            return "服务降级了！";
        });

    System.out.println(result);
}
```

### 5.2 自定义重策策略

通过编程式方式，可以更灵活地配置重试策略：

```java
@Configuration
public class RetryConfig {

    @Bean
    public RetryTemplate retryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();

        // 重试策略
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(4);
        retryTemplate.setRetryPolicy(retryPolicy);

        // 退避策略
        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(2000L);
        backOffPolicy.setMultiplier(2.0);
        backOffPolicy.setMaxInterval(10000L);
        retryTemplate.setBackOffPolicy(backOffPolicy);

        return retryTemplate;
    }
}
```

### 5.3 高级策略配置

对于复杂场景，可以配置更精细的重试策略：

```java
@Bean
public RetryTemplate customRetryTemplate() {
    // 异常分类策略
    ExceptionClassifierRetryPolicy classifier = new ExceptionClassifierRetryPolicy();

    Map<Class<? extends Throwable>, RetryPolicy> policyMap = new HashMap<>();
    policyMap.put(IllegalArgumentException.class, new SimpleRetryPolicy(3));
    policyMap.put(NullPointerException.class, new TimeoutRetryPolicy());

    classifier.setPolicyMap(policyMap);

    RetryTemplate template = new RetryTemplate();
    template.setRetryPolicy(classifier);

    return template;
}
```

## 6. 高级特性与定制化

### 6.1 自定义重试策略

你可以创建自定义的 `RetryPolicy` 以满足特定需求：

```java
public class CustomRetryPolicy implements RetryPolicy {

    private int attempts = 0;
    private final int maxAttempts = 3;

    @Override
    public boolean canRetry(RetryContext context) {
        attempts++;
        return attempts <= maxAttempts;
    }

    @Override
    public void close(RetryContext context) {
        // 清理资源
    }

    @Override
    public void registerThrowable(RetryContext context, Throwable throwable) {
        // 处理抛出的异常
    }
}
```

### 6.2 监听器模式

Spring Retry 提供了监听器接口，允许在重试过程中的关键节点执行自定义逻辑：

```java
public class CustomRetryListener implements RetryListener {

    @Override
    public <T, E extends Throwable> boolean open(RetryContext context,
                                                   RetryCallback<T, E> callback) {
        System.out.println("重试开始");
        return true;
    }

    @Override
    public <T, E extends Throwable> void close(RetryContext context,
                                                RetryCallback<T, E> callback,
                                                Throwable throwable) {
        System.out.println("重试结束");
    }

    @Override
    public <T, E extends Throwable> void onError(RetryContext context,
                                                  RetryCallback<T, E> callback,
                                                  Throwable throwable) {
        System.out.println("第" + context.getRetryCount() + "次重试失败");
    }
}
```

配置监听器：

```java
RetryTemplate template = new RetryTemplate();
template.registerListener(new CustomRetryListener());
```

### 6.3 表达式支持

Spring Retry 支持使用 SpEL 表达式进行动态配置：

```java
@Service
public class ExpressionRetryService {

    @Retryable(
        value = MyException.class,
        maxAttemptsExpression = "#{${retry.max.attempts:3}}",
        backoff = @Backoff(delayExpression = "#{${retry.delay:1000}}",
                          multiplierExpression = "#{${retry.multiplier:2.0}}"))
    public void processWithExpression() {
        // 业务逻辑
    }

    @Retryable(exceptionExpression =
               "#{message.contains('retryable')}")
    public void processWithExceptionExpression() {
        // 只有异常消息包含'retryable'时才重试
    }
}
```

## 7. 最佳实践与注意事项

### 7.1 幂等性设计

**重要原则**：确保重试的操作是幂等的，避免重复执行导致数据不一致。

**实现方案**：

- 使用唯一标识符防止重复处理
- 设计无状态的服务接口
- 使用乐观锁或版本控制机制
- 记录处理状态，避免重复处理

### 7.2 异常处理策略

**合理设置重试异常**：

- 只对暂时性故障（网络超时、资源暂时不可用等）进行重试
- 避免对业务逻辑错误进行重试
- 明确指定需要重试的异常类型

```java
// 好的实践：明确指定重试的异常类型
@Retryable(value = {NetworkException.class, TimeoutException.class},
           maxAttempts = 3)
public void callExternalService() {
    // 业务逻辑
}

// 避免的做法：重试所有异常
@Retryable // 默认重试所有异常，可能重试不应该重试的异常
public void process() {
    // 业务逻辑
}
```

### 7.3 性能优化

**合理配置重试参数**：

- 设置适当的重试次数（通常 3-5 次）
- 使用指数退避策略避免雪崩效应
- 设置最大延迟时间，避免等待时间过长
- 考虑使用随机延迟，避免多个客户端同时重试

```java
@Retryable(value = RuntimeException.class,
           maxAttempts = 4,
           backoff = @Backoff(delay = 1000, multiplier = 2, random = true))
public void optimizedMethod() {
    // 业务逻辑
}
```

### 7.4 事务管理

重试机制与事务管理需要特别注意：

```java
@Service
public class TransactionalRetryService {

    @Transactional
    @Retryable(value = {OptimisticLockingFailureException.class},
               maxAttempts = 3)
    public void updateWithRetry(Entity entity) {
        // 数据库操作，可能抛出乐观锁异常
        entityRepository.save(entity);
    }

    @Recover
    public void recoverUpdate(OptimisticLockingFailureException e, Entity entity) {
        // 处理重试失败的情况
        log.error("更新实体失败，实体ID: {}", entity.getId(), e);
        throw new BusinessException("系统繁忙，请稍后重试");
    }
}
```

### 7.5 日志与监控

**完善的日志记录**：

- 记录重试事件和次数
- 记录最终失败原因
- 使用 MDC（Mapped Diagnostic Context）跟踪重试上下文

```java
@Service
public class LoggingRetryService {

    private static final Logger logger = LoggerFactory.getLogger(LoggingRetryService.class);

    @Retryable(value = RuntimeException.class, maxAttempts = 3)
    public void processWithLogging(String data) {
        try {
            // 业务逻辑
            externalService.call(data);
        } catch (RuntimeException e) {
            logger.warn("处理数据失败，准备重试，数据: {}", data, e);
            throw e;
        }
    }

    @Recover
    public void recoverProcess(RuntimeException e, String data) {
        logger.error("处理数据最终失败，数据: {}", data, e);
        // 发送告警、记录指标等
        metricsService.recordFailure();
    }
}
```

## 8. 常见问题与解决方案

### 8.1 重试不生效的常见原因

1. **未启用重试功能**
   - 确保配置类上有 `@EnableRetry` 注解

2. **AOP 代理问题**
   - 内部方法调用不会触发重试逻辑
   - 解决方案：从外部类调用或使用自注入

```java
@Service
public class SelfInjectionService {

    @Autowired
    private SelfInjectionService self;

    public void outerMethod() {
        // 正确：通过代理对象调用
        self.innerMethod();
    }

    @Retryable(value = RuntimeException.class)
    public void innerMethod() {
        // 业务逻辑
    }
}
```

3. **异常类型不匹配**
   - 确保抛出的异常是 `@Retryable` 中指定的类型

### 8.2 @Recover 方法不执行的原因

1. **方法签名不匹配**
   - `@Recover` 方法参数必须与 `@Retryable` 方法一致
   - 第一个参数必须是异常类型

2. **返回类型不匹配**
   - `@Recover` 方法的返回类型必须与 `@Retryable` 方法一致

3. **未添加 @Recover 注解**

### 8.3 性能瓶颈问题

**高频重试的优化策略**：

- 合理设置重试次数和延迟时间
- 使用断路器模式防止无限重试
- 监控重试频率和成功率

## 9. 实战案例：订单服务重试设计

### 9.1 场景描述

在订单创建流程中，需要调用库存服务进行库存扣减。由于网络波动或服务短暂不可用，需要实现重试机制确保数据一致性。

### 9.2 完整实现

```java
@Service
@Slf4j
public class OrderService {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private OrderRepository orderRepository;

    @Transactional
    @Retryable(value = {ServiceUnavailableException.class, NetworkException.class},
               maxAttempts = 4,
               backoff = @Backoff(delay = 1000, multiplier = 2, maxDelay = 10000))
    public Order createOrder(OrderRequest request) {
        log.info("创建订单，订单号: {}", request.getOrderNumber());

        // 扣减库存
        inventoryService.deductStock(request.getProductId(), request.getQuantity());

        // 创建订单
        Order order = new Order();
        order.setOrderNumber(request.getOrderNumber());
        order.setProductId(request.getProductId());
        order.setQuantity(request.getQuantity());
        order.setStatus(OrderStatus.CREATED);

        Order savedOrder = orderRepository.save(order);
        log.info("订单创建成功，订单ID: {}", savedOrder.getId());

        return savedOrder;
    }

    @Recover
    public Order handleCreateOrderFailure(RuntimeException e, OrderRequest request) {
        log.error("订单创建失败，已达到最大重试次数，订单号: {}", request.getOrderNumber(), e);

        // 创建失败订单记录
        Order failedOrder = new Order();
        failedOrder.setOrderNumber(request.getOrderNumber());
        failedOrder.setProductId(request.getProductId());
        failedOrder.setQuantity(request.getQuantity());
        failedOrder.setStatus(OrderStatus.FAILED);
        failedOrder.setErrorMessage(e.getMessage());

        orderRepository.save(failedOrder);

        // 发送告警通知
        alertService.sendAlert("订单创建失败",
            "订单号: " + request.getOrderNumber() + ", 错误: " + e.getMessage());

        throw new BusinessException("订单创建失败，请稍后重试", e);
    }
}
```

### 9.3 配置类

```java
@Configuration
@EnableRetry
@EnableAspectJAutoProxy
public class RetryConfiguration {

    @Bean
    public RetryTemplate inventoryRetryTemplate() {
        return RetryTemplate.builder()
                .maxAttempts(3)
                .exponentialBackoff(1000, 2, 5000)
                .retryOn(ServiceUnavailableException.class)
                .withListener(new InventoryRetryListener())
                .build();
    }
}

@Component
class InventoryRetryListener implements RetryListener {

    @Override
    public <T, E extends Throwable> boolean open(RetryContext context,
                                                   RetryCallback<T, E> callback) {
        log.info("库存服务调用开始重试");
        return true;
    }

    @Override
    public <T, E extends Throwable> void onError(RetryContext context,
                                                  RetryCallback<T, E> callback,
                                                  Throwable throwable) {
        log.warn("库存服务第{}次调用失败", context.getRetryCount());
    }
}
```

## 10. 总结

Spring Retry 为处理暂时性故障提供了一种优雅的解决方案，通过简单的配置即可为应用程序增加容错能力。合理使用重试机制可以显著提高系统在分布式环境中的稳定性。

### 10.1 选择声明式还是编程式

- **声明式（注解）**：适用于大多数通用场景，配置简单，代码侵入性低
- **编程式（RetryTemplate）**：适用于需要动态控制或复杂重试逻辑的场景

### 10.2 关键注意事项

1. **幂等性设计**是重试机制的前提条件
2. **合理设置重试参数**，避免对下游服务造成压力
3. **完善的日志记录和监控**，便于问题排查和系统优化
4. **与事务管理结合**时要注意事务边界和回滚机制

### 10.3 与其他模式的结合

Spring Retry 可以与其他 resilience 模式结合使用：

- **熔断器模式**：防止连续失败导致系统资源耗尽
- **限流模式**：控制重试频率，保护下游服务
- **降级策略**：重试失败后提供替代方案

通过合理运用 Spring Retry，可以构建更加健壮、可靠的分布式系统，有效应对网络不稳定、服务短暂不可用等常见问题，提升系统的整体容错能力和用户体验。
