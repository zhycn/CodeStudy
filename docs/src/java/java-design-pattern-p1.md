---
title: Java设计模式精讲：单例模式与工厂模式
description: 单例模式与工厂模式是Java中最常用的设计模式之一，本文将详细介绍这两种模式的核心思想、特点、实现方式以及应用场景。
---

# Java 设计模式精讲：单例模式与工厂模式

## 1. 单例模式 (Singleton Pattern)

### 1.1 核心思想与特点

单例模式是一种**创建型设计模式**，其核心目标是确保一个类只有一个实例，并提供一个全局访问点来获取该实例。这种模式在需要控制资源共享或限制某些类只能有一个实例的场景中非常有用。

单例模式主要特点包括：

- **唯一实例**：单例类只能有一个实例对象
- **自我创建**：单例类需要自己创建自己的唯一实例
- **全局访问**：单例类必须向整个系统提供这个实例

### 1.2 实现方式详解

#### 1.2.1 饿汉式 (Eager Initialization)

饿汉式在类加载时就完成实例化，因此是线程安全的，但无法实现延迟加载。

```java
public class EagerSingleton {
    // 在类加载时即完成实例化
    private static final EagerSingleton INSTANCE = new EagerSingleton();

    // 私有化构造函数以防止外部直接创建实例
    private EagerSingleton() {}

    // 提供全局访问点
    public static EagerSingleton getInstance() {
        return INSTANCE;
    }
}
```

**优缺点分析**：

- ✅ **优点**：实现简单，线程安全
- ❌ **缺点**：如果实例未被使用，会造成内存浪费

#### 1.2.2 懒汉式 (Lazy Initialization)

懒汉式在第一次调用`getInstance()`方法时才创建实例，实现了延迟加载，但基础的懒汉式是线程不安全的。

```java
public class LazySingleton {
    private static LazySingleton instance;

    private LazySingleton() {}

    public static LazySingleton getInstance() {
        if (instance == null) {
            instance = new LazySingleton();
        }
        return instance;
    }
}
```

**线程安全版懒汉式**：

```java
public class ThreadSafeLazySingleton {
    private static ThreadSafeLazySingleton instance;

    private ThreadSafeLazySingleton() {}

    // 添加synchronized关键字保证线程安全
    public static synchronized ThreadSafeLazySingleton getInstance() {
        if (instance == null) {
            instance = new ThreadSafeLazySingleton();
        }
        return instance;
    }
}
```

**优缺点分析**：

- ✅ **优点**：延迟加载，节省资源
- ❌ **缺点**：同步方法效率较低

#### 1.2.3 双重检查锁定 (Double-Checked Locking)

双重检查锁定是对懒汉式的优化，减少了同步开销，同时保证了线程安全。

```java
public class DoubleCheckedSingleton {
    // 使用volatile防止指令重排序
    private static volatile DoubleCheckedSingleton instance;

    private DoubleCheckedSingleton() {}

    public static DoubleCheckedSingleton getInstance() {
        if (instance == null) {
            synchronized (DoubleCheckedSingleton.class) {
                if (instance == null) {
                    instance = new DoubleCheckedSingleton();
                }
            }
        }
        return instance;
    }
}
```

**优缺点分析**：

- ✅ **优点**：线程安全，延迟加载，性能较高
- ❌ **缺点**：实现稍复杂，需要理解volatile关键字的作用

#### 1.2.4 静态内部类 (Static Inner Class)

静态内部类方式利用Java类加载机制保证线程安全，同时实现了延迟加载。

```java
public class StaticInnerClassSingleton {

    private StaticInnerClassSingleton() {}

    // 静态内部类在第一次被引用时才会加载
    private static class Holder {
        private static final StaticInnerClassSingleton INSTANCE = new StaticInnerClassSingleton();
    }

    public static StaticInnerClassSingleton getInstance() {
        return Holder.INSTANCE;
    }
}
```

**优缺点分析**：

- ✅ **优点**：线程安全，延迟加载，实现简洁
- ❌ **缺点**：需要理解静态内部类的加载机制

#### 1.2.5 枚举 (Enum)

枚举是实现单例的一种推荐方式，它天然支持线程安全，并且可以防止反射攻击和序列化问题。

```java
public enum EnumSingleton {
    INSTANCE;

    public void doSomething() {
        System.out.println("EnumSingleton is working");
    }
}
```

**使用示例**：

```java
EnumSingleton.INSTANCE.doSomething();
```

**优缺点分析**：

- ✅ **优点**：线程安全，防止反射攻击，实现简单
- ❌ **缺点**：不支持延迟加载

### 1.3 单例模式实现方式对比

下表总结了单例模式不同实现方式的特点：

