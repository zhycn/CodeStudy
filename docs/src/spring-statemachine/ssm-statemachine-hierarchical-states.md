# Spring Statemachine 分层状态 (Hierarchical States) 及配置详解与最佳实践

## 1. 概述

在复杂的状态机模型中，扁平化的状态设计往往会导致状态爆炸和逻辑重复。 Spring Statemachine 提供的**分层状态（Hierarchical States）** 机制是解决这一问题的强大工具。它允许你将状态组织成树形结构，子状态可以继承父状态的转换和行为，从而极大地提升状态机的可维护性和表达能力。

**核心概念**:

- **父状态 (Parent State)**: 包含其他状态的状态，也称为复合状态 (Composite State)。
- **子状态 (Substate)**: 被包含在父状态内部的状态。
- **初始子状态 (Initial Substate)**: 当父状态被激活时，默认进入的子状态。
- **历史状态 (History State)**: 一种伪状态，用于记录父状态上次退出时的活跃子状态，以便重新进入时恢复。

分层状态遵循 **Liskov 替换原则**：在某种意义上，子状态机可以看作是父状态的一个实现。触发父状态的事件如果未被父状态处理，将会在子状态中寻找处理器。

## 2. 分层状态的优势

1. **状态复用 (Reusability)**: 公共的转换和动作可以定义在父状态上，所有子状态自动继承。
2. **简化复杂度 (Reduced Complexity)**: 将复杂的状态逻辑分解为多个层次，每个层次专注于特定的功能模块。
3. **逻辑封装 (Encapsulation)**: 将相关的状态和行为封装在父状态下，对外提供清晰的接口（事件）。
4. **历史管理 (History Management)**: 通过历史状态，可以轻松实现“记忆并恢复”之前状态的功能，这在工作流场景中非常有用。

## 3. 配置分层状态

Spring Statemachine 提供了两种主要的配置方式：**Java Config** 和 **UML 模型**。本文将重点介绍最常用的 Java Config 方式。

### 3.1. 基础配置（Java Config）

你需要通过继承 `EnumStateMachineConfigurerAdapter` 或 `StateMachineConfigurerAdapter` 来配置状态机。使用 `withStates()` 和 `parent()` 方法来定义状态的层次关系。

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.config.EnableStateMachine;
import org.springframework.statemachine.config.EnumStateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;

import java.util.EnumSet;

@Configuration
@EnableStateMachine // 启用状态机
public class HierarchicalStateMachineConfig extends EnumStateMachineConfigurerAdapter<States, Events> {

    // 定义状态枚举
    public enum States {
        ROOT_STATE,
        PARENT_STATE,
        CHILD_STATE_1,
        CHILD_STATE_2,
        CHILD_STATE_2_1,
        CHILD_STATE_2_2
    }

    // 定义事件枚举
    public enum Events {
        EVENT_1,
        EVENT_2,
        EVENT_TO_CHILD_2_1,
        EVENT_TO_CHILD_2_2,
        EVENT_FROM_DEEP
    }

