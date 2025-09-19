# Python3 内置函数详解与最佳实践

## 1. 内置函数概述

Python 解释器内置了一系列始终可用的函数和类型，我们称之为内置函数（Built-in Functions）。这些函数是 Python 编程的核心工具，无需导入任何模块即可直接使用。截至 Python 3.13，共有 71 个内置函数。

### 1.1 内置函数的特点

- 无需导入，开箱即用
- 执行效率高（多数用 C 实现）
- 提供语言核心功能
- 覆盖数据处理、迭代、数学运算等多个领域

## 2. 常用内置函数详解

### 2.1 数据处理与转换函数

#### `len()` - 获取对象长度

```python
# 获取各种对象的长度
my_list = [1, 2, 3, 4, 5]
my_string = "Hello, Python!"
my_dict = {'a': 1, 'b': 2, 'c': 3}

print(len(my_list))    # 输出: 5
print(len(my_string))  # 输出: 14
print(len(my_dict))   # 输出: 3

# 注意：len() 不适用于数字类型和 None
```

#### `type()` - 获取对象类型

```python
# 获取对象类型信息
print(type(10))         # <class 'int'>
print(type(3.14))       # <class 'float'>
print(type("hello"))    # <class 'str'>
print(type([1, 2, 3]))  # <class 'list'>

# 类型检查最佳实践
value = "Hello"
if type(value) is str:
    print("值是字符串类型")
```

#### `isinstance()` - 类型检查（推荐）

```python
# isinstance() 比 type() 更灵活，支持继承检查
class MyList(list):
    pass

my_obj = MyList([1, 2, 3])

print(type(my_obj) is list)        # False
print(isinstance(my_obj, list))    # True
print(isinstance(my_obj, MyList))  # True

# 检查多个类型
value = "hello"
if isinstance(value, (str, bytes)):
    print("值是字符串或字节类型")
```

#### `int()`, `float()`, `str()` - 类型转换

```python
# 类型转换示例
print(int("123"))      # 123
print(float("3.14"))   # 3.14
print(str(42))         # "42"

# 处理转换错误的最佳实践
def safe_convert_to_int(value, default=0):
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

print(safe_convert_to_int("123"))    # 123
print(safe_convert_to_int("abc"))    # 0
print(safe_convert_to_int(None))     # 0
```

### 2.2 数学运算函数

#### `abs()` - 绝对值

```python
# 计算绝对值
print(abs(-5))      # 5
print(abs(3.14))    # 3.14
print(abs(-2.5))    # 2.5

# 自定义类的绝对值实现
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __abs__(self):
        return (self.x**2 + self.y**2)**0.5

v = Vector(3, 4)
print(abs(v))  # 5.0
```

#### `round()` - 四舍五入

```python
# 基本四舍五入
print(round(3.14159, 2))    # 3.14
print(round(3.14159, 3))    # 3.142
print(round(2.5))           # 2 (银行家舍入)
print(round(3.5))           # 4 (银行家舍入)

# 处理金融计算时的注意事项
from decimal import Decimal, ROUND_HALF_UP

def financial_round(value, decimals=2):
    return float(Decimal(str(value)).quantize(
        Decimal(f"1.{'0' * decimals}"), rounding=ROUND_HALF_UP
    ))

print(financial_round(2.5))  # 3.0
```

#### `divmod()` - 商和余数

```python
# 同时获取商和余数
result = divmod(10, 3)
print(result)        # (3, 1)
print(result[0])     # 商: 3
print(result[1])     # 余数: 1

# 实用场景：分页计算
total_items = 47
items_per_page = 10
pages, remaining = divmod(total_items, items_per_page)
if remaining > 0:
    pages += 1
print(f"需要 {pages} 页")  # 需要 5 页
```

#### `pow()` - 幂运算

```python
# 幂运算
print(pow(2, 3))      # 8
print(pow(2, 3, 5))   # 3 (2^3 mod 5)

# 与 ** 运算符的比较
# pow() 支持模运算，** 不支持
print(2 ** 3)         # 8
# print(2 ** 3 % 5)   # 等价于 pow(2, 3, 5) 但效率较低
```

### 2.3 迭代与序列操作函数

#### `range()` - 生成数字序列

