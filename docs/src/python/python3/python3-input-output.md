好的，请看下面为您生成的关于 Python3 输入输出的技术文档。

---

# Python3 输入输出（Input/Output）详解与最佳实践

本文档将全面深入地探讨 Python3 中的输入输出操作，涵盖基础输入输出、文件操作、数据序列化以及相关的最佳实践和常见陷阱。

## 目录

1. #基础输入输出
2. #文件操作
   1. #打开文件open-函数
   2. #文件模式
   3. #读取文件内容
   4. #写入文件内容
   5. #文件位置
3. #使用-with-语句上下文管理器
4. #处理不同编码
5. #数据序列化与反序列化
   1. #json
   2. #pickle
6. #高级话题与最佳实践
   1. #使用-pathlib-进行现代路径操作
   2. #处理大文件
   3. #临时文件
7. #常见陷阱与错误处理
8. #总结

## 基础输入输出

### 输出到标准输出（stdout）

在 Python 中，最基础的输出是使用 `print()` 函数将内容打印到控制台（标准输出）。

```python
# 基本用法
print("Hello, World!")

# 打印多个变量，默认用空格分隔
name = "Alice"
age = 30
print("Name:", name, "Age:", age) # 输出: Name: Alice Age: 30

# 更改分隔符 `sep`
print("2023", "10", "27", sep="-") # 输出: 2023-10-27

# 更改结束符 `end`（默认是换行符 \n）
print("Hello", end=" ")
print("World!") # 输出: Hello World!

# 格式化输出（推荐 f-string，Python 3.6+）
print(f"{name} is {age} years old.") # 输出: Alice is 30 years old.

# 旧式格式化（了解即可）
print("%s is %d years old." % (name, age))
print("{} is {} years old.".format(name, age))
```

### 从标准输入（stdin）读取

`input()` 函数用于从用户获取输入。它会将输入内容作为字符串返回。

```python
# 基本用法
user_input = input("Please enter something: ")
print(f"You entered: {user_input}")

# 输入的数字需要转换类型
try:
    number = int(input("Please enter a number: "))
    print(f"The square of {number} is {number ** 2}")
except ValueError:
    print("That was not a valid number!")

# 输入多个值
data = input("Enter two numbers separated by a space: ").split()
if len(data) == 2:
    num1, num2 = map(float, data) # 将列表中的两个字符串转换为浮点数
    print(f"Sum: {num1 + num2}")
else:
    print("Please enter exactly two numbers.")
```

## 文件操作

### 打开文件：`open()` 函数

文件操作的核心是 `open()` 函数，它返回一个文件对象。

```python
file = open('filename.txt', 'mode')
# ... 操作文件
file.close() # 非常重要！操作完成后必须关闭文件
```

### 文件模式

| 模式  | 描述                                                                           |
| :---- | :----------------------------------------------------------------------------- |
| `'r'` | **只读**（默认）。打开文件用于读取，如果文件不存在则抛出 `FileNotFoundError`。 |
| `'w'` | **写入**。打开文件用于写入，如果文件已存在则**覆盖**，不存在则创建。           |
| `'x'` | **独占创建**。如果文件已存在，则操作失败。防止覆盖现有文件。                   |
| `'a'` | **追加**。打开文件用于写入，如果文件存在，则在文件**末尾追加**，不存在则创建。 |
| `'b'` | **二进制**模式。例如 `'rb'` 或 `'wb'`，用于处理图片、视频等非文本文件。        |
| `'t'` | **文本**模式（默认）。例如 `'rt'` 或 `'wt'`。                                  |
| `'+'` | **更新**。打开文件用于读写（可与其他模式结合，如 `'r+'` 或 `'w+'`）。          |

### 读取文件内容

假设我们有一个名为 `example.txt` 的文件，内容如下：

```
Line 1: Hello
Line 2: World
Line 3: Python is great!
```

```python
# 方法 1: read() - 读取整个文件内容到一个字符串
with open('example.txt', 'r') as file:
    content = file.read()
    print(content)

# 方法 2: readline() - 每次读取一行
with open('example.txt', 'r') as file:
    line = file.readline()
    while line:
        print(line, end='') # 因为行本身包含换行符，end='' 避免双换行
        line = file.readline()

# 方法 3: readlines() - 读取所有行到一个列表中
with open('example.txt', 'r') as file:
    lines = file.readlines()
    for line in lines:
        print(line, end='')

# 方法 4（推荐）: 直接迭代文件对象（内存友好，尤其适用于大文件）
with open('example.txt', 'r') as file:
    for line in file:
        print(line, end='')
```

### 写入文件内容

```python
# 写入模式（'w'） - 会覆盖原文件
lines_to_write = ["First line.\n", "Second line.\n", "Third line.\n"]
with open('output.txt', 'w') as file:
    file.write("Hello, File!\n")
    file.writelines(lines_to_write) # 写入一个字符串列表

# 追加模式（'a'）
with open('output.txt', 'a') as file:
    file.write("This line is appended.\n")

print("Data has been written to output.txt")
```

