# jenv 详解与最佳实践

## 1\. 简介：为什么需要 jenv？

对于 Java 开发者而言，处理多版本 JDK 的场景是家常便饭。一个项目可能依赖 JDK 8，另一个项目则需要最新的 JDK 17，而你的 CI/CD 流水线可能跑在 JDK 11 上。手动切换 `JAVA_HOME` 环境变量不仅繁琐，还容易出错，尤其是在不同的终端会话或项目中。

**jenv** 就是为了解决这个问题而生的。它是一个轻量级的命令行工具，专为管理多个 Java Development Kit (JDK) 版本而设计。与 **SDKMAN\!** 不同，jenv **不负责下载和安装 JDK**，它只专注于一件事：**优雅地管理和切换已安装的 JDK 版本**。

它的核心优势在于：

- **项目级版本管理**: 在特定项目目录下，jenv 可以自动切换到该项目指定的 JDK 版本，无需手动操作。
- **全局与局部**: 支持设置全局默认 JDK，也可以为特定项目、甚至特定的终端会话设置独立的 JDK 版本。
- **简洁轻量**: jenv 本身是一个 shell 脚本，非常小巧，不会引入额外的依赖。
- **自动设置 `JAVA_HOME`**: 这是 jenv 最强大的功能之一。通过其 `export` 插件，它能确保 `JAVA_HOME` 环境变量在切换版本时自动更新，这对 Maven、Gradle 等构建工具至关重要。

---

## 2\. 核心原理

jenv 的工作机制基于 **shims** 和 **环境变量管理**。

1. **Shims (垫片)**: jenv 在 `$PATH` 的最前端插入其 `~/.jenv/shims` 目录。这个目录包含了 `java`, `javac`, `jar` 等可执行文件的"垫片"。当你执行 `java -version` 时，首先找到的是 jenv 的 shim 脚本，而不是系统默认的 `java`。
2. **版本解析**: jenv 的 shim 脚本会根据你当前所在目录、全局配置或会话配置，解析出应该使用的 JDK 版本。
3. **路径重定向**: 找到正确的 JDK 版本后，shim 脚本会将命令重定向到实际的 JDK 安装路径下的 `bin` 目录，从而执行正确的 `java` 命令。
4. **`JAVA_HOME` 自动更新**: 配合 `export` 插件，jenv 会在每次版本切换时，自动更新 `JAVA_HOME` 环境变量，指向当前生效的 JDK 路径。

---

## 3\. 安装与配置

### 3.1. 安装 JDK

如前所述，jenv 不负责安装 JDK。你需要使用适合你操作系统的包管理器或手动下载 JDK。

- **macOS**: 推荐使用 Homebrew Cask。

  ```bash
  # 搜索可用的 JDK 版本
  brew search openjdk
  # 安装 JDK 17
  brew install openjdk@17
  # 安装其他版本，例如 JDK 8
  brew install openjdk@8
  ```

- **Linux**:
  - **Ubuntu/Debian**: 使用 `apt`。
      <!-- end list -->

    ```bash
    sudo apt update
    sudo apt install openjdk-11-jdk
    ```

  - **Fedora/CentOS**: 使用 `yum` 或 `dnf`。
      <!-- end list -->
    ```bash
    sudo dnf install java-17-openjdk-devel
    ```

- **Windows**: jenv 官方不支持 Windows，但可以通过 WSL (Windows Subsystem for Linux) 来使用。在 WSL 环境中，安装步骤与 Linux 相同。

### 3.2. 安装 jenv

**macOS**

使用 Homebrew 是最简单的方式。

```bash
brew install jenv
```

**Linux**

通过 Git 克隆仓库手动安装。

```bash
git clone https://github.com/jenv/jenv.git ~/.jenv
```

### 3.3. 配置 Shell

这是最关键的一步。你需要将 jenv 相关的配置添加到你的 shell 配置文件中。

- **Zsh**: 编辑 `~/.zshrc`
- **Bash**: 编辑 `~/.bash_profile` 或 `~/.bashrc`

在文件末尾添加以下内容：

