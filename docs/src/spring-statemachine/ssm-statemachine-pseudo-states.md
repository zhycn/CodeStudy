# Spring Statemachine 伪状态 (Pseudo States) 详解与最佳实践

## 1. 前言

在状态机的理论中，伪状态 (Pseudo States) 是一种特殊类型的顶点，它不代表系统持续存在的状态，而是用来辅助构建和管理状态机转换逻辑的临时节点。它们定义了状态机的初始化点、动态选择分支、合并、分叉等复杂行为。

Spring Statemachine (SSM) 框架完整地支持了 UML 状态机中定义的伪状态。理解和正确使用这些伪状态，是构建清晰、强大且易于维护的状态机模型的关键。本文将深入探讨 SSM 中各类伪状态的概念、配置方法、使用场景以及相关的最佳实践。

## 2. 伪状态概述

伪状态本身不保留任何状态信息，它们的主要作用是：

* **控制流程**：定义状态机的初始入口、历史恢复点、选择逻辑等。
* **简化复杂转换**：处理包含多个源或目标的转换，使状态图更清晰。
* **结构化状态机**：帮助组织层次化状态机和正交区域。

SSM 主要支持以下伪状态：

| 伪状态类型 | 关键字 | 主要用途 |
| :--- | :--- | :--- |
| **Initial** | `.initial()` | 定义状态机或子状态的初始入口点 |
| **Terminate** | `.end()` | 表示状态机或区域的最终终止状态 |
| **History (Shallow/Deep)** | `.history()` | 记录和恢复之前活跃的子状态 |
| **Choice** | `.choice()` | 基于 Guard 条件动态选择转换路径 |
| **Junction** | `.junction()` | 类似 Choice，但允许多个入口转换 |
| **Fork** | `.fork()` | 同时进入一个正交状态的多个区域 |
| **Join** | `.join()` | 同步等待多个区域完成，然后退出正交状态 |
| **Entry Point** | `.entry()` | 为复合状态提供受控的外部入口点 |
| **Exit Point** | `.exit()` | 为复合状态提供受控的外部退出点 |

## 3. 伪状态配置详解

### 3.1. Initial (初始状态)

**概念**：定义状态机启动时或进入一个复合状态时所处的第一个状态。

**配置方法**：
使用 `StateMachineStateConfigurer` 中的 `.initial(state)` 方法。可以为顶级状态机和任何复合状态（子状态）定义初始状态。

```java
@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
                .initial("S_INITIAL") // 顶级初始状态
                .state("S_PARENT")
                .and()
                .withStates()
                    .parent("S_PARENT")
                    .initial("S_CHILD_INITIAL") // S_PARENT 的初始子状态
                    .state("S_CHILD_1")
                    .state("S_CHILD_2");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("S_INITIAL").target("S_PARENT").event("E_START");
        // ... 其他转换配置
    }
}
```

**最佳实践**：

* 每个状态机或复合状态**必须有且仅有一个**初始状态。
* 初始状态可以关联一个初始化 Action，用于执行一些启动逻辑。

```java
.initial("S_INITIAL", initialAction()) // initialAction 是一个 @Bean
```

### 3.2. Terminate (终止状态)

**概念**：表示状态机或其一个区域已经执行完成，不再处理任何事件。

**配置方法**：
使用 `.end(state)` 方法标记一个状态为终止状态。

```java
@Override
public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
    states
        .withStates()
            .initial("S_RUNNING")
            .state("S_RUNNING")
            .end("S_FINAL"); // 定义终止状态
}

@Override
public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
    transitions
        .withExternal()
            .source("S_RUNNING").target("S_FINAL").event("E_COMPLETE");
}
```

**行为**：

* 状态机进入终止状态后，`stateMachine.isComplete()` 将返回 `true`。
* 向已终止的状态机发送事件将被忽略。

**最佳实践**：

* 用于明确表示一个工作流的成功或失败终点。
* 一个状态机可以有多个终止状态，代表不同的完成情况。

### 3.3. History (历史状态)

**概念**：用于记住复合状态上一次退出时所处的子状态，并在下次进入时自动恢复。

* **Shallow History**：只记住直接子层的上一次活跃状态。
* **Deep History**：记住整个嵌套子状态层次中上一次的完整状态配置。

**配置方法**：
使用 `.history(state, historyType)` 方法，并指定 `History.SHALLOW` 或 `History.DEEP`。

