---
title: Homebrew 详解与最佳实践
description: 了解 Homebrew 的基本概念、安装方法、常用命令以及最佳实践，帮助您高效管理 macOS 和 Linux 系统上的软件包。
---

# Homebrew 详解与最佳实践

Homebrew 官网：<https://brew.sh/zh-cn/>

## 1. Homebrew简介与概述

Homebrew（简称 brew）是 **macOS** 和 **Linux** 系统上**最流行的包管理工具**，它能够简化软件安装流程，支持自动处理依赖关系，并提供便捷的更新、卸载功能。Homebrew 的出现**彻底改变**了在 macOS 上安装和管理软件的方式，为开发者提供了类似 Linux 包管理器的便捷体验。

### 1.1 Homebrew 的核心优势

Homebrew 的设计哲学是"简单、灵活、强大"，它具有以下显著优势：

- **自动化依赖解决**：自动安装和管理软件包的依赖关系，无需手动处理
- **隔离的安装环境**：将软件安装在独立前缀目录中（默认为 `/usr/local`），避免与系统文件冲突
- **纯净卸载**：彻底移除软件包及其相关依赖，不留残余文件
- **滚动更新**：支持随时更新到最新版本，保持开发环境与时俱进
- **开源透明**：所有 Formula 都是开源的，可以审查安装内容及方式

### 1.2 Homebrew 的工作原理

Homebrew 通过称为 **Formula** 的 Ruby 脚本定义软件包的编译和安装规则。Formula 包含了软件的基本信息、依赖关系、编译选项和安装步骤。当执行 `brew install` 命令时，Homebrew 会：

1. 自动更新 Formula 列表（除非明确跳过）
2. 解析软件包及其所有依赖关系
3. 下载源代码或预编译的二进制包（称为 bottle）
4. 编译源代码或解压二进制包（优先使用二进制包以节省时间）
5. 将软件安装到独立目录中并创建符号链接到系统路径
6. 运行安装后检测和配置

### 1.3 Homebrew 与传统安装方式的区别

与传统下载 dmg/pkg 文件手动安装的方式相比，Homebrew 提供了以下优势：

| 特性           | 传统安装方式   | Homebrew |
| -------------- | -------------- | -------- |
| **依赖管理**   | 需要手动处理   | 自动解决 |
| **软件更新**   | 需要逐个检查   | 统一更新 |
| **卸载清理**   | 往往有文件残留 | 彻底清理 |
| **多版本管理** | 复杂且容易冲突 | 简单支持 |
| **自动化程度** | 完全手动       | 可脚本化 |

## 2. 安装与配置

### 2.1 系统要求与前置准备

在安装 Homebrew 之前，请确保您的系统满足以下基本要求：

- **macOS**：10.14 (Mojave) 或更高版本（推荐）
- **Linux**：主流发行版（Ubuntu、Debian、CentOS 等），需安装 GCC 5.0+ 和 glibc 2.13+
- **命令行工具**：Xcode Command Line Tools（macOS）或 build-essential（Linux）

### 2.2 安装 Homebrew

#### macOS 系统安装

打开终端应用程序，执行官方的一键安装脚本：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

安装过程中可能会提示您输入密码，并解释 Homebrew 将执行的操作。安装完成后，按照终端提示将 Homebrew 路径添加到环境变量中。

#### Linux 系统安装

Linux 上的安装过程类似，但可能需要先安装一些依赖项：

```bash
# Ubuntu/Debian系统
sudo apt update
sudo apt install build-essential curl file git
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2.3 配置国内镜像源（加速访问）

由于 Homebrew 默认从 GitHub 下载资源，国内用户可能会遇到速度慢的问题。配置国内镜像源可以显著提升下载速度。

#### 使用清华大学镜像源

```bash
# 替换brew.git
git -C "$(brew --repo)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git

# 替换homebrew-core.git
git -C "$(brew --repo homebrew/core)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git

# 配置bottles预编译包（对于bash用户）
echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles' >> ~/.bash_profile
source ~/.bash_profile

