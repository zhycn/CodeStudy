---
title: Java 各版本主要特性详解（倒序排列）
description: 这篇文章详细介绍了 Java 从 JDK 24 到 JDK 1.0 的主要特性，包含代码示例和最佳实践建议。Java 的版本迭代遵循"半年一版，三年一LTS"的节奏，其中 LTS（长期支持）版本是生产环境部署的黄金标准，提供长达数年的支持。
---

# Java 各版本主要特性详解

## 引言

Java 自 1995 年由 Sun Microsystems 开发以来，经历了多次版本更新，每个版本都引入了新的特性和改进。本文档采用倒序方式详细列出从 JDK 24 到 JDK 1.0 的主要特性，包含代码示例和最佳实践建议。Java 的版本迭代遵循"半年一版，三年一LTS"的节奏，其中 LTS（长期支持）版本是生产环境部署的黄金标准，提供长达数年的支持。

本文将帮助开发者全面了解 Java 语言的演进历程，为技术选型和版本升级提供参考依据。

## JDK 24 (2025年3月发布)

### 语言特性增强

- **模式匹配扩展**：允许在更多上下文（如 switch 表达式、if 条件判断）中使用更复杂的模式组合，包括嵌套模式和逻辑模式（and/or/not）
- **字符串模板（正式版）**：提供类型安全的字符串拼接能力，支持嵌入表达式并自动处理转义和类型转换

```java
// 字符串模板示例
String name = "Java";
String info = STR."Version: \{System.getProperty("java.version")}, Name: \{name}";

// 嵌套模式匹配示例
if (obj instanceof Point(int x, Point(int y, _))) {
    // 匹配嵌套的Point结构
    System.out.println("Nested point: " + x + ", " + y);
}
```

### 性能与效率优化

- **ZGC 改进**：支持超大堆（超过 1TB），进一步降低垃圾回收停顿时间（目标亚毫秒级）
- **Vector API（第六轮孵化）**：增强向量计算 API，支持更多硬件架构，充分利用 CPU 的 SIMD 能力

### 安全增强

- **后量子密码算法支持**：引入抗量子计算攻击的密码算法（如 CRYSTALS-Kyber、CRYSTALS-Dilithium）
- **强化的密封类安全检查**：防止在模块外通过反射绕过密封限制

## JDK 23 (2024年9月发布)

### 语言特性

- **未命名模式和变量（预览）**：使用下划线表示未使用的模式或变量，减少冗余代码
- **未命名类和实例主方法（预览）**：进一步简化简单程序的编写

```java
// 实例主方法示例
void main() {
    System.out.println("Hello, simplified Java!");
}
```

### API 增强

- **新的集合操作**：为 List 和 Map 接口添加更多便捷方法
- **数学函数增强**：添加新的数学函数和精度控制选项

## JDK 22 (2024年3月发布)

### 语言特性

- **未命名变量和模式（预览）**：改善代码可读性和维护性
- **String模板（第二次预览）**：继续改进字符串模板功能

### 性能优化

- **分代ZGC性能提升**：进一步优化垃圾回收效率
- **启动时间优化**：通过类数据共享和预处理减少启动时间

## JDK 21 (2023年9月发布) - LTS

### 革命性特性

- **虚拟线程**： lightweight threads, 允许同步式编码获得异步性能，支持百万级并发线程
- **结构化并发**：将相关线程视为工作单元，简化错误传播和取消机制
- **分代ZGC**：提升垃圾回收效率，减少内存占用
- **Record模式匹配**：在switch中直接解构记录类

```java
// 虚拟线程示例
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        });
    });
}

// Record模式匹配示例
record Point(int x, int y) {}
enum Color { RED, GREEN, BLUE }
record ColoredPoint(Point p, Color c) {}

static void printColoredPoint(ColoredPoint cp) {
    if (cp instanceof ColoredPoint(Point(int x, int y), Color c)) {
        System.out.printf("Point [%d, %d] with color %s%n", x, y, c);
    }
}
```

### 性能表现

实际测试表明，Tomcat 请求吞吐量提升 3 倍，内存降低 40%。

## JDK 20 (2023年3月发布)

### 主要特性

- **作用域值（Scoped Values，预览）**：支持线程内和跨线程共享不可变数据，替代 ThreadLocal
- **Record模式（第二次预览）**：增强对复杂数据结构的匹配能力
- **模式匹配switch（第四次预览）**：继续完善模式匹配在switch中的使用

## JDK 19 (2022年9月发布)

### 主要特性

