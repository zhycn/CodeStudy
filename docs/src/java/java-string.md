---
title: Java String 字符串详解
description: 详细介绍了 Java 字符串的基础概念、创建方式、不可变性以及字符串池机制。
author: zhycn
---

# Java String 字符串详解

## 1. 字符串基础与创建方式

### 1.1 字符串基本概念

Java 字符串是 `java.lang.String` 类的对象，用于存储和操作文本数据。从概念上讲，Java 字符串是 Unicode 字符的序列。例如字符串 `"Java\u2122"` 由 5 个 Unicode 字符组成：J、a、v、a 和 ™（商标符号，Unicode 编码为 U+2122）。

**字符串的不可变性**：

字符串在 Java 中是不可变的，任何修改操作都会生成新的字符串对象。这一特性带来了诸多优势，包括线程安全、字符串池优化和安全性能保障。

### 1.2 字符串创建方式

Java 提供了多种创建字符串的方式：

```java
// 方式1：直接赋值（推荐）
String s1 = "Hello";

// 方式2：构造函数
String s2 = new String("World");

System.out.println(s1 + " " + s2); // 输出: Hello World
```

**内存分配差异**：

- **直接赋值**：JVM 会检查字符串常量池是否存在相同内容，避免重复创建
- **构造函数**：通过 `new` 关键字创建新对象，每次都会在堆内存中分配新空间

```java
String s1 = "Java";
String s2 = "Java"; // 复用常量池中的"Java"
System.out.println(s1 == s2); // true

String s3 = new String("Java");
String s4 = new String("Java");
System.out.println(s3 == s4); // false
```

## 2. 字符串不可变性与字符串池

### 2.1 不可变性的实现与好处

Java 字符串的不可变性是通过以下机制实现的：

1. **String 类是 final 的**：不能被继承，确保不可变性不会被子类破坏
2. **内部使用 final 修饰的字符数组**（Java 9 后改为 byte[]）
3. **不提供修改方法**：所有操作字符串内容的方法都返回新对象

**不可变性的优势**：

- **线程安全**：不可变对象天然线程安全，无需同步
- **哈希缓存**：hashCode() 在首次计算后缓存，提升集合类性能
- **字符串常量池**：允许字符串复用，减少内存开销
- **安全性**：防止敏感数据（如文件路径）被篡改

### 2.2 字符串池机制

字符串池是 Java 堆内存中一个特殊的存储区域，用于存储所有字符串字面量，以减少创建相同内容的字符串对象。

```java
String str1 = "Hello";
String str2 = "Hello"; // 引用了池中的同一字符串对象
System.out.println(str1 == str2); // true，引用同一池中的对象
```

使用 `intern()` 方法可以手动将字符串添加到池中：

```java
String str1 = "Hello";
String str2 = new String("Hello");
str2 = str2.intern(); // 将字符串添加到池中
System.out.println(str1 == str2); // true
```

## 3. 字符串常用 API 方法

### 3.1 长度与空值检查

```java
String text = "Hello";
System.out.println(text.length()); // 5
System.out.println(text.isEmpty()); // false

// 空串与null串的区别
String empty = ""; // 长度为0的有效字符串对象
String str = null; // 未引用任何字符串对象

// 检查字符串是否有效（非null且非空）
if (str != null && !str.isEmpty()) {
    // 字符串有效，可安全操作
}
```

### 3.2 查找操作

```java
String text = "I am a good student";

// 查找字符位置
int firstIndex = text.indexOf('a'); // 2
int lastIndex = text.lastIndexOf('a'); // 5

// 查找子串位置
int subIndex = text.indexOf("good"); // 7

// 检查前缀和后缀
boolean starts = text.startsWith("I am"); // true
boolean ends = text.endsWith("student"); // true
```

### 3.3 比较操作

```java
String str1 = "hello";
String str2 = "Hello";

// 区分大小写比较
boolean isEqual = str1.equals(str2); // false

// 忽略大小写比较
boolean isEqualIgnoreCase = str1.equalsIgnoreCase(str2); // true

// 字典顺序比较
int compareResult = str1.compareTo(str2); // 大于0
int compareIgnoreResult = str1.compareToIgnoreCase(str2); // 0
```

