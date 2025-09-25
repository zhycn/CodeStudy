好的，请看下面为您生成的关于 Vue 3 路由的详尽技术文档。

---

# Vue 3 路由详解与最佳实践

本文档将深入探讨 Vue.js 3 的官方路由库 —— Vue Router 4。它将从基础概念讲起，逐步深入到高级用法、最佳实践以及常见问题的解决方案，旨在帮助开发者全面掌握并在项目中高效地使用 Vue Router。

## 1. 核心概念与基础用法

Vue Router 是 Vue.js 的官方路由管理器。它与 Vue.js 的核心深度集成，让构建单页面应用（SPA）变得轻而易举。

### 1.1 安装与设置

**安装**：

通过 npm 或 yarn 安装 Vue Router 4（专为 Vue 3 设计）。

```bash
npm install vue-router@4
```

**基础配置**：

在项目中，通常创建一个单独的路由模块（`router/index.js`）。

```javascript
// 1. 导入必要的 API
import { createRouter, createWebHistory } from 'vue-router';

// 2. 定义路由组件
// 建议使用懒加载，详见后续章节
import HomeView from '../views/HomeView.vue';
const AboutView = () => import('../views/AboutView.vue'); // 懒加载

// 3. 定义路由配置
const routes = [
  {
    path: '/',
    name: 'home', // 命名路由，用于编程式导航，非常有用
    component: HomeView,
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
  // 动态路由匹配
  {
    path: '/user/:id',
    name: 'user',
    component: () => import('../views/UserView.vue'),
  },
];

// 4. 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式
  history: createWebHistory(process.env.BASE_URL),
  routes, // `routes: routes` 的简写
});

// 5. 导出路由实例，以便在 main.js 中使用
export default router;
```

**挂载到 Vue 实例**：

在 `main.js` 中，将路由实例挂载到根 Vue 实例上。

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // 自动导入 ./router/index.js

const app = createApp(App);

app.use(router); // 使用路由插件

app.mount('#app');
```

### 1.2 路由视图与导航

**路由出口 (`<router-view>`)**：

`<router-view>` 是一个 functional component，它根据当前路由路径渲染对应的组件。它通常放在 `App.vue` 中。

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link> | <router-link to="/about">About</router-link> |
      <router-link :to="{ name: 'user', params: { id: 123 } }">User 123</router-link>
    </nav>
    <!-- 路由匹配到的组件将渲染在这里 -->
    <router-view />
  </div>
</template>
```

**导航链接 (`<router-link>`)**：

`<router-link>` 用于创建导航链接，它默认渲染为一个 `<a>` 标签。比起手动使用 `<a href="...">`，它的主要优点包括：

- **活动类名自动应用**：当链接指向的路由被激活时，会自动应用 `.router-link-active` 和 `.router-link-exact-active` 类，方便你设置样式。
- **智能的哈希模式处理**。
- **不重新加载页面的内部导航**。

**编程式导航**：

除了使用 `<router-link>`，你还可以在组件内部通过 `this.$router` 访问路由实例，从而通过代码控制导航。

```vue
<template>
  <button @click="goToAbout">Go to About</button>
  <button @click="goBack">Go Back</button>
</template>

<script>
export default {
  methods: {
    goToAbout() {
      // 使用路由名称和参数（如果需要）
      this.$router.push({ name: 'about' });
      // 等价于 this.$router.push('/about')
    },
    goBack() {
      // 模拟浏览器后退
      this.$router.go(-1);
      // 或者使用 this.$router.back()
    },
  },
};
</script>
```

在 `setup()` 函数或 `<script setup>` 中，你需要使用 `useRouter` 和 `useRoute` 组合式函数。

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute(); // 当前路由对象，包含 params, query 等信息

const navigate = () => {
  // 跳转到用户 123 页面
  router.push({ name: 'user', params: { id: 123 } });
};

// 获取当前路由的参数
const userId = route.params.id;
</script>
```

## 2. 进阶特性与用法

### 2.1 动态路由与参数捕获

你可以使用冒号 `:` 来定义动态路径参数。

```javascript
const routes = [
  // 匹配 /user/1, /user/abc 等
  { path: '/user/:id', component: User },
  // 可以匹配多个参数 /user/123/posts/456
  { path: '/user/:userId/posts/:postId', component: Post },
  // 可选参数 /users 和 /users/admin
  { path: '/users/:role?', component: Users },
  // 使用正则匹配 /user/123 （只匹配数字）
  { path: '/user/:id(\\d+)', component: User },
];
```

在组件中，可以通过 `$route.params` 访问这些参数。

```vue
<template>
  <div>User ID: {{ $route.params.id }}</div>
</template>

<script>
export default {
  // 使用选项式 API 监听参数变化
  watch: {
    '$route.params.id'(newId, oldId) {
      // 对路由变化做出响应，例如重新获取用户数据
      this.fetchUserData(newId);
    },
  },
  methods: {
    fetchUserData(id) {
      // ... 获取数据
    },
  },
};
</script>
```

或者在组合式 API 中：

```vue
<script setup>
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 在 mounted 时获取数据
onMounted(() => {
  fetchUserData(route.params.id);
});

