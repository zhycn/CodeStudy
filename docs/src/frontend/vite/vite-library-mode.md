好的，请看下方为您生成的关于 Vite 库模式详解与最佳实践的完整技术文档。

---

# Vite 库模式详解与最佳实践

## 1. 引言

Vite 不仅是一个为 Web 应用设计的高速开发工具，其强大的构建能力同样使其成为构建**库 (Library)** 的绝佳选择。传统的 Web 应用构建旨在生成一个或多个被部署到服务器并由浏览器获取的 bundle。而库模式则完全不同，它的目标是生成一套**可供他人通过 `npm install` 安装并在其项目中引入**的代码。

本文将深入探讨 Vite 的库模式，从其核心概念、配置方法到生产环境的最佳实践，为您提供一份完整的指南。

## 2. 什么是库模式？

库模式是 Vite 构建流程的一种预设配置，专门用于构建作为库发布的 JavaScript 包。当你构建一个库时，你通常需要产出多种格式的打包文件（如 `ES Modules`, `CommonJS`），以确保它能在不同的运行环境（如浏览器、Node.js）和不同的模块系统下正常工作。

与构建应用不同，构建库时你通常需要：

1. **外部化依赖**：将如 `vue`, `react`, `lodash` 等第三方依赖排除在最终产物之外，避免你的库包体积过大，并避免与使用者的依赖发生冲突。
2. **导出多种模块格式**：提供 ESM 用于支持现代打包器的 Tree Shaking，并提供 CJS 用于兼容 Node.js 和环境。
3. **导出类型声明文件**：如果你使用 TypeScript，需要生成 `.d.ts` 文件，为使用者提供类型支持。

## 3. 核心配置：`build.lib`

在 `vite.config.js` 中，通过配置 `build.lib` 选项来启用库模式。

### 3.1 基本配置

一个最基础的库模式配置如下所示：

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      // 库的入口文件
      entry: resolve(__dirname, 'src/main.js'),
      // 库的名称
      name: 'MyLib',
      // 输出的文件名
      fileName: 'my-lib'
    }
  }
})
```

执行 `vite build` 后，Vite 会在 `dist` 目录下生成：

- `my-lib.js` (ES module)
- `my-lib.umd.js` (UMD module)

### 3.2 进阶配置选项

| 选项 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `entry` | string \| string[] \| { [entryAlias: string]: string } | - | **必填**。设置库的入口文件。 |
| `name` | string | - | 暴露给 UMD/IIFE 格式的全局变量名。 |
| `fileName` | string \| ((format: string) => string) | `'fileName'` | 生成的文件名模板。 |
| `formats` | ('es' \| 'cjs' \| 'umd' \| 'iife')[] | `['es', 'umd']` | 需要构建的模块格式数组。 |
| `cssFileName` | string \| ((format: string) => string) | 同 `fileName` | 提取的 CSS 文件名。 |

一个更完整的配置示例：

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AwesomeUI',
      // 为不同格式生成不同的文件名
      fileName: (format) => `awesome-ui.${format}.js`,
      // 构建 ESM 和 CJS 两种格式
      formats: ['es', 'cjs']
    },
    // 可选：减少构建警告
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'some-other-dependency'],
      output: {
        // 在 UMD 构建模式下为外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
```

## 4. 完整示例：构建一个 Vue 3 组件库

让我们通过一个完整的示例，构建一个简单的 Vue 3 按钮组件库。

### 4.1 项目结构

```
my-vue-lib/
├── src/
│   ├── components/
│   │   └── MyButton.vue
│   └── index.ts
├── package.json
├── vite.config.js
├── tsconfig.json
└── dist/
```

### 4.2 源代码

`src/components/MyButton.vue`:

```vue
<template>
  <button class="my-button" :style="{ backgroundColor: color }" @click="$emit('click')">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  color?: string
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<style scoped>
.my-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}
</style>
```

`src/index.ts`:

```typescript
// 导出单个组件
import MyButton from './components/MyButton.vue'

// 以插件形式进行全局安装的 install 函数
import type { App } from 'vue'
export const install = (app: App) => {
  app.component('MyButton', MyButton)
}

// 导出单个组件，供按需引入
export { MyButton }

// 默认导出插件安装函数
export default { install }
```

### 4.3 Vite 配置

`vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyVueLib',
      fileName: (format) => `my-vue-lib.${format}.js`
    },
    rollupOptions: {
      // 确保外部化处理 vue，不将其打包到库中
      external: ['vue'],
      output: {
        // 为外部化的依赖提供 UMD 构建模式下的全局变量
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
```

### 4.4 `package.json` 配置

构建完成后，你需要正确配置 `package.json` 中的字段，以便 npm 和打包工具能正确识别你的库。

```json
{
  "name": "my-vue-lib",
  "version": "1.0.0",
  "description": "A sample Vue 3 component library",
  "type": "module",
  "main": "./dist/my-vue-lib.cjs.js",
  "module": "./dist/my-vue-lib.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/my-vue-lib.es.js",
      "require": "./dist/my-vue-lib.cjs.js"
    },
    "./style.css": "./dist/style.css"
  },
  "files": [
    "dist"
  ],
  "peerDependencies": {
    "vue": "^3.3.0"
  },
  "devDependencies": {
    "vue": "^3.3.0",
    "@vitejs/plugin-vue": "^4.5.0",
    "vite": "^5.0.0",
    "typescript": "^5.2.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "prepublishOnly": "npm run build"
  }
}
```

