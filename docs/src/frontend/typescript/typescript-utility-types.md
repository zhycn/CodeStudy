好的，请看这篇关于 TypeScript Utility Types 的详细技术文档。本文在参考 TypeScript 官方文档、TypeScript Deep Dive、以及社区多篇高赞技术文章的基础上，结合最佳实践总结而成。

---

# TypeScript Utility Types 详解与最佳实践

Utility Types（工具类型）是 TypeScript 内置的一系列泛型工具，用于进行常见的类型转换操作。它们提供了强大的类型操作能力，让你能够在类型系统中以更简洁、更类型安全的方式表达复杂逻辑。

## 1. 核心工具类型详解

### 1.1 `Partial<Type>`

构造一个类型，将 `Type` 的所有属性设置为可选。

- **源码原理**： 使用 `in keyof` 映射类型和 `?` 修饰符。

  ```typescript
  type Partial<T> = {
    [P in keyof T]?: T[P];
  };
  ```

- **使用场景**： 适用于对象的更新、函数的参数补全、初始化一个配置对象等。
- **代码示例**：

  ```typescript
  interface User {
    id: number;
    name: string;
    email?: string;
  }

  // 更新用户信息时，可能只需要传递部分字段
  function updateUser(id: number, fieldsToUpdate: Partial<User>) {
    // ... 通过 id 找到用户并更新 fieldsToUpdate 中的字段
  }

  updateUser(1, { name: 'Alice' }); // ✅ 正确，只更新 name
  updateUser(1, { email: 'alice@example.com' }); // ✅ 正确，只更新 email
  updateUser(1, { phone: '123' }); // ❌ 错误：'phone' 不在 User 类型中
  ```

### 1.2 `Required<Type>`

构造一个类型，将 `Type` 的所有属性设置为必需，与 `Partial` 相反。

- **源码原理**： 使用 `-?` 映射修饰符来移除可选性。

  ```typescript
  type Required<T> = {
    [P in keyof T]-?: T[P];
  };
  ```

- **使用场景**： 当你有一个包含可选属性的类型，但在某个特定场景下要求所有属性都必须存在。
- **代码示例**：

  ```typescript
  interface UserForm {
    name?: string;
    email?: string;
  }

  // 提交表单时，要求所有字段都必须填写
  function submitForm(data: Required<UserForm>) {
    // ... 提交数据
  }

  submitForm({ name: 'Bob' }); // ❌ 错误：缺少属性 'email'
  submitForm({ name: 'Bob', email: 'bob@example.com' }); // ✅ 正确
  ```

### 1.3 `Readonly<Type>`

构造一个类型，将 `Type` 的所有属性设置为只读。

- **源码原理**： 使用 `readonly` 映射修饰符。

  ```typescript
  type Readonly<T> = {
    readonly [P in keyof T]: T[P];
  };
  ```

- **使用场景**： 用于创建不可变的对象，例如配置对象、常量、React 的 state 或 props（在类组件中）。
- **代码示例**：

  ```typescript
  interface Config {
    apiUrl: string;
    timeout: number;
  }

  const config: Readonly<Config> = {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
  };

  config.timeout = 10000; // ❌ 错误：无法分配到 "timeout" ，因为它是只读属性
  ```

### 1.4 `Record<Keys, Type>`

构造一个对象类型，其属性键为 `Keys`，属性值为 `Type`。

- **源码原理**： 使用 `in` 对联合类型 `K` 进行映射。

  ```typescript
  type Record<K extends keyof any, T> = {
    [P in K]: T;
  };
  ```

- **使用场景**： 用于创建具有动态键但值类型统一的对象，如字典、映射、枚举值的记录等。
- **代码示例**：

  ```typescript
  type Page = 'home' | 'about' | 'contact';

  // 为每个页面配置一个标题
  const pageTitles: Record<Page, string> = {
    home: 'Home Page',
    about: 'About Us',
    contact: 'Contact Us',
    // services: 'Our Services' // ❌ 错误：不允许额外的属性
  };

  // 创建一个值的类型为 User 的字典，键为 string 类型
  const usersById: Record<string, User> = {
    abc123: { id: 1, name: 'Alice' },
    def456: { id: 2, name: 'Bob' },
  };
  ```

  **最佳实践**： 优先使用 `Record` 而不是索引签名（`{ [key: string]: Type }`），因为它能更清晰地表达键的约束（例如 `Record<Page, string>` 比 `{ [key in Page]: string }` 更简洁）。