### 文件位置

`tell()` 方法返回文件对象的当前位置（从文件开头开始的字节数）。`seek(offset, whence)` 方法用于移动文件读取/写入的指针。

- `whence=0`（默认）：从文件开头计算偏移量。
- `whence=1`：从当前位置计算偏移量。
- `whence=2`：从文件末尾计算偏移量。

```python
with open('example.txt', 'rb') as file: # 使用二进制模式确保 seek 行为准确
    print(f"Initial position: {file.tell()}")
    data = file.read(10) # 读取前10个字节
    print(f"After reading 10 bytes: {file.tell()}")

    file.seek(5) # 移动到从开头起的第5个字节
    print(f"After seeking to 5: {file.tell()}")

    file.seek(-3, 2) # 移动到文件末尾的前3个字节
    print(f"Seeking to -3 from end: {file.tell()}")
```

## 使用 `with` 语句（上下文管理器）

**最佳实践：始终使用 `with` 语句处理文件对象。**

这确保了文件在语句块结束后会被正确关闭，即使在处理过程中发生了异常。这是一种上下文管理协议，比手动调用 `.close()` 更安全、更清晰。

```python
# 正确的方式
with open('example.txt', 'r') as file:
    data = file.read()
    # 无需手动调用 file.close()，with 块结束后自动调用
# 文件在此处已自动关闭

# 错误的方式（容易忘记关闭文件，导致资源泄漏）
file = open('example.txt', 'r')
data = file.read()
# 如果这里发生异常，file.close() 可能不会被调用
file.close()
```

## 处理不同编码

默认情况下，Python 使用平台相关的编码（如 Unix 是 `utf-8`，Windows 可能是 `cp1252`）。为了代码的可移植性和避免乱码，**最佳实践是显式指定编码**，尤其是处理非 ASCII 字符（如中文）时。

```python
# 推荐：显式指定 encoding
with open('file_with_unicode.txt', 'r', encoding='utf-8') as file:
    content = file.read()

with open('file_with_unicode.txt', 'w', encoding='utf-8') as file:
    file.write("你好，世界！\n") # Hello, World! in Chinese

# 处理编码错误
try:
    with open('some_file.txt', 'r', encoding='utf-8') as file:
        content = file.read()
except UnicodeDecodeError:
    print("Could not decode the file with UTF-8. Trying another encoding...")
    # 可以尝试其他编码，如 'latin-1', 'cp1252', 或使用 chardet 库检测
```

## 数据序列化与反序列化

将 Python 对象转换为可存储或传输的格式（如字节流、JSON 字符串）称为**序列化**，反之称为**反序列化**。

### JSON

JSON（JavaScript Object Notation）是一种轻量级的数据交换格式，常用于 Web 应用和配置文件。`json` 模块用于在 Python 对象和 JSON 字符串之间转换。

```python
import json

# Python 对象
data = {
    "name": "Alice",
    "age": 30,
    "is_student": False,
    "hobbies": ["reading", "hiking"],
    "address": {
        "street": "123 Main St",
        "city": "Anytown"
    }
}

# 序列化：Python 对象 -> JSON 字符串
json_string = json.dumps(data, indent=4) # indent 用于美化输出
print(json_string)

# 序列化：Python 对象 -> JSON 文件
with open('data.json', 'w', encoding='utf-8') as file:
    json.dump(data, file, indent=4)

# 反序列化：JSON 字符串 -> Python 对象
loaded_data_from_str = json.loads(json_string)
print(loaded_data_from_str['name'])

# 反序列化：JSON 文件 -> Python 对象
with open('data.json', 'r', encoding='utf-8') as file:
    loaded_data_from_file = json.load(file)
    print(loaded_data_from_file['address']['city'])
```

### Pickle

`pickle` 模块实现了二进制协议用于序列化和反序列化 Python 对象结构。**注意：pickle 是不安全的，不要反序列化来自不可信来源的数据。**

```python
import pickle

data = {'key': 'value', 'number': 42, 'list': [1, 2, 3]}

# 序列化到文件
with open('data.pkl', 'wb') as file: # 注意是二进制写模式 'wb'
    pickle.dump(data, file)

# 从文件反序列化
with open('data.pkl', 'rb') as file: # 注意是二进制读模式 'rb'
    loaded_data = pickle.load(file)
    print(loaded_data) # Output: {'key': 'value', 'number': 42, 'list': [1, 2, 3]}
```

**JSON vs. Pickle:**

- **可读性**: JSON 是文本，人类可读；Pickle 是二进制，人类不可读。
- **兼容性**: JSON 可被多种语言读写；Pickle 是 Python 特有的。
- **安全性**: JSON 安全；Pickle 可能执行任意代码，不安全。
- **数据类型**: JSON 支持基本类型（str, int, float, bool, list, dict, None）；Pickle 可以序列化几乎所有 Python 对象（函数、类等）。

