---
title: Spring Bean 的作用域详解与最佳实践
description: 本文详细介绍了 Spring Bean 的作用域（Scope），包括 singleton、prototype、request、session 和 application 等作用域类型。通过了解这些作用域的生命周期、可见范围和线程安全问题，开发者可以根据应用场景选择合适的作用域，从而优化 Bean 的创建和管理，提高应用的性能和可维护性。
author: zhycn
---

# Spring Bean 的作用域详解与最佳实践

## 1. Bean 作用域核心概念

在 Spring 框架中，Bean 作用域（Scope）定义了 Bean 实例的**生命周期**和**可见范围**，决定了 Spring IoC 容器如何创建、管理和销毁 Bean 实例。作用域是 Spring 框架中控制反转（IoC）的核心概念之一，它直接影响 Bean 的创建频率、使用方式和资源管理。

### 1.1 为什么需要不同的作用域

不同的应用场景对 Bean 的需求各不相同：无状态服务通常只需要单例，有状态组件需要隔离不同用户的访问，Web 应用中需要与请求或会话绑定的组件，以及需要延迟初始化的资源。Spring 提供多种作用域正是为了满足这些不同的需求模式。

## 2. Spring 支持的 Bean 作用域

Spring 框架提供了多种 Bean 作用域，每种都有其特定的生命周期和适用场景。

### 2.1 标准作用域类型

| 作用域类型  | 生命周期                                                     | 适用场景                         | 线程安全           | 配置方式              |
| ----------- | ------------------------------------------------------------ | -------------------------------- | ------------------ | --------------------- |
| singleton   | 容器启动时创建，容器关闭时销毁                               | 无状态服务、工具类、配置类       | 是（无状态）       | 默认，无需显式配置    |
| prototype   | 每次请求时创建新实例，容器不管理销毁                         | 有状态对象、需要独立状态的组件   | 否（每个实例独立） | @Scope("prototype")   |
| request     | 每个 HTTP 请求开始时创建，请求结束时销毁                     | HTTP 请求级别的状态跟踪          | 是（天然隔离）     | @Scope("request")     |
| session     | 每个 HTTP 会话开始时创建，会话结束时销毁                     | 用户会话级别的状态存储           | 是（会话隔离）     | @Scope("session")     |
| application | 在整个 ServletContext 生命周期内创建一个实例，应用关闭时销毁 | 应用级别的全局数据，如配置、缓存 | 是（应用级共享）   | @Scope("application") |
| websocket   | 每个 WebSocket 会话开始时创建，会话结束时销毁                | WebSocket 连接级别的状态管理     | 是（连接隔离）     | @Scope("websocket")   |

## 3. 标准作用域详解

### 3.1 Singleton（单例）作用域

**定义与特性**：Singleton 是 Spring 的**默认作用域**，每个 Spring IoC 容器中一个 Bean 定义对应一个实例。容器初始化时创建实例（默认行为，可通过 lazy-init 改变），所有对该 Bean 的请求都返回同一个实例，生命周期与容器相同。

**实现原理**：Spring 内部使用 `ConcurrentHashMap` 来缓存单例 Bean，确保线程安全地获取单例实例。核心实现位于 `DefaultSingletonBeanRegistry` 类中，该类负责管理单例 Bean 的存储与获取。

```java
@Service // 默认就是 singleton
public class UserService {
    // 无状态服务方法
    public User findUserById(Long id) {
        // 业务逻辑
    }
}
```

**线程安全考虑**：若 Bean 无状态（如 Service 类），单例是线程安全的；若需维护状态，需使用同步机制（如 ThreadLocal）。

```java
@Service
public class CounterService {
    // 共享可变状态（风险）
    private int count = 0;

    // 加锁保证原子性
    public synchronized int increment() {
        return ++count;
    }

    // 推荐方案：使用线程安全的 AtomicInteger
    private AtomicInteger atomicCount = new AtomicInteger(0);
    public int safeIncrement() {
        return atomicCount.incrementAndGet();
    }
}
```

### 3.2 Prototype（原型）作用域

**定义与特性**：Prototype 作用域的 Bean **每次请求时都会创建新实例**。Spring 不管理 prototype Bean 的完整生命周期，初始化回调会执行，但销毁回调不会自动执行。

**实现原理**：Spring 不缓存 prototype Bean，每次请求都调用 Bean 定义创建新实例。核心实现位于 `PrototypeScope` 类中：

```java
public class PrototypeScope implements Scope {
    @Override
    public Object get(String name, ObjectFactory<?> objectFactory) {
        // 每次调用都创建新实例
        return objectFactory.getObject();
    }
    // 其他方法实现...
}
```

**代码示例**：

```java
@Scope("prototype")
@Component
public class ShoppingCart {
    private List<Item> items = new ArrayList<>();

    public void addItem(Item item) {
        items.add(item);
    }
    // 每个用户有自己的购物车实例
}
```

**生命周期管理**：原型作用域的 Bean 由 Spring 负责创建，但不负责管理其生命周期（例如不会自动销毁）。需要手动管理 Bean 的销毁，比如使用 `@PreDestroy` 方法不会被 Spring 调用。

