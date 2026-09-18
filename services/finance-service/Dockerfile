# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo (pas depuis services/finance-service/),
# pour que packages/shared soit dans le contexte :
#   docker build -f services/finance-service/Dockerfile -t kelenda-finance-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/finance-service/package.json services/finance-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/finance-service services/finance-service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/finance-service

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S kelenda && adduser -S kelenda -G kelenda
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/services/finance-service/dist ./services/finance-service/dist
COPY --from=build /app/services/finance-service/migrations ./services/finance-service/migrations
COPY --from=build /app/services/finance-service/package.json ./services/finance-service/package.json
USER kelenda
EXPOSE 3000
CMD ["node", "services/finance-service/dist/index.js"]
