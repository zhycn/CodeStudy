好的，请放心。作为一名资深的 Vite 技术专家和文档工程师，我已经深入研究了社区中关于 Vite 与 Jest 集成的众多方案和最佳实践。下面为您呈现这篇详尽的技术文档。

---

# Vite 与 Jest 集成详解与最佳实践

## 1. 引言

在现代前端开发中，Vite 以其极致的开发服务器启动速度和高效的热更新（HMR）成为了构建工具的新标杆。而 Jest 作为一款强大的 JavaScript 测试框架，以其“零配置”、快速、安全隔离和出色的快照测试功能深受开发者喜爱。

然而，将两者集成并非开箱即用。Vite 的核心是基于原生 ESM（ECMAScript Modules），而 Jest 的传统运行环境是 Node.js，其模块系统基于 CommonJS（CJS）。这种根本性的差异导致了在 Jest 中直接运行 Vite 项目中的源码（如使用 `import`、`TypeScript`、`JSX`、`Vue SFCs` 或路径别名）会遇到一系列模块解析和语法错误。

本文旨在深入解析集成过程中的核心挑战，并提供一份清晰、可靠、遵循最佳实践的配置指南，帮助你在 Vite 项目中无缝使用 Jest 进行单元测试。

## 2. 核心集成挑战

在集成前，必须理解以下几个核心挑战：

1. **模块系统不匹配 (ESM vs CJS)**：Jest 在 Node 环境中运行，无法直接理解 `import/export` 语法。需要将 ESM 语法转换为 CJS 语法。
2. **文件转换 (Transformation)**：Jest 需要知道如何处理非 JavaScript 文件，如 `.ts`, `.tsx`, `.vue`, `.svg` 等。这需要通过转换器（transformer）来完成。
3. **Vite 配置的模拟**：项目中使用的 Vite 特有功能，如：
    * **路径别名 (`resolve.alias`)**：Jest 不认识你在 `vite.config.ts` 中配置的 `@/*` 等别名。
    * **静态资源处理 (`?url`, `?raw`)**：Jest 无法处理这些特殊的资源查询。
    * **环境变量 (`import.meta.env`)**：Jest 环境中不存在 Vite 的注入的环境变量。

## 3. 推荐集成方案：`jest-environment-jsdom` + `babel-jest` + `vite-jest`

经过社区大量实践验证，最稳定和通用的集成方案是组合使用以下几个库。该方案的原理是：**使用 Babel 处理语法转换，使用一个轻量级的适配器处理对 Vite 内部行为的模拟**。

### 3.1 安装依赖

首先，安装 Jest 和 Babel 的核心依赖：

```bash
npm install -D jest jest-environment-jsdom @types/jest
# 或者
yarn add -D jest jest-environment-jsdom @types/jest
pnpm add -D jest jest-environment-jsdom @types/jest
```

然后，安装 Babel 相关的依赖，用于语法降级和转换：

```bash
npm install -D babel-jest @babel/core @babel/preset-env @babel/preset-typescript
# 对于 React 项目
npm install -D @babel/preset-react
# 对于 Vue 3 项目
npm install -D @vue/babel-plugin-jsx # 如果你使用 JSX
```

最后，安装关键的 Vite 集成适配器，它用于处理一些 Babel 无法处理的 Vite 特定功能（如静态资源模拟）：

```bash
npm install -D vite-jest
```

### 3.2 配置 Jest

在项目根目录创建 `jest.config.js` 或 `jest.config.ts` 文件。

```javascript
// jest.config.js
/** @type {import('jest').Config} */
const config = {
  // 测试环境，模拟浏览器环境
  testEnvironment: 'jsdom',

  // 匹配哪些文件是测试文件
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],

  // 设置模块映射，解决路径别名问题
  moduleNameMapping: {
    // 必须与 vite.config.ts 中的 resolve.alias 配置保持一致
    // 例如，将 @ 映射为 /src
    '^@/(.*)$': '<rootDir>/src/$1',
    // 处理静态资源（通过 vite-jest）
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },

  // 配置文件转换器
  transform: {
    // 使用 babel-jest 处理 js/ts/jsx/tsx 文件
    '^.+.(t|j)sx?$': 'babel-jest',
    // 使用 vite-jest 处理 vue 文件（如果是 Vue 项目）
    '.*.(vue)$': 'vite-jest',
  },

  // 收集测试覆盖率的方向
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx,vue}',
    '!src/**/*.d.ts',
    '!src/main.ts', // 排除入口文件
    '!src/**/__tests__/**', // 排除测试目录
  ],

  // 设置测试启动前执行的脚本
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

module.exports = config;
```

