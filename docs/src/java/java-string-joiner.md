---
title: Java StringJoiner 详解与最佳实践
author: zhycn
---

# Java StringJoiner 详解与最佳实践

## 1 概述

StringJoiner 是 Java 8 中引入的一个实用工具类，位于 `java.util` 包中，用于构造由分隔符分隔的字符序列，并能选择性地添加前缀和后缀。它提供了一种更优雅、简洁的方式来处理字符串拼接操作，特别适用于需要特定格式（如 CSV、JSON 等）输出的场景。

与传统使用 `StringBuilder` 或字符串连接操作相比，StringJoiner 的主要优势在于自动处理分隔符的添加，避免了手动检查和处理末尾多余分隔符的麻烦，使代码更加简洁和易读。

## 2 核心特性

StringJoiner 具有以下核心特性：

- **分隔符支持**：自动在添加的元素之间插入指定的分隔符
- **前缀和后缀**：可以为最终生成的字符串添加固定的前缀和后缀
- **空值处理**：可自定义当没有添加任何元素时返回的默认值
- **合并功能**：能够将另一个 StringJoiner 的内容合并到当前实例中
- **链式调用**：所有修改方法都返回 StringJoiner 实例本身，支持链式编程

## 3 类声明与构造方法

StringJoiner 类声明如下：

```java
public final class StringJoiner extends Object
```

它提供了两种构造方法：

### 3.1 仅指定分隔符

```java
StringJoiner(CharSequence delimiter)
```

创建一个 StringJoiner 对象，仅使用指定的分隔符，不添加前缀和后缀。

示例：

```java
StringJoiner joiner = new StringJoiner(", ");
joiner.add("Apple").add("Banana").add("Cherry");
System.out.println(joiner.toString()); // 输出: Apple, Banana, Cherry
```

### 3.2 指定分隔符、前缀和后缀

```java
StringJoiner(CharSequence delimiter, CharSequence prefix, CharSequence suffix)
```

创建一个 StringJoiner 对象，使用指定的分隔符、前缀和后缀。

示例：

```java
StringJoiner joiner = new StringJoiner(", ", "[", "]");
joiner.add("Apple").add("Banana").add("Cherry");
System.out.println(joiner.toString()); // 输出: [Apple, Banana, Cherry]
```

## 4 核心方法详解

### 4.1 add(CharSequence newElement)

向 StringJoiner 中添加一个新元素。如果添加的元素为 null，则添加 "null" 字符串。

```java
StringJoiner joiner = new StringJoiner("-");
joiner.add("2023").add("08").add("20");
System.out.println(joiner.toString()); // 输出: 2023-08-20
```

### 4.2 merge(StringJoiner other)

将另一个 StringJoiner 的内容合并到当前 StringJoiner 中。合并时只会拼接内容，不会附加前缀、后缀或分隔符。

```java
StringJoiner joiner1 = new StringJoiner(",", "[", "]");
joiner1.add("A").add("B");

StringJoiner joiner2 = new StringJoiner("+", "<", ">");
joiner2.add("1").add("2");

joiner1.merge(joiner2);
System.out.println(joiner1.toString()); // 输出: [A,B,1+2]
```

### 4.3 setEmptyValue(CharSequence emptyValue)

设置当 StringJoiner 中没有任何元素时返回的默认值。

```java
StringJoiner joiner = new StringJoiner("/");
joiner.setEmptyValue("暂无数据");
System.out.println(joiner.toString()); // 输出: 暂无数据
```

### 4.4 length()

返回当前 StringJoiner 中字符串的长度（包括前缀和后缀）。

```java
StringJoiner joiner = new StringJoiner(",", "[", "]");
joiner.add("Apple").add("Banana");
System.out.println(joiner.length()); // 输出: 15 ([Apple,Banana])
```

### 4.5 toString()

返回拼接后的完整字符串。如果没有添加任何元素，则返回设置的空值（如果通过 setEmptyValue 设置）或前缀+后缀。

```java
StringJoiner joiner = new StringJoiner(", ", "{ ", " }");
joiner.add("Name").add("Age").add("City");
System.out.println(joiner.toString()); // 输出: { Name, Age, City }
```

