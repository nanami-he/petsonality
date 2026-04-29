# Petsonality PRD v3 — 路线图

> Your type, your pet.
> npm: petsonality@0.4.5 | GitHub: nanami-he/petsonality

## Phase 1 — 已完成 ✅

### 1. 宠物形象 ✅ — 16/16 只，116 帧
### 2. 通用化 ✅ — 品牌统一 + art build + 多宿主 + 302 tests
### 3. OpenClaw reaction ✅ (P0) — model-driven pet_react
### 4. 三态检测 + Doctor ✅ (P1.5) — diagnosePatch 五态 + autoUpgrade
### 5. 说话系统重设计 ✅ — 陪伴节奏（日常/里程碑/streak 保底 + 638 反应）
### 6. npx 安装流 ✅ (P2) — dist/ 编译 + node-only + npm published
### 7. README + GIF ✅ (P3) — 情感开头 + 4x4 动画网格 + 全英文
### 8. 反应池扩充 ✅ — 420→638，16×7 零空白
### 9. 代码清理 ✅ — popup/ 删除 + 独立审查 + 输入校验
### 10. statusline action 通用化 ✅ (P4) — read_action/tick_action 共享函数，-260 行
### 11. 多语言支持 ✅ (P5) — 自动 LANG 检测，zh=638 + en=638
### 12. hint 架构 ✅ (P6) — hook 写事件，模型说话，固定池兜底
### 13. npx 路径修复 ✅ — 运行时文件复制到 ~/.petsonality/，不依赖 npx 临时目录
### 14. OpenClaw 独立安装 ✅ — installer 不再要求 ~/.claude/
### 15. 跨平台安装器 ✅ (v0.4.1, 2026-04-28) — 第一个 Windows 用户 bug (#2 by @Lwhieldon) → 替换 5 处 `which` + 2 处 `readlink`/`ls` shellout 为纯 Node 实现 + Windows 跳过 statusline + `cli/which.ts` helper
### 16. CI 版本三同步 ✅ (2026-04-28) — `scripts/sync-version.mjs` + `npm version` lifecycle hook，未来 `npm version patch` 自动同步 `package.json` / `plugin.json` / `server/index.ts`
### 17. OSS 协作脚手架 ✅ (2026-04-28) — `CONTRIBUTORS.md` + `CONTRIBUTING.md` 重写 + 2 个 `good first issue` (#3 hook quoting, #4 native Windows statusline)
### 18. Windows hook command quoting ✅ (v0.4.2, 2026-04-29) — **第一个外部 PR (#5 by @MestreY0d4-Uninter)** 在 #3 开出 2 小时内交付：双引号包裹 `nodePath` + `reactHook`，修 `C:\Program Files\nodejs\node.exe` 空格被切坏问题。抽出 `cli/hook-command.ts` + 加 unit test guarding canonical case
### 19. findPackageRoot Windows 死循环 ✅ (v0.4.3, 2026-04-29) — 自己 dogfooding Win 时发现：`while (dir !== "/")` 在 Windows 永不终止（`path.dirname("C:\\")` 返回自己），`npx petsonality doctor` hang 100% CPU + 进程泄漏。改为 "dirname stopped changing" 平台无关检测，DRY 抽 `cli/find-package-root.ts`，加 regression test
### 20. GitHub Releases 页补建 ✅ (2026-04-29) — v0.4.1 / v0.4.2 / v0.4.3 三个 release pages，每个写完整故事 + 贡献者 credit + 三版本 Windows 修复对照表
### 21. 第二个外部 PR + Lwhieldon 升级为 contributor ✅ (v0.4.4, 2026-04-29) — **Mateus 第二个 PR (#11, 1500 行 PowerShell statusline)** 闭 #4，**Lwhieldon 第一个 PR (#12)** 闭 #10（重画金毛 ASCII 形象 + `pet_pet` 内联渲染 + Windows path fix），加上 PR #9 (你的 CJK charWidth fix)。现 CONTRIBUTORS.md 有 2 位外部 contributor + 你
### 22. Issue #8 packaging fix ✅ (v0.4.4, 2026-04-29) — `bun run build:reactions` 在 npx user 端永远失败（`scripts/` + `server/` 没在 tarball），所有用户都拿 fallback reactions。改为 prepublish 把 `dist/reactions-pool.json` (58 KB) 打进 tarball，installer 改为 copy artifact 而不是 build。npm install **彻底去掉 bun 运行时依赖**
### 23. G0 Multi-channel 分发架构 ✅ (v0.4.5, 2026-04-29) — npm outage 触发的架构升级，**第一次有不止一条独立 install 路径**：
- `.claude-plugin/plugin.json` 切到 `node + dist/server.js`（不再要求 bun + 源码）
- `dist/` 提交进 git（plugin / git-clone 路径不再需要 build step）
- `.githooks/pre-commit` 自动 rebuild + git add（防 dist 跟 source 不同步）
- `package.json` `prepare` script 让 `bun install` 自动设置 hooksPath（contributor 也享受到）
- `cli/plugin-manifest.test.ts` 永久 pin 住 manifest，未来 drift CI 抓
- `cli/doctor.ts` 加 Windows native 探测（7 个 tryExec 替换为 cmd.exe / PowerShell / WT_SESSION 等）
- `scripts/build-reactions.ts` hermetic by default（只写 dist/，dev 用 `bun run sync:reactions` 显式同步）
- 金毛 statusline 帧映射 off-by-one fix（PR #12 art redesign 后 lick/spin 帧错位，bash + ps1 双修复）

