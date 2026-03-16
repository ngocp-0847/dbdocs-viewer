import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

const NODE_WIDTH = 280;
const FIELD_HEIGHT = 28;
const HEADER_HEIGHT = 40;
const PADDING = 20;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "LR"
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120, edgesep: 30 });

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
