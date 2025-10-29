# Spring Statemachine 状态机事件详解与最佳实践

## 1. 事件基础概念

### 1.1 什么是状态机事件

Spring Statemachine 中的事件（Event）是触发状态转换（Transition）的信号或触发器。事件可以看作是状态机对外部刺激的响应机制，它们驱动状态机从一个状态转移到另一个状态。

**事件的核心特性：**

- 事件是状态转换的触发器
- 事件可以携带数据（通过 Message 对象）
- 事件可以被接受、拒绝或延迟处理
- 事件类型可以是枚举或字符串

### 1.2 事件类型

Spring Statemachine 支持两种主要的事件类型：

```java
// 1. 枚举类型事件（推荐，类型安全）
public enum OrderEvents {
    PLACE_ORDER,
    PAY,
    CANCEL,
    FULFILL,
    REFUND
}

// 2. 字符串类型事件（灵活，但需要手动管理）
public class StringEvents {
    public static final String PLACE_ORDER = "PLACE_ORDER";
    public static final String PAY = "PAY";
    public static final String CANCEL = "CANCEL";
}
```

## 2. 事件发送机制

### 2.1 基本事件发送

```java
// 发送简单事件（无负载数据）
stateMachine.sendEvent(OrderEvents.PLACE_ORDER);

// 发送带消息的事件（可包含负载和头信息）
Message<OrderEvents> message = MessageBuilder
    .withPayload(OrderEvents.PAY)
    .setHeader("orderId", "12345")
    .setHeader("amount", 299.99)
    .build();
stateMachine.sendEvent(message);
```

### 2.2 同步与异步事件发送

```java
// 同步发送 - 阻塞直到事件处理完成
stateMachine.sendEvent(OrderEvents.PLACE_ORDER);

// 异步发送 - 立即返回，不等待处理完成
stateMachine.sendEventAsync(OrderEvents.PLACE_ORDER);

// 带超时的同步发送
try {
    boolean accepted = stateMachine.sendEvent(OrderEvents.PAY, 5000); // 5秒超时
    if (!accepted) {
        log.warn("Event was not accepted within timeout");
    }
} catch (Exception e) {
    log.error("Error sending event", e);
}
```

### 2.3 事件发送最佳实践

```java
@Service
public class OrderEventService {

    private final StateMachine<OrderStates, OrderEvents> stateMachine;
    private final TaskScheduler taskScheduler;

    public OrderEventService(StateMachine<OrderStates, OrderEvents> stateMachine,
                           TaskScheduler taskScheduler) {
        this.stateMachine = stateMachine;
        this.taskScheduler = taskScheduler;
    }

    // 安全的同步事件发送
    public boolean sendEventSafely(OrderEvents event, Map<String, Object> headers) {
        try {
            if (stateMachine.getState() == null || !stateMachine.isRunning()) {
                log.warn("State machine is not ready");
                return false;
            }

            Message<OrderEvents> message = MessageBuilder
                .withPayload(event)
                .copyHeaders(headers)
                .build();

            return stateMachine.sendEvent(message);
        } catch (Exception e) {
            log.error("Failed to send event: {}", event, e);
            return false;
        }
    }

    // 带重试机制的事件发送
    public void sendEventWithRetry(OrderEvents event, Map<String, Object> headers,
                                  int maxAttempts, long delayMs) {
        AtomicInteger attempts = new AtomicInteger(0);

        taskScheduler.schedule(() -> {
            if (attempts.incrementAndGet() > maxAttempts) {
                log.error("Failed to send event after {} attempts", maxAttempts);
                return;
            }

            boolean accepted = sendEventSafely(event, headers);
            if (!accepted && attempts.get() < maxAttempts) {
                log.info("Event not accepted, retrying in {} ms (attempt {}/{})",
                        delayMs, attempts.get(), maxAttempts);
                taskScheduler.schedule(() ->
                    sendEventWithRetry(event, headers, maxAttempts, delayMs),
                    new Date(System.currentTimeMillis() + delayMs));
            }
        }, new Date(System.currentTimeMillis()));
    }
}
```

## 3. 事件处理与监听

### 3.1 事件监听器

```java
@Component
public class OrderEventListeners {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListeners.class);

    // 监听所有事件
    @EventListener
    public void onStateMachineEvent(StateMachineEvent<OrderStates, OrderEvents> event) {
        log.debug("Received state machine event: {}", event);
    }

    // 监听特定事件
    @EventListener
    public void onOrderPlaced(OnTransitionEvent<OrderStates, OrderEvents> event) {
        if (event.getTransition() != null &&
            event.getTransition().getTarget().getId() == OrderStates.PROCESSING) {
            log.info("Order transitioned to processing state");
        }
    }

    // 监听未接受的事件
    @EventListener
    public void onEventNotAccepted(OnEventNotAcceptedEvent<OrderEvents> event) {
        log.warn("Event was not accepted: {}", event.getEvent());

        // 可以在这里实现事件重试或补偿逻辑
        Message<OrderEvents> message = event.getMessage();
        if (message != null) {
            Object orderId = message.getHeaders().get("orderId");
            log.info("Event for order {} was not accepted", orderId);
        }
    }
}
```

### 3.2 状态机事件监听器

```java
@Component
public class OrderStateMachineListener extends StateMachineListenerAdapter<OrderStates, OrderEvents> {

    private static final Logger log = LoggerFactory.getLogger(OrderStateMachineListener.class);

    @Override
    public void eventNotAccepted(Message<OrderEvents> event) {
        log.warn("Event not accepted: {}", event.getPayload());
        // 这里可以添加事件重试或报警逻辑
    }

    @Override
    public void stateContext(StateContext<OrderStates, OrderEvents> stateContext) {
        // 详细的事件处理上下文信息
        Stage stage = stateContext.getStage();
        if (stage == Stage.TRANSITION_START) {
            log.debug("Transition starting for event: {}",
                     stateContext.getMessage().getPayload());
        } else if (stage == Stage.TRANSITION_END) {
            log.debug("Transition completed for event: {}",
                     stateContext.getMessage().getPayload());
        }
    }

    @Override
    public void stateMachineError(StateMachine<OrderStates, OrderEvents> stateMachine,
                                 Exception exception) {
        log.error("State machine error occurred", exception);
        // 这里可以添加错误处理和恢复逻辑
    }
}
```