# 配置bottles预编译包（对于zsh用户）
echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles' >> ~/.zshrc
source ~/.zshrc
```

#### 使用阿里云镜像源

```bash
# 替换brew.git
cd "$(brew --repo)"
git remote set-url origin https://mirrors.aliyun.com/homebrew/brew.git

# 替换homebrew-core.git
cd "$(brew --repo)/Library/Taps/homebrew/homebrew-core"
git remote set-url origin https://mirrors.aliyun.com/homebrew/homebrew-core.git

# 配置bottles环境变量
echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.aliyun.com/homebrew-bottles' >> ~/.bash_profile
source ~/.bash_profile
```

#### 重置为官方源

如果需要恢复官方源，可以执行以下命令：

```bash
# 重置brew.git
git -C "$(brew --repo)" remote set-url origin https://github.com/Homebrew/brew.git

# 重置homebrew-core.git
git -C "$(brew --repo homebrew/core)" remote set-url origin https://github.com/Homebrew/homebrew-core.git

# 删除镜像源环境变量设置（从shell配置文件中移除相应行）
sed -i '' '/HOMEBREW_BOTTLE_DOMAIN/d' ~/.bash_profile
sed -i '' '/HOMEBREW_BOTTLE_DOMAIN/d' ~/.zshrc
```

### 2.4 常用环境变量设置

通过配置环境变量，可以调整 Homebrew 的默认行为：

```bash
# 在shell配置文件(~/.bashrc, ~/.zshrc等)中添加以下配置

# 不自动更新（在脚本中使用时推荐）
export HOMEBREW_NO_AUTO_UPDATE=1

# 使用详细输出模式，显示更多调试信息
export HOMEBREW_VERBOSE=1

# 禁用 analytics 数据收集
export HOMEBREW_NO_ANALYTICS=1

