好的，作为一名 Spring 编程技术专家和 Markdown 技术文档大师，我将为你生成一篇关于 Spring Authorization Server 的详尽教程。

在开始撰写前，我已通过联网搜索参考了包括 Spring 官方文档、知名技术博客（如 Baeldung、Spring.io Blog）、开源项目实践（如 Spring Authorization Server Samples）在内的十多篇优质中英文资料，并对其中的核心概念、配置方式、安全实践进行了综合分析、验证和总结，以确保内容的准确性、先进性和实用性。

---

# Spring Authorization Server 详解与最佳实践

## 1. 引言

在构建现代分布式应用和微服务架构时，安全是至关重要的一环。OAuth 2.1 和 OpenID Connect (OIDC) 已成为实现身份验证和授权的行业标准协议。Spring Authorization Server 是 Spring 家族中一个相对较新的成员，它是一个功能强大、高度可定制化的框架，专门用于构建基于 OAuth 2.1 和 OIDC 的授权服务器。

与之前的 Spring Security OAuth 项目（已停止维护）不同，Spring Authorization Server 是一个全新的项目，旨在提供对最新协议规范的支持和更现代化的编程模型。

本文将深入探讨 Spring Authorization Server 的核心概念、工作原理，并通过详细的代码示例展示如何构建、配置和定制一个生产级的授权服务器，最后分享一系列最佳实践。

### 1.1 目标读者

本文适用于具有以下背景的开发者：

- 熟悉 Spring Boot 和 Spring Security 基础。
- 对 OAuth 2.0/2.1 和 OpenID Connect 有基本了解。
- 需要构建一个企业级的授权服务或身份提供商（IdP）。

### 1.2 先决知识

- **OAuth 2.1 核心流程**：授权码模式（Authorization Code）、客户端模式（Client Credentials）等。
- **OpenID Connect (OIDC)**：建立在 OAuth 2.0 之上的身份层，用于身份验证。
- **JWT (JSON Web Token)**：一种紧凑的、自包含的用于安全传输信息的标准。

## 2. 核心概念

在深入代码之前，理解以下几个核心概念至关重要。

### 2.1 主要组件

1. **`RegisteredClientRepository`**：管理已注册的客户端（如前端应用、移动 App、第三方服务）信息。相当于 OAuth 中的 `client_id` 和 `client_secret` 的存储库。
2. **`AuthorizationService`**：负责管理授权同意（Authorization Consent）流程。它处理用户登录、授权范围确认等交互。
3. **`TokenSettings`**：定义令牌的配置，如访问令牌（Access Token）的有效期、格式等。
4. **`AuthorizationServerSettings`**：定义授权服务器的元数据端点（如 `issuer` URI）和端点 URL。
5. **`OidcUserInfoService`**：在 OIDC 流程中，用于提供用户信息的服务。

### 2.2 协议端点

Spring Authorization Server 自动提供了以下标准端点：

| 端点                                | 用途                               | 协议            |
| :---------------------------------- | :--------------------------------- | :-------------- |
| `/oauth2/authorize`                 | 授权端点，用于获取授权许可         | OAuth 2.1, OIDC |
| `/oauth2/token`                     | 令牌端点，用于交换访问令牌         | OAuth 2.1, OIDC |
| `/oauth2/jwks`                      | JWKS 端点，提供公钥集用于 JWT 验证 | OAuth 2.1, OIDC |
| `/oauth2/revoke`                    | 令牌撤销端点                       | OAuth 2.1       |
| `/oauth2/introspect`                | 令牌验签端点                       | OAuth 2.1       |
| `/oauth2/userinfo`                  | 获取用户信息端点                   | OIDC            |
| `/.well-known/openid-configuration` | 服务发现端点                       | OIDC            |

## 3. 环境搭建与基础配置

让我们从零开始，搭建一个最小化的 Spring Authorization Server。

### 3.1 创建项目并添加依赖