## 4. 事件延迟与优先级

### 4.1 延迟事件处理

```java
@Configuration
@EnableStateMachine
public class OrderStateMachineConfig extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states)
            throws Exception {
        states
            .withStates()
                .initial(OrderStates.NEW)
                .state(OrderStates.PROCESSING)
                .state(OrderStates.SHIPPED)
                .state(OrderStates.DELIVERED)
                .state(OrderStates.CANCELLED)
            .and()
            .withStates()
                .parent(OrderStates.PROCESSING)
                .initial(OrderStates.PAYMENT_PENDING)
                .state(OrderStates.PAYMENT_PENDING, null, context -> {
                    // 在退出PAYMENT_PENDING状态时检查是否超时
                    Long timestamp = context.getExtendedState().get("paymentStartTime", Long.class);
                    if (timestamp != null &&
                        System.currentTimeMillis() - timestamp > 3600000) { // 1小时
                        log.warn("Payment pending for too long, cancelling order");
                        context.getStateMachine().sendEvent(OrderEvents.CANCEL);
                    }
                })
                .state(OrderStates.PAYMENT_RECEIVED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions)
            throws Exception {
        transitions
            .withExternal()
                .source(OrderStates.NEW)
                .target(OrderStates.PAYMENT_PENDING)
                .event(OrderEvents.PLACE_ORDER)
                .action(context -> {
                    // 记录支付开始时间
                    context.getExtendedState().getVariables().put(
                        "paymentStartTime", System.currentTimeMillis());
                });
    }
}
```

### 4.2 事件优先级处理

```java
@Configuration
@EnableStateMachine
public class PriorityStateMachineConfig extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<OrderStates, OrderEvents> config)
            throws Exception {
        config
            .withConfiguration()
                .taskExecutor(taskExecutor())
                .taskScheduler(taskScheduler());
    }

    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("sm-event-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(3);
        scheduler.setThreadNamePrefix("sm-scheduler-");
        scheduler.initialize();
        return scheduler;
    }

    // 优先级事件拦截器
    @Bean
    public StateMachineInterceptor<OrderStates, OrderEvents> priorityInterceptor() {
        return new StateMachineInterceptorAdapter<OrderStates, OrderEvents>() {
            @Override
            public Message<OrderEvents> preEvent(Message<OrderEvents> message,
                                               StateMachine<OrderStates, OrderEvents> stateMachine) {
                // 根据消息头中的优先级处理事件
                Integer priority = message.getHeaders().get("priority", Integer.class);
                if (priority != null && priority > 5) {
                    log.info("Processing high priority event: {}", message.getPayload());
                }
                return message;
            }
        };
    }
}
```

## 5. 事件驱动的业务逻辑

### 5.1 使用 @WithStateMachine 注解

```java
@Component
@WithStateMachine(name = "orderStateMachine")
public class OrderEventDrivenService {

    private static final Logger log = LoggerFactory.getLogger(OrderEventDrivenService.class);

    @OnTransition(target = "PROCESSING")
    public void onOrderProcessing(StateContext<OrderStates, OrderEvents> context) {
        Message<OrderEvents> message = context.getMessage();
        String orderId = (String) message.getHeaders().get("orderId");
        log.info("Order {} is now processing", orderId);

        // 启动订单处理流程
        startOrderProcessing(orderId, context.getExtendedState().getVariables());
    }

    @OnTransition(source = "PROCESSING", target = "SHIPPED")
    public void onOrderShipped(StateContext<OrderStates, OrderEvents> context) {
        String orderId = (String) context.getMessage().getHeaders().get("orderId");
        log.info("Order {} has been shipped", orderId);

        // 发送发货通知
        sendShippingNotification(orderId);
    }

    @OnEventNotAccepted
    public void onEventNotAccepted(StateContext<OrderStates, OrderEvents> context) {
        log.warn("Event {} was not accepted in state {}",
                 context.getEvent(),
                 context.getSource().getId());

        // 可以实现事件重试或补偿逻辑
        handleRejectedEvent(context);
    }

    private void startOrderProcessing(String orderId, Map<Object, Object> variables) {
        // 实现订单处理逻辑
    }

    private void sendShippingNotification(String orderId) {
        // 实现发货通知逻辑
    }

    private void handleRejectedEvent(StateContext<OrderStates, OrderEvents> context) {
        // 处理被拒绝的事件
    }
}
```

### 5.2 复杂事件处理模式

```java
@Component
public class ComplexEventProcessor {

    private final StateMachine<OrderStates, OrderEvents> stateMachine;
    private final EventPatternDetector patternDetector;

    public ComplexEventProcessor(StateMachine<OrderStates, OrderEvents> stateMachine,
                                EventPatternDetector patternDetector) {
        this.stateMachine = stateMachine;
        this.patternDetector = patternDetector;
    }

    // 处理事件序列
    public void processEventSequence(List<Message<OrderEvents>> events) {
        events.forEach(event -> {
            // 检测事件模式
            if (patternDetector.detectFraudPattern(event)) {
                log.warn("Potential fraud detected in event sequence");
                stateMachine.sendEvent(OrderEvents.FLAG_FOR_REVIEW);
                return;
            }

            // 正常处理事件
            boolean accepted = stateMachine.sendEvent(event);
            if (!accepted) {
                handleRejectedEvent(event);
            }
        });
    }

    // 处理事件聚合
    public void processEventAggregation(Map<String, List<Message<OrderEvents>>> eventGroups) {
        eventGroups.forEach((groupId, groupEvents) -> {
            log.info("Processing event group: {} with {} events", groupId, groupEvents.size());

            // 按优先级排序事件
            groupEvents.sort(Comparator.comparingInt(
                e -> e.getHeaders().getOrDefault("priority", 0)));

            // 处理组内事件
            groupEvents.forEach(event -> {
                try {
                    stateMachine.sendEvent(event);
                } catch (Exception e) {
                    log.error("Failed to process event in group {}", groupId, e);
                }
            });
        });
    }
}

@Component
class EventPatternDetector {
    public boolean detectFraudPattern(Message<OrderEvents> event) {
        // 实现复杂的事件模式检测逻辑
        return false;
    }
}
```

