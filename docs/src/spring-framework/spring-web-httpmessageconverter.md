---
title: Spring Web HttpMessageConverter 及其实现类详解与最佳实践
description: 了解 Spring Web HttpMessageConverter 及其实现类的核心概念、工作原理和最佳实践，掌握如何在 Spring 应用中配置和使用 HttpMessageConverter 来处理 HTTP 请求和响应消息转换。
author: zhycn
---

# Spring Web HttpMessageConverter 及其实现类详解与最佳实践

## 1. HttpMessageConverter 概述

HttpMessageConverter 是 Spring MVC 框架中用于处理 HTTP 请求和响应消息转换的核心策略接口。它在 RESTful Web 服务中扮演着至关重要的角色，负责将 HTTP 请求体中的数据转换为 Java 对象（反序列化），以及将 Java 对象转换为 HTTP 响应体中的数据（序列化）。

### 1.1 基本定义与作用

HttpMessageConverter 是一个泛型接口，其定义如下：

```java
public interface HttpMessageConverter<T> {
    boolean canRead(Class<?> clazz, MediaType mediaType);
    boolean canWrite(Class<?> clazz, MediaType mediaType);
    List<MediaType> getSupportedMediaTypes();
    T read(Class<? extends T> clazz, HttpInputMessage inputMessage) 
        throws IOException, HttpMessageNotReadableException;
    void write(T t, MediaType contentType, HttpOutputMessage outputMessage) 
        throws IOException, HttpMessageNotWritableException;
}
```

该接口的主要方法包括：

- **canRead**：检查转换器是否能将请求体转换为指定的 Java 对象类型
- **canWrite**：检查转换器是否能将 Java 对象写为响应体的指定媒体类型
- **getSupportedMediaTypes**：返回当前转换器支持的媒体类型列表
- **read**：将 HTTP 请求体数据读取并转换为 Java 对象
- **write**：将 Java 对象转换为指定格式并写入 HTTP 响应体

### 1.2 在 Spring MVC 中的位置

在 Spring MVC 架构中，HttpMessageConverter 位于控制器方法执行前后，负责处理参数绑定和返回值转换。当控制器方法使用 `@RequestBody`、`@ResponseBody` 注解或返回 `HttpEntity`/`ResponseEntity` 对象时，Spring 会自动调用相应的消息转换器。

## 2. HttpMessageConverter 工作原理

### 2.1 请求处理流程（反序列化）

1. **获取请求信息**：Spring MVC 从请求头中获取 `Content-Type`，确定请求体的数据类型
2. **选择转换器**：遍历所有注册的 `HttpMessageConverter`，调用 `canRead` 方法，找到能处理该 `Content-Type` 和目标 Java 类型的转换器
3. **反序列化**：使用选定的转换器，调用 `read` 方法将请求体数据转换为 Java 对象，作为 Controller 方法的参数

### 2.2 响应处理流程（序列化）

1. **获取响应信息**：从请求头中获取 `Accept`，确定客户端期望的响应数据类型
2. **选择转换器**：遍历所有注册的 `HttpMessageConverter`，调用 `canWrite` 方法，找到能处理返回对象类型并满足 `Accept` 的转换器
3. **序列化**：使用选定的转换器，调用 `write` 方法将返回的 Java 对象转换为响应体数据，发送给客户端

### 2.3 内容协商机制

Spring MVC 使用内容协商机制来确定使用哪个 HttpMessageConverter。这个过程基于：

- **请求的 Content-Type 头**：用于确定如何解析请求体
- **请求的 Accept 头**：用于确定客户端期望的响应格式
- **URL 路径扩展**（如 .json、.xml）
- **默认规则**：当无法确定时使用的默认行为

## 3. 常用 HttpMessageConverter 实现类

Spring 框架提供了多种 HttpMessageConverter 实现，以处理不同的数据格式和场景。

### 3.1 JSON 处理转换器

#### 3.1.1 MappingJackson2HttpMessageConverter

这是处理 JSON 数据最常用的转换器，基于 Jackson 库实现。

**特性：**

- 支持媒体类型：`application/json`
- 使用 ObjectMapper 进行序列化和反序列化
- 支持注解驱动的映射配置（如 `@JsonIgnore`、`@JsonProperty` 等）

**配置示例：**

```java
@Configuration
public class JacksonConfig {
    @Bean
    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter() {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        ObjectMapper objectMapper = new ObjectMapper();
        // 配置 ObjectMapper
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS);
        converter.setObjectMapper(objectMapper);
        return converter;
    }
}
```

