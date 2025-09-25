好的，作为一名 TypeScript 编程技术专家和技术文档工程师，我将为您提供一篇关于 TypeScript 声明合并的详尽教程。本文融合了官方文档、社区最佳实践以及我个人的经验总结。

---

# TypeScript 声明合并 (Declaration Merging) 详解与最佳实践

## 1. 概述

声明合并是 TypeScript 的一项核心特性，它允许编译器将针对同一名称的多个独立声明合并为一个单一的声明。这个过程会自动合并这些声明的成员，并创建一个具有所有特性的单一结构。

**核心价值**：声明合并极大地增强了 TypeScript 的灵活性，使得开发者能够以非侵入式的方式扩展现有的类型定义（尤其是第三方库的类型），从而构建出更加健壮和可维护的大型应用程序。

## 2. 声明合并的类型

TypeScript 中的声明合并主要发生在五种实体间：

1. 接口合并
2. 命名空间合并
3. 类与接口、命名空间的合并
4. 函数合并
5. 枚举合并

### 2.1 接口合并

接口合并是最常见也是最简单的合并类型。只需定义多个同名接口，TypeScript 便会自动将它们合并。

```typescript
// 第一个接口声明
interface Box {
  height: number;
  width: number;
}

// 第二个同名接口声明
interface Box {
  length: number;
  scale: number;
}

// 合并后的结果相当于：
// interface Box {
//   height: number;
//   width: number;
//   length: number;
//   scale: number;
// }

const myBox: Box = {
  height: 50,
  width: 30,
  length: 100,
  scale: 1, // 必须包含所有合并后的属性
};
```

**非函数成员合并规则**：

- 对于非函数成员，如果同名成员的类型**完全相同**，则不会有问题。
- 如果同名成员的类型**不同**，编译器会报错。

```typescript
interface Clash {
  prop: number;
}
interface Clash {
  prop: string;
  // Error: Subsequent property declarations must have the same type.
  // Property 'prop' must be of type 'number', but here has type 'string'.
}
```

**函数成员合并规则**：函数成员会被视为**函数重载**。后续声明的接口具有更高的优先级，并且后来声明的重载会优先于先前声明的重载。

```typescript
interface Document {
  createElement(tagName: 'div'): HTMLDivElement;
  createElement(tagName: 'span'): HTMLSpanElement;
}

interface Document {
  createElement(tagName: 'canvas'): HTMLCanvasElement;
  createElement(tagName: string): HTMLElement; // 更泛化的签名
}

// 合并后的重载顺序为：
// 1. createElement(tagName: "canvas"): HTMLCanvasElement;
// 2. createElement(tagName: "div"): HTMLDivElement;
// 3. createElement(tagName: "span"): HTMLSpanElement;
// 4. createElement(tagName: string): HTMLElement;
// 注意：更泛化的签名会被放在最后
```

### 2.2 命名空间合并

命名空间可以与同名的命名空间、类、函数或枚举合并。合并时，命名空间导出的成员会被整合到一起。

**合并命名空间**：

```typescript
namespace Animals {
  export class Dog {}
}

namespace Animals {
  export class Cat {}
  export class Tiger {}
}

// 合并后，Animals 命名空间包含 Dog, Cat, Tiger
const myDog = new Animals.Dog();
const myCat = new Animals.Cat();
```

**命名空间与类/函数/枚举合并**：
这是一种非常强大的模式，常用于为类添加静态成员或为函数添加属性。

- **与类合并**：

```typescript
class Album {
  label: Album.AlbumLabel; // 使用合并后添加的类型
}
namespace Album {
  export class AlbumLabel {} // 为 Album 类添加静态成员
  export const year = 2023; // 为 Album 类添加静态属性
}

const album = new Album();
const label = new Album.AlbumLabel(); // 访问静态成员
const year = Album.year; // 访问静态属性
```

- **与函数合并**：

```typescript
function buildLabel(name: string): string {
  return buildLabel.prefix + name + buildLabel.suffix;
}
namespace buildLabel {
  export const suffix = '!';
  export const prefix = 'Hello, ';
}

console.log(buildLabel('TypeScript')); // Output: Hello, TypeScript!
console.log(buildLabel.prefix); // Output: Hello,
```

- **与枚举合并**：

```typescript
enum Color {
  Red = 1,
  Green = 2,
}
namespace Color {
  export function mix(color: Color): string {
    return `Mixed ${Color[color]}`;
  }
}

console.log(Color.Red); // Output: 1
console.log(Color.mix(Color.Green)); // Output: Mixed Green
```

### 2.3 函数合并

函数合并主要通过**函数重载**来实现，而不是像接口那样直接合并定义。

