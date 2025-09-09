---
title: Java Collectors 工具类详解与最佳实践
author: zhycn
---

# Java Collectors 工具类详解与最佳实践

## 1. Collectors 工具类概述

Java 8 引入的 `java.util.stream.Collectors` 是一个功能强大的工具类，专门用于处理 Stream API 的终端收集操作。它提供了多种静态方法，可以将流中的元素累积到各种集合中，并能执行各种汇总、分组和分区等操作。Collectors 类设计遵循了"工具类"模式，所有方法都是静态的，无需创建类的实例即可使用。

### 1.1 Collector 与 Collectors 的关系

- **Collector 接口**：定义了流的元素收集操作的核心契约，包含 supplier、accumulator、combiner、finisher 和 characteristics 五个组件。
- **Collectors 工具类**：提供了多种预实现的 Collector 实例，方便开发者直接使用。

### 1.2 核心组件说明

Collector 接口定义的五个组件协同工作：

1. **Supplier**：提供一个新的可变结果容器。
2. **Accumulator**：将元素添加到结果容器中。
3. **Combiner**：将两个结果容器合并为一个（用于并行流）。
4. **Finisher**：对结果容器执行最终的转换（可选）。
5. **Characteristics**：定义收集器的行为特性（如 CONCURRENT, UNORDERED, IDENTITY_FINISH）。

## 2. 常用收集操作详解

### 2.1 集合收集操作

#### 2.1.1 toList() - 收集到列表

将流元素收集到 `List` 中，是最常用的收集器之一。

```java
List<String> names = Arrays.asList("John", "Paul", "George", "Ringo");
List<String> collectedNames = names.stream()
    .filter(name -> name.startsWith("J"))
    .collect(Collectors.toList());
// 结果: ["John"]
```

**实现原理**：使用 `ArrayList` 作为结果容器，逐步添加元素，支持并行流合并。

#### 2.1.2 toSet() - 收集到集合

将流元素收集到 `Set` 中，自动去除重复元素。

```java
List<String> names = Arrays.asList("John", "Paul", "George", "Ringo", "John");
Set<String> uniqueNames = names.stream()
    .collect(Collectors.toSet());
// 结果: ["John", "Paul", "George", "Ringo"] (顺序可能不同)
```

**实现原理**：使用 `HashSet` 作为结果容器，利用哈希表的特性实现去重。

#### 2.1.3 toCollection() - 自定义集合

将元素收集到特定类型的集合中，提供更灵活的控制。

```java
List<String> names = Arrays.asList("John", "Paul", "George", "Ringo");
// 收集到 LinkedList
LinkedList<String> linkedNames = names.stream()
    .collect(Collectors.toCollection(LinkedList::new));
// 收集到 TreeSet
TreeSet<String> sortedNames = names.stream()
    .collect(Collectors.toCollection(TreeSet::new));
```

#### 2.1.4 toMap() - 收集到映射

将流元素收集到 `Map` 中，需要提供键和值的映射函数。

```java
List<Product> products = Arrays.asList(
    new Product("1", "iPhone", 999.0),
    new Product("2", "MacBook", 1999.0),
    new Product("3", "iPad", 499.0)
);

// 基本用法：id -> product
Map<String, Product> productMap = products.stream()
    .collect(Collectors.toMap(Product::getId, Function.identity()));

// 处理键冲突：保留最后出现的值
Map<String, Product> conflictMap = products.stream()
    .collect(Collectors.toMap(
        Product::getId,
        Function.identity(),
        (existing, replacement) -> replacement));

// 指定具体Map类型：使用LinkedHashMap保持顺序
Map<String, Product> linkedProductMap = products.stream()
    .collect(Collectors.toMap(
        Product::getId,
        Function.identity(),
        (existing, replacement) -> replacement,
        LinkedHashMap::new));
```

**键冲突处理策略**：

- 抛出异常：默认行为（重复键时抛出 `IllegalStateException`）
- 保留新值：`(existing, replacement) -> replacement`
- 保留旧值：`(existing, replacement) -> existing`
- 合并值：根据业务逻辑自定义合并策略

#### 2.1.5 toConcurrentMap() - 收集到并发映射

与 `toMap()` 类似，但返回的是 `ConcurrentMap`，线程安全且并行处理效率更高。

```java
ConcurrentMap<String, Product> concurrentMap = products.stream()
    .parallel()
    .collect(Collectors.toConcurrentMap(Product::getId, Function.identity()));
```

### 2.2 字符串拼接操作

#### 2.2.1 joining() - 字符串连接

