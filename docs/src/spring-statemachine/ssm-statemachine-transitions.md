# Spring Statemachine Transitions 转换及配置详解与最佳实践

## 1. 前言

状态转换（Transition）是有限状态机（FSM）的核心概念，它定义了系统如何从一个状态切换到另一个状态，以及在此过程中需要执行的行为。在 Spring Statemachine 中，Transitions 提供了强大而灵活的配置选项，允许开发者精细地控制状态机的流程。

本文将深入探讨 Spring Statemachine 中 Transitions 的各类配置方式、内部工作机制，并结合最佳实践和完整示例，帮助您掌握状态机转换的艺术。

## 2. Transition 的核心概念

在深入配置之前，理解 Transition 的基本组成部分至关重要。

### 2.1 核心组件

一个完整的 Transition 通常涉及以下几个要素：

- **源状态（Source State）**：转换开始的状态。
- **目标状态（Target State）**：转换结束的状态（对于内部转换，与源状态相同）。
- **触发器（Trigger）**：引起转换的事件（Event）或定时器（Timer）。
- **守卫（Guard）**：一个布尔条件，决定转换是否可以被执行。
- **动作（Action）**：在转换过程中执行的具体业务逻辑。

### 2.2 Transition 的类型

Spring Statemachine 主要支持三种类型的转换：

1. **外部转换（External Transition）**：源状态和目标状态不同。会触发源状态的 `exit` 动作和目标状态的 `entry` 动作。
2. **内部转换（Internal Transition）**：源状态和目标状态相同。不会触发任何 `exit` 或 `entry` 动作，仅执行指定的 `Action`。
3. **本地转换（Local Transition）**：涉及子状态时的特殊转换。如果目标状态是源状态的子状态，不会触发源状态的 `exit` 动作。反之，如果源状态是目标状态的子状态，不会触发目标状态的 `entry` 动作。

## 3. 配置 Transition

Spring Statemachine 提供了流畅的 API（Fluent API）来配置转换，主要通过继承 `StateMachineConfigurerAdapter` 并重写 `configure` 方法实现。

### 3.1 基本外部转换配置

这是最常见和最简单的转换类型。

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
            .initial("SI") // 初始状态
            .state("S1")
            .state("S2")
            .state("S3");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal() // 开始配置一个外部转换
                .source("SI") // 源状态
                .target("S1") // 目标状态
                .event("E1") // 触发事件
                .and() // 连接下一个配置
            .withExternal()
                .source("S1")
                .target("S2")
                .event("E2")
                .and()
            .withExternal()
                .source("S2")
                .target("S3")
                .event("E3");
    }
}
```

**说明**：当状态机处于 `SI` 状态时，发送事件 `E1`，它将转换到状态 `S1`。`.and()` 方法用于流畅地连接多个转换配置。

### 3.2 使用枚举提升类型安全

使用字符串容易拼写错误，推荐使用枚举来定义状态和事件。

```java
public enum States {
    SI, S1, S2, S3
}

public enum Events {
    E1, E2, E3
}

@Configuration
@EnableStateMachine
public class StateMachineConfig extends EnumStateMachineConfigurerAdapter<States, Events> {

    @Override
    public void configure(StateMachineStateConfigurer<States, Events> states) throws Exception {
        states
            .withStates()
            .initial(States.SI)
            .states(EnumSet.allOf(States.class));
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
        transitions
            .withExternal()
                .source(States.SI)
                .target(States.S1)
                .event(Events.E1)
                .and()
            .withExternal()
                .source(States.S1)
                .target(States.S2)
                .event(Events.E2);
    }
}
```

### 3.3 配置内部转换

内部转换用于在处于某个状态时响应事件，但不改变当前状态。

```java
@Override
public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
    transitions
        .withInternal() // 配置内部转换
            .source(States.S1)
            .event(Events.E2) // 事件 E2 不会导致状态改变
            .action(action()) // 但会执行一个动作
            .and()
        .withExternal()
            .source(States.S1)
            .target(States.S2)
            .event(Events.E3);
}

@Bean
public Action<States, Events> action() {
    return context -> System.out.println("Internal transition action executed in state: " + context.getSource().getId());
}
```

**最佳实践**：使用内部转换来处理不改变状态但需要执行某些逻辑的事件，例如日志记录、更新扩展状态变量、发送通知等。这比滥用自循环外部转换（从 S1 到 S1）更高效，因为它避免了不必要的 `exit` 和 `entry` 动作。

### 3.4 配置本地转换

本地转换在涉及子状态时行为特殊。以下示例展示了层次状态下的本地转换。

```java
@Override
public void configure(StateMachineStateConfigurer<States, Events> states) throws Exception {
    states
        .withStates()
        .initial(States.SI)
        .state(States.S1)
        .and()
        .withStates()
            .parent(States.S1) // S1 是父状态
            .initial(States.S11) // S11 是 S1 的初始子状态
            .state(States.S12);
}

