# Spring Statemachine Actions 动作及配置详解与最佳实践

## 1. 核心概念：什么是 Action？

在 Spring Statemachine (SSM) 的上下文中，**Action** 是一段在状态机生命周期特定阶段被执行的代码逻辑。它是连接状态机引擎与您的业务代码的主要桥梁。当状态机响应触发器（如事件）并执行状态转换时，Action 允许您在此期间执行自定义操作，例如调用服务、更新数据库、发送消息或修改扩展状态变量。

**关键特性：**

- **无返回值**：Action 的执行是一个副作用过程，不返回任何值来决定流程。
- **上下文感知**：Action 通过 `StateContext` 参数访问状态机的完整上下文，包括当前状态、目标状态、事件消息、扩展状态等。
- **可配置性**：可以绑定到**状态转换（Transition）** 或**状态（State）** 的进入、退出和自身行为上。

## 2. Action 的类型与执行时机

Spring Statemachine 支持多种类型的 Action，它们在不同的时机被触发。

### 2.1. 转换 Action (Transition Actions)

在状态转换过程中执行。

- **配置位置**：通过 `TransitionConfigurer` 的 `.action(...)` 方法配置。
- **执行时机**：在**离开源状态之后**，**进入目标状态之前**执行。如果转换被守卫（Guard）拒绝，则不会执行。

### 2.2. 状态 Action (State Actions)

与状态本身的生命周期挂钩。

- **进入 Action (Entry Action)**：当状态被**进入**时执行。
  - **配置方法**：`.state(MyState, entryAction, exitAction)` 或 `.stateEntry(MyState, action)`
- **退出 Action (Exit Action)**：当状态被**退出**时执行。
  - **配置方法**：`.state(MyState, entryAction, exitAction)` 或 `.stateExit(MyState, action)`
- **状态自身 Action (State Do Action)**：在状态**被进入后**且**未退出前**执行。可以视为状态处于活跃时运行的业务逻辑。它通常与计时器结合，实现超时或轮询逻辑。
  - **配置方法**：`.stateDo(MyState, action)`

### 2.3. 初始 Action (Initial Action)

- **配置位置**：在定义初始状态时通过 `.initial(MyState, initialAction)` 配置。
- **执行时机**：仅在状态机**首次启动**或**区域（Region）首次进入**时执行一次。这与状态的 Entry Action 不同，Entry Action 在每次进入该状态时都会触发。

## 3. 如何定义和配置 Action

### 3.1. 实现 Action 接口

最基础的方法是直接实现 `Action<S, E>` 接口。

```java
import org.springframework.statemachine.StateContext;
import org.springframework.statemachine.action.Action;

public class MyAction implements Action<String, String> {

    @Override
    public void execute(StateContext<String, String> context) {
        // 从上下文中获取事件消息
        Message<String> message = context.getMessage();
        // 获取扩展状态变量
        Object variable = context.getExtendedState().getVariables().get("key");
        // 你的业务逻辑 here
        System.out.println("Action executed! Event: " + message.getPayload());
        // 可以修改扩展状态
        context.getExtendedState().getVariables().put("result", "done");
    }
}

// 将其声明为 Bean
@Bean
public MyAction myAction() {
    return new MyAction();
}
```

### 3.2. 使用匿名类或 Lambda 表达式

在配置类中直接内联定义，非常简洁。

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("S1")
                .target("S2")
                .event("E1")
                .action(context -> { // Lambda 表达式
                    System.out.println("Transitioning from S1 to S2");
                }, errorAction()); // 可以关联错误 Action
    }

    @Bean
    public Action<String, String> errorAction() {
        return new Action<String, String>() { // 匿名类
            @Override
            public void execute(StateContext<String, String> context) {
                Exception exception = context.getException();
                System.out.println("Action failed: " + exception.getMessage());
            }
        };
    }
}
```

### 3.3. 使用 SpEL 表达式

对于非常简单且无状态的逻辑，可以使用 SpEL，避免创建完整的 Java 类。

```java
@Override
public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
    transitions
        .withExternal()
            .source("S1")
            .target("S2")
            .event("E1")
            .actionExpression(
                context -> "Executing for event: " + context.getEvent()
            ); // 使用 SpEL
}
```

## 4. 完整配置示例

以下示例展示了如何在 Java 配置中综合使用各类 Action。

```java
public enum States {
    SI, S1, S2, S3
}

public enum Events {
    E1, E2
}

@Configuration
@EnableStateMachine
public class Config extends StateMachineConfigurerAdapter<States, Events> {

    @Override
    public void configure(StateMachineStateConfigurer<States, Events> states) throws Exception {
        states
            .withStates()
                .initial(States.SI, initialAction()) // 初始 Action
                .state(States.S1, entryAction(), exitAction()) // 状态的进入和退出 Action
                .state(States.S2, null, exitAction())
                .stateDo(States.S2, stateDoAction()) // 状态自身 Action
                .state(States.S3);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
        transitions
            .withExternal() // 转换 Action
                .source(States.SI).target(States.S1).event(Events.E1)
                .action(transitionAction())
            .and()
            .withExternal()
                .source(States.S1).target(States.S2).event(Events.E2)
                .action(transitionAction(), errorAction()); // 带错误处理的 Action
    }

    // -- 定义各种 Action Beans -- 
    @Bean
    public Action<States, Events> initialAction() {
        return context -> System.out.println("[Initial] Machine is starting.");
    }

    @Bean
    public Action<States, Events> entryAction() {
        return context -> System.out.println("[Entry] Entering state: " + context.getTarget().getId());
    }

    @Bean
    public Action<States, Events> exitAction() {
        return context -> System.out.println("[Exit] Exiting state: " + context.getSource().getId());
    }

