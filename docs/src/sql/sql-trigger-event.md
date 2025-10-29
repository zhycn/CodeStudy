---
title: SQL 触发器与事件调度详解与最佳实践
description: 本文详细介绍了 SQL 触发器和事件调度器的基础概念、原理、应用场景和最佳实践。通过学习本文，您将能够理解触发器和事件调度器的工作原理，掌握它们的创建与维护策略，避免常见问题，从而提升数据库应用的效率和可维护性。
author: zhycn
---

# SQL 触发器与事件调度详解与最佳实践

作为关系数据库的核心功能，**触发器（Trigger）** 和**事件调度器（Event Scheduler）** 为数据库提供了自动化处理能力和业务规则实施机制。本文将深入探讨这两项技术的原理、应用场景和最佳实践。

## 1. 触发器概述

### 1.1 基本概念与作用

触发器是一种特殊的存储过程，它在特定数据库事件（如 INSERT、UPDATE、DELETE）发生时**自动执行**。触发器的主要作用包括：

- **数据一致性保障**：在数据变更时自动维护业务规则
- **审计日志记录**：跟踪数据变化历史用于安全审计
- **级联操作**：实现复杂的跨表数据同步
- **数据验证**：在数据库层面实施业务规则验证

### 1.2 触发器类型与执行时机

根据触发时机和方式，触发器分为三种主要类型：

| 类型              | 触发时机              | 说明                             |
| ----------------- | --------------------- | -------------------------------- |
| BEFORE 触发器     | 在 DML 语句执行前触发 | 常用于数据验证、条件检查         |
| AFTER 触发器      | 在 DML 语句执行后触发 | 常用于审计日志、级联操作         |
| INSTEAD OF 触发器 | 替代原始 DML 语句执行 | 主要用于视图更新、复杂操作重定向 |

**触发器执行顺序**对于理解其行为至关重要：

- **影响单行时**：
  1. BEFORE 语句级触发器
  2. BEFORE 行级触发器
  3. 执行 DML 语句
  4. AFTER 行级触发器
  5. AFTER 语句级触发器

- **影响多行时**：
  1. BEFORE 语句级触发器
  2. 每行依次执行：BEFORE 行级触发器 → DML 语句 → AFTER 行级触发器
  3. AFTER 语句级触发器

## 2. DML 触发器详解

### 2.1 BEFORE 触发器实战应用

BEFORE 触发器通常在数据修改前执行，适合数据验证和预处理场景。

#### 数据验证示例

```sql
-- MySQL 示例：验证员工工资范围
DELIMITER //
CREATE TRIGGER validate_salary_before_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    IF NEW.salary < 1000 OR NEW.salary > 100000 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '工资必须在1000-100000范围内';
    END IF;
END//
DELIMITER ;

-- PostgreSQL 示例：数据验证
CREATE OR REPLACE FUNCTION validate_employee()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.salary < (SELECT MIN(salary) FROM positions WHERE position_id = NEW.position_id) THEN
        RAISE EXCEPTION '工资低于该职位最低标准';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_salary_before
BEFORE INSERT OR UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION validate_employee();
```

#### 数据预处理示例

```sql
-- 自动填充创建时间和大写转换
DELIMITER //
CREATE TRIGGER preprocess_employee_data
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    SET NEW.created_at = NOW();
    SET NEW.email = LOWER(NEW.email);
    SET NEW.first_name = UPPER(NEW.first_name);
END//
DELIMITER ;
```

### 2.2 AFTER 触发器实战应用

AFTER 触发器在数据修改后执行，适合审计日志和级联更新场景。

#### 审计日志示例

