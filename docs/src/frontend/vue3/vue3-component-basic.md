好的，请看下方为您生成的关于 Vue 3 组件基础的详细技术文档。

---

# Vue 3 组件基础详解与最佳实践

## 概述

组件是 Vue 最核心的概念之一，它允许我们将 UI 拆分为独立、可复用的代码片段，并对每个片段进行独立的思考和管理。Vue 3 在兼容 Vue 2 选项式 API (Options API) 的同时，引入了更具逻辑组织能力的组合式 API (Composition API)，极大地提升了组件的可读性、可维护性和复用性。

本文将深入探讨 Vue 3 组件的各个方面，包括定义、生命周期、核心概念（Props、事件、插槽等）以及基于最佳实践的开发模式。

## 1. 定义一个组件

### 1.1 单文件组件 (SFC)

Vue 的单文件组件将一个组件的逻辑 (JavaScript)、模板 (HTML) 和样式 (CSS) 封装在单个 `.vue` 文件中。这是 Vue 应用中最常见的组件形式。

```vue
<!-- MyComponent.vue -->
<template>
  <div class="greeting">{{ greetingMessage }}</div>
</template>

<script>
// 使用组合式 API
import { ref } from 'vue';

export default {
  setup() {
    const greetingMessage = ref('Hello, Vue 3!');
    return {
      greetingMessage,
    };
  },
};
</script>

<style scoped>
.greeting {
  color: #42b883;
  font-weight: bold;
}
</style>
```

**代码解析：**

- `<template>`：包含组件的 HTML 模板。
- `<script>`：包含组件的 JavaScript 逻辑。`setup()` 函数是组合式 API 的入口。
- `<style scoped>`：包含组件的 CSS 样式。`scoped` 属性使这些样式仅应用于当前组件。

### 1.2 组合式 API vs. 选项式 API

Vue 3 支持两种编写组件逻辑的风格。

**选项式 API (Options API)**

接近于 Vue 2 的写法，通过不同的选项（`data`, `methods`, `computed` 等）来组织代码。

```vue
<script>
export default {
  // 数据
  data() {
    return {
      count: 0,
    };
  },
  // 方法
  methods: {
    increment() {
      this.count++;
    },
  },
  // 计算属性
  computed: {
    doubleCount() {
      return this.count * 2;
    },
  },
  // 生命周期钩子
  mounted() {
    console.log('Component is mounted!');
  },
};
</script>
```

**组合式 API (Composition API)**

Vue 3 的推荐写法。它允许我们通过导入 API 函数的方式，将逻辑关注点灵活地组合在一起，而不是强制按选项分隔。这在处理复杂组件时尤其有用。

```vue
<script>
import { ref, computed, onMounted } from 'vue';

export default {
  setup() {
    // 状态 (替代 data)
    const count = ref(0);

    // 方法 (替代 methods)
    function increment() {
      count.value++;
    }

    // 计算属性 (替代 computed)
    const doubleCount = computed(() => count.value * 2);

    // 生命周期钩子 (替代 mounted)
    onMounted(() => {
      console.log('Component is mounted!');
    });

    // 必须将需要在模板中使用的数据和方法返回
    return {
      count,
      increment,
      doubleCount,
    };
  },
};
</script>

<!-- 或者使用更简洁的 <script setup> 语法 -->
<script setup>
import { ref, computed, onMounted } from 'vue';

const count = ref(0);
function increment() {
  count.value++;
}
const doubleCount = computed(() => count.value * 2);
onMounted(() => {
  console.log('Component is mounted!');
});
// <script setup> 中的顶层绑定会自动在模板中可用
</script>
```

**最佳实践：** 对于新项目，强烈推荐使用 **组合式 API** 和 **`<script setup>`** 语法糖，它能提供更好的 TypeScript 集成、更少的样板代码和更强的逻辑复用能力。

## 2. Props：父组件向子组件传递数据

Props 是自定义属性，用于从父组件向子组件传递数据。

### 2.1 声明与使用

**子组件 (ChildComponent.vue)**

```vue
<!-- 使用 <script setup> -->
<script setup>
// 使用 defineProps 编译器宏，无需导入
const props = defineProps({
  title: {
    type: String,
    required: true, // 必传项
  },
  likes: {
    type: Number,
    default: 0, // 默认值
  },
  isPublished: Boolean, // 仅类型声明
});

console.log(props.title);
</script>

<template>
  <div class="child">
    <h2>{{ title }}</h2>
    <p>Likes: {{ likes }}</p>
    <p>Status: {{ isPublished ? 'Published' : 'Draft' }}</p>
  </div>
</template>
```

**父组件 (ParentComponent.vue)**

```vue
<script setup>
import { ref } from 'vue';
import ChildComponent from './ChildComponent.vue';

const postTitle = ref('My Journey with Vue 3');
const postLikes = ref(42);
</script>

<template>
  <ChildComponent :title="postTitle" :likes="postLikes" is-published />
  <!-- 也可以传递静态值 -->
  <ChildComponent title="Static Title" :likes="100" />
</template>
```

