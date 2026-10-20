# Codex Candy Jelly for macOS

Candy Jelly colors and an optional runtime skin for the Codex desktop app on macOS. This community project is inspired by [suki052/codex-candy-jelly-skin](https://github.com/suki052/codex-candy-jelly-skin) and preserves its MIT attribution.

面向 macOS Codex 桌面应用的糖果果冻配色与可选增强外观。灵感来自上述 Windows 项目，并保留 MIT 开源署名。

![Light illustrative preview](docs/preview-light.png)

The image is an illustrative preview, not a screenshot of a themed Codex session. The enhanced skin decorates existing UI; it does not add the example task cards shown here.

上图是独立界面示意，并非真实 Codex 会话截图。增强模式装饰现有界面，不会添加示意中的任务卡片。

## Native theme import · 原生配色导入

Use this mode first. It changes app colors through the built-in Appearance settings. No Node.js, installer, debug port, or background service is needed. It does not add rounded cards or mascot artwork. Official settings documentation is available [here](https://learn.chatgpt.com/docs/reference/settings#appearance).

建议先使用此模式。通过应用自带的外观设置调整配色，不需要 Node.js、安装器、调试端口或后台服务。原生模式只提供配色，不添加果冻卡片或吉祥物。官方设置说明见上述链接。

1. Download and extract this repository. Open `themes/candy-jelly-light.txt` and copy its entire contents, or run `Copy Light Theme.command`.

   下载并解压仓库。打开 `themes/candy-jelly-light.txt`，复制全部内容，也可运行 `Copy Light Theme.command`。

2. In Codex, open Settings → Appearance. Use Import beside the light theme, paste the share string, and confirm. Import `candy-jelly-dark.txt` in the dark theme section in the same way. Choose Light, Dark, or System as desired.

   在 Codex 设置的外观页面，点击浅色主题旁的 Import，粘贴主题字符串并确认。深色区域同样导入 `candy-jelly-dark.txt`，再按需选择浅色、深色或跟随系统。

3. Before importing, use Copy theme to save your existing light and dark themes. Restore by importing those saved strings or choosing a built-in theme. Runtime Restore does not change native imported colors.

   导入前，先用 Copy theme 保存当前的浅色和深色主题。恢复时重新导入保存的字符串，或选择内置主题。增强模式的恢复命令不会更改原生导入的配色。

## Enhanced skin · 增强外观

Experimental. This mode adds pastel gradients, rounded user message bubbles, composer borders, and a small decorative chick in the existing sidebar. It uses an unsupported Chromium debugging interface and depends on Codex's UI structure. App updates can break it. It does not modify the app bundle, signature, `app.asar`, or your account settings. Native macOS window controls remain managed by the app.

此模式为实验版本，可为现有界面添加渐变侧栏、圆润的用户消息气泡、输入框边框和装饰小鸡。它使用未受官方支持的 Chromium 调试接口，依赖 Codex 的界面结构，更新后可能失效。不会修改应用包、签名、`app.asar` 或账号设置。macOS 窗口控制由原应用管理。

Install [Node.js 22 or newer](https://nodejs.org/) and the official Codex Mac app. This package has no npm dependencies. Apple Silicon and Intel use the same scripts, but both architectures have not been verified in a live Codex session.

需要安装 Node.js 22 或更新版本及官方 Codex Mac 应用。项目没有 npm 依赖。Apple Silicon 和 Intel 使用相同脚本，但尚未在两种架构的真实 Codex 会话中验证。

```sh
node src/cli.mjs doctor
node src/cli.mjs start
```

Save drafts and fully quit Codex with Command-Q before Start. The launcher refuses to quit an active app. Keep its Terminal open while using the skin. It handles new app windows and reloads. Press Control-C or run `Restore Codex.command` to remove runtime styling. Then quit Codex and open it normally to close the debugging port. Quitting only the Terminal abruptly can leave styling until the app quits.

启动前先保存草稿，并按 Command-Q 完全退出 Codex。启动器不会关闭正在使用的应用。使用增强模式时保留终端窗口，它会处理应用的新窗口和重载。按 Control-C 或运行 `Restore Codex.command` 移除运行时样式，再完全退出 Codex 并正常打开，以关闭调试端口。强行关闭终端可能让样式保留到应用退出。

Finder launchers are also included. GitHub's source ZIP may not preserve executable permissions. If double-clicking a `.command` file reports a permission error, run the following from the extracted project folder. These scripts are unsigned; they do not disable Gatekeeper or request administrator rights.

项目也包含 Finder 启动脚本。GitHub 源码 ZIP 可能不保留可执行权限，双击 `.command` 文件若提示权限不足，可在解压目录运行下方命令。脚本未签名，不会关闭 Gatekeeper，也不请求管理员权限。

```sh
chmod +x ./*.command scripts/run.sh
```

The launcher finds `/Applications/Codex.app`, a Codex-derived `/Applications/ChatGPT.app`, or the same names in `~/Applications`, but accepts only the bundle identifier `com.openai.codex`. For a different location, set `CODEX_APP_PATH`. For a Node installation outside PATH, set `CANDY_NODE` when running the shell launcher.

启动器查找上述应用位置，仅接受应用标识 `com.openai.codex`，不会误启动其他同名应用。其他路径可通过 `CODEX_APP_PATH` 指定，非标准位置的 Node 可通过 `CANDY_NODE` 指定。

```sh
CODEX_APP_PATH="/path/to/Codex.app" node src/cli.mjs start
```

## Recovery · 异常恢复

After a crash, quit Codex normally first. Delete only `~/Library/Application Support/Codex Candy Jelly/runtime` in Finder if a stale lock prevents a restart. This directory contains only this theme's session markers. Do not delete Codex's own application data. No login item or LaunchAgent is installed.

若启动器异常退出，先完全退出 Codex。如果残留锁文件阻止再次启动，可在 Finder 中仅删除上述 `runtime` 目录。该目录只保存本主题的会话标记，不要删除 Codex 自身的数据目录。项目不安装登录项或 LaunchAgent。

## Local preview and tests · 本地预览与测试

```sh
node --test tests/*.test.mjs
node scripts/build-themes.mjs
python3 -m http.server 8787 --bind 127.0.0.1
# Open http://127.0.0.1:8787/docs/preview.html
```

The preview lets you switch light/dark colors, type in a sample composer, and apply/remove the CSS without a Codex account. See [TESTING.md](TESTING.md) for the tested scope and the manual release checks that remain.

预览可切换浅色和深色、在示意输入框打字、应用及移除样式，无需 Codex 账号。已测试的范围和仍待完成的真实应用验证见 [TESTING.md](TESTING.md)。

## Privacy and license · 隐私与许可

The native theme files make no network requests. Enhanced mode connects only to a temporary port on `127.0.0.1`, checks its process owner and browser identity, and styles only `app://-/index.html`. It does not transmit chat content or credentials. A debugging port gives local processes powerful access to the app while it is open, so close it by quitting and relaunching normally. See [SECURITY.md](SECURITY.md).

原生主题文件不发出网络请求。增强模式只连接临时的 `127.0.0.1` 端口，并检查进程所有者及浏览器身份，仅对应用页面添加样式，不传输聊天内容或凭据。调试端口开启期间，本机进程可通过它访问应用，因此使用后应完全退出并正常重开。更多说明见 [SECURITY.md](SECURITY.md)。

MIT licensed. Upstream artwork and copyright notices are listed in [NOTICE.md](NOTICE.md) and [ASSET_LICENSES.md](ASSET_LICENSES.md). This is an unofficial community project, with no OpenAI affiliation or endorsement.

采用 MIT 许可证。上游素材和版权说明见上述文件。本项目为非官方社区项目，与 OpenAI 无隶属或背书关系。
