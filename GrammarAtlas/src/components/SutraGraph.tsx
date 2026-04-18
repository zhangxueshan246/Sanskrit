import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sutras, edges, type Sutra } from '../data/sutras';
import { parseWikiLinks } from '../utils/parseWikiLinks';
import { formatSutraId } from '../utils/formatSutraId';
import { searchSutras } from '../utils/searchSutras';

interface Props {
  width?: number;
  height?: number;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  text: string;
  source: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  type: string;
}

export default function SutraGraph({ width = 800, height = 600 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedSutra, setSelectedSutra] = useState<Sutra | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!svgRef.current) return;

    // 清除之前的内容
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // 准备数据
    const nodes: Node[] = Object.values(sutras).map(s => ({
      id: s.id,
      text: s.text,
      source: s.source
    }));

    const links: Link[] = edges.map(e => ({
      source: e.from,
      target: e.to,
      type: e.type
    }));

    // 颜色定义
    const sourceColors: Record<string, string> = {
      panini: "#1e3a8a",    // 深蓝
      jkv: "#3b82f6",       // 中等蓝（略浅）
      dssk: "#93c5fd",      // 浅蓝（最浅）
      katantra: "#059669",  // 绿色
      other: "#6b7280"      // 灰色
    };

    const edgeColors: Record<string, string> = {
      reference: "#94a3b8",  // 灰色
      parallel: "#f59e0b",   // 橙色
      adhikara: "#ef4444",   // 红色
      sequence: "#cbd5e1"    // 浅灰
    };

    // 创建力导向模拟
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // 绘制边
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => edgeColors[d.type] || "#ccc")
      .attr("stroke-width", d => d.type === 'parallel' ? 3 : 1.5)
      .attr("stroke-dasharray", d => d.type === 'parallel' ? "5,5" : "none");

    // 绘制节点
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // 节点圆形
    const nodeCircles = node.append("circle")
      .attr("r", 25)
      .attr("fill", d => sourceColors[d.source] || "#6b7280")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("class", d => `node-circle${searchResults.has(d.id) ? ' highlighted' : ''}`)
      .style("cursor", "pointer");

    // 节点标签
    node.append("text")
      .text(d => formatSutraId(d.id))
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none");

    // 点击事件
    node.on("click", (event, d) => {
      const sutra = sutras[d.id];
      setSelectedSutra(sutra);
    });

    // 更新位置
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // 搜索后更新节点样式
    if (searchQuery.trim()) {
      nodeCircles
        .style("opacity", d => searchResults.has(d.id) ? 1 : 0.2)
        .style("stroke-width", d => searchResults.has(d.id) ? 3 : 2)
        .style("filter", d => searchResults.has(d.id) ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none');
    } else {
      nodeCircles
        .style("opacity", 1)
        .style("stroke-width", 2)
        .style("filter", 'none');
    }

    // 拖拽函数
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [width, height, searchResults]);

  // 处理搜索查询变化
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchSutras(searchQuery);
      setSearchResults(new Set(results.map(s => s.id)));
    } else {
      setSearchResults(new Set());
    }
  }, [searchQuery]);

  return (
    <>
      {/* 搜索框 - 独立在外面 */}
      <div className="graph-search-bar">
        <label htmlFor="graph-search-input" className="graph-search-label">
          🔍 搜索
        </label>
        <input
          id="graph-search-input"
          type="text"
          className="graph-search-input"
          placeholder="输入经文ID、原文或翻译..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSearchQuery('');
            }
          }}
        />
        {searchQuery && (
          <button
            className="graph-search-clear"
            onClick={() => setSearchQuery('')}
            title="清空搜索 (ESC)"
          >
            ✕
          </button>
        )}
        {searchQuery && (
          <span className="graph-search-count">
            {searchResults.size} / {Object.keys(sutras).length}
          </span>
        )}
      </div>

      {/* 图表容器 */}
      <div className="graph-container">
        <svg ref={svgRef} width={width} height={height} />

        {/* 图例 */}
        <div className="legend">
          <h4>图例</h4>
          <div className="legend-item">
            <span className="dot panini"></span> Pāṇini
          </div>
          <div className="legend-item">
            <span className="dot katantra"></span> Kātantra
          </div>
          <div className="legend-item">
            <span className="dot jkv"></span> Kāśikāvṛṭti
          </div>
          <div className="legend-item">
            <span className="dot dssk"></span> 段晴《波你尼语法入门》
          </div>
          <div className="legend-item">
            <span className="line reference"></span> 引用
          </div>
          <div className="legend-item">
            <span className="line parallel"></span> 对应
          </div>
          <div className="legend-item">
            <span className="line adhikara"></span> Adhikāra
          </div>
        </div>

        {/* 经文详情面板 */}
        {selectedSutra && (
          <div className="sutra-panel">
            <button className="close-btn" onClick={() => setSelectedSutra(null)}>×</button>
            <h3>{formatSutraId(selectedSutra.id)}</h3>
            <p className="sutra-text" dangerouslySetInnerHTML={{ __html: parseWikiLinks(selectedSutra.text) }} />
            {selectedSutra.translation && (
              <p className="translation" dangerouslySetInnerHTML={{ __html: parseWikiLinks(selectedSutra.translation) }} />
            )}
            {selectedSutra.vrtti && (
              <div className="vrtti">
                <strong>Vṛtti:</strong> <span dangerouslySetInnerHTML={{ __html: parseWikiLinks(selectedSutra.vrtti) }} />
              </div>
            )}
            {selectedSutra.notes && (
              <div className="notes">
                <strong>笔记:</strong> <span dangerouslySetInnerHTML={{ __html: parseWikiLinks(selectedSutra.notes) }} />
              </div>
            )}
            {selectedSutra.adhikaras && selectedSutra.adhikaras.length > 0 && (
              <p className="adhikara">
                <strong>领句:</strong> {selectedSutra.adhikaras.join(' → ')}
              </p>
            )}
            {selectedSutra.parallel && selectedSutra.parallel.length > 0 && (
              <p className="parallel">
                <strong>互文:</strong> {selectedSutra.parallel.join(', ')}
              </p>
            )}
            <a href={`/Sanskrit/sutra/${selectedSutra.id}`} className="view-link">
              查看详情 →
            </a>
          </div>
        )}
      </div>
    </>
  );
}
