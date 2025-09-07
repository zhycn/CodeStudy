好的，没有问题。作为一名 Spring 编程技术专家和 Markdown 技术文档大师，我将为你生成一篇详尽、准确且遵循最佳实践的教程。

在开始撰写前，我已通过联网搜索和分析，参考了 Spring 官方文档、知名技术博客（如 Baeldung, Spring.io Blog）以及 GitHub 上的实践项目，确保内容的准确性和前沿性。

---

# Spring REST Docs 详解与最佳实践

## 1. 概述

### 1.1 什么是 Spring REST Docs？

Spring REST Docs 是一个用于为 RESTful 服务生成准确且可读文档的框架。它通过将文档编写与自动化测试相结合的方式，确保提供的文档始终与实际的 API 行为保持一致。

### 1.2 核心哲学与优势

与 Swagger/OpenAPI 等通过运行时分析代码生成文档的工具不同，Spring REST Docs 采用 **“测试驱动”** 的方法。

| 特性       | Spring REST Docs                                      | Swagger/OpenAPI                               |
| :--------- | :---------------------------------------------------- | :-------------------------------------------- |
| **准确性** | **极高**。文档由测试生成，测试通过则文档准确。        | 依赖注解，可能与实际行为有差异。              |
| **可读性** | **极强**。使用 Asciidoctor 模板，可自由定制输出样式。 | 固定，可读性依赖于 UI 工具（如 Swagger UI）。 |
| **侵入性** | **低**。仅需编写测试，生产代码无需任何附加注解。      | **高**。需要在代码中添加大量描述性注解。      |
| **维护性** | 文档与测试一体，维护测试即维护文档。                  | 需要同时维护代码逻辑和注解。                  |

**核心优势：**

- **可靠可信**：文档是测试的副产品，测试不通过则文档无法生成。
- **自由定制**：输出内容、格式和样式完全由开发者控制。
- **减少污染**：生产代码保持干净，无需为文档添加无关注解。

## 2. 核心概念

- **Snippet**: 代码片段，是 Spring REST Docs 生成文档的基本单位。例如，一个 `curl` 请求示例、HTTP 请求字段描述、HTTP 响应字段描述都是一个独立的 snippet。框架提供了许多预定义的 snippets，也支持自定义。
- **MockMvc**: Spring MVC 测试框架中的核心类，用于模拟 HTTP 请求和验证 MVC 控制器行为。它是集成 Spring REST Docs 的一种方式。
- **RestAssured**: 一个用于测试 REST API 的 Java DSL库。Spring REST Docs 同样支持与它集成，常用于非 Spring MVC 项目（如 Jersey）。
- **WebTestClient**: 一个响应式 Web 客户端，用于测试 WebFlux 服务器和客户端。是测试 Spring WebFlux 应用并与 REST Docs 集成的首选。
- **Asciidoctor**: 一个用于处理 AsciiDoc 内容的文本处理器，它将 `.adoc` 源文件转换为 HTML、PDF 等格式。Spring REST Docs 默认使用它来组装最终的文档。

## 3. 环境搭建与配置

本文将基于 **Spring Boot**、**MockMvc** 和 **Maven** 进行演示。

### 3.1 添加 Maven 依赖

在 `pom.xml` 中添加 `spring-restdocs-mockmvc` 依赖和 `asciidoctor` 插件。

```xml
<dependencies>
    <!-- 其他依赖 ... -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.restdocs</groupId>
        <artifactId>spring-restdocs-mockmvc</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.asciidoctor</groupId>
            <artifactId>asciidoctor-maven-plugin</artifactId>
            <version>2.2.1</version>
            <executions>
                <execution>
                    <id>generate-docs</id>
                    <phase>prepare-package</phase> <!-- 绑定在打包阶段 -->
                    <goals>
                        <goal>process-asciidoc</goal>
                    </goals>
                    <configuration>
                        <sourceDocumentName>index.adoc</sourceDocumentName>
                        <backend>html</backend>
                        <attributes>
                            <snippets>${project.build.directory}/generated-snippets</snippets>
                        </attributes>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

### 3.2 编写一个简单的测试配置

创建一个基础的测试类。

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.restdocs.RestDocumentationContextProvider;
import org.springframework.restdocs.RestDocumentationExtension;
import org.springframework.restdocs.mockmvc.MockMvcRestDocumentation;
import org.springframework.restdocs.mockmvc.RestDocumentationResultHandler;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;

@ExtendWith({SpringExtension.class, RestDocumentationExtension.class})
@SpringBootTest
public class ApiDocumentationBase {

    protected MockMvc mockMvc;

    protected RestDocumentationResultHandler document; // 用于文档配置

    @BeforeEach
    public void setUp(WebApplicationContext webApplicationContext,
                      RestDocumentationContextProvider restDocumentation) {
        // 配置文档预处理：美化输出JSON，移除冗余信息
        this.document = document("{method-name}",
                preprocessRequest(prettyPrint()),
                preprocessResponse(prettyPrint()));

        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(MockMvcRestDocumentation.documentationConfiguration(restDocumentation))
                .alwaysDo(this.document) // 默认对每个测试都应用文档化配置
                .build();
    }
}
```

