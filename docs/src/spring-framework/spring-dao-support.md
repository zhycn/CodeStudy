---
title: Spring DAO Support 数据访问支持详解与最佳实践
description: 本文深入探讨了 Spring 框架中 DAO Support 数据访问支持的核心概念、机制和最佳实践。内容涵盖了模板方法模式、一致的异常体系、资源管理、事务管理等方面。
author: zhycn
---

# Spring DAO Support 数据访问支持详解与最佳实践

- [DAO Support](https://docs.spring.io/spring-framework/reference/data-access/dao.html)

## 1. 引言

在基于 Spring 框架的应用程序中，数据访问层 (Data Access Object, DAO) 是连接业务逻辑与持久化存储（如关系型数据库、NoSQL 等）的核心桥梁。为了简化 DAO 组件的开发，避免重复和样板代码，Spring 提供了一套强大的 **DAO Support** 抽象支持类。

本文将深入探讨 Spring DAO Support 的设计理念、核心实现、最佳实践，并通过清晰的代码示例展示如何高效地使用它们。

## 2. DAO 模式与 Spring 的简化

### 2.1 传统 DAO 模式的痛点

在原生 JDBC 或 ORM 框架（如 Hibernate）中，编写一个 DAO 通常涉及大量重复性代码：

- **资源管理**： 频繁地获取和释放连接、会话、语句等资源。
- **异常处理**： 强制捕获检查异常（如 `SQLException`），该异常过于通用，难以处理。
- **事务管理**： 需要手动控制事务的边界（开始、提交、回滚）。
- **平台依赖性**： 代码与特定的数据访问技术（如纯 JDBC、Hibernate、JPA）紧密耦合，难以切换。

### 2.2 Spring DAO 的解决方案

Spring 通过一致的 **数据访问异常体系** 和 **模板方法模式 (Template Method Pattern)** 解决了上述问题。

1. **一致的异常体系**： Spring 将特定于技术的检查异常（如 `SQLException`）转换为统一的、非检查的 `DataAccessException` 层次结构。这使开发者可以专注于处理有意义的异常，而无需编写繁琐的 `try-catch` 代码块。
2. **模板方法模式**： Spring 提供了各种 `Template` 类（如 `JdbcTemplate`, `HibernateTemplate`），它们封装了资源管理和异常转换的核心流程。开发者只需通过回调接口（如 `PreparedStatementCreator`, `RowMapper`）定义具体的操作逻辑。
3. **DAO Support 类**： 为了进一步简化，Spring 提供了 `XxxDaoSupport` 类。这些是便利的基类，它们预配置了相应的 `Template`，并提供了直接获取 `Template` 的方法，使 DAO 的实现更加直接。

## 3. 核心 DAO Support 类详解

Spring 为不同的数据访问技术提供了相应的 Support 类。

### 3.1 JdbcDaoSupport

`JdbcDaoSupport` 是针对纯 JDBC 的 DAO 支持类。它内部持有一个 `JdbcTemplate` 实例。

**配置方式：**

通常通过依赖注入 `DataSource` 来配置。

**XML 配置:**

```xml
<bean id="myUserDao" class="com.example.dao.JdbcUserDao">
    <property name="dataSource" ref="dataSource"/>
</bean>
```

**Java 注解配置:**

```java
@Repository
public class JdbcUserDao extends JdbcDaoSupport {

    @Autowired
    public JdbcUserDao(DataSource dataSource) {
        setDataSource(dataSource);
    }
    // ... 其他方法
}
```

**代码示例：**

```java
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.support.JdbcDaoSupport;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class JdbcUserDao extends JdbcDaoSupport {

    // 查询单个对象
    public User findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try {
            return getJdbcTemplate().queryForObject(
                sql,
                new BeanPropertyRowMapper<>(User.class),
                id
            );
        } catch (EmptyResultDataAccessException e) {
            return null; // 处理查询结果为空的情况
        }
    }

    // 查询列表
    public List<User> findAll() {
        String sql = "SELECT * FROM users";
        return getJdbcTemplate().query(sql, new BeanPropertyRowMapper<>(User.class));
    }

    // 插入数据
    public void create(User user) {
        String sql = "INSERT INTO users (username, email) VALUES (?, ?)";
        getJdbcTemplate().update(sql, user.getUsername(), user.getEmail());
    }

    // 更新数据
    public void update(User user) {
        String sql = "UPDATE users SET username = ?, email = ? WHERE id = ?";
        getJdbcTemplate().update(sql, user.getUsername(), user.getEmail(), user.getId());
    }
}
```

### 3.2 HibernateDaoSupport (已不推荐)

`HibernateDaoSupport` 是为 Hibernate 设计的支持类，它内部持有一个 `HibernateTemplate`。

> **重要提示**： 自 Spring 4.x/5.x 以来，官方推荐直接使用 **Hibernate 原生 API** 并通过 `@Transactional` 注解管理事务，而不是使用 `HibernateTemplate` 和 `HibernateDaoSupport`。这些类目前主要用于向后兼容。

**不推荐的使用方式：**

```java
public class OldHibernateUserDao extends HibernateDaoSupport {
    public User findById(Long id) {
        return getHibernateTemplate().get(User.class, id);
    }
}
```

**现代 Spring + Hibernate 最佳实践：**
直接注入 Hibernate 的 `SessionFactory`，并使用 `@Transactional`。

```java
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import javax.persistence.criteria.CriteriaQuery;
import java.util.List;

@Repository
@Transactional // 事务边界通常在Service层，此处仅为示例
public class ModernHibernateUserDao {

    @Autowired
    private SessionFactory sessionFactory;

    public User findById(Long id) {
        return sessionFactory.getCurrentSession().get(User.class, id);
    }

    public void create(User user) {
        sessionFactory.getCurrentSession().save(user);
    }

    public List<User> findAll() {
        CriteriaQuery<User> cq = sessionFactory.getCurrentSession()
                .getCriteriaBuilder()
                .createQuery(User.class);
        cq.from(User.class);
        return sessionFactory.getCurrentSession().createQuery(cq).getResultList();
    }
}
```

### 3.3 JpaDaoSupport (已不推荐)

与 `HibernateDaoSupport` 类似，`JpaDaoSupport` 提供了一个 `JpaTemplate`。

> **同样不推荐**： 现代 Spring JPA 应用强烈推荐直接使用 **Spring Data JPA** 或直接注入 `EntityManager`。`JpaTemplate` 和 `JpaDaoSupport` 也已过时。

**现代 Spring Data JPA 最佳实践：**
直接使用 Spring Data JPA 接口，无需手动实现 DAO。

```java
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring Data JPA 会自动实现以下方法：
    // save(), findById(), findAll(), deleteById(), etc.

    // 根据方法名自动生成查询
    User findByUsername(String username);
    List<User> findByEmailContaining(String keyword);
}
```

## 4. 最佳实践与决策建议

### 4.1 技术选型：该使用哪个 Support 类？

| 数据访问技术  | 推荐方式                                         | 说明                                                                                    |
| :------------ | :----------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **纯 JDBC**   | **`JdbcDaoSupport`**                             | 对于简单的、轻量级的 JDBC 操作，`JdbcDaoSupport` 和 `JdbcTemplate` 仍然是优秀的选择。   |
| **Hibernate** | **直接使用 `SessionFactory` + `@Transactional`** | 避免使用 `HibernateDaoSupport`。拥抱 Hibernate 的原生 API，并由 Spring 管理事务和会话。 |
| **JPA**       | **Spring Data JPA**                              | 这是最高效、最现代的方式。几乎无需编写任何实现代码。其次是直接注入 `EntityManager`。    |
| **MyBatis**   | **无需 Support 类**                              | MyBatis-Spring 集成库提供了 `SqlSessionTemplate` 和 Mapper 接口扫描，无需继承特定基类。 |

### 4.2 通用最佳实践

1. **依赖注入优于继承**： 即使使用 `JdbcDaoSupport`，也推荐通过构造函数或 Setter 方法注入 `DataSource`，而不是直接继承（尽管它本身就是一个基类）。这使代码更灵活、更易于测试。
2. **使用 `RowMapper`**： 始终使用 `RowMapper`（如 `BeanPropertyRowMapper`）或 `ResultSetExtractor` 来映射结果集到对象，而不是手动处理 `ResultSet`。
3. **利用 `@Repository` 注解**： 在 DAO 实现类上使用 `@Repository`。这不仅赋予了组件语义，更重要的是，它使得 Spring 的异常翻译机制能够生效，将特定于技术的异常转换为 Spring 的统一异常。
4. **清晰的事务边界**： 使用 `@Transactional` 在 **Service 层** 定义事务边界，而不是在 DAO 层。一个业务方法可能调用多个 DAO 方法，这些操作应该在同一个事务中。
5. **测试**： 利用 Spring 的测试框架 (`@SpringJUnitConfig`, `@DataJpaTest`) 来轻松测试你的 DAO 层，它通常会配置一个内存数据库（如 H2）。

## 5. 完整示例：基于 JdbcDaoSupport 的现代实现

下面是一个结合了现代 Spring 特性的 `JdbcDaoSupport` 完整示例。

**1. 领域模型 (User.java)**

```java
public class User {
    private Long id;
    private String username;
    private String email;
    // Constructors, Getters, Setters, toString...
}
```

**2. DAO 接口 (UserDao.java)**

```java
public interface UserDao {
    User findById(Long id);
    List<User> findAll();
    void create(User user);
}
```

**3. DAO 实现 (JdbcUserDao.java)**

```java
import org.springframework.jdbc.core.support.JdbcDaoSupport;
import org.springframework.stereotype.Repository;
import javax.annotation.PostConstruct;
import javax.sql.DataSource;

@Repository
public class JdbcUserDao extends JdbcDaoSupport implements UserDao {

    private final DataSource dataSource;

    // 通过构造函数注入DataSource
    public JdbcUserDao(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    private void initialize() {
        // 在构造完成后设置DataSource
        setDataSource(dataSource);
    }

    @Override
    public User findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        return getJdbcTemplate().queryForObject(
                sql,
                (rs, rowNum) -> new User( // 使用Lambda表达式实现RowMapper
                        rs.getLong("id"),
                        rs.getString("username"),
                        rs.getString("email")
                ),
                id
        );
    }

    @Override
    public List<User> findAll() {
        String sql = "SELECT * FROM users";
        return getJdbcTemplate().query(
                sql,
                (rs, rowNum) -> new User(
                        rs.getLong("id"),
                        rs.getString("username"),
                        rs.getString("email")
                )
        );
    }

    @Override
    public void create(User user) {
        String sql = "INSERT INTO users (username, email) VALUES (?, ?)";
        getJdbcTemplate().update(sql, user.getUsername(), user.getEmail());
    }
}
```

**4. Service 层 (UserService.java)**

```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional // 事务定义在Service层
public class UserService {

    private final UserDao userDao;

    public UserService(UserDao userDao) {
        this.userDao = userDao;
    }

    public User getUserById(Long id) {
        return userDao.findById(id);
    }

    public void createNewUser(User user) {
        userDao.create(user);
    }
}
```

## 6. 总结

Spring 的 DAO Support 体系是其数据访问抽象的核心体现。

- **`JdbcDaoSupport`** 对于基于 JDBC 的轻量级数据访问仍然是一个实用且强大的工具。
- **`HibernateDaoSupport` 和 `JpaDaoSupport` 已经过时**，现代应用应直接使用 Hibernate/JPA 原生 API 或更高级的 **Spring Data JPA**。
- 无论选择哪种技术，都应遵循 Spring 的通用最佳实践：**使用 `@Repository` 进行异常转换、在 Service 层使用 `@Transactional` 定义事务、以及编写易于测试的代码**。

通过理解和应用这些原则，你可以构建出清晰、健壮且易于维护的数据访问层，充分享受 Spring 框架带来的开发效率提升。
