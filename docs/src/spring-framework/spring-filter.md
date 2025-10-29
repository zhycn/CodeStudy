---
title: Spring Filter 过滤器详解与最佳实践
description: 本文详细介绍了 Spring 框架中 Filter 过滤器的核心概念、工作原理、使用场景以及最佳实践。Filter 是 Servlet 规范中定义的组件，用于在 HTTP 请求到达 Servlet 之前或响应返回客户端之前执行特定处理。
author: zhycn
---

# Spring Filter 过滤器详解与最佳实践

## 1. 过滤器核心概念

### 1.1 什么是过滤器

过滤器（Filter）是 **Java Servlet 规范** 中定义的组件，基于 **AOP（面向切面编程）** 思想实现，用于在 HTTP 请求到达 Servlet 之前或响应返回客户端之前执行特定处理。过滤器可以拦截浏览器发出的请求，并决定放行请求还是中断请求，实现对请求和响应的预处理和后处理。

### 1.2 过滤器的作用机制

过滤器工作在 **Servlet 容器层级**，对所有进入容器的请求进行过滤。其核心机制如下：

- **请求预处理**：在请求到达 Controller 之前执行，如身份验证、日志记录、字符编码设置
- **响应后处理**：在响应返回客户端之前执行，如响应内容压缩、缓存头设置
- **链式调用**：多个过滤器形成过滤器链，按配置顺序依次执行

### 1.3 过滤器与拦截器的区别

虽然过滤器和拦截器都用于请求处理，但存在重要差异：

| 特性         | 过滤器（Filter）          | 拦截器（Interceptor）         |
| ------------ | ------------------------- | ----------------------------- |
| **规范层级** | Servlet 规范（J2EE 标准） | Spring MVC 框架机制           |
| **作用范围** | 所有请求（包括静态资源）  | 只处理 Controller 请求        |
| **依赖关系** | 不依赖 Spring 容器        | 完全集成 Spring IOC 容器      |
| **执行时机** | 在 DispatcherServlet 之前 | 在 DispatcherServlet 之后     |
| **异常处理** | 无法使用 Spring 异常机制  | 可通过 @ControllerAdvice 处理 |

**执行流程示意图**：

```bash
HTTP Request → Filter Chain → DispatcherServlet → Interceptor.preHandle
→ Controller → Interceptor.postHandle → View Rendering → Interceptor.afterCompletion
→ Filter Chain（返回响应）
```

## 2. 过滤器的三种实现方式

### 2.1 使用 @WebFilter + @ServletComponentScan（简单但受限）

这种方式适用于简单的过滤器场景，配置简便但灵活性有限。

```java
@Slf4j
@WebFilter(filterName = "myFilter", urlPatterns = {"/api/*"})
public class SimpleFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("SimpleFilter 初始化");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                       FilterChain chain) throws IOException, ServletException {
        log.info("请求进入 SimpleFilter");
        HttpServletRequest httpRequest = (HttpServletRequest) request;

        // 前置处理：记录请求信息
        log.info("请求路径: {}", httpRequest.getRequestURI());
        long startTime = System.currentTimeMillis();

        // 放行请求
        chain.doFilter(request, response);

        // 后置处理：记录处理时间
        long duration = System.currentTimeMillis() - startTime;
        log.info("请求处理耗时: {} ms", duration);
    }

    @Override
    public void destroy() {
        log.info("SimpleFilter 销毁");
    }
}
```

启动类配置：

```java
@SpringBootApplication
@ServletComponentScan  // 扫描 @WebFilter、@WebServlet、@WebListener
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

**局限性**：

- 无法通过 @Order 注解控制执行顺序
- 过滤器顺序由类名字典顺序决定
- 无法灵活排除特定路径

### 2.2 使用 @Component + @Order（自动注册）

这种方式让 Spring 自动注册过滤器，适合全局过滤但无法指定 URL 模式。

```java
@Order(1)  // 值越小优先级越高
@Component
public class AutoRegisteredFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                       FilterChain chain) throws IOException, ServletException {
        // 设置字符编码
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setContentType("text/html;charset=UTF-8");

