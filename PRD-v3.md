# Petsonality PRD v3 — 下一阶段

> Your type, your pet.

## Phase 1 — 可宣传版（优先）

### 1. 剩余 13 只宠物形象
- 逐只设计 ASCII art（5×12 网格）
- 独立动画帧 + 眼神特色 + 性格动作
- 每只做完单独审查过稿
- 已完成：猫头鹰、渡鸦、熊

### 2. 通用化
- hooks 抽象成可选模块（Claude Code / OpenClaw / 通用）
- statusline 独立运行脚本
- skills 按客户端格式适配
- install CLI 自动检测客户端

### 3. npx 安装
- `npx petsonality` 一键安装
- CLI 改成 node 兼容（当前依赖 bun）
- 自动注册 MCP server

### 9. 文档/营销
- README 加 GIF 演示
- npm 页面优化
- 社交媒体素材

---

## Phase 2 — 体验深化

### 4. 成长系统
- 互动次数 → 等级/状态变化
- 长期陪伴奖励

### 5. 帽子/换肤 DLC
- 帽子系统（第一行预留位）
- 稀有帽子通过互动解锁

### 6. 多宠物切换
- 收集多只，/pet switch 切换
- 宠物图鉴

### 7. art 统一工具
- build 脚本：art.ts → statusline shell case 自动生成

---

## Phase 3 — 覆盖完整

### 10. vibe-pick
- 不知道 MBTI 的用户，问几个问题推测性格
- v1 PRD 列过的最高优先级

### 8. 测试
- smoke test 全链路
- art 网格宽度自动校验

---

*PRD v3 — 2026-04-12*
