import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'CodeStudy',
  description: '系统化整合编程指南、精选书单、视频课程与效率工具，打造高效学习和工作路径。',
  lang: 'zh-CN',
  base: '/CodeStudy/',
  srcDir: './src',
  lastUpdated: true,
  // appearance: 'dark', // 默认深色模式
  // head: [
  //   ['link', { rel: 'icon', href: '/favicon.ico' }],
  //   ['meta', { name: 'theme-color', content: '#3eaf7c' }]
  // ],

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
              closeText: '关闭'
            }
          }
        },
        // detailedView: true // 显示详细搜索结果
      }
    },

    // 优化的导航菜单
    nav: [
      { text: '首页', link: '/', activeMatch: '/' },
      // { text: '学习指南', link: '/guides/', activeMatch: '/guides/' },
      // { text: '书单推荐', link: '/books/', activeMatch: '/books/' },
      // { text: '工具资源', link: '/tools/', activeMatch: '/tools/' },
      // { text: '视频课程', link: '/courses/', activeMatch: '/courses/' }
    ],

    // 自动生成的侧边栏
    sidebar: {
      // '/guides/': [
      //   {
      //     text: '编程基础',
      //     // collapsed: false,
      //     items: [
      //       { text: '数据结构', link: '/guides/data-structures' },
      //       { text: '算法入门', link: '/guides/algorithms' }
      //     ]
      //   },
      //   {
      //     text: '前端开发',
      //     // collapsed: true,
      //     items: [
      //       { text: 'JavaScript 精要', link: '/guides/javascript' },
      //       { text: 'Vue 实战技巧', link: '/guides/vue' }
      //     ]
      //   }
      // ],
      // '/books/': [
      //   {
      //     text: '推荐书单',
      //     items: [
      //       { text: '年度最佳技术书籍', link: '/books/top' },
      //       { text: '前端开发必读', link: '/books/frontend' }
      //     ]
      //   }
      // ]
    },

    // 增强的社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zhycn/CodeStudy' }
    ],

    // 新增功能配置
    editLink: {
      pattern: 'https://github.com/zhycn/CodeStudy/edit/main/docs/src/:path',
      text: '在 GitHub 上编辑此页'
    },
    
    outline: {
      level: [1, 2],
      label: '本页目录'
    },
    
    docFooter: {
      prev: '上一节',
      next: '下一节'
    },
    
    footer: {
      message: '基于 MIT 许可发布',
      copyright: `版权所有 © 2023-${new Date().getFullYear()} CodeStudy`
    },
    
    darkModeSwitchLabel: '主题切换',
    returnToTopLabel: '返回顶部',
    lastUpdatedText: '最后更新',
    sidebarMenuLabel: '菜单'
  },
  
  markdown: {
    theme: 'material-theme-palenight',
    lineNumbers: true,
    toc: { level: [2, 3] }
  }
});