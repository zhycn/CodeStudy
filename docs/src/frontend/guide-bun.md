---
title: Bun 详解与最佳实践
description: 了解 Bun 运行时的详细信息，包括安装、配置、使用和最佳实践。
---

# Bun 详解与最佳实践

- Bun 官方文档：<https://bun.sh/>
- GitHub 仓库：<https://github.com/oven-sh/bun>

## 1. 概述

### 1.1 什么是 Bun？

Bun 是一个现代化的 JavaScript 运行时和工具集，旨在提供更快的性能和更完整的开发体验。它被设计为 Node.js 的直接替代品，但采用了不同的技术栈和架构决策。

**Bun 的核心特点：**

- 使用 Zig 语言编写而非 C++
- 采用 JavaScriptCore 引擎而非 V8
- 内置了对 TypeScript、JSX 的原生支持
- 提供一体化的工具链（运行时、包管理器、测试器、打包工具）
- 强调极致的性能和开发者体验

### 1.2 为什么需要 Bun？

JavaScript 工具链在过去十年中变得复杂而臃肿，项目通常需要多个工具配合使用（如 Webpack、Babel、Jest、ESLint 等）。Bun 试图通过提供一个高度集成化的工具集来解决这个问题，减少配置复杂度并提升执行效率。

### 1.3 Bun 与 Node.js、Deno 的对比

| 特性         | Bun            | Node.js          | Deno         |
| ------------ | -------------- | ---------------- | ------------ |
| **引擎**     | JavaScriptCore | V8               | V8           |
| **语言**     | Zig            | C++              | Rust         |
| **TS 支持**  | 原生           | 需转译           | 原生         |
| **包管理**   | 内置           | 需 npm/yarn/pnpm | 内置         |
| **安全性**   | 标准权限       | 标准权限         | 默认安全沙箱 |
| **API 兼容** | Node.js + Web  | Node.js          | Web + 自有   |

## 2. 安装与配置

### 2.1 安装 Bun

**macOS 和 Linux：**

```bash
# 使用 curl 安装（推荐）
curl -fsSL https://bun.sh/install | bash

# 使用 npm 安装
npm install -g bun

# 使用 Homebrew 安装
brew tap oven-sh/bun
brew install bun
```

**Windows：**

```bash
# Windows 目前支持实验性版本
npm install -g bun@canary
```

> **注意**：Windows 版本目前仅支持运行时功能，包管理器和测试工具仍在开发中。

**Docker：**

```bash
docker pull oven/bun
docker run --rm --init --ulimit memlock=-1:-1 oven/bun
```

### 2.2 升级与卸载

```bash
# 升级到最新稳定版
bun upgrade

# 升级到最新 canary 版本
bun upgrade --canary

# 卸载 Bun
rm -rf ~/.bun
# 或者使用相应包管理器卸载
npm uninstall -g bun
```

### 2.3 环境配置

Bun 会自动读取 `.env` 文件，无需额外配置：

```bash
# .env 文件示例
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
API_KEY="your_api_key_here"
```

在代码中直接访问：

```javascript
// 无需导入任何依赖，Bun 会自动加载 .env 文件
console.log(process.env.DATABASE_URL); // 直接使用环境变量
```

## 3. 核心特性

### 3.1 极速启动与执行

Bun 使用 JavaScriptCore 引擎，启动速度比 Node.js 快 3-4 倍。这对开发体验和服务器less环境特别有价值。

**性能对比测试：**

```javascript
// hello.js
console.log('Hello, World!');
```

```bash
# 性能测试命令
hyperfine 'node hello.js' 'bun hello.js' --warmup 10 --runs 1000

# 典型结果：
# - Node.js: 35.8 ms ± 4.1 ms
# - Bun: 11.1 ms ± 2.0 ms (快约3.2倍)
```

### 3.2 原生 TypeScript 和 JSX 支持

Bun 内置转译器，无需额外配置即可运行 TypeScript、JSX 和 TSX 文件：

```typescript
// index.tsx
import React from 'react';

const App: React.FC = () => {
  return <div>Hello, TypeScript with JSX!</div>;
};

console.log(App.toString());
```

直接运行：

