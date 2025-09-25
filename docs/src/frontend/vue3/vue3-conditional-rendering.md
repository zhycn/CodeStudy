# Vue3 条件渲染详解与最佳实践

> 本文基于 Vue3 官方文档及10+篇优质技术文章深度总结，提供最准确的条件渲染指南

## 1. 条件渲染基础指令

### 1.1 v-if 指令

`v-if` 是 Vue 中最基础的条件渲染指令，根据表达式的真假值来控制元素的渲染：

```vue
<template>
  <div>
    <h1 v-if="isVisible">Hello Vue 3!</h1>
    <button @click="toggleVisibility">Toggle</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isVisible = ref(true);

function toggleVisibility() {
  isVisible.value = !isVisible.value;
}
</script>
```

### 1.2 v-else 指令

`v-else` 必须紧跟在 `v-if` 或 `v-else-if` 元素后面，表示 "否则" 的情况：

```vue
<template>
  <div>
    <p v-if="isLoggedIn">Welcome back, user!</p>
    <p v-else>Please log in to continue.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isLoggedIn = ref(false);
</script>
```

### 1.3 v-else-if 指令

用于链式条件判断，可以处理多个互斥条件：

```vue
<template>
  <div>
    <p v-if="score >= 90">Grade: A</p>
    <p v-else-if="score >= 80">Grade: B</p>
    <p v-else-if="score >= 70">Grade: C</p>
    <p v-else>Grade: D</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const score = ref(85);
</script>
```

## 2. v-if 与 v-show 深度对比

### 2.1 渲染机制区别

| 特性         | v-if                        | v-show                  |
| ------------ | --------------------------- | ----------------------- |
| **DOM 操作** | 条件为假时移除 DOM 元素     | 仅切换 CSS display 属性 |
| **初始渲染** | 惰性渲染（条件为真才渲染）  | 无论条件如何都渲染      |
| **切换开销** | 较高的切换开销              | 较低的切换开销          |
| **编译过程** | 有条件的块（可配合 v-else） | 仅简单切换显示/隐藏     |

### 2.2 使用场景建议

- 使用 `v-if` 当：
  - 条件很少改变时
  - 需要完全销毁/重建组件时
  - 组件包含重量级资源（如视频播放器）
- 使用 `v-show` 当：
  - 需要频繁切换显示状态（如选项卡切换）
  - 初始渲染成本较高但需要快速切换时

```vue
<template>
  <div>
    <!-- 适合使用 v-if -->
    <ExpensiveComponent v-if="showExpensive" />

    <!-- 适合使用 v-show -->
    <div v-show="activeTab === 'settings'">Settings Panel</div>
  </div>
</template>
```

## 3. 在 `<template>` 上使用条件渲染

当需要控制多个元素时，可以使用 `<template>` 作为不可见的包裹元素：

```vue
<template>
  <div>
    <template v-if="isAdmin">
      <AdminPanel />
      <UserList />
      <AuditLog />
    </template>
    <template v-else>
      <UserDashboard />
      <NotificationCenter />
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isAdmin = ref(true);
</script>
```

## 4. 条件渲染最佳实践

### 4.1 性能优化策略

**避免大型组件的频繁切换：**

```vue
<template>
  <!-- 不推荐：大组件频繁切换性能差 -->
  <HeavyComponent v-if="showHeavy" />

  <!-- 推荐：使用 v-show 替代 -->
  <HeavyComponent v-show="showHeavy" />
</template>
```

**使用 keep-alive 保存状态：**

```vue
<template>
  <keep-alive>
    <component :is="currentComponent" />
  </keep-alive>
</template>
```

### 4.2 可读性与维护性

**避免深层嵌套条件：**

```vue
<template>
  <!-- 不推荐：深层嵌套难以阅读 -->
  <div v-if="isLoaded">
    <div v-if="hasData">
      <div v-if="isValid">
        <!-- ... -->
      </div>
    </div>
  </div>

  <!-- 推荐：使用计算属性简化 -->
  <div v-if="shouldShowContent">
    <!-- ... -->
  </div>
</template>

<script setup>
import { computed } from 'vue';

const shouldShowContent = computed(() => {
  return isLoaded.value && hasData.value && isValid.value;
});
</script>
```