@Override
public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
    transitions
        .withLocal() // 配置本地转换
            .source(States.S11)
            .target(States.S12) // 在父状态 S1 内部转换
            .event(Events.E_INT);
}
```

**行为**：从 `S11` 到 `S12` 的本地转换不会触发父状态 `S1` 的 `exit` 和 `entry` 动作。而如果使用 `.withExternal()` 实现同样的转换，则会触发。

## 4. 高级配置：Guards 和 Actions

Guards 和 Actions 是赋予状态机灵活性和强大功能的关键。

### 4.1 使用 Guards（守卫）

守卫用于在运行时决定转换是否应该发生。

```java
@Override
public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
    transitions
        .withExternal()
            .source(States.S1)
            .target(States.S2)
            .event(Events.E2)
            .guard(guard()) // 配置守卫
            .and()
        .withExternal()
            .source(States.S1)
            .target(States.S3)
            .event(Events.E2)
            .guardExpression("extendedState.variables.get('myVar') == 'someValue'"); // 使用 SpEL 表达式
}

// 方式一：实现 Guard 接口
@Bean
public Guard<States, Events> guard() {
    return new Guard<States, Events>() {
        @Override
        public boolean evaluate(StateContext<States, Events> context) {
            // 从扩展状态（Extended State）中获取变量
            Object value = context.getExtendedState().getVariables().get("key");
            return value != null && value.equals("ENABLED");
        }
    };
}

// 方式二：使用 Spring Expression Language (SpEL)
// 如上例中的 .guardExpression(...)
```

**最佳实践**：

- **保护关键路径**：使用守卫来验证业务规则、权限或资源可用性，防止非法状态转换。
- **互斥转换**：为从同一状态出发、由同一事件触发的多个转换配置互斥的守卫条件，以确保状态机行为确定性。
- **优先使用 SpEL**：对于简单的条件判断，SpEL 表达式非常简洁。对于复杂的业务逻辑，则实现 `Guard` 接口更清晰。

### 4.2 使用 Actions（动作）

动作是转换过程中执行的业务逻辑。

```java
@Override
public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
    transitions
        .withExternal()
            .source(States.S1)
            .target(States.S2)
            .event(Events.E2)
            .action(action()) // 配置动作
            .action(trackingAction(), errorAction()) // 配置动作和错误回调
            .and()
        .withExternal()
            .source(States.S2)
            .target(States.S3)
            .event(Events.E3)
            .action(context -> System.out.println("Lambda action: " + context.getTarget().getId())); // Lambda 表达式
}

@Bean
public Action<States, Events> action() {
    return new Action<States, Events>() {
        @Override
        public void execute(StateContext<States, Events> context) {
            // 执行你的业务逻辑，例如调用 Service
            System.out.println("Transitioning from " + context.getSource().getId() + " to " + context.getTarget().getId());
            // 可以访问事件消息头和信息
            Object header = context.getMessageHeaders().get("myHeader");
            // 可以修改扩展状态
            context.getExtendedState().getVariables().put("key", "value");
        }
    };
}

// 带错误处理的 Action 配置
@Bean
public Action<States, Events> trackingAction() {
    return context -> {
        // 模拟一个可能出错的动作
        if (Math.random() > 0.5) {
            throw new RuntimeException("Action failed randomly!");
        }
        System.out.println("Tracking action succeeded.");
    };
}

@Bean
public Action<States, Events> errorAction() {
    return context -> {
        // 处理 trackingAction 抛出的异常
        Exception exception = context.getException();
        System.out.println("Error action executed due to: " + exception.getMessage());
        // 可以进行错误恢复、记录日志、更新状态等操作
        context.getExtendedState().getVariables().put("lastError", exception.getMessage());
    };
}
```

**最佳实践**：

- **保持动作轻量**：动作中应避免执行长时间阻塞的操作，以免影响状态机的响应性。考虑使用 `@Async` 或将任务提交给 `TaskExecutor`。
- **关注点分离**：动作应该专注于执行，而不应包含复杂的条件判断（那是 Guard 的职责）。让 Guard 决定“是否”转换，让 Action 执行“转换时做什么”。
- **充分利用 StateContext**：`StateContext` 提供了对状态机当前上下文的完整访问，包括源状态、目标状态、事件消息、扩展状态和异常，充分利用它来编写更智能的动作。
- **始终处理异常**：为可能失败的动作配置错误动作（`errorAction`），确保状态机不会因未处理的异常而陷入不一致状态。

## 5. 其他类型的转换

### 5.1 定时器触发器转换

转换不仅可以由事件触发，还可以由定时器触发。

```java
@Override
public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
    transitions
        .withInternal()
            .source("S_WAITING")
            .action(timedAction())
            .timer(1000) // 每 1000 毫秒触发一次
            .and()
        .withInternal()
            .source("S_DELAYED")
            .action(onceAction())
            .timerOnce(2000); // 进入状态 2000 毫秒后触发一次
}

