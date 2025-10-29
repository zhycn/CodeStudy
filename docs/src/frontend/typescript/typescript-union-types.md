好的，请看这篇关于 TypeScript 联合类型的详尽指南。本文融合了官方文档、社区最佳实践以及大量实战经验，旨在为您提供一份清晰、全面且实用的教程。

---

# TypeScript 联合类型 (Union Types) 详解与最佳实践

联合类型是 TypeScript 中最重要的核心类型之一，它允许你定义一个值可以是多种类型中的一种。理解和熟练运用联合类型，是编写类型安全且灵活的 TypeScript 代码的关键。

## 1. 核心概念：什么是联合类型？

联合类型使用竖线 `|` 将多个类型连接起来，表示一个值可以是这些类型中的任意一种。

**语法：** `Type1 | Type2 | Type3 | ...`

### 基础示例

```typescript
// 变量可以是 string 或 number 类型
let identifier: string | number;
identifier = 123; // OK
identifier = 'ABC456'; // OK
identifier = true; // Error: Type 'boolean' is not assignable to type 'string | number'.

// 函数参数可以是 string 或 string 数组
function formatInput(input: string | string[]) {
  // ...
}
formatInput('hello');
formatInput(['hello', 'world']);
```

## 2. 类型收缩 (Narrowing)：处理联合类型的关键

仅仅定义一个联合类型的变量是不够的。为了安全地使用它（例如，调用特定类型的方法），你需要帮助 TypeScript 在代码流分析中“收缩”其类型到更具体的某一分支。这个过程称为**类型收缩**。

### 2.1. 使用 `typeof` 进行收缩

对于包含原始类型（`string`, `number`, `boolean`, `symbol`）的联合类型，`typeof` 是最直接的工具。

```typescript
function printId(id: string | number) {
  if (typeof id === 'string') {
    // 在这个分支内，TypeScript 知道 id 是 string 类型
    console.log(id.toUpperCase()); // OK
  } else {
    // 在这个分支内，TypeScript 知道 id 是 number 类型
    console.log(id.toFixed(2)); // OK
  }
}
```

### 2.2. 使用 `instanceof` 进行收缩

对于使用类构造函数创建的联合类型，`instanceof` 是理想的检查方式。

```typescript
class Company {
  announce() {
    console.log('We are hiring!');
  }
}
class User {
  greet() {
    console.log('Hello!');
  }
}

type Entity = Company | User;

function operate(entity: Entity) {
  if (entity instanceof User) {
    entity.greet(); // OK
  } else {
    entity.announce(); // OK
  }
}
```

### 2.3. 使用 `in` 运算符进行收缩

`in` 运算符通过检查对象上是否存在特定属性来区分类型，这在处理对象联合时非常有用。

```typescript
interface Swimmer {
  swim: () => void;
}
interface Runner {
  run: () => void;
}

function play(sportsman: Swimmer | Runner) {
  if ('swim' in sportsman) {
    sportsman.swim(); // OK，类型被收缩为 Swimmer
  } else {
    sportsman.run(); // OK，类型被收缩为 Runner
  }
}
```

### 2.4. 自定义类型守卫 (Custom Type Guards)

对于更复杂的检查，你可以定义一个返回类型谓词（`parameterName is Type`）的函数。

```typescript
interface Cat {
  meow: () => void;
  numLives: number;
}
interface Dog {
  bark: () => void;
  breed: string;
}

function isCat(animal: Cat | Dog): animal is Cat {
  // 检查 meow 方法存在并不足够严谨，但在此作为示例
  // 更严谨的做法是检查 (animal as Cat).numLives !== undefined
  return (animal as Cat).meow !== undefined;
}

function greetPet(pet: Cat | Dog) {
  if (isCat(pet)) {
    console.log(`Hello cat with ${pet.numLives} lives!`); // OK，pet 是 Cat
    pet.meow();
  } else {
    console.log(`Hello ${pet.breed} dog!`); // OK，pet 是 Dog
    pet.bark();
  }
}
```

## 3. 可区分联合 (Discriminated Unions)

这是处理对象联合类型的**最佳实践模式**，也被称为“标签联合”或“代数数据类型”。它通过一个共同的、字面量的“判别属性”来明确区分联合中的不同成员。

