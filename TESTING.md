# Verification · 验证记录

Recorded on October 20, 2026. App discovery was checked on a Mac with the `com.openai.codex` bundle, version `26.1007.30912`, displayed locally as ChatGPT. Node.js `24.19.0` was used for automated checks. This records the scope of verification, not a claim of official support.

记录日期为 2026 年 10 月 20 日。应用识别在安装了上述应用标识及版本的 Mac 上检查，本机显示名为 ChatGPT。自动检查使用 Node.js 24.19.0。此记录仅说明验证范围，不代表官方支持。

## Completed · 已完成

- Nine automated tests cover endpoint validation, page selection, listener ownership parsing, idempotent application, complete local stylesheet removal, navigation guards, native share-string round trips, CDP replies/errors/timeouts, and redirect rejection.

  9 项自动测试覆盖端点校验、页面筛选、监听者解析、重复应用、样式移除、导航保护、原生字符串读写、CDP 响应和超时，以及 HTTP 重定向拒绝。

- The read-only `doctor` command identified the local application and detected its running state.

  只读 doctor 命令已识别本机应用并检测到其运行状态。

- Native share-string field names, allowed values, and prefix were checked against the locally installed app's importer schema. No app code is redistributed. This does not substitute for a live import test.

  原生主题字符串的字段、允许值和前缀已对照本机应用的导入结构检查，不重新分发应用代码。这不能替代实际导入测试。

- The illustrative preview was checked in Chrome for light/dark colors, sample input, repeated application, and stylesheet removal. Preview images are explicitly labeled as illustrations.

  独立示意页面已在 Chrome 检查浅色和深色、输入框、重复应用及样式移除。预览图明确标注为示意。

## Pending live-app checks · 待完成的真实应用检查

- Save and re-import both native themes in a live app, then restore the previous saved themes.

  在真实应用中保存并导入浅色和深色主题，再恢复先前保存的主题。

- Start the enhanced launcher after quitting the app, verify sidebar/composer/message selectors, reload, open a second window, and restore. Confirm with `lsof` that the port is local-only and disappears after a normal quit.

  完全退出应用后启动增强模式，验证侧栏、输入框及消息选择器、重载、新窗口和恢复流程。通过 lsof 确认端口仅限本机，且正常退出后端口关闭。

- Repeat on Intel and Apple Silicon, with current macOS accessibility settings and future Codex updates. The live session was not restarted during development, so these checks remain pending.

  在 Intel 与 Apple Silicon 上结合 macOS 辅助功能设置及后续 Codex 版本重复检查。开发期间未重启当前会话，上述验证仍待完成。

Enhanced mode is released as experimental until these checks are complete. Automated tests and a styled mock interface do not establish full live-app compatibility.

完成这些检查前，增强模式以实验版发布。自动测试和示意页面不能证明真实应用的完整兼容性。