```bash
bun index.tsx  # 无需任何编译步骤
```

### 3.3 ESM 和 CommonJS 兼容

Bun 无缝支持 both ES 模块和 CommonJS，无需担心文件扩展名或配置：

```javascript
// 在同一个文件中混合使用 import 和 require()
import { moduleA } from './module-a';
const moduleB = require('./module-b');

// 这也能正常工作！
export const combined = { ...moduleA, ...moduleB };
```

### 3.4 Web 标准 API

Bun 实现了大多数 Web 标准 API，无需安装额外依赖：

```javascript
// 使用 Fetch API
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// 使用 WebSocket
const ws = new WebSocket('wss://echo.websocket.org');
ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

// 使用 Crypto API
const array = new Uint32Array(10);
crypto.getRandomValues(array);
console.log('Random values:', array);
```

## 4. Bun 作为包管理器

### 4.1 基础用法

Bun 的包管理器速度极快，比 npm 快 20-100 倍。

```bash
# 初始化新项目
bun init

# 安装所有依赖
bun install

# 添加依赖
bun add react react-dom @types/react

# 添加开发依赖
bun add --dev typescript @types/node

# 移除依赖
bun remove lodash

# 更新依赖
bun update
```

### 4.2 与其他包管理器对比

| 特性           | Bun                  | npm                 | Yarn        | pnpm             |
| -------------- | -------------------- | ------------------- | ----------- | ---------------- |
| **安装速度**   | ⚡️ 极快 (最快)      | 🐢 慢               | 🚀 快       | ⚡️ 很快         |
| **磁盘使用**   | 中等                 | 高                  | 高          | 🟢 低            |
| **锁文件**     | `bun.lockb` (二进制) | `package-lock.json` | `yarn.lock` | `pnpm-lock.yaml` |
| **Workspaces** | 🟢 支持              | 🟢 支持             | 🟢 支持     | 🟢 支持          |
| **离线模式**   | 🟢 支持              | 🟢 支持             | 🟢 支持     | 🟢 支持          |

### 4.3 依赖管理最佳实践

1. **使用 Bun 的 Workspaces 管理 monorepo**：

   ```json
   // package.json
   {
     "name": "my-monorepo",
     "workspaces": ["packages/*", "apps/*"]
   }
   ```

2. **利用全局缓存**：
   Bun 的缓存是全局的，多个项目共享同一缓存，大幅减少磁盘使用和下载时间。

3. **理解锁文件**：
   Bun 使用二进制格式的 `bun.lockb` 锁文件，比文本格式的锁文件更高效。建议将锁文件提交到版本控制。

4. **选择性使用 npm 注册表**：

   ```bash
   # 使用其他注册表
   bun add my-package --registry=https://registry.mycompany.com
   ```

## 5. Bun 作为运行时

### 5.1 运行 JavaScript/TypeScript

```bash
# 运行单个文件
bun index.js
bun index.ts
bun index.jsx

# 运行 package.json 中的脚本
bun run start
bun run dev

# 带参数运行
bun run test -- --timeout 10000
```

### 5.2 高性能 HTTP 服务器

Bun 提供了高度优化的 HTTP 服务器 API：

```typescript
// server.ts
Bun.serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url);

    // 路由示例
    if (url.pathname === '/api/users') {
      return new Response(JSON.stringify([{ id: 1, name: 'John' }]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/') {
      return new Response('Hello Bun!', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },
  error(error) {
    return new Response('Uh oh! ' + error.toString(), { status: 500 });
  },
});

console.log('Server running at http://localhost:3000');
```

启动服务器：

```bash
bun server.ts
```

### 5.3 文件处理

Bun 提供了高效的文件 API：

```javascript
// 读取文件
const file = Bun.file('package.json');
const content = await file.text();
console.log(content);

// 写入文件
await Bun.write('output.txt', 'Hello Bun!');

// 大文件流式处理
const largeFile = Bun.file('largefile.bin');
const stream = largeFile.stream();
// 处理流...

// 同时读写文件
await Bun.write('compressed.txt.gz', Bun.file('original.txt').stream().pipeThrough(new CompressionStream('gzip')));
```

### 5.4 热重载

