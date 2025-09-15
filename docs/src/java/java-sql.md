---
title: Java SQL 编程详解与最佳实践
author: zhycn
---

# Java SQL 编程详解与最佳实践

## 1 引言

Java Database Connectivity (JDBC) 是 Java 语言中访问关系型数据库的**标准 API**，它提供了与数据库无关的连接和操作方式。JDBC API 主要包含在 `java.sql` 和 `javax.sql` 两个包中，为 Java 开发者提供了**统一的数据访问接口**。无论是 MySQL、Oracle、SQL Server 还是 PostgreSQL，都可以通过 JDBC 进行访问，实现了"编写一次，处处运行"的数据库访问能力。

### 1.1 JDBC 架构概述

JDBC 采用**分层设计**架构，主要包括以下组件：

- **JDBC API**：提供应用程序到JDBC管理器的连接
- **JDBC Driver Manager**：管理各种数据库驱动程序
- **JDBC Driver API**：连接驱动程序到特定数据库

这种设计使得应用程序与数据库驱动程序解耦，开发者无需针对特定数据库编写代码，大大提高了应用程序的可移植性。

### 1.2 JDBC 驱动类型

JDBC 驱动程序分为四种类型：

- **Type 1**：JDBC-ODBC 桥接驱动（已过时）
- **Type 2**：部分 Java 部分本地代码驱动
- **Type 3**：纯 Java 中间件驱动
- **Type 4**：纯 Java 直接连接驱动（最常用）

目前大多数应用都使用 Type 4 驱动程序，因为它不需要额外的本地库或中间件，直接通过网络协议与数据库通信。

## 2 JDBC 基础与连接配置

### 2.1 建立数据库连接

在 Java 中使用 JDBC 连接数据库需要以下几个步骤：

```java
// 1. 加载JDBC驱动
Class.forName("com.mysql.cj.jdbc.Driver");

// 2. 创建数据库连接
String url = "jdbc:mysql://localhost:3306/mydatabase?useSSL=false&serverTimezone=UTC";
String username = "root";
String password = "password";

Connection connection = DriverManager.getConnection(url, username, password);
```

**最佳实践**：

- 使用 **try-with-resources** 语句自动管理资源，避免资源泄漏
- 将数据库连接参数存储在**配置文件**中，而不是硬编码在代码里
- 使用**连接池**管理数据库连接，提高性能

### 2.2 数据库连接示例（使用 try-with-resources）

```java
// 使用try-with-resources确保资源自动关闭
try (Connection conn = DriverManager.getConnection(url, username, password);
     Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery("SELECT id, name FROM users")) {

    while (rs.next()) {
        int id = rs.getInt("id");
        String name = rs.getString("name");
        System.out.println("ID: " + id + ", Name: " + name);
    }
} catch (SQLException e) {
    e.printStackTrace();
}
```

## 3 java.sql 核心接口详解

### 3.1 DriverManager 类

`DriverManager` 是 JDBC 架构中的**基础服务类**，用于管理数据库驱动程序。它提供了建立数据库连接的核心方法。

**主要功能**：

- 注册和注销驱动程序
- 建立数据库连接
- 管理登录超时设置

**常用方法**：

```java
// 获取数据库连接
DriverManager.getConnection(String url)
DriverManager.getConnection(String url, Properties info)
DriverManager.getConnection(String url, String user, String password)

// 设置登录超时
DriverManager.setLoginTimeout(int seconds)
```

### 3.2 Connection 接口

`Connection` 接口代表与数据库的**会话连接**，是 JDBC 操作的核心接口之一。

**主要功能**：

- 创建 Statement、PreparedStatement 和 CallableStatement 对象
- 控制事务行为（提交、回滚）
- 获取数据库元数据

**常用方法**：

