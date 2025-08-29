# Prettier 详解与最佳实践

官方网站：<https://prettier.io/>

## 1. Prettier 简介与核心概念

Prettier 是一款流行的**代码格式化工具**，由Facebook于2017年推出，专为解决开发团队中代码风格不一致的问题而设计。它通过**强制实施一致的代码风格**，使开发者能够专注于代码质量而非格式问题，从而显著提高团队协作效率和代码可维护性。

### 1.1 核心工作原理

Prettier 的工作流程基于 **AST（抽象语法树）** 技术，其处理过程可以分为三个关键步骤：

1. **解析（Parse）**：将原始代码解析为AST
2. **处理（Process）**：基于AST结构分析代码结构
3. **打印（Print）**：根据配置规则重新生成格式化的代码

这种独特的工作机制使Prettier能够**完全忽略原始代码的格式**，而是根据解析后的抽象语法树和预设规则重新生成统一风格的代码。这与传统的linter工具有本质区别，后者通常基于正则表达式和模式匹配进行工作。

### 1.2 Prettier 与 ESLint 的对比

许多开发者困惑于Prettier和ESLint的角色区别。以下是它们的核心差异：

| **特性** | **Prettier** | **ESLint** |
| :--- | :--- | :--- |
| **主要关注点** | 代码格式与风格 | 代码质量与错误预防 |
| **处理方式** | 重写代码格式 | 报告规则违规 |
| **可配置性** | 有限且一致的选项 | 高度可配置 |
| **修复能力** | 完全格式化 | 部分自动修复 |
| **适用语言** | 多语言支持 | 主要JavaScript/TS |

简单来说，**Prettier管外表"（格式）**，像"整理房间"，确保所有东西摆放整齐（缩进、引号、行宽）；**ESLint管"内在"（质量）**，像"管家"，检查有没有危险物品（如未使用的变量）、有没有违规行为。

## 2. 安装与基本配置

### 2.1 安装方法

Prettier 可以通过多种方式安装，最常用的是通过npm或yarn：

::: code-group

```bash [npm]
# 使用 npm 安装
npm install --save-dev --save-exact prettier
```

```bash [yarn]
# 使用 yarn 安装
yarn add --dev --exact prettier
```

```bash [pnpm]
## 使用 pnpm 安装
pnpm add --save-dev --save-exact prettier
```

```bash [bun]
## 使用 bun 安装
bun add --dev --exact prettier
```

:::

### 2.2 配置文件详解

Prettier 支持多种配置文件格式，允许开发者根据项目需求定制格式化规则。支持的文件格式包括：

- `.prettierrc`（JSON或YAML）
- `.prettierrc.json`
- `.prettierrc.js`
- `.prettierrc.toml`
- `package.json` 中的 `prettier` 字段

以下是一个典型的Prettier配置文件示例：

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "proseWrap": "preserve"
}
```

2.3 执行格式化命令

::: code-group

```bash [npm]
npx prettier . --write
```

```bash [yarn]
yarn exec prettier . --write
```

```bash [pnpm]
pnpm exec prettier . --write
```

```bash [bun]
bunx prettier . --write
```

:::

## 3. 核心配置详解

### 3.1 代码格式规则

Prettier 提供了丰富的配置选项来控制代码格式化的各个方面。以下是一些最常用的配置选项及其作用：

- **semi**：控制是否在语句末尾添加分号（默认：true）
- **singleQuote**：控制是否使用单引号替代双引号（默认：false）
- **tabWidth**：指定每个缩进级别的空格数（默认：2）
- **useTabs**：控制是否使用制表符代替空格进行缩进（默认：false）
- **printWidth**：指定行的最大长度（默认：80）
- **trailingComma**：控制多行结构是否在最后一行添加尾随逗号（默认："es5"）
- **bracketSpacing**：控制对象字面量中的括号间是否添加空格（默认：true）
- **jsxSingleQuote**：控制JSX属性是否使用单引号（默认：false）
- **arrowParens**：控制箭头函数参数是否添加括号（默认："avoid"）
- **endOfLine**：指定换行符类型（可选："lf"、"crlf"、"cr"、"auto"）

### 3.2 语言解析器配置

Prettier 会自动根据文件类型选择适当的解析器，但您也可以显式配置解析器：

```javascript
// 显式配置解析器示例
module.exports = {
  overrides: [
    {
      files: "*.js",
      options: {
        parser: "babel"
      }
    },
    {
      files: "*.ts",
      options: {
        parser: "typescript"
      }
    },
    {
      files: "*.json",
      options: {
        parser: "json"
      }
    },
    {
      files: "*.vue",
      options: {
        parser: "vue"
      }
    }
  ]
};
```

### 3.3 覆盖规则

Prettier 允许您为不同的文件类型或目录定义不同的规则：

```json
{
  "semi": true,
  "overrides": [
    {
      "files": "*.test.js",
      "options": {
        "semi": false
      }
    },
    {
      "files": ["*.html", "legacy/**/*.js"],
      "options": {
        "tabWidth": 4
      }
    }
  ]
}
```

## 4. 与 ESLint 整合

### 4.1 解决规则冲突

当同时使用 Prettier 和 ESLint 时，可能会遇到规则冲突。解决方案是使用 `eslint-config-prettier` 来禁用 ESLint 中与 Prettier 冲突的规则：

```bash
# 安装必要的依赖
npm install --save-dev eslint-config-prettier eslint-plugin-prettier
```

### 4.2 配置示例

以下是整合 Prettier 和 ESLint 的完整配置示例：

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    'prettier', // 确保这是最后一个扩展
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-var': 'error',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  }
};
```