- **虚拟线程（预览）**：首次引入虚拟线程概念
- **结构化并发（孵化器）**：引入结构化并发API
- **模式匹配switch（第三次预览）**：继续改进模式匹配功能

## JDK 18 (2022年3月发布)

### 主要特性

- **UTF-8作为默认字符集**：确保字符编码一致性
- **简单Web服务器**：提供用于开发和测试的简单Web服务器
- **代码片段**：为JavaDoc引入代码片段功能，改善文档体验

## JDK 17 (2021年9月发布) - LTS

### 语言增强

- **密封类（正式特性）**：限制类的继承结构，只有指定的类可以继承密封类
- **模式匹配instanceof（正式特性）**：简化instanceof操作后的类型转换操作

```java
// 密封类示例
sealed class Shape permits Circle, Rectangle, Triangle {
    // 基类定义
}

final class Circle extends Shape {
    private double radius;
    // 实现
}

non-sealed class Rectangle extends Shape {
    private double width, height;
    // 实现
}

// 模式匹配instanceof示例
if (obj instanceof String str) {
    // 直接使用str变量，无需再进行强制类型转换
    System.out.println(str.length());
}
```

### API与JVM改进

- **新的垃圾收集器**：G1 和 Parallel GC 的改进
- **移除实验性功能**：如 Panama 和 Valhalla 的实验API
- **Unicode 13.0支持**：支持最新的Unicode字符集

## JDK 16 (2021年3月发布)

### 主要特性

- **Record类（正式特性）**：简化不可变数据类的定义
- **模式匹配instanceof（第二轮预览）**：继续完善模式匹配功能
- **密封类（第二轮预览）**：继续改进密封类功能
- **Vector API（孵化器）**：提供SIMD编程支持

```java
// Record类示例
record Point(int x, int y) {
    // 编译器自动生成构造函数、访问器、equals、hashCode和toString
}

Point p = new Point(3, 4);
System.out.println(p.x()); // 输出 3
System.out.println(p.y()); // 输出 4
```

## JDK 15 (2020年9月发布)

### 主要特性

- **密封类（预览）**：首次引入密封类概念
- **文本块（正式特性）**：多行字符串文字成为标准特性
- **隐藏类**：增强动态语言支持
- **ZGC改进**：低延迟垃圾回收器成为生产特性

```java
// 文本块示例
String json = """
    {
        "name": "John Doe",
        "age": 30,
        "email": "john.doe@example.com"
    }
    """;
```

## JDK 14 (2020年3月发布)

### 主要特性

- **Record类（预览）**：简化数据类定义
- **模式匹配instanceof（预览）**：简化类型检查和转换
- **有用的NullPointerExceptions**：提供更详细的空指针错误信息
- **Switch表达式（标准）**：正式定稿switch表达式

```java
// Switch表达式示例
int day = 3;
String dayName = switch (day) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3 -> "Wednesday";
    case 4 -> "Thursday";
    case 5 -> "Friday";
    default -> "Weekend";
};

// 模式匹配instanceof示例
if (obj instanceof String s) {
    System.out.println(s.toUpperCase());
}
```

## JDK 13 (2019年9月发布)

### 主要特性

- **文本块（预览）**：引入多行字符串文字
- **Switch表达式（第二次预览）**：继续改进switch表达式
- **动态CDS归档**：提高启动时间和内存效率
- **ZGC改进**：增强Z垃圾收集器，减少暂停时间

```java
// 文本块预览示例
String html = """
    <html>
        <body>
            <p>Hello, World!</p>
        </body>
    </html>
    """;
```

## JDK 12 (2019年3月发布)

### 主要特性

- **Switch表达式（预览）**：增强switch语句，使其可以作为表达式使用
- **Shenandoah垃圾收集器（实验性）**：低暂停时间垃圾收集器
- **JVM常量API**：增强的常量处理

```java
// Switch表达式预览示例
int num = 2;
String result = switch (num) {
    case 1 -> "One";
    case 2 -> "Two";
    default -> "Other";
};
```

## JDK 11 (2018年9月发布) - LTS

### 核心升级

- **HTTP客户端API（标准化）**：提供标准的HTTP客户端，支持HTTP/2和WebSocket
- **局部变量类型推断扩展**：Lambda表达式中使用var关键字
- **新的垃圾收集器**：ZGC和Epsilon垃圾收集器
- **单文件源代码执行**：直接运行Java源代码文件

```java
// HTTP客户端示例
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://example.com"))
        .build();
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());

// 单文件执行示例
// 可以直接运行: java HelloWorld.java
```

### 重大变革

