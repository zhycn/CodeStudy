---
title: Java BigInteger 与 BigDecimal 详解与最佳实践
description: 详细介绍 Java 中 BigInteger 和 BigDecimal 类的使用，包括内部实现、创建方式、常用运算操作、精度控制、比较方法，以及使用注意事项与最佳实践，同时给出实战应用案例。
author: zhycn
---

# Java BigInteger 与 BigDecimal 详解与最佳实践

## 1 概述

在 Java 编程中，当需要进行大数运算或高精度计算时，基本数据类型（如 `int`, `long`, `double`）可能无法满足需求。Java 提供了两个类来处理这种情况：`BigInteger` 和 `BigDecimal`。

- **BigInteger** 用于表示**不可变的任意精度整数**，适用于超出 `long` 类型限制的整数运算。
- **BigDecimal** 用于表示**不可变的任意精度的有符号十进制数**，适用于需要精确计算的场景（如金融计算），解决了浮点数运算的精度失真问题。

这两个类都位于 `java.math` 包中，并且是**不可变**（immutable）的，即一旦创建，其值不能被更改。任何运算都会返回一个新的对象。

## 2 BigInteger 详解

### 2.1 内部实现

`BigInteger` 内部使用两个主要属性来表示大整数：

- **`int signum`**：表示符号，取值为 -1（负数）、0（零）或 1（正数）。
- **`int[] mag`**：表示数值的大小（magnitude），使用**大端表示法**（big-endian）存储二进制补码形式，且最高有效整数非零。

这种表示方式允许 `BigInteger` 超越基本数据类型的内存限制，处理任意大小的整数。

### 2.2 创建 BigInteger 对象

有多种方式可以创建 `BigInteger` 对象：

```java
import java.math.BigInteger;

// 1. 使用字符串构造（推荐用于精确表示大数）
BigInteger bigIntFromString = new BigInteger("123456789012345678901234567890");

// 2. 使用字节数组构造（适用于二进制数据）
byte[] bytes = {0x1F, 0x2E, 0x3D, 0x4C};
BigInteger bigIntFromBytes = new BigInteger(bytes);

// 3. 使用静态方法 valueOf（适用于 long 类型范围内的整数）
BigInteger bigIntFromLong = BigInteger.valueOf(9223372036854775807L);

// 4. 使用随机生成（适用于密码学）
Random random = new Random();
BigInteger bigIntRandom = new BigInteger(128, random); // 生成 128 位的随机大整数
```

**注意**：使用字符串构造时，需确保字符串格式正确，否则会抛出 `NumberFormatException`。

### 2.3 常用运算操作

`BigInteger` 提供了丰富的数学运算方法：

```java
BigInteger a = new BigInteger("100");
BigInteger b = new BigInteger("50");

// 加法
BigInteger sum = a.add(b); // 150

// 减法
BigInteger difference = a.subtract(b); // 50

// 乘法
BigInteger product = a.multiply(b); // 5000

// 除法
BigInteger quotient = a.divide(b); // 2

// 取模
BigInteger remainder = a.mod(b); // 0

// 模幂运算
BigInteger power = a.modPow(new BigInteger("2"), new BigInteger("13")); // 100^2 mod 13

// 最大公约数
BigInteger gcd = a.gcd(b); // 50

// 绝对值
BigInteger abs = a.abs();

// 取反
BigInteger negate = a.negate();
```

### 2.4 类型转换

将 `BigInteger` 转换为基本数据类型时，需要注意范围限制：

```java
BigInteger bigValue = new BigInteger("12345678901234567890");

// 转换为 long，可能丢失精度
long longValue = bigValue.longValue();

// 使用精确转换方法（如果超出范围会抛出 ArithmeticException）
try {
    long exactLongValue = bigValue.longValueExact();
} catch (ArithmeticException e) {
    System.out.println("Value exceeds long range");
}

// 转换为 int
int intValue = bigValue.intValue();

// 精确转换为 int
try {
    int exactIntValue = bigValue.intValueExact();
} catch (ArithmeticException e) {
    System.out.println("Value exceeds int range");
}

// 转换为字符串
String stringValue = bigValue.toString();
```