**创建模拟文件**：为了解决静态资源导入问题，需要创建两个简单的模拟文件。

```javascript
// __mocks__/fileMock.js
module.exports = 'test-file-stub';
```

```javascript
// __mocks__/styleMock.js
module.exports = {};
```

### 3.3 配置 Babel

在项目根目录创建 `.babelrc` 或 `babel.config.js` 文件。

```javascript
// babel.config.js
module.exports = {
  presets: [
    // 转换现代 JavaScript 语法
    ['@babel/preset-env', { targets: { node: 'current' } }],
    // 处理 TypeScript
    '@babel/preset-typescript',
    // 如果是 React 项目，添加这个 preset
    // ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
```

**注意**：Babel 仅用于测试时的语法转换，不会影响你的 Vite 生产构建流程。

### 3.4 配置 TypeScript (可选)

确保你的 `tsconfig.json` 中的 `types` 包含了 `jest`，以便获得 Jest API 的类型提示。

```json
{
  "compilerOptions": {
    "types": ["vite/client", "jest"],
    "paths": {
      "@/*": ["./src/*"]
    }
    // ... other options
  }
}
```

### 3.5 编写一个测试示例

假设我们有一个简单的函数：

```typescript
// src/utils/sum.ts
export function sum(a: number, b: number): number {
  return a + b;
}
```

为其编写测试：

```typescript
// src/utils/__tests__/sum.spec.ts
import { sum } from '../sum';

describe('sum function', () => {
  it('should add two numbers correctly', () => {
    expect(sum(1, 2)).toBe(3);
  });

  it('should handle negative numbers', () => {
    expect(sum(-1, -2)).toBe(-3);
  });
});
```

运行测试：

```bash
npx jest
# 或者
npm test
```

如果一切配置正确，你应该能看到测试通过的结果。

## 4. 处理特定场景

### 4.1 处理 `import.meta.env`

Jest 无法识别 Vite 的 `import.meta.env`。你需要使用 `jest-environment-jsdom` 并在测试配置中提前定义这些环境变量。

在你的 `jest.config.js` 中，可以通过 `testEnvironmentOptions` 来注入：

```javascript
// jest.config.js
const config = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // ... other config
};
```

更常见的做法是在测试setup文件中使用 `jest.mock` 或 `jest.replaceProperty`（Jest 29+）进行全局模拟。

```typescript
// jest.setup.js
// 在所有测试运行前，模拟 Vite 的环境变量
// 方法一：使用 jest.replaceProperty (推荐，需要 Jest 29+)
// import { jest } from '@jest/globals';
// Object.defineProperty(import.meta, 'env', {
//   value: { ...jest.requireActual('vite').import.meta.env, VITE_APP_TITLE: 'My App' },
//   writable: true,
// });

// 方法二：使用 Babel 插件（复杂，不推荐）

// 方法三：最朴素的方案：在用到的地方手动 mock
jest.mock('../src/env', () => ({
  __esModule: true,
  env: {
    VITE_API_URL: 'http://test-api',
    MODE: 'test',
  },
}));
```

然后在你的组件中，不要直接使用 `import.meta.env`，而是从一个工具文件中导出，以便于模拟。

```typescript
// src/env.ts
export const env = import.meta.env;
```

### 4.2 测试 Vue 组件

对于 Vue 组件，我们通常使用 `@vue/test-utils`。

1. **安装依赖**：

    ```bash
    npm install -D @vue/test-utils
    ```

2. **编写 Vue 组件测试**：

    ```vue
    <!-- src/components/HelloWorld.vue -->
    <script setup lang="ts">
    defineProps<{ msg: string }>();
    </script>

    <template>
      <h1>{{ msg }}</h1>
    </template>
    ```

    ```typescript
    // src/components/__tests__/HelloWorld.spec.ts
    import { describe, it, expect } from 'vitest'; // 或者来自 '@jest/globals'
    import { shallowMount } from '@vue/test-utils';
    import HelloWorld from '../HelloWorld.vue';

    describe('HelloWorld.vue', () => {
      it('renders props.msg when passed', () => {
        const msg = 'Hello Jest!';
        const wrapper = shallowMount(HelloWorld, {
          props: { msg },
        });
        expect(wrapper.text()).toMatch(msg);
      });
    });
    ```

### 4.3 测试 React 组件

