import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Sutra, GraphEdge } from '../types/sutra';
import { formatSutraId } from '../utils/formatSutraId';

interface Props {
  currentSutraId: string;
  nodes: Sutra[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  source: string;
  text: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  type: string;
}

const edgeColors: Record<string, string> = {
  reference: '#6b7280',
  parallel:  '#f59e0b',
  adhikara:  '#ef4444',
};

// Same source colors as the main SutraGraph
const sourceColors: Record<string, string> = {
  panini:   '#1e3a8a',
  jkv:      '#3b82f6',
  dssk:     '#93c5fd',
  katantra: '#059669',
  other:    '#6b7280',
};

export default function SutraMiniGraph({
  currentSutraId,
  nodes,
  edges,
  width = 280,
  height = 260,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Filter out sequence edges — not shown in mini graph
    const filteredEdges = edges.filter(e => e.type !== 'sequence');

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', [0, 0, width, height]);

    const cx = width / 2;
    const cy = height / 2;

    // Arrow markers for directed edge types
    const defs = svg.append('defs');
    (['reference', 'adhikara'] as const).forEach(type => {
      defs.append('marker')
        .attr('id', `mini-arrow-${type}`)
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 8)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', edgeColors[type]);
    });

    // Build simulation nodes; place current at center, others in a ring
    const currentNode = nodes.find(n => n.id === currentSutraId)!;
    const otherNodes = nodes.filter(n => n.id !== currentSutraId);
    const count = otherNodes.length;

    const simNodes: SimNode[] = [
      { id: currentNode.id, source: currentNode.source, text: currentNode.text, x: cx, y: cy, fx: cx, fy: cy },
      ...otherNodes.map((n, i) => {
        const angle = (2 * Math.PI * i) / Math.max(count, 1);
        return { id: n.id, source: n.source, text: n.text, x: cx + 90 * Math.cos(angle), y: cy + 90 * Math.sin(angle) };
      }),
    ];

    const simLinks: SimLink[] = filteredEdges.map(e => ({ source: e.from, target: e.to, type: e.type }));

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(80).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(cx, cy))
      .force('collide', d3.forceCollide().radius(28));

    const link = svg.append('g')
      .selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', d => edgeColors[d.type] || '#ccc')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', d => d.type === 'parallel' ? '5,5' : 'none')
      .attr('marker-end', d => d.type === 'parallel' ? null : `url(#mini-arrow-${d.type})`);

    const nodeG = svg.append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .style('cursor', d => d.id !== currentSutraId ? 'pointer' : 'default')
      .on('click', (_, d) => {
        if (d.id !== currentSutraId) {
          window.location.href = `/Sanskrit/sutra/${d.id}`;
        }
      });

    nodeG.append('circle')
      .attr('r', d => d.id === currentSutraId ? 22 : 18)
      .attr('fill', d => sourceColors[d.source] || '#6b7280')
      .attr('stroke', d => d.id === currentSutraId ? '#fbbf24' : '#fff')
      .attr('stroke-width', d => d.id === currentSutraId ? 3 : 2);

    nodeG.append('text')
      .text(d => formatSutraId(d.id))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', d => d.id === currentSutraId ? '9px' : '8px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none');

    nodeG.append('title')
      .text(d => `${formatSutraId(d.id)}\n${d.text.length > 60 ? d.text.slice(0, 60) + '…' : d.text}`);

    simulation.on('tick', () => {
      link.each(function(d) {
        const source = d.source as SimNode;
        const target = d.target as SimNode;
        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;
        const offset = target.id === currentSutraId ? 25 : 21;
        d3.select(this)
          .attr('x1', source.x!)
          .attr('y1', source.y!)
          .attr('x2', target.x! - (dx / dist) * offset)
          .attr('y2', target.y! - (dy / dist) * offset);
      });
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [currentSutraId, nodes, edges, width, height]);

  if (nodes.length <= 1) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        此经文暂无关联
      </div>
    );
  }

  return <svg ref={svgRef} width={width} height={height} style={{ display: 'block' }} />;
}
