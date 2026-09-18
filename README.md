# Kelenda

SaaS de gestion de vie pour alternants. Voir `docs/Kelenda_Documentation_Complete.md` pour la documentation complète (architecture, schémas DB, endpoints, événements NATS, manifests K8s) et `docs/Kelenda_Plan_Developpement.md` pour l'ordre des phases de développement.

## Structure du monorepo

- `services/` — microservices Express/TypeScript (`auth-service`, `calendar-service`, `finance-service`, `tracking-service`, `notification-service`)
- `packages/shared` — code partagé entre services (enveloppe d'événement NATS, signature HMAC inter-services)
- `infra/` — manifests Kubernetes, config Helm NATS, scripts de dev
- `docs/` — documentation du projet

## Développement local

```bash
docker compose up -d      # PostgreSQL (une base par service) + NATS JetStream
npm install                # installe les workspaces
npm run build               # build tous les packages/services
```
