好的，请看下方为您生成的关于 Vite 与 Vitest 集成详解与最佳实践的技术文档。

---

# Vite 与 Vitest 集成详解与最佳实践

## 1. 引言

在现代前端开发中，构建工具与测试框架的深度融合是保证开发体验和项目质量的关键。 **Vite** 作为下一代的前端构建工具，以其极致的开发服务器启动速度和模块热更新（HMR）而闻名。 **Vitest** 则是一个由 Vite 提供支持的极速单元测试框架，它专为与 Vite 项目无缝集成而设计。

本文将深入探讨如何将 Vitest 集成到你的 Vite 项目中，并提供从基础配置到高级应用的最佳实践，帮助你构建一个高效、可靠的测试环境。

### 1.1 为什么选择 Vitest？

- **与 Vite 配置共享**：Vitest 直接读取你的 Vite 配置文件（`vite.config.js`），这意味着你的测试环境与开发环境共享相同的插件、解析别名（alias）和配置。无需为测试重复配置。
- **极致的速度**：得益于 Vite 的依赖预构建和 ESM 原生特性，Vitest 的启动和测试执行速度非常快。它实现了智能文件监听，只重新运行相关测试，类似 HMR 对于开发的意义。
- **一流的 DX（开发者体验）**：提供美观的 UI、类似 Mocha 的语法、内置 TypeScript/JSX 支持、模块模拟（ mocking ）等功能。
- **Jest 兼容**：Vitest 设计了与 Jest 高度兼容的 API，使得从 Jest 迁移的成本非常低。

## 2. 环境搭建与基础配置

### 2.1 安装 Vitest

在你的 Vite 项目中，通过你选择的包管理器安装 Vitest。

```bash
# 使用 npm
npm install -D vitest

# 使用 yarn
yarn add -D vitest

# 使用 pnpm
pnpm add -D vitest
```

### 2.2 基础配置 (vite.config.ts)

最简配置是在你的 Vite 配置文件中添加 `test` 属性块。Vitest 会自动识别它。

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'; // 示例中使用 Vue，如果是 React 则替换为 @vitejs/plugin-react

export default defineConfig({
  plugins: [vue()],
  // Vitest 配置区域
  test: {
    // 启用类似 Jest 的全局测试 API
    globals: true,
    // 设置测试环境
    environment: 'jsdom', // 对于组件测试，需要模拟 DOM 环境。如果是 node 服务端测试，可设置为 'node'
  },
});
```

**关键配置项说明**：

- `globals: true`： 将 `describe`, `it`, `expect` 等 API 注入为全局变量，无需在每个测试文件中导入。如果你更喜欢显式导入（有利于树摇和类型安全），可以设置为 `false` 或省略，并在文件中从 `vitest` 导入。
- `environment: 'jsdom'`： 为测试提供浏览器环境，这对于测试涉及 DOM 操作的组件或库至关重要。如果测试的是 Node.js 端的逻辑（如 API 路由），则应使用 `environment: 'node'`。

### 2.3 配置测试脚本 (package.json)

在你的 `package.json` 中添加测试脚本。

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui", // 启用美观的浏览器 UI
    "test:run": "vitest run" // 单次运行测试，不启动监听模式
  }
}
```

## 3. 编写你的第一个测试

### 3.1 示例工具函数

假设我们有一个简单的工具函数。

```typescript
// src/utils/math.ts
export function sum(a: number, b: number): number {
  return a + b;
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}
```

### 3.2 对应的测试文件

创建一个与源文件同名且带 `.test.ts` 或 `.spec.ts` 后缀的测试文件。

```typescript
// src/utils/math.test.ts
import { describe, it, expect } from 'vitest';
// 如果 globals 为 true，则可以省略上面的导入
import { sum, divide } from './math';

describe('math utilities', () => {
  describe('sum function', () => {
    it('adds two numbers correctly', () => {
      expect(sum(2, 3)).toBe(5);
      expect(sum(-1, 5)).toBe(4);
    });
  });

  describe('divide function', () => {
    it('divides two numbers correctly', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('throws an error when dividing by zero', () => {
      expect(() => divide(5, 0)).toThrowError('Cannot divide by zero');
    });
  });
});
```

