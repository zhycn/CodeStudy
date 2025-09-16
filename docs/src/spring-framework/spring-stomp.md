---
title: Spring Framework STOMP Messaging 详解与最佳实践
description: 本文详细介绍了 Spring Framework 中 STOMP Messaging 的核心概念、配置方式、最佳实践以及实际应用场景。通过掌握这些知识，开发者可以在企业级应用中高效、一致地处理实时通信需求，提升系统的可维护性和可扩展性。
author: zhycn
---

# Spring 框架 STOMP Messaging 详解与最佳实践

## 1. 引言：为什么选择 STOMP？

在现代 Web 应用程序中，实时、双向的通信变得越来越重要，例如实时聊天、通知推送、实时数据仪表盘等场景。虽然 HTML5 提供了 **WebSocket** 协议来解决全双工通信问题，但它是一种**底层协议**，仅仅定义了字节流如何传输，并未规定消息的格式、类型、路由等语义。

这就像 TCP 协议保证了数据的可靠传输，但我们通常需要基于它构建像 HTTP 这样的**应用层协议**来定义请求/响应模型。STOMP (Simple Text-Orientated Messaging Protocol) 就是 WebSocket 之上的**应用层协议**。

### 1.1 STOMP 的优势

- **协议无关性**: STOMP 可以在任何可靠的流协议上运行，如 WebSocket, TCP。
- **帧格式明确**: 基于文本，格式类似于 HTTP，易于调试和解读。
- **丰富的语义**: 定义了 `CONNECT`, `SUBSCRIBE`, `UNSUBSCRIBE`, `SEND`, `ACK` 等命令，为消息传递提供了清晰的模型。
- **互操作性**: 任何支持 STOMP 的客户端（如 JavaScript, Java, Go）都可以与 Spring STOMP 服务端进行通信。
- **Spring 生态集成**: Spring Framework 对 STOMP 提供了原生、强大的支持，可以无缝集成 Spring Security, Spring MVC 等组件。

**简单来说，使用 STOMP 允许我们专注于应用级的消息语义，而不是处理原始的 WebSocket 消息。**

## 2. STOMP 协议基础

在深入 Spring 实现之前，理解 STOMP 协议的基本帧结构是至关重要的。

一个 STOMP 帧 (Frame) 由三部分组成：**命令** (Command)，**头部** (Headers)，和**主体** (Body)。

```bash
COMMAND
header1:value1
header2:value2

Body^@
```

**示例：一个客户端发送消息的帧**

```bash
SEND
destination:/app/chat
content-type:application/json

{"user":"Alice","content":"Hello, World!"}^@
```

**示例：服务器向订阅者广播消息的帧**

```bash
MESSAGE
destination:/topic/chat.message.1
subscription:sub-0
message-id:qwerty-123
content-type:application/json

{"user":"Alice","content":"Hello, World!"}^@
```

**常用命令说明:**

- `CONNECT/CONNECTED`: 建立和确认连接。
- `SUBSCRIBE/UNSUBSCRIBE`: 订阅/取消订阅某个目的地。
- `SEND`: 发送消息到目的地。
- `MESSAGE`: 服务器向客户端推送消息。
- `ACK/NACK`: 确认/否认收到消息。

## 3. Spring STOMP 的整体架构

Spring 的 STOMP 支持建立在 `spring-messaging` 模块之上，该模块是 Spring 集成消息传递编程模型的核心。

1. **STOMP 客户端** (如 Web 浏览器) 通过 WebSocket 连接与 `WebSocketHandler` 建立连接。
2. `STOMPProtocolHandler` 将原始的 WebSocket 消息解码为 STOMP 帧，并将其传递给**消息调度器** `MessageDispatcher`。
3. 调度器根据 STOMP 帧的 `destination` 头信息，将消息路由到合适的**处理方法**。
   - 以 `/app` 为前缀的目的地会被路由到 `@Controller` 类中的 `@MessageMapping` 方法。
   - 以 `/topic` 或 `/queue` 为前缀的目的地通常由 **Simple Broker** 或 **代理中继** (Broker Relay) 处理。
