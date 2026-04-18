import { type Sutra } from '../data/sutras';

/**
 * 从ID中提取数字部分，用于自然排序
 * 例如：pan_6.4.60 -> [6, 4, 60]
 */
function parseNumericId(id: string): number[] {
  const numericPart = id.split('_')[1];
  if (!numericPart) return [0];

  return numericPart.split('.').map(part => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
}

/**
 * 按ID自然排序（按章.节.经的数字顺序）
 */
export function sortByIdNatural(sutras: Sutra[]): Sutra[] {
  return [...sutras].sort((a, b) => {
    const aNumeric = parseNumericId(a.id);
    const bNumeric = parseNumericId(b.id);

    // 逐级比较数字
    for (let i = 0; i < Math.max(aNumeric.length, bNumeric.length); i++) {
      const aPart = aNumeric[i] ?? 0;
      const bPart = bNumeric[i] ?? 0;

      if (aPart !== bPart) {
        return aPart - bPart;
      }
    }

    // 数字相同，按prefix字母顺序
    const aPrefix = a.id.split('_')[0];
    const bPrefix = b.id.split('_')[0];
    return aPrefix.localeCompare(bPrefix);
  });
}

/**
 * 按来源分组，每组内按ID自然排序
 * 返回的是按source分组的分组结果
 */
export function sortBySource(sutras: Sutra[]): { source: string; items: Sutra[] }[] {
  const sourceOrder = ['panini', 'katantra', 'jkv', 'dssk', 'other'];
  const grouped = new Map<string, Sutra[]>();

  // 按source分组
  for (const sutra of sutras) {
    const source = sutra.source;
    if (!grouped.has(source)) {
      grouped.set(source, []);
    }
    grouped.get(source)!.push(sutra);
  }

  // 每组内部按ID自然排序
  for (const group of grouped.values()) {
    group.sort((a, b) => {
      const aNumeric = parseNumericId(a.id);
      const bNumeric = parseNumericId(b.id);

      for (let i = 0; i < Math.max(aNumeric.length, bNumeric.length); i++) {
        const aPart = aNumeric[i] ?? 0;
        const bPart = bNumeric[i] ?? 0;

        if (aPart !== bPart) {
          return aPart - bPart;
        }
      }

      return a.id.localeCompare(b.id);
    });
  }

  // 按source顺序返回
  return sourceOrder
    .filter(source => grouped.has(source))
    .map(source => ({
      source,
      items: grouped.get(source)!
    }));
}

/**
 * 排序类型定义
 */
export type SortMode = 'id-natural' | 'by-source';

/**
 * 通用排序函数
 */
export function sortSutras(sutras: Sutra[], mode: SortMode = 'by-source') {
  if (mode === 'id-natural') {
    return { mode, items: sortByIdNatural(sutras) };
  } else {
    return { mode, items: sortBySource(sutras) };
  }
}
