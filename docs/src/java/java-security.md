---
title: Java Security 详解与最佳实践
author: zhycn
---

# Java Security 详解与最佳实践

本文将全面探讨 Java Security 框架的核心组件、工作原理和最佳实践，帮助开发者构建更安全的 Java 应用程序。

## 1 Java Security 架构概述

Java Security 架构是 Java 平台安全性的核心基础，提供了密码学服务、访问控制、密钥管理、证书路径验证、安全随机数生成等关键功能。其设计目标是构建一个**可扩展、可插拔、权限驱动**的安全框架。

### 1.1 核心架构组件

Java 安全体系由以下几个关键部分组成：

- **JCA (Java Cryptography Architecture)** - 密码体系结构，提供基本密码框架
- **JCE (Java Cryptography Extension)** - 密码学扩展，提供更强大的加密算法
- **JAAS (Java Authentication and Authorization Service)** - 认证与授权服务
- **JSSE (Java Secure Socket Extension)** - SSL/TLS 安全套接字扩展
- **PKI (Public Key Infrastructure) APIs** - 公钥基础设施 API，处理数字证书

## 2 `java.security` 核心接口详解

### 2.1 安全提供者 (`Provider`)

Java 安全框架采用**可插拔架构**，通过 `Provider` 类实现算法实现的灵活替换和扩展。每个 Provider 代表一个具体的密码学服务实现集合。

```java
// 获取已注册的安全提供者列表
import java.security.Provider;
import java.security.Security;

public class SecurityProviderExample {
    public static void main(String[] args) {
        Provider[] providers = Security.getProviders();
        for (Provider provider : providers) {
            System.out.println("Provider: " + provider.getName());
            System.out.println("Version: " + provider.getVersion());
            System.out.println("Info: " + provider.getInfo());
            System.out.println("--------------------");
        }

        // 使用特定提供者获取算法实例
        try {
            // 请求使用Bouncy Castle提供者的SHA-256实现
            // MessageDigest md = MessageDigest.getInstance("SHA-256", "BC");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 2.2 密钥接口体系

#### 2.2.1 `Key` 接口

`Key` 接口是所有密钥的顶层接口，定义了密钥的基本属性和方法。

```java
// Key接口定义的主要方法
public interface Key extends java.io.Serializable {
    public String getAlgorithm();  // 获取算法名称
    public String getFormat();     // 获取编码格式
    public byte[] getEncoded();    // 获取编码后的密钥内容
}
```

#### 2.2.2 `PublicKey` 和 `PrivateKey` 接口

`PublicKey` 和 `PrivateKey` 是标记接口，分别表示公钥和私钥，继承自 `Key` 接口。

```java
// 非对称密钥对生成示例
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;

