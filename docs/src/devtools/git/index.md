# Git 全面指南

Git 是一个分布式版本控制系统，用于跟踪文件的变化并协调多个开发者之间的协作。它由 Linus Torvalds 于 2005 年创建，初衷是为了管理 Linux 内核的开发。
相较于常用的版本控制工具如 CVS、SVN 等，Git 采用分布式版本库的方式，无需服务器端软件支持。

- Git 官方网站: <https://git-scm.com/>
- 可视化学习：<https://learngitbranching.js.org/>
- `.gitattributes` 文件使用模板参考：<https://github.com/gitattributes/gitattributes>
- `.gitignore` 文件使用模板参考：<https://github.com/github/gitignore>

## 文档目录

_以下是一系列 Git 学习教程，涵盖安装配置、工作流程、分支管理等多方面内容，帮助你系统学习 Git 版本控制。_

- [Git 全面指南：核心概念详解与最佳实践](./git-introduction.md)
- [Git 安装与配置详解与最佳实践](./git-installation.md)
- [Git 工作流程详解与最佳实践](./git-workflow.md)
- [Git 分支与合并详解与最佳实践](./git-branching.md)
- [Git 标签与版本管理详解与最佳实践](./git-tags.md)
- [Git 版本追溯与还原详解与最佳实践](./git-reset-revert.md)
- [Git 工作区、暂存区和版本库详解与最佳实践](./git-working-area.md)
- [Git 远程仓库详解与最佳实践](./git-remote.md)
- [Git 子模块与依赖管理详解与最佳实践](./git-submodules.md)
- [Git 钩子（Hooks）与自定义脚本详解与最佳实践](./git-hooks.md)
- [Git 性能优化与配置详解与最佳实践](./git-performance.md)
- [Git .git 目录结构详解与最佳实践](./git-directory.md)
- [Git 常用命令清单详解与最佳实践](./git-commands.md)
- [Git .gitignore 文件详解与最佳实践](./git-gitignore.md)
- [Git .gitattributes 文件详解与最佳实践](./git-gitattributes.md)

## 图形化工具

_Git 图形化工具通过可视化界面简化了版本控制操作，降低了 Git 的学习曲线，提高了开发效率。_

- [SourceTree](https://www.sourcetreeapp.com/) - 支持多平台的功能强大 Git 客户端，集成可视化操作界面，支持 SSH 和 HTTPS 协议，适合团队协作。
- [GitKraken](https://www.gitkraken.com/) - 跨平台的 Git 客户端，拥有直观的可视化界面，支持多种版本控制系统，能清晰展示 Git 仓库历史。
- [GitHub Desktop](https://desktop.github.com/) - 专为 GitHub 仓库设计的简单易用 Git 客户端，与 GitHub 无缝集成，方便管理仓库和提交代码。
- [TortoiseGit](https://tortoisegit.org/) - 基于 Windows 的右键菜单式 Git 客户端，提供可视化界面操作，对 Windows 用户友好，适合新手使用。
- [GitGUI](https://git-scm.com/downloads/guis) - Git 自带的简单易用图形界面工具，适合初学者快速上手基础的 Git 操作。
- [SmartGit](https://www.syntevo.com/smartgit/) - 跨平台的功能强大 Git 客户端，支持多种版本控制系统，具备高级合并和冲突解决功能。

**IDE 插件**

- [Visual Studio Code](https://code.visualstudio.com/) 插件: GitLens - 增强 VS Code 的 Git 功能，显示代码作者信息、提交历史等，提高开发效率。
- [Visual Studio Code](https://code.visualstudio.com/) 插件: Git Graph - 以图形化方式展示 Git 仓库历史，方便查看分支和提交信息。
- [IntelliJ IDEA](https://www.jetbrains.com/idea/) 插件: Git Integration - 深度集成在 IDEA 中的 Git 工具，方便在开发环境内完成版本控制操作。
- [Eclipse](https://www.eclipse.org/) 插件: EGit - Eclipse 平台的 Git 集成插件，支持在 Eclipse 中进行 Git 操作，管理项目版本。
- [NetBeans](https://netbeans.apache.org/) 插件: Git - NetBeans 提供的 Git 插件，让开发者在 IDE 内就能进行版本控制操作。
- [Atom](https://atom.io/) 插件: git-plus - 增强 Atom 的 Git 功能，支持在编辑器内直接执行各种 Git 命令。
- [Sublime Text](https://www.sublimetext.com/) 插件: GitGutter - 在 Sublime Text 中显示文件修改标记，快速查看代码修改状态。

## 代码托管平台

_代码托管平台为开发者提供了存储、管理和共享代码的空间，支持团队协作开发，部分平台还集成了 CI/CD、项目管理等功能。_

- [GitHub](https://github.com/) - 全球最大的开源代码托管平台，拥有丰富的开源项目资源，支持 CI/CD 等自动化流程，深受开发者喜爱。
- [GitLab](https://gitlab.com/) - 提供强大的 DevOps 工具链，支持自托管部署，注重代码安全和协作，适合企业级项目开发。
- [Bitbucket](https://bitbucket.org/) - 对小型团队免费，支持 Mercurial 和 Git 两种版本控制系统，与 Jira 等 Atlassian 工具集成良好。
- [Gitee](https://gitee.com/) - 国内知名的代码托管平台，访问速度快，对中文用户友好，适合国内团队和个人开发者使用，支持私有仓库免费创建。
- [Coding](https://coding.net/) - 一站式软件研发管理平台，除代码托管外，还提供项目管理、测试、部署等全流程服务，助力团队高效协作。
