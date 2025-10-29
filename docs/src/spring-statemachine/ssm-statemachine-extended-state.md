# Spring Statemachine Extended State 扩展状态详解与最佳实践

## 1. 概述

在状态机编程中，**状态（State）** 定义了系统所处的某个特定阶段或条件，而 **事件（Event）** 则是触发状态迁移的信号。然而，在实际复杂的业务场景中，我们经常需要跟踪和决策一些临时的、与主状态流正交的数据，例如：计数器、用户输入、业务流程中的临时变量等。

如果将这些数据全部通过创建新的状态来表示，会导致 **"状态爆炸"** ，使得状态机模型变得臃肿且难以维护。

为了解决这个问题，Spring Statemachine 引入了 **扩展状态（Extended State）** 的概念。扩展状态不属于状态机的核心状态机结构，而是作为一种附属的、可变的上下文信息存在，它通常以键值对（`Map<String, Object>`）的形式存储，可以在 **守卫（Guard）** 和 **动作（Action）** 中被访问和修改，从而影响状态机的行为。

**核心价值**：扩展状态将 **“数据”** 与 **“状态”** 分离，允许您在不增加状态数目的情况下，基于运行时数据做出复杂的逻辑决策，极大地增强了状态机的表现力和灵活性。

## 2. 核心概念

### 2.1 Extended State 接口

`ExtendedState` 接口是访问扩展状态的主要入口，它提供了一些核心方法：

```java
public interface ExtendedState {
    // 获取存储所有变量的 Map
    Map<Object, Object> getVariables();

    // 根据 Key 获取变量，可指定类型
    <T> T get(Object key, Class<T> type);

    // 根据 Key 获取变量
    Object get(Object key);

    // 设置一个变量
    void setVariable(Object key, Object value);

    // 检查变量是否存在
    boolean contains(Object key);
}
```

### 2.2 StateContext

在 **Guard** 和 **Action** 中，您主要通过 `StateContext` 对象来访问扩展状态。`StateContext` 是一个富对象，它封装了状态机在某个时间点的完整上下文。

```java
public interface StateContext<S, E> {
    // 获取扩展状态
    ExtendedState getExtendedState();

    // 其他有用的信息，如事件消息、状态机实例、异常、过渡信息等
    Event<E> getEvent();
    Message<E> getMessage();
    StateMachine<S, E> getStateMachine();
    Transition<S, E> getTransition();
    // ... 其他方法
}
```

## 3. 配置与使用

### 3.1 声明式配置（Java Config）

以下示例展示了如何在一个配置类中定义状态机，并在动作（Action）和守卫（Guard）中使用扩展状态。

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.config.EnableStateMachine;
import org.springframework.statemachine.config.StateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineConfigurationConfigurer;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;
import org.springframework.statemachine.guard.Guard;
import org.springframework.statemachine.action.Action;
import org.springframework.statemachine.StateContext;

