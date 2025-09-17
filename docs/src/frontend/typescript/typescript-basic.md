好的，请看这篇关于 TypeScript 基础语法与最佳实践的详尽教程。

# TypeScript 基础语法详解与最佳实践

TypeScript 作为 JavaScript 的一个超集，通过引入静态类型系统，极大地提升了代码的可维护性、可读性和开发效率。本文将深入探讨 TypeScript 的基础语法，并分享行业认可的最佳实践。

## 1. 类型注解：TypeScript 的核心

类型注解是 TypeScript 最基础也是最重要的特性，它允许我们明确指定变量、函数参数和返回值的类型。

### 1.1 原始类型

TypeScript 包含了 JavaScript 的所有原始数据类型。

```typescript
// 字符串
let firstName: string = "John";
// 数字 (包括整数、浮点数、NaN, Infinity)
let age: number = 30;
let temperature: number = 36.6;
// 布尔值
let isActive: boolean = true;
// null 和 undefined
let nothing: null = null;
let notDefined: undefined = undefined;
// Symbol (ES6)
let uniqueKey: symbol = Symbol("unique");
// BigInt (ES2020)
let bigNumber: bigint = 9007199254740991n;
```

### 1.2 数组与元组

**数组** 表示相同类型元素的集合。
**元组** 表示已知元素数量和类型的数组，各元素的类型不必相同。

```typescript
// 数组类型定义有两种方式
let list1: number[] = [1, 2, 3];
let list2: Array<number> = [1, 2, 3]; // 泛型语法

// 元组类型
let person: [string, number, boolean] = ["Alice", 28, true];
// 访问元组元素
console.log(person[0]); // "Alice"
console.log(person[1]); // 28

// 元组也支持可选元素（TypeScript 3.0+）
let optionalTuple: [string, number?] = ["hello"];
optionalTuple = ["world", 42];
```

### 1.3 对象类型与接口

使用 `interface` 或 `type` 来定义对象的形状。

```typescript
// 使用 interface 定义对象结构
interface User {
  id: number;
  name: string;
  email?: string; // 可选属性
  readonly createdAt: Date; // 只读属性
}

// 使用类型别名 type
type Point = {
  x: number;
  y: number;
};

// 应用接口
const user: User = {
  id: 1,
  name: "Jane Doe",
  createdAt: new Date(),
};

// user.createdAt = new Date(); // 错误: 无法分配到 "createdAt" ，因为它是只读属性
```

### 1.4 联合类型与字面量类型

**联合类型** 表示一个值可以是几种类型之一。
**字面量类型** 将值限定为特定的字面量。

```typescript
// 联合类型
let id: string | number;
id = "ABC123";
id = 123; // 也有效

// 字面量类型
type Direction = "up" | "down" | "left" | "right";
let move: Direction = "up";
// move = "diagonal"; // 错误: 类型 '"diagonal"' 不能赋值给类型 'Direction'

// 结合使用
type StatusCode = 200 | 201 | 400 | 404 | 500;
let currentStatus: StatusCode = 200;
```

### 1.5 枚举类型

枚举允许定义一组命名常量。

```typescript
// 数字枚举
enum Role {
  Admin, // 0
  Editor, // 1
  User, // 2
}

// 字符串枚举
enum FileAccess {
  Read = "READ",
  Write = "WRITE",
  Execute = "EXECUTE",
}

// 常量枚举 (更高效，在编译时会被内联)
const enum LogLevel {
  Info,
  Warn,
  Error,
}

let userRole: Role = Role.Admin;
let filePermission: FileAccess = FileAccess.Read;
let logLevel: LogLevel = LogLevel.Info;

console.log(Role.Admin); // 0
console.log(FileAccess.Write); // "WRITE"
```

**最佳实践**: 考虑到树摇（Tree-shaking）和运行时代码量，现代 TypeScript 更推荐使用联合类型字面量而非枚举，或者使用 `const enum`。

### 1.6 any, unknown, void, never

这些是 TypeScript 中的特殊类型。

