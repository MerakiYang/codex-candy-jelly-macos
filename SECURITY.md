# Security and privacy · 安全与隐私

Native theme import uses the app's built-in theme format and makes no network requests. The clipboard helper scripts copy only the public theme string. They replace the clipboard contents when explicitly run.

原生导入使用应用自带的主题格式，不发出网络请求。复制脚本仅复制公开主题字符串，运行时会替换当前剪贴板内容。

Enhanced mode uses Chromium remote debugging. This is a powerful local interface, not a sandbox or authentication boundary. Other processes running as the same user can potentially control the app through it. The launcher asks Chromium to bind to `127.0.0.1`, verifies the listening address and executable with macOS tools, pins the browser endpoint, and rejects websites and unrelated renderers. It does not disable macOS protections, enable `--no-sandbox`, expose a LAN port, install a login item, or patch signed application files.

增强模式使用 Chromium 远程调试。这是权限较高的本机接口，不构成隔离或身份认证边界。同一用户运行的其他进程可能通过它控制应用。启动器要求仅监听 `127.0.0.1`，使用 macOS 工具验证监听地址及可执行文件，绑定浏览器会话身份，并拒绝网站和无关渲染页面。不会关闭 macOS 保护、启用 `--no-sandbox`、开放局域网端口、安装登录项或修改签名应用文件。

The renderer only attaches a stylesheet and one namespaced HTML attribute. It does not read chat messages, change their text, write localStorage, send analytics, download assets, or change persistent app settings. Theme artwork is embedded locally. The launcher reads debugging metadata and keeps transient session markers under `~/Library/Application Support/Codex Candy Jelly/runtime`, with a private directory and files. Terminal diagnostics can include the locally installed application path; they are not uploaded.

渲染脚本仅附加样式表及一个专用 HTML 属性，不读取聊天消息、不改变文字、不写入 localStorage、不发送分析数据、不下载素材，也不修改持久应用设置。素材本地嵌入。启动器读取调试元数据，在上述私有目录保存临时会话标记。终端诊断可能显示本机应用路径，不会上传。

Restore removes runtime styles while the launcher is responsive. It cannot disable Chromium's debugging server in a running app. Fully quit Codex and reopen it normally to close the port. If the launcher crashes or loses its connection, the same quit/reopen procedure is the authoritative recovery path.

启动器正常响应时，恢复命令会移除运行时样式，但无法关闭仍在运行的 Chromium 调试服务。必须完全退出 Codex 并正常重开，以关闭端口。若启动器异常退出或连接中断，同样以完全退出并重开应用为可靠恢复方式。

Report a suspected issue without including passwords, tokens, private chats, or unredacted session files. Include the app version, macOS version, Node version, and a minimal reproduction. Use GitHub's private vulnerability reporting if it is enabled; otherwise open an issue requesting a private reporting channel without disclosing exploit details.

报告问题时不要附上密码、令牌、私人聊天或未脱敏的会话文件。请提供应用、macOS 和 Node 版本及最小复现步骤。若仓库启用了 GitHub 私密漏洞报告，请使用该功能；否则先通过 issue 请求私密渠道，不公开漏洞细节。
