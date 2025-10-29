好的，请查阅这篇为您精心编写的 Vue 3 组合式 API 详解与最佳实践技术文档。本文在深入分析 Vue 官方文档、RFC 及社区大量优质实践文章的基础上，结合现代前端开发模式总结而成。

---

# Vue 3 组合式 API 详解与最佳实践

## 1. 引言

Vue 3 最重要的特性之一就是**组合式 API (Composition API)**。它是一套基于函数的 API，允许您以更灵活的方式组织和复用组件逻辑，解决了大型项目中与**选项式 API (Options API)** 相关的某些局限性。

### 1.1 为什么需要组合式 API？

在 Vue 2 中，我们使用 `data`, `methods`, `computed`, `watch` 等选项来组织代码。这种方式在组件简单时非常直观，但当组件变得复杂时，尤其是需要处理复用逻辑时，会遇到一些挑战：

- **碎片化**：相关联的逻辑被拆分到不同的选项中，导致代码难以阅读和维护。例如，一个功能可能同时用到 `data`, `methods`, 和 `watch`，您需要在文件内不断跳转来理解整个功能。
- **逻辑复用限制**：虽然可以通过 `mixins`、高阶组件等方式复用逻辑，但它们容易导致命名冲突、数据来源不清晰等问题。

组合式 API 通过将**与特定功能相关的所有代码（状态、计算属性、方法、侦听器等）聚合在一起**来解决这些问题，极大地提高了代码的可读性和可维护性。

## 2. 核心概念与 API

### 2.1 `setup()` 函数

`setup()` 是组合式 API 的入口点。它在组件实例创建之前、`props` 被解析之后执行。

- **参数**：
  - `props`: 组件接收的 props 对象，是响应式的。
  - `context`: 一个普通 JavaScript 对象，暴露了三个组件的 property（非响应式）。
    - `attrs`: 透传 Attributes（非响应式对象）。
    - `slots`: 插槽（非响应式对象）。
    - `emit`: 触发事件的方法。

- **返回值**：必须返回一个对象，该对象中暴露的属性和方法可以在模板中使用。

```javascript
import { ref } from 'vue';

export default {
  props: {
    title: String,
  },
  setup(props, context) {
    // 访问 props
    console.log(props.title);

    // 访问上下文中的属性或方法
    console.log(context.attrs);
    console.log(context.slots);
    context.emit('some-event');

    // 定义响应式数据
    const count = ref(0);

    // 返回模板可用的内容
    return {
      count,
    };
  },
};
```

### 2.2 响应式基础：`ref()` 与 `reactive()`

#### `ref()`

接受一个内部值，返回一个响应式的、可更改的 ref 对象。该对象只有一个 `.value` property，指向内部值。

**最佳实践**：

- 主要用于定义**基本类型**（如 `string`, `number`, `boolean`）的响应式数据。
- 在模板中使用时，Vue 会自动“解包”，无需通过 `.value` 访问。
- 在 JavaScript 中，**必须**通过 `.value` 来访问或修改其值。

```vue
<template>
  <div>
    <p>{{ count }}</p>
    <!-- 模板中无需 .value -->
    <button @click="increment">Increment</button>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    // 定义响应式数据
    const count = ref(0);

    // 定义方法
    function increment() {
      count.value++; // JS 中必须通过 .value 访问
    }

    // 暴露给模板
    return {
      count,
      increment,
    };
  },
};
</script>
```

#### `reactive()`

返回一个对象的响应式代理。响应式转换是“深层”的，会影响所有嵌套 property。

**最佳实践**：

- 主要用于定义**对象或数组**等引用类型的响应式数据。
- 直接访问和修改属性即可，无需 `.value`。
- 使用 `reactive()` 定义的对象，如果将其解构或展开，会失去响应性。需要使用 `toRefs()` 来保持响应性。

```vue
<template>
  <div>
    <p>{{ state.user.name }}</p>
    <p>{{ state.user.age }}</p>
    <button @click="state.user.age++">Grow</button>
  </div>
</template>

<script>
import { reactive } from 'vue';

export default {
  setup() {
    // 定义响应式对象
    const state = reactive({
      user: {
        name: 'Alice',
        age: 30,
      },
    });

    // 直接修改属性
    // state.user.age = 31;

    return {
      state, // 返回整个对象
    };
  },
};
</script>
```

### 2.3 响应式工具函数

#### `toRef()` 与 `toRefs()`

这是保持响应式对象属性响应性的关键工具。

