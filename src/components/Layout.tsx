import { Database, History, Save } from "lucide-react";
import ImportButton from "./ImportButton";

type Tab = "wiki" | "diagram" | "changelog";

interface LayoutProps {
  projectName: string;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onImport: (content: string, filename?: string) => void;
  onSaveVersion: () => void;
  hasSchema: boolean;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function Layout({
  projectName,
  activeTab,
  onTabChange,
  onImport,
  onSaveVersion,
  hasSchema,
  sidebar,
  children,
}: LayoutProps) {
  const tabClass = (tab: Tab) =>
    `px-3 py-1 text-sm font-medium rounded transition-colors ${
      activeTab === tab
        ? "bg-white text-[#1F2937] shadow-sm"
        : "text-[#6B7280] hover:text-[#1F2937]"
    }`;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top navbar */}
      <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-[#1F2937]">DBDocs</span>
          <span className="text-sm text-[#6B7280] ml-2">{projectName}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-[#F7F8FA] rounded-md p-0.5 border border-[#E5E7EB]">
            <button onClick={() => onTabChange("wiki")} className={tabClass("wiki")}>
              Wiki
            </button>
            <button onClick={() => onTabChange("diagram")} className={tabClass("diagram")}>
              Diagram
            </button>
            <button
              onClick={() => onTabChange("changelog")}
              className={`${tabClass("changelog")} flex items-center gap-1`}
            >
              <History className="w-3.5 h-3.5" />
              Changelog
            </button>
          </div>
          <div className="flex items-center gap-2">
            {hasSchema && (
              <button
                onClick={onSaveVersion}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Version
              </button>
            )}
            <ImportButton onImport={onImport} />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab !== "changelog" && sidebar}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
