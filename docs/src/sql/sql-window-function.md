---
title: SQL 窗口函数详解与最佳实践
description: 本文深入解析 SQL 窗口函数的核心概念、语法规范及应用场景，帮助你掌握这一强大的数据分析工具。
author: zhycn
---

# SQL 窗口函数详解与最佳实践

本文深入解析 SQL 窗口函数的核心概念、语法规范及应用场景，帮助你掌握这一强大的数据分析工具。

## 1 窗口函数概述

### 1.1 什么是窗口函数

SQL 窗口函数（Window Function）是 ANSI SQL 2003 标准引入的强大分析工具，它能够在**保留原始行数据**的同时，对一组相关行（称为"窗口"）执行计算。与传统的聚合函数不同，窗口函数**不会将结果集折叠**为更少的行，而是为每一行返回一个计算结果。

窗口函数的核心思想是：在结果集的"窗口"内执行聚合或排序计算，但不减少输出行数。这使得我们能够在同一查询中同时获取详细数据和分析结果。

### 1.2 窗口函数与聚合函数的本质区别

为了更好地理解窗口函数的特性，下面通过表格对比两者的核心差异：

| 特性     | 聚合函数 (Aggregate) | 窗口函数 (Window)      |
| -------- | -------------------- | ---------------------- |
| 数据折叠 | 是，每组输出单行结果 | 否，保留所有原始行     |
| 分区支持 | 通过 GROUP BY 实现   | 通过 PARTITION BY 实现 |
| 排序支持 | 需配合子查询或变量   | 直接支持 ORDER BY      |
| 原始数据 | 无法保留明细行       | 明细与统计结果共存     |
| 滑动窗口 | 不支持               | 通过 ROWS/RANGE 实现   |
| 典型场景 | 汇总统计、图表聚合   | 排名、环比、累计值分析 |

**示例对比**：计算每个部门的平均工资

```sql
-- 聚合函数写法（折叠数据）
SELECT department, AVG(salary)
FROM employees
GROUP BY department;

-- 窗口函数写法（保留明细）
SELECT employee_id, department, salary,
       AVG(salary) OVER (PARTITION BY department) AS dept_avg_salary
FROM employees;
```

聚合函数版本将每个部门折叠为单行结果，而窗口函数版本在保留每个员工详细信息的同时，增加了部门的平均工资信息。

## 2 窗口函数核心语法

### 2.1 基本语法结构

窗口函数的标准语法格式如下：

```sql
<窗口函数> OVER (
    [PARTITION BY <分区表达式>]
    [ORDER BY <排序表达式> [ASC|DESC]]
    [窗口帧子句]
)
```

### 2.2 PARTITION BY 子句

`PARTITION BY` 用于将数据划分为多个分区（窗口），类似于 `GROUP BY` 但不会折叠行。每个分区内的计算相互独立。

```sql
-- 按部门分区计算工资总和
SELECT emp_name, dept_id, salary,
       SUM(salary) OVER (PARTITION BY dept_id) AS dept_total
FROM employee;
```

### 2.3 ORDER BY 子句

`ORDER BY` 在分区内指定数据的排序方式，直接影响排名函数和累计计算的行为。

```sql
-- 按工资降序排名
SELECT emp_name, salary,
       RANK() OVER (ORDER BY salary DESC) AS salary_rank
FROM employee;
```

### 2.4 窗口帧（Window Frame）子句

窗口帧子句进一步限定分区内参与计算的行范围，支持两种模式：

#### ROWS 模式 - 基于物理行偏移

```sql
-- 计算最近3行的移动平均（包含前2行和当前行）
SELECT order_date, sales_amount,
       AVG(sales_amount) OVER (
           ORDER BY order_date
           ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS moving_avg
FROM sales;
```

#### RANGE 模式 - 基于逻辑值范围

```sql
-- 计算当前值±500范围内的平均值
SELECT salary,
       AVG(salary) OVER (
           ORDER BY salary
           RANGE BETWEEN 500 PRECEDING AND 500 FOLLOWING
       ) AS local_avg
FROM employees;
```

