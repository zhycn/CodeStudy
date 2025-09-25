好的，作为一名 Vue3 技术专家和文档工程师，我将为您生成一篇关于 Vue3 计算属性的详尽指南。本文融合了官方文档的核心思想与社区公认的最佳实践，旨在提供一份清晰、实用且深度优化的学习资料。

---

# Vue3 计算属性详解与最佳实践

## 1. 什么是计算属性？

计算属性 (Computed Properties) 是 Vue 组件中一个非常重要的概念。它是一种基于组件响应式状态（如 `ref`, `reactive` 或其他 `computed`）进行复杂逻辑计算并返回一个新值的声明式方式。

**核心价值**：计算属性旨在解决模板内表达式过于复杂的问题。模板内的表达式应当简洁明了，放入过多的逻辑会让模板变得难以维护。

## 2. 为什么需要计算属性？一个简单的对比

假设我们有一个 `firstName` 和 `lastName`，我们想在模板中显示全名。

**不使用计算属性 (Bad Practice):**

```vue
<template>
  <div>
    <p>Full Name: {{ firstName + ' ' + lastName }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const firstName = ref('张');
const lastName = ref('三');
</script>
```

- **问题**：逻辑虽然简单，但如果拼接规则更复杂（如中间名、称谓等），模板会变得臃肿且难以复用。

**使用方法 (Not Ideal):**

```vue
<template>
  <div>
    <p>Full Name: {{ getFullName() }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const firstName = ref('张');
const lastName = ref('三');

const getFullName = () => {
  return `${firstName.value} ${lastName.value}`;
};
</script>
```

- **问题**：每次组件更新时，**方法都会重新执行**，即使依赖的 `firstName` 和 `lastName` 没有改变。这在计算开销很大时会导致不必要的性能浪费。

**使用计算属性 (Best Practice):**

```vue
<template>
  <div>
    <p>Full Name: {{ fullName }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
const firstName = ref('张');
const lastName = ref('三');

const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});
</script>
```

- **优势**：计算属性 `fullName` 会基于其响应式依赖 (`firstName.value`, `lastName.value`) 进行**缓存**。只有当依赖发生变化时，计算函数才会重新执行。否则，多次访问 `fullName` 将立即返回之前的计算结果。

## 3. 计算属性的基本用法

### 3.1 在 `setup()` 中使用 (Composition API)

在 `<script setup>` 中，你需要先从 `vue` 中导入 `computed` 函数。

**语法：** `const myComputed = computed(() => { /* 计算逻辑 */ })`

```vue
<template>
  <div>
    <input v-model="price" type="number" />
    <input v-model="quantity" type="number" />
    <p>总价: {{ totalPrice }}</p>
    <p>含税价 (10%): {{ taxedTotal }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const price = ref(100);
const quantity = ref(2);

// 一个计算属性，依赖 price 和 quantity
const totalPrice = computed(() => {
  return price.value * quantity.value;
});

// 计算属性可以依赖另一个计算属性
const taxedTotal = computed(() => {
  return totalPrice.value * 1.1; // 增加 10% 的税
});
</script>
```

### 3.2 在 Options API 中使用

在 Options API 中，计算属性被定义在 `computed` 选项中。

```vue
<template>
  <!-- 与上面相同 -->
</template>

<script>
export default {
  data() {
    return {
      price: 100,
      quantity: 2,
    };
  },
  computed: {
    totalPrice() {
      return this.price * this.quantity;
    },
    taxedTotal() {
      return this.totalPrice * 1.1;
    },
  },
};
</script>
```

## 4. 可写的计算属性

计算属性默认是只读的。但你可以通过提供 `get` 和 `set` 函数来创建一个可写的计算属性。

**场景**：当你需要创建一个可以双向绑定的计算属性时（例如，使用 `v-model`）。

```vue
<template>
  <div>
    <p>FirstName: <input v-model="firstName" /></p>
    <p>LastName: <input v-model="lastName" /></p>
    <!-- 关键：这里可以直接用 v-model 绑定一个计算属性 -->
    <p>FullName: <input v-model="fullName" /></p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const firstName = ref('张');
const lastName = ref('三');

const fullName = computed({
  // getter：读取时，返回拼接后的全名
  get() {
    return `${firstName.value} ${lastName.value}`;
  },
  // setter：写入时，解析并更新依赖项
  set(newValue) {
    // 注意：这是一个简单的示例，实际解析逻辑可能更复杂
    const names = newValue.split(' ');
    firstName.value = names[0] || '';
    lastName.value = names[names.length - 1] || '';
  },
});
</script>
```

