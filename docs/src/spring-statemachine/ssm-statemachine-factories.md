# Spring Statemachine 状态机工厂详解与最佳实践

## 1. 状态机工厂概述

在 Spring Statemachine 中，状态机工厂 (`StateMachineFactory`) 是一个核心概念，它提供了创建和管理状态机实例的标准化方式。与直接创建状态机实例相比，使用工厂模式具有以下优势：

- **资源复用**：可以复用配置元数据，减少重复配置带来的开销
- **生命周期管理**：统一管理状态机的创建、初始化和销毁
- **动态实例化**：支持根据需要动态创建多个状态机实例
- **配置集中化**：将状态机配置与使用代码分离，提高可维护性

Spring Statemachine 提供了两种主要的工厂模式：

- `@EnableStateMachine`：创建单个状态机 Bean
- `@EnableStateMachineFactory`：创建状态机工厂 Bean

## 2. 两种工厂模式对比

### 2.1 @EnableStateMachine

`@EnableStateMachine` 注解用于创建单个状态机 Bean，适用于单例状态机场景。

```java
@Configuration
@EnableStateMachine
public class SingleStateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
            .initial("SI")
            .state("S1")
            .state("S2");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
            .source("SI").target("S1").event("E1")
            .and()
            .withExternal()
            .source("S1").target("S2").event("E2");
    }
}
```

### 2.2 @EnableStateMachineFactory

`@EnableStateMachineFactory` 注解用于创建状态机工厂 Bean，适用于需要多个状态机实例的场景。

```java
@Configuration
@EnableStateMachineFactory
public class FactoryStateMachineConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
            .initial("SI")
            .state("S1")
            .state("S2")
            .state("S3");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
            .source("SI").target("S1").event("E1")
            .and()
            .withExternal()
            .source("S1").target("S2").event("E2")
            .and()
            .withExternal()
            .source("S2").target("S3").event("E3");
    }
}
```

### 2.3 对比总结

| 特性 | @EnableStateMachine | @EnableStateMachineFactory |
|------|---------------------|----------------------------|
| 创建对象 | 单个状态机实例 | 状态机工厂 |
| 适用场景 | 单例状态机 | 多实例状态机 |
| 资源开销 | 较低 | 较高（需要管理多个实例） |
| 灵活性 | 较低 | 较高 |
| 实例管理 | 由 Spring 容器管理 | 需手动管理生命周期 |

## 3. 状态机工厂配置详解

### 3.1 基本配置

状态机工厂的基本配置包括状态、转换和事件的定义：

```java
@Configuration
@EnableStateMachineFactory
public class BasicFactoryConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        states
            .withStates()
            .initial("INITIAL")
            .state("PROCESSING")
            .state("APPROVING")
            .state("COMPLETED")
            .state("ERROR");
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        transitions
            .withExternal()
            .source("INITIAL").target("PROCESSING").event("START_PROCESSING")
            .and()
            .withExternal()
            .source("PROCESSING").target("APPROVING").event("REQUEST_APPROVAL")
            .and()
            .withExternal()
            .source("APPROVING").target("COMPLETED").event("APPROVE")
            .and()
            .withExternal()
            .source("APPROVING").target("PROCESSING").event("REJECT")
            .and()
            .withExternal()
            .source("*").target("ERROR").event("ERROR_OCCURRED");
    }

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withConfiguration()
            .autoStartup(false) // 手动启动
            .machineId("orderProcessMachine"); // 机器ID
    }
}
```

### 3.2 高级配置

对于复杂场景，可以配置监听器、拦截器等高级特性：

```java
@Configuration
@EnableStateMachineFactory
public class AdvancedFactoryConfig extends StateMachineConfigurerAdapter<String, String> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<String, String> config) throws Exception {
        config
            .withConfiguration()
            .autoStartup(false)
            .machineId("advancedMachine")
            .listener(stateMachineListener()) // 添加监听器
            .beanFactory(null) // 自定义 BeanFactory
            .taskExecutor(taskExecutor()) // 自定义任务执行器
            .taskScheduler(taskScheduler()); // 自定义任务调度器
    }

    @Bean
    public StateMachineListener<String, String> stateMachineListener() {
        return new StateMachineListenerAdapter<String, String>() {
            @Override
            public void stateChanged(State<String, String> from, State<String, String> to) {
                System.out.println("State changed from " + from.getId() + " to " + to.getId());
            }
        };
    }

    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(25);
        return executor;
    }

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        return scheduler;
    }

    // 状态和转换配置...
    @Override
    public void configure(StateMachineStateConfigurer<String, String> states) throws Exception {
        // 状态配置
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<String, String> transitions) throws Exception {
        // 转换配置
    }
}
```