将流中的字符串元素连接成一个单一的字符串。

```java
List<String> words = Arrays.asList("Java", "Stream", "Collectors");

// 简单连接
String result1 = words.stream()
    .collect(Collectors.joining());
// 结果: "JavaStreamCollectors"

// 带分隔符连接
String result2 = words.stream()
    .collect(Collectors.joining(", "));
// 结果: "Java, Stream, Collectors"

// 带分隔符、前缀和后缀连接
String result3 = words.stream()
    .collect(Collectors.joining(", ", "[", "]"));
// 结果: "[Java, Stream, Collectors]"
```

**实现原理**：使用 `StringBuilder` 作为结果容器，逐步追加元素，支持并行流合并。

### 2.3 数值统计操作

#### 2.3.1 求和操作

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 整型求和
Integer intSum = numbers.stream()
    .collect(Collectors.summingInt(Integer::intValue));
// 结果: 15

// 长整型求和
Long longSum = products.stream()
    .collect(Collectors.summingLong(p -> p.getPrice().longValue()));

// 双精度求和
Double doubleSum = products.stream()
    .collect(Collectors.summingDouble(p -> p.getPrice()));
```

#### 2.3.2 平均值操作

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 整型平均值
Double intAvg = numbers.stream()
    .collect(Collectors.averagingInt(Integer::intValue));
// 结果: 3.0

// 双精度平均值
Double doubleAvg = products.stream()
    .collect(Collectors.averagingDouble(Product::getPrice));
```

#### 2.3.3 综合统计

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// Int类型综合统计
IntSummaryStatistics intStats = numbers.stream()
    .collect(Collectors.summarizingInt(Integer::intValue));
// 结果: IntSummaryStatistics{count=5, sum=15, min=1, max=5, average=3.0}

// Double类型综合统计
DoubleSummaryStatistics doubleStats = products.stream()
    .collect(Collectors.summarizingDouble(Product::getPrice));

// 获取统计值
long count = intStats.getCount();
long sum = intStats.getSum();
int min = intStats.getMin();
int max = intStats.getMax();
double average = intStats.getAverage();
```

### 2.4 分组与分区操作

#### 2.4.1 groupingBy() - 分组操作

根据指定的分类函数将流中的元素分组。

```java
List<Employee> employees = Arrays.asList(
    new Employee("Alice", "HR", 50000),
    new Employee("Bob", "IT", 60000),
    new Employee("Charlie", "HR", 55000),
    new Employee("David", "IT", 65000)
);

// 简单分组：按部门分组
Map<String, List<Employee>> byDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment));
// 结果: {HR=[Alice, Charlie], IT=[Bob, David]}

// 多级分组：先按部门再按薪资范围
Map<String, Map<String, List<Employee>>> byDeptAndSalary = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment,
        Collectors.groupingBy(e -> e.getSalary() > 55000 ? "HIGH" : "LOW")));
// 结果: {HR={LOW=[Alice, Charlie]}, IT={HIGH=[Bob, David]}}

// 分组后操作：计算每个部门的平均薪资
Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment,
        Collectors.averagingDouble(Employee::getSalary)));
// 结果: {HR=52500.0, IT=62500.0}

// 分组到自定义Map类型
Map<String, Set<Employee>> byDeptCustom = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment,
        TreeMap::new,  // 使用TreeMap作为外层Map
        Collectors.toSet()));  // 使用Set作为值容器
```

#### 2.4.2 partitioningBy() - 分区操作

根据谓词条件将流中的元素分为两组（true/false）。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 简单分区：奇偶数分区
Map<Boolean, List<Integer>> partitioned = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));
// 结果: {false=[1, 3, 5, 7, 9], true=[2, 4, 6, 8, 10]}

// 分区后操作：计算每组的平均值
Map<Boolean, Double> avgByPartition = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0,
        Collectors.averagingInt(Integer::intValue)));
// 结果: {false=5.0, true=6.0}
```

**分组与分区的区别**：

| 特性     | groupingBy           | partitioningBy        |
| -------- | -------------------- | --------------------- |
| 分组数量 | 多组（根据键的数量） | 两组（true/false）    |
| 分类函数 | Function<T, K>       | `Predicate<T>`        |
| 结果空键 | 可能不包含某些键     | 总是包含true和false键 |

### 2.5 其他有用操作

#### 2.5.1 counting() - 计数

统计流中元素的数量。

```java
List<String> names = Arrays.asList("John", "Paul", "George", "Ringo");
Long count = names.stream()
    .filter(name -> name.length() > 4)
    .collect(Collectors.counting());
// 结果: 3
```

