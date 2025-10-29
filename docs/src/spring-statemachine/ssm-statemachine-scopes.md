# Spring Statemachine 作用域 (Scopes) 及配置详解与最佳实践

## 1. 前言

在现代复杂的应用程序中，管理状态逻辑是一项核心挑战。Spring Statemachine 是一个强大的框架，它允许开发者使用传统状态机的概念来构建 Spring 应用程序。`作用域 (Scope)` 是 Spring 框架的核心概念之一，它定义了 Bean 的生命周期和可见性。在 Spring Statemachine 的上下文中，正确理解和使用作用域对于构建高效、线程安全且易于管理的状态机至关重要。

本文将深入探讨 Spring Statemachine 4.x 中的作用域机制，涵盖其配置方法、工作原理、最佳实践以及常见问题的解决方案。

## 2. Spring Statemachine 作用域概述

在 Spring Statemachine 中，状态机实例本身可以被定义为不同作用域的 Bean。这决定了状态机实例是如何被创建、共享和销毁的。主要的作用域有两种：

1. **Singleton Scope (默认)**: 整个 Spring 应用上下文中只有一个状态机实例。
2. **Prototype Scope**: 每次请求（注入或从上下文获取）时都会创建一个新的状态机实例。
3. **Web-aware Scopes (如 `request`, `session`)**: 在 Web 环境中，状态机可以与 HTTP 请求或用户会话的生命周期绑定。

**核心概念**: 状态机的配置（状态、转换、监听器等）通常是 `singleton` 的，而状态机*实例*（包含当前状态、扩展变量等运行时数据）可以根据需要设置为不同的作用域。

## 3. 核心作用域类型与配置

### 3.1 Singleton 作用域 (默认)

这是最常用的作用域。整个应用程序中只存在一个状态机实例，所有使用者都共享同一个运行时状态。

**配置示例 (Java Configuration):**

```java
@Configuration
@EnableStateMachine // 默认创建的是 singleton 状态机
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
                .initial("SI")
                .state("S1")
                .state("S2");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("SI").target("S1").event("E1")
                .and()
            .withExternal()
                .source("S1").target("S2").event("E2");
    }

    // 这个 Bean 是 Singleton，但其内部持有的 stateMachine 实例也是 Singleton
    @Bean
    public MyService myService() {
        return new MyService();
    }
}
```

**使用场景:**

- 全局的、共享的应用状态（如系统开关状态、缓存状态）。
- 无状态或线程安全的逻辑处理。
- **注意**: 在多线程环境下操作共享的 Singleton 状态机需要谨慎处理并发事件，通常配合 `StateMachine` 的 `sendEvent(Message<E> event)` 方法，框架内部会处理队列和线程安全。

### 3.2 Prototype 作用域

每次从应用上下文获取时都会创建一个新的状态机实例。每个实例都有自己的状态和历史。

**配置示例:**

```java
@Configuration
public class PrototypeConfig {

    // 关键：使用 @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public StateMachine<String, String> stateMachine(
            StateMachineFactory<String, String> stateMachineFactory) {
        // 从工厂获取，每次都会创建一个新的实例
        return stateMachineFactory.getStateMachine("prototypeMachine");
    }

    // 配置一个 StateMachineFactory
    @Configuration
    @EnableStateMachineFactory(name = "prototypeMachineFactory")
    public static class FactoryConfig extends StateMachineConfigurerAdapter<String, String> {
        @Override
        public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
            states
                .withStates()
                    .initial("SI")
                    .state("S1")
                    .state("S2");
        }
        // ... 配置 transitions
    }
}

@Service
public class OrderService {

    // 注入的是工厂，而不是状态机实例本身
    @Autowired
    private StateMachineFactory<String, String> stateMachineFactory;

    public void processOrder(String orderId) {
        // 为每个订单创建一个独立的状态机实例
        StateMachine<String, String> stateMachine = stateMachineFactory.getStateMachine(orderId);
        stateMachine.start();
        stateMachine.sendEvent("E1");
        // ... 订单处理逻辑
    }
}
```

**使用场景:**

- 处理独立实体的生命周期，例如**订单**、**工单**、**用户会话**（在非 Web 环境中）等。
- 需要并行处理多个独立状态流的场景。
- 避免多线程操作共享状态机实例的复杂性。

### 3.3 Session 作用域 (Web)

在 Web 应用程序中，`session` 作用域将状态机与用户的 HTTP Session 绑定。每个用户会话都有自己独立的状态机实例。

