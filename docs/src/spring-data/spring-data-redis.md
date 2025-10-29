---
title: Spring Data Redis 详解与最佳实践
description: 详细介绍了 Spring Data Redis 的核心概念、架构、配置和使用最佳实践。
author: zhycn
---

# Spring Data Redis 详解与最佳实践

## 1. 概述

Spring Data Redis 是 Spring Data 家族的一部分，它提供了对 Redis 这一流行内存数据结构的简单配置和访问。它抽象了底层交互，让开发者能更专注于业务逻辑，而非底层样板代码。通过它，你可以轻松地使用 Redis 作为缓存、数据库或消息代理。

### 1.1 核心价值

- **简化模板代码**： 封装了与 Redis 服务器交互的常见操作，提供了高度抽象的 `RedisTemplate` 和响应式支持的 `ReactiveRedisTemplate`。
- **丰富的序列化支持**： 支持多种序列化策略（JDK、JSON、String 等），并可自定义。
- **无缝集成**： 与 Spring 框架无缝集成，支持声明式注解（如 `@Cacheable`）实现缓存。
- **异常转换**： 将 Redis 客户端的检查异常转换为 Spring 的 `DataAccessException` 层次结构中的非检查异常。
- **发布/订阅模型**： 简化了消息监听容器的创建和消息的发布/订阅。

### 1.2 版本说明

本文基于以下版本进行编写，建议使用 Spring Boot 2.x 或 3.x 以获取最佳特性和支持。

- **Spring Boot**: 3.2.0
- **Spring Data Redis**: 3.2.0

## 2. 核心概念与架构

### 2.1 关键组件

| 组件                         | 说明                                                                                     |
| :--------------------------- | :--------------------------------------------------------------------------------------- |
| **`RedisConnection`**        | 封装了 Redis 客户端（如 Lettuce、Jedis）的连接，提供最底层的通信 API。                   |
| **`RedisConnectionFactory`** | 用于创建 `RedisConnection` 的工厂。Spring Data Redis 通过它来获取与 Redis 服务器的连接。 |
| **`RedisTemplate`**          | 核心类，提供了高级抽象和丰富的操作集。它处理序列化、连接管理和异常转换。                 |
| **`OpsForX` 系列**           | `RedisTemplate` 的方法，提供类型化操作接口（如 `opsForValue()`, `opsForList()`）。       |
| **`Repository` 支持**        | 类似于 Spring Data JPA，支持基于接口自动实现 Redis 数据访问层。                          |

### 2.2 架构图

```bash
+-------------------+    +-----------------------+
|   Your Service    |    |   @Cacheable, @CacheEvict  |
+-------------------+    +-----------------------+
           |                           |
           |                           v
   +-----------------------------------------------+
   |              Spring Data Redis               |
   | +---------------------+ +-------------------+ |
   | |   RedisTemplate     | |  ReactiveRedisTpl | |
   | +---------------------+ +-------------------+ |
   | | - Serializer        | | - Serializer      | |
   | | - Connection Mgmt   | | - Connection Mgmt | |
   | +---------------------+ +-------------------+ |
   +-----------------------------------------------+
                           |
                           v
         +-----------------------------------+
         |       RedisConnectionFactory      |
         | (LettuceConnectionFactory / Jedis)|
         +-----------------------------------+
                           |
                           v
                     +-----------+
                     |  Redis   |
                     |  Server  |
                     +-----------+
```

## 3. 项目配置与依赖

### 3.1 添加 Maven 依赖

Spring Boot 通过 Starter 极大地简化了依赖管理。

```xml
<!-- 对于 Spring Boot 3.x -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
    <version>3.2.0</version>
</dependency>

<!-- 默认使用 Lettuce，如果需要 Jedis，排除 Lettuce 并添加 Jedis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
    <exclusions>
        <exclusion>
            <groupId>io.lettuce</groupId>
            <artifactId>lettuce-core</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
</dependency>
```

### 3.2 基础配置 (application.yml)

在 `application.yml` 中配置 Redis 服务器连接信息。

```yaml
spring:
  data:
    redis:
      host: localhost # Redis 服务器地址
      port: 6379 # Redis 服务器端口
      password: mypass # 密码（如果没有，可省略）
      database: 0 # 数据库索引（0-15）
      # Lettuce 连接池配置 (如果你使用 Lettuce)
      lettuce:
        pool:
          max-active: 16 # 连接池最大连接数（负值表示无限制）
          max-idle: 8 # 连接池中的最大空闲连接
          min-idle: 0 # 连接池中的最小空闲连接
          max-wait: -1ms # 连接池最大阻塞等待时间（负值表示无限制）
      # Jedis 连接池配置 (如果你使用 Jedis)
      jedis:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 0
          max-wait: -1ms
```

