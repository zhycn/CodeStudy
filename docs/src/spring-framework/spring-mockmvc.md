好的，没有问题。作为一名资深的 Spring 专家和技术文档工程师，我将为你呈现一篇关于 Spring MockMvc 的详尽指南。

在开始撰写前，我综合分析了 Spring 官方文档、Baeldung、Spring.io Guides、JavaDoc 以及多位行业专家（如 Eugen Paraschiv, Petri Kainulainen 等）的博客文章，旨在为你提供最准确、最现代、最实用的实践方案。

---

# Spring Framework MockMvc 详解与最佳实践

## 1. 概述

在当今的软件开发中，测试是保证代码质量不可或缺的环节。对于 Web 层而言，传统的测试方法需要启动 Servlet 容器（如 Tomcat），这会使得测试变得笨重、缓慢且容易受到环境的影响。`MockMvc` 是 Spring Test 模块提供的一个强大框架，它允许你以完全隔离的方式（即无需启动真实 Web 服务器）对 Spring MVC 控制器（Controllers）进行高效、精准的单元测试。

通过 `MockMvc`，你可以发送模拟的 HTTP 请求，并对返回的响应进行断言，验证控制器的行为是否符合预期，包括状态码、响应内容、头信息、模型数据、视图解析等。

## 2. 核心优势

- **轻量级与高速**： 无需集成 Servlet 容器，测试执行速度极快。
- **完全控制**： 精确模拟请求和响应，可以轻松测试各种边界情况和异常场景。
- **深度集成**： 与 Spring 的依赖注入（Dependency Injection）和 Spring Test 的测试上下文无缝集成，支持自动装配 Bean 和事务管理。
- **丰富的断言**： 提供了一套流畅的 API（Fluent API）来对响应的各个方面进行断言。

## 3. 初始化 MockMvc

有三种主流的方式来初始化 `MockMvc` 实例，适用于不同的测试场景。

### 3.1 方式一：基于 WebApplicationContext（集成测试）

这种方式会加载完整的 Spring 应用程序上下文，是最接近生产环境的测试方式。它通常用于集成测试。

```java
@SpringBootTest // 加载完整的应用配置
@AutoConfigureMockMvc // 自动配置 MockMvc 实例
public class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // 也可以注入其它需要的 Bean，如 @Autowired private UserRepository userRepository;

    @Test
    public void givenExistsUserId_whenGetUserById_thenReturnUser() throws Exception {
        // 测试逻辑
    }
}
```

**优点**： 集成度高，能测试 Bean 之间的协作。
**缺点**： 启动速度相对较慢。

### 3.2 方式二：独立配置（Standalone Setup - 单元测试）

这种方式只初始化指定的控制器及其依赖（通常用 Mock 代替），不会加载整个 Spring 上下文。这是最纯粹、最快速的单元测试方式。

```java
public class UserControllerUnitTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    public void setup() {
        // 初始化 Mock 注解
        MockitoAnnotations.openMocks(this);

        // 构建独立的 MockMvc 实例，仅配置当前控制器
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler()) // 可选：添加控制器通知
                .build();
    }

    @Test
    public void givenInvalidId_whenGetUserById_thenReturn404() throws Exception {
        // 给定：模拟 service 行为
        given(userService.findById(anyLong())).willThrow(new UserNotFoundException("User not found"));

        // 当 & 然后：执行请求并断言
        mockMvc.perform(get("/api/users/{id}", 999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));
    }
}
```

**优点**： 极速启动，关注点完全集中在控制器逻辑上。
**缺点**： 需要手动管理控制器的依赖。

### 3.3 方式三：基于 WebAppConfig 的构建器

这是方式一的手动版本，提供了更多的自定义控制。

```java
@SpringBootTest
@ContextConfiguration(classes = {MyAppConfig.class})
public class ManualMockMvcTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity()) // 可选：应用 Spring Security 过滤器
                .alwaysDo(print()) // 可选：总是打印请求和响应详情，便于调试
                .build();
    }
}
```

## 4. 执行请求与断言

`MockMvc` 的核心流程是：**执行请求（Perform） -> 定义期望（Expect）**。

### 4.1 执行请求 (MockMvcRequestBuilders)

使用 `MockMvcRequestBuilders` 的静态方法来构建各种 HTTP 请求。

**GET 请求**

```java
// 简单路径
mockMvc.perform(get("/api/users"));

// 路径变量
mockMvc.perform(get("/api/users/{id}", 1L));

// 请求参数
mockMvc.perform(get("/api/users")
        .param("page", "1")
        .param("size", "10")
        .param("sort", "name,asc"));
```

