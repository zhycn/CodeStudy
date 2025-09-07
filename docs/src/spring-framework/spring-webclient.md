好的，作为一名 Spring 编程技术专家和 Markdown 技术文档大师，我将为你生成一篇关于 Spring WebClient 的详尽教程。本文档融合了官方文档、社区最佳实践和实际项目经验，旨在为你提供一份清晰、全面且可操作的指南。

# Spring 框架 WebClient 详解与最佳实践

## 1. 引言

在现代应用开发中，与其他服务进行 HTTP 通信是必不可少的。Spring Framework 5 引入了一个全新的、反应式的非阻塞 HTTP 客户端—— `WebClient`，它旨在取代传统的 `RestTemplate`，成为 Spring Web Flux 和 Spring MVC 项目中执行 HTTP 请求的首选工具。

`WebClient` 是 Spring Reactive Web 模块的一部分，基于 Project Reactor 构建，提供了流畅的、函数式的 API，并完全支持非阻塞、响应式编程范式。同时，它也能在传统的 Servlet 容器中高效工作。

## 2. WebClient 的优势与适用场景

### 2.1 核心优势

- **非阻塞与响应式**：基于 Reactor 的 Netty 等非阻塞客户端，可以用更少的资源（尤其是线程）处理高并发请求，显著提高应用的吞吐量和可伸缩性。
- **函数式 Fluent API**：提供链式调用的 API，代码更简洁、易读，易于组合和扩展。
- **高性能**：避免了阻塞 I/O 带来的线程上下文切换开销，在微服务间通信场景下表现优异。
- **强大的响应处理**：提供了灵活的方式来处理 HTTP 响应和错误，支持对响应体进行 reactive stream 处理。
- **与 Spring 生态无缝集成**：完美集成 Spring WebFlux，同时也能在 Spring MVC 中使用，支持通过 `WebClient.Builder` 进行集中配置和 Bean 管理。

### 2.2 何时选择 WebClient？

- 新建项目，尤其是基于 Spring Boot 2.x/3.x 和 Spring WebFlux 的反应式项目。
- 需要高性能、高并发的 HTTP 调用场景（如网关、代理服务、批量数据处理）。
- 希望采用现代、函数式的编程风格。
- 计划与 Reactor、Project Reactor 或其他反应式流进行集成和组合。

> **注意**：对于简单的、低并发的同步调用，或者是在尚未引入反应式依赖的传统 Spring MVC 项目中，使用 `RestTemplate` 可能仍然足够。但官方已明确将 `RestTemplate` 标记为“弃用”（deprecated），因此新项目强烈推荐使用 `WebClient`。

## 3. 项目设置与依赖

要使用 `WebClient`，你需要在项目中引入 Spring Reactive Web 的依赖。

### 3.1 Maven 依赖

```xml
<dependencies>
    <!-- Spring Boot Starter WebFlux (包含了 Reactor 和 WebClient) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    <!-- 如果你不使用 Spring Boot，可以单独引入以下依赖 -->
    <!--
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-webflux</artifactId>
        <version>6.1.6</version>
    </dependency>
    -->
</dependencies>
```

### 3.2 基础配置

Spring Boot 会自动配置一个 `WebClient.Builder` Bean，你可以在任何需要的地方注入它来创建 `WebClient` 实例。这是最推荐的方式，因为它允许进行统一的配置（如拦截器、编解码器等）。

## 4. 创建与配置 WebClient 实例

有多种方式可以创建 `WebClient` 实例。

### 4.1 使用默认设置快速创建

```java
import org.springframework.web.reactive.function.client.WebClient;

// 方式 1：直接通过 create() 静态方法创建（最简单，但难以定制）
WebClient client = WebClient.create();

// 方式 2：通过 baseUrl 创建，适用于固定基路径的 API
WebClient client = WebClient.create("https://api.example.com");
```

### 4.2 使用 Builder 进行高级定制（推荐）

这是最灵活和强大的方式，通常通过注入 `WebClient.Builder` 来操作。

