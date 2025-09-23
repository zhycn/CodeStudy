---
title: Spring 框架 Transactions 事务管理详解与最佳实践
description: 本文深入探讨了 Spring 框架中事务管理的核心概念、机制和最佳实践。内容涵盖了事务的定义、传播行为、隔离级别、超时设置、回滚规则以及异常处理等方面。
author: zhycn
---

# Spring 框架 Transactions 事务管理详解与最佳实践

- [Transaction Management](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)

## 1. 事务核心概念回顾

在深入 Spring 事务之前，我们首先回顾一下数据库事务的四个核心特性（ACID）：

- **原子性 (Atomicity)**: 事务是一个不可分割的工作单元，事务中的操作要么全部成功，要么全部失败回滚。
- **一致性 (Consistency)**: 事务必须使数据库从一个一致性状态变换到另一个一致性状态。
- **隔离性 (Isolation)**: 多个事务并发执行时，一个事务的执行不应影响其他事务。
- **持久性 (Durability)**: 一旦事务被提交，它对数据库中数据的改变就是永久性的。

Spring 事务管理的本质是**对本地数据库事务或分布式事务的抽象和简化**，它将事务管理从业务逻辑代码中剥离出来，通过声明式或编程式的方式进行控制。

## 2. Spring 事务管理核心接口

Spring 事务抽象的核心由以下几个接口定义：

- **`PlatformTransactionManager`**: 这是 Spring 事务管理的**核心接口**。所有的事务管理器都实现自该接口。它定义了事务的基本操作：`getTransaction`（获取事务状态），`commit`（提交），`rollback`（回滚）。

  ```java
  public interface PlatformTransactionManager {
      TransactionStatus getTransaction(TransactionDefinition definition)
              throws TransactionException;
      void commit(TransactionStatus status) throws TransactionException;
      void rollback(TransactionStatus status) throws TransactionException;
  }
  ```

- **`TransactionDefinition`**: 定义了事务的**属性**，也称为**事务属性**。包括：
  - **传播行为 (Propagation Behavior)**: 规定了一个事务方法被另一个事务方法调用时，事务应如何传播。
  - **隔离级别 (Isolation Level)**: 定义了一个事务可能受其他并发事务影响的程度。
  - **超时时间 (Timeout)**: 事务必须在规定的时间内完成，否则自动回滚。
  - **只读状态 (Read-Only)**: 提示数据库该事务是否为只读，以便数据库进行优化。
  - **回滚规则 (Rollback Rules)**: 定义哪些异常会触发回滚（默认仅回滚 `RuntimeException` 和 `Error`）。

- **`TransactionStatus`**: 代表了事务的**当前状态**。它可以用于查询事务状态（如是否是新事务、是否有保存点）以及控制事务（如设置回滚标记）。

## 3. 事务传播行为 (Propagation Behavior)

这是 Spring 事务中最重要也最容易混淆的概念。它定义了事务的边界。

| 传播行为类型                      | 说明                                                                                                                                                                                                                               |
| :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`PROPAGATION_REQUIRED` (默认)** | 如果当前没有事务，就新建一个事务；如果当前存在事务，就加入这个事务。这是最常见的选择。                                                                                                                                             |
| **`PROPAGATION_SUPPORTS`**        | 支持当前事务。如果当前没有事务，就以非事务方式执行。                                                                                                                                                                               |
| **`PROPAGATION_MANDATORY`**       | 使用当前的事务。如果当前没有事务，就抛出异常。                                                                                                                                                                                     |
| **`PROPAGATION_REQUIRES_NEW`**    | 新建一个事务。如果当前存在事务，就把当前事务挂起。新事务与原有事务相互独立。                                                                                                                                                       |
| **`PROPAGATION_NOT_SUPPORTED`**   | 以非事务方式执行操作。如果当前存在事务，就把当前事务挂起。                                                                                                                                                                         |
| **`PROPAGATION_NEVER`**           | 以非事务方式执行。如果当前存在事务，则抛出异常。                                                                                                                                                                                   |
| **`PROPAGATION_NESTED`**          | 如果当前存在事务，则在嵌套事务内执行；如果当前没有事务，则行为与 `PROPAGATION_REQUIRED` 类似。**注意：** 嵌套事务是外部事务的一部分，只有外部事务提交时，嵌套事务才会提交。这种传播行为依赖于 JDBC 3.0 的保存点（Savepoint）功能。 |

## 4. 事务隔离级别 (Isolation Level)

Spring 提供了与 JDBC 标准一致的事务隔离级别，用于解决并发事务所可能引发的问题。