```java
@Override
public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
    states
        .withStates()
            .initial("S1")
            .state("S_PARENT")
            .and()
            .withStates()
                .parent("S_PARENT")
                .initial("S_CHILD_A")
                .state("S_CHILD_A")
                .state("S_CHILD_B")
                .history("HISTORY_SHALLOW", History.SHALLOW) // 浅历史
                .history("HISTORY_DEEP", History.DEEP); // 深历史
}
```

**使用历史状态**：
配置一个以历史状态为目标的转换。

```java
@Override
public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
    transitions
        .withExternal()
            .source("S1").target("HISTORY_SHALLOW").event("E_RESUME");
}
```

**默认历史行为**：
如果复合状态是**第一次进入**（没有历史记录），历史状态会使用初始状态。你也可以通过 `.defaultTransition()` 指定一个默认状态。

```java
transitions
    .withHistory()
        .source("HISTORY_SHALLOW")
        .target("S_CHILD_A"); // 如果没有历史记录，则默认进入 S_CHILD_A
```

**最佳实践**：

* **浅历史**适用于大多数情况，性能更好。
* **深历史**用于复杂的嵌套状态机，需要完全恢复之前的情景。
* 始终定义一个默认转换或确保初始状态已设置，以处理无历史记录的情况。

### 3.4. Choice (选择状态)

**概念**：根据运行时 Guard 条件（SPEL 表达式或 Guard Bean）的值，从多个可能的转换路径中动态选择一条。

**配置方法**：

1. 在状态配置中声明 Choice 伪状态。
2. 在转换配置中使用 `withChoice()` 方法，并链式调用 `.first()`, `.then()`, `.last()` 来定义选项分支。

```java
@Override
public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
    states
        .withStates()
            .initial("S_INITIAL")
            .choice("S_CHOICE") // 声明 Choice 伪状态
            .state("S_APPROVED")
            .state("S_REJECTED")
            .state("S_NEEDS_REVIEW");
}

@Override
public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
    transitions
        .withExternal()
            .source("S_INITIAL").target("S_CHOICE").event("E_SUBMIT")
        .and()
        .withChoice()
            .source("S_CHOICE")
            .first("S_APPROVED", approvedGuard())        // 条件为 true 则选此路径
            .then("S_REJECTED", rejectedGuard())         // 如果上一个 false，检查此条件
            .last("S_NEEDS_REVIEW");                      // 如果所有条件都为 false，则默认选择
}

@Bean
public Guard<String, String> approvedGuard() {
    return context -> {
        // 从扩展变量或消息头中获取业务逻辑条件
        Integer score = context.getExtendedState().get("userScore", Integer.class);
        return score != null && score > 90;
    };
}

@Bean
public Guard<String, String> rejectedGuard() {
    return context -> {
        Integer score = context.getExtendedState().get("userScore", Integer.class);
        return score != null && score < 60;
    };
}
```

**最佳实践**：

* 确保 Guard 条件**互斥**，以避免不可预测的行为。
* **必须**提供 `.last()` 分支作为默认 fallback，保证至少有一条路径可选，防止状态机阻塞。
* 优先使用类型安全的 Guard Bean 而不是 SPEL 表达式，以提高可测试性和重构能力。

### 3.5. Junction (连接点)

**概念**：功能与 Choice 类似，都是基于条件进行分支选择。主要区别在于学术定义：Junction 允许**多个传入转换**，而 Choice 通常只有一个。

在 SSM 的实际实现中，`Junction` 和 `Choice` 的配置 API (`first/then/last`) 和行为几乎完全相同。选择使用哪一个通常基于你对 UML 图表的语义偏好。

**配置方法**：
与 Choice 极其相似，只是关键字换成了 `junction()` 和 `withJunction()`。

```java
// State Configuration
.junction("S_JUNCTION")

// Transition Configuration
.withJunction()
    .source("S_JUNCTION")
    .first("S_PATH_A", guardA())
    .then("S_PATH_B", guardB())
    .last("S_PATH_C");
```

**最佳实践**：

* 如果你的伪状态在图表中有多个入口箭头，从 UML 角度考虑使用 `Junction`。
* 否则，使用 `Choice` 更为常见。在实践中，二者可以互换。

### 3.6. Fork & Join (分支与合并)

