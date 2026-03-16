import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "./components/Layout";
import Sidebar from "./components/Sidebar";
import TableDetail from "./components/TableDetail";
import ERDiagram from "./components/ERDiagram";
import Changelog from "./components/Changelog";
import SaveVersionModal from "./components/SaveVersionModal";
import { parseDBML } from "./lib/dbml-parser";
import { createVersion } from "./lib/api";
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

type Tab = "wiki" | "diagram" | "changelog";

export default function App() {
  const [schema, setSchema] = useState<ParsedSchema | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("wiki");
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const rawDbmlRef = useRef<string>("");

  // Load demo DBML on first mount
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}FPaaS_dbdiagram.dbml`)
      .then((res) => res.text())
      .then((text) => {
        rawDbmlRef.current = text;
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

  const showSaveToast = useCallback((msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  }, []);

  const handleImport = useCallback((content: string, filename?: string) => {
    try {
      const parsed = parseDBML(content);
      rawDbmlRef.current = content;
      setSchema(parsed);
      const first = parsed.tables[0]?.name ?? null;
      setSelectedTable(first);
      setError(null);

      // Auto-save version after successful import
      const versionName = filename
        ? filename.replace(/\.dbml$/i, "")
        : `Import ${new Date().toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}`;
      createVersion(content, versionName)
        .then(() => showSaveToast(`✓ Version saved: "${versionName}"`))
        .catch(() => {}); // silently fail — user can manually save later
    } catch (e) {
      setError(`Invalid DBML: ${e instanceof Error ? e.message : "Parse error"}`);
      setTimeout(() => setError(null), 5000);
    }
  }, [showSaveToast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result;
          if (typeof text === "string") handleImport(text, file.name);
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

  const handleChangelogImport = useCallback(
    (content: string) => {
      handleImport(content);
      setActiveTab("wiki");
    },
    [handleImport]
  );

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
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
          {saveToast}
        </div>
      )}
      <Layout
        projectName={schema.projectName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onImport={handleImport}
        onSaveVersion={() => setShowSaveModal(true)}
        hasSchema={!!schema}
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
        {activeTab === "changelog" && (
          <Changelog onImport={handleChangelogImport} />
        )}
      </Layout>

      {showSaveModal && (
        <SaveVersionModal
          dbml={rawDbmlRef.current}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => {
            // If currently on changelog tab, it will auto-refresh
          }}
        />
      )}
    </div>
  );
}
