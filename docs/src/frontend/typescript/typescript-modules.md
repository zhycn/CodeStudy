好的，作为一名 TypeScript 编程技术专家和 Markdown 技术文档大师，我将为你生成一篇关于 TypeScript 模块与命名空间的详尽教程。本文已参考了 TypeScript 官方文档、多篇社区优质文章（如来自 `freeCodeCamp`、`blog.logrocket.com`、`www.digitalocean.com` 等）以及行业最佳实践进行总结。

---

# TypeScript 模块与命名空间详解与最佳实践

## 1. 引言

在现代 JavaScript 开发中，代码的组织和结构至关重要。TypeScript 作为 JavaScript 的超集，提供了强大的代码组织机制：**模块 (Modules)** 和**命名空间 (Namespaces)**。它们都旨在帮助开发者解决全局作用域污染、命名冲突以及代码复用等问题，但它们的应用场景和实现方式有所不同。

理解二者的区别并遵循最佳实践，对于构建可维护、可扩展的大型 TypeScript 项目至关重要。

## 2. 模块 (Modules)

### 2.1 什么是模块？

TypeScript 完全遵循现代 JavaScript (ES6) 的模块标准。一个模块就是一个包含至少一个 `import` 或 `export` 语句的文件。模块拥有自己的局部作用域，其中的变量、函数、类等默认对外不可见，除非显式地使用 `export` 导出。要使用其他模块导出的内容，必须使用 `import` 导入。

**核心思想：** 模块是**文件级**的代码组织方式。每个文件都是一个模块，通过文件路径来标识和引用。

### 2.2 导出 (Export)

#### 2.2.1 导出声明

你可以在任何声明（变量、函数、类、接口、类型等）前加上 `export` 关键字来导出它。

```typescript
// 📁 mathUtils.ts
export const PI = 3.14159;

export function calculateCircumference(diameter: number): number {
  return diameter * PI;
}

export class Circle {
  constructor(public radius: number) {}
  area() {
    return this.radius * this.radius * PI;
  }
}

// 接口和类型别名同样可以导出
export interface Point {
  x: number;
  y: number;
}

export type TransformFunction = (x: number) => number;
```

#### 2.2.2 导出语句

你也可以先定义，然后在文件末尾统一导出。这对于整理导出来说非常清晰。

```typescript
// 📁 mathUtils.ts
const PI = 3.14159;

function calculateCircumference(diameter: number): number {
  return diameter * PI;
}

class Circle {
  // ... 同上
}

// 统一导出
export { PI, calculateCircumference, Circle };

// 导出时可以使用 `as` 重命名
export { PI as π };
```

#### 2.2.3 默认导出 (Default Export)

每个模块可以有一个 `default` 导出。这在导出主要功能时非常常用，导入时可以任意命名。

```typescript
// 📁 Logger.ts
export default class Logger {
  static log(message: string) {
    console.log(`[LOG]: ${message}`);
  }
}
```

### 2.3 导入 (Import)

#### 2.3.1 导入命名导出

使用 `import { exportName } from 'module-path'` 的语法来导入。

```typescript
// 📁 main.ts
import { PI, calculateCircumference, Circle } from './mathUtils';
import { PI as π } from './mathUtils'; // 导入时重命名

let circle = new Circle(5);
console.log(calculateCircumference(circle.radius * 2));
```

#### 2.3.2 导入默认导出

默认导出的导入不需要大括号，并且可以任意命名。

```typescript
// 📁 main.ts
import MyLogger from './Logger'; // 'MyLogger' 可以是任何名字

MyLogger.log('Hello from default export');
```

#### 2.3.3 导入所有导出

你可以将整个模块导入到一个对象中，通过该对象访问所有导出。

```typescript
// 📁 main.ts
import * as MathUtils from './mathUtils';

console.log(MathUtils.PI);
let circle = new MathUtils.Circle(10);
```

### 2.4 模块编译与 `module` 选项

TypeScript 编译器需要知道将模块编译成何种格式（CommonJS, AMD, UMD, ES6, SystemJS 等），这由 `tsconfig.json` 中的 `compilerOptions.module` 选项控制。

