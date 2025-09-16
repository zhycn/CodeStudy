---
title: Spring Framework SockJS 详解与最佳实践
description: 本文详细介绍了 Spring Framework 中 SockJS 的核心概念、配置方式、最佳实践以及实际应用场景。通过掌握这些知识，开发者可以在企业级应用中高效、一致地处理实时通信需求，提升系统的可维护性和可扩展性。
author: zhycn
---

# Spring 框架 SockJS 详解与最佳实践

## 1. 概述：为什么需要 SockJS？

在现代 Web 应用中，实时、双向的通信至关重要，例如实时聊天、股票行情、在线游戏和协同编辑等场景。**WebSocket** 协议 (RFC 6455) 正是为此而生的理想选择，它提供了一个全双工的单一 TCP 连接，极大地降低了延迟、开销和复杂性。

然而，在现实世界中，我们总会遇到一些挑战：

1. **代理限制**：某些网络代理会阻止或不适配 WebSocket 连接。
2. **浏览器支持**：尽管现代浏览器已广泛支持 WebSocket，但一些旧版本浏览器或特殊环境（如某些企业的受限浏览器）可能无法使用。
3. **防火墙策略**：严格的防火墙规则可能会丢弃 WebSocket 握手包或建立后的数据帧。

为了解决这些问题，Spring Framework 4.x+ 提供了对 **SockJS** 的透明支持。

### 1.1 什么是 SockJS？

SockJS 是一个浏览器 JavaScript 库，它提供了一个连贯的、跨浏览器的 WebSocket-like 对象。SockJS 会首先尝试使用原生 WebSocket 连接，如果失败，它会自动降级到多种替代的传输协议，以实现最大程度的浏览器兼容性。

**SockJS 的设计目标**：为应用程序提供统一的 API，使其在任何支持 HTML5 的浏览器中都能运行，而无需关心底层的传输协议是 WebSocket 还是 HTTP 流/轮询。

## 2. SockJS 的工作原理与传输协议

SockJS 协议定义了一系列的传输方式，并按照性能从高到低的顺序进行尝试。

### 2.1 传输协议类型

1. **WebSocket**: 首选的传输方式，使用原生 WebSocket 对象。如果成功，则使用此方式。
2. **HTTP Streaming**: 如果 WebSocket 失败，SockJS 会尝试使用 HTTP 长轮询流（ streaming ）。服务器会保持一个请求长时间打开，并持续地向客户端发送数据片段（通常是 `h` 或 `heartbeat` 帧和 `a` 或 `message` 帧数组）。
3. **HTTP Long Polling**: 如果流式传输也失败，则会降级到经典的 long polling 模式。客户端发送一个请求，服务器保持连接直到有数据要发送，然后客户端收到响应后立即发起新的请求。

### 2.2 SockJS URL 结构

SockJS 客户端与服务器通信的 URL 遵循一个特定的模式：
`http(s)://host:port/{your-app-endpoint}/{server-id}/{session-id}/{transport}`

- `{your-app-endpoint}`: 你在服务端配置的 SockJS 端点，例如 `/ws`。
- `{server-id}`: 在集群环境中用于路由信息的标识符，单机应用中可以忽略。
- `{session-id}`: SockJS 会话的唯一标识符，在整个会话生命周期中保持不变。
- `{transport}`: 使用的传输协议，如 `websocket`, `xhr_streaming`, `xhr` 等。

客户端通过向这个 URL 发送 `GET /info` 请求来从服务器获取支持的传输协议列表，然后开始尝试连接。

## 3. Spring 中集成 SockJS

Spring 通过 `WebSocket` 模块对 SockJS 提供了开箱即用的支持。集成过程非常简洁。

### 3.1 服务端配置

首先，你需要添加 `spring-websocket` 依赖（以 Maven 为例）。

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-websocket</artifactId>
    <version>5.3.23</version> <!-- 请使用你的 Spring 版本 -->
</dependency>
```

如果你的项目是基于 Spring Boot 的，只需添加 `spring-boot-starter-websocket`。

```xml
<!-- pom.xml for Spring Boot -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

