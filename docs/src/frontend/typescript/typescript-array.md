好的，作为一名 TypeScript 编程技术专家和 Markdown 技术文档大师，我将为你生成一篇详尽、准确且遵循最佳实践的 TypeScript Array 教程。

在撰写本文之前，我参考分析了 TypeScript 官方文档、MDN Web Docs 以及多个知名社区和博客（如 freeCodeCamp, DigitalOcean, GeeksforGeeks, JavaScript.info, 知乎、掘金上的优质文章）的至少 10 篇优质内容，以确保方案的先进性和准确性。

---

# TypeScript Array 详解与最佳实践

数组是编程中最基本和常用的数据结构之一，用于在单个变量中存储多个有序的元素。 TypeScript 作为 JavaScript 的超集，为其数组结构赋予了强大的类型能力，极大地提升了代码的可靠性和开发体验。

## 目录

1. #数组的类型定义
2. #数组的创建与初始化
3. #常见数组操作与方法
4. #只读数组
5. #元组
6. #最佳实践
7. #常见问题与误区

## 数组的类型定义

在 TypeScript 中，定义数组类型主要有两种语法方式：**类型后接 `[]`** 和 **泛型数组 `Array<Type>`**。 两者在功能上完全等价，选择哪一种主要取决于团队偏好和代码可读性。

### 1. 类型 + `[]` 语法

这是最简单直接的方式，在元素类型后加上方括号。

```typescript
// 定义一个数字数组
let numbers: number[] = [1, 2, 3, 4, 5];

// 定义一个字符串数组
let names: string[] = ['Alice', 'Bob', 'Charlie'];

// 定义一个联合类型数组
let mixedValues: (string | number)[] = ['hello', 42, 'world', 100];
```

### 2. 泛型数组语法

使用 `Array<elemType>` 的语法，更明确地表明这是一个泛型结构。

```typescript
// 等价于 number[]
let numbers: Array<number> = [1, 2, 3, 4, 5];

// 等价于 string[]
let names: Array<string> = ['Alice', 'Bob', 'Charlie'];

// 等价于 (string | number)[]
let mixedValues: Array<string | number> = ['hello', 42, 'world', 100];
```

**推荐使用 `类型[]` 语法**，因为它更简洁，并且避免了与 JSX 语法可能产生的冲突。

### 多维数组

可以通过嵌套的方式定义多维数组的类型。

```typescript
// 二维数组 (矩阵)
let matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

// 使用泛型语法定义三维数组
let cube: Array<Array<Array<number>>> = [
  [
    [1, 2],
    [3, 4],
  ],
  [
    [5, 6],
    [7, 8],
  ],
];
```

## 数组的创建与初始化

```typescript
// 1. 字面量方式 (最常用)
const fruits: string[] = ['Apple', 'Banana', 'Orange'];

// 2. 使用 Array 构造函数 (不推荐，类型推断可能不理想)
const numbers: number[] = new Array(1, 2, 3); // 创建包含 [1, 2, 3] 的数组
const emptyArrayWithLength: number[] = new Array(5); // 创建一个长度为 5 的空数组 (非真实元素)

// 3. 使用 Array.of (推荐替代 new Array)
const anotherArray = Array.of(1, 2, 3, 4); // [1, 2, 3, 4]

// 4. 使用 Array.from 从类数组对象或可迭代对象创建
const fromString = Array.from('hello'); // ['h', 'e', 'l', 'l', 'o']
const fromSet = Array.from(new Set([1, 2, 2, 3])); // [1, 2, 3]
```

## 常见数组操作与方法

TypeScript 完全支持所有 JavaScript 数组方法，并在此基础上提供完美的类型检查和智能提示。

### 增删改查