## 6. 事件错误处理与恢复

### 6.1 事件异常处理策略

```java
@Configuration
@EnableStateMachine
public class ErrorHandlingConfig extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<OrderStates, OrderEvents> config)
            throws Exception {
        config
            .withConfiguration()
                .listener(stateMachineListener())
                .and()
            .withPersistence()
                .runtimePersister(stateMachineRuntimePersister());
    }

    @Bean
    public StateMachineListener<OrderStates, OrderEvents> stateMachineListener() {
        return new StateMachineListenerAdapter<OrderStates, OrderEvents>() {
            @Override
            public void stateMachineError(StateMachine<OrderStates, OrderEvents> stateMachine,
                                         Exception exception) {
                log.error("State machine error", exception);
                handleStateMachineError(stateMachine, exception);
            }

            @Override
            public void eventNotAccepted(Message<OrderEvents> event) {
                log.warn("Event not accepted: {}", event.getPayload());
                handleEventNotAccepted(event);
            }
        };
    }

    @Bean
    public StateMachineRuntimePersister<OrderStates, OrderEvents, String> stateMachineRuntimePersister() {
        return new JpaPersistingStateMachineInterceptor<>(jpaStateMachineRepository());
    }

    private void handleStateMachineError(StateMachine<OrderStates, OrderEvents> stateMachine,
                                        Exception exception) {
        // 实现状态机错误处理逻辑
        try {
            // 尝试恢复状态机
            stateMachine.stop();
            stateMachine.start();
            log.info("State machine recovered from error");
        } catch (Exception e) {
            log.error("Failed to recover state machine", e);
        }
    }

    private void handleEventNotAccepted(Message<OrderEvents> event) {
        // 实现事件拒绝处理逻辑
        Object orderId = event.getHeaders().get("orderId");
        if (orderId != null) {
            log.info("Scheduling retry for order {}", orderId);
            scheduleEventRetry(event, 5000); // 5秒后重试
        }
    }

    private void scheduleEventRetry(Message<OrderEvents> event, long delayMs) {
        // 实现事件重试调度
    }
}
```

### 6.2 事务性事件处理

```java
@Service
@Transactional
public class TransactionalEventService {

    private final StateMachine<OrderStates, OrderEvents> stateMachine;
    private final PlatformTransactionManager transactionManager;
    private final OrderRepository orderRepository;

    public TransactionalEventService(StateMachine<OrderStates, OrderEvents> stateMachine,
                                    PlatformTransactionManager transactionManager,
                                    OrderRepository orderRepository) {
        this.stateMachine = stateMachine;
        this.transactionManager = transactionManager;
        this.orderRepository = orderRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processOrderEventWithTransaction(OrderEvents event, String orderId,
                                               Map<String, Object> headers) {
        DefaultTransactionDefinition definition = new DefaultTransactionDefinition();
        definition.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        TransactionStatus status = transactionManager.getTransaction(definition);

        try {
            // 更新订单状态
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

            // 发送状态机事件
            Message<OrderEvents> message = MessageBuilder
                .withPayload(event)
                .copyHeaders(headers)
                .setHeader("orderEntity", order)
                .build();

            boolean accepted = stateMachine.sendEvent(message);

            if (accepted) {
                transactionManager.commit(status);
                log.info("Successfully processed event {} for order {}", event, orderId);
            } else {
                transactionManager.rollback(status);
                log.warn("Event {} was not accepted for order {}", event, orderId);
                throw new EventRejectedException("Event was not accepted by state machine");
            }

        } catch (Exception e) {
            transactionManager.rollback(status);
            log.error("Failed to process event {} for order {}", event, orderId, e);
            throw new EventProcessingException("Failed to process event", e);
        }
    }

    // 补偿性事务处理
    public void handleCompensatingEvent(OrderEvents originalEvent, String orderId,
                                      Map<String, Object> headers, Exception failure) {
        log.warn("Processing compensating event for failed event: {}", originalEvent);

        // 根据失败类型决定补偿动作
        if (failure instanceof PaymentFailedException) {
            stateMachine.sendEvent(OrderEvents.PAYMENT_FAILED);
        } else if (failure instanceof InventoryException) {
            stateMachine.sendEvent(OrderEvents.OUT_OF_STOCK);
        } else {
            stateMachine.sendEvent(OrderEvents.SYSTEM_ERROR);
        }
    }
}
```

## 7. 测试事件处理

### 7.1 单元测试事件处理

