# Spring for Apache Pulsar 详解与最佳实践

## 1. 概述

Apache Pulsar 是一个开源的分布式发布-订阅消息系统，以其高性能、低延迟和可扩展性而闻名。Spring for Apache Pulsar 是 Spring 生态系统与 Apache Pulsar 集成的一个项目，它提供了与 Spring Boot 无缝集成的支持，简化了 Pulsar 在 Spring 应用程序中的使用。

### 1.1 Spring Pulsar 核心特性

- **Spring Pulsar Starter**：提供开箱即用的自动配置
- **注解驱动**：通过 `@PulsarListener` 注解简化消息消费
- **响应式支持**：集成 Reactor 和 Spring WebFlux
- **事务支持**：提供端到端的事务处理能力
- **监控集成**：与 Spring Actuator 和 Micrometer 集成

### 1.2 版本兼容性

| Spring Boot 版本 | Spring Pulsar 版本 | Apache Pulsar 版本 |
| ---------------- | ------------------ | ------------------ |
| 3.2.x            | 1.0.0+             | 2.10.0+            |
| 3.1.x            | 0.3.0+             | 2.10.0+            |
| 3.0.x            | 0.2.0+             | 2.10.0+            |

## 2. 快速开始

### 2.1 添加依赖

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.pulsar</groupId>
        <artifactId>spring-pulsar-spring-boot-starter</artifactId>
        <version>1.0.0</version>
    </dependency>

    <!-- 如果需要响应式支持 -->
    <dependency>
        <groupId>org.springframework.pulsar</groupId>
        <artifactId>spring-pulsar-reactive-spring-boot-starter</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
```

### 2.2 基础配置

```yaml
# application.yml
spring:
  pulsar:
    client:
      service-url: pulsar://localhost:6650
      # 或者使用 HTTP URL: http://localhost:8080
    admin:
      service-url: http://localhost:8080
    producer:
      name: spring-pulsar-producer
    consumer:
      name: spring-pulsar-consumer
    listener:
      ack-mode: RECORD
```

### 2.3 创建第一个生产者

```java
import org.springframework.pulsar.core.PulsarTemplate;
import org.springframework.stereotype.Service;

@Service
public class MessageProducerService {

    private final PulsarTemplate<String> pulsarTemplate;

    public MessageProducerService(PulsarTemplate<String> pulsarTemplate) {
        this.pulsarTemplate = pulsarTemplate;
    }

    public void sendMessage(String topic, String message) {
        pulsarTemplate.send(topic, message);
    }

    public void sendMessageWithCallback(String topic, String message) {
        pulsarTemplate.sendAsync(topic, message)
            .thenAccept(messageId -> {
                System.out.println("Message sent successfully with ID: " + messageId);
            })
            .exceptionally(ex -> {
                System.err.println("Failed to send message: " + ex.getMessage());
                return null;
            });
    }
}
```

### 2.4 创建第一个消费者

```java
import org.springframework.pulsar.annotation.PulsarListener;
import org.springframework.stereotype.Service;

@Service
public class MessageConsumerService {

    @PulsarListener(
        subscriptionName = "my-subscription",
        topics = "persistent://public/default/my-topic"
    )
    public void receiveMessage(String message) {
        System.out.println("Received message: " + message);
        // 处理业务逻辑
    }

    @PulsarListener(
        subscriptionName = "user-subscription",
        topics = "user-topic",
        schemaType = SchemaType.JSON
    )
    public void receiveUserMessage(User user) {
        System.out.println("Received user: " + user);
        // 处理用户对象
    }
}

// User 类
public class User {
    private String name;
    private int age;
    private String email;

    // 必须提供默认构造函数
    public User() {}

    // Getter 和 Setter 方法
    // toString() 方法
}
```

## 3. 核心功能详解

### 3.1 消息生产

#### 3.1.1 同步发送

```java
@Service
public class SyncProducerService {

    private final PulsarTemplate<String> pulsarTemplate;

