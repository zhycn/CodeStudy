# Spring Statemachine 与 Spring Boot 集成详解与最佳实践

## 1. 前言

Spring Statemachine 是一个强大的框架，用于在 Spring 应用程序中创建和使用状态机。其核心概念源于有限状态机（Finite State Machine），能够帮助开发者将复杂的业务状态流转可视化、规范化和易管理化。与 Spring Boot 集成后，可以极大地简化状态机的配置和部署过程，让开发者更专注于业务逻辑而非基础设施的搭建。

本文档将详细讲解如何将 Spring Statemachine 无缝集成到 Spring Boot 项目中，并提供配置指南、核心概念说明、最佳实践以及可运行的代码示例。

## 2. 核心概念简介

在深入集成之前，先快速回顾一下 Spring Statemachine 的几个核心概念：

- **状态 (State)**： 系统可能处于的某种状况或条件，例如订单的 `UNPAID`（未支付）、`PAID`（已支付）状态。
- **事件 (Event)**： 触发状态转换的操作或信号，例如 `PAY`（支付）、`CANCEL`（取消）事件。
- **转换 (Transition)**： 定义因某个事件而从源状态切换到目标状态的规则。
- **守卫 (Guard)**： 在执行转换前进行的条件检查，只有条件为 `true` 时转换才会发生。
- **动作 (Action)**： 在转换过程中或进入/退出状态时执行的具体业务逻辑。

## 3. 项目设置与依赖管理

### 3.1 使用 Spring Initializr

最快捷的方式是通过 <https://start.spring.io/> 创建项目，并选择所需的依赖。除了基础的 `Spring Web`（如果需要 Web 功能），核心是 `Spring Statemachine` 依赖。

### 3.2 手动添加 Maven 依赖

在你的 `pom.xml` 文件中，添加 Spring Statemachine Starter 依赖和 BOM（Bill of Materials）以进行依赖管理。

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.statemachine</groupId>
            <artifactId>spring-statemachine-bom</artifactId>
            <version>4.0.0</version> <!-- 请检查并使用最新版本 -->
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>org.springframework.statemachine</groupId>
        <artifactId>spring-statemachine-starter</artifactId>
    </dependency>
    <!-- 其他依赖，如 Spring Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

**注意**： 请务必访问 <https://central.sonatype.com/artifact/org.springframework.statemachine/spring-statemachine-starter> 以获取最新的稳定版本号，替换上述的 `4.0.0`。

### 3.3 使用 Gradle 依赖

在你的 `build.gradle` 文件中，添加以下配置：

```gradle
dependencyManagement {
    imports {
        mavenBom "org.springframework.statemachine:spring-statemachine-bom:4.0.0"
    }
}

dependencies {
    implementation 'org.springframework.statemachine:spring-statemachine-starter'
    implementation 'org.springframework.boot:spring-boot-starter-web'
}
```

## 4. 基础配置与快速入门

### 4.1 定义状态和事件枚举

清晰的定义是构建状态机的第一步。我们通常使用枚举（Enum）来表示状态和事件。

```java
public enum OrderStates {
    INITIAL,        // 初始状态
    UNPAID,         // 待支付
    WAITING_FOR_RECEIVE, // 待收货
    DONE,           // 已完成
    CANCELED        // 已取消
}

public enum OrderEvents {
    CREATE,         // 创建订单
    PAY,            // 支付
    RECEIVE,        // 收货
    CANCEL          // 取消
}
```

### 4.2 创建状态机配置类

创建一个配置类，继承 `EnumStateMachineConfigurerAdapter` 并重写配置方法。使用 `@EnableStateMachine` 注解启用状态机。

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.config.EnableStateMachine;
import org.springframework.statemachine.config.EnumStateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineConfigurationConfigurer;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;
import org.springframework.statemachine.listener.StateMachineListener;
import org.springframework.statemachine.listener.StateMachineListenerAdapter;
import org.springframework.statemachine.state.State;

import java.util.EnumSet;

