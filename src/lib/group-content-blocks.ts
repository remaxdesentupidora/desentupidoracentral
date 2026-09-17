export type GroupedContent<T extends { type: string; layout?: string }> =
  | { kind: 'text-group'; blocks: T[]; startIndex: number }
  | { kind: 'block'; block: T; index: number };

function isSimpleText(block: { type: string; layout?: string }): boolean {
  return block.type === 'text' && block.layout !== 'centered';
}

export function groupContentBlocks<T extends { type: string; layout?: string }>(
  blocks: T[],
): GroupedContent<T>[] {
  const grouped: GroupedContent<T>[] = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];

    if (isSimpleText(block)) {
      const startIndex = index;
      const group: T[] = [];

      while (index < blocks.length && isSimpleText(blocks[index])) {
        group.push(blocks[index]);
        index += 1;
      }

      grouped.push({ kind: 'text-group', blocks: group, startIndex });
      continue;
    }

    grouped.push({ kind: 'block', block, index });
    index += 1;
  }

  return grouped;
}
