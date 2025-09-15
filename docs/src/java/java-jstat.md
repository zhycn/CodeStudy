---
title: Java jstat 详解与最佳实践
description: 这篇文章详细介绍了 Java 中的 jstat 工具，包括其基本概念、安装方法、常用命令和参数，以及如何使用 jstat 进行性能监控和故障诊断。
author: zhycn
---

# Java jstat 详解与最佳实践

作为 Java 开发者，理解和掌握 JVM 性能监控工具对于应用程序的调优和故障诊断至关重要。`jstat`（Java Virtual Machine Statistics Monitoring Tool）是 JDK 提供的一个轻量级命令行工具，用于监控 Java 虚拟机（JVM）的各种运行状态信息，它是我们洞察 JVM 内部运行机制的“窗口”。

## 1 认识 jstat

### 1.1 jstat 简介

`jstat` 是 JDK 自带的一个轻量级性能监控工具，它位于 Java 的 bin 目录下。`jstat` 利用 JVM 内建的指令对 Java 应用程序的资源和性能进行实时的命令行监控，主要关注堆内存（Heap size）和垃圾回收（Garbage Collection）状况。其最大的优势在于，**无需重启 JVM 或修改启动参数**，即可动态捕获 JVM 的性能统计信息。

### 1.2 jstat 的重要性

在缺乏 GUI 图形界面的服务器环境（通常是生产环境）中，`jstat` 成为了**运行期定位虚拟机性能问题的首选工具**。它能够提供关于类加载、内存、垃圾收集、JIT 编译等丰富的运行数据，帮助开发者：

- **实时监控**：动态观察 JVM 各项指标的变化趋势。
- **性能调优**：根据内存使用和 GC 情况，合理调整 JVM 参数。
- **故障诊断**：快速定位内存泄漏、GC 频繁或内存溢出等问题。

## 2 jstat 安装与基本使用

### 2.1 安装与验证

`jstat` 是 JDK 的一部分，因此只要正确安装了 JDK 并配置了 `JAVA_HOME` 环境变量，并且将 `$JAVA_HOME/bin` 加入了 `PATH` 环境变量，就可以直接在命令行中使用 `jstat` 命令。

可以通过以下命令验证 `jstat` 是否可用：

```bash
jstat -help
```

### 2.2 基本命令格式

`jstat` 命令的基本格式如下：

```bash
jstat [generalOption] [interval] [count]
```

更详细的语法是：

```bash
jstat [option] <LVMID> [interval] [count]
```

- **`option`**：指定要监控的数据类型（**必选**），例如 `-gc` 监控垃圾收集相关的统计信息。选项后可以附加 `-t` 来显示时间戳，或 `-h <lines>` 定期显示表头。
- **`LVMID`**：Local Virtual Machine IDentifier，即目标 JVM 的进程 ID (PID)。你可以使用 `jps` 或 `ps` 命令来查找 Java 进程的 PID。
- **`interval`**：连续输出之间的时间间隔（单位：毫秒或秒）。例如 `1000` 或 `1s` 都代表 1 秒。
- **`count`**：连续输出的次数。如果省略，则默认一直输出。

**查找 Java 进程 PID**：
使用 `jps` 命令可以快速查看当前系统中的 Java 进程及其 PID：

```bash
$ jps
3550 MyApp
5647 Jps
```

这里 `3550` 就是名为 "MyApp" 的 Java 应用的进程 ID。

## 3 jstat 核心选项详解

`jstat` 提供了丰富的监控选项。以下是其主要选项及其作用的总结：

