---
title: Spring JDBC 数据访问支持详解与最佳实践
description: 本文深入探讨了 Spring 框架中 JDBC 数据访问支持的核心概念、机制和最佳实践。内容涵盖了 JdbcTemplate、NamedParameterJdbcTemplate、事务管理、批量操作、结果集映射等方面。
author: zhycn
---

# Spring JDBC 数据访问支持详解与最佳实践

- [Data Access with JDBC](https://docs.spring.io/spring-framework/reference/data-access/jdbc.html)

## 1. 概述

Spring JDBC 是 Spring 框架提供的一个重要模块，它对原始的 JDBC API 进行了轻量级封装，极大地简化了数据库操作代码。通过 Spring JDBC，开发者可以避免编写繁琐的 `try-catch-finally` 代码块，更专注于 SQL 和业务逻辑的实现。

### 1.1 Spring JDBC 的核心价值

- **减少样板代码**：自动处理连接管理、异常处理和资源清理
- **统一的异常体系**：将检查型 SQLException 转换为非检查型 DataAccessException
- **灵活的 API 设计**：提供不同层次的抽象，满足各种复杂度的需求
- **良好的集成性**：与 Spring 事务管理无缝集成

### 1.2 与其他数据访问技术的对比

| 技术          | 抽象级别 | 学习曲线 | 灵活性 | 适用场景                |
| ------------- | -------- | -------- | ------ | ----------------------- |
| 原生 JDBC     | 低       | 陡峭     | 高     | 需要极致性能控制的场景  |
| Spring JDBC   | 中低     | 平缓     | 高     | 大多数传统 JDBC 项目    |
| JPA/Hibernate | 高       | 陡峭     | 中     | 对象-关系映射为主的场景 |
| MyBatis       | 中高     | 中等     | 高     | SQL 复杂度高的项目      |

## 2. 核心组件详解

### 2.1 JdbcTemplate

`JdbcTemplate` 是 Spring JDBC 的核心类，提供了执行 SQL 操作的基本方法。

```java
@Configuration
@EnableTransactionManagement
public class AppConfig {

    @Bean
    public DataSource dataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setJdbcUrl("jdbc:mysql://localhost:3306/testdb");
        dataSource.setUsername("root");
        dataSource.setPassword("password");
        dataSource.setMaximumPoolSize(10);
        return dataSource;
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

### 2.2 NamedParameterJdbcTemplate

支持命名参数的模板类，提高 SQL 的可读性和维护性。

```java
@Repository
public class UserRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public UserRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public User findById(Long id) {
        String sql = "SELECT id, name, email FROM users WHERE id = :id";
        Map<String, Object> params = Collections.singletonMap("id", id);

        return jdbcTemplate.queryForObject(sql, params, new UserRowMapper());
    }
}
```

### 2.3 RowMapper 接口

用于将结果集的每一行映射为 Java 对象。

```java
public class UserRowMapper implements RowMapper<User> {

    @Override
    public User mapRow(ResultSet rs, int rowNum) throws SQLException {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setName(rs.getString("name"));
        user.setEmail(rs.getString("email"));
        user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return user;
    }
}
```

### 2.4 ResultSetExtractor 接口

用于处理整个结果集，适合复杂的结果映射。

```java
public class UserDepartmentExtractor implements ResultSetExtractor<List<UserDepartmentDTO>> {

    @Override
    public List<UserDepartmentDTO> extractData(ResultSet rs) throws SQLException, DataAccessException {
        Map<Long, UserDepartmentDTO> map = new LinkedHashMap<>();

        while (rs.next()) {
            Long userId = rs.getLong("user_id");
            UserDepartmentDTO dto = map.get(userId);

            if (dto == null) {
                dto = new UserDepartmentDTO();
                dto.setUserId(userId);
                dto.setUserName(rs.getString("user_name"));
                dto.setDepartments(new ArrayList<>());
                map.put(userId, dto);
            }

            Department department = new Department();
            department.setId(rs.getLong("dept_id"));
            department.setName(rs.getString("dept_name"));
            dto.getDepartments().add(department);
        }

        return new ArrayList<>(map.values());
    }
}
```

## 3. 配置与数据源

### 3.1 数据源配置

Spring 支持多种方式配置数据源：

#### XML 配置方式

```xml
<bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource" destroy-method="close">
    <property name="driverClassName" value="com.mysql.cj.jdbc.Driver"/>
    <property name="jdbcUrl" value="jdbc:mysql://localhost:3306/testdb"/>
    <property name="username" value="root"/>
    <property name="password" value="password"/>
    <property name="maximumPoolSize" value="10"/>