## 4. Web 应用特有作用域

### 4.1 Request 作用域

**定义与特性**：Request 作用域的 Bean 在**每个 HTTP 请求**中创建，每个请求有自己的 Bean 实例，请求结束时实例被销毁。

**实现原理**：Spring 通过请求拦截器和 `ThreadLocal` 实现请求级别的隔离。基于 `RequestContextHolder` 绑定当前请求，实例存储在 `ThreadLocal` 中，请求结束后销毁。

**代码示例**：

```java
@Scope(value = WebApplicationContext.SCOPE_REQUEST,
       proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
public class RequestContext {
    private String requestId;
    private Long userId;

    // 存储请求相关信息
    public String getRequestId() {
        return requestId;
    }
}
```

### 4.2 Session 作用域

**定义与特性**：Session 作用域的 Bean 在**每个 HTTP Session** 中创建，每个会话有自己的 Bean 实例，会话结束时实例被销毁。

**实现原理**：Spring 将会话作用域 Bean 存储在 `HttpSession` 中。实例存储在 `HttpSession` 中，会话过期或失效时销毁。

**代码示例**：

```java
@Scope(value = WebApplicationContext.SCOPE_SESSION,
       proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
public class UserSession {
    private Long userId;
    private String username;
    private ShoppingCart cart;

    // 用户会话数据
    public boolean isLoggedIn() {
        return userId != null;
    }
}
```

### 4.3 Application 作用域

**定义与特性**：Application 作用域的 Bean 在 **ServletContext 生命周期**内存在，类似于单例但范围是 ServletContext。多个 Spring 应用上下文共享（如果它们在同一 ServletContext 中），应用关闭时销毁。

**与 Singleton 的区别**：Singleton 是 Spring 容器级别的单例，Application 是 Servlet 上下文级别的单例（一个 Web 应用可能有多个 Spring 容器）。

**代码示例**：

```java
@Scope(WebApplicationContext.SCOPE_APPLICATION)
@Component
public class ApplicationConfig {
    private Map<String, Object> cache = new ConcurrentHashMap<>();

    // 应用级别的缓存
    public void putToCache(String key, Object value) {
        cache.put(key, value);
    }
}
```

### 4.4 WebSocket 作用域

**定义与特性**：WebSocket 作用域的 Bean 在 **WebSocket 会话期间**存在，每个 WebSocket 会话有自己的实例，会话关闭时实例销毁。

**代码示例**：

```java
@Scope(value = "websocket", proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
public class ChatSession {
    private String sessionId;
    private Set<WebSocketSession> participants = new HashSet<>();

    // 实时通信状态管理
    public void addParticipant(WebSocketSession session) {
        participants.add(session);
    }
}
```

## 5. 作用域配置方式

### 5.1 注解配置

**使用 `@Scope` 注解**：直接在 Bean 类上指定作用域。

```java
// 单例作用域（可省略，默认即为 singleton）
@Component
@Scope("singleton")
public class MySingletonBean {
    // Bean 实现
}

// 原型作用域
@Component
@Scope("prototype")
public class MyPrototypeBean {
    // Bean 实现
}

// 使用枚举常量
@Component
@Scope(BeanDefinition.SCOPE_PROTOTYPE)
public class MyPrototypeBean {
    // Bean 实现
}
```

### 5.2 Java 配置类

```java
@Configuration
public class AppConfig {
    @Bean
    @Scope("singleton")
    public MySingletonBean singletonBean() {
        return new MySingletonBean();
    }

    @Bean
    @Scope(value = WebApplicationContext.SCOPE_REQUEST,
           proxyMode = ScopedProxyMode.TARGET_CLASS)
    public MyRequestBean requestBean() {
        return new MyRequestBean();
    }
}
```

### 5.3 XML 配置

```xml
<bean id="userService" class="com.example.UserService" scope="singleton"/>
<bean id="user" class="com.example.User" scope="prototype"/>
<bean id="requestData" class="com.example.RequestData" scope="request"/>
```

## 6. 作用域代理与高级特性

### 6.1 作用域代理（Scoped Proxy）

当**短生命周期作用域**（如 request）的 Bean 被**长生命周期作用域**（如 singleton）的 Bean 依赖时，需要使用代理。

**代理模式配置**：

```java
@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
public class RequestScopedBean {
    // Bean 实现
}
```

**proxyMode 选项**：

- `TARGET_CLASS`：使用 CGLIB 代理（适用于类）
- `INTERFACES`：使用 JDK 动态代理（适用于接口）

### 6.2 单例 Bean 中注入原型 Bean 的问题与解决方案

**问题**：单例 Bean 在初始化时已经注入了原型 Bean 的实例，后续不会重新创建。

**解决方案**：使用 `@Lookup` 注解或方法注入：

