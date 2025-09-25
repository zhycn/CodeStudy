---
title: Spring Bean 的生命周期详解与最佳实践
description: 本文详细介绍了 Spring 框架中 Bean 的生命周期，包括 Bean 定义、实例化、依赖注入、初始化和销毁等阶段。通过了解 Bean 生命周期的每个阶段，开发者可以更好地理解 Spring 容器的工作原理，从而编写更高效、更可靠的 Spring 应用程序。
author: zhycn
---

# Spring Bean 的生命周期详解与最佳实践

- [Customizing the Nature of a Bean](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)

## 1. 引言

Spring 框架的核心是 **IoC（控制反转）容器**，它负责创建、配置和管理应用程序中的对象，这些对象被称为 Bean。理解一个 Bean 从诞生到消亡的完整过程——即它的**生命周期**——对于编写高效、可维护的 Spring 应用程序至关重要。它不仅帮助我们更好地利用框架功能，也让我们能在合适的时机插入自定义逻辑。

根据 2024 年 Stack Overflow 开发者调查，Java 占编程语言使用率的 30%，Spring 在 Java 生态中占据主导地位，广泛应用于高并发系统（如电商、微服务）。深入理解 Spring Bean 生命周期及其干预机制，对优化应用性能、扩展功能和调试具有重要意义。

## 2. Bean 生命周期概览

### 2.1 生命周期阶段划分

Spring Bean 的完整生命周期从创建 Spring 容器开始，直到最终 Spring 容器销毁 Bean。宏观上可以分为以下几个核心阶段：

1. **Bean 定义阶段**：容器解析配置，生成 BeanDefinition
2. **实例化阶段**：通过反射创建 Bean 实例
3. **属性赋值阶段**：完成依赖注入（DI）
4. **初始化阶段**：执行各种初始化回调
5. **使用阶段**：Bean 完全就绪，可供应用程序使用
6. **销毁阶段**：容器关闭时执行资源清理

### 2.2 生命周期流程图

以下是 Spring Bean 生命周期的完整流程图，展示了各阶段的执行顺序：

```bash
Bean 定义加载 → 实例化 → 属性填充 → Aware 接口回调 → BeanPostProcessor(before) →
初始化方法(@PostConstruct → afterPropertiesSet → init-method) →
BeanPostProcessor(after) → Bean 就绪 → 使用阶段 →
销毁方法(@PreDestroy → destroy → destroy-method)
```

## 3. 生命周期阶段详解

### 3.1 Bean 定义与实例化阶段

**Bean 定义**是生命周期的起点。开发者可以通过 XML 配置、注解或 JavaConfig 方式定义 Bean：

```xml
<!-- XML 配置方式 -->
<bean id="userService" class="com.example.service.UserService"/>
```

```java
// 注解方式
@Service
public class UserService {
    // 类的具体实现
}
```

**实例化阶段**是 Spring 通过反射机制创建 Bean 实例的过程：

```java
// Spring 内部通过反射创建 Bean 实例
public class UserService {
    public UserService() {
        System.out.println("UserService 实例被创建");
    }
}
```

在此阶段，Spring 会根据 Bean 的作用域决定创建策略：

- **Singleton**：单例 Bean 在容器启动时创建（默认行为）
- **Prototype**：原型 Bean 在每次获取时创建新实例
- **Request/Session**：Web 作用域 Bean 在相应请求或会话开始时创建

### 3.2 属性赋值（依赖注入）阶段

在属性赋值阶段，Spring 根据配置完成依赖注入。主要注入方式包括：

**构造器注入（推荐）**：

```java
@Service
public class OrderService {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // 构造器注入
    public OrderService(UserRepository userRepository, ProductRepository productRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }
}
```

**Setter 方法注入**：

```java
@Service
public class UserService {
    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```

**字段注入**（不推荐，不利于测试）：

```java
@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;
}
```

Spring 的依赖注入优先级为：**构造器注入 > @Autowired 注解 > Setter 方法注入**。

### 3.3 初始化阶段

初始化阶段是 Bean 生命周期中最复杂的环节，包含多个扩展点，执行顺序如下：

#### 3.3.1 Aware 接口回调

Aware 接口让 Bean 能感知到 Spring 容器的特定信息：

```java
@Component
public class MyBean implements BeanNameAware, BeanFactoryAware, ApplicationContextAware {

    @Override
    public void setBeanName(String name) {
        System.out.println("Bean 名称: " + name);
    }

    @Override
    public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
        System.out.println("BeanFactory 已注入");
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        System.out.println("ApplicationContext 已注入");
    }
}
```

