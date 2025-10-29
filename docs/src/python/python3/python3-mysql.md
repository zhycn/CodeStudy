好的，请看为您生成的这篇关于 Python3 MySQL 数据库编程的详尽技术文档。

---

# Python3 MySQL 数据库编程详解与最佳实践

本文档将深入探讨如何使用 Python3 与 MySQL 数据库进行交互，涵盖从基础连接到高级操作、性能优化以及安全实践的全方位知识。

## 目录

1. #核心库选择与安装
2. #连接数据库
3. #执行-sql-查询
4. #事务管理
5. #连接池技术
6. #使用-orm-sqlalchemy
7. #异步操作-aiomysql
8. #最佳实践与安全建议

## 核心库选择与安装

在 Python 中，有多个库可用于连接 MySQL，以下是两个最主流的选择：

1. **mysql-connector-python**： MySQL 官方提供的纯 Python 驱动程序。无需安装其他依赖（如 MySQL 客户端库），兼容性好。
2. **PyMySQL**： 一个纯 Python 实现的 MySQL 客户端，语法与旧版的 `MySQLdb` 基本兼容，非常受欢迎。

**选择建议**： 对于新项目，`mysql-connector-python` 和 `PyMySQL` 都是极好的选择。若需兼容 `MySQLdb` 代码，可选 `PyMySQL`。

### 安装

您可以通过 pip 安装任一库：

```bash
# 安装 mysql-connector-python
pip install mysql-connector-python

# 安装 PyMySQL
pip install PyMySQL
```

## 连接数据库

建立数据库连接是第一步。强烈建议使用上下文管理器 (`with` 语句) 来确保连接被正确关闭。

### 使用 mysql-connector-python

```python
import mysql.connector
from mysql.connector import Error

def create_connection():
    connection = None
    try:
        connection = mysql.connector.connect(
            host='localhost',        # 数据库主机地址
            user='your_username',    # 数据库用户名
            password='your_password',# 数据库密码
            database='your_database' # 要连接的数据库名
            # charset='utf8mb4',     # 推荐字符集，支持完整的 Unicode（包括表情符号）
            # autocommit=True        # 是否自动提交事务
        )
        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"成功连接到 MySQL Server 版本: {db_info}")
    except Error as e:
        print(f"连接错误: {e}")
        return None
    return connection

# 使用连接
with create_connection() as conn:
    if conn:
        # 执行你的数据库操作
        pass
```

### 使用 PyMySQL

```python
import pymysql
from pymysql import Error

def create_connection_pymysql():
    connection = None
    try:
        connection = pymysql.connect(
            host='localhost',
            user='your_username',
            password='your_password',
            database='your_database',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor # 让返回的结果为字典类型，默认为元组
        )
        print("连接成功!")
    except Error as e:
        print(f"连接错误: {e}")
    return connection
```

## 执行 SQL 查询

执行查询主要涉及 `cursor` 对象。它用于执行语句并获取结果。

### 创建表 (CREATE TABLE)

```python
def create_table(connection):
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(50),
        salary DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(create_table_sql)
        print("表创建成功或已存在。")
    except Error as e:
        print(f"创建表错误: {e}")
```

### 插入数据 (INSERT) - **重要：使用参数化查询**

**绝对不要**使用字符串拼接来构造 SQL 查询，这将导致严重的 SQL 注入漏洞。

```python
def insert_employee(connection, employee_data):
    """插入一条员工记录。使用参数化查询防止 SQL 注入。"""
    insert_sql = """
    INSERT INTO employees (name, department, salary)
    VALUES (%s, %s, %s);
    """
    try:
        with connection.cursor() as cursor:
            # 使用 execute() 的第二个参数传递元组形式的参数
            cursor.execute(insert_sql, employee_data)
            # 记住：默认情况下，需要显式提交事务才能使更改生效
            connection.commit()
            print(f"记录插入成功，ID: {cursor.lastrowid}")
    except Error as e:
        print(f"插入数据错误: {e}")
        connection.rollback() # 发生错误时回滚

# 用法示例
conn = create_connection()
if conn:
    data = ('张三', '技术部', 8000.00)
    insert_employee(conn, data)
    conn.close()
```

### 批量插入 (Executemany)

对于大量数据插入，使用 `executemany()` 可以显著提高效率。