</bean>
```

#### Java 配置方式

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.hikari")
    public DataSource dataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }
}
```

#### 属性文件配置

```properties
# application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/testdb
spring.datasource.username=root
spring.datasource.password=password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
```

### 3.2 多数据源配置

```java
@Configuration
public class MultipleDataSourceConfig {

    @Primary
    @Bean(name = "primaryDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "secondaryDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.secondary")
    public DataSource secondaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "primaryJdbcTemplate")
    public JdbcTemplate primaryJdbcTemplate(
            @Qualifier("primaryDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean(name = "secondaryJdbcTemplate")
    public JdbcTemplate secondaryJdbcTemplate(
            @Qualifier("secondaryDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

## 4. 基本 CRUD 操作

### 4.1 查询操作

#### 简单查询

```java
@Repository
public class UserDao {

    private final JdbcTemplate jdbcTemplate;

    public UserDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 查询单个对象
    public User findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, new UserRowMapper(), id);
    }

    // 查询列表
    public List<User> findAll() {
        String sql = "SELECT * FROM users";
        return jdbcTemplate.query(sql, new UserRowMapper());
    }

    // 查询单个值
    public Long count() {
        String sql = "SELECT COUNT(*) FROM users";
        return jdbcTemplate.queryForObject(sql, Long.class);
    }

    // 条件查询
    public List<User> findByEmailDomain(String domain) {
        String sql = "SELECT * FROM users WHERE email LIKE ?";
        return jdbcTemplate.query(sql, new UserRowMapper(), "%" + domain);
    }
}
```

#### 分页查询

```java
public Page<User> findUsersByPage(int page, int size) {
    String countSql = "SELECT COUNT(*) FROM users";
    Long total = jdbcTemplate.queryForObject(countSql, Long.class);

    String dataSql = "SELECT * FROM users ORDER BY id LIMIT ? OFFSET ?";
    int offset = (page - 1) * size;
    List<User> users = jdbcTemplate.query(dataSql, new UserRowMapper(), size, offset);

    return new Page<>(users, total, page, size);
}

// 分页结果类
public class Page<T> {
    private List<T> content;
    private Long total;
    private int page;
    private int size;

    // 构造方法、getter、setter
}
```

### 4.2 插入操作

```java
public class UserDao {

    // 插入并返回主键
    public Long insert(User user) {
        String sql = "INSERT INTO users (name, email, created_at) VALUES (?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.setTimestamp(3, Timestamp.valueOf(user.getCreatedAt()));
            return ps;
        }, keyHolder);

        return keyHolder.getKey().longValue();
    }

    // 批量插入
    public int[] batchInsert(List<User> users) {
        String sql = "INSERT INTO users (name, email, created_at) VALUES (?, ?, ?)";

        return jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                User user = users.get(i);
                ps.setString(1, user.getName());
                ps.setString(2, user.getEmail());
                ps.setTimestamp(3, Timestamp.valueOf(user.getCreatedAt()));
            }

            @Override
            public int getBatchSize() {
                return users.size();
            }
        });
    }
}
```

### 4.3 更新与删除操作

```java
public class UserDao {

    // 更新操作
    public int update(User user) {
        String sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
        return jdbcTemplate.update(sql, user.getName(), user.getEmail(), user.getId());
    }

    // 删除操作
    public int delete(Long id) {
        String sql = "DELETE FROM users WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }

    // 批量更新
    public int[] batchUpdate(List<User> users) {
        String sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";

        return jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                User user = users.get(i);
                ps.setString(1, user.getName());
                ps.setString(2, user.getEmail());
                ps.setLong(3, user.getId());
            }

            @Override
            public int getBatchSize() {
                return users.size();
            }
        });
    }
}
```

## 5. 事务管理

### 5.1 声明式事务

```java
@Service
@Transactional
public class UserService {

    private final UserDao userDao;
    private final AuditDao auditDao;

    public UserService(UserDao userDao, AuditDao auditDao) {
        this.userDao = userDao;
        this.auditDao = auditDao;
    }