    @Override
    public void configure(StateMachineStateConfigurer<States, Events> states) throws Exception {
        states
            .withStates()
                .initial(States.ROOT_STATE) // 根级初始状态
                .state(States.PARENT_STATE)
                .and()
                .withStates()
                    .parent(States.PARENT_STATE) // 指定父状态
                    .initial(States.CHILD_STATE_1) // 父状态的初始子状态
                    .state(States.CHILD_STATE_2)
                    .and()
                    .withStates()
                        .parent(States.CHILD_STATE_2) // 嵌套的子状态：CHILD_STATE_2 成为父状态
                        .initial(States.CHILD_STATE_2_1)
                        .state(States.CHILD_STATE_2_2);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
        transitions
            .withExternal()
                .source(States.ROOT_STATE).target(States.PARENT_STATE)
                .event(Events.EVENT_1)
                .and()
            .withExternal()
                .source(States.CHILD_STATE_1).target(States.CHILD_STATE_2)
                .event(States.EVENT_2)
                .and()
            .withExternal()
                .source(States.CHILD_STATE_2_1).target(States.CHILD_STATE_2_2)
                .event(Events.EVENT_TO_CHILD_2_2)
                .and()
            .withExternal()
                .source(States.CHILD_STATE_2_2).target(States.ROOT_STATE)
                .event(Events.EVENT_FROM_DEEP);
    }
}
```

**代码解析**:

- `.parent(States.PARENT_STATE)`: 关键方法，用于指定当前 `withStates()` 块中定义的所有状态的父状态。
- 状态 `CHILD_STATE_2_1` 和 `CHILD_STATE_2_2` 是 `CHILD_STATE_2` 的子状态，形成了嵌套层次。
- 当状态机通过 `EVENT_1` 进入 `PARENT_STATE` 时，它会自动进入其初始子状态 `CHILD_STATE_1`。

### 3.2. 完整可运行示例

以下是一个完整的 Spring Boot 应用程序，演示了分层状态机的配置和使用。

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.action.Action;
import org.springframework.statemachine.config.EnableStateMachine;
import org.springframework.statemachine.config.EnumStateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;
import org.springframework.statemachine.guard.Guard;
import org.springframework.statemachine.listener.StateMachineListener;
import org.springframework.statemachine.listener.StateMachineListenerAdapter;
import org.springframework.statemachine.state.State;

import java.util.EnumSet;

@SpringBootApplication
public class HierarchicalStateMachineApplication {

    public static void main(String[] args) {
        SpringApplication.run(HierarchicalStateMachineApplication.class, args);
    }

    @Configuration
    @EnableStateMachine
    public static class StateMachineConfig extends EnumStateMachineConfigurerAdapter<States, Events> {

        public enum States {
            ROOT, PARENT, CHILD_1, CHILD_2, DEEP_CHILD
        }

        public enum Events {
            TO_PARENT, TO_CHILD_2, TO_DEEP, BACK_TO_ROOT
        }

        @Override
        public void configure(StateMachineStateConfigurer<States, Events> states) throws Exception {
            states
                .withStates()
                    .initial(States.ROOT)
                    .state(States.PARENT, entryAction(), exitAction()) // 父状态配置入口/出口动作
                    .and()
                    .withStates()
                        .parent(States.PARENT)
                        .initial(States.CHILD_1)
                        .state(States.CHILD_2)
                        .and()
                        .withStates()
                            .parent(States.CHILD_2)
                            .initial(States.DEEP_CHILD);
        }

        @Override
        public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
            transitions
                .withExternal()
                    .source(States.ROOT).target(States.PARENT)
                    .event(Events.TO_PARENT)
                    .and()
                .withExternal()
                    .source(States.CHILD_1).target(States.CHILD_2)
                    .event(Events.TO_CHILD_2)
                    .and()
                .withExternal()
                    .source(States.DEEP_CHILD).target(States.ROOT)
                    .event(Events.BACK_TO_ROOT)
                    .guard(deepToRootGuard()); // 使用守卫控制转换
        }

        @Bean
        public Action<States, Events> entryAction() {
            return context -> System.out.println("Entering PARENT state!");
        }

        @Bean
        public Action<States, Events> exitAction() {
            return context -> System.out.println("Exiting PARENT state!");
        }

        @Bean
        public Guard<States, Events> deepToRootGuard() {
            // 一个简单的守卫，总是允许转换
            return context -> true;
        }

        @Bean
        public StateMachineListener<States, Events> listener() {
            return new StateMachineListenerAdapter<States, Events>() {
                @Override
                public void stateChanged(State<States, Events> from, State<States, Events> to) {
                    if (from != null) {
                        System.out.println("State changed from " + from.getId() + " to " + to.getId());
                    } else {
                        System.out.println("State changed to " + to.getId());
                    }
                }
            };
        }
    }
}
```

**运行和测试**:

创建一个 CommandLineRunner 来发送事件，观察状态变化和动作执行。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.statemachine.StateMachine;
import org.springframework.stereotype.Component;

@Component
public class AppRunner implements CommandLineRunner {

    @Autowired
    private StateMachine<HierarchicalStateMachineApplication.StateMachineConfig.States,
                        HierarchicalStateMachineApplication.StateMachineConfig.Events> stateMachine;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- Starting State Machine ---");
        stateMachine.start(); // 输出: State changed to ROOT

        System.out.println("\n--- Sending TO_PARENT Event ---");
        stateMachine.sendEvent(HierarchicalStateMachineApplication.StateMachineConfig.Events.TO_PARENT);
        // 输出: Entering PARENT state!
        // 输出: State changed from ROOT to PARENT
        // (内部进入 CHILD_1, 但监听器可能只看到到 PARENT 的改变，具体取决于实现细节)

        System.out.println("\n--- Sending TO_CHILD_2 Event ---");
        stateMachine.sendEvent(HierarchicalStateMachineApplication.StateMachineConfig.Events.TO_CHILD_2);
        // 输出: State changed from CHILD_1 to CHILD_2
        // (内部进入 DEEP_CHILD)

        System.out.println("\n--- Sending BACK_TO_ROOT Event ---");
        stateMachine.sendEvent(HierarchicalStateMachineApplication.StateMachineConfig.Events.BACK_TO_ROOT);
        // 输出: Exiting PARENT state!
        // 输出: State changed from PARENT to ROOT

        stateMachine.stop();
    }
}
```

## 4. 高级特性与最佳实践

### 4.1. 历史状态 (History States)

历史状态允许状态机记住父状态上次退出时的最后一个活跃子状态，并在下次进入父状态时恢复该子状态。

**配置示例**:

```java
@Override
public void configure(StateMachineStateConfigurer<States, Events> states) throws Exception {
    states
        .withStates()
            .initial(States.ROOT)
            .state(States.PARENT)
            .and()
            .withStates()
                .parent(States.PARENT)
                .initial(States.CHILD_1)
                .state(States.CHILD_2)
                .history(States.HISTORY_STATE, History.SHALLOW); // 定义浅历史状态
}

