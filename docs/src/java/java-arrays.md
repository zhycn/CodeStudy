---
title: Java Arrays 工具类详解与最佳实践
author: zhycn
---

# Java Arrays 工具类详解与最佳实践

## 1 Arrays 工具类概述

Java `Arrays` 类位于 `java.util` 包中，是一个专门用于操作数组的强大工具类，自 JDK 1.2 版本引入。它提供了一系列静态方法，用于实现数组的排序、搜索、填充、比较等常见操作，大大简化了数组处理的复杂度。

### 1.1 设计理念与特点

Arrays 工具类遵循了工具类的通用设计原则：

- **构造器私有化**：防止被实例化，所有方法通过类名直接调用
- **方法静态化**：所有方法都是静态的，无需创建对象即可使用
- **线程安全注意**：工具类方法本身没有线程安全问题，但在共享变量修改时需要加锁
- **性能优化**：内部实现了多种高效算法，如双轴快速排序、二分查找等

### 1.2 Arrays 与 ArrayUtils 的区别

需要注意的是，Apache Commons Lang 库中的 `ArrayUtils` 提供了更多辅助功能，但在标准 Java 环境中，`Arrays` 类仍然是核心选择。

## 2 核心方法详解

### 2.1 数组输出与字符串转换：toString() 与 deepToString()

直接打印数组会输出对象的哈希值，而不是数组内容：

```java
int[] arr = {1, 2, 3, 4, 5};
System.out.println(arr); // 输出类似 [I@7150bd4d
```

使用 `Arrays.toString()` 方法可以获取可读的字符串表示：

```java
String arrString = Arrays.toString(arr);
System.out.println(arrString); // 输出 [1, 2, 3, 4, 5]
```

对于多维数组，需要使用 `deepToString()` 方法：

```java
int[][] matrix = {{1, 2}, {3, 4}};
System.out.println(Arrays.deepToString(matrix)); // 输出 [[1, 2], [3, 4]]
```

**实现原理**：`toString()` 方法内部使用 `StringBuilder` 进行高效拼接，自动添加方括号和逗号分隔符。

### 2.2 数组排序：sort() 与 parallelSort()

Arrays 类提供了高效的排序方法，对于基本类型采用优化后的快速排序算法，对于对象类型采用归并排序。

#### 2.2.1 基本排序

```java
int[] numbers = {5, 2, 9, 1, 5};
Arrays.sort(numbers); // 排序后：[1, 2, 5, 5, 9]
System.out.println(Arrays.toString(numbers));
```

#### 2.2.2 部分排序

```java
int[] numbers = {5, 2, 9, 1, 5, 6, 3};
Arrays.sort(numbers, 2, 5); // 对索引2到5(不包含5)的元素排序
System.out.println(Arrays.toString(numbers)); // 输出 [5, 2, 1, 5, 9, 6, 3]
```

#### 2.2.3 对象数组排序

对于对象数组，需要实现 `Comparable` 接口或提供 `Comparator` 比较器：

```java
// 自定义类
class SortDTO {
    private String sortTarget;

    public SortDTO(String sortTarget) {
        this.sortTarget = sortTarget;
    }

    public String getSortTarget() {
        return sortTarget;
    }
}

// 使用Comparator排序
SortDTO[] array = new SortDTO[3];
array[0] = new SortDTO("test01");
array[1] = new SortDTO("test03");
array[2] = new SortDTO("test02");

Arrays.sort(array, Comparator.comparing(SortDTO::getSortTarget));
System.out.println(Arrays.toString(array));
```

#### 2.2.4 并行排序

对于大规模数组（通常超过 10,000 个元素），可以使用并行排序提高性能：

```java
int[] bigArray = new int[100000];
// 初始化数组...
Arrays.parallelSort(bigArray); // 利用多核CPU并行排序
```

**最佳实践**：

- 小规模数组（< 1000 元素）使用 `sort()`
- 大规模数组（≥ 1000 元素）考虑使用 `parallelSort()`
- 对象数组排序需确保元素实现了 `Comparable` 接口或提供 `Comparator`

### 2.3 数组查找：binarySearch()

`binarySearch()` 方法使用二分查找算法在**已排序**的数组中查找元素。

#### 2.3.1 基本使用

```java
int[] sortedArr = {1, 3, 5, 7, 9};
int index = Arrays.binarySearch(sortedArr, 5); // 返回2
System.out.println("元素5的索引: " + index);
```

#### 2.3.2 查找不存在的元素

当查找不存在的元素时，方法返回一个负值，表示插入点（即将该元素插入数组后保持有序的位置）：

