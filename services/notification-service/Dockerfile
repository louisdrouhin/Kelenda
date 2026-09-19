# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo (pas depuis services/notification-service/),
# pour que packages/shared soit dans le contexte :
#   docker build -f services/notification-service/Dockerfile -t kelenda-notification-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/notification-service/package.json services/notification-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/notification-service services/notification-service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/notification-service

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S kelenda && adduser -S kelenda -G kelenda
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=build /app/services/notification-service/migrations ./services/notification-service/migrations
COPY --from=build /app/services/notification-service/package.json ./services/notification-service/package.json
USER kelenda
EXPOSE 3004
CMD ["node", "services/notification-service/dist/index.js"]
