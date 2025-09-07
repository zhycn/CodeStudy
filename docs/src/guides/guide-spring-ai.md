好的，没有问题。作为您的 Spring 技术专家和文档顾问，我已经为您完成了资料的搜集、整理与创作。

本文档融合了 Spring AI 官方文档、核心概念解读以及社区最佳实践，旨在提供一份详尽、准确且即学即用的精品教程。

---

# Spring AI 详解与最佳实践

## 1. 概述

### 1.1 什么是 Spring AI？

Spring AI 是 Spring 官方生态下的一个新兴项目，其核心使命是将人工智能能力，特别是 **生成式 AI**（Generative AI），无缝集成到 Spring 应用程序中。它提供了一个抽象和可移植的 API 层，让开发者能够以熟悉的 Spring 风格（如依赖注入、声明式客户端）调用各种 AI 模型，而无需被特定供应商的 SDK 所捆绑。

### 1.2 核心目标与优势

- **简化集成**：极大降低了在 Spring Boot 应用中接入大语言模型（LLM, Large Language Model）的门槛。
- **抽象与可移植性**：通过统一的 API 对接多个 AI 提供商（如 OpenAI, Azure OpenAI, Ollama, Anthropic 等），只需修改配置即可切换模型，代码无需改动。
- **Spring 生态融合**：完美支持 Spring Boot 自动配置、Actuator 健康检查、以及 Spring Security 等。
- **丰富的高级特性**：内置了如提示词工程（Prompt Engineering）、数据检索（RAG, Retrieval Augmented Generation）、对话记忆管理等功能。

### 1.3 版本说明

本文基于 **Spring AI 1.0.0-M3** (里程碑版本) 编写。请注意，API 在正式版（GA）发布前可能仍有变动。建议访问 <https://spring.io/projects/spring-ai> 以获取最新信息。

## 2. 快速开始

### 2.1 创建项目

使用 <https://start.spring.io/> 创建项目，并添加 `Spring AI` 依赖。
目前 Initializr 尚未直接包含 Spring AI，但我们可以手动添加依赖。

### 2.2 添加依赖

在您的 `pom.xml` 文件中添加 Spring AI 的 BOM（物料清单）和具体模块的依赖。我们以 **OpenAI** 为例。

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>1.0.0-M3</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    </dependency>
    <!-- 其他依赖，如 Spring Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

### 2.3 配置 API Key

在 `application.properties` 或 `application.yml` 中配置您的 OpenAI API Key。

**application.yml**

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY} # 推荐使用环境变量，而非硬编码
      chat:
        options:
          model: gpt-3.5-turbo # 默认使用的模型
          temperature: 0.7 # 创造性程度，0-1
