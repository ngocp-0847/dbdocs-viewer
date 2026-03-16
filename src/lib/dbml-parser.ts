import { Parser } from "@dbml/core";
import type { ParsedSchema, SchemaTable, SchemaField, SchemaRef } from "../types/schema";

export function parseDBML(content: string): ParsedSchema {
  const parser = new Parser();
  const db = parser.parse(content, "dbmlv2");
  const exported = db.export();

  const schema = exported.schemas[0];

  const tables: SchemaTable[] = schema.tables.map((t) => {
    const fields: SchemaField[] = t.fields.map((f) => ({
      name: f.name,
      type: typeof f.type === "object" ? f.type.type_name : String(f.type),
      pk: Boolean(f.pk),
      notNull: Boolean(f.not_null),
      unique: Boolean(f.unique),
      defaultValue: f.dbdefault?.value ?? null,
      note: f.note || null,
    }));

    return {
      name: t.name,
      note: t.note || null,
      fields,
    };
  });

  const refs: SchemaRef[] = schema.refs.map((r) => {
    const ep0 = r.endpoints[0];
    const ep1 = r.endpoints[1];
    return {
      fromTable: ep0.tableName,
      fromField: ep0.fieldNames[0],
      toTable: ep1.tableName,
      toField: ep1.fieldNames[0],
      relation: ep0.relation ?? ">",
    };
  });

  const projectName = db.name || "Database Documentation";

  return { projectName, tables, refs };
}
