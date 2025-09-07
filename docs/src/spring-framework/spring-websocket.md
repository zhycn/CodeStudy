好的，请看这篇关于 Spring WebSocket 的详细技术文档。

# Spring Framework WebSocket 详解与最佳实践

## 1. 概述

在现代 Web 应用开发中，实时、双向的通信需求日益增长。传统的 HTTP 请求-响应模式无法满足诸如实时聊天、在线游戏、股票行情、协同编辑等需要服务器主动向客户端推送信息的场景。WebSocket 协议应运而生，它提供了一个全双工的单一套接字连接，使得客户端和服务器之间可以进行低延迟、高效率的实时通信。

Spring Framework 从 4.0 版本开始提供了对 WebSocket 的全面支持，包括：

- **一个轻量级的 WebSocket API**：用于直接处理 WebSocket 连接和消息。
- **基于 SockJS 的备选方案**：在浏览器不支持 WebSocket 时提供优雅降级。
- **基于 STOMP 的子协议支持**：为应用程序提供更高级别的消息模式，类似于 JMS 或 AMQP。

本文将深入探讨 Spring WebSocket 的核心概念、使用方法以及在生产环境中的最佳实践。

## 2. 快速入门：一个简单的 Echo 服务

让我们从一个最简单的示例开始：创建一个 Echo 服务，它将客户端发送的消息原样返回。

### 2.1 添加 Maven 依赖

首先，确保你的 `pom.xml` 包含了必要的依赖。

```xml
<dependencies>
    <!-- Spring WebSocket 支持 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>

    <!-- 用于在 Java 对象和 JSON 之间转换消息 -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>

    <!-- 前端页面模板（可选，用于演示） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
</dependencies>
```

### 2.2 启用 WebSocket 并配置处理器

