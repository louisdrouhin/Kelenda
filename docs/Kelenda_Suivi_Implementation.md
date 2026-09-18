# Kelenda — Suivi d'implémentation

Ce fichier suit l'avancement réel du code par rapport au plan de `Kelenda_Plan_Developpement.md`. Il est tenu à jour au fil du développement — dernière mise à jour : **2026-09-18**.

Légende : ✅ fait et testé — 🚧 en cours / partiel — ⬜ pas commencé

---

## 1. Fondations du repo — ✅

- Monorepo npm workspaces (`services/*`, `packages/*`), `tsconfig.base.json`, CI/Docker à venir.
- `packages/shared` : enveloppe d'événements NATS, HMAC inter-services (`signInternalRequest`/`verifyInternalRequest`).
- `docker-compose.yml` (Postgres 5 DBs + NATS JetStream) pour le dev local.
- `CLAUDE.md` ajouté pour guider les sessions Claude Code sur ce repo.

## 2. auth-service — ✅ (branche `dev`, mergée depuis `dev-auth-service`)

Tous les endpoints de la doc section 10 sont implémentés et testés manuellement contre une vraie DB Postgres locale (register → login → refresh avec rotation → logout → sessions → workspaces → OAuth → `/internal/users/:id` avec vraie signature HMAC → `/auth/verify` forward-auth).

