---
title: Fastjson2 与 Spring Boot 3 集成详解与最佳实践
description: 本文详细介绍了如何在Spring Boot 3项目中集成Fastjson2，包括环境准备、依赖配置、基本使用和最佳实践。
---

# Fastjson2 与 Spring Boot 3 集成详解与最佳实践

Fastjson2 官方文档：<https://github.com/alibaba/fastjson2>

## 1. Fastjson2 概览与 Spring Boot 3 集成价值

Fastjson2 是阿里巴巴开源的高性能JSON处理库，作为Fastjson的重要升级版本，它在性能、安全性和功能完整性方面都有了显著提升。Fastjson2 **完全重构**了原有架构，支持JSON/JSONB两种协议，并提供了一系列先进特性，使其成为现代Java应用处理JSON数据的理想选择。

相较于其他JSON处理库，Fastjson2具有以下**核心优势**：

- **卓越的性能表现**：Fastjson2在序列化和反序列化操作上比Jackson和Gson等库快数倍，特别是在处理大规模数据时表现更加突出
- **更低的内存占用**：优化后的内存管理机制减少了GC压力，提高了应用稳定性
- **丰富的功能集**：支持全量/部分解析、JSONPath一站式处理、多种数据格式转换等高级功能
- **更好的安全性**：修复了早期Fastjson版本的多个安全漏洞，提供了更安全的默认配置

Spring Boot 3作为新一代Java应用开发框架，**全面拥抱**了Java 17和Spring Framework 6，提供了更好的性能和新特性。将Fastjson2与Spring Boot 3集成，可以充分发挥两者优势，为开发者提供**极致的数据处理体验**。

## 2. 环境准备与基本配置

### 2.1 项目依赖配置

在Spring Boot 3项目中集成Fastjson2，首先需要在项目中添加相关依赖。根据Fastjson2的版本策略，2.0.23版本之后为了兼容不同Spring版本，将扩展库分成了针对Spring 5.x和6.x的不同版本。

在Maven项目中，需要在`pom.xml`中添加以下依赖配置：

```xml
<properties>
    <java.version>17</java.version>
    <spring-boot.version>3.1.3</spring-boot.version>
    <fastjson2.version>2.0.43</fastjson2.version>
</properties>

<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Fastjson2核心库 -->
    <dependency>
        <groupId>com.alibaba.fastjson2</groupId>
        <artifactId>fastjson2</artifactId>
        <version>${fastjson2.version}</version>
    </dependency>

    <!-- Fastjson2 Spring 6扩展 (兼容Spring Boot 3) -->
    <dependency>
        <groupId>com.alibaba.fastjson2</groupId>
        <artifactId>fastjson2-extension-spring6</artifactId>
        <version>${fastjson2.version}</version>
    </dependency>
</dependencies>
```