```python
# 生成数字序列
print(list(range(5)))         # [0, 1, 2, 3, 4]
print(list(range(1, 6)))      # [1, 2, 3, 4, 5]
print(list(range(0, 10, 2)))  # [0, 2, 4, 6, 8]

# 内存高效迭代
for i in range(1000000):
    # 处理大量数据时，range() 比列表更节省内存
    if i >= 100:
        break

# 反向序列
for i in range(10, 0, -1):
    print(i, end=' ')  # 10 9 8 7 6 5 4 3 2 1
```

#### `enumerate()` - 带索引的迭代

```python
# 带索引的迭代
fruits = ['apple', 'banana', 'cherry']

# 传统方式（不推荐）
for i in range(len(fruits)):
    print(f"{i}: {fruits[i]}")

# 使用 enumerate（推荐）
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# 指定起始索引
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}: {fruit}")
```

#### `zip()` - 并行迭代

```python
# 并行迭代多个序列
names = ['Alice', 'Bob', 'Charlie']
ages = [25, 30, 35]
cities = ['New York', 'London', 'Paris']

for name, age, city in zip(names, ages, cities):
    print(f"{name} is {age} years old and lives in {city}")

# 解压序列
zipped = list(zip(names, ages))
print(zipped)  # [('Alice', 25), ('Bob', 30), ('Charlie', 35)]

names_unzipped, ages_unzipped = zip(*zipped)
print(names_unzipped)  # ('Alice', 'Bob', 'Charlie')
```

#### `sorted()` - 排序

```python
# 排序序列
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
print(sorted(numbers))          # [1, 1, 2, 3, 4, 5, 6, 9]
print(sorted(numbers, reverse=True))  # [9, 6, 5, 4, 3, 2, 1, 1]

# 自定义排序
words = ['apple', 'Banana', 'cherry', 'Date']
print(sorted(words))  # ['Banana', 'Date', 'apple', 'cherry'] (区分大小写)
print(sorted(words, key=str.lower))  # ['apple', 'Banana', 'cherry', 'Date']

# 复杂对象排序
students = [
    {'name': 'Alice', 'grade': 85},
    {'name': 'Bob', 'grade': 92},
    {'name': 'Charlie', 'grade': 78}
]

print(sorted(students, key=lambda x: x['grade'], reverse=True))
```

#### `reversed()` - 反向迭代

```python
# 反向迭代
numbers = [1, 2, 3, 4, 5]
print(list(reversed(numbers)))  # [5, 4, 3, 2, 1]

# 字符串反转
text = "Python"
print(''.join(reversed(text)))  # "nohtyP"

# 与切片比较
print(numbers[::-1])  # [5, 4, 3, 2, 1] (创建新列表)
# reversed() 返回迭代器，更节省内存
```

### 2.4 输入输出函数

#### `print()` - 输出内容

```python
# 基本输出
print("Hello, World!")  # Hello, World!

# 多个参数
name = "Alice"
age = 25
print("Name:", name, "Age:", age)  # Name: Alice Age: 25

# 格式化输出
print(f"Name: {name}, Age: {age}")  # Name: Alice, Age: 25
print("Name: {}, Age: {}".format(name, age))

# 控制输出格式
print("Python", end=' ')  # 不换行
print("Programming")      # Python Programming

import sys
print("Error message", file=sys.stderr)  # 输出到标准错误
```

#### `input()` - 获取用户输入

```python
# 获取用户输入
name = input("Please enter your name: ")
print(f"Hello, {name}!")

# 类型安全的输入处理
def get_int_input(prompt, default=0):
    try:
        return int(input(prompt))
    except ValueError:
        print(f"Invalid input, using default value: {default}")
        return default

age = get_int_input("Please enter your age: ")
print(f"You are {age} years old.")
```

### 2.5 函数式编程函数

#### `map()` - 映射函数

```python
# 应用函数到序列每个元素
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x**2, numbers))
print(squared)  # [1, 4, 9, 16, 25]

# 多个序列
a = [1, 2, 3]
b = [4, 5, 6]
result = list(map(lambda x, y: x + y, a, b))
print(result)  # [5, 7, 9]

# 与列表推导式比较
# map() 更函数式，列表推导式更 Pythonic
squared_lc = [x**2 for x in numbers]  # 推荐这种方式
```

