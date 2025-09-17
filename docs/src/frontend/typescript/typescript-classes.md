好的，请看下方为您生成的关于 TypeScript 类的完整技术文档。本文档融合了 TypeScript 官方手册、社区最佳实践以及现代 JavaScript 类特性的深入解析。

---

# TypeScript 类详解与最佳实践

## 目录

1. #引言
2. #类的基本概念
3. #类的成员
    1. #字段
    2. #构造函数
    3. #方法
    4. #存取器
4. #类的继承
    1. #extends-继承
    2. #super-调用
    3. #方法重写
5. #成员可见性
    1. #public
    2. #protected
    3. #private
    4. #ecmascript-private-fields
6. #静态成员
7. #抽象类
8. #类型检查-this-instanceof
9. #最佳实践
10. #总结

## 引言

在 JavaScript ES2015 中，类作为构建面向对象应用程序的基础被引入。TypeScript 在此基础上，通过添加丰富的类型系统和一系列面向对象特性，极大地增强了类的功能。这些特性帮助开发者构建更健壮、可维护的大型应用，并在**编译时**而非运行时捕获潜在错误。

本文档将深入探讨 TypeScript 类的方方面面，并提供经过社区验证的最佳实践。

## 类的基本概念

类是一个蓝图，用于创建具有相同属性和方法的对象。它定义了对象的结构和行为。

```typescript
class Greeter {
  // 成员字段
  greeting: string;

  // 构造函数
  constructor(message: string) {
    this.greeting = message;
  }

  // 成员方法
  greet(): string {
    return `Hello, ${this.greeting}!`;
  }
}

// 创建类的实例
const greeter = new Greeter('world');
console.log(greeter.greet()); // 输出: Hello, world!
```

## 类的成员

### 字段

字段是类上声明的公共可访问属性。在 TypeScript 中，我们通常需要显式声明其类型。

```typescript
class Point {
  // 声明实例属性 x 和 y
  x: number;
  y: number;
}
```

从 TypeScript 4.0 开始，你可以在构造函数中使用**参数属性**来快捷地声明和初始化成员，这是一种简洁的语法糖。

```typescript
class Point {
  // 使用参数属性，等同于在构造函数中执行 this.x = x; this.y = y;
  constructor(public x: number, public y: number) {}
}

const point = new Point(10, 20);
console.log(point.x); // 输出: 10
```

### 构造函数

类的构造函数在使用 `new` 关键字创建类的新实例时被调用。它用于初始化对象状态。

```typescript
class Employee {
  name: string;
  id: number;

  constructor(name: string, id: number) {
    this.name = name;
    this.id = id;
  }
}
```

### 方法

方法是定义在类上的函数，描述对象可以执行的行为。

```typescript
class Calculator {
  // 常规方法
  add(x: number, y: number): number {
    return x + y;
  }

  // 方法也可以使用箭头函数语法来绑定正确的 `this` 上下文
  // 这在将方法作为回调函数传递时特别有用
  multiply = (x: number, y: number): number => {
    return x * y;
  };
}

const calc = new Calculator();
console.log(calc.add(5, 3)); // 输出: 8
const multiplyFunc = calc.multiply;
console.log(multiplyFunc(4, 5)); // 输出: 20 (即使脱离 calc 上下文，this 依然正确)
```

### 存取器

TypeScript 支持使用 `get` 和 `set` 来拦截对对象成员的访问和赋值，这有助于实现更复杂的数据逻辑和验证。

```typescript
class Temperature {
  private _celsius: number = 0;

  // Getter 存取器
  get celsius(): number {
    return this._celsius;
  }

  // Setter 存取器
  set celsius(value: number) {
    if (value < -273.15) {
      throw new Error('Temperature cannot be below absolute zero!');
    }
    this._celsius = value;
  }

  // 另一个 Getter，计算华氏度
  get fahrenheit(): number {
    return this._celsius * (9 / 5) + 32;
  }
}

const temp = new Temperature();
temp.celsius = 25; // 调用 set celsius(25)
console.log(temp.fahrenheit); // 调用 get fahrenheit()，输出: 77
// temp.celsius = -300; // 会抛出错误
```

**注意**：如果只定义了 `get` 而没有定义 `set`，则该属性会被自动推断为 `readonly`。

## 类的继承

面向对象编程的核心之一是实现继承，允许子类复用父类的属性和方法。

### extends 继承

使用 `extends` 关键字创建一个类作为子类。

```typescript
class Animal {
  move(distance: number = 0): void {
    console.log(`Animal moved ${distance}m.`);
  }
}

class Dog extends Animal {
  bark(): void {
    console.log('Woof! Woof!');
  }
}

const dog = new Dog();
dog.move(10); // 继承自 Animal 的方法
dog.bark();   // Dog 类自己的方法
```

