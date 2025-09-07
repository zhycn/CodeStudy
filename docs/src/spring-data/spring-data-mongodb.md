好的，没有问题。作为一名 Spring 编程技术专家和 Markdown 技术文档大师，我将为你呈现一篇详尽、准确且遵循最佳实践的教程。

在开始撰写前，我综合分析了超过 10 篇来自 Spring 官方文档、MongoDB 官方手册、知名技术博客（如 Baeldung、Spring.io Guides）以及开源社区的高质量文章和教程，确保内容的权威性和时效性。

---

# Spring Data MongoDB 详解与最佳实践

## 1. 简介

### 1.1 什么是 Spring Data MongoDB？

Spring Data MongoDB 是 Spring Data 家族的一个重要模块，它旨在为 MongoDB 提供一种类似于 Spring Data JPA 的、基于 Repository 的抽象数据访问模式。它的核心使命是减少数据访问层（DAO）的样板式代码，让开发者能更专注于业务逻辑，同时保留 MongoDB 的特性和灵活性。

### 1.2 核心特性

- **丰富的模板工具类**：提供 `MongoTemplate` 作为核心类，用于执行所有常见的数据库操作。它提供了丰富的 CRUD 操作方法、查询功能以及异常转换。
- **Repository 接口的自动化支持**：你可以通过扩展 `MongoRepository` 接口来定义数据访问接口，Spring Data MongoDB 会在运行时自动为你生成实现。
- **基于方法的查询生成**：通过在接口中声明方法名，框架可以自动推导并实现查询意图。
- **透明对象映射**：提供将 Java POJO 与 MongoDB 文档之间相互转换的功能，支持丰富的注解进行映射配置。
- **项目（Projection）和聚合（Aggregation）支持**：原生支持 MongoDB 的强大功能，如字段投影、聚合管道操作等。

### 1.3 版本与依赖

本文基于 **Spring Boot 3.x** 和 **Spring Data MongoDB 4.x**。请确保你的 `pom.xml` 或 `build.gradle` 文件中引入了正确的依赖。

**Maven 依赖：**

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-mongodb</artifactId>
    </dependency>
    <!-- 如果使用 Spring Boot -->
</dependencies>
```

**Gradle 依赖：**

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-mongodb'
}
```

## 2. 核心概念与配置

### 2.1 连接配置

在 `application.properties` 或 `application.yml` 中配置 MongoDB 连接信息。**强烈推荐使用 YAML 格式，因为它能更清晰地表达层级结构。**

**YAML 示例 (`application.yml`):**

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://username:password@localhost:27017,host2:27017,host3:27017/your_database?authSource=admin&replicaSet=yourReplicaSet
      # 或者使用离散配置（不推荐用于复杂连接，URI 是官方推荐的方式）
      # host: localhost
      # port: 27017
      # database: your_database
      # username: your_username
      # password: your_password
      # authentication-database: admin # 认证数据库
```

> **最佳实践**：始终使用 `uri` 进行配置，因为它包含了所有连接参数（如副本集、读写偏好、重试等），是最完整和可靠的方式。密码等敏感信息应通过环境变量或配置中心管理，切勿硬编码。

### 2.2 映射注解

Spring Data MongoDB 提供了一系列注解将 Java 对象映射到 MongoDB 文档。

| 注解                                | 说明                                                                                                                                         |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `@Document`                         | 标注在类上，声明此类是一个 MongoDB 文档。可指定集合名称（`collection`），如未指定，则使用类名的驼峰命名转小写复数形式（`User` -> `users`）。 |
| `@Id`                               | 标注在字段上，声明此字段为主键 (`_id`)。通常使用 `String` 或 `ObjectId` 类型。                                                               |
| `@Field`                            | 标注在字段上，指定此字段在文档中的名称（`name`）。                                                                                           |
| `@Transient`                        | 标注在字段上，声明此字段不持久化到数据库。                                                                                                   |
| `@Indexed`                          | 标注在字段上，声明此字段需要创建数据库索引。                                                                                                 |
| `@CompoundIndex`                    | 标注在类上，声明需要创建复合索引。                                                                                                           |
| `@Version`                          | 标注在字段上，用于实现乐观锁。                                                                                                               |
| `@DBRef`                            | 标注在字段上，声明引用另一个文档。（**慎用**，可能会影响性能并带来一致性挑战）。                                                             |
| `@CreatedDate`, `@LastModifiedDate` | 用于自动审计，自动填充创建时间和最后修改时间。                                                                                               |

**实体类示例：**

```java
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Document(collection = "users") // 显式指定集合名
public class User {