```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf'
};
```

## 5. 自动化与 Git 钩子集成

### 5.1 使用 Husky 和 lint-staged

为了确保代码在提交前自动格式化，可以配置 Git 钩子：

```bash
# 安装必要的工具
npm install --save-dev husky lint-staged
```

### 5.2 配置 package.json

在 package.json 中添加以下配置：

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx,vue}": [
      "prettier --write",
      "eslint --fix",
      "git add"
    ],
    "*.{json,md,html,css,scss,less}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### 5.3 替代配置方式

除了在 package.json 中配置，还可以使用单独的配置文件：

```javascript
// .lintstagedrc.js
module.exports = {
  '*.{js,jsx,ts,tsx}': files => [
    `npx prettier --write ${files.join(' ')}`,
    `npx eslint --fix ${files.join(' ')}`,
    `git add ${files.join(' ')}`
  ],
  '*.{json,md,html,css,scss,less}': files => [
    `npx prettier --write ${files.join(' ')}`,
    `git add ${files.join(' ')}`
  ]
};
```

## 6. 最佳实践与团队协作

### 6.1 项目配置策略

1. **统一团队配置**：确保所有开发者使用相同的Prettier配置，可以通过在项目中共享`.prettierrc`文件实现。
2. **版本控制**：将Prettier配置纳入版本控制，确保所有团队成员使用相同的规则。
3. **文档化配置决策**：对特殊配置选择添加注释说明原因，例如：

    ```json
    {
      "arrowParens": "avoid",
      // 使用"avoid"更符合JavaScript社区的普遍风格
      // 但TypeScript项目可能更喜欢"always"
    }
    ```

### 6.2 IDE 集成与编辑器配置

为了获得最佳的开发体验，建议配置编辑器在保存时自动格式化：

```json
// VS Code 的 .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "prettier.requireConfig": true,
  // 尊重项目中的Prettier配置
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### 6.3 CI/CD 集成

在持续集成流程中添加格式检查，确保代码质量：

```yaml
# GitHub Actions 示例
name: Code Check
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Dependencies
        run: npm install
      - name: Check Formatting
        run: npx prettier --check "src/**/*.{js,ts,jsx,tsx,vue}"
      - name: Run Linter
        run: npx eslint "src/**/*.{js,ts,jsx,tsx,vue}"
```

### 6.4 大型项目中的渐进式采用

对于已有的大型代码库，可以采用渐进式方式引入Prettier：

1. **逐步迁移**：先从新代码开始，然后逐步重构旧代码。
2. **分区配置**：使用overrides配置为不同部分代码设置不同规则。
3. **专用提交**：创建专门的提交只进行格式化更改，便于代码审查。

```json
{
  "overrides": [
    {
      "files": ["src/legacy/**/*.js"],
      "options": {
        "printWidth": 100,
        "tabWidth": 4,
        "semi": true
      }
    },
    {
      "files": ["src/modern/**/*.js"],
      "options": {
        "printWidth": 80,
        "tabWidth": 2,
        "semi": false
      }
    }
  ]
}
```

## 7. 总结与未来展望

Prettier 已经成为现代前端开发中不可或缺的工具，它通过**强制实施一致的代码风格**，显著提高了团队协作效率和代码可维护性。通过本文介绍的配置方案、整合方法和最佳实践，您可以在项目中充分发挥 Prettier 的优势。

随着前端工程的不断发展，Prettier 也在持续进化。未来我们可以期待更多语言支持、更智能的格式化选项以及与其他工具更深入的集成。无论您是从个人项目还是大型企业级应用开始使用 Prettier，遵循本文的最佳实践都将帮助您创建更整洁、更一致的代码库。

### 7.1 关键优势总结

1. **一致性**：强制实施统一的代码风格，减少团队争议。
2. **生产力**：节省讨论代码格式的时间，专注于逻辑和架构。
3. **质量保障**：与现有工具链集成，确保代码质量。
4. **灵活性**：支持多种配置方式和覆盖规则，适应不同项目需求。

### 7.2 入门建议

对于刚刚开始使用 Prettier 的团队，建议采用以下步骤：

1. 从小处开始，先在个人项目或新项目中试用。
2. 团队讨论并确定基础配置规则。
3. 配置编辑器和Git钩子实现自动化格式化。
4. 逐步将Prettier集成到CI/CD流程中。
5. 定期回顾和更新配置，适应项目演进。

通过遵循这些步骤和本文中的最佳实践，您将能够充分利用 Prettier 的优势，提升代码质量和开发效率。
