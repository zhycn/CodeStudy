---
title: Java 正则表达式详解
description: 正则表达式是一种用于描述字符串匹配规则的文本模式，通过特殊字符和语法实现高效的文本处理。
---

# Java 正则表达式详解

## 1. 正则表达式基础概念

正则表达式（Regular Expression，简称Regex）是一种用于描述字符串匹配规则的文本模式，通过特殊字符和语法实现高效的文本处理。正则表达式由一系列字符和特殊字符组成，用于定义搜索模式，它可以用于字符串匹配、搜索、替换和验证，是文本处理和模式匹配的常见工具。

在Java中，正则表达式通过`java.util.regex`包实现，该包提供了完整的正则表达式支持。Java正则表达式的核心类包括：

- **Pattern类**：用于编译正则表达式，生成一个模式对象
- **Matcher类**：用于执行匹配操作，解释模式并对输入字符串进行匹配操作
- **PatternSyntaxException**：表示正则表达式模式中的语法错误

正则表达式的主要用途包括：

- **验证文本内容**：检查字符串是否符合特定格式（如邮箱、电话号码、身份证号等）
- **提取信息**：从文本中查找或提取符合特定模式的子串
- **文本替换**：将匹配特定模式的文本替换为指定内容
- **文本分割**：根据特定模式将文本分割成多个部分

## 2. Java正则表达式核心语法

### 2.1 元字符与转义

元字符是正则表达式中具有特殊意义的字符，以下是一些常用元字符：

| 元字符 | 说明                                   | 示例                                   |
| :----- | :------------------------------------- | :------------------------------------- |
| `.`    | 匹配除换行符外的任意单个字符           | `a.c`匹配"abc"、"a1c"等                |
| `^`    | 匹配字符串的开头                       | `^abc`匹配以"abc"开头的字符串          |
| `$`    | 匹配字符串的结尾                       | `abc$`匹配以"abc"结尾的字符串          |
| `\d`   | 匹配数字字符，等价于`[0-9]`            | `\d+`匹配一个或多个数字                |
| `\D`   | 匹配非数字字符，等价于`[^0-9]`         | `\D+`匹配一个或多个非数字字符          |
| `\w`   | 匹配单词字符（字母、数字、下划线）     | `\w+`匹配一个或多个单词字符            |
| `\W`   | 匹配非单词字符                         | `\W+`匹配一个或多个非单词字符          |
| `\s`   | 匹配空白字符（空格、制表符、换行符等） | `\s+`匹配一个或多个空白字符            |
| `\S`   | 匹配非空白字符                         | `\S+`匹配一个或多个非空白字符          |
| `\b`   | 匹配单词边界                           | `\bjava\b`匹配独立的"java"单词         |
| `\B`   | 匹配非单词边界                         | `\Bjava\B`匹配包含但不独立出现的"java" |

**转义规则**：在Java字符串中，需要使用双反斜杠表示正则中的单反斜杠。例如，匹配小数点需写为`\\.`，匹配反斜杠需要写为`\\\\`。

### 2.2 字符类与范围

字符类用于定义一组字符，匹配其中任意一个字符：

- **简单字符类**：`[abc]`匹配a、b或c中的任意一个字符
- **字符范围**：`[a-z]`匹配任意小写字母，`[0-9A-F]`匹配十六进制字符
- **否定字符类**：`[^abc]`匹配除a、b、c之外的任意字符
- **组合字符类**：`[a-zA-Z0-9_]`匹配任意字母、数字或下划线（等价于`\w`）

```java
// 示例：字符类的使用
System.out.println("a".matches("[abc]"));      // true
System.out.println("d".matches("[abc]"));      // false
System.out.println("d".matches("[^abc]"));     // true
System.out.println("A".matches("[a-zA-Z]"));   // true
System.out.println("5".matches("[0-9]"));      // true
```

### 2.3 量词与匹配模式

量词用于指定字符或子表达式的出现次数：

| 量词    | 说明             | 示例                                   |
| :------ | :--------------- | :------------------------------------- |
| `*`     | 零次或多次       | `a*`匹配""、"a"、"aa"、"aaa"等         |
| `+`     | 一次或多次       | `a+`匹配"a"、"aa"、"aaa"等，但不匹配"" |
| `?`     | 零次或一次       | `a?`匹配""或"a"                        |
| `{n}`   | 恰好n次          | `a{3}`匹配"aaa"                        |
| `{n,}`  | 至少n次          | `a{2,}`匹配"aa"、"aaa"、"aaaa"等       |
| `{n,m}` | 至少n次，至多m次 | `a{2,4}`匹配"aa"、"aaa"或"aaaa"        |

