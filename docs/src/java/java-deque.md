---
title: Java Deque 双端队列详解与最佳实践
description: 本文详细介绍了 Java Deque 双端队列的核心特性、实现机制、使用场景和最佳实践。通过多个代码示例，帮助读者深入理解 Deque 的工作原理和在实际开发中的应用。
---

# Java Deque 双端队列详解与最佳实践

## 1. 引言

Deque（Double Ended Queue，双端队列）是 Java 集合框架中一个极其重要且功能强大的接口，它允许在队列的头部和尾部都高效地进行插入、删除和访问操作。这种独特的设计使 Deque 能够同时胜任队列（FIFO）和栈（LIFO）的角色，为各种复杂场景提供灵活的解决方案。

Java 从 1.6 版本开始引入 Deque 接口，并在后续版本中不断优化其实现。与传统的 Stack 类相比，Deque 提供了更优秀的性能表现和更丰富的 API；与普通 Queue 相比，Deque 提供了更灵活的操作方式。本文将深入探讨 Deque 的核心特性、实现机制、使用场景和最佳实践。

## 2. Deque 核心特性与优势

### 2.1 双端操作能力

Deque 最显著的特点是支持在队列的两端进行操作，这使其比普通队列更加灵活。你可以根据需要在头部或尾部插入、删除和查看元素。

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class DequeBasicOperations {
    public static void main(String[] args) {
        // 创建 Deque
        Deque<String> deque = new ArrayDeque<>();

        // 在头部插入元素
        deque.addFirst("Head Element 1");
        deque.offerFirst("Head Element 2");

        // 在尾部插入元素
        deque.addLast("Tail Element 1");
        deque.offerLast("Tail Element 2");

        System.out.println("Deque 内容: " + deque);

        // 从头部操作
        String firstElement = deque.getFirst();
        String removedFirst = deque.removeFirst();

        // 从尾部操作
        String lastElement = deque.getLast();
        String removedLast = deque.removeLast();

        System.out.println("头部元素: " + firstElement);
        System.out.println("尾部元素: " + lastElement);
    }
}
```

### 2.2 同时支持队列和栈操作

Deque 既可以作为队列使用（FIFO），也可以作为栈使用（LIFO），这种双重身份使其成为最灵活的数据结构之一。

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class DequeAsQueueAndStack {
    public static void main(String[] args) {
        // 作为队列使用 (FIFO)
        Deque<Integer> queue = new ArrayDeque<>();
        queue.addLast(1);  // 入队
        queue.addLast(2);
        queue.addLast(3);

        System.out.println("队列操作 (FIFO):");
        while (!queue.isEmpty()) {
            System.out.println("出队: " + queue.removeFirst());
        }

        // 作为栈使用 (LIFO)
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1);  // 压栈，等价于 addFirst
        stack.push(2);
        stack.push(3);

        System.out.println("栈操作 (LIFO):");
        while (!stack.isEmpty()) {
            System.out.println("弹栈: " + stack.pop());  // 等价于 removeFirst
        }
    }
}
```

### 2.3 丰富的方法选择

Deque 接口为每种操作提供了两套方法：一套在操作失败时抛出异常，另一套返回特殊值（如 null 或 false）。这种设计让开发者可以根据具体需求选择更合适的错误处理方式。

| **操作类型** | **抛出异常的方法** | **返回特殊值的方法** | **描述**             |
| ------------ | ------------------ | -------------------- | -------------------- |
| **头部插入** | `addFirst(e)`      | `offerFirst(e)`      | 在头部插入元素       |
| **尾部插入** | `addLast(e)`       | `offerLast(e)`       | 在尾部插入元素       |
| **头部移除** | `removeFirst()`    | `pollFirst()`        | 移除并返回头部元素   |
| **尾部移除** | `removeLast()`     | `pollLast()`         | 移除并返回尾部元素   |
| **头部查看** | `getFirst()`       | `peekFirst()`        | 查看但不移除头部元素 |
| **尾部查看** | `getLast()`        | `peekLast()`         | 查看但不移除尾部元素 |

## 3. Deque 与 Queue 的对比

Deque 继承自 Queue 接口，但提供了更丰富的功能。以下是两者的主要区别：

| **特性**     | **Deque**              | **Queue**                 |
| ------------ | ---------------------- | ------------------------- |
| **操作方式** | 双端操作               | 单端操作                  |
| **插入位置** | 头部和尾部             | 仅尾部                    |
| **删除位置** | 头部和尾部             | 仅头部                    |
| **主要用途** | 实现栈和队列           | FIFO 队列                 |
| **实现类**   | ArrayDeque, LinkedList | LinkedList, PriorityQueue |