    @Transactional(rollbackFor = Exception.class)
    public User createUser(User user) {
        // 插入用户
        Long userId = userDao.insert(user);
        user.setId(userId);

        // 记录审计日志
        auditDao.logAction("CREATE_USER", "Created user: " + user.getName());

        return user;
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userDao.findById(id);
    }
}
```

### 5.2 编程式事务

```java
@Service
public class UserService {

    private final PlatformTransactionManager transactionManager;
    private final UserDao userDao;

    public UserService(PlatformTransactionManager transactionManager, UserDao userDao) {
        this.transactionManager = transactionManager;
        this.userDao = userDao;
    }

    public User createUserWithProgrammaticTx(User user) {
        DefaultTransactionDefinition definition = new DefaultTransactionDefinition();
        definition.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        definition.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);

        TransactionStatus status = transactionManager.getTransaction(definition);

        try {
            // 业务逻辑
            Long userId = userDao.insert(user);
            user.setId(userId);

            transactionManager.commit(status);
            return user;

        } catch (Exception e) {
            transactionManager.rollback(status);
            throw e;
        }
    }
}
```

## 6. 异常处理

Spring JDBC 将检查型 SQLException 转换为非检查型 DataAccessException 层次结构。

```java
@Service
public class UserService {

    private final UserDao userDao;

    public UserService(UserDao userDao) {
        this.userDao = userDao;
    }

    public User getUserSafely(Long id) {
        try {
            return userDao.findById(id);
        } catch (EmptyResultDataAccessException e) {
            // 处理查询结果为空的情况
            return null;
        } catch (DataAccessException e) {
            // 处理其他数据访问异常
            log.error("Data access error occurred", e);
            throw new BusinessException("用户查询失败", e);
        }
    }

    public void updateUserSafely(User user) {
        try {
            userDao.update(user);
        } catch (DuplicateKeyException e) {
            // 处理唯一约束冲突
            throw new BusinessException("用户邮箱已存在", e);
        } catch (DataAccessException e) {
            log.error("Data access error occurred", e);
            throw new BusinessException("用户更新失败", e);
        }
    }
}
```

## 7. 高级特性

### 7.1 存储过程调用

```java
@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public User getUserByProcedure(Long id) {
        SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
            .withProcedureName("get_user_by_id")
            .returningResultSet("user", new UserRowMapper());

        Map<String, Object> params = Collections.singletonMap("user_id", id);
        Map<String, Object> result = jdbcCall.execute(params);

        @SuppressWarnings("unchecked")
        List<User> users = (List<User>) result.get("user");
        return users.isEmpty() ? null : users.get(0);
    }
}
```

### 7.2 自定义类型转换

```java
public class LocalDateTimeConverter implements Converter<String, LocalDateTime> {

    @Override
    public LocalDateTime convert(String source) {
        return LocalDateTime.parse(source, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}

// 配置自定义转换器
@Configuration
public class JdbcConfig {

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        // 配置类型转换
        jdbcTemplate.setTypeHandler(new LocalDateTimeTypeHandler());

        return jdbcTemplate;
    }
}

// 自定义类型处理器
public class LocalDateTimeTypeHandler implements TypeHandler<LocalDateTime> {

    @Override
    public void setParameter(PreparedStatement ps, int i, LocalDateTime parameter, JdbcType jdbcType)
            throws SQLException {
        ps.setTimestamp(i, Timestamp.valueOf(parameter));
    }

    @Override
    public LocalDateTime getResult(ResultSet rs, String columnName) throws SQLException {
        Timestamp timestamp = rs.getTimestamp(columnName);
        return timestamp != null ? timestamp.toLocalDateTime() : null;
    }

    // 其他重载方法...
}
```

## 8. 最佳实践

### 8.1 性能优化

```java
@Configuration
public class JdbcOptimizationConfig {

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        // 配置查询超时
        jdbcTemplate.setQueryTimeout(30);

        // 禁用自动提交批处理
        jdbcTemplate.setSkipResultsProcessing(true);

        // 设置获取大小
        jdbcTemplate.setFetchSize(100);

        return jdbcTemplate;
    }
}

// 批量操作优化
@Service
public class BulkOperationService {

    private final JdbcTemplate jdbcTemplate;

    public BulkOperationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void bulkInsertUsers(List<User> users) {
        // 使用 VALUES 语句进行批量插入
        String sql = "INSERT INTO users (name, email) VALUES (?, ?)";

        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                User user = users.get(i);
                ps.setString(1, user.getName());
                ps.setString(2, user.getEmail());
            }

