---
title: Java Record 记录类详解与最佳实践
description: 记录类是 Java 14 引入的一种新的类类型，用于表示不可变的数据传输对象（DTO）或值对象。它自动提供了构造器、getter 方法、equals、hashCode 和 toString 方法，大大简化了数据类的编写。
author: zhycn
---

# Java Record 记录类详解与最佳实践

## 1 引言

在传统 Java 开发中，创建纯粹用于封装数据的类（如 DTO 或值对象）往往需要编写大量**样板代码** (Boilerplate Code)，包括构造器、getter、equals、hashCode 和 toString 方法。这些代码虽然重复且难以避免，但严重影响开发效率和代码可读性。

为解决这一问题，Java 在 **JEP 359** 中提出了"记录类"这一语言特性，于 **Java 14** 首次以预览形式引入，并在 **Java 16** 中正式发布。记录类的核心设计目标是为数据携带类提供一种简洁、可读性强且类型安全的声明方式，让开发者能够更专注于数据建模本身而非模板代码的编写。

本文档将全面介绍 Java 记录类的特性、用法、最佳实践以及在实际项目中的应用场景，帮助您充分利用这一现代 Java 特性编写更优雅、高效的代码。

## 2 记录类的设计背景与定位

### 2.1 传统 POJO 的问题

在记录类出现之前，Java 开发者通常需要这样定义一个简单的数据载体类：

```java
// 传统 POJO 类（需要 30+ 行代码）
public class Person {
    private final int id;
    private final String name;
    private final String email;
    private final LocalDateTime createTime;

    // 全参构造器
    public Person(int id, String name, String email, LocalDateTime createTime) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.createTime = createTime;
    }

    // Getter 方法
    public int getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public LocalDateTime getCreateTime() { return createTime; }

    // equals 和 hashCode 方法
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Person person = (Person) o;
        return id == person.id &&
            Objects.equals(name, person.name) &&
            Objects.equals(email, person.email) &&
            Objects.equals(createTime, person.createTime);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, email, createTime);
    }

    // toString 方法
    @Override
    public String toString() {
        return "Person{" +
            "id=" + id +
            ", name='" + name + '\'' +
            ", email='" + email + '\'' +
            ", createTime=" + createTime +
            '}';
    }
}
```

这种传统实现方式存在几个明显问题：

1. **代码冗长**：即使是简单数据类也需要大量样板代码
2. **维护困难**：添加新字段需要修改多个方法
3. **容易出错**：手动实现的 equals/hashCode 可能不一致
4. **意图不清晰**：无法明确表达这是纯数据载体的设计意图

### 2.2 记录类的解决方案

Java 记录类用极简的语法解决了上述问题：

```java
// Record 等效实现（1 行代码）
public record Person(int id, String name, String email, LocalDateTime createTime) {}
```

通过 `record` 关键字，编译器会自动生成：

- 所有字段的访问器方法（如 `id()`, `name()`）
- 全参数构造器（规范构造器）
- `equals(Object obj)` 和 `hashCode()` 方法
- `toString()` 方法

这种设计使代码量减少 **70% 以上**，同时保证了行为的一致性和语义清晰性。

## 3 基本语法与使用

### 3.1 记录类的定义

记录类的基本定义语法如下：

```java
public record RecordName(Type component1, Type component2, ...) {
    // 可选：自定义构造函数、方法等
}
```

以下是一个简单的记录类示例：

```java
public record Point(int x, int y) {}
```

使用这个记录类：

```java
Point p = new Point(1, 2);
System.out.println(p.x());     // 输出: 1
System.out.println(p.y());     // 输出: 2
System.out.println(p);         // 输出: Point[x=1, y=2]
```

### 3.2 自动生成的方法

编译器会自动为记录类生成以下方法：

1. **访问器方法** (Accessor Methods)：每个组件都会生成一个公共访问器方法，方法名与字段名一致（如 `x()` 而非 `getX()`)。
2. **规范构造器** (Canonical Constructor)：参数列表与组件顺序一致的公共构造器。
3. **equals(Object obj)** 和 **hashCode()**：基于所有字段值实现逻辑相等性比较。
4. **toString()**：生成格式为 `类名[字段1=值1, 字段2=值2]` 的字符串表示。

