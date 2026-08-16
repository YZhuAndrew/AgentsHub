# Tasks

- [x] 失败测试：canonical 根目录 + `skills/<id>/files/` 存在 `.DS_Store`/`Thumbs.db` 时 `readPromptCanonicalGraph` 成功且数据完整（实现前精确复现用户报错）
- [x] 回归保护测试：未声明的普通文件（`notes.txt`）仍抛 `inventory count mismatch`
- [x] `storage-inventory.ts` 导出 `OS_METADATA_FILE_NAMES`（原私有 `IGNORED_EMPTY_ENTRIES` 的单一事实来源化）
- [x] `prompt-canonical-import.ts` 的 `inventoryRoot` 按该集合跳过（任意层级）
- [x] core 全量 53 文件 / 516 测试通过；desktop canonical 四套件 18/18；desktop typecheck + 根 lint 通过
- [x] implementation.md 记录用户实测复现与新 DMG 重建
