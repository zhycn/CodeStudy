---
title: Java jmap 详解与最佳实践
description: 了解 Java jmap 工具的详细信息和最佳实践，包括生成堆转储、分析内存使用情况、排查内存泄漏等。
author: zhycn
---

# Java jmap 详解与最佳实践

## 1 概述

`jmap`（Java Memory Map）是 Java Development Kit (JDK) 中一个强大的命令行工具，用于诊断和分析 Java 应用程序的内存使用情况。它主要用于生成 Java 堆转储文件（Heap Dump）和分析堆内存中的对象分布。作为 JVM 性能调优和内存泄漏排查的重要工具，jmap 可以帮助开发者深入了解 Java 应用程序的内存使用情况，有效诊断内存问题，提高应用性能。

jmap 通过与 JVM 的内部数据结构进行交互来获取堆转储快照。当在命令行中运行 jmap 命令时，它会与 JVM 建立连接并请求获取堆转储信息，JVM 会将堆内存的内容复制到文件中供后续分析。

**核心功能**：

- 生成堆转储快照（Heap Dump）
- 查看堆内存配置和使用情况
- 分析对象直方图（实例数量和内存占用）
- 查看类加载器统计信息
- 显示 Finalizer 队列信息

## 2 适用场景

jmap 在以下场景中特别有用：

- **内存泄漏分析**：通过生成堆转储文件，分析大对象、冗余对象或未被释放的对象引用
- **OutOfMemoryError 诊断**：当出现 OOM 错误时，分析堆内存状态找出原因
- **大对象定位**：识别内存占用异常大的对象实例
- **GC 效率分析**：结合堆内存配置信息分析垃圾回收效率
- **内存使用优化**：分析对象直方图，识别内存占用高的类，优化代码或缓存策略
- **类加载器泄漏排查**：使用 clstats 参数确认是否有冗余类加载器未被回收

## 3 环境准备与基本用法

### 3.1 版本与权限要求

**JDK 版本要求**：

| JDK 版本 | 功能差异                  |
|----------|-------------------------|
| JDK 6    | 基础功能                  |
| JDK 7+   | 支持 -heap 参数           |
| JDK 8+   | 增强诊断功能，部分选项已废弃 |

**权限要求**：

- 执行 jmap 的用户需与启动 Java 进程的用户一致
- 部分功能需要 `-XX:+UsePerfData` JVM 参数支持
- Linux 系统中需要同一用户或有 sudo 权限

### 3.2 查找 Java 进程 ID

使用 jmap 前需要先获取目标 Java 进程的 PID（进程 ID）：

```bash
# 使用 jps 命令查找 Java 进程
jps -l

# 使用 ps 命令查找 Java 进程
ps -ef | grep java
```

### 3.3 命令语法

jmap 的基本命令格式如下：

```bash
jmap [options] <pid>
```

其中：

- `<pid>`：目标 Java 进程的进程 ID
- `[options]`：jmap 的参数选项

## 4 核心功能详解

### 4.1 查看堆内存摘要（-heap）

**命令**：

```bash
jmap -heap <pid>
```

**功能**：显示 Java 堆的配置信息和使用情况，包括堆内存各区域（Eden、Survivor、Old Gen）的分配和使用情况。

**输出示例**：

```bash
Attaching to process ID 28392, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.301-b09

using thread-local object allocation.
Parallel GC with 4 thread(s)

Heap Configuration:
   MinHeapFreeRatio = 40
   MaxHeapFreeRatio = 70
   MaxHeapSize      = 2147483648 (2048.0MB)
   NewSize          = 44564480 (42.5MB)
   OldSize          = 89653248 (85.5MB)
   NewRatio         = 2
   SurvivorRatio    = 8
   MetaspaceSize    = 21807104 (20.796875MB)
   CompressedClassSpaceSize = 1073741824 (1024.0MB)
   MaxMetaspaceSize = 17592186044415 MB

Heap Usage:
PS Young Generation
Eden Space:
   capacity = 12582912 (12.0MB)
   used     = 4194304 (4.0MB)
   free     = 8388608 (8.0MB)
   33.33333333333333% used
From Space:
   capacity = 5242880 (5.0MB)
   used     = 0 (0.0MB)
   free     = 5242880 (5.0MB)
   0.0% used
To Space:
   capacity = 5242880 (5.0MB)
   used     = 0 (0.0MB)
   free     = 5242880 (5.0MB)
   0.0% used
PS Old Generation
   capacity = 89653248 (85.5MB)
   used     = 0 (0.0MB)
   free     = 89653248 (85.5MB)
  0.0% used
```

**注意事项**：

- 在 JDK 9 及更高版本中，`-heap` 参数已弃用，需使用 `jhsdb jmap --heap <pid>` 替代
- 输出中的关键配置参数：
  - **NewRatio**: 新生代与老年代的比例
  - **SurvivorRatio**: Eden 区与 Survivor 区的比例
  - **MetaspaceSize**: 元空间初始大小
  - **CompressedClassSpaceSize**: 压缩类空间大小