Java正则表达式支持两种匹配模式：

- **贪婪匹配**（默认）：尽可能匹配更长内容
- **非贪婪匹配**：在量词后加`?`，尽可能少匹配内容

```java
// 示例：贪婪匹配 vs 非贪婪匹配
String text = "aabbcc";

// 贪婪匹配
Pattern greedy = Pattern.compile("a.*c");
Matcher greedyMatcher = greedy.matcher(text);
if (greedyMatcher.find()) {
    System.out.println("贪婪匹配: " + greedyMatcher.group()); // "aabbcc"
}

// 非贪婪匹配
Pattern reluctant = Pattern.compile("a.*?c");
Matcher reluctantMatcher = reluctant.matcher(text);
if (reluctantMatcher.find()) {
    System.out.println("非贪婪匹配: " + reluctantMatcher.group()); // "aabbc"
}
```

## 3. Pattern与Matcher类详解

### 3.1 Pattern类

`Pattern`类是正则表达式的编译表示，线程安全，适合并发环境使用。

**主要方法**：

- `static Pattern compile(String regex)`：编译正则表达式，创建Pattern对象
- `static Pattern compile(String regex, int flags)`：带标志编译正则表达式
- `Matcher matcher(CharSequence input)`：创建匹配器对象
- `static boolean matches(String regex, CharSequence input)`：快速匹配整个字符串
- `String[] split(CharSequence input)`：根据模式分割字符串
- `String pattern()`：返回正则表达式字符串

```java
// 示例：Pattern类的使用
Pattern pattern = Pattern.compile("\\d+");
String[] parts = pattern.split("a1b2c3");
System.out.println(Arrays.toString(parts)); // [a, b, c]

boolean isMatch = Pattern.matches("\\d+", "123");
System.out.println(isMatch); // true
```

### 3.2 Matcher类

`Matcher`类是执行匹配操作的引擎，提供了多种查找和操作匹配结果的方法。

**主要方法**：

- `boolean matches()`：尝试将整个区域与模式匹配
- `boolean lookingAt()`：尝试从区域开头开始匹配模式
- `boolean find()`：尝试查找下一个匹配的子序列
- `boolean find(int start)`：从指定位置开始查找下一个匹配
- `String group()`：返回前一个匹配的字符串
- `String group(int group)`：返回前一个匹配指定组的字符串
- `int start()`：返回前一个匹配的起始索引
- `int end()`：返回前一个匹配的结束索引
- `Matcher reset()`：重置匹配器状态
- `Matcher reset(CharSequence input)`：用新输入重置匹配器
- `replaceAll(String replacement)`：替换所有匹配子串
- `replaceFirst(String replacement)`：替换第一个匹配子串

```java
// 示例：Matcher类的使用
Pattern pattern = Pattern.compile("\\d+");
Matcher matcher = pattern.matcher("There are 123 apples and 456 oranges");

// 查找所有数字序列
while (matcher.find()) {
    System.out.println("找到: " + matcher.group() +
                      ", 位置: " + matcher.start() + "-" + matcher.end());
}

// 输出:
// 找到: 123, 位置: 9-12
// 找到: 456, 位置: 26-29
```

**匹配标志**：Pattern类支持以下标志以改变匹配行为：

- `Pattern.CASE_INSENSITIVE`：不区分大小写匹配
- `Pattern.MULTILINE`：多行模式（^和$匹配行首行尾）
- `Pattern.DOTALL`：点号匹配所有字符包括换行符
- `Pattern.UNICODE_CASE`：Unicode感知的大小写折叠

```java
// 示例：使用匹配标志
Pattern caseInsensitivePattern = Pattern.compile("java", Pattern.CASE_INSENSITIVE);
Matcher matcher = caseInsensitivePattern.matcher("Java JAVA java");

while (matcher.find()) {
    System.out.println("匹配: " + matcher.group());
}
// 输出: 匹配: Java, 匹配: JAVA, 匹配: java
```

## 4. 分组与捕获技术

### 4.1 捕获组

捕获组是通过圆括号`()`将多个字符组合在一起形成的子表达式，匹配的内容会被捕获并存储，便于后续引用或处理。