#### ROWS 与 RANGE 的核心差异

| 特性       | `ROWS`                       | `RANGE`                            |
| ---------- | ---------------------------- | ---------------------------------- |
| 划分依据   | 物理行号（绝对位置）         | 逻辑值范围（相对值）               |
| 适用场景   | 固定行数的滑动窗口           | 连续数值范围或时间间隔             |
| 重复值处理 | 按行号区分，重复值视为不同行 | 相同值视为同一范围，全部包含       |
| 性能       | 通常更优（按固定行数扫描）   | 可能较慢（需扫描值范围内的所有行） |

## 3 窗口函数分类详解

### 3.1 排名函数（Ranking Functions）

排名函数用于为数据分配序号或排名，在处理 Top-N 查询时尤其有用。

#### 3.1.1 ROW_NUMBER、RANK、DENSE_RANK 对比

三种排名函数的处理方式有重要区别：

| 函数名         | 并列值处理           | 名次连续性     | 典型场景               |
| -------------- | -------------------- | -------------- | ---------------------- |
| `ROW_NUMBER()` | 否，始终生成唯一序号 | 连续           | 去重、唯一序号分配     |
| `RANK()`       | 是，并列占用相同名次 | 不连续，会跳号 | 学生成绩排名，允许并列 |
| `DENSE_RANK()` | 是，并列占用相同名次 | 连续，不跳号   | 等级划分，如 A/B/C 档  |

**实际示例**：

```sql
SELECT shop_id, mon, mon_amt,
       ROW_NUMBER() OVER (PARTITION BY shop_id ORDER BY mon_amt DESC) AS rn,
       RANK() OVER (PARTITION BY shop_id ORDER BY mon_amt DESC) AS rnk,
       DENSE_RANK() OVER (PARTITION BY shop_id ORDER BY mon_amt DESC) AS drnk
FROM sales;
```

**结果解读**：

- `rn` 列始终唯一，即使金额相同也会给出 1、2、3…
- `rnk` 列出现并列时跳过后续名次，例如两个第1名后紧跟第3名
- `drnk` 列在并列后名次连续，例如两个第1名后仍是第2名

#### 3.1.2 分布函数：NTILE 与 PERCENT_RANK

```sql
-- 将数据分为4个分位（Quartile）
SELECT emp_id, emp_name, salary,
       NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;

-- 计算百分比排名（0到1之间）
SELECT emp_id, emp_name, salary,
       PERCENT_RANK() OVER (ORDER BY salary) AS pct_rank
FROM employees;
```

`NTILE(4)` 将员工按工资从高到低分为4个等级，常用于绩效分档。`PERCENT_RANK()` 返回每行在窗口中的相对排名百分比，其中0表示最小值，1表示最大值。

### 3.2 偏移函数（Offset Functions）

偏移函数用于访问当前行之前或之后的行数据，在时间序列分析中极为重要。

#### 3.2.1 LAG 与 LEAD 函数

```sql
-- 获取前一行和后一行的值
SELECT month, sales_amount,
       LAG(sales_amount, 1) OVER (ORDER BY month) AS prev_month,
       LEAD(sales_amount, 1) OVER (ORDER BY month) AS next_month
FROM monthly_sales;
```

#### 3.2.2 同比环比分析实战

环比增长率计算是业务分析中的常见需求：

```sql
WITH month_sum AS (
    SELECT shop_id, DATE_TRUNC('month', sales_date) AS mon, SUM(amount) AS amt
    FROM sales
    GROUP BY shop_id, DATE_TRUNC('month', sales_date)
)
SELECT shop_id, mon, amt,
       LAG(amt, 1) OVER (PARTITION BY shop_id ORDER BY mon) AS prev_amt,
       CASE WHEN LAG(amt, 1) OVER (PARTITION BY shop_id ORDER BY mon) IS NULL THEN NULL
            ELSE ROUND( (amt - LAG(amt, 1) OVER (PARTITION BY shop_id ORDER BY mon)) * 100.0
                 / LAG(amt, 1) OVER (PARTITION BY shop_id ORDER BY mon), 2)
       END AS mom_growth_rate
FROM month_sum
ORDER BY shop_id, mon;
```

