---
title: Python3 虚拟环境（Virtual Environment）详解与最佳实践
description: 了解 Python3 虚拟环境的作用、创建、激活、管理和使用方法，以及最佳实践。
author: zhycn
---

# Python3 虚拟环境（Virtual Environment）详解与最佳实践

## 1. 概述：为什么需要虚拟环境？

Python 虚拟环境是一个自包含的目录树，它包含了特定 Python 项目所需的所有可执行文件和依赖包。它可以让你在同一台计算机上同时管理多个拥有不同依赖甚至不同 Python 版本的项目，而不会发生冲突。

**核心价值：**

- **项目隔离**：确保每个项目都有其独立的运行环境，避免包版本冲突。
- **依赖管理**：精确记录项目所需的依赖包及其版本，便于团队协作和部署。
- **避免污染系统环境**：不会因为安装、升级或卸载某个项目的包而影响其他项目或操作系统自带的 Python 环境。

## 2. 核心工具：`venv` vs `virtualenv`

Python 3.3 及更高版本标准库中内置了 `venv` 模块，它是创建虚拟环境的**官方推荐工具**。

`virtualenv` 是一个第三方工具，在 `venv` 出现之前是事实上的标准。它支持更早的 Python 版本（2.7+）并提供了一些额外功能，但对于大多数 Python 3 用户来说，`venv` 已经完全足够。

**建议：** 除非你有特殊需求（例如需要支持旧版 Python），否则应优先使用标准的 `venv` 模块。

## 3. 使用 `venv` 管理虚拟环境

### 3.1 创建虚拟环境

打开终端（Linux/macOS）或命令提示符/PowerShell（Windows），导航到你的项目目录，然后运行：

```bash
# 语法：python -m venv /path/to/new/virtual/environment
# 通常会在当前目录下创建一个名为 'venv' 的文件夹
python -m venv venv
```

你也可以为其指定任何名字，例如 `my_project_env`：

```bash
python -m venv my_project_env
```

**执行此命令后，一个名为 `venv`（或你指定的名字）的目录会被创建，其中包含 Python 解释器的副本、`pip` 库以及一些其他辅助文件。**

### 3.2 激活虚拟环境

创建后，你需要“激活”它，以确保后续的 Python 和 `pip` 命令都在这个隔离的环境中运行。

**Linux/macOS (bash/zsh):**

```bash
source venv/bin/activate
```

激活后，你的命令行提示符通常会显示虚拟环境的名称 `(venv) $`。

**Windows (Command Prompt):**

```cmd
venv\Scripts\activate.bat
```

**Windows (PowerShell):**

```powershell
venv\Scripts\Activate.ps1
```

在 PowerShell 中，首次执行此脚本可能会因系统执行策略而失败。你需要以管理员身份运行 `Set-ExecutionPolicy RemoteSigned` 来允许执行本地脚本。

激活后，你的命令行提示符会发生变化：

```bash
(venv) C:\path\to\your\project>
```

### 3.3 在虚拟环境中工作

一旦激活，你可以使用 `pip` 安装、升级或卸载包，所有这些操作都只会影响当前的虚拟环境。

```bash
# 查看当前环境中的 pip 版本和安装的包
(venv) $ pip --version
(venv) $ pip list

# 安装包（例如安装 requests 和 flask）
(venv) $ pip install requests
(venv) $ pip install flask==2.0.1  # 安装指定版本

# 安装开发时需要的包（不会打包到生产环境）
(venv) $ pip install black isort --dev
# 或者使用旧的语法
(venv) $ pip install pytest -U # -U 代表升级已安装的包

# 根据 requirements.txt 文件一次性安装所有依赖
(venv) $ pip install -r requirements.txt

# 卸载包
(venv) $ pip uninstall package_name

# 将当前环境的依赖导出到 requirements.txt
(venv) $ pip freeze > requirements.txt
```

### 3.4 停用虚拟环境

完成工作后，只需运行一个命令即可退出虚拟环境，返回到全局 Python 环境。

```bash
(venv) $ deactivate
```

停用后，命令行提示符前的 `(venv)` 会消失。

## 4. 依赖管理：`requirements.txt` 的最佳实践

`requirements.txt` 文件是项目依赖的清单，是项目可重现性的基石。

**一个良好的 `requirements.txt` 应该：**

1. **包含精确版本**：使用 `pip freeze` 生成的版本是精确的（例如 `requests==2.25.1`），这确保了环境的一致性。
2. **区分生产环境和开发环境**：
   - `requirements.txt`：仅包含项目运行所必需的核心依赖。
   - `requirements-dev.txt` 或 `dev-requirements.txt`：包含开发工具（如测试框架、代码格式化工具、linter 等）。可以通过 `-r requirements.txt` 来包含核心依赖。

   **`requirements-dev.txt` 示例：**

   ```python
   -r requirements.txt
   black==22.3.0
   isort==5.10.1
   pytest==7.0.1
   ```

