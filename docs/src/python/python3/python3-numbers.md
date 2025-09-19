好的，请看这篇基于深入研究和分析的 Python3 数字（Number）详解与技术文档。

---

# Python3 数字（Number）详解与最佳实践

在 Python 3 中，数字（Number）是一种不可变的基本数据类型，用于存储数值信息。它是进行科学计算、数据分析、机器学习等领域不可或缺的基石。本文将深入探讨 Python 3 中的数字类型，并通过清晰的示例和最佳实践来帮助您更好地理解和使用它们。

## 1 数字类型概述

Python 3 主要支持三种基本的数字类型，此外标准库还提供了两种用于特定场景的数字类型：

| 类型 | 英文名 | 描述 | 示例 | 类别 |
| :--- | :--- | :--- | :--- | :--- |
| **整型** | `int` | 整数，可以是任意大的数 | `42`, `-10`, `0x2A` | 基本类型 |
| **浮点型** | `float` | 浮点数，带有小数部分 | `3.14`, `2.718`, `-0.5` | 基本类型 |
| **复数** | `complex` | 复数，具有实部和虚部 | `3+4j`, `-2j`, `1.5-0.7j` | 基本类型 |
| **十进制浮点数** | `decimal.Decimal` | 精确的十进制浮点数，适用于金融计算 | `Decimal('3.14')` | 标准库 |
| **分数** | `fractions.Fraction` | 有理数，用分子和分母表示 | `Fraction(3, 4)` | 标准库 |

## 2 核心数字类型详解

### 2.1 整型 (int)

Python 3 的整型是“任意精度”的，这意味着它可以表示理论上无限大的整数（仅受限于可用内存）。

#### 创建与表示

```python
# 十进制
a = 100
print(a)  # 输出: 100

# 二进制 (以 0b 或 0B 开头)
b = 0b1100
print(b)  # 输出: 12

# 八进制 (以 0o 或 0O 开头)
c = 0o14
print(c)  # 输出: 12

# 十六进制 (以 0x 或 0X 开头)
d = 0xC
print(d)  # 输出: 12

# 下划线分隔符 (Python 3.6+ 特性，提高可读性)
large_number = 1_000_000
print(large_number)  # 输出: 1000000
```

#### 常用操作与内置函数

```python
x = 10
y = 3

# 算术运算
print(x + y)   # 加法: 13
print(x - y)   # 减法: 7
print(x * y)   # 乘法: 30
print(x / y)   # 真除法 (返回 float): 3.333...
print(x // y)  # 地板除 (向下取整): 3
print(x % y)   # 取模 (求余数): 1
print(x ** y)  # 幂运算: 1000
print(-x)      # 取负: -10
print(abs(-x)) # 绝对值: 10

# 比较运算
print(x == y)  # False
print(x != y)  # True
print(x > y)   # True

# 位运算 (适用于整数)
a = 0b1010  # 10
b = 0b1100  # 12
print(bin(a & b))   # 按位与: 0b1000 (8)
print(bin(a | b))   # 按位或: 0b1110 (14)
print(bin(a ^ b))   # 按位异或: 0b0110 (6)
print(bin(~a))      # 按位取反: 很复杂的负数表示
print(bin(a << 2))  # 左移两位: 0b101000 (40)
print(bin(b >> 1))  # 右移一位: 0b0110 (6)

# 内置函数
print(pow(2, 10))     # 幂运算，同 2**10: 1024
print(divmod(10, 3))  # 返回 (商, 余数): (3, 1)
print(round(3.5))     # 四舍五入 (注意银行家舍入法): 4
```

### 2.2 浮点型 (float)

浮点数用于表示实数，在 Python 中采用 IEEE 754 双精度标准（64 位）实现。这意味着它表示的范围很大，但**可能存在精度误差**，这是所有使用二进制浮点数的编程语言的通病。

#### 创建与表示

```python
# 直接表示
f1 = 3.14
f2 = -2.5
f3 = 0.0

# 科学计数法
f4 = 2.7e5   # 2.7 * 10^5 = 270000.0
f5 = 1e-3    # 1 * 10^-3 = 0.001

# 特殊值
f6 = float('inf')   # 正无穷大
f7 = float('-inf')  # 负无穷大
f8 = float('nan')   # 非数字 (Not a Number)

# 检查特殊值
import math
print(math.isinf(f6))  # True
print(math.isnan(f8))  # True
```

#### 精度问题与解决方案

