# Petsonality PRD v3 — 下一阶段

> Your type, your pet.

## Phase 1 — 可宣传版（优先）

### 1. 宠物形象设计 ✅
- 16/16 只全部完成（2026-04-13）
- 每只 3 idle 帧 + 3-7 action 帧，独立动画系统
- 详见 CHANGELOG-v1.1.md

### 2. 通用化
> 侍从长 + 参谋长共识路线（2026-04-13）
> 参考：docs/prd-v3-generalization-plan.md（参谋长原案，部分已被修正）

**执行顺序：**

#### 2a. 品牌统一 ✅（2026-04-13）
- 产品名 / CLI / MCP key / npm bin / 数据目录 → 全部统一为 `petsonality`
- `typet`（61处）→ `petsonality`，保留一版兼容别名
- `~/.mbti-pet/`（64处）→ `~/.petsonality/`，server/state.ts 自动迁移
- Legacy cleanup: install/uninstall/doctor/backup 检查旧 typet key

#### 2b. art build 自动生成 ✅（2026-04-13）
- 单一真源：`server/art.ts` + `server/art-meta.ts`（accent 颜色）
- 生成器：`scripts/build-art.ts` → `bun run build:art`
- 生成 3 个标记区块：colors、bubble colors、art rendering
- 校验：5×12 网格、frame 数、宠物 ID 完整
- **以后改 art 只改 art.ts，运行 build:art 自动同步**

#### 2c. install.ts 轻量客户端分发（P0，依赖 2a）
- `detectClient()` 自动检测 Claude Code / generic
- install.ts 内 if/else 分发，**不做 HostAdapter 接口**
- 等真有第三个宿主再抽象

#### 2d. statusline 独立化（P1，依赖 2c）
- 输入契约：只读 status.json + reaction.json + 环境变量
- sessionId 来源：env > TMUX_PANE > fallback

#### 2e. hook/skill 抽象（后置，等第二宿主）
- 不做 NormalizedHookInput，不做 skill 多客户端目录
- Claude Code 版 hook 稳住即可
- 等 OpenClaw 真接入时根据其事件模型再定

### 3. npx 安装（依赖 2a + 2c）
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

---

## Phase 3 — 覆盖完整

### 10. vibe-pick
- 不知道 MBTI 的用户，问几个问题推测性格
- v1 PRD 列过的最高优先级

### 8. 测试
- smoke test 全链路
- art 网格宽度自动校验

---

## 决策记录

### 2026-04-13 通用化路线共识
- **参与者：** 侍从长（Claude Code）、参谋长（ChatGPT 5.4）
- **结论：** 参谋长原案架构方向对，但对单人维护项目过度工程化
- **关键修正：**
  1. 品牌统一一刀切 petsonality，不搞三名并存
  2. Phase G 单独做，不与架构重构混 PR
  3. HostAdapter 接口不做，if/else 够用
  4. Hook 归一化从 P0 降为后置项
  5. art build 脚本从 Phase 2 提前到 Phase 1
  6. 先可安装可传播，再多宿主适配

---

*PRD v3 — 2026-04-12 初版 / 2026-04-13 通用化路线更新*
