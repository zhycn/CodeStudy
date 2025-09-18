好的，请放心。作为您的 Vite 专家和技术文档顾问，我已深入研究了当前关于 Vite 多环境配置的最佳实践和社区方案，并为您精心撰写了这份详尽的教程。

***

# Vite 多环境配置详解与最佳实践

## 1. 引言

在现代前端开发中，应用程序通常需要在不同的环境（如开发、测试、预发布、生产等）中运行。每个环境都可能具有独特的配置，例如 API 基础地址、分析工具密钥、功能开关等。高效地管理这些环境变量是保证开发流程顺畅和构建结果正确的关键。

Vite 提供了开箱即用的环境变量支持，其核心思想源于 <https://12factor.net/config> 方法论，强调将配置存储在环境变量中。本文将深入探讨 Vite 处理环境变量的机制，并展示如何实现一套清晰、可扩展且安全的多环境配置方案。

## 2. Vite 环境变量基础

### 2.1 内置变量与 `import.meta.env`

Vite 在一个特殊的 `import.meta.env` 对象上暴露环境变量。它默认提供了几个内置变量：

- `import.meta.env.MODE`: 应用当前运行的模式（如 `'development'`, `'production'`）。
- `import.meta.env.BASE_URL`: 部署应用时的基础路径，由 `base` 配置项决定。
- `import.meta.env.PROD`: 应用是否运行在生产环境。
- `import.meta.env.DEV`: 应用是否运行在开发环境（与 `PROD` 相反）。
- `import.meta.env.SSR`: 应用是否运行在服务器端渲染（SSR）环境中。

### 2.2 `.env` 文件加载机制

Vite 使用 `dotenv` 从你的项目根目录加载 `.env` 文件。它根据当前运行的**模式**自动加载特定的文件。

| 文件名称                | 加载时机                                  | 优先级 (从上至下递增) |
| :---------------------- | :---------------------------------------- | :------------------- |
| `.env`                  | 所有情况下                                | 最低                 |
| `.env.local`            | 所有情况下，但会被 `gitignore` 忽略         |                      |
| `.env.[mode]`           | 仅在指定模式下                            |                      |
| `.env.[mode].local`     | 仅在指定模式下，但会被 `gitignore` 忽略     | 最高                 |

**示例文件结构：**

```
my-project/
├── .env                   # 通用环境变量
├── .env.development       # 开发环境变量
├── .env.staging           # 预发布环境变量
├── .env.production        # 生产环境变量
├── .env.local             # 本地覆盖变量（不提交git）
└── src/
    └── main.ts
```

### 2.3 安全性与前缀要求

为了防止意外地将机密信息泄露到客户端，Vite **默认只有以 `VITE_` 为前缀的变量**才会被暴露给经过 Vite 处理的代码。

```bash
# 在 .env.development 中
VITE_API_BASE_URL=https://api-dev.example.com
DB_PASSWORD=secret123 # 这个变量不会被暴露给客户端代码
```

在代码中，你可以这样访问：

```typescript
// 正确：可以被访问
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// 错误：将会是 undefined
const dbPassword = import.meta.env.DB_PASSWORD;
```

## 3. 多环境配置实战

让我们通过一个完整的例子来配置开发、预发布和生产三个环境。

### 3.1 创建环境变量文件

首先，在项目根目录创建以下文件：

**.env (通用配置，可选)**

```bash
# 所有环境的通用变量
VITE_APP_NAME=My Awesome App
VITE_APP_VERSION=1.0.0
```

**.env.development (开发环境)**

```bash
# 开发环境变量
VITE_API_BASE_URL=https://api-dev.example.com
VITE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

**.env.staging (预发布环境)**

```bash
# 预发布环境变量
VITE_API_BASE_URL=https://api-staging.example.com
VITE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_ID=UA-STAGING-ID
```

**.env.production (生产环境)**

```bash
# 生产环境变量
VITE_API_BASE_URL=https://api.example.com
VITE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_ID=UA-PRODUCTION-ID
```

**.env.local (本地覆盖，添加到 .gitignore)**

```bash
# 本地覆盖，用于覆盖上述任何配置，例如本地开发的API
VITE_API_BASE_URL=http://localhost:3001
```

### 3.2 配置 `package.json` 脚本

在 `package.json` 中，为不同的环境配置构建脚本，通过 `--mode` 选项指定模式。

```json
{
  "scripts": {
    "dev": "vite", // 默认使用 development 模式
    "build": "vite build", // 默认使用 production 模式
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production",
    "preview": "vite preview"
  }
}
```

**运行命令：**

```bash
# 启动开发服务器（加载 .env.development 和 .env.development.local）
npm run dev

# 构建预发布版本（加载 .env.staging 和 .env.staging.local）
npm run build:staging

# 构建生产版本（加载 .env.production 和 .env.production.local）
npm run build:production
```

### 3.3 在代码中使用环境变量

在你的源代码（Vue, React, Svelte, TS 等）中，你可以直接使用这些变量。

```typescript
// src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  // ... post, put, delete 等方法
};
```

```vue
<!-- src/components/DebugInfo.vue -->
<template>
  <div v-if="import.meta.env.VITE_DEBUG">
    <h3>Debug Information</h3>
    <p>Mode: {{ import.meta.env.MODE }}</p>
    <p>API Base: {{ import.meta.env.VITE_API_BASE_URL }}</p>
  </div>
</template>