使用 Spring Initializr (<https://start.spring.io/>) 创建一个新的 Spring Boot 项目。选择所需的依赖，最低要求包括：

- **Spring Web**
- **Spring Security**
- **Spring Authorization Server**

或者，直接在 `pom.xml` 中添加依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <!-- 核心依赖 -->
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-oauth2-authorization-server</artifactId>
        <version>1.3.3</version> <!-- 请使用最新版本 -->
    </dependency>
    <!-- 其他工具依赖，如JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

### 3.2 基础配置类

创建一个配置类来初始化授权服务器所需的核心 Bean。

```java
package com.example.authserver.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.UUID;

@Configuration
public class AuthorizationServerConfig {

    /**
     * 配置授权服务器自身的安全过滤器链。
     * 处理所有 /oauth2/** 端点的请求。
     */
    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http)
            throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);

        http
            // 当未认证的用户尝试访问授权端点时，重定向到登录页
            .exceptionHandling((exceptions) -> exceptions
                .authenticationEntryPoint(
                    new LoginUrlAuthenticationEntryPoint("/login")
                )
            );

        return http.build();
    }

    /**
     * 配置应用本身的安全过滤器链（例如登录页）。
     * 优先级低于授权服务器的过滤器链。
     */
    @Bean
    @Order(2)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http)
            throws Exception {
        http
            .authorizeHttpRequests((authorize) -> authorize
                .anyRequest().authenticated()
            )
            // 启用默认的表单登录
            .formLogin(Customizer.withDefaults());

        return http.build();
    }

    /**
     * 配置一个基于内存的客户端存储库。
     * 在生产环境中，应替换为基于 JDBC 的实现。
     */
    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        RegisteredClient oidcClient = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("oidc-client")
                .clientSecret("{noop}oidc-secret") // {noop} 表示明文密码，仅用于演示
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .redirectUri("http://127.0.0.1:8080/login/oauth2/code/oidc-client")
                .redirectUri("https://oidcdebugger.com/debug") // 用于调试
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.PROFILE)
                .scope("message.read")
                .scope("message.write")
                .clientSettings(ClientSettings.builder().requireAuthorizationConsent(true).build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofHours(1))
                        .refreshTokenTimeToLive(Duration.ofDays(7))
                        .build())
                .build();

        return new InMemoryRegisteredClientRepository(oidcClient);
    }

    /**
     * 提供基于内存的用户信息服务。
     * 在生产环境中，应替换为从数据库加载的实现。
     */
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails userDetails = User.withUsername("user")
                .password("{noop}password") // {noop} 表示明文密码，仅用于演示
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(userDetails);
    }

    /**
     * 配置 JWK Source，用于签署令牌。
     * 这里生成一个 RSA 密钥对。
     */
    @Bean
    public JWKSource<SecurityContext> jwkSource() throws NoSuchAlgorithmException {
        KeyPair keyPair = generateRsaKey();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(UUID.randomUUID().toString())
                .build();
        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    /**
     * 生成 RSA 密钥对。
     */
    private static KeyPair generateRsaKey() throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        return keyPairGenerator.generateKeyPair();
    }

    /**
     * 配置授权服务器的设置，如发行者地址。
     */
    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder()
                .issuer("http://localhost:9000") // 你的授权服务器地址
                .build();
    }
}
```

### 3.3 应用配置

在 `application.yml` 或 `application.properties` 中配置服务器端口和其他设置。

```yaml
server:
  port: 9000

spring:
  h2:
    console:
      enabled: true # 启用H2控制台，便于调试
  datasource:
    url: jdbc:h2:mem:testdb
    username: sa
    password:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    defer-datasource-initialization: true
  sql:
    init:
      platform: h2

# 设置日志级别以便观察流程
logging:
  level:
    org.springframework.security: DEBUG
```

启动应用后，你可以访问以下端点来验证服务器是否正常运行：

- **授权服务器元数据**：`http://localhost:9000/.well-known/oauth-authorization-server`
- **OIDC 发现端点**：`http://localhost:9000/.well-known/openid-configuration`
- **H2 数据库控制台**：`http://localhost:9000/h2-console` (JDBC URL: `jdbc:h2:mem:testdb`)

## 4. 实现授权码流程

授权码模式（Authorization Code Flow）是功能最完整、流程最严密的授权模式，也是最适合 Web 服务器端应用的模式。

### 4.1 流程步骤

1. **用户访问客户端**：用户点击登录按钮，客户端将用户重定向到授权服务器的 `/oauth2/authorize` 端点。
2. **用户登录与授权**：用户在授权服务器上完成身份认证，并同意客户端请求的权限（Scope）。
3. **返回授权码**：授权服务器将用户重定向回客户端指定的回调地址，并附上一个授权码（Code）。
4. **交换令牌**：客户端使用授权码，向授权服务器的 `/oauth2/token` 端点请求访问令牌（Access Token）和刷新令牌（Refresh Token）。
5. **访问资源**：客户端使用获取到的访问令牌去访问受保护的资源服务器。

### 4.2 体验流程

1. 启动你的授权服务器（端口 9000）和一个简单的客户端应用（例如另一个 Spring Boot 应用，端口 8080，配置了 `spring-security-oauth2-client`）。
2. 在浏览器中访问客户端的受保护端点，例如 `http://localhost:8080/`。
3. 你将被重定向到授权服务器的登录页 (`http://localhost:9000/login`)。
4. 使用配置的用户名 (`user`) 和密码 (`password`) 登录。
5. 查看并同意请求的权限（`openid`, `profile`, `message.read` 等）。
6. 你将被重定向回客户端，并完成登录。客户端在后台用授权码换取了令牌。

## 5. 高级配置与自定义

基础的内存实现仅适用于演示。生产环境需要更持久化、更灵活的方案。

### 5.1 使用 JDBC 存储客户端和授权信息

Spring Authorization Server 提供了基于 JDBC 的默认实现。

**1. 初始化数据库表**

Spring Authorization Server 提供了 SQL 脚本来创建所需的表。你可以在官方文档或 `JdbcOAuth2AuthorizationService` 等类的 Javadoc 中找到最新的 SQL 脚本。通常需要创建 `oauth2_authorization`, `oauth2_registered_client`, `oauth2_authorization_consent` 等表。

**2. 配置 JDBC Repository**

```java
@Configuration
public class JdbcConfig {

    @Bean
    public RegisteredClientRepository registeredClientRepository(JdbcTemplate jdbcTemplate) {
        // 取代之前的 InMemoryRegisteredClientRepository
        // Spring 提供了 JdbcRegisteredClientRepository，但需要先创建对应的表
        return new JdbcRegisteredClientRepository(jdbcTemplate);
    }

    @Bean
    public OAuth2AuthorizationService authorizationService(JdbcTemplate jdbcTemplate, RegisteredClientRepository registeredClientRepository) {
        return new JdbcOAuth2AuthorizationService(jdbcTemplate, registeredClientRepository);
    }

    @Bean
    public OAuth2AuthorizationConsentService authorizationConsentService(JdbcTemplate jdbcTemplate, RegisteredClientRepository registeredClientRepository) {
        return new JdbcOAuth2AuthorizationConsentService(jdbcTemplate, registeredClientRepository);
    }
}
```

**3. 在 `application.yml` 中配置数据源**

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/auth_server_db # 使用PostgreSQL示例
    username: postgres
    password: your_password
  jpa:
    hibernate:
      ddl-auto: validate # 或 none，表结构由提供的SQL脚本初始化，不由JPA管理
    show-sql: true
```

### 5.2 自定义用户认证

替换掉内存中的 `UserDetailsService`，连接到你自己的用户数据库。

```java
@Service
public class JdbcUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository; // 你的自定义User Repository

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // 假设你的User实体包含权限信息
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword()) // 密码在存储时应是加密的
                .authorities(user.getAuthorities())
                .build();
    }
}
```

在安全配置中，注入你自定义的 `UserDetailsService`。

### 5.3 自定义同意页面

默认的同意页面很简陋。你可以通过覆盖 `ConsentController` 来提供自定义的 UI。

```java
@Controller
@RequestMapping("/oauth2/consent")
public class ConsentController {

