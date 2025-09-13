---
title: Java 并发编程（JUC）详解与最佳实践
description: 这篇文章详细介绍了 Java 并发包（JUC）的原子类与并发集合。通过学习，你将能够理解 JUC 的工作原理，掌握其在实际开发中的应用，避免常见的问题。
author: zhycn
---

# Java 并发编程（JUC）详解与最佳实践

## 1 JUC 包概述

Java 并发工具包（Java Util Concurrent，简称 JUC）是 Java 5 引入的专门用于多线程编程的工具包，位于 `java.util.concurrent` 及其子包中。JUC 提供了比传统线程 API 更高级、更灵活的并发编程工具，极大简化了并发程序的开发难度，提高了并发程序的性能和可靠性。

JUC 包的出现解决了传统 `synchronized` 和 `wait()/notify()` 机制的局限性，提供了更多样化的线程协作方式和更精细的并发控制手段。通过 JUC，开发者可以编写出更高性能、更可靠的多线程应用程序，减少了死锁等并发问题的发生概率。

### 1.1 JUC 包的主要组成组件

JUC 包包含了丰富的并发编程工具，主要包括以下几个类别：

| **组件类别** | **核心类/接口**                                  | **作用**                   |
| ------------ | ------------------------------------------------ | -------------------------- |
| **原子变量** | `AtomicInteger`, `AtomicLong`, `AtomicReference` | 提供线程安全的原子操作     |
| **并发集合** | `ConcurrentHashMap`, `CopyOnWriteArrayList`      | 线程安全的集合实现         |
| **锁机制**   | `ReentrantLock`, `StampedLock`                   | 比`synchronized`更灵活的锁 |
| **同步器**   | `CountDownLatch`, `CyclicBarrier`, `Semaphore`   | 线程协调工具               |
| **线程池**   | `ThreadPoolExecutor`, `Executors`                | 线程资源管理               |
| **异步编程** | `Future`, `CompletableFuture`                    | 异步任务处理               |

### 1.2 为什么需要 JUC

在多核处理器成为主流的今天，并发编程已成为开发利用硬件性能的关键技术。然而，传统的并发控制机制（如 `synchronized` 关键字）存在一些局限性：

- **性能问题**：传统的 `synchronized` 锁是重量级锁，涉及用户态到内核态的转换，性能开销较大
- **功能单一**：缺乏尝试获取锁、定时获取锁、可中断获取锁等高级功能
- **易死锁**：使用不当容易导致死锁，且诊断和修复困难
- **扩展性差**：难以应对复杂的并发场景和大规模并发需求

JUC 包针对这些问题提供了全面的解决方案，具有以下优势：

- **性能优化**：提供了更高性能的并发控制机制，如 CAS 操作、锁分离等
- **功能丰富**：提供了更多样的线程协作方式，如计数栅栏、信号量等
- **扩展性强**：支持更复杂的并发场景，如分治合并、异步编程等
- **可靠性高**：减少了死锁等并发问题的发生概率，提供了更安全的并发数据结构

## 2 原子类详解

### 2.1 原子类概述与核心原理

原子类是 JUC 包中提供的一组工具类，用于在多线程环境下实现无锁的线程安全操作。这些类位于 `java.util.concurrent.atomic` 包中，其核心机制基于 CAS（Compare-And-Swap）硬件指令，通过硬件级原子操作保证变量修改的不可分割性。

**CAS机制**（Compare-And-Swap）是原子类的实现基础。它是一种无锁算法，包含三个操作数：内存位置（V）、预期原值（A）和新值（B）。当且仅当内存位置V的值等于预期原值A时，处理器才会将该位置的值更新为新值B，否则不进行任何操作。无论哪种情况，都会返回该位置原来的值。

```java
// CAS操作伪代码表示
public final boolean compareAndSet(int expect, int update) {
    int currentValue = get(); // 获取当前值
    if (currentValue == expect) {
        set(update); // 更新值
        return true;
    }
    return false;
}
```

### 2.2 AtomicInteger 详解

`AtomicInteger` 是 JUC 中最常用的原子类之一，它提供了一种线程安全的方式对整数进行原子操作，无需使用 `synchronized` 关键字进行同步。

#### 2.2.1 核心方法与使用示例

