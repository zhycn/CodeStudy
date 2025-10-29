---
title: SQL 分组与聚合函数详解与最佳实践
description: 本文全面系统地讲解 SQL 分组与聚合函数的完整语法、使用场景和最佳实践，帮助您从入门到精通掌握数据汇总分析的艺术。
author: zhycn
---

# SQL 分组与聚合函数详解与最佳实践

## 1. 引言

在数据分析和数据库查询中，我们经常需要对数据进行汇总和统计分析。SQL 的分组和聚合功能正是为此而设计，它们允许我们将数据按照特定条件分组，然后对每个组计算汇总值。无论是简单的计数统计还是复杂的多维度分析，分组和聚合都是 SQL 查询中不可或缺的核心技术。本文将全面详解 SQL 分组与聚合函数的使用方法、最佳实践和高级技巧，帮助您掌握这一重要主题。

## 2. 聚合函数完整指南

聚合函数是用于对一组值执行计算并返回单个值的函数，它们通常与 GROUP BY 子句配合使用，实现对数据的汇总分析。

### 2.1 常用聚合函数

#### COUNT() 函数

COUNT() 函数用于计算行数，有两种主要用法：

- `COUNT(*)`：统计所有行的数量，包括包含 NULL 值的行
- `COUNT(column_name)`：统计指定列中非 NULL 值的数量

```sql
-- 统计员工表中的总行数
SELECT COUNT(*) AS total_employees FROM employees;

-- 统计部门ID非空的员工数量
SELECT COUNT(department_id) AS employees_with_department FROM employees;
```

#### SUM() 函数

SUM() 函数计算数值列的总和，会自动忽略 NULL 值。

```sql
-- 计算所有员工的工资总额
SELECT SUM(salary) AS total_salary FROM employees;

-- 按部门计算工资总额
SELECT department_id, SUM(salary) AS department_salary
FROM employees
GROUP BY department_id;
```

#### AVG() 函数

AVG() 函数计算数值列的平均值，忽略 NULL 值。需要注意的是，分母只包含非 NULL 值的行数。

```sql
-- 计算平均工资
SELECT AVG(salary) AS average_salary FROM employees;

-- 正确的平均值计算方式
SELECT SUM(salary) / COUNT(salary) AS correct_avg FROM employees;
```

#### MAX() 和 MIN() 函数

MAX() 和 MIN() 分别返回列中的最大值和最小值，适用于数值、日期和字符串类型，忽略 NULL 值。

```sql
-- 获取最高和最低工资
SELECT MAX(salary) AS highest_salary, MIN(salary) AS lowest_salary
FROM employees;

-- 获取最早和最晚的入职日期
SELECT MIN(hire_date) AS earliest_hire, MAX(hire_date) AS latest_hire
FROM employees;
```

### 2.2 特殊聚合函数

#### 字符串聚合函数

- MySQL: `GROUP_CONCAT()`
- PostgreSQL: `STRING_AGG()`

```sql
-- MySQL: 将每个部门的员工姓名合并为字符串
SELECT department, GROUP_CONCAT(employee_name SEPARATOR ', ') AS employees
FROM employees
GROUP BY department;

-- PostgreSQL: 实现相同功能
SELECT department, STRING_AGG(employee_name, ', ') AS employees
FROM employees
GROUP BY department;
```

#### 统计聚合函数

某些数据库还提供统计函数如标准差和方差计算：

```sql
-- 计算工资的标准差和方差
SELECT STDDEV(salary) AS salary_stddev, VARIANCE(salary) AS salary_variance
FROM employees;
```

### 2.3 聚合函数中的 NULL 处理

大多数聚合函数会自动忽略 NULL 值，但 COUNT(\*) 例外，它会计算所有行包括包含 NULL 的行。在处理可能包含 NULL 值的数据时，可以使用 COALESCE 或 IFNULL 函数提供默认值：

```sql
-- 将 NULL 工资视为 0 计算平均值
SELECT AVG(COALESCE(salary, 0)) AS avg_salary_including_null
FROM employees;
```

## 3. GROUP BY 子句详解

GROUP BY 子句用于将结果集按一个或多个列分组，然后对每个组应用聚合函数。

### 3.1 基本语法和单字段分组

```sql
SELECT column_name, aggregate_function(column_name)
FROM table_name
WHERE condition
GROUP BY column_name;
```

**示例：按部门分组统计员工信息**

```sql
SELECT
    department_id,
    COUNT(*) AS employee_count,
    AVG(salary) AS average_salary,
    MAX(salary) AS highest_salary
FROM employees
GROUP BY department_id;
```

### 3.2 多字段分组

可以按多个列进行分组，实现更细粒度的分析。

```sql
-- 按部门和职位分组统计
SELECT
    department_id,
    job_title,
    COUNT(*) AS employee_count,
    AVG(salary) AS average_salary
FROM employees
GROUP BY department_id, job_title;
```

### 3.3 GROUP BY 规则和注意事项