```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.LinkedList;
import java.util.Queue;

public class DequeVsQueue {
    public static void main(String[] args) {
        // Queue 只能在一端插入，另一端删除
        Queue<String> queue = new LinkedList<>();
        queue.offer("Element 1");  // 尾部插入
        queue.offer("Element 2");
        String element = queue.poll();  // 头部移除

        // Deque 可以在两端操作
        Deque<String> deque = new ArrayDeque<>();
        deque.offerFirst("Head Element");  // 头部插入
        deque.offerLast("Tail Element");   // 尾部插入
        String first = deque.pollFirst();  // 头部移除
        String last = deque.pollLast();    // 尾部移除

        System.out.println("Queue 操作: " + element);
        System.out.println("Deque 头部操作: " + first);
        System.out.println("Deque 尾部操作: " + last);
    }
}
```

## 4. Deque 的主要实现类

Java 提供了多个 Deque 接口的实现类，每个类都有其特定的优势和适用场景。

### 4.1 ArrayDeque

ArrayDeque 是基于动态数组的双端队列实现，是 Deque 接口的默认推荐实现。

**核心特性：**

- 基于循环数组实现，内存紧凑
- 默认初始容量为 16，自动扩容为 2 的幂次
- 插入/删除操作的时间复杂度为 O(1)
- 非线程安全，性能优于 LinkedList
- 不允许存储 null 元素

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class ArrayDequeExample {
    public static void main(String[] args) {
        // 创建 ArrayDeque，可指定初始容量
        Deque<Integer> arrayDeque = new ArrayDeque<>(32);

        // 添加元素
        for (int i = 0; i < 10; i++) {
            arrayDeque.offerFirst(i * 2);      // 头部插入
            arrayDeque.offerLast(i * 2 + 1);   // 尾部插入
        }

        System.out.println("ArrayDeque 大小: " + arrayDeque.size());
        System.out.println("ArrayDeque 内容: " + arrayDeque);

        // 迭代遍历
        System.out.println("正向遍历:");
        for (Integer num : arrayDeque) {
            System.out.print(num + " ");
        }
        System.out.println();

        // 反向遍历
        System.out.println("反向遍历:");
        for (Iterator<Integer> it = arrayDeque.descendingIterator(); it.hasNext();) {
            System.out.print(it.next() + " ");
        }
    }
}
```

### 4.2 LinkedList

LinkedList 是基于双向链表的实现，同时实现了 List 和 Deque 接口。

**核心特性：**

- 基于双向链表实现
- 插入删除效率高，无需移动元素
- 随机访问效率低（O(n)时间复杂度）
- 非线程安全
- 允许存储 null 元素

```java
import java.util.Deque;
import java.util.LinkedList;

public class LinkedListAsDeque {
    public static void main(String[] args) {
        // LinkedList 作为 Deque 使用
        Deque<String> linkedListDeque = new LinkedList<>();

        // 添加元素
        linkedListDeque.addFirst("First");
        linkedListDeque.addLast("Last");
        linkedListDeque.offerFirst("Offered First");
        linkedListDeque.offerLast("Offered Last");

        // 访问元素
        String first = linkedListDeque.getFirst();
        String last = linkedListDeque.getLast();

        System.out.println("头部元素: " + first);
        System.out.println("尾部元素: " + last);

        // 删除元素
        String removedFirst = linkedListDeque.removeFirst();
        String removedLast = linkedListDeque.removeLast();

        System.out.println("删除的头部元素: " + removedFirst);
        System.out.println("删除的尾部元素: " + removedLast);
    }
}
```

### 4.3 并发实现：ConcurrentLinkedDeque 和 LinkedBlockingDeque

对于多线程环境，Java 提供了两种线程安全的 Deque 实现。

#### 4.3.1 ConcurrentLinkedDeque

基于无锁算法的并发双向链表，适合高并发环境。

```java
import java.util.concurrent.ConcurrentLinkedDeque;

