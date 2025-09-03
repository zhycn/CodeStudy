---
title: Java设计模式精讲：代理模式与模板方法模式
description: 这篇文章详细介绍了Java设计模式中的代理模式与模板方法模式。通过理论讲解、代码实例和实际应用场景分析，帮助读者掌握这两种模式的精髓。
---

# Java设计模式精讲：代理模式与模板方法模式

## 1 引言

设计模式是软件工程中解决常见问题的可重用方案，它们提供了经过验证的开发实践，能够提高代码的**可维护性**、**可扩展性**和**复用性**。在Java语言中，设计模式尤为重要，它们帮助我们构建更加**灵活和健壮**的应用程序。本文将深入探讨两种常用的Java设计模式：代理模式（结构型模式）和模板方法模式（行为型模式），通过理论讲解、代码实例和实际应用场景分析，帮助读者掌握这两种模式的精髓。

代理模式通过引入代理对象来控制对原始对象的访问，常用于实现访问控制、延迟初始化等功能。模板方法模式则通过定义算法骨架并允许子类重写特定步骤，实现了代码复用和扩展性控制。这两种模式在实际开发中都有着广泛的应用，例如在Spring框架、Java API以及各种企业级应用中都能看到它们的身影。

## 2 代理模式详解

### 2.1 模式定义

代理模式（Proxy Pattern）是一种**结构型设计模式**，它提供了一个代理对象，用于**控制对目标对象的访问**。代理对象充当了客户端和目标对象之间的中介，可以在调用目标对象方法之前和之后添加额外的逻辑，而不需要修改目标对象本身。

### 2.2 模式结构

代理模式包含三个主要角色：

- **Subject（抽象主题）**：声明真实主题和代理主题的共同接口，这样代理对象可以替代真实对象。
- **RealSubject（真实主题）**：定义了代理对象所代表的真实对象，实现了真正的业务逻辑。
- **Proxy（代理）**：包含对真实主题的引用，可以控制对真实主题的访问，并可能负责创建和删除它。

下面是代理模式的结构图：

```
代理模式结构：
Subject（接口）
│
├── RealSubject（真实主题类）
└── Proxy（代理类）→持有RealSubject的引用
```

### 2.3 静态代理

静态代理是在编译期就确定代理类的一种方式，需要为每个目标类编写一个代理类。

```java
// 抽象主题：卖票接口
interface SellTickets {
    void sell();
}

// 真实主题：火车站
class TrainStation implements SellTickets {
    public void sell() {
        System.out.println("火车站卖票");
    }
}

// 代理：代售点
class ProxyPoint implements SellTickets {
    private TrainStation station = new TrainStation();

    public void sell() {
        System.out.println("代理点收取一些服务费用");
        station.sell();
    }
}

// 测试类
public class StaticProxyExample {
    public static void main(String[] args) {
        ProxyPoint pp = new ProxyPoint();
        pp.sell();
    }
}
```

输出结果：

```
代理点收取一些服务费用
火车站卖票
```

### 2.4 动态代理

动态代理是在运行时动态生成代理类，无需为每个目标类编写代理类。Java提供了两种动态代理方式：JDK动态代理和CGLIB动态代理。

#### 2.4.1 JDK动态代理

JDK动态代理要求目标对象必须实现接口。

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

// 代理工厂
class ProxyFactory {
    private TrainStation station = new TrainStation();

    public SellTickets getProxyObject() {
        SellTickets proxy = (SellTickets) Proxy.newProxyInstance(
            station.getClass().getClassLoader(),
            station.getClass().getInterfaces(),
            new InvocationHandler() {
                public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                    System.out.println("代理点收取一些服务费用(JDK动态代理方式)");
                    return method.invoke(station, args);
                }
            }
        );
        return proxy;
    }
}

// 测试类
public class DynamicProxyExample {
    public static void main(String[] args) {
        ProxyFactory factory = new ProxyFactory();
        SellTickets proxy = factory.getProxyObject();
        proxy.sell();
    }
}
```

#### 2.4.2 CGLIB动态代理

CGLIB动态代理通过继承目标类来创建代理类，不需要目标类实现接口。

```java
import net.sf.cglib.proxy.Enhancer;
import net.sf.cglib.proxy.MethodInterceptor;
import net.sf.cglib.proxy.MethodProxy;

// 火车站类（未实现接口）
class TrainStation2 {
    public void sell() {
        System.out.println("火车站卖票");
    }
}

// CGLIB代理工厂
class CglibProxyFactory implements MethodInterceptor {
    private TrainStation2 target = new TrainStation2();

    public TrainStation2 getProxyObject() {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(target.getClass());
        enhancer.setCallback(this);
        return (TrainStation2) enhancer.create();
    }

    public Object intercept(Object o, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
        System.out.println("代理点收取一些服务费用(CGLIB动态代理方式)");
        return method.invoke(target, args);
    }
}

