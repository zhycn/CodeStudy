# Vue3 事件处理详解与最佳实践

> 本文基于 Vue3 官方文档及社区最佳实践，结合 10+ 篇优质技术文章分析总结而成

## 目录

- #事件处理基础
- #事件修饰符详解
- #按键修饰符
- #系统修饰键
- #鼠标按钮修饰符
- #组件自定义事件
- #最佳实践
- #总结

## 事件处理基础

在 Vue3 中，我们使用 `v-on` 指令（简写为 `@`）来监听 DOM 事件并执行 JavaScript 代码

```html
<template>
  <div>
    <!-- 内联表达式 -->
    <button @click="count++">Add 1</button>
    <p>Count: {{ count }}</p>

    <!-- 调用方法 -->
    <button @click="greet">Greet</button>

    <!-- 方法传参 -->
    <button @click="sayHello('Vue Developer')">Say Hello</button>

    <!-- 访问原生事件对象 -->
    <button @click="warn('Form cannot be submitted', $event)">Submit</button>
  </div>
</template>

<script setup>
  import { ref } from 'vue';

  const count = ref(0);

  function greet(event) {
    console.log('Hello!');
    console.log('Event type:', event.type);
  }

  function sayHello(name) {
    alert(`Hello, ${name}!`);
  }

  function warn(message, event) {
    if (event) {
      event.preventDefault();
    }
    alert(message);
  }
</script>
```

## 事件修饰符详解

Vue 提供了事件修饰符来处理常见的 DOM 事件细节

### 基本修饰符

| 修饰符     | 作用                       | 等效原生 JavaScript                                |
| ---------- | -------------------------- | -------------------------------------------------- |
| `.stop`    | 阻止事件冒泡               | `event.stopPropagation()`                          |
| `.prevent` | 阻止默认行为               | `event.preventDefault()`                           |
| `.capture` | 使用捕获模式               | `addEventListener(..., true)`                      |
| `.self`    | 仅当事件源是元素本身时触发 | `if (event.target !== event.currentTarget) return` |
| `.once`    | 只触发一次                 | 自动移除事件监听器                                 |
| `.passive` | 提高滚动性能（尤其移动端） | `addEventListener(..., { passive: true })`         |

### 修饰符使用示例

```html
<template>
  <div @click.self="outerClick">
    Outer Div
    <div @click.stop="innerClick">Inner Div (stops propagation)</div>

    <a href="/" @click.prevent="handleLink"> Prevent default link behavior </a>

    <button @click.once="oneTimeAction">Only works once</button>

    <div @scroll.passive="handleScroll">Passive scrolling (better performance)</div>
  </div>
</template>

<script setup>
  function outerClick() {
    console.log('Outer div clicked');
  }

  function innerClick() {
    console.log('Inner div clicked - propagation stopped');
  }

  function handleLink(event) {
    console.log('Link clicked but not followed');
  }

  function oneTimeAction() {
    console.log('This action will only trigger once');
  }

  function handleScroll() {
    // 在被动事件处理器中避免使用 event.preventDefault()
    console.log('Scrolling...');
  }
</script>
```

### 修饰符链式调用

```html
<template>
  <!-- 先阻止事件冒泡，再阻止默认行为 -->
  <a href="/" @click.stop.prevent="handleLink"> Combined modifiers </a>

  <!-- 仅当点击元素自身时触发，且只触发一次 -->
  <div @click.self.once="handleSelfClick">Self + once modifier</div>
</template>
```

## 按键修饰符

Vue 为常用按键提供了修饰符，可以监听特定按键触发的事件

### 常用按键修饰符

```html
<template>
  <input
    @keyup.enter="submitForm"
    @keyup.esc="cancelAction"
    @keyup.page-down="pageDown"
    @keyup.space="playPause"
    @keyup.left="moveLeft"
    @keyup.right="moveRight"
    @keyup.delete="deleteItem"
    @keyup.tab="focusNext"
  />
</template>

<script setup>
  function submitForm() {
    console.log('Enter key pressed - submit form');
  }

  function cancelAction() {
    console.log('Escape key pressed - cancel action');
  }

  // ...其他处理函数
</script>
```