```sql
-- 创建审计日志表
CREATE TABLE employee_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    action_type VARCHAR(10),
    old_data JSON,
    new_data JSON,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(50)
);

-- MySQL 审计触发器
DELIMITER //
CREATE TRIGGER audit_employee_changes
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
    INSERT INTO employee_audit (employee_id, action_type, old_data, new_data, changed_by)
    VALUES (
        NEW.employee_id,
        'UPDATE',
        JSON_OBJECT('salary', OLD.salary, 'department', OLD.department_id),
        JSON_OBJECT('salary', NEW.salary, 'department', NEW.department_id),
        USER()
    );
END//
DELIMITER ;

-- PostgreSQL 审计示例
CREATE TABLE employee_history AS SELECT * FROM employees WITH NO DATA;
ALTER TABLE employee_history ADD COLUMN history_id SERIAL PRIMARY KEY;
ALTER TABLE employee_history ADD COLUMN changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE employee_history ADD COLUMN operation VARCHAR(10);

CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO employee_history SELECT OLD.*, CURRENT_TIMESTAMP, 'DELETE';
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO employee_history SELECT NEW.*, CURRENT_TIMESTAMP, 'UPDATE';
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO employee_history SELECT NEW.*, CURRENT_TIMESTAMP, 'INSERT';
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_employee_changes
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION log_employee_changes();
```

#### 级联操作示例

```sql
-- 库存管理系统级联更新
DELIMITER //
CREATE TRIGGER update_inventory_after_order
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    UPDATE inventory
    SET quantity = quantity - NEW.quantity,
        last_restocked = NOW()
    WHERE product_id = NEW.product_id;

    -- 当库存低于阈值时记录警告
    IF (SELECT quantity FROM inventory WHERE product_id = NEW.product_id) < 10 THEN
        INSERT INTO inventory_warnings (product_id, message, created_at)
        VALUES (NEW.product_id, '库存不足警告', NOW());
    END IF;
END//
DELIMITER ;
```

### 2.3 触发器中的 NEW 和 OLD 引用

在触发器内部，可以访问受操作影响的数据行：

| 操作类型 | OLD 值可用性     | NEW 值可用性     |
| -------- | ---------------- | ---------------- |
| INSERT   | 不可用           | 包含新插入的数据 |
| UPDATE   | 包含更新前的数据 | 包含更新后的数据 |
| DELETE   | 包含删除前的数据 | 不可用           |

**使用示例**：

```sql
-- 利用 OLD 和 NEW 进行数据对比
DELIMITER //
CREATE TRIGGER check_salary_increase
BEFORE UPDATE ON employees
FOR EACH ROW
BEGIN
    DECLARE max_increase DECIMAL(10,2) DEFAULT 0.2; -- 最大涨幅20%

    IF NEW.salary > OLD.salary * (1 + max_increase) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '工资涨幅超过20%限制';
    END IF;

    -- 记录薪资变更历史
    IF NEW.salary != OLD.salary THEN
        INSERT INTO salary_history (employee_id, old_salary, new_salary, change_date)
        VALUES (NEW.employee_id, OLD.salary, NEW.salary, NOW());
    END IF;
END//
DELIMITER ;
```

## 3. INSTEAD OF 触发器高级应用

### 3.1 基本概念与语法

INSTEAD OF 触发器**完全替代**原始 DML 操作，为复杂场景提供灵活解决方案。

**语法结构**：

```sql
CREATE TRIGGER trigger_name
INSTEAD OF {INSERT | UPDATE | DELETE}
ON {table_name | view_name}
AS
BEGIN
    -- 替代操作的自定义逻辑
END;
```

### 3.2 视图更新场景应用

INSTEAD OF 触发器最常见的应用是使复杂视图可更新。

