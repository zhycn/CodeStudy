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

- [Java 编程语言简介](./java-introduction.md)
- [Java 各版本主要特性详解](./java-version-features.md)
- [Java 基础语法详解](./java-basic-syntax.md)
- [Java 注释详解](./java-comments.md)
- [Java 修饰符详解](./java-modifier.md)
- [Java 运算符详解](./java-operators.md)
- [Java 包（Package）详解与最佳实践](./java-package.md)
- [Java 变量命名规则详解](./java-variable-naming.md)
- [Java 基本数据类型详解](./java-datatypes.md)
- [Java 字符串详解](./java-string.md)
- [Java 构造方法详解与最佳实践](./java-constructor.md)
- [Java 异常处理详解](./java-exception.md)
- [Java 枚举详解](./java-enum.md)
- [Java 集合框架详解](./java-collection-framework.md)
- [Java List 集合详解与最佳实践](./java-list.md)
- [Java Set 集合详解与最佳实践](./java-set.md)
- [Java Queue 集合详解与最佳实践](./java-queue.md)
- [Java Deque 集合详解与最佳实践](./java-deque.md)
- [Java Map 集合详解与最佳实践](./java-map.md)
- [Java 接口（interface）详解与最佳实践](./java-interface.md)
- [Java 泛型详解与最佳实践](./java-generics.md)
- [Java 注解详解](./java-annotation.md)
- [Java 数组详解](./java-array.md)
- [Java 日期时间详解与最佳实践](./java-date-time.md)
- [Java Optional 详解与最佳实践](./java-optional.md)
- [Java Lambda 表达式详解与最佳实践](./java-lambda.md)
- [Java 函数式接口详解与最佳实践](./java-functional-interface.md)
- [Java Stream API 详解与最佳实践](./java-stream.md)
- [Java 迭代器（Iterator）详解与最佳实践](./java-iterator.md)
- [Java 正则表达式详解](./java-regular-expression.md)
- [Java 文件操作详解](./java-file.md)
- [Java 多线程编程详解与最佳实践](./java-multi-threading.md)
- [Java 线程池详解与最佳实践](./java-thread-pool.md)
- [Java IO 详解与最佳实践](./java-io.md)
- [Java NIO 详解与最佳实践](./java-nio.md)
- [Java Base64 详解与最佳实践](./java-base64.md)
- [Java Scanner 类详解与最佳实践](./java-scanner.md)
- [Java 反射（Reflection）详解与最佳实践](./java-reflection.md)
- [Java 数据库编程（JDBC）详解与最佳实践](./java-jdbc.md)
- [Java Math 类详解与最佳实践](./java-math.md)
- [Java 网络编程详解与最佳实践](./java-network.md)
- [Java 面向对象编程（OOP）核心思想详解与最佳实践](./java-oop.md)
- [Java 序列化与反序列化详解与最佳实践](./java-serializable.md)
- [Java 对象和类详解](./java-object-classes.md)
- [Java 虚拟机（JVM）详解与最佳实践](./java-jvm.md)
- [Java 设计模式精讲：单例模式与工厂模式](./java-design-pattern-p1.md)
- [Java 设计模式精讲：代理模式与模板方法模式](./java-design-pattern-p2.md)
- [JVM 垃圾回收（GC）机制详解与最佳实践](./java-gc.md)
- [Java 内存模型（JMM）详解与最佳实践](./java-jmm.md)
- [JVM 调优与常用工具详解及最佳实践](./java-jvm-tuning.md)
- [Java 并发编程（JUC）详解与最佳实践](./java-juc.md)
- [Java 开发环境配置详解与最佳实践](./java-development-environment.md)
<!--
- [Java 内存管理详解与最佳实践](./java-memory-management.md)
- [Java 性能优化详解与最佳实践](./java-performance-optimization.md)
- [Java 内存泄漏（Memory Leak）详解与最佳实践](./java-memory-leak.md)
- [Java 内存溢出（Out of Memory）详解与最佳实践](./java-out-of-memory.md)
- [Java 垃圾回收（Garbage Collection）详解与最佳实践](./java-garbage-collection.md)
- [Java 类加载机制详解与最佳实践](./java-class-loading.md)
- [Java 设计模式详解与最佳实践](./java-design-pattern.md) -->
