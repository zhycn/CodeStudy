好的，请看这篇为您精心准备的 Python3 SMTP 技术文档。

---

# Python3 SMTP 发送邮件详解与最佳实践

本文档将全面深入地探讨如何使用 Python 3 的标准库 `smtplib` 和 `email` 来发送电子邮件。内容涵盖从基础连接到高级功能（如附件、HTML 内容），并总结了行业内的安全最佳实践和常见问题解决方案。

## 目录

1. #核心概念与库介绍
2. #基础文本邮件发送
3. #构建复杂邮件
    1. #发送-html-邮件
    2. #添加附件
    3. #嵌入图片cid
4. #安全连接-tlsssl
5. #使用外部服务-gmail-示例
6. #最佳实践总结
7. #完整示例代码
8. #常见问题-faq

## 核心概念与库介绍

在开始编写代码前，需要了解两个核心标准库：

- **`smtplib`**: 用于与 SMTP (Simple Mail Transfer Protocol) 服务器进行通信，负责建立连接、认证和发送邮件内容。
- **`email`**: 用于构建复杂的电子邮件结构，包括邮件头 (From, To, Subject)、正文、附件等。它帮助我们创建符合 MIME (Multipurpose Internet Mail Extensions) 协议的邮件。

简单来说，`email` 库负责 **“写邮件”**，而 `smtplib` 库负责 **“寄邮件”**。

## 基础文本邮件发送

以下是一个发送纯文本邮件的最小示例。

```python
import smtplib
from email.mime.text import MIMEText
from email.utils import formatdate

# 邮件配置
smtp_server = 'smtp.your-email-provider.com'  # 例如 smtp.163.com, smtp.qq.com
smtp_port = 25  # 普通端口，通常用于非加密连接
username = 'your_username@example.com'
password = 'your_password'  # 注意：对于第三方服务，通常使用授权码而非登录密码
sender = 'sender@example.com'
receiver = 'receiver@example.com'

# 1. 构建邮件内容
msg = MIMEText('这是一封来自 Python 的测试邮件正文。')
msg['Subject'] = 'Python SMTP 测试邮件'
msg['From'] = sender
msg['To'] = receiver
msg['Date'] = formatdate(localtime=True)

# 2. 建立 SMTP 连接并发送
try:
    # 连接到服务器
    server = smtplib.SMTP(smtp_server, smtp_port)
    # 如果服务器需要认证，则登录
    server.login(username, password)
    # 发送邮件
    server.sendmail(sender, [receiver], msg.as_string())
    print('邮件发送成功！')
except Exception as e:
    print(f'发送失败: {e}')
finally:
    # 确保连接被关闭
    server.quit()
```

## 构建复杂邮件

现代邮件很少只是纯文本。我们通常需要发送 HTML 内容、附件等。

### 发送 HTML 邮件

要发送 HTML 邮件，只需将 `MIMEText` 的子类型设置为 `'html'`。

```python
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# 创建多部分消息容器
msg = MIMEMultipart('alternative')
msg['Subject'] = '包含 HTML 的测试邮件'
msg['From'] = sender
msg['To'] = receiver

# 创建正文部分
text_part = MIMEText('您的邮件客户端不支持 HTML 显示。', 'plain')
html_part = MIMEText(
    '<html><body><h1>Hello!</h1><p>这是一封<strong>HTML</strong>邮件。</p></body></html>',
    'html'
)

# 将正文部分附加到消息中
# 接收方邮件客户端会尝试渲染最后一个它支持的部分
msg.attach(text_part)
msg.attach(html_part)

# ... (后续连接和发送代码与之前相同)
```

### 添加附件

附件是通过 `MIMEBase` 和 `MIMEApplication` 等类处理的。

```python
from email.mime.base import MIMEBase
from email import encoders
import os

# 假设我们已经有了一个 MIMEMultipart 对象 msg
# msg = MIMEMultipart()

# 要发送的文件路径
file_path = '/path/to/your/report.pdf'

# 以二进制模式读取文件
with open(file_path, 'rb') as f:
    # 创建一个 MIMEBase 对象
    part = MIMEBase('application', 'octet-stream')
    part.set_payload(f.read())

# 对附件进行 Base64 编码
encoders.encode_base64(part)

# 添加头信息，定义附件名称
filename = os.path.basename(file_path)
part.add_header(
    'Content-Disposition',
    f'attachment; filename= {filename}'
)

# 将附件附加到消息中
msg.attach(part)
```

### 嵌入图片 (CID)

要在 HTML 正文中嵌入图片，需要将其作为“相关”部分附加，并在 HTML 中通过 `cid` 引用。

