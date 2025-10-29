---
title: Spring Data Access 数据访问详解与最佳实践
description: 本文深入探讨了 Spring 框架中数据访问层 (DAL) 的设计与实现，内容涵盖了统一的异常体系、模板方法模式、声明式事务管理以及资源管理等关键方面。
author: zhycn
---

# Spring Data Access 数据访问详解与最佳实践

- [Data Access](https://docs.spring.io/spring-framework/reference/data-access.html)

## 1. 概述

在企业级应用开发中，数据访问层 (DAL) 是连接业务逻辑和持久化数据存储 (如关系型数据库、NoSQL 等) 的核心桥梁。Spring 框架提供了一个强大且一致的 **数据访问异常体系** 和 **模板方法模式** 的实现，极大地简化了数据访问代码的编写，并有效地处理了各种冗杂和易错的流程。

Spring 数据访问的核心优势在于：

- **统一的异常体系**：将特定于数据库的异常 (如 `SQLException`) 转换为 Spring 提供的、通用的、**非检查型异常** (`DataAccessException` 的子类)，使开发者可以从繁琐的错误处理代码中解脱出来。
- **模板方法模式**：通过 `JdbcTemplate`, `HibernateTemplate` (已不推荐) 等类，消除了大量的样板式代码 (如获取连接、准备语句、处理异常、关闭资源等)，让开发者只需关注核心的数据操作逻辑。
- **声明式事务管理**：通过 **AOP** 和 **注解** (`@Transactional`) 提供了强大而灵活的事务管理能力，无需与复杂、底层的 API 耦合。
- **资源管理**：自动管理数据库连接等资源的获取和释放，避免资源泄漏。

## 2. 统一的异常体系

在传统的 JDBC 编程中，几乎所有方法都会抛出检查型异常 `SQLException`。开发者必须在代码中捕获并处理它，但这通常很繁琐，并且很多错误在应用层面无法有效恢复。

Spring 通过 `DataAccessException` 重构了这一体系。它是一个非检查型异常 (`RuntimeException` 的子类)，封装了底层数据访问技术的特定错误。

**异常转换过程**：

1. Spring 会捕获特定的数据访问异常 (如 `SQLException`)。
2. 通过 `SQLExceptionTranslator` 接口及其实现类，将这些异常转换为 `DataAccessException` 层次结构中的某个具体异常。
3. 开发者可以选择捕获那些他们真正关心并能处理的异常。

**常见的 `DataAccessException`**：

- `DuplicateKeyException`：尝试插入重复的主键或唯一键约束的记录。
- `DataIntegrityViolationException`：数据完整性违反，如外键约束失败、非空约束失败等。
- `DeadlockLoserDataAccessException`：操作过程中发生死锁。
- `IncorrectResultSizeDataAccessException`：查询结果数量与预期不符 (例如，期望一条，却返回零条或多条)。
- `CannotGetJdbcConnectionException`：无法获取数据库连接。

**最佳实践**：

- 在服务层，通常无需捕获这些异常，让其向上传播，由全局异常处理器统一处理。
- 如果存在可恢复的特定业务场景 (如用户名重复)，可以有选择地捕获并处理特定的 `DataAccessException` 子类。

```java
// 服务层方法示例
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public void createUser(User user) {
        try {
            userRepository.save(user);
        } catch (DuplicateKeyException e) {
            // 处理用户名或邮箱重复的可恢复异常
            throw new BusinessException("用户名已存在", e);
        }
        // 其他 DataAccessException 通常不捕获，让其变为事务回滚的触发点
    }
}
```

## 3. 数据源 (DataSource) 配置

数据源是数据访问的起点。Spring 通过 `DataSource` 对象来抽象数据库连接。

### 3.1 嵌入式数据源 (测试/开发)

常用于测试和开发环境，如 H2, HSQLDB。

```java
@Configuration
public class DevDataSourceConfig {

    @Bean
    public DataSource dataSource() {
        return new EmbeddedDatabaseBuilder()
                .setType(EmbeddedDatabaseType.H2) // 或 HSQLDB, DERBY
                .addScript("classpath:schema.sql") // 初始化表结构
                .addScript("classpath:data.sql")   // 初始化数据
                .build();
    }
}
```

### 3.2 生产环境数据源

生产环境通常使用连接池来管理数据库连接，以提高性能。常用的库有 **HikariCP**, **Apache Commons DBCP2**, **Tomcat JDBC Pool**, **Druid** 等。**HikariCP** 因其高性能和可靠性已成为 Spring Boot 的默认选择。

**通过 Java Config 配置 HikariCP**：

```java
@Configuration
public class ProductionDataSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "app.datasource") // 绑定配置文件中的属性
    public HikariDataSource dataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }
}
```

**对应的 `application.properties`**:

```properties
# 数据源配置
app.datasource.jdbc-url=jdbc:mysql://localhost:3306/my_db?useSSL=false&serverTimezone=UTC
app.datasource.username=root
app.datasource.password=secret
app.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# HikariCP 连接池特定配置
app.datasource.hikari.connection-timeout=30000
app.datasource.hikari.minimum-idle=5
app.datasource.hikari.maximum-pool-size=20
app.datasource.hikari.idle-timeout=600000
app.datasource.hikari.max-lifetime=1800000
```

### 3.3 使用 JNDI 数据源 (适用于 Web 容器)

在部署到 Servlet 容器 (如 Tomcat) 或应用服务器 (如 WebSphere, WildFly) 时，通常从 JNDI 获取容器管理的数据源。

```java
@Configuration
public class JndiDataSourceConfig {

    @Bean
    public DataSource dataSource() throws NamingException {
        JndiObjectFactoryBean bean = new JndiObjectFactoryBean();
        bean.setJndiName("java:comp/env/jdbc/MyDB");
        bean.afterPropertiesSet();
        return (DataSource) bean.getObject();
    }
}
```

## 4. 核心访问方式

### 4.1 JDBC 访问 - JdbcTemplate

`JdbcTemplate` 是 Spring JDBC 抽象的核心类。它处理了资源的创建和释放，极大地简化了 JDBC 的使用。

**优点**：

- 自动管理连接、语句和结果集的打开与关闭。
- 将 `SQLException` 转换为 `DataAccessException`。
- 提供了丰富的便捷方法 (query, update, execute)。

**示例**：

首先，定义一个实体类 `User`：

```java
public class User {
    private Long id;
    private String username;
    private String email;
    // ... getters, setters, constructor
}
```

然后，创建一个使用 `JdbcTemplate` 的 Repository：

```java
@Repository // 标识为数据访问组件，同时其抛出的异常会被自动转换
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // INSERT - 返回插入的行数
    public int insertUser(User user) {
        String sql = "INSERT INTO users (username, email) VALUES (?, ?)";
        return jdbcTemplate.update(sql, user.getUsername(), user.getEmail());
    }

    // SELECT by ID - 使用 RowMapper 将结果集行转换为对象
    public User findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, new UserRowMapper(), id);
        } catch (IncorrectResultSizeDataAccessException e) {
            // 如果没找到，返回 null
            return null;
        }
    }

    // SELECT ALL
    public List<User> findAll() {
        String sql = "SELECT * FROM users";
        return jdbcTemplate.query(sql, new UserRowMapper());
    }

    // UPDATE
    public int updateUser(User user) {
        String sql = "UPDATE users SET username = ?, email = ? WHERE id = ?";
        return jdbcTemplate.update(sql, user.getUsername(), user.getEmail(), user.getId());
    }

    // DELETE
    public int deleteById(Long id) {
        String sql = "DELETE FROM users WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }

    // 自定义 RowMapper
    private static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(rs.getLong("id"));
            user.setUsername(rs.getString("username"));
            user.setEmail(rs.getString("email"));
            return user;
        }
    }
}
```

**最佳实践**：

- 推荐使用 **构造器注入** 来注入 `JdbcTemplate`。
- 对于简单的查询，可以使用 `BeanPropertyRowMapper`，它通过名称映射将结果集列映射到 JavaBean 属性。

  ```java
  public User findById(Long id) {
      String sql = "SELECT * FROM users WHERE id = ?";
      return jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(User.class), id);
  }
  ```

- 对于复杂的批处理操作，使用 `JdbcTemplate#batchUpdate` 方法性能更高。

### 4.2 使用 Spring Data JPA (ORM)

对于复杂的领域模型，使用 ORM (对象关系映射) 工具如 **Hibernate** 或 **EclipseLink** 可以进一步提高开发效率。Spring 通过 `Spring Data JPA` 项目对 JPA (Java Persistence API) 提供了极佳的支持。

**核心概念**：

- **Entity**： 使用 `@Entity` 注解的普通 Java 对象 (POJO)。
- **Repository**： 继承自 `JpaRepository` 的接口，Spring Data 会自动为其生成实现。
- **方法名查询**： 根据接口方法名自动生成查询。

**示例**：

1. **实体类** (`User.java`)：

   ```java
   import javax.persistence.*;

   @Entity
   @Table(name = "users")
   public class User {
       @Id
       @GeneratedValue(strategy = GenerationType.IDENTITY)
       private Long id;

       @Column(nullable = false, unique = true)
       private String username;

       @Column(nullable = false, unique = true)
       private String email;

       // ... getters, setters, default constructor
   }
   ```

2. **Repository 接口** (`UserRepository.java`)：

   ```java
   import org.springframework.data.jpa.repository.JpaRepository;
   import org.springframework.stereotype.Repository;

   import java.util.List;
   import java.util.Optional;

   @Repository
   public interface UserRepository extends JpaRepository<User, Long> {
       // 自定义查询：根据方法名自动生成
       Optional<User> findByUsername(String username);
       List<User> findByEmailContaining(String emailPart);

       // 使用 @Query 注解自定义 JPQL 或原生 SQL
       @Query("SELECT u FROM User u WHERE u.email LIKE %:domain")
       List<User> findByEmailDomain(@Param("domain") String domain);
   }
   ```

3. **服务层使用** (`UserService.java`)：

   ```java
   @Service
   @Transactional // 确保服务层方法的事务边界
   public class UserService {

       @Autowired
       private UserRepository userRepository;

       public User createUser(User user) {
           return userRepository.save(user); // save 方法来自 JpaRepository
       }

       public Optional<User> getUserByUsername(String username) {
           return userRepository.findByUsername(username);
       }

       // ... 其他业务方法
   }
   ```

**最佳实践**：

- 在服务层使用 `@Transactional`，而不是在 DAO/Repository 层。
- 优先使用 **方法名查询** 和 **`@Query`** 注解，它们清晰且类型安全。尽量避免使用原生的 `EntityManager`。
- 使用 `Optional<T>` 作为查询单个对象的返回值，优雅地处理 `null` 值。

## 5. 事务管理 (Transaction Management)

事务管理是数据访问中至关重要的一环。Spring 提供了强大的 **声明式事务管理**。

### 5.1 声明式事务与 `@Transactional`

通过在方法或类上添加 `@Transactional` 注解，Spring 会通过 AOP 为该方法提供事务边界。

**配置开启事务管理**：

```java
@Configuration
@EnableTransactionManagement // 启用注解驱动的事务管理
public class AppConfig {

    // 需要配置一个 PlatformTransactionManager Bean
    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
    // 如果使用 JPA，则需要 JpaTransactionManager
    // @Bean
    // public PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
    //     return new JpaTransactionManager(emf);
    // }
}
```

**`@Transactional` 注解详解**：

```java
@Service
public class BankingService {

    @Autowired
    private AccountRepository accountRepository;

    // 在方法上使用注解是最常见的做法
    @Transactional(
        propagation = Propagation.REQUIRED,         // 传播行为：如果当前没有事务，就新建一个；如果已存在，则加入
        isolation = Isolation.DEFAULT,              // 隔离级别：使用数据库默认级别
        readOnly = false,                           // 是否只读：false 表示可写
        rollbackFor = {BusinessException.class},    // 遇到哪些异常时回滚
        noRollbackFor = {IllegalArgumentException.class}, // 遇到哪些异常时不回滚
        timeout = 30                                // 事务超时时间（秒）
    )
    public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
        Account fromAccount = accountRepository.findById(fromId).orElseThrow(...);
        Account toAccount = accountRepository.findById(toId).orElseThrow(...);

        fromAccount.debit(amount); // 借方扣款
        accountRepository.save(fromAccount);

        toAccount.credit(amount); // 贷方收款
        accountRepository.save(toAccount);

        // 如果在此过程中抛出任何未检查异常，事务将自动回滚
    }
}
```

**最佳实践**：

- **事务注解应放在服务层**：因为一个业务操作可能涉及多个 Repository 调用，事务边界应该在服务层划定。
- **仔细设置 `readOnly`**：对于只读查询操作，设置 `readOnly = true`，某些数据库和驱动会对此进行优化，同时可以防止误操作写入。
- **明确指定回滚异常**：默认只在遇到 `RuntimeException` 和 `Error` 时回滚。如果需要在遇到检查型异常时也回滚，使用 `rollbackFor` 属性。
- **避免事务方法自调用**：在同一个类中，一个非事务方法调用另一个 `@Transactional` 方法，事务注解会失效，因为这是通过 AOP 代理实现的。

## 6. 最佳实践总结

1. **选择合适的数据访问技术**：
   - 简单项目/需要完全控制 SQL：使用 **JdbcTemplate**。
   - 复杂领域模型/追求开发效率：使用 **Spring Data JPA**。
   - 高度动态的查询/复杂报表：可结合使用 **JdbcTemplate** 或 **MyBatis**。

2. **始终使用连接池**：生产环境必须配置 HikariCP 等高性能连接池。

3. **正确使用事务**：
   - 在 **服务层** 使用 `@Transactional`。
   - 明确事务的传播行为和隔离级别。
   - 为只读操作设置 `readOnly = true`。

4. **处理异常**：依靠 Spring 的异常体系，在全局层面处理大多数不可恢复的数据访问异常，仅在服务层有选择地处理可恢复的特定业务异常。

5. **进行单元测试**：使用 `@DataJpaTest` (测试 JPA) 或 `@JdbcTest` (测试 JDBC) 等切片测试注解，配合嵌入式数据库 (如 H2) 对数据访问层进行隔离测试。

6. **SQL 注入防护**：永远使用 `JdbcTemplate` 的**参数化查询** ( `?` 占位符) 或 JPA 的命名参数，**严禁** 使用字符串拼接来构造 SQL 语句。

7. **监控与性能**：在生产环境中，监控连接池的使用情况 (如活跃连接数、等待时间) 和慢查询，以便及时调整配置和优化 SQL。

通过遵循 Spring 的设计理念和这些最佳实践，你可以构建出健壮、高效且易于维护的数据访问层。