**POST 请求**

```java
// 提交 JSON 数据（最常用）
String userJson = """
        {
          "name": "Alice",
          "email": "alice@example.com"
        }
        """;

mockMvc.perform(post("/api/users")
        .contentType(MediaType.APPLICATION_JSON) // 必须设置 Content-Type
        .content(userJson));

// 提交表单数据
mockMvc.perform(post("/api/users/form")
        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
        .param("name", "Alice")
        .param("email", "alice@example.com"));
```

**PUT/DELETE 请求**

```java
// PUT 更新资源
mockMvc.perform(put("/api/users/{id}", 1L)
        .contentType(MediaType.APPLICATION_JSON)
        .content(updatedUserJson));

// DELETE 删除资源
mockMvc.perform(delete("/api/users/{id}", 1L));
```

**设置请求头与 Cookie**

```java
mockMvc.perform(get("/api/profile")
        .header("Authorization", "Bearer my-jwt-token") // 设置认证头
        .header("X-Custom-Header", "custom-value")
        .cookie(new Cookie("sessionId", "abc-123")));
```

### 4.2 断言响应 (MockMvcResultMatchers)

使用 `MockMvcResultMatchers` 的静态方法来定义对响应的期望。

**状态码断言**

```java
.andExpect(status().isOk()) // 200
.andExpect(status().isCreated()) // 201
.andExpect(status().isNotFound()) // 404
.andExpect(status().isBadRequest()) // 400
.andExpect(status().is4xxClientError()) // 所有 4xx
.andExpect(status().is5xxServerError()) // 所有 5xx
```

**响应内容断言（JSON）**
使用 `JsonPath` 表达式，这是最强大的断言工具之一。

```java
// 检查返回的 JSON 中 `name` 字段的值
.andExpect(jsonPath("$.name").value("Alice"))

// 检查数组大小和其中元素的值
.andExpect(jsonPath("$.users").isArray())
.andExpect(jsonPath("$.users.length()").value(3))
.andExpect(jsonPath("$.users[0].email").value("alice@example.com"))

// 使用 Matchers 进行更复杂的匹配（需导入 org.hamcrest.Matchers.*）
.andExpect(jsonPath("$.price").value(closeTo(100.0, 0.5))) // 值接近 100，误差 0.5
.andExpect(jsonPath("$.users", hasSize(3)))
.andExpect(jsonPath("$.name", not(emptyString())))
```

**视图与模型断言**

```java
// 对于返回 HTML 视图的控制器
.andExpect(view().name("user-detail")) // 检查视图名
.andExpect(model().attributeExists("user")) // 检查模型属性是否存在
.andExpect(model().attribute("user", hasProperty("name", is("Alice")))) // 检查模型属性值
```

**重定向断言**

```java
.andExpect(redirectedUrl("/api/users/1")) // 精确匹配
.andExpect(redirectedUrlPattern("/api/users/*")) // 模式匹配
```

**头信息断言**

```java
.andExpect(header().exists("Location")) // 检查头是否存在
.andExpect(header().string("Content-Type", MediaType.APPLICATION_JSON_VALUE)) // 检查头值
```

## 5. 处理响应结果 (MockMvcResultHandlers)

除了断言，你还可以对结果进行处理，常用于调试。

```java
// 打印出请求和响应的详细信息，在调试时极其有用
mockMvc.perform(get("/api/users/1"))
        .andDo(print()) // 来自 MockMvcResultHandlers.print()

// 也可以自定义处理逻辑
.andDo(result -> {
    String content = result.getResponse().getContentAsString();
    // ... 对 content 进行自定义处理或记录
});
```

**最佳实践**： 在测试开发阶段大量使用 `.andDo(print())` 来诊断问题。如果某个测试一直失败，可以考虑使用 `@Test` 注解上的 `@Disabled` 暂时禁用它，而不是注释掉。

## 6. 高级特性与最佳实践

### 6.1 测试异常处理

确保你的全局异常处理器（`@ControllerAdvice`）正常工作。

```java
@Test
public void givenUserNotFound_whenGetUserById_thenHandleException() throws Exception {
    given(userService.findById(anyLong())).willThrow(new UserNotFoundException("User not found for ID: 999"));

    mockMvc.perform(get("/api/users/{id}", 999L))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.timestamp").exists()) // 异常响应体通常包含时间戳
            .andExpect(jsonPath("$.message").value("User not found for ID: 999"))
            .andExpect(jsonPath("$.path").value("/api/users/999"));
}
```