### 3.3 运行测试

在终端中运行以下命令：

```bash
npm run test
```

Vitest 会启动监听模式，自动查找项目中的测试文件并执行。你将在终端中看到测试结果。

## 4. 核心概念与最佳实践

### 4.1 测试 Vue/React 组件

测试 UI 组件是前端测试的核心。我们需要使用 `@vue/test-utils` (Vue) 或 `@testing-library/react` (React) 等库来渲染组件并模拟用户交互。

**1. 安装测试库**

```bash
# For Vue
npm install -D @vue/test-utils jsdom

# For React
npm install -D @testing-library/react jsdom @testing-library/jest-dom
```

**2. 配置 `jsdom` 环境**
确保你的 `vite.config.ts` 中设置了 `environment: 'jsdom'`。

**3. 示例：测试一个 Vue 组件**

```vue
<!-- src/components/HelloWorld.vue -->
<template>
  <div>
    <h1>{{ greeting }}</h1>
    <button @click="count++">Count is: {{ count }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ greeting: string }>();

const count = ref(0);
</script>
```

```typescript
// src/components/HelloWorld.spec.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HelloWorld from './HelloWorld.vue';

describe('HelloWorld.vue', () => {
  it('renders props.greeting correctly', () => {
    const greeting = 'Hello Vitest!';
    const wrapper = mount(HelloWorld, {
      props: { greeting },
    });
    expect(wrapper.text()).toContain(greeting);
  });

  it('button click increments counter', async () => {
    const wrapper = mount(HelloWorld, {
      props: { greeting: '' },
    });
    const button = wrapper.find('button');
    expect(button.text()).toContain('0');
    await button.trigger('click');
    expect(button.text()).toContain('1');
  });
});
```

### 4.2 模拟 (Mocking)

Vitest 提供了强大的 mocking 功能，兼容 Jest API。

**模拟第三方库或模块**：

```typescript
// src/utils/__mocks__/axios.ts (手动模拟)
export default {
  get: vi.fn(() => Promise.resolve({ data: 'mocked data' })),
};

// 在测试文件中
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 自动模拟整个模块
vi.mock('axios');

describe('api call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches data', async () => {
    // 安排：模拟 axios.get 的返回值
    (axios.get as Mock).mockResolvedValue({ data: [1, 2, 3] });

    // 执行：调用你的函数（该函数内部使用了 axios.get）
    const result = await yourFunctionThatUsesAxios();

    // 断言：函数返回了预期值，且 axios.get 被以正确的参数调用
    expect(result).toEqual([1, 2, 3]);
    expect(axios.get).toHaveBeenCalledWith('/api/data');
  });
});
```

**模拟部分模块**：

```typescript
// 模拟部分模块，保留其他部分
vi.mock('../module', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    namedExport: vi.fn(),
  };
});
```

### 4.3 配置别名 (Alias) 与路径解析

