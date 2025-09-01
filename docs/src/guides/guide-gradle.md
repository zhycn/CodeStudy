---
title: Gradle 详解与最佳实践
description: 了解 Gradle 构建工具的核心概念、核心特点、与 Maven 的对比、核心组件以及安装与环境配置等内容。
---

# Gradle 详解与最佳实践

Gradle 官网：<https://www.gradle.org/>

## 1. Gradle 简介与核心概念

Gradle 是一款基于 Apache Ant 和 Maven 概念的开源构建自动化工具，它结合了 Apache Maven 的配置约定和 Apache Ant 的任务执行灵活性。Gradle 采用 **基于依赖关系的编程模型**，允许开发者通过声明式的方式定义项目构建过程，大大提高了构建脚本的简洁性和可读性。

### 1.1 Gradle 的核心特点

- **高度可定制化**：Gradle 提供了丰富的 API，允许开发者根据需要定制构建流程和任务行为。
- **高性能**：Gradle 通过增量构建、构建缓存和并行执行等特性显著提升构建性能。研究表明，合理的配置可以将构建时间减少达90%。
- **强大的依赖管理**：支持灵活的依赖管理和版本冲突解决机制，同时支持传递性依赖管理和BOM（Bill of Materials）导入。
- **多项目支持**：轻松管理包含多个子模块的复杂项目，支持项目间的依赖关系配置。
- **多种语言支持**：除了支持 Java、Kotlin 和 Groovy 等 JVM 语言外，还支持 C/C++、JavaScript 和 Python 等非 JVM 语言。
- **扩展性**：通过自定义插件和任务可以轻松扩展 Gradle 的功能。

### 1.2 Gradle 与 Maven 的对比

| 特性             | Gradle                       | Maven                        |
| ---------------- | ---------------------------- | ---------------------------- |
| **构建脚本语言** | Groovy/Kotlin DSL            | XML                          |
| **性能**         | 增量构建、构建缓存、并行执行 | 相对较慢                     |
| **依赖管理**     | 支持动态版本、排除传递依赖   | 支持静态版本、排除传递依赖   |
| **扩展性**       | 通过自定义插件和任务灵活扩展 | 主要通过插件扩展，灵活性较低 |
| **学习曲线**     | 相对陡峭                     | 相对平缓                     |

### 1.3 Gradle 核心组件

- **Project**：每个 Gradle 构建都由一个或多个项目组成，每个项目对应一个 `build.gradle` 文件。
- **Task**：表示构建过程中的一个独立工作单元，如编译代码、运行测试等。
- **Plugin**：用于扩展 Gradle 功能，可以添加新的任务、约定和扩展属性。
- **Dependency**：管理项目所需的第三方库或其他模块的依赖关系。
- **Repository**：指定依赖项的存储位置，如 Maven Central、JCenter 或私有仓库。

## 2. 安装与环境配置

### 2.1 环境要求

- **Java JDK**：Gradle 需要 Java JDK 1.8 或更高版本。建议使用 Java JDK 11 或 LTS 版本以获得最佳性能和支持。
- **操作系统**：支持 Windows、macOS 和 Linux 等主流操作系统。

### 2.2 安装方式

#### 2.2.1 使用包管理器安装

**Windows (使用 Chocolatey)**

```shell
choco install gradle
```

**macOS (使用 Homebrew)**

```shell
brew install gradle
```

**Linux (使用 SDKMAN!)**

```shell
sdk install gradle
```

#### 2.2.2 手动安装

