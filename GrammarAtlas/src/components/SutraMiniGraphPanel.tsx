import { useCallback, useState } from 'react';
import type { Sutra, GraphEdge } from '../types/sutra';
import SutraMiniGraph from './SutraMiniGraph';
import { formatSutraId } from '../utils/formatSutraId';
import { parseWikiLinks } from '../utils/parseWikiLinks';

interface Props {
  currentSutraId: string;
  nodes: Sutra[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
}

/**
 * 经文页的关系小图 + 点击节点后的预览（与主图侧边栏同样的内容，预览里可进入该经文）
 */
export default function SutraMiniGraphPanel({ currentSutraId, nodes, edges, width = 280, height = 260 }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 回调需保持引用稳定，否则每次选中都会让小图重新布局
  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  const selected = selectedId ? nodes.find(n => n.id === selectedId) ?? null : null;

  return (
    <>
      <SutraMiniGraph
        currentSutraId={currentSutraId}
        nodes={nodes}
        edges={edges}
        width={width}
        height={height}
        onSelect={handleSelect}
      />
      <a href="/Sanskrit/atlas" className="mini-graph-link">查看完整图谱 →</a>

      {selected && (
        <div className="sutra-panel sutra-panel-inline">
          <button className="close-btn" onClick={() => setSelectedId(null)}>×</button>
          <h3>
            <a href={`/Sanskrit/sutra/${selected.id}`} className="sutra-panel-link">
              {formatSutraId(selected.id)} →
            </a>
          </h3>
          <p className="sutra-text" dangerouslySetInnerHTML={{ __html: parseWikiLinks(selected.text) }} />
          {selected.translation && (
            <p className="translation" dangerouslySetInnerHTML={{ __html: parseWikiLinks(selected.translation) }} />
          )}
          {selected.duanExplain && (
            <div className="duan-explain">
              <strong>段书讲解:</strong> <span dangerouslySetInnerHTML={{ __html: parseWikiLinks(selected.duanExplain) }} />
            </div>
          )}
          {selected.notes && (
            <div className="notes">
              <strong>按语:</strong> <span dangerouslySetInnerHTML={{ __html: parseWikiLinks(selected.notes) }} />
            </div>
          )}
          {selected.adhikaras && selected.adhikaras.length > 0 && (
            <p className="adhikara">
              <strong>Adhikāra 领句:</strong> {selected.adhikaras.map(adh => formatSutraId(adh)).join(' → ')}
            </p>
          )}
          {selected.parallel && selected.parallel.length > 0 && (
            <p className="parallel">
              <strong>平行文本:</strong> {selected.parallel.map(par => formatSutraId(par)).join(', ')}
            </p>
          )}
          {selected.commentaryOn && selected.commentaryOn.length > 0 && (
            <p className="commentary">
              <strong>注释于:</strong> {selected.commentaryOn.map(com => formatSutraId(com)).join(', ')}
            </p>
          )}
          {selected.sequence && selected.sequence.length > 0 && (
            <p className="sequence">
              <strong>后继经文:</strong> {selected.sequence.map(seq => formatSutraId(seq)).join(', ')}
            </p>
          )}
        </div>
      )}
    </>
  );
}
