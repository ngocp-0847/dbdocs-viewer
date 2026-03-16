import { useState, useEffect, useCallback } from "react";
import Layout from "./components/Layout";
import Sidebar from "./components/Sidebar";
import TableDetail from "./components/TableDetail";
import ERDiagram from "./components/ERDiagram";
import { parseDBML } from "./lib/dbml-parser";
import type { ParsedSchema } from "./types/schema";

// Read table name from URL hash: /dbdocs/#table=customer
function getTableFromUrl(): string | null {
  const hash = window.location.hash; // e.g. "#table=customer"
  const match = hash.match(/^#table=(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function setTableInUrl(tableName: string | null) {
  if (tableName) {
    window.history.replaceState(null, "", `#table=${encodeURIComponent(tableName)}`);
  } else {
    window.history.replaceState(null, "", window.location.pathname);
  }
}

export default function App() {
  const [schema, setSchema] = useState<ParsedSchema | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"wiki" | "diagram">("wiki");
  const [error, setError] = useState<string | null>(null);

  // Load demo DBML on first mount
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}FPaaS_dbdiagram.dbml`)
      .then((res) => res.text())
      .then((text) => {
        const parsed = parseDBML(text);
        setSchema(parsed);
        // Restore table from URL, else default to first table
        const urlTable = getTableFromUrl();
        const found = urlTable && parsed.tables.find((t) => t.name === urlTable);
        const initial = found ? urlTable : parsed.tables[0]?.name ?? null;
        setSelectedTable(initial);
        if (initial) setTableInUrl(initial);
      })
      .catch(() => setError("Failed to load demo DBML file."));
  }, []);

  // Sync URL when table changes
  useEffect(() => {
    if (selectedTable) setTableInUrl(selectedTable);
  }, [selectedTable]);

  // Handle browser back/forward
  useEffect(() => {
    const onHashChange = () => {
      const t = getTableFromUrl();
      if (t) { setSelectedTable(t); setActiveTab("wiki"); }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleImport = useCallback((content: string) => {
    try {
      const parsed = parseDBML(content);
      setSchema(parsed);
      const first = parsed.tables[0]?.name ?? null;
      setSelectedTable(first);
      setError(null);
    } catch (e) {
      setError(`Invalid DBML: ${e instanceof Error ? e.message : "Parse error"}`);
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result;
          if (typeof text === "string") handleImport(text);
        };
        reader.readAsText(file);
      }
    },
    [handleImport]
  );

  const handleNavigate = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    setActiveTab("wiki");
  }, []);

  if (!schema) {
    return (
      <div className="h-screen flex items-center justify-center text-[#6B7280]">
        {error ?? "Loading..."}
      </div>
    );
  }

  const currentTable = schema.tables.find((t) => t.name === selectedTable);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="h-screen"
    >
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {error}
        </div>
      )}
      <Layout
        projectName={schema.projectName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onImport={handleImport}
        sidebar={
          <Sidebar
            tables={schema.tables}
            selectedTable={selectedTable}
            onSelectTable={handleNavigate}
          />
        }
      >
        {activeTab === "wiki" && currentTable && (
          <TableDetail
            key={currentTable.name}
            table={currentTable}
            refs={schema.refs}
            schema={schema}
            onNavigate={handleNavigate}
          />
        )}
        {activeTab === "diagram" && <ERDiagram schema={schema} />}
      </Layout>
    </div>
  );
}