```java
// 创建语句对象
Statement createStatement() throws SQLException
PreparedStatement prepareStatement(String sql) throws SQLException
CallableStatement prepareCall(String sql) throws SQLException

// 事务管理
void setAutoCommit(boolean autoCommit) throws SQLException
void commit() throws SQLException
void rollback() throws SQLException
Savepoint setSavepoint() throws SQLException

// 获取元数据
DatabaseMetaData getMetaData() throws SQLException
```

**事务管理示例**：

```java
try (Connection conn = DriverManager.getConnection(url, username, password)) {
    // 关闭自动提交
    conn.setAutoCommit(false);

    // 执行多个SQL操作
    updateAccountBalance(conn, "account1", -100.0);
    updateAccountBalance(conn, "account2", 100.0);

    // 提交事务
    conn.commit();
} catch (SQLException e) {
    // 回滚事务
    conn.rollback();
}
```

### 3.3 Statement 接口

`Statement` 接口用于执行**静态 SQL 语句**并返回结果。对于只执行一次的 SQL 语句，使用 Statement 是合适的。

**常用方法**：

```java
// 执行查询
ResultSet executeQuery(String sql) throws SQLException

// 执行更新（INSERT、UPDATE、DELETE）
int executeUpdate(String sql) throws SQLException

// 执行任意SQL语句
boolean execute(String sql) throws SQLException

// 批量处理
void addBatch(String sql) throws SQLException
int[] executeBatch() throws SQLException
```

**使用示例**：

```java
try (Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery("SELECT * FROM products")) {

    while (rs.next()) {
        // 处理结果集
        String name = rs.getString("name");
        double price = rs.getDouble("price");
        System.out.println(name + ": $" + price);
    }
}
```

**注意**：`Statement` 接口容易导致 **SQL 注入攻击**，在处理用户输入时不应直接使用，而应使用 `PreparedStatement`。

### 3.4 PreparedStatement 接口

`PreparedStatement` 是 `Statement` 的子接口，用于执行**预编译的 SQL 语句**。它是防止 SQL 注入攻击的首选方法，同时性能也更好。

**优势**：

- **防止 SQL 注入**：通过参数化查询避免 SQL 注入
- **提高性能**：预编译 SQL 语句，减少数据库解析开销
- **类型安全**：提供类型检查的方法设置参数

**使用示例**：

```java
// 使用PreparedStatement执行查询
String sql = "SELECT * FROM users WHERE age > ? AND department = ?";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setInt(1, 25);        // 设置第一个参数
    pstmt.setString(2, "IT");   // 设置第二个参数

    try (ResultSet rs = pstmt.executeQuery()) {
        while (rs.next()) {
            // 处理结果
        }
    }
}
```

**批处理示例**：

```java
// 使用PreparedStatement进行批处理
String insertSql = "INSERT INTO employees (name, email, department) VALUES (?, ?, ?)";
try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {

    for (Employee employee : employees) {
        pstmt.setString(1, employee.getName());
        pstmt.setString(2, employee.getEmail());
        pstmt.setString(3, employee.getDepartment());
        pstmt.addBatch();  // 添加到批处理
    }

    int[] results = pstmt.executeBatch();  // 执行批处理
    conn.commit();  // 提交事务
}
```

### 3.5 CallableStatement 接口

`CallableStatement` 是 `PreparedStatement` 的子接口，用于执行**数据库存储过程**。

**使用示例**：

```java
// 调用存储过程
try (CallableStatement cstmt = conn.prepareCall("{call get_employee_data(?, ?)}")) {
    cstmt.setInt(1, employeeId);      // 设置输入参数
    cstmt.registerOutParameter(2, Types.VARCHAR);  // 注册输出参数

    cstmt.execute();  // 执行存储过程

    String result = cstmt.getString(2);  // 获取输出参数
    System.out.println("Employee name: " + result);
}
```

### 3.6 ResultSet 接口

`ResultSet` 接口表示数据库查询结果的**数据表**，它提供了访问查询结果的方法。

**结果集类型**：

