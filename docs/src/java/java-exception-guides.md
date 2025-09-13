---
title: Java 常用异常类完整指南
description: 本文详细介绍了 Java 中常用的异常类，包括异常类的层次结构、常用异常类的使用场景和最佳实践。
keywords: [Java, 异常处理, 异常类, 常用异常类, 异常类层次结构, 异常处理机制, 最佳实践]
author: zhycn
---

# Java 常用异常类完整指南

## 1 概述：Java 异常处理机制

在 Java 编程中，异常是指程序运行时发生的不正常情况，它会中断正常的指令流。Java 提供了强大的异常处理机制，通过 `try-catch-finally` 语句块、`throw` 和 `throws` 关键字来处理异常，使程序更加健壮和可靠。

Java 的异常处理机制遵循以下原则：

- 将业务代码与异常处理代码分离
- 通过异常类型提供灵活的错误分类
- 提供调用栈信息帮助调试问题

## 2 Java 异常类层次结构

Java 中所有的异常类都继承自 `java.lang.Throwable` 类，其层次结构如下所示：

```java
Throwable
├── Exception (可检查异常)
│   ├── RuntimeException (运行时异常)
│   │   ├── ArithmeticException
│   │   ├── NullPointerException
│   │   ├── ClassCastException
│   │   ├── IllegalArgumentException
│   │   │   ├── NumberFormatException
│   │   ├── IndexOutOfBoundsException
│   │   │   ├── ArrayIndexOutOfBoundsException
│   │   │   └── StringIndexOutOfBoundsException
│   │   └── ...
│   ├── IOException
│   ├── SQLException
│   └── ...
└── Error (系统错误)
    ├── OutOfMemoryError
    ├── StackOverflowError
    └── ...
```

### 2.1 Throwable 类

作为所有异常和错误的基类，`Throwable` 提供了获取异常信息、堆栈跟踪等方法：

- `getMessage()` - 返回异常的详细消息字符串
- `getCause()` - 返回抛出该异常的原因
- `printStackTrace()` - 打印异常的堆栈跟踪信息

### 2.2 Error 与 Exception 的区别

- **Error** 及其子类通常表示严重的问题，如系统错误或资源耗尽。应用程序通常不捕获或处理这些错误，因为它们表明存在需要直接关注的问题，而不是通过应用程序代码处理。
- **Exception** 及其子类表示应用程序可能想要捕获和处理的异常条件。它们分为两大类：检查异常（checked exceptions）和未检查异常（unchecked exceptions，也称为运行时异常）。

## 3 常用异常类清单

下面列出了 JDK 中常用的异常类及其分类：

| 异常类名称 | 类别 | 简要描述 |
| ---------- | ---- | -------- |
| `NullPointerException` | 运行时异常 | 当应用程序试图在需要对象的地方使用 `null` 时抛出 |
| `ArithmeticException` | 运行时异常 | 当出现异常的算术条件时抛出，例如除以零 |
| `ArrayIndexOutOfBoundsException` | 运行时异常 | 当使用非法索引访问数组时抛出，索引为负或大于等于数组大小 |
| `ClassCastException` | 运行时异常 | 当试图将对象强制转换为不是实例的子类时抛出 |
| `IllegalArgumentException` | 运行时异常 | 当向方法传递非法或不适当的参数时抛出 |
| `NumberFormatException` | 运行时异常 | 当应用程序试图将字符串转换为数值类型，但字符串格式不当时抛出 |
| `StringIndexOutOfBoundsException` | 运行时异常 | 当使用索引访问字符串，但索引为负或大于等于字符串长度时抛出 |
| `IOException` | 检查异常 | 当发生某种 I/O 异常时抛出，如文件未找到或无法读取 |
| `FileNotFoundException` | 检查异常 | 当试图打开指定路径名表示的文件失败时抛出 |
| `SQLException` | 检查异常 | 提供关于数据库访问错误或其他错误的信息 |
| `InterruptedException` | 检查异常 | 当线程在活动之前或期间被中断时抛出 |
| `NoSuchMethodException` | 检查异常 | 当无法找到特定方法时抛出 |
| `ClassNotFoundException` | 检查异常 | 当应用程序试图加载类但无法找到时抛出 |
| `OutOfMemoryError` | 错误 | 当 Java 虚拟机无法分配对象时抛出，因为内存不足 |
| `StackOverflowError` | 错误 | 当应用程序递归太深而发生堆栈溢出时抛出 |

## 4 常见运行时异常详解

### 4.1 NullPointerException (空指针异常)

