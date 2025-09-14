---
title: Java JDK 命令行工具详解与最佳实践
description: 了解 Java JDK 命令行工具的详细使用方法和最佳实践，包括监控、故障处理、性能调优等。
author: zhycn
---

# Java JDK 命令行工具详解与最佳实践

## 1 JDK 命令行工具概述

Java Development Kit (JDK) 提供了一系列功能强大的命令行工具，用于开发、调试、监控和优化 Java 应用程序。这些工具位于 JDK 安装目录的 `bin` 目录下，无论是简单的开发任务还是复杂的企业级应用故障诊断，它们都能提供 invaluable 的帮助。

### 1.1 工具分类与作用

JDK 命令行工具可以大致分为以下几类：

- **监控与故障处理工具**：用于监控 JVM 运行状态、诊断性能问题和排查故障，如 `jps`、`jstat`、`jinfo`、`jmap`、`jstack` 等。
- **性能监控与可视化工具**：提供图形化界面来监控 JVM 性能和资源消耗，如 `JConsole`。
- **脚本与 REPL 工具**：支持交互式编程和脚本执行，如 `jshell`。
- **开发与打包工具**：用于编译、打包、反编译等开发任务，如 `javac`、`jar`、`javap`、`jlink`、`jpackage` 等。

### 1.2 基本使用场景

在日常 Java 开发和运维中，这些工具常用于：

- **应用监控**：实时监控 Java 应用的运行状态，包括内存使用、GC 情况、线程状态等。
- **性能调优**：分析应用性能瓶颈，优化内存管理和线程调度。
- **故障诊断**：快速定位内存泄漏、死锁、类加载问题等。
- **开发调试**：编译 Java 代码、打包应用、交互式测试代码片段。

下面表格汇总了主要的 JDK 命令行工具及其功能：

| 工具名称       | 主要功能描述                                                                 | 分类               |
| :------------- | :--------------------------------------------------------------------------- | :----------------- |
| `jps`          | 查看所有 Java 进程的启动类、传入参数和 Java 虚拟机参数等信息                     | 监控与故障处理     |
| `jstat`        | 收集 HotSpot 虚拟机各方面的运行数据                                          | 监控与故障处理     |
| `jinfo`        | 显示虚拟机配置信息，并可动态修改部分参数                                     | 监控与故障处理     |
| `jmap`         | 生成堆转储快照（heapdump）                                                     | 监控与故障处理     |
| `jstack`       | 生成虚拟机当前时刻的线程快照                                                 | 监控与故障处理     |
| `JConsole`     | 图形化监控工具，提供全面的 JVM 性能和资源消耗信息                              | 性能监控与可视化   |
| `jshell`       | Java Shell工具，提供交互式 REPL 环境                                          | 脚本与 REPL        |
| `javac`        | Java 编译器，将源代码编译成字节码                                            | 开发与打包         |
| `jar`          | 打包工具，创建和管理 JAR 文件                                                | 开发与打包         |
| `javap`        | Java 反编译工具，解析类文件并显示其成员和方法                                | 开发与打包         |
| `jlink`        | 创建自定义的 Java 运行时镜像                                                 | 开发与打包         |
| `jpackage`     | 打包独立Java应用程序，生成原生安装包                                         | 开发与打包         |

> **注意**：以上工具在不同 JDK 版本中可能会有所增强或调整。本文以 **JDK 21** 为准进行说明，大部分工具也适用于其他较新版本的 JDK。

## 2 JVM 监控与故障处理工具

### 2.1 jps - JVM 进程状态工具

`jps` (JVM Process Status Tool) 用于查看当前系统中所有 Java 进程的状态信息，类似于 UNIX 的 `ps` 命令，但它专门用于 Java 进程。

**常用命令选项**：

```bash
jps [-q] [-mlvV] [<hostid>]
```

- `-q`：只输出进程的本地虚拟机唯一 ID (LVMID，即进程 ID)，不显示主类名称
- `-m`：输出传递给 Java 进程 main() 函数的参数
- `-l`：输出主类的全名，如果进程执行的是 Jar 包，则输出 Jar 路径
- `-v`：输出虚拟机进程启动时显示的 JVM 参数