### 1.5 `Pick<Type, Keys>`

从 `Type` 中选择一组属性键 `Keys`（字符串字面量或联合类型）来构造新类型。

- **源码原理**： 使用 `extract` 从 `keyof T` 中提取 `K`。

  ```typescript
  type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };
  ```

- **使用场景**： 当你只需要一个大型类型中的一部分属性时。
- **代码示例**：

  ```typescript
  interface Article {
    title: string;
    content: string;
    author: string;
    publishedDate: Date;
    tags: string[];
  }

  // 创建一个只包含标题和作者的类型，用于文章预览
  type ArticlePreview = Pick<Article, 'title' | 'author'>;

  const preview: ArticlePreview = {
    title: 'TypeScript Tips',
    author: 'Alice',
    // content: '...' // ❌ 错误：不允许额外的属性
  };
  ```

### 1.6 `Omit<Type, Keys>`

从 `Type` 中移除一组属性键 `Keys`（字符串字面量或联合类型）来构造新类型。可以看作是 `Pick` 的反操作。

- **源码原理**： 使用 `Exclude` 从 `keyof T` 中排除 `K`，然后进行映射。

  ```typescript
  type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
  ```

- **使用场景**： 从一个类型中排除某些不需要的属性，通常用于继承后覆盖或移除敏感信息。
- **代码示例**：

  ```typescript
  interface User {
    id: number;
    name: string;
    email: string;
    password: string; // 敏感信息
  }

  // 创建一个用于显示的用户类型，排除密码等敏感字段
  type SafeUser = Omit<User, 'password' | 'email'>; // 可以同时移除多个字段

  const userDisplay: SafeUser = {
    id: 1,
    name: 'Alice',
    // password: 'secret' // ❌ 错误：不允许额外的属性
  };
  ```

### 1.7 `Exclude<UnionType, ExcludedMembers>`

从 `UnionType` 中排除可以赋值给 `ExcludedMembers` 的成员，构造一个新类型。

- **源码原理**： 使用条件类型进行分布式排除。

  ```typescript
  type Exclude<T, U> = T extends U ? never : T;
  ```

- **使用场景**： 处理联合类型，过滤掉不需要的成员。
- **代码示例**：

  ```typescript
  type T0 = Exclude<'a' | 'b' | 'c', 'a'>; // type T0 = "b" | "c"
  type T1 = Exclude<'a' | 'b' | 'c', 'a' | 'b'>; // type T1 = "c"
  type T2 = Exclude<string | number | (() => void), Function>; // type T2 = string | number

  // 实际应用：从事件类型中排除某些事件
  type EventTypes = 'click' | 'scroll' | 'mousemove' | 'keydown';
  type MouseEventTypes = Exclude<EventTypes, 'keydown'>; // "click" | "scroll" | "mousemove"
  ```

### 1.8 `Extract<Type, Union>`

从 `Type` 中提取所有可以赋值给 `Union` 的成员，构造一个新类型。与 `Exclude` 相反。

- **源码原理**： 使用条件类型进行分布式提取。

  ```typescript
  type Extract<T, U> = T extends U ? T : never;
  ```

- **使用场景**： 从联合类型中筛选出感兴趣的成员。
- **代码示例**：

  ```typescript
  type T0 = Extract<'a' | 'b' | 'c', 'a' | 'f'>; // type T0 = "a"
  type T1 = Extract<string | number | (() => void), Function>; // type T1 = () => void

  // 实际应用：只获取鼠标相关的事件
  type EventTypes = 'click' | 'scroll' | 'mousemove' | 'keydown';
  type MouseEventTypes = Extract<EventTypes, 'click' | 'scroll' | 'mousemove'>; // "click" | "scroll" | "mousemove"
  ```

### 1.9 `NonNullable<Type>`

从 `Type` 中排除 `null` 和 `undefined`，构造一个新类型。

