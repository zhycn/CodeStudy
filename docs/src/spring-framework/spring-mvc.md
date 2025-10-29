---
title: Spring Framework MVC 详解与最佳实践
description: 本文详细介绍了 Spring Framework 中 MVC 模式的核心概念、配置方式、最佳实践以及实际应用场景。通过掌握这些知识，开发者可以在企业级应用中高效、一致地处理 HTTP 请求和响应，提升系统的可维护性和可扩展性。
author: zhycn
---

# Spring MVC 详解与最佳实践

## 1. 概述

Spring MVC 是 Spring Framework 的一个核心模块，用于构建基于 Java 的 Web 应用程序。它实现了 **Model-View-Controller (MVC)** 设计模式，提供了松散耦合、高度可配置和易于测试的组件化开发方式。

### 1.1 什么是 MVC 模式？

- **Model (模型)**： 代表应用程序的数据和业务逻辑。它负责检索数据、处理业务规则，并通知 View 层状态变化。
- **View (视图)**： 负责渲染模型数据，生成用户可见的界面（如 HTML, JSP, Thymeleaf 等）。
- **Controller (控制器)**： 处理用户请求，调用相应的业务逻辑（Model），然后将数据传递给合适的 View 进行渲染。

### 1.2 Spring MVC 的核心架构与请求流程

Spring MVC 的核心是 `DispatcherServlet`，它作为前端控制器（Front Controller），是所有请求的统一入口。一个典型的请求处理流程如下：

1. **请求到来**： 用户发起 HTTP 请求，被 `DispatcherServlet` 接收。
2. **查询处理器映射**： `DispatcherServlet` 咨询 `HandlerMapping`，根据请求的 URL 找到对应的 `Controller` 和方法（Handler）。
3. **调用处理器**： `DispatcherServlet` 将请求交给 `HandlerAdapter`，由它来实际执行找到的 Controller 方法。
4. **执行业务逻辑**： Controller 方法调用 Service 层的业务逻辑，并返回一个包含视图名和模型的 `ModelAndView` 对象。
5. **解析视图**： `DispatcherServlet` 使用 `ViewResolver` 根据视图名解析出具体的 `View` 对象。
6. **渲染视图**： `View` 对象使用模型数据渲染最终响应（如生成 HTML）。
7. **返回响应**： 渲染后的响应通过 `DispatcherServlet` 返回给客户端。

## 2. 核心组件详解

### 2.1 `DispatcherServlet`

它是 Spring MVC 的“大脑”，负责协调各个组件。需要在 `web.xml` 或通过 Java Config 进行配置。

**Java Config 配置方式 (推荐)：**

```java
import org.springframework.web.servlet.support.AbstractAnnotationConfigDispatcherServletInitializer;

public class MyWebAppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {

    // 加载根配置（如 Service, Repository 层）
    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class<?>[] { AppConfig.class };
    }

    // 加载 Web 配置（如 Controller, ViewResolver）
    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class<?>[] { WebConfig.class };
    }

    // 配置 DispatcherServlet 的映射路径
    @Override
    protected String[] getServletMappings() {
        return new String[] { "/" }; // 映射所有请求
    }
}
```

### 2.2 `HandlerMapping`

负责将请求映射到处理器（Controller 方法）。最常用的是 `@RequestMapping` 注解，它由 `RequestMappingHandlerMapping` 处理。

### 2.3 `HandlerAdapter`

负责实际调用处理器方法。`@RequestMapping` 注解的方法由 `RequestMappingHandlerAdapter` 处理。

### 2.4 `ViewResolver`

将逻辑视图名（如 `"home"`）解析为实际的视图对象（如 `ThymeleafView`, `JstlView`）。

**配置 ThymeleafViewResolver 示例：**

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.ViewResolver;
import org.springframework.web.servlet.view.InternalResourceViewResolver;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.view.ThymeleafViewResolver;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

@Configuration
public class WebConfig {

    // 示例：配置 Thymeleaf 视图解析器 (推荐用于现代应用)
    @Bean
    public ViewResolver thymeleafViewResolver(SpringTemplateEngine templateEngine) {
        ThymeleafViewResolver resolver = new ThymeleafViewResolver();
        resolver.setTemplateEngine(templateEngine);
        resolver.setCharacterEncoding("UTF-8");
        return resolver;
    }

