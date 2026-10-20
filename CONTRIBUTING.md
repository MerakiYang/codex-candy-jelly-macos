# Contributing · 参与贡献

Use Node.js 22 or newer. Run `node --test tests/*.test.mjs` and `node scripts/build-themes.mjs`. For style changes, inspect `docs/preview.html` in both light and dark modes and verify removal. Include your live-app version and distinguish an illustrative preview from actual app verification.

使用 Node.js 22 或更新版本，运行上述测试及生成命令。修改样式后检查示意页面的浅色、深色及恢复状态。请说明真实应用版本，并区分示意预览与真实应用验证。

Keep app changes reversible. Do not add chat-content collection, telemetry, credential handling, public debug ports, binary patches, third-party character art, or undocumented persistence. Keep MIT attributions for upstream material. Do not commit personal paths, screenshots of private chats, session markers, or tokens.

保持改动可恢复，不添加聊天内容收集、遥测、凭据处理、公网调试端口、二进制补丁、第三方角色素材或未说明的持久化行为。保留上游素材的 MIT 署名，不提交私人路径、私人聊天截图、会话标记或令牌。
