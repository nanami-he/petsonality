type ReactionPool = Record<string, Record<string, string[]>>;
type SourceReactionPool = Record<string, string[]>;
type SourceAnimalReactionPool = Partial<Record<string, Partial<Record<string, string[]>>>>;

export function collectReactionLines(
  generalPool: SourceReactionPool,
  animalPool: SourceAnimalReactionPool,
  animal: string,
  reason: string,
): string[] {
  return [...new Set([...(generalPool[reason] ?? []), ...(animalPool[animal]?.[reason] ?? [])])].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function sortReactionPool(pool: ReactionPool): ReactionPool {
  const sortedPool: ReactionPool = {};

  for (const animal of Object.keys(pool).sort()) {
    sortedPool[animal] = {};
    for (const reason of Object.keys(pool[animal]).sort()) {
      sortedPool[animal][reason] = [...pool[animal][reason]].sort((a, b) => a.localeCompare(b));
    }
  }

  return sortedPool;
}

export function sortReactionMeta<T>(meta: Record<string, T>): Record<string, T> {
  const sortedMeta: Record<string, T> = {};
  for (const animal of Object.keys(meta).sort()) {
    sortedMeta[animal] = meta[animal];
  }
  return sortedMeta;
}
