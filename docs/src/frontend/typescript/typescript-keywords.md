# TypeScript 关键字完整指南

TypeScript 作为 JavaScript 的超集，引入了一套强大的类型系统和语法扩展，其中**关键字**在类型定义、变量声明和代码结构中扮演着核心角色。本指南全面介绍 TypeScript 中的关键关键字及其使用场景，帮助开发者编写更健壮、可维护的代码。

## 目录

- #基本类型关键字
- #高级类型关键字
- #变量声明关键字
- #类与接口关键字
- #类型操作关键字
- #其他重要关键字
- #实用技巧与最佳实践

## 基本类型关键字

### `type`

定义类型别名，提高代码可读性和重用性：

```typescript
type UserID = number;
type UserRole = "admin" | "editor" | "viewer";
```

### `interface`

描述对象结构，支持扩展和实现：

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface Admin extends User {
  permissions: string[];
}
```

### `enum`

定义命名常量集合：

```typescript
enum LogLevel {
  Error = 0,
  Warn = 1,
  Info = 2,
  Debug = 3
}
```

### `any`

最宽松的类型，应谨慎使用：

```typescript
let uncertainValue: any = "could be anything";
uncertainValue = 42; // 有效
```

### `unknown`

类型安全的替代方案，需类型检查或断言：

```typescript
let userInput: unknown = fetchUserInput();

if (typeof userInput === "string") {
  console.log(userInput.toUpperCase());
}
```

### `never`

表示永不出现的值，用于异常或无限循环：

```typescript
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}
```

### `void`

表示没有返回值的函数：

```typescript
function logMessage(message: string): void {
  console.log(message);
}
```

## 高级类型关键字

### `keyof`

获取对象键的联合类型：

```typescript
type UserKeys = keyof User; // "id" | "name" | "email"
```

### `in`

在映射类型中迭代键：

```typescript
type OptionalUser = {
  [K in keyof User]?: User[K];
};
```

### `infer`

在条件类型中推断类型：

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

### `is`

类型谓词，用于类型保护：

```typescript
function isAdmin(user: User): user is Admin {
  return "permissions" in user;
}
```

## 变量声明关键字

### `let` 和 `const`

块级作用域变量声明：

```typescript
let count = 0;
const MAX_USERS = 100;
```

### `var`（避免使用）

函数作用域变量（不推荐）：

```typescript
function example() {
  if (true) {
    var x = 10; // 函数作用域
  }
  console.log(x); // 10
}
```

## 类与接口关键字

### `class`

定义类结构：

```typescript
class UserAccount {
  constructor(public id: number, public name: string) {}
  
  greet() {
    return `Hello, ${this.name}!`;
  }
}
```

### `public` / `private` / `protected`

访问修饰符：

```typescript
class SecureUser {
  private secret: string;
  protected token: string;
  
  public constructor(secret: string) {
    this.secret = secret;
  }
}
```

### `readonly`

只读属性：

```typescript
class Config {
  readonly apiUrl: string = "https://api.example.com";
}
```

### `static`

静态成员：

```typescript
class MathHelper {
  static PI = 3.14;
  
  static circleArea(radius: number) {
    return this.PI * radius * radius;
  }
}
```

### `abstract`

抽象类和抽象方法：

```typescript
abstract class Shape {
  abstract area(): number;
}

class Circle extends Shape {
  constructor(public radius: number) {
    super();
  }
  
  area() {
    return Math.PI * this.radius ** 2;
  }
}
```

### `implements`

类实现接口：

```typescript
interface Printable {
  print(): void;
}

class Report implements Printable {
  print() {
    console.log("Printing report...");
  }
}
```

## 类型操作关键字

### `as`

类型断言：

```typescript
const input = document.getElementById("user-input") as HTMLInputElement;
```

### `satisfies`（TS 4.9+）

验证表达式类型而不改变推断类型：

```typescript
const user = {
  name: "Alice",
  age: 30
} satisfies Record<string, string | number>;
```

### `typeof`

获取值或变量的类型：

```typescript
const defaultUser = { name: "Guest", role: "viewer" };
type DefaultUser = typeof defaultUser;
```

## 其他重要关键字

### `namespace`

组织相关代码（现代 TS 中推荐使用模块）：

```typescript
namespace Validation {
  export interface StringValidator {
    isValid(s: string): boolean;
  }
}
```

### `declare`

环境声明：

```typescript
declare module "*.svg" {
  const content: string;
  export default content;
}
```

### `this`

函数上下文类型：

```typescript
interface DB {
  users: User[];
  getUsers(this: DB): User[];
}
```

## 实用技巧与最佳实践

1. **优先使用 `interface` vs `type`**
   - 使用 `interface` 进行对象形状定义
   - 使用 `type` 进行联合、元组或复杂类型操作

2. **避免 `any`，使用 `unknown`**

   ```typescript
   // 不推荐
   function parse(data: any) {}
   
   // 推荐
   function safeParse(data: unknown) {
     if (typeof data === "string") {
       return JSON.parse(data);
     }
   }
   ```

3. **利用 `as const` 进行字面量推断**

   ```typescript
   const routes = ["/home", "/users", "/settings"] as const;
   type Route = typeof routes[number]; // "/home" | "/users" | "/settings"
   ```

4. **组合关键字创建高级类型**

   ```typescript
   // 条件类型与 infer
   type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
   
   // 映射类型与 keyof
   type Nullable<T> = {
     [K in keyof T]: T[K] | null;
   };
   ```

5. **使用 `satisfies` 验证类型而不改变推断**

   ```typescript
   const config = {
     theme: "dark",
     timeout: 5000
   } satisfies Record<string, string | number>;
   
   // 正确推断 theme 为 string，timeout 为 number
   ```

TypeScript 关键字系统提供了强大的工具集，使开发者能够在编译时捕获错误并表达复杂的类型关系。通过掌握这些关键字及其组合使用，您可以显著提高代码质量和开发效率。

> 官方资源推荐：  
>
> - <https://www.typescriptlang.org/docs/handbook>  
> - <https://www.typescriptlang.org/play>  
> - <https://github.com/microsoft/TypeScript>
