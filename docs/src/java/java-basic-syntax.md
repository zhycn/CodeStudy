---
title: Java 基础语法详解
description: 本文是一篇关于 Java 基础语法的详细教程，包含 Java 概述与开发环境配置、基本语法与数据类型详解、运算符与流程控制、数组与字符串操作、面向对象编程核心和异常处理机制等内容。
author: zhycn
---

# Java 基础语法详解

本文是一篇关于 Java 基础语法的详细教程。

- **Java 概述与开发环境配置**：介绍 Java 语言的特点、JDK 安装和第一个 Java 程序。
- **基本语法与数据类型详解**：讲解 Java 程序结构、变量、常量和 8 种基本数据类型，包含代码示例。
- **运算符与流程控制**：详细说明 Java 中的算术、关系、逻辑运算符和条件、循环语句，附实际应用场景。
- **数组与字符串操作**：涵盖数组声明初始化、字符串常用方法和不可变性特性，包含性能优化建议。
- **面向对象编程核心**：阐释类与对象、封装继承多态三大特性，提供完整企业级代码示例。
- **异常处理机制**：介绍异常分类、处理语法和最佳实践，包含多个异常处理模式。

## 1. Java 概述与开发环境配置

Java 是一种广泛使用的面向对象编程语言，由 Sun Microsystems（现为 Oracle 子公司）于 1995 年发布。Java 以其 "一次编写，到处运行"（Write Once, Run Anywhere）的跨平台特性而闻名，这得益于 Java 虚拟机（JVM）的架构设计。Java 语言具有简单性、面向对象、分布式、健壮性、安全性、平台无关性、可移植性、高性能、多线程和动态性等特点，广泛应用于企业级应用开发、移动应用开发（Android）、大数据处理（Hadoop）和云计算等领域。

### 1.1 JDK 安装与环境配置

要开始 Java 编程，首先需要安装 Java 开发工具包（JDK）。JDK 包含了 Java 运行时环境（JRE）、编译器（javac）、调试器和其他必要的工具。以下是安装步骤：

1. 从 Oracle 官网或 OpenJDK 项目下载适合您操作系统的 JDK 版本（推荐 JDK 11 或 JDK 17 这些 LTS 版本）
2. 运行安装程序，按照提示完成安装
3. 配置环境变量：
   - **JAVA_HOME**：指向JDK安装目录（如`C:\Program Files\Java\jdk-17`）
   - **PATH**：添加`%JAVA_HOME%\bin`目录

安装完成后，可以通过命令行验证安装是否成功：

```bash
java -version
javac -version
```

### 1.2 第一个 Java 程序

创建一个简单的 Java 程序是学习这门语言的第一步。下面是一个经典的"Hello World"程序：

```java
// 定义类名为HelloWorld
public class HelloWorld {
    // main方法作为程序入口
    public static void main(String[] args) {
        // 输出语句
        System.out.println("Hello, World!");
    }
}
```

**代码说明**：

- `public class HelloWorld`：定义一个公共类，类名必须与文件名一致（HelloWorld.java）
- `public static void main(String[] args)`：程序的主入口方法
- `System.out.println()`：用于向控制台输出信息的方法

要编译和运行这个程序：

```bash
javac HelloWorld.java  # 编译Java源文件，生成HelloWorld.class字节码文件
java HelloWorld        # 运行程序，输出结果
```

## 2. 基本语法与数据类型

### 2.1 Java 程序结构

一个基本的 Java 程序通常包含以下元素：

- **包声明**（package declaration）：用于组织类和避免命名冲突
- **导入语句**（import statements）：引入其他包中的类
- **类定义**（class definition）：Java 程序的基本组成单元
- **主方法**（main method）：程序的入口点
- **语句**（statements）：执行具体操作的代码

```java
package com.example.basic; // 包声明

import java.util.Scanner;  // 导入语句

public class Example {     // 类定义
    public static void main(String[] args) { // 主方法
        Scanner scanner = new Scanner(System.in); // 语句
        System.out.println("请输入您的姓名：");
        String name = scanner.next();
        System.out.println("您好，" + name + "!");
    }
}
```

