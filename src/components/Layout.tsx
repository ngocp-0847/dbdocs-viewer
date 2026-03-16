import { Database } from "lucide-react";
import ImportButton from "./ImportButton";

interface LayoutProps {
  projectName: string;
  activeTab: "wiki" | "diagram";
  onTabChange: (tab: "wiki" | "diagram") => void;
  onImport: (content: string) => void;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function Layout({
  projectName,
  activeTab,
  onTabChange,
  onImport,
  sidebar,
  children,
}: LayoutProps) {
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
            <button
              onClick={() => onTabChange("wiki")}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                activeTab === "wiki"
                  ? "bg-white text-[#1F2937] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              Wiki
            </button>
            <button
              onClick={() => onTabChange("diagram")}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                activeTab === "diagram"
                  ? "bg-white text-[#1F2937] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              Diagram
            </button>
          </div>
          <ImportButton onImport={onImport} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