**组编号规则**：从左到右，从左括号的顺序计数。组0始终代表整个表达式。

```java
// 示例：捕获组的使用
String text = "John Doe, age: 30";
Pattern pattern = Pattern.compile("(\\w+)\\s+(\\w+),\\s*age:\\s*(\\d+)");
Matcher matcher = pattern.matcher(text);

if (matcher.find()) {
    System.out.println("完整匹配: " + matcher.group(0)); // "John Doe, age: 30"
    System.out.println("名: " + matcher.group(1));      // "John"
    System.out.println("姓: " + matcher.group(2));      // "Doe"
    System.out.println("年龄: " + matcher.group(3));     // "30"
    System.out.println("组数量: " + matcher.groupCount()); // 3
}
```

### 4.2 非捕获组

非捕获组使用`(?:...)`语法，它只用于分组但不捕获内容，不分配组号，可以提高性能且减少不必要的捕获。

```java
// 示例：非捕获组的使用
String text = "abcabc";
Pattern capturePattern = Pattern.compile("(abc)+");
Matcher captureMatcher = capturePattern.matcher(text);
if (captureMatcher.find()) {
    System.out.println("捕获组: " + captureMatcher.group(1)); // "abc"
}

Pattern nonCapturePattern = Pattern.compile("(?:abc)+");
Matcher nonCaptureMatcher = nonCapturePattern.matcher(text);
if (nonCaptureMatcher.find()) {
    System.out.println("非捕获组匹配: " + nonCaptureMatcher.group()); // "abcabc"
    // System.out.println(nonCaptureMatcher.group(1)); // 错误：没有捕获组
}
```

### 4.3 反向引用

反向引用用于在同一个正则表达式中引用前面捕获组匹配的内容，使用`\n`（n为组号）语法。

```java
// 示例：反向引用查找重复单词
String text = "Hello hello world";
Pattern pattern = Pattern.compile("(\\b\\w+\\b)\\s+\\1", Pattern.CASE_INSENSITIVE);
Matcher matcher = pattern.matcher(text);

while (matcher.find()) {
    System.out.println("找到重复单词: " + matcher.group(1)); // "Hello"
}

// 示例：反向引用在替换中的应用
String dateStr = "2023-01-01";
String newDateStr = dateStr.replaceAll("(\\d{4})-(\\d{2})-(\\d{2})", "$3/$2/$1");
System.out.println(newDateStr); // "01/01/2023"
```

## 5. 匹配模式与性能优化

### 5.1 贪婪匹配与非贪婪匹配

正则表达式默认采用贪婪匹配模式，即尽可能匹配更长内容。在量词后加`?`可启用非贪婪匹配（懒惰匹配），即尽可能少匹配内容。

```java
// 示例：贪婪匹配 vs 非贪婪匹配
String html = "<div>content</div><div>another</div>";

// 贪婪匹配
Pattern greedyPattern = Pattern.compile("<div>.*</div>");
Matcher greedyMatcher = greedyPattern.matcher(html);
if (greedyMatcher.find()) {
    System.out.println("贪婪匹配: " + greedyMatcher.group());
    // "<div>content</div><div>another</div>"
}

// 非贪婪匹配
Pattern reluctantPattern = Pattern.compile("<div>.*?</div>");
Matcher reluctantMatcher = reluctantPattern.matcher(html);
while (reluctantMatcher.find()) {
    System.out.println("非贪婪匹配: " + reluctantMatcher.group());
    // "<div>content</div>" 和 "<div>another</div>"
}
```

### 5.2 性能优化技巧

1\. **预编译正则表达式**：对于多次使用的正则表达式，应预编译为Pattern对象，避免重复解析。

```java
// 示例：预编译正则表达式
public class RegexUtils {
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$");
    private static final Pattern PHONE_PATTERN =
        Pattern.compile("^1[3-9]\\d{9}$");

    public static boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    public static boolean isValidPhone(String phone) {
        return PHONE_PATTERN.matcher(phone).matches();
    }
}
```

2\. **避免重复编译**：不要在循环内部编译正则表达式，这会导致性能下降。

3\. **使用非捕获组**：当不需要捕获分组内容时，使用非捕获组`(?:...)`减少开销。

4\. **适当使用限定符范围**：避免使用过于宽泛的匹配模式如`.*`，使用更具体的范围。