1. 从 [Gradle 官网](https://gradle.org/releases/) 下载最新版本的二进制分发包
2. 解压到指定目录
3. 配置环境变量

```shell
# 示例：在 Linux/macOS 上配置环境变量
echo 'export GRADLE_HOME=/opt/gradle' >> ~/.bashrc
echo 'export PATH=$GRADLE_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 2.3 验证安装

安装完成后，可以通过以下命令验证 Gradle 是否安装成功：

```shell
gradle -version

# 预期输出类似内容
# ------------------------------------------------------------
# Gradle 8.4
# ------------------------------------------------------------
# Build time:   2023-10-04 20:52:29 UTC
# Revision:     e9251e572c9bd98d6f6a8c836544a5f5cac4eb1e
# Kotlin:       1.9.10
# Groovy:       3.0.17
# Ant:          Apache Ant(TM) version 1.10.13 compiled on January 4 2023
# JVM:          11.0.20 (Oracle Corporation 11.0.20+8-LTS-256)
# OS:           Linux 5.15.0-84-generic amd64
```

### 2.4 配置 Gradle 使用参数

可以通过 `GRADLE_OPTS` 环境变量配置 Gradle 的 JVM 参数：

```shell
# 配置 Gradle 使用 2GB 堆内存和512MB 永久代内存
export GRADLE_OPTS="-Xmx2g -XX:MaxMetaspaceSize=512m"
```

## 3. 项目结构与基本配置

### 3.1 标准项目结构

一个典型的 Gradle 项目遵循约定优于配置的原则，具有以下目录结构：

```bash
my-project/
├── build.gradle[.kts]    # 项目构建脚本
├── settings.gradle[.kts] # 项目设置文件
├── gradle
│   └── wrapper          # Gradle Wrapper 目录
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew              # Unix/Linux 的 Gradle Wrapper 脚本
├── gradlew.bat          # Windows 的 Gradle Wrapper 脚本
└── src                  # 源代码目录
    ├── main
    │   ├── java         # Java 源代码
    │   ├── kotlin       # Kotlin 源代码
    │   ├── resources    # 资源文件
    │   └── webapp       # Web 应用资源（对于Web项目）
    └── test
        ├── java         # Java 测试代码
        ├── kotlin       # Kotlin 测试代码
        └── resources    # 测试资源文件
```

### 3.2 构建脚本基础

Gradle 构建脚本可以使用 Groovy DSL 或 Kotlin DSL 编写。以下是两种 DSL 的简单示例：

**Groovy DSL (build.gradle)**

```groovy
plugins {
    id 'java'
    id 'application'
}

group = 'com.example'
version = '1.0.0'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web:2.7.5'
    testImplementation 'junit:junit:4.13.2'
}

application {
    mainClass = 'com.example.Main'
}
```

**Kotlin DSL (build.gradle.kts)**

```kotlin
plugins {
    java
    application
}

group = "com.example"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web:2.7.5")
    testImplementation("junit:junit:4.13.2")
}

application {
    mainClass.set("com.example.Main")
}
```

### 3.3 常用配置示例

#### 3.3.1 Java 项目配置

```groovy
plugins {
    id 'java'
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(11)
    }
}

compileJava {
    options.encoding = 'UTF-8'
    options.compilerArgs += ['-Xlint:all', '-Werror']
}

compileTestJava {
    options.encoding = 'UTF-8'
}

test {
    useJUnitPlatform()
    testLogging {
        events "passed", "skipped", "failed"
    }
}
```

#### 3.3.2 多项目配置

**settings.gradle**

```groovy
rootProject.name = 'my-enterprise-app'

include 'web-app'
include 'data-service'
include 'common-utils'
```

**根目录 build.gradle**

```groovy
subprojects {
    apply plugin: 'java'

    repositories {
        mavenCentral()
    }

    dependencies {
        testImplementation 'junit:junit:4.13.2'
    }
}

project(':web-app') {
    dependencies {
        implementation project(':common-utils')
    }
}