```python
from email.mime.image import MIMEImage

# 创建一个 'related' 类型的 MIMEMultipart 作为根容器
msg_root = MIMEMultipart('related')

# 创建一个 'alternative' 类型的 MIMEMultipart 用于文本和 HTML
msg_alternative = MIMEMultipart('alternative')
msg_root.attach(msg_alternative)

# 创建 HTML 正文，其中通过 cid 引用图片
html_content = """
<html>
  <body>
    <p>这是一张嵌入的图片：<br>
       
    </p>
  </body>
</html>
"""
html_part = MIMEText(html_content, 'html')
msg_alternative.attach(html_part)

# 嵌入图片
with open('/path/to/your/image.jpg', 'rb') as img:
    msg_image = MIMEImage(img.read())
    msg_image.add_header('Content-ID', '<image1>') # 这里的 ID 与 HTML 中的 cid 对应
    msg_root.attach(msg_image)

# 别忘了设置主题、发件人、收件人
msg_root['Subject'] = '邮件内嵌图片测试'
msg_root['From'] = sender
msg_root['To'] = receiver

# ... 使用 msg_root 进行发送
```

## 安全连接 (TLS/SSL)

为了保护你的凭证和邮件内容，始终使用加密连接。有两种主要方式：

1. **SMTP over SSL (SMTPS)**: 使用 `SMTP_SSL` 类，一上来就建立 SSL 加密连接。端口通常是 465。

    ```python
    server = smtplib.SMTP_SSL(smtp_server, 465)
    server.login(username, password)
    ```

2. **STARTTLS**: 先建立普通连接，然后使用 `starttls()` 方法升级到加密连接。端口通常是 587 或 25。

    ```python
    server = smtplib.SMTP(smtp_server, 587)
    server.starttls() # 升级为加密连接
    server.login(username, password)
    ```

**最佳实践是优先使用 STARTTLS (端口 587)**，因为它更灵活，如果服务器不支持加密，你还能收到提示。如果失败，再尝试 SMTPS (端口 465)。

## 使用外部服务 (Gmail 示例)

使用 Gmail、QQ 邮箱、163 邮箱等服务时，需要注意：

1. 开启 SMTP 服务（通常在邮箱设置的“POP3/SMTP”中）。
2. 使用提供的 SMTP 服务器地址（如 Gmail 是 `smtp.gmail.com`）。
3. **使用授权码/应用专用密码，而不是你的邮箱登录密码**。这是关键的安全措施。

**Gmail 发送示例：**

```python
import smtplib
from email.mime.text import MIMEText

gmail_user = 'your_email@gmail.com'
gmail_app_password = 'your_16_digit_app_password' # 注意：这里是授权码，不是登录密码

sent_from = gmail_user
to = ['receiver1@example.com', 'receiver2@example.com']
subject = 'Gmail via Python'
body = '通过 Python 使用 Gmail SMTP 发送。'

msg = MIMEText(body)
msg['Subject'] = subject
msg['From'] = sent_from
msg['To'] = ', '.join(to) # 多个收件人用逗号分隔

try:
    server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
    server.ehlo() # 向服务器标识用户身份
    server.login(gmail_user, gmail_app_password)
    server.sendmail(sent_from, to, msg.as_string())
    server.close()
    print('邮件已发送！')
except Exception as e:
    print(f'出错: {e}')
```

## 最佳实践总结

1. **始终使用加密连接**: 优先选择 `STARTTLS` (端口 587)，其次是 `SMTPS` (端口 465)。避免使用明文端口 25。
2. **使用应用专用密码**: 不要将你的主邮箱密码硬编码在脚本中。对于 Gmail、QQ 邮箱等服务，务必在邮箱设置中生成并使用 **授权码**。
3. **安全地管理凭证**: 将邮箱地址、密码/授权码、服务器地址等敏感信息存储在环境变量或配置文件中，不要直接写在代码里。

    ```python
    # 示例：使用环境变量
    import os
    username = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASSWORD')
    ```

4. **处理异常**: 使用 `try...except` 块来优雅地处理网络错误、认证失败等问题。
5. **正确设置邮件头**: 确保 `From`, `To`, `Subject`, `Date` 等头信息完整且格式正确。
6. **提供纯文本备选**: 当发送 HTML 邮件时，总是附加一个纯文本版本，以确保兼容性。
7. **谨慎使用收件人列表**: `msg['To']` 头用于显示，实际的收件人列表在 `sendmail(sender, to_list, msg)` 的 `to_list` 参数中指定。若要密送，使用 `msg['Bcc']` 头，但在 `sendmail` 的 `to_list` 中仍需包含密送地址，且通常不在 `msg` 头中设置 `Bcc` 以避免泄露。
8. **测试**: 发送邮件前，先在测试环境中充分验证，避免成为垃圾邮件。

## 完整示例代码

以下是一个整合了多项最佳实践的完整示例，发送一封带有 HTML/纯文本正文和 PDF 附件的安全邮件。