        chain.doFilter(request, response);
    }
}
```

**特点**：

- 自动拦截所有请求路径
- 可以通过 @Order 控制过滤器执行顺序
- 配置简单但不够灵活

### 2.3 使用 FilterRegistrationBean（推荐方式）

这是 **最灵活、最推荐** 的配置方式，可以精确控制所有参数。

```java
@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean<LoggingFilter> loggingFilter() {
        FilterRegistrationBean<LoggingFilter> registration =
            new FilterRegistrationBean<>();

        registration.setFilter(new LoggingFilter());
        registration.addUrlPatterns("/api/*", "/admin/*");
        registration.setOrder(1);
        registration.setName("loggingFilter");

        // 设置初始化参数
        registration.addInitParameter("excludedPaths", "/health,/metrics");

        return registration;
    }

    @Bean
    public FilterRegistrationBean<AuthFilter> authFilter() {
        FilterRegistrationBean<AuthFilter> registration =
            new FilterRegistrationBean<>();

        registration.setFilter(new AuthFilter());
        registration.addUrlPatterns("/secure/*");
        registration.setOrder(2);
        registration.setName("authFilter");

        return registration;
    }
}

// 使用 OncePerRequestFilter 确保一次请求只过滤一次
public class LoggingFilter extends OncePerRequestFilter {
    private final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();

        // 前置处理
        logger.info("[{}] 开始处理请求: {} {}",
                   requestId, request.getMethod(), request.getRequestURI());

        try {
            // 将请求ID设置到请求属性中，供后续使用
            request.setAttribute("requestId", requestId);

            // 继续过滤器链
            filterChain.doFilter(request, response);

        } finally {
            // 后置处理
            long duration = System.currentTimeMillis() - startTime;
            logger.info("[{}] 请求处理完成, 耗时: {}ms, 状态: {}",
                       requestId, duration, response.getStatus());
        }
    }
}
```

**优势**：

- ✅ 精确控制 URL 模式
- ✅ 灵活设置执行顺序
- ✅ 支持初始化参数
- ✅ 可结合 OncePerRequestFilter 使用

## 3. 核心过滤器类型与应用场景

### 3.1 基础过滤器类

Spring 提供了多种过滤器基类满足不同需求：

```java
// 1. 基础 Servlet Filter
public class BasicFilter implements Filter {
    // 需要实现全部三个方法
}

// 2. Spring 通用过滤器基类
public class SpringAwareFilter extends GenericFilterBean {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                       FilterChain chain) throws IOException, ServletException {
        // 可以访问 Spring 环境属性
    }
}