| 选项                    | 主要作用           | 核心关注点                                                   |
| :---------------------- | :----------------- | :----------------------------------------------------------- |
| **`-class`**            | 类加载/卸载监控    | `Loaded`, `Unloaded`, `Time`                                 |
| **`-compiler`**         | JIT 编译监控       | `Compiled`, `Failed`, `Invalid`                              |
| **`-gc`**               | GC 行为全景监控    | `EC`, `EU`, `OC`, `OU`, `YGC`, `FGC`, `GCT`                  |
| **`-gccapacity`**       | 堆内存容量分析     | `NGCMN`, `NGCMX`, `OGCMN`, `OGCMX`, `OGC`                    |
| **`-gcutil`**           | 堆内存使用率监控   | `E`, `O`, `M`, `YGC`, `FGC`, `GCT`                           |
| **`-gccause`**          | GC 原因追踪        | 同 `-gcutil`, 增加 `LGCC`(最后一次GC原因), `GCC`(当前GC原因) |
| **`-gcnew`**            | 新生代详细分析     | `S0C`, `S1C`, `S0U`, `S1U`, `TT`, `MTT`                      |
| **`-gcnewcapacity`**    | 新生代内存容量     | `NGCMN`, `NGCMX`, `S0CMX`, `S1CMX`, `ECMX`                   |
| **`-gcold`**            | 老年代与元空间分析 | `OU`, `MU`, `FGCT`, `GCT`                                    |
| **`-gcoldcapacity`**    | 老年代内存容量     | `OGCMN`, `OGCMX`, `OGC`                                      |
| **`-gcmetacapacity`**   | 元空间容量监控     | `MCMN`, `MCMX`, `MC`                                         |
| **`-printcompilation`** | 方法编译监控       | `Compiled`, `Size`, `Type`, `Method`                         |

### 3.1 类加载监控 (`-class`)

**命令示例**：

```bash
jstat -class 12345
```

**输出解析**：

| 列名       | 说明                               |
| :--------- | :--------------------------------- |
| `Loaded`   | 已加载类的总数                     |
| `Bytes`    | 加载类占用的字节数（KB）           |
| `Unloaded` | 卸载的类数量                       |
| `Bytes`    | 卸载类占用的字节数（KB）           |
| `Time`     | 执行类加载和卸载操作的总耗时（秒） |

**问题诊断**：

- **类泄漏**：如果 `Loaded` 值持续上升且 `Unloaded` 接近 0，可能意味着存在由动态代理或反射滥用导致的类加载器泄漏。
- **优化建议**：可以考虑使用 `-XX:MaxMetaspaceSize` 限制元空间大小，并检查代码中是否存在重复的类加载逻辑。

### 3.2 JIT 编译监控 (`-compiler`)

**命令示例**：

```bash
jstat -compiler 12345
```

**输出解析**：

| 列名           | 说明                             |
| :------------- | :------------------------------- |
| `Compiled`     | 成功编译的任务数                 |
| `Failed`       | 编译失败的任务数                 |
| `Invalid`      | 无效的编译任务数（需重新编译）   |
| `FailedType`   | 最后一个编译失败任务的类型       |
| `FailedMethod` | 最后一个编译失败任务所在类及方法 |

**问题诊断**：

- **编译失败**：如果 `Failed` 大于 0，表明存在热点方法无法被 JIT 优化（如复杂的循环或异常分支）。
- **优化建议**：检查 `FailedMethod` 列来定位问题方法，并尝试简化其逻辑或排除编译异常。

### 3.3 GC 行为全景监控 (`-gc`)

**命令示例**（每秒采样 1 次，共 5 次）：

```bash
jstat -gc 12345 1000 5
```

**输出字段解析**：

| 区域           | 容量字段 | 使用字段 | 说明                              |
| :------------- | :------- | :------- | :-------------------------------- |
| **Eden**       | `EC`     | `EU`     | Eden 区总容量 / 已使用 (KB)       |
| **Survivor 0** | `S0C`    | `S0U`    | Survivor 0 区总容量 / 已使用 (KB) |
| **Survivor 1** | `S1C`    | `S1U`    | Survivor 1 区总容量 / 已使用 (KB) |
| **Old**        | `OC`     | `OU`     | 老年代总容量 / 已使用 (KB)        |
| **Metaspace**  | `MC`     | `MU`     | 元空间总容量 / 已使用 (KB)        |
| **压缩类空间** | `CCSC`   | `CCSU`   | 压缩类空间总容量 / 已使用 (KB)    |