```java
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class MyApiService {

    private final WebClient webClient;

    // 注入 Spring Boot 自动配置的 WebClient.Builder
    @Autowired
    public MyApiService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
            .baseUrl("https://api.example.com") // 设置基础 URL
            .defaultHeader("Authorization", "Bearer my-token") // 设置默认请求头
            .defaultHeader("User-Agent", "MySpringApp/1.0")
            .build();
    }

    // ... 使用 this.webClient 进行请求
}
```

### 4.3 全局默认 Builder 配置

你还可以通过创建一个 `@Bean` 来定义全局默认的 `WebClient`。

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        return builder
                .baseUrl("https://api.example.com")
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
```

然后你可以在任何地方注入这个全局的 `WebClient` Bean。

## 5. 核心 API 与常用操作

`WebClient` 的 API 设计围绕 HTTP 动词（GET, POST, PUT, DELETE 等）。

### 5.1 发起 GET 请求

GET 请求通常用于检索数据。

**示例 1：获取 JSON 响应并转换为 POJO**

```java
import reactor.core.publisher.Mono;

public Mono<User> getUserById(Long id) {
    return webClient
        .get() // 发起 GET 请求
        .uri("/users/{id}", id) // 设置 URI 和路径变量。也支持 .uri("/users?id={id}", id) 形式的查询参数
        .retrieve() // 发起请求并检索响应
        .bodyToMono(User.class); // 将响应体解码为 Mono<User>
}
```

**示例 2：处理带查询参数的请求**

```java
public Mono<String> searchUsers(String name, int page) {
    return webClient
        .get()
        .uri(uriBuilder -> uriBuilder
            .path("/users/search")
            .queryParam("name", name) // 添加查询参数
            .queryParam("page", page)
            .build())
        .retrieve()
        .bodyToMono(String.class); // 直接获取字符串响应
}
```

**示例 3：获取列表或流式数据**

```java
import reactor.core.publisher.Flux;

public Flux<Post> getAllPosts() {
    return webClient
        .get()
        .uri("/posts")
        .retrieve()
        .bodyToFlux(Post.class); // 将响应体解码为 Flux<Post>（一个对象流）
}
```

### 5.2 发起 POST 请求

POST 请求通常用于创建新资源。

**示例 1：发送 JSON 请求体**

```java
import org.springframework.http.MediaType;

public Mono<User> createUser(User user) {
    return webClient
        .post()
        .uri("/users")
        .contentType(MediaType.APPLICATION_JSON) // 设置请求头 Content-Type
        .bodyValue(user) // 设置请求体对象（Spring 会自动将其序列化为 JSON）
        .retrieve()
        .bodyToMono(User.class);
}
```

**示例 2：使用 BodyInserters**

```java
import org.springframework.web.reactive.function.BodyInserters;

public Mono<User> createUser(String name, String email) {
    return webClient
        .post()
        .uri("/users")
        .body(BodyInserters.fromValue("{\"name\":\"" + name + "\", \"email\":\"" + email + "\"}")) // 手动构建 JSON 字符串（不推荐，易错）
        // 或者使用 Map
        .body(BodyInserters.fromObject(Map.of("name", name, "email", email))) // 更安全的方式
        .retrieve()
        .bodyToMono(User.class);
}
```

### 5.3 发起 PUT 与 DELETE 请求

PUT 用于更新资源，DELETE 用于删除资源。

```java
// PUT 示例
public Mono<User> updateUser(Long id, User user) {
    return webClient
        .put()
        .uri("/users/{id}", id)
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(user)
        .retrieve()
        .bodyToMono(User.class);
}