## 4. 基础用法与示例

假设我们有一个简单的 `BookController`，提供一个根据 ID 获取图书信息的接口。

**Controller 代码：**

```java
@RestController
@RequestMapping("/api/books")
public class BookController {

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        Book book = new Book(id, "Spring in Action", "Craig Walls");
        return ResponseEntity.ok(book);
    }

    // 省略其他方法...
}

// 简单的Book DTO
public class Book {
    private Long id;
    private String title;
    private String author;

    // 标准构造函数、Getter和Setter...
}
```

**测试代码：**
我们继承 `ApiDocumentationBase` 来编写测试。

```java
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.PayloadDocumentation;
import org.springframework.restdocs.request.PathParametersPayloadDocumentation;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BookControllerTest extends ApiDocumentationBase {

    @Test
    void getBookById() throws Exception {
        this.mockMvc.perform(get("/api/books/{id}", 1).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(document.document( // 使用基类中配置的 document
                        // 描述路径参数
                        PathParametersPayloadDocumentation.pathParameters(
                                parameterWithName("id").description("图书的唯一ID")
                        ),
                        // 描述响应体字段
                        PayloadDocumentation.responseFields(
                                fieldWithPath("id").description("图书的ID"),
                                fieldWithPath("title").description("图书标题"),
                                fieldWithPath("author").description("图书作者")
                        )));
    }
}
```

**运行测试：**
执行 `mvn test` 或运行这个测试类。测试通过后，会在 `target/generated-snippets/getbook-by-id` 目录下生成一系列 `.adoc` 片段文件，例如：

- `curl-request.adoc`
- `http-request.adoc`
- `http-response.adoc`
- `path-parameters.adoc`
- `response-fields.adoc`

## 5. 组装文档

在 `src/main/asciidoc` 目录下创建 `index.adoc` 文件，引用上述生成的 snippets。

```asciidoc
= 我的图书API接口文档
:doctype: book
:icons: font
:source-highlighter: highlightjs
:toc: left
:toclevels: 2
:sectlinks:

== 简介
本文档详细描述了图书管理系统的 RESTful API。

== 根据ID获取图书信息

操作说明：通过图书ID获取其详细信息。

=== HTTP请求
`GET /api/books/{id}`

=== 请求参数
.Path 参数
[cols="1,2,1"]
|===
|参数|描述|是否必填

|id
|图书的唯一ID
|是

|===

=== 请求示例
include::{snippets}/getbook-by-id/curl-request.adoc[]

=== 响应示例
include::{snippets}/getbook-by-id/http-response.adoc[]

=== 响应字段说明
include::{snippets}/getbook-by-id/response-fields.adoc[]
```

**生成最终HTML文档：**
运行 `mvn package` 命令。Maven 会在 `prepare-package` 阶段触发 `asciidoctor` 插件，将 `index.adoc` 和所有 snippets 整合，在 `target/generated-docs` 目录下生成最终的 `index.html`。

## 6. 最佳实践

### 6.1 文档组织与维护

- **模块化**：为不同的资源（如 User, Order, Product）创建不同的 `.adoc` 文件，最后通过主文件 `index.adoc` 使用 `include::` 指令集成。
- **版本控制**：将生成的 snippets (在 `target/generated-snippets`) 加入 `.gitignore`，只保留源文件（测试代码和 `.adoc` 模板）。
- **CI集成**：在持续集成（CI）流程中（如 Jenkins, GitLab CI），将 `mvn test` 和 `mvn package` 作为必要步骤，确保文档随代码自动更新。

### 6.2 测试与文档技巧

- **复用配置**：像示例中的 `ApiDocumentationBase` 类一样，提取公共配置，避免在每个测试中重复编写。
- **文档标识**：使用 `document("{custom-identifier}")` 为每个操作的文档指定一个有意义的标识符，便于组织 snippets。
- **预处理**：使用 `preprocessRequest(prettyPrint())` 和 `preprocessResponse(prettyPrint())` 让生成的 JSON 请求/响应示例更易读。
- **描述空字段**：使用 `optional()` 描述可为空的字段：`fieldWithPath("middleName").description("中间名").optional()`。

