import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  fetchVersions,
  fetchVersion,
  fetchDiff,
  renameVersion,
  deleteVersion,
} from "../lib/api";
import type { VersionSummary, DiffResult } from "../lib/api";
import DiffView from "./DiffView";

interface ChangelogProps {
  onImport: (content: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function VersionCard({
  version,
  index,
  previousVersionId,
  onView,
  onRenamed,
  onDeleted,
}: {
  version: VersionSummary;
  index: number;
  previousVersionId: number | null;
  onView: (dbml: string) => void;
  onRenamed: () => void;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(version.version_name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleDiff = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (!previousVersionId) return;
    setExpanded(true);
    if (!diff) {
      setDiffLoading(true);
      try {
        const d = await fetchDiff(version.id, previousVersionId);
        setDiff(d);
      } catch {
        setDiff(null);
      } finally {
        setDiffLoading(false);
      }
    }
  }, [expanded, previousVersionId, diff, version.id]);

  const handleView = async () => {
    setLoading(true);
    try {
      const full = await fetchVersion(version.id);
      onView(full.dbml_content);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    try {
      await renameVersion(version.id, editName);
      setEditing(false);
      onRenamed();
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVersion(version.id);
      onDeleted();
    } catch {
      // ignore
    }
  };

  const versionLabel = `Version ${index + 1}`;

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">
              {versionLabel}
            </span>
            {editing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="text-sm px-1.5 py-0.5 border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            ) : version.version_name ? (
              <span className="text-sm text-gray-500">
                "{version.version_name}"
              </span>
            ) : null}
            {!editing && (
              <button
                onClick={() => {
                  setEditName(version.version_name);
                  setEditing(true);
                }}
                className="text-gray-300 hover:text-gray-500"
                title="Rename"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {timeAgo(version.created_at)}
          </div>
        </div>

        {/* Impact badges */}
        {diff && (
          <div className="flex gap-1.5">
            {diff.summary.added > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded">
                +{diff.summary.added} tables
              </span>
            )}
            {diff.summary.modified > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">
                ~{diff.summary.modified} tables
              </span>
            )}
            {diff.summary.removed > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded">
                -{diff.summary.removed} tables
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleView}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Load this version"
          >
            <Eye className="w-3.5 h-3.5" />
            {loading ? "..." : "View"}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-gray-300 hover:text-red-500 p-1 rounded"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expand diff */}
      {previousVersionId && (
        <button
          onClick={handleToggleDiff}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 border-t border-gray-100 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          Changes vs previous version
        </button>
      )}

      {expanded && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          {diffLoading ? (
            <div className="text-xs text-gray-400 animate-pulse">
              Computing diff...
            </div>
          ) : diff ? (
            <DiffView diff={diff} />
          ) : (
            <div className="text-xs text-gray-400">Failed to load diff</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Changelog({ onImport }: ChangelogProps) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVersions();
      setVersions(data);
    } catch {
      setError("Failed to load versions. Is the API server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Versions are ordered DESC, so index 0 = newest. Previous version for i is i+1.
  const getVersionIndex = (i: number) => versions.length - i;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800">Schema Changelog</h2>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
          {error}
        </div>
      )}

      {loading && versions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
          Loading versions...
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No versions saved yet</p>
          <p className="text-xs mt-1">
            Click "Save Version" in the navbar to save the current schema
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((v, i) => (
            <VersionCard
              key={v.id}
              version={v}
              index={getVersionIndex(i)}
              previousVersionId={i < versions.length - 1 ? versions[i + 1].id : null}
              onView={onImport}
              onRenamed={load}
              onDeleted={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
