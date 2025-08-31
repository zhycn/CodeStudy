---
title: Spring Session 详解与最佳实践
description: 详细介绍了 Spring Session 的原理、配置和使用场景，以及与 Spring Security 的集成。
---

# Spring Session 详解与最佳实践

- Spring Session 官方文档：<https://spring.io/projects/spring-session>
- Spring Security 官方文档：<https://spring.io/projects/spring-security>
- Redis 官方文档：<https://redis.io/documentation>
- JDBC 官方文档：<https://docs.oracle.com/javase/tutorial/jdbc/>

| 项目                     | 内容                                      |
| :----------------------- | :---------------------------------------- |
| **目标框架**             | Spring Boot 3.x (基于 Spring Framework 6) |
| **JDK 版本**             | JDK 17+                                   |
| **Spring Session 版本**  | 3.x (由 Spring Boot 3.x 自动管理)         |
| **Spring Security 版本** | 6.x (由 Spring Boot 3.x 自动管理)         |

## 1. 引言

### 1.1 什么是会话管理？

在Web应用中，HTTP协议本身是无状态的。为了在多个请求间保持用户状态（如登录信息、购物车内容），引入了**会话（Session）** 的概念。

- **传统会话管理**：应用服务器（如Tomcat）在内存中维护一个`HttpSession`对象，并通过一个名为`JSESSIONID`的Cookie在浏览器和服务器之间进行关联。
- **局限性**：这种默认方式在单体应用中运行良好，但在微服务、集群化或云原生架构下会遇到严重问题：
  - **粘性会话（Session Affinity）**：需要负载均衡器配置会话粘滞，将同一用户的请求始终路由到同一台服务器实例，缺乏容错性和灵活性。
  - **内存瓶颈**：会话数据存储在应用服务器内存中，无法横向扩展，且应用重启会导致所有会话丢失。
  - **框架耦合**：会话存储与特定的应用服务器（Tomcat, Jetty）实现紧密耦合。

### 1.2 什么是 Spring Session？

Spring Session 是一个强大的项目，它提供了一套透明的API和实现，用于管理分布式环境下的用户会话。它的核心目标是**将会话存储从应用服务器中抽象出来**，并使其易于扩展到分布式数据存储中，如 Redis、MongoDB、JDBC 等。

**核心价值与优势：**

- **会话统一管理**：提供对`HttpSession`的替代实现，支持以透明方式（代码无需改动）将会话数据存储到外部化、分布式的存储中。
- **无需粘性会话**：应用实例变得无状态，可以轻松地进行水平扩展和滚动升级。
- **多数据源支持**：提供多种后端存储支持（Redis, JDBC, Hazelcast, MongoDB等），并可轻松集成。
- **增强功能**：提供RESTful API管理会话、同一浏览器多会话支持、WebSocket会话保持等高级特性。
- **与 Spring 生态无缝集成**：完美兼容 Spring Boot、Spring Security、Spring WebSocket。

### 1.3 Spring Boot 3 的兼容性

Spring Session 3.0+ 版本基于 Spring Framework 6 构建，全面适配 Jakarta EE 9+（包名从 `javax.*` 变为 `jakarta.*`），与 Spring Boot 3.x 完全兼容。其自动配置机制得到了极大增强，在 Spring Boot 项目中集成变得异常简单。

## 2. 核心概念与架构

### 2.1 `SessionRepository` 策略

Spring Session 的核心是 `SessionRepository<T extends Session>` 接口。它定义了会话的CRUD操作（创建、读取、保存、删除），不同的实现对应不同的存储后端。

| 实现类                              | 描述                                                                          | 适用场景                                  |
| :---------------------------------- | :---------------------------------------------------------------------------- | :---------------------------------------- |
| **`RedisIndexedSessionRepository`** | **最常用**的实现。将会话数据存储在Redis中，支持基于哈希的高效存储和自动过期。 | 高性能、高可用的分布式环境。              |
| **`JdbcIndexedSessionRepository`**  | 将会话数据存储在关系型数据库中。                                              | 基础设施中没有Redis，但已有数据库的环境。 |
| `MapSessionRepository`              | 基于内存`Map`的实现，会话不持久化。                                           | 测试环境，单机开发。                      |
| `HazelcastSessionRepository`        | 使用Hazelcast分布式内存数据网格存储会话。                                     | 已使用Hazelcast作为缓存或数据网格的项目。 |

### 2.2 过滤器 (`SessionRepositoryFilter`)