#### `filter()` - 过滤元素

```python
# 过滤序列元素
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
even_numbers = list(filter(lambda x: x % 2 == 0, numbers))
print(even_numbers)  # [2, 4, 6, 8, 10]

# 使用 None 过滤假值
mixed = [0, 1, False, True, '', 'hello', None, []]
truthy = list(filter(None, mixed))
print(truthy)  # [1, True, 'hello']

# 与列表推导式比较
even_lc = [x for x in numbers if x % 2 == 0]  # 推荐这种方式
```

#### `reduce()` - 累积计算

```python
# 需要导入 functools
from functools import reduce

# 累积计算
numbers = [1, 2, 3, 4, 5]
product = reduce(lambda x, y: x * y, numbers)
print(product)  # 120

# 初始值
sum_with_init = reduce(lambda x, y: x + y, numbers, 10)
print(sum_with_init)  # 25 (10 + 1+2+3+4+5)

# 实用场景：嵌套字典访问
data = {'a': {'b': {'c': 42}}}
keys = ['a', 'b', 'c']
result = reduce(lambda d, key: d[key], keys, data)
print(result)  # 42
```

## 3. 高级内置函数

### 3.1 对象操作函数

#### `id()` - 获取对象标识

```python
# 获取对象唯一标识
x = [1, 2, 3]
y = x
z = [1, 2, 3]

print(id(x))  # 对象x的内存地址
print(id(y))  # 与x相同
print(id(z))  # 与x不同

# 检查对象是否相同
print(x is y)  # True
print(x is z)  # False
```

#### `hash()` - 获取哈希值

```python
# 获取对象的哈希值
print(hash("hello"))  # 字符串的哈希值
print(hash(42))       # 整数的哈希值

# 可哈希对象才能作为字典键或集合元素
try:
    hash([1, 2, 3])  # 列表不可哈希
except TypeError as e:
    print(e)  # 'list' object is not hashable

# 自定义类的哈希实现
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def __hash__(self):
        return hash((self.name, self.age))
    
    def __eq__(self, other):
        return (self.name, self.age) == (other.name, other.age)

p = Person("Alice", 25)
print(hash(p))
```

#### `repr()` 与 `str()` - 对象表示

```python
# 对象表示
import datetime
now = datetime.datetime.now()

print(str(now))   # 用户友好的字符串表示
print(repr(now))  # 开发者友好的字符串表示，通常可用来重新创建对象

# 自定义类的表示
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __str__(self):
        return f"Point({self.x}, {self.y})"
    
    def __repr__(self):
        return f"Point(x={self.x}, y={self.y})"

p = Point(3, 4)
print(str(p))   # Point(3, 4)
print(repr(p))  # Point(x=3, y=4)
```

### 3.2 属性操作函数

#### `getattr()`, `setattr()`, `hasattr()` - 动态属性访问

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

p = Person("Alice", 25)

# 动态属性访问
print(hasattr(p, 'name'))    # True
print(hasattr(p, 'email'))   # False

print(getattr(p, 'name'))    # Alice
print(getattr(p, 'email', 'default@example.com'))  # default@example.com

setattr(p, 'email', 'alice@example.com')
print(p.email)  # alice@example.com

# 实用场景：动态配置
config = {'debug': True, 'log_level': 'INFO'}
for key, value in config.items():
    setattr(p, key, value)

print(p.debug)      # True
print(p.log_level) # INFO
```

#### `delattr()` - 删除属性

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

p = Person("Alice", 25)

# 删除属性
delattr(p, 'age')
print(hasattr(p, 'age'))  # False

# 等效于 del p.age
```

### 3.3 执行与求值函数

#### `eval()` - 执行字符串表达式

```python
# 执行字符串表达式（谨慎使用）
result = eval("2 + 3 * 4")
print(result)  # 14

# 限制命名空间
x = 10
result = eval("x + 5", {"x": x})
print(result)  # 15

# 安全风险：避免执行用户输入的代码
# 不推荐：eval(input("Enter expression: "))
```

#### `exec()` - 执行代码字符串

