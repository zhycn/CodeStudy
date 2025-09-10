---
title: Java 网络编程详解与最佳实践
description: 这篇文章详细介绍了 Java 网络编程的基础概念、核心 API、协议、套接字、NIO 与 AIO、Netty 框架等内容。通过学习，你将能够理解网络编程的工作原理，掌握其在实际开发中的应用，避免常见的问题。
author: zhycn
---

# Java 网络编程详解与最佳实践

## 1. 网络编程基础

网络编程是指程序通过网络与其他设备或程序进行数据交换的过程，它是实现分布式系统、客户端/服务端架构、远程通信和微服务等技术的基础基础。Java 语言自诞生之初就提供了丰富的网络编程 API，随着版本的迭代，从传统的阻塞 I/O 到 NIO 和异步 AIO，再到强大的 Netty 框架，Java 在网络编程领域一直保持其强大和易用的特性。

### 1.1 核心概念与术语

理解网络编程需要掌握以下核心术语：

| 术语                     | 描述                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| **IP 地址**              | 网络中设备的唯一标识（如：192.168.1.1）                                          |
| **端口号**               | 应用程序通信的"门"，0~65535                                                      |
| **协议**                 | 通信双方约定的数据格式和规则（如 TCP、UDP、HTTP）                                |
| **Socket**               | 网络通信的端点，是网络通信的基础                                                 |
| **客户端/服务端（C/S）** | 客户端发起请求，服务端响应请求                                                   |
| **OSI 七层模型**         | 网络通信的分层模型（物理层、数据链路层、网络层、传输层、会话层、表示层、应用层） |

### 1.2 TCP/IP 模型与协议

TCP/IP 模型是实际应用中最广泛使用的网络模型，分为四层：

- **网络接口层**：负责物理连接和数据传输
- **网络层**：负责 IP 寻址和路由
- **传输层**：提供 TCP 和 UDP 两种传输协议
- **应用层**：包含各种应用协议，如 HTTP、FTP、SMTP

#### 1.2.1 TCP 与 UDP 对比

Java 同时支持 TCP 和 UDP 协议，两者在不同场景下各有优势：

| 对比项       | TCP                            | UDP                                |
| ------------ | ------------------------------ | ---------------------------------- |
| **是否可靠** | 是（有确认机制）               | 否（无确认）                       |
| **是否连接** | 是（三次握手）                 | 否（无连接）                       |
| **数据顺序** | 保证顺序                       | 不保证顺序                         |
| **传输效率** | 相对较低                       | 高                                 |
| **适用场景** | 文件传输、网页请求、数据库通信 | 视频会议、游戏、广播通信           |
| **Java 类**  | `Socket`、`ServerSocket`       | `DatagramSocket`、`DatagramPacket` |

## 2. Java 网络编程核心 API

Java 提供了 `java.net` 包来支持网络编程，该包包含了实现网络操作的各种类和接口。

### 2.1 基础网络类

#### 2.1.1 InetAddress 类

`InetAddress` 类用于表示 IP 地址，可以进行域名解析和地址转换：

```java
import java.net.InetAddress;

public class InetAddressExample {
    public static void main(String[] args) throws Exception {
        // 获取本机IP地址
        InetAddress localHost = InetAddress.getLocalHost();
        System.out.println("本地主机: " + localHost.getHostAddress());

        // 通过域名获取IP地址
        InetAddress baiduAddress = InetAddress.getByName("www.baidu.com");
        System.out.println("百度IP: " + baiduAddress.getHostAddress());

        // 获取所有地址
        InetAddress[] allAddresses = InetAddress.getAllByName("www.google.com");
        for (InetAddress addr : allAddresses) {
            System.out.println("Google IP: " + addr.getHostAddress());
        }
    }
}
```

#### 2.1.2 URL 和 URLConnection

URL 类用于表示统一资源定位符，可以访问网络资源：