#### 2.5.2 minBy()/maxBy() - 极值查找

查找流中的最小或最大元素。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 查找最小值
Optional<Integer> min = numbers.stream()
    .collect(Collectors.minBy(Integer::compareTo));
// 结果: Optional[1]

// 查找最大值
Optional<Integer> max = numbers.stream()
    .collect(Collectors.maxBy(Integer::compareTo));
// 结果: Optional[5]

// 结合groupingBy使用：查找每个部门的最高薪资员工
Map<String, Optional<Employee>> topEmployeeByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment,
        Collectors.maxBy(Comparator.comparingDouble(Employee::getSalary))));
```

#### 2.5.3 mapping() - 映射收集

在收集前先对元素进行映射操作。

```java
List<Employee> employees = Arrays.asList(
    new Employee("Alice", "HR", 50000),
    new Employee("Bob", "IT", 60000)
);

// 先映射再收集：获取每个部门员工姓名列表
Map<String, List<String>> namesByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment,
        Collectors.mapping(Employee::getName, Collectors.toList())));
// 结果: {HR=[Alice], IT=[Bob]}

// 先映射再连接：获取每个部门员工姓名连接字符串
Map<String, String> joinedNamesByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment,
        Collectors.mapping(Employee::getName, Collectors.joining(", "))));
// 结果: {HR="Alice", IT="Bob"}
```

#### 2.5.4 reducing() - 归约操作

提供通用的归约操作，比特定归约操作更灵活。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 简单归约：求和
Optional<Integer> sum = numbers.stream()
    .collect(Collectors.reducing(Integer::sum));
// 结果: Optional[15]

// 带初始值的归约：求和
Integer sumWithIdentity = numbers.stream()
    .collect(Collectors.reducing(0, Integer::sum));
// 结果: 15

// 复杂归约：先映射再归约
Integer totalNameLength = employees.stream()
    .collect(Collectors.reducing(0,
        e -> e.getName().length(),  // 映射函数
        Integer::sum));             // 归约函数
// 结果: 所有员工姓名长度之和
```

#### 2.5.5 filtering() - 过滤收集

在收集前先对元素进行过滤操作。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 先过滤再分组：按奇偶分组，但只保留大于5的数
Map<Boolean, List<Integer>> filteredPartition = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0,
        Collectors.filtering(n -> n > 5, Collectors.toList())));
// 结果: {false=[7, 9], true=[6, 8, 10]}
```

#### 2.5.6 collectingAndThen() - 收集后转换

在收集后对结果进行额外的转换操作。

```java
List<String> names = Arrays.asList("John", "Paul", "George", "Ringo");

// 收集为不可修改列表
List<String> unmodifiableList = names.stream()
    .filter(name -> name.length() > 4)
    .collect(Collectors.collectingAndThen(
        Collectors.toList(),
        Collections::unmodifiableList
    ));

// 获取统计信息后提取最大值
Integer max = numbers.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.summarizingInt(Integer::intValue),
        IntSummaryStatistics::getMax
    ));
// 结果: 5
```

## 3. 并行流与收集器

### 3.1 并行流使用注意事项

并行流可以提升处理大规模数据的性能，但需要正确使用收集器。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 并行流求和
Integer parallelSum = numbers.parallelStream()
    .collect(Collectors.summingInt(Integer::intValue));

// 并行流分组
Map<String, List<Employee>> parallelByDept = employees.parallelStream()
    .collect(Collectors.groupingByConcurrent(Employee::getDepartment));
```

**并行流最佳实践**：

1. 数据量较大时（通常 > 10000 元素）才使用并行流
2. 考虑操作的并行成本，避免在并行性能增益不明显的情况下使用
3. 使用线程安全的收集器（如 `toConcurrentMap`, `groupingByConcurrent`）
4. 避免在并行流中执行有状态的操作或副作用

### 3.2 并发收集器

专为并行流设计的并发收集器：

```java
// 并发Map收集
ConcurrentMap<String, Employee> concurrentMap = employees.parallelStream()
    .collect(Collectors.toConcurrentMap(Employee::getId, Function.identity()));

// 并发分组
ConcurrentMap<String, List<Employee>> concurrentByDept = employees.parallelStream()
    .collect(Collectors.groupingByConcurrent(Employee::getDepartment));

// 带下游收集器的并发分组
ConcurrentMap<String, Double> concurrentAvgSalary = employees.parallelStream()
    .collect(Collectors.groupingByConcurrent(Employee::getDepartment,
        Collectors.averagingDouble(Employee::getSalary)));
```