- `TYPE_FORWARD_ONLY`：只能向前滚动（默认）
- `TYPE_SCROLL_INSENSITIVE`：可滚动，但不反映数据库变化
- `TYPE_SCROLL_SENSITIVE`：可滚动，并反映数据库变化

**结果集并发模式**：

- `CONCUR_READ_ONLY`：只读结果集
- `CONCUR_UPDATABLE`：可更新结果集

**使用示例**：

```java
// 创建可滚动、只读的ResultSet
try (Statement stmt = conn.createStatement(
        ResultSet.TYPE_SCROLL_INSENSITIVE,
        ResultSet.CONCUR_READ_ONLY);
     ResultSet rs = stmt.executeQuery("SELECT * FROM products")) {

    // 移动到最后一行
    rs.last();
    int rowCount = rs.getRow();
    System.out.println("Total rows: " + rowCount);

    // 回到第一行
    rs.beforeFirst();

    while (rs.next()) {
        // 获取数据
        int id = rs.getInt("id");
        String name = rs.getString("name");
        BigDecimal price = rs.getBigDecimal("price");

        // 使用列索引获取数据（从1开始）
        String desc = rs.getString(4);  // 第四列

        System.out.println("Product: " + name + ", Price: " + price);
    }
}
```

**可更新 ResultSet 示例**：

```java
// 创建可更新的ResultSet
try (Statement stmt = conn.createStatement(
        ResultSet.TYPE_SCROLL_SENSITIVE,
        ResultSet.CONCUR_UPDATABLE);
     ResultSet rs = stmt.executeQuery("SELECT * FROM employees WHERE department = 'IT'")) {

    while (rs.next()) {
        // 更新数据
        if (rs.getDouble("salary") < 5000) {
            rs.updateDouble("salary", rs.getDouble("salary") * 1.1);  // 涨薪10%
            rs.updateRow();  // 提交更新到数据库
        }
    }
}
```

### 3.7 DatabaseMetaData 接口

`DatabaseMetaData` 接口提供了获取数据库**元数据**的方法，包括数据库信息、表信息、列信息等。

**使用示例**：

```java
// 获取数据库元数据
try (Connection conn = DriverManager.getConnection(url, username, password)) {
    DatabaseMetaData metaData = conn.getMetaData();

    // 获取数据库信息
    System.out.println("Database: " + metaData.getDatabaseProductName());
    System.out.println("Version: " + metaData.getDatabaseProductVersion());
    System.out.println("Driver: " + metaData.getDriverName());

    // 获取表信息
    try (Result tables = metaData.getTables(null, null, "%", new String[]{"TABLE"})) {
        while (tables.next()) {
            String tableName = tables.getString("TABLE_NAME");
            String tableType = tables.getString("TABLE_TYPE");
            System.out.println("Table: " + tableName + ", Type: " + tableType);
        }
    }

    // 获取列信息
    try (ResultSet columns = metaData.getColumns(null, null, "employees", null)) {
        while (columns.next()) {
            String columnName = columns.getString("COLUMN_NAME");
            String dataType = columns.getString("TYPE_NAME");
            int columnSize = columns.getInt("COLUMN_SIZE");
            System.out.println("Column: " + columnName + ", Type: " + dataType + ", Size: " + columnSize);
        }
    }
}
```

### 3.8 ResultSetMetaData 接口

`ResultSetMetaData` 接口提供了获取 `ResultSet` 对象中**列的类型和属性信息**的方法。

**使用示例**：

```java
try (Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery("SELECT * FROM employees")) {

    ResultSetMetaData metaData = rs.getMetaData();
    int columnCount = metaData.getColumnCount();

    System.out.println("Column count: " + columnCount);

    for (int i = 1; i <= columnCount; i++) {
        String columnName = metaData.getColumnName(i);
        String columnType = metaData.getColumnTypeName(i);
        int columnSize = metaData.getColumnDisplaySize(i);
        boolean isNullable = metaData.isNullable(i) == ResultSetMetaData.columnNullable;

        System.out.println("Column " + i + ": " + columnName +
                          ", Type: " + columnType +
                          ", Size: " + columnSize +
                          ", Nullable: " + isNullable);
    }
}
```