### 6.2 集成 Spring Security

使用 `@WithMockUser` 等注解来模拟认证用户。

```java
@Test
@WithMockUser(roles = "USER") // 模拟一个拥有 ROLE_USER 的用户
public void givenUserRole_whenAccessUserApi_thenSuccess() throws Exception {
    mockMvc.perform(get("/api/users/me"))
            .andExpect(status().isOk());
}

@Test
@WithMockUser(roles = "USER")
public void givenUserRole_whenAccessAdminApi_thenForbidden() throws Exception {
    mockMvc.perform(get("/api/admin/dashboard"))
            .andExpect(status().isForbidden()); // 403
}

// 也可以手动设置 SecurityContext
@Test
public void givenAuthenticatedUser() throws Exception {
    UserDetails user = User.withUsername("user").password("pass").roles("USER").build();
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(new UsernamePasswordAuthenticationToken(user, user.getPassword(), user.getAuthorities()));
    SecurityContextHolder.setContext(context);

    mockMvc.perform(get("/api/users/me"))
            .andExpect(status().isOk());
}
```

### 6.3 自定义匹配器 (Custom Matchers)

当内置匹配器无法满足复杂断言时，可以创建自定义的 `ResultMatcher`。

```java
@Test
public void givenUser_whenCreated_thenLocationHeaderContainsId() throws Exception {
    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(userJson))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(new ResultMatcher() {
                @Override
                public void match(MvcResult result) throws Exception {
                    String location = result.getResponse().getHeader("Location");
                    // 自定义逻辑：检查 Location 头是否以数字结尾（即新用户的 ID）
                    assertThat(location).matches(".*/\\d+$");
                }
            });
}
```

### 6.4 最佳实践总结

1. **选择合适的初始化方式**：
   - 测试单一控制器的**逻辑** -> 使用 `StandaloneSetup`（单元测试）。
   - 测试**集成**和**安全**等特性 -> 使用 `WebApplicationContext`（集成测试）。

2. **保持测试的独立性与可重复性**：
   - 使用 `@BeforeEach` 或 `@BeforeAll` 进行初始化，使用 `@AfterEach` 清理数据（如重置 Mock）。
   - 对于集成测试，考虑使用 `@Transactional` 和 `@Rollback` 来自动回滚测试数据，避免污染数据库。

3. **充分利用 `andDo(print())`**： 它是你调试测试失败时最好的朋友。

4. **编写有意义的断言**：
   - 避免过度断言（Over-asserting），只断言与测试用例最相关的部分。
   - 优先使用 `JsonPath` 来断言 JSON 响应，它灵活且强大。

5. **模拟所有依赖**：
   - 在单元测试中，确保控制器所有的依赖（如 Service、Repository）都被有效地 Mock 或 Stub。

6. **测试异常流**：
   - 不要只测试“happy path”，也要编写测试用例来验证控制器在出错时的行为（如参数校验失败、业务异常等）。

## 7. 完整示例

以下是一个结合了上述所有要点的完整集成测试示例。

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional // 测试后事务自动回滚
public class UserControllerFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper; // Jackson 的 JSON 序列化工具

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        // 准备测试数据
        testUser = new User();
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser = userRepository.save(testUser);
    }

    @Test
    void givenUserExists_whenGetUserById_thenReturnUser() throws Exception {
        mockMvc.perform(get("/api/users/{id}", testUser.getId()))
                .andDo(print()) // 打印详细信息
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testUser.getId()))
                .andExpect(jsonPath("$.name").value(testUser.getName()))
                .andExpect(jsonPath("$.email").value(testUser.getEmail()));
    }

    @Test
    void givenValidUser_whenCreateUser_thenReturnCreated() throws Exception {
        User newUser = new User();
        newUser.setName("New User");
        newUser.setEmail("new@example.com");

        String newUserJson = objectMapper.writeValueAsString(newUser);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newUserJson))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("New User"));
    }

    @Test
    void givenInvalidUserWithoutEmail_whenCreateUser_thenReturnBadRequest() throws Exception {
        User invalidUser = new User();
        invalidUser.setName("Invalid User");
        // 缺少 email 字段

        String invalidUserJson = objectMapper.writeValueAsString(invalidUser);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidUserJson))
                .andExpect(status().isBadRequest()); // 假设有 @Valid 注解触发 400
    }
}
```

通过这份指南，你应该能够全面掌握 Spring `MockMvc` 的使用，并能够为你的 Web 层编写出高效、可靠且易于维护的测试代码。Happy Testing!
