---
title: Spring XML Marshalling （OXM）详解与最佳实践
description: 本文详细介绍了 Spring 框架中 XML Marshalling (OXM) 的核心概念、配置方式、最佳实践以及实际应用场景。通过掌握这些知识，开发者可以在企业级应用中高效、一致地处理 XML 数据绑定，提升系统的可维护性和可扩展性。
author: zhycn
---

# Spring XML Marshalling （OXM）详解与最佳实践

- [Marshalling XML by Using Object-XML Mappers](https://docs.spring.io/spring-framework/reference/data-access/oxm.html)

## 1. 概述

在现代企业级应用开发中，系统间经常需要通过 XML (eXtensible Markup Language) 格式进行数据交换。将内存中的 Java 对象转换为 XML 格式的过程称为 **Marshalling**（序列化），反之，将 XML 转换回 Java 对象的过程称为 **Unmarshalling**（反序列化）。

Spring 框架通过其 **OXM (Object-to-XML Mapping)** 抽象层，为这些操作提供了强大且一致的支持。这种抽象允许开发者在不依赖特定底层技术的前提下，便捷地处理 XML 数据绑定，并在需要时轻松切换实现技术（如 JAXB, XStream 等）。

本文将深入探讨 Spring OXM 的核心概念、两种主要的配置方式（模板注入与资源抽象），并提供基于 JAXB 和 XStream 的完整示例与最佳实践。

## 2. 核心概念与 Spring OXM 抽象

### 2.1 什么是 Marshalling/Unmarshalling？

- **Marshalling**: 将 Java 对象树转换为 XML 文档的过程。
- **Unmarshalling**: 将 XML 文档解析并构建为 Java 对象树的过程。

### 2.2 Spring OXM 抽象层

Spring 通过两个核心接口定义了这些操作：

1. **`Marshaller`**: 所有序列化器的顶级接口，定义了 `marshal(Object graph, Result result)` 等方法。
2. **`Unmarshaller`**: 所有反序列化器的顶级接口，定义了 `Object unmarshal(Source source)` 等方法。

不同的 XML 映射技术（如 JAXB, Castor, XStream, JibX 等）通过实现这两个接口，被整合到 Spring 的生态中。这种设计使得业务代码与特定的 XML 处理技术解耦，极大地提升了代码的可维护性和灵活性。

## 3. 环境配置与依赖引入

本文以主流的 **JAXB**（自 JDK 6 起内置）和功能强大的 **XStream** 为例。首先需要在你的 `pom.xml` 中引入相关依赖。

### 3.1 Maven 依赖

```xml
<!-- Spring OXM 抽象支持 (Spring Context 已包含) -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>6.1.6</version> <!-- 请使用你的 Spring 版本 -->
</dependency>

<!-- Spring 对于 JAXB 的集成支持 -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-oxm</artifactId>
    <version>6.1.6</version> <!-- 请使用你的 Spring 版本 -->
</dependency>

<!-- XStream 库 -->
<dependency>
    <groupId>com.thoughtworks.xstream</groupId>
    <artifactId>xstream</artifactId>
    <version>1.4.20</version> <!-- 请注意检查最新版本 -->
</dependency>
```

> **注意**: 如果你使用 JDK 11 或更高版本，由于 Java EE 模块的移除，你可能需要额外引入 JAXB API 和实现。
>
> ```xml
> <dependency>
>     <groupId>jakarta.xml.bind</groupId>
>     <artifactId>jakarta.xml.bind-api</artifactId>
>     <version>4.0.1</version>
> </dependency>
> <dependency>
>     <groupId>com.sun.xml.bind</groupId>
>     <artifactId>jaxb-impl</artifactId>
>     <version>4.0.5</version>
>     <scope>runtime</scope>
> </dependency>
> ```

## 4. 定义数据模型（Java Object）

我们定义一个简单的 `User` 对象作为后续操作的数据模型。

```java
// User.java
import jakarta.xml.bind.annotation.*;

// JAXB 注解
@XmlRootElement(name = "user")        // 指定作为 XML 根元素的名称
@XmlAccessorType(XmlAccessType.FIELD) // 指定使用字段而非属性进行映射
public class User {

    @XmlAttribute(name = "id")       // 将字段映射为 XML 元素的属性
    private Long id;

    @XmlElement(name = "username")   // 将字段映射为 XML 子元素
    private String username;

    @XmlElement(name = "email")
    private String email;

    // 必须有无参构造函数（JAXB 要求）
    public User() {
    }

    public User(Long id, String username, String email) {
        this.id = id;
        this.username = username;
        this.email = email;
    }

    // Getter 和 Setter 方法省略，但实际开发中必须存在
    // ...
    @Override
    public String toString() {
        return "User{" + "id=" + id + ", username='" + username + '\'' + ", email='" + email + '\'' + '}';
    }
}
```

## 5. 基于 JAXB 的配置与实现

JAXB (Java Architecture for XML Binding) 是 Java 标准规范，通常作为首选。

### 5.1 Spring XML 配置方式

在 `applicationContext.xml` 中配置 JAXB2 的 Marshaller/Unmarshaller。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

    <!-- 配置 JAXB2 Marshaller，用于处理 User 类 -->
    <bean id="jaxb2Marshaller" class="org.springframework.oxm.jaxb.Jaxb2Marshaller">
        <property name="classesToBeBound">
            <list>
                <value>com.example.model.User</value>
            </list>
        </property>
        <!-- 如果需要处理多个类，可以使用 packagesToScan -->
        <!-- <property name="packagesToScan" value="com.example.model"/> -->
    </bean>

</beans>
```

### 5.2 代码实现：服务类与模板注入

创建一个服务类，通过依赖注入的方式使用 `Jaxb2Marshaller`。

```java
// UserXmlService.java
import com.example.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.oxm.Marshaller;
import org.springframework.oxm.Unmarshaller;
import org.springframework.stereotype.Service;
import javax.xml.transform.Result;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;

@Service
public class UserXmlService {

    private final Marshaller marshaller;
    private final Unmarshaller unmarshaller;

    // 构造函数注入（推荐）
    @Autowired
    public UserXmlService(Marshaller jaxb2Marshaller) { // Bean 名称匹配
        this.marshaller = jaxb2Marshaller;
        this.unmarshaller = (Unmarshaller) jaxb2Marshaller; // Jaxb2Marshaller 同时实现两个接口
    }

    /**
     * 将 User 对象序列化为 XML 字符串
     */
    public String marshalUserToXml(User user) throws IOException {
        StringWriter writer = new StringWriter();
        Result result = new StreamResult(writer);
        marshaller.marshal(user, result);
        return writer.toString();
    }

    /**
     * 将 XML 字符串反序列化为 User 对象
     */
    public User unmarshalXmlToUser(String xml) throws IOException {
        StringReader reader = new StringReader(xml);
        StreamSource source = new StreamSource(reader);
        return (User) unmarshaller.unmarshal(source);
    }
}
```

### 5.3 测试类

```java
import org.springframework.oxm.jaxb.Jaxb2Marshaller;

import java.io.IOException;

public class TestUserXmlService {

  public static void main(String[] args) throws IOException {
    // ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("applicationContext.xml");
    // Jaxb2Marshaller jaxb2Marshaller = context.getBean(Jaxb2Marshaller.class);

    Jaxb2Marshaller jaxb2Marshaller = new Jaxb2Marshaller();
    jaxb2Marshaller.setClassesToBeBound(User.class);

    UserXmlService service = new UserXmlService(jaxb2Marshaller);

    // 创建测试对象
    User user = new User(1L, "john_doe", "john.doe@example.com");

    // 测试 Marshalling
    String xmlOutput = service.marshalUserToXml(user);
    System.out.println("Marshalled XML:");
    System.out.println(xmlOutput);

    // 测试 Unmarshalling
    User unmarshalledUser = service.unmarshalXmlToUser(xmlOutput);
    System.out.println("\nUnmarshalled User Object:");
    System.out.println(unmarshalledUser);

    // 验证对象是否相等（基于 equals 方法，此处未重写，比较的是引用）
    System.out.println("\nAre objects equal? " + user.equals(unmarshalledUser)); // 应为 false（除非重写 equals）
    System.out.println("Are field values equal? " +
      user.getId().equals(unmarshalledUser.getId()) +
      user.getUsername().equals(unmarshalledUser.getUsername())); // 应为 true
  }
}
```

**预期输出：**

```xml
Marshalled XML:
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<user id="1">
    <username>john_doe</username>
    <email>john.doe@example.com</email>
</user>

Unmarshalled User Object:
User{id=1, username='john_doe', email='john.doe@example.com'}
```

## 6. 基于 XStream 的配置与实现

XStream 是一个更轻量、灵活的库，不需要注解即可工作，但也可以通过注解配置。

### 6.1 Spring XML 配置

在 `applicationContext.xml` 中添加 XStream 的配置。

```xml
<!-- 配置 XStream Marshaller -->
<bean id="xstreamMarshaller" class="org.springframework.oxm.xstream.XStreamMarshaller">
    <!-- 可选：配置别名，将类全限定名映射为更简洁的 XML 元素名 -->
    <property name="aliases">
        <map>
            <entry key="user" value="com.example.model.User"/>
        </map>
    </property>
    <!-- 如果使用注解，需要显式启用注解处理 -->
    <!-- <property name="annotatedClasses">
        <list>
            <value>com.example.model.User</value>
        </list>
    </property> -->
</bean>
```

### 6.2 代码实现

创建一个使用 `XStreamMarshaller` 的服务类。其代码与 `UserXmlService` 几乎完全相同，唯一的区别是注入的 Bean 是 `xstreamMarshaller`。

```java
// UserXmlServiceWithXStream.java
@Service
public class UserXmlServiceWithXStream {

    private final Marshaller marshaller;
    private final Unmarshaller unmarshaller;

    @Autowired
    public UserXmlServiceWithXStream(@Qualifier("xstreamMarshaller") Marshaller xstreamMarshaller) {
        this.marshaller = xstreamMarshaller;
        this.unmarshaller = (Unmarshaller) xstreamMarshaller;
    }
    // ... 其余方法与 JAXB 版本完全一致
}
```

**使用 XStream 时，甚至可以从 `User` 类中移除所有 JAXB 注解，XStream 依然能够正常工作。** 其默认输出可能略有不同：

```xml
<com.example.model.User>
  <id>1</id>
  <username>john_doe</username>
  <email>john.doe@example.com</email>
</com.example.model.User>
```

通过配置 `aliases`，我们可以优化输出的 XML 结构。

## 7. 最佳实践

### 7.1 资源抽象与 `Resource` 接口

始终使用 Spring 的 `Resource` 抽象（如 `ClassPathResource`, `FileSystemResource`）来读写文件，而不是直接使用 `java.io.*`。这提供了更好的灵活性和统一的错误处理机制。

```java
// 最佳实践：使用 Resource 进行文件操作
import org.springframework.core.io.Resource;
import org.springframework.core.io.ClassPathResource;

public void marshalToFile(User user, Resource resource) throws IOException {
    try (OutputStream os = resource.getOutputStream()) {
        Result result = new StreamResult(os);
        marshaller.marshal(user, result);
    }
}

public User unmarshalFromFile(Resource resource) throws IOException {
    try (InputStream is = resource.getInputStream()) {
        Source source = new StreamSource(is);
        return (User) unmarshaller.unmarshal(source);
    }
}

// 调用示例
// marshalToFile(user, new FileSystemResource("/data/user.xml"));
// User userFromFile = unmarshalFromFile(new ClassPathResource("data/user.xml"));
```

### 7.2 性能考量

- **池化 Marshaller**: 像 JAXB 这样的技术，其 `Marshaller`/`Unmarshaller` 实例的创建开销可能很大。Spring 的 `Jaxb2Marshaller` 是线程安全的，它在内部有效地处理了这些资源的池化和复用。**因此，应将其配置为单例 Bean，并注入到所有需要的地方，避免自行创建实例。**

### 7.3 安全考量（XStream 特供）

XStream 在反序列化时存在已知的安全漏洞，攻击者可通过构造恶意 XML 执行任意代码。

**必须采取的防护措施：**

1. **使用白名单**：这是最有效的方法。只允许反序列化已知的、安全的类。

   ```java
   @Bean
   public XStreamMarshaller xstreamMarshaller() {
       XStreamMarshaller marshaller = new XStreamMarshaller();
       // 设置安全的 XStream 实例
       XStream xstream = marshaller.getXStream();
       // 设置显式的、严格的白名单
       xstream.allowTypes(new Class[]{com.example.model.User.class});
       // 或者使用允许的完整包名模式（仍需谨慎）
       // xstream.allowTypesByWildcard(new String[]{"com.example.model.*"});
       return marshaller;
   }
   ```

2. **升级版本**：始终使用最新版本的 XStream，以获取最新的安全补丁。

### 7.4 异常处理

Spring OXM 操作会抛出 `org.springframework.oxm.XmlMappingException` 和 `IOException`。应在服务层或控制器层进行统一捕获，并将其转换为对用户友好的错误信息。

```java
try {
    return userXmlService.unmarshalXmlToUser(xmlString);
} catch (XmlMappingException e) {
    throw new InvalidInputException("提供的 XML 格式无效或无法映射", e);
} catch (IOException e) {
    throw new DataAccessException("读取 XML 数据时发生 I/O 错误", e);
}
```

### 7.5 技术选型建议

- **JAXB**: **首选**。它是 Java 标准，与 JDK 集成良好，注解支持完善，社区成熟。适合大多数需要 schema (XSD) 验证、与 Jakarta EE 规范紧密集成的场景。
- **XStream**: 适用于快速原型开发、需要高度灵活性（无需修改类即可序列化）、或者处理遗留 XML 格式的场景。**但必须高度重视其安全问题。**
- **其他**： Jackson XML（`jackson-dataformat-xml`）也是一个非常好的选择，尤其如果你的项目已经在使用 Jackson 处理 JSON，它可以提供几乎一致的 API 体验。

## 8. 总结

Spring Framework 的 OXM 模块通过统一的 `Marshaller` 和 `Unmarshaller` 接口，优雅地抽象了底层 XML 数据绑定技术的细节，践行了 **“依赖抽象，而非实现”** 的重要原则。

- **优势**：技术解耦、配置简化、资源管理优化、异常处理统一。
- **核心步骤**：
  1. 定义模型（使用 JAXB 注解或依靠默认映射）。
  2. 在 Spring 容器中配置对应的 Marshaller Bean（如 `Jaxb2Marshaller`）。
  3. 通过依赖注入将 Marshaller 集成到服务组件中。
  4. 使用 `marshal()` 和 `unmarshal()` 方法，结合 Spring 的 `Resource` 抽象进行数据操作。
- **切记**：若选用 XStream，**安全第一**，务必配置白名单并保持版本更新。

通过遵循本文所述的最佳实践，你可以轻松、安全、高效地在你的 Spring 应用程序中集成 XML 数据访问功能。