```java
@Component
public class SingletonBean {
    // 错误方式：始终使用同一个原型实例
    @Autowired
    private PrototypeBean prototypeBean;

    // 正确方式：使用方法注入
    @Lookup
    public PrototypeBean getPrototypeBean() {
        return null; // 由 Spring 实现
    }

    public void businessMethod() {
        PrototypeBean prototypeBean = getPrototypeBean(); // 每次获取新实例
        // 使用原型 Bean
    }
}
```

### 6.3 自定义作用域

Spring 允许通过实现 `Scope` 接口定义自定义作用域。

**实现步骤**：

1. 实现 `Scope` 接口
2. 注册自定义作用域到容器
3. 使用自定义作用域

**示例**：创建线程级作用域

```java
public class ThreadScope implements Scope {
    private final ThreadLocal<Map<String, Object>> threadLocal =
        ThreadLocal.withInitial(HashMap::new);

    @Override
    public Object get(String name, ObjectFactory<?> objectFactory) {
        Map<String, Object> scope = threadLocal.get();
        return scope.computeIfAbsent(name, k -> objectFactory.getObject());
    }

    @Override
    public void registerDestructionCallback(String name, Runnable callback) {
        // 实现销毁回调
    }

    // 其他方法实现...
}

// 注册自定义作用域
@Configuration
public class CustomScopeConfig implements BeanFactoryPostProcessor {
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory factory) {
        factory.registerScope("thread", new ThreadScope());
    }
}

// 使用自定义作用域
@Component
@Scope("thread")
public class ThreadScopedBean {
    // Bean 实现
}
```

## 7. 最佳实践与常见问题

### 7.1 作用域选择指南

| 作用域类型  | 实例数量       | 生命周期     | 线程安全   | 典型应用     |
| ----------- | -------------- | ------------ | ---------- | ------------ |
| singleton   | 每个容器一个   | 容器生命周期 | 需要保证   | 服务、DAO    |
| prototype   | 每次请求新实例 | 使用期间     | 通常不需要 | 有状态 Bean  |
| request     | 每个请求一个   | 请求期间     | 不需要     | Web 请求处理 |
| session     | 每个会话一个   | 会话期间     | 不需要     | 用户数据     |
| application | 每个应用一个   | 应用生命周期 | 需要保证   | 全局资源     |

### 7.2 线程安全设计原则

1. **最小化共享状态**：避免在 Bean 中存储可变的共享数据
2. **明确状态所有权**：将状态绑定到线程（如 ThreadLocal）或请求/会话作用域
3. **组合而非继承**：通过依赖注入（DI）使用线程安全的组件（如 ConcurrentHashMap）

### 7.3 性能优化建议

1. **谨慎使用 prototype 作用域**：由于 prototype 作用域会为每个请求创建新的 Bean 实例，因此可能会导致大量的对象创建和垃圾回收，从而影响性能
2. **考虑使用懒加载**：对于那些不需要在启动时立即初始化的 Bean，使用懒加载可以减少启动时间并提高性能
3. **Web 作用域 Bean 在非 Web 环境使用**：添加 Mock 环境或使用条件配置

### 7.4 常见问题与解决方案

**问题 1：单例 Bean 中注入原型 Bean 失效**

- **原因**：单例 Bean 在初始化时已经注入了原型 Bean 的实例，后续不会重新创建
- **解决**：使用 `@Lookup` 注解或方法注入

**问题 2：Web 作用域 Bean 在非 Web 环境使用报错**

- **解决**：确保 Web 相关依赖（如 spring-boot-starter-web）已引入

**问题 3：作用域 Bean 的线程安全问题**

- **解决**：根据作用域类型采取不同策略

## 8. 实战案例：电商系统中的作用域应用

### 8.1 作用域在电商系统中的典型应用

- **用户服务**：单例（无状态）
- **购物车**：会话作用域
- **订单处理上下文**：请求作用域
- **商品库存缓存**：应用作用域

### 8.2 代码示例

```java
// 单例：用户服务
@Service
public class UserService {
    public User findUserById(Long id) {
        // 无状态服务方法
    }
}

// 会话作用域：购物车
@Scope(value = WebApplicationContext.SCOPE_SESSION,
       proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
public class ShoppingCart {
    private List<CartItem> items = new ArrayList<>();

    public void addItem(CartItem item) {
        items.add(item);
    }
}

// 请求作用域：订单上下文
@Scope(value = WebApplicationContext.SCOPE_REQUEST,
       proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
public class OrderContext {
    private Order currentOrder;
    private PaymentInfo paymentInfo;
}
```

## 总结

Spring Bean 的作用域机制为应用开发提供了极大的灵活性。正确理解和使用各种作用域可以帮助开发者构建更加高效、可靠的应用程序。作用域的选择不仅影响功能实现，还直接影响应用的性能和资源使用。在实际开发中，应当根据组件的特性和使用场景选择最合适的作用域。

记住，**优先使用单例作用域**用于无状态组件，**仅在需要维护状态时使用其他作用域**，并始终考虑线程安全和性能影响。通过合理运用作用域代理、方法注入等高级特性，可以解决复杂场景下的 Bean 生命周期管理问题。
