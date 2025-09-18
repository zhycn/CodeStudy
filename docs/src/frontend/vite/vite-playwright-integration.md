好的，请看这篇为您精心准备的关于 Vite 与 Playwright 集成的技术文档。

---

# Vite 与 Playwright 集成详解与最佳实践

## 摘要

本文深入探讨了现代前端开发中两个强大工具的结合：Vite（下一代前端构建工具）和 Playwright（微软开发的端到端测试框架）。我们将详细介绍如何将它们无缝集成，以创建一个高效、可靠且可维护的测试环境。内容涵盖从基础配置到高级技巧，并提供可立即运行的代码示例。

## 1. 引言：为什么选择 Vite 与 Playwright？

在前端开发中，速度和可靠性缺一不可。Vite 通过其基于原生 ESM 的极速冷启动和模块热更新 (HMR) 提供了无与伦比的开发体验。然而，为了保证应用质量，我们同样需要一个强大的端到端 (E2E) 测试方案。

**Playwright** 正是这样一个解决方案，它支持所有现代渲染引擎（Chromium, WebKit, Firefox），提供自动化、快速的测试能力。将 Vite 的开发服务器与 Playwright 的测试运行器相结合，可以带来以下核心优势：

- **极速反馈循环**：在开发过程中，Playwright 可以利用 Vite Dev Server 直接对未打包的源码进行测试，无需等待构建。
- **真实环境测试**：Playwright 模拟真实用户操作，确保应用在真实浏览器环境中表现正常。
- **框架无关性**：无论是 React, Vue, Svelte 还是 SolidJS，只要使用 Vite，就能享受一致的集成体验。
- **现代化异步 API**：Playwright 的 API 设计清晰直观，与现代 JavaScript 完美契合。

## 2. 环境准备与项目初始化

首先，确保你有一个基于 Vite 的项目。如果没有，可以使用以下命令创建一个：

```bash
# 使用 npm 7+ 的自动安装 peer dependencies
npm create vite@latest my-vite-app -- --template react
# 或使用 yarn
yarn create vite my-vite-app --template react
# 或使用 pnpm
pnpm create vite my-vite-app --template react

cd my-vite-app
```

接下来，我们将 Playwright 安装到项目中。官方推荐使用 `@playwright/test` 运行器，它集成了所有功能。

```bash
# 使用 npm
npm init playwright@latest -- --yes
# 使用 yarn
yarn create playwright -- --yes
# 使用 pnpm
pnpm create playwright -- --yes
```

此命令会自动完成以下操作：

1. 安装 `@playwright/test` 包。
2. 下载所需的浏览器二进制文件。
3. 在项目根目录创建配置文件 `playwright.config.ts`。
4. 创建示例测试文件 `tests/example.spec.ts` 和 `tests-examples/demo-todo-app.spec.ts`。

## 3. 基础配置：连接 Vite 开发服务器

默认的 Playwright 配置是针对静态文件的。为了让其与正在运行的 Vite 开发服务器协同工作，我们需要修改配置。

### 3.1 配置 Playwright 使用 Vite Dev Server

修改 `playwright.config.ts` 文件。关键步骤是在测试开始前启动 Vite 服务器，并在测试结束后关闭它。

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import vue from '@vitejs/plugin-vue'; // 如果使用 Vue
import react from '@vitejs/plugin-react'; // 如果使用 React

// 获取 Vite 配置（可选，用于类型提示和共享配置）
const viteConfig = defineViteConfig({
  // 在此处放置你的 Vite 配置，或者直接导入你的 vite.config.ts
  plugins: [react()], // 根据你的框架选择插件
  server: {
    port: 5173, // 明确指定一个端口，便于连接
  },
});