#### 3.1.2 GsonHttpMessageConverter

基于 Google Gson 库的 JSON 转换器，是 Jackson 的替代方案。

### 3.2 XML 处理转换器

#### 3.2.1 Jaxb2RootElementHttpMessageConverter

基于 JAXB（Java Architecture for XML Binding）库，处理 XML 数据的转换。

**要求：** Java 类需要使用 JAXB 注解（如 `@XmlRootElement`）标注

**示例：**

```java
@XmlRootElement
public class User {
    private Long id;
    private String name;
    // getters and setters
}

@RestController
public class UserController {
    @GetMapping(value = "/user/{id}", produces = MediaType.APPLICATION_XML_VALUE)
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
}
```

#### 3.2.2 MappingJackson2XmlHttpMessageConverter

使用 Jackson XML 模块处理 XML 数据，不依赖于 JAXB。

### 3.3 其他常用转换器

#### 3.3.1 StringHttpMessageConverter

处理文本数据，支持 `text/plain`、`text/html` 等媒体类型。

**特性：**

- 默认使用 UTF-8 字符集，可配置
- 适用于简单的文本数据处理

#### 3.3.2 ByteArrayHttpMessageConverter

处理二进制数据，支持 `application/octet-stream` 媒体类型。

**适用场景：** 文件下载、图像处理等二进制数据传输

#### 3.3.3 FormHttpMessageConverter

处理表单数据，支持 `application/x-www-form-urlencoded` 和 `multipart/form-data`。

**功能：** 将表单数据转换为 `MultiValueMap<String, String>` 对象

#### 3.3.4 ResourceHttpMessageConverter

处理资源文件，如文件下载场景。

## 4. 默认转换器配置

### 4.1 Spring Boot 自动配置

Spring Boot 自动配置了一系列常用的 HttpMessageConverter，具体取决于类路径上的依赖。

**默认包含的转换器：**

- ByteArrayHttpMessageConverter
- StringHttpMessageConverter
- ResourceHttpMessageConverter
- SourceHttpMessageConverter
- FormHttpMessageConverter
- 当类路径存在相应库时，还会添加：
  - Jackson JSON 转换器（MappingJackson2HttpMessageConverter）
  - JAXB2 转换器（Jaxb2RootElementHttpMessageConverter）
  - Jackson XML 转换器（MappingJackson2XmlHttpMessageConverter）

### 4.2 查看已配置的转换器

可以通过在应用中添加以下代码查看已配置的转换器：

```java
@RestController
public class ConverterInfoController {
    
    @Autowired
    private RequestMappingHandlerAdapter handlerAdapter;
    
    @GetMapping("/converters")
    public List<String> getMessageConverters() {
        return handlerAdapter.getMessageConverters().stream()
                .map(converter -> converter.getClass().getSimpleName())
                .collect(Collectors.toList());
    }
}
```

## 5. 自定义配置与扩展

### 5.1 实现 WebMvcConfigurer 接口

在 Spring Boot 中，可以通过实现 `WebMvcConfigurer` 接口来自定义消息转换器。

#### 5.1.1 使用 configureMessageConverters 方法

此方法允许完全控制转换器列表，但会覆盖默认配置。

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        // 添加自定义转换器
        converters.add(new MappingJackson2HttpMessageConverter());
        converters.add(new StringHttpMessageConverter());
        // 注意：此方法会覆盖默认转换器，需要手动添加所有需要的转换器
    }
}
```

#### 5.1.2 使用 extendMessageConverters 方法（推荐）

此方法在默认转换器基础上进行扩展，不会丢失默认配置。

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        // 在默认转换器列表基础上添加或修改
        // 例如，调整 Jackson 转换器的配置
        for (HttpMessageConverter<?> converter : converters) {
            if (converter instanceof MappingJackson2HttpMessageConverter) {
                MappingJackson2HttpMessageConverter jsonConverter = 
                    (MappingJackson2HttpMessageConverter) converter;
                ObjectMapper objectMapper = jsonConverter.getObjectMapper();
                // 自定义 ObjectMapper 配置
                objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            }
        }
    }
}
```

### 5.2 使用 HttpMessageConverters Bean

在 Spring Boot 中，还可以通过定义 `HttpMessageConverters` Bean 来添加自定义转换器。

```java
@Configuration
public class ConverterConfig {
    
    @Bean
    public HttpMessageConverters customConverters() {
        // 创建自定义转换器
        MyCustomHttpMessageConverter additionalConverter = new MyCustomHttpMessageConverter();
        return new HttpMessageConverters(additionalConverter);
    }
}
```