@Bean
public Action<String, String> timedAction() {
    return context -> System.out.println("Fired every second: " + System.currentTimeMillis());
}

@Bean
public Action<String, String> onceAction() {
    return context -> System.out.println("Fired once after delay: " + System.currentTimeMillis());
}
```

**使用场景**：`timer()` 用于轮询、心跳检测。`timerOnce()` 用于超时处理（如等待用户操作超时后自动跳转）。

### 5.2 匿名转换

匿名转换是由事件触发但没有明确指定源状态的转换，通常用于从任何状态转换到特定状态（例如全局错误状态）。

```java
// 注意：匿名转换的配置方式在更近期的版本中可能有变化。
// 一种常见模式是使用通配符源状态，但 Fluent API 可能不直接支持。
// 通常通过为多个状态配置到同一目标的转换来实现类似效果。
.transitions()
    .withExternal()
        .source(States.S1).target(States.ERROR).event(Events.ERROR)
        .and()
    .withExternal()
        .source(States.S2).target(States.ERROR).event(Events.ERROR)
        .and()
    .withExternal()
        .source(States.S3).target(States.ERROR).event(Events.ERROR)
// ... 为所有需要处理 ERROR 事件的状态配置
```

**最佳实践**：虽然 Fluent API 对纯匿名转换的支持可能有限，但通过枚举所有需要响应的源状态，可以明确地定义全局行为，这实际上更清晰易懂。或者，可以考虑在状态机监听器中全局监听错误事件。

## 6. 完整示例与测试

下面是一个整合了多种转换类型的可运行示例。

### 6.1 状态和事件枚举

```java
public enum ApplicationStates {
    OFF, INITIALIZING, READY, PROCESSING, ERROR
}

public enum ApplicationEvents {
    POWER_ON, INIT_COMPLETE, START_PROCESS, SUCCESS, FAIL, RETRY, POWER_OFF
}
```

### 6.2 状态机配置

```java
@Configuration
@EnableStateMachine
public class ApplicationStateMachineConfig extends EnumStateMachineConfigurerAdapter<ApplicationStates, ApplicationEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<ApplicationStates, ApplicationEvents> states) throws Exception {
        states
            .withStates()
                .initial(ApplicationStates.OFF)
                .state(ApplicationStates.INITIALIZING)
                .state(ApplicationStates.READY)
                .state(ApplicationStates.PROCESSING)
                .state(ApplicationStates.ERROR);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<ApplicationStates, ApplicationEvents> transitions) throws Exception {
        transitions
            // 正常流程
            .withExternal()
                .source(ApplicationStates.OFF)
                .target(ApplicationStates.INITIALIZING)
                .event(ApplicationEvents.POWER_ON)
                .action(initAction())
                .and()
            .withExternal()
                .source(ApplicationStates.INITIALIZING)
                .target(ApplicationStates.READY)
                .event(ApplicationEvents.INIT_COMPLETE)
                .and()
            .withExternal()
                .source(ApplicationStates.READY)
                .target(ApplicationStates.PROCESSING)
                .event(ApplicationEvents.START_PROCESS)
                .guard(availabilityGuard()) // 检查资源是否可用
                .action(processStartAction())
                .and()
            .withExternal()
                .source(ApplicationStates.PROCESSING)
                .target(ApplicationStates.READY)
                .event(ApplicationEvents.SUCCESS)
                .action(processSuccessAction())
                .and()

            // 错误处理流程
            .withExternal()
                .source(ApplicationStates.INITIALIZING)
                .target(ApplicationStates.ERROR)
                .event(ApplicationEvents.FAIL)
                .action(errorAction())
                .and()
            .withExternal()
                .source(ApplicationStates.PROCESSING)
                .target(ApplicationStates.ERROR)
                .event(ApplicationEvents.FAIL)
                .action(errorAction())
                .and()

            // 恢复和重试
            .withExternal()
                .source(ApplicationStates.ERROR)
                .target(ApplicationStates.READY)
                .event(ApplicationEvents.RETRY)
                .guard(retryGuard()) // 检查重试次数等
                .action(retryAction())
                .and()

            // 关机
            .withExternal()
                .source(ApplicationStates.READY)
                .target(ApplicationStates.OFF)
                .event(ApplicationEvents.POWER_OFF)
                .and()
            .withExternal()
                .source(ApplicationStates.ERROR)
                .target(ApplicationStates.OFF)
                .event(ApplicationEvents.POWER_OFF);

        // 配置一个定时器：如果卡在 PROCESSING 超过 5 秒，触发 FAIL
        transitions
            .withInternal()
                .source(ApplicationStates.PROCESSING)
                .action(timeoutCheckAction())
                .timer(5000); // 每 5 秒检查一次
    }

    // 各种 Guard 和 Action 的 @Bean 定义...
    @Bean
    public Guard<ApplicationStates, ApplicationEvents> availabilityGuard() {
        return context -> {
            // 模拟检查资源可用性
            return true; // 或 false
        };
    }

    @Bean
    public Action<ApplicationStates, ApplicationEvents> initAction() {
        return context -> System.out.println("Initialization started...");
    }

    @Bean
    public Action<ApplicationStates, ApplicationEvents> processStartAction() {
        return context -> System.out.println("Process started...");
    }
    // ... 其他 Action 和 Guard
    @Bean
    public Action<ApplicationStates, ApplicationEvents> timeoutCheckAction() {
        return context -> {
            long startTime = (Long) context.getExtendedState().getVariables().getOrDefault("processStartTime", 0L);
            if (startTime > 0 && System.currentTimeMillis() - startTime > 10000) { // 超时 10 秒
                System.out.println("Process timed out! Forcing FAIL event.");
                context.getStateMachine().sendEvent(ApplicationEvents.FAIL);
            }
        };
    }
}
```

### 6.3 测试代码

```java
@SpringBootTest
public class ApplicationStateMachineTest {