project(':data-service') {
    dependencies {
        implementation project(':common-utils')
    }
}
```

## 4. 依赖管理

### 4.1 依赖配置

Gradle 的依赖管理支持多种配置方式，常用的配置如下表所示：

| 配置名称             | 说明                               | 示例                                                 |
| -------------------- | ---------------------------------- | ---------------------------------------------------- |
| `implementation`     | 编译和运行时依赖，不传递给依赖模块 | `implementation 'com.example:lib:1.0'`               |
| `api`                | 编译和运行时依赖，传递给依赖模块   | `api 'com.example:lib:1.0'`                          |
| `compileOnly`        | 仅编译时依赖，不参与运行时         | `compileOnly 'javax.servlet:servlet-api:3.1.0'`      |
| `runtimeOnly`        | 仅运行时依赖，不参与编译           | `runtimeOnly 'mysql:mysql-connector-java:8.0.30'`    |
| `testImplementation` | 测试相关的编译和运行时依赖         | `testImplementation 'junit:junit:4.13.2'`            |
| `testCompileOnly`    | 测试相关的仅编译时依赖             | `testCompileOnly 'org.projectlombok:lombok:1.18.24'` |

### 4.2 依赖版本管理

#### 4.2.1 使用版本目录（Version Catalog）

Gradle 7.0 引入了版本目录功能，可以集中管理依赖版本：

**gradle/libs.versions.toml**

```toml
[versions]
kotlin = "1.8.0"
spring-boot = "2.7.5"

[libraries]
kotlin-stdlib = { module = "org.jetbrains.kotlin:kotlin-stdlib-jdk8", version.ref = "kotlin" }
spring-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "spring-boot" }
junit = { module = "junit:junit", version = "4.13.2" }

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
```

**build.gradle**

```groovy
dependencies {
    implementation libs.kotlin.stdlib
    implementation libs.spring.web
    testImplementation libs.junit
}

plugins {
    alias(libs.plugins.spring.boot)
}
```

#### 4.2.2 依赖约束

依赖约束允许你定义版本或版本范围来限制直接和传递依赖版本：

```groovy
dependencies {
    implementation 'org.apache.httpcomponents:httpclient'

    constraints {
        implementation('org.apache.httpcomponents:httpclient:4.5.13') {
            because 'previous versions have a bug impacting this application'
        }
        implementation('commons-codec:commons-codec:1.15') {
            because 'version 1.9 pulled from httpclient has bugs affecting this application'
        }
    }
}
```

#### 4.2.3 依赖排除

```groovy
dependencies {
    implementation('com.example:some-library:1.0') {
        // 排除特定组件的依赖
        exclude group: 'com.fasterxml.jackson.core', module: 'jackson-databind'

        // 排除所有传递依赖
        transitive = false
    }
}
```

### 4.3 BOM 支持

Gradle 5.0 开始支持导入 Maven BOM（Bill of Materials）文件：

```groovy
dependencies {
    // 导入 Spring Boot BOM
    implementation platform('org.springframework.boot:spring-boot-dependencies:2.7.5')

    // 不需要指定版本，版本由 BOM 控制
    implementation 'com.google.code.gson:gson'
    implementation 'dom4j:dom4j'
}
```

### 4.4 依赖解析机制

Gradle 的依赖解析过程如下：

1. **依赖声明**：在 `dependencies` 块中声明所需依赖
2. **依赖解析**：Gradle 根据声明的仓库位置解析依赖
3. **依赖下载**：从仓库下载所需的依赖项
4. **依赖存储**：将依赖项存储到本地缓存中
5. **依赖使用**：在编译和运行时使用这些依赖

### 4.5 依赖冲突解决

Gradle 默认会自动解决依赖冲突，选择最高版本的依赖。你也可以手动强制使用特定版本：

```groovy
dependencies {
    // 强制使用特定版本
    implementation('com.google.guava:guava:31.1-jre') {
        force = true
    }

    // 或者使用 resolutionStrategy
    configurations.all {
        resolutionStrategy {
            failOnVersionConflict()
            force 'com.fasterxml.jackson.core:jackson-databind:2.13.4.2'
        }
    }
}
```

## 5. 任务与插件机制

### 5.1 任务定义与配置

任务是 Gradle 构建的基本工作单元，可以定义自己的任务或使用插件提供的任务。

#### 5.1.1 基本任务定义

```groovy
// 简单任务
task hello {
    doLast {
        println 'Hello, World!'
    }
}

// 带属性的任务
task copyFiles(type: Copy) {
    from 'src/main/resources'
    into 'build/resources'
    include '**/*.properties'
}