```java
int[] sortedArr = {1, 3, 5, 7, 9};
int index = Arrays.binarySearch(sortedArr, 6); // 返回-4
// 解释：如果插入6，应该在第4个位置（索引3之后），返回值为-(插入点)-1 → -4
```

#### 2.3.3 范围查找

```java
int[] sortedArr = {1, 3, 5, 7, 9, 11, 13};
// 在索引2到5(不包含5)的范围内查找
int index = Arrays.binarySearch(sortedArr, 2, 5, 7);
System.out.println("索引位置: " + index); // 返回3
```

**重要注意**：二分查找**必须**在已排序的数组上进行，否则结果不可预测。

### 2.4 数组比较：equals() 与 deepEquals()

`equals()` 方法用于比较两个数组的内容是否完全相同：

```java
int[] arr1 = {1, 2, 3};
int[] arr2 = {1, 2, 3};
int[] arr3 = {1, 2, 4};

System.out.println(Arrays.equals(arr1, arr2)); // 输出 true
System.out.println(Arrays.equals(arr1, arr3)); // 输出 false
```

对于多维数组，需要使用 `deepEquals()`：

```java
int[][] matrix1 = {{1, 2}, {3, 4}};
int[][] matrix2 = {{1, 2}, {3, 4}};
int[][] matrix3 = {{1, 2}, {3, 5}};

System.out.println(Arrays.deepEquals(matrix1, matrix2)); // 输出 true
System.out.println(Arrays.deepEquals(matrix1, matrix3)); // 输出 false
```

### 2.5 数组填充：fill()

`fill()` 方法用于将数组的所有元素设置为指定值：

```java
int[] arr = new int[5];
Arrays.fill(arr, 100);
System.out.println(Arrays.toString(arr)); // 输出 [100, 100, 100, 100, 100]
```

也可以只填充指定范围：

```java
int[] arr = new int[5];
Arrays.fill(arr, 1, 4, 100); // 将索引1到4(不包含4)的元素填充为100
System.out.println(Arrays.toString(arr)); // 输出 [0, 100, 100, 100, 0]
```

### 2.6 数组复制：copyOf() 与 copyOfRange()

Arrays 类提供了比手动循环更简洁的数组复制方法。

#### 2.6.1 copyOf()

```java
int[] original = {10, 20, 30, 40, 50};
int[] copy1 = Arrays.copyOf(original, 3); // 复制前3个元素
System.out.println(Arrays.toString(copy1)); // 输出 [10, 20, 30]

int[] copy2 = Arrays.copyOf(original, 7); // 复制所有元素并增加长度
System.out.println(Arrays.toString(copy2)); // 输出 [10, 20, 30, 40, 50, 0, 0]
```

#### 2.6.2 copyOfRange()

```java
int[] original = {10, 20, 30, 40, 50};
int[] copy = Arrays.copyOfRange(original, 1, 4); // 复制索引1到4(不包含4)的元素
System.out.println(Arrays.toString(copy)); // 输出 [20, 30, 40]
```

**性能提示**：这些方法底层调用 `System.arraycopy()`，是本地方法，性能较高。

### 2.7 数组转列表：asList()

`asList()` 方法将数组转换为固定大小的列表：

```java
String[] fruits = {"Apple", "Banana", "Orange"};
List<String> list = Arrays.asList(fruits);
System.out.println(list); // 输出 [Apple, Banana, Orange]
```

**重要限制**：

- 返回的列表大小固定，不支持添加或删除操作
- 对返回列表的修改会反映到原始数组上

```java
String[] fruits = {"Apple", "Banana", "Orange"};
List<String> list = Arrays.asList(fruits);

// 会抛出 UnsupportedOperationException
// list.add("Grape");

// 但可以修改元素，更改会反映到原始数组
list.set(0, "Peach");
System.out.println(fruits[0]); // 输出 "Peach"
```

如果需要可变列表，可以创建一个新的 ArrayList：

```java
String[] fruits = {"Apple", "Banana", "Orange"};
List<String> list = new ArrayList<>(Arrays.asList(fruits));
list.add("Grape"); // 现在可以正常添加
```

### 2.8 流式操作：stream()

Java 8 引入了 `stream()` 方法，将数组转换为流，便于进行函数式操作：

```java
int[] numbers = {1, 2, 3, 4, 5};

// 计算大于2的元素的平均值
double average = Arrays.stream(numbers)
                      .filter(n -> n > 2)
                      .average()
                      .orElse(0);

System.out.println("平均值: " + average); // 输出 4.0

// 将每个元素平方并收集为新数组
int[] squares = Arrays.stream(numbers)
                      .map(n -> n * n)
                      .toArray();

System.out.println("平方数组: " + Arrays.toString(squares)); // 输出 [1, 4, 9, 16, 25]
```

## 3 高级应用与最佳实践

