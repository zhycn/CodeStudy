---
title: Springdoc OpenAPI 与 Spring Boot 3 集成详解与最佳实践
description: 详细介绍了如何在 Spring Boot 3 项目中集成 Springdoc OpenAPI 3.1，包括基本配置、注解使用、自定义文档等。
---

# Springdoc OpenAPI 与 Spring Boot 3 集成详解与最佳实践

- Springdoc OpenAPI 官方文档: <https://springdoc.org/>

| 项目                       | 内容                                      |
| :------------------------- | :---------------------------------------- |
| **目标框架**               | Spring Boot 3.x (基于 Spring Framework 6) |
| **JDK 版本**               | JDK 17+                                   |
| **Springdoc OpenAPI 版本** | 2.3.0+                                    |
| **支持规范**               | OpenAPI 3.1                               |

## 1. 引言

### 1.1 什么是 OpenAPI？

OpenAPI 规范（原 Swagger 规范）是一个用于描述 RESTful API 的标准化格式，它使得：

- **人类**和**机器**都能理解API的功能
- **无需访问源代码**即可理解服务能力
- **自动生成客户端SDK**
- **自动化测试**
- **生成交互式文档**

> OpenAPI 3.0 是目前主流版本，而 OpenAPI 3.1 增加了对 JSON Schema 更好的支持。

### 1.2 什么是 Springdoc OpenAPI？

Springdoc OpenAPI 是一个基于 OpenAPI 3 规范的开源库，它能：

- 自动从 Spring Boot 应用中生成 OpenAPI 描述
- 提供 Swagger UI 和 ReDoc 界面
- 与 Spring Boot 3 和 Jakarta EE 9+ 完美兼容
- 支持 Spring MVC 和 Spring WebFlux
- 提供丰富的注解和配置选项

### 1.3 Springdoc vs SpringFox

| 特性                   | Springdoc OpenAPI          | SpringFox (Swagger)            |
| :--------------------- | :------------------------- | :----------------------------- |
| **Spring Boot 3 支持** | ✅ 完全支持                | ❌ 不支持（不兼容 Jakarta EE） |
| **OpenAPI 3.1 支持**   | ✅ 完全支持                | ❌ 只支持 OpenAPI 2.0          |
| **WebFlux 支持**       | ✅ 优秀支持                | ⚠️ 有限支持                    |
| **维护活跃度**         | ✅ 高 (2024年仍在积极维护) | ⚠️ 低 (2023年起基本停止维护)   |
| **配置方式**           | ✅ 注解与配置分离          | ❌ 注解与配置耦合              |
| **社区支持**           | ✅ 强大社区支持            | ❌ 社区迁移至Springdoc         |

**结论：** **Springdoc OpenAPI 是 Spring Boot 3 的唯一推荐选择**

## 2. 快速集成与基础配置

### 2.1 依赖配置 (Maven)

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.11</version> <!-- 使用最新版本 -->
</dependency>

<!-- 可选：如果需要WebFlux支持 -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webflux-ui</artifactId>
    <version>2.8.11</version>
</dependency>
```

### 2.2 基本配置 (application.yml)

以下均为可选配置，可根据实际需求进行调整：

- `api-docs` 配置组：控制 OpenAPI 文档的生成和访问
- `swagger-ui` 配置组：自定义 Swagger UI 界面的展示
- `cache` 配置组：管理文档缓存机制
- `default-*` 配置：设置默认的媒体类型
- `servers` 配置：定义可用的服务器环境

```yaml
# application.yml
springdoc:
  # API 文档基本信息配置
  api-docs:
    enabled: true
    path: /v3/api-docs # JSON格式的OpenAPI规范端点
    groups:
      enabled: true # 开启分组功能

  # Swagger UI 配置
  swagger-ui:
    path: /swagger-ui.html # UI访问路径
    operations-sorter: alpha # 按字母排序操作
    tags-sorter: alpha # 按字母排序标签
    try-it-out-enabled: true # 启用"Try it out"功能
    persist-authorization: true # 保持授权信息
    filter: true # 显示搜索框
    urls: # 多文档源配置（微服务场景）
      - name: users
        url: /v3/api-docs/users
      - name: products
        url: /v3/api-docs/products

  # 全局配置
  cache:
    disabled: false # 缓存控制
  default-consumes-media-type: application/json
  default-produces-media-type: application/json
  servers: # 全局服务端点
    - url: http://localhost:8080
      description: Local server
    - url: https://prod.example.com
      description: Production server
