---
title: Spring 框架 AssertJ 测试详解与最佳实践
description: 本文深入探讨了 Spring 框架中 AssertJ 的集成与最佳实践，内容涵盖基础概念、环境配置、基本用法、高级特性以及在持续集成环境中的应用。
author: zhycn
---

# Spring 框架 AssertJ 测试详解与最佳实践

作为 Spring 开发者，编写高质量的测试是保证代码质量的关键。AssertJ 作为一个流式断言库，能显著提升测试代码的可读性和维护性。本文将全面介绍如何在 Spring 框架中使用 AssertJ 进行测试。

- AssertJ 官方文档：<https://assertj.github.io/doc/>

## 1. AssertJ 概述

AssertJ 是一个开源的、社区驱动的 Java 测试断言库，提供了流畅的 API 来编写清晰且表达力强的测试断言。其核心优势在于提供了**流式 API**（Fluent API），使得断言代码更易于编写和阅读。

### 1.1 主要特性

- **流畅的 API 设计**：支持方法链式调用，代码可读性高
- **丰富的断言方法**：支持对象、集合、日期、异常等多种数据类型
- **详细的错误信息**：测试失败时提供清晰的错误信息
- **扩展性强**：支持模块化扩展，如 AssertJ-DB 用于数据库断言

### 1.2 添加依赖

在 Maven 项目中添加依赖：

```xml
<!-- Spring Boot Test -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

Spring Boot 项目通常已经包含了 AssertJ，无需手动添加。

## 2. AssertJ 核心功能

### 2.1 基本断言

使用 `assertThat()` 方法开始断言链：

```java
import static org.assertj.core.api.Assertions.*;

// 字符串断言
assertThat("Hello World")
    .isNotEmpty()
    .hasSize(11)
    .contains("Hello")
    .doesNotContain("Hola");

// 数字断言
assertThat(42)
    .isPositive()
    .isEven()
    .isBetween(40, 50);

// 布尔断言
assertThat("".isEmpty()).isTrue();
```

### 2.2 集合断言

```java
List<String> fruits = Arrays.asList("apple", "orange", "banana");

assertThat(fruits)
    .hasSize(3)
    .contains("apple", "orange")
    .doesNotContain("grape")
    .startsWith("apple")
    .endsWith("banana")
    .doesNotHaveDuplicates();

// Map 断言
Map<String, Integer> fruitPrices = new HashMap<>();
fruitPrices.put("apple", 100);
fruitPrices.put("orange", 200);

assertThat(fruitPrices)
    .hasSize(2)
    .containsKey("apple")
    .containsValue(100)
    .containsEntry("orange", 200);
```

### 2.3 对象断言

```java
public class Person {
    private String name;
    private int age;
    private String email;
    
    // 构造方法、getter 和 setter 省略
}

Person person = new Person("John Doe", 30, "john@example.com");

assertThat(person)
    .isNotNull()
    .hasFieldOrProperty("name")
    .hasFieldOrPropertyWithValue("age", 30)
    .extracting("name", "age") // 提取多个属性
    .containsExactly("John Doe", 30);

// 比较两个对象
Person person1 = new Person("John Doe", 30, "john@example.com");
Person person2 = new Person("John Doe", 30, "john@example.com");

assertThat(person1).isEqualToComparingFieldByField(person2);
```

### 2.4 异常断言

```java
// 验证代码块是否抛出异常
assertThatThrownBy(() -> {
    throw new IOException("File not found");
})
    .isInstanceOf(IOException.class)
    .hasMessageContaining("File not found");

// 另一种方式
assertThatExceptionOfType(IOException.class)
    .isThrownBy(() -> { throw new IOException("File not found"); })
    .withMessage("File not found")
    .withNoCause();