同比分析只需将偏移量改为12（假设按月统计）：

```sql
-- 同比增长率计算
SELECT month, sales_amount,
       LAG(sales_amount, 12) OVER (ORDER BY month) AS prev_year_amount,
       (sales_amount - LAG(sales_amount, 12) OVER (ORDER BY month)) * 100.0
       / LAG(sales_amount, 12) OVER (ORDER BY month) AS yoy_growth_rate
FROM monthly_sales;
```

### 3.3 聚合窗口函数（Aggregate Window Functions）

传统聚合函数作为窗口函数使用，可以实现在保留明细的同时获取聚合信息。

#### 3.3.1 累计计算（Running Total）

```sql
-- 计算累计销售额
SELECT order_date, sales_amount,
       SUM(sales_amount) OVER (ORDER BY order_date) AS cumulative_sales
FROM daily_sales;
```

#### 3.3.2 移动平均（Moving Average）

```sql
-- 计算3期移动平均
SELECT order_date, sales_amount,
       AVG(sales_amount) OVER (
           ORDER BY order_date
           ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS moving_avg_3period
FROM sales;
```

## 4 高级应用与实战案例

### 4.1 Top-N 查询优化方案

传统 Top-N 查询需要使用自连接或子查询，窗口函数提供了更优雅高效的解决方案。

```sql
-- 获取每个部门工资前三名的员工
SELECT *
FROM (
    SELECT emp_name, dept_id, salary,
           ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
    FROM employees
) ranked
WHERE rn <= 3;
```

与传统的聚合+JOIN方法相比，窗口函数在大数据量下性能更优。测试表明，在100万条记录的场景下，窗口函数方案（≈160ms）比聚合+JOIN方案（≈210ms）性能提升约24%。

### 4.2 复杂业务指标计算

#### 4.2.1 员工贡献度分析

```sql
-- 计算员工在部门内的业绩贡献占比
SELECT emp_id, emp_name, dept_id, month, sales_amount,
       ROUND(sales_amount * 100.0 / SUM(sales_amount) OVER
             (PARTITION BY dept_id, month), 2) AS contribution_pct
FROM sales;
```

#### 4.2.2 连续达标天数统计

```sql
-- 计算KPI连续达标天数
SELECT emp_id, work_date, kpi_value,
       SUM(CASE WHEN kpi_value >= target THEN 1 ELSE 0 END) OVER (
           PARTITION BY emp_id
           ORDER BY work_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS consecutive_days
FROM daily_kpi;
```

### 4.3 综合案例：多维度历史对比

真实报表常要求"每个品类下销售额Top3店铺，并展示其本月、上月、去年同期销售额"：

```sql
WITH ranked AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY ym, category ORDER BY amt DESC) AS rn
    FROM sales_demo
),
current_top AS (
    SELECT * FROM ranked WHERE ym = 202407 AND rn <= 3
),
joined AS (
    SELECT c.ym AS cur_ym, c.category, c.shop_id, c.amt AS cur_amt,
           LAG(c.amt, 1) OVER (PARTITION BY c.shop_id ORDER BY c.ym) AS last_m,
           LAG(c.amt, 12) OVER (PARTITION BY c.shop_id ORDER BY c.ym) AS last_y
    FROM ranked c
    WHERE c.rn <= 3
)
SELECT * FROM joined WHERE cur_ym = 202407;
```

该查询采用"先排名→再筛选→再偏移"的三步策略，高效实现了复杂业务逻辑。

## 5 性能优化与最佳实践

### 5.1 执行计划分析与索引策略

窗口函数的性能主要消耗在排序操作上，通过分析执行计划可以识别优化机会。

