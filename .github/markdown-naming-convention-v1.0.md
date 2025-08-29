# Markdown 文档命名规范 (v1.0)

## 1. 概述

本规范旨在建立一套统一的、清晰且可扩展的 Markdown (`.md`) 文件命名规则。规范的命名有助于：

- **提高可读性**：通过文件名快速了解文档内容和属性
- **便于检索**：优化文件的排序和搜索效率
- **标准统一**：建立统一的命名标准，提高协作效率
- **自动化友好**：支持自动化处理和工具集成

## 2. 命名规则基础结构

基础命名结构：

`[类型]-[描述]-[版本].md`

### 2.1 文档类型 (必选)

- **格式**：简短的类型标识符
- **目的**：快速识别文档的基本属性
- **示例**：
  - `doc` - 文档 (Document)
  - `guide` - 指南 (Guide)
  - `note` - 笔记 (Note)
  - `spec` - 规范 (Specification)
  - `report` - 报告 (Report)
  - `ref` - 参考 (Reference)
  - `api` - 接口文档 (API)
  - `blog` - 博客 (Blog)
  - `changelog` - 变更日志 (Changelog)
  - `code` - 代码 (Code)
  - `config` - 配置文件 (Configuration)
  - `contract` - 合同 (Contract)
  - `data` - 数据 (Data)
  - `design` - 设计文档 (Design)
  - `diagram` - 图表 (Diagram)
  - `example` - 示例 (Example)
  - `test` - 测试 (Test)
  - `todo` - 待办事项 (Todo)
  - `wiki` - 知识库 (Wiki)
  - `readme` - 自述文件 (Readme)
  - `license` - 许可证 (License)

### 2.2 描述性内容 (必选)

- **格式**：使用短横线 (`-`) 连接的英文单词，全小写
- **目的**：准确描述文档的具体内容
- **示例**：`user-authentication`, `api-endpoints`, `coding-standards`

### 2.3 版本标识 (可选)

- **格式**：`v数字` 或状态标识
- **示例**：`v1.0`, `draft`, `final`

## 3. 命名示例

1. **技术文档**
   - `doc-api-authentication-v1.0.md`
   - `spec-database-schema-v2.1.md`
   - `guide-deployment-process.md`

2. **项目文档**
   - `spec-project-structure.md`
   - `doc-release-notes-v1.2.md`
   - `report-performance-analysis.md`

3. **通用文档**
   - `guide-markdown-syntax.md`
   - `doc-best-practices.md`
   - `note-meeting-summary.md`

## 4. 命名规则

1. **命名原则**
   - 使用英文命名
   - 全部小写字母
   - 使用短横线 (`-`) 连接单词
   - 避免特殊字符
   - 保持简洁明了

2. **长度控制**
   - 建议总长度不超过 40 个字符
   - 每个部分尽量使用 1-3 个单词

3. **禁止使用**
   - 空格
   - 特殊字符
   - 非ASCII字符
   - 操作系统保留字

## 5. 最佳实践

1. **保持一致性**
   - 在整个项目中统一使用相同的命名模式
   - 为常用文档类型建立标准前缀

2. **版本控制**
   - 重要文档建议包含版本号
   - 版本号使用语义化版本规范

3. **目录组织**
   - 按文档类型或模块创建子目录
   - 相关文档放在同一目录下

## 6. 总结

本规范提供了一个简单、清晰且易于执行的文档命名方案。通过采用 `类型-描述-版本` 的结构，可以有效组织和管理各类 Markdown 文档。根据实际需求，可以灵活调整和扩展这个基础框架。

---

**修订历史**：

| 版本 | 日期       | 描述         | 作者  |
| :--- | :--------- | :----------- | :---- |
| v1.0 | 2025-08-29 | 初始版本创建 | zhycn |
