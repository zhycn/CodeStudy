# Spring Modulith

- Spring Modulith 官方文档：<https://spring.io/projects/spring-modulith>
- Spring Modulith GitHub：<https://github.com/spring-projects/spring-modulith>
- Spring Modulith API 文档：<https://docs.spring.io/spring-modulith/docs/current/api/>

# Spring Modulith 详解与最佳实践

## 1 模块化单体架构概述

### 1.1 什么是模块化单体架构

模块化单体架构是一种将代码按照模块概念进行结构化的架构风格，它保留了单体应用的部署简单性，同时通过严格的模块边界和明确的接口定义，实现了内部组件的高内聚低耦合。与传统的按技术分层（controller/service/repository）的单体应用不同，模块化单体按照业务领域进行模块划分，每个模块包含完整的技术栈实现。

这种架构风格处于传统单体与微服务之间的中间道路：与传统单体的区别在于明确的模块边界，与微服务的区别在于这些模块运行在同一个进程中。VMware 的 Spring Staff 工程师 Oliver Drotbohm 指出："我们希望用户能够感受到同等水准的支持，与他们决定采用何种架构无关"，这正是 Spring Modulith 的设计哲学。

### 1.2 模块化单体的优势与适用场景

模块化单体架构具有以下几大优势：

- **部署运维简单**：只需要打包部署一个应用，避免了微服务的复杂部署流程
- **开发调试高效**：本地开发无需启动多个服务，调试更加方便
- **成本效益高**：不需要完整的微服务基础设施（服务注册发现、API网关等）
- **架构演进灵活**：为未来可能的微服务拆分做好了准备

尤其适合以下场景：

- 中小型团队和技术力量相对薄弱的组织
- 业务模型尚未稳定，需要频繁调整的早期项目
- 不需要极端扩展性的应用系统
- 希望享受模块化好处但暂时不想承担微服务复杂性的项目

### 1.3 Spring Modulith 简介

Spring Modulith 是 Spring 生态系统中的一个实验性项目，它提供了一套完整的工具和方法论来帮助开发者构建结构良好、领域一致的 Spring Boot 应用程序。它通过包结构约定定义模块边界，并提供验证机制确保架构规则不被破坏。

Spring Modulith 的**核心价值**在于：

- **结构化演进**：防止架构随时间退化
- **渐进式拆分**：为未来可能的微服务迁移做好准备
- **开发效率**：保持单体的开发调试便利性
- **运维简单**：减少分布式系统的复杂性

## 2 环境准备与项目设置

### 2.1 环境要求

要使用 Spring Modulith，需要确保开发环境满足以下要求：

- Java 17 或更高版本
- Spring Boot 3.0 或更高版本
- Spring Framework 6 或更高版本
- Jakarta EE 9+

随着各种新框架（包括 Spring AI 项目）都要求 Java 17，Java 17 已经变得越来越流行。

### 2.2 Maven 依赖配置

在 `pom.xml` 中首先需要导入 Spring Modulith 的 BOM（Bill of Materials）：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.experimental</groupId>
            <artifactId>spring-modulith-bom</artifactId>
            <version>1.1.0</version>
            <scope>import</scope>
            <type>pom</type>
        </dependency>
    </dependencies>
</dependencyManagement>
```

然后添加核心依赖：

```xml
<dependency>
    <groupId>org.springframework.experimental</groupId>
    <artifactId>spring-modulith-api</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.experimental</groupId>
    <artifactId>spring-modulith-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

对于需要使用事件外部化等高级功能的项目，还需添加相应的 starter：

```xml
<dependency>
    <groupId>org.springframework.experimental</groupId>
    <artifactId>spring-modulith-starter-jpa</artifactId>
</dependency>
```

### 2.3 项目结构规划

一个典型的 Spring Modulith 项目结构如下：

```java
src/main/java/com/example/shop/
├── Application.java                 # Spring Boot 主类
├── order/                           # 订单模块
│   ├── Order.java                   # 订单实体
│   ├── OrderService.java            # 订单服务
│   ├── api/                         # 模块对外 API
│   │   ├── OrderExternalAPI.java
│   │   └── package-info.java        # @NamedInterface("order-api")
│   └── internal/                    # 模块内部实现
│       └── OrderHelper.java
└── inventory/                       # 库存模块
    ├── Inventory.java               # 库存实体
    ├── InventoryService.java
    ├── api/                         # 对外 API
    │   └── package-info.java        # @NamedInterface("inventory-api")
    └── internal/                    # 内部实现
        └── StockCalculator.java
```