```java
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class OrderEventHandlingTest {

    @Autowired
    private StateMachineFactory<OrderStates, OrderEvents> stateMachineFactory;

    @Autowired
    private OrderEventDrivenService orderEventService;

    @Mock
    private NotificationService notificationService;

    @Test
    public void testOrderPlacedEvent() {
        // 创建状态机实例
        StateMachine<OrderStates, OrderEvents> stateMachine = stateMachineFactory.getStateMachine();
        stateMachine.start();

        // 准备测试数据
        Map<String, Object> headers = new HashMap<>();
        headers.put("orderId", "test-order-123");
        headers.put("customerId", "customer-456");
        headers.put("amount", 150.00);

        // 发送事件
        boolean accepted = stateMachine.sendEvent(MessageBuilder
            .withPayload(OrderEvents.PLACE_ORDER)
            .copyHeaders(headers)
            .build());

        // 验证结果
        assertTrue("Event should be accepted", accepted);
        assertEquals("Should be in PROCESSING state",
                     OrderStates.PROCESSING, stateMachine.getState().getId());

        // 验证扩展状态变量
        assertNotNull("Payment start time should be set",
                     stateMachine.getExtendedState().get("paymentStartTime"));
    }

    @Test
    public void testEventNotAccepted() {
        StateMachine<OrderStates, OrderEvents> stateMachine = stateMachineFactory.getStateMachine();
        stateMachine.start();

        // 发送无效事件（例如：在NEW状态下发送SHIP事件）
        boolean accepted = stateMachine.sendEvent(OrderEvents.SHIP);

        assertFalse("Event should not be accepted", accepted);
    }

    @Test
    public void testEventWithRetry() {
        StateMachine<OrderStates, OrderEvents> stateMachine = stateMachineFactory.getStateMachine();
        stateMachine.start();

        // 第一次发送可能失败的事件
        boolean firstAttempt = stateMachine.sendEvent(OrderEvents.PAY);

        if (!firstAttempt) {
            // 等待后重试
            await().atMost(5, TimeUnit.SECONDS)
                   .until(() -> stateMachine.sendEvent(OrderEvents.PAY));
        }

        assertEquals("Should be in PAYMENT_RECEIVED state",
                     OrderStates.PAYMENT_RECEIVED, stateMachine.getState().getId());
    }
}
```

### 7.2 集成测试事件流

```java
@SpringBootTest
@ActiveProfiles("test")
public class OrderEventFlowIntegrationTest {

    @Autowired
    private StateMachineService<OrderStates, OrderEvents> stateMachineService;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    public void testCompleteOrderWorkflow() {
        // 创建测试订单
        Order order = new Order("test-order-001", 299.99);
        orderRepository.save(order);

        // 获取状态机
        StateMachine<OrderStates, OrderEvents> stateMachine =
            stateMachineService.acquireStateMachine("test-order-001");

        try {
            // 执行完整的事件流
            executeEventFlow(stateMachine, order);

            // 验证最终状态
            assertEquals("Order should be delivered",
                         OrderStates.DELIVERED, stateMachine.getState().getId());

        } finally {
            stateMachineService.releaseStateMachine("test-order-001");
        }
    }

    private void executeEventFlow(StateMachine<OrderStates, OrderEvents> stateMachine, Order order) {
        // 1. 下单
        sendEvent(stateMachine, OrderEvents.PLACE_ORDER, order.getId());
        assertEquals(OrderStates.PAYMENT_PENDING, stateMachine.getState().getId());

        // 2. 支付
        sendEvent(stateMachine, OrderEvents.PAY, order.getId());
        assertEquals(OrderStates.PAYMENT_RECEIVED, stateMachine.getState().getId());

        // 3. 发货
        sendEvent(stateMachine, OrderEvents.SHIP, order.getId());
        assertEquals(OrderStates.SHIPPED, stateMachine.getState().getId());

        // 4. 送达
        sendEvent(stateMachine, OrderEvents.DELIVER, order.getId());
        assertEquals(OrderStates.DELIVERED, stateMachine.getState().getId());
    }

    private void sendEvent(StateMachine<OrderStates, OrderEvents> stateMachine,
                          OrderEvents event, String orderId) {
        Message<OrderEvents> message = MessageBuilder
            .withPayload(event)
            .setHeader("orderId", orderId)
            .build();

        boolean accepted = stateMachine.sendEvent(message);
        assertTrue("Event " + event + " should be accepted", accepted);

        // 等待状态转换完成
        await().atMost(1, TimeUnit.SECONDS)
               .until(() -> stateMachine.getState() != null);
    }
}
```

## 8. 性能优化与最佳实践

### 8.1 事件处理性能优化

```java
@Configuration
@EnableStateMachine
public class PerformanceOptimizedConfig extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineConfigurationConfigurer<OrderStates, OrderEvents> config)
            throws Exception {
        config
            .withConfiguration()
                .taskExecutor(optimizedTaskExecutor())
                .taskScheduler(optimizedTaskScheduler())
                .and()
            .withMonitoring()
                .monitor(performanceMonitor());
    }

    @Bean
    public TaskExecutor optimizedTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(1000);
        executor.setKeepAliveSeconds(30);
        executor.setThreadNamePrefix("sm-event-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    @Bean
    public TaskScheduler optimizedTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("sm-scheduler-");
        scheduler.setErrorHandler(throwable ->
            log.error("Scheduled task failed", throwable));
        scheduler.initialize();
        return scheduler;
    }

    @Bean
    public StateMachineMonitor<OrderStates, OrderEvents> performanceMonitor() {
        return new StateMachineMonitorAdapter<OrderStates, OrderEvents>() {
            @Override
            public void transition(StateMachine<OrderStates, OrderEvents> stateMachine,
                                  Transition<OrderStates, OrderEvents> transition,
                                  long duration) {
                if (duration > 100) { // 超过100ms的转换
                    log.warn("Slow transition detected: {}ms for {}", duration, transition);
                    monitorSlowTransition(transition, duration);
                }
            }

            @Override
            public void action(StateMachine<OrderStates, OrderEvents> stateMachine,
                             Action<OrderStates, OrderEvents> action,
                             long duration) {
                if (duration > 50) { // 超过50ms的动作
                    log.warn("Slow action detected: {}ms for {}", duration, action);
                    monitorSlowAction(action, duration);
                }
            }
        };
    }

    // 事件批处理组件
    @Component
    public class EventBatchProcessor {

        private final List<Message<OrderEvents>> eventBatch = new ArrayList<>();
        private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        private final StateMachine<OrderStates, OrderEvents> stateMachine;

        public EventBatchProcessor(StateMachine<OrderStates, OrderEvents> stateMachine) {
            this.stateMachine = stateMachine;
            // 每100ms处理一批事件
            scheduler.scheduleAtFixedRate(this::processBatch, 100, 100, TimeUnit.MILLISECONDS);
        }

        public void addToBatch(Message<OrderEvents> event) {
            synchronized (eventBatch) {
                eventBatch.add(event);
            }
        }

        private void processBatch() {
            List<Message<OrderEvents>> currentBatch;
            synchronized (eventBatch) {
                if (eventBatch.isEmpty()) {
                    return;
                }
                currentBatch = new ArrayList<>(eventBatch);
                eventBatch.clear();
            }

            // 按优先级排序
            currentBatch.sort(Comparator.comparingInt(
                e -> e.getHeaders().getOrDefault("priority", 0)));
```