**关键字段解释**:

- `main`: CommonJS 格式的入口点。
- `module`: ES Module 格式的入口点（被现代打包器如 Webpack 和 Rollup 使用，支持 Tree Shaking）。
- `types`: TypeScript 类型声明文件的入口点。
- `exports`: Node.js 的<https://nodejs.org/api/packages.html#package-entry-points功能，提供了更现代和明确的入口定义。>
- `files`: 发布到 npm 时应包含的文件列表。
- `peerDependencies`: 声明你的库所依赖的、但期望由使用者提供的包（如 Vue、React 等框架）。

### 4.5 构建与发布

1. **运行构建命令**:

   ```bash
   npm run build
   ```

   这将在 `dist` 目录下生成 `my-vue-lib.es.js` (ESM) 和 `my-vue-lib.cjs.js` (CJS) 文件。

2. **(可选) 生成类型声明文件**:
   上述配置使用了 `vue-tsc` 来生成类型声明。确保你的 `tsconfig.json` 中设置了 `"declaration": true` 和 `"outDir": "dist"`。运行构建命令后，`.d.ts` 文件也会被生成到 `dist` 目录。

3. **发布到 npm**:

   ```bash
   npm publish
   ```

## 5. 最佳实践与高级技巧

### 5.1 处理 CSS

默认情况下，Vite 会将组件中的 CSS 提取到一个单独的文件中（例如 `dist/style.css`）。鼓励使用者手动引入这个 CSS 文件。

```javascript
// 在你的入口文件 (src/index.ts) 中
import './style.css'
```

如果你想提供按需引入组件并自动引入对应 CSS 的能力，可以考虑使用 <https://github.com/unplugin/unplugin-vue-components> 等插件，但这通常是在你的库的文档或预设中指导使用者配置的，而非在库的构建流程中完成。

### 5.2 外部化依赖 (Externalization)

正确外部化依赖是库构建中最重要的一环。使用 `rollupOptions.external` 来指定哪些模块不应该被打包。

```javascript
rollupOptions: {
  external: [
    'vue',
    'lodash',
    // 使用正则表达式匹配所有 node_modules 中的包
    /node_modules/
  ]
}
```

### 5.3 多入口构建

如果你要构建一个包含多个独立功能的库，可以配置多入口。

```javascript
build: {
  lib: {
    entry: {
      index: resolve(__dirname, 'src/index.ts'),
      utils: resolve(__dirname, 'src/utils/index.ts'),
      components: resolve(__dirname, 'src/components/index.ts')
    },
    // fileName 可以是一个函数，根据入口名称和格式来定义输出文件名
    fileName: (format, entryName) => `${entryName}.${format}.js`
  }
}
```

对应的 `package.json` `exports` 字段也需要更新：

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js"
    },
    "./utils": {
      "import": "./dist/utils.es.js",
      "require": "./dist/utils.cjs.js"
    },
    "./components": {
      "import": "./dist/components.es.js",
      "require": "./dist/components.cjs.js"
    }
  }
}
```

### 5.4 插件推荐

- **vite-plugin-dts**: 自动为库生成类型声明文件 (.d.ts) 并处理路径映射，比 `vue-tsc` 更灵活强大，强烈推荐用于 TypeScript 库项目。
- **vite-plugin-lib-inject-css**: 在构建库时，将提取的 CSS 注入到 JS 代码中，使其在组件被引入时自动加载（请注意这可能不是所有场景的最佳实践）。

## 6. 总结

Vite 的库模式提供了一个高效、现代的库构建方案。其核心在于：

1. **正确配置 `build.lib`**：定义入口、名称、输出格式和文件名。
2. **严格外部化依赖**：通过 `rollupOptions.external` 避免打包 peerDependencies。
3. **完善 `package.json` 配置**：明确指定入口点（`main`, `module`, `exports`）和依赖关系（`peerDependencies`）。
4. **提供类型声明**：使用 TypeScript 和 `vite-plugin-dts` 等工具为使用者提供出色的开发体验。

遵循上述指南和最佳实践，你将能够利用 Vite 的高速与简洁，构建出高质量、可树摇、兼容性强的 JavaScript 库。

---
**参考资源**:

1. <https://vitejs.dev/guide/build.html>
2. <https://vitejs.dev/guide/build.html#library-mode>
3. <https://rollupjs.org/configuration-options/#external>
4. <https://nodejs.org/api/packages.html#package-entry-points>
5. <https://vuejs.org/guide/scaling-up/library.html>
6. <https://stackoverflow.com/questions/71181840/building-libraries-with-vite>
7. <https://github.com/vitejs/awesome-vite#plugins>
8. <https://github.com/qmhc/vite-plugin-dts>
9. <https://dev.to/receter/how-to-bundle-a-react-component-library-with-vite-3kkp>
10. <https://web.dev/package-exports/>
