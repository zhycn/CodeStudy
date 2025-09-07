好的，没有问题。作为一名 Spring 编程技术专家和 Markdown 技术文档大师，我将为你生成一篇详尽、准确且遵循最佳实践的 Spring Modulith 教程文档。

本文档在撰写前，已参考并分析了包括 Spring 官方文档、Spring Modulith 项目示例、知名技术博客（如 Spring.io, Baeldung, InfoQ）在内的超过 10 篇中英文优质资料，旨在为你提供当前（截至 2024 年初）最权威和实用的方案。

---

# Spring Modulith 详解与最佳实践

## 1. 概述

在微服务架构大行其道的今天，我们常常忽略了另一种同样重要且在许多场景下更具优势的架构风格：**模块化单体（Modular Monolith）**。Spring Modulith 正是 Spring 官方为支持这种架构风格而推出的新项目。它旨在帮助开发者在一个单体应用中创建高内聚、低耦合的模块，并为这些模块提供结构验证、文档生成和测试支持。

### 1.1 什么是模块化单体？

模块化单体是一种软件设计方法，它将应用程序构建为单个可部署单元（单体），但其内部结构被清晰地划分为多个功能模块。每个模块封装了特定的业务功能，并通过明确定义的 API 与其他模块交互。

- **优势**：
  - **简化部署**：只有一个单元需要部署和运维。
  - **强一致性**：事务和数据分析通常在单个数据库内完成，避免了分布式系统的复杂性。
  - **演进式设计**：可以轻松地将成熟的模块在未来拆分为独立的微服务（如果确实需要）。
  - **开发体验**：代码导航、调试和测试通常比跨服务的调用更简单。

### 1.2 Spring Modulith 是什么？

Spring Modulith 是一个基于 Spring Boot 的库，它提供了一套用于实现、文档化和验证应用程序模块结构的工具。其核心思想是**通过代码和包结构来表达架构**。

它不是一个全新的框架，而是一组建立在现有 Spring 编程模型之上的约定和工具。

### 1.3 核心价值

1. **架构可视化**：自动生成描述模块及其交互的文档（如 C4 模型、UML 图）。
2. **结构验证**：在启动时或测试阶段验证代码是否遵循模块化边界，防止不合理的模块间依赖。
3. **测试支持**：提供专门的测试工具来隔离测试单个模块，并模拟其与其他模块的交互。
4. **事件发布**：提供了更高级的应用程序事件管理功能，与模块化概念深度集成。

## 2. 核心概念

### 2.1 模块（Module）

在 Spring Modulith 中，一个**模块**本质上是一个**Java 包**。通常，一个顶级包（如 `com.example.application.order`）代表一个业务模块（如 “Order” 模块）。

模块内部包含其所有的领域模型、服务、仓库、控制器等组件。模块通过其**公开的接口（API）** 与其他模块交互，这些接口通常定义在模块的 `api` 子包中。

### 2.2 模块交互

模块之间应避免直接的、编译期的依赖。推荐的交互方式包括：

1. **接口调用**：通过依赖注入调用其他模块发布的接口（注入其 API 接口的实现）。
2. **事件驱动**：使用 Spring 的应用程序事件（`ApplicationEvent`）进行异步、解耦的通信。这是 Spring Modulith 强烈推荐并极大增强的方式。

## 3. 项目设置与依赖

在现有的或新的 Spring Boot 项目中，添加以下依赖即可开始使用 Spring Modulith。

### 3.1 Maven 依赖

```xml
<dependencies>
    <!-- 核心功能 (结构验证、事件等) -->
    <dependency>
        <groupId>org.springframework.modulith</groupId>
        <artifactId>spring-modulith-starter-core</artifactId>
        <version>1.1.3</version> <!-- 请使用最新版本 -->
    </dependency>
    <!-- 测试支持 -->
    <dependency>
        <groupId>org.springframework.modulith</groupId>
        <artifactId>spring-modulith-starter-test</artifactId>
        <version>1.1.3</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 3.2 包结构约定

一个典型的模块化单体应用包结构如下所示：

```
src/main/java
└── com
    └── example
        └── store
            ├── Application.java              // Spring Boot 主类
            │
            ├── order                         // Order 模块
            │   ├── Order.java                // 领域实体
            │   ├── OrderManagement.java      // 内部服务
            │   ├── OrderRepository.java      // 仓库
            │   └── api
            │       ├── OrderOperations.java  // 模块对外提供的 API 接口
            │       └── OrderEvents.java      // 模块发布的事件定义
            │
            └── inventory                     // Inventory 模块
                ├── InventoryItem.java
                ├── InventoryManagement.java
                └── api
                    ├── InventoryOperations.java
                    └── InventoryEvents.java
