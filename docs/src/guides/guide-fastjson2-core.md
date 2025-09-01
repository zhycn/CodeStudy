---
title: Fastjson2 详解与最佳实践
description: 详细讲解Fastjson2的主要特性、适用场景、安装与配置，以及性能优化策略。
---

# Fastjson2 详解与最佳实践

Fastjson2 官方文档：<https://github.com/alibaba/fastjson2>

## 1 简介与概述

Fastjson2 是阿里巴巴开源的高性能 JSON 处理库，作为 Fastjson 项目的重要升级，目标是为下一个十年提供一个高性能的 JSON 库。它与 Fastjson 1.x 相比，在性能、安全性和功能上都有显著提升，解决了 autoType 功能因为兼容和白名单的安全性问题。

### 1.1 主要特性

Fastjson2 具有以下突出特性：

- **性能极致**：性能远超过其他流行 JSON 库，包括 Jackson、Gson 和 org.json。根据官方基准测试，Fastjson2 的解析速度比 v1 版本快了 10%~20%，生成速度快了 10%~20%，内存占用低了 10%~20%。
- **支持 JDK 新特性**：包括 JDK 11/JDK 17，针对 compact string 优化，支持 Record，支持 GraalVM Native-Image。
- **完善的 JSONPath 支持**：支持 ISO/IEC TR 19075-6 的 JSONPath 语法，JSONPath 是一等公民。
- **多环境支持**：支持 Java 服务端、客户端 Android、大数据场景，支持 Android 8+。
- **双协议支持**：同一套 API 支持 JSON/JSONB 两种协议。
- **扩展支持**：支持 Kotlin，支持 JSON Schema，提供对 SpringFramework 等框架的扩展支持。

### 1.2 适用场景

Fastjson2 适用于多种应用场景：

- **服务器应用**：需要高性能、定制化序列化/反序列化、安全 JSON 处理的场景。
- **大数据处理**：支持部分解析，适合处理大规模 JSON 数据。
- **Android 客户端**：首次执行性能好，静态化加速，提供针对 Android 平台的优化版本。
- **微服务架构**：适合作为 Dubbo 等微服务框架的序列化方案。

## 2 安装与配置

### 2.1 添加依赖

在 Fastjson v2 中，groupId 和 1.x 不一样，是 `com.alibaba.fastjson2`。

**Maven 配置：**

```xml
<dependency>
    <groupId>com.alibaba.fastjson2</groupId>
    <artifactId>fastjson2</artifactId>
    <version>2.0.56</version>
</dependency>
```

**Gradle 配置：**

```gradle
dependencies {
    implementation 'com.alibaba.fastjson2:fastjson2:2.0.56'
}
```

### 2.2 可选模块

Fastjson2 提供了多个可选模块以适应不同场景：

**Fastjson v1 兼容模块**：

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>2.0.56</version>
</dependency>
```

**Kotlin 集成模块**：

```xml
<dependency>
    <groupId>com.alibaba.fastjson2</groupId>
    <artifactId>fastjson2-kotlin</artifactId>
    <version>2.0.56</version>
</dependency>
```

**Spring Framework 扩展模块**：

```xml
<dependency>
    <groupId>com.alibaba.fastjson2</groupId>
    <artifactId>fastjson2-extension</artifactId>
    <version>2.0.56</version>
</dependency>
```

**Android 优化版本**：

```xml
<!-- Android 5+ 优化版 -->
<dependency>
    <groupId>com.alibaba.fastjson2</groupId>
    <artifactId>fastjson2</artifactId>
    <version>2.0.56.android5</version>
</dependency>

<!-- Android 8+ 优化版（支持 java.time 和 Optional） -->
<dependency>
    <groupId>com.alibaba.fastjson2</groupId>
    <artifactId>fastjson2</artifactId>
    <version>2.0.56.android8</version>
</dependency>
```

### 2.3 配置说明

Fastjson2 在安全设计上做出了重大调整，取消了显式设置安全模式的 API，改为默认内置安全机制。这种设计遵循了"安全默认值"的最佳实践：

```java
// Fastjson2 默认内置安全机制，无需显式配置安全模式
// 如有特殊需要，可以通过 JVM 参数配置
// -Dfastjson2.parser.safeMode=true
```

## 3 核心功能使用

### 3.1 基本序列化与反序列化

**Java 对象序列化为 JSON**：

```java
public class User {
    private int id;
    private String name;
    private LocalDateTime registerTime;