public class KeyPairExample {
    public static void main(String[] args) {
        try {
            // 创建KeyPairGenerator实例（RSA算法）
            KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance("RSA");

            // 初始化密钥长度
            keyPairGen.initialize(2048);

            // 生成密钥对
            KeyPair keyPair = keyPairGen.generateKeyPair();

            // 获取公钥和私钥
            PublicKey publicKey = keyPair.getPublic();
            PrivateKey privateKey = keyPair.getPrivate();

            System.out.println("Public Key: " + publicKey.getAlgorithm());
            System.out.println("Public Key Format: " + publicKey.getFormat());
            System.out.println("Private Key: " + privateKey.getAlgorithm());
            System.out.println("Private Key Format: " + privateKey.getFormat());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

#### 2.2.3 `SecretKey` 接口

`SecretKey` 接口表示对称密钥，也继承自 `Key` 接口。

```java
// 对称密钥生成示例
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

public class SecretKeyExample {
    public static void main(String[] args) {
        try {
            // 创建KeyGenerator实例（AES算法）
            KeyGenerator keyGen = KeyGenerator.getInstance("AES");

            // 初始化密钥长度
            keyGen.init(256);

            // 生成密钥
            SecretKey secretKey = keyGen.generateKey();

            System.out.println("Secret Key Algorithm: " + secretKey.getAlgorithm());
            System.out.println("Secret Key Format: " + secretKey.getFormat());
            System.out.println("Secret Key Length: " + secretKey.getEncoded().length * 8 + " bits");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 2.3 消息摘要 (`MessageDigest`)

`MessageDigest` 类为应用程序提供了消息摘要算法的功能，如 SHA-256 或 MD5。摘要算法用于生成数据的固定长度哈希值，对于任何微小的数据更改，哈希值都会发生巨大变化。

```java
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class MessageDigestExample {
    public static void main(String[] args) {
        try {
            String message = "Hello, Java Security!";

            // 创建MessageDigest实例（SHA-256算法）
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            // 更新要计算摘要的消息
            digest.update(message.getBytes());

            // 计算摘要
            byte[] hash = digest.digest();

            // 将字节数组转换为十六进制字符串
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            System.out.println("Original Message: " + message);
            System.out.println("SHA-256 Hash: " + hexString.toString());
            System.out.println("Hash Length: " + hash.length * 8 + " bits");

        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
    }
}
```

### 2.4 数字签名 (`Signature`)

`Signature` 类用于为应用程序提供数字签名算法的功能。签名是验证数据完整性和来源的一种方法。

```java
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;

public class SignatureExample {
    public static void main(String[] args) {
        try {
            String message = "Important data to be signed";

            // 生成密钥对
            KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance("RSA");
            keyPairGen.initialize(2048);
            KeyPair keyPair = keyPairGen.generateKeyPair();
            PrivateKey privateKey = keyPair.getPrivate();
            PublicKey publicKey = keyPair.getPublic();

            // 创建Signature实例（SHA256withRSA算法）
            Signature signature = Signature.getInstance("SHA256withRSA");

            // 签名初始化
            signature.initSign(privateKey);

            // 更新要签名的数据
            signature.update(message.getBytes());

            // 生成签名
            byte[] digitalSignature = signature.sign();

            System.out.println("Original Message: " + message);
            System.out.println("Signature Length: " + digitalSignature.length + " bytes");

            // 验证签名
            signature.initVerify(publicKey);
            signature.update(message.getBytes());
            boolean isVerified = signature.verify(digitalSignature);

            System.out.println("Signature Verified: " + isVerified);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 2.5 密钥库 (`KeyStore`)

`KeyStore` 类代表了密码密钥和证书的存储设施。通过 `KeyStore`，我们可以加载、保存和管理密钥仓库。

```java
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.Certificate;
import java.util.Enumeration;

public class KeyStoreExample {
    public static void main(String[] args) {
        try {
            // 创建KeyStore实例（JKS类型）
            KeyStore keyStore = KeyStore.getInstance("JKS");

            // 加载KeyStore（如果是新创建，使用null输入流和密码）
            char[] password = "changeit".toCharArray();
            keyStore.load(null, password);

            // 生成密钥对并创建自签名证书（这里需要证书相关信息）
            // 实际应用中通常从CA获取证书

            // 保存KeyStore到文件
            try (FileOutputStream fos = new FileOutputStream("keystore.jks")) {
                keyStore.store(fos, password);
            }

            System.out.println("KeyStore created successfully!");

            // 加载已存在的KeyStore
            KeyStore loadedKeyStore = KeyStore.getInstance("JKS");
            try (FileInputStream fis = new FileInputStream("keystore.jks")) {
                loadedKeyStore.load(fis, password);
            }

            // 列出KeyStore中的所有别名
            Enumeration<String> aliases = loadedKeyStore.aliases();
            while (aliases.hasMoreElements()) {
                String alias = aliases.nextElement();
                System.out.println("Alias: " + alias);
                System.out.println("Is Key Entry: " + loadedKeyStore.isKeyEntry(alias));
                System.out.println("Is Certificate Entry: " + loadedKeyStore.isCertificateEntry(alias));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 2.6 安全随机数 (`SecureRandom`)

`SecureRandom` 类提供了一个密码强的随机数生成器（RNG），用于生成用于密钥、盐值、IV等的不可预测随机字节。

```java
import java.security.SecureRandom;

public class SecureRandomExample {
    public static void main(String[] args) {
        try {
            // 创建SecureRandom实例
            SecureRandom secureRandom = SecureRandom.getInstanceStrong(); // 使用平台最强的配置

            // 生成随机字节
            byte[] randomBytes = new byte[32];
            secureRandom.nextBytes(randomBytes);

            // 将随机字节转换为十六进制字符串
            StringBuilder sb = new StringBuilder();
            for (byte b : randomBytes) {
                sb.append(String.format("%02x", b));
            }

            System.out.println("Random Bytes: " + sb.toString());
            System.out.println("Random Bytes Length: " + randomBytes.length + " bytes");

            // 生成随机整数
            int randomInt = secureRandom.nextInt();
            System.out.println("Random Integer: " + randomInt);

            // 生成指定范围内的随机整数
            int randomInRange = secureRandom.nextInt(100);
            System.out.println("Random Number (0-99): " + randomInRange);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 2.7 证书接口 (`Certificate`)

`Certificate` 类（已弃用）及其替代品 `java.security.cert.Certificate` 用于处理数字证书。

```java
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.Date;

public class CertificateExample {
    public static void main(String[] args) {
        try {
            // 加载KeyStore
            KeyStore keyStore = KeyStore.getInstance("JKS");
            char[] password = "changeit".toCharArray();
            try (FileInputStream fis = new FileInputStream("keystore.jks")) {
                keyStore.load(fis, password);
            }

            // 获取证书
            String alias = "myalias"; // 假设存在的别名
            Certificate cert = keyStore.getCertificate(alias);

            if (cert instanceof X509Certificate) {
                X509Certificate x509Cert = (X509Certificate) cert;

                System.out.println("Subject: " + x509Cert.getSubjectDN());
                System.out.println("Issuer: " + x509Cert.getIssuerDN());
                System.out.println("Serial Number: " + x509Cert.getSerialNumber());
                System.out.println("Not Before: " + x509Cert.getNotBefore());
                System.out.println("Not After: " + x509Cert.getNotAfter());
                System.out.println("Signature Algorithm: " + x509Cert.getSigAlgName());

                // 验证证书有效期
                Date currentDate = new Date();
                try {
                    x509Cert.checkValidity(currentDate);
                    System.out.println("Certificate is valid as of " + currentDate);
                } catch (Exception e) {
                    System.out.println("Certificate is not valid: " + e.getMessage());
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

## 3 Java Security 最佳实践

### 3.1 输入验证和清理

**验证所有输入**：确保应用程序接收到的所有输入都是预期的格式和范围。防止注入攻击（如 SQL注入、XSS）的一种有效方法是严格验证和清理输入数据。

**使用白名单**：尽量使用白名单来验证输入，即只允许符合预期格式的数据通过，而不是尝试过滤掉不良输入。

```java
import java.util.regex.Pattern;

public class InputValidation {

    // 使用白名单验证用户名（只允许字母、数字和下划线，长度3-20字符）
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{3,20}$");

    // 使用白名单验证邮箱地址
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,6}$", Pattern.CASE_INSENSITIVE);

    public static boolean isValidUsername(String username) {
        return USERNAME_PATTERN.matcher(username).matches();
    }

    public static boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    public static String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }
        // 移除危险字符，防止XSS攻击
        return input.replaceAll("[<>\"']", "");
    }

    public static void main(String[] args) {
        // 测试输入验证
        String[] testUsernames = {"user1", "user@", "us", "user_name_123"};
        String[] testEmails = {"test@example.com", "invalid-email", "test@domain"};

        System.out.println("Username Validation:");
        for (String username : testUsernames) {
            System.out.println(username + ": " + isValidUsername(username));
        }

        System.out.println("\nEmail Validation:");
        for (String email : testEmails) {
            System.out.println(email + ": " + isValidEmail(email));
        }

        // 测试输入清理
        String userInput = "<script>alert('XSS')</script>Hello World";
        System.out.println("\nInput Sanitization:");
        System.out.println("Original: " + userInput);
        System.out.println("Sanitized: " + sanitizeInput(userInput));
    }
}
```

### 3.2 使用安全的加密算法和密钥管理

**选择强加密算法**：避免使用已知弱算法（如DES、MD5），选择强算法（如AES、SHA-256、RSA）。

**安全存储密钥**：不要在代码中硬编码密码、密钥等敏感信息。使用环境变量或安全的配置管理工具。

```java
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.SecureRandom;
import java.util.Base64;

public class EncryptionBestPractice {

    private static final int AES_KEY_SIZE = 256;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;

    public static void main(String[] args) {
        try {
            String plainText = "Sensitive data that needs encryption";

            // 1. 生成强加密密钥
            KeyGenerator keyGen = KeyGenerator.getInstance("AES");
            keyGen.init(AES_KEY_SIZE);
            SecretKey secretKey = keyGen.generateKey();

            // 2. 生成随机IV（初始化向量）
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // 3. 使用AES/GCM/NoPadding模式加密
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);

            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);
            byte[] cipherText = cipher.doFinal(plainText.getBytes());

            // 4. 将IV和密文一起存储/传输
            byte[] encryptedData = new byte[GCM_IV_LENGTH + cipherText.length];
            System.arraycopy(iv, 0, encryptedData, 0, GCM_IV_LENGTH);
            System.arraycopy(cipherText, 0, encryptedData, GCM_IV_LENGTH, cipherText.length);

            String encodedData = Base64.getEncoder().encodeToString(encryptedData);
            System.out.println("Encrypted Data: " + encodedData);

            // 5. 解密过程
            byte[] decodedData = Base64.getDecoder().decode(encodedData);

            // 提取IV
            byte[] extractedIv = new byte[GCM_IV_LENGTH];
            System.arraycopy(decodedData, 0, extractedIv, 0, GCM_IV_LENGTH);

            // 提取密文
            byte[] extractedCipherText = new byte[decodedData.length - GCM_IV_LENGTH];
            System.arraycopy(decodedData, GCM_IV_LENGTH, extractedCipherText, 0, extractedCipherText.length);

            // 初始化解密模式
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH * 8, extractedIv));
            byte[] decryptedText = cipher.doFinal(extractedCipherText);

            System.out.println("Decrypted Text: " + new String(decryptedText));

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 3.3 安全身份验证和授权

**实施强密码策略**：要求用户使用强密码，并定期更新密码。

**使用多因素认证**：增加一个额外的安全层，比如短信验证码或认证应用。

**基于角色的访问控制 (RBAC)**：根据用户的角色授予权限，确保用户只能访问他们有权限的资源。

```java
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class AuthenticationBestPractice {

    // 模拟用户存储（实际应用中应使用数据库）
    private static Map<String, User> userStore = new HashMap<>();

    static {
        // 添加示例用户
        userStore.put("alice", new User("alice", hashPassword("StrongPassword123"),
                new String[]{"USER"}));
        userStore.put("bob", new User("bob", hashPassword("SecurePass456"),
                new String[]{"USER", "EDITOR"}));
        userStore.put("admin", new User("admin", hashPassword("AdminPassword789"),
                new String[]{"USER", "ADMIN"}));
    }

    // 密码哈希函数
    public static String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashedPassword = md.digest(password.getBytes());

            // 添加盐值（实际应用中应使用随机盐值）
            byte[] salt = "FixedSaltForExample".getBytes(); // 仅示例，实际应用应使用随机盐
            md.update(salt);
            hashedPassword = md.digest(hashedPassword);

            // 多次哈希（实际应用中应使用标准算法如PBKDF2、bcrypt或scrypt）
            for (int i = 0; i < 1000; i++) {
                md.update(hashedPassword);
                hashedPassword = md.digest();
            }

            return bytesToHex(hashedPassword);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    // 字节数组转十六进制字符串
    private static String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    // 用户认证
    public static boolean authenticate(String username, String password) {
        User user = userStore.get(username);
        if (user == null) {
            // 用户不存在
            return false;
        }

        String hashedInput = hashPassword(password);
        return user.getPasswordHash().equals(hashedInput);
    }

    // 访问控制检查
    public static boolean hasPermission(String username, String requiredRole) {
        User user = userStore.get(username);
        if (user == null) {
            return false;
        }

        return Arrays.asList(user.getRoles()).contains(requiredRole);
    }

    public static void main(String[] args) {
        // 测试认证
        System.out.println("Authentication Tests:");
        System.out.println("alice with correct password: " + authenticate("alice", "StrongPassword123"));
        System.out.println("alice with wrong password: " + authenticate("alice", "WrongPassword"));
        System.out.println("nonexistent user: " + authenticate("eve", "SomePassword"));

        // 测试授权
        System.out.println("\nAuthorization Tests:");
        System.out.println("alice has USER role: " + hasPermission("alice", "USER"));
        System.out.println("alice has ADMIN role: " + hasPermission("alice", "ADMIN"));
        System.out.println("bob has EDITOR role: " + hasPermission("bob", "EDITOR"));
        System.out.println("admin has ADMIN role: " + hasPermission("admin", "ADMIN"));

        // 演示密码哈希
        System.out.println("\nPassword Hashing Demonstration:");
        String password = "MySecurePassword";
        String hashed = hashPassword(password);
        System.out.println("Original: " + password);
        System.out.println("Hashed: " + hashed);
        System.out.println("Length: " + hashed.length() + " characters");
    }

    // 用户类
    static class User {
        private String username;
        private String passwordHash;
        private String[] roles;

        public User(String username, String passwordHash, String[] roles) {
            this.username = username;
            this.passwordHash = passwordHash;
            this.roles = roles;
        }

        public String getUsername() { return username; }
        public String getPasswordHash() { return passwordHash; }
        public String[] getRoles() { return roles; }
    }
}
```

### 3.4 安全通信和错误处理

**使用 SSL/TLS 加密通信**：确保数据在网络上传输时被加密，防止数据被窃听或篡改。

**安全的错误处理**：避免在错误信息中泄露内部实现细节或敏感信息。提供用户友好的错误信息，同时记录详细的错误日志以供开发和调试。

```java
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.UnknownHostException;

public class SecureCommunication {

    public static void main(String[] args) {
        String host = "example.com";
        int port = 443;

        try {
            // 创建SSL套接字工厂
            SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();

            // 创建SSL套接字
            SSLSocket socket = (SSLSocket) factory.createSocket(host, port);

            // 启用所有支持的密码套件
            String[] enabledCipherSuites = socket.getSupportedCipherSuites();
            socket.setEnabledCipherSuites(enabledCipherSuites);

            // 设置协议版本（禁用不安全的SSL版本）
            socket.setEnabledProtocols(new String[]{"TLSv1.2", "TLSv1.3"});

            // 创建读写流
            PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));

            // 发送HTTP请求
            out.println("GET / HTTP/1.1");
            out.println("Host: " + host);
            out.println("Connection: close");
            out.println();

            // 读取响应
            String line;
            while ((line = in.readLine()) != null) {
                System.out.println(line);
            }

            // 关闭连接
            out.close();
            in.close();
            socket.close();

        } catch (UnknownHostException e) {
            // 安全的错误处理：不向用户暴露内部细节
            System.err.println("Error: Unable to connect to host " + host);
            // 记录详细错误到日志（供管理员和开发者查看）
            System.err.println("Debug: Unknown host - " + e.getMessage());
        } catch (IOException e) {
            System.err.println("Error: Unable to establish secure connection");
            System.err.println("Debug: I/O error - " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error: An unexpected error occurred");
            System.err.println("Debug: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }
}
```

## 4 实际应用场景

### 4.1 防止 SQL 注入

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class SQLInjectionPrevention {

    public static void main(String[] args) {
        String dbUrl = "jdbc:mysql://localhost:3306/mydatabase";
        String dbUser = "username";
        String dbPassword = "password";

        // 用户输入（可能恶意的输入）
        String userInput = "admin'; DROP TABLE users; -- ";

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword)) {
            // 不安全的做法（字符串拼接，容易受到SQL注入攻击）
            // String unsafeQuery = "SELECT * FROM users WHERE username = '" + userInput + "'";

            // 安全的做法：使用参数化查询
            String safeQuery = "SELECT * FROM users WHERE username = ?";

            try (PreparedStatement pstmt = conn.prepareStatement(safeQuery)) {
                pstmt.setString(1, userInput); // 自动处理特殊字符

                try (ResultSet rs = pstmt.executeQuery()) {
                    while (rs.next()) {
                        System.out.println("User: " + rs.getString("username"));
                    }
                }
            }

            System.out.println("Query executed safely - no SQL injection occurred");

        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
            // 记录详细错误，但不向用户暴露数据库结构信息
        }
    }
}
```

### 4.2 密码加密存储

```java
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;

public class PasswordStorage {

    // 使用PBKDF2WithHmacSHA1算法进行密码哈希
    private static final String ALGORITHM = "PBKDF2WithHmacSHA1";
    private static final int ITERATIONS = 10000;
    private static final int SALT_LENGTH = 16; // 盐值长度（字节）
    private static final int KEY_LENGTH = 256; // 密钥长度（位）

    // 生成盐值
    public static byte[] generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[SALT_LENGTH];
        random.nextBytes(salt);
        return salt;
    }

    // 哈希密码
    public static String hashPassword(String password, byte[] salt)
            throws NoSuchAlgorithmException, InvalidKeySpecException {
        PBEKeySpec spec = new PBEKeySpec(
                password.toCharArray(),
                salt,
                ITERATIONS,
                KEY_LENGTH
        );

        SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
        byte[] hash = factory.generateSecret(spec).getEncoded();

        // 将盐值和哈希值组合存储
        byte[] combined = new byte[SALT_LENGTH + hash.length];
        System.arraycopy(salt, 0, combined, 0, SALT_LENGTH);
        System.arraycopy(hash, 0, combined, SALT_LENGTH, hash.length);

        return Base64.getEncoder().encodeToString(combined);
    }

    // 验证密码
    public static boolean verifyPassword(String password, String storedHash)
            throws NoSuchAlgorithmException, InvalidKeySpecException {
        // 解码存储的哈希值
        byte[] combined = Base64.getDecoder().decode(storedHash);

        // 提取盐值
        byte[] salt = new byte[SALT_LENGTH];
        System.arraycopy(combined, 0, salt, 0, SALT_LENGTH);

        // 提取存储的哈希值
        byte[] storedHashBytes = new byte[combined.length - SALT_LENGTH];
        System.arraycopy(combined, SALT_LENGTH, storedHashBytes, 0, storedHashBytes.length);

        // 计算输入密码的哈希值
        PBEKeySpec spec = new PBEKeySpec(
                password.toCharArray(),
                salt,
                ITERATIONS,
                KEY_LENGTH
        );

        SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
        byte[] testHash = factory.generateSecret(spec).getEncoded();

        // 比较哈希值
        return slowEquals(storedHashBytes, testHash);
    }

    // 安全比较字节数组（防止时序攻击）
    private static boolean slowEquals(byte[] a, byte[] b) {
        int diff = a.length ^ b.length;
        for (int i = 0; i < a.length && i < b.length; i++) {
            diff |= a[i] ^ b[i];
        }
        return diff == 0;
    }

    public static void main(String[] args) {
        try {
            String password = "MySecurePassword123";

            // 生成盐值并哈希密码
            byte[] salt = generateSalt();
            String hashedPassword = hashPassword(password, salt);

            System.out.println("Original Password: " + password);
            System.out.println("Hashed Password: " + hashedPassword);

            // 验证密码
            boolean correctPassword = verifyPassword(password, hashedPassword);
            System.out.println("Correct password: " + correctPassword);

            boolean wrongPassword = verifyPassword("WrongPassword", hashedPassword);
            System.out.println("Wrong password: " + wrongPassword);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

## 总结

Java Security 框架提供了一个强大而灵活的安全基础设施，涵盖了密码学、身份验证、授权和安全通信等多个方面。通过合理使用 `java.security` 包中的核心接口和类，并结合最佳实践，开发者可以构建出更加安全可靠的 Java 应用程序。

### 关键要点

1. **使用强加密算法**和适当的密钥长度
2. **正确管理密钥和证书**，避免硬编码敏感信息
3. **实施输入验证**和输出编码，防止注入攻击
4. **使用参数化查询**防止 SQL 注入
5. **安全地存储密码**，使用加盐哈希和适当的工作因子
6. **实施适当的访问控制**，遵循最小权限原则
7. **使用 SSL/TLS** 保护数据传输
8. **安全地处理错误**，不泄露敏感信息
9. **保持依赖项更新**，及时修补已知漏洞
10. **定期进行安全审计**和代码审查

通过遵循这些最佳实践，并结合具体的业务需求和安全威胁模型，您可以显著提高 Java 应用程序的安全性，保护用户数据和系统资源免受各种安全威胁。
