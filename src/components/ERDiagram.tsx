import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import {
  KeyRound,
  ZoomIn,
  ZoomOut,
  Maximize,
  Maximize2,
  Minimize2,
  Move,
  MousePointer2,
} from "lucide-react";
import { getLayoutedElements } from "../lib/diagram-layout";
import type { ParsedSchema } from "../types/schema";

interface TableNodeData {
  label: string;
  fields: { name: string; type: string; pk: boolean }[];
  [key: string]: unknown;
}

function TableNode({ data }: NodeProps<Node<TableNodeData>>) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-md min-w-[240px] overflow-hidden">
      <div className="bg-[#1E293B] text-white px-3 py-2 text-sm font-semibold">
        {data.label}
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {data.fields.map((field: { name: string; type: string; pk: boolean }) => (
          <div
            key={field.name}
            className="flex items-center gap-2 px-3 py-1.5 text-xs"
          >
            {field.pk && <KeyRound className="w-3 h-3 text-blue-500 flex-shrink-0" />}
            {!field.pk && <span className="w-3 h-3 flex-shrink-0" />}
            <span className="font-mono font-medium text-[#1F2937]">{field.name}</span>
            <span className="ml-auto text-[#6B7280] font-mono">{field.type}</span>
          </div>
        ))}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-purple-500 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { tableNode: TableNode };

function DiagramControls({
  isFullscreen,
  onToggleFullscreen,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [zoom, setZoom] = useState(100);
  const [isPanning, setIsPanning] = useState(false);

  const updateZoom = () => setTimeout(() => setZoom(Math.round(getZoom() * 100)), 220);

  return (
    <Panel position="bottom-left" className="flex items-center gap-1.5 mb-2 ml-2">
      <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg shadow-sm px-2 py-1.5">
        {/* Pointer / Hand toggle */}
        <button
          title={isPanning ? "Switch to pointer" : "Pan mode (hand)"}
          onClick={() => setIsPanning((p) => !p)}
          className={`p-1 rounded transition-colors ${
            isPanning
              ? "bg-blue-100 text-blue-600"
              : "text-[#6B7280] hover:bg-gray-100"
          }`}
        >
          {isPanning ? (
            <Move className="w-4 h-4" />
          ) : (
            <MousePointer2 className="w-4 h-4" />
          )}
        </button>

        <div className="w-px h-4 bg-[#E5E7EB] mx-0.5" />

        {/* Zoom out */}
        <button
          onClick={() => { zoomOut({ duration: 200 }); updateZoom(); }}
          title="Zoom out"
          className="p-1 rounded text-[#6B7280] hover:bg-gray-100 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom % */}
        <span className="text-xs text-[#6B7280] font-mono w-12 text-center select-none">
          {zoom}%
        </span>

        {/* Zoom in */}
        <button
          onClick={() => { zoomIn({ duration: 200 }); updateZoom(); }}
          title="Zoom in"
          className="p-1 rounded text-[#6B7280] hover:bg-gray-100 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-[#E5E7EB] mx-0.5" />

        {/* Fit view */}
        <button
          onClick={() => { fitView({ duration: 400, padding: 0.12 }); updateZoom(); }}
          title="Fit view"
          className="p-1 rounded text-[#6B7280] hover:bg-gray-100 transition-colors"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Fullscreen */}
      <button
        onClick={onToggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        className="p-1.5 bg-white border border-[#E5E7EB] rounded-lg shadow-sm text-[#6B7280] hover:bg-gray-50 transition-colors"
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>
    </Panel>
  );
}

interface ERDiagramInnerProps {
  schema: ParsedSchema;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

function ERDiagramInner({ schema, isFullscreen, onToggleFullscreen }: ERDiagramInnerProps) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = schema.tables.map((table) => ({
      id: table.name,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: {
        label: table.name,
        fields: table.fields.map((f) => ({
          name: f.name,
          type: f.type,
          pk: f.pk,
        })),
      },
    }));

    const edges: Edge[] = schema.refs.map((ref, i) => ({
      id: `e-${i}`,
      source: ref.fromTable,
      target: ref.toTable,
      animated: false,
      style: { stroke: "#7C3AED", strokeWidth: 1.5 },
      label: `${ref.fromField} → ${ref.toField}`,
      labelStyle: { fontSize: 10, fill: "#6B7280" },
      labelBgStyle: { fill: "white", fillOpacity: 0.8 },
      labelBgPadding: [4, 2] as [number, number],
    }));

    const layouted = getLayoutedElements(nodes, edges, "LR");
    return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
  }, [schema]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const { fitView } = useReactFlow();

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ duration: 400, padding: 0.12 }), 80);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onInit={onInit}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.05}
      maxZoom={3}
      proOptions={{ hideAttribution: true }}
    >
      <MiniMap
        nodeStrokeWidth={3}
        zoomable
        pannable
        className="!bg-white !border-[#E5E7EB]"
      />
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E5E7EB" />
      <DiagramControls isFullscreen={isFullscreen} onToggleFullscreen={onToggleFullscreen} />
    </ReactFlow>
  );
}

interface ERDiagramProps {
  schema: ParsedSchema;
}

export default function ERDiagram({ schema }: ERDiagramProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      {isFullscreen ? (
        <div className="fixed inset-0 z-50 bg-white">
          <ReactFlowProvider>
            <ERDiagramInner
              schema={schema}
              isFullscreen={true}
              onToggleFullscreen={() => setIsFullscreen(false)}
            />
          </ReactFlowProvider>
        </div>
      ) : (
        <div className="w-full h-full">
          <ReactFlowProvider>
            <ERDiagramInner
              schema={schema}
              isFullscreen={false}
              onToggleFullscreen={() => setIsFullscreen(true)}
            />
          </ReactFlowProvider>
        </div>
      )}
    </>
  );
}
