# Spring Shell

Spring Shell 是 Spring 生态体系中的一个子项目，旨在帮助开发者快速构建交互式命令行应用程序（CLI）。它基于 Spring 框架的核心能力（如依赖注入、自动配置），简化了命令定义、参数解析、交互逻辑处理等重复工作，让开发者可以聚焦于业务逻辑，而非命令行工具的底层实现细节。

- Spring Shell 官方文档：<https://spring.io/projects/spring-shell>
- Spring Shell 参考文档: <https://docs.spring.io/spring-shell/reference/>
- Spring Shell 源码仓库: <https://github.com/spring-projects/spring-shell>
- Spring Shell API 文档: <https://docs.spring.io/spring-shell/docs/current/api/>

## 相关项目

- Apache Commons CLI 官方文档: <https://commons.apache.org/proper/commons-cli/>
- picocli 官方文档: <https://picocli.info/>
- JLine 官方文档: <https://jline.github.io/>

:::info 提示
由于在当前实际应用场景下，命令行工具的使用需求较少，所以在当前阶段此部分内容不作为重点学习项目。不过，了解相关的命令行解析库对于后续可能遇到的开发场景会有帮助，下面是常用的命令行解析库：

### Spring Shell

Spring Shell 是 Spring 框架提供的一个用于创建交互式命令行应用程序的工具。它基于 Spring 框架的依赖注入和 AOP 机制，提供了简单而强大的功能，例如可以方便地定义命令、解析参数、生成帮助文档等。Spring Shell 还支持插件机制，可以方便地扩展功能。

### Apache Commons CLI

Apache Commons CLI 是 Apache 软件基金会提供的一个用于解析命令行参数的成熟库。它提供了简单而强大的功能，例如可以方便地定义命令行选项、解析参数、生成帮助信息等。其优势在于易于集成到现有的 Java 项目中，拥有广泛的社区支持和丰富的文档，适合初学者和需要快速实现命令行解析功能的开发者。

### picocli

picocli 是一个基于注解的现代命令行解析库，支持 Java 7 及以上版本。它不仅支持自动生成帮助文档和参数验证，还能处理复杂的子命令，使得构建多级命令行界面变得轻松。picocli 的特点是代码简洁，通过注解就能完成大部分配置，并且在运行时不需要额外的依赖，适合构建高性能、功能丰富的命令行应用。
:::

以下是 Spring Shell 详解与最佳实践

## 1. Spring Shell 简介与核心价值

Spring Shell 是 Spring 生态系统中用于构建**交互式命令行应用**（CLI）的框架，基于 **REPL**（Read-Eval-Print Loop）模式，允许用户通过文本命令与应用程序进行交互。对于 Java 开发者而言，Spring Shell 提供了使用熟悉的 Spring 编程模型来创建命令行工具的能力，将复杂的命令行参数解析、类型转换和校验等繁琐工作交由框架处理，开发者只需专注于核心业务逻辑的实现。

### 1.1 核心价值

在后端开发和运维的日常工作中，命令行工具因其高效、直接的特点，成为自动化脚本和快速任务处理的利器。Spring Shell 的主要价值体现在：

- **告别手动解析参数**：自动处理复杂的命令行参数解析、类型转换和校验
- **提升用户体验**：内置自动补全、命令历史、错误提示等高级功能
- **降低开发门槛**：基于 Spring Boot 生态，开发者可以复用现有的 Spring 知识
- **统一技术栈**：对于 Spring 技术栈的团队，无需引入额外的命令行框架

### 1.2 与其他框架对比

| 框架 | 特点 |
|------|------|
| Spring Shell | 基于 Spring，适合 Java 生态，支持依赖注入和复杂业务逻辑 |
| Picocli | 轻量级，适合纯 Java 命令行工具，无需 Spring |
| JLine | 提供终端交互基础能力（如 Tab 补全），需自行实现命令逻辑 |

## 2. 环境搭建与项目配置

### 2.1 依赖配置

对于新项目，建议直接采用 Spring Shell 3.x + JDK 17 或更高版本。在 Maven 项目中，添加以下依赖：

```xml
<dependency>
    <groupId>org.springframework.shell</groupId>
    <artifactId>spring-shell-starter</artifactId>
    <version>3.4.1</version>
</dependency>
```

### 2.2 基础配置

在 `application.yml` 中配置基本参数：

```yaml
spring:
  shell:
    interactive:
      enabled: true  # 启用交互式模式
    command:
      stacktrace:
        enabled: false  # 禁用详细堆栈信息

logging:
  level:
    root: INFO
    com.example: DEBUG  # 设置项目包日志级别
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %green(%m) %n"
```

