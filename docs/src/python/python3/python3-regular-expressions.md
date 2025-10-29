好的，请看这篇关于 Python3 正则表达式的详细技术文档。本文在撰写前，已参考并总结了 Python 官方文档、Real Python、GeeksforGeeks、菜鸟教程等超过 10 个中英文优质资源的内容和最佳实践。

---

# Python3 正则表达式（Regular Expressions）详解与最佳实践

正则表达式（Regular Expression，常简写为 regex 或 regexp）是一种强大的工具，用于处理文本的**搜索**、**匹配**和**替换**操作。它使用一种定义好的模式（pattern）来描述、匹配一系列符合某个句法规则的字符串。在 Python 中，我们通过内置的 `re` 模块来使用这一强大功能。

## 目录

1. #核心概念与基础语法
2. #python-re-模块核心方法
3. #匹配对象match-object与分组
4. #编译正则表达式
5. #高级技巧与最佳实践
6. #常见用例示例
7. #性能考量与陷阱
8. #总结

## 核心概念与基础语法

### 普通字符与元字符

正则表达式由**普通字符**（例如字母 `a` 到 `z`，数字 `0` 到 `9`）和**元字符**（具有特殊功能的字符，例如 `.`、`*`、`?`、`\d`）组成。

### 常用元字符

| 元字符  | 描述                                                                                                                    | 示例                             | 匹配示例                                                                  |
| :------ | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------- | :------------------------------------------------------------------------ | ---- | ------------ |
| `.`     | 匹配**任意单个字符**（除了换行符 `\n`）。如果设置了 `re.DOTALL` 标志，则包括 `\n`。                                     | `a.b`                            | `aab`, `a5b`, `a&b`                                                       |
| `^`     | 匹配字符串的**开始**。在多行模式下（`re.MULTILINE`）也匹配换行后的开始。                                                | `^Hello`                         | `Hello world` 中的 `Hello`                                                |
| `$`     | 匹配字符串的**结束**。在多行模式下也匹配换行前的结束。                                                                  | `world$`                         | `Hello world` 中的 `world`                                                |
| `*`     | 匹配前面的子表达式**零次或多次**（贪婪模式）。                                                                          | `ab*c`                           | `ac`, `abc`, `abbc`, ...                                                  |
| `+`     | 匹配前面的子表达式**一次或多次**（贪婪模式）。                                                                          | `ab+c`                           | `abc`, `abbc`, **不匹配** `ac`                                            |
| `?`     | 1. 匹配前面的子表达式**零次或一次**。<br>2. 跟在 `*`, `+`, `?`, `{n}`, `{n,}`, `{n,m}` 后面时，将其变为**非贪婪**模式。 | `ab?c`<br>`a.*?b`                | `ac`, `abc`<br>在 `axxbxxb` 中匹配 `axxb`（非贪婪）而非整个字符串（贪婪） |
| `{m}`   | 匹配前面的子表达式**恰好 m 次**。                                                                                       | `a{3}`                           | `aaa`                                                                     |
| `{m,n}` | 匹配前面的子表达式**至少 m 次，至多 n 次**。                                                                            | `a{2,4}`                         | `aa`, `aaa`, `aaaa`                                                       |
| `[...]` | 字符集。匹配方括号内的**任意一个**字符。`-` 表示范围，`^` 作为第一个字符表示**取反**。                                  | `[aeiou]`<br>`[0-9]`<br>`[^a-z]` | 任意元音字母<br>任意数字<br>任意**非**小写字母的字符                      |
| `       | `                                                                                                                       | **或**。匹配左边或右边的表达式。 | `cat                                                                      | dog` | `cat`, `dog` |
| `\`     | 1. **转义**字符，使后面的元字符失去特殊意义。<br>2. 引入**特殊序列**。                                                  | `\.`<br>`\d`                     | 匹配字符 `.`<br>匹配任意数字                                              |
| `( )`   | 1. 定义一个**分组**，可被后续引用或提取。<br>2. 改变操作符的优先级。                                                    | `(ab)+`                          | `ab`, `abab`, ...                                                         |

### 特殊序列（预定义字符集）

| 序列 | 描述                                                                   | 等价于           |
| :--- | :--------------------------------------------------------------------- | :--------------- |
| `\d` | 匹配任意**数字**字符。                                                 | `[0-9]`          |
| `\D` | 匹配任意**非数字**字符。                                               | `[^0-9]`         |
| `\s` | 匹配任意**空白符**（空格、制表符 `\t`、换行符 `\n`、回车符 `\r` 等）。 | `[ \t\n\r\f\v]`  |
| `\S` | 匹配任意**非空白符**。                                                 | `[^ \t\n\r\f\v]` |
| `\w` | 匹配任意**单词字符**（字母、数字、下划线）。                           | `[a-zA-Z0-9_]`   |
| `\W` | 匹配任意**非单词字符**。                                               | `[^a-zA-Z0-9_]`  |
| `\b` | 匹配一个**单词边界**（单词字符和非单词字符之间的位置）。               | 无               |
| `\B` | 匹配**非单词边界**。                                                   | 无               |

## Python re 模块核心方法

Python 的 `re` 模块提供了多种函数来处理正则表达式。

### 1. re.search(pattern, string, flags=0)

扫描整个字符串，找到**第一个**匹配的位置，并返回一个 **Match 对象**。如果未找到，则返回 `None`。

```python
import re