## 3 核心概念与模块定义

### 3.1 模块识别规则

Spring Modulith 使用简单的包结构约定来识别模块。与 Spring Boot 主类（`@SpringBootApplication`）所在包的直接子包会被自动识别为模块。

例如，如果主类位于 `com.example.shop.Application`，那么：

- `com.example.shop.order` 会被识别为订单模块
- `com.example.shop.inventory` 会被识别为库存模块

这种设计选择降低了采用门槛，避免了 JPMS（Java Platform Module System）的技术开销。

### 3.2 模块封装与访问控制

Spring Modulith 通过包结构实现模块封装：

- **默认规则**：模块根目录下的类/接口可以被其他模块访问，而子包中的内容被视为模块私有
- **internal 包**：其他模块不应直接访问 internal 包中的内容，IDE 会提示违规
- **精细化控制**：使用 `@NamedInterface` 注解明确哪些子包是对外开放的

示例配置：

```java
// com/example/demo/order/api/package-info.java
@NamedInterface("Order API")
package com.example.demo.order.api;

import org.springframework.modulith.NamedInterface;
```

### 3.3 模块声明

可以在 `package-info.java` 中使用 `@ApplicationModule` 注解明确声明模块：

```java
@ApplicationModule(displayName = "Order Module")
package com.example.demo.order;

import org.springframework.modulith.ApplicationModule;
```

## 4 模块间通信机制

### 4.1 同步调用

模块间可以进行直接的同步调用，但必须严格遵守访问规则：只能调用其他模块 API 包（有 `@NamedInterface` 注解）下的类/接口。

**合法调用示例**：

```java
// order.api - 订单模块的公共 API
public interface OrderService {
    OrderDetails getOrder(String id);
}

// inventory.application - 库存模块的应用服务
@RequiredArgsConstructor
public class InventoryService {
    private final OrderService orderService; // 合法调用
    
    public void checkInventory(String orderId) {
        OrderDetails order = orderService.getOrder(orderId);
        // 库存检查逻辑
    }
}
```

### 4.2 事件驱动通信（推荐）

Spring Modulith 强烈推荐使用 Spring 应用事件作为模块间的主要交互方式，这种方式具有更好的解耦性。

#### 4.2.1 事件发布

```java
// OrderService.java - 订单模块
@Service
public class OrderService {
    private final ApplicationEventPublisher events;
    
    public OrderService(ApplicationEventPublisher events) {
        this.events = events;
    }
    
    @Transactional
    public void createOrder(Order order) {
        // 保存订单逻辑...
        events.publishEvent(new OrderCreatedEvent(order.getId()));
    }
}

// OrderCreatedEvent.java - 事件定义
public record OrderCreatedEvent(String orderId) {
}
```

#### 4.2.2 事件监听

```java
// InventoryService.java - 库存模块
@Service
public class InventoryService {
    @TransactionalEventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        // 减少库存逻辑...
        System.out.println("扣减库存 for order " + event.orderId());
    }
}
```

#### 4.2.3 异步事件处理

对于异步事件处理，需要添加 `@Async` 注解并在主类上启用异步支持：

```java
// 主应用类
@EnableAsync
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

// 异步事件监听器
@Service
public class NotificationService {
    @Async
    @ApplicationModuleListener
    public void notificationEvent(OrderCreatedEvent event) {
        // 异步处理逻辑
    }
}
```

### 4.3 事务性事件发布

Spring Modulith 扩展了 Spring 的事件机制，提供了事务性事件发布支持，确保事件在数据库事务提交后才真正发布：

```java
@Transactional
public void completeOrder(Order order) {
    order.complete();
    orderRepository.save(order);
    // 事件将在事务提交后发布
    eventPublisher.publishEvent(new OrderCompleted(order.getId()));
}
```

## 5 模块验证与测试

### 5.1 模块结构验证

Spring Modulith 提供了强大的模块结构验证机制，确保架构规则不被破坏。

基础验证测试：

```java
class ModuleStructureTests {
    @Test
    void verifyModuleStructure() {
        ApplicationModules.of(Application.class).verify();
    }
}
```

这个测试会检查：

- 模块间的依赖关系是否符合预期
- 是否有模块违规访问其他模块的内部实现
- 包结构是否符合约定