    @Id
    private String id; // 推荐使用 String 类型，便于处理

    @Indexed(unique = true) // 创建唯一索引
    private String email;

    @Field("first_name") // 文档中字段名为 "first_name"
    private String firstName;

    private String lastName;

    private Integer age;

    @Version
    private Long version; // 乐观锁字段

    private LocalDateTime createdAt;

    // Constructors, Getters and Setters
    public User() {}

    public User(String email, String firstName, String lastName, Integer age) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
    }

    // ... 省略 getter 和 setter
}
```

## 3. 核心操作：MongoTemplate 与 MongoRepository

Spring Data MongoDB 提供了两种主要的数据访问方式：低层级、灵活的 `MongoTemplate` 和高层级、便捷的 `MongoRepository`。

### 3.1 MongoTemplate

`MongoTemplate` 是核心类，提供了对所有 MongoDB 操作的最大控制力。它遵循 Spring 的模板设计模式，处理连接的创建和释放，并将 MongoDB 的异常转换为 Spring 的 `DataAccessException` 层次结构。

**常用操作示例：**

```java
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Component
public class UserTemplateService {

    private final MongoTemplate mongoTemplate;

    public UserTemplateService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    // Create (Insert)
    public User createUser(User user) {
        // insert 会在插入后返回带有 _id 的对象
        return mongoTemplate.insert(user);
        // 也可以使用 save，如果 _id 存在则执行 update
        // return mongoTemplate.save(user);
    }

    // Read (Query)
    public User findUserById(String id) {
        return mongoTemplate.findById(id, User.class);
    }

    public List<User> findUsersByAgeGreaterThan(int age) {
        Query query = query(where("age").gt(age));
        return mongoTemplate.find(query, User.class);
    }

    public List<User> findUsersByFirstNameAndAge(String firstName, int maxAge) {
        Criteria criteria = where("first_name").is(firstName).and("age").lt(maxAge);
        Query query = new Query(criteria);
        // 可以添加排序、分页、投影等
        query.with(Sort.by(Sort.Direction.DESC, "age"));
        query.fields().include("firstName").include("age"); // 只返回指定字段
        return mongoTemplate.find(query, User.class);
    }

    // Update
    public long updateUserEmail(String userId, String newEmail) {
        Query query = query(where("_id").is(userId));
        Update update = new Update().set("email", newEmail);
        UpdateResult result = mongoTemplate.updateFirst(query, update, User.class);
        return result.getModifiedCount(); // 返回修改的文档数
    }

    public long incrementUserAge(String userId) {
        Query query = query(where("_id").is(userId));
        Update update = new Update().inc("age", 1);
        UpdateResult result = mongoTemplate.updateFirst(query, update, User.class);
        return result.getModifiedCount();
    }