| 隔离级别                         | 脏读 | 不可重复读 | 幻读 | 说明                                                                                                                  |
| :------------------------------- | :--- | :--------- | :--- | :-------------------------------------------------------------------------------------------------------------------- |
| **`ISOLATION_DEFAULT`**          | -    | -          | -    | 使用后端数据库的默认隔离级别（如 MySQL 默认为 `REPEATABLE_READ`，Oracle 默认为 `READ_COMMITTED`）。**推荐使用此项**。 |
| **`ISOLATION_READ_UNCOMMITTED`** | ✅   | ✅         | ✅   | 最低的隔离级别，允许读取未提交的数据变更。                                                                            |
| **`ISOLATION_READ_COMMITTED`**   | ❌   | ✅         | ✅   | 允许读取并发事务已经提交的数据。可防止脏读。                                                                          |
| **`ISOLATION_REPEATABLE_READ`**  | ❌   | ❌         | ✅   | 对同一字段的多次读取结果都是一致的，除非数据是被本身事务自己所修改。可防止脏读和不可重复读。                          |
| **`ISOLATION_SERIALIZABLE`**     | ❌   | ❌         | ❌   | 最高的隔离级别，完全服从 ACID 的隔离级别。所有事务依次逐个执行，可防止所有并发问题，但性能低下。                      |

## 5. 声明式事务管理 (Declarative Transaction Management)

声明式事务是 Spring 事务管理的**首选方式**，它通过 AOP 实现，将事务管理与业务代码完全分离，使用元数据（通常是 `@Transactional` 注解）来定义事务规则。

### 5.1 基于注解的配置

首先，需要在 Spring 配置中启用事务管理。

**Java 配置方式 (推荐):**

```java
@Configuration
@EnableTransactionManagement // 启用注解式事务管理
public class AppConfig {

    @Bean
    public DataSource dataSource() {
        // 创建并配置数据源，例如 HikariCP
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
        dataSource.setUsername("user");
        dataSource.setPassword("password");
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        return dataSource;
    }

    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        // 配置事务管理器，JDBC 事务使用 DataSourceTransactionManager
        return new DataSourceTransactionManager(dataSource);
    }
}
```

**XML 配置方式:**

```xml
<!-- 配置数据源 -->
<bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource" ... />

<!-- 配置事务管理器 -->
<bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
    <property name="dataSource" ref="dataSource"/>
</bean>

<!-- 启用注解驱动的事务管理 -->
<tx:annotation-driven transaction-manager="transactionManager"/>
```

### 5.2 `@Transactional` 注解详解

你可以在**类**或**方法**上使用 `@Transactional` 注解。方法上的注解会覆盖类上的注解。

```java
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuditLogRepository auditLogRepository;

    // 在方法上声明事务属性
    @Transactional(
        propagation = Propagation.REQUIRED,         // 默认就是 REQUIRED
        isolation = Isolation.DEFAULT,              // 默认就是 DEFAULT
        timeout = 30,                               // 超时 30 秒
        readOnly = false,                           // 读写事务
        rollbackFor = { SQLException.class },       // 遇到 SQLException 时也回滚
        noRollbackFor = { IllegalArgumentException.class } // 遇到此异常不回滚
    )
    public void createUser(User user) {
        userRepository.save(user);
        // 记录审计日志
        AuditLog log = new AuditLog("CREATE_USER", "User created: " + user.getUsername());
        auditLogRepository.save(log);
        // 如果此处或之后抛出异常（非 IllegalArgumentException），整个事务将回滚，用户和日志都不会被插入
    }

    // 只读查询，使用默认传播行为和隔离级别，但标记为只读以优化性能
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id);
    }
}
```

**`@Transactional` 的工作机制：**
Spring 在运行时为标注了 `@Transactional` 的 Bean 创建代理（Proxy）。当你调用 `userService.createUser()` 时，实际上是在调用代理对象的方法。代理方法会：

1. 获取事务连接
2. 执行业务方法 (`userRepository.save(...)`)
3. 如果业务方法成功执行，则提交事务
4. 如果业务方法抛出**回滚规则定义的异常**，则回滚事务

## 6. 编程式事务管理 (Programmatic Transaction Management)

编程式事务允许你在代码中**显式地**控制事务的开始、提交和回滚。它提供了更细粒度的控制，但破坏了代码的整洁性，因此仅在绝对需要时才使用。

### 6.1 使用 `TransactionTemplate`

这是编程式事务的首选方式，它消除了冗长的 `try-catch-finally` 代码块。

```java
@Service
public class ComplexBusinessService {

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private InventoryRepository inventoryRepository;

    public void placeOrder(Order order) {
        // 使用 TransactionTemplate 执行一个事务块
        transactionTemplate.executeWithoutResult(status -> {
            try {
                // 1. 保存订单
                orderRepository.save(order);
                // 2. 更新库存
                inventoryRepository.decrementStock(order.getProductId(), order.getQuantity());
                // 如果以上操作成功，TransactionTemplate 会自动提交事务
            } catch (Exception e) {
                // 如果发生异常，手动设置回滚标记
                status.setRollbackOnly();
                throw new RuntimeException("Business logic failed, transaction marked for rollback", e);
            }
        });
    }
}
```

你需要将 `TransactionTemplate` 配置为 Bean，它需要一个 `PlatformTransactionManager`。

```java
@Configuration
public class AppConfig {
    // ... dataSource and transactionManager beans

    @Bean
    public TransactionTemplate transactionTemplate(PlatformTransactionManager transactionManager) {
        TransactionTemplate template = new TransactionTemplate();
        template.setTransactionManager(transactionManager);
        // 可以在这里为 Template 设置默认的事务属性，如超时时间
        template.setTimeout(30);
        return template;
    }
}
```