### 3.3 Java 配置类

虽然 Spring Boot 会自动配置 `RedisTemplate` 和 `StringRedisTemplate`，但自定义配置可以让你更好地控制序列化器等行为。

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    /**
     * 自定义 RedisTemplate，使用 JSON 序列化器
     * 推荐使用此配置，可存储任意 Java 对象
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // 设置 Key 的序列化器为 StringRedisSerializer
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // 设置 Value 的序列化器为 GenericJackson2JsonRedisSerializer
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }
}
```

## 4. 核心操作与使用

Spring Data Redis 通过 `RedisTemplate` 和其衍生的 `*Operations` 接口提供数据操作。

### 4.1 注入 RedisTemplate

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    // 注入自定义的 RedisTemplate
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // 也可以注入默认的 StringRedisTemplate，它只处理 String 类型
    // @Autowired
    // private StringRedisTemplate stringRedisTemplate;
}
```

### 4.2 数据类型操作示例

#### 1. Strings (字符串)

```java
public void stringOperations() {
    // 设置值
    redisTemplate.opsForValue().set("user:1001:name", "Alice");
    redisTemplate.opsForValue().set("user:1001:age", 30, Duration.ofMinutes(10)); // 设置过期时间

    // 获取值
    String name = (String) redisTemplate.opsForValue().get("user:1001:name");
    Integer age = (Integer) redisTemplate.opsForValue().get("user:1001:age");

    // 原子递增/递减
    redisTemplate.opsForValue().increment("counter", 1L);
    redisTemplate.opsForValue().decrement("counter", 1L);
}
```

#### 2. Hashes (散列)

适合存储对象。

```java
public void hashOperations() {
    String key = "user:1001";

    // 存储一个 Map
    Map<String, Object> userMap = new HashMap<>();
    userMap.put("name", "Bob");
    userMap.put("age", 25);
    userMap.put("email", "bob@example.com");
    redisTemplate.opsForHash().putAll(key, userMap);

    // 设置过期时间（Hash 本身不支持过期时间，需对 key 操作）
    redisTemplate.expire(key, Duration.ofHours(1));

    // 获取特定字段
    String name = (String) redisTemplate.opsForHash().get(key, "name");

    // 获取整个对象
    Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
}
```

#### 3. Lists (列表)

```java
public void listOperations() {
    String key = "mylist";

    // 从左边/右边插入
    redisTemplate.opsForList().leftPush(key, "first");
    redisTemplate.opsForList().rightPush(key, "second");

    // 获取范围
    List<Object> range = redisTemplate.opsForList().range(key, 0, -1); // 获取所有元素

    // 弹出元素
    Object leftElement = redisTemplate.opsForList().leftPop(key);
}
```

#### 4. Sets (集合)

```java
public void setOperations() {
    String key = "myset";

    // 添加元素
    redisTemplate.opsForSet().add(key, "A", "B", "C", "A"); // 最终存储 A, B, C

    // 获取所有成员
    Set<Object> members = redisTemplate.opsForSet().members(key);

    // 判断是否是成员
    boolean isMember = redisTemplate.opsForSet().isMember(key, "A");
}
```

#### 5. Sorted Sets (有序集合)

```java
public void sortedSetOperations() {
    String leaderboard = "game:leaderboard";

    // 添加成员和分数
    redisTemplate.opsForZSet().add(leaderboard, "player1", 1000.0);
    redisTemplate.opsForZSet().add(leaderboard, "player2", 2000.0);

    // 获取排名（升序 0-indexed）
    Long rank = redisTemplate.opsForZSet().rank(leaderboard, "player1"); // 0
    // 获取反向排名（降序）
    Long reverseRank = redisTemplate.opsForZSet().reverseRank(leaderboard, "player1"); // 1

    // 获取分数范围内的成员
    Set<Object> topPlayers = redisTemplate.opsForZSet().reverseRange(leaderboard, 0, 2); // 获取前3名
}
```

## 5. 序列化策略详解

序列化是 Spring Data Redis 的核心概念，直接影响存储格式和性能。

| 序列化器                                 | 描述                                     | 优点                                                           | 缺点                                            |
| :--------------------------------------- | :--------------------------------------- | :------------------------------------------------------------- | :---------------------------------------------- |
| **`StringRedisSerializer`**              | 用于序列化 String 类型的 key 和 value。  | 人类可读，兼容性好。                                           | 只能处理 String。                               |
| **`JdkSerializationRedisSerializer`**    | JDK 原生序列化。                         | 可序列化任何 `Serializable` 对象。                             | 序列化后二进制不可读；不同 JVM 版本可能不兼容。 |
| **`Jackson2JsonRedisSerializer`**        | 使用 Jackson 库将对象序列化为 JSON。     | 人类可读；跨语言兼容。                                         | 存储类名信息，占用额外空间。                    |
| **`GenericJackson2JsonRedisSerializer`** | `Jackson2JsonRedisSerializer` 的增强版。 | **推荐使用**。在 JSON 中包含类类型信息，反序列化时无需指定类。 | 比 String 序列化占用稍多空间。                  |
| **`OxmSerializer`**                      | 用于 XML 序列化。                        | 标准 XML 格式。                                                | 冗长，效率低，不常用。                          |

**最佳实践：** 使用 `StringRedisSerializer` 序列化所有 Key，使用 `GenericJackson2JsonRedisSerializer` 序列化所有 Value。这在可读性、兼容性和功能上取得了最佳平衡。

## 6. 高级特性与应用

### 6.1 发布/订阅 (Pub/Sub)

#### 消息监听器

```java
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

@Component
public class RedisMessageListener implements MessageListener {

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel());
        String body = new String(message.getBody());
        System.out.println("Received message: " + body + " from channel: " + channel);
    }
}
```

#### 配置监听容器

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class RedisPubSubConfig {

    @Bean
    public RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        // 订阅频道 "news"
        container.addMessageListener(messageListener(), new ChannelTopic("news"));
        // 也可以使用模式匹配订阅
        // container.addMessageListener(messageListener(), new PatternTopic("news.*"));
        return container;
    }

    @Bean
    public MessageListenerAdapter messageListener() {
        return new MessageListenerAdapter(new RedisMessageListener());
    }
}
```

#### 发布消息

```java
@Service
public class NewsService {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public void publishNews(String news) {
        redisTemplate.convertAndSend("news", news); // 向 "news" 频道发布消息
    }
}
```

### 6.2 事务支持

Spring Data Redis 提供了 `SessionCallback` 和 `TransactionCallback` 接口来支持在同一个连接中执行多个命令。

```java
public void executeInTransaction() {
    // 使用 execute 方法和 SessionCallback
    List<Object> results = redisTemplate.execute(new SessionCallback<List<Object>>() {
        @Override
        public List<Object> execute(RedisOperations operations) throws DataAccessException {
            operations.multi(); // 开启事务
            operations.opsForValue().set("key1", "value1");
            operations.opsForValue().increment("key2");
            return operations.exec(); // 执行事务，返回结果列表
        }
    });
}
```

**注意：** Redis 事务不支持回滚。`MULTI` 和 `EXEC` 之间的命令会被作为一个原子操作顺序执行，但如果中间某条命令失败，后续命令仍会继续执行。

### 6.3 管道 (Pipelining)

管道用于一次性发送多个命令，减少网络往返次数 (RTT)，显著提升批量操作的性能。

```java
public void executeInPipeline() {
    List<Object> results = redisTemplate.executePiped(new SessionCallback<Object>() {
        @Override
        public Object execute(RedisOperations operations) throws DataAccessException {
            // 这些命令会被缓冲，最后一次性发送到服务器
            operations.opsForValue().set("pipeKey1", "value1");
            operations.opsForValue().increment("pipeKey2");
            operations.opsForValue().get("pipeKey1");
            return null; // 单个返回值通常为 null，结果从 executePiped 返回
        }
    });
    // results 包含每个命令的执行结果
}
```

### 6.4 脚本执行 (Lua Scripting)

使用 `RedisScript` 接口执行 Lua 脚本，实现复杂原子操作。

```java
public void useLuaScript() {
    // 定义 Lua 脚本（实现一个简单的限流）
    String luaScript = "local key = KEYS[1] " +
                       "local limit = tonumber(ARGV[1]) " +
                       "local current = tonumber(redis.call('get', key) or '0') " +
                       "if current + 1 > limit then " +
                       "   return 0 " +
                       "else " +
                       "   redis.call('INCRBY', key, 1) " +
                       "   redis.call('EXPIRE', key, 10) " + // 10秒后过期
                       "   return 1 " +
                       "end";

    DefaultRedisScript<Long> script = new DefaultRedisScript<>();
    script.setScriptText(luaScript);
    script.setResultType(Long.class); // 脚本返回值的类型

    // 执行脚本
    Long result = redisTemplate.execute(script, Collections.singletonList("rate.limit:user1"), 5); // KEY[1], ARGV[1]
    if (result == 1) {
        System.out.println("Allowed");
    } else {
        System.out.println("Rate limited");
    }
}
```

## 7. Spring Cache 抽象集成

Spring Data Redis 可以轻松作为 Spring Cache 的后端实现。

### 7.1 启用缓存支持

在主应用类上添加 `@EnableCaching` 注解。

```java
@SpringBootApplication
@EnableCaching
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 7.2 配置 Redis 缓存管理器

```java
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import java.time.Duration;

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 定义默认缓存配置（1小时过期，使用JSON序列化Value）
        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // 创建缓存管理器
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultCacheConfig)
                .withCacheConfiguration("users", this.getUserCacheConfig()) // 为特定缓存自定义配置
                .build();
    }

    private RedisCacheConfiguration getUserCacheConfig() {
        // 为用户缓存设置不同的TTL（10分钟）
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
    }
}
```

### 7.3 在业务层使用缓存注解

```java
@Service
public class UserService {

    @Cacheable(value = "users", key = "#id") // 方法结果将被缓存
    public User getUserById(Long id) {
        // 模拟耗时操作
        return userRepository.findById(id).orElse(null);
    }

    @CachePut(value = "users", key = "#user.id") // 方法总会执行，并用结果更新缓存
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    @CacheEvict(value = "users", key = "#id") // 执行后清除指定缓存
    public void deleteUserById(Long id) {
        userRepository.deleteById(id);
    }

    @CacheEvict(value = "users", allEntries = true) // 清除 'users' 缓存下的所有条目
    public void refreshAllUsers() {
        // ... 一些清理逻辑
    }
}
```

## 8. 最佳实践与常见陷阱

### 8.1 最佳实践

1. **连接池配置**： 生产环境务必配置连接池（Lettuce 或 Jedis），并根据负载调整 `max-active`、`max-idle` 等参数。
2. **Key 设计**：
   - **可读性**： 使用冒号 `:` 分隔的命名空间，如 `业务:子业务:ID:属性` (`user:1001:profile`)。
   - **简洁性**： Key 不宜过长以节省内存，但也要保证清晰。
3. **Value 序列化**： **强烈推荐使用 `GenericJackson2JsonRedisSerializer`**，避免使用 JDK 序列化。
4. **过期时间**： 为缓存数据设置合理的 TTL（生存时间），避免数据永不过期导致内存耗尽。
5. **管道与 Lua**： 批量操作使用管道，复杂原子操作使用 Lua 脚本。
6. **避免大 Key 和热 Key**： 单个 Key 的 Value 不宜过大（如超过 10KB），避免频繁访问同一个 Key（热 Key）导致单实例压力过大。

### 8.2 常见陷阱与解决方案

| 陷阱           | 现象/原因                                                   | 解决方案                                                                             |
| :------------- | :---------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **序列化错误** | 错误 `Cannot deserialize ...`，通常因序列化器不匹配导致。   | 确保读写使用相同的序列化策略。统一配置 `RedisTemplate`。                             |
| **连接耗尽**   | 出现 `Cannot get Jedis connection` 或 Lettuce 超时。        | 检查连接池配置；确保正确关闭连接（Spring 已管理）；检查 Redis 服务器最大连接数设置。 |
| **内存溢出**   | Redis 内存使用率持续走高。                                  | 为 Key 设置 TTL；监控大 Key 并优化数据结构（如使用散列拆分大对象）。                 |
| **缓存穿透**   | 查询一个必然不存在的数据（如不存在的 ID），请求直达数据库。 | 缓存空值（并设置短 TTL）；使用布隆过滤器。                                           |
| **缓存击穿**   | 某个热点 Key 过期瞬间，大量请求无法命中缓存，直达数据库。   | 使用互斥锁（如 Redis `SETNX`）或 Lua 脚本，只允许一个请求重建缓存。                  |
| **缓存雪崩**   | 大量 Key 在同一时间点过期，导致所有请求直达数据库。         | 为缓存过期时间添加随机值，避免同时失效。                                             |

## 9. 总结

Spring Data Redis 极大地简化了在 Spring 应用中集成和操作 Redis 的复杂度。通过合理的配置（特别是序列化策略）、善用其高级特性（Pub/Sub、事务、管道、Lua）以及与 Spring Cache 的完美融合，你可以构建出高性能、高可用的应用程序。

记住，没有银弹。在设计缓存策略时，务必考虑数据一致性、缓存更新策略以及上述的常见陷阱，才能发挥 Redis 的最大威力。
