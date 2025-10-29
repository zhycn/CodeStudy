import { defineConfig } from 'vitepress';
import gitSidebar from './sidebar/git.mts';
import javaSidebar from './sidebar/java.mts';

export default defineConfig({
  // 站点级核心配置
  title: 'CodeStudy',
  description: '系统化整合编程指南、精选书单、视频课程与效率工具，打造高效学习和工作路径。',
  lang: 'zh-CN',
  base: '/CodeStudy/',
  srcDir: './src',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,
  sitemap: {
    hostname: 'https://zhycn.github.io/CodeStudy',
  },
  appearance: 'dark', // 默认深色模式
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'keywords', content: '编程,学习,文档,前端,Java,Spring,书单,课程' }],
    ['meta', { property: 'og:title', content: 'CodeStudy - 编程学习资源整合' }],
    ['meta', { property: 'og:description', content: '系统化整合编程指南、精选书单、视频课程与效率工具' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://zhycn.github.io/CodeStudy' }],
  ],

  themeConfig: {
    // logo: '/logo.svg', // 添加站点Logo
    // siteTitle: false, // 隐藏标题文本（用Logo替代）

    // 增强的本地搜索配置
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除查询',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
        // detailedView: true // 显示详细搜索结果
      },
    },

    // 优化的导航菜单
    nav: [
      { text: '首页', link: '/' },
      { text: '开发工具', link: '/devtools/', activeMatch: '/devtools/' },
      { text: 'Java', link: '/java/', activeMatch: '/java/' },
      { text: 'Spring', link: '/spring-boot/', activeMatch: '/spring-' },
      { text: '前端开发', link: '/frontend/', activeMatch: '/frontend/' },
      { text: '编程指南', link: '/guides/', activeMatch: '/guides/' },
      { text: 'Python3', link: '/python/python3/', activeMatch: '/python/python3/' },
      // { text: '书单推荐', link: '/books/', activeMatch: '/books/' },
      // { text: '视频课程', link: '/courses/', activeMatch: '/courses/' },
      // {
      //   text: '更多',
      //   items: [
      //     { text: '工具资源', link: '/tools/' },
      //     { text: '项目实践', link: '/projects/' },
      //     { text: '学习笔记', link: '/notes/' }
      //   ]
      // }
    ],

    // 自动生成的侧边栏
    sidebar: {
      '/java/': javaSidebar,
      '/devtools/git/': gitSidebar,
    },

    // 增强的社交链接
    socialLinks: [{ icon: 'github', link: 'https://github.com/zhycn/CodeStudy' }],

    // 新增功能配置
    editLink: {
      pattern: 'https://github.com/zhycn/CodeStudy/edit/main/docs/src/:path',
      text: '在 GitHub 上编辑此页',
    },

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    docFooter: {
      prev: '上一节',
      next: '下一节',
    },

    footer: {
      message: '基于 MIT 许可发布',
      copyright: `版权所有 © 2023-${new Date().getFullYear()} CodeStudy`,
    },

    darkModeSwitchLabel: '主题切换',
    returnToTopLabel: '返回顶部',
    lastUpdatedText: '最后更新',
    sidebarMenuLabel: '菜单',
  },

  markdown: {
    theme: 'material-theme-palenight',
    lineNumbers: true,
    toc: { level: [2, 3] },
  },
});