对于Gradle项目，需要在`build.gradle`中添加以下依赖：

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'com.alibaba.fastjson2:fastjson2:2.0.43'
    implementation 'com.alibaba.fastjson2:fastjson2-extension-spring6:2.0.43'
}
```

### 2.2 配置Fastjson2为默认JSON处理器

Spring Boot默认使用Jackson作为JSON处理器，要替换为Fastjson2，需要创建一个配置类来实现WebMvcConfigurer接口，并重写configureMessageConverters方法。

```java
import com.alibaba.fastjson2.JSONReader;
import com.alibaba.fastjson2.JSONWriter;
import com.alibaba.fastjson2.support.config.FastJsonConfig;
import com.alibaba.fastjson2.support.spring.http.converter.FastJsonHttpMessageConverter;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class Fastjson2Configuration implements WebMvcConfigurer {

    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        // 创建Fastjson2消息转换器
        FastJsonHttpMessageConverter converter = new FastJsonHttpMessageConverter();

        // 创建配置对象
        FastJsonConfig config = new FastJsonConfig();

        // 配置序列化特性
        config.setWriterFeatures(
            JSONWriter.Feature.WriteMapNullValue,        // 输出空值字段
            JSONWriter.Feature.WriteNullListAsEmpty,     // 空List输出为[]而非null
            JSONWriter.Feature.WriteNullStringAsEmpty,   // 空String输出为""而非null
            JSONWriter.Feature.PrettyFormat,             // 格式化输出
            JSONWriter.Feature.WriteLongAsString,        // Long类型转String避免精度丢失
            JSONWriter.Feature.WriteDateUseDateFormat    // 日期格式化
        );

        // 配置反序列化特性
        config.setReaderFeatures(
            JSONReader.Feature.SupportSmartMatch,        // 智能匹配字段名
            JSONReader.Feature.FieldBased,               // 基于字段反序列化
            JSONReader.Feature.SupportArrayToBean        // 支持数组到对象转换
        );

        // 设置日期格式
        config.setDateFormat("yyyy-MM-dd HH:mm:ss");

        // 设置字符编码
        config.setCharset(StandardCharsets.UTF_8);

        // 将配置应用到转换器
        converter.setFastJsonConfig(config);

        // 设置支持的媒体类型
        List<MediaType> mediaTypes = new ArrayList<>();
        mediaTypes.add(MediaType.APPLICATION_JSON);
        mediaTypes.add(MediaType.TEXT_HTML);
        mediaTypes.add(MediaType.APPLICATION_ATOM_XML);
        mediaTypes.add(MediaType.APPLICATION_FORM_URLENCODED);
        converter.setSupportedMediaTypes(mediaTypes);

        // 将转换器添加到转换器列表的首位，确保优先使用Fastjson2
        converters.add(0, converter);
    }
}
```

此配置类完成了以下关键设置：

- 配置了**序列化特性**，如空值处理、日期格式、格式化输出等
- 配置了**反序列化特性**，如智能字段匹配、基于字段的反序列化等
- 设置了支持的**媒体类型**，确保Fastjson2能处理各种JSON相关请求
- 将转换器添加到转换器列表的**首位**，确保优先使用Fastjson2而不是Jackson

### 2.3 移除Jackson依赖（可选）

如果希望完全移除Jackson以避免任何潜在冲突，可以在Maven配置中排除Jackson依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-json</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

但通常情况下，保留Jackson依赖也是安全的，因为Fastjson2配置在首位会优先使用。

## 3. 高级功能与特性配置

### 3.1 序列化特性详解

Fastjson2提供了丰富的序列化特性，可以通过JSONWriter.Feature枚举进行配置。以下是一些最常用的序列化特性及其作用：

| 特性                   | 说明             | 推荐场景                   |
| ---------------------- | ---------------- | -------------------------- |
| WriteMapNullValue      | 输出空值字段     | 需要完整数据结构的API      |
| WriteNullListAsEmpty   | 空List输出为[]   | 前端期望一致数据类型的场景 |
| WriteNullStringAsEmpty | 空String输出为"" | 避免前端处理null值         |
| PrettyFormat           | 格式化输出       | 开发调试阶段               |
| WriteLongAsString      | Long转String     | 避免JavaScript精度丢失     |
| WriteDateUseDateFormat | 日期格式化       | 统一日期格式               |
| BrowserCompatible      | 浏览器兼容       | 需要兼容老浏览器的应用     |
| WriteEnumUsingName     | 枚举输出name     | 需要可读性高的枚举值       |

可以通过FastJsonConfig的setWriterFeatures方法配置多个特性：

```java
config.setWriterFeatures(
    JSONWriter.Feature.WriteMapNullValue,
    JSONWriter.Feature.WriteNullListAsEmpty,
    JSONWriter.Feature.WriteNullStringAsEmpty,
    JSONWriter.Feature.PrettyFormat,
    JSONWriter.Feature.WriteLongAsString,
    JSONWriter.Feature.WriteDateUseDateFormat
);
```

### 3.2 反序列化特性详解

反序列化特性通过JSONReader.Feature枚举配置，以下是一些关键特性：

| 特性                   | 说明               | 推荐场景               |
| ---------------------- | ------------------ | ---------------------- |
| SupportSmartMatch      | 智能字段名匹配     | 处理不同命名规范的JSON |
| FieldBased             | 基于字段反序列化   | 提高反序列化性能       |
| SupportArrayToBean     | 支持数组转对象     | 处理数组格式的JSON     |
| InitStringFieldAsEmpty | 初始化空字符串字段 | 避免null值处理         |
| TrimString             | 去除字符串前后空格 | 处理用户输入数据       |
| SupportAutoType        | 支持自动类型       | 处理多态类型序列化     |

配置反序列化特性：

```java
config.setReaderFeatures(
    JSONReader.Feature.SupportSmartMatch,
    JSONReader.Feature.FieldBased,
    JSONReader.Feature.SupportArrayToBean,
    JSONReader.Feature.TrimString
);
```

### 3.3 自定义序列化与反序列化

对于一些特殊场景，可能需要自定义序列化和反序列化逻辑。Fastjson2提供了简便的方式来实现这一需求。

**示例：自定义日期序列化**

```java
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONWriter;
import com.alibaba.fastjson2.writer.ObjectWriter;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class CustomLocalDateTimeWriter implements ObjectWriter<LocalDateTime> {

    private static final DateTimeFormatter formatter =
        DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm:ss");

    @Override
    public void write(JSONWriter writer, Object object, Object fieldName, Type fieldType, long features) {
        LocalDateTime dateTime = (LocalDateTime) object;
        writer.writeString(dateTime.format(formatter));
    }
}
```

注册自定义序列化器：

```java
@Configuration
public class CustomFastjsonConfig {