```typescript
// any - 关闭类型检查，应尽量避免使用
let uncertain: any = "Hello";
uncertain = 42;
uncertain = true;

// unknown - 更安全的 any，在使用前需要类型检查
let notSure: unknown = 4;
notSure = "maybe a string";
// console.log(notSure.length); // 错误: Object is of type 'unknown'
if (typeof notSure === "string") {
  console.log(notSure.length); // 现在可以了
}

// void - 表示没有返回值的函数
function logMessage(message: string): void {
  console.log(message);
  // 隐式返回 undefined
}

// never - 表示永远不会返回的函数（总是抛出异常或无限循环）
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {
    // 无限循环
  }
}
```

**最佳实践**: 优先使用 `unknown` 而不是 `any`，因为它更安全且要求类型检查。

## 2. 函数类型注解

TypeScript 允许我们为函数参数和返回值添加类型注解。

```typescript
// 函数声明
function add(x: number, y: number): number {
  return x + y;
}

// 函数表达式
const multiply = function (x: number, y: number): number {
  return x * y;
};

// 箭头函数
const divide = (x: number, y: number): number => {
  if (y === 0) {
    throw new Error("Division by zero");
  }
  return x / y;
};

// 可选参数和默认参数
function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}

// 函数重载（多个函数类型定义 + 一个实现）
function getArray(value: string): string[];
function getArray(value: number): number[];
function getArray(value: string | number): string[] | number[] {
  if (typeof value === "string") {
    return value.split("");
  } else {
    return value.toString().split("").map(Number);
  }
}

const chars = getArray("hello"); // string[]
const digits = getArray(12345); // number[]
```

## 3. 类型别名与接口

`type` 和 `interface` 都可以用来定义对象类型，但它们有一些区别。

```typescript
// 接口定义
interface Animal {
  name: string;
  sound(): void;
}

// 接口扩展
interface Dog extends Animal {
  breed: string;
  bark(): void;
}

// 类型别名
type Person = {
  name: string;
  age: number;
};

// 类型别名可以使用联合类型、元组等
type ID = string | number;
type Coordinates = [number, number];

// 交叉类型（合并多个类型）
type Employee = Person & { employeeId: ID };

const employee: Employee = {
  name: "John",
  age: 30,
  employeeId: "E123", // 可以是 string 或 number
};
```

**接口 vs 类型别名**:

- 接口更适合定义对象形状且支持声明合并
- 类型别名更灵活，可以定义联合类型、元组等
- 优先使用接口定义对象结构，除非需要联合类型等特性

## 4. 类型推断与类型断言

TypeScript 具有强大的类型推断能力，但也允许开发者明确断言类型。

```typescript
// 类型推断 - TypeScript 会自动推断变量类型
let message = "Hello World"; // 推断为 string
let count = 10; // 推断为 number

// 数组类型推断
let numbers = [1, 2, 3]; // 推断为 number[]

// 上下文类型推断（函数参数）
numbers.forEach((n) => {
  console.log(n.toFixed(2)); // n 被推断为 number
});

// 类型断言 - 当开发者比 TypeScript 更了解值的类型时使用
let someValue: any = "this is a string";

// 方式一: 使用角括号语法
let strLength1: number = (<string>someValue).length;

// 方式二: 使用 as 语法（在 JSX 中必须使用此方式）
let strLength2: number = (someValue as string).length;

// 非空断言操作符 !
let maybeString: string | null = getStringOrNull();
// console.log(maybeString.length); // 错误: 可能为 null
console.log(maybeString!.length); // 使用 ! 断言不为 null

// 双重断言（应尽量避免）
let unknownValue: unknown = "hello";
// let str: string = unknownValue; // 错误
let str: string = unknownValue as any as string;
```

**最佳实践**: 尽量避免使用类型断言和非空断言，优先通过代码逻辑确保类型安全。

## 5. 泛型

泛型允许创建可重用的组件，这些组件可以支持多种类型。

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg;
}

let output1 = identity<string>("myString"); // 输出类型为 string
let output2 = identity(42); // 类型推断为 number

// 泛型接口
interface KeyValuePair<K, V> {
  key: K;
  value: V;
}

let pair: KeyValuePair<number, string> = { key: 1, value: "one" };