```python
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.utils import formatdate, make_msgid
from getpass import getpass

def send_email_with_attachment():
    # 从环境变量或用户输入获取配置（安全做法）
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    username = os.environ.get('SMTP_USER', input("Enter your email: "))
    # 安全地获取密码，优先使用环境变量
    password = os.environ.get('SMTP_PASSWORD')
    if password is None:
        password = getpass("Enter your password/app password: ")

    sender = username
    receiver = input("Enter recipient email: ")
    file_to_attach = input("Enter full path to file to attach: ")

    # 创建消息容器
    msg = MIMEMultipart('mixed')
    msg['Subject'] = '安全测试邮件：带附件'
    msg['From'] = sender
    msg['To'] = receiver
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = make_msgid() # 生成唯一消息ID

    # 创建正文部分 (alternative)
    msg_alternative = MIMEMultipart('alternative')
    msg.attach(msg_alternative)

    # 纯文本正文
    text_part = MIMEText(
        "您好！这是一封测试邮件。您的客户端不支持 HTML 显示。请查看附件。",
        'plain', 'utf-8'
    )
    msg_alternative.attach(text_part)

    # HTML 正文
    html_part = MIMEText(
        """\
        <html>
          <body>
            <p>您好！<br>
               这是一封 <b>HTML</b> 测试邮件。
            </p>
            <p>请查看附件。</p>
          </body>
        </html>
        """, 'html', 'utf-8'
    )
    msg_alternative.attach(html_part)

    # 添加附件
    try:
        with open(file_to_attach, 'rb') as f:
            part = MIMEApplication(f.read(), Name=os.path.basename(file_to_attach))
        part['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_to_attach)}"'
        msg.attach(part)
    except FileNotFoundError:
        print(f"警告：文件 {file_to_attach} 未找到，将继续发送无附件的邮件。")

    # 建立安全连接并发送
    try:
        print(f"正在连接到服务器 {smtp_server}:{smtp_port}...")
        # 优先尝试 STARTTLS
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.ehlo()
        if server.has_extn('STARTTLS'):
            print("启动 TLS 加密...")
            server.starttls()
            server.ehlo() # 重新 ehlo  over TLS 连接
        else:
            print("警告：服务器不支持 STARTTLS，连接未加密！")

        print("登录中...")
        server.login(username, password)

        print("发送邮件...")
        server.sendmail(sender, [receiver], msg.as_string())
        print("邮件发送成功！")

    except Exception as e:
        print(f"发送过程中出现错误: {e}")
    finally:
        if 'server' in locals():
            server.quit()

if __name__ == '__main__':
    send_email_with_attachment()
```

## 常见问题 (FAQ

**Q1: 我收到了 `smtplib.SMTPAuthenticationError` 错误，怎么办？**
**A:** 这通常是用户名或密码错误。

- 确保你使用的是完整的邮箱地址作为用户名。
- **最重要**：如果你使用的是 Gmail、QQ 邮箱等，请确认你使用的是 **授权码** 而不是登录密码。请在邮箱设置中查看如何生成授权码。
- 确保你已开启邮箱的 SMTP 服务。

**Q2: 我的邮件被当作垃圾邮件了，如何避免？**
**A:** 避免被标记为垃圾邮件是一个复杂问题，但可以注意以下几点：

- 使用真实的、有效的 `From` 地址。
- 不要使用可疑的主题行（如大量感叹号、“免费”等词汇）。
- 提供合理的纯文本和 HTML 内容平衡。
- 避免使用被滥用的免费邮箱服务发送大量邮件，考虑使用专业的邮件发送服务（如 Amazon SES, SendGrid, Mailgun）。

**Q3: 如何同时发送给多人，并隐藏其他人的地址？**
**A:** 使用密送 (Bcc)。

- 在 `sendmail()` 函数的 `to_addrs` 参数中传入所有收件人的列表。
- 在构建邮件头时，`msg['To']` 可以设置为主收件人或你自己（例如 `msg['To'] = sender`），或者完全不设置 `To` 头。**不要**将密送列表放在 `msg['Bcc']` 头中，因为它可能会被某些服务器记录在邮件头里。
- 示例：`server.sendmail(sender, ['a@example.com', 'b@example.com'], msg.as_string())`

**Q4: 发送附件时，中文文件名显示乱码怎么办？**
**A:** 你需要对文件名进行编码。可以使用 `email.header.Header` 类。

```python
from email.header import Header
filename = '中文报告.pdf'
encoded_filename = Header(filename, 'utf-8').encode()
part.add_header('Content-Disposition', 'attachment', filename=encoded_filename)
```

通过本指南，你应该能够 confidently 使用 Python 3 处理绝大多数邮件发送需求，并遵循安全和高效的最佳实践。