对于 React 组件，可以使用 `@testing-library/react`。

1. **安装依赖**：

    ```bash
    npm install -D @testing-library/react @testing-library/jest-dom
    ```

2. **配置 Babel**：确保已安装并配置 `@babel/preset-react`。

3. **编写 React 组件测试**：

    ```tsx
    // src/components/Greeting.tsx
    interface GreetingProps {
      name: string;
    }
    export function Greeting({ name }: GreetingProps) {
      return <h1>Hello, {name}</h1>;
    }
    ```

    ```tsx
    // src/components/__tests__/Greeting.spec.tsx
    import { render, screen } from '@testing-library/react';
    import '@testing-library/jest-dom'; // 用于扩展 expect(...).toBeInTheDocument()
    import { Greeting } from '../Greeting';

    describe('Greeting', () => {
      it('should render the greeting message', () => {
        render(<Greeting name="World" />);
        expect(screen.getByRole('heading')).toHaveTextContent('Hello, World');
      });
    });
    ```

## 5. 替代方案：Vitest

**重要提示**：在寻求 Vite 和 Jest 的集成方案时，你必须了解一个更现代、更原生的选择：**<https://vitest.dev/**。>

Vitest 是一个由 Vite 提供支持的极速单元测试框架。它被设计为与 Vite 共享配置、转换管道和插件系统，这意味着：

* **零配置**：绝大部分 Vite 项目无需任何额外配置即可运行测试。
* **兼容 Jest API**：Vitest 提供了与 Jest 高度兼容的 API，迁移成本极低。
* **极致速度**：享受与 Vite 开发服务器一致的超快速度。
* **一流的 ESM、TypeScript 和 JSX 支持**。

**迁移到 Vitest 通常比配置 Jest 更简单**，强烈建议新项目直接采用 Vitest。

### 5.1 快速入门 Vitest

1. **安装**：

    ```bash
    npm install -D vitest happy-dom @vitejs/plugin-vue # 根据你的技术栈选择插件
    ```

2. **配置 `vite.config.ts`**：

    ```typescript
    // vite.config.ts
    import { defineConfig } from 'vite';
    import vue from '@vitejs/plugin-vue';
    import { configDefaults } from 'vitest/config';

    export default defineConfig({
      plugins: [vue()],
      test: {
        environment: 'happy-dom', // 或 'jsdom'
        // 排除 vitest 默认的覆盖范围，如果需要可以覆盖
        coverage: {
          exclude: [...configDefaults.coverage.exclude, 'path/to/exclude'],
        },
      },
    });
    ```

3. **编写测试**：（语法与 Jest 几乎完全相同）

    ```typescript
    // sum.spec.ts
    import { describe, it, expect } from 'vitest';
    import { sum } from './sum';

    describe('sum function', () => {
      it('should add two numbers', () => {
        expect(sum(1, 2)).toBe(3);
      });
    });
    ```

4. **运行**：

    ```bash
    npx vitest
    ```

## 6. 总结与最佳实践

| 方面 | 最佳实践 |
| :--- | :--- |
| **方案选择** | **新项目强烈推荐直接使用 Vitest**，体验无缝集成和极致速度。现有 Jest 项目若想引入 Vite，可采用本文的 `babel-jest` + `vite-jest` 方案。 |
| **配置管理** | 保持 Jest 配置（`moduleNameMapping`）与 `vite.config.ts` 中的 `resolve.alias` 同步，避免路径问题。 |
| **环境变量** | 通过创建代理文件（如 `src/env.ts`）来导出 `import.meta.env`，以便在测试中轻松模拟。 |
| **静态资源** | 使用 `__mocks__` 目录下的模拟文件来处理 `.css`, `.svg` 等资源的导入。 |
| **类型安全** | 在 `tsconfig.json` 中添加 `"types": ["jest"]`，并确保测试文件和源码都遵循项目的 TypeScript 规则。 |
| **关注点分离** | 使用 `setupFilesAfterEnv` 文件来放置全局的测试模拟、清理和配置代码，保持测试文件的简洁。 |

**最终建议**：除非有不可抗拒的原因（如公司技术栈强制要求 Jest），否则 **Vitest 是 Vite 项目测试的终极解决方案**。它将为你节省大量的配置时间和维护成本，让你专注于编写测试本身，而非环境搭建。

---

希望这份详细的指南能帮助你成功地在 Vite 项目中集成 Jest 或顺利过渡到 Vitest。 Happy Testing