| GC 统计 | 说明                  |
| :------ | :-------------------- |
| `YGC`   | Young GC 发生次数     |
| `YGCT`  | Young GC 总耗时 (秒)  |
| `FGC`   | Full GC 发生次数      |
| `FGCT`  | Full GC 总耗时 (秒)   |
| `GCT`   | 所有 GC 的总耗时 (秒) |

**典型问题**：

- **Eden 区溢出**：`EU` 频繁接近 `EC`，导致 Young GC 频繁。**优化建议**：考虑增大新生代大小 (`-Xmn`)。
- **老年代满**：`OU` 持续增长且 `FGC` 增加，可能存在内存泄漏。**优化建议**：检查对象生命周期，使用 `jmap` 分析堆转储。

### 3.4 堆内存使用率监控 (`-gcutil`)

**命令示例**（每秒采样 1 次）：

```bash
jstat -gcutil 12345 1s
```

**输出解析**（百分比形式）：

| 列名   | 说明                |
| :----- | :------------------ |
| `S0`   | Survivor 0 区使用率 |
| `S1`   | Survivor 1 区使用率 |
| `E`    | Eden 区使用率       |
| `O`    | 老年代使用率        |
| `M`    | 元空间使用率        |
| `YGC`  | Young GC 次数       |
| `YGCT` | Young GC 总耗时     |
| `FGC`  | Full GC 次数        |
| `FGCT` | Full GC 总耗时      |
| `GCT`  | GC 总耗时           |

**诊断场景**：

- **老年代压力**：`O` > 90% 且 `FGC` 持续增长，可能频繁触发 Full GC。**优化建议**：调整堆大小 (`-Xmx`)，或考虑使用 G1/ZGC 等更先进的垃圾收集器。
- **元空间溢出**：`M` ≈ 100%。**优化建议**：限制元空间最大值 (`-XX:MaxMetaspaceSize`)，避免动态类生成过多导致无限增长。

### 3.5 其他常用选项

- **`-gccapacity`**：监控内容与 `-gc` 基本相同，但输出主要关注 Java 堆各个区域使用到的**最大和最小空间**（如 `NGCMN`, `NGCMX`），可用于观察 JVM 动态扩容行为。
- **`-gccause`**：该选项与 `-gcutil` 功能类似，但会**额外输出**导致上一次 GC 产生的原因 (`LGCC`) 和当前 GC 的原因 (`GCC`)，如 "Allocation Failure" 或 "System.gc()"。
- **`-gcnew`**：提供新生代更详细的信息，如对象晋升老年代的年龄阈值 (`TT`)。如果 `TT` 过小可能导致对象过早晋升，可通过 `-XX:MaxTenuringThreshold` 调整。

## 4 输出字段解析

由于 `-gc` 和 `-gcutil` 是最常用的选项，下表详细解析其所有输出字段的含义：

### `jstat -gc` 输出字段详解