## 8.2 事件处理最佳实践

```java
@Component
public class EventProcessingBestPractices {

    private static final Logger log = LoggerFactory.getLogger(EventProcessingBestPractices.class);

    private final StateMachine<OrderStates, OrderEvents> stateMachine;
    private final EventRateLimiter rateLimiter;
    private final EventValidator eventValidator;

    public EventProcessingBestPractices(StateMachine<OrderStates, OrderEvents> stateMachine,
                                       EventRateLimiter rateLimiter,
                                       EventValidator eventValidator) {
        this.stateMachine = stateMachine;
        this.rateLimiter = rateLimiter;
        this.eventValidator = eventValidator;
    }

    // 1. 事件验证和过滤
    public boolean processEventSafely(Message<OrderEvents> event) {
        try {
            // 验证事件有效性
            if (!eventValidator.validate(event)) {
                log.warn("Invalid event received: {}", event.getPayload());
                return false;
            }

            // 检查速率限制
            if (!rateLimiter.tryAcquire(event.getPayload())) {
                log.warn("Rate limit exceeded for event: {}", event.getPayload());
                scheduleDelayedProcessing(event);
                return false;
            }

            // 检查状态机是否就绪
            if (!isStateMachineReady()) {
                log.warn("State machine is not ready, queuing event");
                queueEventForLaterProcessing(event);
                return false;
            }

            // 发送事件
            return stateMachine.sendEvent(event);

        } catch (Exception e) {
            log.error("Failed to process event: {}", event.getPayload(), e);
            handleEventProcessingFailure(event, e);
            return false;
        }
    }

    // 2. 批量事件处理优化
    public void processEventsInBatch(List<Message<OrderEvents>> events) {
        if (events.isEmpty()) {
            return;
        }

        // 按类型分组处理
        Map<OrderEvents, List<Message<OrderEvents>>> eventsByType = events.stream()
            .collect(Collectors.groupingBy(Message::getPayload));

        eventsByType.forEach((eventType, eventList) -> {
            // 处理高优先级事件 first
            if (isHighPriorityEvent(eventType)) {
                eventList.forEach(this::processHighPriorityEvent);
            } else {
                // 批量处理普通事件
                processNormalEventsInBatch(eventList);
            }
        });
    }

    // 3. 事件去重处理
    public void processWithDeduplication(Message<OrderEvents> event) {
        String eventId = generateEventId(event);
        if (isDuplicateEvent(eventId)) {
            log.info("Duplicate event detected, ignoring: {}", eventId);
            return;
        }

        markEventProcessed(eventId);
        stateMachine.sendEvent(event);
    }

    // 4. 事件顺序保证
    public void processInOrder(List<Message<OrderEvents>> events) {
        events.stream()
            .sorted(Comparator.comparingLong(e ->
                e.getHeaders().get("timestamp", Long.class)))
            .forEachOrdered(event -> {
                try {
                    stateMachine.sendEvent(event);
                } catch (Exception e) {
                    log.error("Failed to process ordered event", e);
                }
            });
    }

    private boolean isStateMachineReady() {
        return stateMachine != null &&
               stateMachine.isRunning() &&
               !stateMachine.hasStateMachineError();
    }

    private void scheduleDelayedProcessing(Message<OrderEvents> event) {
        // 实现延迟处理逻辑
    }

    private void queueEventForLaterProcessing(Message<OrderEvents> event) {
        // 实现事件队列逻辑
    }

    private void handleEventProcessingFailure(Message<OrderEvents> event, Exception e) {
        // 实现失败处理逻辑
    }

    private boolean isHighPriorityEvent(OrderEvents eventType) {
        // 实现优先级判断逻辑
        return false;
    }

    private void processHighPriorityEvent(Message<OrderEvents> event) {
        // 实现高优先级事件处理
    }

    private void processNormalEventsInBatch(List<Message<OrderEvents>> events) {
        // 实现批量处理逻辑
    }

    private String generateEventId(Message<OrderEvents> event) {
        // 生成唯一事件ID
        return UUID.randomUUID().toString();
    }

    private boolean isDuplicateEvent(String eventId) {
        // 检查事件是否重复
        return false;
    }

    private void markEventProcessed(String eventId) {
        // 标记事件已处理
    }
}

@Component
class EventRateLimiter {
    private final Map<OrderEvents, RateLimiter> limiters = new ConcurrentHashMap<>();

    public boolean tryAcquire(OrderEvents eventType) {
        RateLimiter limiter = limiters.computeIfAbsent(eventType,
            et -> RateLimiter.create(getRateLimitForEvent(et)));
        return limiter.tryAcquire();
    }

    private double getRateLimitForEvent(OrderEvents eventType) {
        // 根据事件类型返回不同的速率限制
        return 10.0; // 每秒10个事件
    }
}

@Component
class EventValidator {
    public boolean validate(Message<OrderEvents> event) {
        // 实现事件验证逻辑
        return event != null &&
               event.getPayload() != null &&
               event.getHeaders().containsKey("orderId");
    }
}
```

