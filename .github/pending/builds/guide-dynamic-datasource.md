在企业级应用开发中，面对复杂多变的业务场景，例如数据读写分离、多租户（SaaS）架构、分库分表等，应用程序需要能够根据运行时条件动态地切换数据源。手动配置多个数据源并在代码中硬编码切换逻辑不仅繁琐，而且难以维护。

**Dynamic Datasource** 应运而生，它为 Spring Boot 提供了优雅且高效的解决方案。本文将作为一份详尽的技术指南，深入剖析 Dynamic Datasource 的工作原理、与 Spring Boot 3 的集成方式、最佳实践，并提供清晰可运行的代码示例，助你轻松应对多数据源挑战。

---

## 1\. 核心理念与技术选型

### 1.1 什么是 Dynamic Datasource？

Dynamic Datasource（动态数据源）是一种设计模式，其核心思想是在程序运行时，根据特定的业务规则或上下文信息，自动选择并切换到相应的数据源。它基于 Spring 的 **`AbstractRoutingDataSource`** 接口实现，通过 AOP（面向切面编程）或 ThreadLocal 技术，在执行数据库操作前，将数据源的路由键（Lookup Key）与当前线程绑定。

### 1.2 主流方案：`dynamic-datasource-spring-boot-starter`

在众多动态数据源解决方案中，由 **baomidou** 团队开发的 `dynamic-datasource-spring-boot-starter` 凭借其强大的功能、完善的文档和广泛的社区支持，成为了 Spring Boot 3 生态中的首选。它不仅实现了基础的动态切换，还提供了以下高级特性：

- **多数据源配置**：支持配置多组数据源，可自动识别并管理。
- **读写分离**：内置了读写分离策略，可自动将读操作路由到从库，写操作路由到主库。
- **AOP 切面**：通过注解或 SpEL 表达式，以非侵入式的方式在 Service 层或 Mapper 层实现数据源切换。
- **灵活的路由策略**：支持轮询、随机、哈希等多种路由算法。
- **多租户支持**：轻松集成多租户方案，实现数据隔离。
- **事务管理**：提供了完善的多数据源事务支持，确保数据一致性。

本文将以 `dynamic-datasource-spring-boot-starter` 作为核心工具，详细讲解其在 Spring Boot 3 中的应用。

---

## 2\. Spring Boot 3 集成实战

### 2.1 引入 Maven 依赖

首先，在你的 Spring Boot 3 项目中，添加 `dynamic-datasource-spring-boot-starter` 依赖。

```xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>dynamic-datasource-spring-boot3-starter</artifactId>
    <version>4.3.1</version>
</dependency>
```

**⚠️ 注意**: 请确保你使用的版本与 Spring Boot 3 兼容。这里推荐 `4.3.1` 或更高版本。

### 2.2 配置文件

在 `application.yml` 或 `application.properties` 中配置你的多个数据源。`dynamic-datasource` 采用层次化的配置方式，非常直观。

以下是一个配置两个数据源（`master` 和 `slave_1`）的示例，其中 `master` 是默认数据源。

```yaml
spring:
  datasource:
    dynamic:
      # 默认数据源名称，对应下面的配置
      primary: master
      # 严格模式，确保数据源名称必须在配置中存在
      strict: false
      # 所有数据源配置
      datasource:
        # 主数据源，名称为 master
        master:
          url: jdbc:mysql://localhost:3306/db_master?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
          username: root
          password: your-master-password
          driver-class-name: com.mysql.cj.jdbc.Driver
          # 使用 HikariCP 连接池
          type: com.zaxxer.hikari.HikariDataSource
          # HikariCP 的额外配置
          hikari:
            pool-name: master-pool
            minimum-idle: 5
            maximum-pool-size: 20
        # 从数据源，名称为 slave_1
        slave_1:
          url: jdbc:mysql://localhost:3306/db_slave_1?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
          username: root
          password: your-slave-password
          driver-class-name: com.mysql.cj.jdbc.Driver
          type: com.zaxxer.hikari.HikariDataSource
          hikari:
            pool-name: slave-1-pool
            minimum-idle: 5
            maximum-pool-size: 20
```

