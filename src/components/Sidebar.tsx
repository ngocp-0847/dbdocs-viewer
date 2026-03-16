import { useState, useMemo } from "react";
import { Search, Table2, ChevronDown, ChevronRight } from "lucide-react";
import type { SchemaTable } from "../types/schema";

interface SidebarProps {
  tables: SchemaTable[];
  selectedTable: string | null;
  onSelectTable: (name: string) => void;
}

export default function Sidebar({ tables, selectedTable, onSelectTable }: SidebarProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return tables;
    const q = search.toLowerCase();
    return tables.filter((t) => t.name.toLowerCase().includes(q));
  }, [tables, search]);

  return (
    <aside className="w-64 min-w-[256px] bg-[#F7F8FA] border-r border-[#E5E7EB] flex flex-col h-full overflow-hidden">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="px-3 pb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Tables ({filtered.length})
        </button>
      </div>

      {!collapsed && (
        <nav className="flex-1 overflow-y-auto px-1 pb-3">
          {filtered.map((table) => (
            <button
              key={table.name}
              onClick={() => onSelectTable(table.name)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedTable === table.name
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Table2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate font-mono text-xs">{table.name}</span>
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
