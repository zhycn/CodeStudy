好的，请看这篇关于 TypeScript 装饰器的详细技术文档。

---

# TypeScript 装饰器详解与最佳实践

> 本文将深入探讨 TypeScript 装饰器，涵盖其概念、各种类型、实现原理、最佳实践及应用场景，并提供丰富的可运行示例。内容综合参考了 TypeScript 官方文档、ECMAScript 提案以及社区广泛认可的最佳方案。

## 1. 装饰器简介

### 1.1 什么是装饰器？

装饰器（Decorator）是一种特殊类型的声明，它能够被附加到**类声明**、**方法**、**访问器**、**属性**或**参数**上。装饰器使用 `@expression` 这种形式，其中 `expression` 是一个函数，它会在运行时被调用，并以装饰目标的信息作为参数。

本质上，装饰器是一种在不修改原类代码的情况下，通过添加标注（注解）来扩展类及其成员功能的语法糖，为实现**面向切面编程（AOP）** 和**元编程**提供了强大的支持。

### 1.2 装饰器的发展阶段

装饰器功能经历了多个发展阶段：

1. **TypeScript 实验性装饰器（旧版）**：TypeScript 很早就支持了装饰器，但其语法和行为基于一个较早的 ECMAScript 提案。
2. **ECMAScript 标准装饰器（新版）**：目前，装饰器已成为 ECMAScript 的 <https://github.com/tc39/proposal-decorators，语法和语义与旧版有较大不同。TypeScript> 5.0 起开始支持这项新标准。

**本文主要聚焦于新的标准装饰器语法**，这是未来的发展方向，并会在必要时指出与旧版的区别。

## 2. 环境配置

要使用新版装饰器，你需要确保你的环境满足以下要求：

- **TypeScript**：版本 >= 5.0
- **`tsconfig.json`** 配置：

```json
{
  "compilerOptions": {
    "target": "ES2022", // 或更高版本
    "experimentalDecorators": false, // 明确禁用旧版装饰器
    "emitDecoratorMetadata": false, // 不再需要
    "useDefineForClassFields": true // 建议启用
  }
}
```

## 3. 装饰器类型详解

### 3.1 类装饰器（Class Decorators）

类装饰器在类声明之前被声明，它应用于类的**构造函数**，可用于观察、修改或替换类定义。

**签名**：

```typescript
type ClassDecorator = (
  value: Function,
  context: {
    kind: 'class';
    name: string | undefined;
    addInitializer(initializer: () => void): void;
  }
) => Function | void;
```

**示例：添加元数据**

```typescript
// 一个简单的类装饰器，用于标记该类为可注入的
function Injectable(value: string) {
  return function (target: Function, context: ClassDecoratorContext) {
    // 为类添加元数据
    Reflect.defineMetadata('scope', value, target);
    console.log(`Class ${target.name} is decorated with scope: ${value}`);
  };
}

@Injectable('singleton')
class MyService {
  doSomething() {
    console.log('Work done!');
  }
}

// 测试
const service = new MyService();
service.doSomething(); // 输出: Work done!
// (假设有相应的元数据读取机制)
console.log(Reflect.getMetadata('scope', MyService)); // 输出: singleton
```

**示例：替换类定义**

```typescript
// 一个装饰器，它将所有方法包装在 try-catch 中
function withErrorHandling<T extends new (...args: any[]) => object>(Class: T, context: ClassDecoratorContext) {
  return class extends Class {
    constructor(...args: any[]) {
      super(...args);
    }
    // 注意：这里只是概念演示，新版装饰器下动态包装所有方法更复杂
    // 通常建议使用方法装饰器针对每个方法进行处理
  };
}

@withErrorHandling
class MyController {
  getData() {
    // 可能抛出错误
    return 'Sensitive data';
  }
}
```

### 3.2 方法装饰器（Method Decorators）

方法装饰器声明在一个方法的声明之前，它应用于方法的**属性描述符**，可用于观察、修改或替换方法定义。这是最常用的装饰器类型。

**签名**：

```typescript
type MethodDecorator = (
  value: Function,
  context: {
    kind: 'method';
    name: string | symbol;
    access: { get(): unknown };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
  }
) => Function | void;
```

**示例：测量执行时间**

```typescript
function logExecutionTime<This, Args extends any[], Return>(
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  function replacementMethod(this: This, ...args: Args): Return {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const end = performance.now();
    console.log(`'${methodName}' executed in ${(end - start).toFixed(2)} milliseconds.`);
    return result;
  }

  return replacementMethod;
}

class DataProcessor {
  @logExecutionTime
  processData(data: string[]) {
    // 模拟耗时操作
    for (let i = 0; i < 10_000_000; i++) {}
    return data.map((item) => item.toUpperCase());
  }
}

// 测试
const processor = new DataProcessor();
const result = processor.processData(['a', 'b', 'c']);
console.log(result); // 输出: ['A', 'B', 'C'] 和执行时间信息
```