// 泛型类
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;
}

let myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = (x, y) => x + y;

// 泛型约束
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length); // 现在我们知道 arg 有 .length 属性
  return arg;
}

// 在泛型约束中使用类型参数
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

let person = { name: "Jane", age: 28 };
let name = getProperty(person, "name"); // string
// let email = getProperty(person, "email"); // 错误: "email" 不在 "name" | "age" 中
```

## 6. 高级类型

### 6.1 keyof 和索引类型

```typescript
interface Person {
  name: string;
  age: number;
  location: string;
}

type PersonKey = keyof Person; // "name" | "age" | "location"

function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person: Person = { name: "Alice", age: 30, location: "Paris" };
const name = getValue(person, "name"); // string
const age = getValue(person, "age"); // number
```

### 6.2 映射类型

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

type Person = {
  name: string;
  age: number;
};

type ReadonlyPerson = Readonly<Person>;
type PartialPerson = Partial<Person>;

// 内置的实用类型
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type Record<K extends keyof any, T> = {
  [P in K]: T;
};

type PersonName = Pick<Person, "name">; // { name: string }
type ThreeStringProps = Record<"prop1" | "prop2" | "prop3", string>;
```

## 7. 命名空间与模块

```typescript
// 命名空间（较老的方式，现代代码推荐使用 ES6 模块）
namespace Utilities {
  export function formatDate(date: Date): string {
    return date.toLocaleDateString();
  }
  
  export function calculateTax(amount: number): number {
    return amount * 0.2;
  }
}

// 使用命名空间
const today = Utilities.formatDate(new Date());

// ES6 模块（推荐）
// math.ts
export function add(x: number, y: number): number {
  return x + y;
}

export function multiply(x: number, y: number): number {
  return x * y;
}

// app.ts
import { add, multiply } from './math';
console.log(add(2, 3)); // 5
```

## 8. TypeScript 配置最佳实践

`tsconfig.json` 是 TypeScript 项目的核心配置文件。

```json
{
  "compilerOptions": {
    /* 语言和环境 */
    "target": "ES2020", // 编译目标
    "lib": ["ES2020", "DOM", "DOM.Iterable"], // 包含的库定义文件
    
    /* 模块系统 */
    "module": "ESNext", // 模块系统
    "moduleResolution": "node", // 模块解析策略
    "baseUrl": "./", // 解析非相对模块名的基准目录
    "paths": { // 模块名到基于 baseUrl 的路径映射
      "@/*": ["src/*"]
    },
    
    /* JavaScript 支持 */
    "allowJs": true, // 允许编译 JavaScript 文件
    "checkJs": true, // 在 .js 文件中报告错误
    
    /* 生成文件选项 */
    "outDir": "./dist", // 输出目录
    "removeComments": true, // 删除注释
    
    /* 类型检查选项 - 启用严格模式 */
    "strict": true, // 启用所有严格类型检查选项
    "noImplicitAny": true, // 禁止隐式 any 类型
    "strictNullChecks": true, // 严格的 null 检查
    "strictFunctionTypes": true, // 严格的函数类型检查
    "strictBindCallApply": true, // 严格的 bind/call/apply 检查
    "strictPropertyInitialization": true, // 严格的属性初始化检查
    "noImplicitThis": true, // 禁止隐式的 this 类型
    "alwaysStrict": true, // 以严格模式检查代码
    
    /* 额外检查 */
    "noUnusedLocals": true, // 报告未使用的局部变量
    "noUnusedParameters": true, // 报告未使用的参数
    "exactOptionalPropertyTypes": true, // 精确的可选属性类型
    "noImplicitReturns": true, // 不是函数的所有代码路径都有返回值时报错
    "noFallthroughCasesInSwitch": true, // 报告 switch 语句的 fallthrough 错误
    
    /* 模块解析选项 */
    "esModuleInterop": true, // 为导入 CommonJS 模块提供兼容性
    "allowSyntheticDefaultImports": true, // 允许从没有默认导出的模块中默认导入
    
    /* 源代码映射 */
    "sourceMap": true, // 生成相应的 .map 文件
    "declaration": true, // 生成相应的 .d.ts 文件
    "declarationMap": true, // 为声明文件生成 sourcemap
    
    /* 实验性选项 */
    "experimentalDecorators": true, // 启用实验性的装饰器支持
    "emitDecoratorMetadata": true, // 为装饰器提供元数据支持
  },
  "include": [
    "src/**/*" // 包含的文件
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts" // 排除的文件
  ]
}
```