```

**请务必通过环境变量 `OPENAI_API_KEY` 来设置您真实的 API Key，不要直接写在配置文件中。**

### 2.4 第一个示例：创建一个简单的聊天应用

创建一个简单的 Spring Boot 应用，使用 `ChatClient` 进行交互。

```java
import org.springframework.ai.chat.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SimpleChatController {

    private final ChatClient chatClient;

    @Autowired
    public SimpleChatController(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    @GetMapping("/ai/chat")
    public String generate(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        return chatClient.call(message);
    }
}
```

启动应用，访问 `http://localhost:8080/ai/chat?message=What+is+Spring+AI?`，您将获得来自 AI 的回复。

## 3. 核心概念与 API

### 3.1 核心接口

Spring AI 的核心是以下几个高度抽象的接口：

- **`ChatClient`**: 最基础的聊天客户端，提供简单的 `call` 方法发送消息。
- **`ChatModel`**: `ChatClient` 的底层接口，提供了更多生成选项（如 `ChatOptions`）。
- **`Prompt`**: 代表一个发送给模型的请求，包含一个或多个 `Message` 对象。
- **`Message`**: 代表对话中的一条消息，包含内容内容和元数据。有不同角色：
  - `SystemMessage`: 设置 AI 助手的行为和角色。
  - `UserMessage`: 用户输入的消息。
  - `AssistantMessage`: AI 助手的回复消息。

### 3.2 使用 `ChatModel` 和 `Prompt`（推荐方式）

相较于简单的 `ChatClient.call()`，使用 `ChatModel` 和 `Prompt` 可以构建更复杂和可控的交互。

```java
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.Media;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AdvancedChatController {

    private final ChatModel chatModel;

    public AdvancedChatController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/ai/advanced")
    public String advancedChat() {
        // 1. 创建一个系统消息，设定 AI 的角色
        SystemMessage systemMessage = new SystemMessage("You are a helpful assistant specialized in Spring Framework.");

        // 2. 创建一个用户消息
        UserMessage userMessage = new UserMessage("Explain the concept of dependency injection in Spring.");

        // 3. 将消息组合成一个 Prompt
        Prompt prompt = new Prompt(List.of(systemMessage, userMessage));

        // 4. 调用模型并获取响应
        return chatModel.call(prompt).getResult().getOutput().getContent();
    }
}
```

## 4. 连接不同模型提供商

Spring AI 的强大之处在于其可移植性。以下是如何配置和使用不同提供商的示例。

### 4.1 Azure OpenAI

修改 `application.yml` 配置：

```yaml
spring:
  ai:
    azure:
      openai:
        api-key: ${AZURE_OPENAI_API_KEY}
        endpoint: ${AZURE_OPENAI_ENDPOINT} # e.g., https://your-resource.openai.azure.com/
        chat:
          options:
            deployment-name: ${AZURE_OPENAI_DEPLOYMENT_NAME} # 你在Azure门户中部署的模型名称
            temperature: 0.7
```

代码无需任何改动，Spring AI 会自动注入基于 Azure 的 `ChatModel` Bean。

### 4.2 本地模型 (Ollama)

Ollama 允许您在本地运行大型语言模型（如 Llama 3, Mistral）。

1. **安装并启动 Ollama**：参考 <https://ollama.com/。>
2. **拉取一个模型**：在终端运行 `ollama pull llama3`。
3. **添加 Spring AI Ollama 依赖**：

   ```xml
   <dependency>
       <groupId>org.springframework.ai</groupId>
       <artifactId>spring-ai-ollama-spring-boot-starter</artifactId>
   </dependency>
   ```

4. **配置 application.yml**：

   ```yaml
   spring:
     ai:
       ollama:
         base-url: http://localhost:11434 # Ollama 默认端口
         chat:
           options:
             model: llama3 # 你拉取的模型名称
   ```

同样，您的代码无需修改即可与本地模型交互。

## 5. 高级功能与最佳实践

### 5.1 提示词工程（Prompt Engineering）

设计良好的提示词（Prompt）是获得高质量回应的关键。Spring AI 提供了 `PromptTemplate` 来帮助动态构建提示词。

```java
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PromptEngineeringController {

    private final ChatModel chatModel;

    public PromptEngineeringController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/ai/translate")
    public String translate(@RequestParam String text, @RequestParam String language) {
        // 使用 PromptTemplate 动态注入变量
        PromptTemplate promptTemplate = new PromptTemplate("""
            Please translate the following text into {language}.
            Do not provide any additional explanation, just the translation.
            Text: {text}
            """);
        Prompt prompt = promptTemplate.create(Map.of("text", text, "language", language));
        return chatModel.call(prompt).getResult().getOutput().getContent();
    }
}
```

### 5.2 检索增强生成（RAG）

RAG 通过将外部知识库（如您的文档、数据库）作为上下文提供给 LLM，来弥补其内部知识可能过时或不准确的缺陷。Spring AI 提供了强大的向量数据库集成和自动化的 RAG 流程。

一个简化的 RAG 流程示例：

1. **文档加载与分割**：使用 `DocumentReader` 加载 PDF、网页等文档，并用 `TextSplitter` 分割成小块。
2. **向量化与存储**：使用 `EmbeddingModel` 将文本块转换为向量（Embeddings），并存入向量数据库（如 Chroma, Pinecone, Redis等）。
3. **检索与提问**：当用户提问时，将问题也转换为向量，并从向量数据库中检索最相关的文本块。
4. **增强提示**：将检索到的相关文本作为上下文，和用户问题一起构成最终提示，发送给 LLM。

Spring AI 极大简化了步骤 2-4。以下是一个高度简化的示例：

```java
// 伪代码，展示概念
@RestController
public class RagController {

    @Autowired
    private VectorStore vectorStore;

    @Autowired
    private ChatModel chatModel;

    @GetMapping("/ai/ask")
    public String askQuestion(@RequestParam String question) {
        // 1. 检索相关文档
        List<Document> similarDocuments = vectorStore.similaritySearch(question);

        // 2. 构建增强的提示词
        String context = similarDocuments.stream().map(Document::getContent).collect(Collectors.joining("\n"));
        String enhancedPrompt = """
                Answer the question based only on the following context:
                {context}
                Question: {question}
                """;

        PromptTemplate promptTemplate = new PromptTemplate(enhancedPrompt);
        Prompt prompt = promptTemplate.create(Map.of("context", context, "question", question));

        // 3. 调用模型
        return chatModel.call(prompt).getResult().getOutput().getContent();
    }
}
```

### 5.3 性能与稳定性最佳实践

- **设置超时**：务必为 AI 调用设置合理的超时时间，防止网络问题导致应用阻塞。

  ```yaml
  spring:
    ai:
      openai:
        chat:
          options: ...
          # 连接和读取超时设置（单位：毫秒）
          client:
            connect-timeout: 5000
            read-timeout: 30000
  ```

- **实现重试机制**：使用 Spring Retry 或 Resilience4j 对暂时性故障（如网络抖动、API 限流）进行重试。

  ```java
  import org.springframework.retry.annotation.Retryable;
  import org.springframework.retry.annotation.Backoff;

  @Retryable(
      value = { Exception.class }, // 重试的异常类型
      maxAttempts = 3,
      backoff = @Backoff(delay = 1000, multiplier = 2) // 指数退避策略
  )
  public String callAiWithRetry(String prompt) {
      // ... 调用 AI
  }
  ```

- **使用缓存**：对于重复的、非实时性的请求（如翻译固定文本、生成常见问题的答案），可以考虑使用 Spring Cache 缓存结果，节省成本和提高响应速度。

  ```java
  import org.springframework.cache.annotation.Cacheable;

  @Cacheable(value = "aiResponses", key = "#question")
  public String getCachedAnswer(String question) {
      return chatModel.call(question);
  }
  ```

## 6. 总结

Spring AI 作为 Spring 生态在 AI 领域的自然延伸，为 Java 开发者提供了一个强大、灵活且熟悉的工具来构建 AI 驱动的应用程序。其核心价值在于 **抽象** 和 **可移植性**，让开发者能专注于业务逻辑和提示词设计，而非底层 API 的差异。

**核心要点回顾**：

1. **快速入门**：通过 `spring-ai-starter` 和简单的配置即可接入主流模型。
2. **统一 API**：使用 `ChatModel` 和 `Prompt` 等接口编写供应商中立的代码。
3. **强大功能**：内置对提示词工程、RAG、对话记忆等高级场景的支持。
4. **最佳实践**：重视超时、重试和缓存，以构建健壮的生产级应用。

随着 Spring AI 向 1.0 正式版迈进，其 API 将更加稳定，功能也将更加丰富。现在正是学习和采用这项技术，为您的应用注入 AI 能力的绝佳时机。
