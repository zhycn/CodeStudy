好的，请看这篇关于 TypeScript 接口与类型别名的详细技术文档。

---

# TypeScript 接口与类型别名详解与最佳实践

## 1. 核心概念

在 TypeScript 中，**接口（Interface）** 和 **类型别名（Type Alias）** 都是用来定义对象类型、函数类型或其他复杂类型的结构的主要工具。它们的主要目的是为你的数据形状提供契约，确保类型安全，并极大地提升开发体验（如智能提示、自动补全和错误检测）。

### 1.1 接口（Interface）

接口是一个命名结构，它纯粹用于描述对象的形状（Shape）、类的契约或函数的签名。它是一种声明性的约束。

```typescript
// 定义一个 Person 接口
interface Person {
  firstName: string;
  lastName: string;
  age?: number; // 可选属性
  readonly id: number; // 只读属性
  greet(): void; // 方法
}

// 使用接口
const user: Person = {
  firstName: "Angela",
  lastName: "Davis",
  id: 12345,
  greet() {
    console.log(`Hello, my name is ${this.firstName}`);
  },
};
```

### 1.2 类型别名（Type Alias）

类型别名，顾名思义，是给一个类型起一个新名字。它可以描述的对象形状与接口几乎完全一致，但其功能更广泛，可以用于定义联合类型、交叉类型、元组类型或原始类型的别名。

```typescript
// 定义一个 Person 类型别名
type Person = {
  firstName: string;
  lastName: string;
  age?: number;
  readonly id: number;
  greet(): void;
};

// 类型别名更强大的用法
type ID = number | string; // 联合类型
type Coordinates = [number, number]; // 元组类型
type Tree<T> = { value: T; left?: Tree<T>; right?: Tree<T> }; // 泛型与递归类型

const userId: ID = 101; // 可以是 number
const userId2: ID = "abc-xyz"; // 也可以是 string
const point: Coordinates = [10.5, 20.3];
```

## 2. 接口与类型别名的异同

### 2.1 相同点

1. **都可以描述对象或函数类型**：两者在定义对象结构时语法几乎可以互换。

    ```typescript
    interface Point {
      x: number;
      y: number;
    }
    type Point = {
      x: number;
      y: number;
    };

    interface SetPoint {
      (x: number, y: number): void;
    }
    type SetPoint = (x: number, y: number) => void;
    ```

2. **都支持扩展**：两者都可以通过扩展（继承）来创建更复杂的类型。
    * **接口** 使用 `extends` 关键字。

        ```typescript
        interface Animal {
          name: string;
        }
        interface Bear extends Animal {
          honey: boolean;
        }
        const bear: Bear = { name: "Winnie", honey: true };
        ```

    * **类型别名** 使用交叉类型 `&`。

        ```typescript
        type Animal = {
          name: string;
        };
        type Bear = Animal & {
          honey: boolean;
        };
        const bear: Bear = { name: "Winnie", honey: true };
        ```

3. **都支持实现**：类（Class）可以实现（`implements`）接口或类型别名（只要类型别名描述的是对象结构）。

    ```typescript
    interface IPerson {
      name: string;
      greet(): void;
    }
    type TPerson = {
      name: string;
      greet(): void;
    };

    class Employee implements IPerson, TPerson {
      name: string = "";
      greet() {
        console.log("Hello!");
      }
    }
    ```

### 2.2 不同点

| 特性 | 接口 (Interface) | 类型别名 (Type Alias) |
| :--- | :--- | :--- |
| **声明合并** | **支持**。定义同名接口会自动合并。 | **不支持**。同名类型别名会报错。 |
| **扩展方式** | 使用 `extends`（类式继承） | 使用交叉类型 `&`（集合论中的交集） |
| **描述能力** | 主要用于对象、函数和类的形状 | 功能更强大，可定义**联合类型**、**元组**、**原始类型别名**等 |
| **性能** | 在错误信息中显示为接口名 | 在错误信息中直接展开显示原始类型，可能更冗长 |

#### 关键差异详解

**1. 声明合并（Declaration Merging）**

这是接口最独特的特性。如果你定义了两个同名的接口，TypeScript 会自动将它们合并为一个接口。

```typescript
interface User {
  name: string;
}
interface User {
  age: number;
}
// 最终 User 接口为： { name: string; age: number; }
const user: User = { name: "Alice", age: 30 }; // Correct
```

这个特性非常有用，例如当你需要扩展第三方库或全局 Window 对象的类型时。

类型别名则不允许这样做。同一个作用域内同名的类型别名会导致冲突。

```typescript
type User = { name: string };
type User = { age: number }; // Error: Duplicate identifier 'User'
```

**2. 扩展时的差异**

接口扩展时，TS 可以更早地发现不兼容的扩展错误。

```typescript
interface Animal {
  name: string;
}
interface Bear extends Animal {
  name: number; // Error: Interface 'Bear' incorrectly extends interface 'Animal'. Types of property 'name' are incompatible.
}
```

使用交叉类型时，有时不会立即报错，只有在使用时（具体到某个冲突属性时）才会报错。

```typescript
type Animal = { name: string };
type Bear = Animal & { name: number }; // No immediate error
// 但当你使用它时，`name` 的类型会是 `never` (string & number)
const bear: Bear = { name: "Pooh" }; // Error: Type 'string' is not assignable to type 'never'.
```

**3. 描述能力**

类型别名可以很方便地定义联合类型，这是接口无法直接做到的。

```typescript
type Status = "success" | "error" | "pending"; // 字面量联合类型
type ID = number | string; // 联合类型

interface Something {
  status: Status; // 接口可以引用类型别名定义的联合类型
  id: ID;
}
```

## 3. 最佳实践