### 2.2 变量与常量

**变量**是存储数据的基本单元，在 Java 中使用前必须先声明。**常量**是一次赋值后不能再修改的变量，使用`final`关键字声明。

```java
public class VariablesDemo {
    public static void main(String[] args) {
        // 变量声明与初始化
        int age = 25;
        double salary = 5000.5;
        char grade = 'A';
        boolean isJavaFun = true;

        // 常量声明
        final double PI = 3.14159;
        final int DAYS_IN_WEEK = 7;

        // 变量值可以修改
        age = 26;
        salary = 5500.75;

        // 常量值不能修改，否则会编译错误
        // PI = 3.14; // 错误：无法为最终变量PI分配值
    }
}
```

### 2.3 基本数据类型

Java 是强类型语言，提供了8种基本数据类型：

| 数据类型 | 大小/范围              | 默认值   | 示例                   |
| -------- | ---------------------- | -------- | ---------------------- |
| byte     | 8位，-128 ~ 127        | 0        | `byte b = 100;`        |
| short    | 16位，-32,768 ~ 32,767 | 0        | `short s = 10000;`     |
| int      | 32位，约±21亿          | 0        | `int i = 100000;`      |
| long     | 64位，极大范围         | 0L       | `long l = 100000L;`    |
| float    | 32位单精度浮点数       | 0.0f     | `float f = 10.99f;`    |
| double   | 64位双精度浮点数       | 0.0d     | `double d = 99.99;`    |
| char     | 16位Unicode字符        | '\u0000' | `char c = 'A';`        |
| boolean  | true/false             | false    | `boolean flag = true;` |

```java
public class DataTypesDemo {
    public static void main(String[] args) {
        // 整数类型
        byte myByte = 100;           // 8位
        short myShort = 30000;       // 16位
        int myInt = 100000;          // 32位
        long myLong = 10000000000L;  // 64位，需要L后缀

        // 浮点类型
        float myFloat = 10.99f;     // 32位，需要f后缀
        double myDouble = 99.99;     // 64位

        // 字符类型
        char myChar = 'A';           // 16位Unicode字符

        // 布尔类型
        boolean myBoolean = true;    // true或false

        System.out.println("字节值: " + myByte);
        System.out.println("整数值: " + myInt);
        System.out.println("浮点值: " + myFloat);
        System.out.println("字符值: " + myChar);
        System.out.println("布尔值: " + myBoolean);
    }
}
```

### 2.4 引用数据类型

除了基本数据类型，Java 还有**引用数据类型**，包括类、接口、数组和枚举等。引用类型的变量存储的是对象的引用（内存地址），而不是实际的值。

```java
public class ReferenceTypesDemo {
    public static void main(String[] args) {
        // 字符串是引用类型
        String name = "Java Programming";

        // 数组是引用类型
        int[] numbers = {1, 2, 3, 4, 5};

        // 自定义类也是引用类型
        Person person = new Person("Alice", 25);

        System.out.println("字符串: " + name);
        System.out.println("数组长度: " + numbers.length);
        System.out.println("人员信息: " + person.getName() + ", " + person.getAge());
    }
}

// 自定义Person类
class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
}
```

## 3. 运算符与流程控制

### 3.1 运算符类型

Java 提供了丰富的运算符来操作变量和值。

#### 3.1.1 算术运算符

```java
public class ArithmeticOperators {
    public static void main(String[] args) {
        int a = 10;
        int b = 3;

        System.out.println("a + b = " + (a + b));   // 加法：13
        System.out.println("a - b = " + (a - b));   // 减法：7
        System.out.println("a * b = " + (a * b));   // 乘法：30
        System.out.println("a / b = " + (a / b));   // 除法：3
        System.out.println("a % b = " + (a % b));   // 取模：1

        // 自增自减运算符
        int c = 5;
        System.out.println("c++ = " + c++); // 先使用后增加：5
        System.out.println("++c = " + ++c); // 先增加后使用：7
    }
}
```

#### 3.1.2 关系运算符