    @PostConstruct
    public void registerCustomSerializers() {
        JSON.register(LocalDateTime.class, new CustomLocalDateTimeWriter());
    }
}
```

### 3.4 与Redis集成配置

在Spring Boot应用中，Redis是常用的缓存和数据存储解决方案。以下是如何配置RedisTemplate使用Fastjson2进行序列化：

```java
import com.alibaba.fastjson2.support.spring.data.redis.FastJsonRedisSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfiguration {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        // 使用Fastjson2序列化值
        FastJsonRedisSerializer<Object> serializer = new FastJsonRedisSerializer<>(Object.class);

        // 使用StringRedisSerializer序列化键
        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);

        template.afterPropertiesSet();
        return template;
    }
}
```

此配置确保Redis中存储的数据使用Fastjson2进行序列化，与Web层的序列化方式保持一致。

## 4. 最佳实践与性能优化

### 4.1 配置优化建议

根据实际项目经验，以下是一些Fastjson2配置的最佳实践：

1. **生产环境配置**：

   ```java
   @Configuration
   public class ProductionFastjsonConfig implements WebMvcConfigurer {

       @Override
       public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
           FastJsonHttpMessageConverter converter = new FastJsonHttpMessageConverter();
           FastJsonConfig config = new FastJsonConfig();

           // 生产环境配置 - 优化性能
           config.setWriterFeatures(
               JSONWriter.Feature.WriteMapNullValue,
               JSONWriter.Feature.WriteNullListAsEmpty,
               JSONWriter.Feature.WriteNullStringAsEmpty,
               JSONWriter.Feature.WriteLongAsString,
               JSONWriter.Feature.WriteDateUseDateFormat
           );

           // 禁用PrettyFormat以提高性能
           // 禁用循环引用检测以提高性能
           config.setReaderFeatures(
               JSONReader.Feature.SupportSmartMatch,
               JSONReader.Feature.FieldBased,
               JSONReader.Feature.SupportArrayToBean
           );

           // 设置日期格式
           config.setDateFormat("yyyy-MM-dd HH:mm:ss");

           converter.setFastJsonConfig(config);
           converter.setSupportedMediaTypes(Collections.singletonList(MediaType.APPLICATION_JSON));
           converters.add(0, converter);
       }
   }
   ```

2. **线程安全考虑**：FastJsonConfig和FastJsonHttpMessageConverter都是**线程安全**的，可以在整个应用中共享使用。

3. **内存占用优化**：对于内存敏感的环境，可以配置JSONReader.Feature.IgnoreSetNullValue避免创建null值字段。

### 4.2 常见问题与解决方案

1. **中文乱码问题**：
   解决方案：确保配置了UTF-8字符编码

   ```java
   config.setCharset(StandardCharsets.UTF_8);
   converter.setDefaultCharset(StandardCharsets.UTF_8);
   ```

2. **日期格式不一致**：
   解决方案：全局设置日期格式

   ```java
   config.setDateFormat("yyyy-MM-dd HH:mm:ss");
   ```

3. **Long类型精度丢失**：
   解决方案：启用WriteLongAsString特性

   ```java
   config.setWriterFeatures(JSONWriter.Feature.WriteLongAsString);
   ```

4. **循环引用问题**：
   解决方案：禁用循环引用检测（提高性能）

   ```java
   // 使用DisableCircularReferenceDetect特性
   config.setWriterFeatures(JSONWriter.Feature.DisableCircularReferenceDetect);
   ```

5. **字段名智能匹配**：
   解决方案：启用SupportSmartMatch特性

   ```java
   config.setReaderFeatures(JSONReader.Feature.SupportSmartMatch);
   ```

### 4.3 性能优化策略

1. **缓存配置**：Fastjson2内部有丰富的缓存机制，一般情况下不需要额外配置。但对于超高并发场景，可以考虑调整缓存大小：

   ```java
   // 调整序列化器缓存大小（默认256）
   System.setProperty("fastjson2.parserFeaturesCacheSize", "512");
   System.setProperty("fastjson2.symbolTableSize", "512");
   ```

2. **避免频繁创建对象**：重用JSON实例和配置对象，避免频繁GC。

3. **选择合适的特性**：不必要的特性会增加处理时间，应根据实际需求选择最小特性集。

4. **使用JSONB格式**：对于内部系统通信，可以考虑使用JSONB格式提高性能：

   ```java
   // 启用JSONB支持
   config.setJsonb(true);
   ```

## 5. 总结

本文详细介绍了如何在Spring Boot 3项目中集成Fastjson2作为默认JSON处理器。通过合理的配置和优化，Fastjson2能够显著提升应用的JSON处理性能，同时提供丰富的功能满足各种业务场景需求。

**关键要点总结**：

- Fastjson2在性能上相比Jackson和Gson有**明显优势**，特别适合高并发场景
- 通过配置FastJsonHttpMessageConverter可以**轻松替换**默认的Jackson处理器
- 合理的特性配置能够**平衡功能**和性能需求
- 与Redis等组件的集成**保持一致性**，避免序列化不一致问题

**最终建议**：在生产环境中使用Fastjson2时，应根据具体业务需求选择合适的特性配置，并密切关注内存使用和性能指标。定期更新Fastjson2版本以获取性能优化和安全补丁也是非常重要的。

通过本文的指南，您应该能够在Spring Boot 3项目中成功集成和优化Fastjson2，为您的应用提供高效、稳定的JSON处理能力。