### 2.3 应用入口类

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.shell.command.annotation.CommandScan;

@SpringBootApplication
@CommandScan  // 启用@Command的扫描，确保含有@Command注解的类会被识别
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## 3. 命令定义：新旧注解对比

Spring Shell 3.x 版本引入了一套全新的命令定义注解，与旧版注解有显著区别。

### 3.1 旧版注解（Spring Shell 2.x）

```java
import org.springframework.shell.standard.ShellComponent;
import org.springframework.shell.standard.ShellMethod;
import org.springframework.shell.standard.ShellOption;

@ShellComponent
public class CustomerSheller {
    
    @ShellMethod(value = "查询所有的客户")
    public void findAll() {
        // 业务逻辑
    }
    
    @ShellMethod(key = {"customer", "insert"}, value = "新增用户")
    public void insert(@ShellOption(value = "-n", defaultValue = "unKnown") String name) {
        // 业务逻辑
    }
}
```

### 3.2 新版注解（Spring Shell 3.x）

```java
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.shell.command.annotation.Command;
import org.springframework.shell.command.annotation.Option;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Command(description = "客户管理命令集")
@AllArgsConstructor
public class CustomerCommander {
    
    private final CustomerApplicationService service;
    
    @Command(description = "查询所有的客户")
    public void findAll() {
        final Map<Integer, String> all = service.findAll();
        log.info("all: {}", all);
    }
    
    @Command(command = {"customer", "insert"}, description = "新增用户")
    public void insert(@Option(shortNames = 'n', defaultValue = "unKnown") String name) {
        final Integer id = service.insert(name);
        log.info("id: {}, name: {}", id, name);
    }
    
    @Command(command = {"customer", "update"}, description = "更新用户")
    public void update(@Option(shortNames = 'i') Integer id, @Option(shortNames = 'n') String name) {
        service.update(id, name);
        log.info("id: {}, name: {}", id, name);
    }
}
```

### 3.3 注解对比分析

| 特性 | 旧版注解 | 新版注解 |
|------|----------|----------|
| 类级别注解 | `@ShellComponent` | `@Command` |
| 方法级别注解 | `@ShellMethod` | `@Command` |
| 参数注解 | `@ShellOption` | `@Option` |
| 命令结构 | 通过key属性定义层级 | 通过command数组直接定义层级 |
| 参数命名 | 使用value属性 | 使用shortNames/longNames |

新版注解的主要优势在于**更直观的命令层级定义**和**更符合标准命令行工具约定的参数命名方式**。

## 4. 核心功能详解

### 4.1 参数处理机制

Spring Shell 提供了灵活的参数处理机制，支持多种参数传递方式。

#### 4.1.1 位置参数与命名参数

```java
@Command(description = "参数演示命令")
public class ParameterDemo {
    
    @Command(description = "演示位置参数和命名参数")
    public String echo(int a, int b, int c) {
        return String.format("You said a=%d, b=%d, c=%d", a, b, c);
    }
}
```

以下调用方式都是等价的：

```bash
echo 1 2 3                  # 位置参数
echo --a 1 --b 2 --c 3      # 完全命名参数
echo --b 2 --c 3 --a 1      # 命名参数重新排序
echo --a 1 2 3              # 混合方式
```

#### 4.1.2 高级参数特性

```java
@Command(description = "高级参数演示")
public class AdvancedParameterDemo {
    
    // 可选参数与默认值
    @Command(description = "打招呼")
    public String greet(@Option(shortNames = 'w', defaultValue = "World") String who) {
        return "Hello " + who;
    }
    
    // 多值参数
    @Command(description = "数字求和")
    public float add(@Option(shortNames = 'n', arity = 3) float[] numbers) {
        return numbers[0] + numbers[1] + numbers[2];
    }
    
    // 布尔参数的特殊处理
    @Command(description = "系统关闭")
    public String shutdown(boolean force) {
        return "You said " + force;
    }
}
```

布尔参数默认 arity 为 0，意味着可以像标志一样使用：

```bash
shutdown          # force=false
shutdown --force  # force=true
```

#### 4.1.3 参数验证

Spring Shell 集成了 Bean Validation API，支持参数自动验证：

```java
@Command(description = "参数验证演示")
public class ValidationDemo {
    
    @Command(description = "修改密码")
    public String changePassword(@Size(min = 8, max = 40) String password) {
        return "Password successfully set to " + password;
    }
}
```