# 指定安装时使用的最大并行编译作业数
export HOMEBREW_MAKE_JOBS=4
```

完成配置后，执行 `source ~/.bashrc` 或 `source ~/.zshrc` 使配置立即生效。

## 3. 核心概念解析

要高效使用 Homebrew，首先需要理解其核心概念和组件之间的关系。这些概念构成了 Homebrew 架构的基础，帮助用户更好地组织和管理软件包。

### 3.1 Formula（公式）

**Formula** 是 Homebrew 最基本的组成单元，它是用 Ruby 语言编写的脚本，描述了如何编译和安装一个软件包。每个 Formula 对应一个软件项目，包含以下信息：

- 软件名称、描述、版本和许可证信息
- 软件的 Homepage URL
- 软件的依赖关系
- 软件的编译安装步骤
- 软件的平台兼容性信息

Formula 文件存储在 Homebrew 的 Tap 仓库中，默认情况下，Homebrew 使用官方的 homebrew/core Tap 作为主要 Formula 来源。

查看 Formula 内容的命令：

```bash
brew cat git  # 查看 git Formula 的内容
brew edit git  # 编辑 git Formula（高级用户）
```

### 3.2 Cask（macOS 应用）

**Cask** 是 Homebrew 的扩展，用于安装和管理 macOS 图形界面应用程序。与 Formula 主要针对命令行工具不同，Cask 专注于图形应用，如浏览器、编辑器和开发工具。

Cask 的特点包括：

- 安装 macOS 应用程序 (.app 文件)
- 将应用移动到 `/Applications` 目录（默认）
- 管理应用程序的多个版本
- 处理应用程序的预编译二进制包

使用 Cask 安装应用程序：

```bash
brew install --cask google-chrome  # 安装 Google Chrome 浏览器
```

### 3.3 Tap（第三方仓库）

**Tap** 是第三方的 Formula 或 Cask 仓库，用于扩展 Homebrew 的软件包来源。当官方仓库没有某个软件或需要特定版本时，可以通过 Tap 添加额外的仓库源。

Tap 的使用示例：

```bash
brew tap heroku/brew        # 添加 Heroku CLI 的 Tap
brew install heroku         # 安装 Heroku CLI
brew untap heroku/brew      # 移除 Heroku Tap
```

常用 Tap 仓库：

- `homebrew/cask-versions`：提供软件的历史版本
- `homebrew/cask-drivers`：提供外设驱动相关软件
- `homebrew/services`：提供服务管理功能

### 3.4 Keg（安装目录）

**Keg** 是软件包安装的目录，通常位于 `/usr/local/Cellar` 下，每个软件有自己独立的子目录。Keg 的名称通常遵循 `软件名/版本号` 的格式，如 `/usr/local/Cellar/git/2.30.0`。

这种设计使得多个版本可以共存，Homebrew 通过符号链接将当前激活版本的二进制文件链接到 `/usr/local/bin` 和 `/usr/local/lib` 等目录。

### 3.5 不同软件包类型的对比

下表总结了 Homebrew 中不同类型的软件包的特点：

| 类型        | 安装目标     | 安装位置                            | 示例命令                      |
| ----------- | ------------ | ----------------------------------- | ----------------------------- |
| **Formula** | 命令行工具   | `/usr/local/Cellar`                 | `brew install git`            |
| **Cask**    | GUI 应用程序 | `/Applications`                     | `brew install --cask firefox` |
| **Tap**     | 扩展仓库     | `$(brew --repository)/Library/Taps` | `brew tap user/repo`          |

理解这些核心概念有助于更好地组织和管理通过 Homebrew 安装的软件，并在遇到问题时能够更准确地定位和解决。

## 4. 基础命令使用指南

Homebrew 提供了一系列简单易记的命令，让用户能够高效地管理软件包。本节将详细介绍最常用和实用的命令，帮助您快速掌握日常使用技巧。

### 4.1 软件包管理

#### 搜索软件包

在安装前，可以先搜索是否有需要的软件包：

```bash
brew search python      # 搜索包含"python"关键词的包
brew search /py.*3/     # 使用正则表达式搜索
```

#### 安装软件包

安装软件包的基本命令，Homebrew 会自动处理依赖关系：

```bash
brew install git        # 安装最新版git
brew install git@2.30   # 安装指定版本的git
brew install tree wget  # 一次性安装多个软件包
```

#### 卸载软件包

当不再需要某个软件包时，可以彻底卸载它：

```bash
brew uninstall git      # 卸载git软件包
brew uninstall --force git  # 强制卸载，包括所有版本
```

#### 查看已安装的软件包

列出所有通过 Homebrew 安装的软件包：

```bash
brew list              # 简要列出已安装的包
brew list --versions   # 列出已安装的包及其版本
brew leaves            # 列出显式安装的包（排除依赖）
```

### 4.2 Cask 应用管理

#### 安装 GUI 应用程序

使用 Cask 可以轻松安装 macOS 图形界面应用程序：

```bash
brew install --cask google-chrome  # 安装 Chrome 浏览器
brew install --cask visual-studio-code # 安装 VS Code
```

#### 管理应用程序

Cask 应用程序的管理与 Formula 类似：

```bash
brew list --cask       # 列出所有通过 Cask 安装的应用
brew uninstall --cask google-chrome  # 卸载 Chrome 浏览器
```

### 4.3 更新与升级

保持 Homebrew 和软件包最新是维护系统安全稳定的重要环节。

#### 更新 Homebrew 自身

```bash
brew update           # 更新 Homebrew 自身和 Formula 列表
```

#### 升级软件包

```bash
brew upgrade          # 升级所有可更新的软件包
brew upgrade git      # 仅升级git软件包
brew upgrade --cask   # 升级所有 Cask 应用
```

#### 检查过时的软件包

在升级前，可以先检查哪些软件包需要更新：

```bash
brew outdated         # 查看所有过时的软件包
brew outdated --cask  # 查看所有过时的 Cask 应用
```

### 4.4 查询与诊断

#### 查看软件包信息

获取软件包的详细信息，包括版本、依赖和注意事项等：

```bash
brew info git         # 显示 git 包的详细信息
brew info --cask google-chrome  # 显示 Chrome 应用的详细信息
```

#### 诊断 Homebrew 问题

当遇到问题时，可以使用 doctor 命令进行诊断：

```bash
brew doctor           # 检查系统是否存在潜在问题
```

doctor 命令会检查常见问题，如系统配置、路径设置和权限问题，并给出解决建议。

#### 检查依赖关系

了解软件包之间的依赖关系：

```bash
brew deps git         # 查看 git 包的依赖
brew deps --tree --installed  # 以树形结构查看已安装包的依赖
```

### 4.5 常用命令速查表

下表总结了最常用的 Homebrew 命令及其功能：

| 命令             | 功能描述         | 示例                   |
| ---------------- | ---------------- | ---------------------- |
| `brew install`   | 安装软件包       | `brew install git`     |
| `brew uninstall` | 卸载软件包       | `brew uninstall git`   |
| `brew list`      | 列出已安装的包   | `brew list --versions` |
| `brew search`    | 搜索软件包       | `brew search python`   |
| `brew update`    | 更新Homebrew自身 | `brew update`          |
| `brew upgrade`   | 升级软件包       | `brew upgrade git`     |
| `brew outdated`  | 查看过时的包     | `brew outdated`        |
| `brew info`      | 查看包信息       | `brew info git`        |
| `brew doctor`    | 诊断问题         | `brew doctor`          |
| `brew cleanup`   | 清理旧版本       | `brew cleanup`         |

这些基础命令涵盖了 Homebrew 的日常使用需求，熟练掌握它们将大大提高软件管理效率。

## 5. 高级用法与最佳实践

掌握了 Homebrew 的基础用法后，进一步了解其高级特性和最佳实践可以帮助您更高效、安全地管理开发环境。本节将介绍一些提升使用体验的技巧和方法。

### 5.1 Tap 扩展与自定义仓库

除了官方仓库，Homebrew 允许用户添加第三方仓库（Tap）来扩展软件包来源。

#### 管理 Tap 仓库

```bash
# 添加常用Tap
brew tap homebrew/cask-versions  # 允许安装软件的历史版本
brew tap homebrew/cask-drivers   # 添加外设驱动相关软件