// 依赖其他任务的任务
task build(dependsOn: ['compileJava', 'processResources']) {
    doLast {
        println 'Building the project...'
    }
}
```

#### 5.1.2 任务配置避免API

Gradle 4.9 引入了 Task Configuration Avoidance API，建议使用 `tasks.register()` 方法注册任务：

```groovy
// 使用新的任务注册API（推荐）
tasks.register('hello') {
    doLast {
        println 'Hello, World!'
    }
}

tasks.register('copyFiles', Copy) {
    from 'src/main/resources'
    into 'build/resources'
    include '**/*.properties'
}
```

### 5.2 自定义任务类

对于复杂的任务逻辑，可以创建自定义任务类：

**buildSrc/src/main/groovy/com/example/MyCustomTask.groovy**

```groovy
package com.example

import org.gradle.api.DefaultTask
import org.gradle.api.tasks.TaskAction
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional

abstract class MyCustomTask extends DefaultTask {

    @Input
    String message = 'Hello'

    @Optional
    @Input
    String recipient

    @TaskAction
    def greet() {
        println "${message}${recipient ? ', ' + recipient : ''}!"
    }
}
```

**build.gradle**

```groovy
tasks.register('greet', MyCustomTask) {
    message = 'Welcome'
    recipient = 'Gradle User'
}
```

### 5.3 插件开发与应用

#### 5.3.1 使用插件

```groovy
// 使用插件ID
plugins {
    id 'java'
    id 'org.springframework.boot' version '2.7.5'
}

// 传统应用插件方式
apply plugin: 'java'
apply plugin: 'eclipse'
```

#### 5.3.2 开发自定义插件

**buildSrc/src/main/groovy/com/example/MyPlugin.groovy**

```groovy
package com.example

import org.gradle.api.Plugin
import org.gradle.api.Project

class MyPlugin implements Plugin<Project> {
    void apply(Project project) {
        // 创建扩展对象
        project.extensions.create('myPlugin', MyPluginExtension)

        // 注册任务
        project.tasks.register('myTask', MyCustomTask) {
            message = project.myPlugin.message
            recipient = project.myPlugin.recipient
        }
    }
}

class MyPluginExtension {
    String message = 'Hello'
    String recipient = 'World'
}
```

**build.gradle**

```groovy
apply plugin: com.example.MyPlugin

myPlugin {
    message = 'Hi'
    recipient = 'Gradle'
}
```

## 6. 构建优化与性能调优

### 6.1 构建缓存

Gradle 的构建缓存功能可以显著减少构建时间，特别是在多项目构建或CI/CD环境中。

#### 6.1.1 启用构建缓存

```groovy
// settings.gradle
buildCache {
    local {
        enabled = true
        directory = new File(rootDir, 'build-cache')
        removeUnusedEntriesAfterDays = 30
    }

    // 如果需要，可以配置远程构建缓存
    remote(HttpBuildCache) {
        url = 'http://my-cache-server:8080/cache/'
        enabled = true
        push = true
        credentials {
            username = 'user'
            password = 'password'
        }
    }
}
```

#### 6.1.2 为自定义任务启用缓存

```groovy
tasks.register('packageApplication', Zip) {
    from 'src/main/application'
    into 'application'

    // 配置缓存条件
    outputs.cacheIf { true }
}
```

### 6.2 并行执行和多项目构建

#### 6.2.1 并行执行

```shell
# 命令行启用并行执行
./gradlew build --parallel
```

或者永久启用：

```groovy
# gradle.properties
org.gradle.parallel=true
```

#### 6.2.2 配置并行线程数

```groovy
# gradle.properties
# 根据CPU核心数调整
org.gradle.parallel.threads=4
```

### 6.3 增量构建

Gradle 默认启用增量构建，但对于自定义任务，需要正确声明输入和输出：

```groovy
tasks.register('processTemplates', ProcessTemplates) {
    // 声明输入目录
    inputDir = file('src/main/templates')

    // 声明输出目录
    outputDir = file('build/generated')

    // 声明输入属性
    templateEngine = 'mustache'

    // 自动支持增量构建
}
```

### 6.4 性能监控与分析

#### 6.4.1 使用构建扫描

```shell
# 生成构建扫描报告
./gradlew build --scan
```

#### 6.4.2 使用性能分析标志

```shell
# 生成性能报告
./gradlew build --profile
```

#### 6.4.3 监控构建性能

```groovy
// 在构建脚本中添加性能监控
gradle.buildFinished { buildResult ->
    def buildMetrics = gradle.services.get(BuildMetrics)
    println "构建时间: ${buildMetrics.buildTime} ms"
    println "配置时间: ${buildMetrics.configurationTime} ms"
    println "任务执行时间: ${buildMetrics.executionTime} ms"
}
```

### 6.5 内存配置优化

根据项目大小调整 Gradle 内存设置：

```groovy
# gradle.properties
# JVM 内存设置
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# 守护进程配置
org.gradle.daemon=true
org.gradle.daemon.idletimeout=3600000
```

### 6.6 其他优化技巧

1. **避免不必要的应用插件**：只应用项目真正需要的插件
2. **使用最新Gradle版本**：新版本通常包含性能改进
3. **减少配置时间**：避免在配置阶段执行耗时操作
4. **使用静态依赖版本**：避免动态版本带来的额外解析开销
5. **限制子项目配置**：使用 `configureOnDemand` 按需配置子项目

```groovy
# gradle.properties
org.gradle.configureondemand=true
```

## 7. 多模块项目管理

### 7.1 项目结构设计

一个典型的多模块 Gradle 项目结构如下：

```bash
my-multimodule-project/
├── build.gradle
├── settings.gradle
├── gradle.properties
├── core-module/
│   ├── build.gradle
│   └── src/
├── service-module/
│   ├── build.gradle
│   └── src/
├── web-module/
│   ├── build.gradle
│   └── src/
└── infrastructure-module/
    ├── build.gradle
    └── src/
