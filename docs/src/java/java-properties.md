---
title: Java Properties 属性类详解与最佳实践
author: zhycn
---

# Java Properties 属性类详解与最佳实践

## 1 Properties 类概述

`java.util.Properties` 类是 Java 中用于处理配置信息的核心工具类，它继承自 `Hashtable<Object, Object>` 类并实现了 `Map<Object, Object>` 接口，专门用于处理**键值对形式**的配置数据，其中键和值都是字符串类型。Properties 类在 Java 应用程序中广泛应用于配置管理、国际化资源管理以及应用程序设置的持久化存储。

### 1.1 核心特点

Properties 类具有以下几个显著特点：

- **简单易用**：提供了直观的 API 用于读取和写入键值对配置信息
- **文件集成**：原生支持 `.properties` 文件的加载和保存，无需额外解析逻辑
- **编码处理**：支持多种编码方式（包括 ISO-8859-1 和 UTF-8）
- **默认值支持**：允许设置默认属性值，避免空指针异常
- **国际化**：与 ResourceBundle 结合支持多语言环境
- **XML 支持**：从 JDK 1.5 开始支持 XML 格式的属性文件

### 1.2 Properties 文件格式

Properties 文件是一种简单的文本文件，遵循键值对格式的基本规则：

- 每行包含一个键值对，格式为 `key=value` 或 `key:value`
- 等号/冒号前后的空格会被自动忽略
- 以 `#` 或 `!` 开头的行被视为注释
- 值中可以包含转义字符（如 `\n`, `\t`, `\\` 等）
- 默认编码为 ISO-8859-1，但推荐使用 UTF-8 处理多语言字符

## 2 核心 API 与方法

### 2.1 构造方法

Properties 类提供了三个构造方法：

```java
// 1. 创建空的属性列表
Properties props1 = new Properties();

// 2. 创建指定初始容量的空属性列表
Properties props2 = new Properties(16); // 初始容量为16个元素

// 3. 创建带有默认值的属性列表
Properties defaultProps = new Properties();
defaultProps.setProperty("timeout", "30");
Properties props3 = new Properties(defaultProps); // 设置默认属性
```

### 2.2 属性操作方法

Properties 类提供了一系列用于操作属性的方法：

| 方法名                                         | 描述                             | 返回值         |
| ---------------------------------------------- | -------------------------------- | -------------- |
| `setProperty(String key, String value)`        | 设置键值对                       | String (旧值)  |
| `getProperty(String key)`                      | 获取指定键的值                   | String         |
| `getProperty(String key, String defaultValue)` | 获取指定键的值，若无则返回默认值 | String         |
| `remove(Object key)`                           | 移除指定键及其对应的值           | Object         |
| `clear()`                                      | 清空所有键值对                   | void           |
| `containsKey(Object key)`                      | 判断是否包含指定键               | boolean        |
| `containsValue(Object value)`                  | 判断是否包含指定值               | boolean        |
| `propertyNames()`                              | 返回所有键的枚举                 | Enumeration<?> |
| `stringPropertyNames()`                        | 返回所有字符串键的集合           | Set\<String\>  |

### 2.3 文件加载与保存方法

Properties 类提供了多种方法用于从流中加载和保存属性：

| 方法名                                                         | 描述                       | 编码方式   |
| -------------------------------------------------------------- | -------------------------- | ---------- |
| `load(InputStream inStream)`                                   | 从输入流加载属性           | ISO-8859-1 |
| `load(Reader reader)`                                          | 从字符流加载属性           | 支持 UTF-8 |
| `loadFromXML(InputStream in)`                                  | 从 XML 输入流加载属性      | UTF-8      |
| `store(OutputStream out, String comments)`                     | 将属性保存到输出流         | ISO-8859-1 |
| `store(Writer writer, String comments)`                        | 将属性保存到字符流         | 支持 UTF-8 |
| `storeToXML(OutputStream os, String comment)`                  | 将属性保存为 XML 格式      | UTF-8      |
| `storeToXML(OutputStream os, String comment, String encoding)` | 将属性保存为指定编码的 XML | 指定编码   |

## 3 基本使用与示例

### 3.1 读取 Properties 文件

#### 3.1.1 从类路径读取

```java
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class PropertiesReadDemo {
    public static void main(String[] args) {
        Properties props = new Properties();

        try (InputStream in = PropertiesReadDemo.class
                .getClassLoader()
                .getResourceAsStream("config.properties")) {

            if (in == null) {
                throw new RuntimeException("未找到config.properties文件");
            }

            props.load(in);

            // 读取单个配置
            String username = props.getProperty("username");
            String password = props.getProperty("password");

            System.out.println("用户名：" + username);
            System.out.println("密码：" + password);

            // 遍历所有配置
            System.out.println("\n所有配置项：");
            props.stringPropertyNames().forEach(key -> {
                String value = props.getProperty(key);
                System.out.println(key + " = " + value);
            });

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### 3.1.2 从绝对路径读取

```java
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