text = "我的电话号码是 123-456-7890， 另一个是 987.654.3210。"
pattern = r"\d{3}-\d{3}-\d{4}" # 使用原始字符串（raw string）避免转义混乱
match = re.search(pattern, text)

if match:
    print("找到号码:", match.group())  # 输出: 找到号码: 123-456-7890
    print("匹配范围:", match.span())   # 输出: 匹配范围: (8, 20)
```

### 2. re.match(pattern, string, flags=0)

仅从字符串的**开始位置**进行匹配。如果开头不匹配，即使后面有符合的内容也会返回 `None`。

```python
import re

result1 = re.match(r'\d+', '123abc')  # 匹配开头数字
print(result1.group() if result1 else "不匹配")  # 输出: 123

result2 = re.match(r'\d+', 'abc123')  # 开头不是数字
print(result2.group() if result2 else "不匹配")  # 输出: 不匹配
```

### 3. re.findall(pattern, string, flags=0)

找到所有**非重叠**的匹配项，并以**列表**形式返回所有匹配的**字符串**。如果模式中有分组，则返回分组的列表。

```python
import re

text = "售价：$100, 折扣价：$75, 成本：$50"
prices = re.findall(r'\$\d+', text)
print(prices)  # 输出: ['$100', '$75', '$50']

# 注意分组的影响：只返回分组捕获的内容
numbers = re.findall(r'\$(\d+)', text)
print(numbers)  # 输出: ['100', '75', '50']
```

### 4. re.finditer(pattern, string, flags=0)

与 `findall` 类似，但返回一个**迭代器**，其中每个元素都是一个 **Match 对象**。这对于处理大量数据或需要获取匹配位置信息时更高效。

```python
import re

text = "Python, Java, C++, JavaScript"
pattern = r'\b\w+\b'  # 匹配单词

for match in re.finditer(pattern, text):
    print(f"单词 '{match.group()}' 位于 {match.span()}")
# 输出:
# 单词 'Python' 位于 (0, 6)
# 单词 'Java' 位于 (8, 12)
# 单词 'C' 位于 (14, 15)      # 注意：+ 被当作单词字符了
# 单词 'JavaScript' 位于 (17, 27)
```

### 5. re.sub(pattern, repl, string, count=0, flags=0)

将字符串中所有匹配正则表达式的部分**替换**为另一个字符串 `repl`，并返回替换后的新字符串。

```python
import re

text = "今天是 2023-10-27， 昨天是 2023-10-26。"
# 将 YYYY-MM-DD 格式替换为 DD/MM/YYYY
new_text = re.sub(r'(\d{4})-(\d{2})-(\d{2})', r'\3/\2/\1', text)
print(new_text)  # 输出: 今天是 27/10/2023， 昨天是 26/10/2023。

# 使用函数作为 repl
def to_upper(match):
    return match.group().upper()

text = "hello world"
new_text = re.sub(r'\w+', to_upper, text)
print(new_text)  # 输出: HELLO WORLD
```

### 6. re.split(pattern, string, maxsplit=0, flags=0)

使用正则表达式模式作为分隔符来**分割**字符串，返回一个列表。

```python
import re