4. `@Controller` 中的方法处理业务逻辑，并可以通过 `@SendTo` 或 `SimpMessagingTemplate` 向代理目的地（如 `/topic`）发送消息。
5. 代理 (Broker) 负责管理订阅并将消息广播给所有符合条件的订阅者。

## 4. 实战：构建一个简单的 STOMP 应用

让我们通过一个简单的实时聊天应用来演示 Spring STOMP 的核心功能。

### 4.1 添加 Maven 依赖

```xml
<!-- Spring Boot WebSocket Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
<!-- 通常也需要Web依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<!-- JSON 支持 -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### 4.2 WebSocket 配置：启用 STOMP

创建一个配置类 `WebSocketConfig`，继承 `AbstractWebSocketMessageBrokerConfigurer` (Spring 5 之前) 或实现 `WebSocketMessageBrokerConfigurer` (Spring 5+)。

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // 1. 启用基于代理的STOMP消息
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 2. 配置消息代理
        // 应用程序以/app为前缀的消息将会被路由到@MessageMapping方法
        config.setApplicationDestinationPrefixes("/app");
        // 代理目的地前缀，客户端可以订阅/topic或/user来接收消息
        // 使用内置的简单内存代理
        config.enableSimpleBroker("/topic", "/queue");
        // 如果使用RabbitMQ或ActiveMQ等外部代理，则使用enableStompBrokerRelay()
        // config.enableStompBrokerRelay("/topic", "/queue");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 3. 注册STOMP端点
        // 客户端将通过这个URL来建立连接
        registry.addEndpoint("/ws-chat")
                // 允许所有源访问，生产环境应具体配置
                .setAllowedOriginPatterns("*")
                // 启用SockJS后备选项，以防浏览器不支持WebSocket
                .withSockJS();
    }
}
```

### 4.3 定义消息模型

创建一个简单的 POJO 来表示聊天消息。

```java
public class ChatMessage {
    private String from;
    private String content;
    private String timestamp;

    // 默认构造函数、全参构造函数、getter和setter必不可少
    public ChatMessage() {
    }

    public ChatMessage(String from, String content, String timestamp) {
        this.from = from;
        this.content = content;
        this.timestamp = timestamp;
    }

    // ... getters and setters
}
```

### 4.4 创建消息控制器 (@Controller)

```java
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Controller
public class ChatController {

    // 处理发送到 /app/chat.sendMessage 的消息
    @MessageMapping("/chat.sendMessage") // -> 完整路径是 /app/chat.sendMessage
    @SendTo("/topic/public") // 返回值将广播给所有订阅了 /topic/public 的客户端
    public ChatMessage sendMessage(ChatMessage chatMessage) {
        // 通常这里会有业务逻辑，如保存到数据库等
        chatMessage.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return chatMessage;
    }

    // 处理用户加入事件
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage chatMessage) {
        chatMessage.setContent("User " + chatMessage.getFrom() + " joined!");
        chatMessage.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return chatMessage;
    }
}
```

### 4.5 客户端实现 (JavaScript with SockJS & stomp.js)

