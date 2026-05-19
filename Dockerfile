# ── CountMaster Docker Image ──────────────────────────────────────
#
# Two ways to use this:
#
# Option A (recommended): Pre-build locally, copy dist/ in
#   npm run build
#   docker compose up -d
#
# Option B: Full multi-stage build (requires npm registry access)
#   Uncomment the "build" stage below and the COPY --from=build line
#
# ──────────────────────────────────────────────────────────────────

# --- Uncomment for full multi-stage build (Option B) ---
# FROM node:20-alpine AS build
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm ci --no-audit --no-fund
# COPY . .
# RUN npm run build

# ── Serve static assets via nginx ─────────────────────────────────
FROM nginx:alpine
LABEL maintainer="earmando29"
LABEL description="CountMaster — Blackjack Card Counting Trainer"

RUN rm -rf /usr/share/nginx/html/*

# Option A: copy pre-built dist (default)
COPY dist/ /usr/share/nginx/html/

# Option B: copy from build stage (uncomment if using multi-stage)
# COPY --from=build /app/dist /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
