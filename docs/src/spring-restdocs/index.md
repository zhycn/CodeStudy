# Spring REST Docs

Spring REST Docs 是 Spring 生态体系中的一个子项目，用于生成 RESTful API 的文档。它基于 AsciiDoc 格式，支持自动生成 API 文档、请求示例、响应示例等，能够显著提升 RESTful API 的文档质量和维护成本。但由于上手成本较高，自动化程度有限，交互性弱，决定了它不是一个主流的 API 文档工具。

- [Spring REST Docs 官方网站](https://spring.io/projects/spring-restdocs)
- [Spring REST Docs 文档地址](https://docs.spring.io/spring-restdocs/docs/current/reference/htmlsingle/)
- [Spring REST Docs 代码仓库](https://github.com/spring-projects/spring-restdocs)
- [Spring REST Docs API 文档](https://docs.spring.io/spring-restdocs/docs/current/api/)

其他 API 文档工具：

- Swagger: <https://swagger.io/>
- API Blueprint: <https://apiblueprint.org/>
- RAML: <https://raml.org/>
- OpenAPI: <https://www.openapis.org/>
- Postman: <https://www.postman.com/>
- Insomnia: <https://insomnia.rest/>
- Redocly: <https://redocly.com/>
- SpringDoc: <https://springdoc.org/>
- Asciidoctor: <https://asciidoctor.org/>

## Swagger/OpenAPI（最主流的选择）

- **核心工具**：SpringDoc（整合 OpenAPI 3.0 与 Spring Boot）、Swagger UI（交互式文档界面）。
- **特点**：通过注解（如 @Operation、@Parameter）描述 API，启动应用后自动生成 JSON 格式的 OpenAPI 规范，再通过 Swagger UI 展示为可交互的网页（支持在线调用 API、查看参数说明）。
- **优势**：
  - **开发效率高**：几乎零配置（引入依赖即可），注解简单直观；
  - **交互性强**：前端 / 测试人员可直接在 UI 上调试 API，无需额外工具；
  - **生态成熟**：支持导出 JSON/YAML 规范，可集成到其他工具（如 Postman、APIFox）。
- **劣势**：
  - **代码污染**：大量注解可能影响代码可读性；
  - **文档深度有限**：自动生成的文档偏 “技术细节”，缺乏业务场景说明（需手动补充）。
- **适合场景**：内部项目、快速迭代的团队、需要实时调试 API 的场景。