            @Override
            public int getBatchSize() {
                return users.size();
            }
        });
    }
}
```

### 8.2 安全实践

```java
@Repository
public class SecureUserRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public SecureUserRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 使用命名参数防止 SQL 注入
    public User findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = :email";
        Map<String, Object> params = Collections.singletonMap("email", email);

        try {
            return jdbcTemplate.queryForObject(sql, params, new UserRowMapper());
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // 动态查询构建
    public List<User> findUsers(UserQuery query) {
        Map<String, Object> params = new HashMap<>();
        StringBuilder sql = new StringBuilder("SELECT * FROM users WHERE 1=1");

        if (query.getName() != null) {
            sql.append(" AND name LIKE :name");
            params.put("name", "%" + query.getName() + "%");
        }

        if (query.getEmail() != null) {
            sql.append(" AND email = :email");
            params.put("email", query.getEmail());
        }

        if (query.getStartDate() != null) {
            sql.append(" AND created_at >= :startDate");
            params.put("startDate", query.getStartDate());
        }

        if (query.getEndDate() != null) {
            sql.append(" AND created_at <= :endDate");
            params.put("endDate", query.getEndDate());
        }

        return jdbcTemplate.query(sql.toString(), params, new UserRowMapper());
    }
}
```

### 8.3 监控与日志

```java
@Configuration
public class JdbcMonitoringConfig {

    @Bean
    public DataSource dataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        // ... 数据源配置

        // 启用监控
        dataSource.setMetricRegistry(metricRegistry());
        dataSource.setHealthCheckRegistry(healthCheckRegistry());

        return dataSource;
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        // 添加拦截器进行 SQL 监控
        jdbcTemplate.setStatementInterceptor(new StatementInterceptor() {
            @Override
            public void beforeExecute(Statement statement, String sql) {
                long startTime = System.currentTimeMillis();
                MDC.put("sqlStartTime", String.valueOf(startTime));
                MDC.put("executingSql", sql);
            }

            @Override
            public void afterExecute(Statement statement, String sql) {
                long endTime = System.currentTimeMillis();
                long startTime = Long.parseLong(MDC.get("sqlStartTime"));
                long duration = endTime - startTime;

                if (duration > 1000) { // 记录慢查询
                    log.warn("Slow SQL detected: {} took {} ms", sql, duration);
                }

                MDC.remove("sqlStartTime");
                MDC.remove("executingSql");
            }
        });

        return jdbcTemplate;
    }
}
```

## 9. 常见问题与解决方案

### 9.1 连接池配置问题

```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 30000
      max-lifetime: 1800000
      connection-timeout: 30000
      pool-name: MyHikariPool
  jpa:
    properties:
      hibernate:
        temp:
          use_jdbc_metadata_defaults: false
```

### 9.2 事务传播行为问题

```java
@Service
@Transactional
public class ComplexBusinessService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processInNewTransaction() {
        // 这个方法会在新事务中执行
    }

    @Transactional(propagation = Propagation.NESTED)
    public void processInNestedTransaction() {
        // 这个方法会在嵌套事务中执行
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void processWithoutTransaction() {
        // 这个方法会在无事务环境中执行
    }
}
```

### 9.3 大数据量处理

```java
@Repository
public class LargeDataRepository {

    private final JdbcTemplate jdbcTemplate;

    public LargeDataRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void processLargeDataset() {
        String sql = "SELECT * FROM large_table";

        jdbcTemplate.query(sql, new ResultSetExtractor<Void>() {
            @Override
            public Void extractData(ResultSet rs) throws SQLException, DataAccessException {
                while (rs.next()) {
                    // 逐行处理大数据集，避免内存溢出
                    processRow(rs);
                }
                return null;
            }
        });
    }

    private void processRow(ResultSet rs) throws SQLException {
        // 处理单行数据
    }
}
```

## 10. 总结

Spring JDBC 提供了强大而灵活的数据访问支持，通过合理的配置和使用最佳实践，可以构建出高性能、可维护的数据访问层。关键要点包括：

1. **正确配置数据源和连接池**
2. **合理使用 JdbcTemplate 和 NamedParameterJdbcTemplate**
3. **实现高效的异常处理机制**
4. **使用适当的事务管理策略**
5. **遵循安全编程实践**
6. **实施性能监控和优化**

通过掌握这些技术要点，开发者可以充分利用 Spring JDBC 的优势，构建稳健高效的数据访问解决方案。
