---
title: nvm 详解与最佳实践
description: 全面介绍 Node Version Manager (nvm) 的使用方法和最佳实践，帮助开发者高效管理 Node.js 版本。
---

# nvm 详解与最佳实践

本文全面介绍了 Node Version Manager (nvm) 的使用方法和最佳实践，帮助开发者高效管理 Node.js 版本。

- nvm-windows 官方仓库：<https://github.com/coreybutler/nvm-windows>
- nvm (macOS/Linux) 官方仓库：<https://github.com/nvm-sh/nvm>
- Node.js 官方网站：<https://nodejs.org/>
- 淘宝 NPM 镜像站：<https://npmmirror.com/>

## 1. 什么是 nvm？

nvm (Node Version Manager) 是一个 Node.js 版本管理工具，它允许你在同一台设备上安装和切换多个 Node.js 版本。这对于前端工程师处理不同基于 Node.js 版本开发的项目非常有用。

### 1.1 核心功能

- **多版本安装**：可以安装多个不同版本的 Node.js
- **版本切换**：轻松在不同项目间切换 Node.js 版本
- **版本隔离**：不同版本的环境完全隔离，避免冲突

## 2. 安装指南

### 2.1 准备工作

**在安装 nvm 之前，必须彻底卸载现有的 Node.js**：

1. 在控制面板中卸载 Node.js
2. 删除 Node.js 安装目录（默认在 `C:\Program Files\nodejs`）
3. 删除 npm 配置文件（`C:\Users\用户名\.npmrc`）
4. 删除可能残留的 Node.js 文件：

   ```bash
   C:\Program Files (x86)\Nodejs
   C:\Program Files\Nodejs
   C:\Users\用户名\AppData\Roaming\npm
   C:\Users\用户名\AppData\Roaming\npm-cache
   ```

### 2.2 安装 nvm

#### Windows 系统

