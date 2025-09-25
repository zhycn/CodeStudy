---
title: Spring SpEL 表达式语言详解与最佳实践
description: 了解 Spring 框架的 SpEL 表达式语言，包括核心语法、功能、应用场景、性能优化等。
author: zhycn
---

# Spring SpEL 表达式语言详解与最佳实践

- SpEL 官方文档：[Spring Expression Language (SpEL)](https://docs.spring.io/spring-framework/reference/core/expressions.html)

## 1 SpEL 概述

Spring 表达式语言（SpEL）是 Spring 框架中一种**强大的表达式语言**，它在运行时提供对对象图的**查询和操作能力**。SpEL 最初创建是为了支持 Spring 社区的需求，与 Spring 生态系统深度集成，但也可以独立于 Spring 容器使用。SpEL 的语法类似于 Unified EL，但提供了更多特性，包括**方法调用**、**基本字符串模板功能**和**属性访问**等高级功能。

SpEL 不仅在 Spring 框架内部广泛使用，还直接暴露给 Spring 开发者用于配置和编程。与其他表达式语言相比，SpEL 的独特之处在于它支持**基于 bean 的运行时查询操作**、**复杂的条件逻辑**以及**类型安全**的操作。这些特性使得 SpEL 成为 Spring 应用程序开发中不可或缺的工具。

SpEL 的设计目标是提供一个**功能丰富**、**性能优异**且**易于集成**的表达式语言解决方案。它能够简化代码逻辑，减少冗余代码，提高应用程序的可维护性和灵活性。通过 SpEL，开发者可以将一些业务逻辑外化到配置文件中，实现更灵活的应用行为控制。

## 2 核心语法与功能

### 2.1 基本表达式语法

SpEL 表达式使用 `#{ }` 标记作为分隔符，提示 Spring 框架内部的处理机制这是需要解析的表达式内容。这种明确的分隔符设计使得 SpEL 表达式可以轻松地与普通文本混合使用，而不会引起解析歧义。

```java
// 字面量表达式示例
ExpressionParser parser = new SpelExpressionParser();
Expression exp = parser.parseExpression("'Hello World'");
String message = (String) exp.getValue(); // "Hello World"

// 方法调用示例
exp = parser.parseExpression("'Hello World'.concat('!')");
message = (String) exp.getValue(); // "Hello World!"
```

SpEL 支持多种类型的字面量表达式，包括**字符串**、**数字**、**布尔值**和 **null** 值。数字表达式支持整数、浮点数、科学计数法表示；字符串可以使用单引号或双引号作为界定符，这使得在表达式中嵌入字符串变得更加灵活。

### 2.2 属性访问与方法调用

SpEL 使用点号(`.`)操作符表示属性或方法引用，支持**层次化调用**，可以遍历复杂的对象图结构。这种语法与 Java 语言中的属性访问语法相似，降低了学习成本。

```java
// 属性访问示例
Inventor tesla = new Inventor("Nikola Tesla", new Date(), "Serbian");
Expression exp = parser.parseExpression("name");
String name = exp.getValue(tesla, String.class); // "Nikola Tesla"

// 方法调用示例
exp = parser.parseExpression("'abc'.substring(0, 2)");
String substr = exp.getValue(String.class); // "ab"

// 安全导航操作符示例
exp = parser.parseExpression("company?.name");
Object value = exp.getValue(employee); // 避免company为null时的空指针异常
```

SpEL 的**安全导航操作符** (`?.`) 是处理空引用的重要工具。当左侧对象为 `null` 时，表达式不会抛出异常，而是直接返回 `null`。这个特性特别适合处理深层次对象图访问，可以替代繁琐的 `null` 检查代码。

### 2.3 类型操作与构造函数

SpEL 使用 `T()` 运算符调用**类作用域的方法**和**常量**，这个运算符能够访问类的静态成员和静态方法。此外，SpEL 还支持使用 `new` 关键字调用构造函数实例化对象。

```java
// 类表达式示例
@Value("#{T(java.lang.Math).PI}")
private double pi;

@Value("#{T(java.lang.Math).random()}")
private double random;

// 构造函数调用示例
Expression exp = parser.parseExpression("new String('hello world').toUpperCase()");
String result = exp.getValue(String.class); // "HELLO WORLD"
```

`T()` 运算符的参数必须是类的全限定名（java.lang 包除外）。SpEL 内部使用 StandardTypeLocator 来解析类型，默认已经注册了 java.lang 包，因此可以直接使用类似 `T(Math)` 的简短形式。

### 2.4 操作符详解

SpEL 支持丰富的操作符，包括**算术运算符**、**关系运算符**、**逻辑运算符**、**条件运算符**和其他特殊运算符，这些操作符的功能和 Java 语言中的对应操作符类似。

```java
// 算术运算符示例
Expression exp = parser.parseExpression("6 + 2");
Integer result = exp.getValue(Integer.class); // 8

// 关系运算符示例
exp = parser.parseExpression("age > 18");
Boolean isAdult = exp.getValue(person, Boolean.class); // true或false

// 三元运算符示例
exp = parser.parseExpression("age > 18 ? '成年' : '未成年'");
String category = exp.getValue(person, String.class);

// Elvis运算符示例（简化三元运算符）
exp = parser.parseExpression("name ?: '未知'");
String displayName = exp.getValue(person, String.class);
```

**Elvis 操作符** (?:) 是 SpEL 对三元运算符的特殊简化形式，常用于提供默认值。当左侧表达式结果为 `null` 时，返回右侧的默认值。这个操作符得名于它的形状类似猫王的发型，能够显著简化空值检查的代码。

### 2.5 集合操作

SpEL 提供了强大的**集合操作**能力，可以访问和操作数组、List、Map等集合类型。SpEL 使用方括号(`[]`)来访问集合元素，支持通过索引访问数组和 List 元素，通过键访问 Map 元素。

```java
// 集合访问示例
@Value("#{${employee.age}}")
private Map<String, Integer> employeeAge;

@Value("#{${employee.age}.two}")
private String employeeAgeTwo;

// 集合投影与筛选示例
List<User> users = Arrays.asList(new User("张三", 20), new User("李四", 16));
List<String> adultNames = parser.parseExpression("?[age >= 18].![name]")
                               .getValue(users, List.class); // ["张三"]
```

SpEL 的**集合投影**(`.![ ]`)和**集合筛选**(`.?[ ]`)功能特别强大，可以类似 SQL 查询一样操作集合。投影操作从集合中每个元素提取特定属性组成新集合；筛选操作根据条件表达式过滤集合元素，返回满足条件的子集。

_表：SpEL 集合操作符总结_

| **操作符** | **示例**            | **描述**                   |
| ---------- | ------------------- | -------------------------- |
| `[]`       | `list[0]`           | 访问数组、List 或 Map 元素 |
| `.?![]]`   | `users.?[age > 18]` | 筛选满足条件的元素         |
| `.![ ]`    | `users.![name]`     | 投影提取特定属性           |
| `^[]`      | `users.^[age > 18]` | 获取第一个匹配元素         |
| `$[]`      | `users.$[age > 18]` | 获取最后一个匹配元素       |

## 3 在 Spring 中的应用

### 3.1 Bean 配置与依赖注入

SpEL 表达式在 Spring 的 Bean 配置中发挥着重要作用，可以在 XML 或 Java 配置中使用 SpEL 表达式实现**动态装配**。这种能力使得 Bean 的配置不再局限于静态值，可以根据系统环境、其他 Bean 的属性或复杂计算逻辑动态决定注入值。

```xml
<!-- XML 配置中使用 SpEL -->
<bean id="numberGuess" class="org.spring.samples.NumberGuess">
    <property name="randomNumber" value="#{ T(java.lang.Math).random() * 100.0 }"/>
</bean>

<bean id="shapeGuess" class="org.spring.samples.ShapeGuess">
    <property name="initialShapeSeed" value="#{ numberGuess.randomNumber }"/>
</bean>
```

在 Java 配置中，SpEL 与 `@Value` 注解结合使用，能够将表达式结果直接注入到 Bean 属性中。`@Value` 注解可以应用于字段、构造函数参数和方法参数，提供了极大的灵活性。

```java
// 使用@Value注解读取配置和系统属性
public class FieldValueTestBean {
    @Value("#{ systemProperties['user.region'] }")
    private String defaultLocale;

    @Value("#{'${employee.names}'.split(',')}")
    private List<String> employeeNames;

    @Value("#{'${employee.names}'.split(',')[0]}")
    private String firstEmployeeName;

    @Value("#{${employee.age}['five'] ?: 31}")
    private Integer ageWithDefaultValue;

    public void setDefaultLocale(String defaultLocale) {
        this.defaultLocale = defaultLocale;
    }
}
```

### 3.2 注解驱动开发

在现代 Spring 应用程序中，**注解驱动**的开发模式已经成为主流。SpEL 与各种 Spring 注解结合使用，提供了强大的元编程能力。除了常用的 `@Value` 注解，SpEL 还可以与 `@Conditional`、`@PreAuthorize`、`@Cacheable` 等注解配合使用，实现条件化配置、安全控制和缓存管理等功能。

```java
// Spring Security中使用SpEL进行权限控制
@PostMapping("/create")
@PreAuthorize("hasAnyRole('MANAGING_DIRECTOR','OPERATIONS_MANAGER','PROJECT_MANAGER')")
public ResponseEntity<APIResponse> createProject(@Valid @RequestBody ProjectCreationRequest request) {
    // 方法实现
}

// 自定义安全注解
@Target({ElementType.METHOD,ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize(value = "hasAnyRole({roles})")
public @interface HasAnyRole {
    String[] roles();
}
```

通过**自定义注解**与 SpEL 结合，可以创建领域特定的语言(DSL)，进一步简化应用程序代码。这种模式在 Spring Security 中尤为常见，开发者可以定义符合业务需求的安全注解，使安全规则更加清晰和易于维护。

### 3.3 Spring Security 集成

SpEL 表达式在 Spring Security 中扮演着关键角色，用于定义**动态权限规则**和**访问控制策略**。通过在安全配置中使用 SpEL 表达式，可以根据认证用户的属性、请求参数、系统状态等复杂条件决定访问权限。

```xml
<!-- 在Spring Security配置中使用SpEL -->
<security:http>
    <security:intercept-url pattern="/admin/**"
        access="hasRole('ADMIN') and #{@permissionService.checkIp()}"/>
</security:http>
```

Spring Security 提供了一系列内置的安全表达式，如 `hasRole()`、`hasAuthority()`、`isAuthenticated()` 等，这些表达式可以直接在 SpEL 中使用。同时，开发者还可以通过方法调用引用自定义的安全检查逻辑，实现高度灵活的安全控制。

```java
// 方法级安全控制
@Service
public class BankService {
    @PreAuthorize("isAuthenticated() and (#account.balance >= #amount)")
    public void withdraw(Account account, Double amount) {
        // 提现逻辑
    }
}
```

### 3.4 数据绑定与验证

SpEL 表达式在 Spring MVC 的**数据绑定**和**验证**过程中也发挥着重要作用。通过 SpEL 表达式，可以将 HTTP 请求参数动态绑定到模型属性，或者根据复杂条件执行验证逻辑。

```java
// 数据绑定中使用SpEL
@PostMapping("/submit")
public String submit(@RequestParam("#{user.email}") String email) {
    // 自动绑定user对象的email属性
}

// 动态验证逻辑
public class UserValidator implements Validator {
    public boolean supports(Class<?> clazz) {
        return User.class.isAssignableFrom(clazz);
    }

    public void validate(Object target, Errors errors) {
        ValidationUtils.rejectIfEmpty(errors, "name", "name.empty");
        User user = (User) target;

        if (user.getAge() != null && user.getAge() < 18) {
            errors.rejectValue("age", "age.under.18",
                "年龄必须大于18岁");
        }
    }
}
```

SpEL 表达式在数据绑定中可以引用模型中的其他属性，实现属性之间的动态关联。这种能力在处理复杂表单时特别有用，可以根据用户输入动态改变其他字段的行为或验证规则。

## 4 高级特性与技巧

### 4.1 集合操作与聚合

SpEL 表达式提供了丰富的**集合操作**功能，包括过滤、投影、聚合计算等高级特性。这些功能大大简化了对集合数据的处理，减少了 Java 代码中的循环和条件判断逻辑。

```java
// 集合投影示例：提取用户姓名列表
List<User> users = Arrays.asList(
    new User("张三", 20),
    new User("李四", 16)
);
List<String> names = parser.parseExpression("![name]")
                         .getValue(users, List.class); // ["张三", "李四"]

// 集合筛选示例：过滤未成年用户
List<User> adults = parser.parseExpression("?[age >= 18]")
                         .getValue(users, List.class); // [User("张三", 20)]

// 聚合计算示例：计算平均年龄
Double averageAge = parser.parseExpression("![age].average()")
                         .getValue(users, Double.class);
```

SpEL 表达式的集合操作符可以链式组合，实现复杂的数据处理逻辑。例如，可以先过滤集合，然后对结果进行投影，最后执行聚合计算。这种链式操作类似于 Java Stream API，但可以在表达式语言中实现。

_表：SpEL 集合操作符功能示例_

| **操作类型** | **表达式示例**       | **功能描述**                   |
| ------------ | -------------------- | ------------------------------ |
| 投影         | `users.![name]`      | 提取所有用户 name 属性         |
| 筛选         | `users.?[age > 18]`  | 筛选年龄大于 18 的用户         |
| 首元素匹配   | `users.^[age > 18]`  | 获取第一个年龄大于 18 的用户   |
| 尾元素匹配   | `users.$[age > 18]`  | 获取最后一个年龄大于 18 的用户 |
| 聚合计算     | `users.![age].sum()` | 计算所有用户年龄总和           |

### 4.2 模板表达式

SpEL 表达式支持**模板表达式**，允许将字面文本与一个或多个计算块混合使用。计算块由`#{ }`分隔符定义，可以在文本中嵌入动态内容。这个特性特别适合生成动态字符串消息或模板。

```java
// 模板表达式示例
ExpressionParser parser = new SpelExpressionParser();
String randomPhrase = parser.parseExpression(
    "随机数字是：#{T(java.lang.Math).random()}",
    new TemplateParserContext()
).getValue(String.class); // "随机数字是：0.7038184675"

// 复杂模板示例
String message = parser.parseExpression(
    "欢迎您，#{user.name}！您当前有#{user.messageCount}条未读消息。",
    new TemplateParserContext()
).getValue(userContext, String.class);
```

模板表达式通过`TemplateParserContext`解析，该上下文定义了表达式前缀和后缀（默认都是`#`）。开发者可以自定义这些分隔符，以适应不同的模板需求。

### 4.3 变量与函数

SpEL 表达式允许在表达式中使用**变量**和**自定义函数**，这大大增强了表达式的灵活性和复用性。变量可以通过 EvaluationContext 设置，并在表达式中通过 `#variableName` 语法引用。

```java
// 变量使用示例
StandardEvaluationContext context = new StandardEvaluationContext();
context.setVariable("x", 10);
context.setVariable("y", 20);

Expression exp = parser.parseExpression("#x + #y");
int sum = exp.getValue(context, Integer.class);  // 30

// 自定义函数示例
public abstract class StringUtils {
    public static String reverseString(String input) {
        StringBuilder backwards = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            backwards.append(input.charAt(input.length() - 1 - i));
        }
        return backwards.toString();
    }
}

context.registerFunction("reverse",
    StringUtils.class.getDeclaredMethod("reverseString", String.class));

exp = parser.parseExpression("#reverse('hello')");
String result = exp.getValue(context, String.class); // "olleh"
```

除了自定义变量和函数，SpEL 表达式还提供了一些**预定义变量**，如`systemProperties`和`systemEnvironment`，用于访问系统属性和环境变量。这些预定义变量在表达式中有用，特别是在访问运行时环境信息时。

```java
// 访问系统属性
@Value("#{ systemProperties['java.home'] }")
private String javaHome;

@Value("#{ systemProperties['user.dir'] }")
private String userDir;

// 访问环境变量
@Value("#{ systemEnvironment['PATH'] }")
private String path;
```

### 4.4 类型转换与操作

SpEL 表达式提供了强大的**类型转换**机制，能够在表达式求值过程中自动转换类型不匹配的数据。这个机制基于 Spring 的 ConversionService，支持大多数常见的类型转换，同时也允许注册自定义转换器。

```java
// 自动类型转换示例
public class GenericConvertExample {
    public List<Integer> nums = new ArrayList<>();

    public static void main(String[] args) {
        GenericConvertExample example = new GenericConvertExample();
        example.nums.add(1);

        StandardEvaluationContext context = new StandardEvaluationContext(example);
        ExpressionParser parser = new SpelExpressionParser();

        String expression = "nums[0]";
        // 自动将String转换为Integer类型
        parser.parseExpression(expression).setValue(context, "2");
        System.out.println("nums:" + example.nums); // [2]
    }
}
```

当 SpEL 表达式遇到类型不匹配时，它会尝试使用 ConversionService 进行适当的转换。如果找不到合适的转换器，会抛出 ConversionException。开发者可以通过实现 Converter 接口并注册到 ConversionService 来扩展类型转换能力。

## 5 性能优化与最佳实践

### 5.1 SpEL 性能优化

虽然 SpEL 表达式提供了极大的灵活性，但不当使用可能导致**性能问题**。对于高频调用的表达式，需要考虑性能优化策略，确保应用程序的响应速度和吞吐量。

**SpEL 编译器(SpelCompiler)**是提高性能的关键工具。SpelCompiler 可以将表达式编译成 Java 字节码，避免每次表达式求值时都进行解析和解释。这个机制特别适合那些被频繁调用且不经常变化的表达式。

```java
// 启用 SpEL 编译器
SpelParserConfiguration config = new SpelParserConfiguration(
    SpelCompilerMode.IMMEDIATE, // 立即编译模式
    this.getClass().getClassLoader()
);

ExpressionParser parser = new SpelExpressionParser(config);
Expression expression = parser.parseExpression("age > 18 ? '成年' : '未成年'");

// 第一次求值会编译表达式
String result1 = expression.getValue(user1, String.class);

// 后续求值直接使用编译后的字节码，性能大幅提升
String result2 = expression.getValue(user2, String.class);
```

**SpEL 编译器(SpelCompiler)**支持三种编译模式：

- **OFF**：关闭编译，所有表达式在每次求值时解释执行
- **IMMEDIATE**：立即编译，表达式在第一次求值时就被编译
- **MIXED**：混合模式，表达式开始时解释执行，达到一定调用次数后自动编译

除了使用编译器外，还有其他性能优化策略：

- **缓存 SpEL Expression 对象**：避免重复解析相同的表达式字符串
- **重用 EvaluationContext**：尽可能重用已创建的 EvaluationContext 实例
- **避免复杂表达式循环计算**：将循环逻辑移至 Java 代码中，而非表达式内

### 5.2 空安全处理最佳实践

在 SpEL 表达式中，**空引用处理**是常见且容易出错的问题。不当的空引用处理会导致 SpelEvaluationException 异常，影响程序稳定性。SpEL 提供了多种机制来处理空引用，开发者应根据具体场景选择合适的方法。

```java
// 安全导航操作符示例
String expression = "#name == 'joy' || #age > 10 || #ab?.type == 1 || #a == 10";

// Elvis操作符提供默认值
@Value("#{${employee.age}['five'] ?: 31}")
private Integer ageWithDefaultValue;

// 预检查空值的安全表达式
String safeExpression = "(#name != null && #name == 'joy') || " +
                       "(#age != null && #age > 10) || " +
                       "(#ab?.type != null && #ab?.type == 1) || " +
                       "(#a != null && #a == 10)";
```

**安全导航操作符**(?.)是处理潜在空引用的首选工具。当左侧对象为 null 时，表达式不会继续评估右侧的属性或方法访问，而是直接返回 null。这个特性可以避免繁琐的 null 检查，保持表达式的简洁性。

**Elvis 操作符**(?:)为可能为 null 的表达式提供默认值，常用于配置注入场景。当左侧表达式结果为 null 时，返回右侧的默认值，确保属性总是有一个合理的值。

对于特别关键的应用场景，可以采用**防御式表达式设计**，即在表达式开始处显式检查关键变量的存在性。虽然这种方法会使表达式变得冗长，但提供了最高的可靠性。

### 5.3 异常处理与调试

**SpEL 表达式的调试和异常处理**是开发过程中的重要环节。由于表达式在运行时求值，错误可能直到执行时才被发现，因此需要有良好的策略来处理和预防错误。

当表达式求值失败时，**SpEL 会抛出 SpelEvaluationException 异常**。这个异常包含了详细的错误信息，包括错误位置和原因。为了便于调试，可以启用更详细的日志记录，或者使用 Expression 接口的 getValue 方法的重载版本，它允许传递一个默认值，在表达式求值失败时返回该默认值。

```java
// 异常处理示例
try {
    Expression exp = parser.parseExpression(expressionString);
    Object value = exp.getValue(context);
} catch (SpelEvaluationException ex) {
    logger.error("SpEL表达式求值失败: " + expressionString, ex);
    // 处理异常或使用默认值
}

// 使用默认值避免异常
Object value = exp.getValue(context, null); // 返回null当求值失败
Object valueWithDefault = exp.getValue(context, null, "defaultValue");
```

为了改进 **SpEL 表达式的可调试性**，可以考虑以下实践：

- 将复杂表达式分解为多个简单表达式
- 使用描述性的变量名代替魔法数值
- 在表达式中添加注释（虽然 SpEL 不支持注释，但可以通过拼接字符串方式实现）
- 编写单元测试验证重要表达式的正确性

### 5.4 安全最佳实践

在使用 SpEL 时，**安全考虑**是至关重要的，特别是在处理用户输入或不可信数据时。不当的 SpEL 使用可能导致表达式注入攻击，类似于 SQL 注入的安全风险。

**永远不要将用户输入直接作为表达式执行**是最基本的安全原则。如果需要根据用户输入动态构建表达式，应该使用参数化表达式，而不是字符串拼接。

```java
// 不安全的做法：直接拼接用户输入
String userInput = "name == '" + userName + "'";
Expression exp = parser.parseExpression(userInput); // 可能遭受表达式注入攻击

// 安全的做法：使用参数化表达式
Expression exp = parser.parseExpression("name == ?");
exp.getValue(context, userName); // 安全地将用户输入作为参数
```

对于高度敏感的应用，可以考虑使用 **SimpleEvaluationContext** 代替 StandardEvaluationContext。SimpleEvaluationContext 限制了表达式的功能，只允许访问有限的属性和方法，从而减少了潜在的安全风险。

```java
// 使用受限的EvaluationContext
SimpleEvaluationContext simpleContext = SimpleEvaluationContext.forReadOnlyDataBinding().build();
Expression exp = parser.parseExpression("name");
String name = exp.getValue(simpleContext, user, String.class); // 只能访问基本属性
```

此外，定期**审计和审查**应用程序中的 **SpEL 表达式**也是重要的安全实践。特别关注那些动态构建的表达式，确保它们不会引入安全漏洞。

## 6 总结与展望

Spring 表达式语言 (SpEL) 是 Spring 生态系统中的一个强大工具，提供了丰富的功能和灵活的语法。通过 SpEL，开发者可以在运行时动态查询和操作对象图，实现高度灵活和可配置的应用程序。

在本文中，我们全面探讨了 SpEL 的**核心语法**、**高级特性**以及**最佳实践**。从基本的表达式求值到复杂的集合操作，从简单的属性注入到动态安全规则，SpEL 都能提供优雅的解决方案。同时，我们也讨论了性能优化策略和安全考虑，帮助开发者避免常见陷阱。

随着 Spring 框架的不断发展，SpEL 也在持续演进。未来的版本可能会提供**更好的性能**、**更丰富的功能**以及**更强大的工具支持**。对于 Spring 开发者而言，掌握 SpEL 的使用和最佳实践，将有助于构建更加灵活、可维护和高效的应用程序。

无论你是刚刚开始学习 SpEL，还是已经有一定经验的开发者，都建议在实践中不断探索和尝试 SpEL 的各种特性。同时，参考官方文档和社区资源，保持对 SpEL 新功能和最佳实践的了解，将有助于充分发挥 SpEL 在项目中的潜力。