<script setup lang="ts">
// 逻辑部分可以直接使用 import.meta.env
</script>
```

## 4. 高级用法与最佳实践

### 4.1 类型安全 (TypeScript)

为了获得完整的 TypeScript 类型提示和智能感知，你可以在 `src` 目录下创建一个 `env.d.ts` 文件。

**src/env.d.ts**

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEBUG: string // 注意：dotenv 读取的值都是 string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ANALYTICS_ID?: string // 可选属性
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

现在，当你在代码中输入 `import.meta.env.VITE_` 时，IDE 会自动提示可用的变量。

### 4.2 处理布尔值

环境变量通过 `dotenv` 读取后总是字符串。你需要手动将它们转换为布尔值或其他类型。

```typescript
// 使用简单的比较来转换为布尔值
const isDebug = import.meta.env.VITE_DEBUG === 'true';
const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

// 一个更健壮的转换函数
function parseEnvVar(value: string | undefined): string | boolean | number | null {
  if (value === undefined) return null;
  // 尝试解析为数字
  if (!isNaN(Number(value))) return Number(value);
  // 检查布尔值
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  // 默认为字符串
  return value;
}

const debugMode = parseEnvVar(import.meta.env.VITE_DEBUG); // 返回 true, false 或 null
```

### 4.3 在 Vite 配置中使用环境变量

有时你可能想根据环境变量来修改 Vite 本身的配置（`vite.config.ts`）。注意，这里的环境变量是 Node.js 进程的环境变量，**不是** `import.meta.env` 中的。

**vite.config.ts**

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // loadEnv 会加载 .env 文件
  // 第三个参数默认为 ''，会加载所有以 VITE_ 开头的变量，也可以指定前缀
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // 示例：根据环境变量决定构建选项
    build: {
      sourcemap: env.VITE_SOURCE_MAP === 'true', // 使用环境变量控制 sourcemap
    },
    // 示例：代理配置也可能依赖于环境变量
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
```

## 5. 替代方案与社区实践

### 5.1 使用 JavaScript 配置文件

对于一些复杂的配置，或者当环境变量不足以满足需求时（例如需要条件逻辑），可以创建 JS 配置文件。

**src/config/staging.js**

```javascript
export const config = {
  apiBaseUrl: 'https://api-staging.example.com',
  enableAnalytics: true,
  analyticsId: 'UA-STAGING-ID',
  features: {
    newDashboard: true,
    legacyApi: false,
  },
};
```

**src/config/production.js**

```javascript
export const config = {
  apiBaseUrl: 'https://api.example.com',
  enableAnalytics: true,
  analyticsId: 'UA-PRODUCTION-ID',
  features: {
    newDashboard: false, // 生产环境先关闭新功能
    legacyApi: true,
  },
};
```

**src/config/index.js**

```javascript
// 根据 import.meta.env.MODE 动态导入配置
const configMap = {
  development: () => import('./development.js'),
  staging: () => import('./staging.js'),
  production: () => import('./production.js'),
};

// 默认使用开发配置
const env = import.meta.env.MODE || 'development';

export const loadConfig = async () => {
  const module = await configMap;
  return module.config;
};
```

在应用入口文件中异步加载配置：

```typescript
// main.ts
const initApp = async () => {
  const config = await loadConfig();
  // 根据配置初始化应用，例如设置 axios 的 baseURL
  app.provide('appConfig', config); // 在 Vue 中提供配置

  app.mount('#app');
};

initApp();
```

### 5.2 与环境无关的构建 (Build Once, Deploy Anywhere)

有时 CI/CD 流水线更倾向于构建一次，然后将同一个构建产物部署到不同环境。这可以通过在**运行时**而非构建时注入配置来实现。

1. **在 `public/` 目录下放置一个配置文件**，例如 `config.json`。
2. 在应用启动时，首先通过 `fetch('/config.json')` 获取配置。
3. 使用获取到的配置来初始化应用。

这种方法的好处是构建过程完全一致，部署时只需替换 `public/config.json` 文件即可改变环境。

## 6. 安全注意事项

1. **永远不要将 `.env.local` 或任何包含敏感信息的文件提交到版本控制系统**。确保它们在你的 `.gitignore` 中。

    ```
    .env.local
    .env.*.local
    *.local
    ```

2. **牢记 `VITE_` 前缀规则**：任何以 `VITE_` 为前缀的变量都会被包含在客户端代码包中。**绝对不要**将密码、API 密钥、数据库连接字符串等敏感信息以 `VITE_` 为前缀存储。
3. **敏感信息应通过后端传递**：真正的敏感配置应该由后端服务器管理，并通过安全的 API 端点提供给前端应用。

## 7. 总结

Vite 提供了一套强大而灵活的多环境管理机制，核心在于 `.env` 文件和 `模式` 的概念。最佳实践总结如下：

- **基础**：使用 `.env.[mode]` 文件族来管理不同环境的变量。
- **安全**：严格遵守 `VITE_` 前缀约定，保护敏感信息。
- **脚本**：在 `package.json` 中配置清晰的 `--mode` 脚本。
- **类型**：通过 `env.d.ts` 文件获得 TypeScript 类型支持。
- **进阶**：对于复杂场景，可考虑使用动态导入的 JS 配置文件或在运行时注入配置。

通过遵循本文指南，你可以为你的 Vite 项目建立起一个清晰、健壮且可扩展的多环境配置系统，从而显著提升开发和部署的效率与可靠性。