移除 Java EE 和 CORBA 模块，促生 Jakarta EE 生态。

## JDK 10 (2018年3月发布)

### 主要特性

- **局部变量类型推断**：引入var关键字，简化类型声明
- **应用类数据共享**：改进启动时间和内存占用
- **并行全垃圾回收器**：改善G1垃圾回收器性能

```java
// 局部变量类型推断示例
var list = new ArrayList<String>(); // 推断为ArrayList<String>
var stream = list.stream();         // 推断为Stream<String>
```

## JDK 9 (2017年9月发布)

### 革命性特性

- **模块系统（Project Jigsaw）**：将Java代码组织成模块，提高可维护性和安全性
- **JShell**：交互式Java REPL工具
- **接口私有方法**：允许在接口中定义私有方法
- **改进的流API**：添加新的流操作
- **HTTP/2客户端（孵化器）**：支持HTTP/2协议

```java
// 模块系统示例
// module-info.java
module com.example.myapp {
    requires java.base;
    requires java.sql;
    exports com.example.myapp.api;
}

// JShell示例
// 直接在命令行输入: jshell
// > System.out.println("Hello JShell!")
```

## JDK 8 (2014年3月发布) - LTS

### 革命性特性

- **Lambda表达式**：提供函数式编程能力
- **Stream API**：声明式集合处理
- **新的日期时间API**：java.time包，替代旧的Date和Calendar
- **接口默认方法**：允许在接口中定义默认实现
- **Optional类**：避免空指针异常

```java
// Lambda表达式和Stream API示例
List<String> names = Arrays.asList("John", "Jane", "Jack", "Jill");

// 使用Lambda表达式
names.forEach(name -> System.out.println(name));

// 使用Stream API
List<String> filtered = names.stream()
    .filter(name -> name.startsWith("J"))
    .map(String::toUpperCase)
    .collect(Collectors.toList());

// 新的日期时间API示例
LocalDate today = LocalDate.now();
LocalDate tomorrow = today.plusDays(1);
LocalTime now = LocalTime.now();
LocalDateTime current = LocalDateTime.now();

// Optional示例
Optional<String> optional = Optional.ofNullable(getName());
String result = optional.orElse("Default");
```

## JDK 7 (2011年7月发布)

### 主要特性

- **try-with-resources**：自动资源管理，减少finally块的使用
- **钻石操作符**：简化泛型实例化
- **多异常捕获**：单个catch块可以捕获多种异常
- **NIO.2**：改进的文件系统API
- **Switch支持字符串**：switch语句支持String类型

```java
// try-with-resources示例
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    e.printStackTrace();
}

// 钻石操作符示例
List<String> list = new ArrayList<>(); // 无需重复类型参数

// 多异常捕获示例
try {
    // 可能抛出多种异常的代码
} catch (IOException | SQLException e) {
    e.printStackTrace();
}
```

## JDK 6 (2006年12月发布)

### 主要特性

- **脚本语言支持**：通过JSR 223 API集成脚本语言
- **JDBC 4.0**：简化数据库连接和元数据处理
- **编译器API**：javax.tools包提供编译器功能
- **改进的监控和管理工具**：包括VisualVM

```java
// 脚本语言支持示例
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");
Object result = engine.eval("function add(a, b) { return a + b; } add(1, 2);");
```

## JDK 5 (2004年9月发布)

### 革命性特性

- **泛型**：提供编译时类型安全的集合
- **注解**：支持元数据，可用于编译时或运行时处理
- **自动装箱/拆箱**：自动在基本类型和包装类型之间转换
- **枚举**：类型安全的枚举
- **可变参数**：简化方法参数传递
- **增强的for循环**：简化数组和集合的遍历

```java
// 泛型示例
List<String> list = new ArrayList<String>();
list.add("Hello");
// list.add(1); // 编译错误

// 注解示例
@Override
public String toString() {
    return "Example";
}

// 枚举示例
enum Day {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

// 可变参数示例
public static int sum(int... numbers) {
    int result = 0;
    for (int num : numbers) {
        result += num;
    }
    return result;
}

// 自动装箱/拆箱示例
Integer integer = 10; // 自动装箱
int i = integer;      // 自动拆箱
```

## JDK 1.4 (2002年2月发布)

### 主要特性

- **断言**：引入断言机制
- **正则表达式**：java.util.regex包提供正则支持
- **NIO**：新的输入/输出库，非阻塞I/O操作
- **日志API**：java.util.logging包

