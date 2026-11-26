import * as fs from 'fs';
import * as path from 'path';
import type { Sutra, GraphEdge } from '../types/sutra';
import { applyScopes } from './adhikara';

async function loadAllSutras(): Promise<Sutra[]> {
  try {
    const sutraDir = path.join(process.cwd(), 'src/content/sutras');
    const sutras: Sutra[] = [];

    if (!fs.existsSync(sutraDir)) {
      console.warn('[getSutras] sutras directory not found:', sutraDir);
      return [];
    }

    // Recursively read all JSON files
    function readDir(dir: string) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          readDir(fullPath);
        } else if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const sutra = JSON.parse(content) as Sutra;
            sutras.push(sutra);
          } catch (e) {
            console.error(`[getSutras] Error parsing ${fullPath}:`, e);
          }
        }
      }
    }

    readDir(sutraDir);

    // Sort by source order, then by ID
    const sourceOrder = { panini: 0, katantra: 1, dsv: 2, jkv: 3, dssk: 4, other: 5 };
    sutras.sort((a, b) => {
      if (a.source !== b.source) {
        return sourceOrder[a.source] - sourceOrder[b.source];
      }
      return a.id.localeCompare(b.id);
    });

    console.log('[getSutras] Loaded', sutras.length, 'sutras');
    return applyScopes(sutras);
  } catch (error) {
    console.error('[getSutras] Error:', error);
    return [];
  }
}

export async function getAllSutras(): Promise<Sutra[]> {
  return loadAllSutras();
}

export async function generateEdges(): Promise<GraphEdge[]> {
  const sutras = await getAllSutras();
  const sutraMap = new Map(sutras.map((s) => [s.id, s]));
  const edges: GraphEdge[] = [];
  const parallelPairs = new Set<string>(); // 用于去重 parallel 边

  for (const sutra of sutras) {
    // Reference edges
    if (sutra.references) {
      for (const ref of sutra.references) {
        if (sutraMap.has(ref)) {
          edges.push({ from: sutra.id, to: ref, type: 'reference' });
        }
      }
    }

    // Parallel edges (去重，确保每对只有一条边)
    if (sutra.parallel) {
      for (const par of sutra.parallel) {
        if (sutraMap.has(par)) {
          // 用字典序生成唯一 key，避免重复
          const pairKey = [sutra.id, par].sort().join('|');
          if (!parallelPairs.has(pairKey)) {
            parallelPairs.add(pairKey);
            edges.push({ from: sutra.id, to: par, type: 'parallel' });
          }
        }
      }
    }

    // Adhikara edges (governance relationships)
    if (sutra.adhikaras) {
      for (const adh of sutra.adhikaras) {
        // 区间算出的边（成员 → 领句、领句嵌套）不进主图，主图用范围包络表示；只画手写项
        if (adh === sutra.computedAdhikara) continue;
        if (sutraMap.has(adh)) {
          edges.push({ from: adh, to: sutra.id, type: 'adhikara' });
        }
      }
    }

    // Commentary edges: 注释 → 被注释的经文（只存在注释方，这里从注释方出发）
    if (sutra.commentaryOn) {
      for (const root of sutra.commentaryOn) {
        if (sutraMap.has(root)) {
          edges.push({ from: sutra.id, to: root, type: 'commentary' });
        }
      }
    }

    // Sequence edges (natural order)
    if (sutra.sequence) {
      for (const seq of sutra.sequence) {
        if (sutraMap.has(seq)) {
          edges.push({ from: sutra.id, to: seq, type: 'sequence' });
        }
      }
    }
  }

  return edges;
}