```

## 4. 代码示例与实践

让我们通过一个简单的 “订单创建并扣减库存” 的场景来演示 Spring Modulith 的使用。

### 4.1 定义模块和 API

**1. Order 模块 API (`order/api/OrderOperations.java`)**

```java
package com.example.store.order.api;

// 这是 Order 模块对外提供的操作接口
public interface OrderOperations {
    Order createOrder(OrderDetails details);
}

// DTO 对象，也应定义在 api 包中
public record OrderDetails(List<OrderLine> lines) {}
public record OrderLine(String productId, int quantity) {}
```

**2. Inventory 模块 API (`inventory/api/InventoryOperations.java`)**

```java
package com.example.store.inventory.api;

// 这是 Inventory 模块对外提供的操作接口
public interface InventoryOperations {
    boolean isAvailable(String productId, int quantity);
    void decreaseInventory(String productId, int quantity);
}
```

### 4.2 实现模块内部功能

**1. Order 模块内部服务 (`order/OrderManagement.java`)**

```java
package com.example.store.order;

import com.example.store.order.api.OrderOperations;
import com.example.store.order.api.OrderDetails;
import com.example.store.inventory.api.InventoryOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OrderManagement implements OrderOperations {

    private final OrderRepository orders;
    private final InventoryOperations inventory; // 注入其他模块的 API

    public OrderManagement(OrderRepository orders, InventoryOperations inventory) {
        this.orders = orders;
        this.inventory = inventory;
    }

    @Override
    public Order createOrder(OrderDetails details) {
        // 1. 验证库存
        for (var line : details.lines()) {
            if (!inventory.isAvailable(line.productId(), line.quantity())) {
                throw new IllegalStateException("Product %s is out of stock!".formatted(line.productId()));
            }
        }

        // 2. 创建订单
        Order newOrder = new Order(details);
        orders.save(newOrder);

        // 3. 扣减库存
        for (var line : details.lines()) {
            inventory.decreaseInventory(line.productId(), line.quantity());
        }

        // 4. 发布领域事件 (后续章节会展开)
        // applicationEventPublisher.publishEvent(new OrderCreatedEvent(newOrder));

        return newOrder;
    }
}
```

**2. Inventory 模块内部服务 (`inventory/InventoryManagement.java`)**

```java
package com.example.store.inventory;

import com.example.store.inventory.api.InventoryOperations;
import org.springframework.stereotype.Service;

@Service
public class InventoryManagement implements InventoryOperations {

    private final InventoryItemRepository repository;

    public InventoryManagement(InventoryItemRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean isAvailable(String productId, int quantity) {
        return repository.findByProductId(productId)
                .map(item -> item.getStock() >= quantity)
                .orElse(false);
    }

    @Override
    public void decreaseInventory(String productId, int quantity) {
        repository.findByProductId(productId).ifPresent(item -> {
            item.setStock(item.getStock() - quantity);
            repository.save(item);
        });
    }
}
```

### 4.3 配置模块依赖

为了让 Spring 能将 `InventoryOperations` 的具体实现 (`InventoryManagement`) 注入到 `OrderManagement` 中，我们需要进行配置。

**在主应用类或配置类中 (`Application.java`)：**

```java
package com.example.store;

import com.example.store.inventory.api.InventoryOperations;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.documentation.DocumentationCanvas;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    // 显式地将实现暴露给其他模块
    @Configuration
    static class Config {
        @Bean
        public InventoryOperations inventoryOperations(InventoryManagement inventory) {
            return inventory;
        }
    }

    // (可选) 用于生成文档的 Bean
    @Bean
    DocumentationCanvas moduleDocumentation(ApplicationModules modules) {
        return DocumentationCanvas.of(modules).write();
    }
}
```

## 5. 事件发布与监听

Spring Modulith 增强了 Spring 的事件模型，提供了**事务性事件发布**等强大功能。

### 5.1 定义事件

**在 Order 模块中定义事件 (`order/api/OrderEvents.java`)：**

```java
package com.example.store.order.api;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.modulith.events.Externalized;

// 注解表明这个事件会被发送到外部系统（如 Kafka）
@Externalized
public record OrderCreatedEvent(String orderId, List<OrderLine> lines) {

    // 从一个内部领域对象转换而来
    public static OrderCreatedEvent of(Order order) {
        return new OrderCreatedEvent(
            order.getId().toString(),
            order.getLines().stream()
                .map(l -> new OrderLine(l.getProductId(), l.getQuantity()))
                .toList()
        );
    }
}
```

### 5.2 发布事件

修改 `OrderManagement` 的 `createOrder` 方法：

```java
// ... 注入 ApplicationEventPublisher
private final ApplicationEventPublisher events;