- **源码原理**： 使用条件类型排除 `null` 和 `undefined`。

  ```typescript
  type NonNullable<T> = T extends null | undefined ? never : T;
  ```

- **使用场景**： 确保一个值不会是 `null` 或 `undefined`，常用于过滤数组或处理可能为空的返回值。
- **代码示例**：

  ```typescript
  type T0 = NonNullable<string | number | undefined>; // string | number
  type T1 = NonNullable<string[] | null | undefined>; // string[]

  // 实际应用：过滤数组中的空值
  function cleanArray<T>(array: T[]): NonNullable<T>[] {
    return array.filter((item): item is NonNullable<T> => item != null);
  }

  const dirtyArray = [1, undefined, 2, null, 3];
  const cleanArrayResult = cleanArray(dirtyArray); // const cleanArrayResult: number[]
  console.log(cleanArrayResult); // [1, 2, 3]
  ```

### 1.10 `Parameters<Type>`

根据函数类型 `Type` 的参数类型构造一个元组类型。

- **源码原理**： 使用 `infer` 关键字在条件类型中推断参数元组。

  ```typescript
  type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
  ```

- **使用场景**： 获取一个函数的参数类型，以便在其他地方复用。
- **代码示例**：

  ```typescript
  declare function f1(arg: { a: number; b: string }): void;

  type T0 = Parameters<() => string>; // type T0 = []
  type T1 = Parameters<(s: string) => void>; // type T1 = [s: string]
  type T2 = Parameters<<T>(arg: T) => T>; // type T2 = [arg: unknown]
  type T3 = Parameters<typeof f1>;
  // type T3 = [arg: { a: number; b: string; }]

  // 实际应用：包装函数，记录日志
  function logCall<F extends (...args: any[]) => any>(func: F): (...args: Parameters<F>) => ReturnType<F> {
    return (...args: Parameters<F>): ReturnType<F> => {
      console.log('Function called with arguments:', args);
      return func(...args);
    };
  }

  const loggedF1 = logCall(f1);
  loggedF1({ a: 1, b: 'hello' }); // 输出: Function called with arguments: [{ a: 1, b: 'hello' }]
  ```

### 1.11 `ReturnType<Type>`

根据函数类型 `Type` 的返回值类型构造一个新类型。

- **源码原理**： 使用 `infer` 关键字在条件类型中推断返回值类型。

  ```typescript
  type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;
  ```

- **使用场景**： 获取一个函数的返回类型，用于定义变量、其他函数的返回值或进行类型检查。
- **代码示例**：

  ```typescript
  declare function f1(): { a: number; b: string };

  type T0 = ReturnType<() => string>; // type T0 = string
  type T1 = ReturnType<(s: string) => void>; // type T1 = void
  type T2 = ReturnType<<T>() => T>; // type T2 = unknown
  type T3 = ReturnType<<T extends U, U extends number[]>() => T>; // type T3 = number[]
  type T4 = ReturnType<typeof f1>; // type T4 = { a: number; b: string; }

  // 实际应用：存储异步函数的结果
  async function fetchData(): Promise<{ userId: number; title: string }> {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    return response.json();
  }

  type FetchDataResult = ReturnType<typeof fetchData>; // Promise<{ userId: number; title: string }>
  type FetchDataResolved = Awaited<ReturnType<typeof fetchData>>; // { userId: number; title: string } (需要 TypeScript 4.5+)
  ```

## 2. 进阶工具类型

### 2.1 `Awaited<Type>` (TypeScript 4.5+)

模拟 `await` 操作在类型层面的行为，递归地展开 `Promise`，得到其 resolved 值的类型。

- **使用场景**： 获取一个 `Promise` 的最终解析值类型，特别是在嵌套 Promise 的情况下。
- **代码示例**：

  ```typescript
  type A = Awaited<Promise<string>>; // string
  type B = Awaited<Promise<Promise<number>>>; // number (递归展开)
  type C = Awaited<boolean | Promise<number>>; // boolean | number (分布条件类型)

  // 实际应用：获取异步函数解析后的返回值类型
  async function getUser() {
    return { name: 'Alice', age: 30 };
  }
  type UserReturn = ReturnType<typeof getUser>; // Promise<{ name: string; age: number; }>
  type User = Awaited<ReturnType<typeof getUser>>; // { name: string; age: number; }
  type UserSimpler = Awaited<ReturnType<typeof getUser>>; // 同上
  ```

