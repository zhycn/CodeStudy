# Prettier 详解与最佳实践：打造统一的前端代码格式化工作流

- 官方网站：<https://prettier.io/>
- GitHub 仓库：<https://github.com/prettier/prettier>
- 文档：<https://prettier.io/docs/en/index.html>

## 1 Prettier 概述与核心概念

### 1.1 什么是 Prettier？

Prettier 是一款"有主见的"代码格式化工具，旨在通过自动化代码格式化过程，确保团队代码风格的一致性。它将混乱或风格不一的代码重新格式化为符合统一规范的结构，让开发者可以专注于代码逻辑而非格式风格。

与传统格式化工具不同，Prettier 具有**强制的默认配置**，这意味着它已经为大多数格式化决策提供了最优选择，只有在充分理由时才会覆盖这些默认值。这种设计哲学显著减少了团队在代码风格上的争论。

### 1.2 为什么需要 Prettier？

在前端开发中，"代码风格不一致"是常见的效率杀手。不同开发者可能有各自的编码习惯：

- **缩进差异**：有人使用 2 空格缩进，有人坚持 4 空格
- **引号偏好**：单引号与双引号的选择分歧
- **分号争议**：行尾是否应该添加分号
- **行宽限制**：代码行最大长度的不同标准

这些差异会导致代码合并时产生大量冲突，代码审查时浪费大量时间讨论格式问题。Prettier 通过强制统一格式，可以**减少团队争论，提高代码审查效率**，让开发者专注于算法优化、架构设计和边界条件处理等更有价值的工作。

### 1.3 Prettier 的工作原理

Prettier 的核心工作流程基于 **AST（抽象语法树）**：

```bash
代码输入 → 解析为 AST → 应用格式化规则 → 生成格式化代码
```

具体来说，Prettier 的工作过程分为三个步骤：

1. **解析（Parse）**：使用相应的解析器（如 Babel 解析 JavaScript）将原始代码转换为 AST
2. **遍历（Traverse）**：分析 AST 节点结构，识别各个代码元素的位置和类型
3. **打印（Print）**：根据配置规则，将 AST 重新生成为格式化的代码字符串

这个过程可以简化为数学模型：`prettier(code, config) = print(parse(code), config)`。

### 1.4 Prettier 与 ESLint 的关系

很多开发者会混淆 Prettier 和 ESLint，但它们各有专注：

- **Prettier**：负责代码**外表格式**（缩进、引号、行宽等），像"整理房间"
- **ESLint**：负责代码**内在质量**（未使用的变量、潜在错误等），像"安全检查"

两者可以完美配合：先使用 Prettier 格式化代码，再使用 ESLint 检查代码质量问题。

## 2 安装与配置

### 2.1 安装 Prettier

#### 2.1.1 项目本地安装

```bash
# 使用 npm
npm install --save-dev prettier

# 使用 yarn
yarn add --dev prettier

# 使用 pnpm
pnpm add -D prettier
```

#### 2.1.2 全局安装（不推荐）

虽然可以全局安装，但建议项目本地安装，这样可以确保所有开发者使用相同版本的 Prettier，避免因版本差异导致的格式化不一致。

### 2.2 基础配置

Prettier 支持多种配置文件格式，优先级从高到低为：

1. 文件内注释（官方不推荐）
2. `.prettierrc` 文件（JSON/YAML/JS）
3. `package.json` 中的 `prettier` 字段
4. 编辑器全局配置

**推荐使用项目级的 `.prettierrc` 文件**，以避免个人配置干扰。

#### 2.2.1 基本配置示例

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### 2.3 核心配置选项详解

#### 2.3.1 格式控制选项

| 选项 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `printWidth` | 单行最大长度 | 80 | `printWidth: 100` |
| `tabWidth` | 缩进空格数 | 2 | `tabWidth: 4` |
| `useTabs` | 使用 Tab 缩进 | false | `useTabs: true` |

**printWidth 示例对比**：