# 查看已添加的Tap
brew tap

# 移除Tap
brew untap homebrew/cask-versions
```

#### 安装历史版本软件

通过 homebrew/cask-versions Tap 可以安装特定版本软件：

```bash
brew install python@3.8          # 安装Python 3.8
brew install --cask firefox-developer-edition  # 安装Firefox开发者版
```

### 5.2 服务管理

Homebrew Services 可以管理后台服务，类似于 Linux 系统中的 systemctl。

#### 常用服务管理命令

```bash
brew services list              # 列出所有服务状态
brew services start mysql       # 启动MySQL服务
brew services stop mysql        # 停止MySQL服务
brew services restart mysql     # 重启MySQL服务
brew services run mysql         # 运行服务但不设置开机自启
```

#### 设置开机自启

```bash
brew services start mysql       # 启动并设置开机自动启动MySQL
```

### 5.3 批量操作与脚本化

Homebrew 支持批量操作，适合自动化脚本中使用。

#### 批量安装软件包

```bash
# 一次性安装多个软件包
brew install git tree wget node@16

# 通过文件批量安装
brew install $(cat brew_packages.txt)
```

#### 导出和导入已安装包列表

```bash
# 导出显式安装的包列表（不包括依赖）
brew leaves > brew_packages.txt

# 导出所有已安装包（包括Cask应用）
brew bundle dump --describe --file="Brewfile"

# 从Brewfile安装所有包
brew bundle --file="Brewfile"
```

### 5.4 环境隔离与多版本管理

#### 使用环境变量和命令包装器

Homebrew 提供了 env 和 cmd 命令来管理不同环境：

```bash
brew env python@3.8    # 查看Python 3.8的环境变量
brew cmd python@3.8    # 获取Python 3.8的命令路径
```

#### 切换软件版本

对于安装了多个版本的软件，可以切换默认版本：

```bash
brew unlink python@3.9
brew link python@3.8 --force
```

### 5.5 高级查询与筛选

#### 使用 JSON 格式输出

Homebrew 支持 JSON 格式输出，便于脚本处理：

```bash
brew info --json=v1 git     # 以 JSON 格式输出 git 信息
brew list --json=v1         # 以 JSON 格式列出已安装包
```

#### 复杂查询与筛选

```bash
# 查找提供特定命令的包
brew provides tree          # 查找哪个包提供 tree 命令