### 3.1 性能优化技巧

1. **预估容量**：对于大规模数据操作，初始化时指定合适容量避免多次扩容

   ```java
   // 不佳做法：可能触发多次扩容
   List<Integer> list = new ArrayList<>();
   for (int i = 0; i < 100_000; i++) {
       list.add(i);
   }

   // 最佳实践：初始化指定容量
   List<Integer> list = new ArrayList<>(100_000);
   for (int i = 0; i < 100_000; i++) {
       list.add(i);
   }
   ```

2. **批量操作**：优先使用 `addAll()` 替代循环添加

3. **释放空间**：列表定型后调用 `trimToSize()` 释放空置数组空间

### 3.2 线程安全考虑

Arrays 类中的方法本身没有线程安全问题，但多个线程操作共享数组时需要同步。

**解决方案**：

- `Collections.synchronizedList()`：方法级 synchronized 锁
- `CopyOnWriteArrayList`：写时复制，读无锁，适合读多写少场景
- 手动加锁：使用 `synchronized` 块或 `ReentrantLock`

```java
// 使用Collections.synchronizedList
List<String> syncList = Collections.synchronizedList(new ArrayList<>());

// 遍历时仍需手动同步
synchronized(syncList) {
    for (String item : syncList) {
        // 处理元素
    }
}
```

### 3.3 常见陷阱与解决方案

#### 3.3.1 并发修改异常

```java
// 错误示例：遍历中删除元素
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));
for (String s : list) {
    if ("B".equals(s)) list.remove(s); // 抛出ConcurrentModificationException
}

// 正确做法1：使用Iterator.remove()
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if ("B".equals(it.next())) it.remove(); // 安全删除
}

// 正确做法2：Java 8+ removeIf()
list.removeIf(s -> "B".equals(s));
```

#### 3.3.2 subList 数据共享问题

```java
List<Integer> mainList = new ArrayList<>(Arrays.asList(1, 2, 3));
List<Integer> sub = mainList.subList(0, 2); // 共享同一数组

sub.set(0, 99); // 修改subList
System.out.println(mainList); // 输出[99, 2, 3]！影响原集合

// 解决方案：需要独立拷贝
List<Integer> safeCopy = new ArrayList<>(mainList.subList(0, 2));
```

## 4 综合应用示例

### 4.1 数组统计工具类

下面是一个使用 Arrays 类实现的数组统计工具类：

```java
import java.util.Arrays;
import java.util.DoubleSummaryStatistics;
import java.util.OptionalDouble;

public class ArrayStats {
    private double[] values;

    public ArrayStats(double[] values) {
        this.values = Arrays.copyOf(values, values.length);
    }

    // 计算平均值
    public OptionalDouble average() {
        if (values.length == 0) return OptionalDouble.empty();
        return Arrays.stream(values).average();
    }

    // 查找最大值
    public OptionalDouble max() {
        if (values.length == 0) return OptionalDouble.empty();
        return Arrays.stream(values).max();
    }

    // 查找最小值
    public OptionalDouble min() {
        if (values.length == 0) return OptionalDouble.empty();
        return Arrays.stream(values).min();
    }

    // 获取统计摘要
    public DoubleSummaryStatistics summary() {
        return Arrays.stream(values).summaryStatistics();
    }

    // 排序数组
    public void sort() {
        Arrays.sort(values);
    }

    // 查找中位数
    public OptionalDouble median() {
        if (values.length == 0) return OptionalDouble.empty();

        double[] sorted = Arrays.copyOf(values, values.length);
        Arrays.sort(sorted);

        int mid = sorted.length / 2;
        if (sorted.length % 2 == 0) {
            return OptionalDouble.of((sorted[mid - 1] + sorted[mid]) / 2.0);
        } else {
            return OptionalDouble.of(sorted[mid]);
        }
    }

    // 输出数组内容
    @Override
    public String toString() {
        return Arrays.toString(values);
    }
}

// 使用示例
public class Example {
    public static void main(String[] args) {
        double[] data = {12.5, 18.3, 11.7, 9.8, 15.2};
        ArrayStats stats = new ArrayStats(data);

        System.out.println("原始数据: " + stats);
        System.out.println("平均值: " + stats.average().orElse(0));
        System.out.println("最大值: " + stats.max().orElse(0));
        System.out.println("中位数: " + stats.median().orElse(0));

        stats.sort();
        System.out.println("排序后: " + stats);
    }
}
```

### 4.2 数组操作工具类

下面是一个综合运用 Arrays 各种方法的工具类：