Bun 支持热重载，提高开发效率：

```bash
# 使用热重载运行文件
bun --hot server.ts

# 使用热重载运行脚本
bun --hot run dev
```

热重载时，Bun 会重新加载代码而不终止旧进程，保持 HTTP 和 WebSocket 连接不中断。

## 6. Bun 作为测试运行器

### 6.1 编写测试

Bun 提供了与 Jest 兼容的测试 API：

```javascript
// math.test.js
import { expect, test, mock, describe, beforeEach } from 'bun:test';
import { add, multiply, fetchData } from './math';

// 基本测试
test('add function', () => {
  expect(add(2, 3)).toBe(5);
});

// 描述块组织测试
describe('Math operations', () => {
  test('multiply function', () => {
    expect(multiply(2, 3)).toBe(6);
  });
});

// 模拟测试
test('fetchData with mock', async () => {
  const mockFetch = mock(async () => ({
    json: async () => ({ data: 'mocked data' }),
  }));

  // 替换全局 fetch
  globalThis.fetch = mockFetch;

  const data = await fetchData();
  expect(data).toBe('mocked data');
  expect(mockFetch).toHaveBeenCalled();
});

// 生命周期钩子
describe('Database', () => {
  beforeEach(() => {
    // 在每个测试前设置数据库
    setupTestDatabase();
  });

  test('query data', () => {
    // 测试逻辑
  });
});
```

### 6.2 运行测试

```bash
# 运行所有测试
bun test

# 运行特定文件测试
bun test math.test.js

# 运行过滤的测试
bun test --filter "add function"

# 生成测试覆盖率报告
bun test --coverage

# 监视模式运行测试
bun test --watch
```

### 6.3 测试最佳实践

1. **组织测试结构**：

   ```bash
   project/
   ├── src/
   │   ├── math.js
   │   └── api.js
   └── tests/
       ├── math.test.js
       ├── api.test.js
       └── setup.js
   ```

2. **使用测试配置**：

   ```javascript
   // bunfig.toml (测试相关配置)
   [test]
   preload = "./tests/setup.js"  # 在每个测试文件前运行
   timeout = 5000  # 测试超时时间
   ```

3. **并行与串行测试**：

   ```javascript
   // 默认情况下测试并行运行
   test('parallel test', async () => {
     // 并行测试
   });

   // 串行测试
   test.serial('serial test', async () => {
     // 串行测试
   });
   ```

## 7. Bun 作为构建工具

### 7.1 基本构建功能

Bun 可以作为打包工具，将代码打包为单个文件：

```bash
# 打包单个文件
bun build ./src/index.ts --outfile ./dist/bundle.js

# 打包为多种格式
bun build ./src/index.ts --outfile ./dist/bundle.js --target node
bun build ./src/index.ts --outfile ./dist/bundle.mjs --format esm

# 最小化输出
bun build ./src/index.ts --outfile ./dist/bundle.min.js --minify

# 定义环境变量
bun build ./src/index.ts --outfile ./dist/bundle.js --define process.env.NODE_ENV=\"production\"
```

### 7.2 高级构建配置

对于复杂项目，可以使用 `bunfig.toml` 配置文件：

```toml
# bunfig.toml
[build]
entrypoints = ["./src/index.ts"]
outdir = "./dist"
target = "browser"
format = "esm"
splitting = true
minify = true
sourcemap = "external"
publicPath = "/assets/"

[define]
process.env.NODE_ENV = "production"
"globalThis.VERSION" = "'1.0.0'"

[loader]
".svg" = "dataurl"
".png" = "file"
```

### 7.3 插件系统

Bun 兼容 esbuild 的插件 API：

```javascript
// build.js
import { build } from 'bun';

const myPlugin = {
  name: 'my-plugin',
  setup(build) {
    build.onLoad({ filter: /.txt$/ }, async (args) => {
      const text = await Bun.file(args.path).text();
      return {
        contents: `export default ${JSON.stringify(text)};`,
        loader: 'js',
      };
    });
  },
};

await build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [myPlugin],
  minify: true,
});
```

运行构建脚本：

```bash
bun run build.js
```

## 8. Bun 特有 API

