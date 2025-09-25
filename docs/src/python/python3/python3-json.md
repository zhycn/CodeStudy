好的，请看这篇关于 Python3 `json` 模块的详细技术文档。

# Python3 `json` 模块详解与最佳实践

## 目录

1. #概述
2. #核心-api
   1. #序列化将-python-对象转换为-json-字符串
   2. #反序列化将-json-字符串转换为-python-对象
   3. #文件操作
3. #编码器与解码器jsonencoder-与-jsondecoder
   1. #自定义编码器
   2. #自定义解码器
   3. #object_hook-和-object_pairs_hook
4. #处理复杂数据类型
   1. #日期时间-datetime-对象
   2. #自定义类对象
   3. #不可-json-序列化的类型
5. #高级特性与参数详解
   1. #格式化输出
   2. #排序键
   3. #处理非-ascii-字符
   4. #解析浮点数
6. #性能与最佳实践
   1. #性能考量
   2. #最佳实践总结
7. #常见问题与解决方案
8. #总结

## 概述

`json` 模块是 Python 标准库中用于处理 JSON (JavaScript Object Notation) 数据的模块。JSON 是一种轻量级的数据交换格式，易于人阅读和编写，同时也易于机器解析和生成。它基于 ECMA-404 标准。

该模块提供了完整的 API，用于在 Python 对象（如字典、列表、字符串、数字、布尔值和 `None`）和 JSON 字符串之间进行序列化（编码）和反序列化（解码）。

**基本对应关系表**：

| JSON           | Python         |
| :------------- | :------------- |
| `object`       | `dict`         |
| `array`        | `list`         |
| `string`       | `str`          |
| `number`       | `int`, `float` |
| `true`/`false` | `True`/`False` |
| `null`         | `None`         |

## 核心 API

### 序列化：将 Python 对象转换为 JSON 字符串

`json.dumps(obj, *, skipkeys=False, ensure_ascii=True, check_circular=True, allow_nan=True, cls=None, indent=None, separators=None, default=None, sort_keys=False, **kw)`

将 Python 对象 `obj` 序列化为一个 JSON 格式的字符串。

- **基本用法**：

  ```python
  import json

  data = {
      "name": "Alice",
      "age": 30,
      "is_student": False,
      "hobbies": ["reading", "hiking"],
      "address": {
          "street": "123 Main St",
          "city": "Wonderland"
      }
  }

  json_string = json.dumps(data)
  print(json_string)
  # 输出: {"name": "Alice", "age": 30, "is_student": false, "hobbies": ["reading", "hiking"], "address": {"street": "123 Main St", "city": "Wonderland"}}
  ```

- **常用参数**：
  - `indent`: 用于美化输出的缩进空格数。

        ```python
        pretty_json = json.dumps(data, indent=4)
        print(pretty_json)
        # 输出:
        # {
        #     "name": "Alice",
        #     "age": 30,
        #     "is_student": false,
        #     "hobbies": [
        #         "reading",
        #         "hiking"
        #     ],
        #     "address": {
        #         "street": "123 Main St",
        #         "city": "Wonderland"
        #     }
        # }
        ```

  - `sort_keys`: 按字母顺序对字典的键进行排序。

        ```python
        sorted_json = json.dumps(data, sort_keys=True, indent=2)
        print(sorted_json)
        # "address" 键会排在 "age" 键之前
        ```

  - `separators`: 指定 item 和 key 之间的分隔符，可用于压缩 JSON。默认是 `(', ', ': ')`。为了最小化输出，可以使用 `(',', ':')`。

        ```python
        compact_json = json.dumps(data, separators=(',', ':'))
        print(compact_json)
        # 输出: {"name":"Alice","age":30,...} (无多余空格)
        ```

  - `ensure_ascii`: 当为 `True`（默认）时，输出中的所有非 ASCII 字符（如中文）都会被转义（例如 `\u4e2d\u6587`）。设置为 `False` 可使这些字符原样输出。

        ```python
        data_cn = {"name": "张三"}
        print(json.dumps(data_cn))
        # 输出: {"name": "\u5f20\u4e09"}
        print(json.dumps(data_cn, ensure_ascii=False))
        # 输出: {"name": "张三"}
        ```

### 反序列化：将 JSON 字符串转换为 Python 对象

`json.loads(s, *, cls=None, object_hook=None, parse_float=None, parse_int=None, parse_constant=None, object_pairs_hook=None, **kw)`

