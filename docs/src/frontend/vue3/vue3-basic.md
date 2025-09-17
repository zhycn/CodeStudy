# Vue3 基础语法详解与最佳实践

> 本文基于 Vue 3.4+ 版本编写，结合官方文档和社区最佳实践，涵盖 Vue3 核心语法与开发技巧

## 引言：为什么选择 Vue3？

Vue.js 是一个**渐进式 JavaScript 框架**，其核心库专注于视图层，易于集成到现有项目中。Vue3 于 2020 年发布，带来了：

- ⚡ **性能提升**：更快的渲染速度和更小的包体积
- 🧩 **组合式 API**：更好的逻辑复用与代码组织
- 🛠 **更好的 TypeScript 支持**：完整的类型推导
- 🌐 **更灵活的响应式系统**：基于 Proxy 的响应式实现
- 🔧 **模块化架构**：核心功能可独立使用

## 一、环境搭建与项目创建

### 1.1 使用 Vite 创建项目（推荐）

```bash
npm create vue@latest
# 或
yarn create vue
# 或
pnpm create vue
```

选择所需功能后安装依赖：

```bash
cd your-project-name
npm install
npm run dev
```

### 1.2 使用 Vue CLI（传统方式）

```bash
npm install -g @vue/cli
vue create my-project
# 选择 Vue 3 预设
```

## 二、核心语法与响应式基础

### 2.1 模板语法

```html
<template>
  <div>
    <!-- 文本插值 -->
    <p>{{ message }}</p>
    
    <!-- 原始 HTML -->
    <p v-html="rawHtml"></p>
    
    <!-- 属性绑定 -->
    <a :href="url">Vue 官网</a>
    
    <!-- JavaScript 表达式 -->
    <p>{{ reversedMessage }}</p>
  </div>
</template>
```

### 2.2 响应式基础：ref 与 reactive

```javascript
import { ref, reactive } from 'vue'

export default {
  setup() {
    // 基本类型使用 ref
    const count = ref(0)
    
    // 对象类型使用 reactive
    const user = reactive({
      name: 'John',
      age: 30
    })
    
    // 修改 ref 值
    count.value++  // 注意需要 .value
    
    // 修改 reactive 对象
    user.age = 31
    
    return {
      count,
      user
    }
  }
}
```

### 2.3 计算属性

```javascript
import { computed, reactive } from 'vue'

const state = reactive({
  firstName: 'John',
  lastName: 'Doe'
})

const fullName = computed(() => {
  return `${state.firstName} ${state.lastName}`
})
```

### 2.4 侦听器

```javascript
import { ref, watch } from 'vue'

const count = ref(0)

// 基本侦听
watch(count, (newValue, oldValue) => {
  console.log(`计数从 ${oldValue} 变为 ${newValue}`)
})

// 深度侦听对象
const user = ref({ name: 'Alice' })
watch(user, (newValue) => {
  console.log('用户信息变化', newValue)
}, { deep: true })
```

## 三、条件渲染与列表渲染

### 3.1 条件渲染

```html
<template>
  <div>
    <p v-if="score > 90">优秀</p>
    <p v-else-if="score > 60">及格</p>
    <p v-else>不及格</p>
    
    <h1 v-show="isVisible">条件显示内容</h1>
  </div>
</template>
```

### 3.2 列表渲染

```html
<template>
  <ul>
    <!-- 遍历数组 -->
    <li v-for="(item, index) in items" :key="item.id">
      {{ index + 1 }}. {{ item.name }}
    </li>
    
    <!-- 遍历对象 -->
    <li v-for="(value, key) in userInfo" :key="key">
      {{ key }}: {{ value }}
    </li>
  </ul>
</template>
```

## 四、表单输入绑定

```html
<template>
  <form @submit.prevent="handleSubmit">
    <!-- 文本输入 -->
    <input v-model="username" placeholder="用户名">
    
    <!-- 多行文本 -->
    <textarea v-model="bio"></textarea>
    
    <!-- 复选框 -->
    <input type="checkbox" v-model="agree" id="agree">
    <label for="agree">我同意条款</label>
    
    <!-- 单选按钮 -->
    <input type="radio" v-model="gender" value="male"> 男
    <input type="radio" v-model="gender" value="female"> 女
    
    <!-- 下拉选择 -->
    <select v-model="selectedCity">
      <option v-for="city in cities" :key="city.id" :value="city">
        {{ city.name }}
      </option>
    </select>
    
    <button type="submit">提交</button>
  </form>
</template>
```

## 五、组件基础

### 5.1 组件定义与使用

```javascript
// ChildComponent.vue
<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  count: Number
})

const emit = defineEmits(['updateCount'])

function increment() {
  emit('updateCount', 5)
}
</script>

<template>
  <div class="child">
    <h2>{{ title }}</h2>
    <p>计数: {{ count }}</p>
    <button @click="increment">增加</button>
  </div>
</template>
```

```html
<!-- ParentComponent.vue -->
<template>
  <ChildComponent 
    title="子组件示例" 
    :count="parentCount"
    @update-count="handleUpdate"
  />
</template>

<script setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const parentCount = ref(10)

function handleUpdate(value) {
  parentCount.value += value
}
</script>
```

### 5.2 插槽（Slots）