由于 Vitest 共享 Vite 的配置，你在 `vite.config.ts` 中定义的 `resolve.alias` 会自动在测试中生效。

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // ...
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // ... 无需在 test 中重复配置 alias
  },
});
```

现在，你可以在测试文件中直接使用别名。

```typescript
import { sum } from '@/utils/math'; // 正常工作
```

### 4.4 测试覆盖率

Vitest 通过 `v8`（默认）或 `istanbul` 提供内置的覆盖率报告。

**1. 配置覆盖率**

在 `vite.config.ts` 中启用并配置覆盖率：

```typescript
export default defineConfig({
  // ...
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8', // 或 'istanbul'
      reporter: ['text', 'json', 'html'], // 生成多种格式的报告
      exclude: [
        // 排除不需要计算覆盖率的文件
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.{js,ts}',
        '**/__mocks__/**',
      ],
      thresholds: {
        // 设置覆盖率阈值，强制保证测试质量
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

**2. 运行覆盖率报告**

```bash
npx vitest run --coverage
# 或添加到脚本
# "test:coverage": "vitest run --coverage"
```

运行后，会在项目根目录生成一个 `coverage` 文件夹，打开其中的 `index.html` 即可在浏览器中查看详细的覆盖率报告。

## 5. 高级主题

### 5.1 与测试数据库或后端 API 的集成

对于需要与真实后端交互的测试（E2E 或集成测试），建议使用 `MSW` (Mock Service Worker) 来拦截网络请求，而不是直接连接真实数据库，以保证测试的独立性和速度。

```bash
npm install -D msw
```

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// 在测试设置文件中启动和关闭
// vitest.setup.ts
import { server } from './mocks/server';
import { beforeAll, afterAll, afterEach } from 'vitest';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

在 `vitest.config.ts` 中指定 setup 文件：

```typescript
test: {
  // ...
  setupFiles: ['./vitest.setup.ts'],
}
```

### 5.2 优化测试性能

- **使用 `include` 和 `exclude`**： 在配置中明确指定需要测试的文件，避免 Vitest 遍历不必要的目录。

  ```typescript
  test: {
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  }
  ```

- **在 CI 环境中禁用 watch 和 sourcemap**： `vitest run --no-watch --sourcemap=false`。
- **将大型测试套件拆分为多个 `shard`**： Vitest v1+ 支持 `--shard` 参数，可以将测试分散到多个机器上并行运行，极大缩短 CI 时间。

  ```bash
  vitest run --shard=1/3 # 在第一台机器上运行
  vitest run --shard=2/3 # 在第二台机器上运行
  vitest run --shard=3/3 # 在第三台机器上运行
  ```

## 6. 常见问题与排错 (Troubleshooting)

- **`__dirname is not defined in ES module scope`**： 在 Vite 项目中，你需要使用 `import.meta.url` 而不是 CommonJS 的 `__dirname`。或者，在 `vite.config.ts` 中配置 `define: { global: 'globalThis' }` 可能有助于解决某些第三方库的问题。
- **CSS/静态资源导入错误**： 在测试中，导入的 `.css` 或图片文件可能会导致错误。你可以在配置中为这些文件定义一个简单的模拟。

  ```typescript
  // vite.config.ts
  test: {
    // ...
    deps: {
      inline: ['lodash-es'], // 必要时内联某些依赖
    },
    // 模拟非 JS 资源
    server: {
      // @ts-ignore - 尚未在类型中公开，但可用
      middlewareMode: true,
    },
  },
  ```

  或者使用一个简单的模拟文件：

  ```typescript
  // __mocks__/fileMock.js
  export default 'test-file-stub';
  ```

  ```typescript
  // vite.config.ts
  test: {
    alias: {
      '\\.(css|less|scss|sass|png|jpg|gif)$': require.resolve('./__mocks__/fileMock.js'),
    },
  }
  ```

## 7. 总结

将 Vitest 集成到 Vite 项目是一个自然且高效的选择。它们共享同一套配置、转换管道和插件生态系统，提供了无与伦比的一致性和开发体验。

**最佳实践清单**：

1. **启用 `globals`** 以简化测试 API 的使用（根据团队偏好）。
2. 为组件测试正确设置 `environment: 'jsdom'`。
3. 利用 Vite 的 **别名解析**，避免重复配置。
4. 使用 **MSW** 等工具模拟 HTTP 请求，创建稳定可靠的集成测试。
5. 配置 **覆盖率报告和阈值**，量化并保障代码质量。
6. 在 CI 环境中使用 `vitest run` 和 **sharding** 来优化测试速度。

通过遵循本文的指南和实践，你将能够为你的 Vite 项目建立一个强大、快速且可维护的测试套件，从而更自信地构建和交付高质量的 Web 应用程序。

---

**希望这篇详尽的文档能对你创作 Vite 系列教程有所帮助！**
