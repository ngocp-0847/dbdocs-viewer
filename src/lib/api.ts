export interface VersionSummary {
  id: number;
  version_name: string;
  created_at: string;
  preview: string;
}

export interface VersionFull {
  id: number;
  version_name: string;
  dbml_content: string;
  created_at: string;
}

export interface FieldChange {
  operation: "added" | "removed" | "modified";
  name: string;
  oldType: string | null;
  newType: string | null;
  details?: string;
}

export interface TableChange {
  type: "table";
  operation: "added" | "removed" | "modified";
  name: string;
  fields: FieldChange[];
}

export interface RefChange {
  type: "ref";
  operation: "added" | "removed";
  description: string;
}

export interface DiffResult {
  summary: { added: number; removed: number; modified: number };
  changes: (TableChange | RefChange)[];
}

// Use BASE_URL prefix so API calls work under sub-paths like /dbdocs/
const BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+$/, "");

export async function fetchVersions(): Promise<VersionSummary[]> {
  const res = await fetch(`${BASE}/versions`);
  if (!res.ok) throw new Error("Failed to fetch versions");
  return res.json();
}

export async function fetchVersion(id: number): Promise<VersionFull> {
  const res = await fetch(`${BASE}/versions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch version");
  return res.json();
}

export async function createVersion(
  dbml: string,
  versionName?: string
): Promise<{ id: number; version_name: string; created_at: string }> {
  const res = await fetch(`${BASE}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dbml, version_name: versionName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to save" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function fetchDiff(
  id: number,
  otherId: number
): Promise<DiffResult> {
  const res = await fetch(`${BASE}/versions/${id}/diff/${otherId}`);
  if (!res.ok) throw new Error("Failed to fetch diff");
  return res.json();
}

export async function renameVersion(
  id: number,
  versionName: string
): Promise<void> {
  const res = await fetch(`${BASE}/versions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version_name: versionName }),
  });
  if (!res.ok) throw new Error("Failed to rename version");
}

export async function deleteVersion(id: number): Promise<void> {
  const res = await fetch(`${BASE}/versions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete version");
}