```html
<!-- BaseLayout.vue -->
<template>
  <div class="container">
    <header>
      <slot name="header"></slot>
    </header>
    <main>
      <slot></slot>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<!-- 使用 -->
<BaseLayout>
  <template #header>
    <h1>页面标题</h1>
  </template>
  
  <p>主要内容区域</p>
  
  <template #footer>
    <p>© 2023</p>
  </template>
</BaseLayout>
```

## 六、组合式 API 深度解析

### 6.1 setup 语法糖

```html
<script setup>
// 自动暴露所有顶层变量
import { ref, onMounted } from 'vue'

const count = ref(0)

// 生命周期钩子
onMounted(() => {
  console.log('组件已挂载')
})

// 函数
function increment() {
  count.value++
}

// 使用 defineProps 和 defineEmits
const props = defineProps(['initialCount'])
const emit = defineEmits(['countChange'])
</script>
```

### 6.2 逻辑复用：组合式函数

```javascript
// useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const double = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  function decrement() {
    count.value--
  }
  
  return {
    count,
    double,
    increment,
    decrement
  }
}
```

```html
<!-- 在组件中使用 -->
<script setup>
import { useCounter } from './useCounter'

const { count, increment } = useCounter(10)
</script>
```

### 6.3 依赖注入（provide/inject）

```javascript
// 父组件
import { provide, ref } from 'vue'

const theme = ref('dark')

provide('theme', {
  theme,
  toggleTheme: () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
})

// 子组件
import { inject } from 'vue'

const { theme, toggleTheme } = inject('theme')
```

## 七、最佳实践与性能优化

### 7.1 性能优化技巧

1. **合理使用 v-once**

   ```html
   <span v-once>静态内容{{ willNotChange }}</span>
   ```

2. **虚拟滚动处理长列表**

   ```bash
   npm install vue-virtual-scroller
   ```

3. **组件懒加载**

   ```javascript
   import { defineAsyncComponent } from 'vue'
   
   const AsyncComp = defineAsyncComponent(() => 
     import('./components/HeavyComponent.vue')
   )
   ```

### 7.2 代码组织规范

1. **组件文件结构**

   ```
   components/
   ├─ BaseButton.vue
   ├─ BaseCard/
   │  ├─ BaseCard.vue
   │  ├─ BaseCardHeader.vue
   │  └─ BaseCardFooter.vue
   ```

2. **推荐的单文件组件顺序**

   ```html
   <template>...</template>
   
   <script setup>
   /* 组合式 API */
   </script>
   
   <style scoped>
   /* 组件样式 */
   </style>
   ```

### 7.3 安全最佳实践

1. **避免使用 v-html 处理用户输入**

   ```html
   <!-- 危险！ -->
   <div v-html="userProvidedContent"></div>
   ```

2. **服务端渲染(SSR)时的安全考虑**

   ```javascript
   // 使用 vue-server-renderer 的 createRenderer 时
   const renderer = createRenderer({
     template,
     runInNewContext: false, // 避免潜在的安全问题
   })
   ```

## 八、常见问题与解决方案

### 8.1 响应式数据不更新？

- **数组变更检测**：

  ```javascript
  // 错误方式
  state.items[0] = newValue
  
  // 正确方式
  state.items.splice(0, 1, newValue)
  ```

- **对象属性添加**：

  ```javascript
  // 错误方式
  state.user.age = 30
  
  // 正确方式
  state.user = {...state.user, age: 30}
  ```

### 8.2 生命周期钩子使用指南

| Vue2 选项式 API | Vue3 组合式 API       | 执行时机               |
|----------------|---------------------|----------------------|
| beforeCreate   | 无直接替代           | 在实例初始化之后调用       |
| created        | 无直接替代           | 在实例创建完成后调用       |
| beforeMount    | onBeforeMount       | 在挂载开始之前调用        |
| mounted        | onMounted           | 在实例挂载完成后调用       |
| beforeUpdate   | onBeforeUpdate      | 在数据变化DOM更新前调用    |
| updated        | onUpdated           | 在数据变化DOM更新后调用    |
| beforeUnmount  | onBeforeUnmount     | 在实例卸载之前调用        |
| unmounted      | onUnmounted         | 在实例卸载之后调用        |

## 九、总结

Vue3 通过组合式 API 提供了更灵活、更强大的代码组织能力，同时保持了 Vue 一贯的易用性特点。掌握 Vue3 的基础语法和最佳实践将帮助你：

1. 构建高性能的前端应用
2. 创建可维护性强的代码结构
3. 实现高效的逻辑复用
4. 轻松应对各种复杂业务场景

**官方资源推荐**：

- <https://vuejs.org/>
- <https://www.vuemastery.com/>
- <https://vueschool.io/>
- <https://vue-china.org/>

> 本教程示例代码均可在 Vue 3.4+ 环境中直接运行，建议结合官方文档实践练习

## 附录：Vue 3 生态工具推荐

| 工具名称       | 用途                     | 链接                      |
|---------------|-------------------------|--------------------------|
| Pinia         | 状态管理库                | <https://pinia.vuejs.org/> |
| Vue Router    | 官方路由管理器             | <https://router.vuejs.org/> |
| Vite          | 下一代前端构建工具          | <https://vitejs.dev/>      |
| Vitest        | Vue 组件测试框架           | <https://vitest.dev/>      |
| VueUse        | Vue 组合式工具集合         | <https://vueuse.org/>      |
| Element Plus  | 桌面端组件库              | <https://element-plus.org/> |
| Volar         | Vue IDE 支持              | <https://marketplace.visualstudio.com/items?itemName=Vue.volar> |
