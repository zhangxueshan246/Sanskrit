import { useState, useMemo } from 'react';
import { searchSutras } from '../utils/searchSutras';
import { sortBySource } from '../utils/sortSutras';
import { formatSutraId } from '../utils/formatSutraId';
import { parseWikiLinks } from '../utils/parseWikiLinks';
import type { Sutra } from '../types/sutra';

interface Props {
  initialSutras: Sutra[];
}

const INITIAL_DISPLAY_COUNT = 10;

export default function SutraListControls({ initialSutras }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 计算搜索和分组结果
  const results = useMemo(() => {
    const sutras = searchQuery.trim() ? searchSutras(searchQuery, initialSutras) : initialSutras;
    const grouped = sortBySource(sutras);
    return {
      isSearching: !!searchQuery.trim(),
      grouped
    };
  }, [searchQuery, initialSutras]);

  const totalCount = results.grouped.reduce((sum, g) => sum + g.items.length, 0);

  // 切换分组展开状态
  const toggleGroup = (source: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  };

  // 当搜索改变时，重置展开状态
  useMemo(() => {
    setExpandedGroups(new Set());
  }, [searchQuery]);

  return (
    <div className="sutra-list-container">
      {/* 搜索控制区 */}
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

        {totalCount > 0 && (
          <span className="result-count">
            共 {totalCount} 条
          </span>
        )}
      </div>

      {/* 经文列表 - 按来源分组 */}
      {results.grouped.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
          未找到匹配的经文
        </div>
      ) : (
        results.grouped.map(group => {
          const isExpanded = expandedGroups.has(group.source);
          const displayItems = results.isSearching || isExpanded ? group.items : group.items.slice(0, INITIAL_DISPLAY_COUNT);
          const hasMore = group.items.length > INITIAL_DISPLAY_COUNT;

          return (
            <div key={group.source}>
              <h2 style={{ marginTop: group === results.grouped[0] ? 0 : '3rem' }}>
                {getSourceLabel(group.source)}
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                  ({group.items.length} 条)
                </span>
              </h2>
              <div className="sutra-list">
                {displayItems.map(sutra => (
                  <a
                    key={sutra.id}
                    href={`/Sanskrit/sutra/${sutra.id}`}
                    className="sutra-card"
                  >
                    <h3>{formatSutraId(sutra.id)}</h3>
                    <p dangerouslySetInnerHTML={{ __html: parseWikiLinks(sutra.text) }} />
                    {sutra.translation && (
                      <small style={{ color: '#64748b' }} dangerouslySetInnerHTML={{ __html: parseWikiLinks(sutra.translation) }} />
                    )}
                  </a>
                ))}
              </div>
              {!results.isSearching && hasMore && (
                <button
                  onClick={() => toggleGroup(group.source)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    marginTop: '1rem',
                    backgroundColor: 'transparent',
                    border: '2px dashed #3b82f6',
                    borderRadius: '0.5rem',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {isExpanded ? '收起 ▲' : `查看更多 (${group.items.length - INITIAL_DISPLAY_COUNT} 条) ▼`}
                </button>
              )}
            </div>
          );
        })
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