    @Autowired
    private StateMachine<ApplicationStates, ApplicationEvents> stateMachine;

    @Test
    public void testNormalFlow() {
        stateMachine.start();
        assertThat(stateMachine.getState().getId()).isEqualTo(ApplicationStates.OFF);

        stateMachine.sendEvent(ApplicationEvents.POWER_ON);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApplicationStates.INITIALIZING);

        stateMachine.sendEvent(ApplicationEvents.INIT_COMPLETE);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApplicationStates.READY);

        stateMachine.sendEvent(ApplicationEvents.START_PROCESS);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApplicationStates.PROCESSING);

        stateMachine.sendEvent(ApplicationEvents.SUCCESS);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApplicationStates.READY);

        stateMachine.sendEvent(ApplicationEvents.POWER_OFF);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApplicationStates.OFF);

        stateMachine.stop();
    }

    @Test
    public void testErrorAndRecoveryFlow() {
        stateMachine.start();
        stateMachine.sendEvent(ApplicationEvents.POWER_ON);
        stateMachine.sendEvent(ApplicationEvents.INIT_COMPLETE);

        // 强制进入 ERROR 状态
        stateMachine.sendEvent(ApplicationEvents.FAIL);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApplicationStates.ERROR);

        // 从 ERROR 恢复
        stateMachine.sendEvent(ApplicationEvents.RETRY);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApplicationStates.READY);

        stateMachine.stop();
    }
}
```

## 7. 总结与最佳实践清单

1. **明确转换类型**：根据是否需要改变状态、是否涉及子状态，正确选择外部、内部或本地转换。
2. **善用 Guards 进行决策**：将业务条件判断逻辑放入 Guards 中，保持 Actions 纯粹用于执行。
3. **保持 Actions 轻量和安全**：避免阻塞操作，总是为可能失败的动作提供错误处理机制（`errorAction`）。
4. **利用定时器触发器**：使用 `timer()` 和 `timerOnce()` 来处理超时、轮询和延迟任务。
5. **优先使用枚举**：使用枚举（`EnumStateMachineConfigurerAdapter`）而不是字符串来定义状态和事件，以获得编译时类型安全。
6. **合理使用扩展状态**：使用 `StateContext.getExtendedState()` 来存储和传递与状态相关的数据，避免创建过多的状态。
7. **编写单元测试**：为各种状态路径（正常流程、错误流程）编写全面的测试，确保状态机行为符合预期。
8. **谨慎使用匿名事件**：明确列出源状态的转换通常比真正的匿名转换更清晰，便于理解和维护。
9. **层次状态简化设计**：利用父子状态和本地转换来共享通用行为（如错误处理），减少转换配置的重复。
10. **监听器辅助**：结合 `StateMachineListener` 来记录转换日志、监控性能和处理全局事件，作为转换配置的补充。

通过熟练掌握 Spring Statemachine Transitions 的配置和这些最佳实践，您将能够构建出健壮、清晰且易于维护的复杂状态管理流程。
