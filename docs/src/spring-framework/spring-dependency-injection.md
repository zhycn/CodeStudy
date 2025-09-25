---
title: Spring DI 依赖注入详解与最佳实践
description: 本文详细介绍了 Spring 框架中的依赖注入（Dependency Injection，DI）机制，包括 DI 的核心概念、三种注入方式（构造器注入、Setter 注入、接口注入）以及最佳实践。通过本文，开发者可以理解 DI 机制的工作原理，掌握在 Spring 中如何实现依赖注入，以及如何避免常见的 DI 问题。
author: zhycn
---

# Spring DI 依赖注入详解与最佳实践

## 1 依赖注入核心概念

### 1.1 什么是依赖注入

依赖注入（Dependency Injection，DI）是一种设计模式，其核心思想是将对象的依赖关系由外部注入，而不是在类内部自行创建或查找。通过这种方式，代码的耦合度得以降低，系统更加灵活和易于维护。

**传统方式与 DI 方式对比：**

```java
// 传统方式：组件直接创建依赖，导致紧耦合
public class TraditionalUserService {
    private UserRepository userRepository = new JdbcUserRepository();
    
    public User findUser(Long id) {
        return userRepository.findById(id);
    }
}

// DI方式：依赖由外部容器提供，实现松耦合
public class DependencyInjectedUserService {
    private UserRepository userRepository;
    
    public DependencyInjectedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public User findUser(Long id) {
        return userRepository.findById(id);
    }
}
```

### 1.2 DI 与 IoC 的关系

依赖注入是**控制反转（Inversion of Control，IoC）**的一种实现方式。IoC 的核心思想是"让框架控制程序的执行流程"，而 DI 则是实现 IoC 的具体手段之一。

Spring 通过 `ApplicationContext` 或 `BeanFactory` 容器实现 IoC。这些容器负责读取配置信息，创建并管理 Bean 的生命周期。开发者只需声明 Bean 的定义，而无需关注具体的实例化过程。

## 2 Spring DI 的三种注入方式

### 2.1 构造器注入（Constructor Injection）

构造器注入是通过类的构造函数传入所依赖的对象，由 Spring 容器在实例化 Bean 时自动调用构造函数并传入相应的依赖。

**示例代码：**

```java
@Controller
public class HelloController {
    private final Student student;
    
    // 构造方法注入
    @Autowired
    public HelloController(Student student) {
        this.student = student;
    }
}
```

**优点：**

- **强制依赖满足**：构造方法在对象创建时必须满足所有依赖，确保了对象在初始化时是完整的
- **不可变性**：通过 `final` 关键字，可以确保依赖在对象生命周期内不会改变
- **提高测试性**：在单元测试中，可以轻松地为构造方法注入不同的依赖实现

**缺点：**

- **配置复杂性**：在需要注入多个依赖时，构造方法的参数列表可能变得冗长

### 2.2 Setter 方法注入（Setter Injection）

Setter 注入是通过 Bean 的 setter 方法设置依赖对象，由 Spring 容器在 Bean 实例化后调用 setter 方法完成依赖注入。

**示例代码：**

```java
@Controller
public class HelloController {
    private Student student;
    
    // Setter 方法注入
    @Autowired
    public void setStudent(Student student) {
        this.student = student;
    }
}
```

**优点：**

- **可变依赖**：适用于在运行时动态改变依赖的情况
- **延迟初始化**：依赖可以在对象创建后注入，适用于可选依赖

**缺点：**

- **初始化问题**：对象可能在依赖注入前被使用，导致空指针异常
- **难以控制顺序**：多个依赖的注入顺序难以控制，可能导致不一致的状态

### 2.3 属性注入（Field Injection）

属性注入是直接在类的字段上使用 `@Autowired` 注解，将依赖注入到字段中。

**示例代码：**

```java
@Service
public class UserService {
    // 属性注入
    @Autowired
    private Student s3;
    
    public void print() {
        System.out.println(s3);
    }
}
```

**优点：**

- 简单直观，代码简洁

**缺点：**

- **破坏封装性**：直接暴露了类的字段，违反了面向对象的封装原则
- **难以测试**：由于字段直接依赖外部注入，单元测试时可能需要额外的配置

## 3 Spring DI 核心注解详解

### 3.1 @Autowired

`@Autowired` 是 Spring 最核心的依赖注入注解，用于自动按类型注入依赖。

**使用位置：**

- 构造函数
- Setter 方法
- 字段

```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
}
```

### 3.2 @Qualifier

当存在多个相同类型的 Bean 时，可以通过 `@Qualifier` 指定具体的 Bean。

```java
@Service
public class UserService {
    @Autowired
    @Qualifier("mysqlRepository")
    private UserRepository userRepository;
}
```

### 3.3 @Resource

`@Resource` 是 JDK 提供的注解，默认按名称注入。

```java
@Service
public class UserService {
    @Resource(name = "redisCache")
    private CacheService cacheService;
}
```

### 3.4 @Value

`@Value` 用于注入配置文件中的属性值。

```java
@Service
public class UserService {
    @Value("${app.name}")
    private String appName;
}
```

### 3.5 条件注入注解

Spring 提供了条件注入注解，可以根据条件动态注入 Bean。

```java
@Configuration
public class AppConfig {
    
    @Bean
    @ConditionalOnProperty(name = "env", havingValue = "dev")
    public UserDAO devUserDAO() {
        return new DevUserDAO();
    }
}
```

## 4 高级特性与最佳实践

### 4.1 循环依赖处理

循环依赖是指两个或多个 Bean 之间相互依赖的情况。

**构造器注入的循环依赖无法解决：**

