好的，请看下方为您生成的关于 Vite 服务端渲染（SSR）的完整技术文档。

---

# Vite 服务端渲染（SSR）详解与最佳实践

## 摘要

本文深入探讨了 Vite 在服务端渲染 (SSR) 中的应用。内容涵盖 SSR 的核心概念、Vite 的两种 SSR 模式、完整的配置指南、详细的代码示例、性能优化策略以及常见问题解决方案。无论您是构建全新的 SSR 框架还是为现有项目集成 SSR，本文都将为您提供权威的指导和最佳实践。

## 1. 核心概念：为什么选择 SSR 与 Vite？

### 1.1 SSR 的优势

服务端渲染 (SSR) 是一种在服务器上将组件渲染成 HTML 字符串，再发送到客户端的技术。与传统的客户端渲染 (CSR) 相比，它具有以下显著优势：

* **更好的核心 Web 指标 (Core Web Vitals)**：特别是更快的**最大内容绘制 (LCP)** 和**首次内容绘制 (FCP)**，因为用户能更快看到页面内容，而无需等待所有 JavaScript 下载和执行完毕。
* **卓越的 SEO**：搜索引擎爬虫可以直接接收到完整渲染的 HTML 页面，无需执行 JavaScript，这大大提高了页面的可索引性。
* **更好的用户体验**：在慢速网络或低性能设备上，用户能更快地看到基本内容，感知性能更高。

### 1.2 Vite 在 SSR 中的价值

Vite 的革命性在于其基于 ESM 的开发服务器，这一特性同样赋能了 SSR 开发体验：

* **统一的开发体验**：Vite 为客户端和服务器代码提供了**一致的开发体验**。服务器代码也能享受 TypeScript、JSX、热更新 (HMR) 等支持，无需复杂的打包配置。
* **高效的 HMR**：在开发模式下，对 SSR 源代码的更改可以触发高效的热更新，让你在调试 SSR 应用时也能保持流畅的开发流程。
* **双模式构建**：Vite 能够分别对客户端资源和服务器端代码进行**优化构建**，为生产环境做好充分准备。
* **强大的生态系统**：众多主流框架（如 Nuxt, SvelteKit, SolidStart, Qwik）都基于 Vite 构建，证明了其作为 SSR 基础工具的稳定性和灵活性。

## 2. Vite SSR 模式详解

Vite 提供了两种主要的 SSR 模式，适用于不同的场景。

### 2.1 模式一：中间件模式 (Middleware Mode)

在此模式下，你需要创建一个 Node.js 服务器（如 Express, Koa），并将 Vite 作为中间件集成。Vite 负责转换和提供源代码，而你的服务器则负责调用渲染函数并处理路由。

* **优点**：**控制力极强**，你可以完全自定义服务器的所有逻辑，适用于高度定制化的场景或现有 Node.js 项目的改造。
* **缺点**：需要手动设置更多样板代码。

### 2.2 模式二：完整模式 (Full Mode)

Vite 本身可以创建一个生产就绪的 Node.js 服务器。你提供一个“服务器入口”(Server Entry)，Vite 会为你处理模块加载和创建处理函数。

* **优点**：**设置简单**，Vite 帮你处理了大多数底层细节，更接近主流全栈框架（如 Next.js）的体验。
* **缺点**：自定义的灵活性略低于中间件模式。

**如何选择？** 对于大多数新项目，建议从**完整模式**开始，因为它更简单。如果你需要深度集成到特定的后端架构中，则选择**中间件模式**。

## 3. 实战：从零搭建一个 Vite SSR 项目

我们将使用最流行的 **中间件模式** 和 **React** 来演示一个完整的项目 setup。此示例也适用于其他 UI 框架，概念是相通的。

### 3.1 项目结构与依赖

首先，创建一个新项目并安装必要依赖。

```bash
npm create vite@latest my-ssr-project -- --template react
cd my-ssr-project
npm install
npm install express compression
npm install --save-dev @types/express @types/compression
```

项目最终结构如下：

```
my-ssr-project/
├── index.html
├── src/
│   ├── client/
│   │   ├── entry-client.jsx   # 客户端入口 (Hydration)
│   │   └── ...
│   ├── server/
│   │   ├── entry-server.jsx   # 服务器入口 (SSR 渲染)
│   │   └── ...
│   └── App.jsx
├── server/
│   └── index.js              # Express 服务器文件
├── vite.config.js
└── package.json
```