### 3.4 截取与分割

```java
String text = "Java Programming";

// 截取子串
String sub1 = text.substring(5); // "Programming"
String sub2 = text.substring(5, 8); // "Pro"

// 分割字符串
String[] parts = "a,b,c".split(","); // ["a", "b", "c"]
String[] parts2 = "a.b.c".split("\\."); // 按点分割需要转义
```

### 3.5 替换与修改

```java
String text = "asdzxcasd";

// 字符替换
String replaced1 = text.replace('a', 'g'); // "gsdzxcgsd"

// 子串替换
String replaced2 = text.replace("asd", "fgh"); // "fghzxcfgh"

// 正则替换
String replaced3 = text.replaceAll("[aeiou]", "*"); // 所有元音替换为*

// 去除首尾空格
String trimmed = "  abcde  ".trim(); // "abcde"
```

### 3.6 大小写转换

```java
String text = "asDF";

String lowerCase = text.toLowerCase(); // "asdf"
String upperCase = text.toUpperCase(); // "ASDF"
```

## 4. 字符串格式化与拼接

### 4.1 格式化字符串

Java 提供了多种字符串格式化方式：

```java
String name = "Alice";
int age = 25;

// 使用String.format()
String formattedString = String.format("Name: %s, Age: %d", name, age);

// 使用printf()格式化输出
System.out.printf("Name: %s, Age: %d%n", name, age);

// 格式化浮点数
String productName = "Phone";
double price = 399.99;
String formattedPrice = String.format("Product: %s, Price: %.2f", productName, price);
```

**常用占位符**：

- `%s`：字符串类型
- `%d`：十进制整数类型
- `%f`：浮点数类型（默认保留6位小数）
- `%c`：单个字符类型
- `%.2f`：保留两位小数的浮点数
- `%n`：平台相关的换行符（推荐使用，而非\n）
- `%b`：布尔类型
- `%x`：十六进制整数

### 4.2 字符串拼接

Java 提供了多种字符串拼接方式：

```java
String firstName = "John";
String lastName = "Doe";

// 使用+运算符
String fullName1 = firstName + " " + lastName;

// 使用concat()方法
String fullName2 = firstName.concat(" ").concat(lastName);

// 使用StringBuilder（高效方式）
StringBuilder fullNameBuilder = new StringBuilder();
fullNameBuilder.append(firstName).append(" ").append(lastName);
String fullName3 = fullNameBuilder.toString();

// 使用String.join()（Java 8+）
String[] parts = {"S", "M", "L", "XL"};
String sizes = String.join(" / ", parts); // "S / M / L / XL"
```

**性能考虑**：对于单次拼接，`+` 运算符更简洁；对于循环拼接，必须使用 `StringBuilder` 以避免性能问题。

## 5. 字符串与正则表达式

### 5.1 正则匹配

```java
import java.util.regex.*;

String text = "The price is $10.99";
Pattern pattern = Pattern.compile("\\$\\d+\\.\\d{2}");
Matcher matcher = pattern.matcher(text);

if (matcher.find()) {
    String matchedText = matcher.group(); // 获取匹配的文本
}

// 简化的正则匹配
String email = "test@example.com";
boolean isValid = email.matches("^[\\w.-]+@[\\w.-]+\\.[a-z]{2,6}$");
```

### 5.2 正则分割与替换

```java
String text = "apple,banana,orange";

// 分割字符串
String[] fruits = text.split(","); // 分割字符串

// 正则替换
String updatedText = text.replaceAll("banana", "grape"); // 替换字符串
```

## 6. StringBuilder 与 StringBuffer

### 6.1 为什么需要 StringBuilder 和 StringBuffer

由于字符串不可变，频繁修改或连接字符串会生成大量临时对象，造成内存和性能浪费。StringBuilder 和 StringBuffer 是可变的字符序列，允许在原始字符串上进行操作，而不会创建新的对象，从而提高了效率。

### 6.2 区别与选择

