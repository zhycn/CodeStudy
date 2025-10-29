---
title: Stylelint 详解与最佳实践：提升前端样式代码质量
description: 本文详细介绍了 Stylelint 框架的核心概念、工作原理、性能优化策略以及最佳实践。通过学习本文，你将能够理解 Stylelint 的设计哲学、使用场景以及如何在实际项目中应用 Stylelint 来构建可靠的样式代码质量保障体系。
---

# Stylelint 详解与最佳实践：提升前端样式代码质量

- 官方网站：<https://stylelint.io/>
- GitHub 仓库：<https://github.com/stylelint/stylelint>

## 1. Stylelint 简介

**Stylelint** 是一个强大、先进的 CSS 代码检查器（linter），它帮助开发者规避 CSS 代码中的错误并保持一致的编码风格。与 ESLint 类似，Stylelint 通过定义一系列编码风格规则来保证样式代码的质量和一致性。

### 1.1 核心价值

Stylelint 的强大功能体现在以下几个层面：

- **错误检查**：检测无效的 CSS 语法、错误的网格定义、重复的选择器等
- **规范执行**：禁止特定内容（如某些数值单位）、强制命名约定、设置边界限制
- **自动修复**：自动修复大多数代码格式问题
- **扩展性**：支持插件机制创建自定义规则，支持共享配置

### 1.2 技术特性

Stylelint 的技术优势包括：

- 拥有超过 **170 条内置规则**，覆盖最新的 CSS 语法和特性
- 支持 **CSS 预处理器**，如 SCSS、Sass、Less 和 SugarSS
- 能够从 **HTML、Markdown 和 CSS-in-JS** 中提取内嵌样式代码
- 经过 **15,000+ 单元测试**，保证工具稳定性
- 被 **Google、GitHub** 等大型公司采用

## 2. 安装与基础配置

### 2.1 环境准备

开始使用 Stylelint 前，确保您的项目已初始化并安装了 Node.js 环境。

### 2.2 基本安装

对于标准的 CSS 项目，推荐安装 Stylelint 和官方标准配置：

```bash
npm install --save-dev stylelint stylelint-config-standard
```

如果希望使用推荐配置（包含较少的规则，适合初学者）：

```bash
npm install --save-dev stylelint stylelint-config-recommended
```

### 2.3 配置文件

Stylelint 支持多种配置方式，按以下优先级顺序查找：

1. `package.json` 中的 `stylelint` 属性
2. `.stylelintrc` 文件（支持 JSON、YAML、JS 格式）
3. `.stylelintrc.json`、`.stylelintrc.yaml`、`.stylelintrc.yml` 或 `.stylelintrc.js`
4. `stylelint.config.js` 或 `stylelint.config.cjs`（用于 ES 模块项目）

推荐使用 `stylelint.config.js` 作为配置文件，因为它提供最好的类型支持和灵活性：

```javascript
/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // 项目特定规则
  },
};
```

### 2.4 运行检查

在 `package.json` 中添加检查脚本：

```json
{
  "scripts": {
    "lint:css": "stylelint \"**/*.css\"",
    "lint:css:fix": "stylelint \"**/*.css\" --fix"
  }
}
```

运行检查：

```bash
# 检查代码
npm run lint:css

# 自动修复可修复的问题
npm run lint:css:fix
```

## 3. 核心配置详解

### 3.1 配置文件结构

完整的 Stylelint 配置文件包含以下核心部分：

```javascript
/** @type {import('stylelint').Config} */
export default {
  // 扩展基础配置
  extends: [],
  // 自定义插件
  plugins: [],
  // 规则配置
  rules: {},
  // 语言选项
  languageOptions: {},
  // 文件忽略配置
  ignoreFiles: [],
  // 覆盖特定文件的配置
  overrides: [],
  // 默认严重级别
  defaultSeverity: 'error',
};
```

### 3.2 配置继承（extends）

使用 `extends` 可以继承现有配置，这是保持配置简洁的最佳实践：

