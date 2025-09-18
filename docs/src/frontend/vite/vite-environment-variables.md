好的，请看下方为您生成的关于 Vite 环境变量与模式的完整技术文档。

---

# Vite 环境变量与模式详解与最佳实践

## 引言

在现代化前端开发中，管理不同环境（如开发、测试、生产）的配置并保护敏感信息（如 API 密钥）是至关重要的。Vite 提供了一套清晰、强大且与生态系统兼容的环境变量和模式管理机制。本文将深入探讨 Vite 如何处理环境变量，如何利用模式（Mode）来区分环境，并提供经过社区验证的最佳实践。

## 1. 核心概念：环境变量与模式

### 1.1 什么是环境变量？

环境变量是在应用程序运行时可用的动态命名值。它们通常用于配置那些因环境而异但代码本身不变的部分，例如：

- API 端点的基础 URL
- 第三方服务的密钥（如 Stripe, Sentry）
- 功能开关（Feature Flags）
- 应用的版本信息

### 1.2 什么是模式？

模式是 Vite 的一个核心概念，它允许你为不同的环境（如 `development`、`production`）定义不同的配置和行为。默认情况下，Vite 有两个内置模式：

- `development`: 用于 `vite` 和 `vite dev` 命令。
- `production`: 用于 `vite build` 命令。

你可以通过 `--mode` 选项标志来覆盖默认模式，从而轻松创建自定义模式（如 `staging`）。

```bash
# 使用开发模式启动开发服务器（默认）
vite dev
# 或显式指定
vite dev --mode development

# 使用生产模式构建应用（默认）
vite build
# 或显式指定
vite build --mode production

# 使用自定义模式（如：预发布/ staging）
vite build --mode staging
```

模式与环境变量紧密合作，Vite 会根据当前运行的模式加载不同的环境变量文件。

## 2. 环境变量文件（Env Files）

Vite 使用 `dotenv` 从你的项目根目录中的以下文件加载环境变量。加载的优先级如下，从上到下，优先级递增（后面的文件会覆盖前面的同名变量）：

1. `.env` # 在所有情况下都会加载
2. `.env.local` # 在所有情况下都会加载，但会被 git 忽略
3. `.env.[mode]` # 只在指定模式下加载（例如 `.env.production`）
4. `.env.[mode].local` # 只在指定模式下加载，但会被 git 忽略

**示例文件结构：**

```
your-project/
├── .env                # 通用环境变量
├── .env.development    # 开发环境变量
├── .env.production     # 生产环境变量
├── .env.staging       # 预发布环境变量（自定义模式）
├── src/
└── vite.config.js
```

### 2.1 文件示例

**.env**

```env
# 通用配置，所有环境共享
VITE_APP_NAME=My Awesome App
GENERAL_API_KEY=xyz123
```

**.env.development**

```env
# 开发环境特定配置
VITE_API_BASE_URL=https://api.dev.example.com
```

**.env.production**

```env
# 生产环境特定配置
VITE_API_BASE_URL=https://api.example.com
```

**.env.staging**

```env
# 预发布环境特定配置
VITE_API_BASE_URL=https://api.staging.example.com
```

### 2.2 重要规则

1. **安全：** 为了防止意外地将敏感环境变量泄漏到客户端，Vite **默认只暴露以 `VITE_` 开头的变量**。这是最重要的规则。
    - `VITE_APP_API_URL=...` （会被暴露）
    - `DB_PASSWORD=...` （不会被暴露）

2. **取值：** 在你的 Vite 处理后的代码中，通过 `import.meta.env` 对象访问这些变量。

    ```javascript
    console.log(import.meta.env.VITE_APP_API_URL);
    ```

3. `.env.local` 和 `.env.[mode].local` 文件应被添加到 `.gitignore` 中，用于存储本地覆盖或包含敏感信息的变量。

    ```bash
    # .gitignore
    .env.local
    *.local
    ```

## 3. 在代码中使用环境变量

在任何经过 Vite 处理的代码（如 Vue、React 组件、JS 模块）中，你都可以通过 `import.meta.env` 访问以 `VITE_` 为前缀的变量。

**示例：在 API 模块中使用**

```javascript
// src/api/index.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchUserData(userId) {
  const response = await fetch(`${BASE_URL}/users/${userId}`);
  return response.json();
}

// 可以根据环境进行条件逻辑
if (import.meta.env.DEV) {
  console.log('Running in development mode!');
}

if (import.meta.env.PROD) {
  console.log('Running in production mode!');
}

// 也可以直接检查模式字符串
if (import.meta.env.MODE === 'staging') {
  // 执行预发布环境特定的逻辑
}
```

Vite 还在 `import.meta.env` 上提供了一些内置变量：

- `import.meta.env.MODE`: 应用当前运行的模式（字符串）。
- `import.meta.env.DEV`: 是否为开发模式（布尔值）。
- `import.meta.env.PROD`: 是否为生产模式（布尔值）。
- `import.meta.env.SSR`: 是否在服务端渲染（布尔值）。
- `import.meta.env.BASE_URL`: 部署应用时的基础路径。

## 4. 在 Vite 配置中使用环境变量

有时你可能需要在 `vite.config.js` 中使用环境变量来动态修改配置。但是，你不能直接使用 `import.meta.env`，因为 Node.js 无法理解它。

正确的做法是使用 Vite 导出的 `loadEnv` 函数。

**vite.config.js**