```java
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicIntegerExample {
    private AtomicInteger count = new AtomicInteger(0);

    // 原子性地增加计数
    public int increment() {
        return count.incrementAndGet();
    }

    // 原子性地获取当前计数
    public int getCount() {
        return count.get();
    }

    // 原子性地比较并设置值
    public boolean compareAndSet(int expect, int update) {
        return count.compareAndSet(expect, update);
    }

    // 示例使用场景
    public static void main(String[] args) {
        AtomicIntegerExample example = new AtomicIntegerExample();

        // 创建多个线程并发增加计数器
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    example.increment();
                }
            }).start();
        }

        // 等待所有线程完成
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("Final count: " + example.getCount()); // 预期结果: 10000
    }
}
```

#### 2.2.2 AtomicInteger 的核心方法

- `incrementAndGet()`：原子性地将当前值加1并返回新值（相当于`++i`）
- `getAndIncrement()`：原子性地获取当前值然后将值加1（相当于`i++`）
- `decrementAndGet()`：原子性地将当前值减1并返回新值（相当于`--i`）
- `getAndDecrement()`：原子性地获取当前值然后将值减1（相当于`i--`）
- `getAndAdd(int delta)`：原子性地获取当前值然后加上指定的 delta
- `addAndGet(int delta)`：原子性地加上指定的 delta 然后返回新值
- `compareAndSet(int expect, int update)`：如果当前值等于预期值 expect，则原子性地将其更新为 update
- `get()`：获取当前值
- `set(int newValue)`：设置为给定新值

#### 2.2.3 性能对比

与传统的`synchronized`关键字相比，`AtomicInteger`在竞争不激烈的情况下性能更高，因为它避免了线程上下文切换和阻塞。

| **特性**     | **AtomicInteger**         | **synchronized**             |
| ------------ | ------------------------- | ---------------------------- |
| **实现方式** | 基于 CAS（硬件级原子操作） | 基于 JVM 的监视器锁（Monitor） |
| **性能**     | 竞争不激烈时效率高        | 竞争激烈时开销大（线程阻塞） |
| **适用场景** | 简单原子操作              | 复杂同步逻辑                 |
| **可扩展性** | 高（无需加锁）            | 低（锁竞争导致性能下降）     |
| **内存语义** | 保证可见性和原子性        | 保证可见性和原子性           |

### 2.3 其他原子类

除了`AtomicInteger`，JUC 包还提供了多种原子类，覆盖了不同的使用场景：

1. **基本类型原子类**：
   - `AtomicLong`：提供对 long 类型的原子操作
   - `AtomicBoolean`：提供对 boolean 类型的原子操作

2. **引用类型原子类**：
   - `AtomicReference`：用于原子更新对象引用
   - `AtomicStampedReference`：通过添加版本戳解决 ABA 问题
   - `AtomicMarkableReference`：通过添加标记位解决 ABA 问题

3. **数组原子类**：
   - `AtomicIntegerArray`：提供对 int 数组元素的原子操作
   - `AtomicLongArray`：提供对 long 数组元素的原子操作
   - `AtomicReferenceArray`：提供对引用数组元素的原子操作

4. **字段更新器**：
   - `AtomicIntegerFieldUpdater`：基于反射原子更新对象的 volatile int 字段
   - `AtomicLongFieldUpdater`：基于反射原子更新对象的 volatile long 字段
   - `AtomicReferenceFieldUpdater`：基于反射原子更新对象的 volatile 引用字段

5. **高性能累加器**（Java 8+）：
   - `LongAdder`：在高并发场景下比 `AtomicLong` 更高性能的计数器
   - `DoubleAdder`：用于 double 类型的高性能累加器
   - `LongAccumulator`：支持自定义累加函数的高性能累加器

### 2.4 原子类的适用场景与注意事项

#### 2.4.1 适用场景

1. **计数器**：多线程环境下的计数，如生成唯一ID、统计请求次数等
2. **状态标志**：多线程间的状态同步，如控制线程启停
3. **乐观锁实现**：通过 `compareAndSet()` 实现无锁算法
4. **累积统计**：如求和、最大值、最小值等统计操作

#### 2.4.2 注意事项与局限性

1. **ABA问题**：
   - 问题描述：一个值从 A 变为 B，然后又变回 A，CAS 操作会误认为它没有被修改过
   - 解决方案：使用 `AtomicStampedReference` 或 `AtomicMarkableReference` 添加版本戳

2. **循环时间长开销大**：
   - 问题描述：CAS 操作如果长时间不成功，会给 CPU 带来较大开销
   - 解决方案：限制 CAS 重试次数，或使用 `LongAdder` 等高性能累加器