### 3.2 关键文件配置

#### `index.html`

`index.html` 必须包含客户端入口，并且需要一个占位符用于注入 SSR 后的 HTML。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite SSR App</title>
  </head>
  <body>
    <!--ssr-outlet-->
    <div id="root"><!--app-html--></div>
    <script type="module" src="/src/client/entry-client.jsx"></script>
  </body>
</html>
```

#### `src/App.jsx`

一个普通的 React 组件。

```jsx
import React from 'react';

function App() {
  return (
    <div>
      <h1>Hello from Vite SSR!</h1>
      <p>This page is server-rendered.</p>
    </div>
  );
}

export default App;
```

#### `src/server/entry-server.jsx`

服务器入口负责渲染组件为 HTML 字符串。

```jsx
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../App';

export function render() {
  // 将 App 组件渲染成 HTML 字符串
  const appHtml = renderToString(<App />);
  
  // 返回包含 HTML 和任何其他需要的数据（如预加载指令）的对象
  return { appHtml };
}
```

#### `src/client/entry-client.jsx`

客户端入口负责“激活”(Hydrate) 服务器渲染的静态 HTML，使其成为可交互的 SPA。

```jsx
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from '../App';

// Hydrate 服务器渲染的 HTML
hydrateRoot(
  document.getElementById('root'),
  <App />
);
```

#### `server/index.js`

Express 服务器，集成 Vite 中间件。

```javascript
import fs from 'fs';
import path from 'path';
import express from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';

async function createServer() {
  const app = express();
  app.use(compression()); // 使用 gzip 压缩

  // 以中间件模式创建 Vite 服务器
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom' // 不引入 Vite 默认的 HTML 处理逻辑
  });

  // 使用 Vite 的实例中间件
  app.use(vite.middlewares);

  // 处理所有路由的 SSR
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // 1. 读取 index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, '../index.html'),
        'utf-8'
      );

      // 2. 应用 Vite 的 HTML 转换。这会注入 Vite HMR 客户端，
      //    同时也会应用 HTML 转换，例如从 Vite 插件引入的 ESM 引用。
      template = await vite.transformIndexHtml(url, template);

      // 3. 加载服务器入口。vite.ssrLoadModule 自动转换
      //    你的 ESM 源代码，使其可以在 Node.js 中运行！无需打包。
      const { render } = await vite.ssrLoadModule('/src/server/entry-server.jsx');

      // 4. 调用入口函数，渲染应用的 HTML。
      const { appHtml } = await render();

      // 5. 将渲染的 HTML 注入到模板中。
      const html = template.replace(`<!--app-html-->`, appHtml);

      // 6. 返回最终的 HTML。
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      // 如果捕获到错误，让 Vite 修复堆栈跟踪，以便它映射回你的实际源代码。
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(5173, () => {
    console.log('SSR Server is running on http://localhost:5173');
  });
}

createServer();
```

#### `vite.config.js`

关键的 Vite 配置，用于区分客户端和服务器的构建。

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  ssr: {
    // 防止某些包在 SSR 时被外部化（bundled），确保它们被 Vite 处理
    noExternal: ['react-router-dom'] // 如果有使用，请添加
  }
});
```

### 3.3 运行项目

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "dev": "node server",
    "build": "vite build && vite build --ssr src/server/entry-server.jsx",
    "preview": "vite preview"
  }
}
```

现在，运行 `npm run dev` 并访问 `http://localhost:5173`。查看页面源代码，你会看到已经包含了完整渲染的 HTML，而不是空的 `<div id="root">`。

## 4. 生产环境构建与部署

开发环境使用 `vite.ssrLoadModule` 进行即时转换，但生产环境需要构建以获得最佳性能。

### 4.1 构建命令

Vite 6+ 推荐使用如下命令分别构建客户端和服务器资源：

```bash
vite build # 构建客户端资源
vite build --ssr src/entry-server.jsx # 构建 SSR 入口
```

这会在 `dist/` 和 `dist/ssr/` 分别生成构建产物。

### 4.2 生产服务器

你需要一个生产服务器来提供构建后的文件。修改 `server/index.js`，使其在生产环境下使用构建后的文件，而不是 `vite.ssrLoadModule`。

