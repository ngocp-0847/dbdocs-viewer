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
  MarkerType,
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getLayoutedElements } from "../lib/diagram-layout";
import { getTableHeaderHex, getEdgeColor } from "../lib/table-colors";
import type { ParsedSchema } from "../types/schema";

interface TableNodeData {
  label: string;
  fields: { name: string; type: string; pk: boolean; fk?: boolean }[];
  [key: string]: unknown;
}

function TableNode({ data }: NodeProps<Node<TableNodeData>>) {
  const headerColor = getTableHeaderHex(data.label);
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-md min-w-[240px] overflow-hidden">
      <div
        className="text-white px-3 py-2 text-sm font-semibold"
        style={{ backgroundColor: headerColor }}
      >
        {data.label}
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {data.fields.map((field: TableNodeData["fields"][number]) => (
          <div
            key={field.name}
            className={`flex items-center gap-2 px-3 py-1.5 text-[12px] ${
              field.pk ? "bg-yellow-50" : field.fk ? "bg-purple-50" : ""
            }`}
          >
            {field.pk && <KeyRound className="w-3 h-3 text-blue-500 flex-shrink-0" />}
            {!field.pk && <span className="w-3 h-3 flex-shrink-0" />}
            <span className="font-mono font-medium text-[#1F2937]">{field.name}</span>
            <span className="ml-auto text-[#9CA3AF] font-mono">{field.type}</span>
          </div>
        ))}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-blue-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-purple-500 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { tableNode: TableNode };

const DOMAIN_LEGEND = [
  { label: "Customer", color: "#2563EB" },
  { label: "Partner", color: "#7C3AED" },
  { label: "Application", color: "#EA580C" },
  { label: "Financial", color: "#059669" },
  { label: "Identity/Auth", color: "#E11D48" },
  { label: "Terms", color: "#D97706" },
  { label: "Admin/Org", color: "#475569" },
  { label: "Comms/Content", color: "#0891B2" },
  { label: "Other", color: "#1E293B" },
];

function Legend() {
  const [open, setOpen] = useState(false);
  return (
    <Panel position="bottom-right" className="mb-2 mr-2">
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors w-full"
        >
          <span className="font-medium">Legend</span>
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
        {open && (
          <div className="px-3 pb-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {DOMAIN_LEGEND.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-[11px] text-[#374151]">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function DiagramControls({
  isFullscreen,
  onToggleFullscreen,
  direction,
  onDirectionChange,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  direction: "TB" | "LR";
  onDirectionChange: (d: "TB" | "LR") => void;
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
          onClick={() => { fitView({ duration: 400, padding: 0.1 }); updateZoom(); }}
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

      {/* Layout toggle */}
      <div className="flex items-center bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={() => onDirectionChange("TB")}
          title="Vertical layout"
          className={`px-2 py-1.5 text-xs font-medium transition-colors ${
            direction === "TB"
              ? "bg-blue-500 text-white"
              : "text-[#6B7280] hover:bg-gray-100"
          }`}
        >
          ↕ Vertical
        </button>
        <button
          onClick={() => onDirectionChange("LR")}
          title="Horizontal layout"
          className={`px-2 py-1.5 text-xs font-medium transition-colors ${
            direction === "LR"
              ? "bg-blue-500 text-white"
              : "text-[#6B7280] hover:bg-gray-100"
          }`}
        >
          ↔ Horizontal
        </button>
      </div>
    </Panel>
  );
}

interface ERDiagramInnerProps {
  schema: ParsedSchema;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

function ERDiagramInner({ schema, isFullscreen, onToggleFullscreen }: ERDiagramInnerProps) {
  const [direction, setDirection] = useState<"TB" | "LR">("TB");

  // Build FK set for highlighting
  const fkFields = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const ref of schema.refs) {
      if (!map.has(ref.fromTable)) map.set(ref.fromTable, new Set());
      map.get(ref.fromTable)!.add(ref.fromField);
    }
    return map;
  }, [schema.refs]);

  const { layoutedNodes, layoutedEdges } = useMemo(() => {
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
          fk: fkFields.get(table.name)?.has(f.name) ?? false,
        })),
      },
    }));

    const edges: Edge[] = schema.refs.map((ref, i) => ({
      id: `e-${i}`,
      source: ref.fromTable,
      target: ref.toTable,
      type: "smoothstep",
      pathOptions: { borderRadius: 8 },
      animated: false,
      style: { stroke: getEdgeColor(ref.fromTable), strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: getEdgeColor(ref.fromTable),
      },
    }));

    const layouted = getLayoutedElements(nodes, edges, direction);
    return { layoutedNodes: layouted.nodes, layoutedEdges: layouted.edges };
  }, [schema, direction, fkFields]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const { fitView } = useReactFlow();

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ duration: 400, padding: 0.1 }), 80);
  }, [fitView]);

  const handleDirectionChange = useCallback(
    (d: "TB" | "LR") => {
      setDirection(d);
      // Re-layout will happen via useMemo, but we need to update state
    },
    []
  );

  // Sync layout changes to state
  useMemo(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onInit={onInit}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.1 }}
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
      <DiagramControls
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        direction={direction}
        onDirectionChange={handleDirectionChange}
      />
      <Legend />
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
