import express from "express";
import cors from "cors";
import { Parser } from "@dbml/core";
import pool, { migrate } from "./db";
import { computeDiff } from "./diff";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// POST /api/versions — Save a new version
app.post("/api/versions", async (req, res) => {
  try {
    const { dbml, version_name } = req.body;
    if (!dbml || typeof dbml !== "string") {
      res.status(400).json({ error: "dbml field is required" });
      return;
    }

    // Validate DBML
    try {
      const parser = new Parser();
      parser.parse(dbml, "dbmlv2");
    } catch (e) {
      res.status(400).json({
        error: `Invalid DBML: ${e instanceof Error ? e.message : "Parse error"}`,
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO dbdocs.versions (version_name, dbml_content) VALUES ($1, $2) RETURNING id, version_name, created_at`,
      [version_name || "", dbml]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/versions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/versions — List all versions
app.get("/api/versions", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, version_name, created_at, LEFT(dbml_content, 200) as preview
       FROM dbdocs.versions ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/versions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/versions/:id — Get full version
app.get("/api/versions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, version_name, dbml_content, created_at FROM dbdocs.versions WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Version not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/versions/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/versions/:id/diff/:otherId — Compute diff
app.get("/api/versions/:id/diff/:otherId", async (req, res) => {
  try {
    const { id, otherId } = req.params;
    const result = await pool.query(
      `SELECT id, dbml_content FROM dbdocs.versions WHERE id = ANY($1::int[])`,
      [[id, otherId]]
    );

    if (result.rows.length < 2) {
      res.status(404).json({ error: "One or both versions not found" });
      return;
    }

    const oldVersion = result.rows.find((r: any) => r.id === Number(otherId));
    const newVersion = result.rows.find((r: any) => r.id === Number(id));

    if (!oldVersion || !newVersion) {
      res.status(404).json({ error: "Version not found" });
      return;
    }

    const diff = computeDiff(oldVersion.dbml_content, newVersion.dbml_content);
    res.json(diff);
  } catch (err) {
    console.error("GET /api/versions/:id/diff/:otherId error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/versions/:id — Rename version
app.patch("/api/versions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { version_name } = req.body;

    if (version_name === undefined || typeof version_name !== "string") {
      res.status(400).json({ error: "version_name is required" });
      return;
    }

    const result = await pool.query(
      `UPDATE dbdocs.versions SET version_name = $1 WHERE id = $2 RETURNING id, version_name, created_at`,
      [version_name, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Version not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/versions/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/versions/:id — Delete version
app.delete("/api/versions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM dbdocs.versions WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Version not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/versions/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
async function start() {
  try {
    await migrate();
    app.listen(PORT, () => {
      console.log(`dbdocs-api listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
