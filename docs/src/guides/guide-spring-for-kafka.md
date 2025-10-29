---
title: Spring for Apache Kafka 详解与最佳实践
description: 本指南详细介绍了如何在 Spring Boot 项目中使用 Apache Kafka，包括核心概念、依赖配置、生产者、消费者、消息处理等内容。
---

# Spring for Apache Kafka 详解与最佳实践

- Spring for Apache Kafka: <https://spring.io/projects/spring-kafka>
- 官方文档：<https://docs.spring.io/spring-kafka/reference/>
- API 文档：<https://docs.spring.io/spring-kafka/docs/current/api/>
- Apache Kafka 官方文档：<https://kafka.apache.org/>

## 1. 引言

Apache Kafka 是一个分布式、高吞吐量、高可用的流处理平台，常用于构建实时数据管道和流式应用程序。 `Spring for Apache Kafka` 项目将 Spring 核心概念（如依赖注入、模板模式、监听器容器）应用于 Kafka 的使用中，极大地简化了 Kafka 生产者与消费者的开发复杂度，让开发者能更专注于业务逻辑。

本文基于 **Spring Boot 3.x** 和 **Spring Framework 6.x** 版本，对应的是 `Spring Kafka 3.x`，它提供了对 Java 17、 Jakarta EE 9+ 的全面支持，并与最新的 Kafka Client 库深度集成。

## 2. 核心概念与依赖配置

### 2.1 核心概念

- **Producer**: 消息生产者，向 Kafka 的 Topic 发送消息的客户端。
- **Consumer**: 消息消费者，从 Kafka 的 Topic 读取消息的客户端。
- **Topic**: 消息的主题类别，可以理解为一个消息队列。
- **Partition**: Topic 的分区，用于提供并行处理和水平扩展能力。每个分区都是一个有序、不可变的消息序列。
- **Consumer Group**: 消费者组，由多个 Consumer 实例组成，共同消费一个 Topic，每条消息只会被组内的一个消费者消费。

### 2.2 添加 Maven 依赖

在 Spring Boot 项目中，只需添加一个 `starter` 依赖即可。

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
    <version>3.1.2</version> <!-- 请使用最新版本 -->
</dependency>

<!-- 或者，更推荐的方式是使用 Spring Boot Starter Parent -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

### 2.3 基础配置 (`application.yml`)

在 `application.yml` 中配置 Kafka 集群地址和常用的生产者/消费者参数。

```yaml
spring:
  kafka:
    # Kafka 集群地址，多个用逗号分隔
    bootstrap-servers: localhost:9092

    # 生产者配置
    producer:
      # 消息键和值的序列化器
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
      # 消息发送的重试次数
      retries: 3
      # 生产者 accumulator 批量发送消息的延迟时间 (ms)
      linger-ms: 10
      # 批量发送消息的最大大小 (bytes)
      batch-size: 16384
      # 生产者内存缓冲区大小 (bytes)
      buffer-memory: 33554432

    # 消费者配置
    consumer:
      # 消息键和值的反序列化器
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      # 消费者组 ID，这是最重要的消费者配置之一
      group-id: my-group
      # 自动提交偏移量的开关
      enable-auto-commit: false
      # 自动提交偏移量的间隔时间
      auto-commit-interval: 100ms
      # 当没有初始偏移量或服务器上不再存在当前偏移量时的重置策略
      # earliest: 从最早的消息开始消费
      # latest: 从最新的消息开始消费 (默认)
      # none: 如果未找到消费者组的偏移量，则抛出异常
      auto-offset-reset: earliest

    # 监听器容器配置
    listener:
      # 监听器类型，single 为单条记录消费，batch 为批量消费
      type: single
      # 手动提交偏移量的模式
      # record: 每处理完一条记录后提交
      # batch: 处理完一批消息后提交 (默认)
      # time: 按时间间隔提交
      # count: 按处理的消息数量提交
      # 当 enable-auto-commit 为 false 时，此配置生效
      ack-mode: manual_immediate
```