### 2.2 最佳实践

1. **始终声明 Props**：明确定义 props 的类型、要求和默认值，这相当于组件的 API 文档，能提高可维护性和开发体验。
2. **使用 `camelCase` 声明，`kebab-case` 传递**：在 JavaScript 中使用 `camelCase`，在模板中使用 `kebab-case`（因为 HTML 属性名是大小写不敏感的）。

   ```javascript
   defineProps({
     postTitle: String,
   });
   ```

   ```html
   <ChildComponent post-title="hello" />
   ```

3. **避免直接修改 Prop**：Props 是只读的。如果需要修改，应该在子组件中定义一个本地的 `ref` 或 `computed` property，基于 prop 的值。

   ```vue
   <script setup>
   import { computed } from 'vue';

   const props = defineProps(['size']);
   // 正确的做法：使用计算属性
   const normalizedSize = computed(() => props.size.trim().toLowerCase());
   </script>
   ```

## 3. 自定义事件：子组件向父组件传递数据

子组件可以通过自定义事件向父组件传递信息。

### 3.1 发射与监听事件

**子组件 (EmitterComponent.vue)**

使用 `defineEmits` 宏声明它要触发的事件。

```vue
<script setup>
// 声明事件
const emit = defineEmits(['enlarge-text', 'submit']);

function onButtonClick() {
  // 触发无负载事件
  emit('enlarge-text');
}

function onSubmitForm() {
  // 触发有负载事件
  emit('submit', { id: 1, message: 'Hello from child!' });
}
</script>

<template>
  <div>
    <button @click="onButtonClick">Enlarge Text</button>
    <form @submit.prevent="onSubmitForm">
      <button type="submit">Submit</button>
    </form>
  </div>
</template>
```

**父组件 (ListenerComponent.vue)**

使用 `v-on`（缩写为 `@`）来监听子组件触发的事件。

```vue
<script setup>
import { ref } from 'vue';
import EmitterComponent from './EmitterComponent.vue';

const textSize = ref(1);
const postMessage = ref('');

function onEnlargeText() {
  textSize.value += 0.1;
}

function onFormSubmit(payload) {
  postMessage.value = `Received: ${payload.message} (ID: ${payload.id})`;
}
</script>

<template>
  <div :style="{ fontSize: textSize + 'em' }">
    <p>Parent Text</p>
    <p>{{ postMessage }}</p>
    <EmitterComponent @enlarge-text="onEnlargeText" @submit="onFormSubmit" />
  </div>
</template>
```

### 3.2 最佳实践

1. **使用 `camelCase` 事件名**：与组件和 prop 不同，事件名不存在任何自动化的大小写转换。建议使用 `camelCase` 事件名，但在模板中可以使用 `camelCase` 或 `kebab-case`（`@my-event`）监听，推荐保持一致性。
2. **声明事件**：使用 `defineEmits` 声明事件，这同样是为了文档化和维护性。
3. **所有事件负载应为只读**：父组件通过事件接收到的数据应是只读的，不应直接修改。

## 4. 插槽 (Slots)：内容分发

插槽用于将模板片段分发到子组件的指定位置，是组件复合 (Composition) 的强大工具。

### 4.1 基本用法

**子组件 (BaseLayout.vue)**

```vue
<div class="container">
  <header>
    <!-- 具名插槽 -->
    <slot name="header"></slot>
  </header>
  <main>
    <!-- 默认插槽（隐式名为 `default`） -->
    <slot></slot>
  </main>
  <footer>
    <!-- 具名插槽 -->
    <slot name="footer"></slot>
  </footer>
</div>
```

**父组件**

使用 `v-slot` 指令（缩写为 `#`）指定内容要放入的插槽。

```vue
<BaseLayout>
  <template #header>
    <h1>Here is the page title</h1>
  </template>

  <!-- 内容放入默认插槽 -->
  <p>A paragraph for the main content.</p>
  <p>And another one.</p>

  <template #footer>
    <p>Here is some contact info</p>
  </template>
</BaseLayout>
```

### 4.2 作用域插槽

有时，让插槽内容能够访问子组件中的数据很有用。

**子组件 (ScopedSlotComponent.vue)**

```vue
<script setup>
import { ref } from 'vue';

const user = ref({
  firstName: 'John',
  lastName: 'Doe',
});
</script>

<template>
  <div>
    <!-- 将 `user` 作为插槽的 props 传递出去 -->
    <slot v-bind:user="user"></slot>
    <slot name="secondary" :message="'Hello from child'"></slot>
  </div>
</template>
```

**父组件**

使用带值的 `v-slot` 来接收传递过来的 props。

```vue
<ScopedSlotComponent>
  <!-- 接收默认插槽的 props -->
  <template v-slot:default="slotProps">
    {{ slotProps.user.firstName }}
  </template>

  <!-- 或者使用解构语法 -->
  <template #default="{ user }">
    {{ user.lastName }}
  </template>

  <!-- 接收具名插槽的 props -->
  <template #secondary="{ message }">
    <p>{{ message }}</p>
  </template>
</ScopedSlotComponent>
```