| **实现方式**     | **线程安全** | **延迟加载** | **防止反射攻击** | **实现难度** | **性能** |
| ---------------- | ------------ | ------------ | ---------------- | ------------ | -------- |
| **饿汉式**       | ✅           | ❌           | ❌               | ⭐⭐         | 高       |
| **懒汉式(基础)** | ❌           | ✅           | ❌               | ⭐⭐         | 高       |
| **懒汉式(同步)** | ✅           | ✅           | ❌               | ⭐⭐⭐       | 低       |
| **双重检查锁定** | ✅           | ✅           | ❌               | ⭐⭐⭐⭐     | 中       |
| **静态内部类**   | ✅           | ✅           | ❌               | ⭐⭐⭐       | 高       |
| **枚举**         | ✅           | ❌           | ✅               | ⭐           | 高       |

## 2. 工厂模式 (Factory Pattern)

### 2.1 核心思想与分类

工厂模式是一种**创建型设计模式**，它提供了一种创建对象的最佳方式，将对象的实例化过程封装起来，使客户端代码不依赖于具体的类实现。工厂模式的核心目的是将对象的创建与使用分离，降低系统的耦合度，提高代码的可维护性和扩展性。

工厂模式主要分为三类：

1. **简单工厂模式 (Simple Factory Pattern)**：一个工厂类根据传入的参数决定创建哪一种产品类的实例
2. **工厂方法模式 (Factory Method Pattern)**：定义一个创建对象的接口，但让子类决定实例化哪一个类
3. **抽象工厂模式 (Abstract Factory Pattern)**：提供一个接口用于创建相关或依赖对象的家族，而不需要明确指定具体类

### 2.2 简单工厂模式

简单工厂模式通过一个工厂类，根据传入的参数来创建不同类的实例。

```java
// 产品接口
interface Product {
    void use();
}

// 具体产品A
class ConcreteProductA implements Product {
    @Override
    public void use() {
        System.out.println("Using Product A");
    }
}

// 具体产品B
class ConcreteProductB implements Product {
    @Override
    public void use() {
        System.out.println("Using Product B");
    }
}

// 简单工厂
class SimpleFactory {
    public static Product createProduct(String type) {
        if ("A".equals(type)) {
            return new ConcreteProductA();
        } else if ("B".equals(type)) {
            return new ConcreteProductB();
        }
        return null;
    }
}

// 使用示例
public class Client {
    public static void main(String[] args) {
        Product productA = SimpleFactory.createProduct("A");
        productA.use();  // 输出: Using Product A

        Product productB = SimpleFactory.createProduct("B");
        productB.use();  // 输出: Using Product B
    }
}
```

**优缺点分析**：

- ✅ **优点**：将对象的创建和使用分离，客户端无需知道具体类名
- ❌ **缺点**：违反开闭原则，添加新产品需要修改工厂类逻辑

### 2.3 工厂方法模式

工厂方法模式定义了一个创建对象的接口，但让子类决定实例化哪一个类。

```java
// 产品接口
interface Product {
    void use();
}

// 具体产品A
class ConcreteProductA implements Product {
    @Override
    public void use() {
        System.out.println("Using Product A");
    }
}

// 具体产品B
class ConcreteProductB implements Product {
    @Override
    public void use() {
        System.out.println("Using Product B");
    }
}

// 工厂接口
interface Factory {
    Product createProduct();
}

// 具体工厂A
class ConcreteFactoryA implements Factory {
    @Override
    public Product createProduct() {
        return new ConcreteProductA();
    }
}

// 具体工厂B
class ConcreteFactoryB implements Factory {
    @Override
    public Product createProduct() {
        return new ConcreteProductB();
    }
}

// 使用示例
public class Client {
    public static void main(String[] args) {
        Factory factoryA = new ConcreteFactoryA();
        Product productA = factoryA.createProduct();
        productA.use();  // 输出: Using Product A

        Factory factoryB = new ConcreteFactoryB();
        Product productB = factoryB.createProduct();
        productB.use();  // 输出: Using Product B
    }
}
```

**优缺点分析**：

- ✅ **优点**：符合开闭原则，增加新产品不影响现有代码
- ❌ **缺点**：每增加一个产品就需要增加一个具体工厂类，可能导致类数量增多

### 2.4 抽象工厂模式

抽象工厂模式提供一个接口用于创建相关或依赖对象的家族，而不需要明确指定具体类。