**示例：自动绑定 `this`**

```typescript
function autoBind<This, Args extends any[], Return>(
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = context.name;

  if (context.private) {
    throw new Error(`Cannot bind private method '${String(methodName)}'`);
  }

  context.addInitializer(function (this: This) {
    // `this` 指向实例
    this[methodName] = this[methodName].bind(this);
  });
}

class ButtonComponent {
  constructor(public label: string) {}

  @autoBind
  onClick() {
    console.log(`Button ${this.label} clicked!`);
  }
}

// 测试
const button = new ButtonComponent('Submit');
const clickHandler = button.onClick;
clickHandler(); // 正确输出: Button Submit clicked! (如果没有 @autoBind，this 会是 undefined)
```

### 3.3 访问器装饰器（Accessor Decorators）

访问器装饰器声明在一个访问器的声明之前，应用于访问器的**属性描述符**，可用于观察、修改或替换访问器的定义。

**签名**：与方法装饰器类似。

**示例：将访问器转换为 `enumerable: false`**

```typescript
function configurable<T>(value: boolean) {
  return function <This, Return>(target: (this: This) => Return, context: ClassAccessorDecoratorContext<This, Return>) {
    // 注意：新版标准下，直接修改描述符更复杂
    // 通常返回一个新的 setter/getter
    context.addInitializer(function () {
      // 可以在初始化时做一些事情
    });
    // 这里直接返回原方法，实际应用中可以替换
    // 更复杂的逻辑可能需要返回新的 get/set 函数
  };
}

class Person {
  private _name: string;

  constructor(name: string) {
    this._name = name;
  }

  @configurable(false)
  get name() {
    return this._name;
  }
}
```

### 3.4 属性装饰器（Property Decorators）

属性装饰器声明在一个属性声明之前。它**不能**用于替换属性定义，而是主要用于为属性添加元数据或定义在初始化时执行的逻辑。

**签名**：

```typescript
type PropertyDecorator = (
  value: undefined,
  context: {
    kind: 'field';
    name: string | symbol;
    access: { get(): unknown; set(value: unknown): void };
    static: boolean;
    private: boolean;
  }
) => void;
```

**示例：依赖注入（简单版）**

```typescript
import 'reflect-metadata'; // 需要安装 reflect-metadata

function Inject(token: string) {
  return function (target: undefined, context: ClassFieldDecoratorContext) {
    // 存储元数据，表明这个属性需要注入什么
    Reflect.defineMetadata('design:inject', token, target, context.name);
    // 可以添加初始化逻辑，但无法直接修改属性值
    context.addInitializer(function (this: any) {
      // 这个回调在实例创建时、字段赋值前运行
      // 复杂的 DI 容器会在这里或之后通过容器来解析并赋值
      console.log(`Property ${String(context.name)} of instance is being initialized, requires: ${token}`);
    });
  };
}

class MyController {
  @Inject('MyService')
  private myService!: MyService; // 假设 MyService 已定义

  doWork() {
    this.myService.doSomething();
  }
}
```

**示例：格式化和验证（常与 `access` 结合）**

```typescript
function format(pattern: RegExp) {
  return function (value: undefined, context: ClassFieldDecoratorContext) {
    // 返回一个替换的 setter 函数来拦截赋值操作
    return function (this: any, initialValue: string) {
      if (!pattern.test(initialValue)) {
        throw new Error(`Value for field ${String(context.name)} does not match pattern ${pattern}`);
      }
      return initialValue;
    };
  };
}

class User {
  @format(/^[A-Za-z]+$/)
  name: string;

  constructor(name: string) {
    this.name = name; // 赋值时会触发 format 的验证逻辑
  }
}

// 测试
try {
  const user1 = new User('Alice'); // OK
  console.log(user1.name);
  const user2 = new User('Alice123'); // Error: Value for field name does not match pattern /^[A-Za-z]+$/
} catch (error) {
  console.error(error.message);
}
```

### 3.5 参数装饰器（Parameter Decorators）

参数装饰器声明在一个参数声明之前。它**不能**直接改变参数的行为，主要用于为被装饰的参数添加元数据，供其他装饰器（如方法装饰器或类装饰器）使用。

**签名**：

```typescript
type ParameterDecorator = (
  value: undefined,
  context: {
    kind: 'parameter';
    name: string | symbol;
    index: number;
    static: boolean;
    private: boolean;
  }
) => void;
```

**示例：标记必需参数（常用于 Web 框架）**