3. **只能保证一个变量的原子操作**：
   - 问题描述：CAS 只能保证一个共享变量的原子操作，无法保证多个变量的原子性
   - 解决方案：使用互斥锁或将多个变量合并到一个对象中使用 `AtomicReference`

4. **不适用于复杂操作**：
   - 问题描述：原子类适用于简单原子操作，复杂逻辑仍需使用同步锁
   - 解决方案：对于复杂操作，考虑使用 `synchronized` 或 `ReentrantLock`

## 3 ConcurrentHashMap 解析

### 3.1 ConcurrentHashMap 概述

`ConcurrentHashMap` 是 JUC 包中提供的线程安全哈希表实现，它允许多个线程并发访问哈希表，并发修改 map 中的数据而不会产生死锁。与传统的 `Hashtable` 和 `Collections.synchronizedMap()` 相比，`ConcurrentHashMap` 提供了更高的并发性能和更好的可扩展性。

### 3.2 线程安全实现机制

#### 3.2.1 Java 7 及之前的实现：分段锁

在 Java 7 及之前的版本中，`ConcurrentHashMap` 使用 "分段锁" 机制实现线程安全：

- **数据结构**：将一个大的 HashMap 分成多个小的 Segment（默认为 16 个）
- **锁分离**：每个 Segment 独立加锁，不同 Segment 的操作可以并发进行
- **并发度**：并发度由 Segment 数量决定，默认支持 16 个线程并发写操作

```java
// Java 7中的ConcurrentHashMap结构示意
ConcurrentHashMap
    ├── Segment[] segments (默认16个)
    │    ├── HashEntry[] table
    │    ├── int count
    │    └── ReentrantLock lock
    └── int concurrencyLevel (并发级别)
```

#### 3.2.2 Java 8 及之后的实现：CAS + synchronized

Java 8 对 `ConcurrentHashMap` 进行了重大改进，采用了更细粒度的锁机制：

- **放弃分段锁**：不再使用 Segment 分段锁机制
- **CAS + synchronized**：使用 CAS 操作和 synchronized 同步单个桶（Node）
- **红黑树优化**：当链表长度超过 8 时，将链表转换为红黑树，提高查询效率
- **更细粒度锁**：只锁住发生冲突的桶，而不是整个段，进一步提高并发度

### 3.3 核心方法与使用示例

```java
import java.util.concurrent.ConcurrentHashMap;

public class ConcurrentHashMapExample {
    public static void main(String[] args) {
        // 创建ConcurrentHashMap实例
        ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

        // 添加元素
        map.put("key1", 1);
        map.put("key2", 2);
        map.put("key3", 3);

        // 获取元素
        Integer value = map.get("key1");
        System.out.println("key1的值: " + value);

        // 原子操作：如果键不存在则添加
        map.putIfAbsent("key4", 4);

        // 原子操作：计算（Java 8+）
        map.compute("key1", (k, v) -> v == null ? 1 : v + 1);
        System.out.println("key1计算后的值: " + map.get("key1"));

        // 原子操作：合并（Java 8+）
        map.merge("key2", 10, (oldValue, newValue) -> oldValue + newValue);
        System.out.println("key2合并后的值: " + map.get("key2"));

        // 遍历操作（弱一致性迭代器）
        map.forEach((k, v) -> System.out.println(k + " = " + v));

        // 搜索操作（Java 8+）
        String result = map.search(1, (k, v) -> v > 2 ? k : null);
        System.out.println("值大于2的键: " + result);

        // 归约操作（Java 8+）
        int sum = map.reduceValues(1, Integer::sum);
        System.out.println("所有值的和: " + sum);
    }
}
```

### 3.4 ConcurrentHashMap 的特性与优势

1. **线程安全**：支持多线程并发读写操作，不会导致数据不一致
2. **高并发性能**：通过锁分离或细粒度锁实现高并发访问
3. **弱一致性迭代器**：迭代过程中不会抛出`ConcurrentModificationException`
4. **原子操作**：提供了一系列原子操作方法，如`putIfAbsent()`、`compute()`等
5. **可扩展性**：自动扩容，支持大规模数据存储

### 3.5 使用场景与最佳实践

#### 3.5.1 适用场景

1. **高并发缓存**：作为缓存数据结构，支持高并发读写访问
2. **计数器群**：维护一组计数器，如统计不同事件的次数
3. **共享数据存储**：在多线程环境中共享数据，避免显式同步
4. **实时数据处理**：在流处理应用中存储中间结果

