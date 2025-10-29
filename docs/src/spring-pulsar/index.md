# Spring for Apache Pulsar

# Spring Pulsar 详解与最佳实践

## 1. 引言

Apache Pulsar 是一个云原生的分布式消息流平台，结合 Spring Boot 可以构建高性能、可扩展的实时数据应用。Spring for Apache Pulsar 项目为 Pulsar 提供了 Spring 友好的抽象层，简化了在 Spring 环境中的集成和使用。本文将全面介绍如何在 Spring Boot 3.x 中集成和使用 Apache Pulsar，包括核心概念、环境搭建、基本用法、高级特性和最佳实践 。

### 1.1 Apache Pulsar 简介

Apache Pulsar 是一个开源的分布式消息传递平台，支持多种消息传递模式，包括发布/订阅、队列等。与传统的消息系统相比，Pulsar 提供了更强的可扩展性和多租户功能，使其成为云原生应用的理想选择 。

**核心优势**：

- **统一消息模型**：支持队列和流式处理
- **多层架构**：计算与存储分离
- **低延迟高吞吐**：百万级消息/秒处理能力
- **多租户支持**：完善的权限隔离
- **地理复制**：跨地域数据同步

### 1.2 Spring for Apache Pulsar 项目

Spring for Apache Pulsar 是一个开源项目，旨在为 Apache Pulsar 提供 Spring 友好的抽象层。该项目构建在多个 Spring 项目之上，提供了访问 Apache Pulsar 的 API，并支持使用 Reactive 客户端 。

## 2. 环境准备与项目搭建

### 2.1 系统要求

- **JDK 17 或更高版本**：Spring Boot 3.x 需要 JDK 17+
- **Gradle 或 Maven**：作为项目构建工具
- **Apache Pulsar**：建议使用 3.x 或更高版本

### 2.2 Pulsar 服务部署

使用 Docker 快速部署 Pulsar 单节点开发环境：

```bash
docker run -it -p 6650:6650 -p 8080:8080 \
  --name pulsar apachepulsar/pulsar:3.1.0 \
  bin/pulsar standalone
```

部署完成后，可以通过 <http://localhost:8080> 访问 Pulsar 管理界面 。

### 2.3 创建 Spring Boot 项目

使用 Spring Initializr 创建新的 Spring Boot 项目，选择以下依赖：

- Spring Web
- Spring for Apache Pulsar (如果可用)
- 或者手动添加 Pulsar 依赖

### 2.4 添加依赖

**Maven 配置**：

```xml
<dependencies>
    <!-- Spring Boot Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Spring for Apache Pulsar -->
    <dependency>
        <groupId>org.springframework.pulsar</groupId>
        <artifactId>spring-pulsar</artifactId>
    </dependency>

    <!-- 或者使用官方客户端 -->
    <dependency>
        <groupId>org.apache.pulsar</groupId>
        <artifactId>pulsar-client</artifactId>
        <version>3.1.0</version>
    </dependency>
</dependencies>
```

**Gradle 配置**：

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.pulsar:spring-pulsar'
    // 或者
    implementation 'org.apache.pulsar:pulsar-client:3.1.0'
}
```

对于反应式编程，可以添加 `spring-pulsar-reactive` 依赖 。

## 3. 基本配置与连接

### 3.1 应用配置

在 `application.properties` 中配置 Pulsar 连接信息：

```properties
spring.pulsar.client.service-url=pulsar://localhost:6650
spring.pulsar.producer.topic-name=my-topic
```

或者在 `application.yml` 中配置：

```yaml
spring:
  pulsar:
    client:
      service-url: pulsar://localhost:6650
    producer:
      topic-name: my-topic
```

### 3.2 Pulsar 客户端配置

创建配置类来初始化 Pulsar 客户端：

```java
package com.example.config;

