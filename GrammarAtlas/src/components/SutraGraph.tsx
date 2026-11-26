import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Sutra, GraphEdge } from '../types/sutra';
import { parseWikiLinks } from '../utils/parseWikiLinks';
import { formatSutraId } from '../utils/formatSutraId';
import { searchSutras } from '../utils/searchSutras';
import { getScopeGroups } from '../utils/adhikara';

// 注释条目默认不进主图，由开关控制；经文条目（panini / katantra / dssk）始终显示
const COMMENTARY_SOURCES = ['jkv', 'dsv'];

interface Props {
  height?: number;
  sutras: Sutra[];
  edges: GraphEdge[];
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  text: string;
  source: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  type: string;
}

export default function SutraGraph({ height = 600, sutras, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const autoZoomedRef = useRef(false);
  const jitterRef = useRef(new Map<string, [number, number]>());
  const [selectedSutra, setSelectedSutra] = useState<Sutra | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Set<string>>(new Set());
  const [showCommentary, setShowCommentary] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const isMeasured = containerWidth !== null;

  const visibleSutras = useMemo(
    () => sutras.filter(s => showCommentary || !COMMENTARY_SOURCES.includes(s.source)),
    [sutras, showCommentary]
  );
  const visibleEdges = useMemo(() => {
    const ids = new Set(visibleSutras.map(s => s.id));
    return edges.filter(e => ids.has(e.from) && ids.has(e.to));
  }, [visibleSutras, edges]);

  useEffect(() => {
    if (!svgRef.current || containerWidth === null) return;

    // 清除之前的内容
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, containerWidth, height]);

    // 创建一个 group 用于缩放/平移
    const g = svg.append("g");

    // 添加缩放和平移功能
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // 定义箭头标记（为每种类型创建不同颜色的箭头）
    const defs = svg.append("defs");

    Object.entries({
      reference: "#6b7280",  // 深灰
      parallel: "#f59e0b",   // 橙色
      adhikara: "#ef4444",   // 红色
      sequence: "#06b6d4"    // 青色
    }).forEach(([type, color]) => {
      defs.append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 8)
        .attr("refY", 5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto-start-reverse")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("fill", color);
    });

    // 准备数据
    const nodes: Node[] = visibleSutras.map(s => {
      let jitter = jitterRef.current.get(s.id);
      if (!jitter) {
        jitter = [Math.random() * 2 - 1, Math.random() * 2 - 1];
        jitterRef.current.set(s.id, jitter);
      }
      return {
        id: s.id,
        text: s.text,
        source: s.source,
        x: containerWidth / 2 + jitter[0] * containerWidth * 0.3,
        y: height / 2 + jitter[1] * height * 0.3
      };
    });

    const links: Link[] = visibleEdges.map(e => ({
      source: e.from,
      target: e.to,
      type: e.type
    })).sort((a, b) => {
      // adhikara (领句/红色) 最后渲染，确保在上面不被覆盖
      if (a.type === 'adhikara' && b.type !== 'adhikara') return 1;
      if (a.type !== 'adhikara' && b.type === 'adhikara') return -1;
      return 0;
    });

    // 颜色定义
    const sourceColors: Record<string, string> = {
      panini: "#1e3a8a",    // 深蓝
      jkv: "#3b82f6",       // 中等蓝（略浅）
      dssk: "#93c5fd",      // 浅蓝（最浅）
      katantra: "#059669",  // 绿色
      dsv: "#34d399",       // 浅绿（Kātantra 注释）
      other: "#6b7280"      // 灰色
    };

    const edgeColors: Record<string, string> = {
      reference: "#6b7280",  // 深灰
      parallel: "#f59e0b",   // 橙色
      commentary: "#8b5cf6", // 紫色（注释）
      adhikara: "#ef4444",   // 红色
      sequence: "#06b6d4"    // 青色
    };

    // 领句范围组（嵌套的区间各自成组），大的先画，小的叠在上面
    const scopeGroups = getScopeGroups(visibleSutras)
      .map(gr => ({ ...gr, members: gr.members.filter(id => nodes.some(n => n.id === id)) }))
      .sort((a, b) => b.members.length - a.members.length);
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    // 颜色按领句编号排序后固定分配，同一领句颜色不会因为大小排序变化
    const scopeIdOrder = scopeGroups.map(gr => gr.id).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const scopeColor = (id: string) => d3.schemeTableau10[scopeIdOrder.indexOf(id) % 10];

    // 创建力导向模拟
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(containerWidth / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))
      // 同一领句管辖的节点轻轻聚拢，范围包络才不会铺得太散
      .force("scope", (alpha: number) => {
        for (const gr of scopeGroups) {
          const ms = gr.members.map(id => nodeById.get(id)!);
          const cx = d3.mean(ms, m => m.x!)!;
          const cy = d3.mean(ms, m => m.y!)!;
          for (const m of ms) {
            m.vx = (m.vx ?? 0) + (cx - m.x!) * 0.08 * alpha;
            m.vy = (m.vy ?? 0) + (cy - m.y!) * 0.08 * alpha;
          }
        }
      })
      // 添加边界力，阻止节点跑出显示范围
      .force("boundary", () => {
        const padding = 50;
        for (const node of nodes) {
          // 只约束未被拖动的节点（拖动时 fx/fy 不为 null）
          if (node.fx === null && node.fy === null) {
            if (node.x! < padding) node.x = padding;
            if (node.x! > containerWidth - padding) node.x = containerWidth - padding;
            if (node.y! < padding) node.y = padding;
            if (node.y! > height - padding) node.y = height - padding;
          }
        }
      });

    // 绘制领句范围包络（在边和节点下面）
    const hullLayer = g.append("g");
    const hullPaths = hullLayer.selectAll("path")
      .data(scopeGroups)
      .join("path")
      .attr("fill", d => scopeColor(d.id))
      .attr("fill-opacity", 0.1)
      .attr("stroke", d => scopeColor(d.id))
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "6,4")
      .style("pointer-events", "none");
    hullPaths.append("title").text(d => `${formatSutraId(d.id)} 管辖 ${d.scope.from}–${d.scope.to}`);
    // 标签固定在领句节点正上方（节点半径 25，再留 10 px），白色描边保证压在阴影上也清楚
    const hullLabels = hullLayer.selectAll("text")
      .data(scopeGroups.filter(gr => nodeById.has(gr.id)))
      .join("text")
      .text(d => `${formatSutraId(d.id)} 管辖 ${d.scope.from}–${d.scope.to}`)
      .attr("fill", d => scopeColor(d.id))
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .attr("paint-order", "stroke")
      .attr("font-size", "11px")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none");
    const hullLine = d3.line<[number, number]>().curve(d3.curveCatmullRomClosed.alpha(0.5));
    const HULL_PAD = 38;

    // 绘制边
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => edgeColors[d.type] || "#ccc")
      .attr("stroke-width", 1.5)  // 统一线宽
      .attr("stroke-dasharray", d => d.type === 'parallel' ? "5,5" : d.type === 'commentary' ? "2,3" : "none")
      // parallel 与 commentary 不显示箭头
      .attr("marker-end", d => d.type === 'parallel' || d.type === 'commentary' ? null : `url(#arrow-${d.type})`);

    // 绘制节点
    const node = g.append("g")
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
      const sutra = sutras.find(s => s.id === d.id);
      if (sutra) setSelectedSutra(sutra);
    });

    // 更新位置
    let tickCount = 0;
    simulation.on("tick", () => {
      link.each(function(d) {
        const source = d.source as Node;
        const target = d.target as Node;

        // 计算方向向量
        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 节点半径 + 一点间距，让箭头不被遮挡
        const offset = 28;

        // 归一化方向向量并偏移
        const offsetX = (dx / dist) * offset;
        const offsetY = (dy / dist) * offset;

        d3.select(this)
          .attr("x1", source.x!)
          .attr("y1", source.y!)
          .attr("x2", target.x! - offsetX)
          .attr("y2", target.y! - offsetY);
      });

      node.attr("transform", d => `translate(${d.x},${d.y})`);

      // 范围包络：每个成员周围取一圈点，求凸包后平滑
      hullPaths.attr("d", d => {
        const pts: [number, number][] = [];
        for (const id of d.members) {
          const n = nodeById.get(id)!;
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            pts.push([n.x! + HULL_PAD * Math.cos(a), n.y! + HULL_PAD * Math.sin(a)]);
          }
        }
        const hull = d3.polygonHull(pts);
        return hull ? hullLine(hull) : null;
      });
      hullLabels
        .attr("x", d => nodeById.get(d.id)!.x!)
        .attr("y", d => nodeById.get(d.id)!.y! - 25 - 10);

      // 在第 50 次 tick 后自动缩放到合适大小（仅第一次）
      tickCount++;
      if (tickCount === 50 && !autoZoomedRef.current) {
        autoZoomedRef.current = true;
        // 计算所有节点的边界框
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        nodes.forEach(n => {
          if (n.x! < minX) minX = n.x!;
          if (n.x! > maxX) maxX = n.x!;
          if (n.y! < minY) minY = n.y!;
          if (n.y! > maxY) maxY = n.y!;
        });

        // 计算边界框的中心和尺寸
        const boundingWidth = maxX - minX;
        const boundingHeight = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // 计算缩放比例（留 10% 边距）
        const padding = 0.9;
        const scale = Math.min(
          (containerWidth * padding) / boundingWidth,
          (height * padding) / boundingHeight
        );

        // 计算平移量，使边界框中心对齐 SVG 中心
        // 先把边界框中心平移到原点，再缩放，最后平移到 SVG 中心
        const translateX = containerWidth / 2 - centerX * scale;
        const translateY = height / 2 - centerY * scale;

        // 应用初始缩放（先缩放再平移）
        svg.transition()
          .duration(400)
          .call(
            zoom.transform as any,
            d3.zoomIdentity.scale(scale).translate(translateX / scale, translateY / scale)
          );
      } else if (tickCount > 50) {
        tickCount = 51; // 防止数字过大
      }
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
    let dragStartX: number, dragStartY: number;
    let isDragging = false;

    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      dragStartX = event.subject.x!;
      dragStartY = event.subject.y!;
      isDragging = false;
      // 重启 simulation，准备好动作
      if (!event.active) simulation.alphaTarget(0.3).restart();
      // 锁定节点
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      const currentX = event.subject.x! + event.dx;
      const currentY = event.subject.y! + event.dy;
      const distance = Math.sqrt(
        Math.pow(currentX - dragStartX, 2) +
        Math.pow(currentY - dragStartY, 2)
      );

      // 标记是否真正拖拽（距离 > 5px）
      if (distance > 5) {
        isDragging = true;
      }

      // 更新节点位置
      event.subject.fx = currentX;
      event.subject.fy = currentY;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      // 不释放 fx 和 fy，节点保持在新位置
      event.subject.vx = 0;
      event.subject.vy = 0;

      // 停止 simulation
      if (!event.active) simulation.alphaTarget(0);
    }

    return () => {
      simulation.stop();
    };
  }, [visibleSutras, visibleEdges, height, searchResults, isMeasured]);

  // 处理搜索查询变化
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchSutras(searchQuery, visibleSutras);
      setSearchResults(new Set(results.map(s => s.id)));
    } else {
      setSearchResults(new Set());
    }
  }, [searchQuery, visibleSutras]);

  // 监听容器宽度变化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 当宽度改变时，更新SVG的viewBox（但不重新初始化图）
  useEffect(() => {
    if (!svgRef.current || containerWidth === null) return;
    d3.select(svgRef.current).attr("viewBox", [0, 0, containerWidth, height]);
  }, [containerWidth, height]);

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
            {searchResults.size} / {visibleSutras.length}
          </span>
        )}
        <label className="graph-commentary-toggle">
          <input
            type="checkbox"
            checked={showCommentary}
            onChange={(e) => setShowCommentary(e.target.checked)}
          />
          显示注释（Kāśikāvṛṭti · DSV）
        </label>
      </div>

      {/* 图表容器 */}
      <div ref={containerRef} className="graph-container" style={{ width: '100%' }}>
        <svg ref={svgRef} width="100%" height={height} preserveAspectRatio="xMidYMid slice" />

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
            <span className="dot dsv"></span> Durgasiṃhavṛtti
          </div>
          <div className="legend-item">
            <span className="dot jkv"></span> Kāśikāvṛṭti
          </div>
          <div className="legend-item">
            <span className="dot dssk"></span> 段晴《波你尼语法入门》
          </div>
          <div className="legend-item">
            <span className="line reference"></span> 引用经文
          </div>
          <div className="legend-item">
            <span className="line parallel"></span> 平行文本
          </div>
          <div className="legend-item">
            <span className="line commentary"></span> 注释
          </div>
          <div className="legend-item">
            <span className="line adhikara"></span> Adhikāra 领句（手写）
          </div>
          <div className="legend-item">
            <span className="line sequence"></span> 后继经文
          </div>
          <div className="legend-item">
            <span style={{ display: 'inline-block', width: 20, height: 12, border: '1.5px dashed #94a3b8', background: 'rgba(148,163,184,0.12)', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }}></span> 领句管辖范围
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#64748b' }}>
            <p style={{ margin: '0.5rem 0', lineHeight: '1.4' }}>💡 交互提示：</p>
            <p style={{ margin: '0.25rem 0' }}>• 滚轮缩放图谱</p>
            <p style={{ margin: '0.25rem 0' }}>• 拖动背景平移</p>
            <p style={{ margin: '0.25rem 0' }}>• 拖动节点调整位置</p>
          </div>
        </div>

        {/* 经文详情面板 */}
        {selectedSutra && (
          <div className="sutra-panel">
            <button className="close-btn" onClick={() => setSelectedSutra(null)}>×</button>
            <h3>
              <a href={`/Sanskrit/sutra/${selectedSutra.id}`} className="sutra-panel-link">
                {formatSutraId(selectedSutra.id)} →
              </a>
            </h3>
            <p className="sutra-text" dangerouslySetInnerHTML={{ __html: parseWikiLinks(selectedSutra.text) }} />
            {selectedSutra.translation && (
              <p className="translation" dangerouslySetInnerHTML={{ __html: parseWikiLinks(selectedSutra.translation) }} />
            )}
            {selectedSutra.duanExplain && (
              <div className="duan-explain">
                <strong>段书讲解:</strong> <span dangerouslySetInnerHTML={{ __html: parseWikiLinks(selectedSutra.duanExplain) }} />
              </div>
            )}
            {selectedSutra.notes && (
              <div className="notes">
                <strong>按语:</strong> <span dangerouslySetInnerHTML={{ __html: parseWikiLinks(selectedSutra.notes) }} />
              </div>
            )}
            {selectedSutra.adhikaras && selectedSutra.adhikaras.length > 0 && (
              <p className="adhikara">
                <strong>Adhikāra 领句:</strong> {selectedSutra.adhikaras.map(adh => formatSutraId(adh)).join(' → ')}
              </p>
            )}
            {selectedSutra.parallel && selectedSutra.parallel.length > 0 && (
              <p className="parallel">
                <strong>平行文本:</strong> {selectedSutra.parallel.map(par => formatSutraId(par)).join(', ')}
              </p>
            )}
            {selectedSutra.commentaryOn && selectedSutra.commentaryOn.length > 0 && (
              <p className="commentary">
                <strong>注释于:</strong> {selectedSutra.commentaryOn.map(com => formatSutraId(com)).join(', ')}
              </p>
            )}
            {selectedSutra.sequence && selectedSutra.sequence.length > 0 && (
              <p className="sequence">
                <strong>后继经文:</strong> {selectedSutra.sequence.map(seq => formatSutraId(seq)).join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