**示例输出**：

```bash
$ jps -l
7360 firstNettyDemo.NettyClient2
17396
7972 org.jetbrains.jps.cmdline.Launcher
16492 sun.tools.jps.Jps
17340 firstNettyDemo.NettyServer
```

**最佳实践**：

- 使用 `jps -l` 快速获取 Java 进程的完整信息，便于后续使用其他工具时指定目标进程
- 结合 `grep` 命令可以快速查找特定的 Java 进程，例如：`jps -l | grep MyApp`

### 2.2 jstat - JVM 统计监控工具

`jstat` (JVM Statistics Monitoring Tool) 是一个极其强大的命令行工具，用于收集 HotSpot 虚拟机的各方面运行数据，包括类加载、内存、垃圾收集、JIT 编译等运行数据。

**命令格式**：

```bash
jstat -<option> [-t] [-h<lines>] <vmid> [<interval> [<count>]]
```

**常用选项**：

- `-class`：显示类加载相关信息
- `-gc`：显示与 GC 相关的堆信息
- `-gccapacity`：显示各个代的容量及使用情况
- `-gcutil`：显示垃圾收集信息，以占用空间的百分比表示
- `-gccause`：显示垃圾收集的相关信息（同 `-gcutil`），同时显示最后一次或当前正在发生的垃圾收集的原因
- `-compiler`：显示 JIT 编译器编译过的方法、耗时等信息
- `-printcompilation`：输出已经被 JIT 编译的方法

**示例 1：垃圾回收统计**：

```bash
$ jstat -gc 16250
 S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    CCSC   CCSU   YGC     YGCT    FGC    FGCT     GCT   
512.0  512.0   0.0   256.0  30208.0   6170.3   161280.0   19735.6   18048.0 17504.0 2176.0 2002.8    335    0.418   0      0.000    0.418
```

**参数说明**：

- **S0C, S1C**：Survivor 0/1 区容量 (KB)
- **S0U, S1U**：Survivor 0/1 区已使用量 (KB)
- **EC, EU**：Eden 区容量和使用量 (KB)
- **OC, OU**：老年代容量和使用量 (KB)
- **MC, MU**：元空间（Metaspace）容量和使用量 (KB)
- **CCSC, CCSU**：压缩类空间容量和使用量 (KB)
- **YGC, YGCT**：年轻代 GC 次数和耗时
- **FGC, FGCT**：Full GC 次数和耗时
- **GCT**：垃圾回收总耗时

**示例 2：垃圾回收统计百分比**：

```bash
$ jstat -gcutil 31798
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT   
  0.00  25.00  20.42  12.23  95.34  91.12    335    0.418     0    0.000    0.418
```

**示例 3：持续监控**：

```bash
# 每 250 毫秒查询一次进程 5828 垃圾收集状况，一共查询 5 次
jstat -gc 5828 250 5

# 每秒钟监控一次 GC 情况，持续输出
jstat -gcutil <pid> 1000
```

**最佳实践**：

- 使用 `-gcutil` 选项可以快速查看各内存区域的使用百分比，更直观
- 配合时间间隔参数，可以实时观察 GC 频率和内存变化趋势，识别内存泄漏问题
- 结合 `-gccause` 可以了解 GC 发生的原因，帮助优化 GC 性能
- 在性能测试时，使用 `jstat` 监控 GC 情况，评估内存设置是否合理

### 2.3 jinfo - 配置信息工具

`jinfo` (Configuration Info for Java) 用于查看和调整虚拟机参数的实时值。

**常用命令选项**：

```bash
jinfo [option] <pid>
```

**示例**：

```bash
# 输出当前 jvm 进程的全部参数和系统属性
jinfo 17340

# 查看 MaxHeapSize 参数的值
jinfo -flag MaxHeapSize 17340
-XX:MaxHeapSize=2124414976

# 查看是否开启 PrintGC 参数
jinfo -flag PrintGC 17340
-XX:-PrintGC

# 动态开启 PrintGC 参数
jinfo -flag +PrintGC 17340
```

**最佳实践**：