    @Bean
    public Action<States, Events> stateDoAction() {
        return context -> {
            // 模拟一些工作
            System.out.println("[Do] State " + context.getState().getId() + " is active. Working...");
            // 可以在这里检查是否需要触发新事件
            // context.getStateMachine().sendEvent(Events.E3);
        };
    }

    @Bean
    public Action<States, Events> transitionAction() {
        return context -> {
            States source = context.getSource() != null ? context.getSource().getId() : null;
            States target = context.getTarget() != null ? context.getTarget().getId() : null;
            System.out.println("[Transition] " + source + " -> " + target);
        };
    }

    @Bean
    public Action<States, Events> errorAction() {
        return context -> {
            Exception e = context.getException();
            System.err.println("[Error] Action failed: " + e.getMessage());
        };
    }
}
```

## 5. 使用 `StateContext` 获取丰富上下文

`StateContext` 是 Action 的“万能钥匙”，它提供了执行时的一切信息。

```java
@Bean
public Action<States, Events> smartAction() {
    return context -> {
        // 1. 获取状态信息
        State<States, Events> source = context.getSource(); // 源状态
        State<States, Events> target = context.getTarget(); // 目标状态

        // 2. 获取事件和消息头
        Events event = context.getEvent();
        Message<Events> message = context.getMessage();
        Map<String, Object> headers = message.getHeaders();
        String customHeader = (String) headers.get("custom-header");

        // 3. 读写扩展状态 (非常适合传递业务数据)
        ExtendedState extendedState = context.getExtendedState();
        Map<Object, Object> variables = extendedState.getVariables();
        variables.put("orderId", 12345); // 写
        String value = (String) variables.get("key"); // 读

        // 4. 获取状态机实例（谨慎使用）
        StateMachine<States, Events> stateMachine = context.getStateMachine();

        // 5. 检查是否有错误
        if (context.getException() != null) {
            // 处理错误
        }

        System.out.printf("Event '%s' triggered action. Business ID: %s%n", event, customHeader);
    };
}
```

发送带消息头的事件：

```java
Message<Events> message = MessageBuilder
        .withPayload(Events.E1)
        .setHeader("custom-header", "business-123")
        .build();
stateMachine.sendEvent(message);
```

## 6. 最佳实践与常见陷阱

1. **保持 Action 轻量且无状态**
    - **原因**：Action 在执行时会阻塞状态机的处理线程（默认是单线程）。长时间运行的操作会阻塞整个状态机。
    - **实践**：将耗时操作（如网络调用、数据库查询、复杂计算）提交到独立的线程池或使用异步服务。在 Action 中只做快速的逻辑判断和状态更新。

2. **优先使用扩展状态而非全局变量**
    - **原因**：扩展状态是状态机实例的一部分，与状态机的生命周期绑定，是线程安全的。
    - **实践**：使用 `context.getExtendedState().getVariables()` 来在多个 Action 和 Guard 之间传递业务数据，而不是使用 Spring 容器的单例 Bean 或静态变量，后者会引入并发问题。

3. **明智地发送新事件**
    - **原因**：在 Action 中直接调用 `stateMachine.sendEvent()` 可能导致递归或难以调试的循环。
    - **实践**：尽量避免。如果必须，考虑使用异步发送或利用 `@Async` 注解，以避免在当前状态机线程中立即处理新事件。

    ```java
    @Async // 确保在另一个线程中执行
    public void triggerNextEvent(StateMachine<States, Events> stateMachine) {
        stateMachine.sendEvent(Events.NEXT);
    }
    // 在 Action 中调用
    myAsyncService.triggerNextEvent(context.getStateMachine());
    ```

4. **始终处理异常**
    - **原因**：Action 中未捕获的异常会传播到状态机，可能导致状态不一致。
    - **实践**：使用 `try-catch` 处理 Action 中可能出错的代码，或者配置专用的**错误 Action**。
    - **示例**：见第 3 节 `errorAction()` 的配置方式。

5. **谨慎使用 `stateDoAction`**
    - **原因**：`stateDoAction` 通常与计时器配合，如果不正确管理，可能导致资源泄漏或意外行为。
    - **实践**：确保你了解其生命周期。使用 `StateDoActionPolicy.IMMEDIATE_CANCEL`（默认）或 `TIMEOUT_CANCEL` 来控制在状态退出时如何取消正在运行的 `stateDoAction`。

    ```java
    @Override
    public void configure(StateMachineConfigurationConfigurer<States, Events> config) throws Exception {
        config
            .withConfiguration()
            .stateDoActionPolicy(StateDoActionPolicy.TIMEOUT_CANCEL)
            .stateDoActionPolicyTimeout(10, TimeUnit.SECONDS); // 设置超时
    }
    ```

## 7. 总结

| 动作类型 | 配置方法 | 执行时机 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **转换 Action** | `.action(...)` | 转换过程中 | 执行与特定状态转换紧密相关的逻辑 |
| **进入 Action** | `.state(..., entryAction, ...)` | 进入一个状态后立即 | 状态初始化、资源分配 |
| **退出 Action** | `.state(..., ..., exitAction)` | 退出一个状态前 | 资源清理、保存最终状态 |
| **状态自身 Action** | `.stateDo(...)` | 状态活跃期间 | 轮询、等待、超时处理 |
| **初始 Action** | `.initial(..., initialAction)` | 状态机/区域启动时 | 一次性初始化 |

通过深入理解和正确运用 Spring Statemachine 的 Actions，您可以清晰地将业务逻辑组织到状态机的各个生命周期阶段，构建出健壮、易维护、反应式的高质量应用程序。记住最佳实践，尤其是关于线程和异常处理的建议，将帮助您避免常见的陷阱。