#### 3.5.2 最佳实践与注意事项

1. **初始化容量**：根据预期数据量合理设置初始容量，避免频繁扩容

   ```java
   // 建议：根据预期大小设置初始容量
   ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>(64);
   ```

2. **并发级别设置**：在 Java 7 中，根据并发线程数合理设置并发级别

   ```java
   // Java 7中的并发级别设置（Java 8已废弃此参数）
   ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>(64, 0.75f, 16);
   ```

3. **使用 Java 8+ 的新方法**：充分利用 `compute()`、`merge()` 等原子方法

   ```java
   // 使用compute方法原子更新
   map.compute("key", (k, v) -> v == null ? 1 : v + 1);
   ```

4. **遍历方式选择**：根据需求选择合适的遍历方式

   ```java
   // 遍历所有元素
   map.forEach((k, v) -> System.out.println(k + ": " + v));

   // 并行遍历（Java 8+）
   map.forEach(1, (k, v) -> System.out.println(k + ": " + v));
   ```

5. **大小计算注意事项**：`size()`方法返回的是估计值，精确大小需使用`mappingCount()`

   ```java
   // 获取估计大小（可能不精确）
   int estimatedSize = map.size();

   // 获取精确大小（Java 8+）
   long exactSize = map.mappingCount();
   ```

### 3.6 与 HashMap、Hashtable 的对比

| **特性**      | **HashMap**  | **Hashtable**  | **ConcurrentHashMap**         |
| ------------- | ------------ | -------------- | ----------------------------- |
| **线程安全**  | 否           | 是（同步方法） | 是（锁分离/CAS+synchronized） |
| **性能**      | 高（单线程） | 低（全局锁）   | 高（分段锁/细粒度锁）         |
| **Null键/值** | 允许         | 不允许         | 不允许                        |
| **迭代器**    | 快速失败     | 快速失败       | 弱一致性                      |
| **扩容机制**  | 2倍扩容      | 2倍扩容        | 分段扩容/2倍扩容              |
| **Java版本**  | 所有         | 所有           | Java 5+                       |

## 4 CopyOnWriteArrayList 解析

### 4.1 CopyOnWriteArrayList 概述

`CopyOnWriteArrayList` 是 JUC 包中提供的线程安全 List 实现，它使用 "写时复制"（Copy-On-Write）技术来保证线程安全。与传统的同步 List 实现相比，它在读多写少的场景下能提供更好的性能。

### 4.2 写时复制机制原理

`CopyOnWriteArrayList` 的核心思想是：**所有修改操作（add、set、remove 等）都会创建一个新的底层数组副本，而不是直接在原数组上进行修改**。这种机制保证了：

1. **读操作不需要锁**：读操作总是在不变的原数组上进行，无需同步
2. **读写分离**：读操作和写操作完全分离，互不影响
3. **弱一致性**：迭代器反映的是创建迭代器时的数组状态，不反映后续修改

```java
// CopyOnWriteArrayList的写操作基本逻辑
public boolean add(E e) {
    // 1. 加锁（保证同一时间只有一个写操作）
    synchronized (lock) {
        // 2. 获取当前数组
        Object[] elements = getArray();

        // 3. 创建新数组（长度+1）并复制元素
        Object[] newElements = Arrays.copyOf(elements, elements.length + 1);

        // 4. 在新数组上添加新元素
        newElements[elements.length] = e;

        // 5. 将引用指向新数组
        setArray(newElements);

        return true;
    }
}
```

### 4.3 核心方法与使用示例