```

## 3. Spring 与 AssertJ 集成

### 3.1 单元测试与集成测试

在 Spring 测试中，我们需要区分单元测试和集成测试：

| 测试类型 | 特点 | 适用场景 |
|---------|------|---------|
| 单元测试 | 不加载 Spring 上下文，完全隔离，执行速度快 | 测试单个类或方法 |
| 集成测试 | 加载部分或全部 Spring 上下文，执行速度较慢 | 测试组件间协作 |

### 3.2 Spring MVC 控制器测试

使用 `@WebMvcTest` 注解测试 MVC 控制器：

```java
@ExtendWith(SpringExtension.class)
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;
    
    @MockitoBean
    private UserService userService;
    
    @Test
    void getUserById_ShouldReturnUser() throws Exception {
        User mockUser = new User(1L, "John Doe");
        when(userService.findById(1L)).thenReturn(mockUser);
        
        mockMvc.perform(get("/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John Doe"));
            
        // 使用 AssertJ 验证服务调用
        verify(userService, times(1)).findById(1L);
        assertThat(mockUser.getName()).isEqualTo("John Doe");
    }
}
```

### 3.3 数据库访问层测试

使用 `@DataJpaTest` 注解测试 JPA 仓库：

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;
    
    @Test
    void findByEmail_ShouldReturnUser() {
        // 准备数据
        User user = new User("John Doe", "john@example.com");
        userRepository.save(user);
        
        // 执行查询
        Optional<User> foundUser = userRepository.findByEmail("john@example.com");
        
        // 使用 AssertJ 断言
        assertThat(foundUser)
            .isPresent()
            .hasValueSatisfying(u -> {
                assertThat(u.getName()).isEqualTo("John Doe");
                assertThat(u.getEmail()).isEqualTo("john@example.com");
            });
    }
}
```

### 3.4 完整集成测试

使用 `@SpringBootTest` 进行完整集成测试：

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApplicationIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void contextLoads() {
        // 确保应用上下文加载成功
    }
    
    @Test
    void getUserById_ShouldReturnUser() {
        ResponseEntity<User> response = restTemplate.getForEntity("/users/1", User.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
            .isNotNull()
            .hasFieldOrPropertyWithValue("name", "John Doe");
    }
}
```

## 4. AssertJ 最佳实践

### 4.1 避免不必要的断言

不要过度使用 NPE 检查，AssertJ 的断言已经包含了 null 检查：

```java
// 不良做法
@Test
public void getMessage() {
    assertThat(service).isNotNull(); // 不必要的断言
    assertThat(service.getMessage()).isEqualTo("Hello world!");
}

// 推荐做法
@Test
public void getMessage() {
    assertThat(service.getMessage()).isEqualTo("Hello world!");
}
```

当 `service` 为 null 时，两种方式都会失败，但推荐做法更简洁且能提供足够的错误信息。

### 4.2 断言值而非结果

避免断言中间结果，直接断言关心的值：

```java
// 不良做法
assertThat(argument.contains("o")).isTrue();
assertThat(result instanceof String).isTrue();

// 推荐做法
assertThat(argument).contains("o");
assertThat(result).isInstanceOf(String.class);
```

这样能提供更清晰的错误信息。

### 4.3 组合相关断言

将相关断言组合在一起，提高测试可读性：

```java
// 不良做法
assertThat(result).hasSize(5);
var country = result.get(0);
assertThat(country.getName()).isEqualTo("Spain");
assertThat(country.getCities().stream().map(City::getName)).contains("Barcelona");

// 推荐做法
assertThat(result)
    .hasSize(5)
    .singleElement()
    .satisfies(c -> {
        assertThat(c.getName()).isEqualTo("Spain");
        assertThat(c.getCities().stream().map(City::getName)).contains("Barcelona");
    });
```

使用 `satisfies()` 方法可以将多个相关断言组合在一起，提高代码可读性。

### 4.4 使用自定义错误消息

为断言提供描述性消息，便于调试：

```java
@Test
void shouldHaveCorrectAge() {
    Person person = new Person("John", 25);
    
    assertThat(person.getAge())
        .as("%s's age should be between 20 and 30", person.getName())
        .isBetween(20, 30);
}
```

当测试失败时，会显示自定义的错误消息。

### 4.5 测试数据管理

使用 `@Transactional` 和 `@Sql` 注解管理测试数据：

```java
@DataJpaTest
@Transactional
@Sql("/test-data/users.sql")
class UserRepositoryTest {