    public SyncProducerService(PulsarTemplate<String> pulsarTemplate) {
        this.pulsarTemplate = pulsarTemplate;
    }

    public MessageId sendSyncMessage(String topic, String message) {
        try {
            return pulsarTemplate.send(topic, message);
        } catch (PulsarClientException e) {
            throw new RuntimeException("Failed to send message", e);
        }
    }
}
```

#### 3.1.2 异步发送

```java
@Service
public class AsyncProducerService {

    private final PulsarTemplate<String> pulsarTemplate;

    public AsyncProducerService(PulsarTemplate<String> pulsarTemplate) {
        this.pulsarTemplate = pulsarTemplate;
    }

    public CompletableFuture<MessageId> sendAsyncMessage(String topic, String message) {
        return pulsarTemplate.sendAsync(topic, message);
    }
}
```

#### 3.1.3 发送带属性的消息

```java
@Service
public class MessageWithPropertiesService {

    private final PulsarTemplate<String> pulsarTemplate;

    public MessageWithPropertiesService(PulsarTemplate<String> pulsarTemplate) {
        this.pulsarTemplate = pulsarTemplate;
    }

    public void sendMessageWithProperties(String topic, String message) {
        MessageBuilder<String> messageBuilder = MessageBuilder
            .withPayload(message)
            .setProperty("key1", "value1")
            .setProperty("key2", "value2")
            .setKey("message-key");

        pulsarTemplate.send(topic, messageBuilder.build());
    }
}
```

### 3.2 消息消费

#### 3.2.1 基本消费模式

```java
@Service
public class BasicConsumerService {

    // 基本字符串消息消费
    @PulsarListener(
        subscriptionName = "basic-subscription",
        topics = "basic-topic"
    )
    public void consumeStringMessage(String message) {
        System.out.println("Received: " + message);
    }

    // 消费带消息元数据
    @PulsarListener(
        subscriptionName = "metadata-subscription",
        topics = "metadata-topic"
    )
    public void consumeMessageWithMetadata(String message,
                                          org.apache.pulsar.client.api.Message<?> pulsarMessage) {
        System.out.println("Received message: " + message);
        System.out.println("Message ID: " + pulsarMessage.getMessageId());
        System.out.println("Publish time: " + pulsarMessage.getPublishTime());
        System.out.println("Properties: " + pulsarMessage.getProperties());
    }

    // 批量消息消费
    @PulsarListener(
        subscriptionName = "batch-subscription",
        topics = "batch-topic",
        batch = true
    )
    public void consumeBatchMessages(List<String> messages) {
        System.out.println("Received " + messages.size() + " messages");
        messages.forEach(System.out::println);
    }
}
```

#### 3.2.2 消费确认模式

```java
@Service
public class AckModeConsumerService {

    // 自动确认（默认）
    @PulsarListener(
        subscriptionName = "auto-ack-subscription",
        topics = "auto-ack-topic",
        ackMode = AckMode.AUTO
    )
    public void autoAckMessage(String message) {
        // 消息处理成功后自动确认
    }

    // 手动确认
    @PulsarListener(
        subscriptionName = "manual-ack-subscription",
        topics = "manual-ack-topic",
        ackMode = AckMode.MANUAL
    )
    public void manualAckMessage(String message,
                                Acknowledgment acknowledgment) {
        try {
            // 处理业务逻辑
            processMessage(message);
            // 手动确认消息
            acknowledgment.acknowledge();
        } catch (Exception e) {
            // 处理失败，可以选择重试或记录日志
            acknowledgment.nacknowledge();
        }
    }

    private void processMessage(String message) {
        // 业务处理逻辑
    }
}
```

### 3.3 Schema 管理

#### 3.3.1 内置 Schema 类型

```java
@Service
public class SchemaConsumerService {

    // JSON Schema
    @PulsarListener(
        subscriptionName = "json-schema-subscription",
        topics = "json-topic",
        schemaType = SchemaType.JSON
    )
    public void consumeJsonMessage(User user) {
        System.out.println("Received user: " + user);
    }