### 3.3 不可变性

记录类的所有字段默认是 `private final` 的，一旦创建后状态不可修改：

```java
Point p = new Point(1, 2);
p.x = 3;  // 编译错误：无法为 final 字段赋值
```

这种**不可变性**使记录类天然线程安全，适合用于数据传递、缓存键和函数式编程等场景。

## 4 核心特性详解

### 4.1 不可变性的价值与实现

记录类的不可变性带来多方面优势：

- **线程安全**：多个线程可安全共享记录实例，无需加锁
- **更少的副作用**：状态不可更改，避免共享状态带来的错误
- **更简单的调试与测试**：数据不会在调用链中被意外修改
- **易于缓存和哈希结构使用**：不可变对象可作为 Map 的键，不会影响哈希值

在传统 Java 类中，需要手动实现不可变性：

```java
public final class ImmutablePerson {
    private final String name;
    private final int age;

    public ImmutablePerson(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
}
```

记录类通过语法层级的约束，天然支持不可变性，避免了人为失误。

### 4.2 自动生成的方法详解

#### 4.2.1 访问器方法

记录类为每个组件生成访问器方法，方法名与字段名一致：

```java
public record User(String username, String role) {}

User user = new User("alice", "admin");
System.out.println(user.username());  // 输出: alice
System.out.println(user.role());      // 输出: admin
```

注意：记录类不生成传统的 `getUsername()` 形式的方法。

#### 4.2.2 equals 和 hashCode 方法

记录类基于字段值自动生成合理的 `equals` 和 `hashCode` 方法：

```java
User user1 = new User("alice", "admin");
User user2 = new User("alice", "admin");

System.out.println(user1.equals(user2));      // true
System.out.println(user1.hashCode() == user2.hashCode());  // true
```

比较是基于组件值进行的，而非引用。

#### 4.2.3 toString 方法

记录类默认实现了符合逻辑的 `toString()` 方法：

```java
System.out.println(user1.toString());
// 输出: User[username=alice, role=admin]
```

### 4.3 构造器机制

记录类支持三种形式的构造器：

#### 4.3.1 规范构造器 (Canonical Constructor)

规范构造器是由编译器自动生成的构造函数，其参数列表与组件顺序一致：

```java
public record Product(String name, double price) {
    // 编译器自动生成：
    // public Product(String name, double price) {
    //     this.name = name;
    //     this.price = price;
    // }
}
```

可以显式定义规范构造器来加入自定义逻辑：

```java
public record Product(String name, double price) {
    public Product {
        if (price < 0) {
            throw new IllegalArgumentException("价格不能为负数");
        }
    }
}
```

#### 4.3.2 紧凑构造器 (Compact Constructor)

Java 为记录类提供了一种语法糖，称为"紧凑构造器"，无需列出参数列表和重复赋值：

```java
public record Student(String name, int age) {
    public Student {
        if (age < 0) {
            throw new IllegalArgumentException("年龄不能为负数");
        }
    }
}
```

这等价于：

```java
public record Student(String name, int age) {
    public Student(String name, int age) {
        if (age < 0) {
            throw new IllegalArgumentException("年龄不能为负数");
        }
        this.name = name;
        this.age = age;
    }
}
```

#### 4.3.3 自定义构造器与重载

记录类可以定义额外的构造器，但这些构造器必须调用规范构造器：

```java
public record Coordinate(int x, int y) {
    public Coordinate() {
        this(0, 0);  // 默认构造
    }

    public Coordinate(int value) {
        this(value, value);  // 重载构造
    }
}
```

注意：所有非规范构造器都必须显式调用 `this(...)`，不能定义不初始化所有字段的构造器。

## 5 高级特性与用法

### 5.1 静态成员

记录类可以像普通类一样包含静态字段、静态方法和静态代码块：