### 2.2 模板字面量类型工具

TypeScript 4.1 引入了模板字面量类型，并随之带来了 `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize` 这些内置的工具类型，用于操作字符串字面量类型。

- **使用场景**： 生成一致的字符串字面量类型，例如自动生成大小写转换的 Action 类型。
- **代码示例**：

  ```typescript
  type Event = 'click' | 'doubleClick' | 'mouseDown';

  type T0 = Uppercase<Event>; // "CLICK" | "DOUBLECLICK" | "MOUSEDOWN"
  type T1 = Lowercase<T0>; // 回到 "click" | "doubleclick" | "mousedown"
  type T2 = Capitalize<Event>; // "Click" | "DoubleClick" | "MouseDown"
  type T3 = Uncapitalize<T2>; // 回到 "click" | "doubleClick" | "mouseDown"

  // 实际应用：生成 Redux Action 类型
  const actions = ['setUser', 'updateProfile'] as const;
  type ActionTypes = `${Uppercase<(typeof actions)[number]>}_ACTION`;
  // "SETUSER_ACTION" | "UPDATEPROFILE_ACTION"
  ```

## 3. 最佳实践与常见模式

1. **组合使用工具类型**： 工具类型可以像乐高积木一样组合，创造出更复杂的类型转换。

   ```typescript
   interface ComplexUser {
     id: number;
     personalInfo: {
       name: string;
       age: number;
       address?: string;
     };
     readonly createdAt: Date;
     password: string;
   }

   // 创建一个用于更新 personalInfo 的类型，排除只读和敏感字段
   type UpdatePersonalInfoInput = Partial<
     Pick<ComplexUser, 'personalInfo'> // 先选出 personalInfo
   >;
   // 等效于 { personalInfo?: { name?: string; age?: number; address?: string; } }

   // 或者，创建一个安全的、只读的用户视图类型
   type SafeUserView = Readonly<Omit<ComplexUser, 'password'>>;
   ```

2. **优先使用 `interface` 继承还是工具类型？**
   - 使用 `interface extends` 当类型关系是稳定的“是一个（is-a）”关系，并且你希望利用接口的合并声明（declaration merging）。

     ```typescript
     interface Animal {
       name: string;
     }
     interface Dog extends Animal {
       breed: string;
     }
     ```

   - 使用工具类型（如 `Pick`, `Omit`）当类型关系是临时的、“有一部分（has-a）”关系，或者你需要从一个无法修改的源类型（如第三方库的类型）中创建新类型。

     ```typescript
     type DogName = Pick<Dog, 'name'>; // 临时类型，仅需要名字
     ```

3. **为复用工具类型的结果命名**： 如果一个工具类型转换被多次使用，请为其定义一个类型别名，以提高代码可读性和可维护性。

   ```typescript
   // ❌ 不易读，且重复
   function processUser(user: Pick<User, 'id' | 'name'>) {}
   function displayUser(user: Pick<User, 'id' | 'name'>) {}

   // ✅ 清晰且易于更改
   type UserIdentifier = Pick<User, 'id' | 'name'>;
   function processUser(user: UserIdentifier) {}
   function displayUser(user: UserIdentifier) {}
   ```

4. **理解分布条件类型（Distributive Conditional Types）**： `Exclude`, `Extract`, `NonNullable` 等在处理联合类型时是“分布”执行的。这对于理解和预测它们的行为至关重要。

5. **谨慎使用 `any` 和 `as`**： 过度使用类型断言（`as`）或 `any` 会削弱工具类型带来的类型安全 benefits。尽量让类型推导自然发生。

## 4. 总结

TypeScript 的 Utility Types 是类型系统的强大补充，它们将常见的类型操作抽象为简洁、可复用的泛型。熟练掌握这些工具类型可以极大地减少重复的类型定义，提高代码的类型安全性和表达力，让你能够更精准地描述代码的意图。

建议在编写 TypeScript 代码时，经常思考：“这个类型能否通过内置工具类型组合而来？”，这将帮助你写出更优雅、更健壮的类型代码。