## 4. 状态机实例管理

### 4.1 创建状态机实例

通过工厂创建状态机实例：

```java
@Service
public class OrderProcessService {

    private final StateMachineFactory<String, String> stateMachineFactory;
    private final Map<String, StateMachine<String, String>> machines = new ConcurrentHashMap<>();

    @Autowired
    public OrderProcessService(StateMachineFactory<String, String> stateMachineFactory) {
        this.stateMachineFactory = stateMachineFactory;
    }

    public StateMachine<String, String> createStateMachine(String orderId) {
        // 使用订单ID作为机器ID
        StateMachine<String, String> stateMachine = stateMachineFactory.getStateMachine(orderId);
        
        // 初始化状态机
        stateMachine.start();
        
        // 存储状态机实例以便后续管理
        machines.put(orderId, stateMachine);
        
        return stateMachine;
    }
}
```

### 4.2 状态机生命周期管理

正确的生命周期管理对于资源回收至关重要：

```java
@Service
public class StateMachineManager {

    private final StateMachineFactory<String, String> stateMachineFactory;
    private final Map<String, StateMachine<String, String>> activeMachines = new ConcurrentHashMap<>();

    @Autowired
    public StateMachineManager(StateMachineFactory<String, String> stateMachineFactory) {
        this.stateMachineFactory = stateMachineFactory;
    }

    public StateMachine<String, String> getMachine(String machineId) {
        return activeMachines.computeIfAbsent(machineId, id -> {
            StateMachine<String, String> machine = stateMachineFactory.getStateMachine(id);
            machine.start();
            return machine;
        });
    }

    public void stopMachine(String machineId) {
        StateMachine<String, String> machine = activeMachines.get(machineId);
        if (machine != null) {
            machine.stop();
            activeMachines.remove(machineId);
        }
    }

    public void stopAllMachines() {
        activeMachines.forEach((id, machine) -> machine.stop());
        activeMachines.clear();
    }

    @PreDestroy
    public void cleanup() {
        stopAllMachines();
    }
}
```

## 5. 实践应用场景

### 5.1 订单流程管理

以下是一个完整的订单流程管理示例：