```typescript
import 'reflect-metadata';

function Body(paramName?: string) {
  return function (target: any, context: ClassMethodDecoratorContext, parameterIndex: number) {
    // 获取现有元数据或初始化
    const existingBodyParameters: { [key: number]: string } =
      Reflect.getMetadata('body_parameters', target, context.name) || {};
    // 存储参数索引和对应的名称
    existingBodyParameters[parameterIndex] = paramName || `arg${parameterIndex}`;
    // 定义元数据
    Reflect.defineMetadata('body_parameters', existingBodyParameters, target, context.name);
  };
}

class UserController {
  createUser(@Body() userData: any, @Body('id') userId: string) {
    // 在某个路由处理层，会通过元数据知道：
    // 第一个参数 (index 0) 对应整个 body
    // 第二个参数 (index 1) 对应 body.id
    console.log(userData, userId);
  }
}

// ... 在框架内部，可能会有一个方法装饰器来读取这些元数据并处理请求体
```

### 3.6 `addInitializer` 详解

`context.addInitializer(initializer)` 是新版装饰器上下文对象中一个非常重要的方法。它允许你注册一个回调函数，该函数会在**字段被初始化时**（对于实例字段和方法是实例创建时，对于静态字段和方法是类本身被定义时）运行。

这在需要访问最终实例（或类本身）来执行设置逻辑时非常有用，例如上面的 `autoBind` 例子。

## 4. 装饰器组合与执行顺序

多个装饰器可以应用到一个声明上，它们会按照一定的顺序执行。

```typescript
@DecoratorA()
@DecoratorB()
class MyClass {
  @DecoratorC()
  @DecoratorD()
  myMethod() {}
}
```

**执行顺序**：

1. **求值（Evaluation）**：计算每个装饰器的表达式。顺序是**从上到下**。
   - `DecoratorA` -> `DecoratorB` -> `DecoratorC` -> `DecoratorD`
2. **应用（Application）**：调用装饰器函数。顺序是**从下到上**（从内到外）。
   - 对于类：`DecoratorB` -> `DecoratorA`
   - 对于方法：`DecoratorD` -> `DecoratorC`

**不同类型装饰器的组合顺序**（应用于同一个类时）：

1. 参数装饰器（对于每个参数）
2. 方法 / 访问器 / 属性装饰器
3. 类装饰器

## 5. 最佳实践与常见场景

### 5.1 最佳实践

1. **保持无副作用**：装饰器应专注于修饰目标，避免引入全局状态或意想不到的副作用。
2. **提供清晰的元数据**：如果使用装饰器添加元数据，请确保键名唯一且含义明确。
3. **谨慎替换定义**：完全替换类或方法定义是一种强大的能力，但会增加复杂性和调试难度，应谨慎使用。
4. **提供类型安全**：尽可能为装饰器工厂函数和装饰器本身编写清晰的类型声明，以利用 TypeScript 的类型系统。
5. **使用新标准**：对于新项目，优先使用新的标准装饰器语法。
6. **文档化**：为自定义装饰器编写详细的文档，说明其用途、参数和行为。

### 5.2 常见应用场景

- **日志记录与性能监控**：`@log`， `@measure`
- **错误处理**：`@catchError('Something went wrong')`
- **依赖注入**：`@Inject(MyService)`
- **路由定义（Web 框架）**：`@Get('/users')`， `@Controller('/api')`
- **权限控制**：`@RequireRole('admin')`
- **表单验证**：`@Required()`， `@MaxLength(100)`
- **自动事件绑定**：`@autobind`
- **缓存**：`@Cacheable('user_{id}')`
- **重试逻辑**：`@Retry(3)`

## 6. 常见问题与陷阱（FAQ）

**Q1：新版装饰器和旧版装饰器有什么区别？**
A：主要区别在于：

- 语法和 API 完全不同（`context` 对象 vs. 多个参数）。
- 新标准更强调元编程能力和与类字段定义的语义对齐。
- 新标准不再依赖 `emitDecoratorMetadata`。

**Q2：装饰器可以用于函数吗？**
A：**不行**。装饰器只能用于类及其成员（方法、属性等）。这是有意为之的设计决策。

**Q3：如何为装饰器编写类型？**
A：使用泛型和装饰器类型工具（如 `ClassDecoratorContext`, `ClassMethodDecoratorContext`）。

```typescript
function MyDecorator<This extends object>(target: undefined, context: ClassFieldDecoratorContext<This, string>) {
  // ...
}
```

**Q4：装饰器会在运行时影响性能吗？**
A：装饰器本身在**类定义时**执行一次，其性能开销通常可以忽略不计。但装饰器*内部实现的功能*（如包装函数、添加代理）可能会引入运行时开销，需根据具体实现评估。

## 7. 总结

TypeScript 装饰器是一项极其强大的功能，它通过声明式和可组合的方式极大地增强了代码的表达能力和模块化程度。从 AOP 到元数据管理，再到框架开发，其应用场景非常广泛。

掌握新版标准装饰器，理解其执行模型和每种类型装饰器的能力，将帮助你编写出更清晰、更健壮、更易于维护的 TypeScript 代码。在实践中，应从简单的场景（如日志、绑定）开始，逐步探索更复杂的应用模式。