接下来，创建一个 WebSocket 配置类，启用 WebSocket 并注册 SockJS 端点。

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket // 启用 Spring 的 WebSocket 支持
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(myWebSocketHandler(), "/ws") // 指定 WebSocket 处理器和端点
                .setAllowedOrigins("*") // 允许的源，生产环境应严格限制
                .withSockJS(); // 关键：启用 SockJS 回退选项
    }

    @Bean
    public MyWebSocketHandler myWebSocketHandler() {
        return new MyWebSocketHandler();
    }
}
```

### 3.2 实现 WebSocket 处理器

你需要创建一个处理器来处理连接、消息接收等事件。最简单的方式是继承 `TextWebSocketHandler`。

```java
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class MyWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        System.out.println("New connection established: " + session.getId());
        session.sendMessage(new TextMessage("Welcome to the server!"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("Received message: " + payload + " from " + session.getId());

        // 简单广播消息给所有连接的会话
        for (WebSocketSession webSocketSession : sessions) {
            if (webSocketSession.isOpen()) {
                webSocketSession.sendMessage(new TextMessage("Echo: " + payload));
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        sessions.remove(session);
        System.out.println("Connection closed: " + session.getId() + " with status: " + status);
    }
}
```

### 3.3 使用 STOMP 子协议

对于更复杂的应用（如消息路由、订阅模式），建议在 SockJS 之上使用 **STOMP** (Simple Text Oriented Messaging Protocol) 子协议。Spring 对此提供了强大的支持。

**启用 STOMP 的配置：**

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // 启用 STOMP over WebSocket
public class WebSocketStompConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 注册一个 Stomp 端点，客户端将连接到此端点
        registry.addEndpoint("/ws-stomp")
                .setAllowedOrigins("*")
                .withSockJS(); // 启用 SockJS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 启用一个简单的内存消息代理，目的地前缀为 /topic
        registry.enableSimpleBroker("/topic");
        // 配置客户端发送消息的目的地前缀
        registry.setApplicationDestinationPrefixes("/app");
    }
}
```

## 4. 客户端开发

### 4.1 JavaScript (sockjs-client) 库

在 HTML 页面中，你需要引入 SockJS 和 STOMP 客户端库（如果使用 STOMP）。

```html
<!-- 从 CDN 引入 -->
<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1.5.2/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@6.1.2/esm/index.js"></script>

<script>
  // 建立 SockJS 连接
  const socket = new SockJS('http://localhost:8080/ws');

  // 创建 STOMP 客户端（如果使用 STOMP）
  const stompClient = Stomp.over(socket);

  // 连接服务器
  stompClient.connect({}, function (frame) {
    console.log('Connected: ' + frame);

    // 订阅一个目的地（Destination）
    stompClient.subscribe('/topic/greetings', function (message) {
      console.log('Received: ', JSON.parse(message.body));
    });

    // 发送一条消息
    stompClient.send('/app/hello', {}, JSON.stringify({ name: 'Spring' }));
  });

  // 对于不使用 STOMP 的原始 SockJS
  // socket.onopen = function() { ... };
  // socket.onmessage = function(e) { console.log('Message: ', e.data); };
  // socket.send('Hello from client');
</script>
```

### 4.2 Java 客户端

Spring 也提供了 `WebSocketClient` 接口，可以使用 `SockJsClient` 在 Java 应用中连接 SockJS 服务端。

```java
import org.springframework.web.socket.*;
import org.springframework.web.socket.sockjs.client.WebSocketClientSockJsSession;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.JettyWebSocketTransport;
import java.util.ArrayList;
import java.util.List;

public class MySockJsClient {

    public static void main(String[] args) {
        List<Transport> transports = new ArrayList<>(1);
        transports.add(new JettyWebSocketTransport());

        SockJsClient sockJsClient = new SockJsClient(transports);
        sockJsClient.doHandshake(new MyClientHandler(), "http://localhost:8080/ws");

        // 保持主线程运行，否则连接会立即关闭
        try {
            Thread.sleep(10000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}

class MyClientHandler extends TextWebSocketHandler {
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        session.sendMessage(new TextMessage("Hello from Java client!"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        System.out.println("Client received: " + message.getPayload());
    }
}
```

## 5. 安全与生产环境考量

### 5.1 跨源请求 (CORS)

在生产环境中，**绝对不要使用 `setAllowedOrigins("*")`**。这会使你的服务面临 CSRF 攻击。应该明确指定允许的来源。

```java
registry.addHandler(myWebSocketHandler(), "/ws")
        .setAllowedOrigins("https://trusted-domain.com", "https://another-trusted-domain.com")
        .withSockJS();
```

### 5.2 CSRF 保护

对于非 WebSocket 的传输（如 XHR），HTTP 请求仍然需要受到保护。Spring Security 可以配置为对 SockJS 端点提供 CSRF 保护。通常，需要在连接请求中提供一个有效的 CSRF Token。

**在 Spring Security 中配置：**

```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/ws/**").permitAll() // 根据需要配置权限
                .anyRequest().authenticated()
                .and()
            .csrf()
                // 重要：为 SockJS 端点忽略 CSRF，或者使用 Token 验证
                .ignoringAntMatchers("/ws/**");
    }
}
```

### 5.3 心跳与会话恢复

SockJS 协议内置了心跳机制（默认 25 秒），以防止代理断开长时间空闲的连接。通常不需要修改，但你可以通过 `SockJsService` 进行配置。

```java
// 在非 Spring Boot 环境中进行更细粒度的配置
@Bean
public ServletServerContainerFactoryBean createWebSocketContainer() {
    ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
    container.setMaxSessionIdleTimeout(300000L); // 设置会话超时时间
    return container;
}
```

## 6. 最佳实践总结

1. **优先使用 STOMP**：对于复杂的消息交互，使用 STOMP 子协议可以更好地组织代码，实现发布-订阅模式，并与 Spring MVC 的编程模型无缝集成。
2. **严格限制 CORS**：在生产环境中，明确设置 `allowedOrigins`，不要使用通配符 `*`。
3. **集群部署**：如果你的应用部署在多个实例上，SockJS 会话信息是保存在内存中的。你需要集成外部消息代理（如 RabbitMQ, Redis, Kafka）来广播消息，确保所有实例都能接收到消息。使用 `enableStompBrokerRelay()` 代替 `enableSimpleBroker()`。
4. **处理代理超时**：某些代理可能会对长时间连接的请求设置超时。理解 SockJS 的心跳机制，并在必要时调整其间隔。
5. **监控与日志**：密切关注 SockJS 的传输协议降级情况。大量连接降级到 long polling 可能意味着网络环境存在普遍问题。
6. **优雅断开**：在客户端，实现重连逻辑以处理网络波动。在服务端，确保在会话结束时正确清理资源。

## 7. 总结

Spring Framework 对 SockJS 的支持使得开发者能够轻松构建具有强大兼容性的实时 Web 应用程序。它透明地处理了传输协议的选择，让开发者可以专注于业务逻辑。

通过结合 WebSocket 的高性能和 HTTP 流/轮询的广泛兼容性，SockJS 确保了你的应用几乎可以在任何环境下运行。而在此基础上使用 STOMP 子协议，则能进一步规范通信模式，构建更健壮、可扩展的实时功能。

遵循本文所述的安全规范和最佳实践，你将能构建出既功能强大又稳定可靠的应用。