# 查看包的使用分析
brew uses --installed git   # 查看已安装包中哪些依赖 git
```

### 5.6 权限管理与安全最佳实践

#### 避免使用 sudo

Homebrew 设计为不需要 sudo 权限，正确设置权限可避免安全问题：

```bash
# 修复权限问题（如果需要）
sudo chown -R $(whoami) $(brew --prefix)/*
```

#### 审核软件包安全性

在安装第三方 Tap 中的软件前，最好先审核其安全性：

```bash
brew audit git              # 审核 git 包的安全性
```

### 5.7 清理与空间优化

定期清理可以节省磁盘空间，保持系统整洁。

#### 清理旧版本和缓存

```bash
brew cleanup                # 清理所有旧版本
brew cleanup git            # 仅清理git的旧版本
brew cleanup -s             # 清理下载缓存
brew cleanup --prune=all    # 彻底清理所有缓存和旧版本
```

#### 查看磁盘使用情况

```bash
brew cleanup -n             # 预览哪些内容将被清理
brew disk-usage             # 查看Homebrew的磁盘使用情况
```

### 5.8 故障排除与调试

当遇到问题时，可以使用调试模式获取更多信息。

#### 启用详细输出

```bash
brew install -v git         # 显示详细安装信息
brew install -d git         # 调试模式（显示详细信息）
```

#### 查看安装日志

每个软件的安装日志保存在：

```bash
ls $(brew --repository)/Library/Logs/Homebrew
```

通过这些高级用法和最佳实践，您可以更加高效地使用 Homebrew 管理开发环境，确保系统的整洁和安全，同时提高工作效率。

## 6. 常见问题与解决方案

即使 Homebrew 设计得十分友好，在使用过程中仍可能会遇到一些问题。本节将针对常见问题提供解决方案，帮助您快速恢复工作流程。

### 6.1 安装与更新故障

#### 问题1：安装时出现权限错误

**现象**：执行 brew 命令时出现 "Permission denied" 错误。
**解决方案**：

```bash
# 修复 Homebrew 目录的权限
sudo chown -R $(whoami) $(brew --prefix)/*
```

#### 问题2：更新 Homebrew 时速度缓慢

**现象**：执行 `brew update` 时耗时过长或失败。
**解决方案**：

```bash
# 使用国内镜像源加速（参考前面镜像配置部分）
# 或者使用代理（如果可用）
export http_proxy="http://127.0.0.1:1087"
export https_proxy="http://127.0.0.1:1087"
```

### 6.2 网络与下载问题

#### 问题3：下载 bottles 时连接超时

**现象**：下载软件预编译包时速度慢或失败。
**解决方案**：

```bash
# 配置 Homebrew bottles 国内镜像源
echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.ustc.edu.cn/homebrew-bottles' >> ~/.zshrc
source ~/.zshrc
```

#### 问题4：Git操作超时

**现象**：在执行 `brew update` 时 Git 克隆操作超时。
**解决方案**：

```bash
# 增大 Git 缓冲区大小
git config --global http.postBuffer 1048576000

# 或使用SSH替代HTTPS（需要配置SSH密钥）
cd "$(brew --repo)"
git remote set-url origin git@github.com:Homebrew/brew.git
```

### 6.3 依赖与冲突解决

#### 问题5：软件包依赖冲突

**现象**：安装软件时出现依赖版本冲突错误。
**解决方案**：

```bash
# 查看冲突详情
brew deps --tree <formula>

# 尝试安装特定版本
brew install <formula>@<version>

# 或者先卸载冲突的包再重新安装
brew uninstall <conflicting-formula>
brew install <formula>
```

#### 问题6：链接（link）冲突

**现象**：安装软件时出现"Could not symlink"错误。
**解决方案**：

```bash
# 方案1：删除冲突文件（谨慎操作）
sudo rm -f /usr/local/bin/<conflicting-file>

# 方案2：跳过冲突链接（推荐）
brew link --overwrite <formula>

# 方案3：强制链接（可能覆盖系统文件，慎用）
brew link --force <formula>
```

### 6.4 常见问题速查表

下表总结了常见问题及解决方法：

| 问题现象              | 可能原因        | 解决方案                                     |
| --------------------- | --------------- | -------------------------------------------- |
| **Permission denied** | 权限设置错误    | `sudo chown -R $(whoami) $(brew --prefix)/*` |
| **下载速度慢**        | 网络连接问题    | 配置国内镜像源或使用代理                     |
| **更新失败**          | GitHub 连接问题 | 检查网络连接或手动更新                       |
| **依赖冲突**          | 版本不兼容      | 安装特定版本或解决冲突                       |
| **链接冲突**          | 文件已存在      | 删除冲突文件或强制链接                       |
| **命令不存在**        | 路径未配置      | 检查 shell 配置文件中的 PATH 设置            |

### 6.5 获取更多帮助

当遇到无法解决的问题时，可以寻求社区帮助：

1. **查看详细文档**：

   ```bash
   brew help
   man brew
   ```

2. **查看故障排除指南**：

   ```bash
   brew doctor  # 提供详细诊断信息
   ```

3. **查看 GitHub Issues**：访问 Homebrew 的 GitHub 仓库，查看是否有类似问题解决方案。

4. **提交新 Issue**：如果问题仍未解决，可以在 Homebrew 的 GitHub 仓库提交新 Issue，并提供详细错误信息。

通过掌握这些常见问题的解决方法，您可以更快地排除使用 Homebrew 时遇到的障碍，保持开发环境的高效稳定。

## 7. 总结与后续学习建议

通过本文的全面介绍，您应该已经对 Homebrew 有了深入的理解，并掌握了其核心概念、基础命令、高级用法和故障排除技巧。Homebrew 作为 macOS 和 Linux 系统上最流行的包管理器，极大地简化了软件安装和管理流程，是开发者和高级用户不可或缺的工具。

### 7.1 Homebrew 的核心价值

回顾 Homebrew 的核心优势：

1. **自动化依赖管理**：自动解决复杂的依赖关系，减少手动干预
2. **环境隔离**：将软件安装在独立目录中，避免与系统文件冲突
3. **统一管理**：通过单一命令行界面管理所有软件包，提高效率
4. **滚动更新**：随时获取最新软件版本，保持开发环境现代性
5. **社区生态**：丰富的 Formula 和 Cask 仓库，覆盖大多数常用软件

### 7.2 后续学习方向

为了进一步掌握 Homebrew 和相关技术，建议您探索以下方向：

#### 深入 Homebrew 高级特性

- **创建自定义 Formula**：学习为私有软件或内部工具创建自定义 Formula
- **Brewfile 高级用法**：掌握 Brewfile 的复杂用例，实现环境一键复现
- **Homebrew 内部机制**：深入了解 Homebrew 的工作原理和脚本编写方式

#### 相关工具和技术

- **Docker 与容器化**：了解容器技术如何与包管理器互补
- **版本管理工具**：学习使用 asdf、nvm 等专门化的版本管理工具
- **配置管理工具**：探索 Ansible、Chef 等配置管理工具的高级用法

#### 脚本化和自动化

- **Shell 脚本编程**：编写更复杂的安装和配置脚本
- **持续集成**：将 Homebrew 与 CI/CD 流程整合，自动化环境搭建

### 7.3 推荐资源

为了继续您的学习之旅，以下是一些优质资源推荐：

1. **官方文档**：[brew.sh](https://brew.sh/) - 最权威的参考指南
2. **GitHub 仓库**：[Homebrew/brew](https://github.com/Homebrew/brew) - 源码和 Issue 追踪
3. **Formula 文档**：[Homebrew Formulae](https://formulae.brew.sh/) - 官方 Formula 库
4. **社区论坛**：[Homebrew Discourse](https://discourse.brew.sh/) - 社区讨论和支持

### 7.4 结语

Homebrew 不仅是工具，更是一种哲学：追求简洁、高效和可重复的环境管理。掌握 Homebrew 不仅提高了软件管理效率，还培养了良好的开发习惯和环境意识。

随着技术的不断发展，Homebrew 也在持续进化。保持学习的心态，关注更新和最佳实践，将使您始终处于技术前沿。希望本文能为您打下坚实的基础，助您在开发道路上更加顺畅。
