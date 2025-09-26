---
title: Spring Web Filter 过滤器详解与最佳实践
description: 了解 Spring Web Filter 过滤器的核心概念、工作原理和最佳实践，掌握如何在 Spring 应用中实现自定义的过滤器来处理 HTTP 请求和响应。
author: zhycn
---

# Spring Web Filter 过滤器详解与最佳实践

## 1. 过滤器概述与核心概念

过滤器（Filter）是 Java Servlet 规范中定义的重要组件，它可以在 HTTP 请求到达 Servlet 之前对 Request 进行预处理，以及在响应返回客户端之前对 Response 进行后处理。在 Spring 生态系统中，过滤器为开发者提供了一种强大的机制来处理横切关注点（cross-cutting concerns）。

### 1.1 过滤器的基本概念

过滤器基于 AOP（面向切面编程）思想实现，主要功能包括：

- **请求预处理**：在请求到达 Controller 之前执行操作，如身份验证、日志记录、字符编码设置等
- **响应后处理**：在响应返回客户端之前执行操作，如内容压缩、响应头设置、数据脱敏等
- **请求拦截与控制**：根据业务需求决定是否允许请求继续传递到后续处理链

### 1.2 过滤器在 Spring MVC 中的位置

在 Spring MVC 请求处理流程中，过滤器的执行顺序位于最前端：

```bash
HTTP请求 → 过滤器(Filter) → 拦截器(Interceptor) → Controller → 拦截器 → 过滤器 → HTTP响应
```

这种机制使得过滤器成为处理全局性需求的理想选择。

## 2. Spring 提供的内置过滤器详解

Spring 框架提供了一系列开箱即用的过滤器，位于 `org.springframework.web.filter` 包中，这些过滤器大大简化了常见 Web 处理任务的实现。

### 2.1 Form Data 相关过滤器

#### 2.1.1 FormContentFilter

`FormContentFilter` 用于处理 HTTP PUT、PATCH 等方法中的表单内容。传统上，Servlet 容器仅自动解析 POST 请求的表单数据，而此过滤器扩展了这一功能。

**应用场景**：

- 处理 RESTful API 中 PUT、PATCH 请求的表单数据
- 支持传统浏览器表单提交之外的内容类型

**配置示例**：

```java
@Configuration
public class FilterConfig {
    
    @Bean
    public FormContentFilter formContentFilter() {
        return new FormContentFilter();
    }
}
```

**工作原理**：
该过滤器会拦截 PUT、PATCH 等请求，解析其中的表单数据，并将其重新包装为 Servlet 容器可以识别的请求对象，使 Controller 能够像处理 POST 请求一样通过 `@RequestParam` 或 `@ModelAttribute` 获取参数。

### 2.2 Forwarded Headers 处理

#### 2.2.1 ForwardedHeaderFilter

当应用部署在反向代理或负载均衡器后面时，真实的客户端信息（如 IP、协议、端口）可能被隐藏在代理添加的特定头信息中。`ForwardedHeaderFilter` 专门用于处理这些情况。

**支持的头部信息**：

- `Forwarded`：标准化头部（RFC 7239）
- `X-Forwarded-Proto`：原始协议（http/https）
- `X-Forwarded-Host`：原始主机名
- `X-Forwarded-Port`：原始端口
- `X-Forwarded-Prefix`：上下文路径前缀

**配置示例**：

```java
@Configuration
public class WebConfig {
    
    @Bean
    public ForwardedHeaderFilter forwardedHeaderFilter() {
        return new ForwardedHeaderFilter();
    }
}
```

**功能效果**：
配置后，应用能正确识别客户端的真实信息，例如：

- `HttpServletRequest.getRemoteAddr()` 返回真实客户端 IP 而非代理服务器 IP
- 生成的链接URL会自动基于原始协议和主机名

### 2.3 Shallow ETag 过滤器

#### 2.3.1 ShallowEtagHeaderFilter

`ShallowEtagHeaderFilter` 通过生成 ETag 响应头来优化网络传输，减少不必要的数据传输，提升应用性能。

**工作原理**：