### 4.3 最佳实践

1. **优先使用插槽而非 Prop**：当需要传递复杂的 HTML 内容或模板结构时，使用插槽比用 Prop 传递字符串或对象更灵活、更符合语义。
2. **合理使用具名插槽**：对于有多个插入点的组件，清晰地使用具名插槽。
3. **作用域插槽用于逻辑分离**：当子组件负责管理数据状态，但父组件需要自定义渲染UI时，作用域插槽是最佳选择（例如，封装数据获取逻辑的组件）。

## 5. 组件生命周期

每个组件在被创建、挂载、更新和销毁时都会经历一系列被称为“生命周期钩子”的函数。组合式 API 的钩子名称以 `on` 前缀开头。

| 选项式 API Hook | 组合式 API Hook   | 触发时机                                                                                     |
| :-------------- | :---------------- | :------------------------------------------------------------------------------------------- |
| `beforeCreate`  | -                 | 在实例初始化之后、进行数据侦听和事件/侦听器的配置之前同步调用。**在 `setup()` 中不需要它**。 |
| `created`       | -                 | 在实例处理完所有与状态相关的选项后同步调用。**在 `setup()` 中不需要它**。                    |
| `beforeMount`   | `onBeforeMount`   | 在组件被挂载之前调用。                                                                       |
| `mounted`       | `onMounted`       | 在组件被挂载之后调用。**常用于执行 DOM 操作、发起 API 请求**。                               |
| `beforeUpdate`  | `onBeforeUpdate`  | 在组件即将因为一个响应式状态变更而更新其 DOM 树之前调用。                                    |
| `updated`       | `onUpdated`       | 在组件因为一个响应式状态变更而更新其 DOM 树之后调用。**避免在此钩子中更改状态**。            |
| `beforeUnmount` | `onBeforeUnmount` | 在组件实例被卸载之前调用。                                                                   |
| `unmounted`     | `onUnmounted`     | 在组件实例被卸载之后调用。**用于清理副作用，如定时器、事件监听器**。                         |
| `errorCaptured` | `onErrorCaptured` | 在捕获了后代组件传递的错误时调用。                                                           |

**示例：**

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  console.log('Component is mounted!');
  // 设置一个定时器
  timer = setInterval(() => {
    // do something
  }, 1000);
});

onUnmounted(() => {
  console.log('Component is unmounted!');
  // 清除定时器，防止内存泄漏
  clearInterval(timer);
});
</script>
```

## 6. 依赖注入 (Provide / Inject)

对于深层嵌套的组件，如果使用 Props 逐层传递会非常麻烦。依赖注入允许祖先组件作为其所有后代组件的依赖提供者。

**祖先组件 (ProviderComponent.vue)**

```vue
<script setup>
import { provide, ref } from 'vue';

const theme = ref('dark');
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
};

// 提供静态值
provide('app-version', '1.0.0');
// 提供响应式值和方法
provide('theme', {
  theme,
  toggleTheme,
});
</script>
```

**后代组件 (DescendantComponent.vue)**

```vue
<script setup>
import { inject } from 'vue';

// 注入值，提供默认值以防祖先未提供
const version = inject('app-version', 'unknown');
// 注入响应式对象
const { theme, toggleTheme } = inject('theme');
</script>

<template>
  <div>App Version: {{ version }}</div>
  <button @click="toggleTheme">Toggle Theme (Current: {{ theme }})</button>
</template>
```

**最佳实践：** 主要在开发高阶插件/组件库或处理复杂的深层嵌套业务组件时使用。在应用层面，使用 Pinia 或 Vuex 进行状态管理通常是更好的选择。

## 7. 最佳实践总结

1. **API 选择**：新项目首选 **组合式 API** 与 **`<script setup>`**。
2. **组件命名**：使用 **PascalCase**（例如 `MyComponent.vue`），这在不同的编辑器和工具中辨识度最高。
3. **Props 设计**：
   - **声明验证**：始终使用对象形式声明 props 并进行验证。
   - **只读性**：不要直接修改 prop。
   - **清晰的命名**：使用描述性名称。
4. **事件设计**：
   - **声明事件**：使用 `defineEmits`。
   - **命名**：使用 `camelCase` 事件名。
5. **逻辑复用**：将可复用的逻辑提取到 **组合式函数 (Composables)** 中，而不是直接复用组件或使用 Mixins。
6. **样式作用域**：为组件样式使用 **`<style scoped>`** 以避免污染全局样式。
7. **键控列表**：使用 `v-for` 时总是提供唯一的 `:key` attribute。
8. **资源清理**：在 `onUnmounted` 生命周期钩子中清理副作用（如事件监听器、定时器、订阅等）。
9. **TypeScript**：对于大型项目，强烈推荐使用 **TypeScript** 以获得更好的类型安全和开发体验。

通过遵循这些基础和最佳实践，你将能够构建出健壮、可维护且高效的 Vue 3 应用程序。

---

**希望这份文档对您的 Vue 3 学习之旅有所帮助！**