### 自定义按键修饰符

```js
// 在组件中定义自定义按键修饰符
const app = createApp({});

// 使用 `v` 开头的自定义修饰符
app.config.keyCodes = {
  v: 86,
  f1: 112,
  upArrow: 38,
  // 支持连字符命名
  'arrow-up': 38,
};
```

使用自定义按键修饰符：

```html
<input @keyup.v="doSomething" />
<input @keyup.f1="showHelp" />
<input @keyup.arrow-up="moveUp" />
```

## 系统修饰键

处理组合按键的场景，如 `Ctrl + Click` 或 `Alt + Enter`

### 常用系统修饰键

| 修饰符   | 说明                     |
| -------- | ------------------------ |
| `.ctrl`  | Ctrl 键                  |
| `.alt`   | Alt 键                   |
| `.shift` | Shift 键                 |
| `.meta`  | Command(⌘) 或 Windows 键 |

### 使用示例

```html
<template>
  <!-- Ctrl + Click -->
  <div @click.ctrl="handleCtrlClick">Ctrl + Click me</div>

  <!-- Alt + Enter -->
  <input @keyup.alt.enter="clearInput" placeholder="Alt + Enter to clear" />

  <!-- 精确控制修饰键 -->
  <button @click.ctrl.exact="ctrlOnlyClick">Only Ctrl + Click</button>

  <button @click.exact="noModifierClick">Click without any modifiers</button>
</template>

<script setup>
  function handleCtrlClick() {
    console.log('Ctrl + Click detected');
  }

  function clearInput() {
    console.log('Alt + Enter pressed');
    // 实际应用中清除输入框内容
  }

  function ctrlOnlyClick() {
    console.log('Ctrl + Click without other modifiers');
  }

  function noModifierClick() {
    console.log('Click without any modifier keys');
  }
</script>
```

## 鼠标按钮修饰符

精确监听鼠标的特定按钮事件

| 修饰符    | 对应按钮 |
| --------- | -------- |
| `.left`   | 左键     |
| `.right`  | 右键     |
| `.middle` | 中键     |

```html
<template>
  <div>
    <div @mousedown.left="leftClick">Left Mouse Button</div>
    <div @mousedown.right="rightClick">Right Mouse Button</div>
    <div @mousedown.middle="middleClick">Middle Mouse Button</div>
  </div>
</template>

<script setup>
  function leftClick() {
    console.log('Left mouse button clicked');
  }

  function rightClick(e) {
    e.preventDefault(); // 阻止右键菜单
    console.log('Right mouse button clicked');
  }

  function middleClick() {
    console.log('Middle mouse button clicked');
  }
</script>
```

## 组件自定义事件

在组件中使用自定义事件实现父子组件通信

### 基础示例

**子组件 (ChildComponent.vue)**

```html
<template>
  <button @click="emitEvent">Emit Event</button>
</template>

<script setup>
  // 显式声明 emits
  const emit = defineEmits(['customEvent', 'submit']);

  function emitEvent() {
    // 触发不带参数的简单事件
    emit('customEvent');

    // 触发带参数的事件
    emit('submit', { id: 1, data: 'payload' });
  }
</script>
```

**父组件**

```html
<template>
  <ChildComponent @custom-event="handleCustomEvent" @submit="handleSubmit" />
</template>

<script setup>
  import ChildComponent from './ChildComponent.vue';

  function handleCustomEvent() {
    console.log('Custom event received');
  }

  function handleSubmit(payload) {
    console.log('Submit event with payload:', payload);
  }
</script>
```

### 使用 `v-model` 实现双向绑定

Vue3 支持多个 `v-model` 绑定

**子组件 (InputComponent.vue)**

```html
<template>
  <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
</template>

<script setup>
  defineProps(['modelValue']);
  defineEmits(['update:modelValue']);
</script>
```

**父组件**

