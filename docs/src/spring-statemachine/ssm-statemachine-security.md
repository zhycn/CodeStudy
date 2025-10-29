# Spring Statemachine Security 安全及配置详解与最佳实践

## 1. 概述

Spring Statemachine 是一个用于在 Spring 应用中创建状态机的框架，它提供了丰富的功能来管理复杂的状态转换逻辑。安全性是任何企业级应用的重要组成部分，Spring Statemachine 与 Spring Security 集成，提供了强大的安全控制能力。

本文将详细介绍如何在 Spring Statemachine 中配置和使用安全功能，包括事件安全、转换安全、动作安全等，并提供最佳实践和完整示例。

## 2. 安全特性介绍

Spring Statemachine Security 提供了以下安全特性：

- **事件安全**：控制哪些用户或角色可以发送特定事件
- **转换安全**：控制哪些用户或角色可以执行特定状态转换
- **动作安全**：控制哪些用户或角色可以执行特定动作
- **表达式支持**：使用 SpEL 表达式进行复杂的权限检查
- **多种比较策略**：支持 ANY、ALL 和 MAJORITY 等权限比较策略

## 3. 系统要求

- Spring Statemachine 4.x
- Spring Security 6.x
- JDK 17+
- Spring Framework 6.x

## 4. 安全配置

### 4.1 启用安全支持

首先需要在配置中启用安全支持：

```java
@Configuration
@EnableStateMachine
public class StateMachineSecurityConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withSecurity()
                .enabled(true)
                .eventAccessDecisionManager(eventAccessDecisionManager())
                .transitionAccessDecisionManager(transitionAccessDecisionManager());
    }

    @Bean
    public AccessDecisionManager eventAccessDecisionManager() {
        List<AccessDecisionVoter<?>> voters = new ArrayList<>();
        voters.add(new RoleVoter());
        voters.add(new EventExpressionVoter());
        return new UnanimousBased(voters);
    }

    @Bean
    public AccessDecisionManager transitionAccessDecisionManager() {
        List<AccessDecisionVoter<?>> voters = new ArrayList<>();
        voters.add(new RoleVoter());
        voters.add(new TransitionExpressionVoter());
        return new UnanimousBased(voters);
    }
}
```

### 4.2 配置 Spring Security

```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(securedEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth
            .inMemoryAuthentication()
                .withUser("user")
                    .password("{noop}password")
                    .roles("USER")
                .and()
                .withUser("admin")
                    .password("{noop}password")
                    .roles("USER", "ADMIN");
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .anyRequest().authenticated()
                .and()
            .formLogin()
                .and()
            .httpBasic();
    }
}
```

## 5. 事件安全配置

### 5.1 全局事件安全

```java
@Configuration
@EnableStateMachine
public class EventSecurityConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withSecurity()
                .enabled(true)
                .event("hasRole('USER')")  // 所有事件需要 USER 角色
                .event("E1", "hasRole('ADMIN')")  // E1 事件需要 ADMIN 角色
                .event("E2", "ROLE_ADMIN", ComparisonType.ANY);
    }
}
```

### 5.2 基于表达式的安全

```java
@Configuration
@EnableStateMachine
public class ExpressionSecurityConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withSecurity()
                .enabled(true)
                .event("hasRole('USER') and hasIpAddress('192.168.1.0/24')");
    }
}
```

## 6. 转换安全配置

### 6.1 全局转换安全

```java
@Configuration
@EnableStateMachine
public class TransitionSecurityConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withSecurity()
                .enabled(true)
                .transition("hasRole('USER')");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("S1").target("S2").event("E1")
                .secured("ROLE_ADMIN", ComparisonType.ANY);
    }
}
```

### 6.2 特定转换的安全

```java
@Configuration
@EnableStateMachine
public class SpecificTransitionSecurityConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("S1").target("S2").event("E1")
                .secured("hasRole('ADMIN') and hasPermission(#context, 'write')")
            .and()
            .withInternal()
                .source("S2").event("E2")
                .secured("ROLE_USER", ComparisonType.ALL);
    }
}
```

## 7. 动作安全配置

### 7.1 方法级安全

```java
@Configuration
@EnableStateMachine
public class ActionSecurityConfig extends StateMachineConfigurerAdapter<String, String> {

    @Bean
    @Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
    public Action<String, String> securedAction() {
        return new Action<String, String>() {
            @Secured("ROLE_ADMIN")
            @Override
            public void execute(StateContext<String, String> context) {
                // 只有 ADMIN 角色可以执行此动作
                System.out.println("Secured action executed");
            }
        };
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("S1").target("S2").event("E1")
                .action(securedAction());
    }
}
```

### 7.2 表达式控制的安全动作

```java
@Configuration
@EnableStateMachine
public class ExpressionActionSecurityConfig extends StateMachineConfigurerAdapter<String, String> {

    @Bean
    public Action<String, String> expressionSecuredAction() {
        return new Action<String, String>() {
            @PreAuthorize("hasRole('ADMIN') and #context.event == 'E1'")
            @Override
            public void execute(StateContext<String, String> context) {
                System.out.println("Expression secured action executed");
            }
        };
    }
}
```

## 8. 完整示例

### 8.1 安全状态机配置

```java
@Configuration
@EnableStateMachine
public class SecureStateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withSecurity()
                .enabled(true)
                .event("hasRole('USER')")
                .transition("hasRole('USER')");
    }

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
                .initial("LOCKED")
                .state("UNLOCKED")
                .state("ERROR");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("LOCKED").target("UNLOCKED").event("COIN")
                .secured("ROLE_USER", ComparisonType.ANY)
            .and()
            .withExternal()
                .source("UNLOCKED").target("LOCKED").event("PUSH")
            .and()
            .withExternal()
                .source("UNLOCKED").target("ERROR").event("FORCE")
                .secured("ROLE_ADMIN", ComparisonType.ANY)
                .action(forceAction());
    }

    @Bean
    public Action<String, String> forceAction() {
        return new Action<String, String>() {
            @Secured("ROLE_ADMIN")
            @Override
            public void execute(StateContext<String, String> context) {
                System.out.println("Force action executed by admin");
            }
        };
    }
}
```