关系运算符用于比较两个值，返回布尔结果（true 或 false）。

```java
public class RelationalOperators {
    public static void main(String[] args) {
        int x = 10;
        int y = 5;
        int z = 10;

        System.out.println("x == y: " + (x == y)); // 等于：false
        System.out.println("x != y: " + (x != y)); // 不等于：true
        System.out.println("x > y: " + (x > y));   // 大于：true
        System.out.println("x < y: " + (x < y));   // 小于：false
        System.out.println("x >= z: " + (x >= z)); // 大于等于：true
        System.out.println("x <= z: " + (x <= z)); // 小于等于：true
    }
}
```

#### 3.1.3 逻辑运算符

逻辑运算符用于组合多个条件表达式。

```java
public class LogicalOperators {
    public static void main(String[] args) {
        boolean a = true;
        boolean b = false;

        System.out.println("a && b: " + (a && b)); // 逻辑与：false
        System.out.println("a || b: " + (a || b)); // 逻辑或：true
        System.out.println("!a: " + (!a));         // 逻辑非：false

        // 短路演示
        int x = 5;
        int y = 10;

        // 由于第一个条件为false，第二个条件不会执行（短路）
        boolean result = (x > y) && (++y > x);
        System.out.println("短路与结果: " + result + ", y = " + y);

        // 由于第一个条件为true，第二个条件不会执行（短路）
        result = (x < y) || (++y > x);
        System.out.println("短路或结果: " + result + ", y = " + y);
    }
}
```

#### 3.1.4 赋值运算符

```java
public class AssignmentOperators {
    public static void main(String[] args) {
        int a = 10;
        a += 5; // 等价于 a = a + 5
        System.out.println("a += 5: " + a); // 15

        a -= 3; // 等价于 a = a - 3
        System.out.println("a -= 3: " + a); // 12

        a *= 2; // 等价于 a = a * 2
        System.out.println("a *= 2: " + a); // 24

        a /= 4; // 等价于 a = a / 4
        System.out.println("a /= 4: " + a); // 6

        a %= 4; // 等价于 a = a % 4
        System.out.println("a %= 4: " + a); // 2
    }
}
```

### 3.2 条件语句

条件语句允许程序根据不同的条件执行不同的代码块。

#### 3.2.1 if-else 语句

```java
public class IfElseDemo {
    public static void main(String[] args) {
        int score = 85;

        if (score >= 90) {
            System.out.println("成绩优秀");
        } else if (score >= 80) {
            System.out.println("成绩良好");
        } else if (score >= 70) {
            System.out.println("成绩中等");
        } else if (score >= 60) {
            System.out.println("成绩及格");
        } else {
            System.out.println("成绩不及格");
        }

        // 嵌套if语句
        int age = 25;
        boolean isMember = true;

        if (age >= 18) {
            if (isMember) {
                System.out.println("成年会员，享受折扣");
            } else {
                System.out.println("成年非会员，正常收费");
            }
        } else {
            System.out.println("未成年人，享受优惠");
        }
    }
}
```

#### 3.2.2 switch 语句

switch 语句用于根据一个变量的不同值来执行不同的代码块。

```java
public class SwitchDemo {
    public static void main(String[] args) {
        int day = 3;
        String dayName;

        switch (day) {
            case 1:
                dayName = "星期一";
                break;
            case 2:
                dayName = "星期二";
                break;
            case 3:
                dayName = "星期三";
                break;
            case 4:
                dayName = "星期四";
                break;
            case 5:
                dayName = "星期五";
                break;
            case 6:
                dayName = "星期六";
                break;
            case 7:
                dayName = "星期日";
                break;
            default:
                dayName = "无效日期";
        }

        System.out.println("今天是: " + dayName);

        // Java 12+ 增强的switch表达式
        int month = 2;
        int days = switch (month) {
            case 1, 3, 5, 7, 8, 10, 12 -> 31;
            case 4, 6, 9, 11 -> 30;
            case 2 -> {
                // 假设今年不是闰年
                yield 28;
            }
            default -> 0;
        };

        System.out.println(month + "月有 " + days + " 天");
    }
}
```