## 5 内部实现机制

StringJoiner 内部使用 StringBuilder 来构建最终的字符串。它维护了几个关键字段：

- `prefix`：前缀字符串
- `delimiter`：分隔符字符串
- `suffix`：后缀字符串
- `value`：StringBuilder 实例，用于存储当前拼接的结果
- `emptyValue`：当没有添加元素时返回的默认值

当首次调用 add() 方法时，StringJoiner 会初始化内部的 StringBuilder 实例并先追加前缀。后续添加元素时，会先追加分隔符，再追加元素内容。只有在调用 toString() 方法时，才会追加后缀。

## 6 使用场景与示例

### 6.1 拼接列表或数组中的字符串

```java
String[] fruits = {"Apple", "Banana", "Cherry"};
StringJoiner joiner = new StringJoiner(", ");
for (String fruit : fruits) {
    joiner.add(fruit);
}
System.out.println(joiner.toString()); // 输出: Apple, Banana, Cherry
```

### 6.2 生成 SQL 查询条件

```java
String[] conditions = {"age > 18", "salary > 3000", "active = 1"};
StringJoiner joiner = new StringJoiner(" AND ");
for (String condition : conditions) {
    joiner.add(condition);
}
String sql = "SELECT * FROM employees WHERE " + joiner.toString();
System.out.println(sql);
// 输出: SELECT * FROM employees WHERE age > 18 AND salary > 3000 AND active = 1
```

### 6.3 配置文件或日志输出格式化

```java
Properties config = new Properties();
config.setProperty("url", "https://example.com");
config.setProperty("timeout", "30");
config.setProperty("retries", "5");

StringJoiner joiner = new StringJoiner(", ", "{", "}");
config.forEach((key, value) -> joiner.add(key + "=" + value));
System.out.println(joiner.toString());
// 输出: {url=https://example.com, timeout=30, retries=5}
```

### 6.4 与 Stream API 结合使用

```java
List<String> cities = Arrays.asList("Beijing", "Shanghai", "Guangzhou");
String result = cities.stream()
                     .filter(s -> s.length() > 7)
                     .collect(Collectors.joining("; ", "{ ", " }"));
System.out.println(result); // 输出: { Beijing; Shanghai; Guangzhou }
```

## 7 性能分析与注意事项

### 7.1 性能特点

StringJoiner 的性能表现接近于 StringBuilder，特别是在处理大量字符串拼接时表现良好。然而，StringJoiner 的设计初衷更多是为了简化代码书写和提升可读性，而不是专注于性能极致优化。

### 7.2 使用注意事项

1. **线程安全**：StringJoiner 不是线程安全的，如果在多线程环境中使用，需要手动同步。
2. **空值处理**：add(null) 会拼接 "null" 字符串，建议提前过滤 null 值。
3. **适用场景**：尽量在适合的场景中使用 StringJoiner，比如拼接复杂字符串或者需要添加前缀和后缀的场景。
4. **元素中的分隔符**：StringJoiner 不会自动转义元素中包含的分隔符字符，需要开发者自行处理。
5. **大数据量处理**：对于超大数据量的拼接操作，建议直接使用 StringBuilder 以获得更好的性能。

## 8 与相关技术的对比

### 8.1 StringJoiner vs StringBuilder

| 特性 | StringJoiner | StringBuilder |
|------|-------------|--------------|
| **用途** | 拼接带分隔符、前缀、后缀的字符串 | 拼接任意字符串 |
| **灵活性** | 专注于分隔符处理，灵活性较低 | 灵活性高，支持任意操作 |
| **性能** | 性能较高（用于分隔符场景） | 性能最高 |
| **代码简洁性** | 更简洁，适合处理带分隔符的拼接 | 需要手动处理分隔符 |
| **前缀后缀支持** | 内置支持 | 需要手动添加 |

### 8.2 StringJoiner vs String.join

String.join 是 Java 8 提供的静态方法，底层使用 StringJoiner，但只能指定分隔符，不能添加前缀和后缀。