```

### 2.3 测试基本配置

启动应用后，访问以下端点：

1. `http://localhost:8080/v3/api-docs` - OpenAPI JSON 描述
2. `http://localhost:8080/swagger-ui.html` - Swagger UI 界面

## 3. 控制器与模型注解详解

### 3.1 控制器层注解

```java
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理", description = "用户相关的操作接口")
@SecurityRequirement(name = "BearerAuth") // 全局安全要求
public class UserController {

    @Operation(
        summary = "创建用户",
        description = "创建一个新的系统用户",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "用户信息",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserCreateRequest.class),
                examples = @ExampleObject(
                    name = "Example request",
                    value = "{\"username\": \"john_doe\", \"email\": \"john@example.com\"}"
                )
            )
        )
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "201",
            description = "用户创建成功",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "请求参数无效",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiError.class)
            )
        )
    })
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
        @Valid @RequestBody UserCreateRequest request) {
        // 实现
    }

    @Operation(
        summary = "获取用户详情",
        description = "通过用户ID获取用户的详细信息"
    )
    @GetMapping("/{id}")
    public UserResponse getUserById(
        @Parameter(
            name = "id",
            description = "用户唯一标识符",
            required = true,
            example = "123"
        )
        @PathVariable Long id) {
        // 实现
    }

    @Operation(
        summary = "搜索用户",
        description = "根据多种条件搜索用户"
    )
    @GetMapping("/search")
    public Page<UserResponse> searchUsers(
        @Parameter(
            description = "用户名关键字",
            example = "john"
        )
        @RequestParam(required = false) String username,

        @Parameter(
            description = "邮箱关键字",
            example = "example.com"
        )
        @RequestParam(required = false) String email,

        @Parameter(
            description = "分页参数",
            schema = @Schema(implementation = Pageable.class),
            examples = @ExampleObject(
                name = "page-request",
                value = "{\"page\":0, \"size\":10, \"sort\":\"username,asc\"}"
            )
        )
        Pageable pageable) {
        // 实现
    }
}
```

### 3.2 模型层注解

```java
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

@Schema(description = "用户创建请求")
public record UserCreateRequest(

    @Schema(
        description = "用户名",
        minLength = 3,
        maxLength = 50,
        example = "john_doe",
        pattern = "^[a-zA-Z0-9_]+$"
    )
    @NotBlank
    @Size(min = 3, max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9_]+$")
    String username,

    @Schema(
        description = "邮箱地址",
        format = "email",
        example = "user@example.com"
    )
    @Email
    @NotBlank
    String email,

    @Schema(
        description = "用户角色",
        allowableValues = {"ADMIN", "USER", "GUEST"},
        defaultValue = "USER"
    )
    @NotNull
    UserRole role
) {}

@Schema(description = "用户响应数据")
public record UserResponse(
    @Schema(description = "用户ID", example = "123")
    Long id,

    @Schema(description = "用户名", example = "john_doe")
    String username,

    @Schema(description = "邮箱地址", example = "john@example.com")
    String email,

    @Schema(
        description = "用户状态",
        implementation = UserStatus.class,
        example = "ACTIVE"
    )
    UserStatus status,

    @Schema(
        description = "创建时间",
        format = "date-time",
        example = "2023-10-15T12:34:56Z"
    )
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    LocalDateTime createdAt
) {}

@Schema(description = "用户状态")
public enum UserStatus {
    @Schema(description = "活跃状态") ACTIVE,
    @Schema(description = "已禁用") DISABLED,
    @Schema(description = "待验证") PENDING_VERIFICATION
}
```

## 4. 高级配置与定制化

### 4.1 全局配置类

