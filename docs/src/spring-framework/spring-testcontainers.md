---
title: Spring 框架 Testcontainers 测试详解与最佳实践
description: 本文深入探讨了 Spring 框架中 Testcontainers 的集成与最佳实践，内容涵盖基础概念、环境配置、基本用法、高级特性以及在持续集成环境中的应用。
author: zhycn
---

# Spring 框架 Testcontainers 测试详解与最佳实践

本文深入探讨了 Spring 框架中 Testcontainers 的集成与最佳实践，内容涵盖基础概念、环境配置、基本用法、高级特性以及在持续集成环境中的应用。

- [Testcontainers 官方网站](https://www.testcontainers.org/)
- [Testcontainers GitHub 仓库](https://github.com/testcontainers/testcontainers-java)

## 1. Testcontainers 简介

Testcontainers 是一个开源框架，用于提供轻量级的一次性 Docker 容器实例，这些实例可以运行数据库、消息代理、Web 浏览器或任何可在 Docker 容器中运行的服务。它与 JUnit 集成，允许开发人员在测试中启动和管理容器，从而为集成测试提供真实的环境。

### 1.1 核心价值

- **环境一致性**：测试环境与生产环境高度一致，避免因环境差异导致的测试误差。
- **测试隔离性**：每个测试套件或测试类都可以拥有独立的容器实例，确保测试之间互不干扰。
- **简化依赖管理**：无需在本地安装复杂的中间件，所有依赖通过 Docker 镜像提供。
- **自动化管理**：测试结束后自动清理容器实例，避免资源残留。

### 1.2 工作原理

Testcontainers 利用 Docker 的 API 来启动、管理和停止容器。在测试生命周期中，它会在测试开始时启动容器，并在测试结束后自动停止和移除容器，确保每次测试都在干净的环境中进行。

## 2. 环境准备与依赖配置

### 2.1  prerequisites

- **Docker 环境**：本地或远程 Docker 引擎（需配置 `DOCKER_HOST` 环境变量指向 Docker 守护进程）。
- **Java 开发环境**：JDK 11 或更高版本。
- **构建工具**：Maven 或 Gradle。

### 2.2 Maven 依赖配置

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers-bom</artifactId>
            <version>1.21.3</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <!-- Spring Boot Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- Testcontainers 核心库 -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>testcontainers</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- JUnit 5 集成 -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- 数据库容器模块（按需添加） -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>postgresql</artifactId>
        <scope>test</scope>
    </dependency>
    
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>mysql</artifactId>
        <scope>test</scope>
    </dependency>
    
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>mssqlserver</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- Redis 容器模块 -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>redis</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- Kafka 容器模块 -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>kafka</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 2.3 Gradle 依赖配置

```groovy
plugins {
    id 'org.springframework.boot' version '3.4.0' // 或更高版本
    id 'io.spring.dependency-management' version '1.1.0'
}

dependencies {
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.testcontainers:testcontainers'
    testImplementation 'org.testcontainers:junit-jupiter'
    testImplementation 'org.testcontainers:postgresql'
    testImplementation 'org.testcontainers:mysql'
    // 其他模块...
}

dependencyManagement {
    imports {
        mavenBom "org.testcontainers:testcontainers-bom:1.19.0"
    }
}
```

## 3. Spring Boot 与 Testcontainers 集成

### 3.1 传统配置方式（Spring Boot 3.1 之前）

在 Spring Boot 3.1 之前，需要使用 `@DynamicPropertySource` 注解手动配置容器属性：

```java
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class UserRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
    }

    @Test
    void shouldSaveUser() {
        // 测试代码
    }
}
```

### 3.2 现代配置方式（Spring Boot 3.1+）

Spring Boot 3.1 引入了 `@ServiceConnection` 注解，极大简化了配置：

```java
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class UserRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Test
    void shouldSaveUser() {
        // 测试代码
        // Spring Boot 会自动配置 DataSource 连接到容器化的 PostgreSQL
    }
}
```

`@ServiceConnection` 自动检测容器类型并注册相应的连接属性，支持多种数据库和中间件，包括 PostgreSQL、MySQL、Redis、Kafka 等。

## 4. 常用容器类型与示例

### 4.1 数据库容器

#### PostgreSQL 示例

```java
@Testcontainers
@SpringBootTest
class PostgresIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgresql = new PostgreSQLContainer<>("postgres:15");

    @Autowired
    private DataSource dataSource;

    @Test
    void connectionEstablished() throws SQLException {
        assertThat(dataSource.getConnection().isValid(1000)).isTrue();
        assertThat(postgresql.isRunning()).isTrue();
    }
}
```

#### MySQL 示例

```java
@Testcontainers
@SpringBootTest
class MySqlIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldCreateTable() {
        jdbcTemplate.execute("CREATE TABLE test (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))");
        // 更多测试逻辑
    }
}
```

### 4.2 Redis 容器

```java
@Testcontainers
@SpringBootTest
class RedisTest {

    @Container
    @ServiceConnection
    static RedisContainer redisContainer = new RedisContainer("redis:7.0-alpine");

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Test
    void shouldSaveKeyValue() {
        redisTemplate.opsForValue().set("key", "value");
        assertThat(redisTemplate.opsForValue().get("key")).isEqualTo("value");
    }
}
```

### 4.3 Kafka 容器

```java
@Testcontainers
@SpringBootTest
class KafkaTest {

    @Container
    @ServiceConnection
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.3.0"));

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Test
    void shouldSendMessage() throws InterruptedException {
        kafkaTemplate.send("test-topic", "key", "value");
        // 断言和验证逻辑
    }
}
```

### 4.4 自定义容器

对于不支持 `@ServiceConnection` 的容器，可以使用 `GenericContainer` 并手动配置属性：

```java
@Testcontainers
@SpringBootTest
class CustomContainerTest {

    @Container
    static GenericContainer<?> customContainer = new GenericContainer<>("custom-image:latest")
        .withExposedPorts(8080)
        .withEnv("ENV_VAR", "value");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("custom.service.host", customContainer::getHost);
        registry.add("custom.service.port", customContainer::getFirstMappedPort);
    }

    @Test
    void shouldConnectToCustomService() {
        // 测试逻辑
    }
}
```

## 5. 高级用法与最佳实践

### 5.1 测试数据管理

#### 5.1.1 使用 @Sql 初始化数据

```java
@Testcontainers
@SpringBootTest
class DataInitializationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgresql = new PostgreSQLContainer<>("postgres:15");

    @Autowired
    private UserRepository userRepository;

    @Test
    @Sql(scripts = "/test-data.sql") // 执行 SQL 脚本初始化数据
    void shouldCountUsers() {
        assertThat(userRepository.count()).isEqualTo(5);
    }
}
```

#### 5.1.2 使用 @Transactional 回滚测试数据

```java
@Testcontainers
@SpringBootTest
@Transactional // 测试结束后自动回滚事务
class TransactionalTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgresql = new PostgreSQLContainer<>("postgres:15");

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldSaveAndRollback() {
        User user = new User("test@example.com");
        userRepository.save(user);
        assertThat(userRepository.count()).isEqualTo(1);
        // 测试结束后数据自动回滚，不影响其他测试
    }
}
```

### 5.2 容器重用与性能优化

#### 5.2.1 容器复用

Testcontainers 支持容器复用（需要配置 `testcontainers.reuse.enable=true`）：

```java
@Testcontainers
@SpringBootTest
class ContainerReuseTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgresql = new PostgreSQLContainer<>("postgres:15")
        .withReuse(true); // 启用容器复用

    // 测试方法...
}
```

#### 5.2.2 静态容器共享

使用静态容器在多个测试类间共享：

```java
// 基类定义容器
@Testcontainers
abstract class BaseIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgresql = new PostgreSQLContainer<>("postgres:15");
}

// 测试类继承基类
class UserRepositoryTest extends BaseIntegrationTest {
    // 测试方法...
}

class ProductRepositoryTest extends BaseIntegrationTest {
    // 测试方法...
}
```

### 5.3 开发环境中的 Testcontainers

Spring Boot 3.1+ 支持在开发环境中使用 Testcontainers：

1\. **创建测试配置**

```java
@TestConfiguration(proxyBeanMethods = false)
public class DevTestcontainersConfig {

    @Bean
    @ServiceConnection
    public PostgreSQLContainer<?> postgreSQLContainer() {
        return new PostgreSQLContainer<>("postgres:15");
    }
    
    @Bean
    @ServiceConnection
    public RedisContainer redisContainer() {
        return new RedisContainer("redis:7.0-alpine");
    }
}
```

2\. **创建测试主类**

```java
public class TestMyApplication {

    public static void main(String[] args) {
        SpringApplication.from(MyApplication::main)
            .with(DevTestcontainersConfig.class)
            .run(args);
    }
}
```

3\. **使用 @RestartScope 避免容器重启**

```java
@TestConfiguration(proxyBeanMethods = false)
public class DevTestcontainersConfig {

    @Bean
    @ServiceConnection
    @RestartScope // 开发工具重启时保持容器运行
    public PostgreSQLContainer<?> postgreSQLContainer() {
        return new PostgreSQLContainer<>("postgres:15").withReuse(true);
    }
}
```

### 5.4 测试策略与分层

遵循测试金字塔原则，合理使用 Testcontainers：

- **单元测试**：不使用 Testcontainers，专注于单个组件或类的测试。
- **集成测试**：使用 `@DataJpaTest`、`@JsonTest` 等切片测试，配合 Testcontainers 验证组件集成。
- **端到端测试**：使用 `@SpringBootTest` 完整启动应用，配合 Testcontainers 模拟真实环境。

#### 切片测试示例

```java
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositorySliceTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgresql = new PostgreSQLContainer<>("postgres:15");

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldFindByEmail() {
        // 测试仓库逻辑
    }
}
```

## 6. 持续集成中的 Testcontainers

### 6.1 GitHub Actions 配置

```yaml
name: CI with Testcontainers

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      docker:
        image: docker:dind
        options: --privileged

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
        
    - name: Setup Docker
      run: |
        sudo apt-get update
        sudo apt-get install -y docker.io
        sudo systemctl start docker
        
    - name: Run tests with Testcontainers
      run: ./mvnw test -Dspring.profiles.active=test
      env:
        DOCKER_HOST: tcp://localhost:2375
```

### 6.2 镜像缓存优化

在 CI 中预拉取常用镜像加速测试：

```yaml
- name: Pre-pull Testcontainers images
  run: |
    docker pull postgres:15
    docker pull redis:7.0-alpine
    docker pull confluentinc/cp-kafka:7.3.0
    # 其他常用镜像...
```

## 7. 常见问题与解决方案

### 7.1 容器启动超时

增加容器启动超时时间：

```java
@Container
static PostgreSQLContainer<?> postgresql = new PostgreSQLContainer<>("postgres:15")
    .withStartupTimeout(Duration.ofMinutes(5));
```

### 7.2 端口冲突

Testcontainers 通常自动选择空闲端口，但可手动指定：

```java
@Container
static GenericContainer<?> customContainer = new GenericContainer<>("custom-service:latest")
    .withExposedPorts(8080)
    .withCreateContainerCmdModifier(cmd -> cmd.withHostConfig(
        new HostConfig().withPortBindings(
            new PortBinding(Ports.Binding.bindPort(18080), new ExposedPort(8080))
        )
    ));
```

### 7.3 资源清理

确保测试结束后清理资源：

```java
@AfterEach
void tearDown() {
    // 必要时手动清理资源
}

@AfterAll
static void stopContainer() {
    // 必要时手动停止容器
}
```

### 7.4 网络问题

处理公司网络中的 Docker 镜像拉取问题：

```java
@Container
static PostgreSQLContainer<?> postgresql = new PostgreSQLContainer<>(
    DockerImageName.parse("private.registry/postgres:15")
        .asCompatibleSubstituteFor("postgres"));
```

## 8. 总结

Testcontainers 为 Spring Boot 应用程序提供了强大的集成测试能力，允许开发人员在真实环境中测试组件集成，而无需模拟外部依赖。Spring Boot 3.1+ 通过 `@ServiceConnection` 注解进一步简化了 Testcontainers 的配置和使用。

### 8.1 核心优势

1. **环境一致性**：测试环境与生产环境高度一致，减少环境相关的问题。
2. **简化配置**：Spring Boot 3.1+ 提供自动配置，减少样板代码。
3. **广泛的生态系统**：支持多种数据库和中间件容器。
4. **开发体验**：支持开发环境中的容器使用，提高开发效率。

### 8.2 适用场景

1. **集成测试**：验证组件与外部服务的集成。
2. **数据访问层测试**：使用真实数据库测试 Repository 和 ORM 映射。
3. **端到端测试**：完整应用流程测试。
4. **本地开发**：替代本地安装的中间件，简化开发环境配置。

### 8.3 注意事项

1. **测试速度**：容器启动会增加测试执行时间，合理使用容器复用和测试分层。
2. **资源消耗**：同时运行多个容器可能消耗大量内存和 CPU 资源。
3. **网络依赖**：在 CI/CD 环境中需要确保 Docker 守护进程可用。

通过遵循本文介绍的最佳实践，您可以构建可靠、高效且维护性良好的测试套件，确保 Spring Boot 应用程序的质量和稳定性。

## 附录：常用容器配置参考

| **容器类型**       | **依赖**                      | **镜像示例**     | **Spring Boot 3.1+ 支持** |
| ------------------ | ----------------------------- | ---------------- | ------------------------- |
| PostgreSQL         | testcontainers-postgresql     | postgres:15      | 是                       |
| MySQL              | testcontainers-mysql          | mysql:8.0        | 是                       |
| MariaDB            | testcontainers-mariadb        | mariadb:10.6     | 是                       |
| Redis              | testcontainers-redis          | redis:7.0-alpine | 是                       |
| Kafka              | testcontainers-kafka          | confluentinc/cp-kafka:7.3.0 | 是          |
| MongoDB            | testcontainers-mongodb        | mongo:6.0        | 是                       |
| Oracle XE          | testcontainers-oracle-xe      | gvenzl/oracle-xe:21-slim | 是           |
| Elasticsearch      | testcontainers-elasticsearch  | elasticsearch:8.6.0 | 是                     |

> 注意：本文中的代码示例基于 Spring Boot 3.1+ 和 Testcontainers 1.18+ 版本。在使用时，请确保您的项目依赖版本与示例兼容。
