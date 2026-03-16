import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@postgres:5432/sbi_fpaas",
});

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS dbdocs`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS dbdocs.versions (
        id          SERIAL PRIMARY KEY,
        version_name VARCHAR(100) NOT NULL DEFAULT '',
        dbml_content TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Migration complete: dbdocs schema ready");
  } finally {
    client.release();
  }
}

export default pool;