```java
// 断言示例
public class AssertionExample {
    public static void main(String[] args) {
        int num = 10;
        assert num > 5 : "Number should be greater than 5";
    }
}

// 正则表达式示例
Pattern pattern = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
Matcher matcher = pattern.matcher("email@example.com");
boolean isMatch = matcher.matches();
```

## JDK 1.3 (2000年5月发布)

### 主要特性

- **HotSpot JVM**：成为默认JVM，提升性能
- **RMI/IIOP组合**：支持RMI over IIOP
- **Java命名和目录接口(JNDI)**：访问命名和目录服务
- **动态代理**：运行时创建代理类

```java
// 动态代理示例
interface Interface {
    void doSomething();
}

class RealObject implements Interface {
    public void doSomething() {
        System.out.println("Doing something");
    }
}

class DynamicProxyHandler implements InvocationHandler {
    private Object realObject;

    public DynamicProxyHandler(Object realObject) {
        this.realObject = realObject;
    }

    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("Before method call");
        Object result = method.invoke(realObject, args);
        System.out.println("After method call");
        return result;
    }
}

Interface proxy = (Interface) Proxy.newProxyInstance(
    Interface.class.getClassLoader(),
    new Class[] { Interface.class },
    new DynamicProxyHandler(new RealObject())
);
proxy.doSomething();
```

## JDK 1.2 (1998年12月发布)

### 主要特性

- **Swing GUI库**：丰富的图形用户界面组件
- **集合框架**：java.util包中的集合类（ArrayList、HashMap等）
- **JIT编译器**：提升运行时性能
- **Java插件**：在浏览器中运行Java小程序

```java
// 集合框架示例
List<String> list = new ArrayList<>();
list.add("Item 1");
list.add("Item 2");

Map<String, Integer> map = new HashMap<>();
map.put("Key 1", 1);
map.put("Key 2", 2);
```

## JDK 1.1 (1997年2月发布)

### 主要特性

- **内部类**：支持内部类和匿名类
- **反射API**：运行时获取类信息并操作类成员
- **JavaBeans**：组件模型
- **JDBC**：Java数据库连接
- **RMI**：远程方法调用

```java
// 内部类示例
class Outer {
    private String outerField = "Outer field";

    class Inner {
        void accessOuter() {
            System.out.println(outerField); // 可以访问外部类的字段
        }
    }
}

// 反射示例
Class<?> clazz = Class.forName("java.lang.String");
Method[] methods = clazz.getMethods();
for (Method method : methods) {
    System.out.println(method.getName());
}
```

## JDK 1.0 (1996年1月发布)

### 初始特性

- **基本的面向对象编程支持**：类、对象、继承、封装等概念
- **核心类库**：java.lang（Object、String等）、java.io（输入输出）
- **基本语言特性**：多线程、异常处理
- **Java小程序支持**：可在浏览器中运行

```java
// 早期的Java代码示例
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");

        // 基本的面向对象
        Animal animal = new Dog();
        animal.makeSound();
    }
}

class Animal {
    public void makeSound() {
        System.out.println("Some sound");
    }
}

class Dog extends Animal {
    public void makeSound() {
        System.out.println("Bark");
    }
}
```

## 总结与建议

### 生产环境选型指南

| 场景                      | 推荐版本 | 关键依据            |
| ------------------------- | -------- | ------------------- |
| 传统金融/政府系统         | JDK 11   | 平衡稳定性和新特性  |
| 新建微服务/云原生         | JDK 21   | 虚拟线程极致性能    |
| 安卓开发（非Android SDK） | JDK 17   | GraalVM原生编译兼容 |
| 遗留系统维护              | JDK 8    | 兼容性优先          |

### 升级避坑提示

- **从JDK 8升级到11**：需检查`sun.misc.*`等内部API的使用
- **模块化应用（JPMS）**：从JDK 9开始强制分包隔离
- **安全管理器**：在JDK 24被禁用，需迁移至Java平台安全机制

### Java未来趋势

1. **性能边界突破**：Valhalla项目（值类型）预计提升数值计算性能50%+
2. **云原生与AI融合**：GraalVM原生镜像冷启动时间压缩至毫秒级
3. **新兴技术布局**：量子计算接口和WebAssembly扩展

Java历经近30年发展，通过持续的语言简化、性能革命和安全升级，保持了在企业级开发中的核心地位。开发者应关注Valhalla项目和结构化并发等前沿特性，以最大化技术红利。

> **致开发者**：每一次JDK升级都是技术债的偿还与能力的跃迁。当你在JDK 8的Lambda中初尝函数式之美，在JDK 21的虚拟线程里见证并发蜕变——那正是Java历经三十年仍屹立潮头的答案。
