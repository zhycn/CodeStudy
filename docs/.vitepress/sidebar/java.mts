// Java 编程指南
const javaSidebar = [
  {
    text: '语言基础与核心概念',
    items: [
      { text: 'Java 编程语言简介', link: '/java/java-introduction' },
      { text: 'Java 各版本主要特性', link: '/java/java-version-features' },
      { text: '开发环境配置', link: '/java/java-development-environment' },
      { text: '基础语法', link: '/java/java-basic-syntax' },
      { text: '注释', link: '/java/java-comments' },
      { text: '修饰符', link: '/java/java-modifier' },
      { text: '流程控制', link: '/java/java-control-flow' },
      { text: '运算符', link: '/java/java-operators' },
      { text: '关键字与保留字', link: '/java/java-keywords' },
      { text: '变量命名规则', link: '/java/java-variable-naming' },
      { text: '基本数据类型', link: '/java/java-datatypes' },
      { text: '数组（Array）', link: '/java/java-array' },
      { text: '包（Package）', link: '/java/java-package' },
      { text: '模块化（Modularity）', link: '/java/java-modularity' },
      { text: '泛型（Generic）', link: '/java/java-generics' },
      { text: '注解（Annotation）', link: '/java/java-annotation' },
      { text: '反射（Reflection）', link: '/java/java-reflection' },
      { text: 'Invoke 动态调用', link: '/java/java-invoke' }
    ]
  },
  {
    text: '面向对象编程',
    items: [
      { text: 'OOP 面向对象核心思想', link: '/java/java-oop' },
      { text: '对象和类', link: '/java/java-object-classes' },
      { text: '构造方法', link: '/java/java-constructor' },
      { text: 'this 和 super', link: '/java/java-this-super' },
      { text: 'Interface 接口', link: '/java/java-interface' },
      { text: 'Enum 枚举', link: '/java/java-enum' },
      { text: 'Record 记录类', link: '/java/java-record' },
      { text: '密封类 (Sealed Class) ', link: '/java/java-sealed-class' },
      { text: 'JavaBean 规范', link: '/java/java-bean' }
    ]
  },
  {
    text: '核心工具库',
    items: [
      { text: 'String 字符串', link: '/java/java-string' },
      { text: 'Number 数值', link: '/java/java-number' },
      { text: 'BigInteger & BigDecimal', link: '/java/java-biginteger-bigdecimal' },
      { text: 'StringJoiner', link: '/java/java-string-joiner' },
      { text: '日期时间', link: '/java/java-date-time' },
      { text: '异常处理', link: '/java/java-exception' },
      { text: '常用异常类', link: '/java/java-exception-guides' },
      { text: 'Objects 工具类', link: '/java/java-objects' },
      { text: 'Arrays 工具类', link: '/java/java-arrays' },
      { text: 'Math 类', link: '/java/java-math' },
      { text: 'Random 工具类', link: '/java/java-random' },
      { text: 'Base64 编码', link: '/java/java-base64' },
      { text: 'Properties 属性类', link: '/java/java-properties' },
      { text: '资源绑定（Resource Bundle）', link: '/java/java-resource-bundle' },
      { text: '国际化与本地化', link: '/java/java-i18n' },
      { text: 'Timer (不建议使用)', link: '/java/java-timer' },
      { text: '正则表达式', link: '/java/java-regular-expression' }
    ]
  },
  {
    text: '集合框架',
    items: [
      { text: '集合框架概述', link: '/java/java-collection-framework' },
      { text: 'List 集合', link: '/java/java-list' },
      { text: 'Set 集合', link: '/java/java-set' },
      { text: 'Map 集合', link: '/java/java-map' },
      { text: 'Queue 集合', link: '/java/java-queue' },
      { text: 'Deque 集合', link: '/java/java-deque' },
      { text: 'Iterator 迭代器', link: '/java/java-iterator' },
      { text: 'Collections 工具类', link: '/java/java-collections' },
      { text: 'Comparator 比较器', link: '/java/java-comparator' },
      { text: 'Collectors 工具类', link: '/java/java-collectors' }
    ]
  },
  {
    text: '函数式编程与流处理',
    items: [
      { text: 'Lambda 表达式', link: '/java/java-lambda' },
      { text: '函数式接口（Functional Interface）', link: '/java/java-functional-interface' },
      { text: 'Stream API', link: '/java/java-stream' },
      { text: 'Optional', link: '/java/java-optional' }
    ]
  },
  {
    text: '输入输出与持久化',
    items: [
      { text: 'File 文件操作', link: '/java/java-file' },
      { text: 'IO 流', link: '/java/java-io' },
      { text: 'IO 核心组件', link: '/java/java-io-components' },
      { text: 'Scanner 类', link: '/java/java-scanner' },
      { text: '网络编程', link: '/java/java-network' },
      { text: 'HttpClient', link: '/java/java-httpclient' },
      { text: 'NIO（非阻塞 IO）', link: '/java/java-nio' },
      { text: 'NIO 核心组件', link: '/java/java-nio-components' },
      { text: 'JDBC 数据库编程', link: '/java/java-jdbc' },
      { text: 'SQL 编程', link: '/java/java-sql' },
      { text: '序列化与反序列化', link: '/java/java-serializable' },
      { text: 'XML 处理 (DOM, SAX, JAXB)', link: '/java/java-xml' },
      { text: '压缩与解压缩', link: '/java/java-compression' }
    ]
  },
  {
    text: '并发编程',
    items: [
      { text: '多线程编程', link: '/java/java-multi-threading' },
      { text: '内存模型 (JMM)', link: '/java/java-jmm' },
      { text: '并发编程 (JUC)', link: '/java/java-juc' },
      { text: '并发核心接口', link: '/java/java-concurrent-apis' },
      { text: '线程池', link: '/java/java-thread-pool' },
      { text: 'ThreadLocal', link: '/java/java-threadlocal' },
      { text: 'Future 接口', link: '/java/java-future' },
      { text: 'Fork/Join 框架', link: '/java/java-fork-join' }
    ]
  },
  {
    text: 'JVM 与性能调优',
    items: [
      { text: 'JVM 详解', link: '/java/java-jvm' },
      { text: '类加载机制', link: '/java/java-class-loading' },
      { text: '垃圾回收 (GC)', link: '/java/java-gc' },
      { text: 'JVM 调优', link: '/java/java-jvm-tuning' },
      { text: 'JDK 命令行工具', link: '/java/java-jdk-tools' },
      { text: 'jstat 工具', link: '/java/java-jstat' },
      { text: 'jstack 工具', link: '/java/java-jstack' },
      { text: 'jmap 工具', link: '/java/java-jmap' },
      { text: 'JConsole 工具', link: '/java/java-jconsole' }
    ]
  },
  {
    text: '安全、集成与部署',
    items: [
      { text: '加密与解密', link: '/java/java-cryptography' },
      { text: 'Security 安全接口', link: '/java/java-security' },
      { text: 'KeyTool 密钥工具', link: '/java/java-keytool' },
      { text: 'SPI 服务提供接口', link: '/java/java-spi' },
      { text: 'JNDI 命名与目录服务', link: '/java/java-jndi' },
      { text: 'Scripting 脚本编程', link: '/java/java-scripting' },
      { text: 'JNI (不建议使用)', link: '/java/java-jni' },
      { text: '进程与 Runtime', link: '/java/java-process-runtime' },
      { text: '系统属性（System Properties）', link: '/java/java-system-properties' }
    ]
  },
  {
    text: '设计模式',
    items: [
      { text: '单例模式与工厂模式', link: '/java/java-design-pattern-p1' },
      { text: '代理模式与模板方法模式', link: '/java/java-design-pattern-p2' },
      { text: '代码重构与设计模式', link: 'https://refactoringguru.cn/' }
    ]
  },
  {
    text: '其他与最佳实践',
    items: [
      { text: '日志框架', link: '/java/java-logging' },
      { text: '高效图片处理', link: '/java/java-imageio' },
      { text: '已过时的技术', link: '/java/java-deprecated' }
    ]
  }
]

export default javaSidebar