- 在不重启 JVM 的情况下，动态修改参数值对于诊断线上问题非常有用
- 注意：不是所有参数都可以动态修改，只有标记为 `manageable` 的参数才可以
- 使用 `jinfo -flags <pid>` 可以查看所有可动态修改的参数

### 2.4 jmap - 内存映射工具

`jmap` (Memory Map for Java) 用于生成堆转储快照（heap dump），还可以查询 finalizer 执行队列、Java 堆和元空间的详细信息。

**常用命令选项**：

```bash
jmap [option] <pid>
```

**选项**：

- `-heap`：显示 Java 堆详细信息
- `-histo[:live]`：显示堆中对象的统计信息，加上 `live` 只统计活对象
- `-clstats`：显示类加载器统计信息
- `-dump:<format=b,file=filename>`：生成堆转储快照

**示例**：

```bash
# 生成堆转储快照
jmap -dump:format=b,file=heap.hprof 17340
Dumping heap to /path/to/heap.hprof ...
Heap dump file created

# 查看堆中对象统计信息
jmap -histo 17340 | head -20

# 显示堆详细信息
jmap -heap 17340
```

**最佳实践**：

- 使用 `-dump` 生成堆转储文件，然后使用专业工具（如 Eclipse MAT、VisualVM）进行详细分析
- 使用 `-histo:live` 会触发 Full GC，生产环境慎用
- 可以考虑使用 `-XX:+HeapDumpOnOutOfMemoryError` 参数，让 JVM 在发生 OOM 时自动生成堆转储

### 2.5 jhat - 堆转储分析工具

`jhat` (JVM Heap Analysis Tool) 用于分析 `jmap` 生成的堆转储快照。它会建立一个 HTTP/HTML 服务器，让用户可以在浏览器上查看分析结果。

**示例**：

```bash
jhat heap.hprof
Reading from heap.hprof...
Dump file created Sat May 04 12:30:31 CST 2024
Snapshot read, resolving...
Resolving 131419 objects...
Chasing references, expect 26 dots..........................
Eliminating duplicate references..........................
Snapshot resolved.
Started HTTP server on port 7000
Server is ready.
```

访问 `http://localhost:7000` 即可浏览分析结果。

**最佳实践**：

- `jhat` 功能相对简单，对于大型堆转储文件分析速度较慢
- 建议使用更专业的分析工具，如 **Eclipse MAT** (Memory Analyzer Tool) 或 **VisualVM**
- 在服务器环境下，可以将堆转储文件下载到本地进行分析，避免在服务器上运行耗时操作

### 2.6 jstack - 堆栈跟踪工具

`jstack` (Stack Trace for Java) 用于生成虚拟机当前时刻的线程快照。线程快照就是当前虚拟机内每一条线程正在执行的方法堆栈的集合。

**常用命令选项**：

```bash
jstack [option] <pid>
```

**选项**：

- `-F`：当正常输出的请求不被响应时，强制输出线程堆栈
- `-l`：除堆栈外，显示关于锁的附加信息
- `-m`：如果调用到本地方法的话，可以显示 C/C++ 的堆栈

**示例**：

```bash
# 生成线程快照
jstack -l 17340 > thread_dump.txt

# 检测死锁
jstack -l 17340 | grep -A10 deadlock
```

**最佳实践**：

- 使用 `jstack` 诊断线程长时间停顿、死锁、死循环等问题
- 多次采集线程快照（如每隔 5 秒一次），对比分析线程状态变化
- 结合 `top -Hp <pid>` 查看进程中各个线程的 CPU 使用情况，找出高 CPU 占用的线程
- 在 Linux 环境下，可以使用 `printf "%x\n" <tid>` 将线程 ID 转换为十六进制，与 `jstack` 输出中的 nid 字段匹配

## 3 性能监控与可视化工具

### 3.1 JConsole - Java 监控与管理控制台

JConsole 是一个基于 JMX 的图形化监控工具，用于监控 Java 虚拟机的性能和资源消耗。

**启动方式**：

```bash
jconsole [pid]                  # 连接本地进程
jconsole [hostname:port]        # 连接远程进程
jconsole service:jmx:rmi:///jndi/rmi://hostname:port/jmxrmi  # 使用 JMX URL 连接
```