```bash
# jenv configuration
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"

# 启用自动设置 JAVA_HOME 插件
# 强烈推荐，否则 Maven、Gradle 等工具将无法正确识别 JDK
jenv enable-plugin export
```

**⚠️ 注意:**

- 如果你使用 Oh My Zsh，`eval "$(jenv init -)"` 可能会导致一些问题。一个更可靠的方案是，将 jenv 作为一个插件启用。在 `.zshrc` 中找到 `plugins` 配置，并添加 `jenv`：`plugins=(git jenv ...)`。
- 配置完成后，需要重新加载 shell 配置：

  ```bash
  # Zsh
  source ~/.zshrc
  # Bash
  source ~/.bash_profile
  ```

  或者直接重启你的终端。

### 3.4. 验证安装

运行以下命令，确保 jenv 成功加载。

```bash
jenv doctor
```

如果一切正常，你会看到类似的输出，提示你已安装的 JDK 版本和 jenv 的配置状态。如果存在问题，`jenv doctor` 会给出明确的提示。

---

## 4\. 日常使用

### 4.1. 添加 JDK

安装好 JDK 后，需要将其路径添加到 jenv 中。jenv 通常可以自动识别 Homebrew 安装的 JDK。对于手动安装的 JDK，你需要手动添加。

**自动添加 (Homebrew)**:

jenv 自动识别，无需手动添加。你可以通过 `jenv versions` 检查。

**手动添加**:

```bash
# macOS 示例
# 对于 Homebrew 安装的 JDK，其路径通常在 /usr/local/opt 或 /opt/homebrew/opt 下
jenv add /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home

# Linux 示例
jenv add /usr/lib/jvm/java-11-openjdk-amd64
```

添加成功后，jenv 会为这个 JDK 创建一个别名。

### 4.2. 查看已注册的 JDK

```bash
jenv versions
```

输出示例：

```text
  system
  11
  11.0
  11.0.2
* 17 (set by /Users/user/.jenv/version)
  17.0
  17.0.6
```

- 带 `*` 的行表示当前正在使用的 JDK 版本。
- `system` 表示系统默认的 JDK。
- `11`, `17` 等是 jenv 自动生成的别名。

### 4.3. 切换 JDK 版本

jenv 提供了三种级别的版本切换，优先级从高到低依次是：**Shell \> Local \> Global**。

#### a. 全局 (Global)

设置所有终端会话的默认 JDK。

```bash
jenv global 17
```

现在，无论你在哪个目录，`java -version` 都会显示 JDK 17。

#### b. 项目级 (Local)

在特定的项目目录中设置 JDK 版本。这是 jenv 最常用的功能。

```bash
cd /path/to/your/project
jenv local 11
```

这个命令会在当前目录下创建一个 `.java-version` 文件，内容就是 `11`。当你进入这个目录时，jenv 会自动切换到 JDK 11。离开这个目录时，又会自动恢复到全局或上级目录的配置。

**⚠️ 注意**: 推荐将 `.java-version` 文件加入 Git 版本控制，这样团队成员可以共享项目的 JDK 版本配置。

#### c. 会话级 (Shell)

仅在当前终端会话中临时切换 JDK 版本，不会影响其他终端会话。

```bash
jenv shell 8
```

这个设置的优先级最高，即使该项目目录有 `.java-version` 文件，也会被 `shell` 设置覆盖。

---

## 5\. 最佳实践与高级配置

### 5.1. 启用插件

jenv 强大的功能依赖于其插件系统。以下插件强烈推荐启用：

```bash
# 启用 export 插件，自动更新 JAVA_HOME
jenv enable-plugin export

# 启用 maven 插件，自动为 Maven 设置 JAVA_HOME
jenv enable-plugin maven

# 启用 gradle 插件，自动为 Gradle 设置 JAVA_HOME
jenv enable-plugin gradle
```

这些插件通常只需启用一次。你可以在 `jenv doctor` 的输出中查看已启用的插件。

### 5.2. jenv 与 IDE 的集成

虽然 jenv 在终端中表现出色，但集成开发环境（如 IntelliJ IDEA、Eclipse）通常有自己的 JDK 管理系统。

**IntelliJ IDEA**