**说明**：当尝试调用一个空对象的方法或访问其属性时抛出。

**常见原因**：

- 对象未初始化就被使用
- 方法返回 `null` 而未做检查
- 数组元素为 `null` 而直接使用

**示例代码**：

```java
public class NullPointerExample {
    public static void main(String[] args) {
        String text = null;
        
        // 这会抛出NullPointerException
        try {
            System.out.println(text.length());
        } catch (NullPointerException e) {
            System.out.println("捕获到NullPointerException: " + e.getMessage());
        }
        
        // 正确的处理方式
        if (text != null) {
            System.out.println(text.length());
        } else {
            System.out.println("字符串为null");
        }
        
        // 使用Java 8的Optional类
        java.util.Optional<String> optionalText = java.util.Optional.ofNullable(text);
        System.out.println("字符串长度: " + optionalText.map(String::length).orElse(0));
    }
}
```

### 4.2 ArithmeticException (算术异常)

**说明**：当出现异常的算术条件时抛出，例如除以零。

**示例代码**：

```java
public class ArithmeticExample {
    public static void main(String[] args) {
        int a = 10;
        int b = 0;
        
        try {
            int result = a / b; // 这会抛出ArithmeticException
        } catch (ArithmeticException e) {
            System.out.println("捕获到ArithmeticException: " + e.getMessage());
            System.out.println("除数不能为零");
        }
        
        // 预防措施
        if (b != 0) {
            int result = a / b;
            System.out.println("结果: " + result);
        } else {
            System.out.println("除数不能为零");
        }
    }
}
```

### 4.3 ArrayIndexOutOfBoundsException (数组索引越界异常)

**说明**：当使用非法索引访问数组时抛出，索引为负或大于等于数组大小。

**示例代码**：

```java
public class ArrayIndexExample {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3, 4, 5};
        
        try {
            // 尝试访问不存在的数组元素
            System.out.println(numbers[10]); // 这会抛出ArrayIndexOutOfBoundsException
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("捕获到ArrayIndexOutOfBoundsException: " + e.getMessage());
        }
        
        // 预防措施 - 检查索引范围
        int index = 10;
        if (index >= 0 && index < numbers.length) {
            System.out.println(numbers[index]);
        } else {
            System.out.println("索引 " + index + " 超出数组范围 [0, " + (numbers.length-1) + "]");
        }
        
        // 使用增强for循环避免索引问题
        for (int num : numbers) {
            System.out.print(num + " ");
        }
    }
}
```

### 4.4 ClassCastException (类转换异常)

**说明**：当试图将对象强制转换为不是实例的子类时抛出。

**示例代码**：

```java
public class ClassCastExample {
    public static void main(String[] args) {
        Object obj = "Hello World";
        
        try {
            // 这将成功，因为obj实际上是一个String
            Integer number = (Integer) obj; // 这会抛出ClassCastException
        } catch (ClassCastException e) {
            System.out.println("捕获到ClassCastException: " + e.getMessage());
        }
        
        // 正确的处理方式 - 使用instanceof检查
        if (obj instanceof Integer) {
            Integer number = (Integer) obj;
            System.out.println("数字: " + number);
        } else if (obj instanceof String) {
            String text = (String) obj;
            System.out.println("文本: " + text);
        } else {
            System.out.println("未知类型: " + obj.getClass().getName());
        }
    }
}
```

### 4.5 IllegalArgumentException (非法参数异常)

**说明**：当向方法传递非法或不适当的参数时抛出。

**示例代码**：

```java
public class IllegalArgumentExample {
    
    public static void setAge(int age) {
        if (age < 0 || age > 150) {
            throw new IllegalArgumentException("年龄必须在0到150之间");
        }
        System.out.println("年龄设置为: " + age);
    }
    
    public static void printName(String name) {
        // 使用Objects.requireNonNull进行空值检查
        java.util.Objects.requireNonNull(name, "名字不能为空");
        System.out.println("名字是: " + name);
    }
    
    public static void main(String[] args) {
        try {
            setAge(-5); // 这会抛出IllegalArgumentException
        } catch (IllegalArgumentException e) {
            System.out.println("捕获到IllegalArgumentException: " + e.getMessage());
        }
        
        try {
            printName(null); // 这会抛出NullPointerException（IllegalArgumentException的子类）
        } catch (Exception e) {
            System.out.println("捕获到异常: " + e.getMessage());
        }
        
        // 使用自定义异常信息
        try {
            int[] array = {};
            if (array.length == 0) {
                throw new IllegalArgumentException("数组不能为空");
            }
        } catch (IllegalArgumentException e) {
            System.out.println("捕获到异常: " + e.getMessage());
        }
    }
}
```