```python
# 经典的浮点数精度问题示例
result = 0.1 + 0.2
print(result)        # 输出: 0.30000000000000004
print(result == 0.3) # 输出: False

# 正确的比较方式：检查两数之差是否在极小的误差范围内 (epsilon)
epsilon = 1e-10
print(abs(result - 0.3) < epsilon) # 输出: True

# 或者使用 math.isclose (Python 3.5+)
print(math.isclose(result, 0.3))   # 输出: True
```

### 2.3 复数 (complex)

复数在工程计算、信号处理和物理学中非常有用。每个复数都有一个实部 `real` 和一个虚部 `imag`，虚部以 `j` 或 `J` 结尾。

```python
# 创建复数
c1 = 3 + 4j
c2 = complex(2, -5) # 2 - 5j
c3 = -1j            # -0 - 1j

# 访问实部和虚部
print(c1.real)  # 输出: 3.0
print(c1.imag)  # 输出: 4.0

# 共轭复数
print(c1.conjugate())  # 输出: (3-4j)

# 基本运算
c4 = c1 + c2
print(c4)  # 输出: (5-1j)

# 使用 cmath 模块进行数学运算
import cmath
print(cmath.phase(c1))          # 辐角: 0.9272952180016122
print(abs(c1))                  # 模: 5.0
print(cmath.polar(c1))          # 转换为极坐标: (5.0, 0.9272952180016122)
print(cmath.rect(5.0, cmath.pi/4)) # 极坐标转回直角坐标: (3.535... + 3.535...j)
```

## 3 标准库中的数字类型

### 3.1 decimal.Decimal：精确的十进制浮点数

`decimal` 模块提供了 `Decimal` 数据类型，用于进行精确的十进制浮点运算，尤其适用于金融、货币等对精度要求极高的领域。

```python
from decimal import Decimal, getcontext

# 从字符串创建以避免浮点数初始误差
d1 = Decimal('0.1')
d2 = Decimal('0.2')
result_decimal = d1 + d2
print(result_decimal)        # 输出: 0.3
print(result_decimal == Decimal('0.3')) # 输出: True

# 设置全局精度上下文
getcontext().prec = 6  # 设置有效数字为 6 位

d3 = Decimal('1') / Decimal('7')
print(d3)  # 输出: 0.142857

# 使用本地上下文
with decimal.localcontext() as ctx:
    ctx.prec = 2
    d4 = Decimal('1') / Decimal('7')
    print(d4)  # 输出: 0.14

print(Decimal('1') / Decimal('7'))  # 恢复全局上下文: 0.142857
```

### 3.2 fractions.Fraction：有理数

`fractions` 模块提供了 `Fraction` 类，用于精确表示分数，避免浮点运算的精度损失。

```python
from fractions import Fraction

# 创建分数
f1 = Fraction(3, 4)  # 3/4
f2 = Fraction(0.5)   # 从浮点数创建: 1/2 (可能有精度影响)
f3 = Fraction('0.25')# 从字符串创建是安全的: 1/4
f4 = Fraction('22/7')# 直接从分数字符串创建: 22/7

print(f1)  # 输出: 3/4

# 运算
result_frac = f1 + f2
print(result_frac)        # 输出: 5/4
print(float(result_frac)) # 输出: 1.25

# 自动约分
f5 = Fraction(10, 20)
print(f5)  # 输出: 1/2

# 访问分子和分母
print(f5.numerator)   # 输出: 1
print(f5.denominator) # 输出: 2
```

## 4 数字类型转换与运算

### 4.1 隐式类型转换

在混合类型的算术运算中，Python 会自动进行“向上”转换，从较“窄”的类型转换为较“宽”的类型，以防止信息丢失。其基本顺序为：`int` -> `float` -> `complex`。

```python
# int -> float
result = 3 + 4.5
print(result, type(result))  # 输出: 7.5 <class 'float'>

# int -> complex
result = 2 + 3j
print(result, type(result))  # 输出: (2+3j) <class 'complex'>

# float -> complex
result = 1.5 + 4j
print(result, type(result))  # 输出: (1.5+4j) <class 'complex'>
```

### 4.2 显式类型转换

您可以使用内置函数进行显式转换。