| 字段     | 全称                            | 说明                                            | 单位 |
| :------- | :------------------------------ | :---------------------------------------------- | :--- |
| **S0C**  | Survivor 0 Capacity             | 年轻代中第一个 Survivor 区的容量                | KB   |
| **S1C**  | Survivor 1 Capacity             | 年轻代中第二个 Survivor 区的容量                | KB   |
| **S0U**  | Survivor 0 Used                 | 年轻代中第一个 Survivor 区目前已使用空间        | KB   |
| **S1U**  | Survivor 1 Used                 | 年轻代中第二个 Survivor 区目前已使用空间        | KB   |
| **EC**   | Eden Capacity                   | 年轻代中 Eden 区的容量                          | KB   |
| **EU**   | Eden Used                       | 年轻代中 Eden 区目前已使用空间                  | KB   |
| **OC**   | Old Capacity                    | 老年代的容量                                    | KB   |
| **OU**   | Old Used                        | 老年代目前已使用空间                            | KB   |
| **MC**   | Metaspace Capacity              | 元空间的容量                                    | KB   |
| **MU**   | Metaspace Used                  | 元空间目前已使用空间                            | KB   |
| **CCSC** | Compressed Class Space Capacity | 压缩类空间的容量                                | KB   |
| **CCSU** | Compressed Class Space Used     | 压缩类空间目前已使用空间                        | KB   |
| **YGC**  | Young GC Events                 | 从应用程序启动到采样时年轻代发生 GC 的次数      | 次   |
| **YGCT** | Young GC Time                   | 从应用程序启动到采样时年轻代 GC 所用时间        | 秒   |
| **FGC**  | Full GC Events                  | 从应用程序启动到采样时老年代发生 Full GC 的次数 | 次   |
| **FGCT** | Full GC Time                    | 从应用程序启动到采样时老年代 Full GC 所用时间   | 秒   |
| **GCT**  | Total GC Time                   | 从应用程序启动到采样时 GC 用的总时间            | 秒   |

### `jstat -gcutil` 输出字段详解

| 字段     | 全称                               | 说明                                                |
| :------- | :--------------------------------- | :-------------------------------------------------- |
| **S0**   | Survivor 0 Utilization             | 年轻代中第一个 Survivor 区已使用的占当前容量百分比  |
| **S1**   | Survivor 1 Utilization             | 年轻代中第二个 Survivor 区已使用的占当前容量百分比  |
| **E**    | Eden Utilization                   | 年轻代中 Eden 区已使用的占当前容量百分比            |
| **O**    | Old Utilization                    | 老年代已使用的占当前容量百分比                      |
| **M**    | Metaspace Utilization              | 元空间已使用的占当前容量百分比                      |
| **CCS**  | Compressed Class Space Utilization | 压缩类空间已使用的占当前容量百分比                  |
| **YGC**  | Young GC Events                    | 从应用程序启动到采样时年轻代发生 GC 的次数          |
| **YGCT** | Young GC Time                      | 从应用程序启动到采样时年轻代 GC 所用时间（秒）      |
| **FGC**  | Full GC Events                     | 从应用程序启动到采样时老年代发生 Full GC 的次数     |
| **FGCT** | Full GC Time                       | 从应用程序启动到采样时老年代 Full GC 所用时间（秒） |
| **GCT**  | Total GC Time                      | 从应用程序启动到采样时 GC 用的总时间（秒）          |

## 5 实战案例与故障诊断

### 5.1 内存泄漏诊断

**场景**：怀疑应用存在内存泄漏，老年代内存持续增长。

**诊断步骤**：

1. 使用 `jstat -gcutil <pid> 2s` 持续观察老年代使用率 (`O`) 和 Full GC 次数 (`FGC`)。
2. 如果发现 `O` 百分比不断上升，每次 Full GC 后 (`FGC` 增加后) 也未见明显回落，且 `FGC` 越来越频繁，这强烈暗示存在内存泄漏。
3. 为了确认，可以同时使用 `jstat -gccause <pid> 2s` 观察 GC 原因，如果频繁发生 Full GC 且原因是 "Ergonomics" 或 "System.gc()" 之外的原因（如 Metadata GC Threshold），也值得警惕。

**示例命令与观察**：

```bash
$ jstat -gcutil 12345 2000
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00  66.85  43.45  85.21  94.23  88.17   2145   32.234    10    3.285   35.519
  0.00  66.85  55.33  86.47  94.23  88.17   2145   32.234    10    3.285   35.519
  0.00  66.85  77.92  87.93  94.23  88.17   2145   32.234    10    3.285   35.519
 10.86   0.00   2.05  89.61  94.23  88.17   2146   32.256    12    3.456   35.712
# 注意 O 列从 85.21 -> 86.47 -> 87.93 -> 89.61 在不断增长，且发生了 2 次 FGC (从10到12)
```

