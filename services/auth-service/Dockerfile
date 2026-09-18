# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo (pas depuis services/auth-service/),
# pour que packages/shared soit dans le contexte :
#   docker build -f services/auth-service/Dockerfile -t kelenda-auth-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/auth-service/package.json services/auth-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/auth-service services/auth-service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/auth-service

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S kelenda && adduser -S kelenda -G kelenda
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=build /app/services/auth-service/migrations ./services/auth-service/migrations
COPY --from=build /app/services/auth-service/package.json ./services/auth-service/package.json
USER kelenda
EXPOSE 3000
CMD ["node", "services/auth-service/dist/index.js"]
