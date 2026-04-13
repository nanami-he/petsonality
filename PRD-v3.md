# Petsonality PRD v3 — 下一阶段

> Your type, your pet.

## Phase 1 — 完成状态

### 1. 宠物形象设计 ✅
- 16/16 只全部完成（2026-04-13）
- 每只 3 idle 帧 + 3-7 action 帧，独立动画系统

### 2. 通用化

#### 2a. 品牌统一 ✅（2026-04-13）
- typet（61处）→ petsonality，~/.mbti-pet（64处）→ ~/.petsonality
- Legacy cleanup + 自动迁移

#### 2b. art build 自动生成 ✅（2026-04-13）
- art.ts → `bun run build:art` → statusline shell 自动生成

#### 2c. 多宿主显示 ✅（2026-04-13）
- **Claude Code:** statusLine.command，已完成
- **OpenClaw PR:** openclaw/openclaw#65886，已提交，机器人审查全修
- **OpenClaw 注入:** cli/openclaw-patch.ts，临时 patch 方案
- **Installer:** 检测宿主 → MCP 注册 + statusLine（patch 或 native config）
- **Uninstall:** 恢复原始文件 + 清理 OpenClaw 配置

#### 2d. 测试 ✅（2026-04-13）
- charWidth / stringWidth / padDisplay 单测
- art 网格校验（16 动物 × 全帧 × 5 行 = 12 字符宽度）
- 20 tests, 622 assertions

---

## Phase 1 剩余 — 接下来做的事

### P0: OpenClaw reaction 适配
- 当前问题：宠物在 OpenClaw 上能显示但**不会说话**
- Claude Code 靠 hooks（PostToolUse/Stop）触发 reaction
- **不复刻 Claude hook 模型**，直接基于 OpenClaw 的 agent/tool/session event 触发
- 实施顺序：
  1. 定义统一 reaction 写入协议（reaction/reason/ts/sessionId）
  2. 先接 tool fail / error → 写 reaction.json
  3. 再补 turn-end 轻反应
- **MVP 完成标准：** tool fail 会说话 + cooldown 正常 + 不串 session

### P1: OpenClaw PR 跟进
- 等 openclaw/openclaw#65886 维护者审核
- 根据反馈调整
- 合并后 installer 切换到 native config 模式，停用 patch

### P1.5: 注入/原生 capability 检测稳定性
- installer/doctor 需清晰判断三种 OpenClaw 状态：
  1. 原生未支持（无 statusLine）
  2. 已注入 patch
  3. 原生支持（PR 合并后版本）
- 原生支持后自动停用 patch
- 防止重复注入、版本不兼容时安全降级

### P2: npx 安装流
- `npx petsonality` 一键安装
- CLI 改 node 兼容（去掉 bun 依赖）
- 去掉 wrap.py（Python 依赖，用 TS 替代）
- 目标：安装只需 node，不需要 bun/python/jq

### P3: README + GIF
- 录制终端 GIF（展示宠物动画 + 气泡说话）
- README 重构：先展示体验，再讲技术
- 建议结构：GIF → 一句话 → 安装 → 宠物列表 → 技术细节（折叠）

### P4: statusline action 通用化
- 提取通用 action runner（减少 statusline 重复代码）
- 目前每只动物的 elif action 块结构完全一样，可以合并

---

## Phase 2 — 体验深化

### 4. 成长系统
- 互动次数 → 等级/状态变化

### 5. 帽子/换肤 DLC
- 帽子系统（第一行预留位）
- 稀有帽子通过互动解锁

### 6. 多宠物切换
- 收集多只，/pet switch 切换
- 宠物图鉴

### 10. vibe-pick
- 不知道 MBTI 的用户，问几个问题推测性格

---

## 决策记录

### 2026-04-13 通用化路线共识（第一次国会）
- **参与者：** 侍从长、参谋长
- 品牌统一一刀切，HostAdapter 不做，Hook 归一化降级，art build 提前

### 2026-04-13 多宿主显示策略决议（第二次国会）
- **参与者：** 皇帝、侍从长、参谋长、mimo、deepseek
- 排除：tmux / /dev/tty daemon / 终端私有协议 / 桌面浮窗
- 决议：三线并行（Claude statusLine + OpenClaw PR + installer capability 检测）
- 追加：OpenClaw 注入方案（PR 合并前的过渡）+ MCP 注册

### 2026-04-13 外部审查
- 审查报告：petsonality-review.md
- eval 安全问题被误判（所有 12 只有 action 的动物都有 grep 校验）
- 有效建议：加单测（已做 ✅）、README 重构（待做）、去 Python 依赖（排入 npx 阶段）

### 2026-04-13 优先级排序复议（第三次国会）
- **参与者：** 侍从长、参谋长
- **确认排序：** P0 reaction → P1 PR → P1.5 检测稳定性 → P2 npx → P3 README → P4 action 通用化
- **参谋长关键建议：**
  1. P0 不要找 Claude 同构 hook，直接用 OpenClaw event 流
  2. 补 P1.5 注入/原生三态检测
  3. 定义 OpenClaw MVP 完成标准（tool fail 会说话 + cooldown + 不串 session）

---

*PRD v3 — 2026-04-12 初版 / 2026-04-13 v3.1 全面更新*