// 测试类
public class CglibProxyExample {
    public static void main(String[] args) {
        CglibProxyFactory factory = new CglibProxyFactory();
        TrainStation2 proxy = factory.getProxyObject();
        proxy.sell();
    }
}
```

### 2.5 代理模式应用场景

代理模式在Java开发中有多种应用场景：

- **远程代理**：为远程对象提供本地接口，隐藏网络通信的复杂性。
- **虚拟代理**：延迟创建开销大的对象，如图片或大型文件的加载。
- **保护代理**：控制对原始对象的访问权限，进行身份验证和授权检查。
- **缓存代理**：为开销大的运算结果提供临时存储，提高性能。
- **日志记录代理**：记录方法调用信息，用于调试和监控。
- **性能监控代理**：监控方法执行时间，用于性能优化。

### 2.6 代理模式优缺点

**优点**：

- 能够协调调用者和被调用者，降低系统耦合度。
- 保护目标对象，增强目标对象（如添加日志、权限控制等）。
- 开闭原则：可以在不修改目标对象的情况下增加功能。

**缺点**：

- 会增加系统设计中类的数量。
- 在客户端和目标对象之间增加代理对象，可能会使请求处理速度变慢。
- 增加了系统的复杂度。

## 3 模板方法模式详解

### 3.1 模式定义

模板方法模式（Template Method Pattern）是一种**行为型设计模式**，它在一个方法中定义一个算法的骨架，并将一些步骤延迟到子类中。模板方法使得子类可以不改变算法结构的情况下，重新定义算法中的某些特定步骤。

### 3.2 模式结构

模板方法模式包含两个主要角色：

- **AbstractClass（抽象类）**：定义算法的骨架，并包含模板方法，其中调用了多个抽象方法（由子类实现）。
- **ConcreteClass（具体实现类）**：实现抽象类中的抽象方法，提供具体的业务逻辑。

下面是模板方法模式的结构图：

```
模板方法模式结构：
AbstractClass（抽象类）
│
├── templateMethod() [final] // 模板方法，定义算法骨架
├── primitiveOperation1() [abstract] // 抽象方法，由子类实现
├── primitiveOperation2() [abstract] // 抽象方法，由子类实现
└── hook() [可选] // 钩子方法，提供默认实现
```

### 3.3 代码示例

下面是一个简单的模板方法模式示例，模拟饮料制作过程：

```java
// 抽象类：饮料
abstract class Drink {
    // 模板方法（使用final防止子类重写）
    public final void prepare() {
        boilWater();
        brew();
        pourInCup();
        if (customerWantsCondiments()) {
            addCondiment();
        }
    }

    // 具体方法：烧水
    void boilWater() {
        System.out.println("烧水");
    }

    // 抽象方法：冲泡
    abstract void brew();

    // 具体方法：倒入杯子
    void pourInCup() {
        System.out.println("倒入杯子");
    }

    // 抽象方法：添加调料
    abstract void addCondiment();

    // 钩子方法：客户是否要调料
    boolean customerWantsCondiments() {
        return true;
    }
}

// 具体实现类：茶
class Tea extends Drink {
    void brew() {
        System.out.println("冲泡茶叶");
    }

    void addCondiment() {
        System.out.println("添加柠檬");
    }

    // 重写钩子方法
    boolean customerWantsCondiments() {
        // 根据实际情况决定是否添加调料
        return false;
    }
}

// 具体实现类：咖啡
class Coffee extends Drink {
    void brew() {
        System.out.println("冲泡咖啡粉");
    }

    void addCondiment() {
        System.out.println("添加糖和牛奶");
    }
}

// 测试类
public class TemplateMethodExample {
    public static void main(String[] args) {
        System.out.println("制作茶...");
        Drink tea = new Tea();
        tea.prepare();

        System.out.println("\n制作咖啡...");
        Drink coffee = new Coffee();
        coffee.prepare();
    }
}
```

输出结果：

```
制作茶...
烧水
冲泡茶叶
倒入杯子