#### 3.3.2 BeanPostProcessor 前置处理

BeanPostProcessor 允许在初始化前后对 Bean 进行增强处理：

```java
@Component
public class CustomBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        System.out.println("Before初始化: " + beanName);
        // 可以在此处修改 Bean 实例或返回代理对象
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        System.out.println("After初始化: " + beanName);
        // AOP 代理在此阶段生成
        return bean;
    }
}
```

#### 3.3.3 初始化方法执行

初始化方法按以下顺序执行：

1\. **@PostConstruct 注解方法**（JSR-250 标准）：

```java
@Component
public class DatabaseInitializer {
    @PostConstruct
    public void init() {
        System.out.println("@PostConstruct 方法执行：初始化数据库连接");
        // 初始化逻辑，如加载数据、建立连接
    }
}
```

2\. **InitializingBean 接口**：

```java
@Component
public class CacheManager implements InitializingBean {
    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("InitializingBean.afterPropertiesSet() 执行");
        // 初始化逻辑
    }
}
```

3\. **自定义 init-method**：

```java
public class ExternalService {
    public void initialize() {
        System.out.println("自定义 init-method 执行");
    }
}

@Configuration
public class AppConfig {
    @Bean(initMethod = "initialize")
    public ExternalService externalService() {
        return new ExternalService();
    }
}
```

### 3.4 使用阶段

初始化完成后，Bean 进入就绪状态，可以被应用程序使用：

```java
// 从 Spring 容器获取 Bean 并使用
ApplicationContext context = ...;
UserService userService = context.getBean("userService", UserService.class);
User user = userService.findUserById(1L);
```

在此阶段，需要注意不同作用域 Bean 的行为差异：

- **Singleton**：在整个应用生命周期内复用同一实例
- **Prototype**：每次请求都返回新实例
- **Request/Session**：在对应作用域内有效

### 3.5 销毁阶段

当 Spring 容器关闭时，会触发 Bean 的销毁流程，执行顺序如下：

1\. **@PreDestroy 注解方法**（JSR-250 标准）：

```java
@Component
public class ResourceCleaner {
    @PreDestroy
    public void cleanup() {
        System.out.println("@PreDestroy 方法执行：释放资源");
        // 释放数据库连接、关闭文件句柄等
    }
}
```

2\. **DisposableBean 接口**：

```java
@Component
public class ThreadPoolManager implements DisposableBean {
    @Override
    public void destroy() throws Exception {
        System.out.println("DisposableBean.destroy() 执行");
        // 清理资源逻辑
    }
}
```

3\. **自定义 destroy-method**：

```java
public class FileManager {
    public void close() {
        System.out.println("自定义 destroy-method 执行：关闭文件资源");
    }
}

@Configuration
public class AppConfig {
    @Bean(destroyMethod = "close")
    public FileManager fileManager() {
        return new FileManager();
    }
}
```

**重要提示**：原型（Prototype）Bean 的销毁方法**不会**被 Spring 容器自动调用，需要手动管理。

## 4. 高级特性与机制

### 4.1 BeanPostProcessor 深度解析

BeanPostProcessor 是 Spring 扩展的基石，允许开发者对新创建的 Bean 实例进行修改和包装。常见的应用包括：

- **@Autowired 注解处理**（AutowiredAnnotationBeanPostProcessor）
- **@PostConstruct/@PreDestroy 处理**（CommonAnnotationBeanPostProcessor）
- **AOP 代理创建**（AnnotationAwareAspectJAutoProxyCreator）

**自定义 BeanPostProcessor 示例**：

```java
@Component
public class ValidationBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        // 在初始化前进行验证
        if (bean instanceof Validatable) {
            ((Validatable) bean).validate();
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        // 在初始化后进行处理
        if (bean instanceof Cacheable) {
            return createCacheProxy(bean);
        }
        return bean;
    }

    private Object createCacheProxy(Object target) {
        // 创建缓存代理
        return Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            (proxy, method, args) -> {
                // 缓存逻辑实现
                return method.invoke(target, args);
            }
        );
    }
}
```

### 4.2 循环依赖解决方案

Spring 通过**三级缓存机制**解决单例 Bean 的循环依赖问题：

1. **一级缓存**（singletonObjects）：存储完全初始化的成品 Bean
2. **二级缓存**（earlySingletonObjects）：缓存半成品对象（已解决部分依赖）
3. **三级缓存**（singletonFactories）：存储 Bean 工厂对象（用于生成原始对象）

