好的，作为一名 TypeScript 编程技术专家和技术文档工程师，我将基于官方文档、社区最佳实践以及大量优质文章，为你生成这篇详尽且实用的教程。

---

# TypeScript 基础类型详解与最佳实践

## 1. 概述

TypeScript 的核心原则之一是对值所具有的**结构**进行类型检查。它作为 JavaScript 的一个超集，提供了强大的静态类型系统，能够在代码运行前（编译时）发现错误，极大地提高了代码的可维护性和开发效率。类型系统始于基础类型，它们是构建复杂数据结构的基石。

本文将深入探讨 TypeScript 的所有基础类型，并通过清晰的代码示例和最佳实践来帮助你掌握它们。

## 2. 原始类型 (Primitive Types)

原始类型是最基础的数据类型，它们直接表示 ECMAScript 中简单的底层值。

### 2.1 `string`

表示文本数据。

```typescript
let firstName: string = "Alice";
let sentence: string = `Hello, my name is ${firstName}.`; // 模板字符串
```

### 2.2 `number`

表示整数和浮点数。TypeScript 没有独立的整数或浮点类型，所有数字都是浮点数。

```typescript
let decimal: number = 6;
let float: number = 3.14;
let hex: number = 0xf00d; // 十六进制
let binary: number = 0b1010; // 二进制
let octal: number = 0o744; // 八进制
```

### 2.3 `boolean`

表示逻辑值：`true` 或 `false`。

```typescript
let isDone: boolean = false;
let isActive: boolean = true;
```

### 2.4 `null` 和 `undefined`

在 TypeScript 中，`undefined` 和 `null` 各自有它们的类型。

```typescript
let u: undefined = undefined;
let n: null = null;
```

**最佳实践**：

- 在 `strictNullChecks` 模式下（强烈推荐开启），`undefined` 和 `null` 不能赋值给其他类型的变量。这是避免常见运行时错误的关键。
- 明确一个变量是否可以为 `null` 或 `undefined`。例如：`let name: string | null = null;`。

### 2.5 `symbol` (ES6)

表示唯一且不可变的值，通常用作对象属性的键。

```typescript
let sym1: symbol = Symbol();
let sym2: symbol = Symbol("key"); // 可选的描述字符串
```

### 2.6 `bigint` (ES2020)

表示非常大的整数。

```typescript
let bigNumber: bigint = 100n; // 字面量以 'n' 结尾
```

## 3. 数组和元组 (Array and Tuple)

### 3.1 数组 (`Array<T>` 或 `T[]`)

表示相同类型元素的集合。

```typescript
// 两种声明方式是等价的
let list1: number[] = [1, 2, 3];
let list2: Array<number> = [1, 2, 3]; // 使用泛型语法

// 只读数组，防止数组被修改（最佳实践）
const readOnlyList: ReadonlyArray<number> = [1, 2, 3];
// readOnlyList.push(4); // Error: Property 'push' does not exist on type 'ReadonlyArray<number>'.
```

### 3.2 元组 (`Tuple`)

表示一个已知元素**数量**和**类型**的数组，各元素的类型不必相同。

```typescript
// 声明一个元组类型
let x: [string, number];

// 初始化
x = ["hello", 10]; // OK
// x = [10, "hello"]; // Error: Type 'number' is not assignable to type 'string'.

// 访问已知索引的元素
console.log(x[0].substring(1)); // "ello"
// console.log(x[2].toString()); // Error: Tuple type '[string, number]' of length '2' has no element at index '2'.

// 越界元素（不推荐使用，最佳实践是保持固定长度）
x.push("world"); // 在 TypeScript 早期版本中允许，但现在不推荐
console.log(x); // ["hello", 10, "world"]
// console.log(x[2]); // Error: Tuple type '[string, number]' of length '2' has no element at index '2'.
```

**最佳实践**：

- **尽量使用接口或对象类型代替元组**。元组在访问属性时缺乏明确的名称（如 `x[0]` vs `user.name`），降低了代码可读性。
- 如果必须使用元组，请保持其长度固定，避免使用 `push` 等破坏结构的方法。考虑使用 `readonly` 修饰符：`let x: readonly [string, number] = ["hello", 10];`。

## 4. 特殊类型 (Special Types)

### 4.1 `any`