**配置示例 (基于 Spring Boot):**

首先，确保你的 `pom.xml` 或 `build.gradle` 包含了 Web 支持（例如 `spring-boot-starter-web`）。

```java
@Configuration
public class WebStateMachineConfig {

    // 使用 @Scope 注解定义 session 作用域，并指定代理模式
    // proxyMode = ScopedProxyMode.TARGET_CLASS 是必须的，通常用于代理不是接口的 Bean
    @Bean
    @Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public StateMachine<String, String> sessionStateMachine(
            StateMachineFactory<String, String> stateMachineFactory) {
        return stateMachineFactory.getStateMachine("sessionMachine");
    }

    // 配置状态机工厂
    @Configuration
    @EnableStateMachineFactory(name = "sessionMachineFactory")
    public static class FactoryConfig extends StateMachineConfigurerAdapter<String, String> {
        @Override
        public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
            states
                .withStates()
                    .initial("LOGGED_OUT")
                    .state("LOGGED_IN");
        }

        @Override
        public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
            transitions
                .withExternal()
                    .source("LOGGED_OUT").target("LOGGED_IN").event("LOGIN")
                    .and()
                .withExternal()
                    .source("LOGGED_IN").target("LOGGED_OUT").event("LOGOUT");
        }
    }
}

@Controller
public class LoginController {

    // 直接注入 session 作用域的状态机。
    // 由于代理的存在，Spring 会自动为当前会话提供正确的实例。
    @Autowired
    private StateMachine<String, String> sessionStateMachine;

    @PostMapping("/login")
    public String login() {
        sessionStateMachine.sendEvent("LOGIN");
        return "redirect:/dashboard";
    }

    @GetMapping("/status")
    @ResponseBody
    public String status() {
        return "Current state: " + sessionStateMachine.getState().getId();
    }
}
```

**使用场景:**

- 用户登录状态管理。
- 向导式多步表单，每一步的状态需要在整个会话期间保持。
- 每个用户有独立业务流程的 Web 应用。

### 3.4 Request 作用域 (Web)

`request` 作用域的生命周期更短，与单个 HTTP 请求绑定。通常用于基于单个请求的短期状态跟踪，在实际中使用较少，因为状态机的价值在于维护持续的状态。

**配置示例:**

```java
@Configuration
public class WebStateMachineConfig {

    @Bean
    @Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public StateMachine<String, String> requestStateMachine(
            StateMachineFactory<String, String> stateMachineFactory) {
        StateMachine<String, String> stateMachine = stateMachineFactory.getStateMachine();
        // 可能在此处根据请求参数初始化状态机
        return stateMachine;
    }
}
```

## 4. 深入原理：工厂模式与作用域协同

Spring Statemachine 优雅地使用了 **工厂模式** 来解耦状态机的*配置*（Blueprint）和*运行时实例*。

1. **`@EnableStateMachine`**: 创建一个 Singleton 的状态机 Bean。
2. **`@EnableStateMachineFactory`**: 创建一个 `StateMachineFactory` Bean。这个工厂本身是 Singleton 的，但它可以用于生成不同作用域的 StateMachine 实例。
3. **`StateMachineFactory.getStateMachine()`**: 这是获取状态机实例的核心方法。你可以传递一个唯一的机器 ID。工厂会管理这些实例，如果多次使用相同的 ID 调用，**默认行为是返回同一个实例**（类似于一个基于 ID 的 Map 缓存）。要实现真正的 Prototype 行为，应每次使用**新的、唯一的 ID**，或者直接调用 `getStateMachine()`（不传 ID，使用自动生成的 ID）。

**最佳实践**: 对于需要非 Singleton 作用域的场景，**优先使用 `@EnableStateMachineFactory` 配置工厂，然后通过工厂按需获取状态机实例**。这种方式比直接定义 Prototype 的作用域 Bean 更灵活和明确。

```java
@Service
public class MyService {

    @Autowired
    private StateMachineFactory<String, String> factory;

    public void handleEntity(String entityId) {
        // 每个 entityId 获取其对应的状态机实例
        // 如果该 entityId 的状态机不存在，则创建；已存在则返回已有的那一个。
        // 这是一种“单例 per key”的模式，非常适用于管理多个实体的状态。
        StateMachine<String, String> stateMachine = factory.getStateMachine(entityId);

        if (!stateMachine.isRunning()) {
            stateMachine.start();
        }
        stateMachine.sendEvent("PROCESS");
    }
}
```

## 5. 最佳实践与常见问题

