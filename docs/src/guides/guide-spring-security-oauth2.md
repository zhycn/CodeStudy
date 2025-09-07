好的，没有问题。作为一名深耕 Spring 生态的技术专家，我将为你生成一篇详尽、专业且遵循最佳实践的教程文档。

本文档已融合了当前社区（截至 2024 年 6 月）关于 Spring Boot 3、Spring Security 6 和 OAuth 2 集成的最优方案与共识。

---

# Spring Security OAuth2 与 Spring Boot 3 集成详解与最佳实践

## 文档摘要

| 项目 | 说明 |
| ：--- | :--- |
| **文档版本** | 1.0 |
| **目标读者** | 具备 Spring Boot 和 Spring Security 基础知识的开发人员 |
| **技术栈** | Spring Boot 3.x, Spring Security 6.x, Java 17+ |
| **核心变更** | 基于新一代 `OAuth2 Authorization Server`， 弃用旧 `spring-security-oauth2` |

## 1. 前言：历史变迁与版本选择

在 Spring Boot 3 和 Spring Security 6 之前，集成 OAuth2 通常意味着使用独立的 `spring-security-oauth2` 项目。这个项目现已 **弃用 (Deprecated)**。

Spring Security 团队重新设计了 OAuth2 的支持，将其核心功能直接内置于 Spring Security 框架中。新的授权服务器是一个**可独立部署的组件**，遵循 <https://datatracker.ietf.org/doc/html/rfc6749，提供了更现代、更安全、更灵活的实现。>

**本教程将基于 Spring Security 官方推荐的新一代授权服务器实现进行讲解。**

## 2. 环境准备与项目搭建

### 2.1 所需依赖

创建一个新的 Spring Boot 3 项目，在 `pom.xml` 中添加以下核心依赖：

```xml
<dependencies>
    <!-- Spring Web 支持 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Spring Security 核心依赖 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- OAuth2 授权服务器 (新特性) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-oauth2-authorization-server</artifactId>
    </dependency>

    <!-- OAuth2 资源服务器 (用于保护 API) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
    </dependency>

    <!-- 数据源 (用于存储客户端信息，这里使用内存模式) -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- 可选，用于方便测试 API -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 2.2 主要配置属性

在 `application.yml` 中进行基本配置：

```yaml
server:
  port: 9000 # 授权服务器端口
spring:
  application:
    name: spring-auth-server
  datasource:
    url: jdbc:h2:mem:testdb # 使用 H2 内存数据库
    driver-class-name: org.h2.Driver
    username: sa
    password: ''
  h2:
    console:
      enabled: true # 启用 H2 控制台，方便调试
  security:
    oauth2:
      authorizationserver: # 新授权服务器的配置节点
        issuer: http://localhost:9000 # 发行者地址，非常重要，用于发现端点
logging:
  level:
    org.springframework.security: DEBUG # 开启 Security 的调试日志，便于学习