制作咖啡...
烧水
冲泡咖啡粉
倒入杯子
添加糖和牛奶
```

### 3.4 钩子方法

钩子方法（Hook Method）是模板方法模式中的一个重要概念，它提供了**缺省的行为**，子类可以在必要时进行扩展。钩子方法通常有以下特点：

- 在抽象类中提供默认实现
- 子类可以选择是否重写
- 用于影响模板方法的行为

在上面的饮料示例中，`customerWantsCondiments()`就是一个钩子方法，它允许子类控制是否添加调料。

### 3.5 模板方法模式应用场景

模板方法模式在Java开发中有多种应用场景：

- **多个类有相同的方法**，逻辑相同但细节不同时。
- **重要的、复杂的算法**，可以把核心算法设计为模板方法。
- **重构时**，将相同的代码抽取到父类中。
- **框架设计**，如Spring中的JdbcTemplate、RestTemplate等。
- **数据处理、文件读写、网络通信**等标准化流程。

### 3.6 模板方法模式优缺点

**优点**：

- **提高代码复用性**：将通用逻辑提取到父类中，避免代码重复。
- **提高扩展性**：通过子类重写特定步骤，易于扩展新功能。
- **符合开闭原则**：对扩展开放，对修改关闭。
- **结构清晰**：代码层次分明，提高可读性。

**缺点**：

- **类数目增加**：每个具体实现都需要一个子类。
- **增加了系统实现的复杂度**。
- **父类添加新的抽象方法**，所有子类都要改。

## 4 代理模式与模板方法模式的对比与结合

### 4.1 模式对比

虽然代理模式和模板方法模式属于不同类型的设计模式，但它们在某些方面有相似之处，也有一些明显的区别。下表对两种模式进行了对比：

| 特性         | 代理模式                       | 模板方法模式                     |
| ------------ | ------------------------------ | -------------------------------- |
| **模式类型** | 结构型模式                     | 行为型模式                       |
| **目的**     | 控制对象访问，增强功能         | 定义算法骨架，子类实现特定步骤   |
| **核心思想** | 引入代理对象控制对原对象的访问 | 在父类定义算法流程，子类实现细节 |
| **实现方式** | 实现相同接口或继承相同父类     | 继承，子类重写父类方法           |
| **应用场景** | 远程代理、虚拟代理、保护代理等 | 算法框架、代码复用、流程控制     |
| **优点**     | 降低耦合、增强功能、开闭原则   | 代码复用、扩展性强、结构清晰     |
| **缺点**     | 增加类数量、可能降低性能       | 增加类数量、父类修改影响子类     |

### 4.2 模式结合

在实际开发中，代理模式和模板方法模式可以结合使用，以发挥更大的威力。例如，可以在代理对象中使用模板方法模式来处理一些通用逻辑。

下面是一个结合使用的示例，展示了在代理中应用模板方法：

```java
// 抽象模板：数据库操作
abstract class DatabaseOperation {
    // 模板方法
    public final void execute() {
        setup();
        validate();
        performOperation();
        cleanup();
    }

    protected void setup() {
        System.out.println("设置数据库连接");
    }

    protected void validate() {
        System.out.println("验证操作权限");
    }

    protected abstract void performOperation();

    protected void cleanup() {
        System.out.println("清理资源，关闭连接");
    }
}

// 真实主题：用户数据库操作
class UserDatabaseOperation extends DatabaseOperation {
    protected void performOperation() {
        System.out.println("执行用户数据库操作");
    }
}

// 代理：数据库操作代理（添加日志功能）
class DatabaseOperationProxy extends DatabaseOperation {
    private DatabaseOperation realOperation;

    public DatabaseOperationProxy(DatabaseOperation operation) {
        this.realOperation = operation;
    }

    protected void setup() {
        System.out.println("代理：开始设置数据库连接");
        realOperation.setup();
    }

    protected void validate() {
        System.out.println("代理：开始验证权限");
        realOperation.validate();
    }

    protected void performOperation() {
        System.out.println("代理：开始执行操作");
        realOperation.performOperation();
        System.out.println("代理：操作执行完毕");
    }

    protected void cleanup() {
        System.out.println("代理：开始清理资源");
        realOperation.cleanup();
    }
}

// 测试类
public class CombinedExample {
    public static void main(String[] args) {
        DatabaseOperation operation = new UserDatabaseOperation();
        DatabaseOperation proxy = new DatabaseOperationProxy(operation);
        proxy.execute();
    }
}
```

输出结果：

```
代理：开始设置数据库连接
设置数据库连接
代理：开始验证权限
验证操作权限
代理：开始执行操作
执行用户数据库操作
代理：操作执行完毕
代理：开始清理资源
清理资源，关闭连接
```

这种结合使用的方式既利用了模板方法模式定义算法框架的优势，又发挥了代理模式增强功能的特性，使得代码更加灵活和可维护。

## 5 总结

代理模式和模板方法模式是Java设计中两种重要且实用的设计模式，它们分别解决了不同层面的问题。

**代理模式**作为一种结构型模式，主要解决了**对象访问控制**的问题。它通过引入代理对象作为中介，实现了对真实对象访问的控制和功能的增强。代理模式有多种变体，包括静态代理、JDK动态代理和CGLIB动态代理，各有其适用场景。代理模式在远程调用、延迟加载、权限控制等方面有广泛应用。

**模板方法模式**作为一种行为型模式，主要解决了**算法复用和扩展**的问题。它通过定义算法骨架并将一些步骤延迟到子类实现，实现了代码复用和扩展性控制。模板方法模式通过钩子方法提供了额外的灵活性，允许子类影响算法的行为。该模式在框架设计、算法标准化等方面有重要应用。

这两种模式虽然属于不同类型，但在实际开发中可以结合使用，发挥更大的威力。掌握这两种模式的核心思想和实现方式，能够帮助我们设计出更加灵活、可维护和可扩展的软件系统。

设计模式不是银弹，需要根据具体场景灵活运用。希望本文能够帮助读者深入理解代理模式和模板方法模式，并在实际项目中正确应用它们。