### 2.5 使用注意事项与最佳实践

1. **初始化选择**：根据数据来源选择合适的构造函数。字符串构造可读性好，字节数组适合二进制数据。
2. **性能考虑**：`BigInteger` 的运算比基本数据类型慢，应优化算法逻辑，例如使用位运算替代乘除法。
3. **比较操作**：使用 `compareTo()` 方法比较值，而非 `==` 或 `!=`（它们比较的是引用）。

    ```java
    if (bigInt1.compareTo(bigInt2) == 0) {
        // 值相等
    }
    ```

4. **异常处理**：某些运算（如除以零）会抛出 `ArithmeticException`，需妥善处理。
5. **不可变性**：`BigInteger` 对象是不可变的，任何操作都会返回新对象。 重复创建大对象可能影响性能，应考虑重用。
6. **多线程安全**：由于其不可变性，`BigInteger` 是线程安全的。

## 3 BigDecimal 详解

### 3.1 为什么需要 BigDecimal

Java 的基本浮点类型 (`float`, `double`) 使用二进制浮点数运算，无法精确表示所有十进制小数（例如 0.1），在进行算术运算时可能会出现精度丢失问题：

```java
System.out.println(0.1 + 0.2); // 输出: 0.30000000000000004
```

`BigDecimal` 通过使用十进制表示和任意精度，提供了精确的数值计算，尤其适用于金融、货币等对精度要求高的场景。

### 3.2 内部实现

`BigDecimal` 的主要属性包括：

- **`BigInteger intVal`**：未缩放的值。
- **`int scale`**：小数点后的位数（精度）。
- **`int precision`**：十进制位数（可选信息）。
- **`long intCompact`**：如果值较小，则紧凑存储的 long 值，避免创建 `BigInteger`。

`BigDecimal` 在计算时，通常会先将数值扩大 10 的 n 次倍，转换为整数进行计算，以保持精度，最后再根据缩放因子（scale）确定最终结果的小数点位置。

### 3.3 创建 BigDecimal 对象

创建 `BigDecimal` 对象的方式有多种，选择合适的方式至关重要：

```java
import java.math.BigDecimal;

// 1. 使用字符串构造（推荐，可精确表示）
BigDecimal bdFromString = new BigDecimal("0.1");

// 2. 使用静态方法 valueOf（推荐，内部会调用字符串构造）
BigDecimal bdFromValueOf = BigDecimal.valueOf(0.1);

// 3. 使用 double 构造（不推荐，可能引入精度损失）
BigDecimal bdFromDouble = new BigDecimal(0.1); // 实际值可能不精确

// 4. 使用 long 构造
BigDecimal bdFromLong = new BigDecimal(123456789L);

// 5. 指定精度和舍入模式（用于除法等运算）
BigDecimal dividend = new BigDecimal("10");
BigDecimal divisor = new BigDecimal("3");
BigDecimal result = dividend.divide(divisor, 4, RoundingMode.HALF_UP); // 3.3333
```

**最佳实践**：**优先使用字符串构造函数或 `BigDecimal.valueOf()` 方法**，以避免从 `double` 转换时引入的精度问题。

### 3.4 常用运算操作

`BigDecimal` 提供了基本的算术运算，但需要注意精度和舍入：

```java
BigDecimal a = new BigDecimal("10.50");
BigDecimal b = new BigDecimal("3.2");

// 加法
BigDecimal sum = a.add(b); // 13.70

// 减法
BigDifference = a.subtract(b); // 7.30

// 乘法
BigDecimal product = a.multiply(b); // 33.600

// 除法 - 必须指定精度和舍入模式，否则可能抛出 ArithmeticException（如果结果是无限小数）
BigDecimal quotient = a.divide(b, 2, RoundingMode.HALF_UP); // 3.28

// 设置精度和舍入模式
BigDecimal scaledValue = a.setScale(1, RoundingMode.HALF_UP); // 10.5

// 比较
int comparison = a.compareTo(b); // 返回 -1 (小于), 0 (等于), 1 (大于)

// 取绝对值
BigDecimal abs = a.abs();

// 取反
BigDecimal negate = a.negate();
```