```javascript
// ... 其他导入 ...
const isProduction = process.env.NODE_ENV === 'production';

async function createServer() {
  const app = express();
  app.use(compression());

  let vite;
  if (!isProduction) {
    // 开发模式
    vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares);
  } else {
    // 生产模式：提供静态文件和构建后的 SSR 包
    app.use(express.static('dist/client'));
  }

  // 动态导入构建后的服务器入口（生产环境）
  const manifest = isProduction ? await import('./dist/client/ssr-manifest.json') : {};
  const serveProdApp = isProduction ? (await import('./dist/ssr/entry-server.js')).render : null;

  app.use('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;
      let template, render;

      if (isProduction) {
        template = fs.readFileSync(path.resolve('dist/client/index.html'), 'utf-8');
        render = serveProdApp;
      } else {
        template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        ({ render } = await vite.ssrLoadModule('./src/server/entry-server.jsx'));
      }

      const { appHtml } = await render(url, manifest);
      const html = template.replace(`<!--app-html-->`, appHtml);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      if (!isProduction) vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  // ... 监听 ...
}
createServer();
```

## 5. 高级主题与最佳实践

### 5.1 路由与数据预取

集成像 `react-router-dom` 和 `@tanstack/react-query` 或 `swr` 这样的库来处理路由和数据获取。在服务器入口中，匹配当前路由，并在渲染前预取该路由所需的数据。

### 5.2 客户端 Hydration 安全

确保服务器和客户端渲染的虚拟 DOM (vdom) 完全一致，否则会导致 Hydration 失败。避免在组件中使用浏览器特有的 API（如 `window`, `document`），或者使用 `useEffect` 确保它们只在客户端运行。

### 5.3 性能优化

* **代码分割**：利用 `import()` 动态导入和 `vite-plugin-ssr` 等工具实现基于路由的代码分割。
* **静态资源处理**：使用 `import.meta.env.VITE_APP_BASE_URL` 正确处理静态资源的绝对路径。
* **生成 `ssr-manifest.json`**：Vite 的构建功能可以生成一个 manifest 文件，帮助你在生产构建时优化预加载指令 (preload directives) 的生成。

```javascript
// vite.config.js
export default defineConfig({
  build: {
    manifest: true, // 生成 manifest.json
    // ... 其他配置
  },
  ssr: {
    // noExternal: [...]
  }
});
```

### 5.4 使用社区插件

考虑使用成熟的 SSR 框架或插件来简化流程：

* **vite-plugin-ssr**: 一个轻量级但功能强大的 Vite SSR 框架，处理了许多复杂问题。
* **SSR 框架**：直接使用 **Nuxt** (Vue)、**SvelteKit** (Svelte)、**SolidStart** (Solid) 或 **Next.js**，它们都已与 Vite 深度集成。

## 6. 常见问题 (FAQ)

**Q: 开发模式下 HMR 不工作？**
**A:** 确保你的服务器代码正确配置了 Vite 中间件，并且 `index.html` 被 Vite 正确转换。

**Q: 出现 `window is not defined` 错误？**
**A:** 这是最常见的 SSR 错误。原因是服务器端没有 `window` 对象。将使用浏览器全局对象的代码包裹在 `if (typeof window !== 'undefined')` 或 `useEffect` 中。

**Q: 如何获取请求对象（如 cookie）？**
**A:** 你需要通过自定义上下文 (Context) 将请求对象从 Express 服务器传递到你的组件中。流行的数据获取库（如 TanStack Query）通常提供了在 SSR 中预取数据的机制。

## 7. 总结

Vite 通过其创新的架构，极大地简化了 SSR 的设置和开发体验。它提供了无与伦比的开发速度、热更新和统一的构建系统。无论是手动配置一个高度定制化的 SSR 解决方案，还是基于社区框架进行开发，Vite 都是构建现代、高性能、服务端渲染的 Web 应用程序的绝佳基础。

## 8. 参考资源

* <https://vitejs.dev/guide/ssr>
* <https://vitejs.dev/guide/ssr.html>
* <https://vite-plugin-ssr.com/>
* <https://reactjs.org/docs/react-dom-server.html>

---

希望这篇详尽的文档能帮助您掌握 Vite SSR 的核心概念与最佳实践！如果您有任何问题，请随时提问。