import org.apache.pulsar.client.api.PulsarClient;
import org.apache.pulsar.client.api.PulsarClientException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PulsarConfig {

    @Value("${spring.pulsar.client.service-url}")
    private String serviceUrl;

    @Bean
    public PulsarClient pulsarClient() throws PulsarClientException {
        return PulsarClient.builder()
                .serviceUrl(serviceUrl)
                .operationTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .connectionTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                .build();
    }
}
```

如果需要身份验证，可以配置认证插件：

```yaml
spring:
  pulsar:
    client:
      service-url: pulsar://your-pulsar-url:6650
      authentication:
        plugin-class-name: org.apache.pulsar.client.impl.auth.oauth2.AuthenticationOAuth2
        params:
          issuerUrl: https://auth.server.cloud/
          privateKey: file:///path/to/your-key.json
          audience: urn:sn:acme:dev:my-instance
```

## 4. 消息生产

### 4.1 使用 PulsarTemplate

Spring for Apache Pulsar 提供了 `PulsarTemplate` 用于简化消息发送：

```java
package com.example.service;

import org.springframework.pulsar.core.PulsarTemplate;
import org.springframework.stereotype.Component;

@Component
public class MessageProducer {

    private final PulsarTemplate<String> pulsarTemplate;

    public MessageProducer(PulsarTemplate<String> pulsarTemplate) {
        this.pulsarTemplate = pulsarTemplate;
    }

    public void sendMessage(String message) {
        pulsarTemplate.send("your-topic", "Hello, Pulsar!");
    }
}
```

### 4.2 高级消息发送

对于更复杂的发送需求，可以使用流畅的 API：

```java
public void sendKeyedMessage(String message) {
    pulsarTemplate.newMessage(message)
        .withMessageCustomizer((mb) -> mb.key("message-key"))
        .withProducerCustomizer((pb) ->
            pb.enableChunking(true).enableBatching(false))
        .send();
}
```

### 4.3 同步与异步发送

```java
@Service
public class PulsarMessageProducer {

    @Autowired
    private PulsarClient pulsarClient;

    // 同步发送
    public void sendMessageSync(String content) throws PulsarClientException {
        Producer<String> producer = pulsarClient.newProducer(Schema.STRING)
            .topic("my-topic")
            .create();

        MessageId messageId = producer.send(content);
        System.out.println("Message sent successfully. Message ID: " + messageId);
        producer.close();
    }

    // 异步发送
    public CompletableFuture<MessageId> sendMessageAsync(String content) {
        Producer<String> producer = pulsarClient.newProducer(Schema.STRING)
            .topic("my-topic")
            .create();

        CompletableFuture<MessageId> future = producer.sendAsync(content);
        future.thenAccept(messageId -> {
            System.out.println("Async message sent successfully. Message ID: " + messageId);
            try {
                producer.close();
            } catch (PulsarClientException e) {
                e.printStackTrace();
            }
        });
        return future;
    }
}
```

## 5. 消息消费

### 5.1 使用 @PulsarListener

最简单的消息消费方式是使用 `@PulsarListener` 注解：

```java
package com.example.service;

import org.springframework.pulsar.annotation.PulsarListener;
import org.springframework.stereotype.Component;

@Component
public class MessageConsumer {

    @PulsarListener(topics = "your-topic")
    public void processMessage(String message) {
        System.out.println("Received message: " + message);
    }
}
```

### 5.2 高级消费者配置

对于需要更多控制的场景，可以配置详细的消费者参数：

```java
@Service
public class OrderConsumer {

    @PulsarListener(
        subscriptionName = "order-processing",
        topics = "persistent://public/default/orders",
        subscriptionType = SubscriptionType.Shared,
        deadLetterPolicy = @DeadLetterPolicy(
            maxRedeliverCount = 3,
            deadLetterTopic = "dlq-orders"
        )
    )
    public void processOrder(Message<byte[]> message) {
        try {
            Order order = JsonUtils.fromJson(new String(message.getData()), Order.class);
            // 业务处理逻辑
            process(order);
            message.ack();
        } catch (Exception e) {
            log.error("Order processing failed", e);
            message.negativeAcknowledge();
        }
    }
}
```

### 5.3 手动消费者实现

对于需要完全控制消费流程的场景，可以手动创建消费者：

```java
@Service
public class PulsarMessageConsumer implements CommandLineRunner {