将包含 JSON 文档的字符串 `s` 反序列化为一个 Python 对象。

- **基本用法**：

  ```python
  json_str = '{"name": "Bob", "score": 95.5, "passed": true}'
  python_obj = json.loads(json_str)
  print(python_obj)
  print(type(python_obj))
  # 输出: <class 'dict'>
  print(python_obj["name"])
  # 输出: Bob
  ```

### 文件操作

`json.dump(obj, fp, *, skipkeys=False, ensure_ascii=True, check_circular=True, allow_nan=True, cls=None, indent=None, separators=None, default=None, sort_keys=False, **kw)`

将 Python 对象 `obj` 序列化并写入到文件类对象 `fp`（支持 `.write()` 方法的对象，如文件对象）中。

`json.load(fp, *, cls=None, object_hook=None, parse_float=None, parse_int=None, parse_constant=None, object_pairs_hook=None, **kw)`

从文件类对象 `fp`（支持 `.read()` 方法的对象）中读取 JSON 数据并反序列化为 Python 对象。

- **读写文件示例**：

  ```python
  # 写入 JSON 到文件
  data = {"name": "Charlie", "languages": ["Python", "JavaScript"]}
  with open('data.json', 'w', encoding='utf-8') as f:
      json.dump(data, f, indent=4, ensure_ascii=False)

  # 从文件读取 JSON
  with open('data.json', 'r', encoding='utf-8') as f:
      loaded_data = json.load(f)
  print(loaded_data)
  # 输出: {'name': 'Charlie', 'languages': ['Python', 'JavaScript']}
  ```

## 编码器与解码器（`JSONEncoder` 与 `JSONDecoder`）

对于无法被 `json` 模块默认处理的类型，可以通过继承 `JSONEncoder` 和 `JSONDecoder` 类来实现自定义的序列化和反序列化逻辑。

### 自定义编码器

当你的对象包含无法直接序列化的类型（如 `datetime` 或自定义类）时，你需要定义如何将这些类型转换为基本的、可序列化的 Python 类型。

**方法 1：使用 `default` 函数**
最常见的方式是定义一个函数，并将其传递给 `dumps` 或 `dump` 的 `default` 参数。该函数会接收一个无法被序列化的对象，并返回一个可序列化的表示形式，或者引发 `TypeError`。

```python
from datetime import datetime, date
import json

def custom_serializer(obj):
    """自定义序列化函数，处理 datetime 和 date 对象。"""
    if isinstance(obj, (datetime, date)):
        # 将其转换为 ISO 8601 格式的字符串
        return obj.isoformat()
    # 如果遇到其他无法处理的类型，按默认方式抛出 TypeError
    raise TypeError(f"Type {type(obj)} not serializable")

data = {
    "event": "Meeting",
    "timestamp": datetime.now(),
    "birthday": date(1990, 1, 1)
}

# 使用 default 参数
json_str = json.dumps(data, default=custom_serializer, indent=2)
print(json_str)
# 输出:
# {
#   "event": "Meeting",
#   "timestamp": "2023-10-27T10:30:45.123456",
#   "birthday": "1990-01-01"
# }
```

**方法 2：继承 `JSONEncoder`**
对于更复杂或需要重用的场景，可以创建一个自定义编码器类。

```python
class CustomEncoder(json.JSONEncoder):
    """自定义 JSON 编码器，扩展以支持更多类型。"""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        # 让基类处理其他情况或抛出 TypeError
        return super().default(obj)

# 使用 cls 参数指定自定义编码器
json_str = json.dumps(data, cls=CustomEncoder, indent=2)
# 或者直接在 dump 中使用
# with open('data.json', 'w') as f:
#     json.dump(data, f, cls=CustomEncoder, indent=2)
```

### 自定义解码器

反序列化时，你可能希望将某些 JSON 值（如特定格式的字符串）转换回复杂的 Python 对象。这可以通过 `object_hook`、`object_pairs_hook` 或自定义 `JSONDecoder` 来实现。

### `object_hook` 和 `object_pairs_hook`

- `object_hook`: 是一个可选的函数，它会被调用于每一个解码出的字典对象。该函数的返回值会替代原始的字典。
- `object_pairs_hook`: 类似于 `object_hook`，但其输入是由 `(key, value)` 对组成的列表，而不是字典。这可以用于保持元素的顺序（因为 Python 3.6+ 的 `dict` 虽然保持插入顺序，但反序列化时默认不保证）或进行其他操作。