**循环依赖处理流程**：

```java
// 当 BeanA 依赖 BeanB，BeanB 又依赖 BeanA 时
public class BeanA {
    private BeanB beanB;

    @Autowired
    public void setBeanB(BeanB beanB) {
        this.beanB = beanB;
    }
}

public class BeanB {
    private BeanA beanA;

    @Autowired
    public void setBeanA(BeanA beanA) {
        this.beanA = beanA;
    }
}
```

Spring 的处理策略：

- **构造器循环依赖**：无法解决，抛出 BeanCurrentlyInCreationException
- **Setter 循环依赖**：通过三级缓存机制解决

### 4.3 作用域对生命周期的影响

不同作用域的 Bean 具有不同的生命周期管理方式：

| 作用域          | 生命周期管理                   | 适用场景               |
| --------------- | ------------------------------ | ---------------------- |
| **Singleton**   | 容器管理完整生命周期           | 无状态服务，线程安全   |
| **Prototype**   | 容器只管理到初始化，需手动销毁 | 有状态对象，线程不安全 |
| **Request**     | 绑定到 HTTP 请求               | Web 上下文相关 Bean    |
| **Session**     | 绑定到用户会话                 | 用户会话数据           |
| **Application** | 绑定到 ServletContext          | 全局应用数据           |

**作用域配置示例**：

```java
@Configuration
public class ScopeConfig {

    @Bean
    @Scope("singleton") // 默认值，可省略
    public SingletonService singletonService() {
        return new SingletonService();
    }

    @Bean
    @Scope("prototype")
    public PrototypeService prototypeService() {
        return new PrototypeService();
    }

    @Bean
    @Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public RequestScopedBean requestScopedBean() {
        return new RequestScopedBean();
    }
}
```

## 5. 实战应用与最佳实践

### 5.1 高并发场景下的生命周期管理

在高并发系统（如电商平台，QPS 10万+）中，合理的 Bean 生命周期管理对性能至关重要。

**数据库连接池初始化示例**：

```java
@Component
public class DatabaseConnectionPool {
    private DataSource dataSource;
    private volatile boolean initialized = false;

    @PostConstruct
    public synchronized void initializePool() {
        if (!initialized) {
            System.out.println("初始化数据库连接池");
            // 创建 HikariCP 或其他连接池
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl("jdbc:mysql://localhost:3306/ecommerce");
            config.setUsername("root");
            config.setPassword("password");
            config.setMaximumPoolSize(20);
            config.setMinimumIdle(5);

            this.dataSource = new HikariDataSource(config);
            this.initialized = true;
        }
    }

    @PreDestroy
    public void cleanup() {
        if (dataSource instanceof HikariDataSource) {
            ((HikariDataSource) dataSource).close();
            System.out.println("数据库连接池已关闭");
        }
    }

    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
}
```

**缓存管理器初始化示例**：

```java
@Component
public class CacheManager implements InitializingBean, DisposableBean {
    private RedisConnectionFactory redisConnectionFactory;
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public CacheManager(RedisConnectionFactory redisConnectionFactory) {
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("初始化 Redis 模板");
        this.redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory);
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        redisTemplate.afterPropertiesSet();
    }

    @Override
    public void destroy() throws Exception {
        System.out.println("关闭 Redis 连接");
        if (redisConnectionFactory instanceof LettuceConnectionFactory) {
            ((LettuceConnectionFactory) redisConnectionFactory).destroy();
        }
    }
}
```

### 5.2 性能优化策略

1\. **延迟加载**：使用 `@Lazy` 注解减少启动时间

```java
@Configuration
public class LazyConfig {
    @Bean
    @Lazy // 延迟初始化，首次使用时才创建
    public HeavyResourceService heavyResourceService() {
        return new HeavyResourceService();
    }
}
```

2\. **分阶段初始化**：通过 `@DependsOn` 控制初始化顺序

```java
@Component
@DependsOn({"databaseInitializer", "cacheManager"}) // 确保依赖先初始化
public class BusinessService {
    // 业务逻辑
}
```

3\. **避免循环依赖**：重构代码结构，使用接口抽象

