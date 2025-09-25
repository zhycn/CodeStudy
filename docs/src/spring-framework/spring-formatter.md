---
title: Spring Formatter 格式化器详解与最佳实践
description: 了解 Spring Formatter 格式化器的核心概念、常用工具类和最佳实践，帮助您在 Spring 应用程序中高效地处理数据格式化操作。
author: zhycn
---

# Spring Formatter 格式化器详解与最佳实践

## 1. 概述

在 Spring 应用开发中，**数据格式化**（Data Formatting）是一个至关重要的环节，特别是在 Web 应用中处理前端与后端之间的数据交互时。Spring 从 3.0 版本开始引入了**格式化框架**，位于 `org.springframework.format` 包中，其核心接口 `Formatter` 专门用于解决对象与字符串之间的转换问题。

与传统的 `Converter` 接口不同，`Converter` 主要完成任意 `Object` 与 `Object` 之间的类型转换，适合于任何一层；而 `Formatter` 则是专门为完成任意 `Object` 与 `String` 之间的类型转换而设计，更适用于 Web 层的数据转换。这是因为在 Web 应用中，HTTP 请求数据到控制器中都是以 `String` 类型获取的，需要进行格式化和解析操作。

## 2. Formatter 接口设计

### 2.1 核心接口分析

`Formatter` 接口本身继承了 `Printer` 和 `Parser` 两个核心接口：

```java
public interface Formatter<T> extends Printer<T>, Parser<T> {
}
```

**Printer 接口**负责将对象格式化为字符串显示：

```java
@FunctionalInterface
public interface Printer<T> {
    String print(T object, Locale locale);
}
```

**Parser 接口**负责将字符串解析为对象：

```java
@FunctionalInterface
public interface Parser<T> {
    T parse(String text, Locale locale) throws ParseException;
}
```

这种设计清晰地分离了**格式化和解析**这两个相反的功能，同时通过 `Locale` 参数支持国际化。

### 2.2 与 Converter 的对比

为了更好地理解 Formatter 的定位，下面是与 Converter 的对比表格：

| 特性         | Converter<S, T>       | Formatter\<T>         |
| ------------ | --------------------- | --------------------- |
| **转换方向** | 任意 Object 到 Object | Object 与 String 之间 |
| **适用场景** | 任意层                | 主要 Web 层           |
| **国际化**   | 不支持                | 支持（通过 Locale）   |
| **设计目的** | 通用类型转换          | 数据格式化与解析      |

## 3. Spring 内置 Formatter 实现

### 3.1 日期时间格式化

#### 3.1.1 DateFormatter

Spring 提供了 `DateFormatter` 用于处理 `java.util.Date` 类型的格式化：

```java
// 创建 DateFormatter 实例
DateFormatter dateFormatter = new DateFormatter();
dateFormatter.setIso(DateTimeFormat.ISO.DATE); // 设置 ISO 日期格式

// 格式化当前日期
String formattedDate = dateFormatter.print(new Date(), Locale.getDefault());
System.out.println("Formatted date: " + formattedDate);

// 解析字符串为日期
try {
    Date parsedDate = dateFormatter.parse("2023-03-15", Locale.getDefault());
    System.out.println("Parsed date: " + parsedDate);
} catch (ParseException e) {
    e.printStackTrace();
}
```

`DateFormatter` 支持多种配置选项：

- `pattern`：自定义格式模式（如 "yyyy-MM-dd HH:mm:ss"）
- `iso`：ISO 标准格式（如 `ISO.DATE`, `ISO.TIME`, `ISO.DATE_TIME`）
- `style`：日期风格（如 `DateFormat.DEFAULT`, `DateFormat.FULL`）
- `timeZone`：时区设置

#### 3.1.2 Java 8 日期时间支持

对于 Java 8 的日期时间 API（JSR 310），Spring 提供了 `DateTimeFormatterFactory` 进行集成：

```java
// 处理 Java 8 日期时间类型
DateTimeFormatterFactory formatterFactory = new DateTimeFormatterFactory();
formatterFactory.setPattern("yyyy-MM-dd HH:mm:ss");

// 格式化 LocalDateTime
LocalDateTime now = LocalDateTime.now();
String formatted = formatterFactory.createDateTimeFormatter().format(now);
System.out.println("Formatted LocalDateTime: " + formatted);

// 解析字符串为 LocalDateTime
LocalDateTime parsed = LocalDateTime.parse("2023-03-15 14:30:00",
    formatterFactory.createDateTimeFormatter());
```

Spring 为 JSR 310 中的各种类型提供了相应的支持：

- `InstantFormatter`：处理 `java.time.Instant`
- `LocalDateFormatter`：处理 `java.time.LocalDate`
- `LocalTimeFormatter`：处理 `java.time.LocalTime`
- `LocalDateTimeFormatter`：处理 `java.time.LocalDateTime`