public class ConcurrentLinkedDequeExample {
    public static void main(String[] args) throws InterruptedException {
        ConcurrentLinkedDeque<Integer> concurrentDeque = new ConcurrentLinkedDeque<>();

        // 生产者线程
        Thread producer = new Thread(() -> {
            for (int i = 0; i < 100; i++) {
                concurrentDeque.offerFirst(i);
                try {
                    Thread.sleep(10);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });

        // 消费者线程
        Thread consumer = new Thread(() -> {
            int count = 0;
            while (count < 100) {
                Integer element = concurrentDeque.pollLast();
                if (element != null) {
                    System.out.println("消费: " + element);
                    count++;
                }
                try {
                    Thread.sleep(15);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });

        producer.start();
        consumer.start();
        producer.join();
        consumer.join();

        System.out.println("最终队列大小: " + concurrentDeque.size());
    }
}
```

#### 4.3.2 LinkedBlockingDeque

基于链表的阻塞双端队列，支持容量限制和阻塞操作。

```java
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;

public class LinkedBlockingDequeExample {
    public static void main(String[] args) throws InterruptedException {
        // 创建有界阻塞双端队列
        LinkedBlockingDeque<String> blockingDeque = new LinkedBlockingDeque<>(5);

        // 生产者线程
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    String item = "Item " + i;
                    if (i % 2 == 0) {
                        blockingDeque.putFirst(item);  // 阻塞式头部插入
                        System.out.println("生产到头部: " + item);
                    } else {
                        blockingDeque.putLast(item);   // 阻塞式尾部插入
                        System.out.println("生产到尾部: " + item);
                    }
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        // 消费者线程
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    String item;
                    if (i % 2 == 0) {
                        item = blockingDeque.takeFirst();  // 阻塞式头部获取
                        System.out.println("从头部消费: " + item);
                    } else {
                        item = blockingDeque.takeLast();   // 阻塞式尾部获取
                        System.out.println("从尾部消费: " + item);
                    }
                    Thread.sleep(150);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
    }
}
```

### 4.4 实现类对比与选型指南

| **特性**      | **ArrayDeque** | **LinkedList** | **ConcurrentLinkedDeque** | **LinkedBlockingDeque** |
| ------------- | -------------- | -------------- | ------------------------- | ----------------------- |
| **底层结构**  | 动态循环数组   | 双向链表       | 并发链表                  | 阻塞链表                |
| **线程安全**  | 否             | 否             | 是（无锁）                | 是（阻塞）              |
| **容量限制**  | 自动扩容       | 无界           | 无界                      | 可配置有界              |
| **null 元素** | 不允许         | 允许           | 不允许                    | 不允许                  |
| **性能特点**  | 高速随机访问   | 高效插入删除   | 高并发性能                | 阻塞操作                |
| **适用场景**  | 单线程环境     | 需要列表功能   | 高并发读操作              | 生产者-消费者模式       |

**选型建议：**

- **单线程环境**：优先选择 ArrayDeque，性能最优
- **需要同时作为 List 使用**：选择 LinkedList
- **高并发环境，无界队列**：选择 ConcurrentLinkedDeque
- **有界阻塞队列，生产者-消费者模式**：选择 LinkedBlockingDeque

## 5. Deque 的典型应用场景

### 5.1 栈实现（替代 Stack 类）

Java 官方推荐使用 Deque 替代传统的 Stack 类，因为 Deque 提供了更高效的栈操作。

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class StackWithDeque {
    // 表达式括号匹配检查
    public static boolean isBalanced(String expression) {
        Deque<Character> stack = new ArrayDeque<>();

        for (char ch : expression.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') {
                stack.push(ch);  // 压栈
            } else if (ch == ')' || ch == ']' || ch == '}') {
                if (stack.isEmpty()) {
                    return false;
                }

                char top = stack.pop();  // 弹栈
                if ((ch == ')' && top != '(') ||
                    (ch == ']' && top != '[') ||
                    (ch == '}' && top != '{')) {
                    return false;
                }
            }
        }

        return stack.isEmpty();
    }

    public static void main(String[] args) {
        String[] testExpressions = {
            "((a + b) * (c - d))",
            "[(x + y) * {z - w}]",
            "((a + b) * (c - d)",
            "[(x + y} * {z - w])"
        };

        for (String expr : testExpressions) {
            System.out.println(expr + " : " + (isBalanced(expr) ? "平衡" : "不平衡"));
        }
    }
}
```

### 5.2 滑动窗口算法

Deque 在解决滑动窗口相关问题中表现出色，如计算滑动窗口最大值。

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class SlidingWindowMaximum {
    public static int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || nums.length == 0 || k <= 0) {
            return new int[0];
        }

        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new ArrayDeque<>();  // 存储索引

        for (int i = 0; i < n; i++) {
            // 移除超出窗口范围的元素
            while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
                deque.pollFirst();
            }

            // 移除尾部小于当前元素的索引，保持递减序列
            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
                deque.pollLast();
            }

            // 添加当前索引
            deque.offerLast(i);

            // 记录当前窗口最大值
            if (i >= k - 1) {
                result[i - k + 1] = nums[deque.peekFirst()];
            }
        }

        return result;
    }