```java
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.Iterator;

public class CopyOnWriteArrayListExample {
    public static void main(String[] args) {
        // 创建CopyOnWriteArrayList实例
        CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();

        // 添加元素
        list.add("Java");
        list.add("is");
        list.add("awesome");

        // 读取元素（无需同步）
        System.out.println("第一个元素: " + list.get(0));
        System.out.println("列表大小: " + list.size());

        // 迭代操作（反映创建迭代器时的状态）
        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()) {
            System.out.println(iterator.next());
        }

        // 修改操作（创建副本）
        list.set(1, "can be");
        list.add(2, "challenging");

        // 并发读写示例
        new Thread(() -> {
            // 读线程（可以安全读取）
            for (String item : list) {
                System.out.println("读取: " + item);
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();

        new Thread(() -> {
            // 写线程（创建副本，不影响读线程）
            try {
                Thread.sleep(50);
                list.add("但值得学习");
                System.out.println("已添加新元素");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();

        // 等待线程完成
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

### 4.4 CopyOnWriteArrayList 的特性与优缺点

#### 4.4.1 优点

1. **读操作性能高**：读操作无需同步，性能接近普通 ArrayList
2. **线程安全**：写操作通过复制保证线程安全，不会损坏数据
3. **迭代安全**：迭代过程中不会抛出 `ConcurrentModificationException`
4. **读写分离**：读操作和写操作完全分离，互不阻塞

#### 4.4.2 缺点与注意事项

1. **内存开销大**：每次写操作都需要复制整个数组，内存消耗较大
2. **写性能低**：写操作性能较差，不适合写多读少的场景
3. **数据最终一致性**：读操作不能立即看到其他线程的修改，只能看到创建迭代器时的数据状态
4. **元素遍历**：不适合大规模数据的遍历操作，因为每次遍历可能看到不同的数据版本

### 4.5 使用场景与最佳实践

#### 4.5.1 适用场景

1. **监听器列表**：在 GUI 应用或事件驱动模型中存储监听器列表
2. **读多写少的配置数据**：如缓存配置信息、黑白名单等
3. **快照数据**：需要数据快照进行遍历或分析的场景
4. **避免迭代异常**：需要避免 `ConcurrentModificationException` 的场景

#### 4.5.2 最佳实践与注意事项

1. **控制数据量**：由于写操作需要复制整个数组，数据量不宜过大

   ```java
   // 不适合存储大量数据
   // 适合存储少量读多写少的数据
   CopyOnWriteArrayList<String> configList = new CopyOnWriteArrayList<>();
   ```

2. **批量写入**：尽量减少写操作次数，批量进行修改

   ```java
   // 不推荐：多次单独添加
   // list.add("item1");
   // list.add("item2");
   // list.add("item3");

   // 推荐：批量添加
   list.addAll(Arrays.asList("item1", "item2", "item3"));
   ```

3. **使用合适的迭代方式**：根据需求选择合适的迭代方式

   ```java
   // 方式1：使用迭代器（快照视图）
   Iterator<String> it = list.iterator();
   while (it.hasNext()) {
       String item = it.next();
       // 处理元素
   }

   // 方式2：使用for-each循环（也是基于快照）
   for (String item : list) {
       // 处理元素
   }

   // 方式3：使用Java 8+的forEach方法
   list.forEach(item -> {
       // 处理元素
   });
   ```

4. **替代方案考虑**：根据具体场景考虑替代方案

   ```java
   // 如果需要更好的写性能，考虑使用：
   // - Collections.synchronizedList() +同步块
   // - ConcurrentLinkedQueue（适合队列场景）
   ```

### 4.6 与 ArrayList、Vector 的对比

| **特性**         | **ArrayList** | **Vector**         | **CopyOnWriteArrayList** |
| ---------------- | ------------- | ------------------ | ------------------------ |
| **线程安全**     | 否            | 是（同步方法）     | 是（写时复制）           |
| **读性能**       | 高            | 中（同步开销）     | 高（无锁读取）           |
| **写性能**       | 高            | 低（同步开销）     | 低（复制开销）           |
| **迭代器安全性** | 快速失败      | 快速失败           | 弱一致性                 |
| **内存开销**     | 低            | 低                 | 高（写时复制）           |
| **适用场景**     | 单线程环境    | 多线程环境（写少） | 多线程环境（读多写少）   |

## 5 最佳实践与性能优化

### 5.1 原子类最佳实践

1. **优先使用 LongAdder 代替 AtomicLong**
   在高并发写多读少的场景下，`LongAdder` 比 `AtomicLong` 性能更好，但需要注意它不保证实时精确值。

   ```java
   // 高并发计数器场景推荐使用LongAdder
   LongAdder adder = new LongAdder();

   // 并发增加
   adder.add(100);

   // 获取当前值（可能不是实时精确值）
   long sum = adder.sum();
   ```

2. **解决 ABA 问题**
   在对数据一致性要求高的场景，使用带版本戳的原子类避免 ABA 问题。

   ```java
   // 使用AtomicStampedReference解决ABA问题
   AtomicStampedReference<String> atomicRef =
       new AtomicStampedReference<>("initial", 0);

   // 更新时检查版本戳
   int[] stampHolder = new int[1];
   String current = atomicRef.get(stampHolder);
   if (atomicRef.compareAndSet(current, "updated", stampHolder[0], stampHolder[0] + 1)) {
       // 更新成功
   }
   ```

3. **合理使用字段更新器**
   当需要原子更新对象字段且不想将整个对象包装为原子类时，使用字段更新器。

   ```java
   // 使用字段更新器原子更新对象字段
   class Counter {
       private volatile int count;
       // 其他字段和方法...
   }

   Counter counter = new Counter();
   AtomicIntegerFieldUpdater<Counter> updater =
       AtomicIntegerFieldUpdater.newUpdater(Counter.class, "count");

   // 原子增加
   updater.incrementAndGet(counter);
   ```

### 5.2 ConcurrentHashMap 最佳实践

1. **合理设置初始容量和负载因子**
   根据预期数据量合理设置初始容量，避免频繁扩容影响性能。

   ```java
   // 根据预期大小设置初始容量和负载因子
   int expectedSize = 1000;
   float loadFactor = 0.75f;
   int initialCapacity = (int) (expectedSize / loadFactor) + 1;

   ConcurrentHashMap<String, Integer> map =
       new ConcurrentHashMap<>(initialCapacity, loadFactor);
   ```

2. **利用 ConcurrentHashMap 的 Java 8+ 新 API**
   充分利用 `compute()`, `merge()`, `forEach()` 等新方法提高开发效率和性能。

   ```java
   // 使用 compute 方法实现原子更新
   Map<String, Integer> map = new ConcurrentHashMap<>();
   map.put("count", 0);

   // 原子增加：如果键存在则更新，不存在则插入
   map.compute("count", (k, v) -> v == null ? 1 : v + 1);

   // 使用merge方法合并值
   map.merge("count", 10, Integer::sum);

   // 使用forEach并行遍历
   map.forEach(1, (k, v) -> System.out.println(k + ": " + v));
   ```

3. **使用并发友好的设计模式**
   采用适合并发访问的数据结构和算法。

   ```java
   // 使用ConcurrentHashMap实现高效缓存
   public class ConcurrentCache<K, V> {
       private final ConcurrentHashMap<K, V> cache = new ConcurrentHashMap<>();
       private final ConcurrentHashMap<K, Long> expirationTimes = new ConcurrentHashMap<>();
       private final ScheduledExecutorService cleaner = Executors.newScheduledThreadPool(1);

       public ConcurrentCache() {
           // 定期清理过期缓存
           cleaner.scheduleAtFixedRate(this::cleanup, 1, 1, TimeUnit.MINUTES);
       }

       public void put(K key, V value, long ttlMillis) {
           cache.put(key, value);
           expirationTimes.put(key, System.currentTimeMillis() + ttlMillis);
       }

       public V get(K key) {
           return cache.get(key);
       }

       private void cleanup() {
           long now = System.currentTimeMillis();
           expirationTimes.forEach((key, expireTime) -> {
               if (now > expireTime) {
                   cache.remove(key);
                   expirationTimes.remove(key);
               }
           });
       }
   }
   ```

### 5.3 CopyOnWriteArrayList 最佳实践

1. **控制数据规模**
   由于写操作需要复制整个数组，应控制数据量在合理范围内。

   ```java
   // 适合：存储少量配置数据、监听器列表等
   CopyOnWriteArrayList<String> configList = new CopyOnWriteArrayList<>();

   // 不适合：存储大量频繁修改的数据
   // 考虑使用其他并发集合或数据库
   ```

2. **批量操作优化**
   尽量减少写操作次数，采用批量操作方式。

   ```java
   // 不推荐：多次单独修改
   // list.add("item1");
   // list.add("item2");
   // list.remove("oldItem");

   // 推荐：批量操作
   list.addAll(Arrays.asList("item1", "item2", "item3"));

   // 或者：使用替代方案暂存修改，然后一次性应用
   List<String> modifications = new ArrayList<>();
   // 收集多个修改...
   list.addAll(modifications);
   ```

3. **迭代器使用注意事项**
   理解弱一致性迭代器的特性，避免在迭代过程中期望看到最新修改。

   ```java
   CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
   list.addAll(Arrays.asList("A", "B", "C"));

   // 创建迭代器（此时快照：["A", "B", "C"]）
   Iterator<String> it = list.iterator();

   // 修改列表（创建新数组：["A", "B", "C", "D"]）
   list.add("D");

   // 迭代器仍然遍历旧快照：["A", "B", "C"]
   while (it.hasNext()) {
       System.out.println(it.next()); // 输出A, B, C
   }

   // 新迭代器会看到最新数据：["A", "B", "C", "D"]
   for (String item : list) {
       System.out.println(item); // 输出A, B, C, D
   }
   ```

### 5.4 性能监控与调优

1. **线程池配置优化**
   根据实际场景合理配置线程池参数，避免资源耗尽或性能瓶颈。

   ```java
   // 自定义线程池配置
   ThreadPoolExecutor executor = new ThreadPoolExecutor(
       5, // 核心线程数
       10, // 最大线程数
       60, TimeUnit.SECONDS, // 空闲线程存活时间
       new ArrayBlockingQueue<>(100), // 工作队列
       new ThreadFactoryBuilder().setNameFormat("worker-%d").build(), // 线程工厂
       new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略
   );
   ```

2. **监控工具使用**
   使用 `jstack`、`VisualVM` 等工具监控并发应用状态，及时发现死锁、资源竞争等问题。

   ```java
   // 监控线程池状态
   ScheduledExecutorService monitor = Executors.newSingleThreadScheduledExecutor();
   monitor.scheduleAtFixedRate(() -> {
       System.out.println("活跃线程数: " + executor.getActiveCount());
       System.out.println("完成任务数: " + executor.getCompletedTaskCount());
       System.out.println("队列大小: " + executor.getQueue().size());
   }, 0, 1, TimeUnit.SECONDS);
   ```

3. **死锁预防与检测**
   采用超时机制、锁顺序一致性等策略预防死锁。

   ```java
   // 使用tryLock避免死锁
   Lock lock1 = new ReentrantLock();
   Lock lock2 = new ReentrantLock();

   public void method1() {
       boolean gotLock1 = false;
       boolean gotLock2 = false;
       try {
           gotLock1 = lock1.tryLock(100, TimeUnit.MILLISECONDS);
           gotLock2 = lock2.tryLock(100, TimeUnit.MILLISECONDS);
           if (gotLock1 && gotLock2) {
               // 执行需要两个锁的操作
           }
       } finally {
           if (gotLock1) lock1.unlock();
           if (gotLock2) lock2.unlock();
       }
   }
   ```

## 6 总结与展望

### 6.1 关键知识点回顾

Java 并发包（JUC）提供了强大而丰富的并发编程工具，其中原子类和并发集合是其中最核心的组件之一：

1. **原子类**：通过 CAS 机制实现无锁线程安全操作，适用于计数器、状态标志等简单原子操作场景，比传统同步机制性能更高。

2. **ConcurrentHashMap**：高性能线程安全哈希表，通过分段锁（Java 7）或 CAS+synchronized（Java 8+）实现高并发访问，适合高并发缓存、计数器群等场景。

3. **CopyOnWriteArrayList**：采用写时复制机制的线程安全 List，读操作完全无锁，适合读多写少的场景如监听器列表、配置数据存储等。

### 6.2 发展展望

随着 Java 版本的不断更新，JUC 包也在持续演进和完善：

1. **Java 8**：引入了 `CompletableFuture`、`StampedLock`、`LongAdder` 等新组件，增强了 `ConcurrentHashMap` 的实现（CAS+synchronized 替代分段锁）。

2. **Java 9**：为 `CompletableFuture` 增加了延迟和超时相关方法，进一步增强了异步编程能力。

3. **未来趋势**：随着多核处理器的普及和并发需求的增长，Java 并发编程将继续向更高性能、更易用的方向发展，包括：
   - 更高效的无锁算法和数据结构
   - 更好的异步编程支持
   - 更智能的并发控制机制
   - 对新型硬件架构（如 NUMA、异构计算）的更好支持

### 6.3 学习建议

要掌握 Java 并发编程，建议：

1. **理解基础概念**：深入理解线程安全、内存模型、锁机制等基础概念
2. **掌握工具特性**：熟练掌握 JUC 包各组件的特性、适用场景和局限性
3. **实践与调试**：通过实际项目练习，使用调试和监控工具分析并发问题
4. **关注发展**：持续关注 Java 新版本的并发特性更新和最佳实践演进

Java 并发编程是一个复杂但极具价值的领域，掌握好 JUC 包的使用将帮助你构建高性能、高可靠性的并发应用程序。