### 4.6 NumberFormatException (数字格式异常)

**说明**：当应用程序试图将字符串转换为数值类型，但字符串格式不当时抛出。

**示例代码**：

```java
public class NumberFormatExample {
    public static void main(String[] args) {
        try {
            String input = "123abc";
            int number = Integer.parseInt(input); // 这会抛出NumberFormatException
        } catch (NumberFormatException e) {
            System.out.println("捕获到NumberFormatException: " + e.getMessage());
        }
        
        // 安全转换方法
        String[] testCases = {"123", "45.67", "abc", "9876543210"};
        
        for (String test : testCases) {
            try {
                int result = safeParseInt(test);
                System.out.println("转换成功: " + result);
            } catch (IllegalArgumentException e) {
                System.out.println("转换失败: " + e.getMessage());
            }
        }
    }
    
    public static int safeParseInt(String str) {
        if (str == null || str.isEmpty()) {
            throw new IllegalArgumentException("输入字符串为null或空");
        }
        
        // 检查是否只包含数字
        if (!str.matches("\\d+")) {
            throw new IllegalArgumentException("输入字符串包含非数字字符: " + str);
        }
        
        // 检查是否在int范围内
        try {
            return Integer.parseInt(str);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("数值超出int范围: " + str);
        }
    }
}
```

## 5 常见检查异常详解

### 5.1 IOException (输入输出异常)

**说明**：当发生某种 I/O 异常时抛出，如文件未找到或无法读取。

**示例代码**：

```java
import java.io.*;

public class IOExceptionExample {
    public static void main(String[] args) {
        BufferedReader reader = null;
        
        try {
            reader = new BufferedReader(new FileReader("nonexistent.txt"));
            String line = reader.readLine();
            while (line != null) {
                System.out.println(line);
                line = reader.readLine();
            }
        } catch (FileNotFoundException e) {
            System.out.println("文件未找到: " + e.getMessage());
        } catch (IOException e) {
            System.out.println("读取文件时发生I/O错误: " + e.getMessage());
        } finally {
            try {
                if (reader != null) {
                    reader.close();
                }
            } catch (IOException e) {
                System.out.println("关闭文件时发生错误: " + e.getMessage());
            }
        }
        
        // 使用try-with-resources语句（Java 7+）
        try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
            String line = br.readLine();
            while (line != null) {
                System.out.println(line);
                line = br.readLine();
            }
        } catch (IOException e) {
            System.out.println("发生I/O错误: " + e.getMessage());
        }
    }
}
```

## 6 错误类详解

### 6.1 OutOfMemoryError (内存不足错误)

**说明**：当 Java 虚拟机无法分配对象时抛出，因为内存不足。

**示例代码**：

```java
public class OutOfMemoryErrorExample {
    public static void main(String[] args) {
        try {
            // 尝试分配一个超大数组
            int[] hugeArray = new int[Integer.MAX_VALUE];
        } catch (OutOfMemoryError e) {
            System.out.println("捕获到OutOfMemoryError: " + e.getMessage());
            System.out.println("JVM内存不足，无法分配该数组");
        }
        
        // 获取当前内存信息
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        
        System.out.println("总内存: " + totalMemory / (1024 * 1024) + "MB");
        System.out.println("空闲内存: " + freeMemory / (1024 * 1024) + "MB");
        System.out.println("最大内存: " + maxMemory / (1024 * 1024) + "MB");
    }
}
```

## 7 异常处理最佳实践

1. **具体异常优先**：捕获最具体的异常类型，而不是简单地捕获 `Exception`
2. **不要忽略异常**：空的 catch 块会使问题难以调试
3. **使用 try-with-resources**：确保资源被正确关闭（Java 7+）
4. **提供有用的异常信息**：在异常消息中包含相关上下文信息
5. **适当使用检查异常和未检查异常**：
    - 对可恢复条件使用检查异常
    - 对编程错误使用未检查异常（运行时异常）
6. **考虑性能影响**：异常处理成本高昂，不应用于控制正常程序流
7. **日志记录**：适当记录异常，便于调试和监控

**示例**：

