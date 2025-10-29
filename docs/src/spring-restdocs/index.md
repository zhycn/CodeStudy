# Spring REST Docs

Spring REST Docs 是 Spring 生态体系中的一个子项目，用于生成 RESTful API 的文档。它基于 AsciiDoc 格式，支持自动生成 API 文档、请求示例、响应示例等，能够显著提升 RESTful API 的文档质量和维护成本。但由于上手成本较高，自动化程度有限，交互性弱，决定了它不是一个主流的 API 文档工具。

- [Spring REST Docs 官方网站](https://spring.io/projects/spring-restdocs)
- [Spring REST Docs 文档地址](https://docs.spring.io/spring-restdocs/docs/current/reference/htmlsingle/)
- [Spring REST Docs 代码仓库](https://github.com/spring-projects/spring-restdocs)
- [Spring REST Docs API 文档](https://docs.spring.io/spring-restdocs/docs/current/api/)

其他 API 文档工具：

- Swagger: <https://swagger.io/>
- API Blueprint: <https://apiblueprint.org/>
- RAML: <https://raml.org/>
- OpenAPI: <https://www.openapis.org/>
- Postman: <https://www.postman.com/>
- Insomnia: <https://insomnia.rest/>
- Redocly: <https://redocly.com/>
- SpringDoc: <https://springdoc.org/>
- Asciidoctor: <https://asciidoctor.org/>

## Swagger/OpenAPI（最主流的选择）

- **核心工具**：SpringDoc（整合 OpenAPI 3.0 与 Spring Boot）、Swagger UI（交互式文档界面）。
- **特点**：通过注解（如 @Operation、@Parameter）描述 API，启动应用后自动生成 JSON 格式的 OpenAPI 规范，再通过 Swagger UI 展示为可交互的网页（支持在线调用 API、查看参数说明）。
- **优势**：
  - **开发效率高**：几乎零配置（引入依赖即可），注解简单直观；
  - **交互性强**：前端 / 测试人员可直接在 UI 上调试 API，无需额外工具；
  - **生态成熟**：支持导出 JSON/YAML 规范，可集成到其他工具（如 Postman、APIFox）。
- **劣势**：
  - **代码污染**：大量注解可能影响代码可读性；
  - **文档深度有限**：自动生成的文档偏 “技术细节”，缺乏业务场景说明（需手动补充）。
- **适合场景**：内部项目、快速迭代的团队、需要实时调试 API 的场景。

以下是 Spring REST Docs 详解与最佳实践。

## 1. Spring REST Docs 概述

Spring REST Docs 是 Spring 官方推出的一款用于生成 RESTful API 文档的工具，它采用了一种**测试驱动**的文档生成方法。与传统的文档工具不同，Spring REST Docs 通过在单元测试中捕获 API 的请求和响应信息，自动生成准确且与代码保持同步的 API 文档 。

### 1.1 核心价值与优势

Spring REST Docs 的核心价值在于它确保了文档的**准确性和时效性**。由于文档直接来源于测试用例，只有当接口实际行为发生变化时，文档才会相应更新，这有效避免了文档与实现脱节的问题 。

相比于其他文档工具，Spring REST Docs 具有以下显著优势：

- **高可信度文档**：文档基于实际测试生成，真实反映 API 的行为
- **减少代码侵入**：不需要在业务代码中添加大量注解，保持代码整洁
- **灵活的输出格式**：支持 HTML、PDF、AsciiDoc 等多种格式
- **与 Spring 生态无缝集成**：天然支持 Spring MVC 和 Spring Boot
- **易于集成 CI/CD**：可以自动化生成和发布文档

### 1.2 与其他文档工具对比

Swagger 是另一个流行的 API 文档工具，它与 Spring REST Docs 有着不同的设计哲学和应用场景。Swagger 通过注解方式生成文档，提供交互式 UI 界面，适合快速原型开发和 API 探索。而 Spring REST Docs 更注重文档的准确性和维护性，适合对文档质量要求较高的企业级应用 。

下面的表格对比了两种工具的主要特性：

| 特性         | Spring REST Docs | Swagger              |
| ------------ | ---------------- | -------------------- |
| 文档生成方式 | 测试驱动         | 注解驱动             |
| 代码侵入性   | 低               | 高                   |
| 文档准确性   | 高（与测试一致） | 中等（依赖注解维护） |
| 交互式测试   | 不支持           | 支持                 |
| 输出格式     | HTML、PDF 等     | 主要为 HTML          |
| 学习曲线     | 较陡峭           | 相对平缓             |

## 2. 环境搭建与配置

### 2.1 依赖配置

在 Spring Boot 项目中集成 Spring REST Docs 首先需要添加相关依赖。以 Maven 项目为例，需要在 `pom.xml` 中添加以下依赖：

```xml
<dependencies>
    <!-- Spring Boot Starter Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>

    <!-- Spring REST Docs -->
    <dependency>
        <groupId>org.springframework.restdocs</groupId>
        <artifactId>spring-restdocs-mockmvc</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <!-- Asciidoctor 插件 -->
        <plugin>
            <groupId>org.asciidoctor</groupId>
            <artifactId>asciidoctor-maven-plugin</artifactId>
            <version>2.4.0</version>
            <executions>
                <execution>
                    <phase>prepare-package</phase>
                    <goals>
                        <goal>process-asciidoc</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

对于 Gradle 项目，需要在 `build.gradle` 中添加相应配置：

```gradle
plugins {
    id 'org.asciidoctor.jvm' version '3.3.2'
}

dependencies {
    testImplementation 'org.springframework.restdocs:spring-restdocs-mockmvc'
}

asciidoctor {
    sources {
        include '**/*.adoc'
    }
}
```

### 2.2 测试环境配置

Spring REST Docs 与 JUnit 5 集成，需要通过扩展机制进行配置。以下是基本的测试类配置：

```java
@ExtendWith({RestDocumentationExtension.class, SpringExtension.class})
@WebMvcTest(YourController.class)
@AutoConfigureRestDocs
public class YourControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    public void setUp(WebApplicationContext webApplicationContext,
                      RestDocumentationContextProvider restDocumentation) {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(documentationConfiguration(restDocumentation))
                .build();
    }
}
```

## 3. 核心概念与工作机制

### 3.1 文档片段（Snippets）

Spring REST Docs 的核心概念是**文档片段**。这些片段是从测试中提取的小块文档内容，每个片段描述 API 的某个特定方面。常见的片段类型包括：

- **HTTP 请求和响应**：展示原始的 HTTP 交互
- **请求和响应字段**：描述 payload 中的各个字段
- **路径参数**：描述 URL 路径参数
- **查询参数**：描述 URL 查询参数
- **请求头**：描述 HTTP 头信息

测试运行时，Spring REST Docs 会为每个测试方法生成一组片段文件，默认保存在 `target/generated-snippets` 目录（Maven）或 `build/generated-snippets` 目录（Gradle）中。

### 3.2 测试驱动文档生成

Spring REST Docs 采用**测试驱动文档生成**机制，这意味着文档的生成过程与测试执行紧密绑定。当测试通过时，相应的文档片段会被生成；如果测试失败，则不会生成文档。这种机制确保了文档与 API 实际行为的一致性 。

工作机制可以概括为以下步骤：

1. 编写针对 API 端点的测试用例
2. 在测试中配置文档生成规则
3. 运行测试，Spring REST Docs 捕获请求和响应
4. 根据捕获的信息生成文档片段
5. 使用 Asciidoctor 将片段组合成完整文档

## 4. 基础用法与示例

### 4.1 简单的 API 文档生成

让我们从一个简单的示例开始，了解 Spring REST Docs 的基本用法。假设我们有一个返回用户信息的端点：

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.findUserById(id);
        return ResponseEntity.ok(user);
    }
}
```

对应的测试类如下：

```java
@ExtendWith({RestDocumentationExtension.class, SpringExtension.class})
@WebMvcTest(UserController.class)
@AutoConfigureRestDocs
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    public void getUserById() throws Exception {
        // 准备测试数据
        User user = new User(1L, "张三", "zhangsan@example.com");
        when(userService.findUserById(1L)).thenReturn(user);

        // 执行测试并生成文档
        this.mockMvc.perform(get("/api/users/{id}", 1)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(document("users/get-by-id",
                        pathParameters(
                                parameterWithName("id").description("用户ID")
                        )));
    }
}
```

### 4.2 请求和响应字段文档化

对于包含复杂请求体或响应体的 API，我们需要详细描述各个字段的含义。Spring REST Docs 提供了强大的字段文档化功能：

```java
@Test
public void createUser() throws Exception {
    String userJson = "{\"name\":\"李四\",\"email\":\"lisi@example.com\"}";

    this.mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(userJson))
            .andExpect(status().isCreated())
            .andDo(document("users/create",
                    requestFields(
                            fieldWithPath("name").description("用户姓名"),
                            fieldWithPath("email").description("用户邮箱")
                    ),
                    responseFields(
                            fieldWithPath("id").description("用户ID"),
                            fieldWithPath("name").description("用户姓名"),
                            fieldWithPath("email").description("用户邮箱"),
                            fieldWithPath("createdAt").description("创建时间")
                    )));
}
```

### 4.3 参数文档化

对于接受参数（路径参数、查询参数）的 API，需要详细描述这些参数：

```java
@Test
public void getUsersByCriteria() throws Exception {
    this.mockMvc.perform(get("/api/users")
            .param("name", "张三")
            .param("page", "0")
            .param("size", "10"))
            .andExpect(status().isOk())
            .andDo(document("users/get-by-criteria",
                    queryParameters(
                            parameterWithName("name").description("姓名过滤条件").optional(),
                            parameterWithName("page").description("页码，从0开始").optional(),
                            parameterWithName("size").description("每页大小").optional()
                    )));
}
```

## 5. 高级特性与定制化

### 5.1 自定义片段生成

Spring REST Docs 允许深度定制生成的文档片段。你可以控制哪些信息被包含，以及如何呈现这些信息：

```java
@Test
public void getUserWithCustomSnippets() throws Exception {
    this.mockMvc.perform(get("/api/users/{id}", 1))
            .andExpect(status().isOk())
            .andDo(document("users/get-with-custom",
                    preprocessRequest(prettyPrint()),
                    preprocessResponse(prettyPrint()),
                    pathParameters(
                            parameterWithName("id").description("用户ID")
                    ),
                    responseFields(
                            fieldWithPath("id").description("用户ID"),
                            fieldWithPath("name").description("用户姓名"),
                            fieldWithPath("email").description("用户邮箱")
                    )));
}
```

### 5.2 文档预处理

Spring REST Docs 提供了预处理功能，可以对请求和响应内容进行格式化等操作：

```java
@Test
public void getUserWithPreprocessing() throws Exception {
    this.mockMvc.perform(get("/api/users/{id}", 1))
            .andExpect(status().isOk())
            .andDo(document("users/get-preprocessed",
                    preprocessRequest(removeHeaders("Authorization")),
                    preprocessResponse(prettyPrint())));
}
```

### 5.3 多格式输出支持

除了默认的 AsciiDoc 格式，Spring REST Docs 还支持多种输出格式。通过配置，可以生成 HTML、PDF 等格式的文档：

```xml
<!-- 在 pom.xml 中配置多格式输出 -->
<plugin>
    <groupId>org.asciidoctor</groupId>
    <artifactId>asciidoctor-maven-plugin</artifactId>
    <version>2.4.0</version>
    <executions>
        <execution>
            <id>output-html</id>
            <phase>prepare-package</phase>
            <goals>
                <goal>process-asciidoc</goal>
            </goals>
            <configuration>
                <backend>html</backend>
                <doctype>book</doctype>
            </configuration>
        </execution>
        <execution>
            <id>output-pdf</id>
            <phase>prepare-package</phase>
            <goals>
                <goal>process-asciidoc</goal>
            </goals>
            <configuration>
                <backend>pdf</backend>
                <doctype>book</doctype>
            </configuration>
        </execution>
    </executions>
</plugin>
```

## 6. 最佳实践

### 6.1 文档组织结构

良好的文档组织结构对于大型项目的 API 文档至关重要。建议按以下方式组织文档：

```java
src/
└── main/
    └── asciidoc/
        ├── index.adoc          # 文档首页
        ├── introduction.adoc   # 介绍
        ├── getting-started.adoc # 快速开始
        ├── api-reference/      # API 参考
        │   ├── users.adoc
        │   ├── products.adoc
        │   └── orders.adoc
        └── appendix.adoc       # 附录
```

在 `index.adoc` 中引入各个模块：

```asciidoc
= API 参考文档
:doctype: book
:icons: font
:source-highlighter: highlightjs
:toc: left
:toclevels: 3
:sectlinks:

include::introduction.adoc[]
include::getting-started.adoc[]

== API 参考
include::api-reference/users.adoc[]
include::api-reference/products.adoc[]
include::api-reference/orders.adoc[]

include::appendix.adoc[]
```

### 6.2 测试代码组织策略

随着项目规模扩大，测试代码的组织变得尤为重要。以下是一些组织策略：

**按功能模块分组测试**：

```java
// 用户相关 API 测试
@Nested
class UserApiTests {

    @Test
    void getUserById() {
        // 测试逻辑
    }

    @Test
    void createUser() {
        // 测试逻辑
    }
}

// 产品相关 API 测试
@Nested
class ProductApiTests {

    @Test
    void getProductById() {
        // 测试逻辑
    }
}
```

**使用测试基类共享配置**：

```java
public abstract class ApiDocumentationBase {

    protected RequestSpecification documentationSpec;

    @BeforeEach
    public void setUp(RestDocumentationContextProvider restDocumentation) {
        this.documentationSpec = new RequestSpecBuilder()
                .addFilter(documentationConfiguration(restDocumentation))
                .build();
    }
}

public class UserControllerTest extends ApiDocumentationBase {
    // 测试类继承共享配置
}
```

### 6.3 持续集成与自动化

将文档生成集成到 CI/CD 流程中可以确保文档始终与代码同步。以下是一个基本的 CI 配置示例：

```yaml
# GitHub Actions 示例
name: CI with Documentation
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up JDK 11
        uses: actions/setup-java@v2
        with:
          java-version: '11'
          distribution: 'adopt'
      - name: Build with Maven
        run: mvn clean package
      - name: Publish Documentation
        run: |
          git clone --branch gh-pages https://github.com/$GITHUB_REPOSITORY.git gh-pages
          cp -R target/generated-docs/* gh-pages/
          cd gh-pages
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "Update documentation"
          git push
```

### 6.4 文档质量保证

确保文档质量的几个关键实践：

1. **文档覆盖率检查**：确保所有 API 端点都有对应的文档
2. **示例数据真实性**：使用真实且有意义的示例数据
3. **错误场景覆盖**：不仅文档成功场景，也要文档错误和边界情况
4. **定期评审**：定期组织文档评审会议，邀请多方参与

```java
// 错误场景文档示例
@Test
public void getUserNotFound() throws Exception {
    when(userService.findUserById(999L)).thenThrow(new UserNotFoundException());

    this.mockMvc.perform(get("/api/users/{id}", 999))
            .andExpect(status().isNotFound())
            .andDo(document("users/get-not-found",
                    responseFields(
                            fieldWithPath("errorCode").description("错误代码"),
                            fieldWithPath("message").description("错误信息")
                    )));
}
```

## 7. 常见问题与解决方案

### 7.1 版本兼容性问题

Spring REST Docs 与 Spring Boot 版本之间存在兼容性要求。以下是一些常见的兼容配置：

| Spring Boot 版本 | Spring REST Docs 版本 |
| ---------------- | --------------------- |
| 2.5.x            | 2.0.6.RELEASE         |
| 2.6.x            | 2.0.7.RELEASE         |
| 2.7.x            | 2.0.8.RELEASE         |
| 3.0.x            | 3.0.0                 |

在项目中明确指定兼容的版本号可以避免大部分兼容性问题：

```xml
<properties>
    <spring-restdocs.version>2.0.8.RELEASE</spring-restdocs.version>
</properties>
```

### 7.2 测试失败排查

当 Spring REST Docs 测试失败时，通常需要检查以下几个方面：

1. **MockMvc 配置是否正确**
2. **文档化步骤是否放在正确位置**（在性能测试之后）
3. **字段路径是否与实际数据结构匹配**
4. **依赖的服务是否正确 Mock**

启用详细日志有助于排查问题：

```java
@Test
public void getUserWithDebug() throws Exception {
    this.mockMvc.perform(get("/api/users/{id}", 1))
            .andDo(print()) // 打印详细请求/响应信息
            .andExpect(status().isOk())
            .andDo(document("users/get-debug"));
}
```

### 7.3 性能优化建议

当项目规模较大时，文档生成可能成为构建过程的瓶颈。以下是一些优化建议：

1. **并行执行测试**：利用 JUnit 5 的并行测试功能
2. **增量文档生成**：只对变化的 API 重新生成文档
3. **缓存测试上下文**：避免重复初始化 Spring 上下文

```java
// JUnit 5 并行测试配置
junit.jupiter.execution.parallel.enabled = true
junit.jupiter.execution.parallel.mode.default = concurrent
```

## 8. 总结

Spring REST Docs 是一个强大而灵活的 API 文档生成工具，它通过测试驱动的方式确保了文档的准确性和时效性。虽然学习曲线相对陡峭，但一旦掌握，能够为项目带来长期的可维护性 benefits 。

在实际项目中成功实施 Spring REST Docs 需要团队共识、适当的培训以及将其集成到开发流程中。当这些条件满足时，Spring REST Docs 能够显著提升 API 文档的质量，减少维护成本，并提高开发效率 。

随着 API 优先开发模式的普及，对高质量 API 文档的需求将日益增长。Spring REST Docs 作为 Spring 生态系统中的重要组成部分，将继续演进，为开发者提供更加强大和易用的文档生成能力 。