5\. **考虑字符串操作**：对于简单匹配，考虑使用String类的内置方法（如contains、startsWith、endsWith）可能更高效。

## 6. 实战应用场景

### 6.1 数据验证

正则表达式常用于验证用户输入的数据格式。

```java
// 示例：常见数据验证
public class Validator {
    // 手机号验证（中国）
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^(\\+86)?1[3-9]\\d{9}$");

    // 邮箱验证
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$");

    // 身份证验证（15位或18位，末位可能是X）
    private static final Pattern ID_CARD_PATTERN = Pattern.compile(
        "^\\d{15}|\\d{17}[0-9X]$");

    // 日期格式验证（YYYY-MM-DD）
    private static final Pattern DATE_PATTERN = Pattern.compile(
        "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$");

    // 密码强度验证（8-20位，含大小写字母和数字）
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
        "^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$");

    public static boolean validateMobile(String mobile) {
        return MOBILE_PATTERN.matcher(mobile).matches();
    }

    public static boolean validateEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    // 其他验证方法...
}
```

### 6.2 信息提取

从文本中提取特定信息是正则表达式的常见应用。

```java
// 示例：从文本中提取信息
public class InfoExtractor {
    // 提取HTML标签内容
    public static List<String> extractHtmlTags(String html, String tagName) {
        List<String> results = new ArrayList<>();
        Pattern pattern = Pattern.compile("<" + tagName + ">(.*?)</" + tagName + ">");
        Matcher matcher = pattern.matcher(html);

        while (matcher.find()) {
            results.add(matcher.group(1));
        }
        return results;
    }

    // 提取电子邮件地址
    public static List<String> extractEmails(String text) {
        List<String> emails = new ArrayList<>();
        Pattern pattern = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            emails.add(matcher.group());
        }
        return emails;
    }

    // 提取中文内容
    public static List<String> extractChinese(String text) {
        List<String> results = new ArrayList<>();
        Pattern pattern = Pattern.compile("[\\u4e00-\\u9fa5]+");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            results.add(matcher.group());
        }
        return results;
    }
}
```

### 6.3 文本替换与清洗

正则表达式可以高效地进行文本替换和清洗操作。

```java
// 示例：文本替换与清洗
public class TextCleaner {
    // 去除多余空格
    public static String removeExtraSpaces(String text) {
        return text.replaceAll("\\s+", " ");
    }

    // 隐藏敏感信息（如身份证号）
    public static String hideSensitiveInfo(String text) {
        return text.replaceAll("\\d{17}[0-9X]", "***************X");
    }

    // 删除HTML标签
    public static String removeHtmlTags(String html) {
        return html.replaceAll("<[^>]+>", "");
    }

    // 格式化电话号码
    public static String formatPhoneNumber(String phone) {
        return phone.replaceAll("(\\d{3})(\\d{4})(\\d{4})", "$1-$2-$3");
    }
}
```

### 6.4 文本分割

使用正则表达式可以实现复杂的文本分割操作。

```java
// 示例：文本分割
public class TextSplitter {
    // 使用正则表达式分割字符串
    public static String[] splitByPattern(String text, String regex) {
        Pattern pattern = Pattern.compile(regex);
        return pattern.split(text);
    }

    // 分割CSV（考虑逗号在引号内的情况）
    public static String[] splitCsv(String csvLine) {
        // 使用正向预查匹配不在引号内的逗号
        return csvLine.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
    }

    // 分割重叠字符
    public static String[] splitOverlapping(String text) {
        // 将"aabbcc"分割为["aa", "bb", "cc"]
        return text.split("(?<=(.))(?!\\1)");
    }
}
```

## 总结

Java正则表达式是一个强大而灵活的文本处理工具，通过Pattern和Matcher类提供了完整的正则表达式支持。掌握正则表达式需要理解其核心语法（元字符、字符类、量词等）、分组与捕获技术以及各种匹配模式。

在实际应用中，我们应当：

1. 合理选择使用场景，既发挥其强大功能，又避免过度使用
2. 注意性能优化，预编译常用正则表达式，避免重复编译
3. 编写清晰可维护的正则表达式，适当注释复杂模式
4. 考虑使用工具类封装常用正则表达式操作

正则表达式学习曲线较陡峭，但一旦掌握，能极大提高文本处理效率和代码简洁度，是Java开发者必备的重要技能之一。
