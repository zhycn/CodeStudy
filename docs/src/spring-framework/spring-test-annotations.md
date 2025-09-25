---
title: Spring Boot 3.x 测试注解完全指南
description: 详细介绍了 Spring Boot 3.x 中测试注解的使用，包括环境准备、基础配置、核心测试注解等。
author: zhycn
---

# Spring Boot 3.x 测试注解完全指南

- [Testing](https://docs.spring.io/spring-framework/reference/testing.html)
- [Standard Annotation Support](https://docs.spring.io/spring-framework/reference/testing/annotations/integration-standard.html)
- [Spring Testing Annotations](https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring.html)
- [Spring JUnit Jupiter Testing Annotations](https://docs.spring.io/spring-framework/reference/testing/annotations/integration-junit-jupiter.html)
- [Meta-Annotation Support for Testing](https://docs.spring.io/spring-framework/reference/testing/annotations/integration-meta.html)
- [Spring Boot 测试切片](https://docs.spring.io/spring-boot/appendix/test-auto-configuration/slices.html)

## 1 环境准备与基础配置

### 1.1 添加测试依赖

在 Spring Boot 3.x 项目中，测试支持由 `spring-boot-starter-test` 依赖提供。它包含了 JUnit 5、Mockito、AssertJ、Hamcrest 和 JSONassert 等测试库。在 Maven 项目的 `pom.xml` 中添加以下依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

### 1.2 测试类基本结构

Spring Boot 3.x 默认使用 JUnit 5，并且不需要显式添加 `@ExtendWith(SpringExtension.class)`，因为 `@SpringBootTest` 已经包含了必要的配置。

```java
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest // 启动完整的 Spring Boot 应用上下文
class BasicApplicationTests {

    @Test
    void contextLoads() {
        // 基本测试方法：验证应用上下文是否成功加载
    }
}
```

## 2 核心测试注解详解

### 2.1 集成测试注解 `@SpringBootTest`

`@SpringBootTest` 是 Spring Boot 集成测试的核心注解，它会加载完整的应用程序上下文，模拟真实的运行时环境。

**常用属性：**

- `webEnvironment`：定义 Web 环境配置
  - `WebEnvironment.MOCK`：加载 Web 应用上下文并提供模拟的 Servlet 环境（默认值）
  - `WebEnvironment.RANDOM_PORT`：加载嵌入式 Servlet 容器并在随机端口上运行
  - `WebEnvironment.DEFINED_PORT`：使用配置文件中定义的端口
  - `WebEnvironment.NONE`：不提供任何 Servlet 环境
- `classes`：显式指定要使用的配置类

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class IntegrationTestExample {

    @Test
    void testWithRealServer() {
        // 测试使用随机端口启动的真实服务器环境
    }
}
```

### 2.2 分层测试（切片测试）注解

Spring Boot 提供了一系列切片测试注解，用于精准测试应用的特定层面，从而提高测试效率。

#### 2.2.1 `@WebMvcTest` - 控制器层测试

`@WebMvcTest` 注解专注于 Web MVC 组件，只会初始化控制器、相关配置和 MockMvc，不会加载服务层和仓库层的组件。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class) // 指定要测试的控制器
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc; // 自动配置 MockMvc

    @MockitoBean // 模拟服务层依赖
    private UserService userService;

    @Test
    void getUser_ShouldReturnUser() throws Exception {
        // 准备模拟数据
        User mockUser = new User(1L, "testUser");
        when(userService.getUserById(1L)).thenReturn(mockUser);

        // 执行请求并验证结果
        mockMvc.perform(get("/api/users/1"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.name").value("testUser"));
    }
}
```

#### 2.2.2 `@DataJpaTest` - 持久层测试

`@DataJpaTest` 专注于 JPA 组件测试，会自动配置内存数据库（如 H2），并注入 `TestEntityManager` 用于数据库操作。

```java
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUsername_WhenExists_ReturnUser() {
        // 准备数据
        User user = new User("testUser");
        entityManager.persist(user);
        entityManager.flush();

        // 执行查询并验证
        User found = userRepository.findByUsername("testUser");
        assertThat(found.getUsername()).isEqualTo("testUser");
    }
}
```

#### 2.2.3 其他切片测试注解

Spring Boot 还提供了其他有用的切片测试注解：

- `@JsonTest`：用于测试 JSON 序列化和反序列化，自动配置 Jackson `ObjectMapper`
- `@RestClientTest`：用于测试 REST 客户端，如 `RestTemplate`
- `@DataJdbcTest`：用于测试 Spring Data JDBC 仓库

### 2.3 测试注解对比表

下表总结了 Spring Boot 3.x 中主要的测试注解及其用途：

| **注解**          | **测试范围** | **自动配置组件**                 | **适用场景**                 |
| ----------------- | ------------ | -------------------------------- | ---------------------------- |
| `@SpringBootTest` | 完整应用     | 所有 Bean                        | 集成测试、多组件协作测试     |
| `@WebMvcTest`     | Web MVC 层   | 控制器、过滤器、MVC 相关配置     | 控制器层测试、HTTP 接口验证  |
| `@DataJpaTest`    | JPA 持久层   | 实体管理器、仓库接口、内存数据库 | 数据库操作测试、JPA 查询验证 |
| `@JsonTest`       | JSON 序列化  | Jackson ObjectMapper             | JSON 序列化/反序列化测试     |
| `@RestClientTest` | REST 客户端  | REST 模板、Mock 服务器           | REST 客户端组件测试          |

## 3 测试数据管理与事务控制

### 3.1 使用 `@Transactional` 实现自动回滚

在集成测试中，`@Transactional` 注解可以确保每个测试方法执行后事务自动回滚，避免测试数据污染数据库。

```java
@SpringBootTest
@Transactional // 测试方法执行后自动回滚事务
class TransactionalServiceTest {

    @Autowired
    private UserService userService;

    @Test
    void createUser_WithValidData_ShouldPersist() {
        User user = new User("testUser");
        User savedUser = userService.createUser(user);

        assertThat(savedUser.getId()).isNotNull();
        // 测试结束后，数据操作会自动回滚
    }
}
```

### 3.2 使用 `@Sql` 初始化测试数据

`@Sql` 注解用于在测试方法执行前运行 SQL 脚本，准备测试数据。

```java
@SpringBootTest
class SqlInitializationTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @Sql(scripts = "/test-data/users.sql") // 执行 SQL 脚本初始化数据
    @Sql(scripts = "/test-data/cleanup.sql", executionPhase = AFTER_TEST_METHOD) // 测试后清理
    void getUserCount_ShouldReturnCorrectCount() {
        long count = userRepository.count();
        assertThat(count).isEqualTo(3); // 假设 users.sql 插入了 3 条记录
    }
}
```

### 3.3 测试数据库方案选择

根据测试需求，可以选择不同的数据库方案：

| **方案**       | **优点**           | **缺点**              | **适用场景**                 |
| -------------- | ------------------ | --------------------- | ---------------------------- |
| H2 内存数据库  | 快速，无需外部依赖 | 与生产数据库语法差异  | 单元测试、简单集成测试       |
| Testcontainers | 真实数据库环境     | 需要 Docker，启动较慢 | 集成测试、需要真实数据库功能 |
| 生产数据库副本 | 完全一致的环境     | 数据污染风险          | 端到端测试、预生产环境测试   |

## 4 Mock 技术与依赖隔离

### 4.1 使用 `@MockitoBean` 和 `@MockitoSpyBean`

Spring Boot 提供了 `@MockitoBean` 和 `@MockitoSpyBean` 注解，用于在测试中模拟或监视依赖对象。

- `@MockitoBean`：创建一个 Mockito mock 对象，并替换 Spring 上下文中的同名 Bean
- `@MockitoSpyBean`：创建一个 Mockito spy 对象，部分模拟真实对象的行为

```java
@WebMvcTest(UserController.class)
class MockBeanTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean // 创建模拟的 UserService
    private UserService userService;

    @Test
    void getUser_WhenNotExists_ShouldReturn404() throws Exception {
        // 配置模拟行为：当查询不存在的用户时返回空
        when(userService.getUserById(999L)).thenReturn(Optional.empty());

        // 执行请求并验证响应
        mockMvc.perform(get("/api/users/999"))
               .andExpect(status().isNotFound());
    }
}
```

### 4.2 Mockito 常用方法

在测试中，可以使用 Mockito 的方法来配置模拟对象的行为：

| **方法**              | **描述**                   | **示例**                                                                   |
| --------------------- | -------------------------- | -------------------------------------------------------------------------- |
| `when().thenReturn()` | 设置方法调用返回值         | `when(userService.getUserById(1L)).thenReturn(user)`                       |
| `when().thenThrow()`  | 设置方法调用抛出异常       | `when(userService.getUserById(1L)).thenThrow(new UserNotFoundException())` |
| `verify()`            | 验证方法是否被调用         | `verify(userService, times(1)).getUserById(1L)`                            |
| `@InjectMocks`        | 将 mock 对象注入到被测试类 | `@InjectMocks private UserService userService`                             |

## 5 测试断言与验证策略

### 5.1 JUnit 5 断言

JUnit 5 提供了 `Assertions` 类，包含多种断言方法：

```java
@Test
void basicAssertions() {
    // 相等断言
    assertEquals(expected, actual);

    // 为空断言
    assertNull(object);
    assertNotNull(object);

    // 条件断言
    assertTrue(condition);
    assertFalse(condition);

    // 异常断言
    assertThrows(ExceptionClass.class, () -> {
        // 可能抛出异常的代码
    });

    // 超时断言
    assertTimeout(Duration.ofSeconds(1), () -> {
        // 应在指定时间内完成的代码
    });
}
```

### 5.2 AssertJ 流式断言

Spring Boot 默认集成 AssertJ，提供更优雅的流式断言语法：

```java
@Test
void assertJExamples() {
    String name = "Spring Boot";

    // 字符串断言
    assertThat(name).isNotBlank()
                   .startsWith("Spring")
                   .endsWith("Boot")
                   .hasSize(10);

    // 集合断言
    List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
    assertThat(names).isNotEmpty()
                    .hasSize(3)
                    .contains("Alice")
                    .doesNotContain("David");

    // 对象断言
    User user = new User("testUser");
    assertThat(user).isNotNull()
                   .hasFieldOrProperty("username")
                   .hasFieldOrPropertyWithValue("username", "testUser");
}
```

### 5.3 MockMvc 结果验证

使用 `MockMvc` 测试 Web 层时，可以链式调用验证方法：

```java
mockMvc.perform(get("/api/users/1")) // 执行 GET 请求
       .andExpect(status().isOk()) // 验证状态码为 200
       .andExpect(content().contentType(MediaType.APPLICATION_JSON)) // 验证内容类型
       .andExpect(jsonPath("$.username").value("testUser")) // 验证 JSON 内容
       .andExpect(header().string("X-Custom-Header", "value")) // 验证响应头
       .andDo(print()); // 打印请求和响应详细信息（用于调试）
```

## 6 测试配置与环境隔离

### 6.1 使用 `@TestConfiguration` 提供测试配置

`@TestConfiguration` 用于定义测试专用的配置，可以覆盖主应用的某些 Bean 定义。

```java
@SpringBootTest
class TestConfigurationExample {

    @Autowired
    private UserService userService;

    @TestConfiguration // 测试专用配置
    static class Config {
        @Bean
        @Primary // 优先使用此 Bean
        public UserRepository testUserRepository() {
            return new TestUserRepository(); // 返回测试专用的实现
        }
    }

    @Test
    void testWithCustomConfiguration() {
        // 使用测试配置中的 Bean 进行测试
    }
}
```

### 6.2 使用 `@DynamicPropertySource` 动态配置属性

`@DynamicPropertySource` 用于动态注入测试所需的属性值，特别适合与 Testcontainers 等工具配合使用。

```java
@SpringBootTest
@Testcontainers
class DynamicPropertySourceExample {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:13");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Test
    void testWithDynamicDatabase() {
        // 使用动态配置的数据库进行测试
    }
}
```

### 6.3 使用 `@ActiveProfiles` 激活测试配置

`@ActiveProfiles` 注解用于指定测试时激活的 Spring 配置文件。

```java
@SpringBootTest
@ActiveProfiles("test") // 激活 application-test.properties 配置文件
class ProfileBasedTest {

    @Test
    void testWithTestProfile() {
        // 使用测试环境的配置进行测试
    }
}
```

## 7 最佳实践与常见陷阱

### 7.1 测试金字塔原则

遵循测试金字塔原则，合理分配不同层次的测试比例：

- **70% 单元测试**：使用 Mockito 等工具直接测试单个类或方法，不加载 Spring 上下文
- **20% 集成测试**：使用 `@SpringBootTest` 验证多组件协作
- **10% 端到端测试**：使用 Testcontainers 等工具进行完整系统流程测试

### 7.2 测试隔离性与可重复性

确保每个测试都是独立且可重复执行的：

- 使用 `@Transactional` 确保测试数据不会持久化
- 避免测试间的依赖和顺序假设
- 使用 `@BeforeEach` 和 `@AfterEach` 为每个测试方法设置初始状态和清理

### 7.3 性能优化技巧

提高测试执行速度的技巧：

- **上下文缓存**：相同配置的测试类会共享应用上下文
- **懒加载配置**：在 `application-test.properties` 中设置 `spring.main.lazy-initialization=true`
- **切片测试**：使用 `@WebMvcTest`、`@DataJpaTest` 等注解代替全量启动

### 7.4 常见问题与解决方案

| **问题/错误**                       | **原因分析**          | **解决方案**                                  |
| ----------------------------------- | --------------------- | --------------------------------------------- |
| `NoSuchBeanDefinitionException`     | 未正确 Mock 依赖 Bean | 添加 `@MockitoBean` 或 `@MockitoSpyBean` 注解 |
| `LazyInitializationException`       | 事务边界问题          | 添加 `@Transactional` 注解                    |
| `ApplicationContext not configured` | 测试配置加载失败      | 检查 `@SpringBootTest` 参数或主配置类         |
| 测试执行缓慢                        | 加载了不必要的组件    | 使用切片测试替代全上下文测试                  |

## 8 总结

Spring Boot 3.x 提供了一套全面而强大的测试工具链，通过合理的注解使用和策略选择，可以构建高效、可靠的测试体系。关键要点包括：

1. **正确选择测试类型**：根据测试目标选择合适的测试注解，单元测试使用 Mockito，集成测试使用 `@SpringBootTest`，切片测试使用 `@WebMvcTest`、`@DataJpaTest` 等。
2. **管理测试数据**：利用 `@Transactional` 实现自动回滚，使用 `@Sql` 初始化测试数据，确保测试的独立性和可重复性。
3. **优化测试性能**：通过上下文缓存、懒加载和切片测试减少测试启动时间。
4. **隔离外部依赖**：使用 `@MockitoBean` 和 `@MockitoSpyBean` 模拟外部依赖，聚焦于当前组件的测试。

遵循这些实践和模式，将帮助你构建健壮、可维护的测试套件，为 Spring Boot 应用程序的质量保驾护航。