```java
public record Color(int red, int green, int blue) {
    public static final Color BLACK = new Color(0, 0, 0);
    public static final Color WHITE = new Color(255, 255, 255);

    public static String toHex(Color c) {
        return String.format("#%02x%02x%02x", c.red(), c.green(), c.blue());
    }
}

Color white = Color.WHITE;
System.out.println(Color.toHex(white));  // 输出: #ffffff
```

### 5.2 接口实现

记录类可以实现接口（包括函数式接口），并提供对应方法实现：

```java
public interface Identifiable {
    String id();
}

public record Employee(String id, String name) implements Identifiable {
    // 自动实现 id() 方法
}
```

记录类实现接口时，可以通过组件直接满足接口方法签名，提升了类型的表达力。

### 5.3 泛型支持

记录类可以定义为泛型类型，适用于多种数据类型的封装：

```java
public record Pair<K, V>(K key, V value) {}

Pair<String, Integer> entry = new Pair<>("age", 30);
System.out.println(entry.key());    // 输出: age
System.out.println(entry.value());  // 输出: 30
```

泛型记录类尤其适用于通用值对象、键值对封装、元组等使用场景。

### 5.4 本地记录类 (Local Records)

从 Java 16 开始，记录类也可以在方法内部定义，称为"本地记录类"，适用于封装局部方法逻辑中的中间数据结构：

```java
public class ReportGenerator {
    public void generate() {
        record Summary(String title, int count) {}

        Summary summary = new Summary("周报", 12);
        System.out.println(summary);
    }
}
```

本地记录类只在方法范围内可见，能够提升临时数据处理的类型安全性与可读性，避免引入冗余的外部类定义。

### 5.5 嵌套记录结构

记录类可以嵌套使用，构建复杂的数据结构：

```java
public record GeoPoint(double latitude, double longitude) {}

public record Address(
    String street,
    String city,
    GeoPoint coordinates
) {
    public Address {
        if (!isValidCoordinate(coordinates)) {
            throw new IllegalArgumentException("非法坐标");
        }
    }

    private boolean isValidCoordinate(GeoPoint point) {
        return Math.abs(point.latitude()) <= 90 &&
               Math.abs(point.longitude()) <= 180;
    }
}
```

### 5.6 模式匹配应用 (Java 17+)

Java 17 增强了模式匹配功能，与记录类结合使用可以大大简化代码：

```java
// JDK 17 模式匹配增强
public interface Message {}
public record TextMessage(String content) implements Message {}
public record ImageMessage(String url, int size) implements Message {}

// 消息处理器
public void processMessage(Message msg) {
    switch(msg) {
        case TextMessage t -> System.out.println("文字内容：" + t.content());
        case ImageMessage i -> System.out.println("图片大小：" + i.size());
        default -> throw new IllegalArgumentException();
    }
}
```

模式匹配还可以直接解构记录对象：

```java
Object obj = new UserDTO("U001", "Alice", LocalDateTime.now());
if (obj instanceof UserDTO(String id, String name, var time)) {
    System.out.println(name);  // 直接解构字段
}
```

## 6 最佳实践与注意事项

### 6.1 适用场景

记录类最适合以下场景：

1. **DTO (数据传输对象)**：API 响应/请求结构

   ```java
   public record ApiResponse<T>(int code, String message, T data) {}
   ```

2. **值对象**：坐标、颜色、货币等

   ```java
   public record Money(BigDecimal amount, Currency currency) {}
   ```

3. **复合键**：数据库复合主键

   ```java
   public record UserRoleKey(String userId, String roleId) {}
   ```

4. **临时数据结构**：方法返回多个值

   ```java
   public record Coordinate(double x, double y) {}

   public Coordinate calculatePosition() {
       return new Coordinate(12.5, 8.3);
   }
   ```

5. **配置对象**：应用程序配置参数

   ```java
   public record RedisConfig(String host, int port, String password) {}
   ```

6. **领域驱动设计中的值对象**

   ```java
   public record Address(
       String street,
       String city,
       String postalCode,
       String country
   ) {
       public Address {
           Objects.requireNonNull(street, "街道不能为空");
           // 其他验证逻辑...
       }

       public String fullAddress() {
           return String.format("%s, %s, %s, %s", street, city, postalCode, country);
       }
   }
   ```