```java
import java.io.*;
import java.net.*;

public class URLExample {
    public static void main(String[] args) {
        try {
            URL url = new URL("https://www.example.com");
            URLConnection connection = url.openConnection();
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(connection.getInputStream()));

            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
            reader.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 2.2 Socket 编程

#### 2.2.1 TCP 编程：Socket 和 ServerSocket

TCP 是面向连接的可靠协议，Java 提供了 `Socket` 和 `ServerSocket` 类来实现 TCP 通信。

**TCP 服务器示例**：

```java
import java.io.*;
import java.net.*;

public class TCPServer {
    private static final int PORT = 8888;

    public static void main(String[] args) {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("服务器启动，监听端口: " + PORT);

            while (true) {
                Socket clientSocket = serverSocket.accept();
                System.out.println("客户端连接: " + clientSocket.getInetAddress());

                // 为每个客户端创建新线程处理
                new Thread(new ClientHandler(clientSocket)).start();
            }
        } catch (IOException e) {
            System.err.println("服务器异常: " + e.getMessage());
        }
    }

    static class ClientHandler implements Runnable {
        private final Socket clientSocket;

        public ClientHandler(Socket socket) {
            this.clientSocket = socket;
        }

        @Override
        public void run() {
            try (BufferedReader in = new BufferedReader(
                 new InputStreamReader(clientSocket.getInputStream()));
                 PrintWriter out = new PrintWriter(
                 clientSocket.getOutputStream(), true)) {

                String message;
                while ((message = in.readLine()) != null) {
                    System.out.println("收到消息: " + message);
                    // 回声响应
                    out.println("服务器响应: " + message);
                }
            } catch (IOException e) {
                System.err.println("处理客户端请求异常: " + e.getMessage());
            } finally {
                try {
                    clientSocket.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

**TCP 客户端示例**：

```java
import java.io.*;
import java.net.*;

public class TCPClient {
    public static void main(String[] args) {
        String hostname = "localhost";
        int port = 8888;

        try (Socket socket = new Socket(hostname, port);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
             BufferedReader in = new BufferedReader(
                 new InputStreamReader(socket.getInputStream()));
             BufferedReader stdIn = new BufferedReader(
                 new InputStreamReader(System.in))) {

            System.out.println("已连接到服务器...");
            String userInput;

            while ((userInput = stdIn.readLine()) != null) {
                out.println(userInput);
                System.out.println("服务器响应: " + in.readLine());

                if ("exit".equalsIgnoreCase(userInput)) {
                    break;
                }
            }
        } catch (UnknownHostException e) {
            System.err.println("无法找到主机: " + hostname);
        } catch (IOException e) {
            System.err.println("I/O 错误: " + e.getMessage());
        }
    }
}
```

#### 2.2.2 UDP 编程：DatagramSocket 和 DatagramPacket

UDP 是无连接的协议，适用于对实时性要求高的应用。

**UDP 服务器示例**：

```java
import java.net.*;

public class UDPServer {
    private static final int PORT = 9999;

    public static void main(String[] args) {
        try (DatagramSocket socket = new DatagramSocket(PORT)) {
            System.out.println("UDP 服务器启动，监听端口: " + PORT);

            byte[] buffer = new byte[1024];

            while (true) {
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                socket.receive(packet);

                String received = new String(packet.getData(), 0, packet.getLength());
                System.out.println("收到消息: " + received);

                // 发送响应
                InetAddress clientAddress = packet.getAddress();
                int clientPort = packet.getPort();
                byte[] responseData = ("响应: " + received).getBytes();
                DatagramPacket responsePacket = new DatagramPacket(
                    responseData, responseData.length, clientAddress, clientPort);
                socket.send(responsePacket);
            }
        } catch (IOException e) {
            System.err.println("UDP 服务器异常: " + e.getMessage());
        }
    }
}
```

**UDP 客户端示例**：

```java
import java.net.*;

public class UDPClient {
    public static void main(String[] args) {
        String hostname = "localhost";
        int port = 9999;

        try (DatagramSocket socket = new DatagramSocket()) {
            InetAddress address = InetAddress.getByName(hostname);
            String message = "Hello UDP Server";
            byte[] sendData = message.getBytes();

            // 发送数据
            DatagramPacket sendPacket = new DatagramPacket(
                sendData, sendData.length, address, port);
            socket.send(sendPacket);

            // 接收响应
            byte[] receiveData = new byte[1024];
            DatagramPacket receivePacket = new DatagramPacket(receiveData, receiveData.length);
            socket.receive(receivePacket);

            String response = new String(receivePacket.getData(), 0, receivePacket.getLength());
            System.out.println("收到响应: " + response);
        } catch (IOException e) {
            System.err.println("UDP 客户端异常: " + e.getMessage());
        }
    }
}
```

### 2.3 HTTP 客户端操作

#### 2.3.1 HttpURLConnection

Java 标准库提供了 `HttpURLConnection` 类来处理 HTTP 请求：

```java
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public class HttpUrlConnectionExample {
    public static void main(String[] args) {
        try {
            URL url = new URL("https://httpbin.org/post");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            // 设置请求方法
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);

            // 设置请求头
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "application/json");

            // 设置超时
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            // 发送请求体
            String jsonInputString = "{\"name\": \"John\", \"age\": 30}";
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonInputString.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            // 读取响应
            int code = connection.getResponseCode();
            System.out.println("响应码: " + code);

            if (code == HttpURLConnection.HTTP_OK) {
                try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                    System.out.println("响应内容: " + response.toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

#### 2.3.2 HttpClient (Java 11+)

Java 11 引入了新的 `HttpClient`，提供更现代和灵活的 API：

```java
import java.net.URI;
import java.net.http.*;
import java.time.Duration;

public class HttpClientExample {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        // GET 请求示例
        HttpRequest getRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://httpbin.org/get"))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> getResponse = client.send(
                getRequest, HttpResponse.BodyHandlers.ofString());
        System.out.println("GET 响应: " + getResponse.body());

        // POST 请求示例
        HttpRequest postRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://httpbin.org/post"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"name\": \"John\"}"))
                .build();

        HttpResponse<String> postResponse = client.send(
                postRequest, HttpResponse.BodyHandlers.ofString());
        System.out.println("POST 响应: " + postResponse.body());

        // 异步请求示例
        HttpRequest asyncRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://httpbin.org/get"))
                .build();

        client.sendAsync(asyncRequest, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenAccept(System.out::println)
                .join();
    }
}
```

## 3. 高级网络编程主题

### 3.1 Java NIO (非阻塞 I/O)

Java NIO 提供了非阻塞 I/O 操作，适用于高并发场景。

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.util.Iterator;
import java.util.Set;

public class NioServer {
    private Selector selector;
    private ServerSocketChannel serverChannel;
    private final int port;

    public NioServer(int port) {
        this.port = port;
    }

    public void start() throws IOException {
        selector = Selector.open();
        serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(port));
        serverChannel.configureBlocking(false);
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("NIO 服务器启动，监听端口: " + port);

        while (true) {
            selector.select();
            Set<SelectionKey> selectedKeys = selector.selectedKeys();
            Iterator<SelectionKey> iter = selectedKeys.iterator();

            while (iter.hasNext()) {
                SelectionKey key = iter.next();

                if (key.isAcceptable()) {
                    handleAccept(key);
                }

                if (key.isReadable()) {
                    handleRead(key);
                }

                iter.remove();
            }
        }
    }

    private void handleAccept(SelectionKey key) throws IOException {
        ServerSocketChannel serverChannel = (ServerSocketChannel) key.channel();
        SocketChannel clientChannel = serverChannel.accept();
        clientChannel.configureBlocking(false);
        clientChannel.register(selector, SelectionKey.OP_READ);
        System.out.println("客户端连接: " + clientChannel.getRemoteAddress());
    }

    private void handleRead(SelectionKey key) throws IOException {
        SocketChannel clientChannel = (SocketChannel) key.channel();
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        int bytesRead = clientChannel.read(buffer);

        if (bytesRead == -1) {
            clientChannel.close();
            return;
        }

        buffer.flip();
        byte[] data = new byte[buffer.limit()];
        buffer.get(data);
        String message = new String(data);
        System.out.println("收到消息: " + message);

        // 回声响应
        ByteBuffer responseBuffer = ByteBuffer.wrap(("响应: " + message).getBytes());
        clientChannel.write(responseBuffer);
        buffer.clear();
    }

    public static void main(String[] args) throws IOException {
        NioServer server = new NioServer(8888);
        server.start();
    }
}
```

### 3.2 Netty 框架简介

Netty 是一个高性能的异步事件驱动的网络应用程序框架，适用于需要高性能网络编程的场景。

```java
// Netty 服务器示例 (需要添加Netty依赖)
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;

public class NettyServer {
    private final int port;

    public NettyServer(int port) {
        this.port = port;
    }

    public void run() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();

        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class)
             .childHandler(new ChannelInitializer<SocketChannel>() {
                 @Override
                 public void initChannel(SocketChannel ch) {
                     ChannelPipeline pipeline = ch.pipeline();
                     pipeline.addLast(new StringDecoder());
                     pipeline.addLast(new StringEncoder());
                     pipeline.addLast(new ServerHandler());
                 }
             })
             .option(ChannelOption.SO_BACKLOG, 128)
             .childOption(ChannelOption.SO_KEEPALIVE, true);

            ChannelFuture f = b.bind(port).sync();
            System.out.println("Netty 服务器启动，监听端口: " + port);

            f.channel().closeFuture().sync();
        } finally {
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }

    public static class ServerHandler extends ChannelInboundHandlerAdapter {
        @Override
        public void channelRead(ChannelHandlerContext ctx, Object msg) {
            System.out.println("收到消息: " + msg);
            ctx.writeAndFlush("响应: " + msg);
        }

        @Override
        public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
            cause.printStackTrace();
            ctx.close();
        }
    }

    public static void main(String[] args) throws Exception {
        new NettyServer(8888).run();
    }
}
```

### 3.3 网络安全

Java 提供了 SSL/TLS 支持，可以保护网络通信安全。

```java
import javax.net.ssl.*;
import java.io.*;
import java.security.KeyStore;

public class SSLServerExample {
    public static void main(String[] args) {
        try {
            // 初始化SSL上下文
            SSLContext sslContext = SSLContext.getInstance("TLS");

            // 加载密钥库（实际应用中应从安全位置获取）
            KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
            char[] password = "password".toCharArray();
            keyStore.load(null, password);

            // 初始化KeyManagerFactory
            KeyManagerFactory kmf = KeyManagerFactory.getInstance(
                KeyManagerFactory.getDefaultAlgorithm());
            kmf.init(keyStore, password);

            // 初始化TrustManagerFactory
            TrustManagerFactory tmf = TrustManagerFactory.getInstance(
                TrustManagerFactory.getDefaultAlgorithm());
            tmf.init(keyStore);

            // 初始化SSL上下文
            sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);

            // 创建SSLServerSocket
            SSLServerSocketFactory ssf = sslContext.getServerSocketFactory();
            SSLServerSocket serverSocket = (SSLServerSocket) ssf.createServerSocket(8443);

            System.out.println("SSL 服务器启动，监听端口: 8443");

            while (true) {
                try (SSLSocket clientSocket = (SSLSocket) serverSocket.accept();
                     PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);
                     BufferedReader in = new BufferedReader(
                         new InputStreamReader(clientSocket.getInputStream()))) {

                    String inputLine;
                    while ((inputLine = in.readLine()) != null) {
                        System.out.println("收到消息: " + inputLine);
                        out.println("响应: " + inputLine);
                    }
                } catch (IOException e) {
                    System.err.println("客户端处理异常: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

## 4. 网络编程实践案例

### 4.1 案例一：回声服务器

回声服务器是最经典的网络编程示例，它接收客户端的消息并原样返回。代码示例已在前面的 TCP 服务器和客户端部分提供。

### 4.2 案例二：文件传输程序

文件传输程序演示了如何通过 Socket 传输文件。

```java
import java.io.*;
import java.net.*;

public class FileServer {
    private static final int PORT = 9090;

    public static void main(String[] args) {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("文件服务器启动，监听端口: " + PORT);

            while (true) {
                Socket clientSocket = serverSocket.accept();
                new Thread(() -> handleClient(clientSocket)).start();
            }
        } catch (IOException e) {
            System.err.println("服务器异常: " + e.getMessage());
        }
    }

    private static void handleClient(Socket clientSocket) {
        try (DataInputStream dis = new DataInputStream(clientSocket.getInputStream());
             DataOutputStream dos = new DataOutputStream(clientSocket.getOutputStream())) {

            // 读取文件名
            String fileName = dis.readUTF();
            System.out.println("接收文件: " + fileName);

            // 读取文件长度
            long fileLength = dis.readLong();

            // 读取文件内容
            FileOutputStream fos = new FileOutputStream("received_" + fileName);
            byte[] buffer = new byte[4096];
            int bytesRead;
            long totalRead = 0;

            while (totalRead < fileLength &&
                  (bytesRead = dis.read(buffer, 0,
                  (int) Math.min(buffer.length, fileLength - totalRead))) != -1) {
                fos.write(buffer, 0, bytesRead);
                totalRead += bytesRead;
            }

            fos.close();
            System.out.println("文件接收完成: " + fileName);
            dos.writeUTF("文件接收成功");

        } catch (IOException e) {
            System.err.println("处理客户端请求异常: " + e.getMessage());
        } finally {
            try {
                clientSocket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

### 4.3 案例三：HTTP 服务器

实现一个简单的 HTTP 服务器可以深入理解 HTTP 协议。

```java
import java.io.*;
import java.net.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SimpleHttpServer {
    private final int port;
    private final ExecutorService threadPool;
    private ServerSocket serverSocket;
    private boolean isRunning;

    public SimpleHttpServer(int port, int poolSize) {
        this.port = port;
        this.threadPool = Executors.newFixedThreadPool(poolSize);
    }

    public void start() {
        isRunning = true;
        try {
            serverSocket = new ServerSocket(port);
            System.out.println("HTTP 服务器启动，监听端口: " + port);

            while (isRunning) {
                Socket clientSocket = serverSocket.accept();
                threadPool.execute(new HttpHandler(clientSocket));
            }
        } catch (IOException e) {
            System.err.println("服务器异常: " + e.getMessage());
        } finally {
            stop();
        }
    }

    public void stop() {
        isRunning = false;
        threadPool.shutdown();
        try {
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static class HttpHandler implements Runnable {
        private final Socket clientSocket;

        public HttpHandler(Socket socket) {
            this.clientSocket = socket;
        }

        @Override
        public void run() {
            try (BufferedReader in = new BufferedReader(
                 new InputStreamReader(clientSocket.getInputStream()));
                 OutputStream out = clientSocket.getOutputStream()) {

                // 解析请求
                String requestLine = in.readLine();
                if (requestLine == null || requestLine.isEmpty()) {
                    return;
                }

                String[] parts = requestLine.split(" ");
                if (parts.length < 2) {
                    sendErrorResponse(out, 400, "Bad Request");
                    return;
                }

                String method = parts[0];
                String path = parts[1];

                // 只处理 GET 请求
                if (!"GET".equals(method)) {
                    sendErrorResponse(out, 405, "Method Not Allowed");
                    return;
                }

                // 服务静态文件
                serveStaticFile(path, out);

            } catch (IOException e) {
                System.err.println("处理HTTP请求异常: " + e.getMessage());
            } finally {
                try {
                    clientSocket.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        private void serveStaticFile(String path, OutputStream out) throws IOException {
            // 简化路径处理
            if ("/".equals(path)) {
                path = "/index.html";
            }

            Path filePath = Paths.get("static", path).normalize();
            File file = filePath.toFile();

            if (!file.exists() || !file.isFile()) {
                sendErrorResponse(out, 404, "Not Found");
                return;
            }

            // 读取文件内容
            byte[] content = Files.readAllBytes(filePath);

            // 发送响应
            PrintWriter writer = new PrintWriter(out);
            writer.println("HTTP/1.1 200 OK");
            writer.println("Content-Type: " + getContentType(filePath));
            writer.println("Content-Length: " + content.length);
            writer.println();
            writer.flush();

            out.write(content);
            out.flush();
        }

        private String getContentType(Path path) {
            String fileName = path.getFileName().toString();
            if (fileName.endsWith(".html")) return "text/html";
            if (fileName.endsWith(".css")) return "text/css";
            if (fileName.endsWith(".js")) return "application/javascript";
            if (fileName.endsWith(".png")) return "image/png";
            if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
            return "application/octet-stream";
        }

        private void sendErrorResponse(OutputStream out, int statusCode, String statusText)
            throws IOException {
            PrintWriter writer = new PrintWriter(out);
            writer.println("HTTP/1.1 " + statusCode + " " + statusText);
            writer.println("Content-Type: text/html");
            writer.println();
            writer.println("<html><body>");
            writer.println("<h1>" + statusCode + " " + statusText + "</h1>");
            writer.println("</body></html>");
            writer.flush();
        }
    }

    public static void main(String[] args) {
        SimpleHttpServer server = new SimpleHttpServer(8080, 10);
        server.start();
    }
}
```

## 5. Java 网络编程最佳实践

### 5.1 超时设置三原则

根据某电商平台因 Socket 阻塞导致重大损失的事故教训，超时设置至关重要：

1. **连接超时不超过 3 秒**
2. **读写超时根据业务特点设置（通常 1-10 秒）**
3. **使用重试机制但要有最大重试次数限制**

```java
// 正确的超时设置示例
Socket socket = new Socket();
socket.connect(new InetSocketAddress("example.com", 8080), 3000); // 3秒连接超时
socket.setSoTimeout(5000); // 5秒读写超时
```

### 5.2 资源管理四步骤

1. **明确所有权**（谁创建谁关闭）
2. **使用 try-with-resources**
3. **关闭顺序**：流 → socket
4. **连接池化**避免频繁创建销毁

```java
// 正确的资源管理示例
try (Socket socket = new Socket("localhost", 8080);
     OutputStream out = socket.getOutputStream();
     InputStream in = socket.getInputStream()) {

    // 使用socket进行通信
    out.write(requestData);

    // 读取响应
    byte[] buffer = new byte[1024];
    int bytesRead = in.read(buffer);

} catch (IOException e) {
    // 异常处理
}
```

### 5.3 异常处理五要素

1. **区分临时性错误和永久性错误**
2. **记录完整的错误上下文**
3. **实现适当的重试逻辑**
4. **提供有意义的错误信息**
5. **始终释放资源**

### 5.4 性能优化六维度

1. **选择合适的 I/O 模型**（BIO/NIO/AIO）
2. **优化 TCP 参数**（keepalive、nodelay 等）
3. **使用高效的序列化方式**
4. **实现背压控制**
5. **设计无状态协议**
6. **启用零拷贝传输**

### 5.5 常见陷阱与解决方案

| 陷阱                    | 现象               | 解决方案                              |
| ----------------------- | ------------------ | ------------------------------------- |
| **忘记关闭 Socket**     | 资源泄漏，连接耗尽 | 使用 try-with-resources               |
| **未设置超时**          | 线程阻塞，程序挂起 | 设置连接和读写超时                    |
| **不理解 TCP 关闭机制** | TIME_WAIT 状态过多 | 正确关闭顺序：先关闭流，再关闭 Socket |
| **未处理网络中断**      | 使用失效连接       | 实现连接健康检查                      |
| **同步阻塞模型**        | 高并发时性能低下   | 使用 NIO 或异步 I/O                   |
| **未实现熔断机制**      | 故障扩散           | 实现熔断和降级机制                    |
| **缺乏监控**            | 问题无法及时发现   | 监控连接状态和线程阻塞情况            |

## 6. 总结

Java 网络编程是 Java 开发者必须掌握的核心技能之一。本文全面介绍了 Java 网络编程的基础知识、核心 API、高级主题和实践案例，并总结了从实际事故中吸取的经验教训和最佳实践。

### 6.1 关键要点回顾

- **理解 TCP 和 UDP 的区别**及其适用场景是网络编程的基础
- **正确设置超时**和资源管理是避免生产环境事故的关键
- **根据应用需求选择合适的 I/O 模型**（BIO/NIO/AIO/Netty）
- **始终实现完善的异常处理**和错误恢复机制
- **监控和熔断机制**是构建可靠网络应用的必备组件

### 6.2 后续学习建议

1. **深入学习 Netty 框架**，掌握高性能网络编程
2. **研究 HTTP/2 和 HTTP/3** 协议及其在 Java 中的实现
3. **了解 WebSocket 编程**，实现实时双向通信
4. **掌握 RPC 框架**（如 gRPC、Dubbo）的使用和原理
5. **学习网络安全和加密技术**，构建安全的应用

Java 网络编程是一个广阔而深入的领域，只有通过不断的学习和实践，才能掌握其精髓，构建出高性能、高可靠性的网络应用程序。

## 附录：完整代码示例

以下是一个完整的回声服务器示例，包含服务器和客户端代码：

### 服务器端代码

```java
import java.io.*;
import java.net.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class EchoServer {
    private final int port;
    private final ExecutorService threadPool;
    private ServerSocket serverSocket;
    private boolean isRunning;

    public EchoServer(int port, int poolSize) {
        this.port = port;
        this.threadPool = Executors.newFixedThreadPool(poolSize);
    }

    public void start() throws IOException {
        serverSocket = new ServerSocket(port);
        isRunning = true;
        System.out.println("回声服务器启动，监听端口: " + port);

        while (isRunning) {
            Socket clientSocket = serverSocket.accept();
            threadPool.execute(new ClientHandler(clientSocket));
        }
    }

    public void stop() {
        isRunning = false;
        threadPool.shutdown();
        try {
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
        } catch (IOException e) {
            System.err.println("关闭服务器异常: " + e.getMessage());
        }
    }

    private static class ClientHandler implements Runnable {
        private final Socket clientSocket;

        public ClientHandler(Socket socket) {
            this.clientSocket = socket;
        }

        @Override
        public void run() {
            try (BufferedReader in = new BufferedReader(
                 new InputStreamReader(clientSocket.getInputStream()));
                 PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true)) {

                String message;
                while ((message = in.readLine()) != null) {
                    System.out.println("收到消息: " + message);
                    out.println("回声: " + message);

                    if ("exit".equalsIgnoreCase(message)) {
                        break;
                    }
                }
            } catch (IOException e) {
                System.err.println("处理客户端请求异常: " + e.getMessage());
            } finally {
                try {
                    clientSocket.close();
                } catch (IOException e) {
                    System.err.println("关闭客户端连接异常: " + e.getMessage());
                }
            }
        }
    }

    public static void main(String[] args) {
        EchoServer server = new EchoServer(8888, 10);
        try {
            server.start();
        } catch (IOException e) {
            System.err.println("启动服务器失败: " + e.getMessage());
        } finally {
            server.stop();
        }
    }
}
```

### 客户端代码

```java
import java.io.*;
import java.net.*;

public final class EchoClient {
    private final String hostname;
    private final int port;

    public EchoClient(String hostname, int port) {
        this.hostname = hostname;
        this.port = port;
    }

    public void start() {
        try (Socket socket = new Socket(hostname, port);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
             BufferedReader in = new BufferedReader(
                 new InputStreamReader(socket.getInputStream()));
             BufferedReader stdIn = new BufferedReader(
                 new InputStreamReader(System.in))) {

            System.out.println("已连接到回声服务器，输入 'exit' 退出");

            String userInput;
            while ((userInput = stdIn.readLine()) != null) {
                out.println(userInput);
                System.out.println("服务器响应: " + in.readLine());

                if ("exit".equalsIgnoreCase(userInput)) {
                    break;
                }
            }
        } catch (UnknownHostException e) {
            System.err.println("无法找到主机: " + hostname);
        } catch (IOException e) {
            System.err.println("I/O 错误: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        EchoClient client = new EchoClient("localhost", 8888);
        client.start();
    }
}
```

要运行此示例：

1. 先启动 `EchoServer`
2. 然后运行 `EchoClient`
3. 在客户端控制台输入文本，查看服务器回声响应