    @Autowired
    private PulsarClient pulsarClient;

    @Override
    public void run(String... args) throws Exception {
        startConsumer();
    }

    public void startConsumer() throws PulsarClientException {
        Consumer<String> consumer = pulsarClient.newConsumer(Schema.STRING)
            .topic("my-topic")
            .subscriptionName("my-subscription")
            .subscriptionType(SubscriptionType.Shared)
            .subscribe();

        new Thread(() -> {
            while (true) {
                try {
                    Message<String> msg = consumer.receive(10, TimeUnit.SECONDS);
                    if (msg != null) {
                        System.out.println("Received message: " + msg.getValue());
                        consumer.acknowledge(msg);
                    }
                } catch (PulsarClientException e) {
                    e.printStackTrace();
                }
            }
        }).start();
    }
}
```

## 6. 高级特性

### 6.1 Schema 管理

Spring for Apache Pulsar 支持多种 Schema 类型，包括 JSON、AVRO、PROTOBUF 等。

**配置类型映射**：

```yaml
spring:
  pulsar:
    defaults:
      type-mappings:
        - message-type: com.example.User
          schema-info:
            schema-type: AVRO
        - message-type: com.example.Address
          schema-info:
            schema-type: JSON
```

**使用 AVRO Schema**：

```java
@AvroSchema(schema = """
{
    "type": "record",
    "name": "UserEvent",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "eventType", "type": "string"},
        {"name": "timestamp", "type": "long"}
    ]
}
""")
public class UserEvent {
    private String id;
    private String eventType;
    private long timestamp;
    // getters and setters
}

// 生产消息
public void sendUserEvent(UserEvent event) {
    pulsarTemplate.send("user-events", event);
}

// 消费消息
@PulsarListener(
    topics = "user-events",
    schemaType = SchemaType.AVRO
)
public void handleUserEvent(UserEvent event) {
    // 直接使用POJO对象
}
```

### 6.2 事务支持

Pulsar 提供了事务支持，确保消息的原子性处理：

```java
@Configuration
public class TransactionConfig {

    @Bean
    public PulsarTransactionManager pulsarTransactionManager(PulsarClient pulsarClient) {
        return new PulsarTransactionManager(pulsarClient);
    }
}

@Service
@Transactional
public class TransactionalService {

    @Autowired
    private Producer<byte[]> orderProducer;

    @Autowired
    private Producer<byte[]> paymentProducer;

    public void processTransaction(Order order, Payment payment) {
        // 在同一个事务中发送多条消息
        orderProducer.newMessage()
            .value(JsonUtils.toJson(order).getBytes())
            .send();
        paymentProducer.newMessage()
            .value(JsonUtils.toJson(payment).getBytes())
            .send();
        // 如果此处抛出异常，两条消息都不会发送
    }
}
```

### 6.3 死信队列处理

对于处理失败的消息，可以配置死信队列：

```java
@PulsarListener(
    topics = "user-actions",
    subscriptionName = "user-action-sub",
    deadLetterPolicy = @DeadLetterPolicy(
        maxRedeliverCount = 3,
        deadLetterTopic = "dlq-user-actions"
    )
)
public void handleUserAction(Message<UserAction> message) {
    try {
        processAction(message.getValue());
        message.ack();
    } catch (Exception e) {
        log.error("Processing failed", e);
        // 超过重试次数后自动进入死信队列
    }
}