```java
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("用户管理系统 API")
                .version("1.0")
                .description("基于Spring Boot 3和Springdoc的用户管理API")
                .contact(new Contact()
                    .name("API支持团队")
                    .email("support@example.com")
                    .url("https://support.example.com"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0")))
            .components(new Components()
                // 添加JWT认证方案
                .addSecuritySchemes("BearerAuth",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT"))
                // 添加问题详情响应模型
                .addSchemas("ProblemDetail",
                    new io.swagger.v3.oas.models.media.Schema<Object>()
                        .type("object")
                        .addProperties("type", new io.swagger.v3.oas.models.media.StringSchema())
                        .addProperties("title", new io.swagger.v3.oas.models.media.StringSchema())
                        .addProperties("status", new io.swagger.v3.oas.models.media.IntegerSchema())
                        .addProperties("detail", new io.swagger.v3.oas.models.media.StringSchema())));
    }

    @Bean
    public OpenApiCustomizer openApiCustomizer() {
        return openApi -> {
            // 为所有操作添加JWT安全要求
            openApi.getPaths().values()
                .forEach(pathItem -> pathItem.readOperations().forEach(operation ->
                    operation.addSecurityItem(
                        new SecurityRequirement().addList("BearerAuth")
                    )
                ));

            // 为所有错误响应添加ProblemDetail模型引用
            openApi.getPaths().values()
                .forEach(pathItem -> pathItem.readOperations().forEach(operation -> {
                    operation.getResponses().values()
                        .stream()
                        .filter(response -> response.getContent().containsKey("application/json"))
                        .forEach(response -> {
                            if (response.getContent().get("application/json").getSchema() == null) {
                                response.getContent().get("application/json").setSchema(
                                    new io.swagger.v3.oas.models.media.Schema<>().$ref("#/components/schemas/ProblemDetail"));
                            }
                        });
                }));
        };
    }
}
```

### 4.2 分组与多版本API

```java
import org.springdoc.core.configuration.SpringDocConfiguration;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springdoc.core.filters.OpenApiMethodFilter;
import org.springdoc.core.group.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;

@Configuration
public class OpenApiGroupConfig {

    // v1 版本的API分组
    @Bean
    public GroupedOpenApi v1Api() {
        return GroupedOpenApi.builder()
            .group("v1")
            .pathsToMatch("/api/v1/**")
            .packagesToScan("com.example.api.v1")
            .addOpenApiCustomizer(v1Customizer())
            .build();
    }

    // v2 版本的API分组
    @Bean
    public GroupedOpenApi v2Api() {
        return GroupedOpenApi.builder()
            .group("v2")
            .pathsToMatch("/api/v2/**")
            .packagesToScan("com.example.api.v2")
            .addOperationCustomizer(versionCustomizer("v2"))
            .build();
    }

    private OpenApiCustomizer v1Customizer() {
        return openApi -> {
            // 为所有v1端点添加废弃标记
            openApi.getPaths().values().forEach(pathItem -> {
                pathItem.readOperations().forEach(op -> {
                    op.setDeprecated(true);
                    op.setSummary(op.getSummary() + " [v1已废弃]");
                });
            });

            // 添加v1特定的描述信息
            openApi.getInfo().setDescription(
                openApi.getInfo().getDescription() + "\n\n## v1版本说明\nv1版本已废弃，请迁移到v2版本");
        };
    }

    private OperationCustomizer versionCustomizer(String version) {
        return (operation, handlerMethod) -> {
            // 为操作添加版本标记
            operation.setSummary(operation.getSummary() + " (" + version.toUpperCase() + ")");

            // 添加版本头参数
            operation.addParametersItem(new io.swagger.v3.oas.models.parameters.Parameter()
                .in("header")
                .name("X-API-Version")
                .required(true)
                .description("API版本")
                .schema(new io.swagger.v3.oas.models.media.Schema<>().type("string").example(version)));

            return operation;
        };
    }
}
```

## 5. 安全配置

### 5.1 JWT认证方案