/**
 * 读取环境变量，例如 `PORT`。
 * 使用 `process.env` 来读取。
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 你的 Playwright 配置
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // 共享所有测试的配置
  use: {
    baseURL: 'http://localhost:5173', // 连接到 Vite 的开发服务器
    trace: 'on-first-retry',
    video: 'off', // 在 CI 中可关闭以提升速度
    screenshot: 'only-on-failure',
  },

  // 配置不同的浏览器项目
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  // 重要：配置 Web 服务器以启动和停止
  webServer: {
    command: 'npm run dev', // 启动开发服务器的命令
    port: 5173, // Vite 的默认端口
    reuseExistingServer: !process.env.CI, // 在非 CI 环境下复用已有服务器，方便本地开发
    stdout: 'pipe', // 允许捕获服务器输出
    stderr: 'pipe',
    timeout: 120000, // 给服务器足够的启动时间
  },
});
```

### 3.2 编写第一个集成测试

现在，让我们创建一个简单的测试来验证我们的设置是否工作。创建一个新文件 `tests/app.spec.ts`。

```typescript
// tests/app.spec.ts
import { test, expect } from '@playwright/test';

// 测试套件：描述应用程序的基本功能
test.describe('Vite + Playwright Integration', () => {

  // 测试用例：页面应正确加载并显示标题
  test('should load the app and display the correct title', async ({ page }) => {
    // 导航到应用程序的主页
    await page.goto('/');

    // 期望页面标题包含 "Vite"
    await expect(page).toHaveTitle(/Vite/);

    // 或者，如果您的应用有特定的标题选择器
    // await expect(page.locator('h1')).toHaveText('Welcome to My Vite App');
  });

  // 测试用例：验证 HMR 是否正常工作（可选，高级示例）
  test('should reflect changes after HMR', async ({ page }) => {
    await page.goto('/');
    
    // 获取初始文本内容
    const initialText = await page.locator('.some-element').textContent();
    
    // 注意：这个测试需要与文件系统交互来模拟更改，
    // 通常在 CI 中不这样做。这只是一个概念证明。
    // 在实际项目中，你可能会专注于测试 HMR 后的UI状态，而不是触发 HMR 本身。
    
    // 断言页面包含一些预期的内容
    await expect(page.locator('button')).toBeVisible();
  });
});
```

运行测试：

```bash
npx playwright test
```

## 4. 高级技巧与最佳实践

### 4.1 测试组件库或 NPM 链接包

如果你的 Vite 项目依赖一个本地库（通过 `npm link` 或 `yarn link` 链接），你可能会遇到 Playwright 浏览器无法解析这些依赖的问题。这是因为浏览器运行的代码路径与 Node.js 不同。

**解决方案**：使用 Vite 的 `resolve.alias` 或 `deps.optimizer` 配置，或者使用 `@playwright/test` 的 `webServer` 来服务一个已经构建好的版本，但这在开发中并不理想。更好的方式是确保你的库也被 Vite 兼容和构建。

### 4.2 处理路由和 SPA 导航

Vite 项目通常是单页应用 (SPA)。Playwright 提供了强大的 API 来处理导航和等待页面加载。

```typescript
test('should navigate to about page', async ({ page }) => {
  await page.goto('/');
  
  // 点击一个导航链接，该链接使用客户端路由 (e.g., React Router, Vue Router)
  await page.getByRole('link', { name: 'About' }).click();
  
  // 等待 URL 改变
  await page.waitForURL('**/about');
  
  // 断言新页面上的内容
  await expect(page.locator('h1')).toHaveText('About Us');
});
```

### 4.3 模拟和拦截网络请求

Playwright 可以拦截和修改网络请求，这对于测试加载状态、错误处理或模拟后端 API 非常有用。

```typescript
test('should show loading state and then display data', async ({ page }) => {
  // 在页面加载前，拦截对 /api/data 的 GET 请求
  await page.route('**/api/data', async route => {
    // 模拟一个 500ms 延迟的 API 响应
    await new Promise(resolve => setTimeout(resolve, 500));
    // 然后继续请求（或者使用 route.fulfill 返回模拟数据）
    route.continue();
    // 或者返回模拟的 JSON 数据
    // route.fulfill({
    //   status: 200,
    //   contentType: 'application/json',
    //   body: JSON.stringify({ message: 'Mocked Data!' }),
    // });
  });

  await page.goto('/data-page');
  
  // 验证加载指示器是否出现
  await expect(page.locator('.loader')).toBeVisible();
  
  // 等待加载指示器消失（表示数据已加载）
  await expect(page.locator('.loader')).toBeHidden();
  
  // 验证数据是否显示在页面上
  await expect(page.locator('.data-container')).toContainText('Mocked Data!');
});
```

### 4.4 集成到 CI/CD 流水线 (GitHub Actions 示例)

在持续集成环境中，你需要安装浏览器依赖并运行测试。以下是一个基本的 GitHub Actions 工作流配置。

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

**优化 CI 速度**：

- 使用 `playwright install --with-deps` 缓存浏览器。
- 在 `webServer` 配置中，设置 `reuseExistingServer: false`（CI 环境变量会自动处理这一点）。
- 考虑使用 `playwright test --project=chromium` 在 PR 上只运行 Chromium 测试以快速获得反馈，然后在合并后运行所有浏览器测试。

## 5. 常见问题与解决方案 (FAQ)

**Q1: 我收到一个错误：`page.goto: Timeout 30000ms exceeded.`**
**A1:** 这通常意味着 Playwright 无法连接到 Vite 开发服务器。请检查：

- `playwright.config.ts` 中的 `webServer.port` 和 `use.baseURL` 是否与 Vite 的端口匹配（默认为 `5173`）。
- Vite 服务器是否成功启动。查看 `webServer` 命令的输出日志。

**Q2: 测试在 CI 中通过，但在本地失败（或反之亦然）？**
**A2:** 这通常是环境差异导致的。确保：

- 依赖版本一致 (`package-lock.json` 或 `yarn.lock` 应提交到版本控制)。
- 使用 `process.env.CI` 在配置中区分环境（如重试次数、工作进程数）。

**Q3: 如何调试测试？**
**A3:** Playwright 提供了多种调试方法：

- **使用 VS Code 扩展**：安装官方 “Playwright Test for VS Code” 扩展，可以直接在 IDE 中调试。
- **使用浏览器开发者工具**：运行 `npx playwright test --debug` 会暂停测试并打开浏览器检查器。
- **追踪**：在配置中启用 `trace: 'on'` 或 `trace: 'on-first-retry'`，测试完成后可以使用 `npx playwright show-trace <trace-file>` 查看详细的执行追踪。

**Q4: 如何测试需要身份验证的页面？**
**A4:** 你可以复用认证状态来避免每次测试都登录。

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

// 定义一个 “认证” 夹具，并存储状态
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // 等待登录成功后的跳转或元素
  await page.waitForURL('**/dashboard');
  
  // 将当前页面的认证状态存储起来
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// playwright.config.ts 中配置全局 setup
// ... defineConfig({
    globalSetup: require.resolve('./tests/auth.setup.ts'),
    use: {
      // 所有测试使用来自全局 setup 的存储状态
      storageState: 'playwright/.auth/user.json',
    },
// ...
```

然后在配置中指定 `globalSetup` 和 `storageState`。

## 6. 结论

Vite 和 Playwright 的组合为现代 Web 开发提供了“强强联合”的解决方案。Vite 负责提供闪电般的开发体验，而 Playwright 则确保了应用程序在各种浏览器中的功能和用户体验达到预期。

通过本文介绍的配置和最佳实践，你可以建立起一个健壮的测试体系，它不仅能捕获 bug，还能成为你进行重构和添加新功能时的安全网。这种集成鼓励测试驱动开发 (TDD)，因为你现在可以在几乎实时的反馈循环中编写和运行针对真实应用的测试。

立即尝试将 Playwright 集成到你的 Vite 项目中，体验高质量、高速度的开发工作流。

---
**参考资源：**

- <https://playwright.dev/docs/intro>
- <https://vitejs.dev/guide/>
- <https://playwright.dev/docs/ci-intro>
- <https://playwright.dev/docs/locators#best-practices>

**版权声明：** 本文档基于官方文档和社区实践总结，仅供学习参考。