// 3. 确保每次请求只执行一次的过滤器（推荐）
public class SafeFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain)
            throws ServletException, IOException {
        // 保证同一请求在单个线程中只执行一次过滤逻辑
        String token = extractToken(request);
        if (!isValidToken(token)) {
            sendErrorResponse(response, 401, "Invalid token");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
```

### 3.2 功能型过滤器示例

#### 3.2.1 字符编码过滤器

```java
@Configuration
public class EncodingConfig {

    @Bean
    public FilterRegistrationBean<CharacterEncodingFilter> characterEncodingFilter() {
        CharacterEncodingFilter filter = new CharacterEncodingFilter();
        filter.setEncoding("UTF-8");
        filter.setForceEncoding(true);

        FilterRegistrationBean<CharacterEncodingFilter> registration =
            new FilterRegistrationBean<>();
        registration.setFilter(filter);
        registration.addUrlPatterns("/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE); // 最高优先级

        return registration;
    }
}
```

#### 3.2.2 CORS 跨域过滤器

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("https://trusted-domain.com");
        config.addAllowedHeader("*");
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);

        return new CorsFilter(source);
    }
}
```

#### 3.2.3 防重放攻击过滤器

```java
public class ReplayAttackFilter extends OncePerRequestFilter {
    private final Cache<String, Boolean> requestCache =
        Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(10000)
            .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain)
            throws ServletException, IOException {

        String nonce = request.getHeader("X-Nonce");
        if (StringUtils.isEmpty(nonce)) {
            sendErrorResponse(response, 400, "Missing nonce header");
            return;
        }

        // 检查是否重复请求
        if (requestCache.getIfPresent(nonce) != null) {
            sendErrorResponse(response, 400, "Duplicate request");
            return;
        }

        // 缓存本次请求的 nonce
        requestCache.put(nonce, true);
        filterChain.doFilter(request, response);
    }
}
```

## 4. 实战案例与最佳实践

### 4.1 权限验证过滤器

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserService userService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String token = extractJwtFromRequest(request);

            if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
                String username = tokenProvider.getUsernameFromToken(token);
                UserDetails userDetails = userService.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails,
                                                          null,
                                                          userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource()
                    .buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            logger.error("无法设置用户认证", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    // 排除登录、公开接口等不需要认证的路径
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/auth/") ||
               path.startsWith("/public/") ||
               path.equals("/health");
    }
}
```

### 4.2 请求日志记录过滤器

```java
public class RequestLoggingFilter extends OncePerRequestFilter {
    private final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        String requestId = (String) request.getAttribute("requestId");

        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
            request.setAttribute("requestId", requestId);
        }

        // 记录请求信息
        logRequest(requestId, request);

        try {
            filterChain.doFilter(request, response);
        } finally {
            // 记录响应信息
            logResponse(requestId, request, response, startTime);
        }
    }

    private void logRequest(String requestId, HttpServletRequest request) {
        if (logger.isInfoEnabled()) {
            logger.info("[{}] {} {}?{}",
                       requestId,
                       request.getMethod(),
                       request.getRequestURI(),
                       request.getQueryString());
        }
    }

    private void logResponse(String requestId, HttpServletRequest request,
                           HttpServletResponse response, long startTime) {
        long duration = System.currentTimeMillis() - startTime;
        logger.info("[{}] 响应状态: {}, 耗时: {}ms",
                   requestId, response.getStatus(), duration);
    }
}
```

### 4.3 XSS 防护过滤器

```java
public class XssFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                       FilterChain chain) throws IOException, ServletException {

        // 使用包装器对请求参数进行XSS过滤
        XssRequestWrapper wrappedRequest = new XssRequestWrapper(
            (HttpServletRequest) request);

        chain.doFilter(wrappedRequest, response);
    }
}

// XSS 请求包装器
public class XssRequestWrapper extends HttpServletRequestWrapper {

    public XssRequestWrapper(HttpServletRequest request) {
        super(request);
    }

    @Override
    public String getParameter(String name) {
        String value = super.getParameter(name);
        return cleanXss(value);
    }

    @Override
    public String[] getParameterValues(String name) {
        String[] values = super.getParameterValues(name);
        if (values == null) return null;

        String[] cleanedValues = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            cleanedValues[i] = cleanXss(values[i]);
        }
        return cleanedValues;
    }

    @Override
    public String getHeader(String name) {
        String value = super.getHeader(name);
        return cleanXss(value);
    }

    private String cleanXss(String value) {
        if (value == null) return null;

        return value.replaceAll("<", "&lt;")
                   .replaceAll(">", "&gt;")
                   .replaceAll("\"", "&quot;")
                   .replaceAll("'", "&#x27;")
                   .replaceAll("/", "&#x2F;");
    }
}
```

## 5. 最佳实践与性能优化

### 5.1 过滤器执行顺序控制

正确的执行顺序对系统稳定性和安全性至关重要：

```java
@Configuration
public class FilterOrderConfig {