```java
public class ExceptionBestPractices {
    
    public void processFile(String filename) {
        // 使用try-with-resources确保资源被关闭
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                processLine(line);
            }
        } catch (FileNotFoundException e) {
            // 记录并抛出更具上下文意义的异常
            throw new IllegalArgumentException("文件未找到: " + filename, e);
        } catch (IOException e) {
            // 记录并抛出更具上下文意义的异常
            throw new RuntimeException("处理文件时发生I/O错误: " + filename, e);
        }
    }
    
    private void processLine(String line) {
        // 具体处理逻辑
        if (line == null || line.trim().isEmpty()) {
            // 使用适当的异常类型
            throw new IllegalArgumentException("行内容不能为空");
        }
        
        try {
            // 业务逻辑
            int value = Integer.parseInt(line);
            System.out.println("处理值: " + value);
        } catch (NumberFormatException e) {
            // 添加上下文信息并重新抛出
            throw new IllegalArgumentException("行内容不是有效数字: " + line, e);
        }
    }
    
    public static void main(String[] args) {
        ExceptionBestPractices example = new ExceptionBestPractices();
        
        try {
            example.processFile("data.txt");
        } catch (IllegalArgumentException e) {
            System.err.println("输入错误: " + e.getMessage());
            // 打印根本原因
            if (e.getCause() != null) {
                System.err.println("根本原因: " + e.getCause().getMessage());
            }
        } catch (RuntimeException e) {
            System.err.println("处理错误: " + e.getMessage());
            // 打印根本原因
            if (e.getCause() != null) {
                System.err.println("根本原因: " + e.getCause().getMessage());
            }
        }
    }
}
```

## 8 自定义异常

虽然 JDK 提供了丰富的异常类，但有时需要创建自定义异常以更好地表示特定问题。

**创建自定义检查异常**：

```java
public class InsufficientFundsException extends Exception {
    private double currentBalance;
    private double amountRequired;
    
    public InsufficientFundsException(double currentBalance, double amountRequired) {
        super("资金不足。当前余额: " + currentBalance + ", 所需金额: " + amountRequired);
        this.currentBalance = currentBalance;
        this.amountRequired = amountRequired;
    }
    
    public double getCurrentBalance() {
        return currentBalance;
    }
    
    public double getAmountRequired() {
        return amountRequired;
    }
}
```

**创建自定义运行时异常**：

```java
public class InvalidConfigurationException extends RuntimeException {
    private String configKey;
    
    public InvalidConfigurationException(String configKey) {
        super("无效配置: " + configKey);
        this.configKey = configKey;
    }
    
    public InvalidConfigurationException(String configKey, String message) {
        super("无效配置 " + configKey + ": " + message);
        this.configKey = configKey;
    }
    
    public String getConfigKey() {
        return configKey;
    }
}
```

**使用自定义异常**：

```java
public class BankAccount {
    private double balance;
    
    public void withdraw(double amount) throws InsufficientFundsException {
        if (amount > balance) {
            throw new InsufficientFundsException(balance, amount);
        }
        balance -= amount;
    }
}

public class CustomExceptionExample {
    public static void main(String[] args) {
        BankAccount account = new BankAccount();
        
        try {
            account.withdraw(100);
        } catch (InsufficientFundsException e) {
            System.out.println("错误: " + e.getMessage());
            System.out.println("当前余额: " + e.getCurrentBalance());
            System.out.println("所需金额: " + e.getAmountRequired());
        }
        
        // 使用自定义运行时异常
        String configKey = "database.url";
        try {
            if (configKey.isEmpty()) {
                throw new InvalidConfigurationException(configKey, "配置键不能为空");
            }
        } catch (InvalidConfigurationException e) {
            System.out.println("配置错误: " + e.getMessage());
            System.out.println("相关配置键: " + e.getConfigKey());
        }
    }
}
```

## 9 总结

Java 异常处理是编写健壮、可靠应用程序的关键部分。通过理解 JDK 提供的各种异常类及其适用场景，您可以更有效地处理错误条件，并提供更好的用户体验。记住要选择适当的异常类型，提供有用的错误消息，并遵循异常处理最佳实践。

**关键要点**：

1. Java 异常分为错误 (Error)、检查异常 (Exception) 和运行时异常 (RuntimeException)
2. 错误表示严重问题，应用程序通常不应尝试捕获
3. 检查异常需要在代码中显式处理或声明
4. 运行时异常通常表示编程错误，不需要强制处理
5. 使用 try-with-resources 可以简化资源管理代码
6. 提供有用的异常消息和上下文信息以便于调试
7. 在适当的时候创建自定义异常以更好地表示特定问题

通过掌握 Java 异常处理机制，您可以编写出更加健壮、可维护和可靠的应用程序。异常处理不仅仅是技术问题，更是设计问题。良好的异常处理能够提高程序的健壮性、可维护性和用户体验，是每个 Java 开发者必须掌握的核心技能。