### 8.1 Bun File API

```javascript
// 高效文件读写
const file = Bun.file('data.json');
const data = await file.json();

// 直接操作文件
await Bun.write('output.json', JSON.stringify(data, null, 2));

// 使用 File API 进行切片处理
const largeFile = Bun.file('large-video.mp4');
const slice = largeFile.slice(0, 1024 * 1024); // 前1MB

// 与 Response 结合使用
const response = new Response(Bun.file('image.png'));
console.log(response.headers.get('Content-Type')); // image/png
```

### 8.2 Bun.serve HTTP 服务器

```typescript
// 高级 HTTP 服务器配置
Bun.serve({
  port: 3000,
  hostname: 'localhost',
  development: process.env.NODE_ENV !== 'production',

  // 请求处理
  fetch: async (request: Request) => {
    // 处理各种请求
    const url = new URL(request.url);

    // 静态文件服务
    if (url.pathname.startsWith('/static')) {
      return new Response(Bun.file(`.${url.pathname}`));
    }

    // API 路由
    if (url.pathname.startsWith('/api')) {
      return handleAPIRequest(request);
    }

    return new Response('Not Found', { status: 404 });
  },

  // 错误处理
  error(error: Error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  },

  // TLS/SSL 配置
  // key: Bun.file('/path/to/key.pem'),
  // cert: Bun.file('/path/to/cert.pem'),

  // 最大请求体大小
  maxRequestBodySize: 1024 * 1024 * 10, // 10MB

  // 空闲超时
  idleTimeout: 30, // 30秒

  // WebSocket 支持
  websocket: {
    message(ws, message) {
      console.log('Received:', message);
      ws.sendText('Echo: ' + message);
    },
    open(ws) {
      console.log('Client connected');
    },
    close(ws, code, reason) {
      console.log('Client disconnected');
    },
  },
});
```

### 8.3 数据库操作

Bun 内置了 SQLite 支持：

```javascript
import { Database } from 'bun:sqlite';

// 打开或创建数据库
const db = new Database('mydb.sqlite');

// 执行查询
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');

// 插入数据
const insert = db.prepare('INSERT INTO users (name) VALUES (?)');
insert.run('Alice');
insert.run('Bob');

// 查询数据
const query = db.prepare('SELECT * FROM users WHERE name = ?');
const user = query.get('Alice');
console.log(user);

// 批量操作
const insertMany = db.transaction((users) => {
  for (const user of users) {
    insert.run(user);
  }
});

insertMany(['Charlie', 'David', 'Eve']);
```

### 8.4 密码处理

Bun 提供了内置的密码哈希功能：

```javascript
// 哈希密码
const password = 'super-secret-password';
const hash = await Bun.password.hash(password, {
  algorithm: 'bcrypt', // 也可以是 'argon2id'
  cost: 10, // bcrypt 成本因子
});

// 验证密码
const isMatch = await Bun.password.verify(password, hash);

// 获取哈希信息
const info = Bun.password.getInfo(hash);
console.log(info.algorithm); // 'bcrypt'
console.log(info.cost); // 10
```

## 9. 性能优化与最佳实践

### 9.1 运行时性能优化

1. **利用 Bun 的快速启动特性**：

   ```bash
   # 使用 Bun 运行短期任务，享受快速启动优势
   bun run quick-script.js
   ```

2. **使用内置 API**：

   ```javascript
   // 使用 Bun 的内置 API 而不是 npm 包
   // 优于：const crypto = require('crypto');
   crypto.getRandomValues(new Uint32Array(10));

   // 优于：const fs = require('fs').promises;
   const file = Bun.file('data.txt');
   const contents = await file.text();
   ```

3. **优化模块加载**：

   ```javascript
   // 使用动态导入减少初始加载时间
   if (needsFeature) {
     const heavyModule = await import('./heavy-module.js');
     heavyModule.doSomething();
   }
   ```

### 9.2 内存管理