```java
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityConfig {

    @Bean
    public OpenAPI securityOpenAPI() {
        return new OpenAPI()
            .components(new Components()
                .addSecuritySchemes("BearerAuth",
                    new SecurityScheme()
                        .name("Authorization")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("使用JWT令牌认证，格式：Bearer {token}"))
            );
    }

    @Bean
    public OpenApiCustomizer globalSecurityCustomizer() {
        return openApi -> {
            // 为所有路径添加安全需求
            openApi.getPaths().forEach((key, pathItem) ->
                pathItem.readOperations().forEach(operation ->
                    operation.addSecurityItem(new SecurityRequirement().addList("BearerAuth"))
            );
        };
    }
}
```

### 5.2 OAuth2认证方案

```java
@Bean
public OpenAPI oauth2SecurityOpenAPI() {
    final String securitySchemeName = "oauth2";

    OAuthFlow passwordFlow = new OAuthFlow()
        .tokenUrl("/oauth/token")
        .refreshUrl("/oauth/refresh")
        .addScopesItem("read", new Scope().description("读取权限"))
        .addScopesItem("write", new Scope().description("写入权限"));

    return new OpenAPI()
        .components(new Components()
            .addSecuritySchemes(securitySchemeName,
                new SecurityScheme()
                    .type(SecurityScheme.Type.OAUTH2)
                    .flows(new OAuthFlows().password(passwordFlow))
                    .description("OAuth2 密码模式认证")))
        .addSecurityItem(new SecurityRequirement().addList(securitySchemeName));
}
```

## 6. 生产环境最佳实践

### 6.1 安全最佳实践

1. **禁用未授权访问（生产环境）**：
   在 `application-prod.yml` 中添加：

   ```yaml
   springdoc:
     swagger-ui:
       enabled: false
     api-docs:
       enabled: false
   ```

2. **仅限内部网络访问**：
   通过 Spring Security 配置访问控制：

   ```java
   @Configuration
   @Profile("prod")
   public class SecurityConfig {

       @Bean
       public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
           http
               .securityMatcher("/swagger-ui/**", "/v3/api-docs/**")
               .authorizeHttpRequests(auth -> auth
                   .anyRequest().hasIpAddress("192.168.1.0/24") // 仅限内部IP访问
               )
               .httpBasic();
           return http.build();
       }
   }
   ```

### 6.2 性能优化

1. **缓存配置**：

   ```yaml
   springdoc:
     cache:
       disabled: false
     api-docs:
       cache-control: max-age=3600, must-revalidate
   ```

2. **懒加载模型**：

   ```java
   @Bean
   @Lazy
   public OpenAPI customOpenAPI() {
       // ...
   }
   ```

### 6.3 文档版本控制

将生成的 OpenAPI JSON 文件整合到 CI/CD 流程中：

```bash
# 生成OpenAPI规范文件
curl http://localhost:8080/v3/api-docs > openapi.json

# 上传到API文档平台
curl -X POST https://api.docsplatform.com/docs \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     -d @openapi.json
```

### 6.4 多环境配置策略

| 环境         | Swagger UI | API Docs | 访问控制    |
| :----------- | :--------- | :------- | :---------- |
| **本地开发** | ✅ 启用    | ✅ 启用  | ❌ 无       |
| **测试环境** | ✅ 启用    | ✅ 启用  | 🔐 基本认证 |
| **生产环境** | ❌ 禁用    | ❌ 禁用  | 🔒 IP白名单 |

## 7. 高级技巧与问题解决

### 7.1 使用OperationId生成更好的客户端SDK

```java
@Bean
public OperationCustomizer operationIdCustomizer() {
    return (operation, handlerMethod) -> {
        // 生成易读的OperationId
        String controllerName = handlerMethod.getBeanType().getSimpleName();
        String methodName = handlerMethod.getMethod().getName();
        operation.setOperationId(controllerName + "_" + methodName);
        return operation;
    };
}
```

### 7.2 处理泛型类型