创建一个 `index.html` 文件。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Spring STOMP Chat</title>
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@7.0.0/bundles/stomp.umd.min.js"></script>
  </head>
  <body>
    <div id="chat">
      <input type="text" id="username" placeholder="Your username" />
      <input type="text" id="messageInput" placeholder="Type a message..." />
      <button onclick="sendMessage()">Send</button>
      <div id="messageArea"></div>
    </div>

    <script>
      const stompClient = new StompJs.Client({
        // 连接SockJS端点
        webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
        // 连接成功时的回调
        onConnect: (frame) => {
          console.log('Connected: ' + frame);
          // 订阅公共主题，接收广播消息
          stompClient.subscribe('/topic/public', (message) => {
            showMessage(JSON.parse(message.body));
          });
          // 发送用户加入通知
          stompClient.publish({
            destination: '/app/chat.addUser',
            body: JSON.stringify({ from: document.getElementById('username').value, content: '' }),
          });
        },
        // 连接失败时的回调
        onDisconnect: (frame) => {
          console.log('Disconnected', frame);
        },
      });

      // 启动连接
      stompClient.activate();

      function sendMessage() {
        const messageContent = document.getElementById('messageInput').value.trim();
        const username = document.getElementById('username').value.trim();
        if (messageContent && username) {
          const chatMessage = {
            from: username,
            content: document.getElementById('messageInput').value,
          };
          // 发送消息到/app/chat.sendMessage
          stompClient.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(chatMessage),
          });
          document.getElementById('messageInput').value = '';
        }
      }

      function showMessage(message) {
        const messageArea = document.getElementById('messageArea');
        const messageElement = document.createElement('p');
        messageElement.textContent = `[${message.timestamp}] ${message.from}: ${message.content}`;
        messageArea.appendChild(messageElement);
      }
    </script>
  </body>
</html>
```

### 4.6 运行与测试

1. 启动 Spring Boot 应用程序。
2. 在浏览器中打开 `index.html`（可能需要通过一个简单的 Spring MVC 控制器来提供这个页面，或直接使用文件协议打开）。
3. 打开多个浏览器标签页，输入用户名和消息，观察消息的实时广播。

## 5. 进阶特性与最佳实践

### 5.1 使用外部消息代理 (RabbitMQ/ActiveMQ)

对于生产环境，内存代理无法扩展。应使用如 RabbitMQ 或 ActiveMQ 等全功能的消息代理。

**修改 `WebSocketConfig`：**

```java
@Override
public void configureMessageBroker(MessageBrokerRegistry config) {
    config.setApplicationDestinationPrefixes("/app");
    // 启用Stomp代理中继，连接到RabbitMQ
    config.enableStompBrokerRelay("/topic", "/queue")
          .setRelayHost("localhost") // RabbitMQ服务器地址
          .setRelayPort(61613)       // RabbitMQ的STOMP插件端口
          .setClientLogin("guest")   // RabbitMQ用户名
          .setClientPasscode("guest"); // RabbitMQ密码
    // 注意：需要确保RabbitMQ安装了STOMP插件并已启动
}
```

**优势：**

- **集群与高可用**: 外部代理支持集群。
- **消息持久化**: 确保消息不会因服务器重启而丢失。
- **跨应用通信**: 其他非 Spring 应用也可以通过消息代理进行交互。

### 5.2 认证与授权：集成 Spring Security

WebSocket 连接建立时已经过 HTTP 握手，可以在此过程中进行认证。

**添加依赖：**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

**创建安全配置 `WebSecurityConfig`：**

```java
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@EnableWebSecurity
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/", "/index.html").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .permitAll()
            )
            .logout(logout -> logout.permitAll())
            // 禁用CSRF对于WebSocket端点通常是可以的，但请根据你的整体安全策略决定
            .csrf(csrf -> csrf.ignoringRequestMatchers("/ws-chat/**"));
        return http.build();
    }
}
```

**在 `WebSocketConfig` 中注册 Channel 拦截器以传递用户信息：**

```java
@Override
public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(new ChannelInterceptor() {
        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                // 从握手请求中获取认证信息
                Authentication user = ...; // 通常从SecurityContextHolder获取
                accessor.setUser(user);
            }
            return message;
        }
    });
}
```

在 `@Controller` 中，可以通过 `@MessageMapping` 方法的 `Principal` 参数获取当前用户。

```java
@MessageMapping("/chat.private")
public void sendPrivateMessage(@Payload ChatMessage chatMessage, Principal principal) {
    String sender = principal.getName();
    // ... 处理私聊逻辑
}
```

### 5.3 发送消息到特定用户 (User Destinations)

Spring 提供了将消息发送给特定用户的功能，而不需要他们共享一个公共的订阅地址。

**服务端发送：**
使用 `SimpMessagingTemplate` 和 `/user` 前缀。

```java
@Autowired
private SimpMessagingTemplate messagingTemplate;

