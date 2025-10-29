# TypeScript 完整学习路径

## 概述

本文档是基于 TypeScript 5.9 官方文档整理的完整学习路径，旨在为学习者提供系统化的 TypeScript 知识体系。

- 官方网站：<https://www.typescriptlang.org/>
- 官方文档：<https://www.typescriptlang.org/docs/>
- 下载与安装：<https://www.typescriptlang.org/download/>
- 用户手册： <https://www.typescriptlang.org/docs/handbook/intro.html>

## 基础入门

- [TypeScript 5 新特性详解与最佳实践](typescript-5-features.md)
  - const 类型参数
  - satisfies操作符
  - 装饰器标准演进
  - 模块解析改进
  - 性能优化特性

- [TypeScript 与 JavaScript 的区别？为什么要使用 TypeScript?](typescript-why.md)
  - TypeScript 的设计理念和目标
  - 静态类型与动态类型的对比
  - 类型安全带来的优势
  - 开发效率与维护成本的权衡

- [TypeScript 简介和核心特性概述](typescript-introduction.md)
  - TypeScript 发展历史
  - 核心特性概述
  - 生态系统支持
  - 适用场景分析

- [TypeScript 安装指南](typescript-install.md)
  - 通过 npm 安装 TypeScript
  - 全局安装与项目本地安装
  - 编辑器扩展配置
  - 验证安装成功

## 基础语法与类型系统

- [TypeScript 基础语法详解与最佳实践](typescript-basic.md)
  - 文件扩展名(.ts, .tsx)
  - 语句和表达式
  - 代码注释规范
  - 基础语法规则

- [TypeScript 基本结构详解与最佳实践](typescript-basic-structure.md)
  - 模块化组织
  - 命名空间基础
  - 代码分割策略
  - 文件依赖管理

- [TypeScript 基础类型详解与最佳实践](typescript-basic-types.md)
  - 原始类型：number, string, boolean
  - 空类型：null, undefined
  - 特殊类型：any, unknown, never, void
  - 类型注解语法

- [TypeScript 关键字完整指南](typescript-keywords.md)
  - 类型关键字：type, interface, enum
  - 变量声明：let, const, var
  - 访问控制：public, private, protected
  - 其他关键字：readonly, static, abstract

- [TypeScript 变量声明详解与最佳实践](typescript-variable-declaration.md)
  - 变量声明方式对比
  - 作用域规则
  - 暂时性死区
  - 声明提升现象

## 运算符与控制流

- [TypeScript 运算符详解与最佳实践](typescript-operators.md)
  - 算术运算符
  - 比较运算符
  - 逻辑运算符
  - 类型运算符：typeof, instanceof

- [TypeScript 控制流语句详解与最佳实践](typescript-control-flow.md)
  - 条件语句：if, else, switch
  - 异常处理：try, catch, finally
  - 断言语句
  - 控制流分析

- [TypeScript 循环语句详解与最佳实践](typescript-loops.md)
  - for 循环的各种形式
  - while 和 do-while 循环
  - 循环控制：break, continue
  - 迭代性能考虑

## 函数与对象系统

- [TypeScript 函数详解与最佳实践](typescript-functions.md)
  - 函数声明与表达式
  - 参数类型注解
  - 返回值类型
  - 函数重载

- [TypeScript 类详解与最佳实践](typescript-classes.md)
  - 类定义语法
  - 构造函数
  - 继承机制
  - 抽象类

- [TypeScript 对象详解与最佳实践](typescript-objects.md)
  - 对象字面量
  - 属性修饰符
  - 方法定义
  - 对象展开

## 内置对象与数据类型

- [TypeScript Number 详解与最佳实践](typescript-number.md)
  - 数字类型特性
  - 数学运算
  - 精度问题处理
  - 大整数支持

- [TypeScript String 详解与最佳实践](typescript-string.md)
  - 字符串操作
  - 模板字符串
  - 字符串字面量类型
  - 国际化考虑

- [TypeScript Array 详解与最佳实践](typescript-array.md)
  - 数组类型定义
  - 数组方法类型安全
  - 元组类型
  - 只读数组

- [TypeScript Map 详解与最佳实践](typescript-map.md)
  - Map 对象类型
  - WeakMap 使用场景
  - 与普通对象对比
  - 性能考虑

- [TypeScript 元组 详解与最佳实践](typescript-tuples.md)
  - 元组类型定义
  - 可选元素和剩余元素
  - 只读元组
  - 应用场景

- [TypeScript Symbol 详解与最佳实践](typescript-symbol.md)
  - Symbol 创建和使用
  - 全局 Symbol 注册表
  - 内置 Symbol 值
  - 使用场景分析