## 4 事务管理与连接池

### 4.1 事务管理

事务是数据库操作的**基本单位**，具有 ACID 特性（原子性、一致性、隔离性、持久性）。

**JDBC 事务管理方法**：

```java
try (Connection conn = DriverManager.getConnection(url, username, password)) {
    // 关闭自动提交
    conn.setAutoCommit(false);

    // 设置事务隔离级别
    conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);

    try {
        // 执行多个SQL操作
        updateInventory(conn, productId, -quantity);
        createOrder(conn, userId, productId, quantity);

        // 提交事务
        conn.commit();
    } catch (SQLException e) {
        // 回滚事务
        conn.rollback();
        throw e;
    }
}
```

**事务隔离级别**：

- `TRANSACTION_NONE`：不支持事务
- `TRANSACTION_READ_UNCOMMITTED`：读未提交
- `TRANSACTION_READ_COMMITTED`：读已提交（推荐）
- `TRANSACTION_REPEATABLE_READ`：可重复读
- `TRANSACTION_SERIALIZABLE`：串行化

### 4.2 数据库连接池

使用连接池可以**显著提高性能**，避免频繁创建和关闭连接的开销。

**HikariCP 连接池示例**：

```java
// 配置HikariCP连接池
HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:mysql://localhost:3306/mydatabase");
config.setUsername("root");
config.setPassword("password");
config.setMaximumPoolSize(10);
config.setMinimumIdle(2);
config.setConnectionTimeout(30000);
config.setIdleTimeout(600000);
config.setMaxLifetime(1800000);

// 添加数据源属性
config.addDataSourceProperty("cachePrepStmts", "true");
config.addDataSourceProperty("prepStmtCacheSize", "250");
config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

try (HikariDataSource dataSource = new HikariDataSource(config);
     Connection conn = dataSource.getConnection();
     PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users")) {

    try (ResultSet rs = pstmt.executeQuery()) {
        while (rs.next()) {
            // 处理结果
        }
    }
}
```

**连接池最佳实践**：

- 设置合适的**连接池大小**（不是越大越好）
- 使用**预处理语句池**提高性能
- 监控连接池的使用情况，及时调整配置
- 正确关闭连接（归还到连接池）

## 5 SQL 注入与安全实践

### 5.1 SQL 注入原理

SQL 注入是一种**常见的安全漏洞**，攻击者通过在输入中注入 SQL 代码，篡改原有 SQL 语句的逻辑。

**易受攻击的示例**：

```java
// 不要这样写代码！
String sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(sql);
```

如果用户输入 `username' OR '1'='1' --` 作为用户名，将绕过身份验证。

### 5.2 防范 SQL 注入

**使用 PreparedStatement** 是防范 SQL 注入的**最主要方法**。

**安全示例**：

```java
// 使用PreparedStatement防止SQL注入
String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setString(1, username);
    pstmt.setString(2, password);

    try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) {
            // 登录成功
        } else {
            // 登录失败
        }
    }
}
```

**其他安全措施**：

- **输入验证**：对所有用户输入进行严格验证
- **最小权限原则**：数据库用户只授予必要权限
- **避免动态 SQL**：尽量不要拼接 SQL 语句
- **使用 ORM 框架**：如 Hibernate、MyBatis 等

## 6 实践案例与性能优化

### 6.1 完整 JDBC 操作示例

下面是一个完整的 JDBC 操作示例，展示了最佳实践：