### 3.3 循环结构

循环语句允许程序重复执行某段代码，直到满足特定条件为止。

#### 3.3.1 for 循环

```java
public class ForLoopDemo {
    public static void main(String[] args) {
        // 基本for循环
        for (int i = 0; i < 5; i++) {
            System.out.println("循环次数: " + i);
        }

        // 嵌套for循环：打印乘法表
        System.out.println("乘法表:");
        for (int i = 1; i <= 9; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print(j + "×" + i + "=" + (i * j) + "\t");
            }
            System.out.println();
        }

        // for-each循环（增强for循环）
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.println("数组元素:");
        for (int num : numbers) {
            System.out.print(num + " ");
        }
    }
}
```

#### 3.3.2 while 循环

```java
public class WhileLoopDemo {
    public static void main(String[] args) {
        // while循环
        int count = 0;
        while (count < 5) {
            System.out.println("while循环次数: " + count);
            count++;
        }

        // do-while循环：至少执行一次
        int num = 5;
        do {
            System.out.println("do-while循环次数: " + num);
            num++;
        } while (num < 5);

        // 使用break和continue控制循环
        System.out.println("break和continue示例:");
        for (int i = 0; i < 10; i++) {
            if (i == 3) {
                continue; // 跳过本次循环的剩余代码
            }
            if (i == 7) {
                break;    // 终止整个循环
            }
            System.out.print(i + " ");
        }
    }
}
```

## 4. 数组与字符串操作

### 4.1 数组的定义与使用

数组是存储相同类型数据的容器，其大小在声明时确定，且不可改变。

```java
public class ArrayDemo {
    public static void main(String[] args) {
        // 数组声明与初始化
        int[] numbers = new int[5]; // 声明长度为5的整型数组，默认值0
        String[] names = {"Alice", "Bob", "Charlie"}; // 直接初始化

        // 访问和修改数组元素
        numbers[0] = 10;
        numbers[1] = 20;
        numbers[2] = 30;
        numbers[3] = 40;
        numbers[4] = 50;

        // 遍历数组
        System.out.println("数组元素:");
        for (int i = 0; i < numbers.length; i++) {
            System.out.println("numbers[" + i + "] = " + numbers[i]);
        }

        // 使用增强for循环遍历
        System.out.println("姓名列表:");
        for (String name : names) {
            System.out.println(name);
        }

        // 多维数组
        int[][] matrix = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };

        System.out.println("二维数组:");
        for (int i = 0; i < matrix.length; i++) {
            for (int j = 0; j < matrix[i].length; j++) {
                System.out.print(matrix[i][j] + " ");
            }
            System.out.println();
        }
    }
}
```

### 4.2 字符串操作

字符串在 Java 中是不可变的对象，Java 提供了丰富的字符串操作方法。

```java
public class StringDemo {
    public static void main(String[] args) {
        // 字符串创建
        String str1 = "Hello, Java!";
        String str2 = new String("Hello, World!");

        // 字符串基本操作
        System.out.println("字符串长度: " + str1.length());
        System.out.println("转换为大写: " + str1.toUpperCase());
        System.out.println("转换为小写: " + str1.toLowerCase());
        System.out.println("是否包含Java: " + str1.contains("Java"));

        // 字符串比较
        String s1 = "Java";
        String s2 = "Java";
        String s3 = new String("Java");

        System.out.println("s1 == s2: " + (s1 == s2));           // true (字符串常量池)
        System.out.println("s1 == s3: " + (s1 == s3));           // false (不同对象)
        System.out.println("s1.equals(s3): " + s1.equals(s3)); // true (内容相同)

        // 字符串提取和分割
        String text = "Java is a programming language";
        System.out.println("子字符串: " + text.substring(5, 7)); // "is"

        String[] words = text.split(" ");
        System.out.println("分割后的单词:");
        for (String word : words) {
            System.out.println(word);
        }

        // 字符串连接
        String lang = "Java";
        String version = "17";
        String message = lang + " " + version; // 使用+运算符
        System.out.println(message);

        // 使用StringBuilder提高字符串连接性能
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(i).append(" ");
        }
        System.out.println("StringBuilder结果: " + sb.toString());

        // 字符串格式化
        String name = "Alice";
        int age = 25;
        double score = 95.5;
        String info = String.format("姓名: %s, 年龄: %d, 分数: %.2f", name, age, score);
        System.out.println(info);
    }
}
```