```typescript
// 每个接口都有一个共同的属性 kind，但拥有不同的字面量类型值
interface SuccessResponse {
  kind: 'success'; // 字面量类型，是判别属性
  data: string;
  statusCode: number;
}
interface ErrorResponse {
  kind: 'error'; // 字面量类型，是判别属性
  message: string;
  statusCode: number;
}
interface PendingResponse {
  kind: 'pending'; // 字面量类型，是判别属性
  requestId: string;
}

// 定义联合类型
type ApiResponse = SuccessResponse | ErrorResponse | PendingResponse;

// 处理函数可以利用判别属性进行完美的类型收缩
function handleResponse(response: ApiResponse) {
  switch (response.kind) {
    case 'success':
      // TypeScript 知道 response 是 SuccessResponse
      console.log(`Data: ${response.data}`);
      break;
    case 'error':
      // TypeScript 知道 response 是 ErrorResponse
      console.error(`Error: ${response.message}`);
      break;
    case 'pending':
      // TypeScript 知道 response 是 PendingResponse
      console.log(`Request ID: ${response.requestId}`);
      break;
    default:
      // 这是一个好的实践，确保处理了所有情况
      // 如果将来添加了新的联合成员，TypeScript 会在这里报错
      const _exhaustiveCheck: never = response;
      return _exhaustiveCheck;
  }
}
```

**优势：**

- **极佳的类型安全性**：TypeScript 可以基于判别属性进行彻底且无错误的类型收缩。
- **可扩展性**：添加新的联合成员时，`switch` 语句中的 `default` 分支（配合 `never` 类型）会提示你需要处理新的情况。
- **代码清晰**：数据结构与处理逻辑之间的关系一目了然。

## 4. 联合类型常见用例与最佳实践

### 4.1. 处理可能为 `null` 或 `undefined` 的值

这是联合类型最常见的用途之一。

```typescript
function getLength(s: string | null): number {
  // 使用条件判断进行收缩
  if (s === null) {
    return 0;
  }
  // 此时 s 被收缩为 string
  return s.length;
}

// 或者使用短路运算符
function getLengthSafe(s: string | null): number {
  return s?.length ?? 0;
}
```

### 4.2. 函数返回值：成功与失败状态

结合可区分联合，可以清晰地表达函数可能的不同结果。

```typescript
type Result<T, E = string> = { kind: 'ok'; value: T } | { kind: 'err'; error: E };

function safeParseNumber(str: string): Result<number> {
  const num = parseFloat(str);
  if (isNaN(num)) {
    return { kind: 'err', error: `'${str}' is not a number` };
  }
  return { kind: 'ok', value: num };
}

const result = safeParseNumber('42');
if (result.kind === 'ok') {
  console.log(result.value * 2); // 84
} else {
  console.error(result.error);
}
```

### 4.3. 配置选项或组件属性

联合类型非常适合定义一组明确的、可选的值。

```typescript
type ButtonSize = 'small' | 'medium' | 'large';
type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
  size?: ButtonSize; // 只能是这三个字符串之一
  variant?: ButtonVariant; // 只能是这三个字符串之一
  onClick: () => void;
  children: React.ReactNode;
}

// 使用时会获得自动补全和类型检查
const myButtonProps: ButtonProps = {
  size: 'medium',
  variant: 'primary', // 拼写错误如 'primery' 会被 TypeScript 捕获
  onClick: () => console.log('Clicked'),
  children: 'Click Me',
};
```

## 5. 常见陷阱与注意事项

1. **在收缩前访问公共成员**：只能安全地访问联合类型中所有成员都存在的公共属性或方法。

   ```typescript
   interface Bird {
     fly: () => void;
     layEgg: () => void;
   }
   interface Fish {
     swim: () => void;
     layEgg: () => void;
   }

   function getAnimal(): Bird | Fish {
     // ... 返回 Bird 或 Fish
   }

   const animal = getAnimal();
   animal.layEgg(); // OK，因为 Bird 和 Fish 都有 layEgg
   animal.fly(); // Error: Property 'fly' does not exist on type 'Bird | Fish'.
   ```

2. **过度使用 `any` 或类型断言**：不要因为觉得类型收缩麻烦就使用 `as any` 或 `as SomeType`。这破坏了 TypeScript 的类型安全性。应优先使用上述的类型收缩技术。

3. **确保收缩逻辑的完备性**：在使用 `switch` 处理可区分联合时，务必包含 `default` 分支并检查 `never` 类型，以确保未来添加新类型时能得到编译错误提醒。

## 总结

| 场景                       | 推荐技术           | 示例                                         |
| :------------------------- | :----------------- | :------------------------------------------- |
| **原始类型联合**           | `typeof`           | `if (typeof val === 'string')`               |
| **类实例联合**             | `instanceof`       | `if (obj instanceof MyClass)`                |
| **对象联合（有唯一属性）** | `in` 运算符        | `if ('key' in obj)`                          |
| **复杂对象联合**           | **可区分联合**     | `if (obj.kind === 'success')`                |
| **复杂自定义逻辑**         | **自定义类型守卫** | `function isCat(animal): animal is Cat`      |
| **定义一组选项**           | **字面量类型联合** | `type Size = 'small' \| 'medium' \| 'large'` |

联合类型是 TypeScript 强大类型系统的基石。通过掌握类型收缩技术和拥抱**可区分联合**这一最佳实践，你可以极大地提高代码的健壮性、可读性和可维护性，让 TypeScript 真正成为你开发过程中的得力助手。
