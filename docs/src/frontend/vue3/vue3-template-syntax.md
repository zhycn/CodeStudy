好的，请看下方为您生成的关于 Vue3 模板语法的完整技术文档。

---

# Vue 3 模板语法详解与最佳实践

## 概述

Vue.js 使用了基于 HTML 的模板语法，允许开发者声明式地将组件实例的数据绑定到渲染的 DOM 上。Vue 的核心在于，模板本质上是声明式的、轻量级的，它使得构建交互式 Web 应用变得简单直观。Vue 3 在模板语法上大部分与 Vue 2 兼容，同时引入了一些性能优化和细微的改进。

所有 Vue 的模板都是合法的 HTML，可以被符合规范的浏览器和 HTML 解析器解析。在底层，Vue 会将模板编译成高度优化的 JavaScript 代码。结合响应式系统，Vue 能够智能地计算出需要重新渲染多少组件，并最小化 DOM 操作。

## 1. 文本插值

最基本的数据绑定形式是使用“Mustache”语法（双大括号）进行文本插值。

### 1.1 基础用法

```vue
<template>
  <div>
    <h1>{{ message }}</h1>
    <p>Count is: {{ count }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const message = ref('Hello Vue 3!');
const count = ref(0);
</script>
```

双大括号标签会被替换为相应组件实例中 `message` 和 `count` 属性的值。当这些属性的值发生变化时，插值处的内容也会自动更新。

### 1.2 使用 JavaScript 表达式

Vue 在所有的数据绑定中都支持完整的 JavaScript 表达式。这些表达式将在当前组件实例的数据作用域下作为 JavaScript 被解析。

```vue
<template>
  <div>
    <p>Number: {{ number + 1 }}</p>
    <p>Condition: {{ ok ? 'YES' : 'NO' }}</p>
    <p>Reversed Message: {{ message.split('').reverse().join('') }}</p>
    <p>Math: {{ Math.sqrt(16) * 2 }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const number = ref(10);
const ok = ref(true);
const message = ref('VUE');
</script>
```

**限制**：每个绑定仅支持**单个表达式**，所以下面的例子是**无效的**。

```vue
<!-- 这是语句，不是表达式 -->
{{ var a = 1 }}

<!-- 流程控制也不会生效，请使用三元表达式 -->
{{ if (ok) { return message } }}
```

## 2. 原始 HTML

双大括号会将数据解释为纯文本，而不是 HTML。若想插入 HTML，你需要使用 `v-html` 指令。

```vue
<template>
  <div>
    <p>Using text interpolation: {{ rawHtml }}</p>
    <p>Using v-html directive: <span v-html="rawHtml"></span></p>
  </div>
</template>

<script setup>
const rawHtml = ref('<span style="color: red;">This should be red.</span>');
</script>
```

**安全警告**：在网站上动态渲染任意 HTML 非常危险，因为它很容易导致 <https://en.wikipedia.org/wiki/Cross-site_scripting。请只对可信内容使用> `v-html`，**永远不要**用于用户提供的内容。

## 3. 属性绑定

Mustache 语法不能在 HTML 属性中使用。响应式地绑定一个属性，应该使用 `v-bind` 指令。

### 3.1 基础绑定

`v-bind` 指令指示 Vue 将元素的 `id` 属性与组件的 `dynamicId` 属性保持一致。

```vue
<template>
  <div v-bind:id="dynamicId"></div>
</template>

<script setup>
const dynamicId = ref('app-container');
</script>
```

如果绑定的值是 `null` 或 `undefined`，那么该属性将会从渲染的元素上移除。

### 3.2 简写

因为 `v-bind` 非常常用，Vue 为其提供了一个特定的简写语法 `:`。

```vue
<template>
  <div :id="dynamicId"></div>
</template>
```

### 3.3 布尔型属性

布尔型属性依据 true/false 值来决定属性是否应该存在于元素上。`disabled` 和 `checked` 是最常见的例子。

```vue
<template>
  <button :disabled="isButtonDisabled">Button</button>
  <input type="checkbox" :checked="isChecked" />
</template>

<script setup>
const isButtonDisabled = ref(true);
const isChecked = ref(false);
</script>
```

### 3.4 动态绑定多个属性

如果你有多个属性需要动态绑定，你可以直接使用 `v-bind` 而不带参数（`v-bind="object"`），将一个对象的所有属性都绑定到元素上。

```vue
<template>
  <div v-bind="objectOfAttrs">This div has multiple dynamic attributes.</div>
</template>

<script setup>
const objectOfAttrs = ref({
  id: 'container',
  class: 'wrapper',
  'data-value': '123'
});
</script>
```

## 4. 指令