@Configuration
@EnableStateMachine // 启用状态机
public class StateMachineConfig extends EnumStateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states) throws Exception {
        states
            .withStates()
            .initial(OrderStates.INITIAL)      // 定义初始状态
            .states(EnumSet.allOf(OrderStates.class)); // 定义所有状态
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions) throws Exception {
        transitions
            .withExternal()
                .source(OrderStates.INITIAL)
                .target(OrderStates.UNPAID)
                .event(OrderEvents.CREATE)
                .and()
            .withExternal()
                .source(OrderStates.UNPAID)
                .target(OrderStates.WAITING_FOR_RECEIVE)
                .event(OrderEvents.PAY)
                .and()
            .withExternal()
                .source(OrderStates.WAITING_FOR_RECEIVE)
                .target(OrderStates.DONE)
                .event(OrderEvents.RECEIVE)
                .and()
            .withExternal()
                .source(OrderStates.UNPAID)
                .target(OrderStates.CANCELED)
                .event(OrderEvents.CANCEL);
                // 可以继续添加其他转换规则
    }

    @Bean
    public StateMachineListener<OrderStates, OrderEvents> listener() {
        // 监听状态机事件，非常有用于调试和日志记录
        return new StateMachineListenerAdapter<OrderStates, OrderEvents>() {
            @Override
            public void stateChanged(State<OrderStates, OrderEvents> from, State<OrderStates, OrderEvents> to) {
                if (from != null) {
                    System.out.println("State changed from " + from.getId() + " to " + to.getId());
                } else {
                    System.out.println("State initialized to " + to.getId());
                }
            }
        };
    }

    @Override
    public void configure(StateMachineConfigurationConfigurer<OrderStates, OrderEvents> config) throws Exception {
        config
            .withConfiguration()
            .autoStartup(true) // 自动启动状态机
            .listener(listener()); // 注册监听器
    }
}
```

### 4.3 在服务中注入并使用状态机

现在，你可以在任何 Spring 管理的 Bean（如 `@Service`）中注入 `StateMachine` 并使用它。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.statemachine.StateMachine;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    @Autowired
    private StateMachine<OrderStates, OrderEvents> stateMachine;

    public String createOrder() {
        // 发送 CREATE 事件
        stateMachine.sendEvent(OrderEvents.CREATE);
        return "Order created. Current state: " + stateMachine.getState().getId();
    }

    public String payOrder() {
        // 发送 PAY 事件
        stateMachine.sendEvent(OrderEvents.PAY);
        return "Payment processed. Current state: " + stateMachine.getState().getId();
    }

    // 发送带消息头的事件示例
    public String payOrderWithPayload(String orderId) {
        Message<OrderEvents> message = MessageBuilder
                .withPayload(OrderEvents.PAY)
                .setHeader("orderId", orderId)
                .build();
        stateMachine.sendEvent(message);
        return "Payment processed for order: " + orderId;
    }
}
```

### 4.4 创建控制器进行测试

创建一个简单的 REST 控制器来触发状态变化。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/create")
    public String create() {
        return orderService.createOrder();
    }

    @PostMapping("/pay")
    public String pay() {
        return orderService.payOrder();
    }

    @PostMapping("/pay/{orderId}")
    public String payWithId(@PathVariable String orderId) {
        return orderService.payOrderWithPayload(orderId);
    }
}
```

启动 Spring Boot 应用后，访问 `http://localhost:8080/order/create`，你将看到状态机初始化并转换到 `UNPAID` 状态。随后访问 `/order/pay`，状态将转换为 `WAITING_FOR_RECEIVE`。控制台也会输出相应的状态转换日志。

## 5. 高级特性与最佳实践

### 5.1 使用守卫 (Guard)

守卫允许你在状态转换发生前进行条件判断。例如，只有在订单金额大于 0 时才允许支付。

**1. 创建守卫类：**

```java
import org.springframework.statemachine.StateContext;
import org.springframework.statemachine.guard.Guard;
import org.springframework.stereotype.Component;

@Component
public class AmountGuard implements Guard<OrderStates, OrderEvents> {

    @Override
    public boolean evaluate(StateContext<OrderStates, OrderEvents> context) {
        // 从消息头或扩展状态变量中获取业务数据
        // 这里只是一个简单示例
        Double amount = (Double) context.getMessageHeader("amount");
        return amount != null && amount > 0;
    }
}
```

**2. 在配置中应用守卫：**

```java
@Autowired
private AmountGuard amountGuard;

@Override
public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions) throws Exception {
    transitions
        .withExternal()
            .source(OrderStates.UNPAID)
            .target(OrderStates.WAITING_FOR_RECEIVE)
            .event(OrderEvents.PAY)
            .guard(amountGuard) // 添加守卫
            .and()
        // ... 其他转换
}
```

### 5.2 使用动作 (Action)

动作是状态转换过程中执行的业务逻辑。

**1. 创建动作类：**

```java
import org.springframework.statemachine.StateContext;
import org.springframework.statemachine.action.Action;
import org.springframework.stereotype.Component;

@Component
public class ProcessPaymentAction implements Action<OrderStates, OrderEvents> {

    @Override
    public void execute(StateContext<OrderStates, OrderEvents> context) {
        String orderId = (String) context.getMessageHeader("orderId");
        Double amount = (Double) context.getMessageHeader("amount");
        System.out.println("Processing payment for order: " + orderId + ", amount: " + amount);
        // 这里调用支付服务等业务逻辑
    }
}
```

**2. 在配置中应用动作：**
你可以将动作添加到转换 (`transitions`) 或状态的入口/出口 (`states`)。

```java
@Autowired
private ProcessPaymentAction processPaymentAction;

@Override
public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions) throws Exception {
    transitions
        .withExternal()
            .source(OrderStates.UNPAID)
            .target(OrderStates.WAITING_FOR_RECEIVE)
            .event(OrderEvents.PAY)
            .guard(amountGuard)
            .action(processPaymentAction) // 添加动作
            .and()
        // ... 其他转换
}
```

