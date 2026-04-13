# Petsonality PRD v3 — 下一阶段

> Your type, your pet.

## Phase 1 — 可宣传版（优先）

### 1. 宠物形象设计 ✅
- 16/16 只全部完成（2026-04-13）
- 每只 3 idle 帧 + 3-7 action 帧，独立动画系统
- 详见 CHANGELOG-v1.1.md

### 2. 通用化

#### 2a. 品牌统一 ✅（2026-04-13）
- 产品名 / CLI / MCP key / npm bin / 数据目录 → 全部统一为 `petsonality`
- `typet`（61处）→ `petsonality`，保留一版兼容别名
- `~/.mbti-pet/`（64处）→ `~/.petsonality/`，server/state.ts 自动迁移
- Legacy cleanup: install/uninstall/doctor/backup 检查旧 typet key

#### 2b. art build 自动生成 ✅（2026-04-13）
- 单一真源：`server/art.ts` + `server/art-meta.ts`（accent 颜色）
- 生成器：`scripts/build-art.ts` → `bun run build:art`
- 生成 3 个标记区块：colors、bubble colors、art rendering
- **以后改 art 只改 art.ts，运行 build:art 自动同步**

#### 2c. 多宿主显示策略（三线并行）
> 国会决议（2026-04-13）

**核心认知：** 在 TUI 程序里显示第三方持续动画，只有两条路——宿主给渲染入口，或外部单独显示层。statusLine.command 是目前最佳的宿主渲染入口协议。

**三条并行线：**

##### 线路 A：Claude Code — statusLine.command ✅
- 已完成，继续使用
- pet-status.sh 通过 statusLine.command 渲染到终端
- hooks (PostToolUse/Stop) 驱动宠物反应

##### 线路 B：OpenClaw — fork + PR 加 statusLine.command
- Fork openclaw/openclaw
- 给 TUI 加 statusLine.command 通用能力（~100-200 行改动）
- 提 PR 给上游，强调是**通用 TUI 状态渲染能力**，不是"为了宠物"
- PR 合并后，所有 brew/npm 用户更新即可用
- **PR 不合并的预案：** 短期维护 fork，Petsonality 支持 fork 版
- OpenClaw 源码已确认具备条件：setInterval、spawn()、Text 组件、config schema 可扩展

##### 线路 C：Petsonality installer — capability 检测
- 不硬编码宿主名，检测**能力**（hasStatusLineCommand）
- 检测到 Claude Code + statusLine → 写 settings.json
- 检测到 OpenClaw + statusLine → 写 openclaw 配置
- 未来新宿主支持 statusLine.command → 自动适配

#### 2d. hook/reaction 适配（依赖 2c 线路 B）
- Claude Code: PostToolUse/Stop hooks → reaction.json ✅
- OpenClaw: 根据 OpenClaw 事件机制设计对应的 reaction 触发
- MCP instructions 注入宠物人设 → 已通用 ✅

### 3. npx 安装（发布前收口）
- `npx petsonality` 一键安装
- CLI 改成 node 兼容（当前依赖 bun）
- 自动注册 MCP server
- **优先级：等 2c 线路 B 至少有初版后再做**

### 9. 文档/营销（发布前收口）
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

---

## Phase 3 — 覆盖完整

### 10. vibe-pick
- 不知道 MBTI 的用户，问几个问题推测性格

### 8. 测试
- smoke test 全链路
- art 网格宽度自动校验

---

## 决策记录

### 2026-04-13 通用化路线共识（第一次国会）
- **参与者：** 侍从长（Claude Code）、参谋长（ChatGPT 5.4）
- **结论：** 参谋长原案架构方向对，但对单人维护项目过度工程化
- **关键修正：**
  1. 品牌统一一刀切 petsonality，不搞三名并存
  2. HostAdapter 接口不做，if/else 够用
  3. Hook 归一化从 P0 降为后置项
  4. art build 脚本从 Phase 2 提前到 Phase 1

### 2026-04-13 多宿主显示策略决议（第二次国会）
- **参与者：** 皇帝、侍从长、参谋长、mimo（独立审查）、deepseek（独立审查）
- **核心问题：** 如何让宠物在任何终端 AI 工具里持续显示
- **排除的方案：**
  - tmux 伴生层 — 太重，用户要额外装 tmux
  - /dev/tty daemon + DECSTBM — TUI 程序会覆盖
  - Kitty/iTerm2 私有协议 — 不通用
  - 系统级桌面浮窗 — 太复杂
- **最终决议：** 三线并行
  - Claude Code: statusLine.command（已完成）
  - OpenClaw: fork + PR 加 statusLine.command
  - Installer: capability 检测，不绑定宿主名
- **参谋长条件：**
  1. PR 不一定合并，准备好维护 fork
  2. Installer 按 capability 设计，不按宿主名硬编码
- **根本认知：** 在 TUI 里第三方持续动画没有完美无侵入解，要么宿主给入口，要么外部单独显示层

---

*PRD v3 — 2026-04-12 初版 / 2026-04-13 通用化+显示策略更新*