### 2.3 动态切换数据源

动态切换主要通过 `@DS` 注解实现。你可以将此注解应用在类或方法上。

**a) 基于方法的切换**

这是最常用、最灵活的方式。

```java
import com.baomidou.dynamic.datasource.annotation.DS;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    // 默认使用 application.yml 中配置的 primary 数据源
    public User findUserById(Long id) {
        // ...
    }

    // 通过 @DS 注解指定使用 slave_1 数据源
    @DS("slave_1")
    public List<User> findAllUsers() {
        // 该方法内的所有数据库操作都会路由到 slave_1
        // ...
    }

    // 也可以使用 SpEL 表达式动态获取数据源名称
    @DS("#tenantId")
    public void addUser(Long tenantId, User user) {
        // tenantId 将作为数据源的查找键
        // 需在 application.yml 中配置 tenantId 对应的数据源
        // ...
    }
}
```

**b) 基于类的切换**

如果你希望一个类中的所有方法都使用同一个数据源，可以将 `@DS` 注解放在类上。

```java
import com.baomidou.dynamic.datasource.annotation.DS;
import org.springframework.stereotype.Repository;

@DS("slave_1")
@Repository
public class UserRepository {
    // 这个类中的所有方法都将使用 slave_1 数据源
}
```

---

## 3\. 最佳实践与高级配置

### 3.1 读写分离

`dynamic-datasource` 提供了开箱即用的读写分离功能。你只需在配置中指定从库即可。

```yaml
spring:
  datasource:
    dynamic:
      primary: master
      strict: false
      datasource:
        master:
          #... master 配置
        slave:
          #... slave 1 配置
        slave_2:
          #... slave 2 配置
      # 读写分离配置
      # 这里配置 master 和 slave 为一组，默认的读写分离策略为轮询
      group:
        db_group:
          primary: master
          slave: slave_1, slave_2
```

配置好后，`dynamic-datasource` 会自动将 `@Transactional(readOnly = true)` 标记的事务路由到 `slave` 组中的数据源，而写事务则路由到 `master`。

你也可以使用 `@DS` 注解指定分组：

```java
import com.baomidou.dynamic.datasource.annotation.DS;
import org.springframework.transaction.annotation.Transactional;

@DS("db_group")
@Service
public class OrderService {

    @Transactional
    public void createOrder(Order order) {
        // 写入操作，会自动路由到 master
    }

    @Transactional(readOnly = true)
    public Order findOrderById(Long id) {
        // 读取操作，会自动路由到 slave_1 或 slave_2
    }
}
```

### 3.2 事务管理

动态数据源的事务管理是核心痛点之一。`dynamic-datasource` 提供了完美的解决方案。

**单个数据源事务**: 默认情况下，当切换到某个数据源后，Spring 的 `@Transactional` 会自动在该数据源上生效。

**多数据源分布式事务 (XA)**:
如果你需要在多个数据源之间进行跨库事务，`dynamic-datasource` 也支持 **XA 事务**。这通常需要引入 JTA (Java Transaction API) 和相应的实现，如 Atomikos 或 Bitronix。

**1. 引入依赖**

以 Atomikos 为例：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jta-atomikos</artifactId>
</dependency>
```

**2. 配置**

在 `application.yml` 中，将 `dynamic.datasource.jta` 设置为 `true`。

```yaml
spring:
  datasource:
    dynamic:
      #... 其他配置
      jta: true