### super 调用

在子类中，可以使用 `super` 关键字来引用父类。

- 在构造函数中，必须在使用 `this` 之前调用 `super()`。
- 在方法中，`super.methodName()` 用于调用父类的方法。

```typescript
class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  move(distance: number): void {
    console.log(`${this.name} moved ${distance}m.`);
  }
}

class Snake extends Animal {
  constructor(name: string) {
    super(name); // 必须调用父类的构造函数
  }
  // 重写父类方法
  move(distance: number = 5): void {
    console.log('Slithering...');
    super.move(distance); // 调用父类的 move 方法
  }
}

const sam = new Snake('Sammy');
sam.move(); // 输出: Slithering... Sammy moved 5m.
```

### 方法重写

子类可以重写父类的方法以提供特定实现。为了确保类型安全，你可以使用 `override` 关键字（TypeScript 4.3+）。这有助于在父类方法名改变时，编译器能及时报错。

```typescript
class Base {
  greet(): void {
    console.log('Hello, world!');
  }
}

class Derived extends Base {
  // 使用 override 明确表示这是重写
  override greet(): void {
    console.log('Hello, TypeScript!');
  }
  // 如果错误地拼写了父类不存在的方法，TS 会报错
  // override grett() {} // Error: This member cannot have an 'override' modifier because it is not declared in the base class 'Base'.
}
```

## 成员可见性

你可以控制类成员在类的外部或子类中的可访问性。

### public

默认的可见性。公共成员可以在任何地方被访问。

```typescript
class Person {
  public name: string;
  public constructor(name: string) {
    this.name = name;
  }
}
```

### protected

受保护的成员只能在其所声明的类及其子类中访问。

```typescript
class Person {
  protected ssn: string;
  constructor(ssn: string) {
    this.ssn = ssn;
  }
}

class Employee extends Person {
  private department: string;

  constructor(ssn: string, department: string) {
    super(ssn);
    this.department = department;
  }

  public getSsn(): string {
    // 在子类中可以访问 protected 成员
    return this.ssn;
  }
}

const emp = new Employee('123-45-6789', 'Engineering');
// console.log(emp.ssn); // Error: Property 'ssn' is protected and only accessible within class 'Person' and its subclasses.
console.log(emp.getSsn()); // 可以通过公共方法访问
```

### private

私有成员只能在声明它的类中访问，即使是子类也无法访问。

```typescript
class BankAccount {
  private balance: number;

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }

  public deposit(amount: number): void {
    if (amount > 0) {
      this.balance += amount; // 只能在类内部访问
    }
  }
}

const account = new BankAccount(1000);
// account.balance = 1000000; // Error: Property 'balance' is private and only accessible within class 'BankAccount'.
```

### ECMAScript Private Fields

TypeScript 也支持 ES2022 的私有字段语法，使用 `#` 前缀。这是一种“硬性私有”，即使在编译后的 JavaScript 中也无法被外部访问，提供了更强的封装性。

```typescript
class Safe {
  // ECMAScript 私有字段
  #secret: string = 'secret code 123';

  getSecret(): string {
    // 只能在类内部访问 #secret
    return this.#secret;
  }
}

const safe = new Safe();
// console.log(safe.#secret); // 语法错误，在 TS 和 JS 中都不可访问
console.log(safe.getSecret()); // 输出: secret code 123
```

**最佳实践建议**：对于新项目，优先考虑使用 `#` 私有字段，因为它提供了运行时和编译时的双重保障。对于需要与子类共享但不对外公开的成员，使用 `protected`。

## 静态成员

静态成员存在于类本身而不是类的实例上。它们通常用于实用方法或常量。

```typescript
class MathHelper {
  // 静态属性
  static readonly PI: number = 3.14159;

  // 静态方法
  static calculateCircleArea(radius: number): number {
    return this.PI * radius * radius; // 使用 this 访问其他静态成员
    // 或 MathHelper.PI
  }
}

// 通过类名直接访问静态成员
console.log(MathHelper.PI); // 输出: 3.14159
console.log(MathHelper.calculateCircleArea(5)); // 输出: 78.53975

// const m = new MathHelper();
// m.PI; // Error: 实例无法访问静态成员
```

## 抽象类

抽象类作为其他类的基类，它们本身不能被实例化。抽象类中的抽象方法不包含实现，必须在派生类中实现。