1. 访问 [nvm-windows 官方 GitHub](https://github.com/coreybutler/nvm-windows/releases) 下载 `nvm-setup.exe`
2. 双击安装，选择自定义安装路径（建议纯英文、无空格的路径，如 `D:\nvm`）
3. 设置 Node.js 符号链接路径（建议与 nvm 同级目录，如 `D:\nvm\nodejs`）
4. 验证安装：

   ```bash
   nvm -v
   ```

   显示版本号即表示安装成功

#### macOS/Linux 系统

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

或使用 Homebrew（macOS）：

```bash
brew install nvm
```

### 2.3 配置环境变量

Windows 安装后会自动配置系统变量，如需自定义全局模块路径：

```bash
npm config set prefix "D:\nvm\node_global"
npm config set cache "D:\nvm\node_cache"
```

## 3. 基本使用

### 3.1 常用命令一览

| 命令                          | 描述             | 示例                        |
| ----------------------------- | ---------------- | --------------------------- |
| `nvm list available`          | 查看可安装版本   | `nvm list available`        |
| `nvm install <version>`       | 安装指定版本     | `nvm install 18.16.0`       |
| `nvm use <version>`           | 切换版本         | `nvm use 18.16.0`           |
| `nvm ls`                      | 查看已安装版本   | `nvm ls`                    |
| `nvm uninstall <version>`     | 卸载指定版本     | `nvm uninstall 14.17.0`     |
| `nvm current`                 | 显示当前使用版本 | `nvm current`               |
| `nvm alias default <version>` | 设置默认版本     | `nvm alias default 18.16.0` |

### 3.2 安装与管理 Node.js 版本

1. **查看可安装版本**：

   ```bash
   nvm list available
   ```

2. **安装最新 LTS 版本**：

   ```bash
   nvm install --lts
   ```

3. **安装特定版本**：

   ```bash
   nvm install 16.14.0
   nvm install 18.16.0
   ```

4. **查看已安装版本**：

   ```bash
   nvm list
   # 或
   nvm ls
   ```

   带 `*` 的表示当前使用的版本

5. **切换 Node.js 版本**：

   ```bash
   nvm use 16.14.0
   ```

6. **设置默认版本**（新终端会话将使用此版本）：

   ```bash
   nvm alias default 16.14.0
   ```

7. **卸载特定版本**：

   ```bash
   nvm uninstall 14.17.0
   ```

### 3.3 配置镜像加速

为提高下载速度，建议配置国内镜像源：

```bash
# 设置 node 镜像
nvm node_mirror https://npmmirror.com/mirrors/node/

# 设置 npm 镜像
nvm npm_mirror https://npmmirror.com/mirrors/npm/

# 设置 npm 镜像源
npm config set registry https://registry.npmmirror.com
```

**注意**：原 `https://registry.npm.taobao.org` 域名已于 2022.06.30 正式下线和停止 DNS 解析，请使用新域名 。

验证配置：

```bash
npm config get registry
```

## 4. 高级用法

### 4.1 自动版本切换

不同项目可能需要不同的 Node.js 版本，可以创建 `.nvmrc` 文件实现进入目录时自动切换：

1. **在项目根目录创建 `.nvmrc` 文件**：

   ```bash
   node -v > .nvmrc
   ```

   或手动写入版本号：

   ```bash
   16.14.0
   ```

2. **配置 shell 钩子**（在 `.zshrc` 或 `.bashrc` 中添加）：

   ```bash
   # 对于 zsh
   autoload -U add-zsh-hook
   load-nvmrc() {
     if [[ -f .nvmrc && -r .nvmrc ]]; then
       nvm use
     fi
   }
   add-zsh-hook chpwd load-nvmrc
   ```

这样，当你进入包含 `.nvmrc` 文件的目录时，nvm 会自动切换到指定的 Node.js 版本。

### 4.2 重新安装全局包

当切换 Node.js 版本后，可能需要将全局安装的 npm 包重新安装到新版本中：

```bash
nvm reinstall-packages 16.14.0
```

此命令会将当前版本中全局安装的 npm 包重新安装到指定版本中。

### 4.3 多架构支持

对于 Apple Silicon 等支持多架构的系统，可以指定安装特定架构的版本：

```bash
nvm install 18.16.0 --arch=64
```

## 5. 最佳实践

### 5.1 版本管理策略

1. **项目特定版本**：
   - 为每个项目创建 `.nvmrc` 文件指定 Node.js 版本
   - 在 `package.json` 中声明 `engines` 字段：

   ```json
   {
     "engines": {
       "node": ">=16.14.0 <17.0.0"
     }
   }
   ```

2. **团队协作**：
   - 统一团队成员的 Node.js 版本管理方式
   - 在项目文档中说明 nvm 的使用方法

3. **持续集成/部署**：
   - 在 CI/CD 流水线中使用 nvm 安装指定版本的 Node.js
   - 示例命令：

   ```bash
   - uses: actions/setup-node@v2
     with:
       node-version: '16.14.0'
   ```

### 5.2 性能优化

1. **使用国内镜像源**：如前文所述，配置淘宝镜像可大幅提升下载速度
2. **清理缓存**：定期清理 nvm 和 npm 的缓存文件

   ```bash
   nvm cache clear
   npm cache clean --force
   ```

3. **共享已下载版本**：在团队内共享已下载的 Node.js 版本包，避免重复下载

### 5.3 故障排除

#### 常见问题及解决方案

1. **切换版本后命令失效**：
   - 以管理员权限运行命令行工具
   - 检查路径是否包含中文或空格

2. **nvm 无法识别 Node.js**：
   - 彻底卸载旧版 Node.js 并删除环境变量

3. **权限问题**：
   - 避免使用 sudo 与 nvm 结合使用
   - 正确配置全局安装路径的权限

4. **镜像源报错**：
   - 确认镜像地址是否为 `https://registry.npmmirror.com` 新域名

## 6. 与其他工具集成

### 6.1 与编辑器/IDE 集成

**VS Code**：

1. 安装 "Node Version Manager" 扩展
2. 或在设置中配置：

```json
{
  "node.version": "16.14.0",
  "nvm.path": "/path/to/nvm"
}
```

**WebStorm**：

1. 在设置中指定 Node.js 版本
2. 使用项目中的 `.nvmrc` 文件自动检测版本

### 6.2 与 shell 集成

**Oh My Zsh**：

1. 启用 nvm 插件：

```bash
plugins=(... nvm)
```

**Fish Shell**：

1. 使用 fisher 安装 nvm 插件：

```bash
fisher install jorgebucaran/nvm.fish
```

## 7. 总结

nvm 是 Node.js 开发中不可或缺的工具，它解决了多个项目需要不同 Node.js 版本的难题。通过本文的介绍，你应该已经掌握了：

1. nvm 的安装和基本使用方法
2. 镜像配置和性能优化技巧
3. 高级功能和最佳实践
4. 常见问题的解决方案

遵循这些最佳实践，你可以更高效地管理 Node.js 开发环境，避免版本冲突问题，提升开发体验。

本文内容基于 nvm-windows v1.2.2 和 nvm (macOS/Linux) v0.40.3 编写