    // AVRO Schema
    @PulsarListener(
        subscriptionName = "avro-schema-subscription",
        topics = "avro-topic",
        schemaType = SchemaType.AVRO
    )
    public void consumeAvroMessage(AvroUser user) {
        System.out.println("Received Avro user: " + user);
    }

    // Protobuf Schema
    @PulsarListener(
        subscriptionName = "protobuf-schema-subscription",
        topics = "protobuf-topic",
        schemaType = SchemaType.PROTOBUF
    )
    public void consumeProtobufMessage(ProtobufUser user) {
        System.out.println("Received Protobuf user: " + user);
    }
}

// Avro 用户类
@org.apache.avro.specific.AvroGenerated
public class AvroUser {
    private String name;
    private int age;
    private String email;
    // Getter 和 Setter
}

// Protobuf 用户类（需要 protobuf 依赖）
// 通常通过 .proto 文件生成
```

#### 3.3.2 自定义 Schema

```java
@Configuration
public class CustomSchemaConfiguration {

    @Bean
    public SchemaResolver customSchemaResolver() {
        return new DefaultSchemaResolver();
    }

    @Bean
    public SchemaCustomizer<User> userSchemaCustomizer() {
        return (schema, messageSpec) -> {
            if (schema.getSchemaInfo().getType() == SchemaType.JSON) {
                // 自定义 JSON Schema 配置
            }
        };
    }
}

@Service
public class CustomSchemaService {

    private final PulsarTemplate<User> pulsarTemplate;

    public CustomSchemaService(PulsarTemplate<User> pulsarTemplate) {
        this.pulsarTemplate = pulsarTemplate;
    }

    public void sendWithCustomSchema(String topic, User user) {
        pulsarTemplate.send(topic, user,
            SchemaType.JSON,
            builder -> builder.property("custom-property", "value"));
    }
}
```

## 4. 高级特性

### 4.1 事务支持

```java
@Configuration
@EnableTransactionManagement
public class TransactionConfig {

    @Bean
    public PulsarTransactionManager pulsarTransactionManager(
        PulsarClient pulsarClient) {
        return new PulsarTransactionManager(pulsarClient);
    }
}

@Service
public class TransactionalService {

    private final PulsarTemplate<String> pulsarTemplate;
    private final JdbcTemplate jdbcTemplate;

    public TransactionalService(PulsarTemplate<String> pulsarTemplate,
                               JdbcTemplate jdbcTemplate) {
        this.pulsarTemplate = pulsarTemplate;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void processInTransaction(String topic, String message) {
        // 1. 写入数据库
        jdbcTemplate.update("INSERT INTO messages (content) VALUES (?)", message);

        // 2. 发送消息（在同一个事务中）
        pulsarTemplate.send(topic, message);

        // 如果任何操作失败，整个事务将回滚
    }
}
```

### 4.2 响应式编程支持

```java
@Service
public class ReactivePulsarService {

    private final ReactivePulsarTemplate<String> reactivePulsarTemplate;

    public ReactivePulsarService(ReactivePulsarTemplate<String> reactivePulsarTemplate) {
        this.reactivePulsarTemplate = reactivePulsarTemplate;
    }

    public Mono<MessageId> sendReactiveMessage(String topic, String message) {
        return reactivePulsarTemplate.send(topic, message);
    }

    public Flux<Message<String>> consumeReactiveMessages(String topic, String subscription) {
        return reactivePulsarTemplate
            .receive(topic, subscription)
            .doOnNext(message -> {
                System.out.println("Received: " + message.getValue());
                message.acknowledge();
            })
            .onErrorResume(e -> {
                System.err.println("Error occurred: " + e.getMessage());
                return Mono.empty();
            });
    }
}

@Configuration
public class ReactivePulsarConfig {

