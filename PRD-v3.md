# Petsonality PRD v3 — 路线图

> Your type, your pet.
> npm: petsonality@0.3.3 | GitHub: nanami-he/petsonality

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

---

## 当前优先 — 宣传 + 推广

### G1: 社区推广
- [ ] Reddit r/ClaudeAI 发帖（附 GIF + 安装命令）
- [ ] Hacker News Show HN 帖
- [ ] Twitter/X 发帖（短视频或 GIF + 一句话）
- [ ] Claude Code Discord / community 频道分享
- [ ] OpenClaw Discord 分享（关联 PR #65886）

### G2: 终端录屏
- [ ] 录制 30s 终端演示（领养→说话→动画→错误反应）
- [ ] 转成 GIF 或上传 YouTube/Twitter
- [ ] 嵌入 README 顶部替代静态描述

### G3: 产品页面
- [ ] GitHub repo description 更新（一句话 + 标签）
- [ ] npm 页面描述优化
- [ ] 考虑做一个简单 landing page？

---

## 维护（持续）

### M1: OpenClaw PR #65886
- [x] PR 描述重写 + ping 维护者（2026-04-14）
- [ ] 等维护者回复，按需 rebase
- [ ] 合并后 installer 切 native config

### M2: 体验微调
- [ ] 真实使用观察说话频率
- [ ] build:reactions 在 npx 环境的 fix
- [ ] 发版流程脚本化

---

## Phase 2 — 体验深化（后续）

### 成长系统
- 互动次数 → 等级/状态变化

### 帽子/换肤 DLC
- 帽子系统（第一行预留位）
- 稀有帽子通过互动解锁

### 多宠物切换
- 收集多只，/pet switch 切换 + 宠物图鉴

### vibe-pick
- 不知道 MBTI 的用户，问几个问题推测性格

---

## 维护检查流程

### 发版前
```bash
bun test                    # 302 tests
bun run build               # server + cli + art + reactions
bash -n statusline/pet-status.sh  # shell 语法
npm version patch           # 升版本
npm publish --access public # 发布
git push && git push --tags # 同步
```

### 教训
- art.ts/shell 双份维护导致覆盖 → art.ts 唯一真源
- OpenClaw patch 放错位置 → editor 下方
- 说话当风险控制 → 陪伴节奏
- 海豚 art 从未更新 → 同步 statusline 设计
- npx 临时目录路径不稳定 → 复制到 ~/.petsonality/
- installer 硬依赖 Claude Code → 检测宿主独立安装

---

## 决策记录

### 2026-04-13 五次国会 + 2026-04-14 内阁审查
- 品牌统一一刀切 / 多宿主三线并行 / 陪伴不是风险控制
- 开发用 bun，发布给 node / 反应池全覆盖 / 情感核心优先
- hint 架构：hook 只写事件，模型才说话 / 多语言零配置

---

*PRD v3.6 — 2026-04-14 系统优化规划*