## 5. 方法与函数

方法是执行特定任务的代码块，可以接受参数并返回结果。

### 5.1 方法的定义与调用

```java
public class MethodDemo {
    public static void main(String[] args) {
        // 调用静态方法
        int sum = add(5, 3);
        System.out.println("5 + 3 = " + sum);

        // 调用实例方法
        MethodDemo demo = new MethodDemo();
        String reversed = demo.reverseString("Java");
        System.out.println("反转后的字符串: " + reversed);

        // 方法重载示例
        System.out.println("两个整数之和: " + add(10, 20));
        System.out.println("三个整数之和: " + add(10, 20, 30));
        System.out.println("两个浮点数之和: " + add(10.5, 20.7));
    }

    // 静态方法：计算两数之和
    public static int add(int a, int b) {
        return a + b;
    }

    // 方法重载：三个整数相加
    public static int add(int a, int b, int c) {
        return a + b + c;
    }

    // 方法重载：两个浮点数相加
    public static double add(double a, double b) {
        return a + b;
    }

    // 实例方法：反转字符串
    public String reverseString(String input) {
        StringBuilder sb = new StringBuilder(input);
        return sb.reverse().toString();
    }
}
```

### 5.2 参数传递机制

Java 中的参数传递是**值传递**，即将参数的副本传递给方法。

```java
public class ParameterPassing {
    public static void main(String[] args) {
        // 基本数据类型的参数传递
        int num = 50;
        changePrimitiveValue(num);
        System.out.println("基本数据类型修改后: " + num); // 输出: 50

        // 引用数据类型的参数传递
        int[] numbers = {1, 2, 3};
        changeReferenceValue(numbers);
        System.out.println("引用数据类型修改后: " + numbers[0]); // 输出: 100

        // 字符串参数传递（字符串是不可变对象）
        String str = "原始字符串";
        changeString(str);
        System.out.println("字符串修改后: " + str); // 输出: 原始字符串
    }

    public static void changePrimitiveValue(int x) {
        x = 100; // 只修改副本，不影响原始值
    }

    public static void changeReferenceValue(int[] arr) {
        arr[0] = 100; // 修改引用指向的对象内容
    }

    public static void changeString(String s) {
        s = "新字符串"; // 字符串是不可变的，创建了新对象
    }
}
```

### 5.3 递归方法

递归是方法调用自身的一种编程技巧。

```java
public class RecursionDemo {
    public static void main(String[] args) {
        // 计算阶乘
        int n = 5;
        System.out.println(n + "! = " + factorial(n));

        // 斐波那契数列
        int fibN = 10;
        System.out.println("斐波那契数列第" + fibN + "项: " + fibonacci(fibN));

        // 递归遍历目录结构（伪代码）
        System.out.println("递归遍历目录示例:");
        // listFiles(new File("."), 0);
    }

    // 计算阶乘的递归方法
    public static int factorial(int n) {
        if (n == 0 || n == 1) {
            return 1; // 基线条件
        } else {
            return n * factorial(n - 1); // 递归条件
        }
    }

    // 计算斐波那契数列的递归方法
    public static int fibonacci(int n) {
        if (n <= 1) {
            return n; // 基线条件
        } else {
            return fibonacci(n - 1) + fibonacci(n - 2); // 递归条件
        }
    }

    // 递归遍历目录（示例方法）
    /*
    public static void listFiles(File dir, int level) {
        if (dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File file : files) {
                    for (int i = 0; i < level; i++) {
                        System.out.print("  ");
                    }
                    System.out.println(file.getName());
                    if (file.isDirectory()) {
                        listFiles(file, level + 1);
                    }
                }
            }
        }
    }
    */
}
```

## 6. 面向对象编程基础

