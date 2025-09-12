---
title: Java Iterator 迭代器详解与最佳实践
description: 这篇文章详细介绍了 Java 迭代器的核心概念、工作原理、使用方法和最佳实践，内容涵盖从基础到高级的各个方面，并提供丰富的代码示例和性能优化建议。
author: zhycn
---

# Java Iterator 迭代器详解与最佳实践

本文旨在全面介绍 Java 迭代器的核心概念、工作原理、使用方法和最佳实践，内容涵盖从基础到高级的各个方面，并提供丰富的代码示例和性能优化建议。

## 1 迭代器概述

迭代器（Iterator）是 Java 集合框架中用于遍历集合元素的核心工具，它提供了一种统一的方式来访问各种集合对象中的元素，而无需暴露集合的内部表示。迭代器模式是一种行为型设计模式，它将遍历逻辑与数据存储分离，使客户端能够以一致的方式处理不同类型的集合。

**核心价值**：

- **解耦遍历逻辑与数据结构**：将遍历算法与集合实现分离
- **统一访问接口**：为不同集合提供一致的遍历方式
- **支持多种遍历方式**：可在同一集合上支持多种遍历方式

## 2 迭代器接口与核心方法

Java 迭代器接口定义在 `java.util.Iterator` 中，包含以下核心方法：

```java
public interface Iterator<E> {
    // 检查是否有更多元素
    boolean hasNext();

    // 返回下一个元素
    E next();

    // 移除当前元素（可选操作）
    default void remove() {
        throw new UnsupportedOperationException("remove");
    }

    // Java 8新增：对剩余元素执行操作
    default void forEachRemaining(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        while (hasNext())
            action.accept(next());
    }
}
```

### 2.1 方法详解

1. **hasNext()**：检查迭代中是否还有更多元素，不移动指针，仅检查状态，时间复杂度通常为O(1)。
2. **next()**：返回迭代中的下一个元素，移动指针到下一个位置，如果没有元素则抛出 `NoSuchElementException`。
3. **remove()**：删除迭代器最后返回的元素，是唯一安全删除元素的方式，必须在 `next()` 后调用，每次只能调用一次。
4. **forEachRemaining()**：Java 8 新增方法，使用 `Consumer` 处理剩余元素，更高效的批量操作。

## 3 迭代器的工作原理与内部机制

### 3.1 快速失败机制（Fail-Fast）

Java 集合框架中的大多数迭代器实现了快速失败机制，这意味着在迭代过程中，如果集合被非迭代器方法修改，迭代器会立即抛出 `ConcurrentModificationException`。

**底层原理**：

- 集合内部维护一个 `modCount` 字段记录修改次数
- 迭代器初始化时保存当前的 `modCount` 值（作为 `expectedModCount`）
- 每次操作前检查是否一致

```java
// 错误示例：在迭代中直接修改集合
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));
for (String s : list) {
    if ("B".equals(s)) {
        list.remove(s); // 抛出ConcurrentModificationException
    }
}

// 正确做法1：使用迭代器的remove方法
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String s = it.next();
    if ("B".equals(s)) {
        it.remove(); // 安全删除
    }
}

// 正确做法2：Java 8+ removeIf方法
list.removeIf(s -> "B".equals(s));
```

### 3.2 迭代器的内部实现

以 ArrayList 迭代器为例：

```java
private class Itr implements Iterator<E> {
    int cursor;       // 下一个元素的索引
    int lastRet = -1; // 最后返回元素的索引
    int expectedModCount = modCount; // 并发修改检查

    public boolean hasNext() {
        return cursor != size;
    }

    public E next() {
        checkForComodification(); // 检查并发修改
        int i = cursor;
        if (i >= size)
            throw new NoSuchElementException();
        Object[] elementData = ArrayList.this.elementData;
        if (i >= elementData.length)
            throw new ConcurrentModificationException();
        cursor = i + 1;
        return (E) elementData[lastRet = i];
    }

    final void checkForComodification() {
        if (modCount != expectedModCount)
            throw new ConcurrentModificationException();
    }
}
```

## 4 迭代器的使用方式

### 4.1 标准遍历范式

```java
// 标准范式
List<String> list = Arrays.asList("A", "B", "C");
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String element = it.next();
    System.out.println(element);
}

// 增强for循环（语法糖，底层使用迭代器）
for (String element : list) {
    System.out.println(element);
}

// Java 8+ forEach方法
list.forEach(System.out::println);

// forEachRemaining方法
Iterator<String> it = list.iterator();
it.forEachRemaining(System.out::println);
```

### 4.2 安全删除元素

```java
List<Integer> numbers = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
Iterator<Integer> it = numbers.iterator();
while (it.hasNext()) {
    Integer num = it.next();
    if (num % 2 == 0) {
        it.remove(); // 安全删除偶数元素
    }
}
System.out.println(numbers); // 输出: [1, 3, 5]
```