Spring Session 通过一个名为 `SessionRepositoryFilter` 的 Servlet 过滤器来实现其魔法。该过滤器包装了原始的 `HttpServletRequest` 和 `HttpServletResponse`。

1. **请求进入**：过滤器拦截请求，并根据传入的会话ID（如从Cookie中）从配置的 `SessionRepository` 中查找 `Session`。
2. **请求处理**：应用程序代码（如Controller）获取到的是包装后的请求对象。调用 `request.getSession()` 时，返回的是由 Spring Session 管理的 `Session` 对象，而非容器的 `HttpSession`。
3. **请求结束**：过滤器确保对 `Session` 的任何更改都会被持久化回 `SessionRepository`，并在响应中设置适当的会话标识（如Cookie）。

这种设计使得应用代码无需任何修改即可从传统会话迁移到分布式会话。

## 3. 集成与实战示例

以下以最常用的 **Redis** 和 **JDBC** 为例，展示如何集成 Spring Session。

### 3.1 环境准备与依赖 (Maven)

#### 3.1.1 使用 Redis 作为后端存储

```xml
<!-- pom.xml -->
<dependencies>
    <!-- Spring Boot Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Spring Security (可选，但推荐用于会话安全) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <!-- Spring Session Data Redis -->
    <dependency>
        <groupId>org.springframework.session</groupId>
        <artifactId>spring-session-data-redis</artifactId>
    </dependency>
    <!-- Spring Data Redis Reactive (或 spring-boot-starter-data-redis) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
</dependencies>
```

#### 3.1.2 使用 JDBC 作为后端存储

```xml
<!-- pom.xml -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <!-- Spring Session JDBC -->
    <dependency>
        <groupId>org.springframework.session</groupId>
        <artifactId>spring-session-jdbc</artifactId>
    </dependency>
    <!-- 数据库驱动和JDBC -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
        <!-- 或使用 spring-boot-starter-jdbc -->
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
    <!-- 生产环境可使用MySQL/PostgreSQL -->
</dependencies>
```

### 3.2 基础配置 (application.yml)

#### 3.2.1 Redis 配置

```yaml
# application.yml
spring:
  data:
    redis:
      host: localhost # Redis服务器地址
      port: 6379 # Redis服务器端口
      password: # 密码（如果没有则不配置）
  session:
    store-type: redis # 明确指定存储类型（通常Spring Boot会自动配置）
    timeout: 30m # 会话默认过期时间（默认为30分钟）
    redis:
      namespace: spring:session # 存储在Redis中的key的前缀
      flush-mode: on_save # 保存模式：on_save（立即保存）|immediate（立即）
      save-mode: on_set_attribute # 属性保存模式：on_set_attribute（设置属性时保存）|always（总是）

# 安全Cookie配置（非常重要！）
server:
  servlet:
    session:
      cookie:
        http-only: true # 防止JS访问Cookie，缓解XSS
        secure: true # 仅在HTTPS下传输Cookie（生产环境必须开启）
        same-site: lax # 提供CSRF保护

logging:
  level:
    org.springframework.session: DEBUG # 开启Spring Session日志以便调试
```

#### 3.2.2 JDBC 配置

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
    username: sa
    password: ''
  session:
    store-type: jdbc
    timeout: 30m
    jdbc:
      initialize-schema: always # 自动创建会话表（生产环境应设置为never，并手动运行schema.sql）
      table-name: SPRING_SESSION # 自定义表名
  jpa:
    hibernate:
      ddl-auto: create-drop

server:
  servlet:
    session:
      cookie:
        http-only: true
        secure: true
        same-site: lax