1. **SELECT 子句规则**：所有出现在 SELECT 中且未使用聚合函数的列，必须出现在 GROUP BY 子句中。

   ```sql
   -- 正确写法
   SELECT department_id, job_title, COUNT(*)
   FROM employees
   GROUP BY department_id, job_title;

   -- 错误写法（在某些数据库中将报错）
   SELECT department_id, job_title, COUNT(*)
   FROM employees
   GROUP BY department_id;
   ```

2. **NULL 值处理**：GROUP BY 会将所有 NULL 值归为一组。

3. **表达式分组**：除了列名，还可以使用表达式进行分组。

   ```sql
   -- 按姓名长度分组
   SELECT LENGTH(last_name) AS name_length, COUNT(*) AS employee_count
   FROM employees
   GROUP BY LENGTH(last_name);
   ```

## 4. HAVING 子句与 WHERE 子句的区别

HAVING 和 WHERE 都用于过滤数据，但它们在执行时机和应用对象上有本质区别。

### 4.1 执行时机和作用对象对比

| 特性         | WHERE 子句           | HAVING 子句        |
| ------------ | -------------------- | ------------------ |
| **执行时机** | 在分组前执行         | 在分组后执行       |
| **作用对象** | 过滤原始表中的行     | 过滤分组后的结果集 |
| **聚合函数** | 不能直接使用聚合函数 | 可以使用聚合函数   |
| **语法位置** | GROUP BY 之前        | GROUP BY 之后      |

### 4.2 实际应用示例

**WHERE 示例：筛选后再分组**

```sql
-- 先筛选出工资大于50000的员工，再按部门统计
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
WHERE salary > 50000  -- 分组前过滤行
GROUP BY department_id;
```

**HAVING 示例：分组后再筛选**

```sql
-- 先按部门分组计算平均工资，再筛选出平均工资大于60000的部门
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 60000;  -- 分组后过滤组
```

**WHERE 和 HAVING 结合使用**

```sql
-- 综合使用：先过滤员工，再分组，最后过滤分组结果
SELECT department_id, COUNT(*) AS employee_count, AVG(salary) AS avg_salary
FROM employees
WHERE hire_date >= '2020-01-01'  -- 筛选2020年后入职的员工
GROUP BY department_id
HAVING AVG(salary) > 50000 AND COUNT(*) > 5;  -- 筛选符合条件的部门
```

### 4.3 SQL 查询执行顺序理解

理解 SQL 查询的执行顺序有助于正确使用 WHERE 和 HAVING：

1. **FROM**：确定要查询的表
2. **WHERE**：对原始数据行进行过滤
3. **GROUP BY**：对过滤后的数据进行分组
4. **HAVING**：对分组后的结果进行过滤
5. **SELECT**：选择要显示的列和计算聚合函数
6. **ORDER BY**：对最终结果排序

## 5. 高级分组技术

### 5.1 GROUPING SETS

GROUPING SETS 允许在单个查询中指定多个分组方式，避免多次查询合并的麻烦。

```sql
-- 同时按部门、按性别、以及全公司统计员工数量
SELECT
    department,
    gender,
    COUNT(*) AS employee_count
FROM employees
GROUP BY GROUPING SETS (
    (department, gender),  -- 部门和性别组合
    (department),           -- 仅部门
    (gender),               -- 仅性别
    ()                      -- 总计
);
```

### 5.2 ROLLUP

ROLLUP 用于生成分层的小计和总计，特别适合制作汇总报表。

```sql
-- 生成部门内职位的小计和部门总计
SELECT
    department,
    job_title,
    COUNT(*) AS employee_count,
    SUM(salary) AS total_salary
FROM employees
GROUP BY ROLLUP(department, job_title);
```

### 5.3 CUBE

CUBE 生成所有可能的组合汇总，比 ROLLUP 更全面（注：MySQL 不支持 CUBE，但 PostgreSQL 支持）。

```sql
-- PostgreSQL: 生成所有维度组合的汇总
SELECT
    department,
    gender,
    COUNT(*) AS employee_count
FROM employees
GROUP BY CUBE(department, gender);
```

### 5.4 识别汇总行

使用 GROUPING() 函数可以识别哪些行是汇总行。

```sql
SELECT
    department,
    job_title,
    GROUPING(department) AS is_department_total,
    GROUPING(job_title) AS is_job_title_total,
    COUNT(*) AS employee_count
FROM employees
GROUP BY ROLLUP(department, job_title);
```

## 6. 最佳实践与性能优化

### 6.1 查询性能优化

1. **先过滤后聚合原则**：尽量在 WHERE 子句中提前过滤数据，减少参与分组的数据量。

   ```sql
   -- 推荐：先过滤日期，再分组
   SELECT region, SUM(sales)
   FROM orders
   WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
   GROUP BY region;
   ```

2. **索引优化**：为分组列和常用过滤条件创建索引。

   ```sql
   -- 为分组列创建索引
   CREATE INDEX idx_employee_department ON employees(department_id);

   -- 为分组和过滤列创建复合索引
   CREATE INDEX idx_orders_region_date ON orders(region, order_date);
   ```