```typescript
let pets: string[] = ['Dog', 'Cat'];

// 增 - 末尾添加
pets.push('Hamster'); // ['Dog', 'Cat', 'Hamster']

// 增 - 开头添加
pets.unshift('Bird'); // ['Bird', 'Dog', 'Cat', 'Hamster']

// 删 - 末尾删除
const lastPet = pets.pop(); // 'Hamster', pets becomes ['Bird', 'Dog', 'Cat']

// 删 - 开头删除
const firstPet = pets.shift(); // 'Bird', pets becomes ['Dog', 'Cat']

// 删/改 - splice (起始索引，删除数量，新增元素...)
pets.splice(1, 1, 'Fish', 'Rabbit'); // 从索引1开始，删除1个元素，并添加两个新元素
// pets 现在是 ['Dog', 'Fish', 'Rabbit']

// 查 - indexOf / includes / find
const index = pets.indexOf('Fish'); // 1
const hasCat = pets.includes('Cat'); // false
const foundPet = pets.find((pet) => pet.startsWith('R')); // 'Rabbit'
// find 方法的参数是一个类型守卫函数，TypeScript 能正确推断参数类型和返回值类型
```

### 遍历

```typescript
const scores: number[] = [80, 95, 70, 88];

// for循环
for (let i = 0; i < scores.length; i++) {
  console.log(`Score ${i}: ${scores[i]}`);
}

// for...of (推荐用于遍历值)
for (const score of scores) {
  console.log(score);
}

// forEach 方法
scores.forEach((score, index) => {
  console.log(`Score ${index}: ${score}`);
});
// TypeScript 为 forEach 的回调函数提供了准确的参数类型 (score: number, index: number, array: number[]) => void
```

### 转换与迭代 (不可变操作)

这些方法不会改变原数组，而是返回一个新数组。

```typescript
const numbers = [1, 2, 3, 4, 5];

// map - 映射新数组
const doubled = numbers.map((num) => num * 2); // [2, 4, 6, 8, 10]
// TypeScript 能推断出 doubled 的类型是 number[]

// filter - 过滤数组
const evens = numbers.filter((num) => num % 2 === 0); // [2, 4]
// 类型守卫：如果回调函数是类型守卫，TS 可以缩小返回数组的类型
const mixedArray: (number | string)[] = [1, 'two', 3, 'four'];
const onlyNumbers = mixedArray.filter((item): item is number => typeof item === 'number'); // number[]

// reduce - 归约为一个值
const sum = numbers.reduce((accumulator, current) => accumulator + current, 0); // 15
```

## 只读数组

为了防止数组被意外修改，TypeScript 提供了 `ReadonlyArray<T>` 类型或其简写 `readonly T[]`。

```typescript
// 使用 readonly 修饰符
const readOnlyFruits: readonly string[] = ['Apple', 'Banana'];
// 或使用 ReadonlyArray<T> 泛型
const alsoReadOnly: ReadonlyArray<string> = ['Apple', 'Banana'];

// 以下操作都会引发编译时错误
readOnlyFruits.push('Orange'); // Error: Property 'push' does not exist on type 'readonly string[]'.
readOnlyFruits[0] = 'Pear'; // Error: Index signature in type 'readonly string[]' only permits reading.

// 最佳实践：将函数参数声明为只读，避免内部修改输入
function processItems(items: readonly string[]) {
  // items.push('new'); // 错误！
  return items.map((item) => item.toUpperCase()); // 可以，因为生成了新数组
}
```

## 元组

元组 (Tuple) 是 TypeScript 中特有的概念，它允许表示一个**已知元素数量和类型**的数组。

```typescript
// 定义一个简单的元组类型
let person: [string, number];
person = ['Alice', 30]; // OK
person = [30, 'Alice']; // Error: Type 'number' is not assignable to type 'string'.

// 访问有已知索引的元素
console.log(person[0].substring(1)); // 'lice' - TS 知道它是 string
console.log(person[1].toFixed(2)); // '30.00' - TS 知道它是 number
// console.log(person[2]); // Error: Tuple type '[string, number]' of length '2' has no element at index '2'.

// 可选元素 (TypeScript 4.0+)
let optionalTuple: [string, number?];
optionalTuple = ['hello']; // OK
optionalTuple = ['hello', 42]; // OK

// 剩余元素 (变长元组)
type StringNumberBooleans = [string, number, ...boolean[]];
type StringBooleansNumber = [string, ...boolean[], number];
type BooleansStringNumber = [...boolean[], string, number];
```