### 4.2 生成堆转储文件（-dump）

**命令**：

```bash
jmap -dump:[live,]format=b,file=<filename> <pid>
```

**功能**：生成堆转储快照（Heap Dump）文件，用于离线分析内存使用情况。

**参数说明**：

- `live`（可选）：只转储存活对象（会触发 Full GC）
- `format=b`：指定输出格式为二进制格式
- `file=<filename>`：指定输出文件名

**示例**：

```bash
# 生成包含所有对象的堆转储文件
jmap -dump:format=b,file=heapdump.hprof 1234

# 只生成存活对象的堆转储文件
jmap -dump:live,format=b,file=heapdump_live.hprof 1234
```

**注意事项**：

- 生成堆转储时可能会短暂暂停 JVM（尤其是大堆），生产环境需谨慎操作
- 转储文件大小可能非常大（通常与堆大小相当），需确保有足够磁盘空间
- 建议使用 `.hprof` 作为文件扩展名

### 4.3 查看对象直方图（-histo）

**命令**：

```bash
jmap -histo[:live] <pid>
```

**功能**：显示堆中对象的统计信息，包括每个类的实例数量、占用内存大小和类全名。

**输出示例**：

```bash
 num     #instances         #bytes  class name
----------------------------------------------
   1:         100000      200000000  [B
   2:          50000        8000000  java.lang.String
   3:          20000        3200000  java.lang.Class
   4:          15000        2400000  java.util.HashMap$Node
   5:           5000         800000  java.util.concurrent.ConcurrentHashMap$Node
```

**字段说明**：