```java
// 不推荐：直接循环依赖
@Service
public class ServiceA {
    @Autowired
    private ServiceB serviceB;
}

@Service
public class ServiceB {
    @Autowired
    private ServiceA serviceA;
}

// 推荐：通过接口解耦
public interface ServiceAInterface {
    void methodA();
}

public interface ServiceBInterface {
    void methodB();
}

@Service
public class ServiceA implements ServiceAInterface {
    private final ServiceBInterface serviceB;

    public ServiceA(ServiceBInterface serviceB) {
        this.serviceB = serviceB;
    }
}

@Service
public class ServiceB implements ServiceBInterface {
    private final ServiceAInterface serviceA;

    public ServiceB(ServiceAInterface serviceA) {
        this.serviceA = serviceA;
    }
}
```

### 5.3 资源管理与异常处理

**资源清理最佳实践**：

```java
@Component
public class ResourceHolder {
    private List<Closeable> resources = new ArrayList<>();

    public void addResource(Closeable resource) {
        resources.add(resource);
    }

    @PreDestroy
    public void releaseAll() {
        System.out.println("开始释放所有资源");
        for (Closeable resource : resources) {
            try {
                resource.close();
                System.out.println("资源释放成功: " + resource.getClass().getSimpleName());
            } catch (IOException e) {
                System.err.println("资源释放失败: " + resource.getClass().getSimpleName());
                // 记录日志但不要抛出异常，确保其他资源正常释放
                Logger.error("资源释放异常", e);
            }
        }
        resources.clear();
    }
}
```

**生命周期方法中的异常处理**：

```java
@Component
public class SafeInitializer {

    @PostConstruct
    public void initialize() {
        try {
            // 初始化逻辑
            performInitialization();
        } catch (Exception e) {
            // 记录详细日志
            Logger.error("初始化失败", e);
            // 根据情况决定是否抛出异常
            if (isCriticalComponent()) {
                throw new IllegalStateException("关键组件初始化失败", e);
            }
        }
    }

    private boolean isCriticalComponent() {
        // 判断是否为关键组件
        return true;
    }
}
```

## 6. 常见问题与解决方案

### 6.1 生命周期相关异常排查

1. **BeanCurrentlyInCreationException**（循环依赖）
   - **原因**：构造器注入的循环依赖
   - **解决**：改用 Setter 注入或使用 `@Lazy` 注解

2. **BeanCreationException**（初始化失败）
   - **原因**：初始化方法抛出异常
   - **解决**：检查初始化逻辑，添加异常处理

3. **内存泄漏**（原型 Bean 未正确销毁）
   - **原因**：原型 Bean 持有资源但未手动释放
   - **解决**：实现自定义销毁逻辑或使用 try-with-resources

### 6.2 调试与监控技巧

**生命周期事件监听**：

```java
@Component
public class LifecycleEventListener implements ApplicationListener<ApplicationEvent> {

    private static final Logger logger = LoggerFactory.getLogger(LifecycleEventListener.class);

    @Override
    public void onApplicationEvent(ApplicationEvent event) {
        if (event instanceof ContextRefreshedEvent) {
            logger.info("Spring 容器刷新完成");
        } else if (event instanceof ContextClosedEvent) {
            logger.info("Spring 容器开始关闭");
        }
    }
}
```

**自定义 BeanPostProcessor 用于监控**：

```java
@Component
public class TimingBeanPostProcessor implements BeanPostProcessor {
    private Map<String, Long> startTimes = new ConcurrentHashMap<>();

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        startTimes.put(beanName, System.currentTimeMillis());
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        Long startTime = startTimes.remove(beanName);
        if (startTime != null) {
            long duration = System.currentTimeMillis() - startTime;
            if (duration > 100) { // 记录初始化时间超过100ms的Bean
                Logger.warn("Bean '{}' 初始化耗时: {}ms", beanName, duration);
            }
        }
        return bean;
    }
}
```

## 7. 最佳实践总结

基于对 Spring Bean 生命周期的深入分析，以下是关键的最佳实践建议：

### 7.1 初始化与销毁方法选择优先级

1. **优先使用标准注解**：`@PostConstruct` 和 `@PreDestroy`（JSR-250），无框架侵入性
2. **次选配置方法**：`init-method` 和 `destroy-method`，适用于第三方库的 Bean
3. **避免接口耦合**：尽量不使用 `InitializingBean` 和 `DisposableBean`，减少与 Spring 耦合

### 7.2 资源管理准则

- **单例 Bean**：确保无状态设计，避免资源泄漏
- **原型 Bean**：手动管理资源释放，避免内存泄漏
- **数据库连接**：使用连接池（如 HikariCP）优化资源复用
- **文件句柄/网络连接**：使用 try-with-resources 确保自动释放