@Configuration
@EnableStateMachine
public class StateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    // 定义状态和事件枚举（通常单独定义，此处为简洁放在内部）
    public enum States {SI, PROCESSING, APPROVAL, SUCCESS, ERROR}
    public enum Events {START, CHECK, APPROVE, REJECT}

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
                .initial(States.SI)
                .state(States.PROCESSING)
                .state(States.APPROVAL)
                .end(States.SUCCESS)
                .end(States.ERROR);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
                .source(States.SI)
                .target(States.PROCESSING)
                .event(Events.START)
                .action(initializeAction()) // 初始化扩展状态
            .and()
            .withExternal()
                .source(States.PROCESSING)
                .target(States.APPROVAL)
                .event(Events.CHECK)
                .guard(validationGuard()) // 使用守卫检查扩展状态
            .and()
            .withExternal()
                .source(States.APPROVAL)
                .target(States.SUCCESS)
                .event(Events.APPROVE)
            .and()
            .withExternal()
                .source(States.APPROVAL)
                .target(States.ERROR)
                .event(Events.REJECT);
    }

    // --- 定义操作和守卫 Bean ---

    /**
     * 动作：初始化扩展状态
     * 在流程开始时，设置一个计数器和一个初始数据
     */
    @Bean
    public Action<String, String> initializeAction() {
        return new Action<String, String>() {
            @Override
            public void execute(StateContext<String, String> context) {
                ExtendedState extendedState = context.getExtendedState();
                extendedState.setVariable("retryCount", 0);
                extendedState.setVariable("formData", "{\"name\": \"John Doe\"}");
                System.out.println("Extended State initialized: retryCount=0, formData set.");
            }
        };
    }

    /**
     * 守卫：验证扩展状态
     * 检查处理次数，如果超过3次，则直接导向ERROR（此处简化，实际可能导向审批）
     * 同时演示如何修改扩展状态
     */
    @Bean
    public Guard<String, String> validationGuard() {
        return new Guard<String, String>() {
            @Override
            public boolean evaluate(StateContext<String, String> context) {
                ExtendedState extendedState = context.getExtendedState();
                Integer retryCount = extendedState.get("retryCount", Integer.class);
                String formData = (String) extendedState.getVariables().get("formData");

                System.out.println("Validation Guard: retryCount=" + retryCount + ", formData=" + formData);

                // 业务逻辑：如果重试超过2次，则不允许进入审批，返回false将阻止过渡
                if (retryCount >= 2) {
                    System.out.println("Too many retries. Transition blocked.");
                    return false;
                }

                // 模拟一些验证逻辑
                boolean isValid = formData != null && formData.contains("name");
                if (!isValid) {
                    // 验证失败，增加重试计数器
                    int newCount = retryCount + 1;
                    extendedState.setVariable("retryCount", newCount);
                    System.out.println("Validation failed. Incrementing retryCount to " + newCount);
                    return false;
                }

                System.out.println("Validation passed. Proceeding to APPROVAL.");
                return true;
            }
        };
    }
}
```

### 3.2 编程式使用

您也可以在运行时，通过 `StateMachine` 接口直接访问和修改扩展状态。

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.state.State;
import org.springframework.messaging.support.MessageBuilder;

@Service
public class OrderService {

    @Autowired
    private StateMachine<States, Events> stateMachine;

    public void startOrderProcess(OrderForm form) {
        // 启动状态机前，可以先设置一些扩展变量
        stateMachine.getExtendedState().getVariables().put("orderForm", form);
        stateMachine.getExtendedState().getVariables().put("currentUser", "user123");

        // 发送启动事件
        stateMachine.sendEvent(MessageBuilder
                .withPayload(Events.START)
                .setHeader("formId", form.getId()) // 消息头也可用于传递信息
                .build());
    }

    public void checkOrderStatus(String orderId) {
        // 直接从扩展状态中获取数据
        State<States, Events> currentState = stateMachine.getState();
        OrderForm form = (OrderForm) stateMachine.getExtendedState().getVariables().get("orderForm");
        Integer retries = stateMachine.getExtendedState().get("retryCount", Integer.class);

        System.out.println("Current State: " + currentState.getId());
        System.out.println("Form Data: " + (form != null ? form.toString() : "null"));
        System.out.println("Retry Count: " + retries);
    }

    // ... 其他业务方法
}
```

## 4. 监听扩展状态的变化

您可以注册监听器来响应扩展状态中特定键或任何键的变化。

### 4.1 实现 StateMachineListener

```java
@Component
public class ExtendedStateChangeListener implements StateMachineListener<States, Events> {

    @Override
    public void extendedStateChanged(Object key, Object value) {
        // 当任何扩展状态的键值发生变化时，此方法会被调用
        System.out.println("Extended State changed - Key: " + key + ", Value: " + value);

        // 可以对特定的键做出反应
        if ("retryCount".equals(key)) {
            Integer count = (Integer) value;
            System.out.println("Retry count was updated to: " + count);
            if (count != null && count >= 3) {
                System.out.warn("Warning: Retry count is getting high!");
                // 可以在这里触发告警等操作
            }
        }
    }

    // ... 需要实现其他方法，但可以留空，或者使用 StateMachineListenerAdapter
}
```

更推荐的方式是继承 `StateMachineListenerAdapter`，只覆盖您关心的方法。

```java
@Component
public class CustomStateMachineListener extends StateMachineListenerAdapter<States, Events> {

    @Override
    public void extendedStateChanged(Object key, Object value) {
        // 专用于监听扩展状态变化
        System.out.println("[Listener] " + key + " -> " + value);
    }
}
```

### 4.2 使用 @OnExtendedStateChanged 注解

