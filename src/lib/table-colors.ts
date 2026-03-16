export function getTableColor(tableName: string): string {
  const name = tableName.toLowerCase();
  if (name.startsWith("customer")) return "bg-blue-600";
  if (name.startsWith("partner")) return "bg-violet-600";
  if (name.startsWith("application")) return "bg-orange-600";
  if (name.startsWith("financial") || name.startsWith("fee")) return "bg-emerald-600";
  if (name.startsWith("identity") || name.startsWith("auth")) return "bg-rose-600";
  if (name.startsWith("fpaas_terms") || name.startsWith("terms")) return "bg-amber-600";
  if (name.startsWith("admin") || name.startsWith("organization")) return "bg-slate-600";
  if (["bulletin", "notification", "email", "content", "native"].some((p) => name.startsWith(p)))
    return "bg-cyan-600";
  return "bg-[#1E293B]";
}

export function getEdgeColor(tableName: string): string {
  const name = tableName.toLowerCase();
  if (name.startsWith("customer")) return "#3B82F6";
  if (name.startsWith("partner")) return "#7C3AED";
  if (name.startsWith("application")) return "#EA580C";
  if (name.startsWith("financial") || name.startsWith("fee")) return "#059669";
  if (name.startsWith("identity") || name.startsWith("auth")) return "#E11D48";
  if (name.startsWith("fpaas_terms") || name.startsWith("terms")) return "#D97706";
  if (name.startsWith("admin") || name.startsWith("organization")) return "#475569";
  if (["bulletin", "notification", "email", "content", "native"].some((p) => name.startsWith(p)))
    return "#0891B2";
  return "#7C3AED";
}

/** Inline style hex color for the header background (used in ReactFlow nodes) */
export function getTableHeaderHex(tableName: string): string {
  const name = tableName.toLowerCase();
  if (name.startsWith("customer")) return "#2563EB";
  if (name.startsWith("partner")) return "#7C3AED";
  if (name.startsWith("application")) return "#EA580C";
  if (name.startsWith("financial") || name.startsWith("fee")) return "#059669";
  if (name.startsWith("identity") || name.startsWith("auth")) return "#E11D48";
  if (name.startsWith("fpaas_terms") || name.startsWith("terms")) return "#D97706";
  if (name.startsWith("admin") || name.startsWith("organization")) return "#475569";
  if (["bulletin", "notification", "email", "content", "native"].some((p) => name.startsWith(p)))
    return "#0891B2";
  return "#1E293B";
}

/** Tailwind class for the sidebar dot */
export function getTableDotClass(tableName: string): string {
  const name = tableName.toLowerCase();
  if (name.startsWith("customer")) return "bg-blue-600";
  if (name.startsWith("partner")) return "bg-violet-600";
  if (name.startsWith("application")) return "bg-orange-600";
  if (name.startsWith("financial") || name.startsWith("fee")) return "bg-emerald-600";
  if (name.startsWith("identity") || name.startsWith("auth")) return "bg-rose-600";
  if (name.startsWith("fpaas_terms") || name.startsWith("terms")) return "bg-amber-600";
  if (name.startsWith("admin") || name.startsWith("organization")) return "bg-slate-600";
  if (["bulletin", "notification", "email", "content", "native"].some((p) => name.startsWith(p)))
    return "bg-cyan-600";
  return "bg-slate-800";
}