## 9. 监控和诊断

### 9.1 事件处理监控

```java
@Component
@EnableScheduling
public class EventProcessingMonitor {

    private static final Logger log = LoggerFactory.getLogger(EventProcessingMonitor.class);

    private final StateMachine<OrderStates, OrderEvents> stateMachine;
    private final MeterRegistry meterRegistry;
    private final Map<OrderEvents, Counter> eventCounters = new ConcurrentHashMap<>();
    private final Map<String, Timer> processingTimers = new ConcurrentHashMap<>();

    public EventProcessingMonitor(StateMachine<OrderStates, OrderEvents> stateMachine,
                                 MeterRegistry meterRegistry) {
        this.stateMachine = stateMachine;
        this.meterRegistry = meterRegistry;
        initializeMetrics();
    }

    @EventListener
    public void onStateMachineEvent(StateMachineEvent<OrderStates, OrderEvents> event) {
        // 记录事件处理指标
        if (event instanceof OnTransitionStartEvent) {
            recordTransitionStart((OnTransitionStartEvent<OrderStates, OrderEvents>) event);
        } else if (event instanceof OnTransitionEndEvent) {
            recordTransitionEnd((OnTransitionEndEvent<OrderStates, OrderEvents>) event);
        } else if (event instanceof OnEventNotAcceptedEvent) {
            recordEventNotAccepted((OnEventNotAcceptedEvent<OrderEvents>) event);
        }
    }

    @Scheduled(fixedRate = 60000) // 每分钟报告一次
    public void reportMetrics() {
        log.info("=== Event Processing Metrics Report ===");
        log.info("Current state: {}", stateMachine.getState());
        log.info("Events processed in last minute:");

        eventCounters.forEach((eventType, counter) -> {
            double count = counter.count();
            if (count > 0) {
                log.info("  {}: {}", eventType, count);
            }
        });

        log.info("=== End Metrics Report ===");
    }

    private void initializeMetrics() {
        // 初始化所有事件类型的计数器
        for (OrderEvents event : OrderEvents.values()) {
            eventCounters.put(event, meterRegistry.counter("events.processed", "type", event.name()));
        }

        // 初始化处理时间计时器
        processingTimers.put("transition", meterRegistry.timer("processing.time.transition"));
        processingTimers.put("action", meterRegistry.timer("processing.time.action"));
    }

    private void recordTransitionStart(OnTransitionStartEvent<OrderStates, OrderEvents> event) {
        String transitionKey = event.getTransition().getSource().getId() +
                              "_" + event.getTransition().getTarget().getId();

        Timer.Sample sample = Timer.start(meterRegistry);
        event.getStateMachine().getExtendedState().getVariables()
            .put("transitionStartSample:" + transitionKey, sample);
    }

    private void recordTransitionEnd(OnTransitionEndEvent<OrderStates, OrderEvents> event) {
        String transitionKey = event.getTransition().getSource().getId() +
                              "_" + event.getTransition().getTarget().getId();

        Timer.Sample sample = (Timer.Sample) event.getStateMachine()
            .getExtendedState().getVariables().remove("transitionStartSample:" + transitionKey);

        if (sample != null) {
            sample.stop(processingTimers.get("transition"));
        }
    }

    private void recordEventNotAccepted(OnEventNotAcceptedEvent<OrderEvents> event) {
        meterRegistry.counter("events.rejected", "type", event.getEvent().name()).increment();
        log.warn("Event rejected: {}", event.getEvent());
    }

    // 健康检查端点
    @Endpoint(id = "eventprocessor")
    public class EventProcessorHealthEndpoint {

        @ReadOperation
        public Health health() {
            boolean stateMachineHealthy = stateMachine != null &&
                                        stateMachine.isRunning() &&
                                        !stateMachine.hasStateMachineError();

            Map<String, Object> details = new HashMap<>();
            details.put("state", stateMachine.getState());
            details.put("running", stateMachine.isRunning());
            details.put("hasError", stateMachine.hasStateMachineError());

            return Health.status(stateMachineHealthy ? Status.UP : Status.DOWN)
                       .withDetails(details)
                       .build();
        }
    }
}
```

### 9.2 分布式追踪集成

```java
@Configuration
public class TracingConfiguration {

    @Bean
    public StateMachineTracer<OrderStates, OrderEvents> stateMachineTracer(Tracer tracer) {
        return new StateMachineTracer<OrderStates, OrderEvents>() {
            @Override
            public Span startTransitionSpan(StateContext<OrderStates, OrderEvents> context) {
                Message<OrderEvents> message = context.getMessage();
                Tracer.SpanBuilder spanBuilder = tracer.buildSpan("statemachine.transition")
                    .withTag("event", message.getPayload().name())
                    .withTag("source", context.getSource().getId().name())
                    .withTag("target", context.getTarget().getId().name());

                // 传播追踪上下文
                if (message.getHeaders().containsKey("traceId")) {
                    spanBuilder.asChildOf((SpanContext) message.getHeaders().get("traceId"));
                }

                return spanBuilder.start();
            }

            @Override
            public void endTransitionSpan(Span span, StateContext<OrderStates, OrderEvents> context) {
                span.finish();
            }
        };
    }

    @Bean
    public StateMachineInterceptor<OrderStates, OrderEvents> tracingInterceptor(Tracer tracer) {
        return new StateMachineInterceptorAdapter<OrderStates, OrderEvents>() {
            @Override
            public Message<OrderEvents> preEvent(Message<OrderEvents> message,
                                               StateMachine<OrderStates, OrderEvents> stateMachine) {
                // 从消息中提取或创建追踪上下文
                if (!message.getHeaders().containsKey("traceId")) {
                    Span span = tracer.buildSpan("statemachine.event")
                        .withTag("event", message.getPayload().name())
                        .start();

                    return MessageBuilder.fromMessage(message)
                        .setHeader("traceId", span.context())
                        .build();
                }
                return message;
            }
        };
    }
}
```