---

## 当前优先 — 宣传 + 推广

### G0: 多渠道分发架构（**新增 2026-04-29，🔴 高优先级，因 npm outage 触发**）

**触发**：v0.4.4 publish 时撞上 npm registry 服务挂了 30+ min。整个 ship 流程被 npm 单点故障阻塞。

**问题**：当前唯一分发渠道是 `npm + npx`，npm 抽风时所有新用户拉不到包。MCP 服务器对应的更原生渠道（Claude Code Plugin、MCP Server Registry）都没启用。

**目标**：让 petsonality 至少 3 条独立分发路径可用，任意一条挂了不影响其他。

**渠道矩阵（理想态）**：

| 渠道 | 用户类型 | 当前状态 | 需要做什么 |
|------|---------|---------|-----------|
| `npm + npx petsonality` | 看到推文 / Reddit / HN 来 | ✅ 主流 | 维护即可 |
| `claude plugin install github:nanami-he/petsonality` | Claude Code 内 browse 插件的人 | 🟢 manifest 已改为 `node + dist/server.js`，dist/ 已准备入 git | 真实 Claude Code plugin install smoke test |
| MCP Server Registry ([modelcontextprotocol.io](https://modelcontextprotocol.io)) | 在 MCP 官方目录浏览的人 | ❌ 未列 | 提交注册 PR / 表单 |
| `git clone + bun install + bun run build` | 开发者 / 想看源码 | ✅ 已能用 | CONTRIBUTING.md 已写 |
| Homebrew formula | macOS 原生开发者 | ❌ 未做 | 写 formula + 提交（长期项） |

**核心架构决策：dist/ 入不入 git？**

```
旧现状：dist/ 在 .gitignore 里
  → npm 路径：tarball 包含预编译 dist/，用户 npx 不需要 bun ✅
  → plugin/clone 路径：必须 bun build 才能跑 ⚠️
```

**方案 A**：把 dist/ 提交到 git
- 优点：Plugin / GitHub clone 路径**完全不需要 bun**，所有用户路径统一只要 node
- 缺点：git 仓库每次 commit 多 1.1 MB diff，commit 流程多一步 `bun run build`
- 缓解：写 pre-commit hook 自动跑 build（不用手动）

**方案 B**：保持 dist/ gitignored，每条路径文档化各自要求
- 优点：git 历史干净
- 缺点：plugin / clone 路径门槛 = bun 安装

**决策方向**：倾向**方案 A** —— 1.1 MB git 增长可接受，换来 multi-channel 干净体验。

**任务清单（按优先序）**：
- [x] 改 `.claude-plugin/plugin.json` —— `command` 改成 `node`，`args` 指向 `dist/server.js`
- [x] 把 `dist/` 从 `.gitignore` 移除
- [x] 加 pre-commit hook 自动 `bun run build`（`.githooks/pre-commit`，按 staged 文件触发）
- [x] 把 dist/ 第一次 commit 进去（PR #13 → v0.4.5）
- [ ] **真 Windows host 上 smoke test 0.4.5**（`npx petsonality@latest` + `/pet`）
- [ ] **测 `claude plugin install github:nanami-he/petsonality`**（需要新装 Claude Code 测）
- [ ] 提交 petsonality 到 [MCP Server Registry](https://modelcontextprotocol.io) 的 server directory
- [ ] README 加「Install」章节，列出 3 条路径（npx 主推，plugin 次推，git clone 给开发者）
- [ ] **dist/reactions-pool.json 改为确定性输出**（当前每次 build 都 reorder ~700 行，commit noise；改为对 array 排序后再 stringify）
- [ ] （长期）写 Homebrew formula

**优先级理由**：npm outage 已经发生过一次，下次会再发生。在更多用户进来前把 multi-channel 架构跑通，等 0.4.5 / 0.5.0 时已经稳了。

**进度（2026-04-29）**：核心架构 4/4 done（v0.4.5 已 ship），剩下都是验证 + 推广 + 优化。multi-channel 已经从「想法」变成「真有这条路径」。

### G1: 社区推广
- [x] Twitter/X 发帖（v0.4.0 launch tweet, 2026-04-18，reach 小但已发）
- [x] Reddit r/ClaudeCode 互动（"Mobile→PC→Claude" thread reply, cabinet 角度切入）
- [ ] Reddit r/ClaudeAI 主动发帖（附 GIF + 安装命令）
- [ ] Hacker News Show HN 帖（建议等 Lwhieldon 实测确认 v0.4.3 work 再发，避免发完发现还有 Windows 边界 case）
- [ ] Claude Code Discord / community 频道分享
- [ ] OpenClaw Discord 分享（关联 PR #65886）
- [ ] 中文社区推广（**等产品再完善一点**——主动 defer，先做英文世界）

### G2: 终端录屏 ✅
- [x] PIL 生成 6 场景 demo GIF（install→adopt→react→pass→tagline）
- [x] 嵌入 README 顶部
- [ ] 真实终端录屏（回到电脑后用 Cmd+Shift+5）— 可选升级

### G3: 产品页面
- [x] demo GIF 更新（6 场景，Fox 主角）
- [x] 4x4 grid 重排（ST/SF/NF/NT 直觉查找）
- [x] GitHub repo description + topics（已有 12 个 topics + `pet-companion` 新加）
- [ ] npm 页面描述优化
- [ ] 考虑做一个简单 landing page？
- [ ] **README.zh.md** —— 中文版本（推迟到产品再完善后做，跟中文社区推广一起 ship）

---

## 维护（持续）

### M1: OpenClaw PR #65886
- [x] PR 描述重写 + ping 维护者（2026-04-14）
- [x] gentle bump (2026-04-28)
- [x] **Codex bot review follow-up commit** (2026-04-28, e542875c21)：SIGKILL fallback + schema 真正 regenerate + 安全文档 + 4 个 lifecycle test
- [ ] 等维护者人工回复，按需 rebase
- [ ] 合并后 installer 切 native config

### M2: 体验微调
- [ ] 真实使用观察说话频率（当前 npm downloads 极低，等用户基数起来再观察）
- [ ] build:reactions 在 npx 环境的 fix
- [x] 发版流程脚本化（v0.4.1 后加 `scripts/sync-version.mjs`，`npm version` 自动同步三个版本号文件）

### M3: i18n 完整覆盖 ✅ (v0.4.0 完成)
- [x] `server/messages.ts` 集中 message catalog，`t(key, params)` 按 LANG 自动切
- [x] `server/index.ts` 所有 tool 响应文本通过 `t()` 走 i18n
- [x] `server/voice.ts` `buildPersonalityPrompt` 接 messages.ts 的 `voicePromptTemplate()`
- [x] `engine.ts` 的 `ANIMAL_DISPLAY` / `ANIMAL_DESC` / `RECOMMENDATION_MAP` 通过 `messages.ts` 的 `animalName / animalDesc / complementReason` 包装按 LANG 选
- [x] `skills/pet/SKILL.md` 全英化 + 双语 no-pet 字符串检测
- [x] 全套首次体验路径（adopt / setup / show / pet / mute / unmute / rename / browse）英语用户上手不出戏

### M4: 安装侵入性透明化
现状：`installStatusLine` 自动替换已有 statusLine（虽有 `.bak`），`installHooks` 重写既有 hook 条目。
- [ ] 检测到现有非空 statusLine 时，prompt 用户确认 + 显示即将被覆盖的内容
- [ ] hook 重写也走同样的"先 diff 再写"流程
- [ ] 长期等 OpenClaw merge PR #65886 后，TUI patch 路径完全废弃
- 决策记录：短期接受侵入式安装 + 自动 backup 兜底是 conscious choice，优先开发速度，但推广开始后用户初见信任成本会上升

### M5: Windows 完整支持（**新增 2026-04-28，因 #2 触发**）
- [x] v0.4.1 修了 `which` 报错 + install 跑完不挂
- [x] **#3 / v0.4.2** hook command path quoting（@MestreY0d4-Uninter PR #5 + unit test）
- [x] **v0.4.3** findPackageRoot 死循环（自己 dogfooding 发现 + regression test）
- [ ] **#4** native Windows status line（PowerShell / cmd 替代 pet-status.sh）—— 仍开放 good first issue
- [ ] doctor.ts 的 Windows fallback（当前 7 个 `tryExec` 在 Windows 都会输出 "(failed)"）
- [ ] Lwhieldon 实测确认 v0.4.3 work → close #2
- 触发：Issue #2 by @Lwhieldon (2026-04-28)，第一个真用户
- 经验：14 小时内 ship 3 个 patch 版本，每个修一层 Windows-only bug。**Windows 不 dogfood 永远抓不到这些**

### M6: OSS 协作脚手架（**新增 2026-04-28**）
- [x] `CONTRIBUTORS.md` —— 现有 2 位 contributor: @Lwhieldon (Bug reports) + @MestreY0d4-Uninter (Code, 第一个外部 PR)
- [x] `CONTRIBUTING.md` —— dev setup + commit conv + PR flow + project layout
- [x] 2 个 `good first issue`（#3 已 close, #4 仍 open）
- [x] **首个外部 PR 跑通了**：from issue 开出 → 2h 收到 PR → 6h merge → 同 commit ship → contributor 上 README → 公开 thank-you。**整套 OSS 协作循环验证可用**
- [ ] Issue / PR template review（已有 bug-report.yml；考虑加 feature_request.yml）

---

## Phase 2 — 体验深化（后续）

### 成长系统
- 互动次数 → 等级/状态变化
- **心情系统接逻辑**（v0.3.5 暂时撤掉显示，字段保留在 state 里）：错误时变 worried、连续 commit 成功变 proud、长时间无互动变 sleepy
- **互动次数显示**回归（v0.3.5 暂时撤掉）：达到里程碑（10/50/100）触发特殊反应或解锁稀有帽子

### 帽子/换肤 DLC
- 帽子系统（第一行预留位）
- 稀有帽子通过互动解锁

### 多宠物切换
- 收集多只，/pet switch 切换 + 宠物图鉴

### vibe-pick
- 不知道 MBTI 的用户，问几个问题推测性格

### Personality-driven session opener（受 kotofetch 启发，2026-04-26）
**问题**：当前每只宠物有 `firstGreeting`（领养时一次性使用）+ `signatureLines`（fallback 池）。session 启动时没有"开场白"机制——用户开终端看到的是上次留下的 reaction，缺少"它在等你"的仪式感。

**方案**：每个 session 第一次活动前，pet 按自己 personality 说一句话（不是统一日语谚语类的universal 智慧——那会扁平化 16 个性格）。每只用自己的"开场风格"：
- Raven (INTJ) — 一句冷峻预言："今天的代码会出现你最不想看到的循环"
- Owl (INTP) — 一个奇怪小问题："你想过为什么 array index 从 0 开始吗"
- Fox (ENTP) — 一句反讽："希望这次你能想清楚再写"
- Bear (ENTJ) — 一句指令："动手"
- Lion (ESTJ) — 一句宣告："今天我们会按计划完成"
- Panda (ISFP) — 一句懒散："反正会写完的"
- ...（每只 4-6 条 opener，复用现有 `signatureLines` 池或加 `openerLines` 字段）

**实现**：
- pets.ts 加 `openerLines: string[]`（或复用 signatureLines）
- state.ts 加 `lastSessionOpenerAt` 时间戳，>4h 间隔才触发
- voice.ts 在 first-of-session reaction 时优先抽 openerLines
- statusline 启动时主动写一条而不是等事件

**为啥不简单照搬 kotofetch 的"启动一句日语谚语"**：
- kotofetch 核心 = 谚语本身，universal 是 feature
- petsonality 核心 = personality 差异化，universal 是 anti-feature
- 直接加"统一开场谚语"会让 16 个性格瞬间扁平化，违反"Your type, your pet"的 tagline

**优先级**：推广完成（W4 之后）再做，避免推广期改 product。约 2-3 小时工作量。

---

## 维护检查流程

### 发版前
```bash
bun test                    # 305 tests (was 302; +1 from Mateus, +2 from findPackageRoot)
bun run build               # server + cli + art + reactions
bash -n statusline/pet-status.sh  # shell 语法
npm version patch           # 升版本（自动跑 sync-version.mjs 同步 plugin.json + server/index.ts）
git push && git push --tags # 同步 commit + tag 到 GitHub
npm publish --access public # 发布到 npm
gh release create vX.Y.Z --latest --notes "..."  # 建 GitHub Release page，写完整故事
```

### 发版后
- 如果是 user-reported bug → 回 issue 通知，等用户验证再 close
- 如果有外部 contributor → 加进 CONTRIBUTORS.md + 公开 PR thank-you

### 教训
- art.ts/shell 双份维护导致覆盖 → art.ts 唯一真源
- OpenClaw patch 放错位置 → editor 下方
- 说话当风险控制 → 陪伴节奏
- 海豚 art 从未更新 → 同步 statusline 设计
- npx 临时目录路径不稳定 → 复制到 ~/.petsonality/
- installer 硬依赖 Claude Code → 检测宿主独立安装
- 跨平台不能 shell-out 到 Unix 工具 → 纯 Node 实现 (v0.4.1 #2)
- `npm version` 只动 package.json 但 CI 检查三个 → version lifecycle hook 自动同步 (v0.4.1)
- commit message 写 `closes #N` 在 fix 还没被用户验证时就自动关 issue → 改用 `references #N`
- 拼 shell command 用 `${path1} ${path2}` 不加引号 → 路径有空格直接 break，**永远加 `"${path}"`** (v0.4.2 #3)
- `while (dir !== "/")` 终止条件**不平台无关**——Windows 走到 `C:\` 永远停不下来；改用 `dirname(dir) === dir` "停止变化" 检测 (v0.4.3)
- 写跨平台代码后**必须自己在 Windows 上 dogfood**——CI test 跑 macOS/Linux 抓不到 Windows-only bug（findPackageRoot 死循环就是 305 tests 全绿但 Windows hang）
- 单一 issue 报告可能引出多层 bug → 每个 fix 独立小版本 ship，比堆一个大 release 信息密度更高 + user 反馈循环更短
- GitHub `git push --tags` 只推 tag 不建 Release page → 主页 "Releases" 区会一直挂老版本，需要 `gh release create` 手动建
- Install 时 shell-out 到 build 脚本 + 源码不在 tarball → 每个 npx 用户都失败 silent fallback（Issue #8，整个 launch 周期都中招）。**安装路径不应该依赖任何 build 工具**——build 在 publish 时做，install 时只复制
- npm registry 是单点故障（v0.4.4 publish 时撞 outage 30+ min）→ MCP 服务器应该走 multi-channel：npm + Claude Code Plugin + MCP Server Registry，至少 3 条独立路径（v0.4.5 落地了前两条）
- PR merge 后 main 上的 generated file 可能跟最新源码不一致（PR #11 的 `pet-art.json` 是 Mateus 基线时生成的，merge 后没自动重 build；PR #12 的金毛 art 在 server/art.ts 改了但 pet-art.json 没同步）→ **每次 merge 后 dogfood 之前先跑一遍 `bun run build` 确认所有 generated 文件都是最新**
- dist/ 入 git 后，**rebuild 必须靠 hook 自动化**——靠人工记得 `bun run build` 一定会忘。`.githooks/pre-commit` 检测 staged 是不是 build input，是就 rebuild + git add（v0.4.5）
- `prepare` script 是分发 git hook 给 contributor 最简单的方式（不需要 husky）——`bun install` 自动跑 `git config core.hooksPath .githooks`，用 `|| true` 避免 npm tarball install 时报错
- build 输出最好是 deterministic 的，否则每次 commit 都有 noise。`build-reactions.ts` 用 random sample 进 Set，每次输出 reorder 700 行（v0.4.5 标了 follow-up）

---

## 决策记录

### 2026-04-13 五次国会 + 2026-04-14 内阁审查
- 品牌统一一刀切 / 多宿主三线并行 / 陪伴不是风险控制
- 开发用 bun，发布给 node / 反应池全覆盖 / 情感核心优先
- hint 架构：hook 只写事件，模型才说话 / 多语言零配置

### 2026-04-29 Windows 三连击 + 第一个外部 PR
- **Windows 用户进来当天就拉 24 小时 ship 节奏**：v0.4.0 → 0.4.1 → 0.4.2 → 0.4.3，每个修一层 bug
- **接受外部 PR vs 自己写**：Mateus 的 #5 比我自己写得好（DRY + helper + test），证明**OSS scaffolding 不是装的**
- **maintainer 自己 ship 不走 PR 流程**：critical bug + 自己写的 fix + 305 tests 全绿 → 直接 ff merge 到 main，不浪费 PR 摩擦时间
- **commit `references #N` vs `closes #N`**：前者保留 issue open 等用户验证，后者自动关。critical bug 用 `references` 更安全
- **每个 patch 配 GitHub Release page**：把 14 小时叙事写下来，三版本对照表让外人 1 分钟理解发生了啥

### 2026-04-29 第二个外部 PR + multi-channel 觉醒
- **第二个外部 PR 来了**（Mateus #11, PowerShell statusline 1500 行）+ **bug reporter 升级为 contributor**（Lwhieldon #12 重画金毛 + pet_pet inline）
- **24 小时内 5 个 patch 版本**（0.4.0 → 0.4.4）—— 但**npm publish 0.4.4 时撞上 npm registry 30+ min outage**，整个 ship 流被卡
- **悟到 npm 是单点故障**：MCP 服务器其实可以走多条原生渠道（Claude Code Plugin、MCP Server Registry），不应该绑死 npm
- **决策方向**：dist/ 入 git 换取 multi-channel 干净体验。1.1MB git 增长 vs 任意一条渠道挂了不影响其他用户。详见 G0
- **packaging bug 是隐性 critical**：Issue #8 整个 launch 周期都在 silent fallback——README 上「638 反应」的承诺对所有 npx 用户都没兑现。0.4.4 才真正修好

### 2026-04-29 G0 multi-channel 落地（v0.4.5）
- **第 6 个 patch 版本同一天 ship**（0.4.0 → 0.4.5）—— 这次是把架构升级 ship 出去，不是补 bug
- **G0 核心 4/4 done**：plugin manifest 切 `node + dist/server.js` / dist/ 入 git / pre-commit hook / manifest 测试 pin
- **doctor.ts Windows 探测一并修了**——之前 7 个 tryExec 全 `(failed)`，现在用 cmd.exe + PowerShell + WT_SESSION
- **架构验证靠 test 而不是评论**：`cli/plugin-manifest.test.ts` 永久 pin 住 manifest 必须 `node + dist/server.js`，未来谁不小心改回 bun 立刻挂 CI
- **`prepare` script 自动分发 hook 给 contributor**——不需要 husky，git config 一行搞定
- **下一步真验证**：自己 Win11 + Lwhieldon Win11 都装一遍 0.4.5，看 statusline / hooks / pet_pet 全套是否真 work；`claude plugin install github:nanami-he/petsonality` 是否真能用

---

*PRD v3.10 — 2026-04-29 G0 multi-channel 架构落地（6 patch 版本同一天 ship 史）*
