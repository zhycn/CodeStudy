---
title: Spring Interceptor 拦截器详解与最佳实践
description: 本文详细介绍了 Spring 框架中拦截器（Interceptor）的核心概念、工作原理、使用场景以及最佳实践。拦截器是 Spring MVC 框架提供的一种动态拦截方法调用的机制，基于 AOP（面向切面编程）思想实现，用于在请求处理的不同阶段插入自定义逻辑。
author: zhycn
---

# Spring Interceptor 拦截器详解与最佳实践

## 1 拦截器核心概念

### 1.1 什么是拦截器

拦截器（Interceptor）是 Spring MVC 框架提供的一种**动态拦截方法调用**的机制，基于 AOP（面向切面编程）思想实现，用于在请求处理的不同阶段插入自定义逻辑。它类似于 Servlet 规范中的过滤器（Filter），但提供了更精细的控制粒度和更丰富的功能特性。

简单来说，拦截器是一种"横切逻辑处理器"，可以在控制器方法执行前后加入自定义处理逻辑，而无需修改控制器本身的代码，实现了横切关注点与业务逻辑的**有效解耦**。

### 1.2 拦截器与相关技术对比

在实际应用中，拦截器常与过滤器和 AOP 进行对比，以下是它们的主要区别：

| 特性         | Filter（过滤器）             | Interceptor（拦截器）          | AOP（面向切面编程）        |
| ------------ | ---------------------------- | ------------------------------ | -------------------------- |
| **所属层级** | Servlet 规范                 | Spring MVC 框架                | Spring AOP                 |
| **拦截范围** | 所有请求（包括静态资源）     | 控制器请求（Handler）          | 任意方法（基于切点定义）   |
| **使用场景** | 编码设置、安全过滤、日志记录 | 权限校验、登录检查、业务层处理 | 日志、事务、缓存、异常处理 |
| **配置方式** | web.xml 或注解               | Spring 配置类中注册            | 注解（@Aspect）、配置切面  |
| **执行时机** | 请求进入 Servlet 前          | 控制器方法调用前后             | 方法调用前后               |

**核心区别总结**：

- **Filter** 更底层，作用于整个请求生命周期，属于 **Servlet 容器**级别
- **Interceptor** 更贴近业务逻辑，专注于 **Spring MVC 控制器**调用，可以获取 Spring 上下文信息
- **AOP** 最灵活，适用于各种"横切关注点"逻辑处理，粒度可细化到**任意方法**

## 2 拦截器实现方式

### 2.1 HandlerInterceptor 接口详解

Spring MVC 拦截器主要通过实现 `HandlerInterceptor` 接口来创建。该接口定义了三个核心方法：

#### 2.1.1 preHandle 方法

```java
boolean preHandle(HttpServletRequest request,
                  HttpServletResponse response,
                  Object handler) throws Exception;
```

- **执行时机**：在控制器方法执行**之前**调用
- **返回值意义**：
  - 返回 `true`：继续执行后续拦截器和控制器方法
  - 返回 `false`：中断执行流程，不会继续执行后续拦截器和控制器
- **典型应用**：权限校验、登录检查、请求参数预处理

#### 2.1.2 postHandle 方法

```java
void postHandle(HttpServletRequest request,
                HttpServletResponse response,
                Object handler,
                ModelAndView modelAndView) throws Exception;
```

- **执行时机**：在控制器方法执行**之后**，视图渲染**之前**调用
- **注意事项**：只有 `preHandle` 返回 `true` 时才会执行
- **典型应用**：向视图添加公共模型数据、统一处理返回结果

#### 2.1.3 afterCompletion 方法

```java
void afterCompletion(HttpServletRequest request,
                     HttpServletResponse response,
                     Object handler,
                     Exception ex) throws Exception;
```

- **执行时机**：在整个请求完成**之后**调用（视图渲染完成后）
- **注意事项**：无论 `preHandle` 返回 `true` 还是 `false` 都会执行
- **典型应用**：资源清理、请求耗时统计、异常日志记录

### 2.2 基础拦截器实现示例

以下是一个简单的日志记录拦截器实现：

```java
@Component
public class LogInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(LogInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        long startTime = System.currentTimeMillis();
        request.setAttribute("startTime", startTime);

        log.info("请求开始: URL={}, 方法={}, 参数={}",
                request.getRequestURL(),
                request.getMethod(),
                request.getParameterMap());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        long startTime = (Long) request.getAttribute("startTime");
        long endTime = System.currentTimeMillis();

        log.info("请求完成: URL={}, 耗时={}ms, 异常={}",
                request.getRequestURL(),
                (endTime - startTime),
                ex != null ? ex.getMessage() : "无");
    }
}
```

## 3 拦截器配置与注册