**概念**：用于处理**正交区域**（并行执行的子状态机）。

* **Fork**：将单个转换分解，**同时进入**一个复合状态的多个正交区域。
* **Join**：**同步等待**多个正交区域都到达它们的终止状态（或指定的 Join 状态），然后才触发转换，离开复合状态。

**配置方法**：

1. 定义一个包含多个区域（`and()` 分隔）的父状态。
2. 使用 `.fork()` 和 `.join()` 声明伪状态。
3. 使用 `withFork()` 和 `withJoin()` 配置转换。

```java
@Override
public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
    states
        .withStates()
            .initial("S_INITIAL")
            .state("S_PROCESSING")
            .fork("S_FORK")   // 声明 Fork 伪状态
            .join("S_JOIN")   // 声明 Join 伪状态
            .state("S_FINAL")
        .and()
        .withStates()
            .parent("S_PROCESSING")
            .initial("S_TASK1_INIT")
            .state("S_TASK1_DOING")
            .end("S_TASK1_DONE") // 区域 1 的结束状态
        .and()
        .withStates()
            .parent("S_PROCESSING")
            .initial("S_TASK2_INIT")
            .state("S_TASK2_DOING")
            .end("S_TASK2_DONE"); // 区域 2 的结束状态
}

@Override
public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
    transitions
        .withExternal()
            .source("S_INITIAL").target("S_FORK").event("E_START")
        .and()
        .withFork()
            .source("S_FORK")
            .target("S_TASK1_INIT") //  Fork 到区域1的初始状态
            .target("S_TASK2_INIT") //  Fork 到区域2的初始状态
        .and()
        .withJoin()
            .source("S_TASK1_DONE") // 监听区域1的结束状态
            .source("S_TASK2_DONE") // 监听区域2的结束状态
            .target("S_JOIN")       // 所有源都完成后，才触发到 Join 的转换
        .and()
        .withExternal()
            .source("S_JOIN").target("S_FINAL").event("E_ALL_DONE");
}
```

**最佳实践**：

* Fork 的目标通常是各个区域的**初始状态**。
* Join 的源通常是各个区域的**结束状态**（`.end()`）或你指定的特定状态。
* 确保所有区域最终都能到达 Join 的源状态，否则状态机会永远等待，导致死锁。

### 3.7. Entry Point & Exit Point (入口点与出口点)

**概念**：为复合状态提供明确定义的入口和出口，允许从外部直接转换到复合状态内部的特定子状态，或从特定子状态直接退出复合状态。这提供了比默认初始状态和默认退出更精细的控制。

**配置方法**：

1. 在复合状态内部使用 `.entry()` 和 `.exit()` 声明入口点和出口点。
2. 配置从外部到入口点的转换，以及从出口点到外部状态的转换。
3. 在复合状态内部，配置从入口点到内部状态、从内部状态到出口点的转换。

```java
@Override
public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
    states
        .withStates()
            .initial("S1")
            .state("S_PARENT")
            .and()
            .withStates()
                .parent("S_PARENT")
                .entry("ENTRY_POINT_1") // 声明入口点
                .exit("EXIT_POINT_1")   // 声明出口点
                .initial("S_DEFAULT_CHILD")
                .state("S_DEFAULT_CHILD")
                .state("S_SPECIAL_CHILD");
}

@Override
public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
    transitions
        // 从外部直接进入复合状态的特定入口点
        .withExternal()
            .source("S1").target("ENTRY_POINT_1").event("E_ENTER_SPECIAL")
        // 定义入口点进入后的实际目标状态
        .withEntry()
            .source("ENTRY_POINT_1").target("S_SPECIAL_CHILD")
        // 定义从内部状态到出口点的转换
        .withExternal()
            .source("S_SPECIAL_CHILD").target("EXIT_POINT_1").event("E_EXIT_NOW")
        // 定义从出口点退出后的实际目标状态
        .withExit()
            .source("EXIT_POINT_1").target("S1");
}
```

**最佳实践**：

* 用于需要绕过复合状态默认初始/退出行为的场景。
* 使状态图的目的更加明确，特别是在与外部状态交互时。
* 可以与 Choice/Junction 结合使用，根据条件选择不同的入口点。

## 4. 完整示例：订单处理流程

下面是一个综合使用多种伪状态的订单处理状态机配置示例。

