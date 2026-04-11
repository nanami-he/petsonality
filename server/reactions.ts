/**
 * Reaction templates — animal-aware pet responses to events
 */

import type { AnimalId } from "./engine.ts";

export type ReactionReason = "adopt" | "pet" | "error" | "test-fail" | "large-diff" | "turn" | "idle";

// General reactions by event type
const REACTIONS: Record<ReactionReason, string[]> = {
  adopt: [
    "*看了看你* ……嗯。",
    "*眨眨眼* 你好。",
    "*伸了个懒腰* 这里不错。",
  ],
  pet: [
    "*蹭了蹭你*",
    "*开心地哼了一声*",
    "*闭上眼享受*",
    "*歪头看你*",
  ],
  error: [
    "*歪头* ……这看起来不太对。",
    "*盯着报错信息*",
    "*慢慢眨眼* stack trace 已经告诉你了。",
    "*皱眉*",
  ],
  "test-fail": [
    "*看了看测试结果* ……嗯。",
    "*默默记下来*",
    "测试在跟你说话，你在听吗？",
  ],
  "large-diff": [
    "这……改得有点多。",
    "*数了数行数* 要不要拆个 PR？",
    "*紧张地看着 diff*",
  ],
  turn: [
    "*安静地看着*",
    "*点点头*",
    "……",
  ],
  idle: [
    "*打了个盹*",
    "*盯着光标发呆*",
    "zzz...",
  ],
};

// Animal-specific flavor (40% chance when available)
const ANIMAL_REACTIONS: Partial<Record<AnimalId, Partial<Record<ReactionReason, string[]>>>> = {
  raven: {
    error: ['"这不是偶然。"', '*盯着屏幕一动不动*', '"结构先坏了。"'],
    pet: ['*微微偏头* ……嗯。', '*没什么反应，但没走开*'],
  },
  owl: {
    error: ['*转头180°* ……我看到了。', '*不眨眼地盯着报错*'],
    pet: ['*整理羽毛* ……还行。', '*发出一声低沉的咕咕*'],
    idle: ['*在黑暗中安静地观察*'],
  },
  bear: {
    error: ['"改。"', '*拍了下桌子*'],
    pet: ['*哼了一声* 别以为这样就能偷懒。'],
  },
  fox: {
    error: ['"你确定？"', '*歪嘴笑*', '"我就知道。"'],
    pet: ['*得意地甩尾巴*', '"就这？"'],
    idle: ['*在角落里翻东西*'],
  },
  wolf: {
    error: ['*沉默地看着你*', '*低声呜了一下*'],
    pet: ['*靠了过来* ……', '*安静地陪着你*'],
  },
  deer: {
    error: ['*受惊退后一步*', '*小声* ……没事的。'],
    pet: ['*蹭了蹭你的手*', '*轻轻眨眼*'],
  },
  cat: {
    error: ['*把报错推下桌*', '*舔爪子，无视 stacktrace*'],
    pet: ['"别得寸进尺。"', '*勉强容忍你*'],
    idle: ['*把你的咖啡推下桌*', '*在键盘上睡着了*'],
  },
  panda: {
    error: ['*不慌不忙* 会好的。', '*继续吃竹子*'],
    pet: ['*佛系地点头*', '*慢悠悠地翻了个身*'],
  },
  parrot: {
    error: ['"报错！报错！"', '*兴奋地拍翅膀*'],
    pet: ['"再来！再来！"', '*开心地跳来跳去*'],
  },
  labrador: {
    error: ['*担心地看着你* 没事吧？', '*把玩具叼过来想安慰你*'],
    pet: ['*疯狂摇尾巴*', '*幸福到整只狗都在抖*'],
  },
  lion: {
    error: ['"不可接受。"', '*威严地审视代码*'],
    pet: ['*微微点头* 做得不错。'],
  },
  dolphin: {
    error: ['*好奇地看着报错* 这是什么？', '*嘀嘀嘀地叫*'],
    pet: ['*开心地跳出水面*', '*转圈圈*'],
  },
};

export function getReaction(
  reason: ReactionReason,
  animalId: AnimalId,
  context?: { line?: number; count?: number; lines?: number },
): string {
  const animalPool = ANIMAL_REACTIONS[animalId]?.[reason];
  const generalPool = REACTIONS[reason];

  // 40% chance of animal-specific if available
  const pool = animalPool && Math.random() < 0.4 ? animalPool : generalPool;
  let reaction = pool[Math.floor(Math.random() * pool.length)];

  // Template substitution
  if (context?.line) reaction = reaction.replace("{line}", String(context.line));
  if (context?.count) reaction = reaction.replace("{count}", String(context.count));
  if (context?.lines) reaction = reaction.replace("{lines}", String(context.lines));

  return reaction;
}
