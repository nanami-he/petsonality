export interface ReplacementPreview {
  existing: unknown;
  next: unknown;
}

export function isPetsonalityCommand(command: unknown): boolean {
  return typeof command === "string" && (command.includes("petsonality") || command.includes("typet"));
}

export function statusLineReplacementPreview(existing: unknown, next: unknown): ReplacementPreview | null {
  if (!existing || typeof existing !== "object") return null;
  const command = (existing as { command?: unknown }).command;
  if (!command || isPetsonalityCommand(command)) return null;
  return { existing, next };
}

export function findPetsonalityHookEntries(entries: unknown): unknown[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry) =>
    Array.isArray((entry as { hooks?: unknown }).hooks)
    && ((entry as { hooks: Array<{ command?: unknown }> }).hooks).some((hook) => isPetsonalityCommand(hook.command)),
  );
}

export function formatReplacementPreview(title: string, preview: ReplacementPreview): string {
  return [
    title,
    "Current:",
    JSON.stringify(preview.existing, null, 2),
    "Petsonality will write:",
    JSON.stringify(preview.next, null, 2),
  ].join("\n");
}