```sql
-- 创建包含员工和部门信息的视图
CREATE VIEW employee_department_view AS
SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    e.salary,
    d.department_name,
    d.location
FROM employees e
JOIN departments d ON e.department_id = d.department_id;

-- 为视图创建 INSTEAD OF 触发器（PostgreSQL 示例）
CREATE OR REPLACE FUNCTION update_employee_department()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新员工表
    UPDATE employees
    SET
        first_name = NEW.first_name,
        last_name = NEW.last_name,
        salary = NEW.salary,
        department_id = (SELECT department_id FROM departments
                        WHERE department_name = NEW.department_name)
    WHERE employee_id = NEW.employee_id;

    -- 如果部门不存在则创建（根据业务需求）
    IF NOT EXISTS (SELECT 1 FROM departments
                  WHERE department_name = NEW.department_name) THEN
        INSERT INTO departments (department_name, location)
        VALUES (NEW.department_name, NEW.location);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_department_instead
INSTEAD OF UPDATE ON employee_department_view
FOR EACH ROW EXECUTE FUNCTION update_employee_department();
```

### 3.3 复杂业务规则实施

```sql
-- 银行转账示例：替代简单 UPDATE 实现复杂业务逻辑
DELIMITER //
CREATE TRIGGER secure_transfer_instead
INSTEAD OF UPDATE ON account_balances
FOR EACH ROW
BEGIN
    DECLARE source_balance DECIMAL(15,2);
    DECLARE target_balance DECIMAL(15,2);

    -- 获取源账户余额
    SELECT balance INTO source_balance
    FROM accounts
    WHERE account_id = OLD.account_id;

    -- 获取目标账户余额
    SELECT balance INTO target_balance
    FROM accounts
    WHERE account_id = NEW.account_id;

    -- 验证业务规则
    IF source_balance < NEW.transfer_amount THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '余额不足';
    END IF;

    IF NEW.transfer_amount > 10000 THEN
        -- 大额转账需要记录特殊审计
        INSERT INTO large_transfers (from_account, to_account, amount, transfer_time)
        VALUES (OLD.account_id, NEW.account_id, NEW.transfer_amount, NOW());
    END IF;

    -- 执行实际转账操作
    UPDATE accounts SET balance = balance - NEW.transfer_amount
    WHERE account_id = OLD.account_id;

    UPDATE accounts SET balance = balance + NEW.transfer_amount
    WHERE account_id = NEW.account_id;

    -- 记录交易历史
    INSERT INTO transfer_history (from_account, to_account, amount, transfer_date)
    VALUES (OLD.account_id, NEW.account_id, NEW.transfer_amount, NOW());
END//
DELIMITER ;
```

### 3.4 数据分片与归档场景

```sql
-- 基于数据时间范围的分片归档触发器
CREATE OR REPLACE FUNCTION partition_employee_data()
RETURNS TRIGGER AS $$
BEGIN
    -- 根据入职日期将数据插入不同分区表
    IF NEW.hire_date < '2020-01-01' THEN
        INSERT INTO employees_archive_2019 VALUES (NEW.*);
    ELSIF NEW.hire_date < '2021-01-01' THEN
        INSERT INTO employees_archive_2020 VALUES (NEW.*);
    ELSIF NEW.hire_date < '2022-01-01' THEN
        INSERT INTO employees_current VALUES (NEW.*);
    ELSE
        INSERT INTO employees_recent VALUES (NEW.*);
    END IF;

    RETURN NULL; -- 阻止原始插入操作
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partition_employee_instead
INSTEAD OF INSERT ON employees
FOR EACH ROW EXECUTE FUNCTION partition_employee_data();
```

## 4. 事件调度器详解

### 4.1 事件调度器基础

MySQL 事件调度器是内置的定时任务机制，类似于操作系统级的 cron 作业。

**启用事件调度器**：

```sql
-- 检查当前状态
SHOW VARIABLES LIKE 'event_scheduler';

-- 启用事件调度器（临时）
SET GLOBAL event_scheduler = ON;

-- 持久化启用（在配置文件中）
[mysqld]
event_scheduler = ON
```

### 4.2 事件创建与管理

#### 基本事件创建