在无法确定类型时使用，它会绕过 TypeScript 的所有类型检查。

```typescript
let notSure: any = 4;
notSure = "maybe a string instead";
notSure = false; // 可以重新赋值为任意类型
notSure.toFixed(); // 编译时不会报错，但运行时可能出错！
```

**最佳实践**：

- **极力避免使用 `any`**。它本质上是关闭了类型检查，失去了使用 TypeScript 的最大意义。
- 在迁移旧 JavaScript 项目时，可以临时使用 `any`，但最终目标应该是用具体的类型替换它们。
- 如果只想部分绕过检查，可以考虑使用 `@ts-ignore` 注释，但这应是最后的手段。

### 4.2 `unknown`

TypeScript 3.0 引入的类型安全的 `any`。任何值都可以赋给 `unknown`，但在将其赋值给其他类型或进行操作之前，必须进行类型检查或类型断言。

```typescript
let uncertainValue: unknown = "hello world";

// 直接操作会报错
// uncertainValue.toUpperCase(); // Error: Object is of type 'unknown'.

// 必须进行类型收窄 (Type Narrowing)
if (typeof uncertainValue === "string") {
  // 在这个块中，TypeScript 知道 `uncertainValue` 是 string 类型
  console.log(uncertainValue.toUpperCase()); // OK
}

// 或者使用类型断言 (Type Assertion)
let certainString: string = (uncertainValue as string).toUpperCase();
```

**最佳实践**：

- **优先使用 `unknown` 而不是 `any`**。它强制你进行类型检查，更加安全。

### 4.3 `void`

通常表示一个函数没有返回值。

```typescript
function warnUser(): void {
  console.log("This is a warning message");
  // 函数执行完毕，没有 return 语句，或只有 `return;`
}
```

**最佳实践**：

- 声明一个变量为 `void` 类型是没有什么用的，因为你只能为它赋予 `undefined` 或 `null`（在 `strictNullChecks` 关闭时）。

### 4.4 `never`

表示那些永远不存在的值的类型。例如，总是会抛出异常或根本不会有返回值的函数表达式。

```typescript
function error(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}

// 在类型收窄中，never 代表不可能出现的类型
function handleEvent(event: string | number) {
  if (typeof event === "string") {
    // 处理 string
  } else if (typeof event === "number") {
    // 处理 number
  } else {
    // 这个分支的 event 类型是 never，代表所有情况都已处理完毕
    const check: never = event;
  }
}
```

**最佳实践**：

- 使用 `never` 可以帮助你进行穷尽性检查（Exhaustiveness Checking），确保联合类型的所有可能情况都已被处理。

### 4.5 字面量类型 (Literal Types)

允许你指定一个变量只能取某个特定的值。

```typescript
// 字符串字面量类型
let direction: "left" | "right" | "up" | "down";
direction = "left"; // OK
// direction = "north"; // Error: Type '"north"' is not assignable to type '"left" | "right" | "up" | "down"'.

// 数字字面量类型
let diceRoll: 1 | 2 | 3 | 4 | 5 | 6;
diceRoll = 3; // OK
// diceRoll = 7; // Error

// 布尔字面量类型（虽然不常用，但语法上是合法的）
let isTrue: true;
isTrue = true; // OK
// isTrue = false; // Error
```

**最佳实践**：

- 字面量类型与联合类型结合使用，可以定义出非常精确的枚举和配置项，远比普通的 `string` 或 `number` 类型安全。

## 5. 枚举 (Enum)

枚举是对 JavaScript 标准数据类型的一个补充，用于定义命名常量集合。

```typescript
// 数字枚举（默认）
enum Direction {
  Up = 1, // 可以从 1 开始初始化，默认从 0 开始
  Down,
  Left,
  Right,
}
let go: Direction = Direction.Up;

// 字符串枚举
enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}
let level: LogLevel = LogLevel.ERROR;

// 常量枚举（编译时会被完全删除，性能更好）
const enum ConstDirection {
  Up,
  Down,
}
let constGo: ConstDirection = ConstDirection.Up; // 编译后：let constGo = 0;
```

**最佳实践**：

- 现代 TypeScript 中，**通常建议使用字面量类型联合 (`type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG"`) 来代替枚举**，因为它与 JavaScript 的交互更简单，且是纯粹的类型结构，编译后会被完全移除，不会产生多余的代码。
- 如果你需要生成运行时的枚举对象，或者需要反向映射（通过值获取键），则可以使用传统枚举。

