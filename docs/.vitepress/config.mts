import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "CodeStudy​",
    description:
        "系统化整合编程指南、精选书单、视频课程与效率工具，打造个人的高效学习和工作路径。",
    lang: "zh-CN",
    base: "/CodeStudy/",
    srcDir: "./src",
    srcExclude: [],
    lastUpdated: true,
    themeConfig: {
        // 本地搜索
        search: {
            provider: "local",
            options: {
                translations: {
                    button: {
                        buttonText: "搜索文档",
                        buttonAriaLabel: "搜索文档",
                    },
                    modal: {
                        noResultsText: "无法找到相关结果",
                        resetButtonTitle: "清除查询条件",
                        footer: {
                            selectText: "选择",
                            navigateText: "切换",
                            closeText: "关闭",
                        },
                    },
                },
            },
        },
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "Home", link: "/" },
            { text: "Examples", link: "/markdown-examples" },
        ],

        sidebar: [
            {
                text: "Examples",
                items: [
                    { text: "Markdown Examples", link: "/markdown-examples" },
                    { text: "Runtime API Examples", link: "/api-examples" },
                ],
            },
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/zhycn/CodeStudy" },
        ],
    },
});
