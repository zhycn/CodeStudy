# Java 编程指南

你是否准备好成为一名资深Java开发者了？让我们开始这段激动人心的编程之旅吧！

本指南将帮助你系统地学习Java编程，从基础概念到高级特性，循序渐进地掌握Java开发技能。

本指南是完全开源的学习资料，基于 MIT 开源协议发布。我们欢迎你通过以下方式参与：

- 在 GitHub 上 Star 和 Fork
- 提交 Issue 或 Pull Request 来改进内容
- 分享给更多需要的朋友

让我们一起打造更好的 Java 学习资源！

::: info 声明
本指南是由人类程序员与AI协作完成。AI辅助内容包括但不限于：

- 文章结构的优化建议
- 代码示例的生成与验证
- 技术插图的绘制
- 知识点的归纳整理

人类程序员负责：

- 技术内容的审核把关
- 实际案例的补充
- 最佳实践的分享
- 整体质量的把控
  :::

## 什么是 Java?

Java 是一门流行的、高级的、面向对象的编程语言，也是一种平台，最初由 Sun Microsystems（现为 Oracle Corporation 的一部分）于1995年5月正式推出。它的设计目标是让开发者能够"**一次编写，到处运行**"（Write Once, Run Anywhere, WORA），这意味着编译后的 Java 代码（字节码）可以在所有支持 Java 的平台上运行，而无需重新编译。

Java 不仅是一种编程语言，更是一个完整的技术生态系统。它包含了强大的开发工具（如 IDE、构建工具）、丰富的标准类库（Java API）、高性能的运行时环境（JRE）以及活跃的开源社区。据统计，全球已有超过 **150亿台设备** 运行 Java 程序，应用范围涵盖企业软件、Android 移动应用、云计算、微服务、大数据处理、人工智能等众多领域，是当今最受欢迎的编程语言之一。

::: info Java 官方资源
Oracle 提供了丰富的 Java 相关资源：

- **官方网站**
  - Java 主页：<https://www.java.com/zh-CN/>
  - Oracle Java 技术：<https://www.oracle.com/java/>
  - OpenJDK 项目：<https://openjdk.org/>

- **下载资源**
  - JDK 下载：<https://www.oracle.com/cn/java/technologies/downloads/>
  - OpenJDK 下载：<https://jdk.java.net/>

- **开发工具**
  - IntelliJ IDEA：<https://www.jetbrains.com/idea/>
  - Eclipse：<https://www.eclipse.org/>
  - NetBeans：<https://netbeans.apache.org/>
  - Visual Studio Code：<https://code.visualstudio.com/>

