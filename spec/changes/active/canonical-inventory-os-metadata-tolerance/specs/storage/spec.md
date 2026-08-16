# Delta Spec — canonical 工作区清单校验（packages/core）

## Added

- canonical 图谱文件清单遍历应忽略 OS 元数据文件（`.DS_Store`、`Thumbs.db`），任意目录层级，不参与"未声明文件"判定，也不计入文件数上限。

## Modified

- 用户在 Finder 中浏览工作区目录（macOS 自动生成 `.DS_Store`）后，应用启动的 canonical 导入不再失败；数据读取结果与无该文件时完全一致。

## Scenarios

- canonical 根目录存在 `.DS_Store`：启动正常，prompt/folder/tag/relation 数据完整读取。
- `skills/<id>/files/` 下存在 `.DS_Store` 或 `Thumbs.db`：同样忽略，不影响导入。
- 清单外存在任意其他未声明文件（如 `notes.txt`）：仍抛 `canonical graph file inventory count mismatch`——容忍面不扩大。

# Traceability

| Requirement | Design | Verification | Task |
| --- | --- | --- | --- |
| `FR-ST-001`（忽略 OS 元数据） | `DES-ST-001`（inventoryRoot 跳过固定文件名集合，复用 storage-inventory 导出） | `TEST-ST-001`（.DS_Store/Thumbs.db 两层级忽略 + 普通文件仍拒绝） | `T-ST-001` |