如果某个模块尝试访问另一个模块的 `internal` 包中的类，这个测试将会失败。

### 5.2 模块隔离测试

Spring Modulith 支持模块级别的隔离测试，可以单独测试特定模块而不加载整个应用上下文：

```java
@ApplicationModuleTest(value = "order")
class OrderModuleTest {
    @Test
    void shouldCreateOrder(Scenario scenario) {
        Order order = new Order("test-order");
        
        scenario.stimulate(() -> orderService.createOrder(order))
            .andWaitForEventOfType(OrderCreatedEvent.class)
            .toArise();
    }
}
```

### 5.3 事件测试

可以专门测试事件的发布和处理行为：

```java
@Test
void shouldPublishOrderEvent(PublishedEvents events) {
    Order order = orderService.create(new Order("test"));
    
    var orderEvents = events.ofType(OrderCreated.class)
        .matching(e -> e.orderId().equals(order.getId()));
    
    assertThat(orderEvents).hasSize(1);
}
```

## 6 高级特性与生产实践

### 6.1 事件外部化与发件箱模式

对于需要将内部事件发布到外部系统（如 Kafka）的场景，Spring Modulith 提供了简洁的解决方案。

#### 6.1.1 事件外部化配置

```java
// 使用 @Externalized 注解标记要外部化的事件
@Externalized("orders::#{#this.orderId}")
public class OrderCompleted {
    private final UUID orderId;
    // ...
}

// 配置外部化目标
spring.modulith.events.externalization.enabled=true
spring.modulith.events.externalization.target=KAFKA
```

#### 6.1.2 发件箱模式实现

Spring Modulith 提供了内置的发件箱模式支持，解决了经典的"双写问题"：

```java
// 传统双写问题示例 - 不推荐
// 方案1：先发事件后保存 - 事件可能先于数据持久化
sendEventToKafka(); // 如果此后失败，事件无法撤回
startTransaction();
saveOrderInDB();
commitTransaction();

// 方案2：先保存后发事件 - 系统可用性依赖Kafka
startTransaction();
saveOrderInDB();
sendEventToKafka(); // 如果Kafka宕机，整个操作失败
commitTransaction();

// Spring Modulith的解决方案 - 推荐
startTransaction();
saveOrderInDB();
saveEventToOutbox(); // 同一事务写入数据库
commitTransaction();
// 后台线程异步从outbox表读取并发布事件
```

Spring Modulith 通过 `spring-modulith-starter-jpa` 自动创建和管理 `EVENT_PUBLICATION` 表，处理事件的持久化和重试。

### 6.2 文档生成与可视化

Spring Modulith 可以自动从代码生成模块结构文档和图表：

```java
@Test
void generateDocumentation() {
    var modules = ApplicationModules.of(Application.class);
    new Documenter(modules)
        .writeModulesAsPlantUml() // 生成UML组件图
        .writeIndividualModulesAsPlantUml(); // 各模块详细视图
}
```

生成的文档包括：

- 模块依赖关系图
- 各模块内部结构
- 模块间的交互流程

### 6.3 可观测性与监控

Spring Modulith 与 Spring Framework 6 的可观测性支持深度集成：

- **模块API调用追踪**：自动创建 Micrometer span 记录跨模块调用
- **事件处理监控**：跟踪事件从发布到处理的完整链路
- **性能指标**：收集各模块的处理时间和吞吐量指标

这些数据可以集成到 Prometheus、Zipkin 等监控系统中，为性能分析和故障排查提供支持。

### 6.4 配置管理策略

在模块化应用中，配置管理需要特别考虑：

**模块专属配置**：每个模块的配置放在模块内的 `config` 包中。
**跨模块共享配置**：创建专门的 `shared-config` 模块，使用 `@EnableConfigurationProperties` 加载公共配置。

示例配置结构：

```java
// 模块专属配置
@Configuration
@EnableConfigurationProperties(OrderProperties.class)
public class OrderConfig {
}

// 共享配置
@Configuration
public class SharedConfig {
    @Bean
    public CommonService commonService() {
        return new CommonService();
    }
}
```

## 7 从传统单体到模块化单体的迁移策略

### 7.1 渐进式迁移步骤

将现有单体应用迁移到模块化结构是一个渐进过程：