```javascript
// printWidth: 80
const message = "这是一条超级长的消息，它会在80字符后自动换行，让代码更易读";

// printWidth: 120  
const message = "这是一条超级长的消息，它会在120字符后自动换行，更适合大屏编辑器";
```

#### 2.3.2 字符与语句风格

| 选项 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `semi` | 语句末尾分号 | true | `semi: false` |
| `singleQuote` | 使用单引号 | false | `singleQuote: true` |
| `trailingComma` | 多行结构尾随逗号 | "es5" | `trailingComma: "all"` |

**semi 选项对比**：

```javascript
// semi: true
const a = 1;

// semi: false
const a = 1
```

**trailingComma 选项对比**：

```javascript
// none
const arr = [1, 2, 3]

// es5  
const obj = {
  id: 1,
  name: "Tom",
}

// all
function foo(
  a,
  b,
) {}
```

#### 2.3.3 JSX/HTML 相关选项

```json
{
  "jsxSingleQuote": false,
  "bracketSameLine": false,
  "singleAttributePerLine": false,
  "vueIndentScriptAndStyle": false,
  "htmlWhitespaceSensitivity": "css"
}
```

**bracketSameLine 示例**：

```html
<!-- false -->
<div
  class="container"
>
</div>

<!-- true -->
<div
  class="container">
</div>
```

### 2.4 高级配置技巧

#### 2.4.1 文件类型差异化配置

```javascript
// .prettierrc.js
module.exports = {
  // 基础配置
  printWidth: 80,
  tabWidth: 2,
  
  // 根据文件类型差异化配置
  overrides: [
    {
      files: "*.md",
      options: {
        printWidth: 60,  // Markdown 文件行宽更窄
        proseWrap: "always"
      }
    },
    {
      files: "*.json",
      options: {
        tabWidth: 2,
        trailingComma: "none"  // JSON 不支持尾随逗号
      }
    },
    {
      files: "*.vue",
      options: {
        htmlWhitespaceSensitivity: "ignore"
      }
    }
  ]
};
```

#### 2.4.2 动态配置

```javascript
// .prettierrc.js
module.exports = {
  // 根据环境变量动态调整
  printWidth: process.env.NODE_ENV === 'production' ? 100 : 80,
  
  // 根据项目类型调整
  singleQuote: isVueProject ? true : false,
  
  overrides: [
    {
      files: '*.test.js',
      options: {
        printWidth: 100  // 测试文件允许更宽
      }
    }
  ]
};
```

### 2.5 忽略文件配置

创建 `.prettierignore` 文件，指定不需要格式化的文件或目录：

```
# 依赖目录
node_modules/
build/
dist/
coverage/

# 配置文件
*.config.js
.env

# 文档文件
**/*.md
**/*.pdf

# 资源文件
**/*.min.js
**/*.min.css
```

## 3 使用方式与集成

### 3.1 命令行使用

#### 3.1.1 基本命令

```bash
# 格式化指定文件
npx prettier --write src/index.js

# 格式化目录下所有文件
npx prettier --write "src/**/*.{js,jsx,ts,tsx}"

# 检查代码格式（不修改）
npx prettier --check "src/**/*.js"

# 列出不符合格式的文件
npx prettier --list-different "src/**/*.js"
```

#### 3.1.2 集成到 npm scripts

在 `package.json` 中添加格式化脚本：

```json
{
  "scripts": {
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,scss,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,scss,md}\"",
    "format:debug": "prettier --debug-check ."
  }
}
```

### 3.2 编辑器集成

#### 3.2.1 VS Code 配置

1. **安装 Prettier 插件**：搜索安装 "Prettier - Code formatter"
2. **配置为默认格式化工具**：

   ```json
   {
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.formatOnSave": true,
     "editor.formatOnPaste": false,
     "prettier.requireConfig": true
   }
   ```

3. **工作区设置**：项目根目录创建 `.vscode/settings.json` 确保团队一致性

#### 3.2.2 WebStorm/IntelliJ IDEA

