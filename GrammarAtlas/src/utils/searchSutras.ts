import Fuse from 'fuse.js';
import { sutras, type Sutra } from '../data/sutras';

// 创建Fuse索引实例
const sutraList = Object.values(sutras);
const fuse = new Fuse(sutraList, {
  keys: [
    { name: 'id', weight: 0.8 },           // ID权重最高
    { name: 'text', weight: 0.6 },         // 原文权重中等
    { name: 'translation', weight: 0.7 },  // 翻译权重中等偏高
    { name: 'vrtti', weight: 0.5 },        // 注释权重中等偏低
    { name: 'notes', weight: 0.5 }         // 笔记权重中等偏低
  ],
  threshold: 0.3,  // 模糊匹配阈值（0-1，越小越严格）
  minMatchCharLength: 1,  // 最少匹配字符数
  ignoreLocation: true,   // 忽略位置信息，允许任何位置匹配
});

/**
 * 搜索经文
 * @param query 搜索词
 * @returns 匹配的经文数组
 */
export function searchSutras(query: string): Sutra[] {
  if (!query.trim()) {
    return sutraList;
  }

  const results = fuse.search(query);
  return results.map(result => result.item);
}

/**
 * 获取所有经文
 */
export function getAllSutras(): Sutra[] {
  return sutraList;
}
