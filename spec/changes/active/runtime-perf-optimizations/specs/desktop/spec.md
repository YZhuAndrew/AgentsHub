# Delta Spec — 桌面 renderer 热路径（apps/desktop）

## Added

- 高频 markdown 渲染组件（`PromptMarkdownContent`、`AgentConversationMarkdown`、`EditPromptModal` 预览、`AiTestModal` AI 响应渲染）的 remark/rehype plugin 数组应为模块级常量（单一身份），组件应以 `memo` 包裹；对 `highlightTerms` 等数组 props 使用浅值比较判定是否跳过重渲染。
- AI 测试 modal 的流式内容 flush 应按时间节流（约 100ms 间隔）而不是每帧执行；流结束/出错路径应取消未决 flush 并以服务端终值直接落位，不依赖未决 flush 补齐内容。

## Modified

- prompt 详情、agent 会话面板、编辑 modal 预览在 props（content/高亮词/className）未变化时，因兄弟状态或父级无关状态变化触发的重渲染不应重新执行 markdown 解析。
- `App.tsx` 初始化流程中 `fetchPrompts()` 与 `fetchFolders()` 应并行执行（`Promise.all`），错误处理语义不变（任一失败仍进入现有错误路径）。
- 生产构建中 `react/jsx-runtime` 应位于 `react-vendor` chunk，`markdown-vendor` 不应再是入口 chunk 的静态依赖。

## Scenarios

- 用户在 prompt 工作区搜索框连续输入，当前选中 prompt 的 markdown 详情区不应随每个按键重新解析（内容与高亮词未变）。
- 用户在 agent 会话面板切换筛选或输入会话搜索词，已渲染的会话 markdown 消息不应重新解析。
- 用户在 AI 测试 modal 流式输出长响应（>10KB）期间，CPU 占用不应随响应长度平方增长；流结束后展示的最终内容与不节流时完全一致（含尾部 partial chunk）。
- 用户启动应用，prompts 与 folders 的加载并行发起，两者都完成后进入主界面；总耗时不劣于串行基线。
- 用户冷启动桌面端，入口 chunk 的静态依赖中不再包含 markdown-vendor（jsx-runtime 由 react-vendor 提供）。
