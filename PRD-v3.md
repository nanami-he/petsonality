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
- 性格/行为测试 302 tests, 2645 assertions
- 覆盖：MBTI 映射一致性、签名行自验证、禁词执行、talkLevel ↔ cooldown 一致性

### 3. OpenClaw reaction 适配 ✅（P0, 2026-04-13）
- Model-driven: OpenClaw 模型调 pet_react，Claude Code 走 `<!-- pet: -->` 不变
- Host 检测: PETSONALITY_HOST env 切换 instructions
- Cooldown: recordSpeak 时固定 next-allowed-at
- 参谋长复查通过（修了 4 条: SID 写死、prompt 回归、随机冷却、空返回）

### 4. 三态检测 + Doctor ✅（P1.5, 2026-04-13）
- diagnosePatch() 五态: native / patched / stale / unpatched / not-installed
- Installer 用三态决策: native→config+清理, stale→重 apply, unpatched→首次 apply
- autoUpgrade(): native 到来时自动清理旧 patch
- `doctor` CLI 子命令: 一键诊断 OpenClaw 安装状态

### 5. 说话系统重设计 ✅（2026-04-13）
- **问题:** 宠物只在出错时说话，正常工作时完全沉默（error notifier）
- **重设计:** 从风险控制改为陪伴节奏（70% 轻存在 + 20% 关键节点 + 10% 记忆点）
- react.sh 重写:
  - 日常成功触发 (8-15% by talkLevel)
  - 里程碑触发 (12-30%: test pass, commit, build)
  - Silent streak 保底 (7-18 次沉默后强制)
  - 动物专属池 (reactions-pool.json, 420 反应)
  - 废弃硬编码通用句
- Cooldown 下调: moderate [2,4]→[1,2]分钟, chatty [1,2]→[0.5,1.25]分钟
- OpenClaw prompt 对齐新节奏
- 参谋长复议: "把说话设计成陪伴节奏问题，不是风险控制问题"

---

### 6. npx 安装流 ✅（P2, 2026-04-13）
- hooks JS 化: react.js + pet-comment.js（去掉 jq/python/wrap.py）
- bun API 替换: import.meta.dir/main → node 兼容
- server 编译: dist/server.js (1MB bundle, 231 modules)
- CLI 编译: dist/cli/install.js + doctor.js (22KB + 21KB)
- cli/index.js npx 入口: install / doctor / uninstall / --help
- MCP 注册改用 node（Claude Code + OpenClaw）
- 旧 .sh hooks 移入 hooks/legacy/
- 参谋长复查通过

---

## 待办

### P1: OpenClaw PR 跟进
- 等 openclaw/openclaw#65886 维护者审核
- 根据反馈调整
- 合并后 installer 切换到 native config 模式，停用 patch

### P3: README + GIF
- 录制终端 GIF（展示宠物动画 + 气泡说话）
- README 重构：先展示体验，再讲技术
- 建议结构：GIF → 一句话 → 安装 → 宠物列表 → 技术细节（折叠）

### P4: statusline action 通用化
- 提取通用 action runner（减少 statusline 重复代码）

### P5: 多语言支持
- 当前所有反应/签名行/性格描述/prompt 都是中文
- 支持英文（优先）和其他语言
- 需要：反应池多语言、prompt 多语言、voice.ts 适配
- 语言检测：跟随用户系统语言 or MCP client 语言设置

### P6: 说话系统 v2 — hint 架构
- Hook 只写 event hint，模型才是唯一说话者
- 固定池降级为纯兜底
- 统一 reaction budget（talkLevel 控制全局频率）
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

### art 变更流程（必须遵守）
1. **只改 `server/art.ts`** — 唯一真源
2. 运行 `bun run build:art` — 自动生成 statusline shell
3. 运行 `bun test` — 验证所有帧 5×12 网格
4. **禁止直接改 statusline shell 的 GENERATED 区块**

### 每次发版前检查
- `bun test` 全部通过
- `bun run build:art` 后 `git diff` 为零（shell 和 art.ts 同步）
- `bun run build:reactions` 后检查 reactions-pool.json 更新
- `bash -n statusline/pet-status.sh` 语法检查
- `bash -n hooks/react.sh` 语法检查

### 教训记录
- **2026-04-13**: build:art 覆盖了 shell 里重新设计的早期动物 art。根因：art.ts 和 shell 双份维护时期的遗留。修复：从旧 shell 提取所有帧录入 art.ts，总帧数 92→113
- **2026-04-13**: OpenClaw patch 把 statusLine 放在 editor 上方，会被 TUI 重绘覆盖。修复：改为放在 editor 下方
- **2026-04-13**: 说话系统设计成"只在出错时反应"导致宠物几乎不说话。根因：把说话当风险控制而非陪伴节奏。修复：加日常触发 + 里程碑触发 + silent streak 保底

---

## 决策记录

### 2026-04-13 通用化路线共识（第一次国会）
- **参与者：** 侍从长、参谋长
- 品牌统一一刀切，HostAdapter 不做，Hook 归一化降级，art build 提前

### 2026-04-13 多宿主显示策略决议（第二次国会）
- **参与者：** 皇帝、侍从长、参谋长、mimo、deepseek
- 排除：tmux / /dev/tty daemon / 终端私有协议 / 桌面浮窗
- 决议：三线并行（Claude statusLine + OpenClaw PR + installer capability 检测）

### 2026-04-13 外部审查
- eval 安全问题被误判（所有 12 只有 action 的动物都有 grep 校验）
- 有效建议：加单测（已做 ✅）、README 重构（待做）、去 Python 依赖（排入 npx 阶段）

### 2026-04-13 优先级排序复议（第三次国会）
- **参与者：** 侍从长、参谋长
- **确认排序：** P0 → P1 → P1.5 → P2 → P3 → P4

### 2026-04-13 说话系统复议（第四、五次国会）
- **参与者：** 侍从长、参谋长
- **诊断:** hook 只对 error 反应 + 通用硬编码句 + cooldown 过长 = error notifier
- **决议:** 陪伴节奏（日常触发 + 动物专属 + 低 cooldown + silent streak 保底）
- **长期方向:** hint 架构（hook 只写事件，模型才说话，固定池兜底）

---

*PRD v3 — 2026-04-12 初版 / 2026-04-13 v3.2 说话系统重设计*