## 10. 实战案例：电商订单处理系统

### 10.1 完整订单状态机配置

```java
@Configuration
@EnableStateMachine
public class OrderStateMachineConfiguration extends StateMachineConfigurerAdapter<OrderStates, OrderEvents> {

    @Override
    public void configure(StateMachineStateConfigurer<OrderStates, OrderEvents> states)
            throws Exception {
        states
            .withStates()
                .initial(OrderStates.NEW)
                .state(OrderStates.VALIDATING)
                .state(OrderStates.PAYMENT_PENDING)
                .state(OrderStates.PAYMENT_PROCESSING)
                .state(OrderStates.PAYMENT_RECEIVED)
                .state(OrderStates.PAYMENT_FAILED)
                .state(OrderStates.INVENTORY_CHECKING)
                .state(OrderStates.INVENTORY_RESERVED)
                .state(OrderStates.INVENTORY_UNAVAILABLE)
                .state(OrderStates.SHIPPING)
                .state(OrderStates.SHIPPED)
                .state(OrderStates.DELIVERED)
                .state(OrderStates.CANCELLED)
                .state(OrderStates.REFUNDING)
                .state(OrderStates.REFUNDED)
                .end(OrderStates.COMPLETED)
            .and()
            .withStates()
                .parent(OrderStates.PAYMENT_PENDING)
                .initial(OrderStates.AWAITING_PAYMENT)
                .state(OrderStates.PAYMENT_TIMEOUT);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<OrderStates, OrderEvents> transitions)
            throws Exception {
        transitions
            // 订单创建流程
            .withExternal()
                .source(OrderStates.NEW)
                .target(OrderStates.VALIDATING)
                .event(OrderEvents.PLACE_ORDER)
                .action(validateOrderAction())
            .and()
            .withExternal()
                .source(OrderStates.VALIDATING)
                .target(OrderStates.PAYMENT_PENDING)
                .action(transitionToPaymentAction())
            .and()
            // 支付流程
            .withExternal()
                .source(OrderStates.AWAITING_PAYMENT)
                .target(OrderStates.PAYMENT_PROCESSING)
                .event(OrderEvents.INITIATE_PAYMENT)
                .action(initiatePaymentAction())
            .and()
            .withExternal()
                .source(OrderStates.PAYMENT_PROCESSING)
                .target(OrderStates.PAYMENT_RECEIVED)
                .event(OrderEvents.PAYMENT_SUCCESS)
                .action(paymentSuccessAction())
            .and()
            .withExternal()
                .source(OrderStates.PAYMENT_PROCESSING)
                .target(OrderStates.PAYMENT_FAILED)
                .event(OrderEvents.PAYMENT_FAILED)
                .action(paymentFailedAction())
            .and()
            // 库存流程
            .withExternal()
                .source(OrderStates.PAYMENT_RECEIVED)
                .target(OrderStates.INVENTORY_CHECKING)
                .action(checkInventoryAction())
            .and()
            .withExternal()
                .source(OrderStates.INVENTORY_CHECKING)
                .target(OrderStates.INVENTORY_RESERVED)
                .event(OrderEvents.INVENTORY_AVAILABLE)
                .action(reserveInventoryAction())
            .and()
            .withExternal()
                .source(OrderStates.INVENTORY_CHECKING)
                .target(OrderStates.INVENTORY_UNAVAILABLE)
                .event(OrderEvents.INVENTORY_UNAVAILABLE)
                .action(handleInventoryShortageAction())
            .and()
            // 发货流程
            .withExternal()
                .source(OrderStates.INVENTORY_RESERVED)
                .target(OrderStates.SHIPPING)
                .event(OrderEvents.PREPARE_SHIPMENT)
                .action(prepareShipmentAction())
            .and()
            .withExternal()
                .source(OrderStates.SHIPPING)
                .target(OrderStates.SHIPPED)
                .event(OrderEvents.SHIP)
                .action(shipOrderAction())
            .and()
            .withExternal()
                .source(OrderStates.SHIPPED)
                .target(OrderStates.DELIVERED)
                .event(OrderEvents.DELIVER)
                .action(deliverOrderAction())
            .and()
            // 完成流程
            .withExternal()
                .source(OrderStates.DELIVERED)
                .target(OrderStates.COMPLETED)
                .action(completeOrderAction())
            .and()
            // 取消和退款流程
            .withExternal()
                .source(OrderStates.PAYMENT_PENDING)
                .target(OrderStates.CANCELLED)
                .event(OrderEvents.CANCEL_ORDER)
                .action(cancelOrderAction())
            .and()
            .withExternal()
                .source(OrderStates.PAYMENT_RECEIVED)
                .target(OrderStates.REFUNDING)
                .event(OrderEvents.REQUEST_REFUND)
                .action(initiateRefundAction())
            .and()
            .withExternal()
                .source(OrderStates.REFUNDING)
                .target(OrderStates.REFUNDED)
                .event(OrderEvents.REFUND_COMPLETE)
                .action(completeRefundAction())
            .and()
            // 超时处理
            .withInternal()
                .source(OrderStates.AWAITING_PAYMENT)
                .event(OrderEvents.CHECK_TIMEOUT)
                .action(checkPaymentTimeoutAction())
            .and()
            .withExternal()
                .source(OrderStates.AWAITING_PAYMENT)
                .target(OrderStates.PAYMENT_TIMEOUT)
                .event(OrderEvents.PAYMENT_TIMEOUT)
                .action(handlePaymentTimeoutAction());
    }

    // 各种Action Bean定义
    @Bean
    public Action<OrderStates, OrderEvents> validateOrderAction() {
        return context -> {
            Message<OrderEvents> message = context.getMessage();
            String orderId = (String) message.getHeaders().get("orderId");
            log.info("Validating order: {}", orderId);
            // 实现订单验证逻辑
        };
    }

    // 其他Action Bean...
}
```