1. 过滤器拦截响应内容并生成 MD5 哈希作为 ETag
2. 如果客户端请求中包含匹配的 `If-None-Match` 头，服务器返回 `304 Not Modified` 状态码
3. 浏览器使用缓存版本，减少数据传输量

**配置示例**：

```java
@Configuration
public class WebConfig {
    
    @Bean
    public ShallowEtagHeaderFilter shallowEtagHeaderFilter() {
        return new ShallowEtagHeaderFilter();
    }
}
```

**性能考量**：
虽然此过滤器可以减少网络带宽消耗，但会占用服务器资源计算响应内容的哈希值。对于计算密集型响应需谨慎使用。

### 2.4 CORS 处理

#### 2.4.1 CorsFilter

跨域资源共享（CORS）是现代浏览器实施的安全机制，`CorsFilter` 提供了一种灵活的方式配置跨域请求策略。

**配置示例**：

```java
@Configuration
public class WebConfig {
    
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("https://example.com");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        
        return new CorsFilter(source);
    }
}
```

**精细控制选项**：

- **allowedOrigins**：允许访问的源列表
- **allowedMethods**：允许的HTTP方法（GET、POST等）
- **allowedHeaders**：允许的请求头
- **exposedHeaders**：暴露给客户端的响应头
- **maxAge**：预检请求缓存时间

### 2.5 URL 处理相关过滤器

#### 2.5.1 HiddenHttpMethodFilter

由于 HTML 表单原生仅支持 GET 和 POST 方法，此过滤器允许通过隐藏字段模拟其他 HTTP 方法。

**使用方式**：
在表单中添加 `_method` 参数：

```html
<form method="post" action="/users/1">
    <input type="hidden" name="_method" value="delete">
    <button type="submit">删除用户</button>
</form>
```

**配置示例**：

```java
@Configuration
public class WebConfig {
    
    @Bean
    public HiddenHttpMethodFilter hiddenHttpMethodFilter() {
        return new HiddenHttpMethodFilter();
    }
}
```

**效果**：
上述表单提交会被转换为 DELETE 请求，映射到 `@DeleteMapping("/users/{id}")` 控制器方法。

## 3. 过滤器的实现与注册方式

Spring Boot 提供了多种配置过滤器的方式，每种方式各有适用场景。

### 3.1 使用 `@WebFilter` 注解方式

这是较为简单的声明式配置方法，适合简单的过滤需求。

**实现示例**：

```java
@Slf4j
@Order(1)
@WebFilter(filterName = "myFilter", urlPatterns = "/api/*")
public class MyFilter implements Filter {
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("过滤器初始化");
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                       FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        log.info("请求URL: {}", httpRequest.getRequestURL());
        
        // 前置处理
        long startTime = System.currentTimeMillis();
        
        // 继续过滤器链
        chain.doFilter(request, response);
        
        // 后置处理
        long duration = System.currentTimeMillis() - startTime;
        log.info("请求处理耗时: {} ms", duration);
    }
    
    @Override
    public void destroy() {
        log.info("过滤器销毁");
    }
}
```

**启动类配置**：

```java
@SpringBootApplication
@ServletComponentScan(basePackages = "com.example.filter")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

**注意事项**：

- 避免同时使用 `@WebFilter` 和 `@Component` 注解，可能导致重复过滤
- 执行顺序控制较局限，虽可使用 `@Order` 但不保证绝对顺序

### 3.2 使用 `FilterRegistrationBean` 方式（推荐）

这是 Spring Boot 官方推荐的方式，提供更精细的控制能力。

**实现示例**：

```java
public class CustomFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(CustomFilter.class);
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                       FilterChain chain) throws IOException, ServletException {
        // 过滤逻辑
        chain.doFilter(request, response);
    }
}

@Configuration
public class FilterConfig {
    