```sql
-- 创建每天执行的数据清理事件
CREATE EVENT daily_data_cleanup
ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 02:00:00'
DO
    DELETE FROM session_logs WHERE created_at < NOW() - INTERVAL 30 DAY;

-- 创建单次执行事件
CREATE EVENT one_time_report
ON SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 1 HOUR
DO
    CALL generate_monthly_report();

-- 创建复杂调度事件
CREATE EVENT complex_schedule_event
ON SCHEDULE EVERY 1 WEEK
    STARTS '2025-01-01 00:00:00'
    ENDS '2025-12-31 23:59:59'
DO
    BEGIN
        UPDATE statistics SET last_updated = NOW();
        INSERT INTO audit_log (message) VALUES ('每周统计更新完成');
    END;
```

#### 事件管理操作

```sql
-- 查看所有事件
SHOW EVENTS;

-- 修改事件
ALTER EVENT daily_data_cleanup
ON SCHEDULE EVERY 2 DAY STARTS '2025-01-01 03:00:00';

-- 临时禁用事件
ALTER EVENT daily_data_cleanup DISABLE;

-- 重新启用事件
ALTER EVENT daily_data_cleanup ENABLE;

-- 删除事件
DROP EVENT IF EXISTS daily_data_cleanup;
```

### 4.3 高级事件调度示例

```sql
-- 数据备份与归档系统
DELIMITER //
CREATE EVENT intelligent_data_management
ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 23:00:00'
DO
BEGIN
    DECLARE backup_count INT;

    -- 备份当前数据
    INSERT INTO orders_backup
    SELECT * FROM orders WHERE order_date >= NOW() - INTERVAL 7 DAY;

    -- 归档过期数据（超过1年）
    INSERT INTO orders_archive
    SELECT * FROM orders WHERE order_date < NOW() - INTERVAL 1 YEAR;

    DELETE FROM orders WHERE order_date < NOW() - INTERVAL 1 YEAR;

    -- 更新统计信息
    CALL update_order_statistics();

    -- 检查备份数据完整性
    SELECT COUNT(*) INTO backup_count FROM orders_backup
    WHERE backup_date >= NOW() - INTERVAL 1 DAY;

    IF backup_count = 0 THEN
        -- 记录备份失败警告
        INSERT INTO system_warnings (warning_message, severity)
        VALUES ('每日订单备份可能失败', 'HIGH');
    END IF;

    -- 发送通知（通过调用外部程序）
    -- CALL send_notification('每日数据管理任务完成');
END//
DELIMITER ;
```

## 5. 实战应用：完整审计日志系统

### 5.1 系统设计与表结构

```sql
-- 创建审计系统表结构
CREATE TABLE audit_system (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE'),
    old_data JSON,
    new_data JSON,
    changed_by VARCHAR(128) NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    application_name VARCHAR(64)
);

-- 审计配置表
CREATE TABLE audit_config (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(64) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    audit_insert BOOLEAN DEFAULT TRUE,
    audit_update BOOLEAN DEFAULT TRUE,
    audit_delete BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 审计统计表
CREATE TABLE audit_statistics (
    statistic_date DATE PRIMARY KEY,
    total_operations INT DEFAULT 0,
    insert_count INT DEFAULT 0,
    update_count INT DEFAULT 0,
    delete_count INT DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 通用审计触发器设计

```sql
-- 创建通用的审计触发器函数（PostgreSQL 示例）
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_config_record audit_config%ROWTYPE;
BEGIN
    -- 获取审计配置
    SELECT * INTO audit_config_record
    FROM audit_config
    WHERE table_name = TG_TABLE_NAME;

    -- 检查是否启用审计
    IF audit_config_record.is_enabled THEN
        -- 根据操作类型记录审计日志
        IF TG_OP = 'INSERT' AND audit_config_record.audit_insert THEN
            INSERT INTO audit_system (
                table_name, operation_type, old_data, new_data, changed_by
            ) VALUES (
                TG_TABLE_NAME, 'INSERT', NULL, row_to_json(NEW), current_user
            );
            RETURN NEW;

        ELSIF TG_OP = 'UPDATE' AND audit_config_record.audit_update THEN
            INSERT INTO audit_system (
                table_name, operation_type, old_data, new_data, changed_by
            ) VALUES (
                TG_TABLE_NAME, 'UPDATE', row_to_json(OLD), row_to_json(NEW), current_user
            );
            RETURN NEW;

        ELSIF TG_OP = 'DELETE' AND audit_config_record.audit_delete THEN
            INSERT INTO audit_system (
                table_name, operation_type, old_data, new_data, changed_by
            ) VALUES (
                TG_TABLE_NAME, 'DELETE', row_to_json(OLD), NULL, current_user
            );
            RETURN OLD;
        END IF;
    END IF;

    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- 为关键业务表创建审计触发器