面向对象编程（OOP）是 Java 的核心特性，它将数据和方法封装成对象，并通过继承、多态、封装来组织代码。

### 6.1 类与对象

**类**是创建对象的模板，**对象**是类的实例。

```java
// 定义一个Person类
public class Person {
    // 属性（字段）
    private String name;
    private int age;

    // 构造方法
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 方法
    public void sayHello() {
        System.out.println("Hello, my name is " + name + " and I am " + age + " years old.");
    }

    // Getter和Setter方法
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        if (age >= 0) { // 简单的数据验证
            this.age = age;
        }
    }
}

// 使用Person类
public class OOPDemo {
    public static void main(String[] args) {
        // 创建Person对象
        Person person1 = new Person("Alice", 25);
        Person person2 = new Person("Bob", 30);

        // 调用对象方法
        person1.sayHello();
        person2.sayHello();

        // 使用Getter和Setter
        person1.setAge(26);
        System.out.println(person1.getName() + " is now " + person1.getAge() + " years old.");
    }
}
```

### 6.2 封装、继承与多态

#### 6.2.1 封装

封装是通过将数据和行为组合在一个单元中，并控制对数据的访问来实现的。

```java
public class BankAccount {
    // 私有字段，只能通过公共方法访问
    private String accountNumber;
    private double balance;

    public BankAccount(String accountNumber, double initialBalance) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
    }

    // 存款方法
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            System.out.println("存款成功，当前余额: " + balance);
        } else {
            System.out.println("存款金额必须大于0");
        }
    }

    // 取款方法
    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            System.out.println("取款成功，当前余额: " + balance);
        } else {
            System.out.println("取款失败，余额不足或金额无效");
        }
    }

    // 获取余额
    public double getBalance() {
        return balance;
    }

    // 获取账户号码
    public String getAccountNumber() {
        return accountNumber;
    }
}
```

#### 6.2.2 继承

继承允许一个类继承另一个类的属性和方法。

```java
// 父类：动物
class Animal {
    private String name;
    private int age;

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void eat() {
        System.out.println(name + " is eating.");
    }

    public void sleep() {
        System.out.println(name + " is sleeping.");
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }
}

// 子类：狗，继承自动物
class Dog extends Animal {
    private String breed;

    public Dog(String name, int age, String breed) {
        super(name, age); // 调用父类构造方法
        this.breed = breed;
    }

    // 重写父类方法
    @Override
    public void eat() {
        System.out.println(getName() + " the " + breed + " is eating bones.");
    }

    // 子类特有方法
    public void bark() {
        System.out.println(getName() + " is barking: Woof! Woof!");
    }

    public String getBreed() {
        return breed;
    }
}

// 使用继承示例
public class InheritanceDemo {
    public static void main(String[] args) {
        Animal genericAnimal = new Animal("Generic Animal", 2);
        genericAnimal.eat(); // Generic Animal is eating.

        Dog myDog = new Dog("Buddy", 3, "Golden Retriever");
        myDog.eat();    // Buddy the Golden Retriever is eating bones.
        myDog.bark();   // Buddy is barking: Woof! Woof!
        myDog.sleep();  // Buddy is sleeping. (继承自父类)
    }
}
```

#### 6.2.3 多态

多态允许使用父类引用指向子类对象，并根据实际对象类型调用相应的方法。

```java
// 多态示例
public class PolymorphismDemo {
    public static void main(String[] args) {
        // 多态：父类引用指向子类对象
        Animal animal1 = new Dog("Max", 2, "Labrador");
        Animal animal2 = new Cat("Whiskers", 1, "Gray");

        // 编译时类型是Animal，运行时类型是Dog/Cat
        animal1.eat(); // Max the Labrador is eating bones.
        animal2.eat(); // Whiskers the Gray cat is eating fish.

        // 无法调用子类特有方法
        // animal1.bark(); // 编译错误

        // 如果需要调用子类特有方法，需要向下转型
        if (animal1 instanceof Dog) {
            Dog dog = (Dog) animal1;
            dog.bark(); // Max is barking: Woof! Woof!
        }
    }
}

// 另一个子类：猫
class Cat extends Animal {
    private String color;

    public Cat(String name, int age, String color) {
        super(name, age);
        this.color = color;
    }

    @Override
    public void eat() {
        System.out.println(getName() + " the " + color + " cat is eating fish.");
    }

    // 子类特有方法
    public void meow() {
        System.out.println(getName() + " is meowing: Meow! Meow!");
    }

    public String getColor() {
        return color;
    }
}
```