## 3. 生产者 (Producer)

### 3.1 使用 `KafkaTemplate`

`KafkaTemplate` 是 Spring Kafka 提供的用于发送消息的核心工具类，它封装了 `KafkaProducer`，提供了简便的 API。

```java
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;

@Service
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;

    // 通过构造器注入 KafkaTemplate
    public KafkaProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * 发送消息到指定 Topic (异步)
     * @param topicName 主题名称
     * @param message 消息内容
     */
    public void sendMessage(String topicName, String message) {
        // send() 方法返回一个 CompletableFuture
        CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(topicName, message);

        // 添加回调，处理发送成功或失败后的逻辑
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                System.out.println("Sent message=[" + message +
                                  "] with offset=[" + result.getRecordMetadata().offset() + "]");
            } else {
                System.err.println("Unable to send message=[" +
                                   message + "] due to : " + ex.getMessage());
            }
        });
    }

    /**
     * 发送带有 Key 的消息
     * Key 用于决定消息被发送到 Topic 的哪个分区 (默认分区策略)
     */
    public void sendMessageWithKey(String topicName, String key, String value) {
        kafkaTemplate.send(topicName, key, value);
    }
}
```

### 3.2 同步发送

在某些场景下，我们需要确保消息成功发送后再进行后续操作，可以使用同步发送。

```java
public void sendMessageSynchronously(String topicName, String message) throws Exception {
    // 调用 get() 方法阻塞等待结果
    SendResult<String, String> result = kafkaTemplate.send(topicName, message).get();

    System.out.println("Sent message successfully to partition: " +
                       result.getRecordMetadata().partition());
}
```

**注意**: 同步发送会严重影响吞吐量，请谨慎使用。

### 3.3 生产者最佳实践

1. **合理配置批量发送 (Batching)**: 调整 `linger.ms` 和 `batch.size` 可以在高吞吐量和低延迟之间取得平衡。
2. **一定要处理发送失败**: 使用 `Callback` 或检查 `CompletableFuture` 的异常，并实现重试或告警逻辑。
3. **使用重试机制**: 配置 `retries` 和 `delivery.timeout.ms` 以应对网络抖动或 Broker Leader 选举等瞬时故障。
4. **为重要消息启用幂等和事务**: 在 `application.yml` 中设置 `spring.kafka.producer.transaction-id-prefix` 可以启用幂等生产者和事务，确保消息不丢不重。

## 4. 消费者 (Consumer)

### 4.1 `@KafkaListener` - 声明式消费

Spring Kafka 最强大的功能之一就是通过注解 `@KafkaListener` 以声明式的方式定义消费者，无需手动创建和调度消费者线程。

```java
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    /**
     * 监听单个 Topic，消费消息
     * @param message 消息体 (Payload)
     */
    @KafkaListener(topics = "my-topic", groupId = "my-group")
    public void listen(String message) {
        System.out.println("Received Message: " + message);
    }

    /**
     * 监听多个 Topic，并获取消息的元数据 (如 Header, Partition 等)
     */
    @KafkaListener(topics = {"my-topic", "another-topic"}, groupId = "my-group")
    public void listenWithMetadata(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            @Header(KafkaHeaders.RECEIVED_TIMESTAMP) long ts) {

        System.out.println(String.format("Received message from topic=%s, partition=%d, key=%s, timestamp=%d: %s",
                topic, partition, key, ts, message));
    }
}
```

### 4.2 手动提交偏移量 (Manual Ack)

为了精确控制消息的“至少一次”语义，建议禁用自动提交 (`enable-auto-commit: false`) 并采用手动提交。