CREATE TRIGGER audit_employees
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_orders
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### 5.3 审计统计与维护事件

```sql
-- 创建审计统计维护事件
DELIMITER //
CREATE EVENT audit_system_maintenance
ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 01:00:00'
DO
BEGIN
    -- 更新审计统计
    INSERT INTO audit_statistics (
        statistic_date, total_operations, insert_count, update_count, delete_count
    )
    SELECT
        CURRENT_DATE,
        COUNT(*),
        SUM(CASE WHEN operation_type = 'INSERT' THEN 1 ELSE 0 END),
        SUM(CASE WHEN operation_type = 'UPDATE' THEN 1 ELSE 0 END),
        SUM(CASE WHEN operation_type = 'DELETE' THEN 1 ELSE 0 END)
    FROM audit_system
    WHERE changed_at >= CURRENT_DATE - INTERVAL 1 DAY
    ON DUPLICATE KEY UPDATE
        total_operations = VALUES(total_operations),
        insert_count = VALUES(insert_count),
        update_count = VALUES(update_count),
        delete_count = VALUES(delete_count),
        last_updated = NOW();

    -- 清理过期审计数据（保留2年）
    DELETE FROM audit_system
    WHERE changed_at < NOW() - INTERVAL 2 YEAR;

    -- 优化审计表
    OPTIMIZE TABLE audit_system;
END//
DELIMITER ;
```

## 6. 性能优化与最佳实践

### 6.1 触发器性能优化策略

**优化原则**：

1\. **保持触发器逻辑简洁**

```sql
-- 不推荐：复杂业务逻辑放在触发器中
CREATE TRIGGER complex_business_logic
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    -- 多个复杂的业务验证和计算
    IF (SELECT COUNT(*) FROM customer_credit WHERE customer_id = NEW.customer_id) > 10 THEN
        -- 复杂计算...
    END IF;
END;

-- 推荐：触发器只做核心验证，复杂逻辑放在存储过程
CREATE TRIGGER simple_validation
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    -- 只做必要的数据验证
    IF NEW.amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '订单金额必须大于0';
    END IF;
END;
```

2\. **避免递归触发**

```sql
-- 防止触发器循环调用
CREATE TRIGGER update_audit_trigger
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
    -- 避免更新会再次触发其他触发器的表
    UPDATE employee_statistics
    SET last_updated = NOW()
    WHERE employee_id = NEW.employee_id;
END;
```

### 6.2 事件调度器最佳实践

**资源管理策略**：

```sql
-- 错误处理与日志记录
CREATE EVENT managed_data_cleanup
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- 记录错误信息
        INSERT INTO event_error_log (event_name, error_message, occurred_at)
        VALUES ('data_cleanup', '清理过程发生错误', NOW());
        -- 可以选择继续或终止
    END;

    -- 执行实际清理操作
    DELETE FROM temporary_sessions
    WHERE created_at < NOW() - INTERVAL 4 HOUR;

    -- 记录执行日志
    INSERT INTO event_execution_log (event_name, execution_time, rows_affected)
    VALUES ('data_cleanup', NOW(), ROW_COUNT());
END;

-- 时间敏感型事件调度
CREATE EVENT business_hours_maintenance
ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 22:00:00'
COMMENT '只在业务低峰期执行维护任务'
DO
BEGIN
    -- 检查是否在业务低峰期（晚上10点到早上6点）
    IF HOUR(CURRENT_TIME) BETWEEN 22 AND 23 OR HOUR(CURRENT_TIME) BETWEEN 0 AND 6 THEN
        CALL perform_maintenance_tasks();
    END IF;
END;
```