当输入不符合约束时，会自动提示：

```bash
change-password hello
The following constraints were not met:
--password string : size must be between 8 and 40 (You passed 'hello')
```

### 4.2 动态命令可用性

根据应用内部状态，可以动态控制命令的可用性：

```java
@Command(description = "连接管理")
public class ConnectionCommands {
    
    private boolean connected;
    
    @Command(description = "连接服务器")
    public void connect(String user, String password) {
        // 连接逻辑
        connected = true;
    }
    
    @Command(description = "下载数据")
    public void download() {
        // 下载逻辑
    }
    
    // 动态可用性控制
    public Availability downloadAvailability() {
        return connected ? 
            Availability.available() : 
            Availability.unavailable("您尚未连接服务器");
    }
}
```

当命令不可用时，用户会收到友好提示：

```bash
download
Command 'download' exists but is not currently available because 您尚未连接服务器
```

### 4.3 自定义提示符与界面优化

通过实现 `PromptProvider` 接口可以自定义命令行提示符：

```java
import org.jline.utils.AttributedString;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.shell.jline.PromptProvider;

@Configuration
public class ShellConfiguration {
    
    @Bean
    public PromptProvider promptProvider() {
        return () -> new AttributedString("my-shell:>");
    }
}
```

## 5. 最佳实践与实战案例

### 5.1 项目结构规划

对于复杂的 Spring Shell 应用，推荐按功能模块组织代码：

```java
src/main/java/com/example/
├── Application.java          # 应用入口
├── config/                   # 配置类
│   └── ShellConfiguration.java
├── command/                  # 命令定义
│   ├── CustomerCommand.java
│   ├── SystemCommand.java
│   └── DataCommand.java
├── service/                  # 业务逻辑层
│   ├── CustomerService.java
│   └── SystemMonitorService.java
└── model/                    # 数据模型
    └── Customer.java
```

### 5.2 客户管理 CLI 实战

以下是一个完整的客户管理 CLI 示例：

#### 5.2.1 业务逻辑层

```java
import com.google.common.collect.ImmutableMap;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.Validate;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class CustomerApplicationService {
    
    private final Map<Integer, String> customers = new ConcurrentHashMap<>();
    
    public Map<Integer, String> findAll() {
        return ImmutableMap.copyOf(customers);
    }
    
    public Integer insert(String name) {
        final Integer id = customers.keySet().stream()
                .max(Comparator.naturalOrder())
                .orElse(0) + 1;
        customers.put(id, name);
        return id;
    }
    
    public void update(Integer id, String name) {
        Validate.isTrue(customers.containsKey(id), "该ID: %s不存在".formatted(id));
        customers.put(id, name);
    }
    
    public String findById(Integer id) {
        return customers.getOrDefault(id, "");
    }
    
    public void delete(Integer id) {
        customers.remove(id);
    }
}
```

#### 5.2.2 命令层实现

```java
import com.example.demo.core.service.CustomerApplicationService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.shell.command.annotation.Command;
import org.springframework.shell.command.annotation.Option;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@Command(description = "客户管理命令集")
@AllArgsConstructor
public class CustomerCommander {

    private final CustomerApplicationService service;

    @Command(description = "查询所有客户")
    public void findAll() {
        final Map<Integer, String> all = service.findAll();
        log.info("所有客户: {}", all);
    }

    @Command(command = {"customer", "insert"}, description = "新增客户")
    public void insert(@Option(shortNames = 'n', defaultValue = "Guest") String name) {
        final Integer id = service.insert(name);
        log.info("新增客户 ID: {}, 姓名: {}", id, name);
    }

    @Command(command = {"customer", "update"}, description = "更新客户信息")
    public void update(@Option(shortNames = 'i') Integer id, 
                      @Option(shortNames = 'n') String name) {
        service.update(id, name);
        log.info("更新客户 ID: {}, 新姓名: {}", id, name);
    }

    @Command(command = {"customer"}, description = "查询单个客户")
    public void findById(@Option(shortNames = 'i') Integer id) {
        final String name = service.findById(id);
        log.info("客户 ID: {}, 姓名: {}", id, name);
    }

    @Command(command = {"customer", "del"}, description = "删除客户")
    public void delete(@Option(shortNames = 'i') Integer id) {
        service.delete(id);
        log.info("删除客户 ID: {}", id);
    }
}
```

### 5.3 系统监控功能扩展

Spring Shell 非常适合用于系统监控工具的开发：

