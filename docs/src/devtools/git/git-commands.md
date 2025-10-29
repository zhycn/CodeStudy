---
title: Git 常用命令清单详解与最佳实践
description: 详细介绍了 Git 常用命令的使用方法和最佳实践，包括初始化仓库、提交变更、分支管理、合并冲突解决等。
author: zhycn
---

# Git 常用命令清单详解与最佳实践

## 1 Git 简介与核心概念

Git 是一个开源的分布式版本控制系统，由 Linus Torvalds 创建，用于高效地处理从小到非常大的项目版本管理。它被广泛应用于软件开发中，提供了一种管理项目代码的灵活、高效的方式，能够追踪文件的修改、记录变更历史以及恢复特定版本的文件。

### 1.1 Git 的核心概念

- **仓库 (Repository)**: Git 使用仓库来管理代码，一个代码仓库包含了项目的所有文件和历史记录。仓库可以分为本地仓库和远程仓库两种。
- **工作区 (Working Directory)**: 存放源代码的地方，通常是克隆或者初始化 Git 仓库得到的文件夹。
- **暂存区 (Staging Area)**: 用于临时存放修改的文件，待提交到版本库。
- **提交 (Commit)**: 将暂存区的内容保存到版本库中，每个提交包含了修改的具体内容以及提交者的信息。
- **分支 (Branch)**: 指向某个提交的指针，通过分支可以进行并行开发，不同的分支可以独立进行修改而不互相干扰。
- **远程仓库 (Remote Repository)**: 位于远程服务器上的代码库，用于团队协作和代码共享。

## 2 环境配置与仓库初始化

### 2.1 Git 安装与配置

在开始使用 Git 前，需要先进行全局配置，设置用户身份信息：

```bash
# 配置全局用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 启用颜色显示
git config --global color.ui auto

# 设置默认编辑器（VSCode 示例）
git config --global core.editor "code --wait"
```

这些配置信息将用于你所有的提交操作，帮助识别代码的作者。

### 2.2 仓库初始化与克隆

初始化一个新的 Git 仓库或克隆现有仓库：

```bash
# 在当前目录初始化一个新的 Git 仓库
git init

# 克隆远程仓库到本地
git clone https://github.com/username/repository.git

# 克隆指定分支的仓库
git clone -b branch_name https://github.com/username/repository.git

# 深度克隆（只获取最近的一次提交）
git clone --depth 1 https://github.com/username/repository.git
```

`git init` 命令会将当前目录转为 Git 仓库，并创建一个名为 `.git` 的子目录存储所有版本控制所需的数据。`git clone` 则是将远程仓库完整复制到本地，包括所有历史记录和分支信息。

## 3 工作区与暂存区操作

### 3.1 文件状态跟踪与提交

Git 工作流程通常包括修改文件、将文件添加到暂存区、然后提交到仓库：

```bash
# 查看当前文件状态（详细视图）
git status

# 查看简洁状态（??=未跟踪，A=新增，M=修改）
git status -s

# 添加指定文件到暂存区
git add filename.txt

# 添加所有变化文件到暂存区（慎用）
git add .

# 交互式添加（推荐方式）
git add -p

# 提交暂存区的文件
git commit -m "提交信息"

# 一次性添加并提交所有已跟踪文件的修改
git commit -a -m "提交信息"
```

### 3.2 差异比较与历史查看

查看文件修改内容和提交历史：

```bash
# 查看未暂存的更改
git diff

# 查看已暂存的更改
git diff --cached

# 查看提交历史（详细格式）
git log

# 查看简洁提交历史
git log --oneline

# 查看图形化分支历史
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

# 查看特定文件的修改历史
git log -p src/utils.js

# 查看文件中每行代码的最后修改信息
git blame -L 10,20 src/utils.js
```

## 4 分支管理策略

### 4.1 分支创建与切换

Git 的分支功能让并行开发变得更加高效：

```bash
# 查看所有分支（本地和远程）
git branch -av

# 创建新分支
git branch new_feature

# 切换分支
git checkout existing_branch

# 创建并切换到新分支
git checkout -b new_feature

# 删除已合并的分支
git branch -d branch_to_delete

# 强制删除未合并的分支
git branch -D branch_to_delete

# 查看分支最后提交信息
git branch -v
```

### 4.2 分支合并与变基

将分支更改集成到主线的两种主要方法：

