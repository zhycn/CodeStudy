好的，请看下面为您生成的关于 Vite JavaScript API 的精品技术文档。

---

# Vite JavaScript API 详解与最佳实践

## 1. 引言

Vite 不仅仅是一个开箱即用的构建工具，它更是一个强大的 JavaScript 库。通过其精心设计的 JavaScript API，开发者可以以编程方式与 Vite 深度交互，从而创建高度定制化的开发服务器、构建流程，甚至开发自己的上层框架和脚手架工具。

本文将深入解析 Vite 的核心 JavaScript API，通过清晰的代码示例和最佳实践，帮助你掌握这一强大能力。

## 2. 核心概念：开发服务器 vs 构建模式

Vite 的 JavaScript API 主要围绕两个核心模式展开：

1. **开发模式**：通过 `createServer` 创建一个开发服务器，提供超快的热更新服务。
2. **构建模式**：通过 `build` 和 `preview` 进行生产构建并预览构建产物。

理解这两种模式的分离是有效使用 API 的关键。

## 3. 主要 API 解析

### 3.1 `createServer` - 创建开发服务器

这是用于启动开发环境的核心函数。它返回一个 `ViteDevServer` 实例，该实例提供了与 Vite 开发服务器交互的接口。

#### 基本用法

```javascript
// server.js
import { createServer } from 'vite';

const server = await createServer({
  // 任何有效的 Vite 配置选项
  root: './src',
  server: {
    port: 3000,
    open: true, // 自动在浏览器中打开
  },
  optimizeDeps: {
    include: ['some-large-library'], // 预构建依赖
  },
});

// 启动服务器
await server.listen();

// 打印服务器地址
server.printUrls();

// 你也可以监听 'error' 事件
server.ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// 优雅地关闭服务器
process.on('SIGTERM', () => {
  server.close().then(() => {
    console.log('Server closed.');
  });
});
```

运行以上服务器：

```bash
node server.js
```

#### `ViteDevServer` 实例的重要属性和方法

- `server.httpServer`: 底层的 `http.Server` 实例，可用于集成到其他 HTTP 服务器（如 Express）。
- `server.ws`: 用于发送自定义 WebSocket 事件的 `WebSocketServer` 实例。
- `server.middlewares`: 用于附加自定义中间件的 `Connect` 实例。
- `server.listen(port?)`: 启动服务器。
- `server.close()`: 停止服务器。
- `server.restart(force?: boolean)`: 重启服务器（例如，在配置文件更改后）。
- `server.transformRequest(url: string)`: 手动转换请求的 URL，可用于服务器端渲染（SSR）。
- `server.ssrLoadModule(url: string)`: 在 SSR 上下文中加载模块。

### 3.2 `build` - 执行生产构建

`build` 函数用于执行生产环境的构建，它封装了 Rollup 的构建过程，并应用了 Vite 特有的优化。

#### 基本用法

```javascript
// build.js
import { build } from 'vite';

try {
  const buildResult = await build({
    // Vite 构建配置
    root: './src',
    build: {
      outDir: './dist',
      assetsDir: 'static',
      minify: 'esbuild', // 使用 esbuild 进行最小化
      sourcemap: true, // 生成 source map
      rollupOptions: {
        // 传递给 Rollup 的选项
        input: {
          main: './src/index.html', // 多页应用入口
        },
        output: {
          manualChunks: (id) => {
            // 自定义 chunk 分割策略
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  });

  console.log('Build completed successfully!');
  // buildResult 是一个数组，包含 Rollup 的输出
  console.log(buildResult[0].output[0]);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
```

运行构建脚本：

```bash
node build.js
```

### 3.3 `preview` - 预览构建产物

在生产构建完成后，使用 `preview` API 可以启动一个本地静态服务器来预览构建后的结果，确保其在生产环境下能正常工作。

#### 基本用法

```javascript
// preview.js
import { preview } from 'vite';

const previewServer = await preview({
  build: {
    outDir: './dist', // 必须与 build 配置中的 outDir 一致
  },
  preview: {
    port: 5000,
    open: true,
  },
});

console.log(`Preview server running at ${previewServer.resolvedUrls.local[0]}`);
```

运行预览脚本：

```bash
node preview.js
```

### 3.4 `resolveConfig` - 解析配置

此函数用于以编程方式解析最终的 Vite 配置。它考虑了配置文件、插件和命令行参数，并应用了所有默认值。这在编写需要与用户 Vite 配置交互的复杂工具时非常有用。

```javascript
import { resolveConfig } from 'vite';

const config = await resolveConfig(
  {
    // 这里可以覆盖任何配置选项，类似于命令行 --config
  },
  'build',
  'production'
); // 第二个参数是命令模式，第三个是环境模式

console.log('Resolved root:', config.root);
console.log(
  'Resolved plugins:',
  config.plugins.map((p) => p.name)
);
```

## 4. 最佳实践与常见用例

### 4.1 与 Node.js 框架（如 Express）集成

你可以将 Vite 的开发服务器作为中间件集成到现有的 Node.js 服务器中，从而在开发时享受 HMR，同时保留后端 API。