```

### 7.2 配置多模块项目

**settings.gradle**

```groovy
rootProject.name = 'my-multimodule-project'

include 'core-module'
include 'service-module'
include 'web-module'
include 'infrastructure-module'

// 设置项目路径
project(':core-module').projectDir = file('core')
project(':service-module').projectDir = file('service')
```

### 7.3 共享配置

**根目录 build.gradle**

```groovy
// 为所有子项目配置
subprojects {
    apply plugin: 'java'
    apply plugin: 'io.spring.dependency-management'

    group = 'com.example'
    version = '1.0.0'

    repositories {
        mavenCentral()
    }

    dependencyManagement {
        imports {
            mavenBom 'org.springframework.boot:spring-boot-dependencies:2.7.5'
        }
    }

    tasks.withType(JavaCompile) {
        options.encoding = 'UTF-8'
    }
}

// 为特定子项目配置
configure(subprojects.findAll { it.name.endsWith('-module') }) {
    apply plugin: 'jacoco'

    jacoco {
        toolVersion = "0.8.8"
    }
}
```

### 7.4 模块间依赖

**service-module/build.gradle**

```groovy
dependencies {
    // 依赖其他模块
    implementation project(':core-module')

    // 外部依赖
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'com.fasterxml.jackson.core:jackson-databind'

    // 测试依赖
    testImplementation project(':core-module').sourceSets.test.output
}
```

### 7.5 多模块构建技巧

#### 7.5.1 排除特定模块的特定任务

```groovy
// 在根目录 build.gradle 中
gradle.taskGraph.whenReady { graph ->
    if (graph.hasTask(':web-module:build')) {
        // 当构建 web-module 时，跳过某些模块的测试
        subprojects.findAll { it.name != 'web-module' }.each { project ->
            project.tasks.withType(Test).each { task ->
                task.enabled = false
            }
        }
    }
}
```

#### 7.5.2 统一管理依赖版本

**在根目录创建 dependencies.gradle**

```groovy
ext {
    versions = [
        springBoot: "2.7.5",
        jackson: "2.13.4",
        junit: "5.9.1"
    ]

    libraries = [
        springBootStarterWeb: "org.springframework.boot:spring-boot-starter-web:${versions.springBoot}",
        jacksonDatabind: "com.fasterxml.jackson.core:jackson-databind:${versions.jackson}",
        junitJupiter: "org.junit.jupiter:junit-jupiter:${versions.junit}"
    ]
}
```

**在子模块中引用**

```groovy
// 在子模块的 build.gradle 中
dependencies {
    implementation rootProject.ext.libraries.springBootStarterWeb
    implementation rootProject.ext.libraries.jacksonDatabind
    testImplementation rootProject.ext.libraries.junitJupiter
}
```

## 8. Gradle 与 Kotlin DSL

### 8.1 Kotlin DSL 优势

Gradle Kotlin DSL 提供了比传统 Groovy DSL 更多的优势：

1. **更好的类型安全**：编译时类型检查减少运行时错误
2. **更好的 IDE 支持**：更好的代码补全、导航和重构支持
3. **可发现性**：更容易发现可用的 API 和配置选项
4. **一致性**：使用 Kotlin 语言统一构建逻辑和应用程序代码
5. **性能**：Kotlin 脚本编译后执行速度更快

### 8.2 迁移到 Kotlin DSL

#### 8.2.1 基本迁移步骤

1. **重命名构建脚本**：
   - `build.gradle` → `build.gradle.kts`
   - `settings.gradle` → `settings.gradle.kts`

2. **转换语法**：

   ```kotlin
   // Groovy
   plugins {
       id 'java'
       id 'application'
   }

   group = 'com.example'
   version = '1.0.0'

   // Kotlin DSL
   plugins {
       java
       application
   }

   group = "com.example"
   version = "1.0.0"
   ```

3. **依赖配置转换**：

   ```kotlin
   // Groovy
   dependencies {
       implementation 'org.springframework.boot:spring-boot-starter-web:2.7.5'
       testImplementation 'junit:junit:4.13.2'
   }

   // Kotlin DSL
   dependencies {
       implementation("org.springframework.boot:spring-boot-starter-web:2.7.5")
       testImplementation("junit:junit:4.13.2")
   }
   ```

#### 8.2.2 常见转换模式

1. **方法调用**：

   ```kotlin
   // Groovy: someMethod param1, param2
   // Kotlin: someMethod(param1, param2)
   ```

2. **闭包转换**：

   ```kotlin
   // Groovy: someConfig { someProperty = value }
   // Kotlin: someConfig { someProperty.set(value) }
   ```

3. **属性赋值**：

   ```kotlin
   // Groovy: someProperty = value
   // Kotlin: someProperty.set(value)
   // 或 someProperty = value (如果属性是var)
   ```

### 8.3 Kotlin DSL 最佳实践

#### 8.3.1 使用类型安全的模型访问器

```kotlin
// 对于已应用的插件，可以使用类型安全的访问器
val javaExtension = extensions.getByType<JavaPluginExtension>()
val sourceSets = javaExtension.sourceSets

