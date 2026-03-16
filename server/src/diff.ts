import { Parser } from "@dbml/core";

interface FieldInfo {
  name: string;
  type: string;
  pk: boolean;
  notNull: boolean;
  unique: boolean;
  defaultValue: string | null;
}

interface TableInfo {
  name: string;
  fields: FieldInfo[];
}

interface RefInfo {
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
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

function parseSchema(dbml: string): { tables: TableInfo[]; refs: RefInfo[] } {
  const parser = new Parser();
  const db = parser.parse(dbml, "dbmlv2");
  const exported = db.export();
  const schema = exported.schemas[0];

  const tables: TableInfo[] = schema.tables.map((t: any) => ({
    name: t.name,
    fields: t.fields.map((f: any) => ({
      name: f.name,
      type: typeof f.type === "object" ? f.type.type_name : String(f.type),
      pk: Boolean(f.pk),
      notNull: Boolean(f.not_null),
      unique: Boolean(f.unique),
      defaultValue: f.dbdefault?.value ?? null,
    })),
  }));

  const refs: RefInfo[] = schema.refs.map((r: any) => ({
    fromTable: r.endpoints[0].tableName,
    fromField: r.endpoints[0].fieldNames[0],
    toTable: r.endpoints[1].tableName,
    toField: r.endpoints[1].fieldNames[0],
  }));

  return { tables, refs };
}

function diffFields(
  oldFields: FieldInfo[],
  newFields: FieldInfo[]
): FieldChange[] {
  const changes: FieldChange[] = [];
  const oldMap = new Map(oldFields.map((f) => [f.name, f]));
  const newMap = new Map(newFields.map((f) => [f.name, f]));

  for (const [name, newField] of newMap) {
    const oldField = oldMap.get(name);
    if (!oldField) {
      changes.push({
        operation: "added",
        name,
        oldType: null,
        newType: newField.type,
      });
    } else {
      const diffs: string[] = [];
      if (oldField.type !== newField.type) diffs.push(`type: ${oldField.type} → ${newField.type}`);
      if (oldField.pk !== newField.pk) diffs.push(`pk: ${oldField.pk} → ${newField.pk}`);
      if (oldField.notNull !== newField.notNull) diffs.push(`notNull: ${oldField.notNull} → ${newField.notNull}`);
      if (oldField.unique !== newField.unique) diffs.push(`unique: ${oldField.unique} → ${newField.unique}`);
      if (oldField.defaultValue !== newField.defaultValue) diffs.push(`default: ${oldField.defaultValue} → ${newField.defaultValue}`);

      if (diffs.length > 0) {
        changes.push({
          operation: "modified",
          name,
          oldType: oldField.type,
          newType: newField.type,
          details: diffs.join(", "),
        });
      }
    }
  }

  for (const [name, oldField] of oldMap) {
    if (!newMap.has(name)) {
      changes.push({
        operation: "removed",
        name,
        oldType: oldField.type,
        newType: null,
      });
    }
  }

  return changes;
}

export function computeDiff(oldDbml: string, newDbml: string): DiffResult {
  const oldSchema = parseSchema(oldDbml);
  const newSchema = parseSchema(newDbml);

  const changes: (TableChange | RefChange)[] = [];
  let added = 0;
  let removed = 0;
  let modified = 0;

  const oldTableMap = new Map(oldSchema.tables.map((t) => [t.name, t]));
  const newTableMap = new Map(newSchema.tables.map((t) => [t.name, t]));

  // Added tables
  for (const [name, newTable] of newTableMap) {
    if (!oldTableMap.has(name)) {
      added++;
      changes.push({
        type: "table",
        operation: "added",
        name,
        fields: newTable.fields.map((f) => ({
          operation: "added" as const,
          name: f.name,
          oldType: null,
          newType: f.type,
        })),
      });
    }
  }

  // Removed tables
  for (const [name, oldTable] of oldTableMap) {
    if (!newTableMap.has(name)) {
      removed++;
      changes.push({
        type: "table",
        operation: "removed",
        name,
        fields: oldTable.fields.map((f) => ({
          operation: "removed" as const,
          name: f.name,
          oldType: f.type,
          newType: null,
        })),
      });
    }
  }

  // Modified tables
  for (const [name, newTable] of newTableMap) {
    const oldTable = oldTableMap.get(name);
    if (oldTable) {
      const fieldChanges = diffFields(oldTable.fields, newTable.fields);
      if (fieldChanges.length > 0) {
        modified++;
        changes.push({
          type: "table",
          operation: "modified",
          name,
          fields: fieldChanges,
        });
      }
    }
  }

  // Ref changes
  const refKey = (r: RefInfo) => `${r.fromTable}.${r.fromField}->${r.toTable}.${r.toField}`;
  const oldRefSet = new Set(oldSchema.refs.map(refKey));
  const newRefSet = new Set(newSchema.refs.map(refKey));

  for (const ref of newSchema.refs) {
    if (!oldRefSet.has(refKey(ref))) {
      changes.push({
        type: "ref",
        operation: "added",
        description: `${ref.fromTable}.${ref.fromField} → ${ref.toTable}.${ref.toField}`,
      });
    }
  }

  for (const ref of oldSchema.refs) {
    if (!newRefSet.has(refKey(ref))) {
      changes.push({
        type: "ref",
        operation: "removed",
        description: `${ref.fromTable}.${ref.fromField} → ${ref.toTable}.${ref.toField}`,
      });
    }
  }

  return { summary: { added, removed, modified }, changes };
}