### 6.2 不适用场景

记录类不适合以下情况：

1. **需要复杂业务逻辑的类**
2. **需要继承的场景**（记录类隐式继承 `java.lang.Record`，不能继承其他类）
3. **需要可变状态的类**
4. **JPA 实体**：Hibernate 等 ORM 框架对记录类支持尚不完善

### 6.3 保持纯粹性

记录类应保持纯粹的数据载体特性，**避免添加业务逻辑**。将业务逻辑放在相应的服务类中：

```java
// 推荐做法：记录类只保存数据
public record Employee(
    String id,
    String name,
    Department department,
    LocalDate hireDate,
    double salary
) {}

// 业务逻辑放在服务类中
public class PayrollService {
    public double calculateAnnualBonus(Employee employee) {
        // 计算逻辑...
    }
}
```

### 6.4 保证深层不可变性

虽然记录类本身是不可变的，但如果其字段引用可变对象（如 List、Map、数组），则需要谨慎处理：

```java
public record UserProfile(String username, List<String> tags) {}

List<String> list = new ArrayList<>();
list.add("java");
UserProfile profile = new UserProfile("bob", list);
profile.tags().add("record");  // 可变字段被修改！
```

解决方案是使用**防御性复制** (Defensive Copy)：

```java
public record SafeUserProfile(String username, List<String> tags) {
    public SafeUserProfile {
        tags = List.copyOf(tags);  // 创建不可变副本
    }

    // 确保返回不可变集合
    public List<String> tags() {
        return Collections.unmodifiableList(tags);
    }
}
```

### 6.5 参数验证

在紧凑构造器中添加参数验证逻辑：

```java
public record ValidatedUser(String username, String email) {
    public ValidatedUser {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("用户名不能为空");
        }
        if (!email.contains("@")) {
            throw new IllegalArgumentException("邮箱格式错误");
        }
    }
}
```

### 6.6 序列化处理

记录类自动支持序列化，但需要显式实现 `Serializable` 接口：

```java
public record Person(String name, int age) implements Serializable {
    private static final long serialVersionUID = 1L;
}

// 序列化
Person person = new Person("Alice", 30);
try (ObjectOutputStream oos = new ObjectOutputStream(...)) {
    oos.writeObject(person);
}

// 反序列化
Person deserialized = (Person) ois.readObject();
System.out.println(person.equals(deserialized));  // true
```

### 6.7 文档注释规范

为记录类添加适当的 Javadoc 文档：

```java
/**
 * 代表一个员工实体。
 *
 * @param id 员工ID（格式：E+4位数字，如E1001）
 * @param name 姓名（不能为空，最大长度50）
 * @param department 所属部门（不能为null）
 * @param hireDate 入职日期（不能为未来日期）
 * @param salary 薪资（范围：0-1000000）
 */
public record Employee(
    String id,
    String name,
    Department department,
    LocalDate hireDate,
    double salary
) {
    /**
     * 紧凑构造函数：验证参数有效性。
     *
     * @throws IllegalArgumentException 如果薪资为负数或姓名为空
     */
    public Employee {
        if (salary < 0) {
            throw new IllegalArgumentException("薪资不能为负数");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("姓名不能为空");
        }
    }

    /**
     * 计算员工的工作年限。
     *
     * @return 工作年限（整数）
     */
    public int yearsOfService() {
        return LocalDate.now().getYear() - hireDate.getYear();
    }
}
```

## 7 性能考量

记录类在性能方面有几个优势：

1. **字段布局优化**：JVM 对记录类的字段存储顺序进行了特别优化
2. **未来值类型支持**：为 Valhalla 项目中的值类型特性奠定了基础
3. **模式匹配优化**：与 Java 17+ 的模式匹配特性结合使用时性能更佳

测试数据显示，使用记录类与模式匹配的组合比传统方式性能提升约 **5%**，代码量减少 **80%**，圈复杂度大幅降低。

## 8 总结

Java 记录类是 Java 语言向更简洁、更安全编程模型迈进的重要一步，具有以下核心价值：

