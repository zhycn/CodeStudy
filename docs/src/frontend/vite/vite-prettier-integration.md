好的，请看下方为您生成的关于 Vite 与 Prettier 集成详解与最佳实践的技术文档。

---

# Vite 与 Prettier 集成详解与最佳实践

## 1. 引言

在现代前端开发中，代码的格式化和风格统一对于团队协作和项目维护至关重要。`Prettier` 是一个强大的“有态度的代码格式化工具”，它通过解析代码并重新打印它，强制实施一致的风格。`Vite` 作为一个下一代的前端构建工具，以其极致的开发体验著称。将两者无缝集成，可以在享受 Vite 高速开发服务的同时，获得自动化、规范化的代码格式化能力。

本文旨在详细阐述如何在 Vite 项目中集成 Prettier，并提供经过社区验证的最佳实践方案，以确保你的代码库既整洁又高效。

## 2. 为什么需要集成 Vite 与 Prettier？

虽然 Vite 本身不直接处理代码格式化（这是 Prettier 的职责），但将它们集成在一起主要带来以下好处：

1. **开发阶段反馈**：通过配置，可以在开发服务器运行时或保存文件时即时格式化代码，快速发现风格问题。
2. **构建阶段检查**：可以将 Prettier 作为构建流程的一部分，确保提交到仓库的代码都是经过格式化的，防止不符合规范的代码进入生产环境。
3. **统一的开发体验**：无论团队成员使用何种编辑器（VSCode, WebStorm 等），项目级别的 Prettier 配置能保证所有人的输出格式一致。
4. **与 ESLint 协同**：结合 `eslint-plugin-prettier`，可以避免 Prettier 和 ESLint 的规则冲突，并将 Prettier 的格式化问题作为 ESLint 错误显示，简化开发流程。

## 3. 安装与基础配置

### 3.1 安装依赖

首先，在你的 Vite 项目根目录下，安装必要的 npm 包。

```bash
# 安装 Prettier 核心包
npm install --save-dev --save-exact prettier

# 可选但推荐：安装 ESLint 相关集成包（如果你的项目使用 ESLint）
npm install --save-dev eslint-plugin-prettier eslint-config-prettier

# 可选：安装用于在构建时进行格式检查的 Vite 插件
npm install --save-dev vite-plugin-prettier
```

### 3.2 创建配置文件

在项目根目录创建 `.prettierrc` 配置文件。这是一个简单的 JSON 文件，用于定义团队的代码风格规则。

**`.prettierrc`**

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "es5",
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "auto"
}
```

- `semi`: 语句末尾不加分号。
- `singleQuote`: 使用单引号。
- `printWidth`: 每行代码最大长度。
- `trailingComma`: 多行结构尽可能加上尾随逗号。
- `tabWidth`: 缩进空格数。
- `useTabs`: 使用空格而非 Tab 缩进。
- `endOfLine`: 根据环境自动识别换行符（`lf` 或 `crlf`）。

同时，建议创建一个 `.prettierignore` 文件，告诉 Prettier 哪些文件或目录不需要格式化。

**`.prettierignore`**

```
**/dist/
**/node_modules/
**/package-lock.json
**/yarn.lock
**/pnpm-lock.yaml
**/*.min.js
**/coverage/

# 忽略本地配置文件
.eslintrc.local.js
.prettierrc.local.js
```

## 4. 集成方案：开发时与构建时

### 4.1 方案一：使用 IDE/编辑器插件（推荐用于开发时）

这是最常见和高效的开发时集成方式。在你的代码编辑器（如 VSCode）中安装 `Prettier - Code formatter` 插件。

然后，在项目根目录创建 `.vscode/settings.json` 文件，进行工作区设置，强制使用项目本地安装的 Prettier 并启用保存自动格式化。

**.vscode/settings.json**

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit"
  },
  "prettier.requireConfig": true, // 要求项目有配置文件才生效
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

**优点**：响应迅速，无需配置 Vite 本身，体验最佳。
**缺点**：依赖于编辑器的配置，对于未配置相同环境的其他工具（如 CLI）可能无效。

### 4.2 方案二：使用 Vite 插件（用于构建时检查）

`vite-plugin-prettier` 插件可以在 Vite 的开发服务器和构建过程中运行 Prettier 检查。

**`vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'; // 以 Vue 项目为例
import vitePrettier from 'vite-plugin-prettier';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vitePrettier({
      //  Prettier 配置选项，会覆盖 .prettierrc 文件
      singleQuote: true,
      semi: false,
      // 开发时也启用
      dev: true,
      // 构建时启用
      build: true,
    }),
  ],
});
```

配置好后，运行 `vite build` 时，如果代码不符合 Prettier 规范，构建过程将会**失败**并输出错误信息。这能有效保证生产构建产物的代码风格一致性。

**注意**：此插件主要用于**检查**和**报错**，通常不会直接修改你的源文件。格式化工作还应交由编辑器或 Prettier CLI 完成。

### 4.3 方案三：集成 ESLint（最佳实践）

为了彻底解决 Prettier（格式化）和 ESLint（代码质量）可能存在的规则冲突，我们需要使用 `eslint-plugin-prettier` 和 `eslint-config-prettier`。

- `eslint-plugin-prettier`: 将 Prettier 作为 ESLint 规则运行，将格式化问题以 ESLint 错误的形式呈现。
- `eslint-config-prettier`: 关闭所有与 Prettier 冲突的不必要的或可能导致问题的 ESLint 规则。

首先，确保你的 `.eslintrc.cjs` (或对应的 ESLint 配置文件) 正确扩展了 Prettier 的配置。

**.eslintrc.cjs** (示例)

```javascript
module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@vue/eslint-config-typescript', // 如果是 Vue + TS 项目
    '@vue/eslint-config-prettier', // 这通常已经包含了 eslint-config-prettier
    // 确保 Prettier 的配置在最后，以便覆盖其他扩展中的格式规则
    'plugin:prettier/recommended', // 这等价于 extends: ['prettier'] 和 plugins: ['prettier']
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    // 你的其他 ESLint 规则
    'prettier/prettier': 'error', // 由 plugin:prettier/recommended 自动添加
  },
};
```

`plugin:prettier/recommended` 做了三件事：

1. 启用 `eslint-plugin-prettier`。
2. 设置 `'prettier/prettier'` 规则为 `'error'`。
3. 扩展了 `eslint-config-prettier`。

现在，当你运行 `eslint . --fix` 时，ESLint 不仅会修复自己的规则问题，还会调用 Prettier 来格式化代码！同时，在 VSCode 中配置的 `editor.codeActionsOnSave` 也会自动修复这些问题。

## 5. 脚本命令与 Git Hooks

### 5.1 添加 npm 脚本

在 `package.json` 中添加一些实用脚本，方便在终端手动运行。

**`package.json`**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint:eslint": "eslint . --ext .js,.jsx,.ts,.tsx,.vue --fix",
    "lint:prettier": "prettier --write \"src/**/*.{js,ts,jsx,tsx,vue,css,scss,html,md,json}\"",
    "lint:check": "prettier --check \"src/**/*.{js,ts,jsx,tsx,vue,css,scss,html,md,json}\"",
    "type-check": "vue-tsc --noEmit" // 如果是 TS 项目
  }
}
```

