# DBDocs Viewer

An open-source database documentation viewer — import a `.dbml` file and get a beautiful, interactive schema browser similar to [dbdocs.io](https://dbdocs.io).

![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20TypeScript%20%2B%20Vite-blue)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Wiki tab** | Browse every table — fields, types, PK/FK/UNIQUE/NOT NULL badges, notes, clickable FK navigation |
| **Diagram tab** | Interactive ER diagram with dagre auto-layout, domain color-coding, zoom/pan, minimap, fullscreen |
| **Table References** | Embedded mini-ER diagram per table showing directly related tables (collapsible, fullscreen) |
| **Schema Changelog** | Save and compare DBML versions — per-version diff (tables added/removed/modified, field changes) |
| **Import DBML** | Drag-drop or file picker — auto-saves a version on import |
| **URL routing** | `#table=<name>` hash — share/bookmark direct links to any table |
| **Domain colors** | Tables color-coded by domain (customer/partner/application/financial/identity/terms/admin/cms) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (for Changelog feature)

### 1. Clone & install

```bash
git clone https://github.com/ngocp-0847/dbdocs-viewer.git
cd dbdocs-viewer
npm install
```

### 2. Add your DBML file

Copy your `.dbml` file to `public/` and name it `FPaaS_dbdiagram.dbml` (or update the fetch path in `src/App.tsx`):

```bash
cp your-schema.dbml public/FPaaS_dbdiagram.dbml
```

### 3. Start the API server (Changelog feature)

```bash
cd server
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/yourdb npm run dev
```

> The API auto-creates a `dbdocs` schema and `versions` table on startup — it will **never** touch existing tables.

### 4. Start the frontend

```bash
# Back in root directory
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — API is proxied automatically via Vite.

---

## 🐳 Docker (single image)

Frontend + API bundled in one image using supervisord (nginx + Node.js):

```bash
docker build -t dbdocs-viewer .
docker run -p 8080:80 \
  -e DATABASE_URL=postgres://user:pass@host:5432/db \
  dbdocs-viewer
```

Open [http://localhost:8080](http://localhost:8080).

### docker-compose (with local Postgres)

```bash
docker-compose up
```

---

## ☸️ Kubernetes

The `k8s/` directory contains ready-to-use manifests.

### 1. Update image & namespace

Edit `k8s/deployment.yaml` — set your registry image and `DATABASE_URL`:

```yaml
image: your-registry/dbdocs-viewer:latest
env:
  - name: DATABASE_URL
    value: "postgres://user:pass@postgres-service:5432/yourdb"
```

### 2. Deploy

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 3. Expose via Ingress

The app is designed to run at a **sub-path** (e.g. `/dbdocs/`).

If you use NGINX Inc VirtualServer CRD:

```bash
kubectl apply -f k8s/virtualserver-patch.yaml  # edit host/path first
```

Or use `k8s/ingress.yaml` for standard Ingress.

> **Sub-path deploy:** The Vite build uses `base: '/dbdocs/'`. If you deploy at root `/`, change `base` in `vite.config.ts` to `'/'` and rebuild.

---

## 📁 Project Structure

```
├── src/
│   ├── App.tsx                    # Root — schema state, routing, import
│   ├── components/
│   │   ├── Layout.tsx             # Top navbar + sidebar shell
│   │   ├── Sidebar.tsx            # Table tree with search + domain dots
│   │   ├── TableDetail.tsx        # Wiki table view
│   │   ├── TableReferences.tsx    # Mini ER diagram embedded in Wiki
│   │   ├── ERDiagram.tsx          # Full interactive ER diagram
│   │   ├── Changelog.tsx          # Version list with diffs
│   │   ├── DiffView.tsx           # Color-coded diff display
│   │   ├── SaveVersionModal.tsx   # Save version modal
│   │   ├── ImportButton.tsx       # File picker
│   │   └── FieldBadge.tsx         # PK/FK/constraint badges
│   └── lib/
│       ├── dbml-parser.ts         # @dbml/core wrapper → ParsedSchema
│       ├── diagram-layout.ts      # Dagre auto-layout helper
│       ├── table-colors.ts        # Domain-based color system
│       └── api.ts                 # Typed API client for Changelog endpoints
│
├── server/                        # Express API (Changelog backend)
│   └── src/
│       ├── index.ts               # Routes: GET/POST/PATCH/DELETE /api/versions
│       ├── db.ts                  # PostgreSQL pool + auto-migration
│       └── diff.ts                # DBML diff engine
│
├── k8s/
│   ├── deployment.yaml            # K8s Deployment (256Mi memory, supervisord)
│   ├── service.yaml               # ClusterIP Service
│   ├── virtualserver-patch.yaml   # NGINX Inc VirtualServer route
│   └── ingress.yaml               # Standard Ingress (alternative)
│
├── Dockerfile                     # Multi-stage: frontend + api → nginx+node
├── supervisord.conf               # Runs nginx + node in one container
├── nginx.k8s.conf                 # nginx config: /api/ → localhost:3001
└── docker-compose.yml             # Local dev with Postgres
```

---

## 🔌 Changelog API

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/versions` | GET | List all saved versions |
| `/api/versions` | POST | Save a new version `{ dbml, version_name? }` |
| `/api/versions/:id` | GET | Get a version with full DBML content |
| `/api/versions/:id` | PATCH | Rename a version `{ version_name }` |
| `/api/versions/:id` | DELETE | Delete a version |
| `/api/versions/:id/diff/:otherId` | GET | Diff between two versions |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **DBML parsing:** [@dbml/core](https://github.com/holistics/dbml)
- **ER Diagram:** [@xyflow/react](https://reactflow.dev/) (React Flow v12) + dagre layout
- **Icons:** lucide-react
- **Backend:** Express, PostgreSQL (`pg`), TypeScript
- **Container:** nginx + Node.js via supervisord