```java
@Configuration
@EnableStateMachine
public class OrderStateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
                .initial("ORDER_PLACED")
                .choice("PAYMENT_VERIFICATION_CHOICE")
                .state("ORDER_PROCESSING")
                .junction("INVENTORY_CHECK_JUNCTION")
                .state("SHIPPING")
                .end("ORDER_COMPLETED")
                .and()
                .withStates()
                    .parent("ORDER_PROCESSING")
                    .initial("WAITING_PAYMENT")
                    .state("PAYMENT_RECEIVED")
                    .history("HISTORY_DEEP", History.DEEP)
                    .end("PROCESSING_DONE")
                .and()
                .withStates()
                    .parent("SHIPPING")
                    .fork("SHIPPING_FORK")
                    .join("SHIPPING_JOIN")
                    .end("SHIPPING_DONE")
                .and()
                .withStates()
                    .parent("SHIPPING")
                    .entry("EXPRESS_ENTRY")
                    .exit("EXPRESS_EXIT")
                    .initial("PACKING")
                    .state("DISPATCHED");
                    // ... 其他运输子状态
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source("ORDER_PLACED").target("PAYMENT_VERIFICATION_CHOICE").event("E_VERIFY_PAYMENT")
            .and()
            .withChoice()
                .source("PAYMENT_VERIFICATION_CHOICE")
                .first("WAITING_PAYMENT", paymentFailedGuard()) // 支付失败，等待
                .last("ORDER_PROCESSING") // 支付成功，进入处理
            .and()
            .withExternal()
                .source("WAITING_PAYMENT").target("HISTORY_DEEP").event("E_PAYMENT_RECEIVED") // 支付完成，恢复历史
            .and()
            .withHistory()
                .source("HISTORY_DEEP")
                .target("PAYMENT_RECEIVED") // 默认历史目标
            .and()
            .withJunction()
                .source("INVENTORY_CHECK_JUNCTION")
                .first("PROCESSING_DONE", inventorySufficientGuard()) // 库存充足，完成处理
                .last("RESTOCKING") // 库存不足，进入补货状态（需定义）
            .and()
            .withFork()
                .source("SHIPPING_FORK")
                .target("PACKING")
                .target("LABEL_PRINTING") // 假设另一个区域
            .and()
            .withJoin()
                .source("PACKING") // 一个区域完成
                .source("LABEL_PRINTING") // 另一个区域完成
                .target("SHIPPING_JOIN")
            .and()
            .withExternal()
                .source("SHIPPING_JOIN").target("ORDER_COMPLETED").event("E_SHIPPING_CONFIRMED");
        // ... 配置入口点/出口点转换
    }

    // ... 各种 Guard Bean 的定义 (paymentFailedGuard, inventorySufficientGuard, etc.)
    @Bean
    public Guard<String, String> paymentFailedGuard() {
        return context -> {
            // 模拟支付检查逻辑
            return Math.random() > 0.7;
        };
    }
}
```

## 5. 总结与最佳实践

1. **清晰的设计优先**：在编码之前，先用 UML 状态图表描绘出状态、事件和伪状态的使用。这能极大地提高代码的清晰度和可维护性。
2. **理解语义**：虽然某些伪状态（如 Choice 和 Junction）实现相似，但选择符合 UML 语义的伪状态能使你的模型更易于理解。
3. **始终提供默认路径**：对于 `Choice` 和 `Junction`，**务必**使用 `.last()` 提供一个无条件的默认转换，防止状态机因所有 Guard 条件都为 `false` 而停滞。
4. **谨慎使用 Fork/Join**：并行区域能提高效率，但也增加了复杂性。确保所有分支都能到达 Join 点，避免死锁。
5. **利用历史状态简化逻辑**：`History` 状态非常适合需要暂停和恢复功能的场景（如订单支付、工作流审批），可以避免手动管理复杂的恢复逻辑。
6. **测试覆盖**：伪状态引入了分支逻辑，务必为每个 Guard 条件和转换路径编写单元测试和集成测试，确保其行为符合预期。Spring Statemachine 提供了很好的测试支持。
7. **结合扩展变量**：伪状态（尤其是 `Choice`/`Junction`）的强大之处在于与 `Extended State` 中的变量结合使用，实现真正的动态行为决策。

通过熟练掌握这些伪状态，你将能够利用 Spring Statemachine 构建出极其强大、灵活且易于推理的复杂状态管理流程。