public void sendPrivateMessage(ChatMessage message, String toUsername) {
    // 消息将被发送到 /user/{toUsername}/queue/private
    messagingTemplate.convertAndSendToUser(
        toUsername,
        "/queue/private",
        message
    );
}
```

**客户端订阅：**
客户端需要订阅以 `/user` 为前缀的特定目的地。

```javascript
// 客户端JS代码
stompClient.subscribe('/user/queue/private', function (message) {
  showPrivateMessage(JSON.parse(message.body));
});
```

Spring 会自动将 `/user/{username}/queue/private` 映射到每个已认证用户的唯一队列。

### 5.4 处理错误与确认机制

STOMP 支持 `ACK` 和 `NACK` 模式来处理消息确认。

**服务端配置：**
在 `@MessageMapping` 方法中，可以使用 `@Header` 注解获取消息 ID 并进行处理。

```java
@MessageMapping("/chat.reliable")
public void handleReliableMessage(@Payload String content,
                                  @Header("acknowledge-id") String ackId,
                                  SimpMessageHeaderAccessor headerAccessor) {
    try {
        // 处理业务
        processMessage(content);
        // 手动发送ACK（如果需要）
        // headerAccessor.getSessionAttributes().put(ackId, true);
    } catch (Exception e) {
        // 发送NACK
        // headerAccessor.getSessionAttributes().put(ackId, false);
    }
}
```

**客户端订阅：**
在订阅时指定确认模式。

```javascript
stompClient.subscribe(
  '/topic/someDestination',
  function (message) {
    // 处理消息...
    message.ack(); // 手动确认
  },
  { ack: 'client' }
); // 设置为客户端手动确认
```

## 6. 性能调优与生产就绪建议

1. **连接心跳**: 配置心跳机制以保持连接活跃并检测死连接。

   ```java
   // 在WebSocketConfig中覆盖configureWebSocketTransport
   @Override
   public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
       registration.setSendTimeLimit(15 * 1000)
                  .setSendBufferSizeLimit(512 * 1024)
                  // 配置心跳：第一个参数是发往服务器的心跳间隔，第二个是期望从服务器收到的心跳
                  .setDecoratorFactories( new DefaultWebSocketHandlerDecoratorFactory(10000, 10000));
   }
   ```

2. **监控**: 暴露和监控 `/actuator/websockettrace` 端点（如果可用）或使用代理的管理界面（如 RabbitMQ Management UI）。

3. **负载测试**: 使用工具如 `Apache JMeter` 对 WebSocket 连接进行压力测试。

4. **优雅关闭**: 处理应用程序关闭时的连接断开，避免客户端意外重连。

## 7. 常见问题与排查 (FAQ)

**Q: 连接失败，出现 `Error during WebSocket handshake: Unexpected response code: 404`**

**A:** 检查 STOMP 端点 URL 是否正确，以及服务器端 CORS 配置。

**Q: 消息发送了，但客户端收不到。**

**A:** 使用浏览器开发者工具的 **Network** -> **WS** 标签查看 WebSocket 帧，确认目的地前缀、订阅路径和发送路径是否匹配。

**Q: 如何保证消息顺序？**

**A:** 对于单个客户端，消息在同一个连接中通常是按顺序处理的。对于全局顺序，需要依赖外部代理的特性或业务逻辑保证。

## 8. 总结

Spring Framework 对 STOMP 协议的支持提供了一种强大而灵活的方式来构建交互性强、实时性高的 Web 应用程序。通过理解其架构、熟练掌握 `@MessageMapping`、`SimpMessagingTemplate` 等核心 API，并结合 Spring Security 和外部消息代理，开发者可以构建出健壮、可扩展的生产级实时消息系统。