// 死信队列消费者
@PulsarListener(topics = "dlq-user-actions")
public void handleDlqMessage(Message<UserAction> message) {
    // 处理失败消息
    log.error("Dead letter received: {}", message.getMessageId());
    // 报警、记录日志等
}
```

### 6.4 消息路由策略

对于分区主题，可以自定义消息路由策略：

```java
public class OrderRouter implements MessageRouter {
    @Override
    public int choosePartition(Message<?> msg, TopicMetadata metadata) {
        Order order = (Order) msg.getValue();
        // 根据订单ID分区
        return Math.abs(order.getId().hashCode()) % metadata.numPartitions();
    }
}

// 使用路由策略
@Bean
public Producer<Order> partitionedProducer(PulsarClient client) throws PulsarClientException {
    return client.newProducer(Schema.JSON(Order.class))
        .topic("partitioned-orders")
        .messageRouter(new OrderRouter())
        .create();
}
```

## 7. 性能优化与最佳实践

### 7.1 生产者优化

```java
@Bean
public Producer<byte[]> optimizedProducer(PulsarClient client) throws PulsarClientException {
    return client.newProducer()
        .topic("high-throughput")
        .sendTimeout(0, TimeUnit.SECONDS) // 无超时
        .batchingMaxPublishDelay(1, TimeUnit.MILLISECONDS) // 批量延迟
        .batchingMaxMessages(1000) // 最大批量消息数
        .batchingMaxBytes(128 * 1024) // 128KB批量大小
        .enableChunking(true) // 启用分块
        .create();
}
```

### 7.2 消费者优化

```java
@PulsarListener(
    topics = "high-throughput",
    subscriptionType = SubscriptionType.Shared,
    consumerName = "opt-consumer",
    consumerProperties = {
        @PulsarProperty(name = "receiverQueueSize", value = "1000"),
        @PulsarProperty(name = "ackTimeoutMillis", value = "30000"),
        @PulsarProperty(name = "maxTotalReceiverQueueSizeAcrossPartitions", value = "50000")
    }
)
public void handleMessages(Message<byte[]> message) {
    // 批量处理逻辑
}
```

### 7.3 资源池管理

```java
@Configuration
public class PulsarPoolConfig {

    @Bean
    public ProducerPool producerPool(PulsarClient client) {
        return new ProducerPool(client, 10); // 10个生产者连接池
    }

    @Bean
    public ConsumerPool consumerPool(PulsarClient client) {
        return new ConsumerPool(client, 20); // 20个消费者连接池
    }
}
```

### 7.4 生产者缓存优化

在使用 Lambda 定制器时，注意缓存键的匹配规则：

```java
// 正确的用法 - 将作为缓存键匹配
void sendUser() {
    var user = randomUser();
    template.newMessage(user)
        .withTopic("user-topic")
        .withProducerCustomizer((b) -> b.producerName("user"))
        .send();
}

// 错误的用法 - 将不匹配为缓存键
void sendUser() {
    var user = randomUser();
    var name = randomName();
    template.newMessage(user)
        .withTopic("user-topic")
        .withProducerCustomizer((b) -> b.producerName(name)) // 使用闭包外变量
        .send();
}
```

## 8. 安全与监控

### 8.1 TLS 加密通信

```yaml
spring:
  pulsar:
    client:
      service-url: pulsar+ssl://pulsar.example.com:6651
      tls:
        trust-cert-file: /path/to/ca.crt
        cert-file: /path/to/client.crt
        key-file: /path/to/client.key
```

### 8.2 JWT 认证

```yaml
spring:
  pulsar:
    client:
      authentication:
        plugin-class-name: org.apache.pulsar.client.impl.auth.AuthenticationToken
        params:
          token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.XXXXXXXX'
```

### 8.3 健康检查

```java
@Component
public class PulsarHealthIndicator implements HealthIndicator {

    private final PulsarClient client;

    public PulsarHealthIndicator(PulsarClient client) {
        this.client = client;
    }