```java
import lombok.extern.slf4j.Slf4j;
import org.springframework.shell.command.annotation.Command;
import org.springframework.stereotype.Component;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.ThreadMXBean;

@Slf4j
@Component
@Command(description = "系统监控命令")
public class SystemMonitorCommand {

    @Command(description = "JVM 监控信息")
    public String jvm() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();

        long heapUsed = memoryBean.getHeapMemoryUsage().getUsed();
        long heapMax = memoryBean.getHeapMemoryUsage().getMax();
        int threadCount = threadBean.getThreadCount();

        return String.format(
            "JVM 监控信息:\n" +
            "  堆内存使用: %d / %d MB\n" +
            "  线程数: %d",
            heapUsed / (1024 * 1024), heapMax / (1024 * 1024), threadCount
        );
    }

    @Command(description = "CPU 使用率")
    public String cpu() {
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        double cpuUsage = 0.0;

        if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
            com.sun.management.OperatingSystemMXBean sunOsBean = 
                (com.sun.management.OperatingSystemMXBean) osBean;
            cpuUsage = sunOsBean.getProcessCpuLoad() * 100;
        } else {
            cpuUsage = osBean.getSystemLoadAverage();
        }

        return String.format("CPU 使用率: %.2f%%", cpuUsage);
    }
}
```

## 6. 测试与调试策略

### 6.1 单元测试方法

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.shell.Shell;
import org.springframework.shell.command.CommandRegistration;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CustomerCommandTest {

    @Autowired
    private Shell shell;

    @Test
    void testInsertCommand() {
        Object result = shell.evaluate(() -> "customer insert --n John");
        assertThat(result).isNotNull();
    }

    @Test
    void testFindAllCommand() {
        Object result = shell.evaluate(() -> "find-all");
        assertThat(result).isNotNull();
    }
}
```

### 6.2 交互式测试流程

启动应用后，可以进行以下测试流程：

```bash
my-shell:> help                    # 查看所有可用命令
my-shell:> find-all                # 初始查询（应为空）
my-shell:> customer insert --n Andy      # 新增客户
my-shell:> customer insert --n Bob      # 新增另一个客户
my-shell:> find-all                # 查看所有客户
my-shell:> customer --i 1          # 查询特定客户
my-shell:> customer update --i 1 --n AndyNew  # 更新客户
my-shell:> customer del --i 2      # 删除客户
my-shell:> find-all                # 最终验证
```

## 7. 版本迁移与兼容性

### 7.1 从 Spring Shell 2.x 迁移到 3.x

1. **注解替换**：
   - 将 `@ShellComponent` 替换为类级别的 `@Command`
   - 将 `@ShellMethod` 替换为方法级别的 `@Command`
   - 将 `@ShellOption` 替换为 `@Option`

2. **包名变更**：
   - 旧包：`org.springframework.shell.standard`
   - 新包：`org.springframework.shell.command.annotation`

3. **配置更新**：
   - 添加 `@CommandScan` 注解替代原有的自动扫描机制

### 7.2 JDK 版本要求

| Spring Shell 版本 | 最低 JDK 要求 | 推荐 JDK 版本 |
|------------------|---------------|---------------|
| 2.x | JDK 8 | JDK 11 或 17 |
| 3.x | JDK 17 | JDK 21 |

## 8. 性能优化与生产建议

### 8.1 性能优化技巧

1. **命令分组管理**：使用 `@Command` 的 group 属性对相关命令进行分组，提高帮助信息的可读性。

2. **延迟初始化**：对于资源消耗大的命令，使用懒加载策略。

3. **结果缓存**：对于查询类命令，适当引入缓存机制。

### 8.2 生产环境部署建议

1. **安全配置**：对于敏感操作，集成 Spring Security 进行权限控制。

2. **日志记录**：详细记录命令执行日志，便于审计和故障排查。

3. **资源清理**：实现 `DisposableBean` 接口确保资源正确释放。

## 总结

Spring Shell 为 Java 开发者提供了强大的命令行应用开发能力，通过注解驱动的编程模型大大简化了 CLI 工具的创建过程。新版 3.x 注解更加直观和符合标准，提供了更好的开发体验。

在实际项目中，建议根据业务复杂度合理规划命令结构，充分利用参数验证、动态可用性控制等高级特性，同时注意版本兼容性和性能优化，才能构建出既功能强大又用户体验良好的命令行工具。

通过本文的详解和最佳实践，希望您能顺利掌握 Spring Shell 的核心概念和应用技巧，在未来的项目中高效地开发出满足需求的命令行应用程序。