```python
# 执行代码字符串（更加谨慎使用）
code = """
def greet(name):
    return f"Hello, {name}!"

message = greet("Alice")
print(message)
"""

exec(code)  # Hello, Alice!

# 限制执行环境
local_vars = {}
exec("x = 10; y = 20", {}, local_vars)
print(local_vars)  # {'x': 10, 'y': 20}
```

## 4. 最佳实践与性能考虑

### 4.1 内置函数 vs 自定义实现

```python
# 使用内置函数（推荐）
numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
maximum = max(numbers)
minimum = min(numbers)

print(f"Sum: {total}, Max: {maximum}, Min: {minimum}")

# 自定义实现（不推荐）
def custom_sum(nums):
    result = 0
    for num in nums:
        result += num
    return result

def custom_max(nums):
    result = nums[0]
    for num in nums[1:]:
        if num > result:
            result = num
    return result

# 内置函数通常更高效且经过优化
```

### 4.2 生成器表达式的使用

```python
# 处理大型数据集时使用生成器
import sys

# 列表推导式（占用更多内存）
big_list = [x for x in range(1000000)]
print(sys.getsizeof(big_list))  # 大约 8.5MB

# 生成器表达式（节省内存）
big_gen = (x for x in range(1000000))
print(sys.getsizeof(big_gen))   # 大约 128 bytes

# 与内置函数结合使用
total = sum(x for x in range(1000000) if x % 2 == 0)
print(total)
```

### 4.3 避免常见陷阱

```python
# 陷阱1：在循环中重复计算
# 不推荐
data = [1, 2, 3, 4, 5]
for i in range(len(data)):  # 每次循环都调用 len()
    print(data[i])

# 推荐
length = len(data)  # 预先计算
for i in range(length):
    print(data[i])

# 更推荐（使用 enumerate）
for i, item in enumerate(data):
    print(f"{i}: {item}")

# 陷阱2：不必要的类型转换
# 不推荐
value = "123"
if int(value) > 100:  # 多次转换
    print("Large number:", int(value))

# 推荐
value_int = int(value)
if value_int > 100:
    print("Large number:", value_int)
```

## 5. 实用技巧与模式

### 5.1 函数组合模式

```python
# 组合多个内置函数
data = [5, 2, 8, 1, 9, 3]

# 获取最大的三个数
top_three = sorted(data, reverse=True)[:3]
print(top_three)  # [9, 8, 5]

# 使用 heapq 更高效
import heapq
top_three_heap = heapq.nlargest(3, data)
print(top_three_heap)  # [9, 8, 5]

# 链式处理
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
result = sum(
    x ** 2 
    for x in numbers 
    if x % 2 == 0
)
print(result)  # 2^2 + 4^2 + 6^2 + 8^2 + 10^2 = 220
```

### 5.2 条件逻辑与默认值

```python
# 使用 or 提供默认值
name = None
display_name = name or "Unknown"
print(display_name)  # Unknown

# 使用 getattr 安全访问属性
class Config:
    pass

config = Config()
timeout = getattr(config, 'timeout', 30)
print(timeout)  # 30

# 使用字典 get 方法
data = {'a': 1, 'b': 2}
value = data.get('c', 0)
print(value)  # 0
```

### 5.3 性能优化技巧

```python
# 使用局部变量加速访问
import time

def test_global():
    start = time.time()
    for i in range(1000000):
        len([1, 2, 3])  # 全局查找 len
    return time.time() - start

def test_local():
    local_len = len  # 局部变量引用
    start = time.time()
    for i in range(1000000):
        local_len([1, 2, 3])  # 局部查找
    return time.time() - start

print("Global:", test_global())
print("Local:", test_local())
# 局部变量访问通常更快
```

## 6. 总结

Python 内置函数提供了强大而高效的工具集，熟练掌握这些函数可以显著提高代码质量和开发效率。关键要点：

1. **优先使用内置函数**：它们经过优化且通常比自己实现的版本更高效
2. **理解函数特性**：特别是内存使用和行为特征
3. **注意安全性**：特别是 `eval()` 和 `exec()` 的使用
4. **遵循最佳实践**：使用适当的函数组合和模式
5. **考虑可读性**：在性能优化的同时保持代码清晰易懂

通过合理运用内置函数，你可以写出更简洁、高效且易于维护的 Python 代码。