### 8.2 安全控制器

```java
@RestController
@WithStateMachine
public class SecureStateMachineController {

    @Autowired
    private StateMachine<String, String> stateMachine;

    @PostMapping("/event/{event}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<String> sendEvent(@PathVariable String event) {
        boolean accepted = stateMachine.sendEvent(event);
        if (accepted) {
            return ResponseEntity.ok("Event " + event + " accepted");
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Event " + event + " not accepted");
        }
    }

    @GetMapping("/state")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<String> getCurrentState() {
        return ResponseEntity.ok("Current state: " + stateMachine.getState().getId());
    }

    @OnTransition
    @PreAuthorize("hasRole('ADMIN')")
    public void onTransition(StateContext<String, String> context) {
        // 只有 ADMIN 角色可以监听转换
        System.out.println("Transition from " +
            context.getSource().getId() + " to " +
            context.getTarget().getId());
    }
}
```

### 8.3 安全测试

```java
@SpringBootTest
@AutoConfigureMockMvc
public class SecureStateMachineTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "USER")
    public void testUserCanSendCoinEvent() throws Exception {
        mockMvc.perform(post("/event/COIN"))
            .andExpect(status().isOk())
            .andExpect(content().string("Event COIN accepted"));
    }

    @Test
    @WithMockUser(roles = "USER")
    public void testUserCannotSendForceEvent() throws Exception {
        mockMvc.perform(post("/event/FORCE"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testAdminCanSendForceEvent() throws Exception {
        mockMvc.perform(post("/event/FORCE"))
            .andExpect(status().isOk())
            .andExpect(content().string("Event FORCE accepted"));
    }
}
```

## 9. 最佳实践

### 9.1 安全配置最佳实践

1. **最小权限原则**：只授予必要的权限
2. **分层安全**：结合全局安全和细粒度安全
3. **使用表达式**：利用 SpEL 表达式实现复杂的安全逻辑
4. **测试安全**：编写全面的安全测试用例

### 9.2 性能考虑

1. **缓存安全决策**：适当缓存安全决策结果以提高性能
2. **避免复杂表达式**：避免在热路径中使用复杂的 SpEL 表达式
3. **异步安全检查**：对于非关键安全操作，考虑异步检查

### 9.3 监控和审计

```java
@Configuration
@EnableStateMachine
public class AuditingSecurityConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withSecurity()
                .enabled(true)
                .eventAccessDecisionManager(auditingAccessDecisionManager());
    }

    @Bean
    public AccessDecisionManager auditingAccessDecisionManager() {
        List<AccessDecisionVoter<?>> voters = new ArrayList<>();
        voters.add(new RoleVoter());
        voters.add(new EventExpressionVoter());
        voters.add(new AuditVoter()); // 自定义审计投票器

        return new UnanimousBased(voters);
    }

    public static class AuditVoter implements AccessDecisionVoter<Object> {

        @Override
        public boolean supports(ConfigAttribute attribute) {
            return true;
        }

        @Override
        public boolean supports(Class<?> clazz) {
            return true;
        }

        @Override
        public int vote(Authentication authentication, Object object,
                       Collection<ConfigAttribute> attributes) {
            // 记录安全决策审计日志
            logSecurityDecision(authentication, object, attributes);
            return ACCESS_GRANTED;
        }

        private void logSecurityDecision(Authentication authentication,
                                        Object object,
                                        Collection<ConfigAttribute> attributes) {
            // 实现审计日志记录
        }
    }
}
```

## 10. 故障排除

### 10.1 常见问题

1. **安全未生效**：检查是否启用了安全配置
2. **权限被拒绝**：检查角色和权限配置
3. **表达式错误**：检查 SpEL 表达式语法

### 10.2 调试技巧

```java
@Configuration
@EnableStateMachine
public class DebugSecurityConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withSecurity()
                .enabled(true)
                .eventAccessDecisionManager(debugAccessDecisionManager());
    }

    @Bean
    public AccessDecisionManager debugAccessDecisionManager() {
        List<AccessDecisionVoter<?>> voters = new ArrayList<>();
        voters.add(new DebugRoleVoter());
        voters.add(new DebugExpressionVoter());

        return new UnanimousBased(voters);
    }

    public static class DebugRoleVoter extends RoleVoter {
        @Override
        public int vote(Authentication authentication, Object object,
                       Collection<ConfigAttribute> attributes) {
            int result = super.vote(authentication, object, attributes);
            System.out.println("RoleVoter decision: " + result);
            return result;
        }
    }

    public static class DebugExpressionVoter extends EventExpressionVoter {
        @Override
        public int vote(Authentication authentication, Object object,
                       Collection<ConfigAttribute> attributes) {
            int result = super.vote(authentication, object, attributes);
            System.out.println("ExpressionVoter decision: " + result);
            return result;
        }
    }
}
```

## 11. 总结

Spring Statemachine Security 提供了强大的安全控制能力，可以与 Spring Security 无缝集成。通过合理配置事件安全、转换安全和动作安全，可以构建出既安全又灵活的状态机应用。

本文详细介绍了各种安全配置方式，提供了完整的示例代码和最佳实践，希望能够帮助你在实际项目中有效地使用 Spring Statemachine 的安全功能。