### 4.3 避免常见陷阱

```java
// 错误1：多次调用next()导致越界
while (it.hasNext()) {
    System.out.println(it.next()); // 正确
    System.out.println(it.next()); // 可能越界
}

// 错误2：未配对调用remove()
it.next();
it.remove(); // 正确
it.remove(); // IllegalStateException

// 错误3：并发修改
Iterator<String> it = list.iterator();
list.add("new");   // 修改集合
String s = it.next(); // ConcurrentModificationException
```

## 5 高级迭代器类型

### 5.1 ListIterator

ListIterator 是 Iterator 的增强版，支持双向遍历和修改操作：

```java
List<Integer> numbers = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
ListIterator<Integer> listIterator = numbers.listIterator();

// 向前遍历
System.out.println("向前遍历:");
while (listIterator.hasNext()) {
    System.out.print(listIterator.next() + " ");
}

// 向后遍历
System.out.println("\n向后遍历:");
while (listIterator.hasPrevious()) {
    int num = listIterator.previous();
    System.out.print(num + " ");

    // 修改元素
    if (num == 3) {
        listIterator.set(300); // 修改当前元素
    }
}

System.out.println("\n修改后列表: " + numbers);
```

### 5.2 Spliterator

Java 8 引入的分割迭代器 (Spliterator) 支持并行遍历：

```java
List<String> data = Arrays.asList("A", "B", "C", "D", "E", "F");
Spliterator<String> spliterator = data.spliterator();

// 尝试分割迭代器
Spliterator<String> part1 = spliterator.trySplit();

System.out.println("第一部分元素:");
part1.forEachRemaining(System.out::println);

System.out.println("剩余元素:");
spliterator.forEachRemaining(System.out::println);
```

## 6 性能分析与优化

### 6.1 不同遍历方式性能对比

| **遍历方式**         | **时间复杂度** | **内存占用** | **线程安全** | **适用场景**       |
| -------------------- | -------------- | ------------ | ------------ | ------------------ |
| 传统迭代器           | O(n)           | 低           | 否           | 通用遍历           |
| 增强 for 循环        | O(n)           | 低           | 否           | 简单遍历           |
| 索引 for 循环        | O(n)           | 最低         | 否           | ArrayList 随机访问 |
| forEach + Lambda     | O(n)           | 中           | 否           | 函数式编程         |
| Spliterator 并行处理 | O(n)/p         | 高           | 需同步       | 大数据集并行处理   |

### 6.2 不同集合类型迭代性能特征

| **集合类型**      | **迭代方式** | **时间复杂度** | **备注**         |
| ----------------- | ------------ | -------------- | ---------------- |
| ArrayList         | 索引遍历     | O(n)           | 随机访问快       |
| ArrayList         | 迭代器       | O(n)           | 内部优化         |
| LinkedList        | 索引遍历     | O(n²)          | 每次访问从头查找 |
| LinkedList        | 迭代器       | O(n)           | 顺序访问最优     |
| HashSet/HashMap   | 迭代器       | O(capacity)    | 与桶数量相关     |
| TreeSet/TreeMap   | 迭代器       | O(n)           | 中序遍历         |
| ConcurrentHashMap | 迭代器       | O(capacity)    | 弱一致性迭代器   |

### 6.3 性能优化技巧

1\. **预分配容量**：对于 ArrayList 等基于数组的集合，初始化时预估容量

```java
// 优化前：频繁扩容
List<Integer> list1 = new ArrayList<>();
for (int i = 0; i < 1000000; i++) {
    list1.add(i);
}

// 优化后：预分配容量
List<Integer> list2 = new ArrayList<>(1000000);
for (int i = 0; i < 1000000; i++) {
    list2.add(i);
}
```

2\. **批量操作替代单元素操作**

```java
// 低效方式
Set<Integer> targetSet = new HashSet<>();
for (Integer num : sourceList) {
    targetSet.add(num);
}

// 高效方式
Set<Integer> optimizedSet = new HashSet<>(sourceList);
```

3\. **避免多次迭代同一个集合**：在循环外获取迭代器，并使用它一次性遍历集合

4\. **最小化创建迭代器的次数**：创建一个迭代器是一个相对昂贵的操作，尽可能重用迭代器

5\. **使用 forEachRemaining 替代循环**：更高效的批量操作

```java
// 优化前
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String s = it.next();
    process(s); // 复杂操作
}

// 优化后：批量处理
it.forEachRemaining(this::process);
```

## 7 最佳实践

### 7.1 选择适当的迭代方式