```java
@Configuration
public class GenericTypeConfig {

    @Bean
    public OpenApiCustomizer genericTypeResolver() {
        return openApi -> {
            // 处理分页响应
            openApi.getComponents().addSchemas("PageResponse",
                new ArraySchema().items(new Schema<Object>().$ref("#/components/schemas/UserResponse")));
        };
    }
}

// 在控制器上使用
@Operation(
    responses = @ApiResponse(
        content = @Content(schema = @Schema(implementation = PageResponse.class))
)
@GetMapping
public Page<UserResponse> getUsers(Pageable pageable) {
    // ...
}
```

### 7.3 常见问题解决

**问题：复杂模型未正确显示**

- **解决方案**：
  1. 确保使用 `@Schema(implementation = YourClass.class)` 显式指定类型
  2. 避免深度嵌套的泛型类型
  3. 为复杂类型创建DTO映射

**问题：枚举类型描述不清晰**

- **解决方案**：使用 `@Schema` 注解在每个枚举值上

**问题：分组API未显示**

- **解决方案**：
  1. 确保在 `GroupedOpenApi` 中正确配置 `pathsToMatch` 和 `packagesToScan`
  2. 检查包扫描路径是否正确
  3. 验证是否配置了多个分组

**问题：自定义安全方案无效**

- **解决方案**：
  1. 确保安全方案名称全局唯一
  2. 在 `SecurityRequirement` 中使用相同的名称
  3. 确认 `@SecurityRequirement` 注解的 `name` 与配置一致

## 8. Springdoc与微服务

### 8.1 API Gateway整合

```yaml
springdoc:
  swagger-ui:
    urls:
      - url: /v3/api-docs/users
        name: User Service
      - url: /v3/api-docs/products
        name: Product Service
      - url: /v3/api-docs/orders
        name: Order Service
```

### 8.2 生成聚合API文档

```java
@Bean
public OpenAPI aggregatedOpenAPI(List<GroupedOpenApi> apis) {
    OpenAPI openApi = new OpenAPI();

    apis.forEach(api -> {
        // 获取每组的OpenAPI定义
        OpenAPI groupApi = api.getOpenApi();

        // 合并路径
        groupApi.getPaths().forEach((path, pathItem) -> {
            openApi.path(groupApi.getPrefix() + path, pathItem);
        });

        // 合并模型
        groupApi.getComponents().getSchemas().forEach(openApi::schema);

        // 合并安全方案
        groupApi.getComponents().getSecuritySchemes().forEach(openApi::schemaRequirement);
    });

    return openApi;
}
```

## 9. 总结与最佳实践

### 9.1 核心价值总结

- **无缝集成**：与Spring Boot 3完美适配，零配置启动
- **强大定制**：丰富注解和配置选项满足各种文档需求
- **标准化输出**：遵循OpenAPI 3.1规范，兼容各种工具
- **双界面支持**：同时提供Swagger UI和ReDoc文档界面
- **安全合规**：提供完善的API安全描述能力

### 9.2 黄金实践清单

1. **分层注解策略**：
   - 控制器层：专注API操作描述 (`@Operation`, `@ApiResponse`)
   - 模型层：关注数据结构 (`@Schema`)
   - 配置层：统一处理安全、分组、全局设置

2. **持续更新文档**：

   ```bash
   # 将文档生成集成到CI/CD流程
   mvn test -DgenerateOpenAPI=true
   ```

3. **环境隔离**：
   - 开发环境：开放完整文档
   - 测试环境：限制访问权限
   - 生产环境：完全禁用或严格IP限制

4. **文档即代码**：
   - 将OpenAPI规范文件纳入版本控制
   - 通过CI/CD自动发布到文档门户

5. **安全与性能并重**：
   - 使用HTTPS保护文档访问
   - 启用缓存减少生成开销
   - 懒加载复杂文档组件

6. **版本控制策略**：
   - 使用URL版本控制 (`/v1/users`)
   - 为每个版本创建独立API组
   - 在文档中清晰标记废弃版本

**最终建议：** 从项目开始的第一天就集成Springdoc OpenAPI，将API文档视为项目核心资产而非附属品。遵循"文档即代码"理念，让API文档与代码库共同演进。