```java
import java.util.Arrays;
import java.util.Comparator;
import java.util.function.Predicate;

public class ArrayUtils {
    /**
     * 过滤数组元素
     */
    public static <T> T[] filter(T[] array, Predicate<T> predicate) {
        @SuppressWarnings("unchecked")
        T[] result = (T[]) java.lang.reflect.Array.newInstance(
            array.getClass().getComponentType(), array.length);

        int count = 0;
        for (T item : array) {
            if (predicate.test(item)) {
                result[count++] = item;
            }
        }

        return Arrays.copyOf(result, count);
    }

    /**
     * 去重
     */
    public static <T> T[] distinct(T[] array) {
        T[] result = Arrays.copyOf(array, array.length);
        int count = 0;

        for (int i = 0; i < array.length; i++) {
            boolean found = false;
            for (int j = 0; j < count; j++) {
                if (array[i].equals(result[j])) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                result[count++] = array[i];
            }
        }

        return Arrays.copyOf(result, count);
    }

    /**
     * 查找最值
     */
    public static <T extends Comparable<? super T>> T max(T[] array) {
        if (array == null || array.length == 0) {
            throw new IllegalArgumentException("数组不能为空");
        }

        T max = array[0];
        for (int i = 1; i < array.length; i++) {
            if (array[i].compareTo(max) > 0) {
                max = array[i];
            }
        }

        return max;
    }

    /**
     * 使用自定义比较器查找最值
     */
    public static <T> T max(T[] array, Comparator<? super T> comparator) {
        if (array == null || array.length == 0) {
            throw new IllegalArgumentException("数组不能为空");
        }

        T max = array[0];
        for (int i = 1; i < array.length; i++) {
            if (comparator.compare(array[i], max) > 0) {
                max = array[i];
            }
        }

        return max;
    }

    /**
     * 数组合并
     */
    @SafeVarargs
    public static <T> T[] merge(T[]... arrays) {
        int totalLength = 0;
        for (T[] array : arrays) {
            totalLength += array.length;
        }

        @SuppressWarnings("unchecked")
        T[] result = (T[]) java.lang.reflect.Array.newInstance(
            arrays[0].getClass().getComponentType(), totalLength);

        int offset = 0;
        for (T[] array : arrays) {
            System.arraycopy(array, 0, result, offset, array.length);
            offset += array.length;
        }

        return result;
    }
}

// 使用示例
public class Example {
    public static void main(String[] args) {
        Integer[] numbers = {1, 2, 3, 4, 5, 2, 3, 6};

        // 过滤偶数
        Integer[] evenNumbers = ArrayUtils.filter(numbers, n -> n % 2 == 0);
        System.out.println("偶数: " + Arrays.toString(evenNumbers));

        // 去重
        Integer[] distinctNumbers = ArrayUtils.distinct(numbers);
        System.out.println("去重后: " + Arrays.toString(distinctNumbers));

        // 查找最大值
        Integer max = ArrayUtils.max(numbers);
        System.out.println("最大值: " + max);

        // 数组合并
        Integer[] array1 = {1, 2, 3};
        Integer[] array2 = {4, 5, 6};
        Integer[] array3 = {7, 8, 9};
        Integer[] merged = ArrayUtils.merge(array1, array2, array3);
        System.out.println("合并后: " + Arrays.toString(merged));
    }
}
```

## 5 总结

Java Arrays 工具类是一个功能强大、性能优异的数组操作工具，合理使用可以大大提高开发效率和代码质量。以下是关键要点总结：

1. **选择合适的方法**：

   | 需求         | 推荐方法                        | 注意事项                          |
   | ------------ | ------------------------------- | --------------------------------- |
   | 数组转字符串 | `toString()` / `deepToString()` | 多维数组使用 `deepToString()`     |
   | 排序         | `sort()` / `parallelSort()`     | 大规模数据用 `parallelSort()`     |
   | 查找         | `binarySearch()`                | 必须在已排序数组上使用            |
   | 比较         | `equals()` / `deepEquals()`     | 多维数组使用 `deepEquals()`       |
   | 填充         | `fill()`                        |                                   |
   | 复制         | `copyOf()` / `copyOfRange()`    | 底层使用高效 `System.arraycopy()` |
   | 转列表       | `asList()`                      | 返回固定大小列表                  |

2. **性能优化**：
   - 预估容量避免频繁扩容
   - 大数据集考虑使用并行操作
   - 批量操作优于循环操作

3. **线程安全**：
   - Arrays 方法本身无线程安全问题
   - 共享数组访问需要额外同步措施

4. **常见陷阱**：
   - `asList()` 返回固定大小列表
   - `subList()` 与原列表共享数据
   - 并发修改需要正确处理

Arrays 工具类是 Java 开发者必备的技能之一，掌握其各种方法和最佳实践，能够让你在处理数组时更加得心应手，编写出高效、简洁且可靠的代码。