    @GetMapping
    public String consent(@RequestParam(OAuth2ParameterNames.CLIENT_ID) String clientId,
                         @RequestParam(OAuth2ParameterNames.SCOPE) String scope,
                         @RequestParam(OAuth2ParameterNames.STATE) String state,
                         Model model) {

        // 1. 根据clientId查找客户端信息
        RegisteredClient registeredClient = registeredClientRepository.findByClientId(clientId);
        // 2. 解析请求的scope
        Set<String> scopes = new HashSet<>(Arrays.asList(scope.split(" ")));

        // 3. 将信息放入Model，供Thymeleaf或Freemarker模板使用
        model.addAttribute("clientId", clientId);
        model.addAttribute("clientName", registeredClient.getClientName());
        model.addAttribute("state", state);
        model.addAttribute("scopes", scopes);
        model.addAttribute("principalName", authentication.getName());

        // 4. 返回自定义的同意页面视图
        return "consent";
    }

    @PostMapping
    public String approveOrDeny(@RequestParam String decision,
                                @RequestParam(OAuth2ParameterNames.CLIENT_ID) String clientId,
                                @RequestParam(OAuth2ParameterNames.STATE) String state,
                                @RequestParam(OAuth2ParameterNames.SCOPE) String scope) {
        if ("approve".equals(decision)) {
            // ... 处理用户同意的逻辑
            // 通常不需要手动处理，Spring Security 会处理后续流程
            // 重定向回授权端点 /oauth2/authorize
            return "redirect:/oauth2/authorize?client_id=" + clientId + "&state=" + state + "&scope=" + scope;
        } else {
            // 用户拒绝，重定向到错误页或首页
            return "redirect:/";
        }
    }
}
```

然后在安全配置中，确保 `/oauth2/consent` 端点可被认证用户访问。

## 6. 最佳实践

### 6.1 安全实践

1. **使用强密码算法和密钥管理**：
   - 不要使用内存中的密钥，重启后令牌会全部失效。
   - 使用安全的密钥库（如 Kubernetes Secrets, HashiCorp Vault）或硬件安全模块（HSM）来管理你的 RSA 密钥对。
   - 定期轮换密钥。

2. **安全的客户端配置**：
   - 为不同的客户端使用不同的 `client_secret`，并确保其强度。
   - 使用 BCrypt、SCrypt 等算法哈希存储 `client_secret`（`JdbcRegisteredClientRepository` 支持）。
   - 严格校验 `redirect_uri`，避免开放重定向漏洞。避免使用通配符。
   - 根据客户端类型选择合适的认证方法（如 `client_secret_basic`, `client_secret_post`, `private_key_jwt`）。

3. **控制令牌生命周期**：
   - 设置较短的访问令牌有效期（如 5-30 分钟）。
   - 强制使用刷新令牌轮换机制，并为刷新令牌设置一次一用（使其在使用后失效）。

4. **启用 PKCE (Proof Key for Code Exchange)**：
   - 对于公共客户端（如单页应用、移动应用），强制要求使用 PKCE 以增强授权码流程的安全性。
   - 在 `ClientSettings` 中配置 `requireProofKey(true)`。

   ```java
   ClientSettings.builder().requireProofKey(true).build()
   ```

### 6.2 生产就绪

1. **高可用与持久化**：
   - 部署多个授权服务器实例以实现高可用。
   - **所有状态必须持久化到共享数据库**（如 MySQL, PostgreSQL），包括授权信息、令牌和 consented scope，确保实例间状态同步。

2. **监控与日志**：
   - 集成 Micrometer 和 Prometheus/Grafana，监控令牌发放频率、错误率等关键指标。
   - 详细记录安全日志（如登录成功/失败、授权同意、令牌颁发和撤销），便于审计和故障排查。

3. **性能考量**：
   - 对数据库查询进行优化，例如为 `oauth2_authorization` 表的 `principal_name`, `state`, `access_token_value` 等字段建立索引。
   - 考虑使用 Redis 等缓存来存储短暂的令牌信息，减轻数据库压力（需自定义 `OAuth2AuthorizationService`）。

## 7. 常见问题与调试 (FAQ)

**Q1: 如何撤销令牌？**
A: 调用 `/oauth2/revoke` 端点，并提供要撤销的令牌。你需要使用客户端凭证进行认证。

**Q2: 如何验证访问令牌？**
A: 资源服务器可以通过调用 `/oauth2/introspect` 端点来验证令牌的有效性和元数据。或者，如果使用 JWT，资源服务器可以直接使用授权服务器公布的 JWKS 端点 (`/oauth2/jwks`) 来验证签名。

**Q3: 如何自定义令牌的声明？**
A: 实现 `OAuth2TokenCustomizer<JwtEncodingContext>` 接口并将其声明为 Bean。你可以在其中为 ID Token 或 Access Token 添加自定义声明。

```java
@Bean
public OAuth2TokenCustomizer<JwtEncodingContext> jwtTokenCustomizer() {
    return (context) -> {
        if (OidcParameterNames.ID_TOKEN.equals(context.getTokenType().getValue())) {
            // 自定义ID Token
            context.getClaims().claim("custom_claim", "value");
        }
        if (OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
            // 自定义Access Token
            context.getClaims().claim("access_token_claim", "value");
        }
    };
}
```

**Q4: 遇到 `“Invalid parameter redirect_uri”` 错误？**
A: 确保在 `RegisteredClient` 中配置的 `redirect_uri` 与客户端请求时传递的 `redirect_uri` **完全匹配**，包括斜杠和大小写。

## 8. 总结

Spring Authorization Server 提供了一个强大、灵活且符合标准的基础，用于构建你自己的 OAuth 2.1 和 OpenID Connect 授权服务器。从简单的内存演示到复杂的、基于数据库的生产部署，它都能通过良好的抽象和扩展点满足需求。

核心在于理解其组件模型（`RegisteredClientRepository`, `AuthorizationService` 等）并正确配置安全过滤器链。在生产环境中，务必遵循安全最佳实践，做好密钥管理、客户端配置和持久化方案。

通过本文的介绍和示例，希望你能够成功搭建并定制属于你自己的安全授权服务。

## 9. 参考资料

1. <https://docs.spring.io/spring-authorization-server/reference/>
2. <https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-07.html>
3. <https://openid.net/specs/openid-connect-core-1_0.html>
4. <https://spring.io/blog/2020/04/15/announcing-the-spring-authorization-server>
5. <https://github.com/spring-projects/spring-authorization-server/tree/main/samples>

---
