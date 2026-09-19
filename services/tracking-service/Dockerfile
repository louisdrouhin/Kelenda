# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo (pas depuis services/tracking-service/),
# pour que packages/shared soit dans le contexte :
#   docker build -f services/tracking-service/Dockerfile -t kelenda-tracking-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/tracking-service/package.json services/tracking-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/tracking-service services/tracking-service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/tracking-service

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S kelenda && adduser -S kelenda -G kelenda
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/services/tracking-service/dist ./services/tracking-service/dist
COPY --from=build /app/services/tracking-service/migrations ./services/tracking-service/migrations
COPY --from=build /app/services/tracking-service/package.json ./services/tracking-service/package.json
USER kelenda
EXPOSE 3003
CMD ["node", "services/tracking-service/dist/index.js"]
