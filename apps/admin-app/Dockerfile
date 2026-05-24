# Build context must be the repo root (monorepo)
# docker-compose sets: context: . dockerfile: apps/admin-app/Dockerfile

FROM node:22-alpine

WORKDIR /app

# Copy workspace manifests first — layer-cache npm install
COPY package.json package-lock.json turbo.json ./
COPY packages/types/package.json       ./packages/types/
COPY packages/api-client/package.json  ./packages/api-client/
COPY apps/admin-app/package.json       ./apps/admin-app/

# Install all workspace dependencies
RUN npm install

# Copy source code
COPY packages/ ./packages/
COPY apps/admin-app/ ./apps/admin-app/

EXPOSE 3001

# NEXT_PUBLIC_* vars are injected at runtime in dev mode via docker-compose environment
CMD ["npm", "run", "dev", "--workspace=admin-app"]