```html
<template>
  <InputComponent v-model="text" />
  <p>You typed: {{ text }}</p>
</template>

<script setup>
  import { ref } from 'vue';
  import InputComponent from './InputComponent.vue';

  const text = ref('');
</script>
```

### 多 `v-model` 绑定

**子组件 (UserForm.vue)**

```html
<template>
  <input :value="firstName" @input="$emit('update:firstName', $event.target.value)" />
  <input :value="lastName" @input="$emit('update:lastName', $event.target.value)" />
</template>

<script setup>
  defineProps(['firstName', 'lastName']);
  defineEmits(['update:firstName', 'update:lastName']);
</script>
```

**父组件**

```html
<template>
  <UserForm v-model:firstName="firstName" v-model:lastName="lastName" />
  <p>Full name: {{ firstName }} {{ lastName }}</p>
</template>

<script setup>
  import { ref } from 'vue';
  import UserForm from './UserForm.vue';

  const firstName = ref('');
  const lastName = ref('');
</script>
```

## 最佳实践

### 1. 事件命名规范

- **自定义事件**：使用 kebab-case 命名（`my-event`）
- **原生事件**：使用原生事件名（`click`，`input`）
- **一致性**：保持项目中事件命名风格统一

### 2. 事件处理优化

- 避免在模板中编写复杂逻辑
- 将事件处理程序提取到 methods/composables 中
- 对于频繁触发的事件（如 `scroll`、`mousemove`），使用防抖/节流

```html
<template>
  <div @mousemove="throttledMouseMove">Move mouse here</div>
</template>

<script setup>
  import { ref } from 'vue';
  import { useThrottleFn } from '@vueuse/core';

  const position = ref({ x: 0, y: 0 });

  // 使用防抖函数
  const throttledMouseMove = useThrottleFn((event) => {
    position.value = { x: event.clientX, y: event.clientY };
  }, 100);
</script>
```

### 3. 组件通信

- **简单数据流**：使用 props 传递数据
- **子到父通信**：使用自定义事件
- **复杂状态管理**：考虑使用 Pinia 或 Vuex

### 4. 性能优化

- 使用 `.passive` 修饰符提升滚动性能
- 及时清理事件监听器（尤其在 `setup()` 中使用 `addEventListener` 时）
- 对于一次性事件，使用 `.once` 修饰符

```js
import { onMounted, onUnmounted } from 'vue';

export function useWindowEvent(event, handler) {
  onMounted(() => window.addEventListener(event, handler));
  onUnmounted(() => window.removeEventListener(event, handler));
}
```

### 5. 事件测试

```js
// 使用 Vue Test Utils 测试事件
import { mount } from '@vue/test-utils';
import MyButton from './MyButton.vue';

test('emits click event', async () => {
  const wrapper = mount(MyButton);
  await wrapper.find('button').trigger('click');
  expect(wrapper.emitted('click')).toHaveLength(1);
});
```

### 6. 可访问性

- 确保所有功能可以通过键盘操作
- 为自定义控件添加适当的 ARIA 属性
- 测试键盘导航体验

```html
<template>
  <div tabindex="0" @click="handleClick" @keyup.enter="handleClick" @keyup.space="handleClick" role="button">
    Custom Button
  </div>
</template>
```

## 总结

Vue3 的事件处理系统提供了强大而灵活的方式来处理用户交互：

1. **基础语法**：使用 `v-on` 或 `@` 绑定事件监听器
2. **修饰符系统**：简化常见事件处理需求（`.stop`, `.prevent`, `.once` 等）
3. **按键处理**：通过按键修饰符轻松处理键盘事件
4. **自定义事件**：组件间通信的核心机制
5. **v-model**：实现组件双向绑定的语法糖
6. **最佳实践**：关注性能、可维护性和可访问性

遵循这些模式和实践，您可以创建响应迅速、可维护且用户友好的 Vue 应用程序。Vue 的事件系统设计使开发人员能够以声明方式处理用户交互，同时保持代码的清晰性和可读性。