```

Spring Session JDBC 会自动创建两张表（如果`initialize-schema`为`always`）：

- `SPRING_SESSION`：存储会话主体信息。
- `SPRING_SESSION_ATTRIBUTES`：存储会话属性，与主表是一对多关系。

### 3.3 创建一个简单的演示应用

#### 3.3.1 控制器 (Controller)

创建一个用于测试会话读写的控制器。

```java
// src/main/java/com/example/controller/SessionController.java
package com.example.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class SessionController {

    // 向会话中写入数据
    @GetMapping("/write-session")
    public String writeSession(HttpSession session) {
        // 模拟存储用户信息
        session.setAttribute("username", "alice");
        session.setAttribute("visitCount", 1);
        return "Session data has been set. Session ID: " + session.getId();
    }

    // 从会话中读取数据
    @GetMapping("/read-session")
    public Map<String, Object> readSession(HttpSession session) {
        Map<String, Object> sessionData = new HashMap<>();
        sessionData.put("sessionId", session.getId());
        sessionData.put("username", session.getAttribute("username"));

        // 模拟访问计数器
        Integer visitCount = (Integer) session.getAttribute("visitCount");
        if (visitCount == null) {
            visitCount = 0;
        }
        session.setAttribute("visitCount", visitCount + 1);
        sessionData.put("visitCount", visitCount);

        sessionData.put("creationTime", session.getCreationTime());
        sessionData.put("lastAccessedTime", session.getLastAccessedTime());
        sessionData.put("maxInactiveInterval", session.getMaxInactiveInterval());

        return sessionData;
    }

    // 使当前会话失效（登出）
    @GetMapping("/invalidate")
    public String invalidateSession(HttpSession session) {
        session.invalidate();
        return "Session invalidated.";
    }
}
```

#### 3.3.2 安全配置 (SecurityConfig)

Spring Security 会自动保护会话管理。以下是一个简单配置，允许所有端点可访问（仅用于演示）。

```java
// src/main/java/com/example/config/SecurityConfig.java
package com.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .anyRequest().permitAll() // 允许所有请求，仅用于演示
            )
            .csrf(csrf -> csrf.disable()); // 为演示方便禁用CSRF，生产环境必须开启
        return http.build();
    }
}
```

#### 3.3.3 主应用类

```java
// src/main/java/com/example/SpringSessionDemoApplication.java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpringSessionDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringSessionDemoApplication.class, args);
    }
}
```

#### 3.3.4 运行与测试

1. **启动应用**：确保Redis服务器正在运行（如果使用Redis），然后启动Spring Boot应用。
2. **测试会话**：
   - 访问 `http://localhost:8080/write-session`。响应会返回一个Session ID。
   - 访问 `http://localhost:8080/read-session`。浏览器会自动带上Cookie，返回包含之前存储数据的JSON。
   - 多次刷新 `/read-session`，观察 `visitCount` 的变化。
   - 查看Redis（使用`redis-cli`和命令`KEYS spring:session:*`）或H2数据库（通过`http://localhost:8080/h2-console`），可以看到存储的会话数据。
3. **多实例测试**：启动另一个应用实例在不同的端口（如`server.port=8081`）。通过同一个浏览器访问新实例的`/read-session`，你会发现会话数据依然存在，证明了会话的共享。

## 4. 高级特性与最佳实践

### 4.1 与 Spring Security 的深度集成

Spring Session 与 Spring Security 协同工作，可以安全地管理认证信息（`SecurityContext`）。

- **默认行为**：当使用 `spring-session-data-redis` 和 `spring-boot-starter-security` 时，`SecurityContext` 会自动存储在会话中。用户登录后，其认证信息会在请求间持久化。
- **会话固定保护（Session Fixation Protection）**：Spring Security 默认启用此保护。当用户认证成功后，会创建一个新的会话，并废弃旧的会话，防止会话固定攻击。
- **并发会话控制**：可以在Security配置中限制单个用户的最大并发会话数。

```java
// 在 SecurityConfig 中添加并发控制
http
    .sessionManagement(session -> session
        .maximumSessions(1) // 允许每个用户最多一个并发会话
        .maxSessionsPreventsLogin(false) // false：新登录会使旧会话失效；true：阻止新登录
    );
```

### 4.2 自定义会话序列化

默认的JDK序列化效率低且不通用。**强烈建议**为Redis配置自定义JSON序列化。

1. **添加依赖**：

   ```xml
   <dependency>
       <groupId>com.fasterxml.jackson.core</groupId>
       <artifactId>jackson-databind</artifactId>
   </dependency>
   ```

2. **创建配置类，注册自定义序列化器**：

   ```java
   // src/main/java/com/example/config/RedisSessionConfig.java
   package com.example.config;

   import org.springframework.context.annotation.Bean;
   import org.springframework.context.annotation.Configuration;
   import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
   import org.springframework.data.redis.serializer.RedisSerializer;

   @Configuration
   public class RedisSessionConfig {

       /**
        * 配置Spring Session使用JSON序列化方式来序列化/反序列化会话对象。
        * 这比默认的JDK序列化更高效，且可读性更强。
        */
       @Bean
       public RedisSerializer<Object> springSessionDefaultRedisSerializer() {
           return new GenericJackson2JsonRedisSerializer();
       }
   }
   ```

配置后，Redis中存储的会话数据将是可读的JSON格式，而不是二进制数据。

