---
title: Java Scanner 类详解与最佳实践（知道就好）
description: 详细介绍 Java Scanner 类的功能、使用方法和最佳实践，帮助开发者正确、高效地使用 Scanner 类进行输入处理。
author: zhycn
---

# Java Scanner 类详解与最佳实践（知道就好）

## 1. 概述与核心功能

Java 中的 `Scanner` 类是 `java.util` 包中一个极其实用的工具类，用于解析基本类型和字符串的简单文本扫描器。它可以将输入文本（如文件、字符串或标准输入流）分解为标记（tokens），然后使用各种 `next` 方法将其转换为不同类型的值。

Scanner 类的核心功能包括：

- 从多种输入源读取数据（控制台、文件、字符串等）
- 将输入分解为标记（默认以空白符分隔）
- 将标记转换为各种基本数据类型
- 支持正则表达式匹配
- 提供丰富的输入验证方法

Scanner 类的设计理念是简单、灵活，适合处理各种不同的数据源，包括控制台输入、文件输入、字符串等。它使用正则表达式来解析原始输入流，从而读取不同类型的值。

## 2. 创建 Scanner 对象

Scanner 类提供了多个构造函数，可以根据不同的需求来创建 Scanner 对象。

### 2.1 从标准输入（控制台）创建

```java
import java.util.Scanner;

public class ScannerExample {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // 使用scanner对象...
    }
}
```

这是最常见的用法，用于从控制台读取用户输入。

### 2.2 从字符串创建

```java
String input = "Hello World 123 45.67 true";
Scanner scanner = new Scanner(input);
```

这种方式用于从字符串中解析数据。

### 2.3 从文件创建

```java
try {
    Scanner fileScanner = new Scanner(new File("data.txt"));
    // 使用文件扫描器...
    fileScanner.close(); // 记得关闭
} catch (FileNotFoundException e) {
    e.printStackTrace();
}
```

注意：文件扫描器使用后必须关闭，推荐使用 try-with-resources：

```java
try (Scanner fileScanner = new Scanner(new File("data.txt"))) {
    // 自动关闭
}
```

### 2.4 从其他输入流创建

```java
InputStream inputStream = socket.getInputStream();
Scanner socketScanner = new Scanner(inputStream);
```

Scanner 类可以适配各种输入流。

## 3. 读取不同类型的数据

Scanner 类提供了一系列方法来处理不同类型的数据。

### 3.1 读取基本数据类型

```java
Scanner scanner = new Scanner(System.in);

System.out.print("请输入一个整数: ");
int num = scanner.nextInt();

System.out.print("请输入一个小数: ");
double decimal = scanner.nextDouble();

System.out.print("请输入true或false: ");
boolean bool = scanner.nextBoolean();
```

注意：这些方法会阻塞程序，等待用户输入。

### 3.2 读取字符串

```java
// 读取单个单词（以空白符分隔）
String word = scanner.next();

// 读取整行（包括空格）
String line = scanner.nextLine();
```

**重要区别**：

- `next()`：读取下一个标记（默认以空白符分隔）
- `nextLine()`：读取当前行的剩余内容（包括换行符前的所有字符）

### 3.3 混合输入的问题与解决

**常见问题**：

```java
System.out.print("请输入年龄: ");
int age = scanner.nextInt();
System.out.print("请输入姓名: ");
String name = scanner.nextLine(); // 这里会直接跳过！
```

**原因**：`nextInt()`只读取数字，不读取行尾的换行符，导致`nextLine()`读取到空字符串。

**解决方案**：

1\. 统一使用`nextLine()`然后转换：

```java
int age = Integer.parseInt(scanner.nextLine());
```

2\. 在`nextInt()`后添加一个额外的`nextLine()`：

```java
int age = scanner.nextInt();
scanner.nextLine(); // 消耗换行符
String name = scanner.nextLine();
```

## 4. 高级输入处理

### 4.1 分隔符控制

默认情况下，Scanner 使用空白符作为分隔符，但可以自定义：

```java
String input = "one,two,three,four";
Scanner scanner = new Scanner(input);
scanner.useDelimiter(","); // 设置逗号为分隔符

while (scanner.hasNext()) {
    System.out.println(scanner.next());
}
// 输出:
// one
// two
// three
// four
```

### 4.2 使用正则表达式匹配

Scanner 类支持强大的正则表达式功能：

```java
String input = "1 fish 2 fish red fish blue fish";
Scanner s = new Scanner(input);
s.findInLine("(\\d+) fish (\\d+) fish (\\w+) fish (\\w+) fish");

MatchResult result = s.match();
for (int i = 1; i <= result.groupCount(); i++) {
    System.out.println(result.group(i));
}
// 输出:
// 1
// 2
// red
// blue
```

### 4.3 输入验证

在读取前检查输入类型：

```java
Scanner scanner = new Scanner(System.in);
System.out.print("请输入一个整数: ");

while (!scanner.hasNextInt()) {
    System.out.println("输入的不是整数！请重新输入: ");
    scanner.next(); // 消耗无效输入
}
int num = scanner.nextInt();
```

**常用检查方法**：

- `hasNext()`：是否有更多标记
- `hasNextInt()`：是否有整数
- `hasNextDouble()`：是否有浮点数
- `hasNextLine()`：是否有下一行
- `hasNext(pattern)`：是否匹配指定正则表达式

## 5. 异常处理与边界情况

Scanner 类在解析输入时可能会遇到无效数据，例如在读取整数时遇到非数字字符。这时，Scanner 会抛出 `InputMismatchException` 异常。