    public static void main(String[] args) {
        int[] nums = {1, 3, -1, -3, 5, 3, 6, 7};
        int k = 3;
        int[] result = maxSlidingWindow(nums, k);

        System.out.println("滑动窗口最大值:");
        for (int num : result) {
            System.out.print(num + " ");
        }
        // 输出: 3 3 5 5 6 7
    }
}
```

### 5.3 LRU 缓存实现

结合 HashMap 和 Deque 可以实现高效的 LRU（最近最少使用）缓存机制。

```java
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Map;

public class LRUCache<K, V> {
    private final int capacity;
    private final Map<K, V> map;
    private final Deque<K> deque;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new HashMap<>();
        this.deque = new LinkedList<>();
    }

    public V get(K key) {
        if (map.containsKey(key)) {
            // 移动到最近使用的位置
            deque.remove(key);
            deque.addFirst(key);
            return map.get(key);
        }
        return null;
    }

    public void put(K key, V value) {
        if (map.containsKey(key)) {
            // 更新现有键的值并移动到最近使用的位置
            deque.remove(key);
        } else if (map.size() >= capacity) {
            // 移除最久未使用的元素
            K oldestKey = deque.removeLast();
            map.remove(oldestKey);
        }

        deque.addFirst(key);
        map.put(key, value);
    }

    public void display() {
        System.out.println("缓存内容 (最近使用的在前):");
        for (K key : deque) {
            System.out.println(key + " : " + map.get(key));
        }
    }

    public static void main(String[] args) {
        LRUCache<String, Integer> cache = new LRUCache<>(3);

        cache.put("A", 1);
        cache.put("B", 2);
        cache.put("C", 3);
        cache.display();

        // 访问 A，使其成为最近使用的
        cache.get("A");
        cache.display();

        // 添加新元素，淘汰最久未使用的 (B)
        cache.put("D", 4);
        cache.display();
    }
}
```

### 5.4 回文检测

Deque 非常适合用于检查序列是否为回文。

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class PalindromeChecker {
    public static boolean isPalindrome(String str) {
        if (str == null || str.isEmpty()) {
            return false;
        }

        Deque<Character> deque = new ArrayDeque<>();

        // 将字符串字符添加到双端队列
        for (char ch : str.toCharArray()) {
            if (Character.isLetterOrDigit(ch)) {
                deque.addLast(Character.toLowerCase(ch));
            }
        }

        // 从两端同时检查是否匹配
        while (deque.size() > 1) {
            if (!deque.removeFirst().equals(deque.removeLast())) {
                return false;
            }
        }

        return true;
    }

    public static void main(String[] args) {
        String[] testStrings = {
            "radar",
            "A man, a plan, a canal, Panama",
            "hello",
            "RaceCar"
        };

        for (String str : testStrings) {
            System.out.println("'" + str + "' 是回文: " + isPalindrome(str));
        }
    }
}
```

### 5.5 生产者-消费者模式

LinkedBlockingDeque 非常适合实现生产者-消费者模式。

```java
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;

public class ProducerConsumerExample {
    private static final int CAPACITY = 5;
    private static final LinkedBlockingDeque<String> deque = new LinkedBlockingDeque<>(CAPACITY);

    static class Producer implements Runnable {
        private final String name;

        public Producer(String name) {
            this.name = name;
        }

        @Override
        public void run() {
            try {
                for (int i = 1; i <= 10; i++) {
                    String item = name + "-" + i;

                    if (i % 2 == 0) {
                        deque.putFirst(item);  // 高优先级任务放头部
                        System.out.println(name + " 生产到头部: " + item);
                    } else {
                        deque.putLast(item);   // 普通任务放尾部
                        System.out.println(name + " 生产到尾部: " + item);
                    }

                    TimeUnit.MILLISECONDS.sleep(200);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    static class Consumer implements Runnable {
        private final String name;

        public Consumer(String name) {
            this.name = name;
        }

        @Override
        public void run() {
            try {
                for (int i = 1; i <= 10; i++) {
                    // 优先从头部获取高优先级任务
                    String item = deque.takeFirst();
                    System.out.println(name + " 消费: " + item);

                    TimeUnit.MILLISECONDS.sleep(300);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread producer1 = new Thread(new Producer("Producer1"));
        Thread producer2 = new Thread(new Producer("Producer2"));
        Thread consumer = new Thread(new Consumer("Consumer"));

        producer1.start();
        producer2.start();
        consumer.start();

        producer1.join();
        producer2.join();
        consumer.join();
    }
}
```