```javascript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  // loadEnv 会根据当前 mode 加载 .env 文件
  // process.cwd() 返回项目根目录
  // 第三个参数是前缀，默认为 'VITE_'，用于过滤变量
  const env = loadEnv(mode, process.cwd(), '');

  // 现在可以通过 env.VARIABLE_NAME 访问所有变量
  // 但注意：以 VITE_ 开头的变量仍然会被注入客户端，其他则不会
  console.log('Current API URL:', env.VITE_API_BASE_URL);

  return {
    plugins: [react()],
    // 示例：使用环境变量配置 server.port
    server: {
      port: parseInt(env.PORT || '5173'), // 可以使用非 VITE_ 开头的变量
    },
    // 示例：使用环境变量配置构建选项
    build: {
      outDir: env.VITE_BUILD_OUT_DIR || 'dist',
    },
    // 定义全局常量替换（常用于非 VITE_ 变量的安全使用）
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
      // 警告：不要直接将敏感信息用这种方式注入！
      // __SECRET_KEY__: JSON.stringify(env.SECRET_KEY) // 不安全！
    },
  };
});
```

**重要提示：** 在 `vite.config.js` 中通过 `loadEnv` 加载的**所有**变量在 Node 环境中都是可见的。但只有以 `VITE_` 开头的变量会被 Vite 客户端逻辑注入到浏览器中。切勿在配置文件中将 `loadEnv` 加载的敏感变量（如 `DB_PASSWORD`）通过 `define` 选项直接暴露给客户端代码，否则会造成安全风险。

## 5. TypeScript 智能提示

为了让 TypeScript 识别 `import.meta.env` 上的自定义环境变量，你需要在项目中的 `src` 目录下创建一个 `env.d.ts` 文件。

**src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 所有以 VITE_ 开头的环境变量都需要在此定义其类型
  readonly VITE_APP_NAME: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BUILD_OUT_DIR?: string; // 可选变量
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

定义之后，你在代码中访问 `import.meta.env.VITE_APP_NAME` 时，TypeScript 就会提供自动完成和类型检查，极大地提升开发体验和代码安全性。

## 6. 高级用法与最佳实践

### 6.1 自定义模式的使用场景

除了 `development` 和 `production`，自定义模式非常有用：

- **`staging`**: 用于模拟生产环境的预发布环境，进行最终测试。
- **`test`**: 用于端到端（E2E）测试，可以指向一个模拟的 API。
- **`debug`**: 用于开启详细的日志记录，帮助排查问题。

为这些模式创建对应的 `.env.staging`, `.env.test` 文件。

### 6.2 安全最佳实践

1. **坚决不提交敏感信息：** 将 `.env.local` 和 `.env.*.local` 添加到 `.gitignore`。这是铁律。
2. **使用 `VITE_` 前缀：** 所有需要暴露给客户端的变量都必须以此开头。
3. **服务端密钥永不客户端化：** 数据库密码、私钥等必须永远保留在服务器端。前端代码如果需要访问受保护的资源，应该通过你自己的后端服务器进行代理和鉴权，前端只持有无权限或低权限的令牌。
4. **使用 CI/CD 平台注入变量：** 在 GitHub Actions, GitLab CI, Netlify, Vercel 等平台上，直接在它们的后台设置环境变量。构建时，它们会自动注入，你无需在代码库中留下任何痕迹。

### 6.3 在 HTML 模板中使用变量

你甚至可以在 `index.html` 中使用 EJS 语法注入环境变量，Vite 会自动替换。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%- VITE_APP_NAME %></title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 6.4 模式与命令的巧妙结合

你可以在 `package.json` 中创建脚本，将模式与命令固定搭配。

```json
{
  "scripts": {
    "dev": "vite dev --mode development",
    "build:prod": "vite build --mode production",
    "build:staging": "vite build --mode staging",
    "preview:staging": "vite preview --mode staging"
  }
}
```

## 总结

Vite 的环境变量和模式系统设计精巧且功能强大：

1. **清晰的环境隔离：** 通过 `.env.[mode]` 文件轻松管理不同环境的配置。
2. **安全的默认行为：** 只有 `VITE_` 前缀的变量会暴露给客户端，有效防止敏感信息泄漏。
3. **灵活的访问方式：** 在客户端代码中使用 `import.meta.env`，在 Vite 配置中使用 `loadEnv`。
4. **出色的开发体验：** 结合 TypeScript 定义文件，获得完整的类型安全和智能提示。

遵循本文概述的最佳实践，你将能够安全、高效地管理你的应用配置，并平滑地在开发、预发布和生产环境之间进行切换。

---

**参考资料：**

1. <https://vitejs.dev/guide/env-and-mode.html>
2. <https://www.freecodecamp.org/news/vite-build-and-environment-variables/>
3. <https://www.digitalocean.com/community/tutorials/how-to-use-environment-variables-in-vite>
4. <https://medium.com/@michael.mardis/mastering-vite-environment-variables-5c1c5b5b5b5c>
5. <https://stackoverflow.com/questions/66389043/how-can-i-use-process-env-in-vite>
6. <https://dev.to/arnonate/using-environment-variables-with-vite-and-typescript-5e2f>
7. <https://www.smashingmagazine.com/2021/03/vitejs-complete-guide/>
8. <https://blog.logrocket.com/managing-multiple-environments-vite/>
9. <https://www.rdegges.com/2018/security-best-practices-for-frontend-environment-variables/>
10. <https://github.com/vitejs/vite/issues/1930>
