---
title: Java 密封类 (Sealed Class) 详解与最佳实践
description: 密封类是 Java 17 引入的一种新的类类型，用于表示不可变的数据传输对象（DTO）或值对象。它自动提供了构造器、getter 方法、equals、hashCode 和 toString 方法，大大简化了数据类的编写。
---

# Java 密封类 (Sealed Class) 详解与最佳实践

## 1. 密封类概述

Java 17 作为长期支持版本 (LTS)，引入了**密封类 (Sealed Classes)** 这一重要语言特性。密封类通过精确控制类或接口的继承关系来增强类型安全性，它允许类或接口明确声明哪些其他类或接口可以继承或实现它 。

### 1.1 设计动机与演进

在传统 Java 继承模型中，类要么是完全可扩展的 (`public`)，要么是完全封闭的 (`final`)。这种二元选择在很多场景下显得过于局限。密封类填补了这一空白，提供了**选择性开放**的中间道路，代表了 Java 类型系统向更精确的方向发展 。

### 1.2 核心特点

- **精确控制继承层次**：只有被明确许可的类才能继承密封类 。
- **增强类型安全性**：编译器可以验证所有可能的子类型，并在编译时进行严格的继承检查 。
- **与模式匹配完美配合**：为 `switch` 表达式提供穷尽性检查 。
- **与枚举的类比**：密封类可以看作是枚举的泛化形式。枚举固定数量的实例，而密封类固定数量的子类型 。

## 2. 语法详解

### 2.1 基本语法

密封类的基本语法结构如下：

```java
public sealed class Shape permits Circle, Square, Rectangle {
    // 类定义
}
```

**关键语法元素**：

- `sealed` 修饰符：标识该类为密封类
- `permits` 子句：明确列出允许的子类
- **子类限制**：所有子类必须为 `final`、`sealed` 或 `non-sealed`

### 2.2 子类修饰符要求

被许可的子类必须使用以下修饰符之一：

| 修饰符       | 含义说明                                       |
| ------------ | ---------------------------------------------- |
| `final`      | 表示该子类不能再被继承（终结继承链）           |
| `sealed`     | 表示该子类仍可被限定继承，需继续声明 `permits` |
| `non-sealed` | 表示该子类不再限制继承，任何类都可继承它       |

### 2.3 包与模块限制

密封类及其子类需位于**同一包或模块**中。如果将子类移动到不同包，会触发编译错误 。

### 2.4 省略 permits 子句

密封类可以不加 `permits` 子句。在这种情况下，它的所有直接子类都必须在**同一个文件中声明** 。

## 3. 代码示例

### 3.1 基本示例：图形层次结构

```java
// 密封类声明
public sealed class Shape permits Circle, Rectangle, Triangle {
    public abstract double area();
}

// final 子类：圆形
public final class Circle extends Shape {
    private final double radius;

    public Circle(double r) { this.radius = r; }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

// non-sealed 子类：矩形
public non-sealed class Rectangle extends Shape {
    private final double width, height;

    public Rectangle(double w, double h) {
        this.width = w;
        this.height = h;
    }

    @Override
    public double area() {
        return width * height;
    }
}

// sealed 子类：三角形，进一步限制子类
public sealed class Triangle extends Shape permits EquilateralTriangle {
    protected double base, height;

    @Override
    public double area() {
        return 0.5 * base * height;
    }
}

// Triangle 的子类
public final class EquilateralTriangle extends Triangle {
    public EquilateralTriangle(double side) {
        this.base = side;
        this.height = (Math.sqrt(3)/2) * side;
    }
}
```

### 3.2 密封接口示例

```java
// 密封接口声明
public sealed interface Animal permits Dog, Cat {
    void makeSound();
}

// 实现类
public final class Dog implements Animal {
    @Override
    public void makeSound() {
        System.out.println("Woof!");
    }
}

public final class Cat implements Animal {
    @Override
    public void makeSound() {
        System.out.println("Meow!");
    }
}
```

### 3.3 与记录类 (Record) 结合

密封类与 Java 16 引入的记录类是天作之合，非常适合实现代数数据类型 (Algebraic Data Types) ：

```java
// 密封接口定义表达式
public sealed interface Expr permits ConstantExpr, AddExpr, MulExpr {
    double evaluate();
}

// 记录类实现
public record ConstantExpr(double value) implements Expr {
    @Override
    public double evaluate() { return value; }
}

public record AddExpr(Expr left, Expr right) implements Expr {
    @Override
    public double evaluate() { return left.evaluate() + right.evaluate(); }
}

public record MulExpr(Expr left, Expr right) implements Expr {
    @Override
    public double evaluate() { return left.evaluate() * right.evaluate(); }
}
```

## 4. 与模式匹配的协同

密封类与 Java 17 引入的模式匹配特性完美配合，可以实现穷尽性检查：

```java
public double evaluate(Expr expr) {
    return switch (expr) {
        case ConstantExpr(var value) -> value;
        case AddExpr(var left, var right) -> evaluate(left) + evaluate(right);
        case MulExpr(var left, var right) -> evaluate(left) * evaluate(right);
        // 不需要default分支，编译器知道所有可能性
    };
}
```