### 5.3 自定义 HttpMessageConverter 实现

当需要处理特殊数据格式时，可以创建自定义的 HttpMessageConverter。

#### 5.3.1 实现 HttpMessageConverter 接口

```java
public class CsvHttpMessageConverter implements HttpMessageConverter<Object> {
    
    private static final MediaType MEDIA_TYPE = new MediaType("text", "csv");
    
    @Override
    public boolean canRead(Class<?> clazz, MediaType mediaType) {
        return false; // 仅支持写入
    }
    
    @Override
    public boolean canWrite(Class<?> clazz, MediaType mediaType) {
        return Object.class.isAssignableFrom(clazz) && 
               MEDIA_TYPE.includes(mediaType);
    }
    
    @Override
    public List<MediaType> getSupportedMediaTypes() {
        return Collections.singletonList(MEDIA_TYPE);
    }
    
    @Override
    public Object read(Class<?> clazz, HttpInputMessage inputMessage) {
        throw new UnsupportedOperationException("Not supported");
    }
    
    @Override
    public void write(Object object, MediaType contentType, 
                     HttpOutputMessage outputMessage) throws IOException {
        // 实现对象到 CSV 的转换逻辑
        try (OutputStream outputStream = outputMessage.getBody();
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(outputStream))) {
            // CSV 转换逻辑
            writer.write(convertToCsv(object));
        }
    }
    
    private String convertToCsv(Object object) {
        // 实现转换逻辑
        return "csv,data,here";
    }
}
```

#### 5.3.2 继承 AbstractHttpMessageConverter 类（推荐）

```java
public class CsvHttpMessageConverter extends AbstractHttpMessageConverter<Object> {
    
    public CsvHttpMessageConverter() {
        super(new MediaType("text", "csv"));
    }
    
    @Override
    protected boolean supports(Class<?> clazz) {
        return Object.class.isAssignableFrom(clazz);
    }
    
    @Override
    protected Object readInternal(Class<?> clazz, HttpInputMessage inputMessage) {
        throw new UnsupportedOperationException("Not supported");
    }
    
    @Override
    protected void writeInternal(Object object, HttpOutputMessage outputMessage) 
            throws IOException {
        // 实现写入逻辑
        try (OutputStream outputStream = outputMessage.getBody();
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(outputStream))) {
            writer.write(convertToCsv(object));
        }
    }
    
    private String convertToCsv(Object object) {
        // 实现转换逻辑
        return "csv,data,here";
    }
}
```

### 5.4 替换默认 JSON 转换器（以 FastJson 为例）

在某些情况下，可能需要使用替代的 JSON 处理库，如 FastJson。

#### 5.4.1 添加 FastJson 依赖

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.83</version>
</dependency>
```

#### 5.4.2 配置 FastJsonHttpMessageConverter

```java
@Configuration
public class FastJsonConfig implements WebMvcConfigurer {
    
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        // 移除默认的 Jackson 转换器
        converters.removeIf(converter -> 
            converter instanceof MappingJackson2HttpMessageConverter);
        
        // 创建并配置 FastJson 转换器
        FastJsonHttpMessageConverter fastJsonConverter = 
            new FastJsonHttpMessageConverter();
        
        FastJsonConfig config = new FastJsonConfig();
        config.setSerializerFeatures(
            SerializerFeature.PrettyFormat,
            SerializerFeature.WriteMapNullValue,
            SerializerFeature.WriteDateUseDateFormat
        );
        config.setDateFormat("yyyy-MM-dd HH:mm:ss");
        
        fastJsonConverter.setFastJsonConfig(config);
        fastJsonConverter.setDefaultCharset(StandardCharsets.UTF_8);
        
        // 设置支持的媒体类型
        fastJsonConverter.setSupportedMediaTypes(Arrays.asList(
            MediaType.APPLICATION_JSON,
            MediaType.APPLICATION_JSON_UTF8
        ));
        