    @Bean
    public FilterRegistrationBean<CustomFilter> customFilterRegistration() {
        FilterRegistrationBean<CustomFilter> registration = 
            new FilterRegistrationBean<>();
        
        registration.setFilter(new CustomFilter());
        registration.addUrlPatterns("/api/*");
        registration.setName("customFilter");
        registration.setOrder(1); // 数字越小优先级越高
        
        // 可设置初始化参数
        registration.addInitParameter("param1", "value1");
        
        return registration;
    }
}
```

**优势**：

- **精细的URL模式控制**：可精确指定过滤的URL模式
- **明确的执行顺序**：通过 `setOrder()` 方法控制顺序
- **依赖注入支持**：可注入Spring管理的Bean

### 3.3 继承特定基类实现过滤器

Spring 提供了一些过滤器基类，简化了特定场景的实现。

#### 3.3.1 OncePerRequestFilter

确保每个请求只被过滤一次，避免在转发（forward）等场景下重复执行。

**示例**：

```java
@Component
public class LoggingFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) 
            throws ServletException, IOException {
        
        long startTime = System.currentTimeMillis();
        logger.info("请求开始: {} {}", request.getMethod(), request.getRequestURI());
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logger.info("请求完成: 状态码={}, 耗时={}ms", response.getStatus(), duration);
        }
    }
}
```

#### 3.3.2 GenericFilterBean

提供基于Spring配置的初始化方式，支持从Spring环境获取配置参数。

**示例**：

```java
public class ConfigurableFilter extends GenericFilterBean {
    private String allowedPaths;
    
