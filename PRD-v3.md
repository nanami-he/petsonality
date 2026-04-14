# Petsonality PRD v3 — 路线图

> Your type, your pet.

## Phase 1 — 已完成 ✅

### 1. 宠物形象设计 ✅
- 16/16 只全部完成，116 animation frames
- 每只 3 idle 帧 + 3-10 action 帧，独立动画系统

### 2. 通用化 ✅
- 品牌统一 typet→petsonality（125处）
- art build 自动生成（art.ts → statusline shell）
- 多宿主显示（Claude Code statusLine + OpenClaw patch/PR）
- 302 tests / 2645 assertions

### 3. OpenClaw reaction 适配 ✅（P0）
- Model-driven: OpenClaw 调 pet_react，Claude Code 走 `<!-- pet: -->`
- Host 检测 + cooldown + 参谋长复查 4 修

### 4. 三态检测 + Doctor ✅（P1.5）
- diagnosePatch() 五态决策 + autoUpgrade + doctor CLI

### 5. 说话系统重设计 ✅
- 从 error notifier → 陪伴节奏
- 日常/里程碑/streak 保底 + 动物专属池 638 反应
- react.js + pet-comment.js（去 jq/python）
- 参谋长两次复议

### 6. npx 安装流 ✅（P2）
- dist/server.js (1.1MB) + dist/cli/*.js
- hooks JS 化，node-only
- npm published: petsonality@0.2.0

### 7. README + GIF ✅（P3）
- 情感开头 + 4x4 动画网格 + 渐进展开
- 16 只 GIF（accent colors） + 全英文
- 内阁总理审查通过

### 8. 反应池扩充 ✅
- 420 → 638 reactions，16×7 全覆盖零空白
- 6 只动物补全专属反应（golden/beaver/elephant/cheetah/bear/lion）
- labrador pet 反应修正（ESFJ→ENFJ）
- 内阁总理逐只审查

### 9. 代码清理 ✅
- 删除 popup/（死代码 1317 行）
- 删除 hooks/legacy/
- 去掉未使用导入
- pet_rename/pet_adopt 加特殊字符校验
- DeepSeek + 子 agent 独立审查

---

## 待办

### P1: OpenClaw PR 跟进 `[blocked — 等维护者]`
- openclaw/openclaw#65886
- Greptile 3 问全修，CI 绿
- 合并后 installer 自动切 native config

### P4: statusline action 通用化
- 提取通用 action runner（减少 statusline 重复代码）
- 每只动物的 elif action 块结构完全一样，可以合并

### P5: 多语言支持
- 当前反应/签名行/prompt 全中文
- 英文优先，检测用户语言

### P6: 说话系统 v2 — hint 架构
- Hook 只写 event hint，模型做唯一说话者
- 固定池降级为兜底
- 风格锚点 + validateVoice 升级

---

## Phase 2 — 体验深化

### 成长系统
- 互动次数 → 等级/状态变化

### 帽子/换肤 DLC
- 帽子系统（第一行预留位）
- 稀有帽子通过互动解锁

### 多宠物切换
- 收集多只，/pet switch 切换
- 宠物图鉴

### vibe-pick
- 不知道 MBTI 的用户，问几个问题推测性格

---

## 维护检查流程

### art 变更
1. 只改 `server/art.ts` → `bun run build:art` → `bun test`

### 发版前
- `bun test` + `bun run build` + `git diff` 为零
- `bash -n hooks/react.js` 不需要（是 JS）
- npm version patch → npm publish

### 教训
- art.ts/shell 双份维护导致覆盖（已修：art.ts 唯一真源）
- OpenClaw patch 放错位置（已修：editor 下方）
- 说话当风险控制不当陪伴（已修：日常触发 + streak 保底）
- 海豚 art.ts 从未更新（已修：同步 statusline 真实设计）

---

## 决策记录

### 2026-04-13 五次国会
1. 品牌统一一刀切
2. 多宿主三线并行（Claude + OpenClaw PR + capability 检测）
3. 优先级排序：P0→P1→P1.5→P2→P3→P4
4. 说话系统：陪伴节奏不是风险控制
5. npx：开发用 bun，发布给 node

### 2026-04-14 内阁审查
- 内阁总理：反应池审查 6.5/10 → 补全后通过
- DeepSeek：代码审查，5 真问题修复
- README 审查：情感核心优先功能清单

---

*PRD v3.3 — 2026-04-14 Phase 1 完结*
