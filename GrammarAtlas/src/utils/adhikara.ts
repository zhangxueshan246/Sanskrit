import type { Sutra } from '../types/sutra';

/**
 * 把 "6.3.24" 或 "pan_6.3.24" 解析成 [6, 3, 24]；格式不对返回 null
 */
export function parseSutraNumber(value: string): number[] | null {
  const numeric = value.includes('_') ? value.split('_').slice(1).join('_') : value;
  if (!/^\d+(\.\d+)*$/.test(numeric)) return null;
  return numeric.split('.').map(Number);
}

export function compareNumbers(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

interface ScopedAdhikara {
  id: string;
  prefix: string;
  from: number[];
  to: number[];
}

function collectScoped(sutras: Sutra[]): ScopedAdhikara[] {
  const scoped: ScopedAdhikara[] = [];
  for (const sutra of sutras) {
    if (!sutra.scope) continue;
    const from = parseSutraNumber(sutra.scope.from);
    const to = parseSutraNumber(sutra.scope.to);
    if (!from || !to) continue;
    scoped.push({ id: sutra.id, prefix: sutra.id.split('_')[0], from, to });
  }
  return scoped;
}

/**
 * 按 scope 区间计算每条经文的直接领句，并入 adhikaras（与手写项去重）。
 * 直接父 = 起点最大的包含区间（并列取区间最窄）；更上层的领句沿直接父逐层得到。
 * 若手写的父级已经能（沿其自身的领句链）推出该直接父，就不再重复添加，避免冗余边。
 * 返回新数组，不修改入参。
 */
export function applyScopes(sutras: Sutra[]): Sutra[] {
  const scoped = collectScoped(sutras);
  if (scoped.length === 0) return sutras;

  const computedParent = new Map<string, string>();
  for (const sutra of sutras) {
    const num = parseSutraNumber(sutra.id);
    if (!num) continue;
    const prefix = sutra.id.split('_')[0];

    let parent: ScopedAdhikara | null = null;
    for (const cand of scoped) {
      if (cand.prefix !== prefix || cand.id === sutra.id) continue;
      if (compareNumbers(num, cand.from) < 0 || compareNumbers(num, cand.to) > 0) continue;
      if (
        !parent ||
        compareNumbers(cand.from, parent.from) > 0 ||
        (compareNumbers(cand.from, parent.from) === 0 && compareNumbers(cand.to, parent.to) < 0)
      ) {
        parent = cand;
      }
    }
    if (parent) computedParent.set(sutra.id, parent.id);
  }

  const byId = new Map(sutras.map(s => [s.id, s]));
  const ancestorsOf = (id: string, seen = new Set<string>()): Set<string> => {
    const parents = [...(byId.get(id)?.adhikaras ?? [])];
    const computed = computedParent.get(id);
    if (computed) parents.push(computed);
    for (const p of parents) {
      if (!seen.has(p)) {
        seen.add(p);
        ancestorsOf(p, seen);
      }
    }
    return seen;
  };

  return sutras.map(sutra => {
    const parent = computedParent.get(sutra.id);
    if (!parent) return sutra;
    const explicit = sutra.adhikaras ?? [];
    if (explicit.includes(parent) || explicit.some(e => ancestorsOf(e).has(parent))) return sutra;
    return { ...sutra, adhikaras: [...explicit, parent], computedAdhikara: parent };
  });
}

/**
 * 每条带 scope 的领句对应一个范围组：成员 = 同前缀、编号落在区间内的经文（含领句自身）。
 * 嵌套的区间各自成组，用于主图画范围包络。成员不足 2 条的不返回。
 */
export function getScopeGroups(sutras: Sutra[]): { id: string; scope: { from: string; to: string }; members: string[] }[] {
  const groups: { id: string; scope: { from: string; to: string }; members: string[] }[] = [];
  for (const sc of collectScoped(sutras)) {
    const members = sutras
      .filter(s => {
        if (s.id.split('_')[0] !== sc.prefix) return false;
        const num = parseSutraNumber(s.id);
        return !!num && compareNumbers(num, sc.from) >= 0 && compareNumbers(num, sc.to) <= 0;
      })
      .map(s => s.id);
    if (members.length > 1) {
      const src = sutras.find(s => s.id === sc.id)!;
      groups.push({ id: sc.id, scope: src.scope!, members });
    }
  }
  return groups;
}