```java
// 产品族A接口
interface AbstractProductA {
    void use();
}

// 产品族B接口
interface AbstractProductB {
    void operate();
}

// 具体产品A1
class ProductA1 implements AbstractProductA {
    @Override
    public void use() {
        System.out.println("Using Product A1");
    }
}

// 具体产品A2
class ProductA2 implements AbstractProductA {
    @Override
    public void use() {
        System.out.println("Using Product A2");
    }
}

// 具体产品B1
class ProductB1 implements AbstractProductB {
    @Override
    public void operate() {
        System.out.println("Operating Product B1");
    }
}

// 具体产品B2
class ProductB2 implements AbstractProductB {
    @Override
    public void operate() {
        System.out.println("Operating Product B2");
    }
}

// 抽象工厂接口
interface AbstractFactory {
    AbstractProductA createProductA();
    AbstractProductB createProductB();
}

// 具体工厂1：生产产品族1（A1和B1）
class ConcreteFactory1 implements AbstractFactory {
    @Override
    public AbstractProductA createProductA() {
        return new ProductA1();
    }

    @Override
    public AbstractProductB createProductB() {
        return new ProductB1();
    }
}

// 具体工厂2：生产产品族2（A2和B2）
class ConcreteFactory2 implements AbstractFactory {
    @Override
    public AbstractProductA createProductA() {
        return new ProductA2();
    }

    @Override
    public AbstractProductB createProductB() {
        return new ProductB2();
    }
}

// 使用示例
public class Client {
    public static void main(String[] args) {
        // 使用工厂1创建产品族1
        AbstractFactory factory1 = new ConcreteFactory1();
        AbstractProductA productA1 = factory1.createProductA();
        AbstractProductB productB1 = factory1.createProductB();

        productA1.use();     // 输出: Using Product A1
        productB1.operate(); // 输出: Operating Product B1

        // 使用工厂2创建产品族2
        AbstractFactory factory2 = new ConcreteFactory2();
        AbstractProductA productA2 = factory2.createProductA();
        AbstractProductB productB2 = factory2.createProductB();

        productA2.use();     // 输出: Using Product A2
        productB2.operate(); // 输出: Operating Product B2
    }
}
```

**优缺点分析**：

- ✅ **优点**：保证产品族内对象的一致性
- ❌ **缺点**：增加新的产品族结构困难，需要修改抽象工厂接口

## 3. 应用场景与模式对比

### 3.1 单例模式应用场景

单例模式适用于以下场景：

- **资源共享场景**：如数据库连接池、线程池、缓存等，需要保证资源单一共享实例
- **配置管理**：如应用程序的配置信息，需要全局统一访问点
- **日志记录**：日志记录器通常只需要一个实例，提供全局日志记录服务
- **设备驱动**：如打印机、显卡等设备驱动程序，通常设计为单例

### 3.2 工厂模式应用场景

工厂模式适用于以下场景：

- **系统需要独立于其产品的创建、组合和表示时**：将产品的创建过程封装起来
- **系统需要配置多个系列产品中的一个时**：通过工厂选择创建哪种产品
- **需要强调一组相关产品的设计时**：使用抽象工厂确保产品组合的一致性
- **需要提供产品类库，但只想暴露接口时**：通过工厂返回产品接口，隐藏实现

### 3.3 单例模式与工厂模式对比

| **特性**     | **单例模式**           | **工厂模式**               |
| ------------ | ---------------------- | -------------------------- |
| **模式类型** | 创建型                 | 创建型                     |
| **主要目的** | 保证一个类只有一个实例 | 创建对象而不指定具体类     |
| **实现重点** | 控制实例化过程         | 封装对象创建过程           |
| **应用场景** | 需要全局唯一对象的场景 | 需要灵活创建对象的场景     |
| **扩展性**   | 较差，缺乏扩展性       | 较好，符合开闭原则         |
| **复杂度**   | 相对简单               | 相对复杂，需要更多类和接口 |

## 4. 总结与最佳实践

### 4.1 单例模式总结

单例模式是Java中最常用的设计模式之一，它确保一个类只有一个实例，并提供全局访问点。在选择单例模式的实现方式时，需要考虑以下因素：

- **简单场景**：推荐使用静态内部类或枚举实现
- **需要延迟加载**：使用双重检查锁定
- **需要管理多个单例**：使用容器式单例
- **需要防止反射攻击**：使用枚举或反射安全的单例实现
- **需要序列化安全**：重写`readResolve`方法

**最佳实践**：

- 优先考虑使用枚举实现单例，因为它简单、安全
- 如果不需要延迟加载，可以考虑饿汉式
- 在多线程环境下务必保证线程安全

### 4.2 工厂模式总结

工厂模式通过将对象的创建与使用分离，提高了系统的灵活性和可维护性。在选择工厂模式的变体时：

- **简单工厂**：适用于产品类型不多且不经常变化的场景
- **工厂方法**：适用于需要扩展性强、产品类型可能增加的场景
- **抽象工厂**：适用于需要创建产品家族的场景

**最佳实践**：

- 优先使用工厂方法模式，因为它符合开闭原则
- 对于复杂对象创建过程，可以考虑使用Builder模式与工厂模式结合
- 使用依赖注入框架（如Spring）可以更好地管理工厂和对象创建

### 4.3 综合建议

在实际项目开发中：

1. **不要过度设计**：对于简单的对象创建，直接使用`new`关键字可能更合适
2. **结合使用模式**：单例模式和工厂模式经常结合使用，如单例的工厂类
3. **考虑框架支持**：现代Java开发中，Spring等框架提供了强大的依赖注入功能，可以简化工厂模式的实现
4. **保持简洁**：选择最符合需求的简单实现，避免不必要的复杂性

设计模式是软件开发中的重要工具，但最重要的是根据具体需求选择合适的模式。单例模式和工厂模式作为创建型模式的基础，理解和掌握它们对于编写高质量、可维护的Java代码至关重要。
