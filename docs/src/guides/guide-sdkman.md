# SDKMAN! 的使用指南与最佳实践

官方网站：<https://sdkman.io/>

## 摘要

在现代软件开发中，尤其是在 JVM 生态系统中，开发者常常需要在不同的项目中切换使用不同版本的 Java、Maven、Gradle 等工具。手动管理这些工具的版本和环境变量是一项繁琐且容易出错的任务。**SDKMAN!** (The Software Development Kit Manager) 正是为了解决这一痛点而诞生的。

SDKMAN! 是一个强大的命令行工具，它可以在绝大多数基于 Unix 的系统上（包括 macOS、Linux 和 WSL）轻松管理多个版本的 SDK。本文将为你提供一份关于 SDKMAN! 的全面指南，从安装、常用命令到高级配置和最佳实践，帮助你完全掌握这个强大的开发利器。

## 1. 什么是 SDKMAN!？

SDKMAN! 是一个开源的工具，它提供了一个方便的命令行接口（CLI）来自动化以下任务：

- **安装和卸载：** 轻松安装各种 SDK，无需手动下载、解压和配置。
- **版本切换：** 在多个已安装的版本之间快速切换，满足不同项目的依赖需求。
- **版本管理：** 罗列已安装和可用的 SDK 版本，方便管理。
- **环境变量管理：** 自动处理 `PATH` 和 `JAVA_HOME` 等环境变量，告别手动配置的烦恼。

SDKMAN! 支持的“候选”SDK 种类繁多，不仅限于 Java，还包括 Groovy, Scala, Kotlin, Maven, Gradle, Spring Boot CLI, Vert.x 等等。

## 2. 准备工作与安装

在开始安装之前，请确保你的系统满足以下基本要求：

- **操作系统：** macOS、Linux 或 Windows Subsystem for Linux (WSL)。
- **Shell：** Bash、Zsh 或 Fish Shell。
- **工具：** `curl`, `zip`, `unzip`。这些通常在大多数系统上都是预装的。

### 2.1. 安装步骤

安装过程非常简单，只需要一个命令。打开你的终端，然后执行以下命令：

```bash
curl -s "https://get.sdkman.io" | bash
```

该脚本会下载并安装 SDKMAN! 的核心文件，并自动将必要的环境变量配置到你的 shell 配置文件中（如 `~/.bashrc` 或 `~/.zshrc`）。

**注意：** 如果你使用的是 `zsh`，并且安装了 `Oh My Zsh`，安装脚本会正确地将配置添加到 `~/.zshrc` 的末尾。

### 2.2. 验证安装

安装完成后，关闭并重新打开一个新终端，或者在当前终端中执行以下命令来加载配置：

```bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
```

然后，你可以运行以下命令来验证 SDKMAN! 是否安装成功：

```bash
sdk version
```

如果一切顺利，终端会显示 SDKMAN! 的版本信息，例如：

```bash
SDKMAN!
script: 5.19.0
native: 0.7.4 (macos x86_64)
```

## 3. 核心命令详解

SDKMAN! 的命令设计直观且易于记忆。以下是其最常用的一些核心命令。

### 3.1. `sdk list`：列出可用的 SDK

这是最常用的命令之一。它可以列出所有可用的 SDK 及其版本。

```bash
# 列出所有可用的 SDK 种类
sdk list

# 列出所有可用的 Java 版本
sdk list java

# 列出所有可用的 Maven 版本
sdk list maven
```

执行 `sdk list <candidate>` 命令后，你会看到一个详细的表格，其中包含了 SDK 的版本号、发行商以及是否为默认版本等信息。

### 3.2. `sdk install`：安装 SDK

使用 `sdk install` 命令可以轻松安装任何可用的 SDK。SDKMAN! 会自动处理下载、校验和解压，并将文件放置到 `$HOME/.sdkman/candidates/<candidate>/<version>` 目录下。

```bash
# 安装最新稳定版的 Gradle
sdk install gradle

# 安装特定版本的 Java，例如 Java 17 的 Zulu OpenJDK
sdk install java 17.0.8-zulu

# 安装特定版本的 Maven
sdk install maven 3.9.6
```

当你安装一个 SDK 时，SDKMAN! 会询问你是否将其设置为默认版本。选择 `Y` 或 `n`。

### 3.3. `sdk use`：切换版本（临时）

`sdk use` 命令用于在当前终端会话中临时切换到指定版本的 SDK。这对于在不同项目间快速测试不同版本非常有用。

```bash
# 在当前终端临时切换到 Java 11
sdk use java 11.0.21-zulu
```

此命令只会影响当前终端会话，当会话关闭后，`java` 命令会恢复到默认版本。

### 3.4. `sdk default`：设置默认版本（永久）

如果你想将某个版本的 SDK 设置为系统默认，即每次新开终端都使用该版本，可以使用 `sdk default` 命令。

