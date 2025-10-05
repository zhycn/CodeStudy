# SQL 完整技术大纲（从入门到专家）

## 第一部分：SQL 基础与核心概念

### [SQL 介绍与数据库基础详解与最佳实践](sql-intro.md)

- SQL 发展历史与标准
- 常见关系型数据库管理系统比较（MySQL、PostgreSQL、SQL Server、Oracle 等）
- 数据库基本概念：表、列、行、键、关系
- SQL 语言分类：DDL、DML、DQL、DCL、TCL

### [SQL 通用数据类型详解与最佳实践](sql-data-type.md)

- 数值类型（INT、DECIMAL、FLOAT等）
- 字符串类型（CHAR、VARCHAR、TEXT等）
- 日期时间类型（DATE、TIME、DATETIME、TIMESTAMP）
- 二进制类型与 JSON 等扩展类型
- 数据类型选择的最佳实践

### [SQL 数据定义语言（DDL）详解与最佳实践](sql-ddl.md)

- 数据库创建与管理
- 表的创建、修改与删除
- 约束的完整详解（主键、外键、唯一约束、检查约束等）
- 模式设计与规范化理论

## 第二部分：数据操作与基本查询

### [SQL 数据操作语言（DML）详解与最佳实践](sql-dml.md)

- INSERT 语句的完整语法与性能考量
- UPDATE 语句的精确操作与陷阱避免
- DELETE 语句的安全使用与逻辑删除模式
- MERGE/UPSERT 操作的高级应用

### [SQL Select 语句详解与最佳实践](sql-select.md)

- 列选择、别名与表达式
- DISTINCT 关键字的使用与性能影响
- 查询结果集的基本处理（排序、分页、限制返回行数等）

### [SQL 查询条件（WHERE）详解与最佳实践](sql-where.md)

- WHERE 子句的完整运算符体系
- 布尔逻辑与条件组合（AND、OR、NOT）
- 模糊查询与正则表达式
- NULL 值的特殊处理与三值逻辑

### [SQL 排序与分页详解与最佳实践](sql-order-by.md)

- ORDER BY 子句的单列与多列排序
- 分页查询的多种实现方式与性能对比
- 大数据量分页的优化技巧

## 第三部分：高级查询技术

### [SQL 分组与聚合函数详解与最佳实践](sql-group-by.md)

- 聚合函数完整指南（COUNT、SUM、AVG、MAX、MIN等）
- GROUP BY 子句的单字段与多字段分组
- HAVING 子句与 WHERE 子句的区别与适用场景
- 高级分组技术：GROUPING SETS、CUBE、ROLLUP

### [SQL Join 联表查询详解与最佳实践](sql-join.md)

- 连接原理与算法基础
- 内连接、外连接的深度解析
- 交叉连接与自然连接的使用场景
- 多表连接的性能优化与连接顺序策略

### [SQL 子查询详解与最佳实践](sql-subquery.md)

- 标量子查询、行子查询、表子查询
- 相关子查询与非相关子查询的性能差异
- EXISTS 和 NOT EXISTS 的高效使用
- 子查询优化与重构为连接的最佳实践

### [SQL 窗口函数详解与最佳实践](sql-window-function.md)

- 窗口函数与聚合函数的本质区别
- 排序函数：ROW_NUMBER、RANK、DENSE_RANK
- 分布函数：NTILE、PERCENT_RANK
- 偏移函数：LAG、LEAD 在时间序列分析中的应用
- 窗口帧定义：ROWS 与 RANGE 的差异

### [SQL 公共表表达式与递归查询详解与最佳实践](sql-cte-recursive.md)

- CTE 的语法与可读性优势
- 递归 CTE 处理层次结构数据（组织架构、树状结构）
- 递归查询的终止条件与性能考量
- CTE 在复杂查询分解中的应用

## 第四部分：数据库编程与高级特性

### [SQL 视图详解与最佳实践](sql-view.md)

- 视图的创建、修改与管理
- 视图的更新性与 WITH CHECK OPTION
- 物化视图与普通视图的性能差异
- 视图在权限控制中的应用

### [SQL 索引详解与最佳实践](sql-index.md)

- B 树、哈希、全文索引的原理与适用场景
- 复合索引的最左前缀原则
- 覆盖索引与索引条件下推优化
- 索引失效的常见场景与诊断方法

### [SQL 存储过程详解与最佳实践](sql-procedure.md)

- 存储过程的创建与参数传递
- 流程控制语句（IF、CASE、循环）
- 错误处理与异常捕获机制
- 存储过程的性能优势与适用场景

### [SQL 函数详解与最佳实践](sql-function.md)

- 内置函数的系统学习（字符串、数学、日期函数）
- 用户定义函数的创建与使用
- 标量函数、表值函数的区别
- 函数在数据转换中的应用

### [SQL 触发器与事件调度详解与最佳实践](sql-trigger-event.md)

- DML 触发器的 BEFORE/AFTER 策略
- INSTEAD OF 触发器的特殊应用
- 事件调度器的配置与管理
- 触发器在审计日志中的实战应用

## 第五部分：事务管理与数据安全

### [SQL 事务详解与最佳实践](sql-transaction.md)

- 事务的 ACID 属性深度解析
- 事务隔离级别与并发问题（脏读、不可重复读、幻读）
- 死锁检测与避免策略
- 保存点与部分回滚机制

### [SQL 权限管理与安全详解与最佳实践](sql-security.md)

- 用户创建与权限分配
- 角色管理与权限继承
- SQL 注入原理与防护措施
- 数据加密与脱敏技术