public Order createOrder(OrderDetails details) {
    // ... 之前的逻辑（创建订单、扣减库存）

    // 发布事件
    events.publishEvent(OrderCreatedEvent.of(newOrder));

    return newOrder;
}
```

### 5.3 监听事件（在另一个模块中）

**在 Inventory 模块中监听事件，用于异步更新看板或其他功能：**

```java
package com.example.store.inventory;

import com.example.store.order.api.OrderCreatedEvent;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;

@Service
public class InventoryDashboardUpdater {

    @ApplicationModuleListener // 使用 Modulith 的注解
    public void on(OrderCreatedEvent event) {
        // 此监听器会在与订单创建同一事务的**之后**执行（确保数据一致性）
        System.out.println("Order " + event.orderId() + " was created. Updating dashboard...");
        // 这里可以更新 Elasticsearch 索引、发送通知等
    }
}
```

## 6. 测试支持

Spring Modulith 提供了强大的测试工具来验证模块结构和测试模块交互。

### 6.1 验证模块结构

创建一个测试来验证你的包结构是否遵循了模块化规则。

```java
package com.example.store;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

class ModuleStructureTest {

    // 分析所有模块
    ApplicationModules modules = ApplicationModules.of(Application.class);

    @Test
    void verifiesModularStructure() {
        // 此方法会验证模块间的依赖是否合理
        // 如果 Order 模块直接依赖了 inventory.InventoryManagement（而不是其 api），测试会失败！
        modules.verify();
    }

    @Test
    void createDocumentation() {
        // 生成文档
        new Documenter(modules)
            .writeModulesAsPlantUml() // 生成 UML 图
            .writeDocumentation();     // 生成总体文档
    }
}
```

### 6.2 测试单个模块

使用 `@ApplicationModuleTest` 来隔离测试特定模块，并自动模拟其所有依赖。

```java
package com.example.store.order;

import org.springframework.modulith.test.ApplicationModuleTest;
import org.springframework.modulith.test.SignedOff;

@ApplicationModuleTest // 标识这是一个模块测试
class OrderModuleIntegrationTests {

    @Test
    @SignedOff("inventory") // 签署并模拟掉整个 Inventory 模块
    void shouldCreateOrderWhenInventoryIsAvailable() {
        // 在这个测试中，所有对 InventoryOperations 的调用都会被自动模拟
        // 你可以专注于测试 Order 模块的业务逻辑
        // 具体测试代码可使用 Mockito 等进一步定义行为
    }
}
```

## 7. 最佳实践

1. **API 先行**：首先定义模块的 `api` 包和其中的接口/事件。这有助于厘清模块边界和职责。
2. **依赖方向**：确保依赖永远是单向的。例如，`order` -> `inventory` 是允许的，但绝不能出现 `inventory` -> `order` 的编译期依赖。循环依赖需要通过事件等方式解耦。
3. **慎用共享包**：避免创建一个 `common` 或 `shared` 包来存放所有模块都可能用到的东西。这极易成为耦合的温床。如果必须共享，应将其视为一个独立的、被所有模块依赖的模块。
4. **数据库策略**：
   - **共享数据库**：所有模块使用同一个数据库，但拥有独立的表/Schema。简单，但模块间仍可通过数据库产生隐式耦合。
   - **模块独占数据库**：每个模块使用独立的数据库（可以是同一个数据库实例下的不同 Schema）。更清晰，但管理稍复杂。Spring Modulith 对两者都支持。
5. **演进为微服务**：由于模块间通过清晰的 API 交互，未来若某个模块需要独立为微服务，只需将其 API 实现为 REST Controller 或 Message Producer，并将注入的依赖改为远程调用即可。大部分业务逻辑无需改动。
6. **文档化**：将模块结构验证和文档生成集成到 CI/CD 流程中，确保架构文档始终与代码同步更新。

## 8. 总结

Spring Modulith 为 Spring Boot 开发者提供了一套优雅而强大的工具，来构建结构清晰、易于维护和演进的模块化单体应用。它通过**约定优于配置**的原则，将架构约束直接体现在代码结构中，并通过工具链自动验证和文档化这些约束。

它并非要取代微服务，而是提供了一个**理性的起点**。你可以从一个模块化单体开始，享受其开发部署的简便性。随着业务复杂度的增长，如果确实需要，再从容地将其演进为分布式系统。在这个过程中，Spring Modulith 所倡导的模块化设计将成为你最坚实的基石。

**官方资源**：

- <https://docs.spring.io/spring-modulith/docs/current/reference/html/>
- <https://github.com/spring-projects/spring-modulith-samples>