指令是带有 `v-` 前缀的特殊属性。Vue 提供了许多内置指令，它们的值可以是单个 JavaScript 表达式（`v-for` 和 `v-on` 是例外）。

### 4.1 参数

一些指令会需要一个“参数”，在指令名后通过一个冒号隔开。例如，`v-bind` 指令用于响应式地更新一个 HTML 属性，`v-on` 指令用于监听事件。

```vue
<template>
  <!-- 告诉 Vue 将元素的 href 属性与 url 状态保持同步 -->
  <a v-bind:href="url"> ... </a>

  <!-- 简写 -->
  <a :href="url"> ... </a>

  <!-- 监听点击事件 -->
  <button v-on:click="doSomething"> ... </button>

  <!-- 简写 -->
  <button @click="doSomething"> ... </button>
</template>
```

### 4.2 动态参数

你也可以在指令参数中使用 JavaScript 表达式，需要包含在方括号中。

```vue
<template>
  <!-- 注意：参数表达式有一些约束，参见下面的说明 -->
  <p :[dynamicAttr]="dynamicValue">This has a dynamic attribute.</p>
  <button @[dynamicEvent]="handler">Click me</button>
</template>

<script setup>
import { ref } from 'vue';

const dynamicAttr = ref('title');
const dynamicValue = ref('A dynamic tooltip');
const dynamicEvent = ref('mouseenter');
const handler = () => {
  console.log('Mouse entered!');
};
</script>
```

**动态参数值的限制**：动态参数表达式必须最终求值为一个字符串或 `null`（用于显式移除绑定）。`undefined` 或其他非字符串值会触发警告。

**动态参数语法的限制**：动态参数表达式因为某些字符的缘故（例如空格和引号），在 HTML 属性名中是无效的。应避免在名称中使用大写字母，因为浏览器会将其强制转换为小写。

### 4.3 修饰符

修饰符是以点开头的特殊后缀，表明指令需要以一些特殊的方式被绑定。例如 `.prevent` 修饰符会告知 `v-on` 指令对触发的事件调用 `event.preventDefault()`。

```vue
<template>
  <form @submit.prevent="onSubmit">
    <input type="text" />
    <button type="submit">Submit</button>
  </form>
</template>

<script setup>
const onSubmit = () => {
  console.log('Form submitted (default prevented)');
};
</script>
```

## 5. 特殊指令

### 5.1 `v-if`, `v-else-if`, `v-else`

用于条件性地渲染一块内容。

```vue
<template>
  <div>
    <p v-if="type === 'A'">Type A</p>
    <p v-else-if="type === 'B'">Type B</p>
    <p v-else-if="type === 'C'">Type C</p>
    <p v-else>Not A/B/C</p>
  </div>
</template>

<script setup>
const type = ref('B');
</script>
```

### 5.2 `v-for`

基于源数据多次渲染一个元素或模板块。

```vue
<template>
  <ul>
    <li v-for="(item, index) in items" :key="item.id">
      {{ index }} - {{ item.text }}
    </li>
  </ul>
</template>

<script setup>
const items = ref([
  { id: 1, text: 'Learn JavaScript' },
  { id: 2, text: 'Learn Vue' },
  { id: 3, text: 'Build something awesome' }
]);
</script>
```

**关键点**：必须使用 `:key` 绑定一个唯一的值，这有助于 Vue 跟踪节点的身份，从而重用和重新排序现有元素。

### 5.3 `v-show`

另一个可以用来按条件显示元素的指令。不同的是，`v-show` 的元素始终会被渲染并保留在 DOM 中，它只是简单地切换元素的 `display` CSS 属性。

```vue
<template>
  <h1 v-show="ok">Hello with v-show!</h1>
</template>

<script setup>
const ok = ref(true);
</script>
```

**`v-if` vs `v-show`**：

- `v-if` 是“真实的”条件渲染，因为它会确保在切换过程中，条件块内的事件监听器和子组件适当地被销毁和重建。它也是**惰性**的：如果在初始渲染时条件为假，则什么也不做，直到条件第一次变为真时，才会开始渲染条件块。
- `v-show` 简单许多，元素无论如何都会被渲染，只是基于 CSS 进行切换。
- 一般来说，`v-if` 有更高的切换开销，而 `v-show` 有更高的初始渲染开销。因此，如果需要非常频繁地切换，则使用 `v-show` 较好；如果在运行时绑定条件很少改变，则 `v-if` 会更合适。

## 6. 综合示例

下面是一个综合运用了多种模板语法的组件示例。