### 5.1 处理输入不匹配异常

```java
try {
    System.out.print("请输入一个整数：");
    int number = scanner.nextInt();
    System.out.println("你输入的整数是：" + number);
} catch (InputMismatchException e) {
    System.out.println("输入的不是一个有效的整数。");
    scanner.next(); // 消耗无效输入
}
```

### 5.2 处理文件不存在异常

```java
try {
    File file = new File("data.txt");
    Scanner scanner = new Scanner(file);
    // 使用scanner...
} catch (FileNotFoundException e) {
    System.out.println("文件未找到：" + e.getMessage());
}
```

## 6. 最佳实践与性能优化

### 6.1 资源管理

Scanner 对象在使用完成后需要关闭，以释放相关的资源。对于文件扫描器，这一点尤其重要。

**推荐使用 try-with-resources**：

```java
try (Scanner scanner = new Scanner(new File("data.txt"))) {
    while (scanner.hasNextLine()) {
        String line = scanner.nextLine();
        System.out.println(line);
    }
} catch (FileNotFoundException e) {
    e.printStackTrace();
}
```

注意：如果 Scanner 是从 System.in 创建的，关闭它会同时关闭 System.in，可能导致后续无法再使用标准输入。

### 6.2 性能优化建议

- **缓冲大型文件**：对于大文件，可以包装在 BufferedReader 中

  ```java
  Scanner fileScanner = new Scanner(new BufferedReader(new FileReader("bigfile.txt")));
  ```

- **重用 Scanner 对象**：避免频繁创建和销毁

- **选择合适的输入源**：根据数据来源选择最合适的构造方法

- **及时关闭资源**：使用 try-with-resources 确保资源释放

### 6.3 多线程考虑

Scanner 类不是线程安全的。在多线程环境中，应该为每个线程创建独立的 Scanner 实例或进行同步控制。

## 7. 实战应用案例

### 7.1 控制台计算器

```java
import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            System.out.println("简单计算器 (输入q退出)");

            while (true) {
                System.out.print("> ");
                if (!scanner.hasNextLine()) break;

                String input = scanner.nextLine().trim();
                if (input.equalsIgnoreCase("q")) break;

                try {
                    String[] parts = input.split("\\s+");
                    if (parts.length != 3) {
                        System.out.println("格式: 数字 运算符 数字");
                        continue;
                    }

                    double a = Double.parseDouble(parts[0]);
                    String op = parts[1];
                    double b = Double.parseDouble(parts[2]);
                    double result;

                    switch (op) {
                        case "+": result = a + b; break;
                        case "-": result = a - b; break;
                        case "*": result = a * b; break;
                        case "/":
                            if (b != 0) {
                                result = a / b;
                            } else {
                                System.out.println("除数不能为0");
                                continue;
                            }
                            break;
                        default:
                            System.out.println("未知运算符");
                            continue;
                    }

                    System.out.printf("结果: %.2f%n", result);
                } catch (Exception e) {
                    System.out.println("错误: " + e.getMessage());
                }
            }
        }
    }
}
```

### 7.2 学生成绩统计

```java
import java.io.File;
import java.util.Scanner;

public class GradeStatistics {
    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(new File("scores.txt"))) {
            int count = 0;
            double sum = 0;
            double max = Double.MIN_VALUE;
            double min = Double.MAX_VALUE;

            while (scanner.hasNextDouble()) {
                double score = scanner.nextDouble();
                count++;
                sum += score;
                max = Math.max(max, score);
                min = Math.min(min, score);
            }

            System.out.println("统计结果:");
            System.out.println("学生人数: " + count);
            System.out.printf("平均分: %.2f%n", sum / count);
            System.out.println("最高分: " + max);
            System.out.println("最低分: " + min);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 7.3 配置文件解析

假设有一个配置文件 `config.properties`：

```properties
# config.properties
username=admin
timeout=30
cache.enabled=true
```

解析代码：

```java
import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class ConfigParser {
    public static void main(String[] args) {
        Map<String, String> config = new HashMap<>();

        try (Scanner scanner = new Scanner(new File("config.properties"))) {
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine().trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                String[] keyValue = line.split("=", 2);
                if (keyValue.length == 2) {
                    config.put(keyValue[0].trim(), keyValue[1].trim());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        System.out.println("用户名: " + config.get("username"));
        System.out.println("超时: " + Integer.parseInt(config.get("timeout")));
        System.out.println("缓存启用: " + Boolean.parseBoolean(config.get("cache.enabled")));
    }
}
```

## 8. 总结

Scanner 类是 Java 中处理输入数据的一个非常有用的工具。它的灵活性使得它在各种应用场景下都表现出色，无论是从控制台读取用户输入，还是从文件中解析数据。

**Scanner 的最佳实践**：

- **始终验证输入**：使用 `hasNextXxx()` 方法确保输入类型正确
- **正确处理混合输入**：注意 `nextLine()` 的行为，适当消耗换行符
- **及时关闭资源**：使用 try-with-resources 语句确保资源释放
- **合理选择输入源**：根据场景选择最合适的构造方法
- **异常处理**：考虑输入可能出错的情况，提高程序健壮性

掌握了 Scanner 类的使用技巧，可以显著提高你在开发过程中处理数据输入的效率。无论是简单的控制台应用还是复杂的文件处理，Scanner 都能成为你的得力助手。

希望本文能帮助你全面掌握 Java Scanner 类的使用技巧，在实际开发中更加高效地处理输入数据。