```typescript
// 重载 1
function reverse(x: number): number;
// 重载 2
function reverse(x: string): string;
// 函数实现
function reverse(x: number | string): number | string {
  if (typeof x === 'number') {
    return Number(x.toString().split('').reverse().join(''));
  } else {
    return x.split('').reverse().join('');
  }
}

const numResult = reverse(12345); // Type: number
const strResult = reverse('hello'); // Type: string
```

### 2.4 枚举合并

枚举合并与接口合并类似。合并时，成员会简单地叠加。

```typescript
enum Size {
  Small = 'S',
  Medium = 'M',
}
enum Size {
  Large = 'L',
  XLarge = 'XL', // 合并新的成员
}

console.log(Size.Medium); // Output: M
console.log(Size.XLarge); // Output: XL
```

**注意**：初始化和未初始化的枚举成员不能混合合并。如果第一个枚举成员是未初始化的，后续合并的枚举也不能初始化。

```typescript
// 这是可以的
enum E {
  A,
}
enum E {
  B = 2,
}

// 这会报错
enum F {
  A = 1,
}
enum F {
  B,
}
// Error: In an enum with multiple declarations,
// only one declaration can omit an initializer for its first enum element.
```

## 3. 模块增强：声明合并的最佳实践

声明合并最常见的应用场景是**模块增强**。当你使用第三方库时，其类型定义可能不完整，或者你想添加一些自定义属性，这时就可以使用声明合并来扩展原有类型，而无需修改原始库的代码。

### 3.1 扩展第三方库类型

假设一个第三方库定义了一个 `User` 接口，但你需要在其中添加一个自定义的 `sessionId` 属性。

```typescript
// types/third-party-library.d.ts (假设的第三方库类型定义)
declare namespace ThirdPartyLib {
  interface User {
    id: number;
    name: string;
  }
}

// 在你的项目文件中（例如：src/type-augmentations.d.ts）
// 使用 declare module 来进行模块增强
declare namespace ThirdPartyLib {
  interface User {
    sessionId: string; // 非侵入式地扩展 User 接口
  }
}

// 在你的业务代码中
const user: ThirdPartyLib.User = {
  id: 1,
  name: 'Alice',
  sessionId: 'abc123def456', // 现在可以合法地添加 sessionId 了
};
```

### 3.2 为 Window 对象添加属性

在浏览器环境中，我们经常需要给全局的 `window` 对象添加自定义属性。

```typescript
// global.d.ts
export {}; // 确保这是一个模块，避免将augmentation应用到全局

declare global {
  interface Window {
    __MY_APP_STATE__: any; // 扩展 Window 接口
  }
}

// 在你的业务代码中
window.__MY_APP_STATE__ = { key: 'value' }; // 现在不会报错了
```

## 4. 最佳实践与注意事项

1. **谨慎使用**：声明合并虽然强大，但过度使用会使代码逻辑分散，难以追踪和维护。应优先考虑继承或组合等标准模式，只有在扩展外部类型时才将声明合并作为“杀手锏”。

2. **顺序重要性**：合并的声明顺序会影响最终结果，尤其是在函数重载和接口合并中。务必确保重载的顺序是从最具体到最泛化。

3. **避免属性冲突**：始终注意合并的接口或命名空间中是否存在同名但类型不同的属性，这会导致编译错误。

4. **使用 JSDoc 增强可读性**：当进行模块增强时，使用 JSDoc 注释来说明添加的成员的目的，这对于团队协作至关重要。

   ```typescript
   declare namespace ThirdPartyLib {
     interface User {
       /**
        * A custom session identifier injected by our application.
        * Used for tracking user activity across requests.
        */
       sessionId: string;
     }
   }
   ```

5. **模块化增强**：将所有的类型增强放在一个专门的文件中（如 `types/augmentations.d.ts`），并在 `tsconfig.json` 中确保该文件被包含，这样可以集中管理所有扩展。

## 5. 总结

声明合并是 TypeScript 类型系统中一项强大而独特的特性。它主要服务于两个目的：

1. **设计阶段的API组织**：通过合并接口和命名空间，可以更有逻辑地组织复杂的类型结构。
2. **使用阶段的非侵入式扩展**：通过模块增强和命名空间合并，可以优雅地修补和扩展第三方库或运行环境（如 `window`）的类型定义，这是在现代 JavaScript 生态系统中高效、安全地使用 TypeScript 的关键技能。

掌握声明合并的原理和应用场景，将使你能够更加游刃有余地驾驭类型系统，构建出扩展性极强的 TypeScript 项目。

---

**本文参考来源**：

1. <https://www.typescriptlang.org/docs/handbook/declaration-merging.html>
2. <https://basarat.gitbook.io/typescript/type-system/declaration-merging>
3. <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules> (用于理解模块上下文)
4. Stack Overflow 社区关于声明合并的若干高质量讨论
5. 多个开源项目（如 Vue、Redux）中使用声明合并进行类型扩展的实际案例