- **ArrayList**：优先使用索引遍历（随机访问快）
- **LinkedList**：必须使用迭代器（索引遍历性能差）
- **并发场景**：
  - 高读低写：CopyOnWriteArrayList
  - 高并发读写：ConcurrentHashMap
- **大数据集**：使用 Spliterator 并行处理

### 7.2 并发环境下的迭代器

在并发环境下，迭代器面临的主要问题是"快速失败"机制导致的 ConcurrentModificationException。以下是几种解决方案：

1\. **CopyOnWrite 策略**：读操作完全无锁，适合读多写少场景

```java
public class CopyOnWriteIterator<T> implements Iterator<T> {
    private final Object[] snapshot;
    private int cursor;

    public CopyOnWriteIterator(Collection<T> collection) {
        this.snapshot = collection.toArray();
    }
    // 实现hasNext/next...
}
```

2\. **读写锁方案**：平衡读写性能，适合中等并发

```java
public class RWLockIterator<T> implements Iterator<T> {
    private final List<T> list;
    private final ReadWriteLock lock;
    private int cursor;

    public T next() {
        lock.readLock().lock();
        try {
            return list.get(cursor++);
        } finally {
            lock.readLock().unlock();
        }
    }
}
```

3\. **弱一致性迭代器**：某些并发集合（如 ConcurrentHashMap、CopyOnWriteArrayList）的迭代器具有弱一致性，允许在遍历过程中修改集合

```java
List<String> list = new CopyOnWriteArrayList<>(List.of("A", "B"));
Iterator<String> it = list.iterator();
list.add("C"); // 修改集合

while (it.hasNext()) {
    System.out.print(it.next() + " "); // 输出 "A B"（不包含新增的"C"）
}
```

### 7.3 利用 Stream API 简化遍历

Java 8 引入的 Stream API 可以大大简化集合操作：

```java
// 过滤和映射
list.stream()
    .filter(s -> s.length() > 3)
    .map(String::toUpperCase)
    .forEach(System.out::println);

// 并行处理大数据集
long count = list.parallelStream()
                .filter(this::complexCheck)
                .count();

// 替代手动迭代删除
list.removeIf(s -> s.startsWith("X"));
```

## 8 自定义迭代器实现

### 8.1 实现树结构迭代器

```java
class TreeNode {
    int value;
    TreeNode left;
    TreeNode right;

    TreeNode(int value) {
        this.value = value;
    }
}

class TreeIterator implements Iterator<Integer> {
    private Stack<TreeNode> stack = new Stack<>();

    public TreeIterator(TreeNode root) {
        pushLeft(root);
    }

    private void pushLeft(TreeNode node) {
        while (node != null) {
            stack.push(node);
            node = node.left;
        }
    }

    @Override
    public boolean hasNext() {
        return !stack.isEmpty();
    }

    @Override
    public Integer next() {
        if (!hasNext()) throw new NoSuchElementException();
        TreeNode node = stack.pop();
        pushLeft(node.right);
        return node.value;
    }
}

// 使用示例
TreeNode root = new TreeNode(5);
root.left = new TreeNode(3);
root.right = new TreeNode(8);
root.left.left = new TreeNode(1);

Iterator<Integer> it = new TreeIterator(root);
while (it.hasNext()) {
    System.out.print(it.next() + " ");
}
// 输出: 1 3 5 8
```

### 8.2 过滤迭代器

```java
public class FilteringIterator<T> implements Iterator<T> {
    private final Iterator<T> source;
    private final Predicate<T> predicate;
    private T nextItem;
    private boolean nextSet = false;

    public FilteringIterator(Iterator<T> source, Predicate<T> predicate) {
        this.source = source;
        this.predicate = predicate;
    }

    @Override
    public boolean hasNext() {
        if (nextSet) return true;
        while (source.hasNext()) {
            T item = source.next();
            if (predicate.test(item)) {
                nextItem = item;
                nextSet = true;
                return true;
            }
        }
        return false;
    }

    @Override
    public T next() {
        if (!hasNext()) throw new NoSuchElementException();
        nextSet = false;
        return nextItem;
    }
}
```

## 9 总结

Java 迭代器是集合框架的核心组件，提供了统一的方式来遍历各种集合类型。通过深入理解迭代器的工作原理和特性，我们可以编写出更健壮、高效的代码。

**核心要点**：

1. 优先使用迭代器的 `remove()` 方法避免 ConcurrentModificationException
2. 根据集合类型选择最合适的迭代方式
3. 在并发环境下选择合适的并发集合和迭代策略
4. 利用 Stream API 和批量操作简化代码并提升性能
5. 对于大型数据集，考虑使用 Spliterator 进行并行处理

迭代器模式通过抽象遍历逻辑，为异构数据结构的统一访问提供了优雅方案，其核心价值在于解耦客户端与集合实现，提升代码可维护性和扩展性。