    @Bean
    public FilterRegistrationBean<EncodingFilter> encodingFilter() {
        FilterRegistrationBean<EncodingFilter> bean =
            new FilterRegistrationBean<>();
        bean.setFilter(new EncodingFilter());
        bean.addUrlPatterns("/*");
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE); // 字符编码最先处理
        return bean;
    }

    @Bean
    public FilterRegistrationBean<SecurityFilter> securityFilter() {
        FilterRegistrationBean<SecurityFilter> bean =
            new FilterRegistrationBean<>();
        bean.setFilter(new SecurityFilter());
        bean.addUrlPatterns("/api/*");
        bean.setOrder(2); // 安全性其次
        return bean;
    }

    @Bean
    public FilterRegistrationBean<LoggingFilter> loggingFilter() {
        FilterRegistrationBean<LoggingFilter> bean =
            new FilterRegistrationBean<>();
        bean.setFilter(new LoggingFilter());
        bean.addUrlPatterns("/*");
        bean.setOrder(Ordered.LOWEST_PRECEDENCE); // 日志记录最后
        return bean;
    }
}
```

**推荐顺序**：

1. **字符编码过滤器**（最高优先级）
2. **安全相关过滤器**（认证、授权、XSS防护）
3. **业务逻辑过滤器**
4. **日志记录过滤器**（最低优先级）

### 5.2 性能优化建议

```java
public class PerformanceOptimizedFilter extends OncePerRequestFilter {

    // 使用缓存提高性能
    private final Set<String> excludedPaths = ConcurrentHashMap.newKeySet();