// 监听参数变化
watch(
  () => route.params.id,
  (newId) => {
    fetchUserData(newId);
  }
);

function fetchUserData(id) {
  // ... 获取数据
}
</script>
```

### 2.2 嵌套路由 (Nested Routes)

大多数应用的用户界面都是由多层嵌套的组件构成。使用嵌套路由配置可以很好地表达这种结构。

**配置**：

在路由配置中使用 `children` 字段。

```javascript
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      // UserProfile 将被渲染在 User 的 <router-view> 中
      // 当匹配 /user/:id/profile
      { path: 'profile', component: UserProfile },
      // 当匹配 /user/:id/posts
      { path: 'posts', component: UserPosts },
      // 默认子路由，当 /user/:id 时渲染
      { path: '', component: UserDashboard },
    ],
  },
];
```

**父组件 (`User.vue`)**：

父组件需要一个 `<router-view>` 来渲染嵌套的子组件。

```vue
<template>
  <div class="user">
    <h2>User {{ $route.params.id }}</h2>
    <!-- 这里是嵌套路由的出口 -->
    <router-view />
  </div>
</template>
```

### 2.3 导航守卫 (Navigation Guards)

导航守卫主要用于通过跳转或取消的方式守卫导航，常用于权限控制和数据预取。

**全局前置守卫 (`router.beforeEach`)**：

```javascript
// 通常在 router/index.js 中定义
router.beforeEach((to, from) => {
  // ...
  // return false 取消导航
  // return undefined | void 继续导航
  // return 一个路由地址 (字符串或对象)
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 此路由需要授权，检查用户是否已登录
    // 如果没有，则重定向到登录页面
    return {
      path: '/login',
      // 保存我们所在的位置，以便以后再来
      query: { redirect: to.fullPath },
    };
  }
});
```

**路由独享的守卫 (`beforeEnter`)**：

```javascript
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: { requiresAuth: true },
    beforeEnter: (to, from) => {
      // 仅在此路由上生效
      // 拒绝任何非管理员用户的访问
      if (!userIsAdmin()) {
        return { path: '/forbidden' };
      }
    },
  },
];
```

**组件内的守卫**：

你可以在组件内直接定义路由导航守卫。

```vue
<script>
export default {
  beforeRouteEnter(to, from) {
    // 在渲染该组件的对应路由被验证前调用
    // 不能获取组件实例 `this`！
  },
  beforeRouteUpdate(to, from) {
    // 在当前路由改变，但是该组件被复用时调用
    // 例如，对于一个带有动态参数的路径 `/user/:id`，在 `/user/1` 和 `/user/2` 之间跳转的时候
    // 可以访问组件实例 `this`
    this.fetchData(to.params.id);
  },
  beforeRouteLeave(to, from) {
    // 在导航离开渲染该组件的对应路由时调用
    // 可以访问组件实例 `this`
    const answer = window.confirm('真的要离开吗？有未保存的更改哦！');
    if (!answer) return false; // 取消导航
  },
};
</script>
```

在 `setup()` 中，可以使用 `onBeforeRouteUpdate` 和 `onBeforeRouteLeave` 组合式函数。

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

onBeforeRouteUpdate(async (to, from) => {
  // 仅当 id 改变时才重新获取数据
  if (to.params.id !== from.params.id) {
    userData.value = await fetchUserData(to.params.id);
  }
});

onBeforeRouteLeave((to, from) => {
  const answer = window.confirm('真的要离开吗？有未保存的更改哦！');
  if (!answer) return false;
});
</script>
```

### 2.4 路由元信息 (Meta Fields) 与过渡动效

**元信息**：

你可以使用 `meta` 字段为路由添加自定义信息，例如权限标识、页面标题等。

```javascript
const routes = [
  {
    path: '/posts',
    component: Posts,
    meta: { requiresAuth: true, title: 'Posts Page' },
  },
];

// 在全局守卫中访问
router.beforeEach((to, from) => {
  document.title = to.meta.title || 'My Default App Title';
  // ...
});
```

**过渡动效**：

`<router-view>` 是一个动态组件，你可以用 `<transition>` 或 `<transition-group>` 组件给它添加一些过渡效果。

```vue
<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style scoped>
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

## 3. 最佳实践与性能优化

### 3.1 路由懒加载 (Lazy Loading)

这是最重要的性能优化实践之一。它通过代码分割将不同路由对应的组件分割成不同的代码块，当路由被访问的时候才加载对应组件，极大提升应用的初始加载速度。

**使用 `import()` 动态导入**：

```javascript
// 将
// import UserDetails from './views/UserDetails.vue'
// 替换成
const UserDetails = () => import('./views/UserDetails.vue')