## 9. 实用技巧与最佳实践

### 9.1 使用 const 断言

```typescript
// 不使用 const 断言
let sizes = ["small", "medium", "large"]; // string[]
let first = sizes[0]; // string

// 使用 const 断言
let sizesConst = ["small", "medium", "large"] as const; // readonly ["small", "medium", "large"]
let firstConst = sizesConst[0]; // "small"

// 对象使用 const 断言
const user = {
  name: "John",
  age: 30,
} as const;
// user.age = 31; // 错误: 无法分配到 "age" ，因为它是只读属性
```

### 9.2 使用 satisfies 操作符 (TypeScript 4.9+)

`satisfies` 操作符允许检查表达式是否匹配某种类型，而不改变表达式的推断类型。

```typescript
interface Colors {
  red: string;
  green: string;
  blue: string;
  [key: string]: string; // 索引签名
}

// 使用 as 会丢失具体信息
const colors1 = {
  red: "#FF0000",
  green: "#00FF00",
  blue: "#0000FF",
  primary: "red", // 被推断为 string
} as Colors;

// 使用 satisfies 保留具体类型信息
const colors2 = {
  red: "#FF0000",
  green: "#00FF00",
  blue: "#0000FF",
  primary: "red", // 被推断为字面量类型 "red"
} satisfies Colors;

// colors1.primary 是 string 类型
// colors2.primary 是 "red" 类型，可以获得更好的自动补全
```

### 9.3 避免过度使用 any

```typescript
// 不良实践: 过度使用 any
function processData(data: any): any {
  // 这里没有任何类型安全
  return data.process();
}

// 良好实践: 使用泛型或具体类型
function processData<T>(data: { process: () => T }): T {
  return data.process();
}

// 或者使用 unknown 进行安全处理
function safeParse(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

const result = safeParse('{"name": "John"}');
if (result && typeof result === "object" && "name" in result) {
  console.log((result as { name: string }).name);
}
```

## 10. 完整示例

下面是一个综合应用上述概念的完整示例：

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive" | "pending";
}

export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

// userService.ts
import { User, ApiResponse } from "./types";

class UserService {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/users/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async updateUser<T extends Partial<User>>(id: number, updates: T): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}

// app.ts
import { UserService } from "./userService";

async function main() {
  const userService = new UserService();
  
  try {
    const response = await userService.getUser(1);
    
    if (response.success) {
      console.log(`User: ${response.data.name}`);
      
      // 更新用户状态
      const updateResponse = await userService.updateUser(1, { 
        status: "active" 
      });
      
      if (updateResponse.success) {
        console.log("User updated successfully");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unknown error occurred");
    }
  }
}

main();
```

## 总结

TypeScript 通过静态类型系统为 JavaScript 带来了类型安全性和更好的开发体验。掌握基础语法并遵循最佳实践，可以帮助你编写出更健壮、可维护的代码。关键要点包括：

1. **充分利用类型推断**，减少不必要的类型注解
2. **优先使用接口定义对象结构**，类型别名用于复杂类型操作
3. **尽量避免使用 any**，优先选择 unknown 或更具体的类型
4. **启用严格模式**，获得最大程度的类型安全
5. **合理使用泛型**，创建可重用的类型安全组件
6. **保持类型声明接近使用位置**，提高代码可读性

通过不断实践这些概念，你将能够充分利用 TypeScript 的优势，构建高质量的应用程序。

## 扩展资源

- <https://www.typescriptlang.org/docs/handbook/>
- <https://www.typescriptlang.org/play>
- <https://github.com/typescript-eslint/typescript-eslint>
- <https://github.com/DefinitelyTyped/DefinitelyTyped> - 高质量 TypeScript 类型定义库