```

## 3. 核心概念与配置

### 3.1 配置授权服务器

我们需要配置一个 `RegisteredClientRepository` 和 `AuthorizationServerSettings` 的 Bean。这是新授权服务器的核心配置。

```java
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
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

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
     * 配置授权服务器本身的安全过滤器链
     * 处理 /oauth2/authorize, /oauth2/token 等端点
     */
    @Bean
    @Order(1) // 优先级高于普通应用的安全配置
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);

        http
            // 使用默认的 OAuth2 登录页面
            .formLogin(Customizer.withDefaults());

        return http.build();
    }

    /**
     * 配置客户端信息存储库
     * 这里使用内存存储，生产环境应使用 JDBC 或 JPA
     */
    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        RegisteredClient loginClient = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("messaging-client") // 客户端 ID
                .clientSecret("{noop}secret") // 客户端密码，{noop} 表示不加密
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .redirectUri("http://127.0.0.1:8080/login/oauth2/code/messaging-client-oidc")
                .redirectUri("http://127.0.0.1:8080/authorized")
                .scope(OidcScopes.OPENID)
                .scope("message.read")
                .scope("message.write")
                .clientSettings(ClientSettings.builder().requireAuthorizationConsent(true).build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofHours(2)) // Access Token 有效期
                        .refreshTokenTimeToLive(Duration.ofDays(30)) // Refresh Token 有效期
                        .build())
                .build();

        return new InMemoryRegisteredClientRepository(loginClient);
    }

    /**
     * 配置 JWK Source，用于签署令牌
     * 生产环境应从安全的存储中获取密钥对
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
     * 生成 RSA 密钥对
     */
    private static KeyPair generateRsaKey() throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        return keyPairGenerator.generateKeyPair();
    }

    /**
     * 配置授权服务器设置，例如发行者地址
     */
    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder()
                .issuer("http://localhost:9000")
                .build();
    }

    /**
     * 配置用户信息服务（模拟用户）
     * 生产环境应从数据库加载
     */
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails userDetails = User.withUsername("user")
                .password("{noop}password")
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(userDetails);
    }

    /**
     * 配置密码编码器
     * 此处为了演示使用无操作编码器，生产环境必须使用 BCrypt 等安全编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

### 3.2 创建受保护的资源服务器

资源服务器负责验证 Access Token 并保护 API 资源。

1. **创建新的 Spring Boot 应用** 或在本应用中创建独立的配置（不推荐，通常应分离部署）。
2. 在 `application.yml` 中配置资源服务器：

```yaml
server:
  port: 8080
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:9000 # 指向授权服务器的发行者地址，用于发现公钥
```

3. **配置资源服务器的安全过滤器链**：

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class ResourceServerConfig {

    @Bean
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/public/**").permitAll() // 公开端点
                .anyRequest().authenticated() // 其他所有请求都需要认证
            )
            // 配置为 OAuth2 资源服务器，使用 JWT Token
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> {})
            )
            // 无状态会话，因为使用 JWT
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        return http.build();
    }
}
```

4. **创建一个测试 Controller**：

```java
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
public class MessageController {

    @GetMapping("/public/greeting")
    public Map<String, String> publicEndpoint() {
        return Collections.singletonMap("message", "Hello, this is public!");
    }

    @GetMapping("/api/messages")
    public Map<String, String> privateEndpoint(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        return Collections.singletonMap("message", "Hello, " + username + "! This is a protected message.");
    }
}
```

## 4. 运行与测试

1. **启动应用**：运行主类，授权服务器在 `9000` 端口，资源服务器在 `8080` 端口。
2. **获取授权码**：打开浏览器，访问 `http://localhost:9000/oauth2/authorize?response_type=code&client_id=messaging-client&scope=message.read&redirect_uri=http://127.0.0.1:8080/authorized`。
3. **登录**：使用用户名 `user` 和密码 `password` 登录。
4. **授权同意**：同意授权给客户端。
5. **获取 Token**：浏览器会被重定向，URL 中包含 `code` 参数。使用 `curl` 或其他工具用该 code 换取 Token：

```bash
curl --location --request POST 'http://localhost:9000/oauth2/token' \
--header 'Authorization: Basic bWVzc2FnaW5nLWNsaWVudDpzZWNyZXQ=' \ # Basic Auth，值是 client_id:client_secret 的 Base64 编码
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'code=YOUR_AUTHORIZATION_CODE' \
--data-urlencode 'grant_type=authorization_code' \
--data-urlencode 'redirect_uri=http://127.0.0.1:8080/authorized'
```

响应将包含 `access_token` 和 `refresh_token`。

6. **访问受保护资源**：使用获取到的 Access Token 访问资源服务器的 API：

```bash
curl --location --request GET 'http://localhost:8080/api/messages' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN_JWT'
```

如果成功，你将收到 `{"message":"Hello, user! This is a protected message."}`。

## 5. 最佳实践与进阶提示

1. **密钥管理**：
   - **切勿**在生产环境使用代码生成的临时密钥。应使用安全可靠的方式生成并存储 RSA 密钥对（如使用 `keytool` 或云平台的 KMS）。
   - 通过 `JWKSource` Bean 加载固定的密钥对。

2. **客户端存储**：
   - **切勿**在生产环境使用 `InMemoryRegisteredClientRepository`。
   - 实现 `JdbcRegisteredClientRepository` 或将客户端信息存储在安全的数据库中。

3. **用户管理**：
   - 实现自定义的 `UserDetailsService`，与你的用户数据库（如 MySQL, PostgreSQL）集成。

4. **密码编码**：
   - **绝对禁止**使用 `NoOpPasswordEncoder`。
   - 必须使用强哈希算法，如 `BCryptPasswordEncoder`。

5. **Token 配置**：
   - 根据安全要求合理设置 Token 的有效期。通常 Access Token 有效期较短（如 30 分钟），Refresh Token 较长（如 7 天）。
   - 考虑实现令牌的吊销机制。

6. **环境分离**：
   - 将授权服务器（Authorization Server）和资源服务器（Resource Server）作为两个独立的应用部署，职责分离更清晰，也更利于扩展。

7. **使用 Spring Security 测试支持**：
   - 利用 `@WithMockJwt` 等注解编写安全的单元测试和集成测试。

## 6. 常见问题解答 (FAQ)

**Q: 如何自定义同意页面 (Consent Page)？**
**A:** 实现一个 `ConsentController`，在 `GET /oauth2/consent` 端点中返回自定义的同意页面模型和视图。在处理同意的 `POST` 请求中，使用 `AuthorizationServerConfigurer` 的相关配置。

**Q: 如何增加自定义的 Scope？**
**A:** 在注册客户端时直接使用自定义的字符串即可，例如 `.scope("custom.scope")`。资源服务器可以在 `Jwt` 对象中获取到这些 scope 并进行权限判断。

**Q: 如何刷新 Token？**
**A:** 使用 `refresh_token` 授权模式，向 `/oauth2/token` 端点发送请求：

```bash
curl --location --request POST 'http://localhost:9000/oauth2/token' \
--header 'Authorization: Basic ...' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=refresh_token' \
--data-urlencode 'refresh_token=YOUR_REFRESH_TOKEN'
```

**Q: 如何实现登出 (Logout) 并使 Token 失效？**
**A:** 新授权服务器支持 OAuth2 令牌吊销端点。可以向 `/oauth2/revoke` 发送 Token 来吊销它。对于完整的单点登出 (OIDC Logout)，需要配置 `OidcLogoutEndpointFilter`。

## 7. 总结

本文详细介绍了如何将新一代的 Spring Security Authorization Server 与 Spring Boot 3 进行集成，涵盖了从项目搭建、核心配置到测试的完整流程，并给出了生产环境的最佳实践建议。

这套全新的方案代表了 Spring 生态中 OAuth2 实施的未来方向，更规范、更安全、也更灵活。希望这篇教程能为你理解和实施 OAuth 2.0 提供坚实的帮助。