- `npm run lint:eslint`: 运行 ESLint 并自动修复。
- `npm run lint:prettier`: 格式化所有指定类型的文件。
- `npm run lint:check`: 检查文件格式是否符合规范，但不修改文件（常用于 CI）。

### 5.2 通过 Git Hooks 强制格式化

使用 `lint-staged` 和 `husky` 可以让你在提交 Git 代码前，只对**暂存区（staged）的文件**运行格式化操作，确保提交的代码都是符合规范的。

**1. 安装依赖**

```bash
npm install --save-dev husky lint-staged
npx husky install
npm pkg set scripts.prepare="husky install"
```

**2. 配置 `lint-staged`**
在 `package.json` 中配置：

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,vue,css,scss,html,md,json}": ["prettier --write", "eslint --fix"]
  }
}
```

**3. 添加 Git Hook**

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

现在，每次执行 `git commit` 时，`husky` 都会触发 `pre-commit` hook，运行 `lint-staged`，后者会自动格式化你本次提交的代码。

## 6. 常见问题与解决方案 (Troubleshooting)

### 6.1 Prettier 不格式化 Vue/Svelte/其他语言文件

确保安装了相应的 Prettier 插件或解析器。例如，对于 Vue 3 的单文件组件，Prettier 官方已支持。对于 Svelte，需要安装 `prettier-plugin-svelte`。

```bash
# 例如 Svelte
npm install --save-dev prettier-plugin-svelte
```

并在 `.prettierrc` 中指定插件：

```json
{
  "plugins": ["prettier-plugin-svelte"],
  "svelteSortOrder": "options-scripts-markup-styles",
  "svelteStrictMode": false,
  "overrides": [
    {
      "files": "*.svelte",
      "options": { "parser": "svelte" }
    }
  ]
}
```

### 6.2 与 ESLint 规则冲突

确保你的 ESLint 配置正确扩展了 `eslint-config-prettier`，并且 `plugin:prettier/recommended` 放在 extends 数组的**最后**。

### 6.3 VSCode 使用旧版 Prettier 或全局 Prettier

在项目 `.vscode/settings.json` 中设置：

```json
{
  "prettier.prettierPath": "./node_modules/prettier/index.js"
}
```

这强制 VSCode 使用项目本地安装的 Prettier。

## 7. 总结

将 Vite 与 Prettier 集成是提升现代前端开发体验和代码质量的关键一步。推荐的**最佳实践组合**是：

1. **开发时**：使用 **VSCode (或其他编辑器) 插件**，配置保存时自动格式化，获得最快反馈。
2. **质量保证**：通过 **`eslint-plugin-prettier`** 将格式化问题纳入 ESLint 流程，统一问题反馈来源。
3. **构建时**：可选使用 **`vite-plugin-prettier`** 在构建阶段进行最终检查，防止不规范代码进入生产。
4. **提交时**：使用 **`husky` + `lint-staged`** 在 Git 提交前自动格式化暂存区代码，实现强制的代码风格统一。

通过以上层层递进的集成方案，你可以为你的 Vite 项目建立一个健壮、自动化且无感的代码格式化工作流，让开发者可以更专注于逻辑本身，而不是代码风格。

---

**参考资料**:

1. <https://prettier.io/docs/en/>
2. <https://github.com/prettier/eslint-plugin-prettier>
3. <https://github.com/amousuzuki/vite-plugin-prettier>
4. <https://www.robinwieruch.de/prettier-eslint/>
5. <https://github.com/vitejs/vite/discussions/6790>
6. <https://typicode.github.io/husky/>
7. <https://github.com/sveltejs/prettier-plugin-svelte>
8. <https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode>
9. <https://vueschool.io/articles/vuejs-tutorials/prettier-with-vue-and-vscode/>
10. <https://prettier.io/docs/en/ignore.html>