### 10.2 订单事件处理器

```java
@Service
@WithStateMachine
public class OrderEventHandler {

    private static final Logger log = LoggerFactory.getLogger(OrderEventHandler.class);

    private final OrderService orderService;
    private final PaymentService paymentService;
    private final InventoryService inventoryService;
    private final ShippingService shippingService;
    private final NotificationService notificationService;

    public OrderEventHandler(OrderService orderService,
                            PaymentService paymentService,
                            InventoryService inventoryService,
                            ShippingService shippingService,
                            NotificationService notificationService) {
        this.orderService = orderService;
        this.paymentService = paymentService;
        this.inventoryService = inventoryService;
        this.shippingService = shippingService;
        this.notificationService = notificationService;
    }

    @OnTransition(target = "VALIDATING")
    public void onValidating(StateContext<OrderStates, OrderEvents> context) {
        String orderId = getOrderId(context);
        log.info("Starting validation for order: {}", orderId);

        try {
            Order order = orderService.validateOrder(orderId);
            context.getExtendedState().getVariables().put("validatedOrder", order);
        } catch (ValidationException e) {
            log.error("Order validation failed: {}", orderId, e);
            context.getStateMachine().sendEvent(OrderEvents.VALIDATION_FAILED);
        }
    }

    @OnTransition(target = "PAYMENT_PENDING")
    public void onPaymentPending(StateContext<OrderStates, OrderEvents> context) {
        String orderId = getOrderId(context);
        Order order = (Order) context.getExtendedState().getVariables().get("validatedOrder");

        log.info("Order {} is pending payment", orderId);
        notificationService.sendPaymentPendingNotification(order);

        // 设置支付超时检查
        schedulePaymentTimeoutCheck(orderId, context.getStateMachine());
    }

    @OnTransition(target = "PAYMENT_PROCESSING")
    public void onPaymentProcessing(StateContext<OrderStates, OrderEvents> context) {
        String orderId = getOrderId(context);
        Order order = (Order) context.getExtendedState().getVariables().get("validatedOrder");

        log.info("Processing payment for order: {}", orderId);

        try {
            PaymentResult result = paymentService.processPayment(order);
            if (result.isSuccess()) {
                context.getStateMachine().sendEvent(OrderEvents.PAYMENT_SUCCESS);
            } else {
                context.getExtendedState().getVariables().put("paymentError", result.getError());
                context.getStateMachine().sendEvent(OrderEvents.PAYMENT_FAILED);
            }
        } catch (PaymentException e) {
            log.error("Payment processing failed: {}", orderId, e);
            context.getExtendedState().getVariables().put("paymentError", e.getMessage());
            context.getStateMachine().sendEvent(OrderEvents.PAYMENT_FAILED);
        }
    }

    @OnTransition(target = "PAYMENT_RECEIVED")
    public void onPaymentReceived(StateContext<OrderStates, OrderEvents> context) {
        String orderId = getOrderId(context);
        log.info("Payment received for order: {}", orderId);

        Order order = orderService.updateOrderStatus(orderId, OrderStates.PAYMENT_RECEIVED);
        notificationService.sendPaymentSuccessNotification(order);
    }

    @OnTransition(target = "INVENTORY_CHECKING")
    public void onInventoryChecking(StateContext<OrderStates, OrderEvents> context) {
        String orderId = getOrderId(context);
        Order order = orderService.getOrder(orderId);

        log.info("Checking inventory for order: {}", orderId);

        CompletableFuture.runAsync(() -> {
            try {
                InventoryStatus status = inventoryService.checkInventory(order);
                if (status.isAvailable()) {
                    context.getStateMachine().sendEvent(OrderEvents.INVENTORY_AVAILABLE);
                } else {
                    context.getExtendedState().getVariables().put("inventoryShortage", status.getMessage());
                    context.getStateMachine().sendEvent(OrderEvents.INVENTORY_UNAVAILABLE);
                }
            } catch (InventoryException e) {
                log.error("Inventory check failed: {}", orderId, e);
                context.getStateMachine().sendEvent(OrderEvents.INVENTORY_ERROR);
            }
        });
    }

    // 其他事件处理方法...

    private String getOrderId(StateContext<OrderStates, OrderEvents> context) {
        return (String) context.getMessage().getHeaders().get("orderId");
    }

    private void schedulePaymentTimeoutCheck(String orderId, StateMachine<OrderStates, OrderEvents> stateMachine) {
        // 30分钟后检查支付超时
        Timer timer = new Timer();
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                if (stateMachine.getState().getId() == OrderStates.AWAITING_PAYMENT) {
                    stateMachine.sendEvent(OrderEvents.CHECK_TIMEOUT);
                }
            }
        }, 30 * 60 * 1000); // 30分钟
    }
}
```

## 总结

Spring Statemachine 的事件处理机制提供了强大而灵活的方式来管理复杂的状态转换逻辑。通过本文的详细讲解和最佳实践，您应该能够：

1. **理解事件的核心概念**：掌握事件在状态机中的作用和不同类型的事件的使用场景
2. **实现高效事件处理**：使用同步、异步、批量等多种事件处理方式
3. **确保事件处理可靠性**：通过验证、重试、事务管理等机制保证事件处理的可靠性
4. **监控和优化性能**：使用监控指标和追踪工具来优化事件处理性能
5. **处理复杂业务场景**：通过实战案例了解如何在真实业务场景中应用事件处理

记住，良好的事件处理设计应该遵循以下原则：

- **可靠性**：确保事件不会丢失或重复处理
- **可观测性**：提供完整的事件处理监控和追踪能力
- **弹性**：能够处理各种异常情况和失败场景
- **性能**：优化事件处理性能，支持高并发场景
- **可维护性**：保持代码清晰和可测试性

通过遵循这些原则和最佳实践，您可以构建出健壮、高效的事件驱动状态机系统。