```java
// 使用 String.join
String result = String.join(", ", "Apple", "Banana", "Cherry");
System.out.println(result); // 输出: Apple, Banana, Cherry

// 使用 StringJoiner（可实现相同功能）
StringJoiner joiner = new StringJoiner(", ");
joiner.add("Apple").add("Banana").add("Cherry");
System.out.println(joiner.toString()); // 输出: Apple, Banana, Cherry

// 使用 StringJoiner（更复杂的功能）
StringJoiner joinerWithPrefixSuffix = new StringJoiner(", ", "[", "]");
joinerWithPrefixSuffix.add("Apple").add("Banana").add("Cherry");
System.out.println(joinerWithPrefixSuffix.toString()); // 输出: [Apple, Banana, Cherry]
```

### 8.3 StringJoiner vs Collectors.joining

Collectors.joining 是 Stream API 中提供的收集器，底层也是使用 StringJoiner 实现。

```java
List<String> list = Arrays.asList("Apple", "Banana", "Cherry");

// 使用 Collectors.joining
String result1 = list.stream()
                    .collect(Collectors.joining(", "));
System.out.println(result1); // 输出: Apple, Banana, Cherry

// 使用 Collectors.joining（带前缀和后缀）
String result2 = list.stream()
                    .collect(Collectors.joining(", ", "[", "]"));
System.out.println(result2); // 输出: [Apple, Banana, Cherry]

// 直接使用 StringJoiner
StringJoiner joiner = new StringJoiner(", ", "[", "]");
list.forEach(joiner::add);
System.out.println(joiner.toString()); // 输出: [Apple, Banana, Cherry]
```

## 9 最佳实践

1. **选择合适的技术**：
    - 简单分隔符拼接：使用 `String.join()`
    - 需要前缀、后缀或复杂逻辑：使用 `StringJoiner`
    - 超大量数据拼接或复杂操作：使用 `StringBuilder`

2. **合理处理空值**：

    ```java
    StringJoiner joiner = new StringJoiner(", ");
    joiner.setEmptyValue("No elements");
    // 没有添加任何元素
    System.out.println(joiner.toString()); // 输出: No elements
    ```

3. **过滤空值元素**：

    ```java
    List<String> data = Arrays.asList("Java", "", "Python", null);
    StringJoiner joiner = new StringJoiner("; ");
    data.stream()
        .filter(str -> str != null && !str.isEmpty())
        .forEach(joiner::add);
    System.out.println(joiner.toString()); // 输出: Java; Python
    ```

4. **利用链式调用**：

    ```java
    String result = new StringJoiner(", ", "[", "]")
        .add("Apple")
        .add("Banana")
        .add("Cherry")
        .toString();
    System.out.println(result); // 输出: [Apple, Banana, Cherry]
    ```

5. **合并多个 StringJoiner**：

    ```java
    StringJoiner joiner1 = new StringJoiner(", ", "Names: ", "");
    joiner1.add("Alice").add("Bob");

    StringJoiner joiner2 = new StringJoiner(" and ", "", " are programmers");
    joiner2.add("Charlie").add("David");

    joiner1.merge(joiner2);
    System.out.println(joiner1.toString());
    // 输出: Names: Alice, Bob, Charlie and David are programmers
    ```

## 10 总结

StringJoiner 是 Java 8 引入的一个非常实用的类，它简化了字符串拼接操作，尤其是在处理需要定界符、前缀、后缀的场景时非常方便。通过理解 StringJoiner 的工作原理和应用场景，开发者可以更高效地处理字符串拼接任务，同时保持代码的简洁性和可读性。

在日常开发中，选择 StringJoiner、StringBuilder 还是 String.join，取决于具体的需求和场景。对于简单的分隔符拼接，String.join 可能更简洁；对于需要前缀、后缀或更复杂控制的场景，StringJoiner 是更好的选择；而对于超大数据量或需要高性能的场景，StringBuilder 可能更合适。

无论如何，StringJoiner 为我们提供了一个简洁而优雅的解决方案，是我们处理字符串操作的利器之一。