**后续操作**：使用 `jmap -dump:live,format=b,file=heap.hprof <pid>` 导出堆转储文件，然后使用 Eclipse MAT 或 VisualVM 等工具分析泄漏的对象。

### 5.2 Young GC 频繁问题

**场景**：应用响应变慢，怀疑是 GC 停顿过多。

**诊断步骤**：

1. 使用 `jstat -gc <pid> 1s` 观察 `EU` (Eden区使用) 和 `YGC` (Young GC次数)。
2. 如果 `EU` 快速增长到接近 `EC` (Eden容量)，随后 `YGC` 增加，且 `YGCT` (Young GC时间) 也在快速增长，说明 Young GC 很频繁。
3. 计算 **Young GC 频率**和**平均耗时**：
   - **频率**：通过多次采样计算单位时间内 `YGC` 的增长次数。
   - **平均耗时**：`YGCT / YGC`

**示例命令与观察**：

```bash
$ jstat -gc 12345 1000
 S0C    S1C    ...    EC       EU        YGC     YGCT...
 5120.0 5120.0 ...  41984.0  41984.0   3276    98.123
 5120.0 5120.0 ...  41984.0  41984.0   3277    98.156
 5120.0 5120.0 ...  41984.0  41984.0   3278    98.189
# EU 在达到 EC (41984.0KB) 后发生 YGC (从3276->3277->3278)，频率很高（1秒1次）。
# 平均 YGC 时间 ≈ (98.189 - 98.123) / (3278 - 3276) = 0.033 秒
```

**优化建议**：适当增大新生代大小 (`-Xmn`)，例如从 `-Xmn50m` 调整为 `-Xmn100m`，以减少 Eden 区填满的速度，从而降低 Young GC 频率。

### 5.3 Full GC 频繁问题

**场景**：应用间歇性卡顿，持续时间较长。

**诊断步骤**：

1. 使用 `jstat -gcutil <pid> 1s` 观察 `O` (老年代使用率) 和 `FGC` (Full GC 次数)。
2. 如果 `O` 经常达到或接近 100%，并且 `FGC` 频繁增加，同时 `FGCT` (Full GC 时间) 很长，说明 Full GC 是导致卡顿的主要原因。
3. 使用 `jstat -gccause <pid> 1s` 查看最后一次 GC 的原因 (`LGCC`)，常见原因是 "Ergonomics"（G1/CMS等收集器的自适应调整）、"Allocation Failure"（分配失败）或 "Metadata GC Threshold"（元数据空间不足）。

**优化建议**：

- 如果老年代使用率总是很高，考虑**增大整个堆的大小** (`-Xms`, `-Xmx`)。
- 检查是否存在**内存泄漏**（见案例1）。
- 如果不存在泄漏，只是对象存活率高，可以考虑**优化垃圾收集器**，例如切换到 G1 或 ZGC，它们通常能提供更短的 Full GC 停顿时间。
- 如果是元数据区 (`M`) 触发的 Full GC，则需使用 `-XX:MaxMetaspaceSize` 设置一个更大的上限。

## 6 jstat 最佳实践

1. **自动化监控与告警**：
   - 编写 Shell 脚本定期采集 `jstat` 数据（例如每分钟一次），并使用 `grep`, `awk` 等工具分析特定指标（如 `O` 或 `FGC`）是否超过阈值。
   - 当指标异常时（如 `FGC` 在 5 分钟内超过 10 次），触发告警机制（发送邮件、短信或集成到监控系统如 Prometheus/Grafana）。