**示例：将 ISO 日期字符串转换回 `datetime` 对象**

```python
def custom_deserializer(dct):
    """自定义反序列化钩子函数，识别特定格式的字符串并转换为 datetime。"""
    # 假设我们约定所有以 "_at" 结尾的键或者值为 ISO 格式字符串的字段都是日期时间
    for key, value in dct.items():
        if isinstance(value, str):
            try:
                # 尝试解析 ISO 格式的日期时间字符串
                if len(value) == 10 and value.count('-') == 2: # 类似 YYYY-MM-DD
                    dct[key] = date.fromisoformat(value)
                else:
                    dct[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                # 解析失败，保持原值
                pass
    return dct

json_str_with_dates = '{"event": "Meeting", "timestamp": "2023-10-27T10:30:45.123456", "birthday": "1990-01-01"}'
loaded_data = json.loads(json_str_with_dates, object_hook=custom_deserializer)
print(loaded_data)
# 输出: {'event': 'Meeting', 'timestamp': datetime.datetime(2023, 10, 27, 10, 30, 45, 123456), 'birthday': datetime.date(1990, 1, 1)}
print(type(loaded_data['timestamp']))
# 输出: <class 'datetime.datetime'>
```

## 处理复杂数据类型

### 日期时间 (`datetime`) 对象

如上节所示，使用 `default` 函数或自定义编码器将其转换为 ISO 8601 字符串，使用 `object_hook` 函数在解码时将其转换回来是标准且推荐的做法。

### 自定义类对象

序列化自定义类的实例通常有两种策略：

1. **序列化对象的 `__dict__`**：如果对象的属性都可以被序列化。

   ```python
   class User:
       def __init__(self, name, user_id):
           self.name = name
           self.user_id = user_id

   user = User("Alice", 123)

   # 方法 1：直接使用 __dict__
   user_json = json.dumps(user.__dict__)
   print(user_json)
   # 输出: {"name": "Alice", "user_id": 123}

   # 反序列化：先得到字典，再用于重建对象
   user_dict = json.loads(user_json)
   new_user = User(**user_dict)
   # 相当于 User(name='Alice', user_id=123)
   ```

2. **定义专用的序列化方法（更可控）**：在类中定义 `to_json()` 方法，并在 `default` 函数中识别该类的实例。

   ```python
   class Product:
       def __init__(self, name, price):
           self.name = name
           self.price = price

       def to_json(self):
           # 可以控制输出哪些字段以及格式
           return {"name": self.name, "price": f"{self.price:.2f}"}

   def extended_serializer(obj):
       if hasattr(obj, 'to_json'):
           return obj.to_json()
       elif isinstance(obj, (datetime, date)):
           return obj.isoformat()
       raise TypeError(f"Type {type(obj)} not serializable")

   product = Product("Laptop", 999.99)
   product_json = json.dumps(product, default=extended_serializer)
   print(product_json)
   # 输出: {"name": "Laptop", "price": "999.99"}
   ```

### 不可 JSON 序列化的类型

`set`、`tuple` 等类型无法被默认序列化。你需要在 `default` 函数中处理它们。

```python
data_with_set = {"tags": {"python", "json", "tutorial"}}

def handle_sets(obj):
    if isinstance(obj, set):
        return list(obj)  # 将 set 转换为 list
    raise TypeError(f"Type {type(obj)} not serializable")

json_str = json.dumps(data_with_set, default=handle_sets)
print(json_str)
# 输出: {"tags": ["python", "tutorial", "json"]}
# 注意：set 是无序的，所以列表元素顺序可能不同
```

## 高级特性与参数详解

### 格式化输出

使用 `indent` 参数可以生成易于人类阅读的“美化” JSON。使用 `separators` 参数可以生成最紧凑的 JSON（用于网络传输或存储）。

### 排序键

`sort_keys=True` 确保输出的 JSON 字典的键总是按字母顺序排列。这在生成需要比较或哈希的 JSON 字符串时非常有用（例如，用于签名）。

### 处理非 ASCII 字符

`ensure_ascii=True`（默认）是安全的，因为它确保输出是纯 ASCII。如果你的系统或接收方支持 UTF-8，将其设置为 `False` 可以使输出更简洁易读。

### 解析浮点数

`parse_float` 和 `parse_int` 参数允许你指定一个可调用对象，用于解析 JSON 中的浮点数和整数字符串。例如，你可以使用 `decimal.Decimal` 来获得更高的精度。