### 3.2 数字格式化

Spring 提供了抽象类 `AbstractNumberFormatter` 及其具体实现来处理数字格式化。

#### 3.2.1 NumberStyleFormatter

用于通用数字格式化：

```java
NumberStyleFormatter formatter = new NumberStyleFormatter();
formatter.setPattern("#,##0.00");

// 格式化数字
double number = 12345.6789;
String formatted = formatter.print(number, Locale.CHINA);
System.out.println("Formatted number: " + formatted); // 输出：12,345.68

// 解析字符串为数字
Number parsed = formatter.parse("12,345.68", Locale.CHINA);
System.out.println("Parsed number: " + parsed.doubleValue());
```

#### 3.2.2 PercentStyleFormatter

用于百分比格式化：

```java
PercentStyleFormatter formatter = new PercentStyleFormatter();

// 格式化百分比
String formatted = formatter.print(0.125, Locale.CHINA);
System.out.println("Formatted percentage: " + formatted); // 输出：12%

// 解析百分比字符串
Number parsed = formatter.parse("12%", Locale.CHINA);
System.out.println("Parsed value: " + parsed.doubleValue()); // 输出：0.12
```

#### 3.2.3 CurrencyStyleFormatter

用于货币格式化：

```java
CurrencyStyleFormatter formatter = new CurrencyStyleFormatter();
formatter.setFractionDigits(2); // 设置小数位数
formatter.setRoundingMode(RoundingMode.HALF_UP); // 设置舍入模式
formatter.setCurrency(Currency.getInstance(Locale.US)); // 设置货币类型

// 格式化货币
String formatted = formatter.print(new BigDecimal("1234.56"), Locale.US);
System.out.println("Formatted currency: " + formatted); // 输出：$1,234.56

// 解析货币字符串
BigDecimal parsed = formatter.parse("$1,234.56", Locale.US);
```

## 4. 自定义 Formatter 实现

### 4.1 实现 Formatter 接口

以下是一个自定义日期格式化器示例：

```java
public class DateFormatter implements Formatter<Date> {
    private String datePattern = "yyyy-MM-dd";
    private SimpleDateFormat simpleDateFormat;

    @Override
    public String print(Date date, Locale locale) {
        return new SimpleDateFormat(datePattern).format(date);
    }

    @Override
    public Date parse(String source, Locale locale) throws ParseException {
        simpleDateFormat = new SimpleDateFormat(datePattern);
        return simpleDateFormat.parse(source);
    }

    // 可选：设置日期模式的方法
    public void setDatePattern(String datePattern) {
        this.datePattern = datePattern;
    }
}
```

### 4.2 复杂对象格式化示例

对于复杂对象，可以实现自定义的格式化逻辑：

```java
public class ProductFormatter implements Formatter<Product> {

    @Override
    public String print(Product product, Locale locale) {
        // 将 Product 对象格式化为 "名称,价格,数量" 的字符串格式
        return product.getName() + "," + product.getPrice() + "," + product.getQuantity();
    }

    @Override
    public Product parse(String text, Locale locale) throws ParseException {
        // 解析 "名称,价格,数量" 格式的字符串为 Product 对象
        try {
            String[] parts = text.split(",");
            if (parts.length != 3) {
                throw new ParseException("Product format should be: name,price,quantity", 0);
            }

            String name = parts[0];
            double price = Double.parseDouble(parts[1]);
            int quantity = Integer.parseInt(parts[2]);

            return new Product(name, price, quantity);
        } catch (NumberFormatException e) {
            throw new ParseException("Invalid number format", 0);
        }
    }
}
```

## 5. Formatter 的注册与配置

### 5.1 XML 配置方式

在 Spring MVC 配置文件中注册自定义格式化器：

```xml
<!-- 启用注解驱动，指定 conversion service -->
<mvc:annotation-driven conversion-service="conversionService" />

<!-- 配置格式化转换服务 -->
<bean id="conversionService"
      class="org.springframework.format.support.FormattingConversionServiceFactoryBean">
    <property name="formatters">
        <set>
            <!-- 注册自定义格式化器 -->
            <bean class="com.example.DateFormatter">
                <property name="datePattern" value="yyyy-MM-dd" />
            </bean>
            <bean class="com.example.ProductFormatter" />
        </set>
    </property>
</bean>
```

### 5.2 Java 配置方式