    // 构造方法、getter 和 setter 省略
}

User user = new User(1, "张三", LocalDateTime.now());

// 序列化为 JSON 字符串
String jsonString = JSON.toJSONString(user);
System.out.println(jsonString);
// 输出: {"id":1,"name":"张三","registerTime":"2023-08-01T12:34:56.789"}

// 序列化为 UTF-8 字节数组
byte[] jsonBytes = JSON.toJSONBytes(user);

// 序列化为 JSONB 格式（二进制格式）
byte[] jsonbBytes = JSONB.toBytes(user);
```

**JSON 反序列化为 Java 对象**：

```java
// 从字符串反序列化
String jsonStr = "{\"id\":1,\"name\":\"张三\",\"registerTime\":\"2023-08-01T12:34:56.789\"}";
User user = JSON.parseObject(jsonStr, User.class);

// 从字节数组反序列化
byte[] jsonBytes = ...;
User user = JSON.parseObject(jsonBytes, User.class);

// 从 JSONB 反序列化
byte[] jsonbBytes = ...;
User user = JSONB.parseObject(jsonbBytes, User.class);
```

**Kotlin 支持**：

```kotlin
import com.alibaba.fastjson2.*

data class User(val id: Int, val name: String, val registerTime: LocalDateTime)

// 序列化
val user = User(1, "张三", LocalDateTime.now())
val jsonString = user.toJSONString()

// 反序列化
val jsonStr = "{\"id\":1,\"name\":\"张三\",\"registerTime\":\"2023-08-01T12:34:56.789\"}"
val user = jsonStr.parseObject<User>()
```

### 3.2 JSONObject 和 JSONArray 操作

**JSONObject 使用示例**：

```java
// 创建 JSONObject
JSONObject obj = new JSONObject();
obj.put("id", 1);
obj.put("name", "张三");
obj.put("isActive", true);

// 或者从 JSON 字符串解析
String text = "{\"id\": 2,\"name\": \"fastjson2\"}";
JSONObject obj = JSON.parseObject(text);

// 获取值
int id = obj.getIntValue("id");
String name = obj.getString("name");
boolean isActive = obj.getBooleanValue("isActive");

// 转换为 JavaBean
User user = obj.toJavaObject(User.class);
```

**JSONArray 使用示例**：

```java
// 创建 JSONArray
JSONArray array = new JSONArray();
array.add("value1");
array.add(123);
array.add(true);

// 或者从 JSON 字符串解析
String text = "[2, \"fastjson2\"]";
JSONArray array = JSON.parseArray(text);

// 获取值
int value = array.getIntValue(0);
String name = array.getString(1);

// 转换为 JavaBean 列表
List<User> users = array.toJavaList(User.class);
```

### 3.3 JSONPath 使用

Fastjson2 提供了完善的 JSONPath 支持：

```java
// 准备测试数据
String jsonStr = "{\"store\":{\"book\":[{\"title\":\"Java 核心编程\",\"price\":68.50},{\"title\":\"Fastjson2 指南\",\"price\":49.90}],\"bicycle\":{\"color\":\"red\",\"price\":199.95}}}";

// 创建 JSONPath
JSONPath path = JSONPath.of("$.store.book[0].title");

// 提取数据
Object result = path.extract(JSONReader.of(jsonStr));
System.out.println(result); // 输出: Java 核心编程

// 提取所有书籍价格
JSONPath pricePath = JSONPath.of("$.store.book[*].price");
List<Object> prices = pricePath.eval(JSON.parseObject(jsonStr));
System.out.println(prices); // 输出: [68.50, 49.90]

// 条件查询
JSONPath expensiveBooksPath = JSONPath.of("$.store.book[?(@.price > 60)]");
List<Object> expensiveBooks = expensiveBooksPath.eval(JSON.parseObject(jsonStr));
System.out.println(expensiveBooks); // 输出: [{"title":"Java 核心编程","price":68.50}]
```

### 3.4 高级特性

**JSONB 二进制格式**：

```java
// JSONB 序列化（二进制格式，更高效）
User user = new User(1, "张三", LocalDateTime.now());
byte[] jsonbBytes = JSONB.toBytes(user);