1. **打开设置**：File > Settings > Languages & Frameworks > JavaScript > Prettier
2. **指定 Prettier 包路径**：通常为 `node_modules/.bin/prettier`
3. **启用保存时格式化**：勾选 "On 'Reformat Code' action"

#### 3.2.3 Sublime Text

1. **安装 Package Control**（如未安装）
2. **安装 Prettier 插件**：通过 Package Control 安装
3. **配置快捷键**：添加自定义键绑定实现保存时格式化

### 3.3 版本控制集成

#### 3.3.1 Git Hooks 自动格式化

使用 Husky 和 lint-staged 实现提交前自动格式化：

```bash
# 安装依赖
npm install --save-dev husky lint-staged
```

配置 `package.json`：

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json,css,scss,md,vue}": [
      "prettier --write",
      "eslint --fix",
      "git add"
    ]
  }
}
```

#### 3.3.2 分阶段格式化策略

对于大型项目或历史遗留代码，建议分阶段实施格式化：

```bash
# 1. 检查格式差异
npx prettier --list-different .

# 2. 分批格式化（按目录或文件类型）
npx prettier --write "src/components/**/*.js"

# 3. 专门提交格式化变更
git add -p
git commit -m "chore: format codebase [skip ci]"
```

### 3.4 持续集成（CI）集成

在 CI/CD 流程中添加格式检查，确保代码质量：

```yaml
# .github/workflows/prettier.yml
name: Prettier Check
on: [push, pull_request]
jobs:
  prettier:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Check formatting
        run: npx prettier --check .
```

## 4 与其它工具集成

### 4.1 与 ESLint 集成

#### 4.1.1 避免规则冲突

ESLint 包含一些与代码格式相关的规则，这些会与 Prettier 冲突。解决方案：

```bash
# 安装集成包
npm install --save-dev eslint-config-prettier eslint-plugin-prettier
```

#### 4.1.2 配置 ESLint

在 `.eslintrc.js` 中配置：

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended'  // 必须放在最后
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    // 禁用与 Prettier 冲突的规则
    'indent': 'off',
    'quotes': 'off',
    'semi': 'off'
  }
};
```

#### 4.1.3 专用配置（推荐）

创建专门的 Prettier 配置：

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    // 专门用于关闭所有不必要或可能与 Prettier 冲突的规则
    'prettier'  
  ],
  rules: {
    // 你的其他 ESLint 规则
  }
};
```

### 4.2 与 Stylelint 集成

对于 CSS/SCSS 文件，Prettier 与 Stylelint 也需要协同工作：

```json
{
  "overrides": [
    {
      "files": ["*.{css,scss}"],
      "options": {
        "parser": "css"
      }
    }
  ]
}
```

安装样式相关的集成包：

```bash
npm install --save-dev stylelint-config-prettier
```

在 `.stylelintrc.js` 中配置：

```javascript
module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier'  // 关闭冲突规则
  ]
};
```

### 4.3 与框架和库的集成

#### 4.3.1 Vue.js 项目

```json
{
  "singleQuote": true,
  "semi": false,
  "vueIndentScriptAndStyle": true,
  "singleAttributePerLine": true,
  "overrides": [
    {
      "files": "*.vue",
      "options": {
        "parser": "vue"
      }
    }
  ]
}
```

#### 4.3.2 React/TypeScript 项目

```json
{
  "singleQuote": true,
  "jsxSingleQuote": true,
  "trailingComma": "all",
  "bracketSameLine": false,
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "options": {
        "parser": "typescript"
      }
    }
  ]
}
```

#### 4.3.3 Angular 项目

```json
{
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "angular",
        "htmlWhitespaceSensitivity": "ignore"
      }
    }
  ],
  "plugins": ["@prettier/plugin-pug"]
}
```

## 5 最佳实践与优化策略

### 5.1 团队协作最佳实践

#### 5.1.1 统一团队配置

1. **共享配置文件**：在团队内共享统一的 `.prettierrc` 配置
2. **版本锁定**：固定 Prettier 版本，避免不同版本格式化差异

   ```json
   {
     "devDependencies": {
       "prettier": "2.8.8"
     }
   }
   ```

3. **文档化配置决策**：在 README 中记录重要的配置选择理由

#### 5.1.2 新人上手流程

```markdown
# 团队 Prettier 使用指南