### 3.1 配置类注册方式

在 Spring Boot 中，需要通过实现 `WebMvcConfigurer` 接口来注册拦截器：

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private LogInterceptor logInterceptor;

    @Autowired
    private AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 注册日志拦截器，拦截所有请求
        registry.addInterceptor(logInterceptor)
                .addPathPatterns("/**");

        // 注册权限拦截器，拦截特定路径
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**", "/admin/**")
                .excludePathPatterns("/api/login", "/api/register",
                                   "/static/**", "/error");
    }
}
```

### 3.2 路径模式配置技巧

Spring MVC 支持 **Ant 风格**的路径匹配模式：

- `/**`：匹配所有路径，包括子路径
- `/api/*`：匹配 `/api` 下的一级路径
- `/admin/**`：匹配 `/admin` 下的所有层级路径
- `*.html`：匹配所有以 `.html` 结尾的路径

**最佳实践**：精确配置拦截路径，避免不必要的性能开销，特别是要排除静态资源路径。

### 3.3 多拦截器执行顺序控制

当存在多个拦截器时，可以通过以下方式控制执行顺序：

#### 3.3.1 注册顺序控制

```java
@Override
public void addInterceptors(InterceptorRegistry registry) {
    // 先注册的先执行 preHandle，但后执行 postHandle 和 afterCompletion
    registry.addInterceptor(new FirstInterceptor()).order(1);
    registry.addInterceptor(new SecondInterceptor()).order(2);
    registry.addInterceptor(new ThirdInterceptor()).order(3);
}
```

#### 3.3.2 @Order 注解控制

```java
@Component
@Order(1)
public class FirstInterceptor implements HandlerInterceptor {
    // 实现细节...
}

@Component
@Order(2)
public class SecondInterceptor implements HandlerInterceptor {
    // 实现细节...
}
```

**执行顺序规则**：

- `preHandle` 方法：按**注册顺序**执行（Order 值越小越先执行）
- `postHandle` 方法：按**注册逆序**执行
- `afterCompletion` 方法：按**注册逆序**执行

## 4 企业级实战案例

### 4.1 登录鉴权拦截器

以下是一个生产级的登录鉴权拦截器实现：

```java
@Slf4j
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private UserService userService;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        // 排除登录相关接口
        String requestURI = request.getRequestURI();
        if (requestURI.contains("/login") || requestURI.contains("/public/")) {
            return true;
        }

        // 从请求头获取 Token
        String token = request.getHeader("X-Auth-Token");
        if (!StringUtils.hasLength(token)) {
            sendUnauthorizedResponse(response, "缺少认证令牌");
            return false;
        }

        // 验证 Token 有效性
        User user = userService.validateToken(token);
        if (user == null) {
            sendUnauthorizedResponse(response, "认证令牌无效或已过期");
            return false;
        }

        // 将用户信息存入请求上下文
        UserContext.setCurrentUser(user);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        // 清理用户上下文，防止内存泄漏
        UserContext.clear();
    }

    private void sendUnauthorizedResponse(HttpServletResponse response,
                                         String message) throws IOException {
        response.setStatus(HttpStatus.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");

        Map<String, Object> result = new HashMap<>();
        result.put("code", 401);
        result.put("message", message);
        result.put("timestamp", System.currentTimeMillis());

        response.getWriter().write(new ObjectMapper().writeValueAsString(result));
    }
}
```

### 4.2 接口限流拦截器

防止接口被恶意频繁调用的限流拦截器：

```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();
    private final double permitsPerSecond = 100.0; // 每秒允许的请求数

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        String apiKey = request.getHeader("API-Key");
        String clientIp = getClientIpAddress(request);
        String identifier = StringUtils.hasLength(apiKey) ? apiKey : clientIp;

        RateLimiter limiter = limiters.computeIfAbsent(identifier,
            key -> RateLimiter.create(permitsPerSecond));

        if (!limiter.tryAcquire()) {
            response.setStatus(HttpStatus.SC_TOO_MANY_REQUESTS);
            response.getWriter().write("请求过于频繁，请稍后再试");
            return false;
        }

        return true;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        // 获取客户端真实 IP（考虑代理情况）
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasLength(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```

### 4.3 性能监控拦截器

用于监控接口性能的拦截器实现：

```java
@Component
public class PerformanceInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger("performance");

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        request.setAttribute("startTime", System.nanoTime());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        long startTime = (Long) request.getAttribute("startTime");
        long duration = (System.nanoTime() - startTime) / 1_000_000; // 转换为毫秒

        String endpoint = request.getRequestURI();
        String method = request.getMethod();

        // 记录慢请求（超过 500ms）
        if (duration > 500) {
            log.warn("慢接口警告: {} {}, 耗时: {}ms, 异常: {}",
                    method, endpoint, duration, ex != null ? ex.getMessage() : "无");
        } else {
            log.info("接口执行: {} {}, 耗时: {}ms", method, endpoint, duration);
        }

        // 可以推送到监控系统（如 Prometheus、InfluxDB）
        Metrics.timer("http.requests")
                .tag("method", method)
                .tag("endpoint", endpoint)
                .tag("status", String.valueOf(response.getStatus()))
                .record(duration, TimeUnit.MILLISECONDS);
    }
}
```

## 5 高级特性与最佳实践

### 5.1 拦截器异常处理

拦截器中的异常需要妥善处理，避免影响主流程：

```java
@ControllerAdvice
public class InterceptorExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResult> handleAuthException(AuthException e) {
        ErrorResult error = new ErrorResult(401, e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(RateLimitException.class)
    public ResponseEntity<ErrorResult> handleRateLimitException(RateLimitException e) {
        ErrorResult error = new ErrorResult(429, "请求过于频繁");
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
    }
}

// 在拦截器中使用自定义异常
public boolean preHandle(HttpServletRequest request,
                         HttpServletResponse response,
                         Object handler) {
    if (!checkPermission(request)) {
        throw new AuthException("用户无权限访问此资源");
    }
    return true;
}
```

### 5.2 异步请求特殊处理

对于异步请求，需要实现 `AsyncHandlerInterceptor` 接口：

```java
@Component
public class AsyncInterceptor implements AsyncHandlerInterceptor {

    @Override
    public void afterConcurrentHandlingStarted(HttpServletRequest request,
                                               HttpServletResponse response,
                                               Object handler) {
        // 异步请求开始时的处理
        log.info("异步请求开始: {}", request.getRequestURI());
    }
}
```

### 5.3 动态拦截器配置

实现可动态更新的拦截器配置：

```java
@Configuration
@RefreshScope // 配合配置中心实现热更新
public class DynamicInterceptorConfig implements WebMvcConfigurer {

    @Value("${interceptors.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${interceptors.rate-limit.threshold:100}")
    private int rateLimitThreshold;

    @Autowired
    private RateLimitInterceptor rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (rateLimitEnabled) {
            registry.addInterceptor(rateLimitInterceptor)
                    .addPathPatterns("/api/**")
                    .order(1);
        }
    }

    @EventListener
    public void onConfigUpdate(EnvironmentChangeEvent event) {
        // 配置更新时的处理逻辑
        if (event.getKeys().contains("interceptors.rate-limit.threshold")) {
            // 更新限流阈值
            rateLimitInterceptor.updateThreshold(rateLimitThreshold);
        }
    }
}
```

### 5.4 性能优化建议

1. **轻量级预处理**：在 `preHandle` 中只进行轻量级检查，避免耗时操作
2. **缓存频繁使用数据**：如权限信息可缓存，减少重复查询
3. **合理设置拦截路径**：避免拦截静态资源和不必要的路径
4. **异步处理非关键逻辑**：如日志记录可异步执行，不阻塞主流程

### 5.5 常见问题解决方案

#### 5.5.1 拦截器不生效排查步骤

1. 检查配置类是否添加 `@Configuration` 注解
2. 确认拦截路径模式是否正确
3. 查看是否有其他配置覆盖了拦截器配置
4. 检查拦截器是否被 Spring 管理（如使用 `@Component`）

#### 5.5.2 静态资源被拦截问题

```java
@Override
public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(new MyInterceptor())
            .addPathPatterns("/**")
            .excludePathPatterns("/static/**", "/css/**", "/js/**",
                               "/images/**", "/favicon.ico");
}
```

#### 5.5.3 跨域处理拦截器

```java
@Component
public class CorsInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods",
                         "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers",
                         "Content-Type, Authorization, X-Requested-With");
        response.setHeader("Access-Control-Max-Age", "3600");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpStatus.SC_OK);
            return false;
        }

        return true;
    }
}
```

## 6 总结

Spring 拦截器是处理横切关注点的强大工具，合理使用可以极大提高代码的复用性和可维护性。通过本文的详细讲解，可以看到拦截器在权限控制、日志记录、性能监控、接口限流等方面的广泛应用。

**关键要点回顾**：

1. 拦截器基于 **HandlerInterceptor** 接口实现，包含三个生命周期方法
2. 通过 **WebMvcConfigurer** 配置拦截器和路径映射
3. 多拦截器执行顺序可通过 **@Order** 或注册顺序控制
4. 生产环境中需注意**性能优化**和**异常处理**

在实际项目中，应根据具体业务需求灵活组合各种拦截器，构建强大的请求处理管道，同时遵循最佳实践，确保系统的高可用性和可维护性。
