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

## 3. calendar-service — 🚧 (A.1/A.2/A.3 + serveur CalDAV faits et testés, A.4/A.5 restants)

Toutes les routes testées manuellement contre une vraie DB Postgres, y compris cross-service (JWT signé par `auth-service`, vérifié par `calendar-service` via la clé publique partagée) et NATS réel (`mission_scheduled` reçu par un vrai subscriber).

**Endpoints livrés :**
| Endpoint | Statut |
|---|---|
| `POST /calendar/sources` | ✅ (`type=interne` bloqué — réservé à la création automatique) |
| `GET /calendar/sources` | ✅ |
| `PATCH /calendar/sources/:id` | ✅ |
| `DELETE /calendar/sources/:id` | ✅ |
| `POST /calendar/sources/:id/sync` | ✅ pour `ics_ecole`/`ics_entreprise` (fetch+parse ICS, upsert par `external_uid`) — `caldav_perso` n'est plus créable via cette route (voir serveur CalDAV ci-dessous) |
| `GET /calendar/events` | ✅ (filtres `from`/`to`/`category`) |
| `GET /calendar/events/:id` | ✅ |
| `GET /calendar/free-slots` | ✅ (`from`/`to`/`min_duration_minutes`/`working_hours_start`/`working_hours_end`) |
| `POST /calendar/free-slots/accept` | ✅ (crée l'événement catégorie `personnel`/source `interne` unique par utilisateur, publie `mission_scheduled` sur NATS) |
| `GET /calendar/conflicts` | ✅ (filtre `status`) |
| `PATCH /calendar/conflicts/:id` | ✅ (`resolved`/`dismissed`) |

**Détails techniques livrés :**
- Migrations : `calendar_sources`, `events` (colonne générée `tstzrange` + index GiST, vérifié avec `EXPLAIN` que Postgres utilise bien l'index), `detected_conflicts`, `commute_estimates` (schéma créé, aucun endpoint ne l'utilise encore — A.5 pas dans le périmètre de cette passe), plus un index unique partiel `(user_id) WHERE type='interne'` (pas dans la doc originale, nécessaire pour garantir "un seul par utilisateur").
- Détection de conflits (A.3) : automatique à chaque sync, compare `ecole`×`entreprise` uniquement (pas `personnel`), idempotente (`ON CONFLICT DO NOTHING` sur `(event_a_id, event_b_id)`).
- Free-slots (A.2) : algorithme testé isolément (fenêtres horaires découpées par jour, soustraction des créneaux occupés, filtre durée minimale) avant intégration aux routes.
- JWT vérifié localement par `calendar-service` (jamais confiance au seul `X-User-Id` Traefik, conforme au CLAUDE.md) — même convention dual-mode `JWT_PUBLIC_KEY`/`JWT_PUBLIC_KEY_PATH` qu'auth-service.
- `Dockerfile` créé (même template qu'auth-service, fix `tsconfig.base.json` inclus dès le départ).

**Validé en k3d avec Traefik forward-auth réel** (2026-09-18) — manifest `infra/k8s/11-calendar-service.yaml`, route `kelenda-calendar` (PathPrefix `/calendar`, protégée forward-auth) dans `20-traefik-routes.yaml`. A fonctionné du premier coup grâce au fix de l'ordre des env vars déjà identifié sur auth-service. Testé : register/login via Traefik, `GET`/`POST /calendar/sources` bloqués sans token (401) et fonctionnels avec token valide (200/201), JWT cross-service vérifié.

### Serveur CalDAV (RFC 4791 + RFC 6578) — ✅ complet, testé via de vraies requêtes HTTP et validé en k3d

Décision explicite (2026-09-18) : `caldav_perso` n'est **pas** un client qui importe en lecture un calendrier externe (symétrique à `ics_ecole`/`ics_entreprise`), mais un **serveur CalDAV que Kelenda héberge** — un vrai client (app Calendrier iPhone/macOS, Google Calendar) s'y connecte et y synchronise ses événements perso. Chantier substantiellement plus lourd que le reste (protocole WebDAV/XML, pas de client réel disponible pour tester — testé avec des requêtes `curl` reproduisant précisément ce qu'enverrait un vrai client : `PROPFIND`/`REPORT`/`PUT`/`DELETE`, Basic Auth, headers `If-Match`/`If-None-Match`).

**Ce qui est livré et testé :**
- **Auth dédiée** : `POST /calendar/caldav/credentials` (JWT) génère un mot de passe CalDAV à usage unique (jamais le mot de passe du compte), Basic Auth vérifié par `calendar-service` lui-même — nécessite une nouvelle paire interne `calendar-service → auth-service` (non prévue dans la doc initiale) pour résoudre l'email/username.
- **Découverte** : `.well-known/caldav` (redirection RFC 6764), principal (`current-user-principal`, `calendar-home-set`), collection `personal` avec `supported-calendar-component-set: VEVENT`.
- **Lecture** : `REPORT calendar-query` avec filtre `time-range` réellement parsé et appliqué (testé exclusion/inclusion), `GET` par événement avec ETag.
- **Écriture** : `PUT` (création/modification selon existence) et `DELETE`, préconditions `If-Match`/`If-None-Match` conformes RFC 4791 §5.3 (testé : 412 sur ETag périmé, 412 sur double-création).
- **Sync incrémentale** : `REPORT sync-collection` (RFC 6578), sync-token = watermark d'un log de changements dédié (`caldav_sync_changes`), testé : sync initiale, delta après création/modification, suppression annoncée en 404, cas limite création+suppression dans la même fenêtre correctement collapsé.
- **Validé en k3d** : nouvelle IngressRoute `kelenda-calendar-caldav` (priorité 100, **sans** `forward-auth` — CalDAV parle Basic Auth, pas Bearer JWT, forward-auth casserait ces requêtes) testée avec `PROPFIND`/`PUT`/`REPORT` réels à travers Traefik.

**Hors périmètre (documenté, pas un oubli) :**
- Pas de support `RRULE` (récurrence), `VALARM` (rappels), `VTIMEZONE` — seuls des VEVENT simples avec horaires UTC.
- Pas de purge de `caldav_sync_changes` (log de changements non borné dans le temps) — TODO noté dans la migration ; tant qu'il n'y a pas de purge, le cas RFC 6578 "token trop ancien → 507" ne se produit jamais.
- Un seul calendrier `personal` par utilisateur (pas de multi-calendrier).

**Pas encore fait :**
- `deadline_approaching` (A.4, notifications progressives) — nécessite un job planifié, pas encore écrit.
- `commute_estimates` / optimisation trajets (A.5) — schéma DB présent, aucune route ni logique.

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