## 最佳实践

1. **优先使用 `类型[]` 语法**：相比 `Array<Type>` 更简洁，阅读负担更小。

2. **尽可能让 TypeScript 推断数组类型**：在初始化时赋值，可以省略类型注解，让 TS 自动推断。

    ```typescript
    // 好：TS 能推断出 numbers 是 number[]
    const numbers = [1, 2, 3];
    // 不需要写成 const numbers: number[] = [1, 2, 3];
    ```

3. **使用 `readonly` 修饰符保护数据**：对于配置数组、函数参数等不应被修改的情况，使用 `readonly` 可以避免意外的修改，提高代码的可靠性和可预测性。

4. **区分 `for` 循环和数组方法**：
    * 需要索引或需要中断循环时，使用 `for` 循环或 `for...of` (结合 `entries()`)。
    * 否则，优先使用 `map`, `filter`, `forEach`, `reduce` 等高阶函数，它们更具声明式风格，且通常能返回新的不可变数据。

5. **善用类型守卫进行 `filter`**：通过自定义类型守卫函数，可以帮助 TypeScript 正确缩小 `filter` 后数组的类型。

    ```typescript
    function isNumber(value: unknown): value is number {
      return typeof value === 'number';
    }

    const mixedArray: unknown[] = [1, 'hello', 2, 'world'];
    const numbersArray = mixedArray.filter(isNumber); // numbersArray 的类型被推断为 number[]
    ```

6. **为复杂对象数组定义接口 (Interface)**：不要仅仅使用 `{id: number; name: string}[]`，而是先定义接口，提高代码可读性和可维护性。

    ```typescript
    interface User {
      id: number;
      name: string;
      email: string;
    }

    const users: User[] = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      // ...
    ];
    ```

## 常见问题与误区

**1. 空数组或动态数组的类型推断问题**

一个空数组 `[]` 会被 TypeScript 推断为 `never[]` 类型，无法容纳任何元素。必须显式注解其类型。

```typescript
// 错误示例
const emptyArray = []; // type: never[]
emptyArray.push(1); // Error: Argument of type 'number' is not assignable to parameter of type 'never'.

// 正确做法
const emptyArray: number[] = [];
emptyArray.push(1); // OK

// 或者初始化时赋值
const initializedArray = [1, 2, 3]; // type: number[]
```

**2. `array.length` 检查与类型收窄**

TypeScript 不会因为检查了 `array.length` 就自动收窄数组本身的类型，但对于元组类型是有效的。

```typescript
function doSomething(arg: string[] | string) {
  if (arg.length === 1) {
    // arg 仍然是 string[] | string
    // 需要使用 Array.isArray 来收窄类型
    if (Array.isArray(arg)) {
      console.log(arg[0]); // OK, arg is string[]
    } else {
      console.log(arg); // OK, arg is string
    }
  }
}

// 对元组有效
function processTuple(pair: [string, number] | string) {
  if (pair.length === 2) {
    // pair 被收窄为 [string, number]
    console.log(pair[0], pair[1]);
  }
}
```

**3. 索引访问可能得到 `undefined`**

即使你确认索引存在，TypeScript 也会认为通过索引访问可能返回 `undefined`，尤其是在访问动态计算的索引时。

```typescript
const array = [1, 2, 3];
const element = array[5]; // Type: number | undefined
// console.log(element.toFixed()); // Error: 'element' is possibly 'undefined'.

// 安全的做法是进行检查
if (element !== undefined) {
  console.log(element.toFixed());
}

// 或者使用可选链
console.log(element?.toFixed());
```

通过遵循这些模式和最佳实践，你可以充分利用 TypeScript 的类型系统，编写出既安全又易于维护的数组操作代码。