```java
// 状态枚举
public enum OrderStates {
    INITIAL, 
    PAYMENT_PENDING, 
    PAYMENT_APPROVED, 
    PAYMENT_REJECTED, 
    IN_PROCESS, 
    SHIPPED, 
    DELIVERED, 
    CANCELLED
}

// 事件枚举
public enum OrderEvents {
    PAY, 
    PAYMENT_APPROVE, 
    PAYMENT_REJECT, 
    PROCESS, 
    SHIP, 
    DELIVER, 
    CANCEL
}

// 配置类
@Configuration
@EnableStateMachineFactory
public class OrderStateMachineFactoryConfig extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states) throws Exception {
        states
            .withStates()
            .initial(OrderStates.INITIAL)
            .state(OrderStates.PAYMENT_PENDING)
            .state(OrderStates.PAYMENT_APPROVED)
            .state(OrderStates.PAYMENT_REJECTED)
            .state(OrderStates.IN_PROCESS)
            .state(OrderStates.SHIPPED)
            .state(OrderStates.DELIVERED)
            .state(OrderStates.CANCELLED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions) throws Exception {
        transitions
            .withExternal()
            .source(OrderStates.INITIAL).target(OrderStates.PAYMENT_PENDING).event(OrderEvents.PAY)
            .and()
            .withExternal()
            .source(OrderStates.PAYMENT_PENDING).target(OrderStates.PAYMENT_APPROVED).event(OrderEvents.PAYMENT_APPROVE)
            .and()
            .withExternal()
            .source(OrderStates.PAYMENT_PENDING).target(OrderStates.PAYMENT_REJECTED).event(OrderEvents.PAYMENT_REJECT)
            .and()
            .withExternal()
            .source(OrderStates.PAYMENT_APPROVED).target(OrderStates.IN_PROCESS).event(OrderEvents.PROCESS)
            .and()
            .withExternal()
            .source(OrderStates.IN_PROCESS).target(OrderStates.SHIPPED).event(OrderEvents.SHIP)
            .and()
            .withExternal()
            .source(OrderStates.SHIPPED).target(OrderStates.DELIVERED).event(OrderEvents.DELIVER)
            .and()
            .withExternal()
            .source(OrderStates.PAYMENT_REJECTED).target(OrderStates.CANCELLED).event(OrderEvents.CANCEL)
            .and()
            .withExternal()
            .source(OrderStates.PAYMENT_APPROVED).target(OrderStates.CANCELLED).event(OrderEvents.CANCEL)
            .and()
            .withExternal()
            .source(OrderStates.IN_PROCESS).target(OrderStates.CANCELLED).event(OrderEvents.CANCEL);
    }

    @Bean
    public StateMachineListener<OrderStates, OrderEvents> orderStateMachineListener() {
        return new StateMachineListenerAdapter<OrderStates, OrderEvents>() {
            @Override
            public void stateChanged(State<OrderStates, OrderEvents> from, State<OrderStates, OrderEvents> to) {
                System.out.println("Order state changed from " + 
                    (from != null ? from.getId() : "null") + " to " + to.getId());
            }
        };
    }
}

// 服务类
@Service
public class OrderService {

    private final StateMachineFactory<OrderStates, OrderEvents> factory;
    private final Map<String, StateMachine<OrderStates, OrderEvents>> machines = new ConcurrentHashMap<>();

    @Autowired
    public OrderService(StateMachineFactory<OrderStates, OrderEvents> factory) {
        this.factory = factory;
    }

    public StateMachine<OrderStates, OrderEvents> createOrderMachine(String orderId) {
        StateMachine<OrderStates, OrderEvents> machine = factory.getStateMachine(orderId);
        machine.start();
        machines.put(orderId, machine);
        return machine;
    }

    public boolean processEvent(String orderId, OrderEvents event) {
        StateMachine<OrderStates, OrderEvents> machine = machines.get(orderId);
        if (machine != null) {
            return machine.sendEvent(event);
        }
        return false;
    }

    public OrderStates getCurrentState(String orderId) {
        StateMachine<OrderStates, OrderEvents> machine = machines.get(orderId);
        return machine != null ? machine.getState().getId() : null;
    }

    public void completeOrder(String orderId) {
        StateMachine<OrderStates, OrderEvents> machine = machines.get(orderId);
        if (machine != null) {
            machine.stop();
            machines.remove(orderId);
        }
    }
}
```

### 5.2 工单审批系统

另一个常见应用场景是工单审批系统：

```java
// 状态枚举
public enum TicketStates {
    NEW,
    IN_REVIEW,
    APPROVED,
    REJECTED,
    RESOLVED,
    REOPENED
}

// 事件枚举
public enum TicketEvents {
    SUBMIT,
    REVIEW,
    APPROVE,
    REJECT,
    RESOLVE,
    REOPEN
}

// 配置类
@Configuration
@EnableStateMachineFactory(name = "ticketStateMachineFactory")
public class TicketStateMachineConfig extends StateMachineConfigurerAdapter<TicketStates, TicketEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<TicketStates, TicketEvents> states) throws Exception {
        states
            .withStates()
            .initial(TicketStates.NEW)
            .state(TicketStates.IN_REVIEW)
            .state(TicketStates.APPROVED)
            .state(TicketStates.REJECTED)
            .state(TicketStates.RESOLVED)
            .state(TicketStates.REOPENED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<TicketStates, TicketEvents> transitions) throws Exception {
        transitions
            .withExternal()
            .source(TicketStates.NEW).target(TicketStates.IN_REVIEW).event(TicketEvents.SUBMIT)
            .and()
            .withExternal()
            .source(TicketStates.IN_REVIEW).target(TicketStates.APPROVED).event(TicketEvents.APPROVE)
            .and()
            .withExternal()
            .source(TicketStates.IN_REVIEW).target(TicketStates.REJECTED).event(TicketEvents.REJECT)
            .and()
            .withExternal()
            .source(TicketStates.APPROVED).target(TicketStates.RESOLVED).event(TicketEvents.RESOLVE)
            .and()
            .withExternal()
            .source(TicketStates.REJECTED).target(TicketStates.REOPENED).event(TicketEvents.REOPEN)
            .and()
            .withExternal()
            .source(TicketStates.RESOLVED).target(TicketStates.REOPENED).event(TicketEvents.REOPEN)
            .and()
            .withExternal()
            .source(TicketStates.REOPENED).target(TicketStates.IN_REVIEW).event(TicketEvents.REVIEW);
    }

    @Bean
    public Guard<TicketStates, TicketEvents> approvalGuard() {
        return context -> {
            // 这里可以添加审批逻辑，比如检查用户权限
            return true;
        };
    }

    @Bean
    public Action<TicketStates, TicketEvents> logAction() {
        return context -> {
            System.out.println("Transitioning from " + 
                context.getSource().getId() + " to " + 
                context.getTarget().getId());
        };
    }
}
```