```javascript
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier', // 兼容 Prettier
  ],
  rules: {
    // 项目特定的规则覆盖
  },
};
```

配置继承的优先级体系：

| 配置来源         | 优先级 | 说明                         |
| ---------------- | ------ | ---------------------------- |
| 当前配置的 rules | 最高   | 直接定义的规则具有最高优先级 |
| 最后扩展的配置   | 高     | 数组后面的配置覆盖前面的     |
| 中间扩展的配置   | 中     | 按扩展顺序依次应用           |
| 最先扩展的配置   | 低     | 数组开头的配置优先级最低     |

### 3.3 规则配置（rules）

规则配置是 Stylelint 的核心。每个规则支持三种配置格式：

```javascript
export default {
  rules: {
    // 1. 禁用规则
    'rule-name': null,

    // 2. 启用规则（仅主选项）
    'rule-name': primaryOption,

    // 3. 启用规则（主选项 + 次选项）
    'rule-name': [primaryOption, secondaryOptions],
  },
};
```

**常用规则示例**：

```javascript
export default {
  rules: {
    // 颜色相关规则
    'color-hex-case': 'lower', // 十六进制颜色小写
    'color-hex-length': 'short', // 使用缩写的十六进制颜色
    'color-no-invalid-hex': true, // 禁止无效的十六进制颜色

    // 字体相关
    'font-family-no-missing-generic-family-keyword': true, // 字体系列包含通用族类

    // 单位相关
    'unit-no-unknown': true, // 禁止未知单位
    'unit-allowed-list': ['em', 'rem', '%', 's'], // 允许的单位列表

    // 选择器
    'selector-class-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$', // 类名必须kebab-case

    // 声明块
    'declaration-block-trailing-semicolon': 'always', // 声明块尾部分号
    'block-no-empty': true, // 禁止空块

    // 数字
    'number-leading-zero': 'always', // 小数前导零
  },
};
```

### 3.4 高级规则配置

Stylelint 支持更精细的规则配置选项：

```javascript
export default {
  rules: {
    // 自定义错误消息
    'custom-property-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
      {
        message: '自定义属性名称必须使用kebab-case格式',
      },
    ],

    // 控制严重级别
    'number-max-precision': [
      2,
      {
        ignoreUnits: ['em'],
        severity: 'warning', // 或 "error"
      },
    ],

    // 禁用自动修复
    'color-function-notation': ['modern', { disableFix: true }],

    // 报告禁用注释
    'color-no-invalid-hex': [true, { reportDisables: true }],
  },
};
```

### 3.5 插件系统（plugins）

插件可以扩展 Stylelint 的功能，支持非标准 CSS 特性或特定用例：

```javascript
export default {
  plugins: [
    'stylelint-scss', // SCSS 支持
    'stylelint-order', // 属性排序
  ],
  rules: {
    // SCSS 规则
    'scss/dollar-variable-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'scss/at-rule-no-unknown': true,

    // 排序规则
    'order/order': ['custom-properties', 'dollar-variables', 'declarations', 'rules', 'at-rules'],
    'order/properties-order': [
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'display',
      'float',
      'width',
      'height',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
    ],
  },
};
```

### 3.6 文件覆盖（overrides）

`overrides` 配置项允许为特定文件或文件类型设置不同的规则：

```javascript
export default {
  extends: ['stylelint-config-standard'],
  overrides: [
    {
      files: ['**/*.scss', '**/*.sass'],
      customSyntax: 'postcss-scss',
      rules: {
        'scss/at-rule-no-unknown': true,
        'scss/selector-no-union-class-name': true,
      },
    },
    {
      files: ['**/components/**/*.css'],
      rules: {
        'selector-max-specificity': '0,3,0',
      },
    },
    {
      files: ['**/*.js', '**/*.ts'],
      customSyntax: 'postcss-lit',
    },
  ],
};
```

### 3.7 忽略配置

有多种方式可以忽略文件或代码段的检查：