使用 `@Configuration` 注解的配置类：

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        // 注册自定义格式化器
        DateFormatter dateFormatter = new DateFormatter();
        dateFormatter.setDatePattern("yyyy-MM-dd");
        registry.addFormatter(dateFormatter);

        registry.addFormatter(new ProductFormatter());

        // 添加默认格式化器
        registry.addFormatterForFieldType(LocalDate.class,
            new TemporalAccessorFormatter(DateTimeFormatter.ISO_LOCAL_DATE));
    }

    @Bean
    public FormattingConversionService conversionService() {
        DefaultFormattingConversionService conversionService =
            new DefaultFormattingConversionService();

        // 注册格式化器
        conversionService.addFormatter(new DateFormatter());

        return conversionService;
    }
}
```

### 5.3 使用 FormatterRegistrar

对于更复杂的注册逻辑，可以使用 `FormatterRegistrar`：

```java
public class CustomFormatterRegistrar implements FormatterRegistrar {
    private DateFormatter dateFormatter;

    public CustomFormatterRegistrar(DateFormatter dateFormatter) {
        this.dateFormatter = dateFormatter;
    }

    @Override
    public void registerFormatters(FormatterRegistry registry) {
        registry.addFormatter(dateFormatter);
        // 注册其他格式化器...
    }
}
```

XML 配置中使用 `FormatterRegistrar`：

```xml
<bean id="conversionService"
      class="org.springframework.format.support.FormattingConversionServiceFactoryBean">
    <property name="formatterRegistrars">
        <set>
            <bean class="com.example.CustomFormatterRegistrar">
                <property name="dateFormatter" ref="dateFormatter" />
            </bean>
        </set>
    </property>
</bean>
```

## 6. 注解驱动的格式化

### 6.1 @DateTimeFormat 注解

`@DateTimeFormat` 注解用于格式化日期时间字段：

```java
public class User {
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date birthDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime lastLoginTime;

    @DateTimeFormat(style = "MM")
    private Calendar registrationDate;

    // getter 和 setter 方法
}
```

`@DateTimeFormat` 支持的主要属性：

- `pattern`：自定义模式（如 "yyyy-MM-dd HH:mm:ss"）
- `iso`：ISO 标准格式（`DATE`, `TIME`, `DATE_TIME`, `NONE`）
- `style`：样式字符串（如 "SS", "MM", "LL" 等）

### 6.2 @NumberFormat 注解

`@NumberFormat` 注解用于格式化数字字段：

```java
public class Product {
    @NumberFormat(pattern = "#,##0.00")
    private BigDecimal price;

    @NumberFormat(style = NumberFormat.Style.CURRENCY)
    private BigDecimal amount;

    @NumberFormat(style = NumberFormat.Style.PERCENT)
    private Double discount;

    // getter 和 setter 方法
}
```

`@NumberFormat` 支持的主要属性：

- `pattern`：自定义数字模式（如 "#,##0.00"）
- `style`：数字风格（`CURRENCY`, `NUMBER`, `PERCENT`）

### 6.3 注解配置原理

Spring 通过 `AnnotationFormatterFactory` 实现注解驱动的格式化。主要的实现类包括：

- `DateTimeFormatAnnotationFormatterFactory`：处理 `@DateTimeFormat` 注解
- `NumberFormatAnnotationFormatterFactory`：处理 `@NumberFormat` 注解

## 7. 高级特性与最佳实践

### 7.1 国际化支持

利用 `Locale` 实现多语言格式化：

```java
@Component
public class LocalizedFormatter {

    @Autowired
    private FormattingConversionService conversionService;

    public String formatProduct(Product product, Locale locale) {
        if (conversionService.canConvert(Product.class, String.class)) {
            return conversionService.convert(product, String.class,
                new FormatterContext(locale));
        }
        return product.toString();
    }

    public Product parseProduct(String text, Locale locale) {
        if (conversionService.canConvert(String.class, Product.class)) {
            return conversionService.convert(text, Product.class,
                new FormatterContext(locale));
        }
        throw new IllegalArgumentException("Cannot convert string to Product");
    }
}
```

### 7.2 错误处理与验证

结合 Spring Validation 进行格式化错误处理：

```java
public class User {
    @NotNull
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    @Past(message = "生日必须是过去日期")
    private Date birthday;

    // getter 和 setter 方法
}

@Controller
public class UserController {

    @PostMapping("/users")
    public String createUser(@Valid User user, BindingResult result) {
        if (result.hasErrors()) {
            // 处理验证错误，包括格式化错误
            for (FieldError error : result.getFieldErrors()) {
                if (error.contains(TypeMismatchException.class)) {
                    // 处理类型不匹配错误（包括格式化错误）
                    return "error/formatting-error";
                }
            }
            return "user/form";
        }

        // 保存用户
        return "redirect:/users/success";
    }
}
```

### 7.3 性能优化建议

1. **缓存 Formatter 实例**：避免频繁创建格式化器实例
2. **使用线程安全的格式化器**：如 `DateTimeFormatter` 是线程安全的
3. **合理使用静态格式化器**：对于简单场景，可使用静态方法

```java
@Component
public class EfficientDateFormatter implements Formatter<Date> {