## 4. 性能优化与最佳实践

### 4.1 容量规划优化

对于大数据集，预先指定集合大小可以避免多次扩容带来的性能开销。

```java
List<String> largeList = // 大量数据

// 优化前：默认toList()使用ArrayList，可能多次扩容
List<String> result1 = largeList.stream()
    .filter(s -> s.length() > 5)
    .collect(Collectors.toList());

// 优化后：预分配足够容量
List<String> result2 = largeList.stream()
    .filter(s -> s.length() > 5)
    .collect(Collectors.toCollection(() -> new ArrayList<>(largeList.size())));

// 对于toSet同样适用
Set<String> result3 = largeList.stream()
    .filter(s -> s.length() > 5)
    .collect(Collectors.toCollection(() -> new HashSet<>(largeList.size())));
```

### 4.2 选择合适的数据结构

根据具体需求选择最合适的数据结构提升性能。

```java
// 需要排序时使用TreeMap/TreeSet
Map<String, Employee> sortedMap = employees.stream()
    .collect(Collectors.toMap(Employee::getName, Function.identity(),
        (oldValue, newValue) -> oldValue, TreeMap::new));

// 需要保持插入顺序时使用LinkedHashMap/LinkedHashSet
Map<String, Employee> orderedMap = employees.stream()
    .collect(Collectors.toMap(Employee::getName, Function.identity(),
        (oldValue, newValue) -> oldValue, LinkedHashMap::new));
```

### 4.3 避免不必要的装箱/拆箱

对于原始类型数据，使用原始类型特定收集器避免装箱开销。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 不必要的装箱（虽然可行但效率低）
IntSummaryStatistics stats1 = numbers.stream()
    .collect(Collectors.summarizingInt(Integer::intValue));

// 更高效的方式：直接使用IntStream
IntSummaryStatistics stats2 = numbers.stream()
    .mapToInt(Integer::intValue)
    .summaryStatistics();
```

### 4.4 空值处理策略

正确处理可能为 null 的值，避免 NullPointerException。

```java
List<String> listWithNulls = Arrays.asList("Java", null, "Stream", null, "Collectors");

// 过滤null值
List<String> withoutNulls = listWithNulls.stream()
    .filter(Objects::nonNull)
    .collect(Collectors.toList());

// 分组时处理null键
Map<String, List<String>> grouped = listWithNulls.stream()
    .collect(Collectors.groupingBy(
        s -> s != null ? s : "NULL",  // 将null键转换为"NULL"
        Collectors.mapping(s -> s != null ? s : "NULL", Collectors.toList())
    ));

// toMap时处理null值
Map<Integer, String> lengthMap = listWithNulls.stream()
    .filter(Objects::nonNull)
    .collect(Collectors.toMap(String::length, Function.identity(),
        (existing, replacement) -> existing));
```

## 5. 实际应用场景

### 5.1 数据统计分析

```java
// 商品销售数据统计分析
public class SalesAnalysis {
    public void analyzeSales(List<Order> orders) {
        // 按产品分类统计销售额
        Map<String, Double> salesByProduct = orders.stream()
            .collect(Collectors.groupingBy(Order::getProductId,
                Collectors.summingDouble(Order::getAmount)));

        // 按月份统计订单数
        Map<String, Long> ordersByMonth = orders.stream()
            .collect(Collectors.groupingBy(
                order -> DateTimeFormatter.ofPattern("yyyy-MM").format(order.getOrderDate()),
                Collectors.counting()));

        // 计算每个客户的平均订单金额
        Map<String, Double> avgOrderByCustomer = orders.stream()
            .collect(Collectors.groupingBy(Order::getCustomerId,
                Collectors.averagingDouble(Order::getAmount)));

        // 获取销售额最高的10个产品
        List<Map.Entry<String, Double>> topProducts = salesByProduct.entrySet().stream()
            .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
            .limit(10)
            .collect(Collectors.toList());
    }
}
```

### 5.2 数据转换与重组

```java
// 数据库查询结果转换
public class DataTransformer {
    public Map<Long, List<DTO>> transform(List<Entity> entities) {
        return entities.stream()
            .collect(Collectors.groupingBy(Entity::getParentId,
                Collectors.mapping(this::convertToDTO, Collectors.toList())));
    }

    private DTO convertToDTO(Entity entity) {
        // 转换逻辑
        return new DTO(entity.getId(), entity.getName());
    }