## 1. 开发环境设置
- 安装 VS Code 和 Prettier 插件
- 克隆项目并运行 `npm install`
- 验证配置：运行 `npm run format:check`

## 2. 日常开发流程
- 代码修改后保存自动格式化
- 提交前会自动格式化暂存区文件
- 如遇到格式化问题，查看项目 Prettier 配置

## 3. 常见问题排查
- 格式化不生效：检查编辑器默认格式化器设置
- 规则冲突：确保已安装并配置 eslint-config-prettier
- 文件被忽略：检查 .prettierignore 配置
```

### 5.2 性能优化策略

#### 5.2.1 增量格式化

对于大型项目，避免全量格式化：

```bash
# 只格式化修改过的文件
git diff --name-only --cached | grep '\.\(js\|jsx\|ts\|tsx\|json\|css\|scss\|md\)$' | xargs npx prettier --write

# 或者使用 lint-staged（推荐）
npx lint-staged
```

#### 5.2.2 缓存机制

Prettier 支持缓存以提高性能：

```bash
# 启用缓存
npx prettier --write --cache .

# 清除缓存
npx prettier --write --cache --cache-location ./node_modules/.cache/prettier .
```

#### 5.2.3 并行处理

大型项目可以分目录并行格式化：

```bash
# 并行格式化不同模块
npx prettier --write "src/module1/**/*.js" &
npx prettier --write "src/module2/**/*.js" &
wait
```

### 5.3 常见问题与解决方案

#### 5.3.1 格式化冲突问题

**问题**：Prettier 与其它工具（如 Babel）冲突

**解决方案**：

```json
{
  "overrides": [
    {
      "files": "*.js",
      "options": {
        "parser": "babel-ts"
      }
    }
  ]
}
```

#### 5.3.2 HTML/模板格式化异常

**问题**：Vue/Svelte 模板中的 HTML 被错误格式化

**解决方案**：

```json
{
  "embeddedLanguageFormatting": "auto",
  "htmlWhitespaceSensitivity": "css"
}
```

#### 5.3.3 JSON 文件尾随逗号

**问题**：JSON 文件格式化后出现尾随逗号，导致解析失败

**解决方案**：

```json
{
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "trailingComma": "none"
      }
    }
  ]
}
```

#### 5.3.4 注释格式化问题

**问题**：重要注释被意外修改或删除

**解决方案**：

```javascript
// prettier-ignore
const matrix = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
];
```

### 5.4 迁移策略

#### 5.4.1 现有项目迁移

对于已有代码库，采用渐进式迁移策略：

1. **初始阶段**：只对新增文件格式化，添加 `// prettier-ignore` 暂时忽略复杂文件
2. **分模块迁移**：按功能模块分批格式化，减少大规模变更影响
3. **全员切换**：所有文件格式化后，启用严格的 CI 检查

#### 5.4.2 版本升级策略

Prettier 主要版本升级可能带来格式化变化：

1. **测试环境验证**：先在测试分支验证新版本格式化效果
2. **团队沟通**：告知团队可能的格式变化，获得认可
3. **锁定版本**：升级后锁定新版本，确保一致性

## 6 总结

Prettier 已经成为现代前端开发中不可或缺的工具，它通过自动化代码格式化，显著提高了团队协作效率和代码质量。关键在于建立"提交即格式化"的团队文化，让代码格式化成为开发流程的自然组成部分。

**核心原则回顾**：

- **配置 > 记忆规则**：通过配置文件统一规则，减少记忆负担
- **自动化 > 手动调整**：集成到编辑器和 Git 工作流中
- **团队共识 > 个人偏好**：格式选择应以团队效率为重，而非个人喜好

通过合理配置和团队协作，Prettier 能够帮助团队产出**一致性高、可读性好、易于维护**的代码，让开发者可以专注于解决真正的业务问题而非代码格式争论。