## 高级类型系统

- [TypeScript 联合类型 详解与最佳实践](typescript-union-types.md)
  - 联合类型语法
  - 类型收窄策略
  - 可辨别联合
  - 应用模式

- [TypeScript 类型系统详解与最佳实践](typescript-type-system.md)
  - 类型兼容性
  - 结构化类型系统
  - 类型推断机制
  - 类型检查配置

- [TypeScript 接口与类型别名详解与最佳实践](typescript-interfaces.md)
  - 接口定义语法
  - 可选属性和只读属性
  - 函数类型接口
  - 索引签名

- [TypeScript 函数类型详解与最佳实践](typescript-function-types.md)
  - 函数类型表达式
  - 调用签名
  - 构造签名
  - 泛型函数类型

- [TypeScript 泛型详解与最佳实践](typescript-generics.md)
  - 泛型基础
  - 泛型约束
  - 泛型默认类型
  - 条件类型

- [TypeScript 枚举与常量枚举详解与最佳实践](typescript-enums.md)
  - 数字枚举和字符串枚举
  - 常量枚举优化
  - 枚举使用最佳实践
  - 替代方案考虑

## 类型操作与高级特性

- [TypeScript 类型断言与类型守卫详解与最佳实践](typescript-type-assertions.md)
  - 类型断言语法
  - 非空断言
  - 类型守卫函数
  - 断言签名

- [TypeScript 类型兼容性与类型断言详解与最佳实践](typescript-type-compatibility.md)
  - 结构化类型原理
  - 函数参数双向协变
  - 泛型兼容性
  - 配置选项影响

- [TypeScript 类型推断机制详解与最佳实践](typescript-type-inference.md)
  - 上下文类型推断
  - 最佳公共类型推断
  - 配置选项影响
  - 推断限制

- [TypeScript 结构化类型详解与最佳实践](typescript-structural-types.md)
  - 鸭子类型概念
  - 接口兼容性规则
  - 类实例兼容性
  - 泛型结构兼容

- [TypeScript 类型擦除详解与最佳实践](typescript-type-erasure.md)
  - 编译时类型移除
  - 运行时类型信息
  - 反射元数据
  - 设计考虑

## 迭代与异步编程

- [TypeScript 迭代器与生成器详解与最佳实践](typescript-iterators.md)
  - 可迭代协议
  - 迭代器协议
  - 生成器函数类型
  - 异步迭代器

- [TypeScript 异步与 Promise 详解与最佳实践](typescript-async.md)
  - Promise 类型定义
  - async/await 类型
  - 错误处理策略
  - 并发控制

## 模块与工程化

- [TypeScript 模块与命名空间详解与最佳实践](typescript-modules.md)
  - ES 模块系统
  - 命名空间组织
  - 模块解析策略
  - 路径映射配置

- [TypeScript 声明合并详解与最佳实践](typescript-declaration-merging.md)
  - 接口合并规则
  - 命名空间合并
  - 模块扩展
  - 全局扩展

- [TypeScript 声明文件（.d.ts）详解与最佳实践](typescript-d-ts.md)
  - .d.ts 文件编写
  - 第三方库类型定义
  - 模块声明
  - 全局声明

- [TypeScript Utility Types 详解与最佳实践](typescript-utility-types.md)
  - 内置工具类型
  - 条件类型工具
  - 字符串操作类型
  - 自定义工具类型

## 编译器与配置

- [TypeScript Compiler 编译器使用详解与最佳实践](typescript-compiler.md)
  - tsc 命令行用法
  - 编译选项详解
  - 增量编译
  - 项目引用

- [TypeScript TSConfig 配置详解与最佳实践](typescript-tsconfig.md)
  - 配置文件结构
  - 重要配置选项
  - 环境配置
  - 多项目配置

- [TypeScript 项目配置详解与最佳实践](typescript-project-configuration.md)
  - 项目结构规划
  - 依赖管理
  - 构建配置
  - 部署考虑

## 开发工具与性能

- [TypeScript 编辑器集成（VSCode）详解与最佳实践](typescript-editor-integration.md)
  - VSCode 配置
  - 调试配置
  - 代码导航
  - 重构工具

- [TypeScript 性能优化详解与最佳实践](typescript-performance.md)
  - 编译性能优化
  - 类型检查优化
  - 运行时性能
  - 内存使用优化

## 装饰器与元编程

- [TypeScript 装饰器详解与最佳实践](typescript-decorators.md)
  - 装饰器语法
  - 类装饰器
  - 方法装饰器
  - 属性装饰器
  - 参数装饰器
  - 装饰器工厂
  - 元数据反射