| 特性     | String | StringBuffer     | StringBuilder |
| -------- | ------ | ---------------- | ------------- |
| 可变性   | 不可变 | 可变             | 可变          |
| 线程安全 | 是     | 是               | 否            |
| 性能     | 低     | 较低（同步开销） | 高            |

**推荐使用**：

- 单线程环境：StringBuilder
- 多线程环境：StringBuffer

### 6.3 常用方法

```java
StringBuilder sb = new StringBuilder();

// 追加内容
sb.append("Hello").append(" ").append("World"); // Hello World

// 插入内容
sb.insert(5, ","); // Hello, World

// 删除内容
sb.delete(5, 6); // Hello World

// 替换内容
sb.replace(6, 11, "Java"); // Hello Java

// 反转字符串
sb.reverse(); // avaJ olleH

// 设置字符
sb.setCharAt(0, 'A'); // AvaJ olleH

// 转换为String
String result = sb.toString();
```

## 7. 性能优化与最佳实践

### 7.1 避免性能陷阱

**1. 避免在循环中使用 `+` 拼接字符串**：

```java
// 低效方式（产生大量临时对象）
String result = "";
for (int i = 0; i < 1000; i++) {
    result += i; // 每次都会创建新字符串
}

// 高效方式（使用StringBuilder）
StringBuilder builder = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    builder.append(i); // 在原有对象上修改
}
String result = builder.toString();
```

**2. 使用 StringBuilder 进行字符串拼接**：

```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i); // 在原有对象上修改
}
String result = sb.toString();
```

**3. 使用 StringJoiner 进行更优雅的连接**：

```java
StringJoiner joiner = new StringJoiner(", ");
joiner.add("Apple");
joiner.add("Banana");
joiner.add("Orange");
String fruits = joiner.toString(); // "Apple, Banana, Orange"
```

### 7.2 字符串比较最佳实践

**永远不要使用 `==` 比较字符串内容**，这是初学者最容易犯的错误之一：

```java
String s1 = "Hello";
String s2 = new String("Hello");

s1 == s2; // false（比较引用，不是内容）
s1.equals(s2); // true（比较内容）
```

### 7.3 正确处理 Unicode 字符

Java 字符串由 char 序列组成，char 采用 UTF-16 编码表示 Unicode 码点：

```java
String s = "𝄞"; // 音乐符号，U+1D11E
s.length(); // 2（两个代码单元）
s.codePointCount(0, s.length()); // 1（实际码点数量）

// 正确遍历字符串的每个码点
String s = "A𝄞B";
int[] codePoints = s.codePoints().toArray();
for (int cp : codePoints) {
    System.out.println(Character.toChars(cp));
}
```

### 7.4 选择合适的数据结构

| 场景           | 推荐类型      | 原因                 |
| -------------- | ------------- | -------------------- |
| 高频修改字符串 | StringBuilder | 非线程安全但速度快   |
| 多线程环境修改 | StringBuffer  | 线程安全             |
| 只读操作       | String        | 不可变特性保证安全性 |

## 8. 总结

Java 字符串处理是编程中最常用的技能之一。通过本文的学习，你应该掌握：

1. Java 字符串的不可变性及其优势
2. 字符串池机制及其内存优化原理
3. 各种字符串操作 API 的正确使用方法
4. 字符串格式化与拼接的最佳实践
5. 正则表达式在字符串处理中的应用
6. StringBuilder 与 StringBuffer 的区别与使用场景
7. 字符串性能优化的关键技巧

**最佳实践总结**：

- 优先使用 `equals` 方法比较字符串内容
- 处理可能为 null 的字符串时，先检查 null
- 频繁拼接字符串时使用 `StringBuilder`
- 注意区分代码单元和码点，正确处理 Unicode 字符
- 避免创建不必要的字符串对象
- 字符串常量优先使用字面量形式（`"abc"`）而非 `new String("abc")`

掌握 Java 字符串处理不仅能提高代码质量和效率，也是理解 Java 面向对象特性的重要一步。字符串的不可变性、常量池机制等设计思想，在 Java 其他部分也有广泛应用。