```sql
-- 查看窗口函数的执行计划（PostgreSQL示例）
EXPLAIN (ANALYZE, BUFFERS)
SELECT shop_id, RANK() OVER (PARTITION BY shop_id ORDER BY amount DESC)
FROM sales;
```

典型执行计划显示排序是关键成本点：

```sql
WindowAgg  (cost=... rows=...)
  ->  Sort  (cost=... rows=...)
        Sort Key: shop_id, amount DESC
  ->  Seq Scan on sales ...
```

**索引优化建议**：

- 为 `PARTITION BY` 和 `ORDER BY` 的列组合创建复合索引
- 确保索引顺序与窗口函数定义顺序一致
- 对于范围查询，考虑使用覆盖索引减少回表操作

### 5.2 内存与排序优化

当处理大数据集时，可采取以下策略：

1. **减少窗口范围**：避免使用 `UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`
2. **使用 ROWS 替代 RANGE**：ROWS 基于行偏移，通常比 RANGE 基于值范围更高效
3. **分区字段选择**：优先使用高基数（唯一值多）的列作为分区键，减少分区内数据量

### 5.3 常见误区与避坑指南

| 误区描述                             | 正确做法                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| 在 WHERE 子句中直接引用窗口函数别名  | 使用子查询或 CTE 先计算窗口列再过滤                      |
| 忽略 NULLS FIRST/LAST 导致排序不稳定 | 显式指定 NULL 顺序，确保结果可复现                       |
| 认为 DENSE_RANK 一定优于 RANK        | 依据业务需求选择，等级划分用 DENSE_RANK，真实排名用 RANK |
| 在 MySQL 5.x 使用窗口函数            | 升级至 8.0+ 或使用变量模拟（性能较差）                   |

**正确过滤示例**：

```sql
-- 错误：不能在WHERE中直接使用窗口函数
SELECT emp_name, salary,
       RANK() OVER (ORDER BY salary DESC) AS rnk
FROM employees
WHERE rnk <= 5;  -- 报错！

-- 正确：使用子查询包装
SELECT *
FROM (
    SELECT emp_name, salary,
           RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
) ranked
WHERE rnk <= 5;
```

## 6 数据库特定实现说明

### 6.1 MySQL 注意事项

- MySQL 从 8.0 版本开始支持窗口函数
- 早期版本（5.7及以下）不支持，需使用变量模拟
- 在涉及 `RANGE` 的时间间隔时功能有限，不支持 `INTERVAL` 语法

### 6.2 PostgreSQL 增强特性

- 支持完整的窗口函数功能，包括 `RANGE` 与 `INTERVAL` 结合使用
- 提供丰富的窗口函数扩展，如 `mode()`、`percentile_cont()` 等
- 在 `EXPLAIN ANALYZE` 中提供详细的窗口函数执行信息

### 6.3 跨数据库兼容性建议

为确保SQL代码的跨数据库兼容性，建议：

1. 避免使用数据库特定的窗口函数扩展
2. 对于复杂窗口帧，测试在不同数据库中的执行结果
3. 使用标准SQL语法，避免依赖数据库特定的优化提示

## 7 总结与展望

窗口函数将 SQL 从"集合查询语言"推进到"数据分析语言"，极大增强了SQL处理复杂分析任务的能力。通过本文的详细讲解，我们可以看到窗口函数在以下场景中具有不可替代的优势：

1. **排名与分位分析**：Top-N查询、绩效分档、百分比排名
2. **时间序列分析**：环比、同比、移动平均、累计计算
3. **业务指标计算**：贡献度分析、完成率统计、连续达标检测
4. **数据质量处理**：重复数据识别、数据差距分析

随着 ANSI SQL 标准的演进，窗口函数功能仍在不断增强，未来在流式计算（如 Flink、Kafka Streams）与机器学习特征工程领域将发挥更大作用。

掌握窗口函数需要结合实际业务场景进行练习，建议读者在真实数据环境中尝试本文的各种示例，逐步培养"窗口思维"，从而在复杂数据分析任务中游刃有余。