在这个例子中，当你在 `FullName` 的输入框中修改内容时，`set` 函数会被调用，从而分解新值并更新 `firstName` 和 `lastName`。

## 5. 计算属性 vs 方法

| 特性           | 计算属性 (Computed)                                        | 方法 (Methods)                                                 |
| :------------- | :--------------------------------------------------------- | :------------------------------------------------------------- |
| **缓存**       | ✅ **有缓存**。依赖未变化时，直接返回缓存值。              | ❌ **无缓存**。每次调用都会执行函数。                          |
| **使用场景**   | 派生状态，**同步计算**，性能敏感的操作（如过滤大型列表）。 | 事件处理，**需要重新执行**的逻辑（如提交表单），**异步操作**。 |
| **模板语法**   | `{{ propertyName }}`                                       | `{{ methodName() }}`                                           |
| **响应式依赖** | 自动追踪，依赖变化则重新计算。                             | 不会自动追踪，除非在模板中调用并使用了响应式数据。             |

**关键抉择**：如果你需要的是一个**派生数据**（如格式化日期、过滤列表、计算总和），并且这个计算有一定开销，那么**计算属性是更好的选择**。如果你不关心缓存或者逻辑中包含异步操作，则使用方法。

## 6. 计算属性 vs 侦听器

| 特性         | 计算属性 (Computed)                          | 侦听器 (Watchers)                                                  |
| :----------- | :------------------------------------------- | :----------------------------------------------------------------- |
| **目的**     | 声明一个依赖其他属性的**派生值**。           | 在状态变化时执行**副作用**（如请求 API、操作 DOM、执行异步任务）。 |
| **返回值**   | **必须返回一个值**，这个值用于模板或代码中。 | **不返回值**，通常用于执行一系列操作。                             |
| **异步支持** | ❌ 计算函数必须是同步的。                    | ✅ 完美支持异步操作。                                              |
| **适用性**   | 适用于大多数派生状态场景。                   | 适用于响应变化执行操作，而非产生新值。                             |

**关键抉择**：当你想要基于一些现有状态计算出一个新值时，使用**计算属性**。当你需要在状态变化后执行一些操作（特别是异步操作）时，使用**侦听器**。

## 7. 最佳实践与常见陷阱

1. **计算属性应是纯函数且无副作用**
   - **正确**：计算属性的函数应该只进行计算并返回结果。不要在其中执行异步请求、修改 DOM 或改变其他状态。
   - **错误**：

     ```javascript
     const badComputed = computed(() => {
       // ❌ 不要在计算属性中做这些！
       fetch('...'); // 副作用
       document.title = '...'; // 副作用
       otherValue.value++; // 副作用 (修改依赖)
       return ...;
     });
     ```

2. **避免直接修改计算属性值**
   - 除非你明确提供了 `setter`，否则直接给计算属性赋值是无效的，Vue 会在开发环境下发出警告。

3. **计算属性依赖必须在响应式系统内**
   - 计算属性只会追踪在其执行期间被访问的响应式依赖。如果依赖是在条件分支或异步回调中访问的，它可能无法被正确追踪。
   - **错误示例**：

     ```javascript
     const maybe = ref(true);
     const data = ref(1);
     const problematic = computed(() => {
       if (maybe.value) {
         // 如果 maybe.value 后来变为 false，
         // data.value 将不再被追踪为依赖！
         return data.value;
       }
       return 0;
     });
     ```

4. **对于大型列表或昂贵计算，计算属性是性能优化的利器**
   - 由于其缓存特性，在渲染中多次使用 `{{ expensiveComputed }}` 比使用 `{{ expensiveMethod() }}` 的性能要好得多。

5. **使用计算属性进行数据格式化**
   - 将复杂的显示逻辑封装在计算属性中，使模板保持干净和声明式。

   ```javascript
   // 代替在模板中写 {{ new Date(user.birthday).toLocaleDateString() }}
   const formattedBirthday = computed(() => {
     return new Date(props.user.birthday).toLocaleDateString();
   });
   ```

## 8. 总结

计算属性是 Vue 响应式系统的核心支柱之一。它通过其**声明式**的创建方式和**智能的缓存机制**，极大地提升了代码的可读性、可维护性和性能。

| 场景                                 | 推荐工具                |
| :----------------------------------- | :---------------------- |
| **根据状态派生新值**                 | **`computed`**          |
| **响应变化执行副作用（特别是异步）** | `watch` / `watchEffect` |
| **事件处理或需要每次执行的逻辑**     | `methods`               |

熟练掌握计算属性，是编写高质量、高性能 Vue.js 应用程序的关键一步。