    // 使用 ThreadLocal 避免 SimpleDateFormat 的线程安全问题
    private ThreadLocal<SimpleDateFormat> threadLocalDateFormat =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

    @Override
    public String print(Date date, Locale locale) {
        return threadLocalDateFormat.get().format(date);
    }

    @Override
    public Date parse(String text, Locale locale) throws ParseException {
        return threadLocalDateFormat.get().parse(text);
    }
}
```

### 7.4 测试策略

编写全面的格式化器测试：

```java
@SpringBootTest
class DateFormatterTest {

    @Autowired
    private FormattingConversionService conversionService;

    @Test
    void testDatePrinting() {
        Date date = Date.from(LocalDate.of(2023, 3, 15).atStartOfDay(ZoneId.systemDefault()).toInstant());
        String result = conversionService.convert(date, String.class);
        assertEquals("2023-03-15", result);
    }

    @Test
    void testDateParsing() {
        String dateString = "2023-03-15";
        Date result = conversionService.convert(dateString, Date.class);
        assertNotNull(result);

        LocalDate localDate = result.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        assertEquals(LocalDate.of(2023, 3, 15), localDate);
    }

    @Test
    void testInvalidDateParsing() {
        String invalidDateString = "invalid-date";
        assertThrows(ConversionFailedException.class, () -> {
            conversionService.convert(invalidDateString, Date.class);
        });
    }
}
```

## 8. 常见问题与解决方案

### 8.1 日期时区问题

**问题**：日期格式化时出现时区偏差。

**解决方案**：明确指定时区

```java
public class TimeZoneAwareDateFormatter implements Formatter<Date> {
    private String pattern;
    private TimeZone timeZone;

    public TimeZoneAwareDateFormatter(String pattern, TimeZone timeZone) {
        this.pattern = pattern;
        this.timeZone = timeZone;
    }

    @Override
    public String print(Date date, Locale locale) {
        SimpleDateFormat dateFormat = new SimpleDateFormat(pattern, locale);
        dateFormat.setTimeZone(timeZone);
        return dateFormat.format(date);
    }

    @Override
    public Date parse(String text, Locale locale) throws ParseException {
        SimpleDateFormat dateFormat = new SimpleDateFormat(pattern, locale);
        dateFormat.setTimeZone(timeZone);
        return dateFormat.parse(text);
    }
}
```

### 8.2 空值和空字符串处理

**问题**：如何处理空值或空字符串。

**解决方案**：在格式化器中添加空值检查：

```java
public class SafeDateFormatter implements Formatter<Date> {

    @Override
    public String print(Date date, Locale locale) {
        if (date == null) {
            return ""; // 或者返回 null，根据业务需求决定
        }
        return new SimpleDateFormat("yyyy-MM-dd").format(date);
    }

    @Override
    public Date parse(String text, Locale locale) throws ParseException {
        if (text == null || text.trim().isEmpty()) {
            return null; // 或者抛出异常，根据业务需求决定
        }
        return new SimpleDateFormat("yyyy-MM-dd").parse(text);
    }
}
```

### 8.3 自定义错误消息

**问题**：如何提供友好的格式化错误消息。

**解决方案**：结合 Spring 的消息源（MessageSource）

```properties
# messages.properties
typeMismatch.java.util.Date=无效的日期格式，请使用 yyyy-MM-dd 格式
typeMismatch.birthday=生日格式不正确，请输入有效的日期
```

```java
@Configuration
public class MessageConfig {

    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource =
            new ReloadableResourceBundleMessageSource();
        messageSource.setBasename("classpath:messages");
        messageSource.setDefaultEncoding("UTF-8");
        return messageSource;
    }
}
```

## 9. 总结与推荐实践

### 9.1 技术选型建议

1. **新项目推荐使用 Java 8 日期时间 API**：`java.time` 包下的类更现代、线程安全且设计更好
2. **Web 应用优先使用 Formatter**：而非 Converter，因为 Formatter 专门为字符串转换设计
3. **简单场景使用注解**：对于基本的日期、数字格式化，使用 `@DateTimeFormat` 和 `@NumberFormat` 注解
4. **复杂场景实现自定义 Formatter**：对于复杂对象或特殊格式要求，实现自定义 `Formatter` 接口

### 9.2 性能与维护性平衡

1. **重用格式化器实例**：避免频繁创建和销毁
2. **考虑线程安全性**：特别是在高并发场景下
3. **保持格式化逻辑简单**：复杂的逻辑应该放在业务层而非格式化器中
4. **编写完整的测试**：确保格式化器的各种边界情况都能正确处理

通过本文的详细介绍，相信您已经对 Spring Formatter 有了全面的了解。在实际项目中，根据具体需求选择合适的格式化策略，将大大提高代码的可维护性和用户体验。