    // 多级数据转换
    public Map<String, Map<String, List<DTO>>> multiLevelTransform(List<Entity> entities) {
        return entities.stream()
            .collect(Collectors.groupingBy(Entity::getCategory,
                Collectors.groupingBy(Entity::getSubCategory,
                    Collectors.mapping(this::convertToDTO, Collectors.toList()))));
    }
}
```

### 5.3 配置处理与验证

```java
// 配置文件处理
public class ConfigProcessor {
    public Map<String, String> processConfig(List<ConfigItem> configItems) {
        return configItems.stream()
            .filter(item -> item != null && item.getKey() != null)
            .collect(Collectors.toMap(ConfigItem::getKey,
                item -> item.getValue() != null ? item.getValue() : "",
                (existing, replacement) -> replacement,  // 重复键处理：保留新值
                LinkedHashMap::new));  // 保持插入顺序
    }

    // 配置分组
    public Map<String, List<ConfigItem>> groupByPrefix(List<ConfigItem> configItems) {
        return configItems.stream()
            .collect(Collectors.groupingBy(item -> {
                if (item.getKey().contains(".")) {
                    return item.getKey().substring(0, item.getKey().indexOf("."));
                }
                return "default";
            }));
    }
}
```

## 6. 常见问题与解决方案

### 6.1 重复键异常处理

使用 `toMap` 时遇到重复键默认会抛出 `IllegalStateException`。

```java
List<Student> students = Arrays.asList(
    new Student("1", "Alice"),
    new Student("2", "Bob"),
    new Student("2", "Charlie")  // 重复ID
);

// 解决方案1：保留先出现的值
Map<String, String> map1 = students.stream()
    .collect(Collectors.toMap(Student::getId, Student::getName,
        (existing, replacement) -> existing));
// 结果: {1=Alice, 2=Bob}

// 解决方案2：保留后出现的值
Map<String, String> map2 = students.stream()
    .collect(Collectors.toMap(Student::getId, Student::getName,
        (existing, replacement) -> replacement));
// 结果: {1=Alice, 2=Charlie}

// 解决方案3：合并值
Map<String, List<String>> map3 = students.stream()
    .collect(Collectors.toMap(Student::getId,
        student -> Collections.singletonList(student.getName()),
        (list1, list2) -> {
            List<String> merged = new ArrayList<>(list1);
            merged.addAll(list2);
            return merged;
        }));
// 结果: {1=[Alice], 2=[Bob, Charlie]}
```

### 6.2 空指针异常处理

处理可能为 null 的键或值。

```java
List<Product> products = Arrays.asList(
    new Product("1", "iPhone", 999.0),
    new Product("2", null, 1999.0),  // 名称为null
    new Product(null, "iPad", 499.0)  // ID为null
);

// 过滤null键
Map<String, Product> withoutNullKeys = products.stream()
    .filter(p -> p.getId() != null)
    .collect(Collectors.toMap(Product::getId, Function.identity()));

// 提供默认值
Map<String, String> withDefaults = products.stream()
    .collect(Collectors.toMap(
        p -> p.getId() != null ? p.getId() : "UNKNOWN",
        p -> p.getName() != null ? p.getName() : "UNNAMED",
        (existing, replacement) -> existing));
```

### 6.3 并行流线程安全问题

确保并行流操作的安全性。

```java
// 不安全的操作
List<String> unsafeList = new ArrayList<>();
numbers.parallelStream()
    .forEach(unsafeList::add);  // 可能导致数据丢失或异常

// 安全的收集方式
List<String> safeList = numbers.parallelStream()
    .collect(Collectors.toList());  // 线程安全

// 使用并发收集器提高并行性能
ConcurrentMap<String, List<Integer>> concurrentMap = numbers.parallelStream()
    .collect(Collectors.groupingByConcurrent(
        n -> n % 2 == 0 ? "even" : "odd"));
```

## 结论

Java Collectors 工具类为流处理提供了强大而灵活的收集能力，是现代 Java 编程中不可或缺的工具。通过合理运用各种收集器，可以极大地简化代码提高开发效率。在实际使用中，应根据具体场景选择合适的收集器，并注意性能优化和异常处理，以构建健壮高效的应用程序。

**最佳实践总结**：

1. 根据需求选择最合适的收集器
2. 大数据集考虑使用并行流和并发收集器
3. 预先规划集合容量优化性能
4. 妥善处理 null 值和重复键情况
5. 结合具体业务场景使用分组、分区和多级收集
6. 利用收集后转换处理复杂需求

通过掌握 Collectors 工具类的各种特性和技巧，开发者可以编写出更加简洁、高效和易维护的 Java 代码。