```typescript
// 抽象类
abstract class Department {
  protected employees: string[] = [];

  constructor(protected readonly id: string, public name: string) {}

  // 抽象方法，必须在子类中实现
  abstract describe(this: Department): void;

  // 可以有具体实现的方法
  addEmployee(employee: string): void {
    this.employees.push(employee);
  }
}

// 具体子类
class ITDepartment extends Department {
  constructor(id: string, public admins: string[]) {
    super(id, 'IT');
  }

  // 实现抽象方法
  describe(): void {
    console.log(`IT Department - ID: ${this.id}`);
  }
}

// const dept = new Department('d1', 'Accounting'); // Error: 无法创建抽象类的实例
const itDept = new ITDepartment('d1', ['Max']);
itDept.describe(); // 输出: IT Department - ID: d1
```

## 类型检查：this, instanceof

### this 参数

在方法或函数中，TypeScript 可以推断 `this` 的类型。但有时我们需要明确指定。例如，确保方法在正确的上下文中被调用。

```typescript
class Car {
  model: string = 'Model S';

  // 使用 `this` 参数来注解方法期望的 `this` 类型
  drive(this: Car): void {
    console.log(`Driving a ${this.model}`);
  }
}

const car = new Car();
car.drive(); // 正确

const driveFunc = car.drive;
// driveFunc(); // Error: The 'this' context of type 'void' is not assignable to method's 'this' of type 'Car'.
```

### instanceof 操作符

`instanceof` 操作符用于检查一个对象是否是某个类的实例，它在运行时和编译时都起作用。

```typescript
class Bird {
  fly(): void {
    console.log('Flying...');
  }
}

class Fish {
  swim(): void {
    console.log('Swimming...');
  }
}

function move(animal: Bird | Fish): void {
  if (animal instanceof Bird) {
    animal.fly(); // 在这个分支，TS 知道 animal 是 Bird 类型
  } else {
    animal.swim(); // 在这个分支，TS 知道 animal 是 Fish 类型
  }
}

move(new Bird()); // 输出: Flying...
move(new Fish()); // 输出: Swimming...
```

## 最佳实践

1. **优先使用组合而非继承 (Composition over Inheritance)**：继承会带来紧耦合。优先考虑使用组合（将类作为其他类的属性）来复用代码，这通常更灵活。

    ```typescript
    // 不推荐的深层继承
    class A { ... }
    class B extends A { ... }
    class C extends B { ... } // 非常脆弱

    // 推荐：使用组合
    class Engine { start() { ... } }
    class Wheels { rotate() { ... } }

    class Car {
      private engine: Engine;
      private wheels: Wheels;
      constructor() {
        this.engine = new Engine();
        this.wheels = new Wheels();
      }
      drive() {
        this.engine.start();
        this.wheels.rotate();
      }
    }
    ```

2. **遵循单一职责原则 (Single Responsibility Principle)**：一个类应该只有一个引起变化的原因。如果一个类承担了太多职责，它就应该被拆分。

3. **明确使用 `public`、`private`、`protected`**：不要依赖默认的 `public` 可见性。明确指定成员的可见性可以提高代码的可读性和可维护性。对于真正的私有成员，考虑使用 `#` 私有字段。

4. **善用 `readonly` 修饰符**：将不应在初始化后改变的字段标记为 `readonly`，这可以防止意外修改并明确设计意图。

    ```typescript
    class Configuration {
      // 初始化后不可更改
      public readonly apiUrl: string;
      constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
      }
    }
    ```

5. **使用接口定义契约**：对于类之间的交互，优先考虑使用接口来定义契约，而不是依赖具体的类实现。这降低了耦合度。

    ```typescript
    // 定义一个接口
    interface Logger {
      log(message: string): void;
    }

    // 类实现接口
    class ConsoleLogger implements Logger {
      log(message: string): void {
        console.log(message);
      }
    }

    // 依赖注入，接收任何实现了 Logger 接口的对象
    class Service {
      constructor(private logger: Logger) {}
      doWork() {
        this.logger.log('Work done!');
      }
    }

    const service = new Service(new ConsoleLogger());
    service.doWork();
    ```

6. **谨慎使用继承**：只有在确实是“is-a”关系（例如，`Dog` *is a* `Animal`）且需要复用实现时，才使用继承。考虑使用抽象类来定义基础结构。

## 总结

TypeScript 的类系统在 JavaScript 类的基础上，通过类型注解、访问修饰符、抽象类等特性，提供了强大的工具来构建结构良好、类型安全且易于维护的面向对象代码。掌握这些概念并遵循最佳实践，将帮助你有效地构建中大型复杂应用程序。

始终记住，强大的类型系统旨在作为辅助工具，而不是束缚。设计的核心应始终是代码的清晰性、可维护性和简洁性。

---

**参考资料**：

1. <https://www.typescriptlang.org/docs/handbook/2/classes.html>
2. <https://basarat.gitbook.io/typescript/type-system/classes>
3. <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes>
4. <https://google.github.io/styleguide/tsguide.html#classes>
5. <https://stackoverflow.com/questions/tagged/typescript+classes>