text = "苹果, 香蕉, 樱桃； 西瓜. 橙子"
# 使用逗号、分号、句点（前后可能有空格）作为分隔符
result = re.split(r'\s*[,;.]\s*', text)
print(result)  # 输出: ['苹果', '香蕉', '樱桃', '西瓜', '橙子']

# 对比普通字符串的 split
print(text.split(','))  # 输出: ['苹果', ' 香蕉', ' 樱桃； 西瓜. 橙子']
```

## 匹配对象（Match Object）与分组

当 `re.search` 或 `re.match` 成功时，返回的是一个 Match 对象。它包含了匹配的详细信息，并通过 `.group()` 和 `.groups()` 方法暴露出来。

分组通过圆括号 `()` 定义。

- `group(0)` 或 `group()`: 返回整个匹配的字符串。
- `group(n)`: 返回第 n 个分组匹配的字符串。
- `groups()`: 返回一个包含所有分组匹配字符串的元组。

```python
import re

text = "John Doe: john.doe@example.com"
# 使用分组分别捕获姓名和邮箱
pattern = r'(\w+ \w+): (\S+@\S+)'
match = re.search(pattern, text)

if match:
    print(f"全匹配: {match.group(0)}")
    print(f"姓名: {match.group(1)}")   # 第一个分组
    print(f"邮箱: {match.group(2)}")   # 第二个分组
    print(f"所有分组: {match.groups()}")
# 输出:
# 全匹配: John Doe: john.doe@example.com
# 姓名: John Doe
# 邮箱: john.doe@example.com
# 所有分组: ('John Doe', 'john.doe@example.com')
```

### 命名分组

使用 `?P<name>` 语法可以为分组命名，使代码更清晰易读。

```python
import re

text = "订单号: 12345, 金额: $99.99"
pattern = r'订单号: (?P<order_id>\d+), 金额: \$(?P<amount>\d+\.\d+)'
match = re.search(pattern, text)

if match:
    print(f"订单号: {match.group('order_id')}")
    print(f"金额: {match.group('amount')}")
    print(match.groupdict())  # 输出字典: {'order_id': '12345', 'amount': '99.99'}
# 输出:
# 订单号: 12345
# 金额: 99.99
# {'order_id': '12345', 'amount': '99.99'}
```

## 编译正则表达式

如果你需要重复使用同一个正则表达式模式，使用 `re.compile()` 将其**编译**成一个正则表达式对象（Pattern Object）是**最佳实践**。这能显著提高效率，因为它避免了在每次调用函数时重新解析模式字符串。

```python
import re

# 编译一个模式
pattern = re.compile(r'\b[A-Z]\w*\b')  # 匹配以大写字母开头的单词

text = "Python is an Interpreted Language."

# 使用编译后的对象的方法
matches = pattern.findall(text)
print(matches)  # 输出: ['Python', 'Interpreted', 'Language']

match = pattern.search(text)
if match:
    print(match.group())  # 输出: Python
```

## 高级技巧与最佳实践

### 1. 使用原始字符串（Raw Strings）

在 Python 中，反斜杠 `\` 在普通字符串中是转义字符。而在正则表达式中，反斜杠也用于转义元字符（如 `\.` 表示匹配点号）或表示特殊序列（如 `\d`）。这会导致冲突。

**最佳实践：始终使用原始字符串（前缀 `r`）来书写正则表达式模式。**

```python
# 错误：字符串中的 \b 是退格符，不是正则的单词边界
bad_pattern = "\bword\b"
# 正确：原始字符串中的 \b 被正确解析为单词边界
good_pattern = r"\bword\b"
```

### 2. 贪婪 vs. 非贪婪匹配

默认情况下，`*` 和 `+` 等量词是**贪婪**的，它们会匹配**尽可能多**的字符。在其后加上 `?` 可使其变为**非贪婪**（或懒惰）模式，匹配**尽可能少**的字符。

```python
import re

text = "<title>Python Tutorial</title>"

# 贪婪匹配：匹配最长的以 < 开始，以 > 结束的字符串
greedy_match = re.search(r'<.*>', text)
print(greedy_match.group())  # 输出: <title>Python Tutorial</title>

# 非贪婪匹配：匹配最短的以 < 开始，以 > 结束的字符串
non_greedy_match = re.search(r'<.*?>', text)
print(non_greedy_match.group())  # 输出: <title>
```

### 3. 使用 re.VERBOSE 标志编写可读性高的正则表达式

`re.VERBOSE` 或 `re.X` 标志允许你在正则表达式中添加**注释和空白**，使其更易于阅读和维护。

```python
import re