### 6.2 使用 `PlatformTransactionManager` 直接控制

这是最原始的方式，提供了最大的控制权，但代码也最冗长。

```java
public void directTransactionControl(PlatformTransactionManager transactionManager) {
    // 1. 定义事务属性
    DefaultTransactionDefinition def = new DefaultTransactionDefinition();
    def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
    def.setTimeout(30);

    // 2. 获取事务状态
    TransactionStatus status = transactionManager.getTransaction(def);

    try {
        // 3. 执行业务逻辑
        // ... your business logic here

        // 4. 提交事务
        transactionManager.commit(status);
    } catch (Exception ex) {
        // 5. 发生异常，回滚事务
        transactionManager.rollback(status);
        throw ex;
    }
}
```

## 7. 事务最佳实践与常见陷阱

### 7.1 最佳实践

1. **优先使用声明式事务**: 保持代码整洁，将事务管理作为一项横切关注点。
2. **将 `@Transactional` 注解在 Service 层**: 事务的边界通常是业务逻辑的边界，Service 层正是体现业务逻辑的地方。不要在 DAO/Repository 层使用事务，因为单个 DAO 方法通常不足以构成一个完整的业务事务。
3. **明确设置 `rollbackFor`**: 默认只回滚 `RuntimeException` 和 `Error`，而**受检异常 (Checked Exception)** 不会触发回滚。如果你的业务逻辑在抛出受检异常时也需要回滚，请显式配置 `@Transactional(rollbackFor = MyCheckedException.class)`。
4. **谨慎使用 `@Transactional(propagation = Propagation.REQUIRES_NEW)`**: 它会挂起当前事务并创建新事务。如果频繁使用或在循环中使用，会导致大量的数据库连接，可能耗尽连接池。同时，注意外部事务回滚并不会影响内部已提交的 `REQUIRES_NEW` 事务。
5. **设置合理的超时时间**: 防止长时间运行的事务占用数据库资源。
6. **只读查询标记 `readOnly = true`**: 这会给数据库一个提示，可能带来性能优化，同时也可以防止意外的写操作。

### 7.2 常见陷阱

1. **自调用问题 (Self-Invocation)**: 在同一个类中，一个非事务方法 `A()` 调用一个事务方法 `B()`，事务将会**失效**。因为 `@Transactional` 是基于代理实现的，只有通过代理对象进行的调用才会被拦截。内部调用 (`this.B()`) 不会经过代理。

    **解决方案**: 将事务方法放到另一个 Service 中，或者使用 `AspectJ` 模式（而非代理模式）来实现 AOP。

2. **异常被捕获 (Exception Caught and Handled)**: 如果在事务方法中捕获了异常并且没有重新抛出，事务管理器将不知道发生了异常，因此不会回滚事务。

   ```java
   @Transactional
   public void createUser(User user) {
       try {
           userRepository.save(user); // 如果这里抛出 RuntimeException
       } catch (Exception e) {
           // 你捕获了异常，但没有做任何处理（比如没有重新抛出）
           log.error("Error occurred", e);
       }
       // 事务将会被提交！
   }
   ```

   **解决方案**: 确保异常被传播到事务管理器。要么不捕获，要么捕获后通过 `throw new RuntimeException(e);` 再次抛出。

3. **选择错误的传播行为**: 错误地使用 `SUPPORTS`, `NOT_SUPPORTED` 等传播行为可能导致数据不一致。务必理解每种行为的含义。

## 8. 测试事务

Spring Test 模块提供了强大的事务测试支持。

```java
@SpringJUnitConfig(AppConfig.class) // 加载配置
@Transactional // 测试方法本身也会在事务中运行，默认测试完成后会自动回滚！
public class UserServiceIntegrationTest {

    @Autowired
    private UserService userService;

    @Test
    public void testCreateUser() {
        User user = new User("testUser");
        userService.createUser(user);

        // 执行断言...
        // 由于测试有 @Transactional，即使 createUser 方法内部提交了事务，
        // 但整个测试方法的事务会在最后回滚，不会污染数据库。
    }

    // 如果你希望测试方法提交事务，可以使用 @Rollback(false)
    @Test
    @Rollback(false)
    public void testCreateUserWithCommit() {
        // 这个测试执行后，数据会真正写入数据库
    }
}
```

## 总结

Spring 事务管理是一个强大而灵活的特性。对于绝大多数应用，**在 Service 层使用默认的 `@Transactional(propagation = Propagation.REQUIRED)`** 是最佳选择。这为每个业务方法提供了一个简单而清晰的事务边界：方法开始即开始事务，方法成功结束则提交，抛出异常则回滚。

理解传播行为和隔离级别是掌握 Spring 事务的关键。避免常见的陷阱，如自调用和异常处理不当，可以确保你的事务按预期工作。最后，利用 Spring 的测试框架可以轻松地编写出可靠的事务集成测试。

通过遵循这些模式和最佳实践，你可以构建出数据一致性强、健壮且易于维护的应用程序。