```

**3. 使用**

使用 `@Transactional` 注解时，即可实现跨数据源的分布式事务。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransferService {

    @Autowired
    private AccountRepository accountRepository; // 假设操作主库

    @Autowired
    private LogRepository logRepository; // 假设操作从库

    @Transactional
    public void transferMoney(String fromAccount, String toAccount, double amount) {
        // 扣除 fromAccount 账户余额
        accountRepository.deduct(fromAccount, amount);

        // 记录日志，可能在另一个数据源
        logRepository.logTransfer(fromAccount, toAccount, amount);

        // 增加 toAccount 账户余额
        accountRepository.add(toAccount, amount);
    }
}
```

### 3.3 切换路由的两种方式：AOP 与 ThreadLocal

`dynamic-datasource` 的核心是 `@DS` 注解，它背后通过 **AOP 切面** 在方法执行前拦截并切换数据源。

另一种更底层、更灵活的切换方式是使用 `DynamicDataSourceContextHolder`。这在某些无法使用注解的场景下非常有用，例如需要在代码中根据复杂逻辑动态切换数据源。

```java
import com.baomidou.dynamic.datasource.toolkit.DynamicDataSourceContextHolder;
import org.springframework.stereotype.Service;

@Service
public class DynamicSwitchService {

    public void performComplexDbOperation(String dbName) {
        try {
            // 在业务逻辑开始前，手动设置数据源名称
            DynamicDataSourceContextHolder.push(dbName);

            // ... 执行数据库操作 ...

        } finally {
            // 在业务逻辑结束时，务必清理数据源上下文
            // 否则可能影响到同一线程池的其他任务
            DynamicDataSourceContextHolder.clear();
        }
    }
}
```

---

## 4\. 常见问题与排查

#### **Q1: 为什么我的 `@DS` 注解不起作用？**

**A:**

1. **检查依赖**: 确保你已正确引入 `dynamic-datasource-spring-boot3-starter`。
2. **检查配置**: 确保 `application.yml` 中 `dynamic` 的配置层级正确，且 `datasource` 下的数据源名称与 `@DS` 注解中的值一致。
3. **AOP 失效**:
   - 确保你的 `@Service` 或 `@Repository` 类被 Spring 容器正确管理。
   - 检查是否存在内部方法调用，即在一个类的内部方法中调用另一个 `@DS` 注解的方法。这种情况下，Spring AOP 默认会失效。解决办法是使用 `AopContext.currentProxy()` 获取代理对象，或者将 `@DS` 注解的逻辑移动到另一个类中。

#### **Q2: 如何处理多数据源下的实体类？**

**A:**
`dynamic-datasource` 库的强大之处在于，它通过切换数据源连接，使得你无需为每个数据源创建独立的 `EntityManager` 或 `JpaRepository`。你的实体类、Mapper 或 Repository 都可以是单一的，`dynamic-datasource` 会在运行时自动为你切换到正确的连接。

#### **Q3: 读写分离配置了，但写操作还是路由到了从库？**

**A:**

1. **检查注解**: 确保你的写操作方法没有被 `@Transactional(readOnly = true)` 注解。
2. **方法名**: 检查方法名是否以 `get`, `select`, `find` 等开头，这些方法名在 `dynamic-datasource` 的默认规则下会被视为读操作。如果你想强制执行写操作，请确保方法名不符合这些模式或显式使用 `@DS("master")` 注解。

---

## 5\. 总结

`dynamic-datasource-spring-boot-starter` 提供了一个优雅、强大且易于集成的动态数据源解决方案。它通过 AOP 切面和注解的方式，将数据源切换的复杂逻辑与业务代码解耦，大大提高了代码的可维护性和可读性。

通过本文的讲解，你应该已经掌握了以下核心要点：

- **基础集成**: 如何添加依赖、配置 `application.yml`。
- **核心用法**: 如何使用 `@DS` 注解在类或方法级别进行数据源切换。
- **高级特性**: 如何配置读写分离，以及处理单库与跨库事务。
- **最佳实践**: 了解 AOP 和 `ThreadLocal` 两种切换方式，并掌握其适用场景。

在实际项目中，你可以根据业务需求，灵活运用这些技术，轻松构建出高性能、高可用的多数据源应用。