## 6. 函数类型 (Function Types)

函数是 JavaScript 的一等公民，TypeScript 允许你为函数指定输入和输出的类型。

```typescript
// 函数声明
function add(x: number, y: number): number {
  return x + y;
}

// 函数表达式
let myAdd: (x: number, y: number) => number = function (x, y) {
  return x + y;
};

// 使用接口定义函数类型
interface MathFunc {
  (x: number, y: number): number;
}
let multiply: MathFunc = function (a, b) {
  return a * b;
};

// 可选参数和默认参数
function buildName(firstName: string, lastName?: string): string {
  // 使用 `?` 表示可选参数
  if (lastName) return `${firstName} ${lastName}`;
  return firstName;
}
function buildName2(firstName: string, lastName: string = "Smith"): string {
  // 参数默认值
  return `${firstName} ${lastName}`;
}

// 剩余参数
function buildName3(firstName: string, ...restOfName: string[]): string {
  return firstName + " " + restOfName.join(" ");
}
```

**最佳实践**：

- 始终为函数参数和返回值显式声明类型。
- 优先使用可选参数而不是 `| undefined`。
- 使用剩余参数 (`...rest`) 来处理可变参数列表，而不是 `arguments` 对象。

## 7. 类型推断与最佳实践总结

### 7.1 类型推断 (Type Inference)

TypeScript 非常智能，即使你不显式写类型，它也会尽可能地推断出类型。

```typescript
let myName = "Alice"; // TypeScript 推断出 myName 的类型是 string
// myName = 123; // Error: Type 'number' is not assignable to type 'string'.

let myArray = [1, 2, 3]; // 推断为 number[]
myArray.push(4); // OK
// myArray.push("5"); // Error: Argument of type 'string' is not assignable to parameter of type 'number'.
```

**最佳实践**：

- **在可以明显推断出类型的地方，不必手动添加类型注解**（例如 `let x = 10`）。这可以减少代码冗余。
- 但对于函数参数、返回值和公开的 API（如组件 Props、函数库接口），**应始终显式声明类型**，以提供清晰的契约和更好的文档提示。

### 7.2 通用最佳实践总结

1. **开启严格模式**：在 `tsconfig.json` 中设置 `"strict": true`。这是最重要的实践，它开启了所有严格的类型检查选项，包括 `strictNullChecks` 和 `noImplicitAny`。
2. **避免 `any`，拥抱 `unknown`**：将 `any` 视为最后的手段，优先使用更安全的 `unknown` 类型。
3. **使用更精确的类型**：优先使用字面量联合类型 (`"A" | "B"`) 而不是宽泛的 `string`；使用元组或对象类型而不是 `any[]`。
4. **优先使用 `interface` 定义对象**：对于对象形状，`interface` 更易于扩展（使用 `extends`）和理解。
5. **保持不可变性**：尽可能使用 `readonly`（用于属性）和 `ReadonlyArray<T>`（用于数组）来防止意外的数据变更。
6. **为公共 API 编写类型**：为你编写的函数、类和模块导出清晰地声明类型，这是你与代码使用者之间的契约。
7. **逐步迁移**：对于已有的 JavaScript 项目，可以通过添加 `// @ts-check` 和 JSDoc 注释来逐步引入类型检查，而无需立即重写为 `.ts` 文件。

## 8. 总结

TypeScript 的基础类型系统是其强大能力的根基。从简单的 `string` 和 `number`，到提供安全性的 `unknown` 和 `never`，再到精确的字面量类型，每一种类型都有其特定的用途和最佳实践。

理解并正确运用这些类型，能够帮助你构建出健壮、可维护且意图清晰的应用程序。记住，TypeScript 的目标不是给你的代码增加负担，而是通过提供强大的工具来帮助你减少错误并提高开发效率。从这些基础开始，逐步构建你的类型知识体系，你将能充分体验到 TypeScript 带来的开发乐趣和信心。

---

**延伸阅读与官方资源**：

- <https://www.typescriptlang.org/docs/handbook/2/everyday-types.html>
- <https://www.typescriptlang.org/play>
- <https://www.typescriptlang.org/tsconfig>