// 直接访问任务
val compileJava by tasks.existing(JavaCompile::class)
compileJava {
    options.encoding = "UTF-8"
}
```

#### 8.3.2 创建扩展函数

```kotlin
// 在 buildSrc 中定义扩展函数
fun Project.configureJava() {
    extensions.configure<JavaPluginExtension> {
        toolchain {
            languageVersion.set(JavaLanguageVersion.of(11))
        }
    }

    tasks.withType<JavaCompile>().configureEach {
        options.encoding = "UTF-8"
    }
}

// 在构建脚本中使用
subprojects {
    apply(plugin = "java")
    configureJava()
}
```

#### 8.3.3 处理可能未应用的插件

```kotlin
// 安全地配置可能未应用的插件扩展
plugins.withId("java") {
    extensions.configure<JavaPluginExtension> {
        // 配置 Java 扩展
    }
}

// 或者使用 afterEvaluate
afterEvaluate {
    if (plugins.hasPlugin("java")) {
        // 配置 Java 相关设置
    }
}
```

## 9. 常见问题与解决方案

### 9.1 构建性能问题

#### 9.1.1 构建速度慢

**问题原因**：

- 依赖下载缓慢
- 配置阶段耗时过长
- 任务没有正确实现增量构建
- 内存不足导致频繁GC

**解决方案**：

```groovy
# gradle.properties
# 增加Gradle内存
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g