通过上下文集成，您可以在任何 Bean 的方法上使用注解来监听变化。

首先，确保您的配置类使用了 `@EnableStateMachine` 或 `@EnableWithStateMachine`（已包含在内）。

```java
@Service
public class OrderStatusService {

    @OnExtendedStateChanged
    public void onAnyChange() {
        System.out.println("An extended state variable changed.");
    }

    @OnExtendedStateChanged(key = "retryCount")
    public void onRetryCountChange(StateContext<States, Events> context) {
        // 当 retryCount 变化时，此方法被调用
        Integer newValue = context.getExtendedState().get("retryCount", Integer.class);
        System.out.println("retryCount specifically changed to: " + newValue);
    }
}
```

## 5. 最佳实践与常见场景

### 5.1 最佳实践

1. **键的命名规范**：使用有明确意义的字符串作为键，避免魔法值。可以考虑使用常量类或枚举来定义所有可能的键。

   ```java
   public class ExtendedStateVariables {
       public static final String RETRY_COUNT = "retryCount";
       public static final String FORM_DATA = "formData";
       public static final String CURRENT_USER = "currentUser";
       public static final String ERROR_CAUSE = "errorCause";
   }
   ```

2. **类型安全**：使用 `extendedState.get(key, Class<T> type)` 方法获取值时指定类型，避免 ClassCastException。

3. **作用域意识**：明确扩展状态中数据的生命周期。它们是附属于当前状态机实例的。对于会话或请求作用域的状态机，数据在该会话或请求内有效。

4. **序列化考虑**：如果您使用持久化（如 Redis、JPA），存储在扩展状态中的对象必须是可序列化的。

5. **避免过度使用**：扩展状态用于辅助决策的上下文数据，不要将其作为主要的业务数据存储。主要业务数据应存储在数据库或专门的业务对象中。

### 5.2 常见场景

- **重试机制**：如上面的示例所示，使用计数器跟踪操作重试次数。
- **表单验证**：存储用户提交的表单数据，并在多个状态中逐步验证和填充。
- **业务流程上下文**：存储流程所需的业务对象 ID（如订单 ID、用户 ID），以便在不同状态的动作中访问。
- **错误处理**：在发生错误时，将异常信息或错误码存入扩展状态，以便在错误状态中记录或返回给用户。
- **条件路由**：在 Choice 伪状态中，根据扩展状态中的复杂条件决定下一步的流向。

```java
// 在配置中定义 Choice 和 Junction
@Override
public void configure(StateMachineStateConfigurer<States, Events> states) throws Exception {
    states
        .withStates()
            .initial(States.SI)
            .choice(States.CHOICE_STATE) // 定义 Choice 伪状态
            .state(States.ROUTE_A)
            .state(States.ROUTE_B);
}

@Override
public void configure(StateMachineTransitionConfigurer<States, Events> transitions) throws Exception {
    transitions
        .withChoice()
            .source(States.CHOICE_STATE)
            .first(States.ROUTE_A, complexConditionGuard()) // 第一个条件
            .last(States.ROUTE_B); // 默认路由
}

@Bean
public Guard<States, Events> complexConditionGuard() {
    return context -> {
        ExtendedState extState = context.getExtendedState();
        Integer score = extState.get("userScore", Integer.class);
        String tier = extState.get("userTier", String.class);
        // 复杂的业务逻辑决策...
        return score != null && score > 80 && "PREMIUM".equals(tier);
    };
}
```

## 6. 总结

Spring Statemachine 的 **扩展状态（Extended State）** 是一个强大而灵活的特性，它将易变的数据与核心的状态定义解耦。通过合理地使用扩展状态，结合 **动作（Action）** 和 **守卫（Guard）**，您可以构建出能够处理复杂业务逻辑、极具表现力且易于维护的状态机。

**核心要点回顾**：

- **用途**：存储与状态机执行相关的上下文数据。
- **访问**：通过 `StateContext.getExtendedState()` 在 Guard 和 Action 中访问和修改。
- **监听**：通过实现 `StateMachineListener` 或使用 `@OnExtendedStateChanged` 注解来监听变化。
- **实践**：遵循命名规范、注意类型安全和数据生命周期。

掌握扩展状态的使用，是构建高级 Spring Statemachine 应用的关键一步。