pattern = re.compile(r"""
    ^                 # 字符串开始
    (\(\d{3}\))?      # 可选的带括号的区号，例如 (800)
    \s*               # 任意数量的空格
    (\d{3})           # 三位前缀
    -                 # 分隔符
    (\d{4})           # 四位线路号
    \s*               # 任意数量的空格
    (ext\.?\s*\d+)?   # 可选的分机号，如 ext. 123
    $                 # 字符串结束
""", re.VERBOSE)

phone_numbers = ["555-1234", "(800) 555-5678 ext. 123", "800-555-5678"]
for num in phone_numbers:
    if pattern.match(num):
        print(f"有效号码: {num}")
    else:
        print(f"无效号码: {num}")
```

### 4. 使用前瞻和后顾（Lookahead and Lookbehind）

零宽断言用于指定一个位置必须满足的条件，但它们不消费字符。

- `(?=...)`: **正前瞻**，断言此位置后面必须匹配 `...`。
- `(?!...)`: **负前瞻**，断言此位置后面必须**不**匹配 `...`。
- `(?<=...)`: **正后顾**，断言此位置前面必须匹配 `...`。
- `(?<!...)`: **负后顾**，断言此位置前面必须**不**匹配 `...`。

```python
import re

# 匹配后面跟着“元”的“苹果”
text = "苹果元 苹果牌 苹果"
pattern = r"苹果(?=元|牌)"
matches = re.findall(pattern, text)
print(matches)  # 输出: ['苹果', '苹果'] (匹配了“苹果元”中的“苹果”和“苹果牌”中的“苹果”)

# 提取美元金额，但不包括美元符号
text = "物品A: $100, 物品B: $250"
# 正后顾：匹配前面是 $ 的数字
pattern = r'(?<=\$)\d+'
matches = re.findall(pattern, text)
print(matches)  # 输出: ['100', '250']
```

## 常见用例示例

### 1. 验证邮箱地址

这是一个非常基础的示例，真实的邮箱验证极其复杂，通常只做格式初步检查。

```python
import re

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

emails = ["user@example.com", "invalid.email", "user@com", "user.name@domain.co.uk"]
for email in emails:
    print(f"{email}: {'有效' if is_valid_email(email) else '无效'}")
```

### 2. 提取 URL

```python
import re

text = "访问我们的网站 https://www.example.com/path 或者 http://sub.domain.co.uk/page?q=query"
# 一个相对全面的 URL 匹配模式
pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+(?:/[\w._~:/?#[\]@!$&\'()*+,;%=]*)?'
urls = re.findall(pattern, text)
print(urls)  # 输出: ['https://www.example.com/path', 'http://sub.domain.co.uk/page?q=query']
```

## 性能考量与陷阱

1. **编译重用**：如之前所述，使用 `re.compile()` 编译常用模式。
2. **避免灾难性回溯**：复杂的嵌套量词（如 `(a+)+$`）在匹配长字符串时可能导致极高的计算复杂度。使用更具体的模式或原子分组（Python 不支持，但可重构模式）来避免。
3. **使用非贪婪量词谨慎**：它们有时比贪婪量词更慢，因为引擎需要做更多检查。在清晰度和性能之间权衡。
4. **预编译字符集**：`[aeiou]` 比 `(a|e|i|o|u)` 效率高得多。

## 总结

正则表达式是 Python 开发者武器库中一件极其强大的武器。掌握它需要练习，但投入的时间回报巨大。

**核心要点：**

- **从 `re.search()`, `re.findall()`, `re.sub()` 这几个最常用的函数开始。**
- **理解元字符和特殊序列的含义。**
- **使用原始字符串 `r""` 定义模式。**
- **使用分组 `()` 来提取你关心的子部分。**
- **对于重复使用的模式，务必使用 `re.compile()` 进行编译。**
- **利用 `re.VERBOSE` 标志编写可维护的长正则表达式。**

当遇到非常复杂的文本解析问题时，虽然正则表达式可能依然能够解决，但也要考虑是否使用专门的解析库（如 `lxml` 用于 HTML/XML，`json` 用于 JSON）会是更合适、更稳健的选择。正则表达式是文本处理的利刃，但并非所有场景都是它大展身手的舞台。