创建一个配置类来启用 WebSocket 支持并注册我们的处理器。

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket // 启用基本的 WebSocket 处理
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 注册一个 WebSocketHandler，并指定其处理的端点路径 '/echo'
        // setAllowedOrigins("*") 允许所有域进行连接，生产环境中应指定具体域名
        registry.addHandler(new EchoWebSocketHandler(), "/echo")
                .setAllowedOrigins("*");
    }
}
```

### 2.3 实现 WebSocketHandler

创建一个处理器来处理 WebSocket 连接的生命周期和消息。

```java
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class EchoWebSocketHandler extends TextWebSocketHandler {

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 连接建立后触发
        session.sendMessage(new TextMessage("CONNECTED: Welcome to the Echo server!"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // 处理收到的文本消息
        String clientMessage = message.getPayload();
        String echoMessage = "ECHO: " + clientMessage;

        // 将消息原样发回给客户端
        session.sendMessage(new TextMessage(echoMessage));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // 连接关闭后触发
        System.out.println("Connection closed with status: " + status);
    }
}
```

### 2.4 创建测试页面 (index.html)

在 `src/main/resources/templates` 目录下创建一个简单的 HTML 页面进行测试。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>WebSocket Echo Test</title>
    <script type="text/javascript">
      let socket;

      function connect() {
        // 创建 WebSocket 连接，URL 根据你的服务地址调整
        socket = new WebSocket('ws://' + window.location.host + '/echo');

        socket.onopen = function (event) {
          console.log('Connection established!');
          appendMessage('System: Connected.');
        };

        socket.onmessage = function (event) {
          appendMessage('Server: ' + event.data);
        };

        socket.onclose = function (event) {
          console.log('Connection closed: ', event);
          appendMessage('System: Disconnected.');
        };
      }

      function disconnect() {
        if (socket != null) {
          socket.close();
        }
        socket = null;
      }

      function sendMessage() {
        const messageInput = document.getElementById('message');
        const message = messageInput.value;
        if (message && socket) {
          socket.send(message);
          appendMessage('You: ' + message);
          messageInput.value = '';
        }
      }

      function appendMessage(message) {
        const messageArea = document.getElementById('messageArea');
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(message));
        messageArea.appendChild(p);
      }
    </script>
  </head>
  <body onload="connect()">
    <h2>WebSocket Echo Test</h2>
    <div>
      <textarea id="message" placeholder="Type a message..."></textarea>
      <button onclick="sendMessage()">Send</button>
      <button onclick="disconnect()">Disconnect</button>
    </div>
    <div id="messageArea"></div>
  </body>
</html>
```

### 2.5 运行并测试

启动你的 Spring Boot 应用，访问 `http://localhost:8080`，在输入框中发送消息，你将看到服务器返回的 Echo 消息。

这个简单的例子展示了 Spring WebSocket 最底层的 API。然而，对于复杂的应用，直接使用 `WebSocketHandler` 会显得繁琐。接下来，我们将介绍更强大、更常用的 STOMP over WebSocket 方式。

## 3. 核心概念：STOMP 与 Spring 的高级支持

STOMP (Simple Text Oriented Messaging Protocol) 是一个简单的基于文本的消息协议，它为 WebSocket 定义了一个帧格式，允许客户端和服务器之间使用发布-订阅模式进行通信。这类似于 JMS 或 RabbitMQ 中的模式，使得编写消息处理代码变得更加容易和清晰。

使用 STOMP 后，消息的流动如下图所示：

```mermaid
graph LR
    A[Web Client] -- STOMP over WS --> B(Spring STOMP Endpoint)
    B -- forwards messages --> C[Message Broker]
    C -- routes messages --> D[@Controller]
    D -- sends responses --> C
    C -- sends messages --> B
    B -- sends to client --> A
```

### 3.1 启用 STOMP over WebSocket

我们需要修改配置来启用 STOMP 功能。

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // 1. 启用基于代理的 STOMP 消息
public class WebSocketStompConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 2. 注册一个 STOMP 端点，客户端将使用它来连接
        registry.addEndpoint("/ws-stomp") // 端点路径
                .setAllowedOriginPatterns("*") // 允许的源（CORS）
                .withSockJS(); // 3. 启用 SockJS 备选方案
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 4. 配置消息代理
        // 启用一个简单的基于内存的消息代理，在前缀为 /topic 或 /queue 的目标上向客户端广播消息
        registry.enableSimpleBroker("/topic", "/queue");

        // 5. 配置应用程序目的地的前缀。
        // 以 /app 为前缀的消息将被路由到带有 @MessageMapping 注解的控制器方法
        registry.setApplicationDestinationPrefixes("/app");

        // 6. (可选) 配置用户目的地前缀，用于点对点消息
        // registry.setUserDestinationPrefix("/user");
    }
}
```

**关键配置解释：**

- **`/ws-stomp`**: WebSocket (或 SockJS) 的握手端点。客户端连接的 URL 将是 `ws://localhost:8080/ws-stomp`。
- **`withSockJS()`**: 提供向后兼容性。如果浏览器不支持 WebSocket，连接将自动降级为 HTTP 流或轮询。
- **`enableSimpleBroker("/topic", "/queue")`**: 启用一个简单的内存消息代理，处理目的地以 `/topic` 或 `/queue` 开头的消息（通常是服务器向客户端发送的消息）。
- **`setApplicationDestinationPrefixes("/app")`**: 所有目的地以 `/app` 开头的消息都会被路由到 `@Controller` 类中的 `@MessageMapping` 方法进行处理。

## 4. 进阶功能与实践

### 4.1 创建 STOMP 消息控制器

现在我们可以创建一个类似于 Spring MVC 中 `@RestController` 的控制器来处理 STOMP 消息。

```java
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

// 定义一个简单的消息模型
public class Greeting {
    private String content;
    // 省略构造函数、getter 和 setter
}

public class HelloMessage {
    private String name;
    // 省略构造函数、getter 和 setter
}

@Controller
public class GreetingController {

    // 处理发送到 /app/hello 目的地的消息
    // /app 前缀是在配置中定义的应用程序目的地前缀
    @MessageMapping("/hello")
    // 将方法的返回值发送到 /topic/greetings 目的地，所有订阅了该目的地的客户端都会收到
    @SendTo("/topic/greetings")
    public Greeting greeting(HelloMessage message) throws Exception {
        // 模拟处理延迟
        Thread.sleep(1000);
        return new Greeting("Hello, " + message.getName() + "!");
    }
}
```

### 4.2 前端使用 STOMP.js

在前端，我们需要使用 STOMP 客户端库来连接和通信。

1. **首先引入 SockJS 和 STOMP.js 库**：

   ```html
   <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@2/bundles/stomp.umd.min.js"></script>
   ```