```python
def insert_many_employees(connection, employees_list):
    insert_sql = """
    INSERT INTO employees (name, department, salary)
    VALUES (%s, %s, %s);
    """
    try:
        with connection.cursor() as cursor:
            cursor.executemany(insert_sql, employees_list)
            connection.commit()
            print(f"批量插入成功，影响行数: {cursor.rowcount}")
    except Error as e:
        print(f"批量插入错误: {e}")
        connection.rollback()

# 用法示例
employees_to_insert = [
    ('李四', '市场部', 7500.00),
    ('王五', '人事部', 6500.00),
    ('赵六', '技术部', 9000.00)
]
insert_many_employees(conn, employees_to_insert)
```

### 查询数据 (SELECT) 与结果获取

```python
def query_employees(connection, department=None):
    """查询员工信息，可按部门筛选。"""
    query_sql = "SELECT id, name, department, salary FROM employees"
    params = ()

    if department:
        query_sql += " WHERE department = %s"
        params = (department,)

    try:
        with connection.cursor() as cursor:
            cursor.execute(query_sql, params)
            # 获取所有记录
            records = cursor.fetchall()
            print(f"查询到 {len(records)} 条记录:")
            for row in records:
                print(f"ID: {row[0]}, 姓名: {row[1]}, 部门: {row[2]}, 薪资: {row[3]}")
            # 如果 cursorclass=pymysql.cursors.DictCursor，则可以这样访问：
            # print(f"ID: {row['id']}, 姓名: {row['name']}...")
    except Error as e:
        print(f"查询错误: {e}")

# 获取单条记录
def get_employee_by_id(connection, emp_id):
    query_sql = "SELECT * FROM employees WHERE id = %s"
    try:
        with connection.cursor() as cursor:
            cursor.execute(query_sql, (emp_id,))
            record = cursor.fetchone() # 获取一条记录
            if record:
                print(record)
            else:
                print("未找到该员工。")
    except Error as e:
        print(f"查询错误: {e}")
```

## 事务管理

事务是确保数据一致性的关键机制。它允许你将一系列操作作为一个原子单元执行：要么全部成功，要么全部失败。

```python
def transfer_salary(connection, from_emp_id, to_emp_id, amount):
    """一个简单的事务示例：薪资转账。"""
    select_sql = "SELECT salary FROM employees WHERE id = %s FOR UPDATE"
    update_sql = "UPDATE employees SET salary = salary + %s WHERE id = %s"

    try:
        connection.start_transaction() # 显式开始一个事务
        with connection.cursor() as cursor:
            # 检查转出账户余额是否充足 (FOR UPDATE 锁定该行)
            cursor.execute(select_sql, (from_emp_id,))
            current_salary = cursor.fetchone()[0]
            if current_salary < amount:
                raise ValueError("转出账户余额不足！")

            # 执行转账：扣除
            cursor.execute(update_sql, (-amount, from_emp_id))
            # 执行转账：增加
            cursor.execute(update_sql, (amount, to_emp_id))

        # 如果所有操作都成功，提交事务
        connection.commit()
        print("转账成功！")

    except ValueError as ve:
        print(ve)
        connection.rollback() # 业务逻辑错误，回滚
    except Error as e:
        print(f"数据库错误: {e}")
        connection.rollback() # 数据库错误，回滚
    except Exception as ex:
        print(f"未知错误: {ex}")
        connection.rollback() # 任何其他错误，回滚
```

## 连接池技术

在高并发应用中，为每个请求创建和销毁数据库连接开销巨大。连接池通过预先建立并维护一组连接，解决了这个问题。

`mysql-connector-python` 自带连接池：

```python
from mysql.connector import pooling

# 1. 在应用启动时创建连接池
connection_pool = pooling.MySQLConnectionPool(
    pool_name="my_pool",
    pool_size=5,                 # 池中保留的连接数
    pool_reset_session=True,
    host='localhost',
    user='your_username',
    password='your_password',
    database='your_database'
)

# 2. 在需要数据库操作的地方从池中获取连接
def get_employee_from_pool(emp_id):
    try:
        # 从连接池获取一个连接
        connection = connection_pool.get_connection()

        if connection.is_connected():
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM employees WHERE id = %s", (emp_id,))
                result = cursor.fetchone()
                print(result)
    except Error as e:
        print(f"错误: {e}")
    finally:
        # 非常重要：将连接返还给池子，而不是关闭它
        if connection and connection.is_connected():
            connection.close() # 这个方法实际上是将连接返回到池中

# 用法
get_employee_from_pool(1)
```

对于 `PyMySQL`，可以使用第三方库如 `DBUtils` 来实现连接池。

## 使用 ORM (SQLAlchemy)