例如，要编译为 Node.js 使用的 CommonJS 格式：

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2015",
    "outDir": "./dist"
    // ... 其他选项
  }
}
```

### 2.5 最佳实践

1. **优先使用 ES 模块**：这是现代 JavaScript 的标准，得到了运行时和构建工具的广泛支持。
2. **使用相对路径 (`./`， `../`) 导入非外部声明的模块**。
3. **保持模块的单一职责**：一个模块只做一件事并做好。
4. **谨慎使用默认导出**：虽然方便，但命名导出能提供更好的代码提示和重构能力。团队内部应统一规范。
5. **利用模块的树摇 (Tree-shaking)**：使用 ES 模块语法配合打包工具（如 Webpack, Rollup）可以有效地消除未使用的代码，减小打包体积。

## 3. 命名空间 (Namespaces)

### 3.1 什么是命名空间？

命名空间（在 TypeScript 早期版本中称为“内部模块”）是 TypeScript 提供的**一种在全局命名空间内对相关代码进行逻辑分组**的方式，主要用于组织代码以避免全局命名冲突。

**核心思想：** 命名空间是**项目内**的代码组织方式，通过唯一的命名标识符来划分作用域。

### 3.2 定义与使用

命名空间使用 `namespace` 关键字定义。

```typescript
// 📁 Validation.ts
namespace Validation {
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }

  // 导出的成员才能在命名空间外使用
  export class LettersOnlyValidator implements StringValidator {
    isAcceptable(s: string) {
      return /^[A-Za-z]+$/.test(s);
    }
  }

  export class ZipCodeValidator implements StringValidator {
    isAcceptable(s: string) {
      return s.length === 5 && /^[0-9]+$/.test(s);
    }
  }

  // 未导出，只能在命名空间内部使用
  const numberRegexp = /^[0-9]+$/;
}
```

要使用另一个文件中的命名空间，需要使用**三斜杠指令 (`/// <reference path="..."/>`)** 来声明依赖关系。这在现代开发中已不常见。

```typescript
// 📁 main.ts
/// <reference path="Validation.ts" />

let validators: { [s: string]: Validation.StringValidator } = {};
validators['ZIP code'] = new Validation.ZipCodeValidator();
validators['Letters only'] = new Validation.LettersOnlyValidator();
```

### 3.3 多文件命名空间

命名空间可以跨多个文件。通过使用 `reference` 标签并将所有文件编译在一起（例如使用 `--outFile` 编译器选项），它们可以组合成一个大的命名空间。

**File 1: Validation.ts**

```typescript
namespace Validation {
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }
}
```

**File 2: LettersOnlyValidator.ts**

```typescript
/// <reference path="Validation.ts" />
namespace Validation {
  export class LettersOnlyValidator implements StringValidator {
    isAcceptable(s: string) {
      return /^[A-Za-z]+$/.test(s);
    }
  }
}
```

**File 3: main.ts**

```typescript
/// <reference path="Validation.ts" />
/// <reference path="LettersOnlyValidator.ts" />

// 可以使用所有定义在 Validation 命名空间中的成员
let validator = new Validation.LettersOnlyValidator();
```

编译命令：`tsc --outFile bundle.js Validation.ts LettersOnlyValidator.ts main.ts`

### 3.4 最佳实践与现状

1. **通常不推荐在新项目中使用命名空间**。
   - **模块是首选方案**：ES 模块是官方标准，能更好地与现代构建工具集成，并支持树摇优化。
   - 命名空间和 `/// <reference>` 是更复杂的项目组织方式，主要用于在全局作用域内缝合代码，这在浏览器中可能会污染全局命名空间。
2. **主要使用场景**：
   - **声明全局类型定义 (d.ts)**：在为第三方库编写类型定义文件时，`declare namespace ...` 仍然非常常见，用于组织库暴露的全局变量和类型。
   - **迁移遗留代码**：将旧的内部模块代码迁移到新版本 TypeScript 时。
3. **避免多文件命名空间**：使用模块来组织跨文件代码要简单可靠得多。

## 4. 模块 vs. 命名空间：如何选择？

