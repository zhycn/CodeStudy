---
title: Spring JSONAssert 测试详解与最佳实践
description: 本文深入探讨了 Spring 框架中 JSONAssert 测试的核心概念、机制和最佳实践。内容涵盖了 JSONAssert 简介、核心特性、依赖配置、比较模式、基本用法等方面。
author: zhycn
---

# Spring JSONAssert 测试详解与最佳实践

## 1 JSONAssert 简介

JSONAssert 是一个专为编写 JSON 单元测试而设计的强大工具，特别适用于测试 RESTful API 接口。它通过比较字符串形式的 JSON 数据，在内部将其转换为 JSON 对象并进行逻辑结构和数据的比较。

### 1.1 核心特性

JSONAssert 提供以下主要特性：

- **灵活的比较模式**：支持多种比较模式，从严格模式到宽松模式
- **清晰的错误报告**：提供详细易懂的错误信息，帮助快速定位问题
- **递归比较**：能够深入比较嵌套的 JSON 对象结构
- **集合支持**：提供对 JSON 数组的强大比较功能
- **Spring 集成**：与 Spring Boot 测试框架无缝集成

### 1.2 依赖配置

在 Maven 项目中添加以下依赖即可开始使用 JSONAssert：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
    <!-- 版本由 spring-boot-starter-parent 管理 -->
```

对于 Gradle 项目，添加以下依赖：

```groovy
testImplementation 'org.springframework.boot:spring-boot-starter-test'
```

## 2 JSONAssert 核心功能

### 2.1 比较模式

JSONAssert 提供四种不同的比较模式，适应各种测试场景：

| 模式 | 允许额外字段 | 数组顺序严格 | 描述 |
|------|--------------|--------------|------|
| STRICT | 否 | 是 | 最严格的模式，字段数量和顺序必须完全一致 |
| LENIENT | 是 | 否 | 最宽松的模式，忽略额外字段和数组顺序 |
| NON_EXTENSIBLE | 否 | 否 | 不允许额外字段，但数组顺序可以不同 |
| STRICT_ORDER | 是 | 是 | 允许额外字段，但数组顺序必须一致 |

### 2.2 基本用法

以下是 JSONAssert 的基本使用示例：

```java
import org.json.JSONException;
import org.junit.jupiter.api.Test;
import org.skyscreamer.jsonassert.JSONAssert;

public class BasicJsonAssertTest {

    @Test
    public void testBasicJsonComparison() throws JSONException {
        String expected = "{\"id\":123,\"name\":\"John Doe\",\"active\":true}";
        String actual = "{\"id\":123,\"name\":\"John Doe\",\"active\":true,\"email\":\"john@example.com\"}";
        
        // 使用宽松模式比较（推荐）
        JSONAssert.assertEquals(expected, actual, false);
        
        // 使用严格模式比较（会失败，因为actual多了一个email字段）
        // JSONAssert.assertEquals(expected, actual, true);
    }
}
```

### 2.3 复杂对象比较

JSONAssert 能够处理复杂的嵌套 JSON 对象：

```java
@Test
public void testNestedJsonComparison() throws JSONException {
    String expected = "{user:{name:\"Alice\",address:{city:\"Beijing\",country:\"China\"}}}";
    String actual = "{user:{name:\"Alice\",age:30,address:{city:\"Beijing\",country:\"China\",postcode:\"100000\"}}}";
    
    // 宽松模式下，嵌套对象的额外字段不会导致测试失败
    JSONAssert.assertEquals(expected, actual, false);
}
```

## 3 Spring Boot 集成

Spring Boot 提供了对 JSONAssert 的自动配置支持，使得在测试中更加便捷地使用。

### 3.1 使用 @JsonTest 注解

Spring Boot 的 `@JsonTest` 注解自动配置了 JSON 测试所需的组件：

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

import static org.assertj.core.api.Assertions.assertThat;

@JsonTest
public class UserJsonTest {

  private record User(String name, String email) {}

  @Autowired
  private JacksonTester<User> json;

  @Test
  public void testSerialize() throws Exception {
    User user = new User("Alice", "alice@example.com");

    // 与JSON文件对比
    assertThat(this.json.write(user)).isEqualToJson("expected_user.json");

    // 验证JSON路径值
    assertThat(this.json.write(user)).hasJsonPathStringValue("$.name");
    assertThat(this.json.write(user)).extractingJsonPathStringValue("$.name")
      .isEqualTo("Alice");
  }

  @Test
  public void testDeserialize() throws Exception {
    String content = "{\"name\":\"Bob\",\"email\":\"bob@example.com\"}";

    assertThat(this.json.parse(content))
      .isEqualTo(new User("Bob", "bob@example.com"));

    assertThat(this.json.parseObject(content).name()).isEqualTo("Bob");
  }
}
```