    @Test
    void shouldReturnActiveUsers() {
        List<User> activeUsers = userRepository.findActiveUsers();
        
        assertThat(activeUsers)
            .hasSize(2)
            .extracting(User::getName)
            .containsExactly("John Doe", "Jane Smith");
    }
}
```

使用 `@Transactional` 确保测试后数据回滚，保持测试独立性。

## 5. 高级技巧与异常处理

### 5.1 软断言

软断言（Soft Assertions）允许收集多个断言失败，而不是在第一个失败时就停止：

```java
@Test
void softAssertionsExample() {
    SoftAssertions softly = new SoftAssertions();
    
    String name = "John Doe";
    softly.assertThat(name).startsWith("J"); // 通过
    softly.assertThat(name).hasSize(8);      // 失败，但继续执行
    softly.assertThat(name).contains("Do");  // 通过
    softly.assertThat(name).endsWith("e");   // 通过
    
    // 必须调用assertAll()来报告所有失败
    softly.assertAll();
}
```

### 5.2 自定义断言

创建自定义断言提高测试表达力：

```java
// 自定义断言类
public class UserAssert extends AbstractAssert<UserAssert, User> {
    
    public UserAssert(User actual) {
        super(actual, UserAssert.class);
    }
    
    public static UserAssert assertThat(User actual) {
        return new UserAssert(actual);
    }
    
    public UserAssert hasFullName(String expectedFullName) {
        isNotNull();
        
        String actualFullName = actual.getFirstName() + " " + actual.getLastName();
        
        if (!actualFullName.equals(expectedFullName)) {
            failWithMessage("Expected user's full name to be <%s> but was <%s>", 
                expectedFullName, actualFullName);
        }
        
        return this;
    }
}

// 使用自定义断言
@Test
void shouldHaveCorrectFullName() {
    User user = new User("John", "Doe");
    UserAssert.assertThat(user).hasFullName("John Doe");
}
```

### 5.3 异常处理最佳实践

```java
@Test
void whenInvalidInput_thenThrowsException() {
    // 验证异常类型和消息
    assertThatThrownBy(() -> userService.createUser(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("User must not be null");
        
    // 验证异常属性
    assertThatExceptionOfType(ResourceNotFoundException.class)
        .isThrownBy(() -> userService.findById(999L))
        .withMessage("User with id 999 not found")
        .withNoCause();
}
```

## 6. 与 Mockito 配合使用

AssertJ 与 Mockito 配合使用可以创建强大的测试：

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void shouldCreateUser() {
        User user = new User("John Doe", "john@example.com");
        when(userRepository.save(any(User.class))).thenReturn(user);
        
        User createdUser = userService.createUser(user);
        
        // 验证方法调用
        verify(userRepository, times(1)).save(user);
        
        // 使用 AssertJ 断言
        assertThat(createdUser)
            .isNotNull()
            .hasFieldOrPropertyWithValue("name", "John Doe")
            .hasFieldOrPropertyWithValue("email", "john@example.com");
    }
}
```

## 7. 总结

AssertJ 是一个功能强大、表达力强的断言库，可以显著提高 Spring 应用程序测试代码的质量和可读性。通过遵循本文介绍的最佳实践，你可以编写更简洁、更维护性更好的测试代码。

### 7.1 关键要点

1. **优先使用 AssertJ 流式断言**而不是 JUnit 的传统断言，以提高代码可读性
2. **合理选择测试策略**：单元测试使用 Mockito + AssertJ，集成测试使用 Spring TestContext + AssertJ
3. **避免过度断言**：信任 AssertJ 的断言已经包含了必要的检查
4. **组合相关断言**：使用 `satisfies()` 等方法将相关断言组合在一起
5. **使用软断言**当需要验证多个条件时
6. **合理管理测试数据**：使用 `@Transactional` 和 `@Sql` 保持测试独立性

通过掌握 AssertJ 和 Spring 测试技术，你将能够构建更加健壮和可维护的应用程序。