编译器能够验证是否所有可能的子类型都已覆盖，这大大增强了代码的安全性 。

## 5. 典型应用场景

### 5.1 领域建模

在定义领域模型时，当子类型集合已知且稳定时，密封类是最佳选择：

```java
public sealed interface PaymentMethod permits CreditCard, PayPal, BankTransfer {
    // 接口定义
    boolean processPayment(double amount);
}
```

### 5.2 安全 API 设计

库开发者可以公开接口同时控制所有实现：

```java
public sealed interface Cache permits LocalCache, DistributedCache {
    // 接口定义
    Object get(String key);
    void put(String key, Object value);
}
```

### 5.3 状态机实现

密封类非常适合表示有限状态机的状态：

```java
public sealed class State permits StartState, RunningState, StopState {
    public abstract void handle();
}

public final class StartState extends State {
    @Override
    public void handle() { System.out.println("Starting..."); }
}

public final class RunningState extends State {
    @Override
    public void handle() { System.out.println("Running..."); }
}

public final class StopState extends State {
    @Override
    public void handle() { System.out.println("Stopping..."); }
}
```

### 5.4 替代枚举的扩展性需求

当需要子类有不同状态或行为时（枚举的常量是单例且无状态），密封类比枚举更灵活：

```java
public sealed class FileType permits TextFile, ImageFile, VideoFile {}

public final class TextFile extends FileType {
    private String encoding; // 文本文件特有字段
    // 文本文件特有方法
}

public final class ImageFile extends FileType {
    private int width, height; // 图片文件特有字段
    // 图片文件特有方法
}

public final class VideoFile extends FileType {
    private String codec; // 视频文件特有字段
    // 视频文件特有方法
}
```

## 6. 密封类与传统继承对比

### 6.1 继承控制能力对比

| 特性         | 普通类 | final 类 | 密封类 | 说明                         |
| ------------ | ------ | -------- | ------ | ---------------------------- |
| 完全开放继承 | ✓      | ✗        | ✗      | 任何类都可继承               |
| 完全禁止继承 | ✗      | ✓        | ✗      | 不能有任何子类               |
| 精确控制继承 | ✗      | ✗        | ✓      | 只允许指定类继承             |
| 部分开放继承 | ✗      | ✗        | ✓      | 通过 non-sealed 允许部分开放 |

### 6.2 密封类与枚举类对比

| 特性       | 密封类                                | 枚举类                 |
| ---------- | ------------------------------------- | ---------------------- |
| 实例数量   | 子类可以创建多个实例                  | 每个枚举常量是单例     |
| 状态和行为 | 子类可以有不同属性和方法              | 常量共享相同属性和方法 |
| 类型扩展   | 允许有限的子类扩展                    | 完全闭合，无法扩展     |
| 适用场景   | 需要有限子类且每个子类有独立状态/逻辑 | 固定常量集合，行为一致 |

## 7. 最佳实践

### 7.1 适用场景

- **子类型集合稳定且有限**：当您有一组已知且不太可能改变的亚型时
- **需要编译器验证穷尽性**：当您希望编译器能够检查所有可能的子类型时
- **API 设计需要控制实现**：当您是库开发者并希望公开接口同时控制所有实现时
- **领域建模需要精确性**：在定义领域模型时，当子类型集合已知且稳定时

### 7.2 不适用场景

- **需要第三方扩展的类型**：如果希望允许第三方代码扩展您的类型层次结构
- **子类型集合可能变化的场景**：如果亚型集合预计会频繁变化或扩展

### 7.3 设计建议

1. **封装框架内核模块**：对框架核心类使用密封类，限制扩展边界
2. **团队协作审核机制**：密封类可用于团队内代码隔离管理，防止越权继承
3. **配合模式匹配提高可读性**：穷尽所有可能子类时可用 sealed + switch 提升可维护性
4. **与记录类结合使用**：对于数据导向的类型，结合密封接口和记录类实现

### 7.4 兼容性与迁移策略

- 将现有 `final` 类改为密封类是**二进制兼容**的
- 添加新的许可子类是二进制兼容但不源码兼容的
- 移除许可子类是不兼容的变更
- 密封类需要 JDK 17 或更高版本支持。在低版本 JVM 中，密封类会被视为普通类，但 `permits` 子句会被忽略，导致潜在的安全风险

## 8. 总结

密封类是 Java 语言演进中的重要里程碑，它 ：

- 提供了更精确的类型系统控制
- 增强了代码的安全性和可维护性
- 为函数式编程风格提供了更好支持
- 使编译器能够进行更深入的静态分析

掌握密封类特性对于现代 Java 开发者至关重要，特别是在设计领域模型和 API 时。合理使用密封类可以显著提高代码质量和开发效率。

随着 Java 的持续更新，密封类将成为现代 Java 开发的重要工具之一。尽管需要 JDK 17 及以上版本支持，但随着 LTS 版本的普及，它将在 Java 生态中发挥越来越重要的作用 。