```java
public class UserRepository {
    private final DataSource dataSource;

    public UserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public User getUserById(int userId) throws SQLException {
        String sql = "SELECT id, username, email, created_at FROM users WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, userId);

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    User user = new User();
                    user.setId(rs.getInt("id"));
                    user.setUsername(rs.getString("username"));
                    user.setEmail(rs.getString("email"));
                    user.setCreatedAt(rs.getTimestamp("created_at"));
                    return user;
                } else {
                    return null;
                }
            }
        }
    }

    public void addUser(User user) throws SQLException {
        String sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            pstmt.setString(1, user.getUsername());
            pstmt.setString(2, user.getEmail());
            pstmt.setString(3, hashPassword(user.getPassword()));

            int affectedRows = pstmt.executeUpdate();

            if (affectedRows == 0) {
                throw new SQLException("创建用户失败，没有行受影响");
            }

            // 获取自增主键
            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    user.setId(generatedKeys.getInt(1));
                } else {
                    throw new SQLException("创建用户失败，未获取到ID");
                }
            }
        }
    }

    public List<User> getUsersByDepartment(String department, int limit, int offset) throws SQLException {
        String sql = "SELECT id, username, email, created_at FROM users WHERE department = ? ORDER BY id LIMIT ? OFFSET ?";
        List<User> users = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, department);
            pstmt.setInt(2, limit);
            pstmt.setInt(3, offset);

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    User user = new User();
                    user.setId(rs.getInt("id"));
                    user.setUsername(rs.getString("username"));
                    user.setEmail(rs.getString("email"));
                    user.setCreatedAt(rs.getTimestamp("created_at"));
                    users.add(user);
                }
            }
        }

        return users;
    }
}
```

### 6.2 使用连接池的完整示例

```java
public class DatabaseUtil {
    private static HikariDataSource dataSource;

    static {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/mydatabase");
        config.setUsername("root");
        config.setPassword("password");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        config.addDataSourceProperty("useServerPrepStmts", "true");

        dataSource = new HikariDataSource(config);
    }

    public static Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    public static void closeDataSource() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }
}
```

### 6.3 性能优化建议

1. **使用连接池**：避免频繁创建和关闭连接
2. **使用 PreparedStatement**：利用预编译和缓存提高性能
3. **批量操作**：对大量操作使用批处理
4. **分页查询**：避免一次性返回大量数据
5. **只获取需要的数据**：避免使用 SELECT \*
6. **使用索引**：确保查询条件字段有适当索引
7. **合理使用事务**：保持事务简短，避免长时间持有连接

**批量操作示例**：

```java
public void batchInsertUsers(List<User> users) throws SQLException {
    String sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

    try (Connection conn = DatabaseUtil.getConnection();
         PreparedStatement pstmt = conn.prepareStatement(sql)) {

        conn.setAutoCommit(false);  // 手动提交事务

        for (User user : users) {
            pstmt.setString(1, user.getUsername());
            pstmt.setString(2, user.getEmail());
            pstmt.setString(3, hashPassword(user.getPassword()));
            pstmt.addBatch();
        }

        pstmt.executeBatch();  // 执行批处理
        conn.commit();         // 提交事务
    }
}
```

## 7 总结

本文详细介绍了 Java SQL 编程的核心接口和最佳实践。通过学习和应用这些知识，你可以编写出**高效、安全、可维护**的数据库应用程序。

**关键要点**：

1. 始终使用 **PreparedStatement** 而不是 Statement，防止 SQL 注入
2. 使用**连接池**管理数据库连接，提高性能
3. 合理使用**事务**，确保数据一致性
4. 遵循**资源管理**最佳实践，使用 try-with-resources 语句
5. 对大量操作使用**批处理**提高性能
6. 使用**合适的索引**优化查询性能

JDBC 是 Java 数据库编程的基础，虽然现在有许多 ORM 框架（如 Hibernate、MyBatis），但理解 JDBC 底层原理仍然非常重要。掌握这些知识将帮助你更好地使用高级框架，并在需要时能够进行底层优化。