- **自动识别**: IntelliJ IDEA 能够读取项目目录下的 `.java-version` 文件，自动推荐使用相应的 JDK。
- **手动配置**: 在 `File -> Project Structure -> Project Settings -> Project` 中，你可以手动选择项目使用的 JDK。推荐在这里配置，因为这能确保 IDE 内部编译和运行环境与 jenv 管理的一致。
- **最佳实践**: 在 IDE 中，为每个项目手动配置其正确的 JDK 路径。这比依赖 jenv 插件更稳定，因为它直接配置了 IDE 的构建环境。jenv 主要用于命令行和脚本。

### 5.3. 别名与版本命名

jenv 自动为 JDK 生成别名，如 `1.8`, `11`, `17`。但你也可以使用更具描述性的名称。

```bash
# 添加时指定别名
jenv add /path/to/jdk-17-openj9 openjdk-17-openj9

# 之后就可以使用别名切换
jenv local openjdk-17-openj9
```

这对于区分不同厂商（如 Oracle、OpenJDK、Adoptium）的 JDK 版本非常有用。

---

## 6\. jenv vs. SDKMAN\

这是 jenv 社区中一个常见的问题。两者各有优劣，但可以互补使用。

| 特性         | **jenv**                                                         | **SDKMAN\!**                                                   |
| :----------- | :--------------------------------------------------------------- | :------------------------------------------------------------- |
| **核心功能** | **管理**已安装的 JDK 版本                                        | **安装与管理**各种 SDK (包括 JDK)                              |
| **安装方式** | Git 或 Homebrew                                                  | Curl 脚本                                                      |
| **适用场景** | 专注于 JDK 版本切换，特别是项目级管理                            | 一站式解决方案，用于管理 JDK、Maven、Gradle、Kotlin 等多种工具 |
| **优劣**     | 极简、轻量、只做一件事，**对现有 JDK 环境无侵入**                | 功能强大、方便快捷、无需手动下载，但可能引入更多依赖           |
| **互补性**   | **完美互补**！使用 SDKMAN\! 下载和安装 JDK，再用 jenv 管理它们。 |

### 推荐工作流

1. **使用 SDKMAN\! 安装 JDK**：`sdk install java 17.0.8-tem`
2. **将 SDKMAN\! 安装的 JDK 添加到 jenv**：`jenv add ~/.sdkman/candidates/java/17.0.8-tem`
3. **使用 jenv 进行版本切换和项目管理**：`jenv local 17.0.8-tem`

这种组合方式，既享受了 SDKMAN\! 一键安装的便利，又利用了 jenv 在项目级别切换的精确控制。

---

## 7\. 常见问题排查 (FAQs)

#### **Q1: 为什么我设置了 `jenv global` 或 `jenv local`，但 `java -version` 还是显示系统默认版本？**

**A:**

1. **检查 Shell 配置**: 确保 `eval "$(jenv init -)"` 和 `export PATH="$HOME/.jenv/bin:$PATH"` 在你的 `.zshrc` 或 `.bash_profile` 中，且配置正确。
2. **重新加载 Shell**: 运行 `source` 命令或重启终端。
3. **检查 `$PATH`**: 运行 `echo $PATH`，确保 `~/.jenv/shims` 位于 `$PATH` 的最前端。
4. **`jenv doctor`**: 运行此命令，它会给你最准确的诊断信息。

#### **Q2: 为什么 Maven 或 Gradle 找不到正确的 JDK？**

**A:**

1. **启用 `export` 插件**: 确保你运行了 `jenv enable-plugin export`。这个插件是确保 `JAVA_HOME` 自动更新的关键。
2. **重启终端**: 插件启用后需要重启终端才能生效。
3. **检查 `JAVA_HOME`**: 在你的项目目录下，运行 `echo $JAVA_HOME`。如果它指向正确的 JDK 路径，问题可能出在你的构建工具配置上。

#### **Q3: jenv 支持 Windows 吗？**

**A:** jenv 是为类 Unix 系统（Linux/macOS）设计的，不直接支持 Windows。但在 Windows 上，你可以通过安装 **WSL (Windows Subsystem for Linux)** 来使用 jenv，它能提供一个完整的 Linux 环境。