| 特性                    | 模块 (Modules)                             | 命名空间 (Namespaces)                      |
| :---------------------- | :----------------------------------------- | :----------------------------------------- |
| **作用域**              | 文件级。通过文件路径标识。                 | 逻辑级。通过命名标识符划分。               |
| **关键字**              | `import` / `export`                        | `namespace` / `/// <reference>`            |
| **依赖声明**            | 通过文件路径自动解析。                     | 需要手动使用 `/// <reference>`。           |
| **输出**                | 每个模块是独立的文件（除非使用打包工具）。 | 可编译为单个文件（使用 `--outFile`）。     |
| **现代性**              | **现代标准**，得到广泛支持。               | **传统方式**，主要用于遗留代码和声明文件。 |
| **树摇 (Tree-shaking)** | **支持**，利于优化打包体积。               | **不支持**。                               |
| **推荐场景**            | **所有新项目**，无论是浏览器还是 Node.js。 | 类型声明文件 (.d.ts) 和旧项目维护。        |

**结论：对于新的 TypeScript 项目，应始终使用模块来组织代码。**

## 5. 高级主题与最佳实践

### 5.1 模块解析策略

TypeScript 有两种模块解析策略：`classic` 和 `node`。`node` 策略模仿了 Node.js 的模块解析机制，是当今的标准和默认值（如果 `module` 是 `commonjs`）。你通常不需要修改它，但理解它很有用。

- 相对路径导入 (`./moduleA`)：直接查找文件。
- 非相对路径导入 (`import * as $ from 'jQuery'`)：
  1. 尝试从当前目录的 `node_modules` 里查找。
  2. 向上级目录递归查找 `node_modules`，直到根目录。

### 5.2 使用 `--isolatedModules` 标志

这个编译器选项确保每个文件都能被安全地单独转译（例如由 Babel 或 `ts.transpileModule` API）。它强制执行一些规则：

- 所有代码必须在模块顶层（不是全局作用域）有 `import` 或 `export` 语句。
- 不支持 `const enum` 等需要类型信息才能编译的特性。

在构建工具链中（如 Create React App, Vite），这个选项通常被启用，建议保持开启。

### 5.3 为第三方库提供类型定义

当导入一个没有内置类型的 JavaScript 库时，你需要它的类型定义（`*.d.ts` 文件）。你可以使用 `declare module` 语法。

```typescript
// 📁 types/shims-vue.d.ts
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// 或者为一个简单的 JS 库提供类型
declare module 'some-js-library' {
  export function doSomethingCool(): void;
  export const someConstant: number;
}
```

### 5.4 迁移旧代码：从命名空间到模块

如果你有一个使用命名空间的旧项目，迁移到模块并不困难。

**旧代码 (Namespaces):**

```typescript
// 📁 Utilities.ts
namespace Utilities {
  export function formatString(s: string): string { ... }
  export function calculateTime(): number { ... }
}

// 📁 main.ts
/// <reference path="Utilities.ts" />
Utilities.formatString("hello");
```

**新代码 (Modules):**

```typescript
// 📁 Utilities.ts
export function formatString(s: string): string { ... }
export function calculateTime(): number { ... }

// 📁 main.ts
import { formatString } from './Utilities';
formatString("hello");
```

只需将 `namespace X { ... }` 替换为直接的 `export`，并将 `/// <reference>` 和 `X.` 前缀的调用替换为 `import` 语句即可。

## 6. 总结

- **模块 (Modules)** 是组织 TypeScript 和 JavaScript 代码的**现代、标准且推荐的方式**。它们基于文件，通过 `import/export` 工作，并与现代构建工具链完美集成。
- **命名空间 (Namespaces)** 是一种在**全局作用域内**对代码进行逻辑分组的传统方式。其主要用途已缩小到主要为**编写声明文件 (.d.ts)** 和**维护遗留代码**。
- 对于所有新项目，**请毫不犹豫地选择模块**。它们更干净、更可移植、更高效。
- 遵循最佳实践，如保持模块小巧、谨慎使用默认导出、并利用模块解析和树摇优化，将帮助你构建出健壮且可维护的大型应用程序。

---

**附录：代码示例运行说明**

要运行本文中的模块代码示例：

1. 确保已安装 TypeScript：`npm install -g typescript`
2. 创建一个项目目录，并初始化 `tsconfig.json`：`tsc --init`
3. 在 `tsconfig.json` 中，确保 `"module"` 设置为 `"CommonJS"`（用于 Node.js）或 `"ES2015"`（用于浏览器，通常需配合打包工具）。
4. 创建相应的 `.ts` 文件并编写代码。
5. 运行 `tsc` 编译，然后使用 `node` 运行编译后的 `.js` 文件（如果目标是 Node.js）。