3. **避免 `SELECT *`**：只选择需要的列，减少 I/O 开销。

   ```sql
   -- 不推荐
   SELECT * FROM employees GROUP BY department_id;

   -- 推荐
   SELECT department_id, COUNT(*) FROM employees GROUP BY department_id;
   ```

### 6.2 数据处理最佳实践

1. **NULL 值处理**：明确处理 NULL 值，避免统计偏差。

   ```sql
   -- 明确处理 NULL 值
   SELECT
       department_id,
       AVG(COALESCE(salary, 0)) AS avg_salary,
       COUNT(salary) AS employees_with_salary,
       COUNT(*) AS total_employees
   FROM employees
   GROUP BY department_id;
   ```

2. **避免多重计数**：多表关联时注意重复计数问题。

   ```sql
   -- 错误：可能重复计数
   SELECT c.customer_id, COUNT(*) AS order_count
   FROM customers c
   JOIN orders o ON c.customer_id = o.customer_id
   JOIN order_items oi ON o.order_id = oi.order_id
   GROUP BY c.customer_id;

   -- 正确：先聚合再关联
   WITH order_counts AS (
       SELECT customer_id, COUNT(*) AS order_count
       FROM orders
       GROUP BY customer_id
   )
   SELECT c.customer_id, COALESCE(oc.order_count, 0)
   FROM customers c
   LEFT JOIN order_counts oc ON c.customer_id = oc.customer_id;
   ```

3. **条件聚合技巧**：使用 CASE 语句在聚合函数中实现条件统计。

   ```sql
   -- 统计各部门男女员工平均工资
   SELECT
       department,
       AVG(CASE WHEN gender = 'M' THEN salary END) AS male_avg_salary,
       AVG(CASE WHEN gender = 'F' THEN salary END) AS female_avg_salary,
       COUNT(CASE WHEN gender = 'M' THEN 1 END) AS male_count,
       COUNT(CASE WHEN gender = 'F' THEN 1 END) AS female_count
   FROM employees
   GROUP BY department;
   ```

### 6.3 复杂查询的组织

对于复杂的多层级聚合，使用 CTE（公用表表达式）提高可读性。

```sql
-- 使用 CTE 组织复杂聚合逻辑
WITH department_stats AS (
    SELECT
        department,
        COUNT(*) AS employee_count,
        AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department
),
company_stats AS (
    SELECT
        COUNT(*) AS total_employees,
        AVG(avg_salary) AS company_avg_salary
    FROM department_stats
)
SELECT
    ds.department,
    ds.employee_count,
    ds.avg_salary,
    cs.total_employees,
    cs.company_avg_salary
FROM department_stats ds
CROSS JOIN company_stats cs
WHERE ds.employee_count > 5;
```

## 7. 实战案例与常见问题解答

### 7.1 电商业务分析案例

```sql
-- 综合电商数据分析查询
SELECT
    EXTRACT(YEAR FROM order_date) AS order_year,
    EXTRACT(MONTH FROM order_date) AS order_month,
    region,
    product_category,
    COUNT(DISTINCT o.order_id) AS order_count,
    COUNT(od.product_id) AS total_items_sold,
    SUM(od.quantity * od.unit_price) AS total_revenue,
    AVG(od.quantity * od.unit_price) AS avg_order_value
FROM orders o
JOIN order_details od ON o.order_id = od.order_id
WHERE o.order_date >= DATE '2023-01-01'
GROUP BY GROUPING SETS (
    (EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date), region, product_category),
    (EXTRACT(YEAR FROM order_date), region),
    (region, product_category),
    ()
)
HAVING SUM(od.quantity * od.unit_price) > 10000
ORDER BY order_year, order_month, region;
```

### 7.2 常见问题解答

**Q: COUNT(\*) 和 COUNT(列名) 有什么区别？**
A: COUNT(\*) 统计所有行数（包括 NULL），COUNT(列名) 只统计该列非 NULL 值的数量。

**Q: 能否在 WHERE 子句中使用聚合函数？**
A: 不能，WHERE 子句在分组前执行，此时聚合函数尚未计算。应使用 HAVING 子句过滤聚合结果。

**Q: 多表连接时如何避免重复计数？**
A: 应先对子表进行聚合，然后再与主表关联，而不是先关联再聚合。

**Q: 如何提高分组查询的性能？**
A: 为分组列创建索引、在分组前使用 WHERE 过滤减少数据量、避免不必要的复杂分组条件。

## 8. 总结

SQL 分组和聚合函数是数据分析和报表生成的核心技术。通过掌握 GROUP BY、HAVING 以及各种聚合函数的使用方法，能够高效地完成数据汇总和统计分析任务。关键要点包括：

1. **理解执行顺序**：FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY
2. **正确使用 HAVING 和 WHERE**：WHERE 过滤行，HAVING 过滤组
3. **遵循分组规则**：SELECT 中的非聚合列必须出现在 GROUP BY 中
4. **优化查询性能**：索引、提前过滤、避免不必要的数据处理
5. **合理处理特殊情况**：NULL 值、多表关联、条件聚合等

通过结合实际业务需求，灵活运用这些技术和最佳实践，可以编写出高效、可维护的 SQL 查询，为数据驱动决策提供有力支持。