### 3.2 自动配置的 JSON 测试器

Spring Boot 自动配置以下 JSON 测试器：

- `JacksonTester`：用于 Jackson 序列化/反序列化测试
- `GsonTester`：用于 Gson 序列化/反序列化测试  
- `BasicJsonTester`：用于基本的 JSON 字符串测试

## 4 高级用法与最佳实践

### 4.1 处理动态字段

在实际应用中，JSON 响应常常包含动态字段（如 ID、时间戳等）。JSONAssert 提供了多种方式处理这些字段：

```java
import org.junit.jupiter.api.Test;
import org.skyscreamer.jsonassert.JSONAssert;
import org.skyscreamer.jsonassert.JSONCompareMode;
import org.skyscreamer.jsonassert.comparator.CustomComparator;

public class DynamicFieldTest {

    @Test
    public void testDynamicFields() throws Exception {
        String expected = "{\"id\":\"<<IGNORE>>\",\"name\":\"Product\",\"createdAt\":\"<<IGNORE>>\"}";
        String actual = "{\"id\":\"123e4567-e89b-12d3-a456-426614174000\",\"name\":\"Product\",\"createdAt\":\"2023-10-27T10:00:00Z\"}";
        
        // 使用自定义比较器忽略特定字段
        JSONAssert.assertEquals(expected, actual, 
            new CustomComparator(JSONCompareMode.LENIENT,
                (o1, o2) -> true) // 自定义字段比较逻辑
        );
    }
}
```

### 4.2 自定义比较器

对于更复杂的场景，可以创建自定义比较器：

```java
import org.skyscreamer.jsonassert.Customization;
import org.skyscreamer.jsonassert.JSONCompareMode;
import org.skyscreamer.jsonassert.comparator.CustomComparator;
import org.skyscreamer.jsonassert.comparator.DefaultComparator;

public class CustomJsonComparator extends DefaultComparator {
    
    public CustomJsonComparator(JSONCompareMode mode) {
        super(mode);
    }
    
    @Override
    protected void checkJsonObjectKeysExpectedInActual(String prefix, JSONObject expected, JSONObject actual, JSONCompareResult result) {
        // 移除非必要字段后再进行比较
        Set<String> keysToIgnore = new HashSet<>(Arrays.asList("id", "createdAt", "updatedAt"));
        keysToIgnore.forEach(expected::remove);
        
        super.checkJsonObjectKeysExpectedInActual(prefix, expected, actual, result);
    }
}

// 使用自定义比较器
JSONAssert.assertEquals(expected, actual, new CustomJsonComparator(JSONCompareMode.LENIENT));
```

### 4.3 处理集合和数组

JSONAssert 提供了强大的数组比较功能：

```java
@Test
public void testArrayComparison() throws Exception {
    // 严格顺序数组比较
    String expected = "[{\"name\":\"Alice\",\"age\":30},{\"name\":\"Bob\",\"age\":25}]";
    String actual = "[{\"name\":\"Alice\",\"age\":30},{\"name\":\"Bob\",\"age\":25}]";
    JSONAssert.assertEquals(expected, actual, JSONCompareMode.STRICT_ORDER);
    
    // 无序数组比较
    String expectedUnordered = "<<UNORDERED>>[{\"name\":\"Bob\",\"age\":25},{\"name\":\"Alice\",\"age\":30}]";
    JSONAssert.assertEquals(expectedUnordered, actual, JSONCompareMode.LENIENT);
}
```

### 4.4 验证部分 JSON

有时只需要验证 JSON 的特定部分而不是整个文档：

```java
@Test
public void testPartialJsonValidation() throws Exception {
    String fullJson = "{\"user\":{\"name\":\"Alice\",\"age\":30,\"email\":\"alice@example.com\"},\"metadata\":{\"version\":\"1.0\"}}";
    String expected = "{\"user\":{\"name\":\"Alice\",\"age\":30}}";
    
    // 只验证user部分
    JSONAssert.assertEquals(expected, fullJson, false);
}
```

## 5 与其它测试工具集成

### 5.1 与 REST Assured 集成

REST Assured 是一个流行的 REST API 测试库，可以与 JSONAssert 结合使用：

```java
import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.json.JSONException;
import org.junit.jupiter.api.Test;
import org.skyscreamer.jsonassert.JSONAssert;

import static io.restassured.RestAssured.given;

public class RestAssuredIntegrationTest {

    @Test
    public void testApiResponseWithJsonAssert() throws JSONException {
        Response response = given()
                .baseUri("https://api.example.com")
                .when()
                .get("/users/123")
                .then()
                .statusCode(200)
                .extract()
                .response();
        
        String expected = "{\"id\":123,\"name\":\"John Doe\",\"email\":\"john@example.com\"}";
        JSONAssert.assertEquals(expected, response.asString(), false);
    }
}
```

