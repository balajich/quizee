# Build context must be the repo root (monorepo)
# docker-compose sets: context: . dockerfile: apps/user-app/Dockerfile

FROM node:22-alpine

WORKDIR /app

# Copy workspace manifests first — layer-cache npm install
COPY package.json package-lock.json turbo.json ./
COPY packages/types/package.json       ./packages/types/
COPY packages/api-client/package.json  ./packages/api-client/
COPY apps/user-app/package.json        ./apps/user-app/

# Install all workspace dependencies
RUN npm install

# Copy source code
COPY packages/ ./packages/
COPY apps/user-app/ ./apps/user-app/

EXPOSE 8081

# CI=1 keeps Expo non-interactive (no QR code / interactive prompts)
# EXPO_PUBLIC_* vars are injected at Metro-bundler time via docker-compose environment
ENV CI=1

CMD ["npx", "expo", "start", "--web", "--port", "8081"]
