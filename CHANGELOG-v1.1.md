# Petsonality v1.1 — Phase 1 宠物形象 + Bug 修复

## Bug 修复

### 1. 气泡 saveReaction 缺 wrapped 字段
- **问题**: MCP server 的 `saveReaction()` 只写 `{reaction, timestamp, reason}`，缺少 `wrapped/widths/maxWidth` 字段。statusline 读取时走 fallback 把全文塞一行，CJK 长句超过行字节限制被截断，只能看到第一行开头。
- **修复**: 在 `server/state.ts` 的 `saveReaction()` 中加入 CJK-aware 换行逻辑（移植自 `hooks/wrap.py`），写入 `wrapped[]`、`widths[]`、`maxWidth`。
- **文件**: `server/state.ts`

### 2. 气泡边框 italic 导致 `|` 变成 `/`
- **问题**: 气泡文本行整行用 `$DIM`（`\033[3m` italic）渲染，包括边框 `|`。终端 italic 模式下 `|` 被斜体化显示为 `/`，看起来像灰色斜杠。
- **修复**: 拆分渲染 — 边框 `|` 用 `$BC`（宠物颜色，非 italic），文字内容用 `$DIM`（italic）。
- **文件**: `statusline/pet-status.sh`

### 3. 海豚无框气泡统一为有框蓝色气泡
- **问题**: 海豚之前用无框气泡（省字节），实际不需要。
- **修复**: 删除海豚气泡特殊逻辑，所有动物统一用有框气泡。海豚的 `$BC` 已设为蓝色，边框自动变蓝。简化了代码。
- **文件**: `statusline/pet-status.sh`

### 4. 动画帧率误算（refreshInterval=1 ≈ 10fps，非 1fps）
- **问题**: 所有动作持续时间 `ACT_LEFT` 和触发概率 `ROLL` 按 1fps 设计，但 Claude Code statusline 实际以 ~10fps 刷新。导致：
  - 动作只持续 0.1-0.3 秒（设计为 1-3 秒），肉眼看不到
  - MOVE 触发频率过高（设计 7%/秒 实际 50%/秒），动物不停做动作
  - 眨眼只持续 1 tick（0.1 秒），完全不可见
- **修复**:
  - `ROLL` 从 `RANDOM % 100` 改为 `RANDOM % 1000`（千分比）
  - 所有 `ACT_LEFT` 值 ×10
  - 交替动画 `ACT_STEP % 2` → `(ACT_STEP / 5) % 2`（每帧保持 ~0.5 秒）
  - 海豚 idle 动作阈值 ×10 并修复 elif 顺序 bug
  - idle 微动画概率从 `% 100` → `% 1000`
  - 新增眨眼持续机制（`.blink` 文件，持续 5 ticks ≈ 0.5 秒）
- **文件**: `statusline/pet-status.sh`

### 5. 海豚动作 elif 顺序错误
- **问题**: 修改阈值后，swim cycle (`< 4`) 和 blink (`< 5`) 在 spout (`< 20`) 之后，永远不会被执行。
- **修复**: 调整阈值为递增顺序：splash `< 10`、spout `< 20`、swim `< 40`、blink `< 50`。
- **文件**: `statusline/pet-status.sh`

### 6. 眨眼不替换新设计的眼睛字符
- **问题**: 眨眼逻辑只替换 `o` 和 `@`，但新设计的宠物使用 `•`（金毛/大象）、`·`（河狸）、`◉`（狮子）等字符，导致眨眼时视觉无变化。
- **修复**: 在 blink 替换中增加 `•`、`·`、`◉` → `-` 的替换。
- **文件**: `statusline/pet-status.sh`

### 7. 熊猫颜色太暗（黑色不可见）
- **问题**: 熊猫颜色 `(50,50,50)` 在暗色终端上几乎看不见。
- **修复**: 改为暖白 `(220,220,215)`，符合熊猫白色身体。
- **文件**: `statusline/pet-status.sh`

### 8. 大象 listen/nod 帧超 12 字符
- **问题**: listen 帧 L2 = 13 字符，nod 帧 L2 = 13 字符，超出 12 字符限制导致 statusline 截断为单行。
- **修复**: listen 改为顶部耳朵展开（L1 变化），L2 保持 12 字符。nod 不移头，只换眼睛。
- **文件**: `statusline/pet-status.sh`

## 气泡改进

- 气泡最大行数从 3 → 4（利用原来空闲的名字行空间）
- 修改位置：`server/state.ts`、`hooks/react.sh`、`hooks/pet-comment.sh`

## 宠物形象新设计（6 只）

| 宠物 | MBTI | 新设计特色 |
|------|------|-----------|
| 河狸 | ISTJ | `n____n` 圆耳 + `·` 眼 + 灰色 `TT` 门牙 + `\`----'` 圆底，4 动作（gnaw 啃木/slap 拍尾/inspect 检查/sigh 叹气） |
| 大象 | ISFJ | 朝左侧脸 + `•` 实心眼 + `\` → `_)` 鼻子落地，4 动作（stomp 踏步/trunk 卷鼻/listen 倾听/nod 点头） |
| 狮子 | ESTJ | `{*\|_W_\|*}` 鬃毛王冠 + `◉` 靶心眼 + `= ^ =` 胡须鼻 + `* *~~* *` 下巴鬃毛，4 动作（roar 吼/shake 甩鬃/glare 瞪/yawn 哈欠） |
| 金毛 | ESFJ | `_/~\~~` 飘逸毛 + `•` 眼 + 粉色 `U` 舌头 + 尾巴 `~`，4 动作（wag 摇尾/jump 蹦/lick 舔/spin 转圈） |
| 猫 | ISTP | `/\_/\` 经典猫耳 + `•.•` 冷淡眼 + `(_____)~` 猫面包蜷缩，3 动作（stare 凝视/lick 舔爪/stretch 伸懒腰） |
| 熊猫 | ISFP | `n __ n` 紫色圆耳 + 紫色 `@` 黑眼圈 + `ww` 鼻 + `( -- -- )` 手 + 上窄下宽胖体型，4 动作（eat 吃绿竹子/roll 翻滚/stare 发呆/frown 皱眉） |

## 剩余

- 猎豹 ESTP、鹦鹉 ESFP 待设计
