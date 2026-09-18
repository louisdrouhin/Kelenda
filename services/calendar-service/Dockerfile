# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo (pas depuis services/calendar-service/),
# pour que packages/shared soit dans le contexte :
#   docker build -f services/calendar-service/Dockerfile -t kelenda-calendar-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/calendar-service/package.json services/calendar-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/calendar-service services/calendar-service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/calendar-service

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S kelenda && adduser -S kelenda -G kelenda
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/services/calendar-service/dist ./services/calendar-service/dist
COPY --from=build /app/services/calendar-service/migrations ./services/calendar-service/migrations
COPY --from=build /app/services/calendar-service/package.json ./services/calendar-service/package.json
USER kelenda
EXPOSE 3000
CMD ["node", "services/calendar-service/dist/index.js"]
