/**
 * 验证经文数据中的引用一致性
 * 严格模式检查：
 * 1. text、translation、vrtti、notes 中的所有 [[id]] 必须在 references、parallel、adhikaras 或 sequence 中至少出现一次
 * 2. references 中的所有 id 必须是存在的经文
 * 3. references 中的所有 id 必须在文本字段中被提及（无孤立引用）
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Sutra } from '../types/sutra';

interface ValidationResult {
  sutraId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 从 JSON 文件夹递归加载所有经文
 */
async function loadAllSutras(): Promise<Sutra[]> {
  // 获取项目根目录
  const scriptDir = new URL('.', import.meta.url);
  let sutraDir = scriptDir.pathname;

  // 处理 Windows 路径前缀
  if (sutraDir.startsWith('/')) {
    sutraDir = sutraDir.substring(1);
  }

  sutraDir = path.join(sutraDir, '..', 'content', 'sutras');
  const sutras: Sutra[] = [];

  console.log(`📂 Looking for sutras in: ${sutraDir}`);

  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) {
      console.error(`❌ Directory not found: ${dir}`);
      return;
    }
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        walkDir(fullPath);
      } else if (file.name.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const sutra = JSON.parse(content) as Sutra;
        sutras.push(sutra);
      }
    }
  }

  walkDir(sutraDir);
  return sutras;
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
 */
function getAllAdhikaras(
  sutraId: string,
  sutrasMap: Map<string, Sutra>,
  visited = new Set<string>()
): string[] {
  if (visited.has(sutraId)) return [];
  visited.add(sutraId);

  const sutra = sutrasMap.get(sutraId);
  if (!sutra || !sutra.adhikaras || sutra.adhikaras.length === 0) {
    return [];
  }

  const allAdhikaras: string[] = [...sutra.adhikaras];

  for (const adhikaraId of sutra.adhikaras) {
    const ancestorAdhikaras = getAllAdhikaras(adhikaraId, sutrasMap, visited);
    allAdhikaras.push(...ancestorAdhikaras);
  }

  return allAdhikaras;
}

/**
 * 获取 jkv 对应的 pan 经文 id
 * jkv 是 pan 的注释，相同编号的 pan 相当于 jkv 的 adhikara
 * 例如: jkv_1.1.1 -> pan_1.1.1
 */
function getCorrespondingPanId(jkvId: string): string | null {
  if (!jkvId.startsWith('jkv_')) return null;
  return jkvId.replace(/^jkv_/, 'pan_');
}

/**
 * 验证单个经文的引用一致性
 */