## 6. 最佳实践

### 6.1 配置优化建议

1. **合理使用单例与多例**：

   ```java
   // 单例配置 - 适用于全局状态机
   @Bean
   public StateMachine<String, String> globalStateMachine() throws Exception {
       Builder<String, String> builder = StateMachineBuilder.builder();
       // 配置代码...
       return builder.build();
   }

   // 多例配置 - 适用于多个实例
   @Bean
   public StateMachineFactory<String, String> stateMachineFactory() {
       return new StateMachineFactory<String, String>() {
           @Override
           public StateMachine<String, String> getStateMachine(String machineId) {
               // 创建并返回新的状态机实例
               Builder<String, String> builder = StateMachineBuilder.builder();
               // 配置代码...
               return builder.build();
           }
       };
   }
   ```

2. **合理设置线程池大小**：

   ```java
   @Bean
   public TaskExecutor stateMachineTaskExecutor() {
       ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
       // 根据实际业务需求设置合适的线程数
       executor.setCorePoolSize(10);
       executor.setMaxPoolSize(20);
       executor.setQueueCapacity(50);
       executor.setThreadNamePrefix("sm-executor-");
       return executor;
   }
   ```

### 6.2 性能优化策略

1. **状态机池化**：

   ```java
   @Component
   public class StateMachinePool {
       
       private final StateMachineFactory<String, String> factory;
       private final Queue<StateMachine<String, String>> pool = new ConcurrentLinkedQueue<>();
       private final int maxSize = 20;
       
       @Autowired
       public StateMachinePool(StateMachineFactory<String, String> factory) {
           this.factory = factory;
           initializePool();
       }
       
       private void initializePool() {
           for (int i = 0; i < maxSize; i++) {
               StateMachine<String, String> machine = factory.getStateMachine("pooled-" + i);
               machine.start();
               pool.offer(machine);
           }
       }
       
       public StateMachine<String, String> borrowMachine() {
           StateMachine<String, String> machine = pool.poll();
           if (machine == null) {
               machine = factory.getStateMachine("dynamic-" + UUID.randomUUID());
               machine.start();
           }
           return machine;
       }
       
       public void returnMachine(StateMachine<String, String> machine) {
           if (pool.size() < maxSize) {
               pool.offer(machine);
           } else {
               machine.stop();
           }
       }
   }
   ```

2. **异步处理优化**：

   ```java
   @Configuration
   @EnableAsync
   public class AsyncConfig implements AsyncConfigurer {
       
       @Override
       public Executor getAsyncExecutor() {
           ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
           executor.setCorePoolSize(5);
           executor.setMaxPoolSize(10);
           executor.setQueueCapacity(25);
           executor.setThreadNamePrefix("Async-");
           executor.initialize();
           return executor;
       }
   }
   
   @Service
   public class AsyncStateMachineService {
       
       @Async
       public CompletableFuture<Boolean> processAsync(String machineId, String event) {
           // 异步处理状态机事件
           return CompletableFuture.completedFuture(true);
       }
   }
   ```

### 6.3 监控与调试