// JSONB 反序列化
User parsedUser = JSONB.parseObject(jsonbBytes, User.class);

// JSONB 深度拷贝
User copiedUser = JSONB.parseObject(JSONB.toBytes(user), User.class);
```

**部分解析（适合大数据场景）**：

```java
String largeJson = "..."; // 大型 JSON 字符串

// 只解析需要的部分，避免完整解析的开销
JSONPath path = JSONPath.of("$.items[0:10].name"); // 只获取前10个项目的名称
List<Object> names = path.eval(JSON.parseObject(largeJson));
```

## 4 高级特性与配置

### 4.1 注解使用

Fastjson2 提供了丰富的注解支持：

```java
// 自定义序列化/反序列化
public class Product {
    @JSONField(name = "product_id", ordinal = 1)
    private int id;

    @JSONField(ordinal = 2)
    private String name;

    @JSONField(serialize = false) // 不序列化此字段
    private String secretKey;

    @JSONField(format = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @JSONField(deserializeUsing = CustomDeserializer.class)
    private CustomType customField;

    // 构造方法、getter 和 setter 省略
}

// 自定义反序列化器
public class CustomDeserializer implements ObjectDeserializer {
    @Override
    public CustomType deserialize(JSONParser parser, Type type, Object fieldName, long features) {
        // 自定义反序列化逻辑
    }
}
```

**Jackson 注解兼容**：

Fastjson2 增强了对 Jackson 注解的兼容性：

```java
// Fastjson2 支持 Jackson 的多态类型处理注解
@JsonTypeInfo(use = Id.NAME, property = "vehicle_type")
@JsonSubTypes({
    @Type(value = Car.class, name = "Car"),
    @Type(value = Truck.class, name = "Truck")
})
public abstract class Vehicle {
    // 公共属性和方法
}

public class Car extends Vehicle {
    private int doors;
    // getter 和 setter
}

public class Truck extends Vehicle {
    private double cargoCapacity;
    // getter 和 setter
}

// 序列化时会自动添加类型信息
Vehicle vehicle = new Car();
String json = JSON.toJSONString(vehicle);
// 输出: {"vehicle_type":"Car","doors":4}

// 反序列化时能正确识别类型
Vehicle parsedVehicle = JSON.parseObject(json, Vehicle.class);
// parsedVehicle 实际上是 Car 实例
```

### 4.2 配置选项

**全局配置**：

```java
// 配置大数值处理
JSON.config(JSONReader.Feature.UseLongForInts);

// 配置枚举处理
JSON.configEnumAsJavaBean();

// 配置日期格式
JSON.configDateFormat("yyyy-MM-dd HH:mm:ss");

// 配置循环引用检测
JSON.config(JSONWriter.Feature.ReferenceDetection);

// 禁用引用检测（提高性能，但可能增加内存使用）
JSON.config(JSONReader.Feature.DisableReferenceDetect);
```

**大数值处理配置**：

Fastjson2 提供了灵活的大数值处理方式：

```java
String jsonStr = "{\"value\": 12345678901234567890}";

// 默认行为（使用最紧凑的整型类型）
Object obj = JSON.parseObject(jsonStr).get("value");
// obj 可能是 BigInteger

// 启用 UseLongForInts 特性（与 Fastjson1 行为一致）
JSONObject result = JSON.parseObject(jsonStr, Object.class, JSONReader.Feature.UseLongForInts);
Long value = result.getLong("value");

// 启用 UseBigIntegerForInts 特性（明确使用 BigInteger）
JSONObject result2 = JSON.parseObject(jsonStr, Object.class, JSONReader.Feature.UseBigIntegerForInts);
BigInteger value2 = result2.getBigInteger("value");
```

### 4.3 自定义序列化与反序列化

```java
// 自定义序列化器
public class CustomSerializer implements ObjectSerializer {
    @Override
    public void write(JSONWriter writer, Object object, Object fieldName, Type fieldType, long features) {
        CustomType custom = (CustomType) object;
        writer.startObject();
        writer.writeName("custom_value");
        writer.writeString(custom.getValue());
        writer.endObject();
    }
}

// 自定义反序列化器
public class CustomDeserializer implements ObjectDeserializer {
    @Override
    public CustomType deserialize(JSONParser parser, Type type, Object fieldName, long features) {
        JSONObject jsonObject = parser.parseObject();
        String value = jsonObject.getString("custom_value");
        return new CustomType(value);
    }
}

// 注册自定义处理器
public class CustomModule implements Module {
    @Override
    public void init(ObjectWriterFactory writerFactory, ObjectReaderFactory readerFactory) {
        writerFactory.register(CustomType.class, new CustomSerializer());
        readerFactory.register(CustomType.class, new CustomDeserializer());
    }
}

// 注册模块
JSON.registerModule(new CustomModule());
```

## 5 最佳实践

### 5.1 性能优化

1. **选择合适的版本**：

   ```xml
   <!-- 标准 Java 项目 -->
   <dependency>
       <groupId>com.alibaba.fastjson2</groupId>
       <artifactId>fastjson2</artifactId>
       <version>2.0.56</version>
   </dependency>