## 6. 多线程环境下的使用

### 6.1 线程安全选择

在多线程环境中使用 Deque 时，需要特别注意线程安全问题。

```java
import java.util.Deque;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class ThreadSafeDequeExample {
    public static void main(String[] args) throws InterruptedException {
        Deque<Integer> threadSafeDeque = new ConcurrentLinkedDeque<>();
        ExecutorService executor = Executors.newFixedThreadPool(4);

        // 启动多个生产者线程
        for (int i = 0; i < 2; i++) {
            final int producerId = i;
            executor.submit(() -> {
                for (int j = 0; j < 10; j++) {
                    threadSafeDeque.offerFirst(producerId * 100 + j);
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            });
        }

        // 启动多个消费者线程
        for (int i = 0; i < 2; i++) {
            executor.submit(() -> {
                while (!threadSafeDeque.isEmpty() || !Thread.currentThread().isInterrupted()) {
                    Integer value = threadSafeDeque.pollLast();
                    if (value != null) {
                        System.out.println("消费: " + value);
                    }
                    try {
                        Thread.sleep(150);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            });
        }

        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        System.out.println("最终队列大小: " + threadSafeDeque.size());
    }
}
```

### 6.2 非线程安全 Deque 的同步包装

如果已经有代码使用非线程安全的 Deque，可以使用 Collections.synchronizedDeque 方法进行包装。

```java
import java.util.ArrayDeque;
import java.util.Collections;
import java.util.Deque;

public class SynchronizedDequeExample {
    public static void main(String[] args) {
        // 创建非线程安全的 Deque
        Deque<String> unsafeDeque = new ArrayDeque<>();

        // 包装为线程安全的 Deque
        Deque<String> synchronizedDeque = Collections.synchronizedDeque(unsafeDeque);

        // 多线程操作
        Runnable task = () -> {
            for (int i = 0; i < 5; i++) {
                String threadName = Thread.currentThread().getName();
                synchronizedDeque.offerFirst(threadName + "-" + i);
                System.out.println(threadName + " 添加: " + threadName + "-" + i);

                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        };

        Thread thread1 = new Thread(task, "Thread-1");
        Thread thread2 = new Thread(task, "Thread-2");

        thread1.start();
        thread2.start();

        try {
            thread1.join();
            thread2.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println("最终队列: " + synchronizedDeque);
    }
}
```

## 7. 性能优化与最佳实践

### 7.1 容量规划

对于 ArrayDeque，合理的初始容量设置可以避免频繁扩容，提升性能。

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class CapacityPlanning {
    public static void main(String[] args) {
        // 已知需要存储大约 1000 个元素
        int expectedSize = 1000;

        // 设置初始容量为大于预期大小的最小 2 的幂次
        int initialCapacity = 1;
        while (initialCapacity < expectedSize) {
            initialCapacity <<= 1;
        }

        Deque<Integer> optimizedDeque = new ArrayDeque<>(initialCapacity);

        long startTime = System.nanoTime();
        for (int i = 0; i < expectedSize; i++) {
            optimizedDeque.offerFirst(i);
        }
        long endTime = System.nanoTime();

        System.out.println("优化后 Deque 操作时间: " + (endTime - startTime) + " ns");

        // 对比默认容量的性能
        Deque<Integer> defaultDeque = new ArrayDeque<>();

        startTime = System.nanoTime();
        for (int i = 0; i < expectedSize; i++) {
            defaultDeque.offerFirst(i);
        }
        endTime = System.nanoTime();

        System.out.println("默认 Deque 操作时间: " + (endTime - startTime) + " ns");
    }
}
```

### 7.2 方法选择策略

根据不同的使用场景选择合适的方法。

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class MethodSelection {
    public static void main(String[] args) {
        Deque<String> deque = new ArrayDeque<>();

        // 1. 添加元素 - 根据是否需要返回值选择
        deque.addFirst("addFirst");    // 无返回值，失败抛异常
        boolean offered = deque.offerFirst("offerFirst");  // 返回是否成功

        // 2. 移除元素 - 根据异常处理需求选择
        try {
            String element = deque.removeFirst();  // 空队列时抛异常
            System.out.println("移除: " + element);
        } catch (Exception e) {
            System.out.println("队列为空，无法移除");
        }

        // 或者使用返回 null 的方法
        String element = deque.pollFirst();  // 空队列时返回 null
        if (element != null) {
            System.out.println("移除: " + element);
        } else {
            System.out.println("队列为空");
        }

        // 3. 查看元素 - 根据异常处理需求选择
        try {
            String first = deque.getFirst();  // 空队列时抛异常
            System.out.println("头部元素: " + first);
        } catch (Exception e) {
            System.out.println("队列为空");
        }

        // 或者使用返回 null 的方法
        String first = deque.peekFirst();  // 空队列时返回 null
        if (first != null) {
            System.out.println("头部元素: " + first);
        } else {
            System.out.println("队列为空");
        }
    }
}
```

