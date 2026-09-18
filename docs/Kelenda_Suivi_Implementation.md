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

**Validé en local (docker compose), pas encore en k3d/Traefik réel** — cf. section 7.

## 3. calendar-service — ⬜

Pas commencé. Prochaine étape logique selon le plan (cœur du MVP : parsing ICS, CalDAV, détection de créneaux libres, détection de conflits `tstzrange`+GiST).

## 4. finance-service — ⬜

Pas commencé.

## 5. tracking-service + notification-service — ⬜

Pas commencé. Dépend d'un pub/sub NATS fonctionnel de bout en bout.

## 6. Intégration événementielle bout-en-bout — ⬜

Pas commencé.

## 7. Déploiement homelab + sécurité réseau — ⬜

Pas commencé. `auth-service` doit être validé en k3d avec Traefik forward-auth réel avant de considérer cette phase (cf. plan de dev, section 2).

## 8. Frontend — ⬜

Pas commencé (React + Vite SPA, PWA).

---

## Trous connus / décisions en attente

- **Panel admin** (`PATCH /users/:id/role` ou équivalent) — permettre à un admin de promouvoir/rétrograder un membre de son workspace. Nécessaire maintenant que tout compte démarre `member` : sans ce panel, aucun workspace ne peut avoir d'admin. Backend : endpoint protégé par `requireAdmin` (middleware déjà en place). Frontend : écran dédié, à construire en phase 8.
- **Pas de table de membership multi-users** (`workspace_members` ou équivalent) — le schéma actuel (doc section 9.1) lie un `user` à un seul `workspace_id` fixe. `POST /workspaces` crée un workspace indépendant sans y rattacher automatiquement le créateur. Si Kelenda doit permettre à un utilisateur d'appartenir à plusieurs workspaces, ou un rôle différent par workspace, ça demandera une migration de refonte (colonne `workspace_id` sur `users` → table de jointure).
- **`/auth/verify` et `/internal/*` pas testés via Traefik réel** — testés uniquement en appelant le service Express directement en local. La validation k3d (plan de dev section 2) reste à faire.
- **OAuth testé en réel uniquement avec Microsoft** (Google et GitHub ont le même code générique mais n'ont pas été testés avec de vrais credentials).
