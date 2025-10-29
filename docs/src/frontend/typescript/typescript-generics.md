好的，请看这篇关于 TypeScript 泛型的详细技术文档。本文在参考 TypeScript 官方手册、大量社区优质文章和最佳实践总结的基础上编写而成，旨在为您提供一份全面、清晰且实用的指南。

---

# TypeScript 泛型详解与最佳实践

## 1. 泛型是什么？为什么需要它？

**泛型（Generics）** 是 TypeScript 中一种强大的工具，它允许我们创建可重用的组件，这些组件能够支持多种类型，而不是单一的类型。这为代码提供了更好的灵活性和可重用性，同时又不失类型安全。

可以把泛型理解为**类型参数**，它像一个占位符，在使用时再由具体的类型填充。

### 1.1 一个没有泛型的问题

假设我们需要一个返回数组第一项的 `identity` 函数。

```typescript
// 方案一：使用 any - 失去类型安全
function identity(arg: any): any {
  return arg[0];
}
let output = identity([1, 2, 3]); // output 类型为 any，无法知道是 number
output = 'hello'; // 这不会报错，但逻辑上错误

// 方案二：为每种类型重载 - 冗长且不可扩展
function identityNumber(arg: number[]): number {
  return arg[0];
}
function identityString(arg: string[]): string {
  return arg[0];
}
// ... 更多类型
```

**没有泛型，我们只能在类型安全（但代码冗长）和灵活性（但失去类型安全）之间做出取舍。**

### 1.2 泛型的解决方案

泛型完美地解决了这个问题：

```typescript
// 使用泛型
function identity<T>(arg: T[]): T {
  return arg[0];
}

// 使用方式一：显式指定类型参数
let output1 = identity<number>([1, 2, 3]); // output1 的类型是 number
// output1 = 'hello'; // Error: Type 'string' is not assignable to type 'number'

// 使用方式二：利用类型推断（更常见）
let output2 = identity(['hello', 'world']); // output2 的类型被推断为 string
let output3 = identity([true, false]); // output3 的类型被推断为 boolean
```

现在，`identity` 函数可以处理任何类型的数组，并且返回值的类型会与数组元素的类型自动关联，完美地兼顾了灵活性和类型安全。

## 2. 泛型基本语法

### 2.1 泛型函数

使用尖括号 `< >` 声明一个类型参数，通常使用大写字母 `T` (Type)、`U`、`K` (Key)、`V` (Value) 等。

```typescript
// 声明一个类型参数 T
function logAndReturn<T>(value: T): T {
  console.log(value);
  return value;
}

// 可以声明多个类型参数
function mapArray<InputType, OutputType>(arr: InputType[], mapper: (item: InputType) => OutputType): OutputType[] {
  return arr.map(mapper);
}

const numbers = [1, 2, 3];
const strings = mapArray(numbers, (num) => num.toString()); // strings: string[]
// InputType 被推断为 number, OutputType 被推断为 string
```

### 2.2 泛型接口

接口也可以使用泛型来描述更通用的结构。

```typescript
// 定义一个通用的响应接口
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T; // data 字段的类型由使用时的泛型参数决定
  timestamp: Date;
}

// 使用泛型接口
const userResponse: ApiResponse<{ id: number; name: string }> = {
  code: 200,
  message: 'OK',
  data: { id: 1, name: 'Alice' }, // 现在 data 必须是 { id: number; name: string }
  timestamp: new Date(),
};

const productResponse: ApiResponse<{ price: number }> = {
  code: 200,
  message: 'OK',
  data: { price: 99.99 }, // 现在 data 必须是 { price: number }
  timestamp: new Date(),
};
```

### 2.3 泛型类

类也可以使用泛型，特别适用于容器类或数据处理类。

```typescript
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;

  constructor(zeroValue: T, add: (x: T, y: T) => T) {
    this.zeroValue = zeroValue;
    this.add = add;
  }
}

// 用于 number 类型
const myNum = new GenericNumber<number>(0, (x, y) => x + y);
console.log(myNum.add(5, 10)); // 15

// 用于 string 类型
const myStr = new GenericNumber<string>('', (x, y) => x + y);
console.log(myStr.add('Hello, ', 'Generics!')); // "Hello, Generics!"
```

### 2.4 泛型别名

`type` 关键字也可以与泛型结合，创建灵活的类型别名。

```typescript
type Nullable<T> = T | null | undefined;
type StringOrNumber<T> = T extends string ? string : number;

let value1: Nullable<string>; // string | null | undefined
let value2: StringOrNumber<'hello'>; // string
let value3: StringOrNumber<123>; // number
```

## 3. 泛型约束 (Generic Constraints)

有时，我们不需要支持所有类型，而是希望类型参数满足某些条件。这时可以使用 `extends` 关键字进行**泛型约束**。

### 3.1 基本约束

```typescript
// 确保参数有 length 属性
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): void {
  console.log(arg.length);
}

logLength('hello'); // OK, string 有 .length
logLength([1, 2, 3]); // OK, array 有 .length
// logLength(42); // Error: number 没有 .length
```

### 3.2 使用类型参数约束

一个泛型类型参数可以被另一个约束。

```typescript
// 确保 K 是 T 对象的有效键名
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: 'Alice', age: 30 };
getProperty(person, 'name'); // OK, 返回 string 类型
getProperty(person, 'age'); // OK, 返回 number 类型
// getProperty(person, 'salary'); // Error: "salary" 不在 "name" | "age" 中
```