    @Bean
    public ReactiveMessageListenerContainer<String> reactiveListener(
        ReactivePulsarTemplate<String> template) {

        return template.messageListener(
            "reactive-topic",
            "reactive-subscription",
            message -> {
                System.out.println("Reactive message: " + message.getValue());
                return Mono.just(message).then();
            }
        );
    }
}
```

### 4.3 死信队列（Dead Letter Topic）

```java
@Service
public class DeadLetterService {

    @PulsarListener(
        subscriptionName = "dlq-subscription",
        topics = "main-topic",
        deadLetterPolicy = @DeadLetterPolicy(
            maxRedeliverCount = 3,
            deadLetterTopic = "dlq-topic"
        )
    )
    public void processWithDlq(String message) {
        try {
            // 业务处理逻辑
            processBusinessLogic(message);
        } catch (Exception e) {
            // 处理失败，消息将被重试，超过最大重试次数后进入死信队列
            throw new RuntimeException("Processing failed", e);
        }
    }

    @PulsarListener(
        subscriptionName = "dlq-handler-subscription",
        topics = "dlq-topic"
    )
    public void handleDeadLetterMessages(String message,
                                        org.apache.pulsar.client.api.Message<?> pulsarMessage) {
        System.out.println("Received dead letter message: " + message);
        System.out.println("Original topic: " + pulsarMessage.getTopicName());
        System.out.println("Redelivery count: " + pulsarMessage.getRedeliveryCount());

        // 处理死信消息：记录日志、人工干预、重新投递等
    }
}
```

### 4.4 重试策略

```java
@Configuration
public class RetryConfig {

    @Bean
    public RetryTopicConfiguration retryTopicConfiguration() {
        return RetryTopicConfiguration.builder()
            .maxDeliveryAttempts(5)
            .initialRetryDelay(Duration.ofSeconds(1))
            .maxRetryDelay(Duration.ofMinutes(10))
            .retryDelayMultiplier(2.0)
            .retryTopicSuffix("-retry")
            .deadLetterTopicSuffix("-dlq")
            .build();
    }
}

@Service
public class RetryService {

    @PulsarListener(
        subscriptionName = "retry-subscription",
        topics = "main-topic",
        retryTopic = @RetryTopic(
            maxAttempts = 5,
            delay = 1000
        )
    )
    public void processWithRetry(String message) {
        // 业务处理，失败时会自动重试
        if (shouldRetry(message)) {
            throw new RuntimeException("Temporary failure, should retry");
        }
        processMessage(message);
    }

    private boolean shouldRetry(String message) {
        // 判断是否需要重试的逻辑
        return Math.random() < 0.3; // 30% 概率模拟失败
    }
}
```

## 5. 最佳实践

### 5.1 性能优化

#### 5.1.1 生产者优化

```java
@Configuration
public class ProducerOptimizationConfig {

    @Bean
    public ProducerFactoryCustomizer<String> producerCustomizer() {
        return factory -> {
            factory.setBatchingEnabled(true);
            factory.setBatchingMaxMessages(1000);
            factory.setBatchingMaxPublishDelay(10, TimeUnit.MILLISECONDS);
            factory.setCompressionType(CompressionType.LZ4);
            factory.setBlockIfQueueFull(true);
            factory.setMaxPendingMessages(10000);
        };
    }
}

@Service
public class OptimizedProducerService {

    private final PulsarTemplate<String> pulsarTemplate;

    public OptimizedProducerService(PulsarTemplate<String> pulsarTemplate) {
        this.pulsarTemplate = pulsarTemplate;
    }

    public void sendOptimizedMessage(String topic, String message) {
        // 使用 Key 共享确保相同 Key 的消息路由到同一个分区
        pulsarTemplate.send(topic, message, builder -> {
            builder.key("message-key-" + message.hashCode() % 10);
        });
    }
}
```

#### 5.1.2 消费者优化

```java
@Configuration
public class ConsumerOptimizationConfig {