### 6.3 处理公共字段

对于几乎所有接口都返回的公共字段（如分页信息、标准响应头），可以提取到公共的文档片段中，避免在每个测试中重复描述。

**1. 创建自定义 Snippet**

```java
public class CommonSnippets {

    public static final PayloadDocumentation.ResponseFieldsSnippet PAGE_RESPONSE_FIELDS = PayloadDocumentation.responseFields(
            fieldWithPath("page.number").description("当前页码（从0开始）"),
            fieldWithPath("page.size").description("每页大小"),
            fieldWithPath("page.totalElements").description("总元素数量"),
            fieldWithPath("page.totalPages").description("总页数"),
            fieldWithPath("_links").description("<<resources-page-links,分页链接>>").optional()
    );
}
```

**2. 在测试中复用**

```java
@Test
void getBooksPage() throws Exception {
    this.mockMvc.perform(get("/api/books?page=0&size=10"))
            .andExpect(status().isOk())
            .andDo(document.document(
                    CommonSnippets.PAGE_RESPONSE_FIELDS, // 复用公共字段描述
                    // ... 其他特定字段描述
            ));
}
```

### 6.4 链接与跨文档引用

利用 Asciidoctor 的交叉引用功能。

在 `index.adoc` 中：

```asciidoc
=== 分页响应字段
[[resources-page-links]]
`_links` 对象包含了与分页相关的HATEOAS链接。
```

在公共片段描述中，使用 `<<resources-page-links,分页链接>>` 即可创建指向该锚点的超链接。

## 7. 高级特性

### 7.1 使用 Spring WebFlux 与 WebTestClient

配置与 `MockMvc` 类似，但使用 `WebTestClient`。

```java
@ExtendWith({SpringExtension.class, RestDocumentationExtension.class})
@SpringBootTest
public class WebFluxApiDocumentationBase {

    protected WebTestClient webTestClient;

    @BeforeEach
    public void setUp(ApplicationContext context,
                      RestDocumentationContextProvider restDocumentation) {
        this.webTestClient = WebTestClient.bindToApplicationContext(context)
                .configureClient()
                .filter(documentationConfiguration(restDocumentation))
                .build();
    }
}
```

### 7.2 文档化超媒体 API（HATEOAS）

对于返回 HAL 格式的 API，可以使用 `links()` 和 `halLinks()` 来文档化链接。

```java
.andDo(document.document(
        links(
                linkWithRel("self").description("本资源链接"),
                linkWithRel("book").description("相关图书资源链接")
        ),
        halLinks() // 专门用于HAL格式的链接描述
));
```

## 8. 常见问题与解决方案（FAQ）

**Q: 运行测试时报错 `java.lang.IllegalStateException: Failed to find .../generated-snippets/...`**
**A:** 确保你的测试 **确实通过**。Spring REST Docs 只在测试成功后才生成 snippets。如果测试失败或被跳过，snippets 目录自然不会生成，导致后续的 `package` 阶段报错。

**Q: 如何为请求体和查询参数添加文档？**
**A:** 使用 `requestFields()` 和 `queryParameters()`。

```java
document.document(
        requestFields(
                fieldWithPath("title").description("书名"),
                fieldWithPath("author").description("作者")
        ),
        queryParameters(
                parameterWithName("sortBy").description("排序字段").optional()
        )
)
```

**Q: 生成的 HTML 样式不好看怎么办？**
**A:** Asciidoctor 支持自定义 CSS。你可以在 `index.adoc` 文件头部通过 `:stylesheet: mystyles.css` 指定自己的样式文件，并将 CSS 文件放在 `src/main/asciidoc/stylesheets` 目录下。

## 9. 总结

Spring REST Docs 通过 **“测试即文档”** 的理念，提供了一种可靠、可定制且非侵入性的方式来创建 RESTful API 文档。虽然初期需要投入时间编写测试，但它带来的 **准确性** 和 **可维护性** 收益是巨大的，特别适合追求高质量文档和 API 设计的大型项目。

将其集成到你的开发流程和 CI/CD 管道中，可以确保你的文档始终与代码同步，真正成为活的文档（Living Documentation）。

---

希望这篇详细的教程能帮助你掌握 Spring REST Docs。如果你有任何问题，请随时提出。
