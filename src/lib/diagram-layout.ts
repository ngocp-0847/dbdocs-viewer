import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

const NODE_WIDTH = 260;
const FIELD_HEIGHT = 26;
const HEADER_HEIGHT = 40;
const PADDING = 20;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 120,
    ranksep: 180,
    edgesep: 30,
    align: "UL",
  });

  nodes.forEach((node) => {
    const fieldCount = (node.data as { fields: unknown[] }).fields?.length ?? 5;
    const height = HEADER_HEIGHT + fieldCount * FIELD_HEIGHT + PADDING;
    g.setNode(node.id, { width: NODE_WIDTH, height });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPos = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPos.x - NODE_WIDTH / 2,
        y: nodeWithPos.y - nodeWithPos.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