**主要功能**：

1. **概述**：显示 Java 虚拟机的基本信息，包括堆内存使用、线程数、类加载数和 CPU 使用率
2. **内存**：监控堆内存、非堆内存及内存池的使用情况，可执行垃圾回收
3. **线程**：显示线程数变化，检测死锁，查看线程栈信息
4. **类**：监控已加载和已卸载的类数量
5. **VM 摘要**：显示 Java 虚拟机的详细信息，包括类型、版本、参数等
6. **MBean**：管理和查看平台和应用的 MBean

**远程连接配置**：
要使用 JConsole 连接远程 Java 应用，需要在启动应用时添加以下 JMX 参数：

```bash
java -Dcom.sun.management.jmxremote=true \
     -Dcom.sun.management.jmxremote.port=9090 \
     -Dcom.sun.management.jmxremote.ssl=false \
     -Dcom.sun.management.jmxremote.authenticate=false \
     -jar your_application.jar
```

**最佳实践**：

- 在生产环境中，建议启用 JMX 认证和 SSL 加密以确保安全
- 使用 JConsole 的"执行 GC"按钮可以手动触发垃圾回收，观察内存回收效果
- 通过线程选项卡检测死锁，快速定位多线程问题

### 3.2 jvisualvm - 可视化虚拟机监控工具

VisualVM 是一个功能更强大的图形化监控和故障诊断工具，提供了比 JConsole 更丰富的功能。

**启动方式**：

```bash
jvisualvm
```

**主要功能**：

1. **应用程序概览**：显示所有运行的 Java 应用程序
2. **监控**：实时监控 CPU、堆内存、永久代（或元空间）、类和线程的变化
3. **线程**：查看线程状态和线程执行时间，检测死锁
4. **采样器**：对 CPU 和内存进行采样分析，找出热点方法
5. **Profiler**：提供更精确的性能分析功能（JDK 9 后需要安装插件）
6. **快照**：生成性能分析快照，便于后续比较和分析

**插件扩展**：
VisualVM 支持通过插件扩展功能，常用插件包括：

- **Visual GC**：可视化垃圾回收监控
- **BTrace**：动态跟踪分析
- **JConsole Plugin**：兼容 JConsole 的工作方式

**最佳实践**：

- 使用 VisualVM 的"应用程序快照"功能保存问题现场，便于后续分析
- 使用"添加 JMX 连接"功能监控远程服务器上的 Java 应用
- 安装 Visual GC 插件可以直观地观察垃圾回收过程和各内存区域的变化

## 4 Java 脚本与 REPL 工具

### 4.1 jshell - Java Shell 工具

`jshell` 是 JDK 9 引入的 Java Shell 工具，提供了一个交互式的 REPL (Read-Evaluate-Print Loop) 环境，用于快速测试 Java 代码片段。

**启动方式**：

```bash
jshell
jshell /path/to/some_script.jsh  # 执行脚本文件
```

**基本用法**：

```java
// 输入简单的表达式
jshell> 2 + 2
$1 ==> 4

// 定义变量
jshell> String name = "Java"
name ==> "Java"

// 定义方法
jshell> int add(int a, int b) {
   ...> return a + b;
   ...> }
|  已创建 方法 add(int,int)

// 调用方法
jshell> add(5, 3)
$2 ==> 8

// 导入包
jshell> import java.time.*

// 使用导入的类
jshell> LocalDate.now()
$3 ==> 2024-05-04
```

**常用命令**：

- `/help`：查看帮助信息
- `/list`：列出所有输入的代码片段
- `/vars`：列出所有声明的变量
- `/methods`：列出所有声明的方法
- `/types`：列出所有声明的类型
- `/imports`：列出所有导入的包
- `/save`：保存当前会话到文件
- `/open`：从文件加载代码片段
- `/exit`：退出 jshell

**片段类型**：
`jshell` 支持多种代码片段类型，包括：

- **表达式**：被计算并返回结果
- **语句**：如赋值语句、方法调用等
- **变量声明**：声明并初始化变量
- **方法声明**：定义方法
- **类声明**：定义类、接口、枚举等
- **导入声明**：导入包或类

