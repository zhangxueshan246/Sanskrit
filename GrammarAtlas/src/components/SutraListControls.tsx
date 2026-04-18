import { useState, useMemo } from 'react';
import { searchSutras, getAllSutras } from '../utils/searchSutras';
import { sortByIdNatural, sortBySource, type SortMode } from '../utils/sortSutras';
import { formatSutraId } from '../utils/formatSutraId';
import type { Sutra } from '../data/sutras';

interface Props {
  initialSutras: Sutra[];
}

type GroupedSutras = {
  source: string;
  items: Sutra[];
}[];

export default function SutraListControls({ initialSutras }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('by-source');

  // 计算搜索和排序结果
  const results = useMemo(() => {
    let sutras = searchQuery.trim() ? searchSutras(searchQuery) : initialSutras;

    if (sortMode === 'id-natural') {
      // ID自然排序，不分组
      return {
        isSearching: !!searchQuery.trim(),
        grouped: null,
        flat: sortByIdNatural(sutras)
      };
    } else {
      // 按source分组
      const grouped = sortBySource(sutras);
      return {
        isSearching: !!searchQuery.trim(),
        grouped,
        flat: null
      };
    }
  }, [searchQuery, sortMode, initialSutras]);

  const totalCount = results.flat ? results.flat.length : (results.grouped?.reduce((sum, g) => sum + g.items.length, 0) ?? 0);

  return (
    <div className="sutra-list-container">
      {/* 搜索和排序控制区 - 统一样式 */}
      <div className="sutra-list-controls">
        <div className="search-group">
          <label htmlFor="sutra-search-input" className="search-label">
            🔍 搜索
          </label>
          <input
            id="sutra-search-input"
            type="text"
            className="search-input"
            placeholder="输入经文ID、原文或翻译..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
              title="清空搜索"
            >
              ✕
            </button>
          )}
        </div>

        <div className="sort-group">
          <select
            className="sort-dropdown"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="by-source">按来源分组</option>
            <option value="id-natural">按经文顺序</option>
          </select>
          {totalCount > 0 && (
            <span className="result-count">
              共 {totalCount} 条
            </span>
          )}
        </div>
      </div>

      {/* 经文列表 */}
      {results.flat ? (
        // 非分组显示（ID自然排序或搜索结果）
        <div className="sutra-list">
          {results.flat.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
              未找到匹配的经文
            </div>
          ) : (
            results.flat.map(sutra => (
              <a
                key={sutra.id}
                href={`/Sanskrit/sutra/${sutra.id}`}
                className="sutra-card"
              >
                <h3>{formatSutraId(sutra.id)}</h3>
                <p>{sutra.text}</p>
                {sutra.translation && (
                  <small style={{ color: '#64748b' }}>{sutra.translation}</small>
                )}
              </a>
            ))
          )}
        </div>
      ) : (
        // 分组显示
        <>
          {results.grouped && results.grouped.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
              未找到匹配的经文
            </div>
          ) : (
            results.grouped?.map(group => (
              <div key={group.source}>
                <h2 style={{ marginTop: group === results.grouped![0] ? 0 : '3rem' }}>
                  {getSourceLabel(group.source)}
                </h2>
                <div className="sutra-list">
                  {group.items.map(sutra => (
                    <a
                      key={sutra.id}
                      href={`/Sanskrit/sutra/${sutra.id}`}
                      className="sutra-card"
                    >
                      <h3>{formatSutraId(sutra.id)}</h3>
                      <p>{sutra.text}</p>
                      {sutra.translation && (
                        <small style={{ color: '#64748b' }}>
                          {sutra.translation}
                        </small>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    panini: 'Pāṇini Aṣṭādhyāyī',
    katantra: 'Kātantra',
    jkv: 'Kāśikāvṛṭti',
    dssk: '段晴《波你尼语法入门》'
  };
  return labels[source] || source;
}
