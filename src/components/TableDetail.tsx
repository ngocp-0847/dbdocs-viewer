import { Table2, ArrowRight } from "lucide-react";
import FieldBadge from "./FieldBadge";
import TableReferences from "./TableReferences";
import type { SchemaTable, SchemaRef, ParsedSchema } from "../types/schema";

interface TableDetailProps {
  table: SchemaTable;
  refs: SchemaRef[];
  schema: ParsedSchema;
  onNavigate: (tableName: string) => void;
}

function getFieldRefs(tableName: string, fieldName: string, refs: SchemaRef[]) {
  const result: { targetTable: string; targetField: string }[] = [];
  for (const r of refs) {
    if (r.fromTable === tableName && r.fromField === fieldName) {
      result.push({ targetTable: r.toTable, targetField: r.toField });
    }
    if (r.toTable === tableName && r.toField === fieldName) {
      result.push({ targetTable: r.fromTable, targetField: r.fromField });
    }
  }
  return result;
}

export default function TableDetail({ table, refs, schema, onNavigate }: TableDetailProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <Table2 className="w-7 h-7 text-blue-500" />
        <h1 className="text-2xl font-bold text-[#1F2937]">{table.name}</h1>
      </div>

      {table.note && (
        <div className="mb-6 p-4 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] whitespace-pre-wrap leading-relaxed">
          {table.note}
        </div>
      )}

      <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <th className="text-left px-4 py-2.5 font-semibold text-[#1F2937]">Name</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#1F2937]">Type</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#1F2937]">Settings</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#1F2937]">References</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#1F2937]">Note</th>
            </tr>
          </thead>
          <tbody>
            {table.fields.map((field) => {
              const fieldRefs = getFieldRefs(table.name, field.name, refs);
              const isFk = fieldRefs.length > 0;

              return (
                <tr key={field.name} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-2.5">
                    <code className="text-xs font-semibold text-[#1F2937]">{field.name}</code>
                  </td>
                  <td className="px-4 py-2.5">
                    <code className="text-xs text-[#6B7280]">{field.type}</code>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {field.pk && <FieldBadge type="pk" />}
                      {isFk && <FieldBadge type="fk" />}
                      {field.notNull && <FieldBadge type="not_null" />}
                      {field.unique && <FieldBadge type="unique" />}
                      {field.defaultValue != null && (
                        <FieldBadge type="default" label={`DEFAULT: ${field.defaultValue}`} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {fieldRefs.map((ref, i) => (
                      <button
                        key={i}
                        onClick={() => onNavigate(ref.targetTable)}
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 hover:underline mr-2"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-mono">
                          {ref.targetTable}.{ref.targetField}
                        </span>
                      </button>
                    ))}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#6B7280] max-w-xs">
                    {field.note && (
                      <span className="line-clamp-2">{field.note}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TableReferences
        tableName={table.name}
        schema={schema}
        onNavigate={onNavigate}
      />
    </div>
  );
}