```bash
# 合并分支（会产生合并提交）
git merge feature_branch

# 变基操作（保持线性历史）
git rebase main_branch

# 交互式变基（可修改、删除、重新排序提交）
git rebase -i HEAD~5

# 解决冲突后继续变基
git rebase --continue

# 终止变基过程
git rebase --abort
```

**合并 vs 变基选择策略**：

- 公共分支（如 main/master）→ 使用 merge
- 个人功能分支 → 使用 rebase
- 已推送到远程的分支 → 慎用 rebase

### 4.3 主流分支策略模型

团队开发中常用的分支策略：

1. **Git Flow**: 复杂但结构清晰，适合大型项目
   - **main/master 分支**：仅包含已发布的稳定版本
   - **develop 分支**：集成所有开发工作的主干分支
   - **feature 分支**：从 develop 创建，用于功能开发
   - **release 分支**：从 develop 创建，用于发布准备
   - **hotfix 分支**：从 main/master 创建，用于紧急修复
   - **bugfix 分支**：从 develop 创建，用于修复 bug
   - **test 分支**：从 develop 创建，用于测试新功能
   - **docs 分支**：从 develop 创建，用于文档更新

2. **GitHub Flow**: 简单直接，适合持续交付
   - **main/master 分支**：主干分支
   - **功能分支**：从 main/master 创建，通过 Pull Request 合并

3. **GitLab Flow**: 兼顾两者优点，环境分支明确
   - **main/master 分支**：主干分支
   - **环境分支**：staging、production 等对应不同部署环境
   - **功能分支**：从 main/master 创建，通过 Merge Request 合并

## 5 远程协作与同步

### 5.1 远程仓库管理

与远程仓库交互的基本操作：

```bash
# 添加远程仓库
git remote add origin https://github.com/user/repo.git

# 查看远程仓库信息
git remote -v

# 重命名远程仓库
git remote rename origin upstream

# 移除远程仓库
git remote remove origin

# 从远程获取更新（不自动合并）
git fetch origin

# 获取并修剪已删除的远程分支
git fetch --prune
```

### 5.2 推送与拉取操作

将本地更改推送到远程和获取远程更新：

```bash
# 推送到远程分支（并建立关联）
git push -u origin branch_name

# 强制推送（慎用，会覆盖历史）
git push -f

# 从远程拉取并合并（相当于 fetch + merge）
git pull origin branch_name

# 推荐使用 rebase 方式拉取
git pull --rebase origin branch_name

# 推送标签到远程
git push origin --tags

# 推送单个标签
git push origin v1.0.0
```

### 5.3 团队协作流程

典型的团队协作开发流程：

```bash
# 1. 从主分支创建功能分支
git checkout -b feature/new-feature main

# 2. 开发过程中定期提交
git add .
git commit -m "feat: 实现新功能部分代码"

# 3. 同步主分支最新变更
git fetch origin
git rebase origin/main

# 4. 推送到远程仓库
git push -u origin feature/new-feature

# 5. 创建 Pull Request 进行代码评审

# 6. 评审通过后合并到主分支

# 7. 删除已合并的功能分支
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

## 6 版本撤销与回退

### 6.1 撤销工作区修改

撤销未提交的更改：

```bash
# 撤销某个文件的修改
git checkout -- filename.txt

# 撤销整个工作区的修改（危险！）
git reset --hard HEAD

# 将文件从暂存区移回工作区
git reset HEAD filename.txt

# 恢复误删的文件
git checkout HEAD -- deleted_file.txt
```

### 6.2 版本回退操作

处理已提交的更改：

```bash
# 查看所有操作历史（包括被"删除"的提交）
git reflog

# 创建反向提交（安全，适合已推送的提交）
git revert commit_hash

# 回退到指定提交（保留修改）
git reset --soft commit_hash

# 完全回退到指定提交（慎用！会丢失修改）
git reset --hard commit_hash

# 修改最后一次提交的信息
git commit --amend -m "新的提交信息"

# 修改最后一次提交的作者信息
git commit --amend --author "New Author <email@example.com>"
```

**撤销策略对比**：

- `revert`: 安全，适合已推送的提交，会创建新的反向提交
- `reset`: 危险，会丢失历史，仅限本地操作
- `amend`: 修改最后一次提交，不产生新的提交记录

## 7 高级技巧与工具

### 7.1 储藏暂存功能

临时保存工作进度，以便切换分支：

```bash
# 储藏当前工作（包括未跟踪文件）
git stash -u

# 储藏并添加描述信息
git stash save "正在开发登录验证"