ORM (Object-Relational Mapping) 允许你使用 Python 类和对象来操作数据库，无需编写大量 SQL。

**SQLAlchemy** 是 Python 生态中最强大的 ORM 框架。

### 安装与基础使用

```bash
pip install sqlalchemy pymysql
```

```python
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# 1. 定义基类
Base = declarative_base()

# 2. 定义映射的类
class Employee(Base):
    __tablename__ = 'employees'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    department = Column(String(50))
    salary = Column(Float)
    created_at = Column(DateTime, default=datetime.now)

    def __repr__(self):
        return f"<Employee(name='{self.name}', department='{self.department}', salary={self.salary})>"

# 3. 创建引擎和会话工厂
# 连接字符串格式: dialect+driver://username:password@host:port/database
engine = create_engine('mysql+pymysql://your_username:your_password@localhost/your_database?charset=utf8mb4')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. 创建表（如果不存在）
Base.metadata.create_all(bind=engine)

# 5. 使用会话进行 CRUD 操作
def orm_example():
    # 创建一个新会话
    session = SessionLocal()

    try:
        # Create - 插入新记录
        new_emp = Employee(name='钱七', department='设计部', salary=8500.00)
        session.add(new_emp)

        # Read - 查询记录
        emps = session.query(Employee).filter(Employee.department == '设计部').all()
        print("设计部员工:", emps)

        # Update - 更新记录
        emp_to_update = session.query(Employee).filter_by(name='钱七').first()
        if emp_to_update:
            emp_to_update.salary = 8800.00

        # Delete - 删除记录 (谨慎操作！)
        # emp_to_delete = session.query(Employee).filter_by(name='某员工').first()
        # if emp_to_delete:
        #     session.delete(emp_to_delete)

        # 提交事务
        session.commit()
        print("操作成功！")

    except Exception as e:
        session.rollback()
        print(f"发生错误: {e}")
    finally:
        session.close()

# 执行示例
orm_example()
```

## 异步操作 (aiomysql)

对于异步 Web 框架（如 FastAPI, Tornado），需要使用异步数据库驱动来提高性能。

**aiomysql** 是一个基于 PyMySQL 的异步库。

```bash
pip install aiomysql
```

```python
# 示例：在异步函数中使用 aiomysql
import asyncio
import aiomysql

async def async_query_example():
    # 创建异步连接池
    pool = await aiomysql.create_pool(
        host='localhost',
        user='your_username',
        password='your_password',
        db='your_database',
        charset='utf8mb4',
        autocommit=True
    )

    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM employees WHERE salary > %s", (7000,))
            result = await cur.fetchall()
            print(f"异步查询结果: {result}")

    pool.close()
    await pool.wait_closed()

# 运行异步函数
# asyncio.run(async_query_example())
```

## 最佳实践与安全建议

1. **永远使用参数化查询**：这是防止 SQL 注入攻击最重要、最有效的手段。不要用字符串格式化 (`%` 或 `f-string`) 拼接 SQL 和用户输入。
2. **管理连接资源**：
   - 始终使用 `with` 语句或 `try-finally` 块来确保 cursor 和 connection 被正确关闭。
   - 在 Web 应用等长生命周期服务中，使用**连接池**。
3. **明确处理事务**：
   - 根据业务逻辑，显式地控制 `commit` 和 `rollback`。
   - `autocommit` 模式虽然方便，但在复杂的多步骤操作中可能引发数据不一致。
4. **设置正确的字符集**：使用 `utf8mb4` 而不是 `utf8`，以支持完整的 Unicode（包括表情符号 Emoji）。
5. **善用上下文管理器**：

   ```python
   # 好例子
   with connection.cursor() as cursor:
       cursor.execute(...)
   # cursor 会自动关闭
   ```

6. **ORM 的选择**：对于复杂项目，ORM 可以提高开发效率和代码可维护性。但对于极度追求性能的简单查询，手写 SQL 可能更优。
7. **环境变量管理敏感信息**：不要将数据库密码等硬编码在代码中。使用环境变量或配置文件。

   ```python
   import os
   password = os.getenv('DB_PASSWORD')
   ```

8. **日志记录**：记录查询错误和慢查询，便于调试和优化。

通过遵循本指南，您将能够以高效、安全且可维护的方式在 Python3 项目中与 MySQL 数据库进行交互。

---

**请注意**：本文档中的代码示例需要您根据实际的数据库地址、用户名、密码和数据库名称进行修改后才能正确运行。