**1. 使用 `.stylelintignore` 文件：**

```bash
# 忽略特定文件类型
*.min.css
*.js
*.jpg
*.png

# 忽略目录
node_modules/
dist/
vendor/
test/
```

**2. 使用注释禁用规则：**

```css
/* stylelint-disable */
/* 这段代码不受 Stylelint 检查 */
.special-component {
  color: pink !important;
}
/* stylelint-enable */

/* 禁用特定规则 */
/* stylelint-disable selector-no-id, declaration-no-important */
#id {
  color: pink !important;
}
/* stylelint-enable */

/* 行内禁用 */
#id {
  /* stylelint-disable-line */
  color: pink !important; /* stylelint-disable-line declaration-no-important */
}

/* 禁用下一行 */
/* stylelint-disable-next-line declaration-no-important */
#id {
  color: pink !important;
}
```

## 4. 预处理器和特殊语法支持

### 4.1 SCSS/Sass 支持

对于 SCSS 项目，需要安装专门的配置和语法支持：

```bash
npm install --save-dev stylelint-config-standard-scss
```

配置示例：

```javascript
/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'scss/dollar-variable-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'scss/at-rule-no-unknown': true,
    'scss/operator-no-newline-after': null,
  },
};
```

### 4.2 Less 支持

```bash
npm install --save-dev stylelint-less stylelint-config-recommended-less
```

配置示例：

```javascript
/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-recommended-less'],
  customSyntax: 'postcss-less',
  rules: {
    'less/color-no-invalid-hex': true,
  },
};
```

### 4.3 CSS-in-JS 和嵌入式 CSS

对于 Vue、React 等框架中的嵌入式 CSS，需要特殊处理：

```bash
npm install --save-dev stylelint-config-html postcss-lit
```

配置示例：

```javascript
/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-html/vue'],
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['**/*.jsx', '**/*.tsx'],
      customSyntax: 'postcss-lit',
    },
  ],
};
```

## 5. 集成到开发工作流

### 5.1 编辑器集成

在主流编辑器中集成 Stylelint 可以实时获得反馈：

**VS Code 配置：**

1. 安装 Stylelint 扩展
2. 修改 VS Code 设置：

```json
{
  "css.validate": false,
  "less.validate": false,
  "scss.validate": false,
  "stylelint.enable": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.stylelint": true
  }
}
```

**WebStorm/Rider 配置**：

1. 打开设置：**Settings/Preferences > Languages & Frameworks > Style Sheets > Stylelint**
2. 启用 **Enable** 选项
3. 指定 Stylelint 包路径
4. 启用 **Run on save** 自动修复

### 5.2 构建工具集成

**Webpack 集成**：

```javascript
const StyleLintPlugin = require('stylelint-webpack-plugin');

export default {
  plugins: [
    new StyleLintPlugin({
      files: ['**/*.{vue,htm,html,css,sss,less,scss,sass}'],
      fix: true,
      cache: true,
      emitErrors: true,
      failOnError: false,
    }),
  ],
};
```

**Vite 集成**：

```javascript
import { defineConfig } from 'vite';
import stylelint from 'vite-plugin-stylelint';

export default defineConfig({
  plugins: [
    stylelint({
      fix: true,
      cache: false,
    }),
  ],
});
```

### 5.3 Git Hooks 集成

使用 Husky 和 lint-staged 在提交前自动检查：

```bash
npm install --save-dev husky lint-staged
```

配置 `package.json`：

```json
{
  "lint-staged": {
    "*.{html,vue,css,sass,scss,less}": ["stylelint --fix", "git add"]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  }
}
```

## 6. 高级技巧与最佳实践

### 6.1 团队配置管理

建立团队共享配置库，确保项目间的一致性：

**1. 创建共享配置包：**

```javascript
// stylelint-config-team/index.js
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-prettier'],
  rules: {
    'color-no-hex': true,
    'selector-class-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'unit-allowed-list': ['em', 'rem', '%', 'vw', 'vh'],
  },
};
```

