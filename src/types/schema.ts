export interface FieldSetting {
  pk: boolean;
  notNull: boolean;
  unique: boolean;
  defaultValue: string | null;
}

export interface SchemaField {
  name: string;
  type: string;
  pk: boolean;
  notNull: boolean;
  unique: boolean;
  defaultValue: string | null;
  note: string | null;
}

export interface SchemaRef {
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  relation: string; // '>', '<', '-', '<>'
}

export interface SchemaTable {
  name: string;
  note: string | null;
  fields: SchemaField[];
}

export interface ParsedSchema {
  projectName: string;
  tables: SchemaTable[];
  refs: SchemaRef[];
}