function validateSutra(sutra: Sutra, sutrasMap: Map<string, Sutra>): ValidationResult {
  const result: ValidationResult = {
    sutraId: sutra.id,
    isValid: true,
    errors: [],
    warnings: []
  };

  const linksInText = extractWikiLinks(sutra.text);
  const linksInTranslation = extractWikiLinks(sutra.translation);
  const linksInVrtti = extractWikiLinks(sutra.vrtti);
  const linksInNotes = extractWikiLinks(sutra.notes);

  const allLinksInContent = new Set([
    ...linksInText,
    ...linksInTranslation,
    ...linksInVrtti,
    ...linksInNotes
  ]);

  const referencesArray = sutra.references || [];
  const existingSutraIds = Array.from(sutrasMap.keys());
  const allAdhikaras = getAllAdhikaras(sutra.id, sutrasMap);

  const allowedIds = new Set([
    ...referencesArray,
    ...allAdhikaras,
    ...(sutra.parallel || []),
    ...(sutra.sequence || [])
  ]);

  // Pre-compute all adhikaras of parallel sutras — links mentioning a parallel sutra's
  // adhikara (e.g. in dssk notes referencing the governing pan rule) are valid
  const allParallelAdhikaras = new Set<string>();
  for (const parId of (sutra.parallel || [])) {
    for (const adhId of getAllAdhikaras(parId, sutrasMap)) {
      allParallelAdhikaras.add(adhId);
    }
  }

  for (const link of allLinksInContent) {
    if (!allowedIds.has(link)) {
      // 规则1: 检查 jkv 对应的 pan 是否在 allowedIds 中
      const correspondingPan = getCorrespondingPanId(link);
      if (correspondingPan && allowedIds.has(correspondingPan)) {
        continue;
      }

      // 规则2: 检查被引用经文的 parallel 是否有任何一个在 allowedIds 中
      // 如果引用了某经文的 parallel，就相当于引用了该经文本身
      const linkedSutra = sutrasMap.get(link);
      if (linkedSutra && linkedSutra.parallel && linkedSutra.parallel.length > 0) {
        const hasParallelInAllowed = linkedSutra.parallel.some(p => allowedIds.has(p));
        if (hasParallelInAllowed) {
          continue;
        }
      }

      // 规则3: 被链接的经文是当前经文某平行经文的领句（直接或间接）
      // 常见于 dssk 的 notes/vrtti 中提到与其平行的 pan 经文的领句
      if (allParallelAdhikaras.has(link)) {
        continue;
      }

      result.errors.push(`文本中包含 [[${link}]] 但不在 references、parallel、adhikaras 或 sequence 中`);
      result.isValid = false;
    }
  }

  for (const refId of referencesArray) {
    if (!existingSutraIds.includes(refId)) {
      result.errors.push(`references 包含不存在的经文 [[${refId}]]`);
      result.isValid = false;
    }
  }

  for (const parId of (sutra.parallel || [])) {
    if (!existingSutraIds.includes(parId)) {
      result.errors.push(`parallel 包含不存在的经文 [[${parId}]]`);
      result.isValid = false;
    }
  }

  for (const seqId of (sutra.sequence || [])) {
    if (!existingSutraIds.includes(seqId)) {
      result.errors.push(`sequence 包含不存在的经文 [[${seqId}]]`);
      result.isValid = false;
    }
  }

  for (const adhId of (sutra.adhikaras || [])) {
    if (!existingSutraIds.includes(adhId)) {
      result.errors.push(`adhikaras 包含不存在的经文 [[${adhId}]]`);
      result.isValid = false;
    }
  }

  for (const refId of referencesArray) {
    if (!allLinksInContent.has(refId)) {
      result.errors.push(`references 中的 [[${refId}]] 没有在文本任何字段中提及（孤立引用）`);
      result.isValid = false;
    }
  }

  const hasContent = !!(sutra.translation?.trim() || sutra.vrtti?.trim() || sutra.notes?.trim());
  if (!hasContent) {
    result.errors.push(`translation、vrtti、notes 三个字段均为空，经文内容未完成`);
    result.isValid = false;
  }

  const hasSequence = sutra.sequence && sutra.sequence.length > 0;
  if (!hasSequence) {
    result.warnings.push(`sequence 字段为空，建议补充`);
  }

  const hasDraft = sutra.draft && sutra.draft.trim().length > 0;
  if (hasDraft) {
    result.warnings.push(`draft 字段不为空，可能有内容未编辑完成`);
  }

  return result;
}

/**
 * 验证所有经文
 */
async function validateAllSutras(): Promise<void> {
  console.log('🔍 开始验证经文引用...\n');

  const sutras = await loadAllSutras();
  const sutrasMap = new Map(sutras.map(s => [s.id, s]));

  const allResults: ValidationResult[] = [];
  let totalValid = 0;
  let totalInvalid = 0;

  for (const sutra of sutras) {
    const result = validateSutra(sutra, sutrasMap);
    allResults.push(result);

    if (result.isValid) {
      totalValid++;
      if (result.warnings.length > 0) {
        console.log(`✓ ${sutra.id}: 引用有效`);
        for (const warning of result.warnings) {
          console.log(`  ⚠ ${warning}`);
        }
      } else {
        console.log(`✓ ${sutra.id}: 引用有效`);
      }
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

validateAllSutras();