    @Bean
    public ConsumerFactoryCustomizer<String> consumerCustomizer() {
        return factory -> {
            factory.setReceiverQueueSize(1000);
            factory.setAckTimeout(30, TimeUnit.SECONDS);
            factory.setSubscriptionType(SubscriptionType.Shared);
            factory.setAckReceiptEnabled(true);
        };
    }
}

@Service
public class OptimizedConsumerService {

    @PulsarListener(
        subscriptionName = "optimized-subscription",
        topics = "optimized-topic",
        concurrency = "5", // 并发消费者数量
        subscriptionType = SubscriptionType.Shared,
        ackTimeout = "30s"
    )
    public void optimizedConsume(String message) {
        // 并行处理消息
        processInParallel(message);
    }
}
```

### 5.2 监控与指标

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, pulsar
  metrics:
    export:
      prometheus:
        enabled: true
  endpoint:
    health:
      show-details: always

spring:
  pulsar:
    metrics:
      enabled: true
      tags:
        application: my-app
        environment: production
```

```java
@Configuration
public class MonitoringConfig {

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config().commonTags(
            "application", "spring-pulsar-app",
            "region", "us-east-1"
        );
    }
}

@Service
public class MonitoredService {

    private final Counter messageCounter;
    private final Timer processingTimer;

    public MonitoredService(MeterRegistry meterRegistry) {
        this.messageCounter = meterRegistry.counter("pulsar.messages.processed");
        this.processingTimer = meterRegistry.timer("pulsar.processing.time");
    }

    @PulsarListener(subscriptionName = "monitored-subscription", topics = "monitored-topic")
    public void monitoredConsume(String message) {
        Timer.Sample sample = Timer.start();

        try {
            processMessage(message);
            messageCounter.increment();
        } finally {
            sample.stop(processingTimer);
        }
    }
}
```

### 5.3 安全配置

```yaml
# application.yml
spring:
  pulsar:
    client:
      service-url: pulsar+ssl://pulsar-cluster:6651
      auth:
        plugin-class-name: org.apache.pulsar.client.impl.auth.AuthenticationToken
        params:
          token: '${PULSAR_TOKEN:}'
      tls:
        trust-certs-file-path: '/path/to/ca.crt'
        hostname-verification: true
        allow-insecure-connection: false
```

```java
@Configuration
public class SecurityConfig {

    @Bean
    public PulsarClientBuilderCustomizer securityCustomizer() {
        return builder -> {
            try {
                Authentication auth = AuthenticationFactory
                    .token("your-auth-token");
                builder.authentication(auth);

                builder.allowTlsInsecureConnection(false);
                builder.enableTlsHostnameVerification(true);
            } catch (PulsarClientException e) {
                throw new RuntimeException("Security configuration failed", e);
            }
        };
    }
}
```

### 5.4 错误处理与重试

```java
@Configuration
public class ErrorHandlingConfig {

    @Bean
    public PulsarListenerErrorHandler pulsarListenerErrorHandler() {
        return (message, exception) -> {
            System.err.println("Error processing message: " + message.getPayload());
            System.err.println("Exception: " + exception.getMessage());

            // 可以根据异常类型决定处理策略
            if (exception instanceof BusinessException) {
                // 业务异常，可能不需要重试
                return PulsarListenerErrorHandler.Result.reject();
            } else if (exception instanceof TemporaryException) {
                // 临时异常，应该重试
                return PulsarListenerErrorHandler.Result.retry();
            }

            // 默认行为
            return PulsarListenerErrorHandler.Result.fail();
        };
    }
}

@Service
public class RobustConsumerService {

    @PulsarListener(
        subscriptionName = "robust-subscription",
        topics = "robust-topic",
        errorHandler = "pulsarListenerErrorHandler"
    )
    public void robustConsume(String message) {
        // 业务处理，错误会被 errorHandler 捕获
        processMessage(message);
    }
}
```

## 6. 生产环境部署

### 6.1 高可用配置

```yaml
# application-prod.yml
spring:
  pulsar:
    client:
      service-url: pulsar://pulsar-node1:6650,pulsar-node2:6650,pulsar-node3:6650
      operation-timeout: 30s
      connection-timeout: 10s
      keep-alive-interval: 30s
    producer:
      send-timeout: 15s
      access-mode: Shared
    consumer:
      receiver-queue-size: 1000
      acknowledge-timeout: 30s
    listener:
      concurrency: 10
      max-threads: 50
```

### 6.2 资源管理

```java
@Configuration
public class ResourceManagementConfig {

    @Bean
    public PulsarClientBuilderCustomizer resourceCustomizer() {
        return builder -> {
            builder.memoryLimit(64, SizeUnit.MEGABYTES);
            builder.ioThreads(8);
            builder.connectionsPerBroker(5);
            builder.statsInterval(60, TimeUnit.SECONDS);
        };
    }

    @Bean
    public ThreadPoolTaskExecutor pulsarTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("pulsar-executor-");
        executor.initialize();
        return executor;
    }
}
```

### 6.3 健康检查

```java
@Component
public class CustomHealthIndicator implements HealthIndicator {

    private final PulsarClient pulsarClient;

    public CustomHealthIndicator(PulsarClient pulsarClient) {
        this.pulsarClient = pulsarClient;
    }

    @Override
    public Health health() {
        try {
            // 检查 Pulsar 连接状态
            pulsarClient.getPartitionsForTopic("persistent://public/default/health-check")
                .get(5, TimeUnit.SECONDS);

            return Health.up()
                .withDetail("service", "pulsar")
                .withDetail("status", "connected")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("service", "pulsar")
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

## 7. 常见问题与解决方案

### 7.1 连接问题

**问题**: 无法连接到 Pulsar 集群

**解决方案**:

```yaml
spring:
  pulsar:
    client:
      service-url: pulsar://localhost:6650
      connection-timeout: 10s
      operation-timeout: 30s
    admin:
      service-url: http://localhost:8080
      request-timeout: 30s
```

### 7.2 性能问题

**问题**: 消息处理速度慢

**解决方案**:

```java
@Configuration
public class PerformanceConfig {