```java
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Service
public class ManualAckConsumerService {

    /**
     * 手动提交偏移量
     * 需要在配置中设置 ack-mode: manual_immediate 或 manual
     */
    @KafkaListener(topics = "my-topic", groupId = "manual-ack-group")
    public void listenWithAck(String message, Acknowledgment ack) {
        try {
            // 处理业务逻辑
            System.out.println("Processing message: " + message);
            // 模拟业务处理
            Thread.sleep(1000);

            // 业务处理成功后，手动提交偏移量
            ack.acknowledge();
            System.out.println("Offset committed for: " + message);
        } catch (Exception e) {
            // 处理异常，偏移量将不会被提交，消息会被重新消费
            System.err.println("Processing failed, message will be retried: " + e.getMessage());
        }
    }
}
```

### 4.3 批量消费 (Batch Listening)

对于高吞吐场景，一次性处理一批消息可以极大提升效率。

**首先，修改配置以启用批量模式：**

```yaml
spring:
  kafka:
    listener:
      type: batch # 开启批量监听
    consumer:
      max-poll-records: 50 # 一次拉取的最大记录数
```

**然后，在监听器方法中接收 `List`：**

```java
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BatchConsumerService {

    @KafkaListener(topics = "my-batch-topic", groupId = "batch-group")
    public void listenBatch(List<String> messages, Acknowledgment ack) {
        System.out.println("Received batch of " + messages.size() + " messages");

        for (String message : messages) {
            // 处理批量中的每一条消息
            System.out.println("Processing: " + message);
        }

        // 整批消息处理完毕后，一次性提交偏移量
        ack.acknowledge();
    }
}
```

### 4.4 消费者最佳实践

1. **谨慎处理异常**: 使用 `try-catch` 包裹业务逻辑，决定是提交偏移量（消息处理成功）还是不提交（消息需要重试）。
2. **控制消费速率**: 合理配置 `max.poll.interval.ms` 和 `max.poll.records`，防止因为单次处理时间过长导致 Consumer 被踢出组而引发重复消费。
3. **死信队列 (DLQ)**: 使用 `@DltHandler` 处理无法正常消费的消息，将其路由到专门的死信 Topic 中进行后续分析和处理。

## 5. 序列化与反序列化 (SerDes)

Spring Kafka 内置了常用的 SerDes，如 String, Integer, JSON 等。

### 5.1 发送/接收 JSON 消息

**第一步：创建消息实体类**

```java
public class User {
    private String name;
    private Integer age;
    // 必须提供默认构造函数和 getter/setter 以供 Jackson 反序列化
    public User() {}
    public User(String name, Integer age) {
        this.name = name;
        this.age = age;
    }
    // ... getters and setters
}
```

**第二步：配置生产者与消费者的 JSON SerDes**

在配置类中声明一个 `JsonSerializer` 和 `JsonDeserializer` 的 Bean。

```java
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.*;

@Configuration
public class KafkaJsonConfig {

    @Bean
    public ProducerFactory<String, User> userProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        // ... 其他配置 (bootstrap-servers 等通常已在 application.yml 中配置)
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, User> userKafkaTemplate() {
        return new KafkaTemplate<>(userProducerFactory());
    }

    @Bean
    public ConsumerFactory<String, User> userConsumerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        // ... 其他配置
        configProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        // 指定反序列化目标类型，这是关键！
        configProps.put(JsonDeserializer.VALUE_DEFAULT_TYPE, "com.example.demo.model.User");
        // 信任所有包（仅用于开发测试，生产环境应指定具体包名）
        configProps.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        return new DefaultKafkaConsumerFactory<>(configProps);
    }
}
```

**第三步：发送和接收 JSON 消息**

```java
// Producer Service
@Service
public class UserProducerService {
    private final KafkaTemplate<String, User> userKafkaTemplate;

    public UserProducerService(KafkaTemplate<String, User> userKafkaTemplate) {
        this.userKafkaTemplate = userKafkaTemplate;
    }

    public void sendUser(User user) {
        userKafkaTemplate.send("user-topic", user);
    }
}

// Consumer Service
@Service
public class UserConsumerService {
    @KafkaListener(topics = "user-topic", groupId = "user-group",
                   containerFactory = "userConsumerFactory") // 指定使用自定义的 ContainerFactory
    public void consumeUser(User user) {
        System.out.println("Received user: " + user.getName() + ", age: " + user.getAge());
    }
}
```