1. **监控状态机性能**：

   ```java
   @Bean
   public StateMachineMonitor<String, String> stateMachineMonitor(MeterRegistry meterRegistry) {
       return new StateMachineMonitor<String, String>() {
           @Override
           public void transition(StateMachine<String, String> stateMachine, 
                                Transition<String, String> transition, long duration) {
               Timer.builder("statemachine.transition.duration")
                   .tag("source", transition.getSource().getId())
                   .tag("target", transition.getTarget().getId())
                   .register(meterRegistry)
                   .record(duration, TimeUnit.MILLISECONDS);
           }
           
           @Override
           public void action(StateMachine<String, String> stateMachine, 
                             Action<String, String> action, long duration) {
               Timer.builder("statemachine.action.duration")
                   .register(meterRegistry)
                   .record(duration, TimeUnit.MILLISECONDS);
           }
       };
   }
   ```

2. **日志记录配置**：

   ```java
   @Bean
   public StateMachineListener<String, String> loggingListener() {
       return new StateMachineListenerAdapter<String, String>() {
           @Override
           public void eventNotAccepted(Message<String> event) {
               log.warn("Event not accepted: {}", event.getPayload());
           }
           
           @Override
           public void stateMachineError(StateMachine<String, String> stateMachine, Exception exception) {
               log.error("State machine error", exception);
           }
           
           @Override
           public void stateChanged(State<String, String> from, State<String, String> to) {
               log.info("State changed from {} to {}", 
                   from == null ? "none" : from.getId(), 
                   to.getId());
           }
       };
   }
   ```

## 7. 常见问题与解决方案

### 7.1 内存泄漏问题

**问题**：长时间运行的状态机可能导致内存泄漏。

**解决方案**：

```java
@Component
public class StateMachineCleanupService {
    
    private final Map<String, WeakReference<StateMachine<?, ?>>> machines = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    @PostConstruct
    public void init() {
        scheduler.scheduleAtFixedRate(this::cleanup, 1, 1, TimeUnit.HOURS);
    }
    
    public void registerMachine(String id, StateMachine<?, ?> machine) {
        machines.put(id, new WeakReference<>(machine));
    }
    
    private void cleanup() {
        machines.entrySet().removeIf(entry -> {
            StateMachine<?, ?> machine = entry.getValue().get();
            if (machine == null) {
                return true; // 移除已被垃圾回收的机器
            }
            
            // 检查状态机是否长时间处于空闲状态
            long lastActive = machine.getExtendedState().get("lastActive", Long.class);
            if (lastActive != null && 
                System.currentTimeMillis() - lastActive > TimeUnit.HOURS.toMillis(2)) {
                machine.stop();
                return true;
            }
            return false;
        });
    }
    
    @PreDestroy
    public void shutdown() {
        scheduler.shutdown();
    }
}
```

### 7.2 并发访问问题

**问题**：多个线程同时访问同一个状态机可能导致状态不一致。

**解决方案**：

```java
@Service
public class ThreadSafeStateMachineService {
    
    private final StateMachineFactory<String, String> factory;
    private final Map<String, Lock> machineLocks = new ConcurrentHashMap<>();
    
    @Autowired
    public ThreadSafeStateMachineService(StateMachineFactory<String, String> factory) {
        this.factory = factory;
    }
    
    public void processEventThreadSafe(String machineId, String event) {
        Lock lock = machineLocks.computeIfAbsent(machineId, id -> new ReentrantLock());
        
        lock.lock();
        try {
            StateMachine<String, String> machine = factory.getStateMachine(machineId);
            if (!machine.isRunning()) {
                machine.start();
            }
            machine.sendEvent(event);
        } finally {
            lock.unlock();
        }
    }
    
    public void cleanupMachine(String machineId) {
        Lock lock = machineLocks.remove(machineId);
        if (lock != null) {
            StateMachine<String, String> machine = factory.getStateMachine(machineId);
            machine.stop();
        }
    }
}
```

## 8. 总结

Spring Statemachine 的状态机工厂提供了强大而灵活的状态机管理机制。通过合理使用 `@EnableStateMachineFactory`，我们可以：

1. **高效管理多个状态机实例**，避免资源浪费
2. **实现动态状态机创建**，支持复杂的业务流程
3. **统一配置管理**，提高代码的可维护性
4. **优化性能**，通过池化、异步处理等技术手段

在实际应用中，建议根据具体业务需求选择合适的工厂模式，并遵循本文介绍的最佳实践，以确保状态机系统的稳定性、可扩展性和高性能。

通过本文的详细介绍和示例代码，您应该能够熟练掌握 Spring Statemachine 状态机工厂的使用方法，并在实际项目中灵活应用。