```bash
# 将 Java 17 设置为永久默认
sdk default java 17.0.8-zulu
```

这个命令会修改 `~/.sdkman/candidates/<candidate>/current` 目录的软链接，使其指向你选择的版本。

### 3.5. `sdk current`：查看当前使用的版本

如果你不确定当前正在使用哪个版本的 SDK，可以使用 `sdk current` 命令。

```bash
# 查看当前正在使用的 Java 版本
sdk current java

# 查看当前正在使用的 Maven 版本
sdk current maven
```

### 3.6. `sdk uninstall`：卸载 SDK

当你不再需要某个版本的 SDK 时，可以使用 `sdk uninstall` 命令将其移除。

```bash
# 卸载 Java 11.0.21-zulu
sdk uninstall java 11.0.21-zulu
```

### 3.7. 其他常用命令

- `sdk help`: 查看所有可用命令。
- `sdk flush archives`: 清理下载的归档文件，释放磁盘空间。
- `sdk flush temp`: 清理临时文件。
- `sdk selfupdate`: 更新 SDKMAN! 自身到最新版本。

## 4. 高级配置与最佳实践

### 4.1. 自动切换版本（Auto-env）

SDKMAN! 提供了一个非常实用的功能，可以根据项目目录下的 `.sdkmanrc` 文件自动切换 SDK 版本。这对于团队协作和持续集成（CI）非常有用。

**启用自动切换：**

1. 打开 SDKMAN! 的配置文件：

   ```bash
   vim ~/.sdkman/etc/config
   ```

2. 找到 `sdkman_auto_env` 这一行，将其值从 `false` 修改为 `true`：

   ```ini
   sdkman_auto_env=true
   ```

**项目配置示例：**

在你的项目根目录下创建一个名为 `.sdkmanrc` 的文件，并添加如下内容：

```properties
# .sdkmanrc
java=21.0.2-tem
maven=3.9.6
```

当你在终端中进入这个目录时，SDKMAN! 会自动检测 `.sdkmanrc` 文件，并提示你是否切换到文件中定义的版本。

### 4.2. 在 IDE 中集成

如果你使用 IntelliJ IDEA、Eclipse 等 IDE，你可以将 SDKMAN! 安装的 SDK 集成到项目中。

**IntelliJ IDEA：**

1. 打开 `File` -> `Project Structure...` (`Ctrl+Alt+Shift+S`)。
2. 在左侧面板中选择 `SDKs`。
3. 点击 `+`，选择 `Add JDK...`。
4. 导航到 `$HOME/.sdkman/candidates/java/` 目录，选择你想要添加的 JDK 版本目录。
5. 点击 `OK`，IDE 会自动配置该 JDK。

### 4.3. 团队协作的最佳实践

在团队开发中，确保所有成员都使用相同的工具版本至关重要。

- **使用 `.sdkmanrc` 文件：** 将 `.sdkmanrc` 文件添加到你的项目版本控制中（例如 Git）。这确保了每个开发者进入项目目录时都能使用正确的 SDK 版本。
- **文档说明：** 在项目的 `README.md` 或开发指南中明确说明使用 SDKMAN! 管理 SDK，并提供 `.sdkmanrc` 文件的作用。
- **版本锁定：** 推荐在 `.sdkmanrc` 中锁定具体的版本号，而不是使用最新版本（`latest`），以避免不兼容的更新。

## 5. 常见问题与排查

- **SDKMAN! 命令找不到：** 这通常是因为环境变量没有正确加载。请确保你已经关闭并重新打开了终端，或者手动执行了 `source "$HOME/.sdkman/bin/sdkman-init.sh"`。
- **安装失败：** 检查你的网络连接，确保 `curl`, `zip`, `unzip` 等工具可用，并且你的系统有足够的磁盘空间。
- **`sdk list` 列表为空或不完整：** 这可能是网络问题导致无法连接到 SDKMAN! 的服务器。你可以尝试运行 `sdk selfupdate` 来更新 SDKMAN! 并重新同步列表。
- **在 Windows 上使用：** SDKMAN! 仅支持基于 Unix 的系统。如果你在 Windows 上，请使用 Windows Subsystem for Linux (WSL) 来安装和运行 SDKMAN!，它将提供最佳的体验。

## 总结

SDKMAN! 是一个高效、简洁且功能强大的工具，它极大地简化了 SDK 的安装和版本管理。通过使用 `sdk install`, `sdk use`, `sdk default` 等核心命令，并结合 `.sdkmanrc` 文件的最佳实践，你可以轻松地在不同项目之间切换，保持开发环境的整洁和一致性。掌握 SDKMAN!，你将告别繁琐的环境变量配置，让精力集中在更有价值的编码工作上。

现在，你已经掌握了 SDKMAN! 的精髓。不妨打开你的终端，开始享受它带来的便利吧！