### 3.5 精度控制与舍入模式

`BigDecimal` 的精度控制通过 `scale` 和 `RoundingMode` 来实现。常用的舍入模式包括：

| 舍入模式            | 描述                                           |
| :------------------ | :--------------------------------------------- |
| `RoundingMode.UP`   | 远离零方向舍入。                               |
| `RoundingMode.DOWN` | 向零方向舍入（截断）。                         |
| `RoundingMode.CEILING` | 向正无穷大方向舍入。                         |
| `RoundingMode.FLOOR`   | 向负无穷大方向舍入。                         |
| `RoundingMode.HALF_UP` | **四舍五入**（最常见的商业舍入方式）。       |
| `RoundingMode.HALF_DOWN` | 五舍六入（如果舍弃部分 > 0.5，则向上舍入）。 |
| `RoundingMode.HALF_EVEN` | 银行家舍入法（向最接近的偶数舍入）。       |

```java
BigDecimal value = new BigDecimal("1.235");

// 四舍五入到两位小数
BigDecimal roundedValue = value.setScale(2, RoundingMode.HALF_UP); // 1.24

// 除法时指定精度和舍入模式
BigDecimal dividend = new BigDecimal("10");
BigDecimal divisor = new BigDecimal("3");
BigDecimal result = dividend.divide(divisor, 4, RoundingMode.HALF_UP); // 3.3333
```

### 3.6 比较与相等性

比较 `BigDecimal` 时，应使用 `compareTo()` 方法，而不是 `equals()` 方法。

- `compareTo()`：**仅比较数值是否相等**（1.0 和 1.00 相等）。
- `equals()`：**同时比较数值和精度（scale）**（1.0 和 1.00 不相等，因为精度不同）。

```java
BigDecimal bd1 = new BigDecimal("1.0");
BigDecimal bd2 = new BigDecimal("1.00");

System.out.println(bd1.compareTo(bd2) == 0); // true (数值相等)
System.out.println(bd1.equals(bd2));         // false (精度不同)
```

### 3.7 使用注意事项与最佳实践

1. **构造选择**：**始终使用字符串构造或 `BigDecimal.valueOf()`** 来创建 `BigDecimal`，避免使用 `double` 构造函数。
2. **除法操作**：除法运算时必须指定精度和舍入模式，否则在遇到无限小数时会抛出 `ArithmeticException`。
3. **精度控制**：在需要精确小数位数的场景（如货币），使用 `setScale()` 方法明确设置精度。
4. **避免尾随零**：使用 `stripTrailingZeros()` 方法去除不必要的尾随零，提高可读性。

    ```java
    BigDecimal value = new BigDecimal("123.45000");
    System.out.println(value.stripTrailingZeros()); // 123.45
    ```

5. **性能考虑**：`BigDecimal` 的运算性能通常低于基本数据类型和 `BigInteger`。 在不需要高精度的场合，应避免使用。
6. **不可变性**：与 `BigInteger` 一样，`BigDecimal` 也是不可变的，操作会返回新对象。

## 4 BigInteger 与 BigDecimal 对比

| 特性         | BigInteger                                  | BigDecimal                                          |
| :----------- | :------------------------------------------ | :-------------------------------------------------- |
| **用途**     | 任意精度整数运算                            | 任意精度十进制小数运算                                |
| **精度**     | 整数                                        | 小数（可指定小数点后的位数）                          |
| **内部存储** | `int signum`, `int[] mag`           | `BigInteger intVal`, `int scale`, `long intCompact` |
| **性能**     | 相对较高（仅处理整数）              | 相对较低（需要处理精度和舍入）              |
| **适用场景** | 密码学、大数分解、超出 long 范围的整数计算     | 金融计算、货币处理、需要精确小数计算的任何场景          |
| **除法行为** | 整除，可获取商和余数                          | 必须指定精度和舍入模式                              |