### 6.3 抽象类与接口

#### 6.3.1 抽象类

抽象类是不能被实例化的类，用于被子类继承。

```java
// 抽象类
abstract class Shape {
    private String color;

    public Shape(String color) {
        this.color = color;
    }

    // 抽象方法（没有实现）
    public abstract double getArea();

    // 具体方法
    public String getColor() {
        return color;
    }

    // 具体方法
    public void setColor(String color) {
        this.color = color;
    }
}

// 具体子类：圆形
class Circle extends Shape {
    private double radius;

    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override
    public double getArea() {
        return Math.PI * radius * radius;
    }

    public double getRadius() {
        return radius;
    }
}

// 具体子类：矩形
class Rectangle extends Shape {
    private double width;
    private double height;

    public Rectangle(String color, double width, double height) {
        super(color);
        this.width = width;
        this.height = height;
    }

    @Override
    public double getArea() {
        return width * height;
    }

    public double getWidth() {
        return width;
    }

    public double getHeight() {
        return height;
    }
}

// 使用抽象类示例
public class AbstractClassDemo {
    public static void main(String[] args) {
        Shape circle = new Circle("Red", 5.0);
        Shape rectangle = new Rectangle("Blue", 4.0, 6.0);

        System.out.println("圆形面积: " + circle.getArea() + ", 颜色: " + circle.getColor());
        System.out.println("矩形面积: " + rectangle.getArea() + ", 颜色: " + rectangle.getColor());

        // 不能创建抽象类的实例
        // Shape shape = new Shape("Green"); // 编译错误
    }
}
```

#### 6.3.2 接口

接口定义了一组方法规范，类可以实现一个或多个接口。

```java
// 接口定义
interface Drawable {
    void draw(); // 抽象方法（默认public）

    // 默认方法（Java 8+）
    default void printInfo() {
        System.out.println("这是一个可绘制对象");
    }

    // 静态方法（Java 8+）
    static void describe() {
        System.out.println("Drawable接口定义了绘制相关的方法");
    }
}

// 另一个接口
interface Resizable {
    void resize(double factor);
}

// 类实现接口
class CustomShape implements Drawable, Resizable {
    private String name;
    private double size;

    public CustomShape(String name, double size) {
        this.name = name;
        this.size = size;
    }

    @Override
    public void draw() {
        System.out.println("绘制" + name + "，大小: " + size);
    }

    @Override
    public void resize(double factor) {
        if (factor > 0) {
            size *= factor;
            System.out.println(name + "大小调整为: " + size);
        }
    }

    @Override
    public void printInfo() {
        System.out.println("这是一个自定义形状: " + name);
    }
}

// 使用接口示例
public class InterfaceDemo {
    public static void main(String[] args) {
        CustomShape shape = new CustomShape("我的形状", 10.0);
        shape.draw();
        shape.resize(1.5);
        shape.printInfo();

        // 调用接口的静态方法
        Drawable.describe();

        // 多态：接口引用指向实现类对象
        Drawable drawable = new CustomShape("另一个形状", 5.0);
        drawable.draw();
        drawable.printInfo();
    }
}
```

## 7. 异常处理

异常处理是 Java 程序中处理运行时错误的一种机制。

### 7.1 异常类型与处理机制

Java 异常分为**检查异常**（Checked Exceptions）和**非检查异常**（Unchecked Exceptions）。

