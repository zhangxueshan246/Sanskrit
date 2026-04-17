/**
 * 验证经文数据中的引用一致性
 * 严格模式检查：
 * 1. notes 中的所有 [[id]] 必须在 references 中，或在任何层级的 adhikaras 中
 * 2. references 中的所有 id 必须是存在的经文
 * 3. references 中的所有 id 必须在 notes 中被提及（无孤立引用）
 *
 * 说明：adhikaras 支持层级关系。如果 A 的 adhikara 是 B，B 的 adhikara 是 C，
 * 那么 A 可以在 notes 中引用 B 或 C，都不会报错。
 */

import { sutras, type Sutra } from '../data/sutras';

interface ValidationResult {
  sutraId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 从文本中提取所有 [[id]] 格式的链接
 */
function extractWikiLinks(text: string | undefined): string[] {
  if (!text) return [];

  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    links.push(match[1]);
  }

  return links;
}

/**
 * 递归获取某条 sutra 的所有 adhikaras（包括直接和间接的）
 * 处理层级关系：如果 A 的 adhikara 是 B，B 的 adhikara 是 C，
 * 那么 A 可以引用 B 和 C，都不算孤立引用
 */
function getAllAdhikaras(sutraId: string, visited = new Set<string>()): string[] {
  // 防止循环引用
  if (visited.has(sutraId)) return [];
  visited.add(sutraId);

  const sutra = sutras[sutraId];
  if (!sutra || !sutra.adhikaras || sutra.adhikaras.length === 0) {
    return [];
  }

  const allAdhikaras: string[] = [...sutra.adhikaras];

  // 递归获取每个 adhikara 的 adhikaras
  for (const adhikaraId of sutra.adhikaras) {
    const ancestorAdhikaras = getAllAdhikaras(adhikaraId, visited);
    allAdhikaras.push(...ancestorAdhikaras);
  }

  return allAdhikaras;
}

/**
 * 验证单个经文的引用一致性
 */
function validateSutra(sutra: Sutra): ValidationResult {
  const result: ValidationResult = {
    sutraId: sutra.id,
    isValid: true,
    errors: [],
    warnings: []
  };

  // 提取 notes 中的所有链接
  const linksInNotes = extractWikiLinks(sutra.notes);
  const referencesArray = sutra.references || [];
  const existingSutraIds = Object.keys(sutras);
  const allAdhikaras = getAllAdhikaras(sutra.id);

  // 检查 1：notes 中的所有链接是否都在 references 或任何层级的 adhikaras 中
  for (const link of linksInNotes) {
    if (!referencesArray.includes(link) && !allAdhikaras.includes(link)) {
      result.errors.push(`notes 中包含 [[${link}]] 但不在 references 或 adhikaras 中`);
      result.isValid = false;
    }
  }

  // 检查 2：references 中的所有 id 是否存在
  for (const refId of referencesArray) {
    if (!existingSutraIds.includes(refId)) {
      result.errors.push(`references 包含不存在的经文 [[${refId}]]`);
      result.isValid = false;
    }
  }

  // 检查 3：references 中的所有 id 是否都在 notes 中出现（严格模式）
  for (const refId of referencesArray) {
    if (!linksInNotes.includes(refId)) {
      result.errors.push(`references 中的 [[${refId}]] 没有在 notes 中提及（孤立引用）`);
      result.isValid = false;
    }
  }

  return result;
}

/**
 * 验证所有经文
 */
function validateAllSutras(): void {
  console.log('🔍 开始验证经文引用...\n');

  const allResults: ValidationResult[] = [];
  let totalValid = 0;
  let totalInvalid = 0;

  for (const sutra of Object.values(sutras)) {
    const result = validateSutra(sutra);
    allResults.push(result);

    if (result.isValid) {
      totalValid++;
      console.log(`✓ ${sutra.id}: 引用有效`);
    } else {
      totalInvalid++;
      console.log(`✗ ${sutra.id}:`);
      for (const error of result.errors) {
        console.log(`  • ${error}`);
      }
      for (const warning of result.warnings) {
        console.log(`  ⚠ ${warning}`);
      }
    }
  }

  console.log(`\n📊 验证结果摘要：`);
  console.log(`  ✓ 有效: ${totalValid} 个经文`);
  console.log(`  ✗ 无效: ${totalInvalid} 个经文`);
  console.log(`  总计: ${totalValid + totalInvalid} 个经文\n`);

  if (totalInvalid > 0) {
    process.exit(1);
  } else {
    console.log('✅ 所有经文引用检查通过！\n');
    process.exit(0);
  }
}

// 运行验证
validateAllSutras();