    @Override
    protected void initFilterBean() throws ServletException {
        // 从Spring环境获取配置
        allowedPaths = getEnvironment().getProperty("filter.allowed-paths");
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                       FilterChain chain) throws IOException, ServletException {
        // 过滤逻辑
        chain.doFilter(request, response);
    }
}
```

## 4. 过滤器的高级应用场景

### 4.1 身份验证与授权

过滤器非常适合实现全局的安全控制逻辑。

**示例实现**：

```java
public class AuthenticationFilter extends OncePerRequestFilter {
    @Autowired
    private UserService userService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) 
            throws ServletException, IOException {
        
        String token = extractToken(request);
        if (token != null) {
            Authentication auth = userService.validateToken(token);
            if (auth != null) {
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        
        if (requiresAuthentication(request) && !isAuthenticated()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "需要认证");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
    
    private boolean requiresAuthentication(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/api/secure/");
    }
    
    private boolean isAuthenticated() {
        return SecurityContextHolder.getContext().getAuthentication() != null 
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated();
    }
}
```

### 4.2 请求限流与防刷

结合 Redis 或 Guava RateLimiter 实现API限流。

**Redis限流示例**：

```java
public class RateLimitFilter implements Filter {
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    private static final int MAX_REQUESTS_PER_MINUTE = 100;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                       FilterChain chain) throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String clientIp = getClientIpAddress(httpRequest);
        String key = "rate_limit:" + clientIp;
        
        Long count = redisTemplate.opsForValue().increment(key, 1);
        if (count != null && count == 1) {
            // 首次设置过期时间
            redisTemplate.expire(key, 60, TimeUnit.SECONDS);
        }
        
        if (count != null && count > MAX_REQUESTS_PER_MINUTE) {
            httpResponse.setStatus(HttpServletResponse.SC_TOO_MANY_REQUESTS);
            httpResponse.getWriter().write("{\"code\":429,\"message\":\"请求过于频繁\"}");
            return;
        }
        
        chain.doFilter(request, response);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        // 考虑代理情况获取真实IP
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```

### 4.3 响应内容重写与脱敏

对响应内容进行修改，实现数据脱敏等功能。

**响应脱敏示例**：

```java
public class DataMaskingFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) 
            throws ServletException, IOException {
        
        if (requiresMasking(request)) {
            ContentCachingResponseWrapper responseWrapper = 
                new ContentCachingResponseWrapper(response);
            
            try {
                filterChain.doFilter(request, responseWrapper);
            } finally {
                byte[] content = responseWrapper.getContentAsByteArray();
                if (content.length > 0) {
                    String originalContent = new String(content, 
                        response.getCharacterEncoding());
                    String maskedContent = maskSensitiveData(originalContent);
                    response.getWriter().write(maskedContent);
                }
                responseWrapper.copyBodyToResponse();
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
    
    private boolean requiresMasking(HttpServletRequest request) {
        return request.getRequestURI().contains("/sensitive/");
    }
    
    private String maskSensitiveData(String content) {
        // 实现手机号、身份证号等敏感信息脱敏逻辑
        return content.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2")
                     .replaceAll("(\\d{4})\\d{10}(\\w{4})", "$1**********$2");
    }
}
```

## 5. 过滤器最佳实践

### 5.1 执行顺序控制

当存在多个过滤器时，执行顺序至关重要。推荐使用 `FilterRegistrationBean` 明确设置顺序。

**顺序配置示例**：

```java
@Configuration
public class FilterConfig {
    
    @Bean
    public FilterRegistrationBean<LoggingFilter> loggingFilter() {
        FilterRegistrationBean<LoggingFilter> registration = 
            new FilterRegistrationBean<>();
        registration.setFilter(new LoggingFilter());
        registration.addUrlPatterns("/*");
        registration.setOrder(1); // 最先执行
        return registration;
    }
    
    @Bean
    public FilterRegistrationBean<AuthFilter> authFilter() {
        FilterRegistrationBean<AuthFilter> registration = 
            new FilterRegistrationBean<>();
        registration.setFilter(new AuthFilter());
        registration.addUrlPatterns("/api/*");
        registration.setOrder(2); // 其次执行
        return registration;
    }
    
    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        FilterRegistrationBean<CorsFilter> registration = 
            new FilterRegistrationBean<>();
        registration.setFilter(new CorsFilter(corsConfigurationSource()));
        registration.addUrlPatterns("/*");
        registration.setOrder(3); // 最后执行
        return registration;
    }
}
```

### 5.2 性能优化建议

1. **避免阻塞操作**：过滤器中避免长时间同步操作，考虑异步处理
2. **合理设置URL模式**：不要过度使用 `/*`，精确匹配需要过滤的路径
3. **资源复用**：在 `init` 方法中初始化昂贵资源，在 `destroy` 中清理
4. **响应缓存处理**：对大型响应内容谨慎操作，避免内存溢出

### 5.3 异常处理策略

**统一异常处理示例**：

```java
public class ExceptionHandlingFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) 
            throws ServletException, IOException {
        
        try {
            filterChain.doFilter(request, response);
        } catch (BusinessException ex) {
            // 转换为统一的错误响应
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"" + ex.getMessage() + "\"}");
        } catch (Exception ex) {
            logger.error("过滤器处理异常", ex);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"系统异常\"}");
        }
    }
}
```

### 5.4 测试策略

**过滤器单元测试示例**：

```java
@ExtendWith(MockitoExtension.class)
class AuthenticationFilterTest {
    
    @Mock
    private HttpServletRequest request;
    
    @Mock
    private HttpServletResponse response;
    
    @Mock
    private FilterChain filterChain;
    
    @InjectMocks
    private AuthenticationFilter authenticationFilter;
    
    @Test
    void testValidToken() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(request.getRequestURI()).thenReturn("/api/secure/data");
        
        authenticationFilter.doFilter(request, response, filterChain);
        
        verify(filterChain).doFilter(request, response);
    }
}
```

## 6. 过滤器与拦截器对比

了解过滤器与拦截器的区别有助于正确选择技术方案。

| 特性 | 过滤器(Filter) | 拦截器(Interceptor) |
|------|---------------|-------------------|
| **所属规范** | Servlet 规范 | Spring MVC 框架 |
| **依赖注入** | 默认不支持（需特殊处理） | 完全支持 |
| **执行时机** | 更早（在Servlet之前） | 较晚（在DispatcherServlet之后） |
| **使用场景** | 跨域、日志、安全过滤等 | 业务相关拦截、权限检查等 |
| **控制粒度** | 请求/响应级别 | 可精确到Controller方法 |

**选择建议**：

- 使用**过滤器**处理：字符编码、CORS、基本认证、请求日志、XSS防护等底层操作
- 使用**拦截器**处理：业务权限验证、参数预处理、响应结果统一封装等业务相关操作

## 总结

Spring Web Filter 过滤器是构建健壮 Web 应用的重要组件，通过合理利用 Spring 提供的各种内置过滤器和自定义过滤器，可以高效处理横切关注点，提高代码复用性和可维护性。掌握过滤器的正确使用方式和最佳实践，对于开发高质量 Spring Boot 应用至关重要。