   <!-- Android 项目（根据目标 API 级别选择） -->
   <dependency>
       <groupId>com.alibaba.fastjson2</groupId>
       <artifactId>fastjson2</artifactId>
       <version>2.0.56.android8</version>
   </dependency>
   ```

2. **使用 JSONB 二进制格式**：对于高性能场景和内部服务通信，使用 JSONB 格式可以获得更好的性能。

   ```java
   // 高性能序列化/反序列化
   byte[] jsonbBytes = JSONB.toBytes(object);
   Object parsed = JSONB.parseObject(jsonbBytes, Object.class);
   ```

3. **使用部分解析**：对于大型 JSON 数据，使用 JSONPath 进行部分解析，避免不必要的完整解析。

   ```java
   // 只解析需要的部分数据
   JSONPath path = JSONPath.of("$.items[0:10]");
   List<Object> items = path.eval(JSON.parseObject(largeJson));
   ```

4. **合理配置特性**：根据场景启用或禁用特定特性以优化性能。

   ```java
   // 禁用引用检测提高性能（但需确保无循环引用）
   JSON.parseObject(jsonStr, Object.class, JSONReader.Feature.DisableReferenceDetect);

   // 启用 UseLongForInts 提高兼容性
   JSON.config(JSONReader.Feature.UseLongForInts);
   ```

### 5.2 安全实践

1. **利用默认安全机制**：Fastjson2 默认内置安全机制，无需额外配置。
2. **谨慎使用 autoType**：如非必要，避免开启 autoType 功能。
3. **输入验证**：对所有输入进行验证，防止恶意数据。

   ```java
   // 验证 JSON 格式
   if (!JSON.isValid(jsonStr)) {
       throw new IllegalArgumentException("Invalid JSON format");
   }
   ```

### 5.3 兼容性实践

1. **从 Fastjson1 迁移**：

   ```java
   // 使用兼容包
   import com.alibaba.fastjson.JSON; // 兼容包
   import com.alibaba.fastjson2.JSONB; // 新功能

   // 逐步迁移策略
   // 1. 首先使用兼容包替换原有代码
   // 2. 逐步使用新API重写部分代码
   // 3. 完全迁移到Fastjson2
   ```

2. **从 Jackson 迁移**：

   ```java
   // Fastjson2 支持 Jackson 注解
   @JsonTypeInfo(use = Id.NAME, property = "type")
   @JsonSubTypes({
       @JsonSubTypes.Type(value = Cat.class, name = "cat"),
       @JsonSubTypes.Type(value = Dog.class, name = "dog")
   })
   public abstract class Animal {
       // ...
   }

   // 配置 Jackson 注解支持
   JSON.config(JSONReader.Feature.SupportJacksonAnnotation);
   ```

3. **处理大数值**：

   ```java
   // 保持与 Fastjson1 一致的数值处理行为
   JSON.config(JSONReader.Feature.UseLongForInts);
   JSON.config(JSONReader.Feature.UseBigDecimalForFloats);
   ```

### 5.4 框架集成

**Spring Boot 集成**：

```java
@Configuration
public class Fastjson2Config {