- **✅ 减少样板代码**：自动生成构造器、访问器等方法，减少 70%+ 代码量
- **✅ 保证不可变性**：默认 final 字段，线程安全，避免意外状态修改
- **✅ 提高可读性**：简洁的语法，明确的数据结构意图
- **✅ 增强安全性**：防止意外的状态修改，适合多线程环境
- **✅ 模式匹配友好**：与 Java 17+ 模式匹配完美结合

记录类特别适合现代微服务架构中的数据载体场景，在 DTO、值对象、配置封装等场景中能显著提升代码质量和开发效率。

随着 Java 语言的持续演进，记录类将在数据驱动开发中发挥更加关键的作用，与密封类、模式匹配等特性结合，构建更严格、更安全的类型系统。

## 9 实战案例：员工管理系统

以下是一个完整的员工管理系统示例，展示了记录类在实际项目中的应用：

```java
// Department.java
public record Department(String id, String name, String location) {
    @Override
    public String toString() {
        return String.format("%s (%s)", name, location);
    }
}

// Employee.java
import java.time.LocalDate;

public record Employee(
    String id,
    String name,
    Department department,
    LocalDate hireDate,
    double salary
) {
    // 紧凑构造函数验证数据
    public Employee {
        if (salary < 0) {
            throw new IllegalArgumentException("薪资不能为负数");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("姓名不能为空");
        }
    }

    // 自定义方法：计算工作年限
    public int yearsOfService() {
        return LocalDate.now().getYear() - hireDate.getYear();
    }

    // 自定义方法：加薪（返回新对象）
    public Employee withRaise(double percentage) {
        double newSalary = salary * (1 + percentage / 100);
        return new Employee(id, name, department, hireDate, newSalary);
    }
}

// Payroll.java
import java.util.List;

public class Payroll {
    // 计算部门总薪资
    public static double calculateDepartmentSalary(
        List<Employee> employees,
        Department department
    ) {
        return employees.stream()
                .filter(e -> e.department().equals(department))
                .mapToDouble(Employee::salary)
                .sum();
    }

    // 发放年终奖金
    public static List<Employee> applyYearEndBonus(
        List<Employee> employees,
        double bonusPercentage
    ) {
        return employees.stream()
                .map(e -> e.withRaise(bonusPercentage))
                .toList();
    }
}

// Main.java
import java.time.LocalDate;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        // 创建部门
        Department devDept = new Department("D001", "开发部", "北京");
        Department salesDept = new Department("D002", "销售部", "上海");

        // 创建员工
        List<Employee> employees = List.of(
            new Employee("E1001", "张三", devDept,
                        LocalDate.of(2018, 5, 10), 15000),
            new Employee("E1002", "李四", devDept,
                        LocalDate.of(2020, 3, 15), 18000),
            new Employee("E2001", "王五", salesDept,
                        LocalDate.of(2019, 8, 22), 12000)
        );

        // 打印员工信息
        System.out.println("=== 员工信息 ===");
        employees.forEach(System.out::println);

        // 计算部门薪资
        System.out.println("\n=== 部门薪资 ===");
        System.out.printf("开发部总薪资: %.2f元%n",
            Payroll.calculateDepartmentSalary(employees, devDept));
        System.out.printf("销售部总薪资: %.2f元%n",
            Payroll.calculateDepartmentSalary(employees, salesDept));

        // 发放年终奖
        System.out.println("\n=== 年终奖金发放 ===");
        List<Employee> updatedEmployees =
            Payroll.applyYearEndBonus(employees, 10);
        updatedEmployees.forEach(e ->
            System.out.printf("%s: %.2f → %.2f元%n",
                e.name(), e.salary() / 1.1, e.salary()));

        // 查看工作年限
        System.out.println("\n=== 工作年限 ===");
        employees.forEach(e ->
            System.out.printf("%s: %d年%n",
                e.name(), e.yearsOfService()));
    }
}
```

这个案例展示了记录类如何简化数据模型的定义，同时保持代码的清晰性和安全性。

希望本篇文档能够帮助您全面理解 Java 记录类，并在实际项目中合理运用这一强大特性，编写出更加简洁、安全、高效的 Java 代码。