```vue
<template>
  <div class="todo-app">
    <h1>{{ appTitle }}</h1>
    <form @submit.prevent="addNewTodo">
      <input
        v-model="newTodoText"
        :placeholder="inputPlaceholder"
        class="todo-input"
      />
      <button :disabled="!newTodoText" type="submit">Add Todo</button>
    </form>
    <ul v-if="todos.length" class="todo-list">
      <li
        v-for="todo in filteredTodos"
        :key="todo.id"
        class="todo-item"
        :class="{ completed: todo.completed }"
      >
        <input
          type="checkbox"
          v-model="todo.completed"
          @change="updateTodo(todo)"
        />
        <span @dblclick="editTodo(todo)">{{ todo.text }}</span>
        <button @click="removeTodo(todo)" class="remove-btn">×</button>
      </li>
    </ul>
    <p v-else>No todos left! Add one above.</p>
    <div class="filters">
      <button
        @click="visibility = 'all'"
        :class="{ active: visibility === 'all' }"
      >
        All
      </button>
      <button
        @click="visibility = 'active'"
        :class="{ active: visibility === 'active' }"
      >
        Active
      </button>
      <button
        @click="visibility = 'completed'"
        :class="{ active: visibility === 'completed' }"
      >
        Completed
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const appTitle = ref('Vue 3 Todo App');
const inputPlaceholder = ref('What needs to be done?');
const newTodoText = ref('');
const todos = ref([]);
const visibility = ref('all'); // 'all', 'active', 'completed'

// 计算属性，根据 visibility 过滤 todos
const filteredTodos = computed(() => {
  switch (visibility.value) {
    case 'active':
      return todos.value.filter(todo => !todo.completed);
    case 'completed':
      return todos.value.filter(todo => todo.completed);
    default:
      return todos.value;
  }
});

// 添加新的待办事项
const addNewTodo = () => {
  if (newTodoText.value.trim()) {
    todos.value.push({
      id: Date.now(),
      text: newTodoText.value,
      completed: false
    });
    newTodoText.value = ''; // 清空输入框
  }
};

// 移除待办事项
const removeTodo = todo => {
  todos.value = todos.value.filter(t => t.id !== todo.id);
};

// 模拟更新操作（在实际应用中，这里可能是 API 调用）
const updateTodo = todo => {
  console.log('Updated todo:', todo);
};

// 模拟编辑操作
const editTodo = todo => {
  const newText = prompt('Edit todo:', todo.text);
  if (newText !== null && newText.trim() !== '') {
    todo.text = newText.trim();
    updateTodo(todo);
  }
};

// 模拟组件挂载后从本地存储加载数据
onMounted(() => {
  const savedTodos = JSON.parse(localStorage.getItem('vue3-todos')) || [];
  todos.value = savedTodos;
});
</script>

<style scoped>
.todo-app {
  max-width: 500px;
  margin: 0 auto;
  font-family: sans-serif;
}
.todo-input {
  width: 70%;
  padding: 10px;
  margin-right: 10px;
}
.todo-list {
  list-style: none;
  padding: 0;
}
.todo-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.todo-item.completed span {
  text-decoration: line-through;
  color: #888;
}
.remove-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #cc0000;
}
.filters {
  margin-top: 20px;
}
.filters button.active {
  background-color: #4caf50;
  color: white;
}
</style>
```

## 最佳实践总结

1. **始终为 `v-for` 设置 key**：使用唯一且稳定的 ID (`:key="item.id"`) 而不是数组索引，这对于 Vue 的高效diff和DOM操作至关重要。
2. **避免 `v-if` 和 `v-for` 用于同一元素**：Vue 3 中这会导致语法错误。如果需要条件渲染列表，应该使用计算属性先过滤数据，再使用 `v-for` 渲染过滤后的结果。
3. **使用计算属性处理复杂逻辑**：模板内的表达式应当保持简单。对于任何复杂的逻辑（如数据过滤、格式化），都应当使用**计算属性**。
4. **谨慎使用 `v-html`**：仅在完全信任内容来源的情况下使用，永远不要用于渲染用户输入，以防止 XSS 攻击。
5. **掌握指令简写**：`:` 代替 `v-bind:`，`@` 代替 `v-on:`，提高代码可读性和编写效率。
6. **理解 `v-if` 与 `v-show` 的区别**：根据是否需要高频切换来选择正确的指令，以优化性能。
7. **合理组织模板结构**：保持模板的简洁和清晰。如果模板过于复杂，考虑将其拆分为更小的子组件。
8. **使用 `.prevent`、`.stop` 等事件修饰符**：这可以使方法代码更纯粹，只包含数据逻辑，而不是处理 DOM 事件细节。

通过遵循这些最佳实践，你可以编写出更高效、更易维护且更安全的 Vue 3 应用程序。

---

希望这篇详尽的文档能对您的 Vue 3 学习之旅有所帮助！