        converters.add(fastJsonConverter);
    }
}
```

## 6. 最佳实践与高级技巧

### 6.1 转换器优先级控制

当多个转换器可以处理同一类型时，Spring 按照注册顺序选择第一个匹配的转换器。可以通过调整转换器在列表中的位置来控制优先级。

```java
@Configuration
public class ConverterPriorityConfig implements WebMvcConfigurer {
    
    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        // 将自定义转换器添加到列表开头，提高优先级
        converters.add(0, new MyCustomHttpMessageConverter());
    }
}
```

### 6.2 处理泛型类型

由于 Java 类型擦除机制，处理泛型类型时需要特殊处理。可以使用 `ParameterizedTypeReference` 保留泛型信息。

**在 RestTemplate 中的使用示例：**

```java
RestTemplate restTemplate = new RestTemplate();
ResponseEntity<List<User>> response = restTemplate.exchange(
    url, 
    HttpMethod.GET, 
    null, 
    new ParameterizedTypeReference<List<User>>() {}
);
List<User> users = response.getBody();
```

### 6.3 全局异常处理与消息转换

在全局异常处理中结合 HttpMessageConverter，可以返回统一的错误响应格式。

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        ErrorResponse error = new ErrorResponse("ERROR", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }
    
    public static class ErrorResponse {
        private String code;
        private String message;
        private Timestamp timestamp;
        
        public ErrorResponse(String code, String message) {
            this.code = code;
            this.message = message;
            this.timestamp = new Timestamp(System.currentTimeMillis());
        }
        
        // getters and setters
    }
}
```

### 6.4 性能优化建议

1. **选择合适的转换器**：根据实际数据格式需求选择最合适的转换器
2. **避免重复转换**：确保数据在转换前已经处于合适的格式
3. **配置合适的缓存**：对于大型对象或频繁转换的场景，考虑配置适当的缓存策略
4. **使用流式处理**：处理大型数据时，使用流式 API 避免内存溢出

### 6.5 测试策略

确保自定义消息转换器正确工作的测试策略：

```java
@SpringBootTest
class HttpMessageConverterTest {
    
    @Autowired
    private RequestMappingHandlerAdapter handlerAdapter;
    
    @Test
    void testCustomConverterExists() {
        List<HttpMessageConverter<?>> converters = 
            handlerAdapter.getMessageConverters();
        
        boolean hasCustomConverter = converters.stream()
            .anyMatch(converter -> 
                converter instanceof MyCustomHttpMessageConverter);
        
        assertTrue(hasCustomConverter);
    }
    
    @Test
    void testConverterMediaTypes() {
        MyCustomHttpMessageConverter converter = new MyCustomHttpMessageConverter();
        List<MediaType> mediaTypes = converter.getSupportedMediaTypes();
        
        assertTrue(mediaTypes.contains(MediaType.valueOf("text/csv")));
    }
}
```

## 7. 常见问题与解决方案

### 7.1 中文乱码问题

**问题描述**：返回的 JSON 或文本数据中出现中文乱码。

**解决方案**：

```java
@Configuration
public class CharsetConfig implements WebMvcConfigurer {
    
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        converters.stream()
            .filter(converter -> converter instanceof StringHttpMessageConverter)
            .findFirst()
            .ifPresent(converter -> {
                ((StringHttpMessageConverter) converter).setDefaultCharset(StandardCharsets.UTF_8);
            });
    }
}
```

### 7.2 日期格式处理

**问题描述**：日期字段序列化格式不符合要求。

**解决方案**：

```java
@Configuration
public class DateFormatConfig {
    
    @Bean
    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter() {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        ObjectMapper objectMapper = new ObjectMapper();
        
        // 设置日期格式
        objectMapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        converter.setObjectMapper(objectMapper);
        return converter;
    }
}
```

### 7.3 循环引用问题

**问题描述**：对象之间存在双向引用导致序列化时出现栈溢出。

**解决方案**：

```java
// 使用 Jackson 注解忽略循环引用
public class User {
    private Long id;
    private String name;
    
    @JsonIgnoreProperties("user")
    private List<Order> orders;
    
    // getters and setters
}

public class Order {
    private Long id;
    private String orderNo;
    
    @JsonIgnore
    private User user;
    
    // getters and setters
}

// 或者配置全局忽略
objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
```

## 8. 总结

HttpMessageConverter 是 Spring Web 框架中处理 HTTP 消息转换的核心组件，它简化了 RESTful API 开发中的数据序列化和反序列化过程。通过深入了解其工作原理和实现机制，可以更有效地处理各种数据格式需求。

关键要点总结：

1. **选择合适的转换器**：根据数据格式需求选择最合适的转换器实现
2. **合理配置优先级**：确保正确的转换器被优先使用
3. **遵循最佳实践**：在自定义转换器时考虑性能、可维护性和兼容性
4. **充分测试**：确保自定义转换器在各种场景下正常工作

通过合理配置和使用 HttpMessageConverter，可以构建高效、灵活且易于维护的 RESTful Web 服务。