**最佳实践**：

- 使用 `jshell` 快速测试 Java API 和语言特性，无需创建完整的类
- 使用 `/save` 和 `/open` 命令保存和加载常用代码片段
- 使用 Tab 键自动补全代码，提高输入效率
- 在教学中使用 `jshell` 可以更直观地演示 Java 概念

## 5 其他实用工具

### 5.1 jar - Java 归档工具

`jar` 工具用于创建和管理 JAR (Java Archive) 文件，这些文件是包含类文件、资源文件和元数据的压缩包。

**常用命令选项**：

```bash
# 创建 JAR 文件
jar cf myjar.jar MyClass.class

# 创建包含清单文件的 JAR
jar cfm myjar.jar Manifest.txt MyClass.class

# 提取 JAR 文件
jar xf myjar.jar

# 列出 JAR 文件内容
jar tf myjar.jar

# 更新 JAR 文件
jar uf myjar.jar NewClass.class
```

**最佳实践**：

- 使用 `-e` 选项指定可执行 JAR 的主类，例如：`jar cfe app.jar MainClass MainClass.class`
- 在清单文件中指定依赖的类路径：`Class-Path: lib/library1.jar lib/library2.jar`
- 使用 `jarsigner` 工具对 JAR 文件进行签名，确保安全性

### 5.2 javac - Java 编译器

`javac` 是将 Java 源代码编译成字节码的主要工具。

**基本用法**：

```bash
# 编译单个文件
javac HelloWorld.java

# 编译多个文件
javac Main.java Helper.java Util.java

# 指定输出目录
javac -d build/ src/*.java

# 指定类路径
javac -cp .:lib/*.jar MyApp.java

# 指定源代码版本
javac -source 11 -target 11 MyApp.java
```

**最佳实践**：

- 使用 `-d` 选项指定独立的输出目录，避免源代码目录混乱
- 使用 `-cp` 或 `-classpath` 选项正确设置类路径
- 使用 `-source` 和 `-target` 选项确保版本兼容性
- 考虑使用构建工具（如 Maven、Gradle）管理复杂项目的编译过程

### 5.3 javap - Java 类文件反汇编器

`javap` 用于反汇编类文件，显示类的成员和方法信息。

**常用命令选项**：

```bash
# 显示类的公共成员和方法
javap MyClass

# 显示所有成员和方法（包括私有和受保护的）
javap -p MyClass

# 显示详细的字节码指令
javap -c MyClass

# 显示内部类型签名
javap -s MyClass

# 显示常量池
javap -v MyClass
```

**最佳实践**：

- 使用 `javap` 了解编译器生成的字节码，深入理解 Java 语言特性
- 使用 `-c` 选项分析方法的字节码指令，优化性能关键代码
- 使用 `-v` 选项查看常量池，了解类文件的内部结构

### 5.4 jlink - Java 运行时链接器

`jlink` 用于创建自定义的 Java 运行时镜像，只包含应用程序所需的模块。

**基本用法**：

```bash
# 创建自定义运行时
jlink --add-modules java.base,java.logging --output myruntime

# 包含压缩功能
jlink --add-modules java.base --compress=2 --output smallruntime

# 指定启动器
jlink --add-modules java.base --launcher myapp=my.module/my.MainClass --output myappruntime
```

**最佳实践**：

- 使用 `jlink` 创建精简的运行时环境，减小应用部署大小
- 使用 `jdeps` 工具分析应用的模块依赖关系
- 在容器化部署中，使用自定义运行时可以显著减小镜像大小

### 5.5 jpackage - 应用程序打包工具

`jpackage` 是 JDK 14 引入的工具，用于将 Java 应用程序打包为原生安装包。

**基本用法**：

```bash
# 生成应用程序镜像
jpackage --name MyApp --input lib --main-jar myapp.jar --main-class com.example.Main

# 生成原生安装包
jpackage --name MyApp --input lib --main-jar myapp.jar --type rpm  # 或 msi, dmg 等
```

**最佳实践**：