**选择指南**：

- 如果需要处理**整数**，并且其大小超出了 `long` 类型的范围，请使用 `BigInteger`。
- 如果需要处理**小数**，并且需要**精确计算**（避免浮点数精度误差），请使用 `BigDecimal`。

## 5 实战应用案例

### 5.1 大数阶乘计算（BigInteger）

```java
import java.math.BigInteger;

public class FactorialExample {
    public static BigInteger factorial(int n) {
        if (n < 0) {
            throw new IllegalArgumentException("n must be non-negative");
        }
        BigInteger result = BigInteger.ONE;
        for (int i = 2; i <= n; i++) {
            result = result.multiply(BigInteger.valueOf(i));
        }
        return result;
    }

    public static void main(String[] args) {
        int number = 100;
        BigInteger fact = factorial(number);
        System.out.println("Factorial of " + number + " is: " + fact);
    }
}
```

### 5.2 精确货币计算（BigDecimal）

```java
import java.math.BigDecimal;
import java.math.RoundingMode;

public class CurrencyCalculationExample {
    public static void main(String[] args) {
        BigDecimal price = new BigDecimal("19.99");
        BigDecimal quantity = new BigDecimal("3");
        BigDecimal discountRate = new BigDecimal("0.1"); // 10% discount

        // Calculate subtotal
        BigDecimal subtotal = price.multiply(quantity);

        // Calculate discount
        BigDecimal discount = subtotal.multiply(discountRate).setScale(2, RoundingMode.HALF_UP);

        // Calculate total amount
        BigDecimal total = subtotal.subtract(discount);

        System.out.println("Subtotal: $" + subtotal); // Subtotal: $59.97
        System.out.println("Discount: $" + discount); // Discount: $6.00
        System.out.println("Total: $" + total);       // Total: $53.97
    }
}
```

### 5.3 高精度科学计算（BigDecimal）

```java
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

public class ScientificCalculationExample {
    public static void main(String[] args) {
        // 使用 MathContext 定义精度和舍入规则
        MathContext mc = new MathContext(10, RoundingMode.HALF_UP);

        BigDecimal a = new BigDecimal("3.14159265358979323846", mc);
        BigDecimal b = new BigDecimal("2.71828182845904523536", mc);

        // 计算 e * π
        BigDecimal product = a.multiply(b, mc);
        System.out.println("π * e ≈ " + product); // π * e ≈ 8.539734223

        // 计算 √2 高精度
        BigDecimal two = new BigDecimal("2");
        // 使用牛顿迭代法近似计算平方根
        BigDecimal sqrt = BigDecimal.valueOf(Math.sqrt(two.doubleValue()));
        int precision = 20;
        for (int i = 0; i < precision; i++) {
            sqrt = two.divide(sqrt, mc).add(sqrt).divide(BigDecimal.valueOf(2), mc);
        }
        System.out.println("√2 ≈ " + sqrt); // √2 ≈ 1.414213562
    }
}
```

## 6 总结

`BigInteger` 和 `BigDecimal` 是 Java 中进行高精度数值计算的强大工具。

- **`BigInteger`** 专注于**任意大小的整数**运算，适用于密码学、大数计算等场景。使用时应注意选择高效的算法，并处理好与大基本数据类型之间的转换。
- **`BigDecimal`** 专注于**精确的十进制小数**运算，彻底解决了浮点数精度问题，尤其适用于金融、会计等对精度要求极高的领域。**创建时应优先使用字符串构造或 `valueOf` 方法**，并在除法运算时始终指定精度和舍入模式。

两者都是不可变对象，线程安全，但需要意识到每次操作都会创建新对象可能带来的性能影响。根据具体需求选择合适的类，并遵循最佳实践，可以确保计算的准确性和程序的健壮性。