// DELETE 示例
public Mono<Void> deleteUser(Long id) {
    return webClient
        .delete()
        .uri("/users/{id}", id)
        .retrieve()
        .bodyToMono(Void.class); // 通常 DELETE 请求没有响应体
}
```

## 6. 高级特性与错误处理

### 6.1 处理 HTTP 状态码

使用 `retrieve()` 方法时，4xx 或 5xx 状态码会自动转换为 `WebClientResponseException`。为了更精细地控制，可以使用 `onStatus` 方法。

```java
public Mono<User> getUserByIdHandled(Long id) {
    return webClient
        .get()
        .uri("/users/{id}", id)
        .retrieve()
        .onStatus(HttpStatusCode::is4xxClientError, response -> {
            // 处理 4xx 错误
            if (response.statusCode() == HttpStatus.NOT_FOUND) {
                return Mono.error(new UserNotFoundException("User not found with id: " + id));
            }
            return Mono.error(new RuntimeException("Client error occurred"));
        })
        .onStatus(HttpStatusCode::is5xxServerError, response ->
            Mono.error(new ServiceUnavailableException("API server is down"))
        )
        .bodyToMono(User.class);
}
```

### 6.2 使用 `exchange()` 方法获取完整响应

`exchange()` 方法返回 `Mono<ClientResponse>`，它提供了对响应状态、头信息和体的完全访问。**注意：在 Spring 5.3 及以上版本，`exchange()` 已被 `exchangeToMono()` / `exchangeToFlux()` 取代，因为它有内存泄漏的风险。**

```java
// 新版本的推荐方式 (exchangeToMono)
public Mono<User> getUserWithExchange(Long id) {
    return webClient
        .get()
        .uri("/users/{id}", id)
        .exchangeToMono(response -> {
            if (response.statusCode().is2xxSuccessful()) {
                return response.bodyToMono(User.class);
            } else if (response.statusCode() == HttpStatus.NOT_FOUND) {
                return Mono.empty(); // 返回空 Mono
            } else {
                return Mono.error(new RuntimeException("Error occurred"));
            }
        });
}
```

### 6.3 设置超时

超时是生产环境中必须考虑的配置。

**全局配置（在 `application.yml` 或 `application.properties` 中）**

```yaml
spring:
  webflux:
    client:
      connect-timeout: 2s
      response-timeout: 5s
```

**针对特定请求配置**

```java
import reactor.netty.http.client.HttpClient;

// 在 Builder 中配置
WebClient client = WebClient.builder()
    .clientConnector(new ReactorClientHttpConnector(
        HttpClient.create().responseTimeout(Duration.ofSeconds(5)) // 响应超时
    ))
    .build();

// 或者为单个请求设置超时（推荐，更灵活）
public Mono<User> getUserWithTimeout(Long id) {
    return webClient
        .get()
        .uri("/users/{id}", id)
        .httpRequest(httpRequest -> {
            HttpClient reactorClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(3));
            httpRequest.setHttpClient(reactorClient);
        })
        .retrieve()
        .bodyToMono(User.class)
        .timeout(Duration.ofSeconds(4)); // 为整个 Reactive 流设置超时
}
```

## 7. 过滤器与拦截器

过滤器（Filter）非常适合用于添加横切关注点，如日志记录、认证等。

### 7.1 添加认证头

```java
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;

// 创建一个添加 Bearer Token 的过滤器
ExchangeFilterFunction authFilter = (request, next) -> {
    ClientRequest authorizedRequest = ClientRequest.from(request)
        .header("Authorization", "Bearer " + getAuthToken())
        .build();
    return next.exchange(authorizedRequest);
};

// 在 Builder 中使用过滤器
WebClient client = WebClient.builder()
    .baseUrl("https://api.example.com")
    .filter(authFilter)
    .build();

// 模拟获取 Token 的方法
private String getAuthToken() {
    return "your-dynamic-token-here";
}
```

### 7.2 日志过滤器

```java
// 创建一个日志过滤器
ExchangeFilterFunction logFilter = (request, next) -> {
    System.out.println("Request: " + request.method() + " " + request.url());
    return next.exchange(request)
        .doOnNext(response -> {
            System.out.println("Response Status: " + response.statusCode());
        });
};

WebClient client = WebClient.builder()
    .filters(exchangeFilterFunctions -> {
        exchangeFilterFunctions.add(logFilter);
        exchangeFilterFunctions.add(authFilter); // 可以添加多个过滤器
    })
    .build();
```

## 8. 测试策略

测试 `WebClient` 通常使用 `MockWebServer`（来自 OkHttp 库），它可以模拟一个真实的 HTTP 服务器。

### 8.1 添加测试依赖

```xml
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>mockwebserver</artifactId>
    <version>4.12.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
    <scope>test</scope>