# 启用并行构建
org.gradle.parallel=true

# 启用配置按需
org.gradle.configureondemand=true

# 启用构建缓存
org.gradle.caching=true
```

#### 9.1.2 增量构建失效

**问题原因**：

- 自定义任务没有正确声明输入和输出
- 任务实现非确定性（每次输出不同）

**解决方案**：

```groovy
// 正确声明任务的输入和输出
abstract class ProcessTemplates extends DefaultTask {
    @InputDirectory
    abstract DirectoryProperty getInputDir()

    @OutputDirectory
    abstract DirectoryProperty getOutputDir()

    @Input
    abstract Property<String> getTemplateEngine()

    @TaskAction
    void process() {
        // 处理逻辑
    }
}
```

### 9.2 依赖管理问题

#### 9.2.1 依赖冲突

**问题原因**：

- 不同模块依赖了相同库的不同版本
- 传递依赖带来了不兼容的版本

**解决方案**：

```groovy
// 查看依赖树
./gradlew dependencies

// 查看特定配置的依赖树
./gradlew app:dependencies --configuration implementation

// 强制使用特定版本
dependencies {
    implementation('com.google.guava:guava:31.1-jre') {
        force = true
    }
}

// 使用依赖约束
dependencies {
    constraints {
        implementation 'com.fasterxml.jackson.core:jackson-databind:2.13.4.2'
    }
}
```

#### 9.2.2 依赖下载失败

**问题原因**：

- 网络问题
- 仓库地址错误
- 认证信息错误

**解决方案**：

```groovy
// 使用国内镜像仓库
repositories {
    maven { url 'https://maven.aliyun.com/repository/public' }
    mavenCentral()
}

// 配置代理
# gradle.properties
systemProp.http.proxyHost=proxy.example.com
systemProp.http.proxyPort=8080
systemProp.https.proxyHost=proxy.example.com
systemProp.https.proxyPort=8080

// 重试机制
configurations.all {
    resolutionStrategy {
        retry {
            maxRetries = 3
            maxTime = 30000 // 30秒
        }
    }
}
```

### 9.3 常见错误处理

#### 9.3.1 PluginNotFoundException

**问题描述**：找不到指定的插件。

**解决方案**：

```groovy
// 检查插件ID是否正确
plugins {
    id 'org.springframework.boot' version '2.7.5'
}

// 对于非核心插件，确保在settings.gradle中配置了插件仓库
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}
```

#### 9.3.2 TaskConfigurationException

**问题描述**：任务配置错误。

**解决方案**：

```groovy
// 检查任务依赖关系是否正确
tasks.register('taskA') {
    // 配置
}

tasks.register('taskB') {
    dependsOn tasks.named('taskA')
    // 配置
}

// 避免循环依赖
```

### 9.4 调试与诊断

#### 9.4.1 启用调试信息

```shell
# 启用详细日志
./gradlew build --info

# 启用调试日志
./gradlew build --debug

# 显示堆栈跟踪
./gradlew build --stacktrace

# 显示完整堆栈跟踪
./gradlew build --full-stacktrace
```

#### 9.4.2 分析构建性能

```shell
# 生成性能报告
./gradlew build --profile

# 生成构建扫描报告
./gradlew build --scan

# 显示任务执行时间
./gradlew build --console=verbose
```

#### 9.4.3 使用构建扫描深入分析

构建扫描提供了详细的构建分析：

1. **生成扫描报告**：

   ```shell
   ./gradlew build --scan
   ```

2. **查看性能热点**：识别耗时最长的任务和配置

3. **分析依赖关系**：查看依赖解析时间和下载时间

4. **识别问题**：发现配置错误、重复任务等问题

_以上就是关于Gradle详解与最佳实践的完整文档内容。本文涵盖了Gradle的核心概念、安装配置、项目结构、依赖管理、任务与插件、构建优化、多模块项目管理、Kotlin DSL使用以及常见问题解决方案等方面，希望能够帮助你更好地理解和使用Gradle构建工具。_