### 5.1 最佳实践

1. **明确需求**: 首先确定状态是需要全局共享、按实体隔离还是会话隔离。
2. **首选工厂**: 对于任何非全局 Singleton 的需求，使用 `StateMachineFactory` 来创建和管理实例。
3. **生命周期管理**:
   - 使用 `stateMachine.start()` 启动状态机。
   - 对于长时间存在的状态机（如 Session 或 Entity 关联的），要注意在适当的时候（如会话销毁、实体删除）调用 `stateMachine.stop()` 或 `stateMachine.setStateMachineError(...)` 来清理资源。Spring 会为 Session 和 Request 作用域的 Bean 自动处理销毁，但 Prototype 需要手动管理或通过监听上下文事件来清理。
4. **状态机 ID**: 为通过工厂创建的状态机指定有意义的 ID（如订单号、用户 ID），便于调试和后期持久化。
5. **持久化考虑**: 对于 Prototype 或 Session 作用域的状态机，如果需要持久化其状态到数据库（如 Redis, JPA），Spring Statemachine 提供了 `StateMachinePersister` 等工具，其作用域策略应与状态机实例的作用域相匹配。

### 5.2 常见问题与解决方案

**问题 1: 并发修改异常**

- **现象**: 在多线程环境中操作 Singleton 状态机时出现不可预知的状态转移。
- **解决方案**:
  - **方案 A**: 将状态机改为 Prototype 或 Session 作用域，消除共享。
  - **方案 B**: 确保所有向 Singleton 状态机发送的事件都是通过 `stateMachine.sendEvent(Message<E> event)`。Spring Statemachine 内部有一个同步器，会顺序处理事件，但无法保证外部对扩展状态变量 (Extended State) 的并发修改。对于扩展变量的并发访问，需要使用同步块或其他并发控制机制。

**问题 2: 内存泄漏**

- **现象**: 持续创建 Prototype 状态机或使用工厂创建大量唯一 ID 的状态机，导致内存不断增长。
- **解决方案**:
  - 实现一个清理策略。例如，监听实体删除事件，然后找到对应的状态机实例并调用 `stop()`，并将其从工厂的缓存中移除（注意：工厂的缓存通常不支持直接移除，你可能需要自定义一个工厂或使用 `StateMachineService` 提供的 `release` 功能）。
  - 考虑使用 `StateMachineService` 接口，它提供了 `acquireStateMachine` 和 `releaseStateMachine` 方法，更适合管理状态机实例的生命周期。

**问题 3: 在 Singleton Bean 中注入 Session/Request 作用域的状态机失败**

- **现象**: 启动报错，提示找不到作用域代理。
- **解决方案**: 确保在注入点使用了正确的代理模式 (`ScopedProxyMode.TARGET_CLASS`)，并且注入了状态机实例而非工厂。Spring 的代理会在方法被调用时动态地为当前会话/请求获取正确的实例。

```java
// 正确：在 Singleton 的 Controller 中注入 Session 作用域的代理
@Controller
public class MyController {
    @Autowired // 注入的是代理，而不是真实实例
    private StateMachine<String, String> sessionStateMachine;
}

// 配置：定义 Bean 时指定代理
@Bean
@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public StateMachine<String, String> sessionStateMachine(...) { ... }
```

## 6. 总结

Spring Statemachine 的作用域机制通过与 Spring 容器无缝集成，提供了极大的灵活性来管理状态机的生命周期。

| 作用域类型    | 配置方式                                           | 适用场景                 | 注意事项                         |
| :------------ | :------------------------------------------------- | :----------------------- | :------------------------------- |
| **Singleton** | `@EnableStateMachine` (默认)                       | 全局状态，无状态处理     | 注意线程安全，特别是扩展状态变量 |
| **Prototype** | `@EnableStateMachineFactory` + `getStateMachine()` | 订单、工单等独立实体     | 需要关注生命周期管理和内存泄漏   |
| **Session**   | `@Scope(SCOPE_SESSION)` + Proxy                    | Web 用户会话状态         | 与 HTTP Session 生命周期一致     |
| **Request**   | `@Scope(SCOPE_REQUEST)` + Proxy                    | 短期请求处理（较少使用） | 生命周期极短                     |

**核心建议**: 熟练掌握 `StateMachineFactory` 的使用，它是构建复杂、多实例状态机应用的基石。根据你的业务实体生命周期，选择最匹配的作用域策略，才能构建出既高效又稳定的状态驱动型应用程序。
