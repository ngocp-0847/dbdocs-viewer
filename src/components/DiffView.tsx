import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Minus, Pen } from "lucide-react";
import type { DiffResult, TableChange, RefChange } from "../lib/api";

interface DiffViewProps {
  diff: DiffResult;
}

function FieldRow({ field }: { field: TableChange["fields"][number] }) {
  const colorMap = {
    added: "bg-green-50 text-green-800",
    removed: "bg-red-50 text-red-800",
    modified: "bg-amber-50 text-amber-800",
  };
  const iconMap = {
    added: <Plus className="w-3 h-3 text-green-600 flex-shrink-0" />,
    removed: <Minus className="w-3 h-3 text-red-600 flex-shrink-0" />,
    modified: <Pen className="w-3 h-3 text-amber-600 flex-shrink-0" />,
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 text-xs font-mono ${colorMap[field.operation]}`}
    >
      {iconMap[field.operation]}
      <span className="font-medium">{field.name}</span>
      {field.newType && (
        <span className="text-gray-500">
          {field.oldType && field.oldType !== field.newType
            ? `${field.oldType} → ${field.newType}`
            : field.newType}
        </span>
      )}
      {field.oldType && !field.newType && (
        <span className="text-gray-500">{field.oldType}</span>
      )}
      {field.details && (
        <span className="text-gray-400 ml-auto text-[10px]">
          {field.details}
        </span>
      )}
    </div>
  );
}

function TableChangeCard({ change }: { change: TableChange }) {
  const [expanded, setExpanded] = useState(true);

  const labelColor = {
    added: "text-green-700 bg-green-100",
    removed: "text-red-700 bg-red-100",
    modified: "text-amber-700 bg-amber-100",
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        <span
          className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded ${labelColor[change.operation]}`}
        >
          {change.operation}
        </span>
        <span className="font-mono font-medium text-gray-800">
          {change.name}
        </span>
        <span className="text-gray-400 text-xs ml-auto">
          {change.fields.length} field{change.fields.length !== 1 ? "s" : ""}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-gray-100">
          {change.fields.map((f) => (
            <FieldRow key={f.name} field={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function RefChangeRow({ change }: { change: RefChange }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono ${
        change.operation === "added"
          ? "bg-green-50 text-green-800"
          : "bg-red-50 text-red-800"
      }`}
    >
      {change.operation === "added" ? (
        <Plus className="w-3 h-3 text-green-600" />
      ) : (
        <Minus className="w-3 h-3 text-red-600" />
      )}
      <span>ref: {change.description}</span>
    </div>
  );
}

export default function DiffView({ diff }: DiffViewProps) {
  const tableChanges = diff.changes.filter(
    (c): c is TableChange => c.type === "table"
  );
  const refChanges = diff.changes.filter(
    (c): c is RefChange => c.type === "ref"
  );

  if (diff.changes.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic py-2">No changes found</div>
    );
  }

  return (
    <div className="space-y-2">
      {tableChanges.map((c) => (
        <TableChangeCard key={c.name} change={c} />
      ))}
      {refChanges.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
            References
          </div>
          {refChanges.map((c) => (
            <RefChangeRow key={c.description} change={c} />
          ))}
        </div>
      )}
    </div>
  );
}