    @PostConstruct
    public void init() {
        // 初始化排除路径
        excludedPaths.add("/health");
        excludedPaths.add("/metrics");
        excludedPaths.add("/static/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // 快速路径：排除不需要处理的请求
        if (shouldNotFilterFast(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 性能监控
        long startTime = System.nanoTime();
        try {
            // 核心过滤逻辑
            doActualFiltering(request, response);
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.nanoTime() - startTime;
            if (duration > 100_000_000) { // 超过100ms记录警告
                logger.warn("过滤器执行缓慢: {}ns, 路径: {}", duration, path);
            }
        }
    }

    private boolean shouldNotFilterFast(String path) {
        for (String excluded : excludedPaths) {
            if (path.startsWith(excluded)) {
                return true;
            }
        }
        return false;
    }
}
```

### 5.3 异常处理策略

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
            // 业务异常处理
            handleBusinessException(request, response, ex);

        } catch (AuthenticationException ex) {
            // 认证异常处理
            handleAuthException(request, response, ex);

        } catch (Exception ex) {
            // 全局异常处理
            handleGenericException(request, response, ex);
        }
    }

    private void handleBusinessException(HttpServletRequest request,
                                       HttpServletResponse response,
                                       BusinessException ex) throws IOException {

        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.setContentType("application/json;charset=UTF-8");

        ErrorResponse errorResponse = ErrorResponse.builder()
            .code(ex.getErrorCode())
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .build();

        response.getWriter().write(convertToJson(errorResponse));
    }
}
```

## 6. 常见问题与解决方案

### 6.1 过滤器不生效问题排查

**问题场景**：过滤器配置正确但未执行

```java
// 错误示例：缺少 @Configuration 或 @Bean
public class MissingConfig {
    // 缺少 @Bean 注解导致过滤器未注册
    public FilterRegistrationBean<MyFilter> myFilter() {
        return new FilterRegistrationBean<>();
    }
}

// 正确配置
@Configuration
public class CorrectFilterConfig {

    @Bean  // 必须添加 @Bean 注解
    public FilterRegistrationBean<MyFilter> myFilter() {
        FilterRegistrationBean<MyFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new MyFilter());
        bean.addUrlPatterns("/*");
        return bean;
    }
}
```

**排查步骤**：

1. 检查过滤器是否正确注册到 Spring 容器
2. 验证 URL 模式是否匹配目标请求路径
3. 确认过滤器顺序配置是否正确
4. 检查是否被更高优先级的过滤器中断

### 6.2 过滤器执行多次问题

**问题原因**：错误配置导致同一过滤器多次注册

```java
// 错误示例：重复注册
@WebFilter("/*")  // 方式1：@WebFilter 注册
@Component         // 方式2：@Component 注册
public class DuplicateFilter implements Filter {
    // 该过滤器会被执行两次
}

// 正确做法：选择一种注册方式
@WebFilter("/*")
// 或
@Component
public class CorrectFilter implements Filter {
    // 现在只会执行一次
}
```

### 6.3 静态资源被过滤器拦截问题

```java
@Configuration
public class StaticResourceFilterConfig {

    @Bean
    public FilterRegistrationBean<AuthFilter> authFilter() {
        FilterRegistrationBean<AuthFilter> bean =
            new FilterRegistrationBean<>();
        bean.setFilter(new AuthFilter());

        // 精确控制拦截路径，排除静态资源
        bean.addUrlPatterns("/api/*", "/admin/*");
        bean.addUrlPatterns("/app/*");

        // 排除静态资源路径
        bean.setUrlPatterns(Arrays.asList(
            "/api/*", "/admin/*", "/app/*"
        ));

        return bean;
    }
}

// 或者在使用 OncePerRequestFilter 时覆盖 shouldNotFilter 方法
public class SmartFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/static/") ||
               path.startsWith("/css/") ||
               path.startsWith("/js/") ||
               path.endsWith(".ico") ||
               path.endsWith(".css") ||
               path.endsWith(".js");
    }
}
```

## 7. 附录：常用过滤器工具类

### 7.1 响应包装器工具类

```java
public class ResponseWrapper extends HttpServletResponseWrapper {
    private final ByteArrayOutputStream capture;
    private ServletOutputStream output;
    private PrintWriter writer;

    public ResponseWrapper(HttpServletResponse response) {
        super(response);
        capture = new ByteArrayOutputStream(response.getBufferSize());
    }

    @Override
    public ServletOutputStream getOutputStream() {
        if (writer != null) {
            throw new IllegalStateException("getWriter() has already been called");
        }

        if (output == null) {
            output = new ServletOutputStream() {
                @Override
                public void write(int b) throws IOException {
                    capture.write(b);
                }

                @Override
                public void flush() throws IOException {
                    capture.flush();
                }

                @Override
                public void close() throws IOException {
                    capture.close();
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setWriteListener(WriteListener listener) {
                    // 无需实现
                }
            };
        }
        return output;
    }

    public byte[] getCaptureAsBytes() throws IOException {
        if (writer != null) {
            writer.close();
        } else if (output != null) {
            output.close();
        }
        return capture.toByteArray();
    }

    public String getCaptureAsString() throws IOException {
        return new String(getCaptureAsBytes(), getCharacterEncoding());
    }
}
```

### 7.2 过滤器工具类

```java
@Component
public class FilterUtils {

    private static final Logger logger = LoggerFactory.getLogger(FilterUtils.class);

    /**
     * 安全地调用 chain.doFilter 并处理异常
     */
    public static void safeDoFilter(FilterChain chain,
                                   ServletRequest request,
                                   ServletResponse response) {
        try {
            chain.doFilter(request, response);
        } catch (IOException | ServletException e) {
            logger.error("过滤器链执行异常", e);
            throw new RuntimeException("过滤器处理失败", e);
        }
    }

    /**
     * 检查请求是否应该被过滤
     */
    public static boolean shouldFilter(HttpServletRequest request,
                                      String[] excludePatterns) {
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();

        // 移除上下文路径
        if (path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }

        for (String pattern : excludePatterns) {
            if (pathMatcher.match(pattern, path)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 设置缓存头
     */
    public static void setCacheHeaders(HttpServletResponse response,
                                      int maxAgeInSeconds) {
        response.setHeader("Cache-Control",
                          "public, max-age=" + maxAgeInSeconds);
        response.setDateHeader("Expires",
                              System.currentTimeMillis() + maxAgeInSeconds * 1000);
    }
}
```

通过本文的详细讲解和代码示例，您应该对 Spring Filter 过滤器有了全面的理解。在实际项目中，请根据具体需求选择合适的实现方式，并遵循最佳实践以确保系统的稳定性、安全性和可维护性。
