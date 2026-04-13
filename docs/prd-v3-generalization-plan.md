# Petsonality PRD v3 - 通用化实施规划

> 由参谋长（ChatGPT 5.4）于 2026-04-11 制定

## 一、目标定义

### 1. PRD 原始目标
`PRD-v3.md` 中 `### 2. 通用化` 包含 4 个目标：

1. hooks 抽象成可选模块（Claude Code / OpenClaw / 通用）
2. statusline 独立运行脚本
3. skills 按客户端格式适配
4. install CLI 自动检测客户端

### 2. 核心目标
把当前 **强绑定 Claude Code + typet 私有安装流程** 的实现，重构成一个 **多宿主适配架构**：

- **内核不变**：宠物状态、MCP server、宠物逻辑、art、voice、reaction
- **适配层拆开**：hooks / skills / 安装逻辑 / 宿主配置生成
- **安装方式通用**：根据宿主自动选择配置方案
- **兼容现有功能**：当前 Claude Code 用户不受破坏

---

## 二、现状评估

### 当前的主要耦合点

| # | 耦合点 | 说明 |
|---|--------|------|
| 1 | 安装器写死 Claude Code | `cli/install.ts` 直接操作 `~/.claude.json`、`~/.claude/settings.json` |
| 2 | hook 输入协议写死 | `pet-comment.sh` 假设 `.last_assistant_message`，`react.sh` 假设 `.tool_response` |
| 3 | skill 格式写死 | `skills/pet/SKILL.md` 是 Claude Code 专用格式 |
| 4 | 品牌/路径混杂 | 同时出现 `petsonality`、`typet`、`mbti-pet` |

---

## 三、设计原则

1. **内核稳定，适配层外移** — 不把客户端判断塞进 `server/index.ts`
2. **先统一"中间协议"，再做多客户端** — 先定义统一 reaction 事件格式、hook 输入抽象、安装描述模型
3. **先兼容 Claude Code，再扩 OpenClaw** — 当前主链在 Claude Code，OpenClaw 先做适配壳
4. **通用化 ≠ 最低公分母** — 抽出可变部分，保留宿主特有增强能力

---

## 四、目标架构

### 建议目录结构

```text
hooks/
  core/
    pet-comment-core.sh
    react-core.sh
    wrap.py
  claude-code/
    pet-comment.sh
    react.sh
  openclaw/
    pet-comment.sh
    react.sh

skills/
  claude-code/
    pet/SKILL.md
  openclaw/
    pet/SKILL.md

cli/
  installers/
    types.ts          # HostAdapter + InstallContext
    claude-code.ts
    openclaw.ts
    generic.ts
    detect.ts         # 客户端自动检测
```

### 核心抽象对象

**HostAdapter**
```ts
interface HostAdapter {
  id: 'claude-code' | 'openclaw' | 'generic';
  detect(): boolean;
  install(): Promise<void>;
  uninstall(): Promise<void>;
  doctor(): Promise<DiagnosticResult>;
  renderSkillAssets(): void;
  renderHookAssets(): void;
  supportsStatusline: boolean;
  supportsHooks: boolean;
  supportsSkillFile: boolean;
}
```

**NormalizedHookInput**
```ts
type NormalizedHookInput = {
  lastAssistantMessage?: string;
  toolResponse?: string;
  sessionId?: string;
  raw: unknown;
};
```

---

## 五、实施步骤

### Phase G：品牌与路径统一（P0，无依赖）
- 明确三层命名：产品名 Petsonality / CLI 包名 `petsonality` / 状态目录统一
- 兼容迁移：先读 `~/.petsonality`，不存在再读 `~/.mbti-pet`

### Phase A：宿主适配器抽象（P0，依赖 G）
- 定义 `HostAdapter` 接口
- 从 `cli/install.ts` 剥离宿主逻辑到 `cli/installers/claude-code.ts` 等
- `cli/install.ts` 只保留调度

### Phase F：安装器自动检测（P0，依赖 A）
- `cli/installers/detect.ts` 实现检测逻辑
- 优先级：显式参数 > 自动检测 > 冲突提示

### Phase B：Hook 输入协议归一化（P0，可与 A 并行）
- `hooks/lib/normalize-input` 统一字段映射
- 为 Claude Code 实现 mapper，OpenClaw 预留

### Phase C：Hook 核心/包装层拆分（P0，依赖 B）
- 共有逻辑移入 `hooks/core/`
- 宿主入口层只做：读取输入 → 归一化 → 调用 core

### Phase E：Skills 多客户端适配（P1，依赖 A）
- 提取 skill 语义核心，按宿主生成格式壳
- 短期保留 `skills/pet/SKILL.md` 作为 Claude 默认入口

### Phase D：Statusline 独立运行脚本化（P1，依赖 A）
- 明确输入契约（只读 status.json + reaction.json + 环境变量）
- sessionId 来源优先级：env > TMUX_PANE > fallback

---

## 六、依赖图

```text
品牌统一(G)
  ├─ 宿主抽象(A)
  │   ├─ 自动检测(F)
  │   ├─ skills适配(E)
  │   └─ statusline独立化(D)
  └─ hook归一化(B)
      └─ hook拆分(C)
```

---

## 七、兼容性策略

### 对现有 Claude Code 用户
- `typet install` 继续可用
- `/pet` 行为不变
- `<!-- pet: -->` 气泡链不断
- `statusline/pet-status.sh` 路径短期不变

### 对状态数据
- `pet.json`、`status.json`、`reaction.$SID.json` 短期不改坏
- 改目录/字段时提供迁移函数，兼容旧读取至少一个版本周期

---

## 八、建议交付顺序

| 周次 | 内容 |
|------|------|
| 第一周 | 品牌/路径统一、HostAdapter 类型、install.ts 重构、client detection |
| 第二周 | normalize 输入、core hook + claude-code wrapper、回归测试 |
| 第三周 | skills 多客户端目录、statusline 独立输入、OpenClaw adapter 初版 |
| 第四周 | 文档、安装/卸载/doctor 全量回归、smoke test |

---

## 九、测试清单

### 必测
1. Claude Code 安装成功
2. `/pet` 领养链路正常
3. `<!-- pet: -->` 能进 hook
4. `reaction.$SID.json` 正确写入
5. statusline 正确显示并消失
6. uninstall 能完整回滚
7. backup / restore 不因客户端适配而失效

### 新增适配测试
8. `--client claude-code` 安装路径正确
9. `--client openclaw` 安装路径正确
10. 自动检测遇到多客户端时行为正确
11. generic 模式至少不崩

---

## 十、结论

**推荐路线：Installer adapter 化 → Hook 归一化 → Skills 分客户端 → Statusline 独立化**

内核不动，适配层分离，先兼容 Claude Code 再扩展。