1. **监控内存使用**：

   ```javascript
   // 检查内存使用情况
   console.log(`内存使用: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
   ```

2. **避免内存泄漏**：

   ```javascript
   // 使用 WeakRef 避免不必要的内存保留
   const cache = new Map();
   function getCachedValue(key) {
     if (!cache.has(key)) {
       const value = computeExpensiveValue(key);
       cache.set(key, new WeakRef(value));
     }
     return cache.get(key).deref();
   }
   ```

### 9.3 部署与生产环境

1. **环境配置**：

   ```javascript
   // 根据环境配置不同的行为
   const isProduction = process.env.NODE_ENV === 'production';
   Bun.serve({
     development: !isProduction,
     // 其他配置...
   });
   ```

2. **使用 Docker 部署**：

   ```dockerfile
   # Dockerfile
   FROM oven/bun:1.0-slim

   WORKDIR /app
   COPY package.json .
   COPY bun.lockb .

   RUN bun install --frozen-lockfile --production

   COPY . .

   EXPOSE 3000
   CMD ["bun", "run", "start"]
   ```

3. **进程管理**：

   ```bash
   # 使用 process manager 保持应用运行
   bunx pm2 start --name "my-app" "bun run start"
   ```

## 10. 迁移指南

### 10.1 从 Node.js 迁移到 Bun

1. **逐步迁移步骤**：
   - 首先尝试用 Bun 运行测试：`bun test`
   - 然后用 Bun 运行开发服务器：`bun run dev`
   - 最后用 Bun 运行生产构建：`bun run build`

2. **处理常见不兼容问题**：

   ```javascript
   // Node.js 特有的全局变量在 Bun 中也可用
   console.log(__dirname); // 可用
   console.log(__filename); // 可用

   // 但某些 Node.js 特定模块可能需要 polyfill
   // 如 'buffer', 'util', 'stream' 等在 Bun 中可用，但行为可能略有不同
   ```

3. **替换 Node.js 特定模块**：

   ```javascript
   // 而不是使用 node-fetch
   // const fetch = require('node-fetch');
   // Bun 内置了 fetch，无需导入

   // 而不是使用 ws WebSocket 库
   // const WebSocket = require('ws');
   // 使用 Bun 内置的 WebSocket
   ```

### 10.2 从其他包管理器迁移

1. **从 npm/yarn/pnpm 迁移**：

   ```bash
   # 删除现有 node_modules 和锁文件
   rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml

   # 使用 Bun 安装依赖
   bun install

   # 验证安装
   bun run test
   ```

2. **处理 Workspaces**：

   ```bash
   # Bun 支持 package.json workspaces
   # 只需运行以下命令即可安装所有工作区依赖
   bun install
   ```

### 10.3 故障排除

1. **常见问题解决**：
   - **模块找不到错误**：确保使用 `bun install` 而不是其他包管理器
   - **原生模块问题**：Bun 支持大多数 Node.js 原生模块，但某些可能需要重新编译
   - **性能问题**：检查是否充分利用了 Bun 的内置 API

2. **获取帮助**：

   ```bash
   # 启用调试日志
   BUN_DEBUG=1 bun run dev

   # 检查版本信息
   bun --version
   ```

## 11. 未来展望

Bun 正在快速发展，近期发布的 1.1.22 版本在性能和兼容性方面有显著提升：

1. **性能持续改进**：
   - Express.js 性能比 Node.js 快 3 倍
   - 请求吞吐量提高 50%
   - Windows 平台 ES 模块加载速度提升 4 倍

2. **资源优化**：
   - 热重载时 RAM 使用量减少 50%
   - 改进模块源代码释放时机

3. **更好的 Node.js 兼容性**：
   - 大量错误修复和兼容性改进
   - 更容易从 Node.js 迁移

4. **Windows 支持改进**：
   - 实验性 Windows 版本功能不断增强
   - 预计未来版本将提供完整功能支持

Bun 代表了 JavaScript 工具链的重要进化，通过一体化设计和性能优先的理念，为开发者提供了更简单、更快速的开发体验。随着生态系统的成熟和社区的成长，Bun 有望成为 JavaScript 运行时和工具链的重要选择之一。

---

**注意**：本文档基于 Bun 1.1.21 版本编写。Bun 仍在快速发展中，某些特性可能在新版本中有变化。建议定期查阅[官方文档](https://bun.sh/docs)获取最新信息。