### 7.3 性能优化建议

- **减少 Bean 数量**：合并功能相似的 Bean
- **懒加载非关键 Bean**：使用 `@Lazy` 注解减少启动时间
- **优化初始化逻辑**：避免在初始化方法中执行耗时操作
- **合理使用缓存**：对于高频调用 Bean，使用缓存减少重复创建

### 7.4 可维护性建议

- **添加生命周期日志**：关键阶段记录日志，便于调试
- **统一异常处理**：生命周期方法中要有适当的异常处理
- **文档化依赖关系**：使用 `@DependsOn` 明确初始化顺序
- **监控生命周期事件**：集成健康检查，实时监控 Bean 状态

## 附录：Aware 接口清单

Spring 提供了丰富的 Aware 接口，让 Bean 能感知到容器的基础设施信息：

### 容器基础设施类 Aware 接口

| 接口名                   | 作用                       | 方法签名                                      | 调用时机             |
| ------------------------ | -------------------------- | --------------------------------------------- | -------------------- |
| **BeanNameAware**        | 获取 Bean 在容器中的名称   | `setBeanName(String name)`                    | 属性注入后，初始化前 |
| **BeanClassLoaderAware** | 获取加载该 Bean 的类加载器 | `setBeanClassLoader(ClassLoader classLoader)` | 属性注入后，初始化前 |
| **BeanFactoryAware**     | 获取 BeanFactory 引用      | `setBeanFactory(BeanFactory beanFactory)`     | 属性注入后，初始化前 |

### 应用程序上下文类 Aware 接口

| 接口名                             | 作用                         | 方法签名                                                            | 调用时机                                   |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| **EnvironmentAware**               | 获取环境配置信息             | `setEnvironment(Environment environment)`                           | 通过 ApplicationContextAwareProcessor 回调 |
| **EmbeddedValueResolverAware**     | 解析嵌入值（如 `${}`）       | `setEmbeddedValueResolver(StringValueResolver resolver)`            | 通过 ApplicationContextAwareProcessor 回调 |
| **ResourceLoaderAware**            | 获取资源加载器               | `setResourceLoader(ResourceLoader resourceLoader)`                  | 通过 ApplicationContextAwareProcessor 回调 |
| **ApplicationEventPublisherAware** | 发布应用事件                 | `setApplicationEventPublisher(ApplicationEventPublisher publisher)` | 通过 ApplicationContextAwareProcessor 回调 |
| **MessageSourceAware**             | 国际化消息处理               | `setMessageSource(MessageSource messageSource)`                     | 通过 ApplicationContextAwareProcessor 回调 |
| **ApplicationContextAware**        | 获取 ApplicationContext 引用 | `setApplicationContext(ApplicationContext context)`                 | 通过 ApplicationContextAwareProcessor 回调 |

### Aware 接口使用示例

```java
@Component
public class ComprehensiveAwareBean implements
        BeanNameAware, BeanFactoryAware, ApplicationContextAware,
        EnvironmentAware, ResourceLoaderAware {

    private String beanName;
    private BeanFactory beanFactory;
    private ApplicationContext applicationContext;
    private Environment environment;
    private ResourceLoader resourceLoader;

    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        System.out.println("Bean 名称: " + name);
    }

    @Override
    public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
        this.beanFactory = beanFactory;
        System.out.println("BeanFactory 已设置");
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
        System.out.println("ApplicationContext 已设置");
    }

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
        System.out.println("Environment 已设置");
        // 获取配置属性
        String value = environment.getProperty("app.name");
        System.out.println("应用名称: " + value);
    }

    @Override
    public void setResourceLoader(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
        System.out.println("ResourceLoader 已设置");
    }

    @PostConstruct
    public void init() {
        System.out.println("开始使用 Aware 接口获取的资源");
        // 使用获取到的容器资源
        if (environment != null) {
            // 处理环境相关逻辑
        }
    }
}
```

**注意事项**：

1. 实现 `ApplicationContextAware` 会使 Bean 与 Spring 框架耦合，应谨慎使用
2. Aware 接口的回调方法中不要执行复杂的业务逻辑
3. 避免在 Aware 方法中访问其他 Bean，因为此时依赖注入可能尚未完成

通过深入理解 Spring Bean 的生命周期及其扩展机制，开发者可以编写出更加健壮、可维护的 Spring 应用程序，有效利用框架提供的各种能力。