### 4.3 会话事件监听

可以监听会话的创建、过期、销毁等事件，用于实现审计日志、统计在线用户等功能。

```java
// src/main/java/com/example/listener/SessionEventListener.java
package com.example.listener;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.session.data.redis.RedisIndexedSessionRepository;
import org.springframework.session.events.SessionCreatedEvent;
import org.springframework.session.events.SessionDeletedEvent;
import org.springframework.session.events.SessionExpiredEvent;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class SessionEventListener {

    @EventListener
    public void handleSessionCreated(SessionCreatedEvent event) {
        // 会话创建时触发（用户第一次访问或登录后创建新会话）
        log.info("Session created: {}", event.getSessionId());
    }

    @EventListener
    public void handleSessionDeleted(SessionDeletedEvent event) {
        // 会话被显式销毁时触发（如调用session.invalidate()或登出）
        log.info("Session deleted: {}", event.getSessionId());
    }

    @EventListener
    public void handleSessionExpired(SessionExpiredEvent event) {
        // 会话因过期而被Redis自动删除时触发
        log.info("Session expired: {}", event.getSessionId());
    }
}
```

### 4.4 生产环境最佳实践

1. **安全的Cookie配置**：生产环境必须强制启用`secure=true`和`http-only=true`。
2. **会话超时时间**：根据业务需求设置合理的超时时间（`spring.session.timeout`），平衡安全性和用户体验。
3. **Redis高可用**：使用Redis哨兵或集群模式，确保会话存储的高可用性。在配置中连接Sentinel或Cluster。
4. **禁用JDBC自动初始化**：在生产数据库中，设置`spring.session.jdbc.initialize-schema=never`，并手动运行官方提供的`schema.sql`脚本（位于`spring-session-jdbc`jar包中）来创建表结构，以获得更多控制权。
5. **监控**：监控Redis的内存使用情况和性能指标。监控应用中的活跃会话数。
6. **定期清理**：虽然Redis和JDBC实现都支持自动过期，但定期审计和清理无用会话是一个好习惯。

## 5. 常见问题与解决方案 (FAQ)

**Q1: 集成后会话不生效？**

**A**: 按以下步骤排查：

1. 检查依赖是否正确引入（如`spring-session-data-redis`）。
2. 检查存储后端（Redis/数据库）连接是否正常。
3. 检查过滤器顺序，确保`SessionRepositoryFilter`已正确注册。Spring Boot 自动配置通常会处理好这一点。
4. 查看应用启动日志，是否有Spring Session相关的自动配置报告。

**Q2: 序列化错误，如`java.lang.ClassNotFoundException`或`Cannot deserialize ...`？**

**A**: 这是使用默认JDK序列化的常见问题。**最佳解决方案是切换到JSON序列化**（如使用`GenericJackson2JsonRedisSerializer`）。这确保了会话数据的可读性和兼容性。

**Q3: 性能瓶颈？**

**A**:

- 确保使用Redis这样的高性能存储，而不是数据库。
- 检查网络延迟，确保应用实例与Redis服务器之间的网络通畅。
- 避免在会话中存储过大或过多的对象。会话应尽量保持轻量。

**Q4: 如何手动管理或查询会话？**

**A**: 可以注入`SessionRepository`或Redis特有的`RedisIndexedSessionRepository`来进行高级操作。

```java
@Autowired
private RedisIndexedSessionRepository sessionRepository;

public void adminDeleteSession(String sessionId) {
    Session session = sessionRepository.findById(sessionId);
    if (session != null) {
        sessionRepository.deleteById(sessionId);
    }
}
```

## 6. 总结

Spring Session 提供了一个强大、透明且灵活的方式来管理分布式环境下的用户会话，是现代云原生应用架构的关键组件。

**核心要点回顾：**

1. **解耦与抽象**：将会话存储从应用服务器中完全解耦，抽象到外部数据存储。
2. **开箱即用**：通过与Spring Boot的深度集成，只需添加依赖和基本配置即可快速入门。
3. **多存储支持**：根据基础设施和需求，灵活选择Redis（高性能首选）或JDBC等作为后端。
4. **安全与集成**：与Spring Security无缝集成，提供安全的会话管理，并支持监听和自定义。
5. **生产就绪**：关注Cookie安全、序列化方式、高可用性和监控，以确保稳定运行。

遵循本文的指南和实践，你将能够轻松地构建出可水平扩展、安全可靠的无状态应用集群，从容应对分布式环境下的会话管理挑战。