### 6.3 安全性与维护建议

**安全实践**：

```sql
-- 权限最小化原则
-- 创建专用用户用于触发器/事件执行
CREATE USER 'db_maintenance'@'localhost' IDENTIFIED BY 'secure_password';
GRANT EXECUTE ON PROCEDURE perform_maintenance TO 'db_maintenance'@'localhost';

-- 定期审查触发器与事件
SHOW TRIGGERS;
SHOW EVENTS;

-- 检查触发器依赖关系
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'your_database';
```

**监控与诊断**：

```sql
-- 创建性能监控事件
CREATE EVENT monitor_trigger_performance
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    -- 记录触发器执行性能
    INSERT INTO trigger_performance_log (
        trigger_name, avg_execution_time, max_execution_time, sample_count
    )
    SELECT
        trigger_name,
        AVG(execution_time) as avg_time,
        MAX(execution_time) as max_time,
        COUNT(*) as sample_count
    FROM trigger_execution_stats
    WHERE execution_time > 1000  -- 只关注执行时间超过1ms的触发器
    GROUP BY trigger_name;

    -- 清理过时性能数据
    DELETE FROM trigger_execution_stats
    WHERE logged_at < NOW() - INTERVAL 7 DAY;
END;
```

## 7. 跨数据库平台兼容性

### 7.1 MySQL 与 PostgreSQL 语法对比

| 功能       | MySQL 语法                                                                    | PostgreSQL 语法                                                                                  |
| ---------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 创建触发器 | `CREATE TRIGGER name BEFORE/AFTER INSERT ON table FOR EACH ROW BEGIN ... END` | `CREATE TRIGGER name BEFORE/AFTER INSERT ON table FOR EACH ROW EXECUTE FUNCTION function_name()` |
| 事件调度   | `CREATE EVENT name ON SCHEDULE ... DO ...`                                    | 使用 `pg_cron` 扩展或操作系统级定时任务                                                          |
| 错误处理   | `DECLARE EXIT HANDLER FOR SQLEXCEPTION`                                       | `EXCEPTION WHEN others THEN`                                                                     |

### 7.2 兼容性适配示例

```sql
-- 跨平台审计触发器适配
-- MySQL 版本
DELIMITER //
CREATE TRIGGER cross_platform_audit
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, new_values, changed_by)
    VALUES ('transactions', 'INSERT',
            JSON_OBJECT('id', NEW.id, 'amount', NEW.amount),
            USER());
END//
DELIMITER ;

-- PostgreSQL 版本
CREATE OR REPLACE FUNCTION cross_platform_audit_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, new_values, changed_by)
    VALUES ('transactions', 'INSERT',
            json_build_object('id', NEW.id, 'amount', NEW.amount),
            current_user);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cross_platform_audit
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION cross_platform_audit_function();
```

## 总结

SQL 触发器和事件调度器是构建**自动化、自维护数据库系统**的强大工具。通过合理设计触发器架构、优化事件调度策略，并结合适当的监控维护机制，可以构建出高效可靠的数据库应用系统。

**关键成功因素**：

1. **适度使用**：触发器不是万能解决方案，复杂业务逻辑优先考虑应用层实现
2. **性能意识**：始终监控触发器对数据库性能的影响
3. **文档维护**：详细记录触发器和事件的业务逻辑和依赖关系
4. **测试验证**：充分测试边界条件和异常场景下的触发器行为

通过本文介绍的实践模式和最佳实践，您可以在 MySQL 和 PostgreSQL 环境中有效利用触发器和事件调度器，构建更加健壮和智能的数据库系统。