    @Override
    public Health health() {
        try {
            client.getPartitionsForTopic("persistent://public/default/health-check")
                .get(5, TimeUnit.SECONDS);
            return Health.up().build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

### 8.4 Prometheus 监控

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

## 9. 实战案例：订单处理系统

### 9.1 系统架构

在一个电商订单处理系统中，使用 Pulsar 确保交易消息的有序处理和可靠性。

### 9.2 订单生产者

```java
@Service
public class OrderProducer {

    private final Producer<String> producer;

    public OrderProducer(PulsarClient pulsarClient) throws PulsarClientException {
        this.producer = pulsarClient.newProducer()
            .topic("persistent://public/default/orders")
            .compressionType(CompressionType.LZ4)
            .blockIfQueueFull(true)
            .create();
    }

    public void sendOrder(Order order) {
        try {
            producer.newMessage()
                .key(order.getId()) // 关键消息路由
                .value(JsonUtils.toJson(order).getBytes())
                .sendAsync()
                .thenAccept(msgId -> log.info("Order sent: {}", msgId));
        } catch (Exception e) {
            log.error("Failed to send order", e);
        }
    }
}
```

### 9.3 订单消费者

```java
@Service
public class OrderConsumer {

    @PulsarListener(
        subscriptionName = "order-processing",
        topics = "persistent://public/default/orders",
        subscriptionType = SubscriptionType.Exclusive // 确保顺序处理
    )
    public void processOrder(Message<byte[]> message) {
        try {
            Order order = JsonUtils.fromJson(
                new String(message.getData()), Order.class);

            // 业务处理逻辑
            processOrderBusiness(order);

            message.ack();
        } catch (Exception e) {
            log.error("Order processing failed", e);
            message.negativeAcknowledge();
        }
    }

    private void processOrderBusiness(Order order) {
        // 订单处理逻辑
        // 1. 验证订单
        // 2. 扣减库存
        // 3. 生成交易记录
        // 4. 通知用户
    }
}
```

### 9.4 REST 控制器

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderProducer orderProducer;

    @PostMapping
    public ResponseEntity<String> createOrder(@RequestBody Order order) {
        try {
            orderProducer.sendOrder(order);
            return ResponseEntity.ok("Order submitted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to submit order");
        }
    }
}
```

## 10. 常见问题与故障排除

### 10.1 连接问题

- **问题**：无法连接到 Pulsar 服务
- **解决**：检查 Pulsar 服务状态和网络连接，确认服务 URL 正确

### 10.2 性能问题

- **问题**：消息发送或消费速度慢
- **解决**：调整批处理大小、并发设置，优化网络配置

### 10.3 内存泄漏

- **问题**：生产者或消费者未正确关闭
- **解决**：确保在使用完毕后调用 `close()` 方法，或使用 try-with-resources

### 10.4 消息顺序问题

- **问题**：消息消费顺序不一致
- **解决**：使用 `SubscriptionType.Exclusive` 或 `KeyShared` 确保顺序处理

## 11. 总结

Spring for Apache Pulsar 为在 Spring Boot 应用中集成 Apache Pulsar 提供了简单而强大的解决方案。通过本文的介绍，您应该能够：

1. 理解 Apache Pulsar 的核心概念和优势
2. 在 Spring Boot 3.x 中成功集成 Pulsar
3. 实现消息的生产和消费
4. 使用高级特性如 Schema 管理、事务、死信队列等
5. 优化性能并实施最佳实践

Pulsar 与 Spring Boot 的结合为构建高性能、可扩展的分布式系统提供了强大的基础架构。在实际项目中，应根据具体需求选择合适的配置和特性，确保系统的可靠性和性能 。

## 12. 参考资料

- [Spring for Apache Pulsar 官方文档](https://spring.io/projects/spring-pulsar)
- [Apache Pulsar 官方文档](https://pulsar.apache.org/docs/en/)
- [Spring Boot 参考文档](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)

> 注意：本文中的代码示例基于 Spring Boot 3.x 和 Apache Pulsar 3.x/4.x 版本，实际使用时请根据您的环境进行适当调整。