这是 TypeScript 中一个极其强大且常用的模式，它完全保证了键名的安全性。

## 4. 泛型默认参数

与函数默认参数类似，泛型也可以指定默认类型，这在某些类型可以推断出但您想提供回退时非常有用。

```typescript
// 为泛型参数 T 提供一个默认类型 string[]
function createArray<T = string[]>(length: number, value: T): T[] {
  return Array.from({ length }, () => value);
}

const stringArray = createArray(3, 'hi'); // T 被推断为 string, 返回 string[]
const numberArray = createArray<number>(3, 100); // 显式指定 T 为 number, 返回 number[]
const defaultArray = createArray(3, ['a']); // T 使用默认类型 string[], 返回 string[][]
```

这在复杂的泛型类型或库设计中非常常见。

## 5. 常见应用场景与最佳实践

### 5.1 在 React 组件中的应用

泛型在 React 的 Hook 和组件中广泛应用。

```typescript
import { useState } from 'react';

//  useState 本身是泛型函数
const [user, setUser] = useState<{ id: number; name: string } | null>(null);

// 自定义泛型 Hook：处理表单数据
function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);

  const handleChange = (field: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return { values, handleChange };
}

// 使用
const { values, handleChange } = useForm({ username: '', age: 0 });
// values 的类型为 { username: string; age: number }
// handleChange 的第一个参数只能是 "username" | "age"
```

### 5.2 与工具类型结合

TypeScript 内置了许多基于泛型的工具类型（Utility Types）。

```typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

// Partial：将所有属性变为可选
function updateUser(id: number, fieldsToUpdate: Partial<User>) {
  // ... 发送更新请求
}
updateUser(1, { name: 'Bob' }); // 只更新 name，OK

// Readonly：使所有属性只读
const admin: Readonly<User> = { id: 1, name: 'Admin' };
// admin.name = 'Other'; // Error: Cannot assign to 'name' because it is a read-only property.

// Pick：从类型中挑选一部分属性
type UserPreview = Pick<User, 'id' | 'name'>; // { id: number; name: string }

// Omit：从类型中排除一部分属性
type UserWithoutId = Omit<User, 'id'>; // { name: string; email?: string }
```

**最佳实践**：熟练掌握这些内置工具类型，可以极大地减少重复的类型定义。

### 5.3 函数式编程中的高阶函数

泛型让高阶函数的类型表达变得清晰。

```typescript
// 一个类型安全的 compose 函数
function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (x) => f(g(x));
}

const addOne = (x: number): number => x + 1;
const numberToString = (x: number): string => x.toString();

const addOneThenToString = compose(numberToString, addOne);
// addOneThenToString 的类型是 (a: number) => string
const result = addOneThenToString(5); // result: string = "6"
```

## 6. 高级主题：条件类型与推断

虽然超出了基础泛型的范围，但条件类型展示了泛型的终极威力。

```typescript
// 一个简单的条件类型：检查 T 是否为数组
type IsArray<T> = T extends any[] ? true : false;

type A = IsArray<number[]>; // true
type B = IsArray<string>; // false

// 结合 infer 关键字，提取数组元素的类型
type Flatten<T> = T extends (infer U)[] ? U : T;

type ElementType = Flatten<number[]>; // number
type ElementType2 = Flatten<string>; // string

// 这在函数重载和复杂类型变换中非常有用
```

## 7. 总结与最佳实践清单

1. **拥抱泛型以增强代码复用性和类型安全**：任何时候当你发现一个函数或组件可以处理多种类型时，首先考虑使用泛型。
2. **使用有意义的泛型参数名**：对于简单的场景，`T`, `U`, `V` 是可以的。对于更复杂的场景，使用 `KeyType`, `ValueType`, `ElementType` 等更具描述性的名称。
3. **优先使用约束而不是 `any`**：如果类型需要满足某些条件，使用 `extends` 进行约束，而不是回退到 `any`。
4. **善用类型推断**：在大多数情况下，让 TypeScript 自动推断泛型类型参数，可以使代码更简洁。只在必要时显式指定。
5. **掌握内置工具类型**：`Partial`, `Pick`, `Omit`, `ReturnType` 等是您的好朋友，可以节省大量时间。
6. **谨慎使用泛型**：如果代码只处理一种明确的具体类型，直接使用该类型即可，过度使用泛型会增加不必要的复杂性。
7. **为库和公用函数编写文档**：使用 JSDoc 清晰地说明每个泛型参数的用途和期望。

```typescript
/**
 * 获取对象数组中指定属性的值集合
 * @param arr - 源对象数组
 * @param key - 要提取的属性名
 * @returns 属性值数组
 */
function pluck<T, K extends keyof T>(arr: T[], key: K): T[K][] {
  return arr.map((obj) => obj[key]);
}

const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];
const names = pluck(users, 'name'); // names: string[] = ['Alice', 'Bob']
```

通过遵循这些实践，您可以有效地利用 TypeScript 泛型来构建健壮、灵活且易于维护的应用程序。

---

**参考资源：**

- <https://www.typescriptlang.org/docs/handbook/2/generics.html>
- <https://basarat.gitbook.io/typescript/type-system/generics>
- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#generic_methods> (围绕数组方法)
- 社区文章来自：_dev.to_, _medium.com_, _blog.logrocket.com_ 等平台关于 TypeScript Generics Best Practices 的讨论。