### 5.3 持久化状态机 (Persistence)

在分布式环境或需要重启应用时，持久化状态机的状态至关重要。Spring Statemachine 提供了 `StateMachinePersister` 接口。

**1. 使用内存中的 Map 实现简单持久化示例：**

```java
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.persist.StateMachinePersister;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;

@Component
public class InMemoryPersister {

    private final Map<String, StateMachine<OrderStates, OrderEvents>> storage = new HashMap<>();

    public void persist(StateMachine<OrderStates, OrderEvents> stateMachine, String orderId) {
        storage.put(orderId, stateMachine);
    }

    public StateMachine<OrderStates, OrderEvents> restore(String orderId) {
        return storage.get(orderId);
    }
}
```

**2. 在 Service 中使用持久化：**
在实际项目中，你应该使用数据库（如 JPA、Redis）来实现 `StateMachinePersister`。

```java
@Service
public class PersistentOrderService {

    @Autowired
    private StateMachine<OrderStates, OrderEvents> stateMachine;

    @Autowired
    private InMemoryPersister inMemoryPersister; // 替换为真正的 Persister

    public void handleOrderEvent(String orderId, OrderEvents event) {
        // 1. 从存储中恢复特定订单的状态机
        StateMachine<OrderStates, OrderEvents> orderStateMachine = inMemoryPersister.restore(orderId);
        if (orderStateMachine == null) {
            // 如果没有，可能是新订单，使用新的状态机
            orderStateMachine = stateMachine;
        }

        // 2. 发送事件
        orderStateMachine.sendEvent(event);

        // 3. 持久化更新后的状态
        inMemoryPersister.persist(orderStateMachine, orderId);
    }
}
```

**最佳实践**： 对于生产环境，强烈建议使用 `RepositoryStateMachinePersist` 与 Spring Data（JPA、MongoDB、Redis）集成，实现真正可靠的持久化。

### 5.4 使用 `@WithStateMachine` 进行注解驱动监听

这是一种更优雅的方式来监听状态机的事件，而不必直接实现 `StateMachineListener`。

```java
import org.springframework.statemachine.annotation.OnStateChanged;
import org.springframework.statemachine.annotation.OnTransition;
import org.springframework.statemachine.annotation.WithStateMachine;

@WithStateMachine(name = "orderStateMachine") // name 与配置中的 Bean 名匹配（如果需要）
public class OrderStateListener {

    @OnTransition(source = "UNPAID", target = "WAITING_FOR_RECEIVE")
    public void onPaid() {
        System.out.println("订单支付成功，等待收货.");
        // 发送通知等逻辑
    }

    @OnStateChanged(source = "UNPAID")
    public void onUnpaidStateChange() {
        System.out.println("订单处于未支付状态发生了变化");
    }
}
```

确保你的配置类中启用了监听器支持（默认通常是启用的）。

## 6. 常见问题与解决方案 (FAQ)

**Q： 状态机不响应事件？**

**A：** 检查事件是否与当前状态的某条转换规则匹配。使用监听器打印当前状态，进行调试。

**Q： 如何为不同的订单创建独立的状态机实例？**

**A：** 使用 `StateMachineFactory` 而不是直接注入 `StateMachine`。在配置类上使用 `@EnableStateMachineFactory`，然后通过工厂的 `getStateMachine(String machineId)` 方法为每个订单 ID 创建唯一的状态机实例。结合上一节的持久化，即可管理成千上万个状态机。

**Q： 如何测试状态机？**

**A：** Spring Statemachine 提供了 `StateMachineTestPlanBuilder` 用于编写单元测试，可以方便地模拟事件并断言最终状态。

## 7. 总结

通过本文档，你学会了如何：

1. 在 Spring Boot 项目中引入和配置 Spring Statemachine。
2. 定义状态、事件和转换规则。
3. 注入并使用状态机发送事件。
4. 使用守卫和动作实现复杂的业务逻辑。
5. 理解状态机持久化的概念和重要性。
6. 使用注解优雅地监听状态变化。

Spring Statemachine 通过将状态和转换规则外部化、可视化，极大地提高了复杂状态流程代码的可读性、可维护性和可测试性。将其与 Spring Boot 的自动化配置和快速开发特性相结合，是处理有状态业务流程的理想选择。

**最佳实践清单**：

- **明确定义枚举**： 使用 `Enum` 清晰定义状态和事件。
- **善用监听器**： 始终配置监听器用于日志记录和调试。
- **考虑持久化**： 在生产环境中，第一时间规划状态机的持久化方案。
- **工厂模式**： 需要管理多个状态机实例时，使用 `StateMachineFactory`。
- **单元测试**： 为复杂的状态流转编写单元测试，保证逻辑正确性。