## 6. 错误处理与重试

### 6.1 `DefaultErrorHandler`

Spring Kafka 提供了强大的错误处理器，可以替代旧的 `RetryTemplate`。

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.BackOff;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaErrorConfig {

    @Bean
    public DefaultErrorHandler errorHandler() {
        // 设置重试策略：重试 3 次，每次间隔 1 秒
        FixedBackOff fixedBackOff = new FixedBackOff(1000L, 3L);

        DefaultErrorHandler handler = new DefaultErrorHandler((record, exception) -> {
            // 这是所有重试耗尽后最终失败的回调
            System.err.println("Message processing failed after all retries: " + record.value());
            // 可以在这里记录日志、发送到死信队列等
        }, fixedBackOff); // 传入重试策略

        // 可以为特定的异常设置不重试，例如反序列化异常重试也无济于事
        handler.addNotRetryableExceptions(org.apache.kafka.common.errors.SerializationException.class);

        return handler;
    }
}
```

要使用这个错误处理器，需要在 `@KafkaListener` 容器工厂中设置它。

### 6.2 死信队列 (Dead Letter Topic - DLT)

对于始终无法处理的消息，可以将其发送到死信队列。

```java
@KafkaListener(topics = "main-topic", groupId = "dlt-group",
               containerFactory = "kafkaListenerContainerFactory") // 确保这个 ContainerFactory 配置了 DLT
public void listen(String in) {
    throw new RuntimeException("Failed to process: " + in);
}

// 处理死信队列中的消息
@KafkaListener(topics = "main-topic.DLT", groupId = "dlt-group")
public void dltListen(String in) {
    System.out.println("Received from DLT: " + in);
}
```

在配置中，需要创建一个带有 `DeadLetterPublishingRecoverer` 的 `DefaultErrorHandler` 来启用 DLT 功能。

## 7. 事务支持

Spring Kafka 提供了与 Spring 事务管理机制完美集成的事务支持。

**启用事务并发送事务性消息：**

```yaml
spring:
  kafka:
    producer:
      transaction-id-prefix: tx- # 启用事务支持
```

```java
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionalService {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public TransactionalService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional // 此注解会开启一个 Kafka 事务
    public void processInTransaction(String data) {
        // 执行一些数据库操作...
        // databaseRepository.save(...);

        // 发送 Kafka 消息，该操作将被包含在事务中
        kafkaTemplate.send("transaction-topic", data);

        // 如果这里抛出异常，数据库操作和 Kafka 消息发送都会回滚
    }
}
```

## 8. 监控与指标

Spring Kafka 与 Micrometer 深度集成，可以轻松暴露监控指标。

**1. 添加 Micrometer 依赖 (如 Prometheus)**

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

**2. 在 `application.yml` 中启用指标导出**

```yaml
management:
  endpoints:
    web:
      exposure:
        include: metrics, prometheus
```

启动应用后，访问 `/actuator/prometheus` 即可看到丰富的 Kafka 指标，如：

- `spring_kafka_template_record_send_total`： 消息发送次数
- `spring_kafka_listener_seconds`： 监听器处理消息的耗时

## 9. 总结

Spring for Apache Kafka 极大地简化了在 Spring 生态中使用 Kafka 的复杂度。通过本文，您应该了解了如何：

1. 配置生产者和消费者。
2. 使用 `KafkaTemplate` 发送消息和 `@KafkaListener` 消费消息。
3. 实现手动提交偏移量和批量消费。
4. 处理 JSON 格式的消息。
5. 配置错误重试和死信队列。
6. 使用事务确保数据一致性。
7. 监控 Kafka 客户端性能。

在生产环境中，请务必根据您的具体需求（吞吐量、延迟、一致性要求）仔细调整配置参数，并建立完善的监控和告警体系。