    // 示例：配置 JSP 视图解析器 (传统项目)
    @Bean
    public ViewResolver jspViewResolver() {
        InternalResourceViewResolver resolver = new InternalResourceViewResolver();
        resolver.setPrefix("/WEB-INF/views/");
        resolver.setSuffix(".jsp");
        return resolver;
    }
}
```

## 3. 基于注解的控制器开发

这是现代 Spring MVC 开发的主流方式，极其灵活和强大。

### 3.1 `@Controller` 和 `@RestController`

- `@Controller`： 标识一个类为 Spring MVC 控制器，其方法通常返回视图名。
- `@RestController`： `@Controller` 和 `@ResponseBody` 的组合注解，表明该类所有方法返回的数据直接写入 HTTP 响应体，用于构建 RESTful Web 服务。

### 3.2 `@RequestMapping`

用于将 Web 请求映射到特定的控制器方法。可用在类或方法上。

| 注解              | 等效缩写                         | 描述                  |
| ----------------- | -------------------------------- | --------------------- |
| `@RequestMapping` | -                                | 通用请求映射          |
| `@GetMapping`     | `@RequestMapping(method=GET)`    | 处理 HTTP GET 请求    |
| `@PostMapping`    | `@RequestMapping(method=POST)`   | 处理 HTTP POST 请求   |
| `@PutMapping`     | `@RequestMapping(method=PUT)`    | 处理 HTTP PUT 请求    |
| `@DeleteMapping`  | `@RequestMapping(method=DELETE)` | 处理 HTTP DELETE 请求 |
| `@PatchMapping`   | `@RequestMapping(method=PATCH)`  | 处理 HTTP PATCH 请求  |

**示例：**

```java
@Controller
@RequestMapping("/books")
public class BookController {

    @GetMapping("/{id}")
    public String getBook(@PathVariable Long id, Model model) {
        Book book = bookService.findById(id);
        model.addAttribute("book", book);
        return "book-detail"; // 解析为视图 book-detail.html
    }

    @PostMapping
    public String createBook(@ModelAttribute Book book) {
        bookService.save(book);
        return "redirect:/books"; // 重定向到 GET /books
    }
}

@RestController
@RequestMapping("/api/books")
public class BookApiController {

    @GetMapping("/{id}")
    public Book getBook(@PathVariable Long id) {
        // 对象会被自动转换为 JSON 返回
        return bookService.findById(id);
    }

    @PostMapping
    public ResponseEntity<Book> createBook(@RequestBody Book book) {
        Book savedBook = bookService.save(book);
        // 使用 ResponseEntity 可以更灵活地控制响应状态码和头信息
        return ResponseEntity.created(URI.create("/api/books/" + savedBook.getId()))
                             .body(savedBook);
    }
}
```

### 3.3 常用方法参数注解

| 注解              | 描述                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `@PathVariable`   | 从 URI 模板变量中绑定值。如 `/users/{id}` -> `@PathVariable Long id` |
| `@RequestParam`   | 从请求参数中绑定值。如 `?name=Alice` -> `@RequestParam String name`  |
| `@RequestBody`    | 将请求体（如 JSON）反序列化为 Java 对象。                            |
| `@ModelAttribute` | 从表单数据或请求参数绑定到对象，并可自动添加到 Model 中。            |
| `@RequestHeader`  | 从请求头中绑定值。                                                   |
| `@CookieValue`    | 从 Cookie 中绑定值。                                                 |

### 3.4 常用方法返回值类型

| 返回值类型        | 描述                                                                |
| ----------------- | ------------------------------------------------------------------- |
| `String`          | 逻辑视图名，由 ViewResolver 解析。                                  |
| `void`            | 方法自行处理响应（通过 `HttpServletResponse`）。                    |
| `ModelAndView`    | 包含模型数据和视图名的对象。                                        |
| 普通对象 (`Book`) | （在 `@RestController` 中或方法有 `@ResponseBody`）直接写入响应体。 |
| `ResponseEntity`  | 包含响应头、状态码和体的完整响应实体，灵活性最高。                  |

## 4. 视图技术集成

### 4.1 Thymeleaf (推荐)

Thymeleaf 是现代服务器端 Java 模板引擎，自然模板，语法优雅，与 Spring MVC 集成无缝。

**依赖 (Maven)：**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

**示例模板 (`src/main/resources/templates/book-detail.html`)：**

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
  <head>
    <title>Book Details</title>
  </head>
  <body>
    <h1 th:text="${book.title}">Book Title Placeholder</h1>
    <!-- 动态文本 -->
    <p>Author: <span th:text="${book.author}">Author Placeholder</span></p>
    <a th:href="@{/books}">Back to list</a>
    <!-- 链接表达式 -->
  </body>
</html>
```

### 4.2 JSP (传统)

虽然仍在使用，但已不再是 Spring 官方推荐的首选。

## 5. 数据处理与绑定

### 5.1 表单提交与验证

Spring MVC 提供了强大的数据绑定和验证功能，通常与 JSR 303/380 Bean Validation API（如 Hibernate Validator）结合使用。

**1. 定义模型：**

```java
public class User {

    @NotBlank(message = "Name is mandatory")
    private String name;

    @Email(message = "Email should be valid")
    @NotBlank
    private String email;

    // getters and setters
}
```

**2. Controller 处理：**

