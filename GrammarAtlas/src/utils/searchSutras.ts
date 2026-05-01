import Fuse from 'fuse.js';
import type { Sutra } from '../types/sutra';

/**
 * 搜索经文
 * @param query 搜索词
 * @param sutras 经文数组
 * @returns 匹配的经文数组
 */
export function searchSutras(query: string, sutras: Sutra[]): Sutra[] {
  if (!query.trim()) {
    return sutras;
  }

  const fuse = new Fuse(sutras, {
    keys: [
      { name: 'id', weight: 0.8 },
      { name: 'text', weight: 0.6 },
      { name: 'translation', weight: 0.7 },
      { name: 'vrtti', weight: 0.5 },
      { name: 'notes', weight: 0.5 }
    ],
    threshold: 0.3,
    minMatchCharLength: 1,
    ignoreLocation: true,
  });

  const results = fuse.search(query);
  return results.map(result => result.item);
}