## 第六部分：性能优化与高级架构

### [SQL 性能优化详解与最佳实践](sql-performance.md)

- 执行计划解读与分析方法
- 查询重写与优化器提示
- 统计信息的重要性与维护策略
- 参数化查询与执行计划缓存

### [SQL 高级查询技术与优化详解与最佳实践](sql-advanced-query.md)

- 复杂查询的分解与重构策略
- 临时表与派生表的优化使用
- 数据透视与行列转换技术
- 递归查询在复杂业务逻辑中的应用

### [SQL 数据库分区与分表策略详解与最佳实践](sql-partition-sharding.md)

- 范围分区、列表分区、哈希分区
- 分区剪枝与查询优化
- 分表策略与全局唯一ID生成
- 分布式查询与联邦数据库架构

### [SQL 备份与恢复详解与最佳实践](sql-backup-restore.md)

- 物理备份与逻辑备份的对比
- 在线热备份与点时间恢复
- 复制技术与高可用架构
- 灾难恢复计划与演练

## 第七部分：专题应用与实战场景

### [SQL 在数据分析中的高级应用详解与最佳实践](sql-data-analysis.md)

- 时间序列分析的高级技巧
- 移动平均与累计计算
- 趋势分析与同比环比计算
- 数据分箱与离散化技术

### [SQL 大数据处理与分析技术详解与最佳实践](sql-big-data.md)

- 窗口函数在大数据场景的性能优化
- 近似计算与采样查询
- 与大数据平台的集成查询
- 向量化执行与并行查询技术

### [SQL 最佳实践与代码规范详解与最佳实践](sql-best-practices.md)

- SQL 代码规范与可读性提升
- 版本控制与数据库变更管理
- 性能监控与调优方法论
- 数据库设计反模式与避免策略

## 补充内容

- [SQL SELECT INTO FROM 与 INSERT INTO SELECT 详解与最佳实践](sql-select-into.md)

## 相关链接

### 数据库厂商与核心产品

- MySQL - <https://www.mysql.com/> (Oracle 公司) - 世界上最流行的开源关系型数据库之一。
- PostgreSQL - <https://www.postgresql.org/> (全球开发社区) - 功能强大的开源对象关系数据库系统。
- Microsoft SQL Server - <https://www.microsoft.com/en-us/sql-server> - 微软推出的关系型数据库管理系统。
- Oracle Database - <https://www.oracle.com/database/> - 甲骨文公司推出的高性能、高可用的多模型数据库管理系统。
- MongoDB - <https://www.mongodb.com/> - 领先的面向文档的开源NoSQL数据库。
- Redis - <https://redis.io/> - 开源的内存数据结构存储，用作数据库、缓存和消息代理。
- Amazon Web Services (AWS) Databases - <https://aws.amazon.com/cn/products/databases/> - 亚马逊提供的关系型数据库、NoSQL 数据库、内存数据库等。
- Google Cloud Database - <https://cloud.google.com/products/databases> - 谷歌云提供的全托管关系型数据库服务。
- SQLite - <https://www.sqlite.org/index.html> - 嵌入式的、自包含的、无服务器的、零配置的 SQL 数据库引擎。
- MariaDB - <https://mariadb.org/> - 由 MySQL 原始开发者维护的、与 MySQL 高度兼容的开源分支。
- H2 - <https://www.h2database.com/html/main.html> - 内存数据库引擎，支持 JDBC 和 ODBC，用于测试和开发。
- HBase - <https://hbase.apache.org/> - 分布式、可扩展的、面向列的 NoSQL 数据库，适用于海量数据存储。
- Cassandra - <https://cassandra.apache.org/> - 分布式、高可用的 NoSQL 数据库，适用于大规模数据存储和实时分析。
- Hive - <https://hive.apache.org/> - 基于 Hadoop 的数据仓库基础设施，用于处理大规模数据集。
- Aliyun Database - <https://www.aliyun.com/product/outline/index> - 阿里云瑶池数据库：云原生一站式数据管理与服务。
- Tencent Cloud Database - <https://cloud.tencent.com/solution/database> - 腾讯云提供的关系型数据库、NoSQL 数据库、内存数据库等。

### 数据库工具

- MySQL Workbench - <https://www.mysql.com/products/workbench/> - MySQL 官方的可视化数据库设计、管理和开发工具。
- PostgreSQL pgAdmin - <https://www.pgadmin.org/> - PostgreSQL 最流行的开源管理和开发平台。
- DBeaver - <https://dbeaver.io/> - 免费的跨平台数据库工具，支持所有主流数据库（MySQL, PostgreSQL, SQLite, Oracle, DB2, SQL Server等）。
- phpMyAdmin - <https://www.phpmyadmin.net/> - 用 PHP 编写的免费开源 Web 端 MySQL/MariaDB 管理工具。
- Azure Data Studio - <https://learn.microsoft.com/en-us/sql/azure-data-studio/download-azure-data-studio> - 跨平台的数据库工具，适用于使用 Azure 数据服务和本地数据库的数据专业人士。
- Redis Insight - <https://redis.com/redis-enterprise/redis-insight/> - Redis 官方的可视化管理工具。
- MongoDB Compass - <https://www.mongodb.com/products/compass> - MongoDB 官方的 GUI 交互工具。
- SQL Developer - <https://www.oracle.com/database/sqldeveloper/technologies/download/> - Oracle 官方的 SQL 开发工具，支持所有主要数据库系统。