    @Bean
    public HttpMessageConverters fastJsonHttpMessageConverters() {
        FastJsonHttpMessageConverter converter = new FastJsonHttpMessageConverter();

        // 配置序列化特性
        JSONWriter.Feature[] writerFeatures = {
            JSONWriter.Feature.WriteMapNullValue,
            JSONWriter.Feature.PrettyFormat,
            JSONWriter.Feature.WriteBigDecimalAsPlain
        };

        converter.setWriterFeatures(writerFeatures);
        return new HttpMessageConverters(converter);
    }
}
```

**Dubbo 集成**：

```yaml
# application.yml (Spring Boot)
dubbo:
  protocol:
    serialization: fastjson2
```

```properties
# dubbo.properties
dubbo.protocol.serialization=fastjson2
dubbo.consumer.serialization=fastjson2
```

```xml
<!-- XML 配置 -->
<dubbo:protocol serialization="fastjson2" />
<dubbo:consumer serialization="fastjson2" />
```

## 6 版本迁移指南

### 6.1 从 Fastjson1 迁移到 Fastjson2

1. **更改包名和依赖**：

   ```xml
   <!-- 更改前 -->
   <dependency>
       <groupId>com.alibaba</groupId>
       <artifactId>fastjson</artifactId>
       <version>1.2.83</version>
   </dependency>

   <!-- 更改后 -->
   <dependency>
       <groupId>com.alibaba.fastjson2</groupId>
       <artifactId>fastjson2</artifactId>
       <version>2.0.56</version>
   </dependency>
   ```

   代码中更改导入：

   ```java
   // 更改前
   import com.alibaba.fastjson.JSON;
   import com.alibaba.fastjson.JSONObject;

   // 更改后
   import com.alibaba.fastjson2.JSON;
   import com.alibaba.fastjson2.JSONObject;
   ```

2. **处理行为差异**：

   ```java
   // 大数值处理差异
   // Fastjson1 默认将大数值解析为 Long
   // Fastjson2 默认使用最紧凑的类型（Integer、Long 或 BigInteger）

   // 保持 Fastjson1 行为
   JSON.config(JSONReader.Feature.UseLongForInts);
   ```

3. **安全模式变更**：

   ```java
   // Fastjson1 需要显式启用安全模式
   // ParserConfig.getGlobalInstance().setSafeMode(true);

   // Fastjson2 默认内置安全机制，无需配置
   ```

### 6.2 从 Jackson 迁移到 Fastjson2

1. **注解兼容性**：

   ```java
   // Fastjson2 支持 Jackson 注解
   @JsonTypeInfo(use = Id.NAME, property = "type")
   @JsonSubTypes({
       @JsonSubTypes.Type(value = Square.class, name = "square"),
       @JsonSubTypes.Type(value = Circle.class, name = "circle")
   })
   public abstract class Shape {
       // ...
   }

   // 启用 Jackson 注解支持
   JSON.config(JSONReader.Feature.SupportJacksonAnnotation);
   ```

2. **配置枚举处理**：

   ```java
   // 配置枚举为 JavaBean 行为（与 Jackson 一致）
   JSON.configEnumAsJavaBean();
   ```

## 7 总结

Fastjson2 是一个高性能、功能丰富、安全可靠的 JSON 处理库，适用于多种应用场景。通过合理的配置和使用最佳实践，可以充分发挥其性能优势，同时确保代码的可靠性和安全性。

**关键要点**：

1. Fastjson2 性能远超过其他流行 JSON 库，是高性能场景的理想选择。
2. 支持 JSON/JSONB 双协议，JSONB 二进制格式更适合内部服务通信。
3. 提供了完善的 JSONPath 支持，适合处理大型 JSON 数据。
4. 默认内置安全机制，无需额外配置。
5. 良好的兼容性，支持从 Fastjson1 和 Jackson 平滑迁移。

**推荐使用策略**：

- **新项目**：直接使用 Fastjson2，享受其性能和安全优势。
- **Fastjson1 老项目**：使用兼容包逐步迁移。
- **Jackson 项目**：利用 Fastjson2 的 Jackson 注解支持进行迁移。

通过本文的介绍，希望您能全面了解 Fastjson2 的特性和使用方法，并在实际项目中应用这些最佳实践，从而构建高性能、可靠的 JSON 处理功能。