@Override
public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
    transitions
        .withExternal()
            .source(States.ROOT).target(States.HISTORY_STATE) // 直接转换到历史状态
            .event(Events.RESUME);
}
```

**类型**:

- `History.SHALLOW`: 仅记忆父状态直接层级下的最后一个活跃子状态。
- `History.DEEP`: 记忆整个父状态子树下的最后一个活跃状态配置（包括嵌套子状态）。

**最佳实践**: 在需要中断并恢复的流程（如订单处理、文件上传）中使用历史状态，可以提供更好的用户体验。

### 4.2. 入口/出口动作 (Entry/Exit Actions)

父状态和子状态都可以定义自己的入口和出口动作。

- **入口动作 (Entry Action)**: 当状态被进入时（无论是直接进入还是通过初始转换）执行。
- **出口动作 (Exit Action)**: 当状态被退出时执行。

**执行顺序**:
当从状态 `ROOT` 转换到 `PARENT` 的初始子状态 `CHILD_1` 时，动作执行顺序为：

1. `ROOT` 的出口动作（如果有）
2. `PARENT` 的入口动作
3. `CHILD_1` 的入口动作

当从 `CHILD_1` 转换回 `ROOT` 时，顺序相反。

**最佳实践**: 将状态相关的初始化（如启动服务、加载数据）和清理（如停止服务、释放资源）逻辑分别放在入口和出口动作中，确保资源管理的一致性。

### 4.3. 事件处理与传播

在分层状态机中，事件处理遵循 **事件冒泡** 机制：

1. 当前活跃状态（最深层的子状态）首先尝试处理该事件。
2. 如果当前状态没有定义该事件的转换，则事件会向其父状态传递。
3. 父状态尝试处理，如果失败则继续向上传递，直到根状态。
4. 如果根状态也无法处理，则该事件被忽略或由监听器捕获为“未接受事件”。

**最佳实践**: 将通用事件（如 `CANCEL`, `PAUSE`）的处理放在较高的父状态中，实现关注点分离和代码复用。将特定事件放在具体的子状态中处理。

### 4.4. 并行区域 (Parallel Regions / Orthogonal States)

虽然不属于严格的分层状态，但并行区域常与分层状态结合使用。它允许一个父状态包含多个互不干扰、同时活跃的区域（子状态机）。

**配置概念**:

```java
states
    .withStates()
        .state(States.PARENT)
        .and()
        .withStates()
            .parent(States.PARENT)
            .region("RegionA") // 定义区域 A
            .initial(States.REGION_A_STATE_1)
            .state(States.REGION_A_STATE_2)
            .and()
            .withStates()
            .parent(States.PARENT)
            .region("RegionB") // 定义区域 B
            .initial(States.REGION_B_STATE_1)
            .state(States.REGION_B_STATE_2);
```

**最佳实践**: 用于建模真正并发且独立的任务，例如在“处理中”状态下，同时执行“支付处理”和“库存扣减”两个独立的子流程。

## 5. 常见问题与调试 (FAQ & Debugging)

**Q: 我的子状态转换没有触发？**
A: 检查事件是否被更深层、更浅层或同层的其他状态错误地处理（事件冒泡被拦截）。使用 `StateMachineListener` 记录所有状态变化和未接受的事件。

**Q: 历史状态没有恢复到我预期的状态？**
A: 确认使用的是 `SHALLOW` 还是 `DEEP` 历史。检查状态机退出时，想要记忆的子状态是否是当时真正活跃的状态。

**调试技巧**:

1. **启用日志**: 在 `application.properties` 中设置 `logging.level.org.springframework.statemachine=DEBUG` 或 `TRACE`。
2. **使用监听器**: 注入一个 `StateMachineListenerAdapter`，重写 `stateChanged`, `eventNotAccepted` 等方法，打印详细日志。

   ```java
   @Bean
   public StateMachineListener<States, Events> listener() {
       return new StateMachineListenerAdapter<States, Events>() {
           @Override
           public void eventNotAccepted(Message<Events> event) {
               System.err.println("Event not accepted: " + event);
           }
           @Override
           public void stateContext(StateContext<States, Events> stateContext) {
               // TRACE 级别的信息
               if (stateContext.getStage() == StateContext.Stage.STATE_ENTRY) {
                   System.out.println("Entering: " + stateContext.getStateMachine().getState().getId());
               }
           }
       };
   }
   ```

3. **图形化可视化**: 考虑使用 Spring Statemachine 的 UML 导出功能，将配置生成状态图，直观地检查层次结构和转换关系。

## 6. 总结

Spring Statemachine 的分层状态功能是构建复杂、可维护业务流程的基石。通过有效地使用父状态、子状态、历史状态和事件传播机制，你可以：

- **减少重复代码**：将通用逻辑提升至父状态。
- **提高可读性**：通过层次结构清晰地表达状态之间的关系。
- **增强健壮性**：利用入口/出口动作安全地管理资源。
- **设计灵活流程**：通过历史状态实现中断恢复。

掌握分层状态的设计和配置，将使你能够优雅地建模和实现现实中复杂的业务状态流。建议从简单的层次开始，逐步实践更高级的特性如历史状态和并行区域，并善用监听器和日志进行调试。