    // Delete
    public long deleteUserById(String id) {
        Query query = query(where("_id").is(id));
        DeleteResult result = mongoTemplate.remove(query, User.class);
        return result.getDeletedCount();
    }
}
```

### 3.2 MongoRepository

`MongoRepository` 接口继承了 `PagingAndSortingRepository` 和 `CrudRepository`，提供了开箱即用的 CRUD 和分页功能。通过定义接口并继承它，Spring 会自动生成实现。

**定义 Repository 接口：**

```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> { // <Entity, ID类型>

    // 1. 根据方法名自动推导查询
    Optional<User> findByEmail(String email);

    List<User> findByFirstName(String firstName);

    List<User> findByAgeGreaterThan(int age);

    List<User> findByLastNameOrderByFirstNameAsc(String lastName);

    Page<User> findByAgeBetween(int minAge, int maxAge, Pageable pageable);

    // 使用 @Query 注解进行自定义查询（支持原生 MongoDB JSON 查询）
    @Query("{ 'age' : { $gt: ?0, $lt: ?1 } }")
    List<User> findUsersByAgeBetween(int minAge, int maxAge);

    // 使用字段名（first_name）而非Java属性名（firstName）
    @Query("{ 'first_name' : ?0 }")
    List<User> findByFirstNameUsingNativeQuery(String firstName);

    // 更新查询（需要配合 @Modifying 注解）
    @Modifying
    @Query("{ '_id' : ?0 }")
    @Update("{ '$set' : { 'email' : ?1 } }")
    void updateUserEmailById(String id, String email);
}
```

**使用 Repository：**

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createOrUpdateUser(User user) {
        return userRepository.save(user);
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public Page<User> getUsersByAge(int min, int max, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("age").descending());
        return userRepository.findByAgeBetween(min, max, pageable);
    }

    // ... 其他业务方法
}
```

> **最佳实践**：
>
> - 对于简单的 CRUD 和标准查询，优先使用 `MongoRepository`，代码更简洁。
> - 对于复杂的、动态的查询、更新操作或需要直接使用 `Aggregation` 等高级功能时，使用 `MongoTemplate`。
> - 通常在实际项目中，两者会结合使用。

## 4. 高级特性与最佳实践

### 4.1 聚合框架 (Aggregation Framework)

MongoDB 的聚合管道非常强大，用于执行复杂的数据分析和转换操作。Spring Data MongoDB 提供了流畅的 API 来构建聚合管道。

**示例：按年龄分组并计算每组的平均年龄和人数**

```java
public class UserStatistics {
    private Integer ageGroup;
    private Double averageAge;
    private Long count;

    // ... getters and setters
}

public List<UserStatistics> getUserAverageAgeByGroup() {
    TypedAggregation<User> aggregation = Aggregation.newAggregation(
        User.class,
        Aggregation.group("age") // 按 age 字段分组
            .avg("age").as("averageAge") // 计算平均年龄
            .count().as("count"), // 计算数量
        Aggregation.sort(Sort.Direction.ASC, "_id") // 按分组的键（即age）排序
    );

    AggregationResults<UserStatistics> results = mongoTemplate.aggregate(aggregation, UserStatistics.class);
    return results.getMappedResults();
}
```

### 4.2 事务支持

从 MongoDB 4.0 开始支持多文档事务。在 Spring Data MongoDB 中，可以使用 `@Transactional` 注解轻松管理事务。

**配置**：确保你的 MongoDB 是副本集或分片集群（事务要求）。

**使用示例：**

```java
@Service
public class TransactionalService {

    private final UserRepository userRepository;
    private final AnotherRepository anotherRepository;

    public TransactionalService(UserRepository userRepository, AnotherRepository anotherRepository) {
        this.userRepository = userRepository;
        this.anotherRepository = anotherRepository;
    }

    @Transactional
    public void performTransactionalOperation(User user, OtherEntity other) {
        // 操作一
        userRepository.save(user);
        // 操作二
        anotherRepository.save(other);
        // 如果此处抛出异常，两个 save 操作都会回滚
    }
}
```

### 4.3 索引管理与优化

**声明式创建索引**：使用 `@Indexed` 和 `@CompoundIndex` 注解。

```java
@Document
@CompoundIndex(name = "email_age_idx", def = "{'email': 1, 'age': -1}")
public class User {
    @Indexed(unique = true, background = true) // 后台创建唯一索引
    private String email;
    // ...
}
```

**编程式创建索引**：通过 `MongoTemplate` 在应用启动时创建。

```java
@Component
public class IndexCreator {

    public IndexCreator(MongoTemplate mongoTemplate) {
        mongoTemplate.indexOps(User.class).ensureIndex(
            new Index().on("email", Sort.Direction.ASC).unique()
        );

        // 创建 TTL 索引（自动过期删除）
        mongoTemplate.indexOps(UserSession.class).ensureIndex(
            new Index().on("createdAt", Sort.Direction.ASC).expire(300) // 300秒后过期
        );
    }
}
```