**使用策略对象替代复杂条件链：**

```vue
<template>
  <div>
    {{ statusMessages[status] }}
  </div>
</template>

<script setup>
import { ref } from 'vue';

const status = ref('loading');

const statusMessages = {
  loading: 'Loading data...',
  success: 'Data loaded successfully!',
  error: 'Error loading data',
  empty: 'No data available',
};
</script>
```

### 4.3 动画过渡效果

为条件渲染添加平滑的过渡动画：

```vue
<template>
  <div>
    <Transition name="fade" mode="out-in">
      <div v-if="show" key="content">
        <!-- 内容 -->
      </div>
      <div v-else key="placeholder">Loading...</div>
    </Transition>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

## 5. 常见问题与解决方案

### 5.1 元素复用导致状态丢失

当 Vue 复用相同类型的元素时，可能导致状态意外保留：

```vue
<template>
  <div>
    <!-- 输入框切换时会保留输入内容 -->
    <input v-if="isEmailLogin" placeholder="Email" key="email" />
    <input v-else placeholder="Username" key="username" />
  </div>
</template>
```

> **解决方案：** 添加唯一的 `key` 属性强制重新渲染

### 5.2 v-if 与 v-for 优先级问题

避免在同一元素上同时使用 `v-if` 和 `v-for`：

```vue
<template>
  <!-- 不推荐 -->
  <li v-for="item in items" v-if="item.isActive">
    {{ item.name }}
  </li>

  <!-- 推荐方案1：使用计算属性过滤 -->
  <li v-for="item in activeItems" :key="item.id">
    {{ item.name }}
  </li>

  <!-- 推荐方案2：使用 <template> 包裹 -->
  <template v-for="item in items" :key="item.id">
    <li v-if="item.isActive">
      {{ item.name }}
    </li>
  </template>
</template>

<script setup>
import { computed } from 'vue';

const items = ref([...]);

// 推荐方案1
const activeItems = computed(() =>
  items.value.filter(item => item.isActive)
);
</script>
```

## 6. 高级模式与技巧

### 6.1 组件级别条件渲染

```vue
<template>
  <div>
    <template v-if="featureFlags.newDashboard">
      <NewDashboard />
    </template>
    <template v-else>
      <LegacyDashboard />
    </template>
  </div>
</template>
```

### 6.2 条件插槽内容

```vue
<!-- ParentComponent.vue -->
<template>
  <ChildComponent>
    <template v-slot:header v-if="showHeader">
      <h1>Custom Header</h1>
    </template>
  </ChildComponent>
</template>

<!-- ChildComponent.vue -->
<template>
  <div>
    <slot name="header">
      <h2>Default Header</h2>
    </slot>
    <!-- 其他内容 -->
  </div>
</template>
```

## 7. 总结

Vue3 条件渲染是构建动态界面的核心功能，正确使用条件指令可以显著提升应用性能与用户体验：

1. **基础指令选择**：
   - 优先使用 `v-if` 处理不频繁切换的条件
   - 频繁切换时使用 `v-show` 优化性能

2. **性能关键点**：
   - 避免大型组件的频繁挂载/卸载
   - 使用 `key` 属性控制元素复用
   - 利用 `keep-alive` 保存组件状态

3. **代码质量**：
   - 避免深层嵌套条件逻辑
   - 使用计算属性简化复杂条件
   - 分离 `v-if` 和 `v-for` 的使用

4. **高级模式**：
   - 组件级别条件渲染实现功能切换
   - 条件插槽提供灵活的内容分发

> 最佳实践：根据实际场景选择渲染策略，在初始加载成本和切换开销之间找到平衡点

**参考资源**：

- <https://vuejs.org/guide/essentials/conditional.html>
- <https://www.vuemastery.com/blog/vue-conditional-rendering/>
- <https://vueschool.io/lessons/vuejs-conditionals-v-if-v-else-v-else-if-and-v-show>