### 7.3 避免常见陷阱

```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;

public class CommonPitfalls {
    public static void main(String[] args) {
        // 陷阱 1: 在迭代过程中修改队列
        Deque<Integer> deque = new ArrayDeque<>();
        for (int i = 0; i < 5; i++) {
            deque.offerLast(i);
        }

        // 错误做法：在 foreach 循环中修改队列
        try {
            for (Integer num : deque) {
                if (num == 2) {
                    deque.remove(num);  // 抛出 ConcurrentModificationException
                }
            }
        } catch (Exception e) {
            System.out.println("错误: " + e.getClass().getSimpleName());
        }

        // 正确做法：使用迭代器的 remove 方法
        Iterator<Integer> iterator = deque.iterator();
        while (iterator.hasNext()) {
            Integer num = iterator.next();
            if (num == 2) {
                iterator.remove();  // 安全地移除元素
            }
        }
        System.out.println("安全移除后的队列: " + deque);

        // 陷阱 2: 无界队列导致内存溢出
        Deque<byte[]> memoryHungryDeque = new ArrayDeque<>();
        try {
            for (int i = 0; i < Integer.MAX_VALUE; i++) {
                memoryHungryDeque.offerLast(new byte[1024 * 1024]);  // 1MB 对象
                if (i % 100 == 0) {
                    System.out.println("已添加 " + i + " 个元素");
                }
            }
        } catch (OutOfMemoryError e) {
            System.out.println("内存溢出! 队列大小: " + memoryHungryDeque.size());
        }

        // 解决方案：使用有界队列或合理控制队列大小
        final int MAX_CAPACITY = 1000;
        Deque<byte[]> boundedDeque = new ArrayDeque<>(MAX_CAPACITY);
        for (int i = 0; i < MAX_CAPACITY; i++) {
            boundedDeque.offerLast(new byte[1024]);  // 1KB 对象
        }

        // 添加新元素时移除旧元素
        while (boundedDeque.size() >= MAX_CAPACITY) {
            boundedDeque.pollFirst();
        }
        boundedDeque.offerLast(new byte[1024]);

        System.out.println("有界队列大小: " + boundedDeque.size());
    }
}
```

## 8. 总结

Java Deque 是一个功能强大且灵活的双端队列接口，提供了在队列两端进行高效操作的能力。通过选择合适的实现类（ArrayDeque、LinkedList、ConcurrentLinkedDeque 或 LinkedBlockingDeque），可以满足各种不同场景的需求。

**关键要点总结：**

1. **接口优先原则**：总是使用 Deque 接口声明变量，而不是具体实现类。
2. **实现类选择**：
   - 单线程环境优先选择 ArrayDeque。
   - 需要同时作为 List 使用时选择 LinkedList。
   - 高并发环境选择 ConcurrentLinkedDeque（无界）或 LinkedBlockingDeque（有界）。
3. **方法选择**：根据异常处理需求选择抛出异常或返回特殊值的方法版本。
4. **性能优化**：为 ArrayDeque 设置合理的初始容量，避免频繁扩容。
5. **线程安全**：在多线程环境中使用线程安全的实现或进行同步包装。
6. **内存管理**：注意无界队列可能导致的内存溢出问题，使用有界队列或控制队列大小。

Deque 的强大功能使其成为 Java 集合框架中最有用的接口之一，熟练掌握 Deque 的使用和最佳实践，将显著提升你的 Java 编程能力和代码质量。