- `#instances`：实例数量
- `#bytes`：总占用字节数
- `class name`：类名（[B 表示 byte 数组，[I 表示 int 数组等）

**注意事项**：

- 使用 `live` 参数会触发 Full GC，只统计存活对象，生产环境慎用
- 可以结合 grep 和 sort 命令对输出进行过滤和排序：

  ```bash
  # 查看对象数最多的对象，按降序排序
  jmap -histo <pid> | grep alibaba | sort -k 2 -g -r | less
  
  # 查看占用内存最多的对象，按降序排序
  jmap -histo <pid> | grep alibaba | sort -k 3 -g -r | less
  ```

### 4.4 查看类加载器统计（-clstats）

**命令**：

```bash
jmap -clstats <pid>
```

**功能**：打印类加载器的统计信息，包括类加载器名称、活跃度、地址、父类加载器、加载的类数量和大小等。

**输出示例**：

```bash
ClassLoader                  Parent                    #Classes  #Instances  Bytes
sun/misc/Launcher$AppClassLoader  null                      500       20000     16MB
jdk/internal/loader/ClassLoaders$AppClassLoader null      300       15000     12MB
```

**应用场景**：常用于排查类加载器泄漏问题，特别在动态生成类的框架（如 Groovy）中常见。

### 4.5 查看 Finalizer 信息（-finalizerinfo）

**命令**：

```bash
jmap -finalizerinfo <pid>
```

**功能**：显示在 F-Queue 队列中等待 Finalizer 线程执行 finalize 方法的对象。

**输出示例**：

```bash
Number of objects pending for finalization: 0
```

**应用场景**：用于检查是否有对象长时间等待 finalization，可能指示资源释放问题。

## 5 实战案例演练

### 5.1 案例一：内存泄漏分析

**问题代码**：

```java
public class MemoryLeak {
    static List<byte[]> cache = new ArrayList<>();
    
    public static void main(String[] args) {
        while(true) {
            cache.add(new byte[1024*1024]); // 持续添加1MB数组
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {}
        }
    }
}
```

**分析步骤**：

1. 生成对象直方图，识别异常对象：

   ```bash
   jmap -histo:live 28392 | head -n 20
   ```

   输出可能显示：

   ```bash
   num     #instances         #bytes  class name
   ----------------------------------------------
       1:        183432     1843572480  [B
       2:         5432         521088  java.lang.Class
       3:        23840         381440  java.lang.Object
   ```

2. 发现 byte 数组（[B）占用异常大量内存（约 1.84GB）

3. 生成堆转储文件进行深入分析：

   ```bash
   jmap -dump:live,format=b,file=heapdump.hprof 28392
   ```

4. 使用 MAT 等工具分析堆转储文件，查看 byte 数组的引用链，定位到 MemoryLeak 类中的 cache 静态变量。

### 5.2 案例二：堆内存配置检查

当应用频繁发生 Full GC 或出现 OutOfMemoryError 时，需要检查堆内存配置：

```bash
jmap -heap 28392
```

通过分析输出中的各内存区域使用情况，可以判断是否存在配置问题，如：

- 年轻代过小导致对象过早晋升到老年代
- 老年代空间不足导致 Full GC 频繁
- 元空间大小配置不合理

### 5.3 案例三：自动堆转储脚本

创建自动生成堆转储的脚本，用于定期监控或问题排查：

```bash
#!/bin/bash

PID=$(jps | grep MyApp | awk '{print $1}')
DUMP_DIR="/dump/$(date +%Y%m%d)"
mkdir -p $DUMP_DIR

jmap -dump:live,format=b,file=${DUMP_DIR}/heap_$(date +%H%M%S).hprof $PID
```

## 6 最佳实践

### 6.1 生产环境使用注意事项

1. **谨慎使用 live 参数**：`-histo:live` 和 `-dump:live` 会触发 Full GC，可能导致应用短暂停顿，避免在高负载期间使用。
2. **计划使用**：合理安排生成堆转储的时机，避免在应用程序的关键操作期间进行，以免造成性能影响。
3. **权限管理**：确保执行 jmap 的用户有足够权限访问目标 Java 进程。
4. **磁盘空间监控**：转储文件大小可能非常大（通常与堆大小相当），确保有足够磁盘空间。
5. **替代方案考虑**：考虑使用 `jcmd` 替代部分 jmap 功能，如 `jcmd <pid> GC.heap_dump filename=heap.hprof`。

### 6.2 内存分析工具选择

选择合适的工具分析堆转储文件：

- **Eclipse MAT**：功能强大的堆转储分析工具，提供丰富的内存泄漏检测功能
- **VisualVM**：JDK 自带的图形化监控和分析工具
- **JProfiler**：商业级 Java 性能分析工具
- **YourKit**：另一款商业 Java 分析工具

### 6.3 安全考虑

- **敏感信息保护**：堆转储文件可能包含敏感数据（如数据库密码、加密密钥等），确保妥善保管并在分析后及时删除。
- **访问控制**：限制堆转储文件的访问权限，防止未授权访问。

### 6.4 自动化监控

- **设置 OOM 自动转储**：在 JVM 启动参数中添加以下选项，以便在发生 OutOfMemoryError 时自动生成堆转储：

  ```bash
  -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/path/to/dumps
  ```

- **定期监控**：设置定期的内存监控任务，并自动化生成堆转储文件，便于持续监控内存使用情况。

## 7 故障排除

### 7.1 常见问题及解决方案

1. **无法访问进程**
    - **问题**：jmap 无法访问指定的 Java 进程
    - **解决方案**：确保有足够权限（Linux 中需同一用户或有 sudo 权限），并确认进程确实是 Java 进程

2. **文件权限问题**
    - **问题**：无法生成堆转储文件或写入目标目录
    - **解决方案**：使用 sudo 或更改文件权限

3. **进程无响应**
    - **问题**：jmap 命令执行无响应
    - **解决方案**：使用强制模式 `jmap -F`，但需注意这可能导致数据不一致

4. **JDK 版本兼容性问题**
    - **问题**：某些选项在新 JDK 版本中已废弃（如 `-heap` 在 JDK 9+ 中已弃用）
    - **解决方案**：使用替代方案（如 `jhsdb jmap --heap`）或更新命令

## 8 替代工具与综合诊断

### 8.1 jcmd：现代替代方案

从 JDK 7 开始引入的 `jcmd` 是一个更现代的替代工具，集成了 jmap、jstack 等功能：

```bash
# 生成堆转储
jcmd <pid> GC.heap_dump filename=heap.hprof

# 获取直方图
jcmd <pid> GC.class_histogram
```

### 8.2 综合工具链

内存分析通常需要结合多种工具：

| 工具名称         | 作用领域                     |
|------------------|----------------------------|
| Eclipse MAT      | 堆转储深度分析               |
| VisualVM         | 实时内存监控                 |
| jstat            | GC 统计监控                 |
| Arthas           | 在线诊断                    |
| Async-Profiler   | 低开销分析工具，适合生产环境 |

### 8.3 综合排查流程

建议的内存问题排查流程：

```bash
内存异常报警 → jmap -heap 检查配置 → jmap -histo 初步分析 → 生成堆转储 → MAT 分析 → 定位代码问题 → 优化验证
```

## 9 总结

jmap 是 Java 开发者不可或缺的内存分析工具，提供了多种功能来帮助诊断内存相关问题。通过正确使用 jmap 和相关分析工具，开发者可以有效地识别内存泄漏、优化内存使用和提高应用程序性能。

**关键要点**：

1. 掌握 jmap 核心功能和使用场景
2. 在生产环境中谨慎使用，避免性能影响
3. 结合其他工具（如 MAT、VisualVM）进行深度分析
4. 建立自动化监控和故障排查流程
5. 关注 JDK 版本变化，及时调整命令用法

通过本教程的学习，您应该能够掌握 jmap 的核心功能和使用方法，独立完成内存泄漏分析，解读内存分析报告，并设计有效的内存优化方案。

> **温馨提示**：本文档基于 JDK 8 编写，不同 JDK 版本的具体命令可能略有差异，请根据实际环境调整。