- `toRef()`: 基于响应式对象上的一个 property，创建一个对应的 ref。
- `toRefs()`: 将一个响应式对象转换为一个普通对象，这个普通对象的每个 property 都是指向源对象相应 property 的 ref。

**最佳实践**：

- 在从 `reactive()` 创建的对象中解构出 property，或者在组合式函数中返回响应式对象时，使用 `toRefs()` 以确保消费方可以解构/扩展而不会失去响应性。

```javascript
import { reactive, toRefs } from 'vue';

export default {
  setup() {
    const state = reactive({
      name: 'Vue',
      version: 3,
    });

    // 在返回时使用 toRefs，使模板可以解构
    return {
      ...toRefs(state),
    };
  },
};
```

在模板中即可直接使用 `{{ name }}` 和 `{{ version }}`。

### 2.4 计算属性与侦听器

#### `computed()`

接受一个 getter 函数，并根据 getter 的返回值返回一个**不可变的**响应式 ref 对象。也可以接受一个带有 `get` 和 `set` 函数的对象来创建可写的 ref 对象。

```javascript
import { ref, computed } from 'vue';

export default {
  setup() {
    const firstName = ref('John');
    const lastName = ref('Doe');

    // 只读计算属性
    const fullName = computed(() => `${firstName.value} ${lastName.value}`);

    // 可写计算属性
    const writableFullName = computed({
      get: () => `${firstName.value} ${lastName.value}`,
      set: (newValue) => {
        [firstName.value, lastName.value] = newValue.split(' ');
      },
    });

    return {
      fullName,
      writableFullName,
    };
  },
};
```

#### `watch()` 与 `watchEffect()`

- `watch()`: 侦听一个或多个响应式数据源，并在数据源变化时调用所给的回调函数。它更明确地指明了侦听源和回调的依赖关系，可以获取变化前后的值。
- `watchEffect()`: 立即执行传入的函数，并**自动追踪其依赖**，并在其依赖变更时重新运行该函数。它更简洁，但无法获取变化前的值。

**最佳实践**：

- 当需要明确知道是哪个状态变化触发侦听器，或者需要获取变化前的值时，使用 `watch()`。
- 当不关心具体是哪个依赖变化，只想在多个依赖发生变化后执行一些“副作用”（如请求API）时，使用 `watchEffect()` 更合适。

```javascript
import { ref, watch, watchEffect, onCleanup } from 'vue';

export default {
  setup() {
    const searchQuery = ref('');
    const results = ref(null);

    // 使用 watch，明确侦听 searchQuery
    watch(
      searchQuery,
      async (newQuery, oldQuery) => {
        if (newQuery.trim() === '') {
          results.value = null;
          return;
        }
        results.value = await fetchResults(newQuery);
      },
      { immediate: true }
    ); // 立即执行一次

    // 使用 watchEffect，自动追踪 searchQuery 和 results
    watchEffect((onCleanup) => {
      // 这个效果依赖于 searchQuery.value 和 results.value
      if (results.value) {
        console.log(`New results for: ${searchQuery.value}`);
      }

      // 清理副作用：例如取消未完成的请求
      onCleanup(() => {
        cancelRequest();
      });
    });

    return {
      searchQuery,
      results,
    };
  },
};
```

## 3. 生命周期钩子

组合式 API 提供了与选项式 API 等效的生命周期钩子，但名称前加了 `on`（如 `onMounted`）。它们接受一个回调函数，当钩子被组件调用时执行。

| 选项式 API Hook   | 组合式 API Hook     |
| :---------------- | :------------------ |
| `beforeCreate`    | Not Needed\*        |
| `created`         | Not Needed\*        |
| `beforeMount`     | `onBeforeMount`     |
| `mounted`         | `onMounted`         |
| `beforeUpdate`    | `onBeforeUpdate`    |
| `updated`         | `onUpdated`         |
| `beforeUnmount`   | `onBeforeUnmount`   |
| `unmounted`       | `onUnmounted`       |
| `errorCaptured`   | `onErrorCaptured`   |
| `renderTracked`   | `onRenderTracked`   |
| `renderTriggered` | `onRenderTriggered` |

> \*`setup()` 运行时间约等于 `beforeCreate` 和 `created`，所以在这两个钩子中编写的代码都应直接放在 `setup()` 函数中。

```javascript
import { onMounted, onUnmounted } from 'vue';

export default {
  setup() {
    // 模拟一个需要清理的副作用，例如事件监听器
    function handleResize() {
      console.log(window.innerWidth);
    }

    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });

    // 在卸载时清理
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });
  },
};
```