```javascript
// server-express.js
import express from 'express';
import { createServer as createViteServer } from 'vite';

async function createServer() {
  const app = express();

  // 创建 Vite 服务器
  const vite = await createViteServer({
    server: { middlewareMode: true }, // 关键：启用中间件模式
  });

  // 使用 Vite 的中间件
  app.use(vite.middlewares);

  // 你的自定义 API 路由
  app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from Express API!' });
  });

  // 非常重要：使用 vite.middlewares 处理所有其他请求（用于 SPA 路由）
  // 因为 middlewareMode 下，Vite 不处理自己的 HTML 服务，需要框架处理
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // 1. 读取 index.html
      let template = await vite.transformIndexHtml(url, '<html>...<!-- SSR APP -->...</html>'); // 通常从磁盘读取

      // 2. 根据需要应用 HTML 转换。Vite 的 HMR 客户端已自动注入。
      // 3. 发送处理后的 HTML。
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      // 如果捕获到错误，让 Vite 修复堆栈跟踪，以便它映射回您的实际源代码。
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(3000, () => {
    console.log('Express server with Vite integration running at http://localhost:3000');
  });
}

createServer();
```

### 4.2 构建自定义 CLI 或脚手架工具

你可以利用这些 API 构建自己的 CLI 工具，动态生成或修改配置。

```javascript
#!/usr/bin/env node
// my-vite-cli.js
import { build, createServer } from 'vite';
import { program } from 'commander';

program
  .version('1.0.0')
  .command('dev')
  .description('Start development server')
  .option('-p, --port <number>', 'port number', 3000)
  .action(async (options) => {
    const server = await createServer({
      // 可以基于命令行参数动态生成配置
      server: { port: parseInt(options.port) },
      // 可以从远程获取或根据模板生成配置文件
    });
    await server.listen();
    server.printUrls();
  });

program
  .command('build')
  .description('Build for production')
  .action(async () => {
    await build({
      // 自定义构建逻辑
      build: { minify: 'terser' },
    });
    console.log('Build with custom CLI complete!');
  });

program.parse();
```

### 4.3 服务器端渲染（SSR）集成

Vite 的 API 为 SSR 提供了原生支持。`ssrLoadModule` 是其中的关键。

```javascript
// ssr-server.js
import express from 'express';
import { createServer as createViteServer } from 'vite';

async function createSsrServer() {
  const app = express();

  const vite = await createViteServer({
    server: { middlewareMode: 'ssr' }, // 明确指定 SSR 中间件模式
  });

  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // 1. 读取 index.html
      const template = `<!DOCTYPE html><html><head><!-- SSR HEAD --></head><body><div id="app"><!-- SSR-APP --></div></body></html>`;

      // 2. 加载服务器入口。这会在 Vite 的开发服务器中进行转换（按需编译等）。
      const { render } = await vite.ssrLoadModule('/src/entry-server.js');

      // 3. 渲染应用程序的 HTML。假设 `render` 函数调用了框架的 SSR API
      //    并返回了 HTML 字符串或更复杂的对象。
      const appHtml = await render(url);

      // 4. 将渲染的 HTML 注入模板。
      const html = template.replace('<!-- SSR-APP -->', appHtml);

      // 5. 发送完整的 HTML。
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(3000);
}

createSsrServer();
```

### 4.4 编程式触发 HMR

你可以通过开发服务器的 WebSocket 连接手动发送自定义 HMR 事件。

```javascript
// 假设你已经有了 server 实例
server.ws.send({
  type: 'custom',
  event: 'special-update',
  data: { changedFile: 'some-file.js' },
});

// 在客户端代码中接收
if (import.meta.hot) {
  import.meta.hot.on('special-update', (data) => {
    // 根据 data 执行自定义更新逻辑
    console.log('File changed:', data.changedFile);
  });
}
```

## 5. 错误处理与调试

始终对 API 调用使用 `try...catch` 块。

```javascript
try {
  const server = await createServer(/* ... */);
  await server.listen();
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
```

使用 `--inspect` 标志运行你的 Node.js 脚本，并利用 Chrome DevTools 来调试你的构建或服务器脚本。

```bash
node --inspect your-vite-script.js
```

## 6. 版本控制与兼容性

- **Vite 7.x**: 本文档基于最新的 Vite 7.x API。请始终查阅你项目中所安装的特定版本的 <https://vitejs.dev/guide/api-javascript.html。>
- 在升级 Vite 版本时，请仔细阅读 <https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md，因为> API 可能会发生细微变化。

## 7. 总结

Vite 的 JavaScript API 将其从一个优秀的命令行工具提升为一个强大的编程平台。通过掌握 `createServer`, `build`, `preview` 和 `resolveConfig` 等核心函数，你可以：

- **创建高度定制化的开发环境**，无缝集成到你的技术栈中。
- **构建复杂的构建流水线**，实现自动化部署和高级优化。
- **开发下一代元框架和工具**，为社区提供强大的开发体验。

建议你从简单的脚本开始实验，逐步探索这些 API 的强大潜力。

## 8. 资源与进一步阅读

1. <https://vitejs.dev/guide/api-javascript.html>
2. <https://github.com/vitejs/vite>
3. <https://vitejs.dev/guide/ssr.html>
4. <https://rollupjs.org/javascript-api/> (深入了解构建过程)

---

**注意**：本文档中的代码示例旨在说明概念，在实际项目中使用时请根据你的具体需求和项目结构进行调整。始终参考官方文档以获取最准确和最新的信息。
