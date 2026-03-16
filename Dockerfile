# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Build API ────────────────────────────────────────────────────────
FROM node:20-alpine AS api-builder
WORKDIR /api
COPY server/package*.json ./
RUN npm ci --production=false
COPY server/ .
RUN npm run build

# ── Stage 3: Runtime — nginx + node in one container ─────────────────────────
FROM node:20-alpine AS runtime

# Install nginx + supervisor
RUN apk add --no-cache nginx supervisor

# --- Frontend static files ---
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# --- API server ---
WORKDIR /api
COPY --from=api-builder /api/dist ./dist
COPY server/package*.json ./
RUN npm ci --omit=dev

# --- nginx config ---
COPY nginx.k8s.conf /etc/nginx/http.d/default.conf
# nginx needs this dir
RUN mkdir -p /run/nginx

# --- supervisord config ---
COPY supervisord.conf /etc/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