```java
@Service
public class ServiceA {
    private final ServiceB serviceB;
    
    @Autowired
    public ServiceA(ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}

@Service
public class ServiceB {
    private final ServiceA serviceA;
    
    @Autowired
    public ServiceB(ServiceA serviceA) {
        this.serviceA = serviceA;
    }
}
```

**使用 Setter 注入解决循环依赖：**

```java
@Service
public class ServiceC {
    private ServiceD serviceD;
    
    @Autowired
    public void setServiceD(ServiceD serviceD) {
        this.serviceD = serviceD;
    }
}

@Service
public class ServiceD {
    private ServiceC serviceC;
    
    @Autowired
    public void setServiceC(ServiceC serviceC) {
        this.serviceC = serviceC;
    }
}
```

### 4.2 Bean 作用域管理

通过 `@Scope` 注解控制 Bean 的作用域。

```java
@Service
@Scope("prototype")
public class UserService {
    public void saveUser(User user) {
        System.out.println("Saving user in prototype scope");
    }
}
```

### 4.3 最佳实践总结

1. **优先使用构造器注入**
   - 构造器注入在处理不可变依赖时更加安全和直观
   - 适合处理必需依赖

2. **避免过度注入**
   - 只注入真正需要的依赖，避免"饥饿注入"
   - 遵循单一职责原则，避免在一个类中注入过多依赖

3. **使用接口而非具体实现**
   - 尽量依赖于接口而不是具体实现，减少代码的耦合度

4. **合理处理可选依赖**
   - 对于可选依赖，可以使用 Setter 注入或将依赖声明为 `Optional`

5. **避免循环依赖**
   - 通过重构代码解耦，避免循环依赖
   - 如果必须存在循环依赖，使用 Setter 注入而非构造器注入

**推荐的项目结构示例：**

```java
// 1. 定义接口
public interface UserService {
    User findUserById(Long id);
}

// 2. 实现类使用构造器注入
@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    // Spring 4.3+ 可以省略 @Autowired
    public UserServiceImpl(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
    
    @Override
    public User findUserById(Long id) {
        return userRepository.findById(id);
    }
}

// 3. 配置类
@Configuration
public class AppConfig {
    @Bean
    public UserRepository userRepository() {
        return new JpaUserRepository();
    }
    
    @Bean
    public EmailService emailService() {
        return new SmtpEmailService();
    }
}
```

## 5 单元测试中的 DI 实践

良好的依赖注入设计有助于编写可测试的代码。构造器注入尤其适合单元测试，因为测试代码可以直接控制依赖的创建和传入。

**单元测试示例：**

```java
public class UserServiceTest {
    
    @Test
    public void testFindUserById() {
        // 创建 mock 依赖
        UserRepository mockRepository = Mockito.mock(UserRepository.class);
        EmailService mockEmailService = Mockito.mock(EmailService.class);
        
        // 创建被测试对象，直接注入依赖
        UserService userService = new UserServiceImpl(mockRepository, mockEmailService);
        
        // 设置 mock 行为
        User expectedUser = new User(1L, "John");
        Mockito.when(mockRepository.findById(1L)).thenReturn(expectedUser);
        
        // 执行测试
        User result = userService.findUserById(1L);
        
        // 验证结果
        assertEquals(expectedUser, result);
    }
}
```

## 附录：Spring DI 相关注解全集

### 核心依赖注入注解

| 注解 | 作用描述 | 使用示例 |
|------|----------|----------|
| `@Autowired` | 自动按类型注入依赖对象 | `@Autowired private UserService userService;` |
| `@Qualifier` | 按名称区分同类型的不同 Bean | `@Qualifier("mysqlRepo")` |
| `@Resource` | 按名称注入（JSR-250） | `@Resource(name="myService")` |
| `@Value` | 注入配置文件属性值 | `@Value("${app.url}")` |
| `@Inject` | 功能类似 `@Autowired`（JSR-330） | `@Inject private UserService userService;` |

### Bean 定义与管理注解

| 注解 | 作用描述 | 使用示例 |
|------|----------|----------|
| `@Component` | 通用组件注解 | `@Component public class MyComponent {}` |
| `@Service` | 服务层组件 | `@Service public class UserService {}` |
| `@Repository` | 数据访问层组件 | `@Repository public class UserRepository {}` |
| `@Controller` | Web 控制层组件 | `@Controller public class UserController {}` |
| `@Configuration` | 声明配置类 | `@Configuration public class AppConfig {}` |
| `@Bean` | 声明 Bean 的工厂方法 | `@Bean public DataSource dataSource() {}` |

### 条件与作用域注解

| 注解 | 作用描述 | 使用示例 |
|------|----------|----------|
| `@Conditional` | 根据条件创建 Bean | `@Conditional(OnClassCondition.class)` |
| `@Profile` | 指定环境配置 | `@Profile("dev")` |
| `@Scope` | 控制 Bean 的作用域 | `@Scope("prototype")` |
| `@Lazy` | 延迟初始化 Bean | `@Lazy` |
| `@Primary` | 指定优先注入的 Bean | `@Primary` |

### 生命周期回调注解

| 注解 | 作用描述 | 使用示例 |
|------|----------|----------|
| `@PostConstruct` | 初始化后执行的方法 | `@PostConstruct public void init() {}` |
| `@PreDestroy` | Bean 销毁前执行的方法 | `@PreDestroy public void destroy() {}` |

通过掌握 Spring DI 的各种注入方式和相关注解，开发者可以构建出松耦合、可测试、易维护的高质量应用程序。遵循最佳实践，结合具体业务场景选择合适的注入方式，是发挥 Spring 框架优势的关键。