    @Bean
    public ConsumerFactoryCustomizer<String> performanceCustomizer() {
        return factory -> {
            factory.setReceiverQueueSize(2000);
            factory.setAckTimeout(60, TimeUnit.SECONDS);
        };
    }

    @Bean
    public ProducerFactoryCustomizer<String> producerPerformanceCustomizer() {
        return factory -> {
            factory.setBatchingEnabled(true);
            factory.setBatchingMaxMessages(2000);
            factory.setBatchingMaxPublishDelay(5, TimeUnit.MILLISECONDS);
        };
    }
}
```

### 7.3 内存问题

**问题**: 内存使用过高

**解决方案**:

```java
@Configuration
public class MemoryConfig {

    @Bean
    public PulsarClientBuilderCustomizer memoryCustomizer() {
        return builder -> {
            builder.memoryLimit(128, SizeUnit.MEGABYTES);
            builder.maxPendingMessagesAcrossPartitions(50000);
        };
    }
}
```

## 8. 总结

Spring for Apache Pulsar 提供了一个强大而灵活的框架，用于在 Spring 应用程序中集成 Apache Pulsar。通过合理的配置和最佳实践，可以构建高性能、可靠的消息处理系统。

### 8.1 关键要点

1. **合理配置生产者和消费者**：根据业务需求调整批处理、超时和重试策略
2. **使用适当的 Schema**：根据数据类型选择合适的 Schema 类型
3. **实现健壮的错误处理**：配置死信队列和重试机制
4. **监控和指标**：集成监控系统以便及时发现和解决问题
5. **安全配置**：在生产环境中启用适当的安全措施

### 8.2 后续学习资源

- <https://pulsar.apache.org/docs/>
- <https://spring.io/projects/spring-pulsar>
- <https://pulsar.apache.org/docs/client-libraries-best-practices/>

通过本文档的学习，您应该能够熟练地在 Spring 应用程序中使用 Apache Pulsar，并能够根据具体业务需求进行适当的配置和优化。