const router = createRouter({
  routes: [
    { path: '/users/:id', component: UserDetails }
    // 或者内联定义
    { path: '/about', component: () => import('./views/AboutView.vue') }
  ]
})
```

**使用 webpack 魔法注释分组**：

你可以将多个页面分组到同一个异步块（chunk）中。

```javascript
// 将以下路由组件打包到同一个 chunk 中
const UserDetails = () => import(/* webpackChunkName: "group-user" */ './UserDetails.vue');
const UserDashboard = () => import(/* webpackChunkName: "group-user" */ './UserDashboard.vue');
const UserProfileEdit = () => import(/* webpackChunkName: "group-user" */ './UserProfileEdit.vue');
```

### 3.2 模块化路由配置

对于大型项目，将所有路由定义放在一个文件中会变得难以维护。建议将路由配置模块化。

```bash
src/router/
├── index.js          # 主路由入口，创建和导出 router 实例
├── routes.js         # 集中式的路由配置（可选，适用于中小项目）
└── modules/          # 模块化路由目录（推荐用于大项目）
    ├── admin.js      # 管理后台相关路由
    ├── auth.js       # 认证相关路由
    └── products.js   # 产品相关路由
```

**示例 (`router/modules/products.js`)**：

```javascript
const routes = [
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/Products/Index.vue'),
  },
  {
    path: '/products/:id',
    name: 'product-detail',
    component: () => import('@/views/Products/Detail.vue'),
  },
];

export default routes;
```

**在主路由文件中合并 (`router/index.js`)**：

```javascript
import { createRouter, createWebHistory } from 'vue-router';
import adminRoutes from './modules/admin';
import authRoutes from './modules/auth';
import productRoutes from './modules/products';

// 合并路由
const routes = [
  ...adminRoutes,
  ...authRoutes,
  ...productRoutes,
  // 别忘了可能还有根路由和404路由
  { path: '/', redirect: '/home' },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
```

### 3.3 滚动行为 (Scroll Behavior)

你可以让页面在导航后滚动到特定位置，或者恢复到之前的滚动位置，就像重新加载页面一样。

```javascript
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果存在保存的位置，则恢复（例如使用浏览器的前进/后退）
    if (savedPosition) {
      return savedPosition;
    }
    // 滚动到锚点
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth', // 平滑滚动
      };
    }
    // 默认滚动到页面顶部
    return { top: 0, left: 0 };
  },
});
```

### 3.4 数据获取策略

在导航进入路由时，有两种主要的数据获取方式：

1. **导航完成后获取**：先导航和渲染组件，然后在组件的生命周期钩子（如 `onMounted`）中获取数据。缺点是数据加载期间无法给用户任何提示。
2. **导航完成前获取**：在路由进入的守卫（如 `beforeRouteEnter`）中获取数据，数据获取完成后再进行导航。能提供更好的用户体验，但实现稍复杂。

**推荐做法**：

- 对于非关键数据或加载速度很快的数据，使用第一种方式。
- 对于关键数据，使用第二种方式，并配合加载状态或进度条显示。

## 4. 常见问题与解决方案 (FAQ)

**Q: 如何捕获 404 未匹配路由？**

A: 添加一个捕获所有路由的规则，通常放在路由配置的最后一项。

```javascript
{
  path: '/:pathMatch(.*)*', // Vue Router 4 的语法
  name: 'NotFound',
  component: () => import('@/views/NotFound.vue')
}
```

**Q: `$route` 和 `$router` 有什么区别？**

A:

- `$route` 是**当前路由对象**，是只读的，包含 `path`, `params`, `query`, `hash` 等路径信息。
- `$router` 是**路由实例**，是可用的方法集合，用于编程式导航（如 `push`, `replace`, `go`）。

**Q: 如何从 `<script setup>` 中访问路由？**

A: 使用 `useRouter` 和 `useRoute` 组合式函数。

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router';

const router = useRouter(); // 用于导航
const route = useRoute(); // 用于获取当前路由信息 (只读)

const userId = route.params.id;
function navigate() {
  router.push('/home');
}
</script>
```

**Q: 如何监听路由参数变化？**

A: 使用 `watch` 监听 `route` 对象或特定的 `route.params.xxx`。

```javascript
// 选项式 API
watch: {
  '$route.params.id'(newId) {
    this.fetchData(newId)
  }
}

// 组合式 API
import { watch } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
watch(
  () => route.params.id,
  (newId) => {
    fetchData(newId)
  }
)
```

## 5. 总结

Vue Router 4 是一个功能强大且高度可定制的路由库，完美契合 Vue 3 的生态。通过掌握其核心概念（路由、视图、导航）、进阶特性（守卫、元信息、懒加载）并遵循模块化、性能优化的最佳实践，你可以构建出结构清晰、用户体验卓越的单页面应用程序。

---

**参考资源**：

- <https://router.vuejs.org/zh/>
- <https://cn.vuejs.org/guide/scaling-up/routing.html>
- <https://www.vuemastery.com/courses/vue-router-4-for-everyone/intro-to-vue-router-4>

**延伸阅读**：

- <https://github.com/vuejs/router>
- <https://router.vuejs.org/zh/guide/advanced/navigation-failures.html>

希望这份文档能成为你 Vue 3 路由之旅的得力助手！