```java
@Controller
@RequestMapping("/users")
public class UserController {

    @GetMapping("/create")
    public String showCreateForm(Model model) {
        model.addAttribute("user", new User());
        return "user-create";
    }

    @PostMapping
    public String createUser(@Valid @ModelAttribute User user,
                           BindingResult result, // 必须紧跟在 @Valid 参数后
                           Model model) {
        if (result.hasErrors()) {
            // 校验失败，返回表单页面并显示错误信息
            return "user-create";
        }
        userService.save(user);
        return "redirect:/users";
    }
}
```

**3. Thymeleaf 表单模板 (`user-create.html`)：**

```html
<form th:action="@{/users}" th:object="${user}" method="post">
  <div>
    <label>Name:</label>
    <input type="text" th:field="*{name}" />
    <span th:if="${#fields.hasErrors('name')}" th:errors="*{name}" class="error"></span>
  </div>
  <div>
    <label>Email:</label>
    <input type="email" th:field="*{email}" />
    <span th:if="${#fields.hasErrors('email')}" th:errors="*{email}" class="error"></span>
  </div>
  <button type="submit">Create</button>
</form>
```

## 6. 异常处理

### 6.1 `@ControllerAdvice` 和 `@ExceptionHandler`

使用 `@ControllerAdvice` 可以编写全局的异常处理代码，避免在每个 Controller 中重复。

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    // 处理特定异常
    @ExceptionHandler(BookNotFoundException.class)
    public ResponseEntity<?> handleBookNotFound(BookNotFoundException ex) {
        return ResponseEntity.notFound().build();
    }

    // 处理更通用的异常
    @ExceptionHandler(Exception.class)
    public String handleGenericException(Exception ex, Model model) {
        model.addAttribute("errorMessage", "An unexpected error occurred: " + ex.getMessage());
        return "error"; // 返回一个通用的错误视图
    }
}
```

## 7. 拦截器 (Interceptor)

拦截器用于在请求处理之前和之后执行预处理和后处理逻辑，非常适合实现横切关注点，如日志记录、身份验证检查、国际化等。

**1. 实现 `HandlerInterceptor`：**

```java
public class LoggingInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(LoggingInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        long startTime = System.currentTimeMillis();
        request.setAttribute("startTime", startTime);
        logger.info("Request URL: {}", request.getRequestURL());
        return true; // 继续执行链
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        long startTime = (Long) request.getAttribute("startTime");
        long endTime = System.currentTimeMillis();
        logger.info("Request processed in {} ms", (endTime - startTime));
    }
}
```

**2. 注册拦截器：**

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoggingInterceptor())
                .addPathPatterns("/**"); // 应用于所有路径
    }
}
```

## 8. 最佳实践

1. **使用 `@RestController` 构建 REST API**： 清晰分离前后端职责。
2. **采用 Java Config**： 放弃古老的 XML 配置，拥抱基于 Java 的显式配置，类型安全且更强大。
3. **优先选择 Thymeleaf**： 作为视图技术，它比 JSP 更现代、更强大。
4. **始终进行输入验证**： 使用 `@Valid` 和 Bean Validation 来确保数据正确性和安全性。
5. **使用 `ResponseEntity` 构建精细的 REST 响应**： 精确控制 HTTP 状态码和头信息。
6. **利用 `@ControllerAdvice` 进行集中式异常处理**： 提供一致的 API 错误响应和用户友好的错误页面。
7. **使用拦截器处理横切关注点**： 避免在 Controller 中充斥与核心业务无关的代码（如日志、鉴权）。
8. **保持 Controller 轻薄**： Controller 应只负责协调和委托，将业务逻辑委托给 Service 层。
9. **使用 Project Lombok**： 减少模板代码（如 getter, setter, constructor），使模型类更简洁。
10. **编写单元测试**： 使用 `@WebMvcTest` 来隔离测试 Controller 层。

**Controller 单元测试示例 (JUnit 5 + Mockito)：**

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookController.class) // 只加载 Web 层相关组件
public class BookControllerTest {

    @Autowired
    private MockMvc mockMvc; // 模拟 MVC 环境

    @MockitoBean
    private BookService bookService; // 模拟 Service

    @Test
    public void getBook_ShouldReturnBook() throws Exception {
        Book mockBook = new Book(1L, "Spring in Action", "Craig Walls");
        given(bookService.findById(1L)).willReturn(mockBook);

        mockMvc.perform(get("/books/1"))
                .andExpect(status().isOk())
                .andExpect(view().name("book-detail"))
                .andExpect(model().attribute("book", mockBook));
    }
}
```

## 9. 总结

Spring MVC 是一个强大而灵活的 Web 框架，通过理解其核心组件（如 `DispatcherServlet`, `HandlerMapping`, `ViewResolver`）和熟练运用基于注解的控制器开发，可以高效地构建各种 Web 应用程序。遵循最佳实践，如清晰的层次划分、输入验证、集中异常处理和单元测试，是构建可维护、健壮和高性能 Spring MVC 应用的关键。