1. **识别领域边界**：通过领域分析确定潜在模块
2. **逐步重构**：每次选择一个领域转换为模块
3. **引入事件**：将直接调用替换为事件驱动交互
4. **验证结构**：添加模块验证测试防止退化

### 7.2 重构示例

假设原有分层结构：

```java
com.example
├── controller
├── service
└── repository
```

可逐步重构为模块化结构：

```java
com.example
├── order          # 订单模块
│   ├── OrderController
│   ├── OrderService
│   └── OrderRepository
└── inventory     # 库存模块
    ├── InventoryController
    ├── InventoryService
    └── InventoryRepository
```

### 7.3 从模块化单体到微服务的演进

Spring Modulith 的一个关键优势是为未来可能的微服务拆分做好了准备：

1. **模块即服务候选**：每个模块天然对应一个潜在微服务
2. **已有明确接口**：模块边界和交互方式已经清晰定义
3. **渐进式拆分**：可以逐个模块独立部署

演进示例：

```java
// 第一步：将模块事件适配为分布式事件
@Service
public class CustomerService {
    private final ApplicationEventPublisher eventPublisher;
    private final MessageBrokerClient messageBroker; // 新增消息代理客户端
    
    public void registerCustomer(Customer customer) {
        // 业务逻辑...
        
        // 发布应用内事件
        CustomerRegisteredEvent event = new CustomerRegisteredEvent(customer.getId());
        eventPublisher.publishEvent(event);
        
        // 同时发布到消息代理，为微服务迁移做准备
        messageBroker.publish("customer-events", event);
    }
}

// 第二步：将模块API转换为HTTP/REST接口
@RestController
@RequestMapping("/api/customers")
public class CustomerApiController {
    private final CustomerService customerService;
    
    @PostMapping
    public CustomerDto registerCustomer(@RequestBody CustomerRegistrationRequest request) {
        Customer customer = customerService.registerCustomer(request.toCustomer());
        return CustomerDto.fromCustomer(customer);
    }
}
```

## 8 最佳实践与常见陷阱

### 8.1 成功实施的关键实践

基于实际项目经验，以下是 Spring Modulith 成功实施的关键实践：

1. **从领域出发**：模块划分应基于业务能力而非技术考虑
2. **小步前进**：开始时模块可以较大，随着理解深入逐步细化
3. **严格验证**：将模块验证作为 CI/CD 流水线的必备步骤
4. **文档即代码**：将架构文档生成纳入构建过程
5. **监控先行**：在生产环境部署前建立完善的监控

### 8.2 常见陷阱与解决方案

#### 8.2.1 过度模块化

- **现象**：创建过多微小模块，增加管理复杂度
- **解决**：遵循"开始时稍大，必要时拆分"的原则

#### 8.2.2 事件滥用

- **现象**：将所有交互都通过事件进行，导致系统难以理解
- **解决**：同步调用适合模块内或强一致性需求，事件适合跨模块或最终一致场景

#### 8.2.3 忽视测试

- **现象**：缺少模块边界测试，导致架构逐渐退化
- **解决**：将模块验证作为核心测试策略的一部分

#### 8.2.4 配置混乱

- **现象**：配置分散难以管理
- **解决**：遵循推荐的配置组织策略

### 8.3 模块设计原则

在 Spring Modulith 中，模块设计应遵循几个关键原则：

- **高内聚低耦合**：每个模块应封装一组紧密相关的功能，对外提供清晰的API
- **领域驱动**：模块划分应以业务领域而非技术层次为导向
- **单向依赖**：模块依赖应尽可能单向，避免循环依赖
- **显式接口**：模块间的交互应通过明确定义的接口或事件进行

## 9 总结与展望

Spring Modulith 代表了一种平衡的艺术——在单体简单性与微服务灵活性之间，在快速交付与长期维护之间找到黄金中点。正如行业专家所观察到的："我们可以使用大多数微服务扩展工具来扩展我们的单体们...这是一个更简单的过程，因为只有一个移动部分：应用程序"。

随着 Spring Modulith 从实验项目逐步成熟，我们可以预期更多企业将采用这种架构风格。特别是在领域驱动设计日益普及的背景下，Spring Modulith 提供了一条可落地的实践路径。

无论你是刚开始考虑架构选择，还是正在寻找优化现有单体应用的方案，Spring Modulith 都值得深入探索。它不仅是技术工具，更是一种架构哲学——在软件开发的复杂世界中寻找简单性，在快速变化的环境中构建可持续的软件系统。