```python
# 转换为整型 int
print(int(3.9))   # 截断小数部分: 3
print(int(-2.9))  # 输出: -2
print(int("123")) # 从字符串转换: 123
# print(int("123.45")) # ValueError

# 转换为浮点型 float
print(float(10))     # 输出: 10.0
print(float("3.14")) # 输出: 3.14

# 转换为复数 complex
print(complex(5))     # 输出: (5+0j)
print(complex(2, 3))  # 输出: (2+3j)
print(complex("1+2j")) # 输出: (1+2j) (注意字符串中不能有空格)

# 在 Decimal, Fraction 和基本类型间转换
from decimal import Decimal
from fractions import Fraction

d = Decimal('3.14')
f_frac = Fraction(2, 5)

print(float(d))       # Decimal -> float: 3.14
print(Fraction.from_float(0.5)) # float -> Fraction: 1/2
print(Fraction(d))    # Decimal -> Fraction: 157/50
```

## 5 数学模块 (math 和 cmath)

Python 提供了 `math` 模块用于实数运算，`cmath` 模块用于复数运算。

```python
import math
import cmath

x = 4
y = 2.5

# 常用 math 函数
print(math.sqrt(x))      # 平方根: 2.0
print(math.pow(x, y))    # 幂运算: 4^2.5 = 32.0
print(math.exp(1))       # e^1 ≈ 2.718
print(math.log(x))       # 自然对数 ln(4) ≈ 1.386
print(math.log10(100))   # 以10为底的对数: 2.0
print(math.sin(math.pi/2)) # 正弦函数: 1.0
print(math.degrees(math.pi)) # 弧度转角度: 180.0
print(math.radians(180))     # 角度转弧度: π ≈ 3.1415

# 常数
print(math.pi)   # π
print(math.e)    # 自然常数 e

# cmath 函数处理复数
z = 1 + 1j
print(cmath.sqrt(z))     # 复数的平方根
print(cmath.sin(z))      # 复数的正弦函数
print(cmath.log(z))      # 复数的自然对数
```

## 6 最佳实践与常见陷阱

1. **选择正确的数字类型**
    * **一般算术**：使用 `int` 和 `float`。
    * **金融、货币计算**：**务必使用 `decimal.Decimal`**，避免浮点精度误差。
    * **需要精确分数表示**：使用 `fractions.Fraction`。
    * **工程、科学计算**：使用 `complex`。

2. **警惕浮点数精度问题**
    * **不要直接比较两个浮点数是否相等**。总是使用 `math.isclose(a, b)` 或检查 `abs(a - b) < epsilon`。

    ```python
    # 错误的方式
    if 0.1 + 0.2 == 0.3:
        print("Equal") # 这永远不会被执行

    # 正确的方式
    if math.isclose(0.1 + 0.2, 0.3):
        print("Effectively equal") # 这会被执行
    ```

3. **谨慎处理整数除法**
    * 在 Python 3 中，`/` 总是返回浮点数，`//` 进行地板除。明确你的意图。

    ```python
    # Python 3 行为
    print(5 / 2)   # 输出: 2.5
    print(5 // 2)  # 输出: 2 (向下取整)
    print(-5 // 2) # 输出: -3 (向下取整)
    ```

4. **使用下划线提高大数可读性 (Python 3.6+)**
    * 这不会影响数值，但让代码更清晰。

    ```python
    # 难以阅读
    big_number = 10000000000

    # 易于阅读
    big_number = 10_000_000_000
    revenue = 9_999_99.99
    ```

5. **理解类型转换的边界和异常**
    * 转换可能丢失精度（`float` 转 `int`）或引发异常（无效字符串转 `int`）。务必做好异常处理。

    ```python
    try:
        num = int("abc123")
    except ValueError as e:
        print(f"Conversion failed: {e}")
    ```

## 7 总结

Python 3 提供了丰富而强大的数字类型生态系统，从基本的 `int`、`float`、`complex` 到用于特定高精度场景的 `Decimal` 和 `Fraction`。理解每种类型的特点、优势、劣势以及它们之间的转换规则，是编写健壮、准确数值计算程序的关键。

1. **`int`**：任意精度整数，是大多数整数运算的首选。
2. **`float`**：高效的二进制浮点数，注意其固有的精度限制。
3. **`complex`**：用于表示和计算复数。
4. **`decimal.Decimal`**：**金融计算的救星**，提供精确的十进制表示。
5. **`fractions.Fraction`**：精确表示分数，避免浮点误差。

始终根据您的具体应用场景选择最合适的类型，并遵循本文概述的最佳实践，这将帮助您避免常见的陷阱并构建出更可靠的软件。

---