2. **创建连接和发送消息**：

   ```html
   <script>
     let stompClient = null;
     const socketUrl = 'http://' + window.location.host + '/ws-stomp';

     function connect() {
       // 1. 创建 SockJS 连接
       const socket = new SockJS(socketUrl);
       // 2. 创建 STOMP 客户端 over SockJS
       stompClient = Stomp.over(socket);

       // 3. 连接至 STOMP 端点
       stompClient.connect({}, function (frame) {
         console.log('Connected: ' + frame);

         // 4. 订阅 /topic/greetings 目的地，当服务器向该目的地发送消息时，此回调函数会被触发
         stompClient.subscribe('/topic/greetings', function (greeting) {
           // greeting.body 是服务器发送的消息体
           showGreeting(JSON.parse(greeting.body).content);
         });
       });
     }

     function disconnect() {
       if (stompClient !== null) {
         stompClient.disconnect();
       }
       console.log('Disconnected');
     }

     function sendName() {
       // 5. 使用 STOMP 客户端向 /app/hello 发送一条消息
       // 注意目的地是 /app/hello，这将被路由到 GreetingController.greeting() 方法
       const name = document.getElementById('name').value;
       stompClient.send('/app/hello', {}, JSON.stringify({ name: name }));
     }

     function showGreeting(message) {
       // 将收到的消息显示在页面上
       const response = document.getElementById('response');
       const p = document.createElement('p');
       p.appendChild(document.createTextNode(message));
       response.appendChild(p);
     }
   </script>
   ```

### 4.3 处理用户和点对点消息

除了广播，Spring STOMP 还支持向特定用户发送消息。

**服务器端配置与代码：**

1. **首先，确保配置中启用了用户目的地**（通常在 `configureMessageBroker` 中设置 `setUserDestinationPrefix("/user")`）。
2. **使用 `@SendToUser` 注解**：

```java
@Controller
public class UserNotificationController {

    @MessageMapping("/notify-me")
    @SendToUser("/queue/notifications") // 消息将只发送回发起请求的用户
    public Notification notifyUser(NotificationRequest request, Principal principal) {
        // Principal 对象包含了当前认证用户的信息
        String username = principal.getName();
        return new Notification("Hello " + username + ", " + request.getMessage());
    }
}
```

**前端订阅：**

关键点在于订阅的目的地需要包含用户唯一的标识。Spring 会自动将 `/user/queue/notifications` 转换为对当前用户唯一的目的地（例如 `/queue/notifications-user123`）。

```javascript
// 在连接成功的回调中订阅用户专属队列
stompClient.subscribe('/user/queue/notifications', function (notification) {
  showNotification(JSON.parse(notification.body).content);
});
```

## 5. 最佳实践

### 5.1 安全性：认证与授权

WebSocket 连接在建立时（握手阶段）仍然是一个 HTTP 请求，我们可以利用这一点进行安全控制。

**使用 Spring Security 保护 WebSocket**：

1. **添加依赖**：

   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-security</artifactId>
   </dependency>
   ```

2. **配置 Security**：

   ```java
   import org.springframework.context.annotation.Configuration;
   import org.springframework.core.Ordered;
   import org.springframework.core.annotation.Order;
   import org.springframework.security.config.annotation.web.builders.HttpSecurity;
   import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
   import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
   import org.springframework.security.config.http.SessionCreationPolicy;
   import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

   @Configuration
   @EnableWebSecurity
   @Order(Ordered.HIGHEST_PRECEDENCE + 99)
   public class WebSocketSecurityConfig extends WebSecurityConfigurerAdapter {

       @Override
       protected void configure(HttpSecurity http) throws Exception {
           http
               .antMatcher("/ws-stomp/**") // 保护 WebSocket 端点
               .csrf().disable() // WebSocket 不需要 CSRF 保护
               .sessionManagement()
                   .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // 通常使用无状态认证（如 JWT）
               .and()
               .authorizeRequests()
                   .anyRequest().authenticated(); // 握手请求需要认证
       }
   }
   ```

3. **在握手时进行认证（例如 JWT）**：
   你可以实现一个 `HandshakeInterceptor` 来在握手前验证 Token。

   ```java
   public class AuthHandshakeInterceptor implements HandshakeInterceptor {

       @Override
       public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                      WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
           // 从请求中获取 Token（例如在查询参数中）
           String token = getTokenFromRequest(request);
           if (validateToken(token)) {
               // 验证成功，可以将用户信息存入 attributes，后续可通过 WebSocketSession 获取
               attributes.put("user", extractUserFromToken(token));
               return true; // 允许握手
           }
           return false; // 拒绝握手
       }

       // ... afterHandshake 方法和其他辅助方法
   }
   ```

   然后在配置中注册这个拦截器：

   ```java
   registry.addEndpoint("/ws-stomp")
           .addInterceptors(new AuthHandshakeInterceptor())
           .withSockJS();
   ```

### 5.2 集群环境下的扩展

简单的内存消息代理（`enableSimpleBroker`）无法在集群中工作。你需要引入一个全功能的外部消息代理（如 RabbitMQ, ActiveMQ）。

**使用 RabbitMQ 作为 STOMP 代理**：

1. **添加依赖**：

   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-amqp</artifactId>
   </dependency>
   ```