# 查看储藏列表
git stash list

# 恢复最近储藏（并删除记录）
git stash pop

# 应用特定储藏（不删除记录）
git stash apply stash@{1}

# 删除储藏记录
git stash drop stash@{0}

# 清空所有储藏
git stash clear
```

### 7.2 标签管理

标记重要的版本里程碑：

```bash
# 创建轻量标签
git tag v1.0.0

# 创建带注释的标签
git tag -a v1.1.0 -m "正式发布版本"

# 查看所有标签
git tag

# 查看标签详细信息
git show v1.0.0

# 推送所有标签到远程
git push origin --tags

# 推送单个标签到远程
git push origin v1.0.0

# 删除本地标签
git tag -d v1.0-beta

# 删除远程标签
git push origin :refs/tags/v1.0-beta
```

### 7.3 子模块与高级工具

管理复杂项目依赖：

```bash
# 添加子模块
git submodule add https://github.com/lib/library.git

# 初始化子模块
git submodule init

# 更新子模块
git submodule update

# 使用二分查找定位引入 bug 的提交
git bisect start
git bisect bad
git bisect good commit_hash

# 使用 cherry-pick 选择特定提交
git cherry-pick commit_hash

# 交互式 rebase（重写历史）
git rebase -i HEAD~5
```

## 8 Git 最佳实践总结

### 8.1 提交规范与消息格式

**提交消息规范**：

- 使用清晰、有意义的消息：简明扼要地描述提交的目的和内容
- 分离主题和正文：主题行简要概括，正文提供详细信息
- 遵循约定式提交格式：使用 feat、fix、docs、chore 等类型标识

**示例提交消息**：

```bash
feat: 添加用户登录功能

- 实现 JWT 身份验证
- 添加登录页面组件
- 编写相关测试用例

关联问题: #123
```

**类型标识说明**：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

### 8.2 分支管理与协作规范

**分支命名约定**：

- 使用有意义的名字：清晰反映分支目的和用途
- 使用小写字母和连字符：如 `feature/user-authentication`
- 使用预定义前缀：`feature/`, `bugfix/`, `hotfix/`, `release/`, `docs/`, `test/`

**团队协作准则**：

- 主分支保护：不允许直接在主分支上提交代码
- 小步提交：频繁提交，每个提交只解决一个问题
- 代码审查：所有更改必须通过 Pull Request 进行评审
- 定期同步：每天至少同步一次远程主分支变更

### 8.3 工作流程优化建议

**高效 Git 工作习惯**：

1. **开始工作前**：先执行 `git fetch` 获取远程最新状态
2. **功能开发**：基于最新主分支创建功能分支
3. **小步提交**：频繁提交，每次提交一个逻辑更改
4. **定期变基**：使用 `git rebase` 保持分支历史线性整洁
5. **测试验证**：提交前运行本地测试确保代码质量
6. **推送前检查**：使用 `git log --oneline origin/branch_name..branch_name` 查看即将推送的提交
7. **及时清理**：删除已合并的分支，保持仓库整洁

**冲突解决策略**：

- 提前沟通：避免多人同时修改同一文件
- 及时解决：冲突出现后立即处理，不要积累
- 工具辅助：使用 `git mergetool` 可视化解决冲突
- 测试验证：解决冲突后运行测试确保正确性

### 8.4 安全与备份策略

**代码安全措施**：

- 定期备份：推送到远程仓库实现自动备份
- 标签标记：每个发布版本使用标签标记
- 权限控制：根据角色设置分支推送权限
- 审核日志：定期检查操作日志，发现异常

**灾难恢复方案**：

- 使用 `git reflog` 找回"丢失"的提交
- 保持远程仓库更新，确保代码不丢失
- 重要分支（如 main、develop）设置保护规则

通过遵循这些最佳实践，你和你的团队可以更加高效、安全地使用 Git 进行版本控制和协作开发，充分发挥 Git 的强大功能，提升开发效率和代码质量。

## 结语

Git 是一个功能强大的分布式版本控制系统，掌握了这些常用命令和最佳实践后，你将能够更加高效地管理项目代码和参与团队协作。记住，Git 的灵活性既是优势也是挑战——始终谨慎执行那些可能修改历史的操作（如 `reset --hard`、`rebase` 和 `push -f`），并在执行前确保理解其后果。

不断练习和实践是掌握 Git 的关键，祝你在使用 Git 的旅程中顺利愉快！