- **技术文档**
  - Java SE 文档中心：<https://docs.oracle.com/en/java/javase/>
  - Java API 文档：[JDK 8](https://docs.oracle.com/javase/8/docs/api/index.html) | [JDK 11](https://docs.oracle.com/javase/11/docs/api/index.html) | [JDK 17](https://docs.oracle.com/javase/17/docs/api/index.html) | [JDK 21](https://docs.oracle.com/en/java/javase/21/docs/api/index.html) | [JDK 24](https://docs.oracle.com/javase/24/docs/api/index.html)
  - Java 语言规范：<https://docs.oracle.com/javase/specs/>
  - Java 官方教程：<https://docs.oracle.com/javase/tutorial/>

:::

## 文档列表

### 1. Java 语言基础

此组涵盖 Java 编程的基本元素，包括语法、数据类型、运算符等，适合初学者入门。

- [Java 编程语言简介](./java-introduction.md)
- [Java 各版本主要特性详解](./java-version-features.md)
- [Java 基础语法详解](./java-basic-syntax.md)
- [Java 注释详解与最佳实践](./java-comments.md)
- [Java 修饰符详解与最佳实践](./java-modifier.md)
- [Java 运算符详解](./java-operators.md)
- [Java Package 包详解与最佳实践](./java-package.md)
- [Java 关键字与保留字完整指南](./java-keywords.md)
- [Java 变量命名规则详解](./java-variable-naming.md)
- [Java 基本数据类型详解](./java-datatypes.md)
- [Java String 字符串详解](./java-string.md)

### 2. 面向对象编程 (OOP)

此组重点介绍 Java 的面向对象编程概念，包括类、对象、接口、继承等。

- [Java 对象和类详解](./java-object-classes.md)
- [Java 构造方法详解与最佳实践](./java-constructor.md)
- [Java 面向对象编程（OOP）核心思想详解与最佳实践](./java-oop.md)
- [Java Enum 枚举详解与最佳实践](./java-enum.md)
- [Java Interface 接口详解与最佳实践](./java-interface.md)
- [Java Record 记录类详解与最佳实践](./java-record.md)
- [Java 密封类 (Sealed Class) 详解与最佳实践](./java-sealed-class.md)

### 3. 集合框架

此组详细讲解 Java 集合框架，包括各种集合类型、迭代器和工具类。

- [Java 集合框架详解与最佳实践](./java-collection-framework.md)
- [Java List 集合详解与最佳实践](./java-list.md)
- [Java Set 集合详解与最佳实践](./java-set.md)
- [Java Queue 集合详解与最佳实践](./java-queue.md)
- [Java Deque 集合详解与最佳实践](./java-deque.md)
- [Java Map 集合详解与最佳实践](./java-map.md)
- [Java Iterator 迭代器详解与最佳实践](./java-iterator.md)
- [Java Collections 工具类详解与最佳实践](./java-collections.md)
- [Java Comparator 比较器接口详解与最佳实践](./java-comparator.md)
- [Java Collectors 工具类详解与最佳实践](./java-collectors.md)

### 4. 异常处理

此组专注于 Java 的异常处理机制。

- [Java 异常处理详解与最佳实践](./java-exception.md)
- [Java 常用异常类完整指南](./java-exception-guides.md)

### 5. 多线程与并发

此组涵盖多线程编程、并发工具和内存模型。

- [Java 多线程编程详解与最佳实践](./java-multi-threading.md)
- [Java 线程池详解与最佳实践](./java-thread-pool.md)
- [Java 并发编程（JUC）详解与最佳实践](./java-juc.md)
- [Java 内存模型（JMM）详解与最佳实践](./java-jmm.md)
- [Java ThreadLocal 详解与最佳实践](./java-threadlocal.md)
- [Java Future 接口详解与最佳实践](./java-future.md)
- [Java Fork/Join 框架详解与最佳实践](./java-fork-join.md)
- [Java 并发编程核心接口详解与最佳实践](./java-juc-api.md)

### 6. 输入输出 (I/O)

此组介绍 Java 的输入输出操作，包括文件处理、IO/NIO 和压缩。

- [Java File 文件操作详解](./java-file.md)
- [Java IO 详解与最佳实践](./java-io.md)
- [Java NIO 详解与最佳实践](./java-nio.md)
- [Java Scanner 类详解与最佳实践（知道就好）](./java-scanner.md)
- [Java 压缩与解压缩 API 详解与最佳实践](./java-compression.md)
- [Java IO 核心组件详解与最佳实践](./java-io-components.md)
- [Java NIO 核心组件详解与最佳实践](./java-nio-components.md)

### 7. 高级语言特性

此组包括 Java 的高级特性，如泛型、注解、Lambda 表达式和 Stream API。

- [Java 泛型详解与最佳实践](./java-generics.md)
- [Java Annotation 注解详解与最佳实践](./java-annotation.md)
- [Java Lambda 表达式详解与最佳实践](./java-lambda.md)
- [Java 函数式接口详解与最佳实践](./java-functional-interface.md)
- [Java Stream API 详解与最佳实践](./java-stream.md)
- [Java Optional 详解与最佳实践](./java-optional.md)
- [Java 数组详解与最佳实践](./java-array.md)
- [Java 正则表达式详解](./java-regular-expression.md)

### 8. 工具类和实用程序

此组涵盖 Java 常用的工具类，如 Arrays、Math 和 Base64。

- [Java Arrays 工具类详解与最佳实践](./java-arrays.md)
- [Java Objects 工具类详解与最佳实践](./java-objects.md)
- [Java Math 类详解与最佳实践](./java-math.md)
- [Java Base64 详解与最佳实践](./java-base64.md)
- [Java Timer 详解与最佳实践（不建议使用）](./java-timer.md)
- [Java BigInteger 与 BigDecimal 详解与最佳实践](./java-biginteger-bigdecimal.md)
- [Java Random 工具类详解与最佳实践](./java-random.md)
- [Java Properties 属性类详解与最佳实践](./java-properties.md)
- [Java StringJoiner 详解与最佳实践](./java-StringJoinner.md)

### 9. 日期和时间

此组专注于 Java 的日期和时间处理。

- [Java 日期时间详解与最佳实践](./java-date-time.md)

### 10. 数据库和网络编程

此组介绍数据库编程（JDBC）、网络编程和 HttpClient。

- [Java 数据库编程（JDBC）详解与最佳实践](./java-jdbc.md)
- [Java 网络编程详解与最佳实践](./java-network.md)
- [Java HttpClient 详解与最佳实践](./java-httpclient.md)
- [Java SQL 编程详解与最佳实践](./java-sql.md)

### 11. 反射和高级特性

此组包括反射、模块化、JNI 和序列化等高级主题。

- [Java Reflection 反射详解与最佳实践](./java-reflection.md)
- [Java 模块化详解与最佳实践](./java-modularity.md)
- [Java 本地方法接口 (JNI) 详解与最佳实践](./java-jni.md)
- [Java 序列化与反序列化详解与最佳实践](./java-serializable.md)
- [Java Invoke 详解与最佳实践](./java-invoke.md)

### 12. 设计模式

此组讲解常用的 Java 设计模式。

- [Java 设计模式精讲：单例模式与工厂模式](./java-design-pattern-p1.md)
- [Java 设计模式精讲：代理模式与模板方法模式](./java-design-pattern-p2.md)

### 13. 安全编程

此组涵盖加密、解密、哈希和数字签名等安全编程主题。

- [Java 安全编程：加密、解密、哈希与数字签名详解与最佳实践](./java-encryption.md)
- [Java Security 详解与最佳实践](./java-security.md)
- [Java KeyTool 详解与最佳实践](./java-keytool.md)

### 14. 虚拟机和性能

此组深入探讨 JVM、垃圾回收、类加载和性能调优。

- [Java 虚拟机（JVM）详解与最佳实践](./java-jvm.md)
- [JVM 垃圾回收（GC）机制详解与最佳实践](./java-gc.md)
- [Java 内存模型（JMM）详解与最佳实践](./java-jmm.md)
- [JVM 调优与常用工具详解及最佳实践](./java-jvm-tuning.md)
- [Java 类加载机制详解与最佳实践](./java-class-loading.md)
- [Java 进程与 Runtime 类详解与最佳实践](./java-process-runtime.md)

### 15. 开发环境和配置

此组介绍开发环境配置和系统属性。

- [Java 开发环境配置详解与最佳实践](./java-development-environment.md)
- [Java 系统属性（System Properties）详解与最佳实践](./java-system-properties.md)

### 16. 国际化和本地化

此组涵盖国际化和本地化相关主题。*强烈推荐使用 Spring Boot 进行国际化和本地化配置。*

- [Java 国际化 (i18n) 与本地化 (l10n) 详解与最佳实践](./java-i18n.md)
- [Java 资源绑定（Resource Bundle）详解与最佳实践](./java-resource-bundle.md)

### 17. 日志框架

此组详细介绍 Java 日志框架。

- [Java 日志框架详解与最佳实践](./java-logging.md)

### 18. 其他主题

此组包括一些特定主题，如图像处理，脚本，SPI，XML等。

- [Java 已过时的技术清单（不要再学了）](./java-outdated.md)
- [Java 高效图片处理详解与最佳实践](./java-imageio.md)
- [Java XML 处理详解与最佳实践](./java-xml.md)
- [Java Scripting 详解与最佳实践](./java-scripting.md)
- [Java JNDI 详解与最佳实践](./java-jndi.md)
- [Java SPI 详解与最佳实践](./java-spi.md)