- 使用 `jpackage` 为最终用户创建易于安装的应用程序包
- 为不同平台生成相应的包类型：Windows 使用 `msi` 或 `exe`，macOS 使用 `dmg` 或 `pkg`，Linux 使用 `rpm` 或 `deb`
- 使用 `--java-options` 为应用程序设置合适的 JVM 参数

## 6 工具使用的最佳实践与注意事项

### 6.1 性能调优实践

1. **内存调优**：
    - 使用 `jstat -gcutil` 监控内存使用情况和 GC 效率
    - 观察老年代使用情况，如果持续接近最大值，可能需要增加堆大小或优化对象生命周期
    - 关注 Yong GC 和 Full GC 的频率和耗时，频繁的 Full GC 可能表示内存配置不合理或存在内存泄漏

2. **线程调优**：
    - 使用 `jstack` 定期采集线程快照，分析线程状态分布
    - 检测死锁和线程阻塞问题，优化同步机制
    - 结合 `top -H` 找出 CPU 占用高的线程，优化热点代码

3. **JIT 编译监控**：
    - 使用 `jstat -compiler` 查看方法编译情况
    - 关注编译失败的方法，可能需要优化代码结构

### 6.2 故障排查实践

1. **内存泄漏排查**：
    - 使用 `jmap -histo:live` 查看对象数量统计，识别异常增长的对象类型
    - 生成堆转储文件，使用 MAT 或 VisualVM 分析对象引用链
    - 结合业务代码分析对象的创建和引用情况

2. **CPU 飙升排查**：
    - 使用 `top -Hp <pid>` 找出占用 CPU 高的线程
    - 使用 `jstack` 获取线程快照，分析高 CPU 线程的执行栈
    - 多次采样对比，确定持续占用 CPU 的代码位置

3. **应用停顿排查**：
    - 使用 `jstat -gc` 观察 GC 频率和耗时，确认是否由 GC 引起停顿
    - 使用 `jstack` 检查是否有线程阻塞在同步操作或外部资源访问上

### 6.3 安全使用注意事项

1. **生产环境谨慎使用**：
    - `jmap -dump` 和 `jmap -histo:live` 会触发 Full GC，可能引起应用暂停
    - `jstack` 在某些情况下也可能暂停线程执行
    - 建议在业务低峰期执行这些操作，或通过日志和监控系统提前发现问题

2. **远程连接安全**：
    - 避免使用无认证的 JMX 远程连接
    - 使用 SSL 加密远程监控连接
    - 使用防火墙限制监控端口的访问权限

3. **权限控制**：
    - 生产环境应限制对监控工具的访问权限
    - 使用操作系统权限控制，避免非授权用户访问敏感 JVM 数据

### 6.4 版本兼容性与工具选择

1. **JDK 版本差异**：
    - 注意不同 JDK 版本中工具选项的变化
    - 新版本 JDK 可能移除或替代旧工具（如 Java 9 移除了 `jhat` 的某些功能）

2. **工具替代方案**：
    - 考虑使用更先进的工具，如 `jcmd` 替代部分传统工具功能
    - 使用第三方专业工具（如 Arthas、Async-Profiler）进行更深入的诊断

3. **容器环境适配**：
    - 在容器环境中，需要将工具附加到运行中的容器内
    - 使用 `docker exec` 在容器内执行诊断命令
    - 注意容器资源限制对诊断工具的影响

## 7 总结

Java JDK 提供了一系列功能强大的命令行工具，覆盖了开发、调试、监控和优化的各个方面。从基础的 `javac` 和 `jar`，到性能监控的 `jstat` 和 `jstack`，再到图形化的 JConsole 和 VisualVM，以及现代的 `jshell` 和 `jpackage`，这些工具构成了 Java 生态系统的重要组成部分。

掌握这些工具的使用方法和最佳实践，对于 Java 开发者至关重要。它不仅可以帮助我们快速定位和解决问题，还能深入理解 Java 虚拟机的运行机制，从而编写出更高效、更稳定的应用程序。

随着 Java 平台的不断发展，这些工具也在持续演进。建议开发者保持学习态度，关注新版本中的工具改进和新功能，不断提升自己的技能水平，以应对日益复杂的应用开发和运维挑战。