## 高级话题与最佳实践

### 使用 `pathlib` 进行现代路径操作

`pathlib` 模块（Python 3.4+）提供了面向对象的路径操作，比传统的 `os.path` 更直观、更强大。

```python
from pathlib import Path

# 创建 Path 对象
p = Path('some_directory') / 'sub_dir' / 'file.txt' # 使用 / 拼接路径
print(p) # 输出: some_directory/sub_dir/file.txt

# 检查路径是否存在
if p.exists():
    print("File exists!")

# 读写内容
p.write_text("Hello, pathlib!", encoding='utf-8')
content = p.read_text(encoding='utf-8')
print(content)

# 创建目录
new_dir = Path('new_dir')
new_dir.mkdir(exist_ok=True) # exist_ok=True 避免目录已存在时报错

# 遍历目录
current_dir = Path('.')
for file in current_dir.glob('*.txt'): # 查找所有 .txt 文件
    print(file.name)
```

### 处理大文件

一次性读取整个大文件（如几个 GB）会消耗大量内存。最佳实践是逐行或分块处理。

```python
# 逐行处理（文本文件）
input_path = 'very_large_file.txt'
output_path = 'processed_file.txt'

with open(input_path, 'r', encoding='utf-8') as infile, \
     open(output_path, 'w', encoding='utf-8') as outfile:

    for line in infile:
        # 处理每一行，例如转换为大写
        processed_line = line.upper()
        outfile.write(processed_line)
        # 内存中始终只有一行数据，而不是整个文件

# 分块处理（二进制文件，如图片、视频）
chunk_size = 1024 * 64 # 64 KB
with open('large_image.jpg', 'rb') as src, \
     open('copy_of_image.jpg', 'wb') as dst:

    while True:
        chunk = src.read(chunk_size)
        if not chunk:
            break
        dst.write(chunk)
```

### 临时文件

`tempfile` 模块用于创建临时文件和目录，程序退出后会自动清理。

```python
import tempfile

# 创建临时文件（会自动删除）
with tempfile.NamedTemporaryFile(mode='w+', delete=True, suffix='.txt') as tmp:
    print(f"Temporary file name: {tmp.name}")
    tmp.write("Temporary data")
    tmp.seek(0) # 将指针移回文件开头以便读取
    content = tmp.read()
    print(content)
# 文件在此处已被自动删除

# 创建临时目录
with tempfile.TemporaryDirectory() as tmpdir:
    print(f"Temporary directory: {tmpdir}")
    tmp_file = Path(tmpdir) / 'temp.txt'
    tmp_file.write_text("Data in temp dir")
    # 操作临时文件...
# 目录及其内容在此处已被自动删除
```

## 常见陷阱与错误处理

1. **忘记关闭文件**：使用 `with` 语句避免。
2. **编码问题**：显式指定 `encoding='utf-8'`。
3. **文件不存在**：使用 try-except 块处理 `FileNotFoundError`。
4. **权限不足**：处理 `PermissionError`。
5. **模式错误**：例如尝试写入一个以只读模式打开的文件。

```python
def safe_file_operation(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            print(file.read())
    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found.")
    except PermissionError:
        print(f"Error: Permission denied to read '{filename}'.")
    except UnicodeDecodeError as e:
        print(f"Error: Could not decode the file. {e}")
    except IOError as e:
        print(f"An I/O error occurred: {e}")

safe_file_operation('nonexistent.txt')
```

## 总结

| 任务                | 推荐工具/方法             | 注意事项                                       |
| :------------------ | :------------------------ | :--------------------------------------------- |
| **基础输出**        | `print()`                 | 使用 f-string 进行格式化                       |
| **基础输入**        | `input()`                 | 返回字符串，需手动转换类型                     |
| **文件操作**        | `with open(...) as file:` | **始终使用上下文管理器**                       |
| **文本编码**        | `encoding='utf-8'`        | 显式指定以确保可移植性                         |
| **序列化 (通用)**   | `json` 模块               | 安全、跨语言、支持基本类型                     |
| **序列化 (Python)** | `pickle` 模块             | 不安全、仅限 Python、支持复杂对象              |
| **路径操作**        | `pathlib.Path`            | 现代、面向对象、更直观                         |
| **处理大文件**      | 逐行迭代或分块读取        | 避免一次性加载到内存                           |
| **临时数据**        | `tempfile` 模块           | 自动管理生命周期                               |
| **错误处理**        | `try...except`            | 捕获 `FileNotFoundError`, `PermissionError` 等 |

掌握这些输入输出的核心概念和最佳实践，将帮助你构建出更加健壮、高效和可维护的 Python 应用程序。

---