根据 TypeScript 官方推荐和社区共识，遵循以下最佳实践可以让你的代码更清晰、更可维护。

### 原则 1：优先使用接口（PREFER interfaces）

当你主要定义对象或类的形状时，**优先使用接口**。

* **理由**：
  * 接口的声明合并特性在需要扩展现有类型时非常强大（例如为 `window` 添加自定义属性）。
  * 错误信息更清晰（显示接口名而不是展开的结构）。
  * 它更符合面向对象编程的思维模式（`extends` 和 `implements`）。
* **适用场景**：
  * 定义库的公共 API。
  * 定义对象字面量。
  * 定义类需要实现的契约。

### 原则 2：必要之时使用类型别名（USE type for specific needs）

在接口无法满足需求时，使用类型别名。

* **理由**：类型别名更灵活。
* **适用场景**：
  * 定义**联合类型**：`type Result = Success | Failure`。
  * 定义**元组类型**：`type Data = [number, string?]`。
  * 定义**函数类型**：`type ClickHandler = (event: MouseEvent) => void`（如果你想给它一个名字）。
  * 需要利用**模板字面量类型**时：`type Env =`production`` ` `staging`` ` `development``。
  * 定义**映射类型**或复杂的工具类型。

### 原则 3：保持一致性（BE consistent）

在同一个项目中，对于同一种用途，应保持选择的一致性。

* 如果你的团队主要用接口来定义对象，那就坚持这样做。
* 如果已经在用类型别名定义某个对象，就不要在同一个项目中混用接口来定义同类型的对象。

### 原则 4：使用 `implements` 进行类校验

无论是接口还是类型别名，都可以被类实现。这是一个非常好的实践，可以确保你的类符合预期的契约。

```typescript
interface DatabaseModel {
  id: number;
  save(): boolean;
}

type UserData = {
  username: string;
  email: string;
};

class User implements DatabaseModel, UserData {
  id: number = 0;
  username: string = "";
  email: string = "";

  save() {
    // Logic to save user to DB
    return true;
  }
}
```

## 4. 综合示例

```typescript
// 1. 使用接口定义核心实体
interface Entity {
  readonly id: string;
  createdAt: Date;
}

// 2. 扩展接口
interface User extends Entity {
  username: string;
  email: string;
  // 方法
  getProfile(): UserProfile;
}

// 3. 使用类型别名定义复杂类型
type UserProfile = {
  displayName: string;
  avatarUrl?: string;
  preferences: ("dark-mode" | "notifications")[];
};

type ApiResponse<T> =
  | { status: "success"; data: T; timestamp: Date }
  | { status: "error"; code: number; message: string };

// 4. 类实现接口
class AdminUser implements User {
  readonly id: string;
  createdAt: Date;
  username: string;
  email: string;
  role: "super-admin" | "admin"; // 类可以有自己的额外属性

  constructor(username: string, email: string) {
    this.id = this.generateId();
    this.createdAt = new Date();
    this.username = username;
    this.email = email;
    this.role = "admin";
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getProfile(): UserProfile {
    return {
      displayName: this.username,
      preferences: ["dark-mode"],
    };
  }

  // 模拟一个 API 调用
  fetchUserData(): ApiResponse<{ data: string }> {
    // ... 获取数据逻辑
    return {
      status: "success",
      data: { data: "some_data" },
      timestamp: new Date(),
    };
  }
}

// 5. 使用
const admin = new AdminUser("admin_user", "admin@example.com");
const response = admin.fetchUserData();

if (response.status === "success") {
  console.log(response.data); // TypeScript 知道这里 data 存在
} else {
  console.error(response.message); // TypeScript 知道这里 message 存在
}
```

## 5. 常见问题解答（FAQ）

**Q: 我应该用 `type` 还是 `interface` 来定义函数类型？**

A: 两者都可以。社区更倾向于使用类型别名来定义独立的函数类型，因为它更简洁。

```typescript
// 更常见
type EventHandler = (event: Event) => void;

// 也可以
interface EventHandler {
  (event: Event): void;
}
```

**Q: 性能上有区别吗？**

A: 在大多数情况下，没有显著差异。类型别名在早期版本中可能因为展开显示而导致错误信息稍显冗长，但这不影响运行时性能。应优先考虑代码的可读性和可维护性，而不是微乎其微的性能差异。

**Q: 我可以在接口中扩展类型别名吗？反之亦然？**

A: 可以！它们是互相操作的。

```typescript
type Animal = { name: string };
interface Bear extends Animal { // Interface extends Type Alias
  honey: boolean;
}

interface Vehicle {
  wheels: number;
}
type Car = Vehicle & { // Type Alias intersects Interface
  brand: string;
};
```

## 总结

| 特性 | 接口 (Interface) | 类型别名 (Type Alias) |
| :--- | :--- | :--- |
| **核心思想** | 定义**契约（Contract）** | 为类型创建**别名（Alias）** |
| **最佳适用场景** | 对象形状、公共 API、OOP | 联合类型、元组、函数类型、复杂工具类型 |
| **扩展性** | `extends`（声明合并是独特优势） | `&`（交叉类型） |
| **灵活性** | 较低，专注于对象 | 极高，可描述任何类型 |

遵循 **“优先使用接口定义对象结构，必要之时使用类型别名”** 的原则，你将能写出更清晰、更健壮且易于扩展的 TypeScript 代码。

---

**参考资料：**

1. <https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#interfaces>
2. <https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases>
3. <https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces>
4. <https://stackoverflow.com/questions/37233735/typescript-interfaces-vs-types>
5. <https://medium.com/@martin_hotell/interface-vs-type-alias-in-typescript-2-7-2a8f1777af4c>
6. <https://github.com/microsoft/TypeScript/wiki/Performance#preferring-interfaces-over-intersections>