### 5.2 与 MockMvc 集成

在 Spring MVC 测试中，JSONAssert 可以与 MockMvc 一起使用：

```java
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
public class MockMvcIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testWithMockMvc() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/users/123"))
                .andExpect(status().isOk())
                .andReturn();
        
        String expected = "{\"id\":123,\"name\":\"John Doe\"}";
        String actual = result.getResponse().getContentAsString();
        
        JSONAssert.assertEquals(expected, actual, false);
    }
}
```

## 6 最佳实践

### 6.1 测试代码组织

良好的测试代码组织可以提高测试的可维护性：

1. **创建专门的 JSON 测试工具类**：

```java
public abstract class JsonTestUtils {
    
    public static void assertJsonEquals(String expected, String actual) {
        try {
            JSONAssert.assertEquals(expected, actual, false);
        } catch (JSONException e) {
            throw new AssertionError("JSON comparison failed: " + e.getMessage(), e);
        }
    }
    
    public static void assertJsonEquals(String expected, String actual, JSONCompareMode mode) {
        try {
            JSONAssert.assertEquals(expected, actual, mode);
        } catch (JSONException e) {
            throw new AssertionError("JSON comparison failed: " + e.getMessage(), e);
        }
    }
    
    public static String readJsonFile(String path) {
        // 从类路径读取JSON文件的实现
    }
}
```

### 6.2 处理常见问题

1. **忽略不存在的字段**：

当期望的 JSON 中有字段在实际响应中不存在时，可以通过自定义比较器解决：

```java
public class IgnoringNonExistentFieldsComparator extends CustomComparator {
    
    public IgnoringNonExistentFieldsComparator(JSONCompareMode mode, String... fieldsToIgnore) {
        super(mode, createCustomizations(fieldsToIgnore));
    }
    
    private static Customization[] createCustomizations(String[] fieldsToIgnore) {
        return Arrays.stream(fieldsToIgnore)
                .map(field -> new Customization(field, (o1, o2) -> true))
                .toArray(Customization[]::new);
    }
    
    @Override
    protected void checkJsonObjectKeysExpectedInActual(String prefix, JSONObject expected, JSONObject actual, JSONCompareResult result) {
        // 移除非必要字段后再进行比较
        Set<String> keysToIgnore = new HashSet<>(Arrays.asList("id", "createdAt"));
        keysToIgnore.forEach(expected::remove);
        
        super.checkJsonObjectKeysExpectedInActual(prefix, expected, actual, result);
    }
}
```

### 6.3 性能考虑

当处理大型 JSON 文档时，考虑以下性能优化策略：

1. **只验证必要的部分**：避免比较整个大型 JSON 文档，只验证关键字段
2. **使用合适的比较模式**：宽松模式通常比严格模式性能更好
3. **避免深度比较**：对于特别大的嵌套结构，考虑自定义比较器只验证表面结构

## 7 常见问题与解决方案

### 7.1 字段顺序问题

**问题**：JSON 字段顺序不一致导致测试失败

**解决方案**：使用 `LENIENT` 或 `NON_EXTENSIBLE` 模式

```java
JSONAssert.assertEquals(expected, actual, JSONCompareMode.LENIENT);
```

### 7.2 动态字段问题

**问题**：时间戳、ID 等动态字段导致测试不稳定

**解决方案**：使用自定义比较器忽略这些字段

```java
CustomComparator comparator = new CustomComparator(JSONCompareMode.LENIENT,
    new Customization("id", (o1, o2) -> true),
    new Customization("createdAt", (o1, o2) -> true)
);
JSONAssert.assertEquals(expected, actual, comparator);
```

### 7.3 数组顺序问题

**问题**：数组元素顺序不一致导致测试失败

**解决方案**：使用 `<<UNORDERED>>` 指令或 `LENIENT` 模式

```java
String expected = "<<UNORDERED>>[{\"id\":1},{\"id\":2}]";
JSONAssert.assertEquals(expected, actual, JSONCompareMode.LENIENT);
```

## 8 总结

JSONAssert 是一个强大且灵活的 JSON 测试库，与 Spring Boot 框架无缝集成，大大简化了 JSON 相关的测试工作。通过合理使用不同的比较模式、自定义比较器以及与其它测试工具的结合，可以创建健壮且可维护的 JSON 测试套件。

核心要点回顾：

1. **选择正确的比较模式**：根据测试需求选择合适的比较模式（STRICT、LENIENT、NON_EXTENSIBLE 或 STRICT_ORDER）
2. **处理动态字段**：使用自定义比较器或占位符忽略动态字段
3. **利用 Spring 集成**：使用 `@JsonTest` 和自动配置的测试器简化测试代码
4. **结合其他测试工具**：与 REST Assured 和 MockMvc 等工具结合使用