## 4. 逻辑复用：组合式函数

组合式函数 (Composables) 是利用 Vue 组合式 API 来封装和复用**有状态逻辑**的函数。这是组合式 API 最强大的地方。

一个组合式函数就是一个普通的 JavaScript 函数，但它内部使用了组合式 API。约定它以 `use` 开头命名。

**最佳实践示例：一个复用鼠标位置跟踪的逻辑**

1. 创建组合式函数 (`useMouse.js`)

```javascript
// composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useMouse() {
  // 被组合式函数封装和管理的状态
  const x = ref(0);
  const y = ref(0);

  // 组合式函数可以随时更新其状态
  function update(event) {
    x.value = event.pageX;
    y.value = event.pageY;
  }

  // 组合式函数也可以“钩入”所属组件的生命周期
  // 来设置和卸载副作用
  onMounted(() => window.addEventListener('mousemove', update));
  onUnmounted(() => window.removeEventListener('mousemove', update));

  // 将管理的状态返回给调用者
  return { x, y };
}
```

2. 在组件中使用它

```vue
<template>
  <div>Mouse position is at: {{ x }}, {{ y }}</div>
</template>

<script>
import { useMouse } from './composables/useMouse';

export default {
  setup() {
    // 使用组合式函数，轻松获得鼠标位置逻辑！
    const { x, y } = useMouse();

    // 其他逻辑...
    return {
      x,
      y,
    };
  },
};
</script>
```

你可以用同样的模式创建 `useFetch`, `useLocalStorage`, `useTimer` 等，将复杂的逻辑从组件中提取出来，变得极其可复用和可测试。

## 5. 最佳实践与常见陷阱

### 5.1 组织代码

- **基于逻辑功能而非选项类型组织代码**：将与同一个功能相关的 `ref`, `computed`, `watch`, `method` 等放在一起。
- **使用组合式函数抽取复用逻辑**：当一段逻辑需要在多个组件中使用时，毫不犹豫地将其提取为组合式函数。

### 5.2 响应式处理

- **警惕解构导致的响应式丢失**：直接解构 `reactive()` 对象会失去响应性。始终使用 `toRefs()`。
- **明确 ref 的 .value 使用场景**：在 JavaScript 中操作 `ref` 时记得加 `.value`，在模板中则不需要。

### 5.3 副作用清理

- 在 `watchEffect`, `setInterval`, 事件监听器等操作中，**务必使用 `onCleanup` 或生命周期钩子进行清理**，防止内存泄漏。

```javascript
watchEffect((onCleanup) => {
  const timer = setInterval(() => {
    // ...
  }, 1000);

  // 清理之前的副作用
  onCleanup(() => clearInterval(timer));
});
```

### 5.4 性能考量

- `watchEffect` 会立即执行并收集所有依赖，如果副作用函数很昂贵，请谨慎使用。可以考虑使用 `watch` 显式指定侦听源，并添加 `immediate: true` 达到类似效果。
- 对于耗时的计算，使用 `computed` 进行缓存。

## 6. 与选项式 API 的对比与选择

| 方面                | 选项式 API             | 组合式 API                              |
| :------------------ | :--------------------- | :-------------------------------------- |
| **代码组织**        | 按选项类型分组         | 按逻辑功能分组                          |
| **逻辑复用**        | `mixins`, 高阶组件     | 组合式函数                              |
| **TypeScript 支持** | 一般                   | 极佳                                    |
| **学习曲线**        | 较低，更直观           | 较高，需要理解响应式系统                |
| **适用场景**        | 简单组件、低复杂度项目 | 大型应用、高复用性需求、TypeScript 项目 |

**结论**：它们并非互斥，而是互补的。

- 对于中小型项目或简单组件，选项式 API 依然是一个优秀的选择。
- 对于大型、需要长期维护、逻辑复杂且需要高度复用的项目，组合式 API 提供了更强的组织能力和可扩展性。
- 你甚至可以在同一个组件中混用两者（通过 `setup()` 选项）。

## 7. 总结

Vue 3 的组合式 API 通过提供基于函数的、更具弹性的代码组织方式，显著提升了复杂组件的可读性、可维护性和可复用性。核心在于理解 `ref`, `reactive`, `computed`, `watch`, 生命周期钩子等基础 API，并掌握**组合式函数**这一强大的逻辑复用模式。

遵循本文的最佳实践，如基于功能组织代码、善用 `toRefs`、牢记副作用清理等，将帮助你构建出更加健壮和优雅的 Vue 3 应用程序。