public class PropertiesAbsolutePathDemo {
    public static void main(String[] args) {
        Properties props = new Properties();
        String filePath = "D:/config/app.properties";

        try (FileInputStream fis = new FileInputStream(filePath)) {
            props.load(fis);
            System.out.println("应用名称：" + props.getProperty("app.name"));
            System.out.println("版本号：" + props.getProperty("app.version"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 3.2 写入 Properties 文件

```java
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Properties;

public class PropertiesWriteDemo {
    public static void main(String[] args) {
        Properties props = new Properties();

        // 设置属性值
        props.setProperty("app.name", "MyApplication");
        props.setProperty("app.version", "1.0.0");
        props.setProperty("db.url", "jdbc:mysql://localhost:3306/mydb");
        props.setProperty("db.username", "admin");
        props.setProperty("db.password", "secret");

        // 保存到文件
        try (FileOutputStream fos = new FileOutputStream("app.properties")) {
            props.store(fos, "应用程序配置信息");
            System.out.println("配置文件已成功保存");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

生成的 `app.properties` 文件内容如下：

```properties
#应用程序配置信息
#Mon Jul 29 15:30:00 CST 2024
app.name=MyApplication
app.version=1.0.0
db.url=jdbc:mysql://localhost:3306/mydb
db.username=admin
db.password=secret
```

### 3.3 修改 Properties 文件

```java
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Properties;

public class PropertiesUpdateDemo {
    public static void main(String[] args) {
        String filePath = "config.properties";
        Properties props = new Properties();

        // 先加载现有配置
        try (FileInputStream fis = new FileInputStream(filePath)) {
            props.load(fis);
        } catch (IOException e) {
            e.printStackTrace();
        }

        // 修改配置值
        props.setProperty("app.version", "2.0.0");
        props.setProperty("app.debug", "true");

        // 移除配置项
        props.remove("obsolete.setting");

        // 保存回文件
        try (FileOutputStream fos = new FileOutputStream(filePath)) {
            props.store(fos, "更新后的配置");
            System.out.println("配置文件已更新");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 4 高级特性与最佳实践

### 4.1 中文与特殊字符处理

#### 4.1.1 处理中文乱码问题

Properties 文件默认使用 ISO-8859-1 编码，直接存储中文会导致乱码。推荐使用 UTF-8 编码读写中文内容：

```java
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

public class PropertiesChineseDemo {
    public static void main(String[] args) {
        Properties props = new Properties();

        // 写入含中文的配置（UTF-8编码）
        props.setProperty("app.name", "我的应用");
        props.setProperty("app.desc", "这是一个测试应用");

        try (OutputStream out = new FileOutputStream("app_zh.properties");
             Writer writer = new OutputStreamWriter(out, StandardCharsets.UTF_8)) {
            props.store(writer, "中文配置示例");
        } catch (IOException e) {
            e.printStackTrace();
        }

        // 读取含中文的配置（UTF-8编码）
        try (InputStream in = new FileInputStream("app_zh.properties");
             Reader reader = new InputStreamReader(in, StandardCharsets.UTF_8)) {
            Properties readProps = new Properties();
            readProps.load(reader);

            System.out.println("应用名称：" + readProps.getProperty("app.name"));
            System.out.println("应用描述：" + readProps.getProperty("app.desc"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### 4.1.2 特殊字符转义

Properties 文件中的特殊字符需要进行转义处理：

```java
import java.util.Properties;

public class PropertiesEscapeDemo {
    public static void main(String[] args) {
        Properties props = new Properties();

        // 包含特殊字符的值
        props.setProperty("path", "C:\\Program Files\\MyApp");
        props.setProperty("multi.line", "第一行\n第二行");
        props.setProperty("special.chars", "value with = and :");

        // 读取时会自动处理转义
        String path = props.getProperty("path"); // 返回: C:\Program Files\MyApp
        String multiLine = props.getProperty("multi.line"); // 返回: 第一行\n第二行

        System.out.println("路径: " + path);
        System.out.println("多行: " + multiLine);
    }
}
```

### 4.2 默认值设置与使用

Properties 类支持设置默认值，防止键不存在时返回 null：

```java
import java.util.Properties;

public class PropertiesDefaultDemo {
    public static void main(String[] args) {
        // 方式1：创建带默认值的Properties对象
        Properties defaults = new Properties();
        defaults.setProperty("timeout", "30");
        defaults.setProperty("max.connections", "10");

        Properties props = new Properties(defaults);

        // 设置实际值
        props.setProperty("host", "localhost");
        props.setProperty("port", "8080");

        // 获取存在的值
        String host = props.getProperty("host"); // 返回: "localhost"

        // 获取不存在的值，返回默认值
        String timeout = props.getProperty("timeout"); // 返回: "30"
        String maxConn = props.getProperty("max.connections"); // 返回: "10"

        // 方式2：使用带默认值的getProperty方法
        String retries = props.getProperty("retries", "3"); // 返回: "3"

        System.out.println("主机: " + host);
        System.out.println("超时: " + timeout);
        System.out.println("最大连接数: " + maxConn);
        System.out.println("重试次数: " + retries);
    }
}
```

### 4.3 XML 格式支持

Properties 类支持 XML 格式的属性文件：

```java
import java.io.*;
import java.util.Properties;

public class PropertiesXMLDemo {
    public static void main(String[] args) {
        Properties props = new Properties();

        // 设置属性
        props.setProperty("database.host", "localhost");
        props.setProperty("database.port", "3306");
        props.setProperty("database.name", "testdb");

        // 保存为XML格式
        try (OutputStream out = new FileOutputStream("config.xml")) {
            props.storeToXML(out, "数据库配置", "UTF-8");
            System.out.println("XML配置文件已保存");
        } catch (IOException e) {
            e.printStackTrace();
        }

        // 从XML文件加载
        Properties loadedProps = new Properties();
        try (InputStream in = new FileInputStream("config.xml")) {
            loadedProps.loadFromXML(in);

            System.out.println("数据库主机: " + loadedProps.getProperty("database.host"));
            System.out.println("数据库端口: " + loadedProps.getProperty("database.port"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

生成的 XML 文件内容如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
<comment>数据库配置</comment>
<entry key="database.host">localhost</entry>
<entry key="database.port">3306</entry>
<entry key="database.name">testdb</entry>
</properties>
```

### 4.4 线程安全考虑

Properties 类继承自 Hashtable，是线程安全的。但在高并发环境下，仍需注意以下事项：

```java
import java.util.Collections;
import java.util.Properties;

public class ThreadSafeProperties {
    private final Properties properties = new Properties();

    // 使用同步方法确保线程安全
    public synchronized String getProperty(String key) {
        return properties.getProperty(key);
    }

    public synchronized String getProperty(String key, String defaultValue) {
        return properties.getProperty(key, defaultValue);
    }

    public synchronized void setProperty(String key, String value) {
        properties.setProperty(key, value);
    }

    public synchronized void removeProperty(String key) {
        properties.remove(key);
    }

    // 或者使用Collections包装器实现完全线程安全
    private static Properties createThreadSafeProperties() {
        Properties props = new Properties();
        return (Properties) Collections.synchronizedMap(props);
    }
}
```

### 4.5 最佳实践总结

根据实际开发经验，以下是使用 Properties 类的最佳实践：

1. **编码统一**：始终使用 UTF-8 编码处理 Properties 文件，避免中文乱码问题
2. **资源管理**：使用 try-with-resources 语句确保流正确关闭，防止资源泄漏
3. **默认值设置**：为可能不存在的属性提供合理的默认值，增强程序健壮性
4. **配置分层**：采用默认配置和用户自定义配置分离的策略，便于维护和升级
5. **异常处理**：妥善处理 IOException，提供有意义的错误信息
6. **文件位置**：将配置文件放在类路径下，使用 ClassLoader 读取，避免绝对路径依赖
7. **缓存策略**：对不经常变化的配置进行缓存，减少文件 I/O 操作
8. **线程安全**：在多线程环境中采取适当的同步措施

## 5 总结

Java Properties 类是一个简单而强大的配置管理工具，适用于各种规模的应用程序。通过掌握其基本用法和高级特性，开发者可以有效地管理应用程序配置，实现配置与代码的分离，提高应用程序的灵活性和可维护性。

### 5.1 适用场景

Properties 类特别适用于以下场景：

- 应用程序配置管理（数据库连接、服务器设置等）
- 国际化资源文件管理
- 小型数据持久化存储
- 框架和库的配置选项
- 动态配置更新和持久化

### 5.2 最终建议

对于简单的配置需求，Properties 类是一个优秀的选择。但对于更复杂的配置需求（如嵌套结构、复杂数据类型），建议考虑使用其他配置方案，如 JSON、YAML 或专业的配置管理工具。

无论选择哪种方式，良好的配置管理实践都是构建可维护、可扩展应用程序的关键因素。Properties 类作为 Java 标准库的一部分，提供了简单易用的 API，是每个 Java 开发者都应该掌握的基础工具。