3. **手动维护依赖**（可选）：对于库（Library）项目，有时会只指定最低版本要求，而不是锁定精确版本，以便与其他库有更好的兼容性。但这对于应用（Application）项目来说风险较高。

## 5. 高级用法与最佳实践

### 5.1 使用 `.python-version` 文件

如果你使用 `pyenv` 这类工具来管理多个 Python 版本，可以在项目根目录创建一个 `.python-version` 文件，里面写上你希望的 Python 版本号（如 `3.9.7`）。`pyenv` 会自动切换到此版本，你再创建虚拟环境时就会使用这个指定的版本。

### 5.2 环境变量配置

在项目根目录创建 `.env` 文件（并确保将其添加到 `.gitignore` 中），用于存储环境相关的敏感变量或配置（如 API Keys，数据库链接等）。可以使用 `python-dotenv` 包在项目中加载这些变量。

**安装：**

```bash
pip install python-dotenv
```

**使用（在你的 Python 脚本中）：**

```python
from dotenv import load_dotenv
load_dotenv()  # 从 .env 文件加载环境变量

import os
database_url = os.getenv("DATABASE_URL")
```

### 5.3 将虚拟环境目录排除在版本控制之外

**永远不要**将 `venv` 这类虚拟环境目录提交到 Git 等版本控制系统中。确保你的 `.gitignore` 文件包含如下规则：

```gitignore
# Virtual environment directories
venv/
env/
.my_venv/
*.pyc
__pycache__/
```

依赖应该通过 `requirements.txt` 来管理，而不是代码本身。

### 5.4 在 IDE 中使用虚拟环境

所有主流 IDE（PyCharm, VSCode, Sublime Text 等）都支持虚拟环境。

- **PyCharm**：创建新项目时，它会自动为你创建虚拟环境。对于现有项目，可以在 `Preferences -> Project -> Python Interpreter` 中选择已存在的虚拟环境解释器（`.../venv/bin/python`）。
- **VSCode**：使用 `Ctrl+Shift+P`（或 `Cmd+Shift+P`）打开命令面板，输入 `Python: Select Interpreter`，然后选择虚拟环境中的 Python 解释器。

## 6. 与其他工具的结合

### 6.1 与 `pipenv` / `poetry` 的关系

`pipenv` 和 `poetry` 是更高级别的工具，它们旨在将包管理（`pip`）和虚拟环境管理（`venv`）捆绑在一起，并提供更好的依赖解析、锁定和发布功能。

- `pipenv`：旨在成为“神圣的 grail”，将 `pip` 和 `virtualenv` 结合，并引入 `Pipfile` 和 `Pipfile.lock`。
- `poetry`：近年来更受欢迎，它提供了一个非常清晰的命令行工具来处理虚拟环境、依赖管理、**打包和发布**。它使用 `pyproject.toml` 文件。

对于新项目，尤其是需要打包分发的库，强烈建议尝试 `poetry`。

### 6.2 与 Docker 容器化

在 Docker 化 Python 应用时，你仍然可以在容器内部创建和使用虚拟环境。但这并非必需，因为 Docker 容器本身已经提供了一个隔离的环境。常见的做法是：

- **使用虚拟环境**：可以使 Docker 镜像内的文件结构更清晰，并且更符合开发者的习惯。
- **不使用虚拟环境**：因为容器已是隔离的，可以直接在系统层面安装包，从而减少镜像层和最终镜像大小。这是一个见仁见智的选择。

## 7. 总结与最佳实践清单

| 最佳实践                    | 说明                                                      |
| :-------------------------- | :-------------------------------------------------------- |
| **一个项目，一个环境**      | 为每个独立的项目创建专属的虚拟环境。                      |
| **使用 `venv`**             | Python 3.3+ 用户应优先使用标准库的 `venv`。               |
| **激活环境**                | 在开始工作前，务必先激活对应的虚拟环境。                  |
| **维护 `requirements.txt`** | 使用 `pip freeze > requirements.txt` 精确记录生产依赖。   |
| **区分生产与开发依赖**      | 使用单独的文件（如 `requirements-dev.txt`）管理开发工具。 |
| **忽略虚拟环境目录**        | 将 `venv/`、`env/` 等添加到 `.gitignore`，切勿提交它们。  |
| **在 IDE 中配置解释器**     | 确保你的代码编辑器和 IDE 使用的是虚拟环境中的 Python。    |
| **考虑升级工具**            | 对于复杂项目，可以评估并采用 `poetry` 等更现代的工具。    |

通过遵循这些实践，你将能够构建稳定、可协作且易于部署的 Python 项目，彻底告别“在我机器上是好的”这类环境问题。