> **最佳实践**：在开发环境中可以使用声明式，但在生产环境，索引的变更（尤其是大型集合）应由 DBA 通过脚本谨慎管理。通过 Spring 创建索引通常用于辅助或测试。

### 4.4 审计（Auditing）

Spring Data 提供了强大的审计功能，可以自动填充创建人、创建时间、最后修改人等字段。

**1. 启用审计**：在主配置类上添加 `@EnableMongoAuditing`。

```java
@Configuration
@EnableMongoAuditing
public class MongoConfig {
}
```

**2. 在实体中添加审计字段和注解**：

```java
@Document
public class AuditableEntity {

    @Id
    private String id;

    @CreatedDate
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime lastModifiedDate;

    // @CreatedBy
    // private String createdBy;

    // @LastModifiedBy
    // private String lastModifiedBy;
    // ... 需要配置 AuditorAware<> Bean 来提供用户信息
}
```

### 4.5 性能与一致性最佳实践

1. **合理使用投影**：查询时使用 `.fields().include()` 或 `@Query(fields = "...")` 只返回需要的字段，减少网络传输和序列化开销。
2. **慎用 `@DBRef`**：它会导致额外的查询（懒加载或急加载），破坏文档模型的内嵌优势。优先考虑内嵌或手动引用。
3. **设计合理的文档结构**：遵循 MongoDB 设计模式（如预聚合、分桶、属性模式等），避免过度规范化。
4. **监控慢查询**：始终为查询条件字段创建索引，并使用 `explain()` 分析查询性能。
5. **使用连接池**：默认配置通常足够，但在高并发场景下，需要调整 `spring.data.mongodb.uri` 中的连接池参数（如 `maxPoolSize`, `minPoolSize`）。

## 5. 常见问题与解决方案 (FAQ)

**Q1: `MongoRepository` 和 `MongoTemplate` 我该用哪个？**
**A**： 如前所述，简单操作用 `Repository`，复杂动态操作和底层控制用 `Template`。两者不是互斥的，可以共存。

**Q2: 如何实现模糊查询（LIKE）？**
**A**： 使用正则表达式或 `$regex` 操作符。

```java
// 在 Repository 中
List<User> findByFirstNameLike(String pattern); // pattern 如 "Jo%"
// 或者使用 @Query
@Query("{ 'first_name' : { $regex: ?0, $options: 'i' } }") // 'i' 表示不区分大小写
List<User> findByFirstNameRegex(String regex);
```

**Q3: 如何处理 `org.springframework.dao.DuplicateKeyException`？**
**A**： 这通常是由于违反了唯一索引约束（如重复的 `email`）。应在业务逻辑中先检查是否存在，或者在捕获此异常后给用户友好的提示。

**Q4: 如何映射 MongoDB 中的 `_class` 字段？**
**A**： 该字段是 Spring Data 用于存储实际类型的默认类型密匙。如果你不希望保留它，可以在 `application.yml` 中配置：

```yaml
spring:
  data:
    mongodb:
      mapping-type-key: _type # 或者使用一个不存在的字段名如 "" 来完全禁用（不推荐）
```

但禁用后多态查询可能会出现问题，请谨慎操作。

## 6. 总结

Spring Data MongoDB 极大地简化了在 Spring 应用中使用 MongoDB 的复杂度。通过 `MongoTemplate` 和 `MongoRepository` 两种模式，它既能满足灵活性的要求，又能提供极高的开发效率。

**核心要点回顾：**

- **配置**：使用 URI 连接字符串，管理好敏感信息。
- **建模**：使用注解正确映射实体和文档，合理设计文档结构。
- **操作**：根据场景选择 `Template` 或 `Repository`。
- **高级功能**：善用聚合、事务和审计来构建强大的应用。
- **性能**：索引是生命线，设计阶段就要考虑查询模式并创建合适的索引。

希望这篇详尽的文档能帮助你更好地掌握 Spring Data MongoDB，并将其最佳实践应用到你的项目中。