2. **修改配置**：

   ```java
   @Override
   public void configureMessageBroker(MessageBrokerRegistry registry) {
       // 启用 Stomp 代理中继（RabbitMQ），代替简单代理
       registry.enableStompBrokerRelay("/topic", "/queue")
               .setRelayHost("your-rabbitmq-host")
               .setRelayPort(61613) // RabbitMQ 的 STOMP 插件默认端口
               .setClientLogin("guest")
               .setClientPasscode("guest");

       registry.setApplicationDestinationPrefixes("/app");
   }
   ```

### 5.3 心跳与连接健康检查

为了保证连接的稳定性，应启用心跳机制。

```java
@Override
public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
    registration
        .setSendTimeLimit(15 * 1000) // 发送超时时间 15秒
        .setSendBufferSizeLimit(512 * 1024) // 发送缓冲区大小限制 512KB
        .addDecoratorFactory(new CustomWebSocketHandlerDecoratorFactory()); // (可选) 自定义装饰器用于日志/监控
}

// 在 STOMP 配置中设置心跳
@Override
public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.taskExecutor().corePoolSize(4).maxPoolSize(10);
}

@Override
public void configureClientOutboundChannel(ChannelRegistration registration) {
    registration.taskExecutor().corePoolSize(4).maxPoolSize(10);
}
```

客户端也可以在连接时配置心跳：

```javascript
stompClient.heartbeat.outgoing = 10000; // 客户端每 10 秒发送一次心跳
stompClient.heartbeat.incoming = 0; // 客户端不希望接收服务器心跳
```

### 5.4 异常处理

你可以实现 `@ControllerAdvice` 来处理消息处理过程中抛出的异常。

```java
@ControllerAdvice
public class WebSocketExceptionHandler {

    @MessageExceptionHandler
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public ErrorMessage handleException(Exception ex) {
        // 将异常信息返回给发送消息的特定用户
        return new ErrorMessage("An error occurred: " + ex.getMessage());
    }
}
```

### 5.5 性能与监控

- **监控连接数**：可以注入 `SimpUserRegistry` 来获取当前在线用户信息（仅适用于简单代理）。
- **使用 Micrometer 监控**：Spring Boot Actuator 提供了 `/actuator/websockettrace` 端点来查看最近的 WebSocket 连接跟踪信息（需要配置）。
- **限制连接和消息大小**：通过 `configureWebSocketTransport` 方法设置超时和缓冲区大小，防止恶意攻击。

## 6. 总结

Spring Framework 提供了强大而灵活的 WebSocket 支持，从底层的 API 到基于 STOMP 的高级抽象，能够满足各种复杂度的实时通信需求。

**核心要点：**

- 对于简单用例，可以直接实现 `WebSocketHandler`。
- 对于大多数应用场景，**推荐使用基于 STOMP 的方式**，它提供了清晰的消息模式和完善的功能。
- 始终考虑**安全性**，使用 Spring Security 保护握手过程，并对消息进行权限检查。
- 在生产环境中，务必使用**外部消息代理（如 RabbitMQ）** 来支持集群扩展和持久化。
- 实施**心跳机制**和**异常处理**来保证连接的健壮性和用户体验。

通过遵循本文所述的最佳实践，你可以构建出高效、稳定且可扩展的实时 Web 应用程序。