**2. 在各项目中使用：**

```bash
npm install --save-dev stylelint-config-team
```

```javascript
// stylelint.config.js
export default {
  extends: ['stylelint-config-team'],
};
```

### 6.2 条件配置

根据环境变量实现动态配置：

```javascript
const isProduction = process.env.NODE_ENV === 'production';

export default {
  rules: {
    'no-empty-source': isProduction ? true : null,
    'declaration-no-important': isProduction ? true : 'warning',
    'max-nesting-depth': isProduction ? 3 : 4,
  },
};
```

### 6.3 配置文档化

为团队维护配置文档，使用注释说明规则用途：

```javascript
export default {
  rules: {
    /**
     * 颜色表示规范
     * - 使用现代颜色函数代替十六进制
     * - 提高颜色值的可读性
     */
    'color-no-hex': [
      true,
      {
        message: '请使用 rgb()、hsl() 或颜色名称代替十六进制颜色值',
      },
    ],

    /**
     * 单位使用规范
     * - 优先使用相对单位
     * - 限制绝对单位的使用
     */
    'unit-allowed-list': [
      'em',
      'rem',
      '%',
      'vw',
      'vh',
      {
        severity: 'warning',
        message: '建议使用相对单位以确保响应式设计',
      },
    ],
  },
};
```

### 6.4 性能优化

大型项目的 Stylelint 配置优化建议：

```javascript
export default {
  // 1. 使用缓存提高检查速度
  cache: true,

  // 2. 精确指定检查文件范围
  ignoreFiles: ['**/dist/**', '**/node_modules/**', '**/vendor/**', '**/*.min.css'],

  // 3. 按需加载插件和配置
  plugins: process.env.CI ? ['stylelint-order', 'stylelint-scss'] : ['stylelint-order'],

  // 4. 开发环境使用宽松规则
  rules: process.env.NODE_ENV === 'production' ? strictRules : devRules,
};
```

## 7. 常见问题与解决方案

### 7.1 预处理器语法错误

**问题**：SCSS/Less 特定语法报错

**解决方案**：

```javascript
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    'scss/selector-no-union-class-name': true,
  },
};
```

### 7.2 与 Prettier 的集成

避免与 Prettier 规则冲突：

```bash
npm install --save-dev stylelint-config-prettier
```

```javascript
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier', // 必须放在最后
  ],
};
```

### 7.3 自定义规则创建

创建项目特定规则：

```javascript
// custom-rule.js
const stylelint = require('stylelint');

const ruleName = 'plugin/color-naming-convention';
const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: 'Expected color value to use named color or CSS variable',
});

export default stylelint.createPlugin(ruleName, (primaryOption) => {
  return (root, result) => {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
      actual: primaryOption,
    });

    if (!validOptions) return;

    root.walkDecls((decl) => {
      if (decl.prop.includes('color')) {
        const value = decl.value;
        // 自定义逻辑
        if (value.match(/#[0-9a-f]+/i) && value.length === 4) {
          stylelint.utils.report({
            message: messages.expected,
            node: decl,
            result,
            ruleName,
          });
        }
      }
    });
  };
});

module.exports.ruleName = ruleName;
module.exports.messages = messages;
```

## 8. 总结

Stylelint 是现代前端开发中不可或缺的代码质量工具。通过合理的配置和集成，它可以显著提升团队协作效率和代码可维护性。关键实践包括：

1. **渐进采用**：从基础配置开始，逐步完善规则体系
2. **团队统一**：建立共享配置，确保代码一致性
3. **自动化集成**：融入开发工作流，降低使用门槛
4. **持续优化**：定期审查规则配置，适应项目发展

通过本文的详细介绍，您应该能够建立完整的 Stylelint 代码检查体系，为前端项目的样式代码质量提供坚实保障。

> 本文内容基于 Stylelint 官方文档和社区最佳实践，具体配置请根据项目需求调整。随着工具版本更新，部分配置方式可能发生变化，建议参考最新官方文档。