</dependency>
```

### 8.2 编写单元测试

```java
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.test.StepVerifier;

import java.io.IOException;

class MyApiServiceTest {

    private MockWebServer mockWebServer;
    private MyApiService myApiService;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start(); // 启动模拟服务器

        // 创建一个指向模拟服务器的 WebClient
        WebClient webClient = WebClient.builder()
                .baseUrl(mockWebServer.url("/").toString())
                .build();

        myApiService = new MyApiService(webClient);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown(); // 关闭模拟服务器
    }

    @Test
    void getUserById_ShouldReturnUser() {
        // 1. 安排（Arrange）：准备模拟响应
        String mockResponseBody = """
                {
                  "id": 1,
                  "name": "Test User",
                  "email": "test@example.com"
                }
                """;
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .setBody(mockResponseBody));

        // 2. 行动（Act）：执行方法
        Mono<User> userMono = myApiService.getUserById(1L);

        // 3. 断言（Assert）：验证结果
        StepVerifier.create(userMono)
                .expectNextMatches(user ->
                    user.getId().equals(1L) &&
                    user.getName().equals("Test User")
                )
                .verifyComplete();

        // 可选：验证发出的请求
        // RecordedRequest recordedRequest = mockWebServer.takeRequest();
        // assertEquals("/users/1", recordedRequest.getPath());
    }
}
```

## 9. 在 Spring MVC 中使用 WebClient

`WebClient` 虽然是为反应式编程设计的，但它可以完美地在传统的、阻塞的 Spring MVC 服务中使用。

### 9.1 阻塞式调用（谨慎使用）

你可以使用 `block()` 方法来获取结果，但这会阻塞当前线程，违背了使用 `WebClient` 的初衷，应仅在简单迁移或特定场景下使用。

```java
@RestController
@RequestMapping("/mvc-users")
public class MvcUserController {

    private final MyApiService myApiService;

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        // 使用 block() 将 Mono<User> 转换为 User（阻塞操作）
        return myApiService.getUserById(id).block();
    }
}
```

### 9.2 非阻塞式调用（推荐）

更好的方式是将 `Mono` 或 `Flux` 直接返回给 Spring MVC，Spring 会负责处理订阅和响应式流的执行。这需要 Spring MVC 的异步支持。

```java
@RestController
@RequestMapping("/mvc-users")
public class MvcUserController {

    private final MyApiService myApiService;

    @GetMapping("/{id}")
    public Mono<User> getUser(@PathVariable Long id) {
        // 直接返回 Mono，Spring 会非阻塞地处理它
        return myApiService.getUserById(id);
    }

    @GetMapping
    public Flux<User> getUsers() {
        // 直接返回 Flux
        return myApiService.getAllUsers();
    }
}
```

## 10. 性能调优与最佳实践总结

1. **实例复用**：`WebClient` 是线程安全的，请将其配置为 Bean 并注入复用，避免为每个请求创建新实例。
2. **连接池**：默认使用 Reactor Netty 的连接池。可以通过配置 `HttpClient` 来调整池化策略。
3. **超时配置**：**必须**为生产环境配置连接超时和响应超时。
4. **错误处理**：使用 `onStatus` 或 `exchangeToMono` 优雅地处理不同的 HTTP 错误状态码，不要忽视异常。
5. **背压（Backpressure）**：`WebClient` 支持响应式流的背压。当消费端处理不过来时，会自动向上游反馈，减慢数据流速。理解并利用好这一特性。
6. **避免阻塞**：尽量不要在反应式链中调用 `block()` 等方法，这会破坏非阻塞的优势。
7. **使用断路器**：在微服务架构中，将 `WebClient` 与 Resilience4j 或 Sentinel 等断路器库结合使用，防止故障扩散。
8. **监控与日志**：添加过滤器来记录请求和响应日志，并集成 Micrometer 等工具来监控 HTTP 客户端指标。

---

通过本文档，你应该对 Spring `WebClient` 的核心概念、API 使用以及高级特性有了全面的了解。遵循其中的最佳实践，你将能构建出高效、健壮的 HTTP 客户端代码。