```java
public class ExceptionDemo {
    public static void main(String[] args) {
        // 非检查异常（运行时异常）示例
        try {
            int[] numbers = {1, 2, 3};
            System.out.println(numbers[5]); // ArrayIndexOutOfBoundsException
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("数组越界异常: " + e.getMessage());
        }

        // 检查异常示例
        try {
            // 这个代码可能会抛出FileNotFoundException
            // FileInputStream file = new FileInputStream("nonexistent.txt");
        } catch (Exception e) {
            System.out.println("文件操作异常: " + e.getMessage());
        }

        // 多异常捕获（Java 7+）
        try {
            int result = 10 / 0; // ArithmeticException
            String str = null;
            System.out.println(str.length()); // NullPointerException
        } catch (ArithmeticException | NullPointerException e) {
            System.out.println("发生算术或空指针异常: " + e.getClass().getSimpleName());
        } catch (Exception e) {
            System.out.println("其他异常: " + e.getMessage());
        } finally {
            System.out.println("finally块总是执行");
        }

        // 自定义异常
        try {
            validateAge(15);
        } catch (InvalidAgeException e) {
            System.out.println("自定义异常捕获: " + e.getMessage());
        }
    }

    // 自定义异常示例
    public static void validateAge(int age) throws InvalidAgeException {
        if (age < 18) {
            throw new InvalidAgeException("年龄必须大于等于18岁");
        }
        System.out.println("年龄验证通过");
    }
}

// 自定义异常类
class InvalidAgeException extends Exception {
    public InvalidAgeException(String message) {
        super(message);
    }
}
```

### 7.2 异常处理最佳实践

```java
public class ExceptionBestPractices {
    public static void main(String[] args) {
        // 1. 优先使用最具体的异常类型
        try {
            int[] arr = new int[5];
            arr[10] = 50; // 会抛出ArrayIndexOutOfBoundsException
        } catch (ArrayIndexOutOfBoundsException e) {
            System.err.println("数组越界: " + e.getMessage());
        } catch (RuntimeException e) {
            System.err.println("运行时异常: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("一般异常: " + e.getMessage());
        }

        // 2. 不要忽略异常
        try {
            int result = 10 / 0;
        } catch (ArithmeticException e) {
            // 不好的做法：空catch块，完全忽略异常
            // 好的做法：至少记录异常信息
            System.err.println("除零错误: " + e.getMessage());
            // 或者根据情况重新抛出异常
            // throw new RuntimeException("处理失败", e);
        }

        // 3. 使用try-with-resources（Java 7+）
        // 自动关闭资源，无需finally块
        try (FileInputStream input = new FileInputStream("file.txt");
             BufferedReader reader = new BufferedReader(new InputStreamReader(input))) {
            String line = reader.readLine();
            System.out.println(line);
        } catch (IOException e) {
            System.err.println("文件读取错误: " + e.getMessage());
        }

        // 4. 提供有意义的异常信息
        try {
            processUserInput("");
        } catch (IllegalArgumentException e) {
            System.err.println("输入处理失败: " + e.getMessage());
        }
    }

    public static void processUserInput(String input) {
        if (input == null || input.trim().isEmpty()) {
            throw new IllegalArgumentException("输入不能为空或null");
        }
        // 处理输入...
    }
}
```

## 8. 总结

本文详细介绍了 Java 基础语法的核心概念，包括数据类型、运算符、流程控制、数组与字符串、方法与函数、面向对象编程和异常处理。这些基础知识是学习Java编程的基石，掌握它们对于进一步学习 Java 高级特性和框架开发至关重要。

Java 作为一门强大且广泛应用的编程语言，其严谨的语法规范和面向对象的特性使得它非常适合开发大型、复杂的应用程序。通过学习本文的内容，您应该已经建立了坚实的 Java 基础，能够编写基本的 Java 程序并理解面向对象的核心概念。

为了进一步提高 Java 编程技能，建议：

1. 多动手实践，编写各种类型的 Java 程序
2. 学习 Java 标准库的常用类和方法
3. 掌握 Java 集合框架的使用
4. 理解 Jav 的并发编程模型
5. 熟悉常用的 Java 开发工具和框架

Java 的世界广阔而深邃，持续学习和实践是掌握这门语言的关键。祝您在 Java 编程之旅中取得成功！