```python
import decimal

json_str = '{"value": 3.141592653589793238462643383279}'

# 默认解析为 float
data_float = json.loads(json_str)
print(type(data_float['value']), data_float['value'])
# 输出: <class 'float'> 3.141592653589793

# 使用 Decimal 解析以获得精确的十进制表示
data_decimal = json.loads(json_str, parse_float=decimal.Decimal)
print(type(data_decimal['value']), data_decimal['value'])
# 输出: <class 'decimal.Decimal'> 3.141592653589793238462643383279
```

## 性能与最佳实践

### 性能考量

1. **`ujson` / `orjson`**：标准库的 `json` 模块在大多数情况下性能足够好。如果处理非常大的 JSON 数据或对性能有极致要求，可以考虑第三方库，如 `ujson`（UltraJSON）或 `orjson`。它们通常更快，但可能在某些边缘 case 上与标准库行为略有不同。**注意：优先保证兼容性和正确性，再考虑性能。**
2. **避免多次解析/序列化**：尽量一次性处理大的 JSON 结构，而不是多次调用 `dumps`/`loads`。
3. **使用 `json.JSONEncoder` 和 `json.JSONDecoder` 进行重用**：如果你的自定义序列化逻辑很复杂且被频繁使用，继承这些类并实例化一次，然后重复使用实例，会比每次都定义并传递 `default`/`object_hook` 函数效率稍高。

### 最佳实践总结

1. **始终指定 `ensure_ascii=False`** 当你的应用需要处理非英文文本时，以获得更清晰的输出。
2. **在写入文件时指定 `indent`** 用于调试和日志记录。在生产环境中传输数据时，使用 `separators=(',', ':')` 来最小化数据大小。
3. **处理复杂类型** 始终通过 `default` 和 `object_hook` 参数来安全地处理 `datetime` 等非基本类型。
4. **验证输入**：在反序列化来自不可信来源（如用户输入、网络请求）的 JSON 数据之前，应进行验证，以防止诸如 JSON 注入之类的安全问题。
5. **注意编码**：读写文件时，显式指定 `encoding='utf-8'` 以避免在不同平台上的编码问题。
6. **考虑使用更强大的模式验证工具**：对于复杂的数据结构，`json` 模块只负责转换，不负责验证。可以考虑使用 `jsonschema`、`pydantic` 等库来定义和验证数据的结构和内容。

## 常见问题与解决方案

1. **`TypeError: Object of type X is not JSON serializable`**
   - **原因**：你尝试序列化一个不支持的类型（如 `datetime`, `set`, 自定义类）。
   - **解决**：实现并使用 `default` 函数或自定义 `JSONEncoder`。

2. **`JSONDecodeError: Expecting value: line 1 column 1 (char 0)`**
   - **原因**：你尝试解析一个空字符串或根本不是 JSON 的字符串。
   - **解决**：在调用 `json.loads()` 之前检查输入是否有效。

     ```python
     json_str = get_data_from_network()
     if json_str.strip(): # 检查非空
         try:
             data = json.loads(json_str)
         except json.JSONDecodeError as e:
             print(f"Invalid JSON: {e}")
     else:
         print("Received empty response")
     ```

3. **浮点数精度问题**
   - **原因**：JSON 中的浮点数在 Python 中解析为 `float` 类型时，可能会存在精度损失。
   - **解决**：对金融等需要高精度的领域，使用 `parse_float=decimal.Decimal` 参数。

4. **字典键的顺序**
   - **注意**：在 Python 3.6 之前，字典不保持插入顺序。虽然现代 Python 版本和 JSON 本身都保持顺序，但如果顺序至关重要，考虑在解码时使用 `object_pairs_hook=collections.OrderedDict`，或者在处理时不要依赖键的顺序。

## 总结

Python 的 `json` 模块提供了一个强大而灵活的工具集，用于处理 JSON 数据。掌握其核心函数 `dumps`、`loads`、`dump` 和 `load` 是基础。更重要的是，理解如何通过 `default`、`object_hook` 参数以及自定义编码器/解码器来处理复杂和自定义的数据类型，这是在实际项目中有效使用 JSON 的关键。遵循最佳实践，如正确处理编码、考虑性能和安全性，将帮助你构建更健壮的应用。

**官方资源**：

- <https://docs.python.org/3/library/json.html>
- <https://www.json.org/json-en.html>
- <https://docs.python.org/3/tutorial/index.html>
