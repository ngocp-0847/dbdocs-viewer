import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
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
  MarkerType,
} from "@xyflow/react";
import { KeyRound, ZoomIn, ZoomOut, Maximize2, Minimize2, Move, MousePointer2, Maximize } from "lucide-react";
import { getLayoutedElements } from "../lib/diagram-layout";
import { getTableHeaderHex, getEdgeColor } from "../lib/table-colors";
import type { ParsedSchema } from "../types/schema";

interface TableNodeData {
  label: string;
  fields: { name: string; type: string; pk: boolean; fk: boolean }[];
  isMain: boolean;
  [key: string]: unknown;
}

function TableNode({ data }: NodeProps<Node<TableNodeData>>) {
  const d = data as TableNodeData;
  const headerColor = getTableHeaderHex(d.label);
  return (
    <div
      className={`bg-white border rounded-lg shadow-md min-w-[240px] overflow-hidden ${
        d.isMain ? "border-blue-500 ring-2 ring-blue-200" : "border-[#E5E7EB]"
      }`}
    >
      <div
        className="px-3 py-2 text-xs font-semibold text-white"
        style={{ backgroundColor: d.isMain ? headerColor : headerColor }}
      >
        {d.label}
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {d.fields.map((field) => (
          <div
            key={field.name}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] ${
              field.pk ? "bg-yellow-50" : field.fk ? "bg-purple-50" : ""
            }`}
          >
            {field.pk ? (
              <KeyRound className="w-3 h-3 text-blue-500 flex-shrink-0" />
            ) : field.fk ? (
              <span className="w-3 h-3 text-[10px] text-purple-500 flex-shrink-0 font-bold">FK</span>
            ) : (
              <span className="w-3 h-3 flex-shrink-0" />
            )}
            <span className="font-mono text-[#1F2937] truncate">{field.name}</span>
            <span className="ml-auto text-[#9CA3AF] font-mono text-[10px] truncate">{field.type}</span>
          </div>
        ))}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-purple-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { tableNode: TableNode };

// Custom controls panel
function DiagramControls({ isFullscreen, onToggleFullscreen }: { isFullscreen: boolean; onToggleFullscreen: () => void }) {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [zoom, setZoom] = useState(100);
  const [isPanning, setIsPanning] = useState(false);

  const updateZoom = () => setTimeout(() => setZoom(Math.round(getZoom() * 100)), 220);

  const handleZoomIn = () => { zoomIn({ duration: 200 }); updateZoom(); };
  const handleZoomOut = () => { zoomOut({ duration: 200 }); updateZoom(); };
  const handleFit = () => { fitView({ duration: 300, padding: 0.15 }); updateZoom(); };

  return (
    <Panel position="bottom-left" className="flex items-center gap-1">
      <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg shadow-sm px-2 py-1.5">
        {/* Hand/Pan toggle */}
        <button
          title={isPanning ? "Switch to pointer" : "Switch to hand (pan)"}
          onClick={() => setIsPanning((p) => !p)}
          className={`p-1 rounded transition-colors ${
            isPanning ? "bg-blue-100 text-blue-600" : "text-[#6B7280] hover:bg-gray-100"
          }`}
        >
          {isPanning ? <Move className="w-3.5 h-3.5" /> : <MousePointer2 className="w-3.5 h-3.5" />}
        </button>

        <div className="w-px h-4 bg-[#E5E7EB] mx-0.5" />

        {/* Zoom out */}
        <button
          onClick={handleZoomOut}
          title="Zoom out"
          className="p-1 rounded text-[#6B7280] hover:bg-gray-100 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Zoom % */}
        <span className="text-xs text-[#6B7280] font-mono w-10 text-center select-none">
          {zoom}%
        </span>

        {/* Zoom in */}
        <button
          onClick={handleZoomIn}
          title="Zoom in"
          className="p-1 rounded text-[#6B7280] hover:bg-gray-100 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-[#E5E7EB] mx-0.5" />

        {/* Fit view */}
        <button
          onClick={handleFit}
          title="Fit view"
          className="p-1 rounded text-[#6B7280] hover:bg-gray-100 transition-colors"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fullscreen toggle */}
      <button
        onClick={onToggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        className="p-1.5 bg-white border border-[#E5E7EB] rounded-lg shadow-sm text-[#6B7280] hover:bg-gray-50 transition-colors"
      >
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
    </Panel>
  );
}

interface TableRefDiagramInnerProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

function TableRefDiagramInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  isFullscreen,
  onToggleFullscreen,
}: TableRefDiagramInnerProps) {
  const { fitView } = useReactFlow();

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ duration: 300, padding: 0.15 }), 100);
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
      panOnScroll={false}
      zoomOnScroll={true}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E5E7EB" />
      {isFullscreen && (
        <MiniMap
          nodeStrokeWidth={2}
          zoomable
          pannable
          className="!bg-white !border-[#E5E7EB]"
        />
      )}
      <DiagramControls isFullscreen={isFullscreen} onToggleFullscreen={onToggleFullscreen} />
    </ReactFlow>
  );
}

interface TableReferencesProps {
  tableName: string;
  schema: ParsedSchema;
  onNavigate: (tableName: string) => void;
}

function TableReferencesContent({ tableName, schema }: TableReferencesProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Find all related tables (directly connected via FK)
  const relatedTableNames = useMemo(() => {
    const names = new Set<string>();
    names.add(tableName);
    for (const ref of schema.refs) {
      if (ref.fromTable === tableName) names.add(ref.toTable);
      if (ref.toTable === tableName) names.add(ref.fromTable);
    }
    return names;
  }, [tableName, schema.refs]);

  // Build nodes & edges only for related tables
  const { initialNodes, initialEdges } = useMemo(() => {
    const tables = schema.tables.filter((t) => relatedTableNames.has(t.name));

    // Which fields are FKs?
    const fkFields = new Map<string, Set<string>>();
    for (const ref of schema.refs) {
      if (!fkFields.has(ref.fromTable)) fkFields.set(ref.fromTable, new Set());
      fkFields.get(ref.fromTable)!.add(ref.fromField);
    }

    const nodes: Node[] = tables.map((table) => ({
      id: table.name,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: {
        label: table.name,
        isMain: table.name === tableName,
        fields: table.fields.map((f) => ({
          name: f.name,
          type: f.type,
          pk: f.pk,
          fk: fkFields.get(table.name)?.has(f.name) ?? false,
        })),
      },
    }));

    const edges: Edge[] = schema.refs
      .filter(
        (r) => relatedTableNames.has(r.fromTable) && relatedTableNames.has(r.toTable)
      )
      .map((ref, i) => ({
        id: `ref-${i}`,
        source: ref.fromTable,
        target: ref.toTable,
        type: "smoothstep",
        pathOptions: { borderRadius: 8 },
        animated: false,
        style: { stroke: getEdgeColor(ref.fromTable), strokeWidth: 2 },
        label: `${ref.fromField} → ${ref.toField}`,
        labelStyle: { fontSize: 9, fill: "#6B7280" },
        labelBgStyle: { fill: "white", fillOpacity: 0.85 },
        labelBgPadding: [3, 2] as [number, number],
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: getEdgeColor(ref.fromTable),
        },
      }));

    const layouted = getLayoutedElements(nodes, edges, "LR");
    return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
  }, [tableName, schema, relatedTableNames]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const relatedCount = relatedTableNames.size - 1; // exclude self

  if (relatedCount === 0) return null;

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <span className="text-sm font-semibold text-[#1F2937]">
              Table References — <code className="text-blue-500">{tableName}</code>
            </span>
          </div>
          <div className="flex-1">
            <ReactFlowProvider>
              <TableRefDiagramInner
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                isFullscreen={true}
                onToggleFullscreen={() => setIsFullscreen(false)}
              />
            </ReactFlowProvider>
          </div>
        </div>
      )}

      {/* Inline section */}
      <div className="mt-8">
        <button
          onClick={() => setIsCollapsed((c) => !c)}
          className="flex items-center gap-2 text-sm font-semibold text-[#1F2937] mb-3 hover:text-blue-600 transition-colors"
        >
          <span className={`transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}>▼</span>
          Table references
          <span className="text-xs font-normal text-[#6B7280] ml-1">({relatedCount} related)</span>
        </button>

        {!isCollapsed && (
          <div className="border border-[#E5E7EB] rounded-lg overflow-hidden" style={{ height: 340 }}>
            <ReactFlowProvider>
              <TableRefDiagramInner
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                isFullscreen={false}
                onToggleFullscreen={() => setIsFullscreen(true)}
              />
            </ReactFlowProvider>
          </div>
        )}
      </div>
    </>
  );
}

export default function TableReferences(props: TableReferencesProps) {
  return (
    <ReactFlowProvider>
      <TableReferencesContent {...props} />
    </ReactFlowProvider>
  );
}