2. **结合其他工具使用**：
   - **`jstat` (实时数据)** + **GC 日志 (历史记录)**：`jstat` 用于实时快速诊断，而通过 `-Xlog:gc*` 参数开启的 GC 日志则提供了更详细、可持久化的历史数据，便于深度分析。
   - **`jstat` (定位方向)** + **`jmap` (深度分析)**：当 `jstat` 怀疑内存泄漏时，使用 `jmap` 转储堆内存进行离线分析。
   - **`jstat` (GC 问题)** + **`jstack` (线程问题)**：应用卡顿可能是 GC 导致，也可能是死锁或阻塞，结合 `jstack` 查看线程栈可以综合判断。

3. **理解局限性**：
   - `jstat` 提供的是**近似值**而非精确值，因为它通过 Attach API 采样获得，可用于趋势分析，但不宜作为绝对精确的度量。
   - 它**无法**提供对象创建的**堆栈跟踪信息**，要定位哪些代码分配了最多对象，需要使用更高级的工具（如商业版的 JFR 或异步分析的堆转储）。

4. **性能测试与调优**：
   - 在性能压测过程中，持续使用 `jstat -gcutil <pid> 1s` 观察 GC 情况。
   - 遵循 **GC 调优黄金法则**：优先让对象在新生代回收，减少进入老年代的对象数量，从而最大限度减少 Full GC。

## 7 进阶技巧

### 7.1 结合定时任务和脚本进行自动化监控

可以编写一个简单的 Shell 脚本，定期收集 jstat 数据并保存到日志文件中，以便后续分析。

```bash
#!/bin/bash
# monitor_gc.sh
PID=$1
INTERVAL=${2:-1000} # 默认间隔1秒
COUNT=${3:-10}     # 默认采集10次

LOG_FILE="gc_util_$(date +%Y%m%d_%H%M%S).log"

echo "开始监控 JVM (PID: $PID) GC 状态，间隔 ${INTERVAL}ms, 次数 ${COUNT}" > ${LOG_FILE}
echo "Timestamp    S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT" >> ${LOG_FILE}

# 使用 -t 参数输出时间戳
jstat -gcutil -t ${PID} ${INTERVAL} ${COUNT} >> ${LOG_FILE}

echo "监控结束，数据已保存到 ${LOG_FILE}"
```

运行方式：

```bash
./monitor_gc.sh 12345 2000 30 # 监控PID为12345的进程，每2秒一次，共30次
```

### 7.2 远程监控

`jstat` 也可以监控远程服务器上的 JVM 进程，但这通常需要开启远程监控支持（例如使用 `jstatd` 工具），并配置相应的安全策略，这超出了本文的基础范围。

## 8 总结

`jstat` 是 Java 开发者工具箱中一款不可或缺的轻量级性能监控利器。它无需重启应用即可动态提供关于 JVM 内存管理、垃圾回收和类加载行为的**实时数据流**，这对于快速诊断线上问题、进行性能调优至关重要。

核心价值在于：

- **实时性**：动态连接至 JVM，即时获取性能数据。
- **低开销**：作为轻量级命令行工具，对系统性能影响极小。
- **关键指标覆盖**：全面覆盖堆内存各区域使用情况、GC 次数与耗时、类加载信息等。
- **故障定位**：是快速判断 GC 问题（如频繁 GC、内存泄漏）的**第一道防线**。

**记住**：`jstat` 通常是你**起点**，而不是终点。它擅长告诉你 _"哪里可能出了问题"_（例如老年代不断增长），但要深究 _"为什么会出现这个问题"_（例如是哪个对象泄漏了），你往往需要借助像 **`jmap`** （用于堆转储分析）、**JProfiler** / **VisualVM** （用于图形化剖析）或 **GC 日志分析**（如 GCeasy）这样的更强大的工具。

熟练掌握 `jstat`，意味着你拥有了在复杂环境下快速洞察 JVM 内部状态的能力，这将为你的应用性能保驾护航。
