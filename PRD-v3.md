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

## 当前优先 — 系统优化 + 维护 + PR 推进

### M1: npx 安装体验完善
- [ ] build:reactions 在 npx 环境下失败（scripts/ 不在包里）— 改为安装时从 dist 内部构建或预打包 pool
- [ ] OpenClaw 安装全链路验证（纯 OpenClaw 环境跑通）
- [ ] 安装后自动验证（doctor 检查一遍）

### M2: OpenClaw PR #65886 推进
- [ ] 在 PR 上 ping 维护者（礼貌催一下）
- [ ] 检查是否有新的 CI 要求或代码规范变更
- [ ] 准备好 rebase（如果 main 有新提交）
- [ ] PR 合并后：installer 自动切 native config，停用 patch

### M3: 说话系统验证
- [ ] 真实使用 2-3 天，观察说话频率是否合适
- [ ] hint 架构的 fallback 是否正常工作
- [ ] 英文环境验证（LANG=en 时反应是否自然）
- [ ] cooldown 参数是否需要微调

### M4: 发版流程规范化
- [ ] 写一个 `scripts/release.sh`：build → test → version bump → publish
- [ ] npm publish 的 OTP 自动化（或改用 automation token）
- [ ] CHANGELOG.md 自动生成

### M5: 测试补全
- [ ] 集成测试：模拟完整安装 → 领养 → hook 触发 → reaction 显示
- [ ] hint 架构的单元测试（写 hint → 消费 → fallback）
- [ ] 英文 pets-en.ts 的性格验证测试（和中文版同结构）

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