**Endpoints livrés :**
| Endpoint | Statut |
|---|---|
| `POST /auth/register` | ✅ |
| `POST /auth/login` | ✅ |
| `GET /auth/login/:provider` | ✅ |
| `GET /auth/callback/:provider` | ✅ testé en réel avec Microsoft (voir note ci-dessous) |
| `POST /auth/link/:provider` | ✅ |
| `DELETE /auth/link/:provider` | ✅ |
| `POST /auth/refresh` | ✅ (rotation : l'ancien refresh token est révoqué à chaque usage) |
| `POST /auth/logout` | ✅ |
| `POST /auth/logout-all` | ✅ |
| `GET /auth/me` | ✅ |
| `PATCH /auth/me` | ✅ |
| `GET /auth/sessions` | ✅ |
| `DELETE /auth/sessions/:id` | ✅ |
| `POST /workspaces` | ✅ |
| `GET /workspaces/:id` | ✅ |
| `PATCH /workspaces/:id` | ✅ (protégé `requireAdmin`) |
| `GET /internal/users/:id` | ✅ (HMAC par paire, testé avec signature réelle) |
| `GET /auth/verify` | ✅ (contrat forward-auth Traefik : 200 + headers ou 401) |
| `PATCH /users/:id/role` (panel admin) | ⬜ **à construire** — voir section "Trous connus" |

**Détails techniques livrés :**
- JWT RS256 (`sub`, `workspace_id`, `role`, `jti`), TTL 15 min.
- Refresh tokens opaques, hashés SHA-256 en base, rotation à chaque `/auth/refresh`.
- OAuth Google/Microsoft/GitHub : flow authorization-code générique, config par variables d'env par provider, tokens provider chiffrés AES-256-GCM avant stockage (`identities.access_token_encrypted`/`refresh_token_encrypted`).
- **Auto-création de compte au premier login OAuth** (décision prise en cours de route, différente de la doc initiale "liaison manuelle uniquement") : si l'email du profil OAuth n'existe pas encore, un workspace + user + identity sont créés automatiquement. Si l'email existe déjà (compte password ou autre provider), refus 409 pour éviter une prise de compte silencieuse.
- Rôles `admin`/`member` sur `users` (migration `1700000001000_add_user_role`), embarqués dans le JWT. **Tout nouveau compte démarre `member`** (décision explicite du 2026-09-18, différente d'un choix initial "créateur = admin" qui a été retiré).
- Handler d'erreur JSON global + `express-async-errors` (Express 4 ne catchait pas les rejets de promesses par défaut).
- Migrations `node-pg-migrate`, testées up/down.

**Validé en k3d avec Traefik forward-auth réel** (2026-09-18) — voir détails dans la section 7 ci-dessous.

## 3. calendar-service — ⬜

Pas commencé. Prochaine étape logique selon le plan (cœur du MVP : parsing ICS, CalDAV, détection de créneaux libres, détection de conflits `tstzrange`+GiST).

## 4. finance-service — ⬜

Pas commencé.

## 5. tracking-service + notification-service — ⬜

Pas commencé. Dépend d'un pub/sub NATS fonctionnel de bout en bout.

## 6. Intégration événementielle bout-en-bout — ⬜

Pas commencé.

## 7. Déploiement homelab + sécurité réseau — 🚧 (validation auth-service faite, reste le homelab réel)

**Prérequis "auth-service validé en k3d" rempli** (2026-09-18), sur un cluster k3d local (pas encore le homelab final) :
- Manifests créés dans `infra/k8s/` : `00-namespace.yaml`, `01-postgres.yaml`, `10-auth-service.yaml`, `20-traefik-routes.yaml`.
- `services/auth-service/Dockerfile` créé (template doc section 14, avec deux corrections : ajout de `tsconfig.base.json` manquant du contexte de build, point d'entrée `dist/index.js` au lieu de `dist/main.js` pour matcher le code réel).
- Testé bout-en-bout via Traefik (`http://localhost:8080`, entryPoint `web` HTTP — pas `websecure`/TLS, pas encore configuré) : `register` → `login` → `GET /auth/me` (JWT vérifié par le service lui-même) → forward-auth (401 sans token, 200 + headers injectés avec token valide, confirmé aussi dans les logs Traefik) → `/internal/*` confirmé non exposé publiquement (404, aucune IngressRoute ne le sert).

**Bug trouvé et corrigé dans le manifest** (touche potentiellement les 5 services, pas seulement auth-service) : dans un `Deployment`, la substitution `$(VAR)` façon `DATABASE_URL: "postgresql://user:$(PASSWORD)@host/db"` ne se résout **que si `PASSWORD` est déclarée AVANT `DATABASE_URL`** dans la liste `env`. La doc section 12.4 (et donc 12.5 à 12.8 par le même pattern) déclare `DATABASE_URL` avant le secret qu'elle référence — ça échoue silencieusement (le literal `$(PASSWORD)` est envoyé tel quel à Postgres, qui rejette l'auth sans message clair côté appelant). **À corriger dans les manifests `calendar-service`/`finance-service`/`tracking-service`/`notification-service` quand on les écrira** : mettre le `secretKeyRef` avant la variable qui l'interpole.

**Reste à faire pour cette phase :**
- NetworkPolicies (doc section 12.11) — pas encore appliquées sur ce cluster de test (nécessite Calico, pas Flannel — non vérifié sur ce cluster k3d).
- TLS / entryPoint `websecure` — le test a été fait en HTTP simple (`web`), pas HTTPS.
- Déploiement sur le vrai homelab (K3s réel, pas k3d local) — tout ce qui précède n'a été fait que sur un cluster k3d local éphémère.
- NATS JetStream (doc section 12.10, Helm) — pas encore installé/testé en cluster (nécessaire dès que calendar-service ou un autre service publie des événements).

## 8. Frontend — ⬜

Pas commencé (React + Vite SPA, PWA).

---

## Trous connus / décisions en attente

- **Panel admin** (`PATCH /users/:id/role` ou équivalent) — permettre à un admin de promouvoir/rétrograder un membre de son workspace. Nécessaire maintenant que tout compte démarre `member` : sans ce panel, aucun workspace ne peut avoir d'admin. Backend : endpoint protégé par `requireAdmin` (middleware déjà en place). Frontend : écran dédié, à construire en phase 8.
- **Pas de table de membership multi-users** (`workspace_members` ou équivalent) — le schéma actuel (doc section 9.1) lie un `user` à un seul `workspace_id` fixe. `POST /workspaces` crée un workspace indépendant sans y rattacher automatiquement le créateur. Si Kelenda doit permettre à un utilisateur d'appartenir à plusieurs workspaces, ou un rôle différent par workspace, ça demandera une migration de refonte (colonne `workspace_id` sur `users` → table de jointure).
- **OAuth testé en réel uniquement avec Microsoft** (Google et GitHub ont le même code générique mais n'ont pas été testés avec de vrais credentials).
- **Bug de manifest `$(VAR)`** (voir section 7) à corriger dans les manifests des 4 autres services au moment de leur écriture.
- **NetworkPolicies, TLS, NATS pas encore testés en cluster** (voir section 7, "reste à faire").
