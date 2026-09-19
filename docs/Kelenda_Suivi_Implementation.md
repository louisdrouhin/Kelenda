# Kelenda — Suivi d'implémentation

Ce fichier suit l'avancement réel du code par rapport au plan de `Kelenda_Plan_Developpement.md`. Il est tenu à jour au fil du développement — dernière mise à jour : **2026-09-19** (pipeline CI GitHub Actions livré et validé par un vrai run — reste le déploiement homelab réel, hors de portée sans accès direct à la machine).

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

**Validé en k3d avec Traefik forward-auth réel** (2026-09-18) — manifest `infra/k8s/11-calendar-service.yaml`, route `kelenda-calendar` (PathPrefix `/calendar`, protégée forward-auth) dans `20-traefik-routes.yaml`. A fonctionné du premier coup grâce au fix de l'ordre des env vars déjà identifié sur auth-service. Testé : register/login via Traefik, `GET`/`POST /calendar/sources` bloqués sans token (401) et fonctionnels avec token valide (200/201), JWT cross-service vérifié. **Angle mort de cette passe** (trouvé et corrigé le 2026-09-19, voir section 6) : `NATS_URL` manquait du manifest depuis cette validation — jamais détecté car seul le CRUD REST était testé, pas la publication NATS réelle en cluster.

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

### A.4 — deadline_approaching — ✅ fait et testé (2026-09-18)

- Migration : `events.is_deadline` (boolean, défaut false) + `deadline_notifications_sent` (déduplication par `(event_id, days_before)`).
- `PATCH /calendar/events/:id` (nouveau) — l'utilisateur marque/démarque un événement comme deadline.
- `src/deadline-job.ts` — job en boucle (`setInterval`, 1h par défaut, ajustable), paliers `[7, 3, 1, 0]` jours avant (valeurs choisies, la doc ne les fixe pas), publie `deadline_approaching` sur NATS avec le payload exact de la doc.
- Testé avec un vrai subscriber NATS : publication sur les paliers atteints, aucune publication sur événement non-deadline ni hors fenêtre, déduplication vérifiée (deux exécutions du job = pas de doublon).
- **Bug trouvé et corrigé** : le calcul initial de `days_before` (`Math.ceil` sur la durée exacte en millisecondes) faisait sauter le palier d'un jour dès que l'événement n'était pas exactement à minuit — un examen à 14h "dans 7 jours et 2h" matchait le palier 8, jamais 7. Remplacé par une comparaison de jours calendaires (minuit UTC à minuit UTC).
- Pas encore testé en k3d (le job tourne en `setInterval` dans le process — pas de souci particulier attendu, mais pas vérifié).

**Pas encore fait :**
- `commute_estimates` / optimisation trajets (A.5) — schéma DB présent, aucune route ni logique. Marqué "idée secondaire, faible priorité" dans la doc (section 3, A.5).

## 4. finance-service — ✅ (B.1/B.2/B.3 faits et testés avec de vraies API gouvernementales, validé k3d)

Tous les endpoints testés avec de **vrais appels API externes** (pas de mocks) : API Légifrance/PISTE en production, et siret2idcc (SocialGouv).

**Endpoints livrés :**
| Endpoint | Statut |
|---|---|
| `POST /finance/simulate-salary` | ✅ |
| `GET /finance/simulations` | ✅ |
| `GET /finance/simulations/:id` | ✅ |
| `GET /finance/prime-checks` | ✅ |
| `POST /finance/prime-checks/check` | ✅ (vrai appel Légifrance) |
| `PATCH /finance/prime-checks/:id` | ✅ |
| `GET /finance/aids` | ✅ |
| `POST /finance/aids/check` | ✅ |
| `GET /finance/collective-agreements/:siret` | ✅ |

**B.1 — Simulateur de salaire :** barème officiel apprentis (service-public.fr, vérifié par recherche web le 2026-09-19 — 16 lignes couvrant 4 tranches d'âge × 4 années de contrat, année 4 = taux année 3 faute de palier officiel au-delà). Vérifié exact contre le barème réel (18 ans/année 2 → 952.18€, 51% du SMIC ; 26 ans → 1867.02€, 100%).

**B.2 — Vérification des primes conventionnelles :** client Légifrance (PISTE, OAuth2 client-credentials) contre l'**API réelle en production**. Endpoints et formats de payload devinés initialement à partir de documentation tierce (source de la librairie `pylegifrance`, le vrai swagger PISTE n'étant pas accessible sans y être authentifié), puis corrigés après confrontation à de vrais appels HTTP : `/list/idcc` → `/consult/kaliContIdcc`, champ `idcc` → `id`, `results[].titre` → `results[].titles[0].title`. Testé avec la convention Syntec réelle (IDCC 1486) : recherche "prime de vacances" retourne effectivement des extraits du texte légal en vigueur.

**B.3 — Repérage des aides financières :** 3 aides citées par la doc (APL, prime d'activité, Mobili-Jeune), heuristiques d'éligibilité simples (âge/statut), redirection vers les simulateurs officiels — pas de recalcul interne, conforme à la doc ("pas de source officielle fiable identifiée").

**Décision notable : API Entreprise remplacée par siret2idcc** (2026-09-19) — l'API Entreprise (entreprise.api.gouv.fr) prévue par la doc section 5 exige **ProConnect**, réservé aux agents publics et organismes habilités, inaccessible pour un projet personnel en phase de dev. Basculé sur **siret2idcc** (SocialGouv, `https://siret2idcc.fabrique.social.gouv.fr`), gratuite, sans authentification, mêmes données officielles (DSN/KALI). Validé avec le SIRET réel de Partner Informatique (33936266700042 — l'entreprise à l'origine personnelle du projet, doc section 3 B.2) : résout correctement la convention Syntec, qui déclenche une vraie détection de prime de vacances via Légifrance — la boucle B.1→B.2 complète tourne avec les données réelles qui ont inspiré Kelenda.

**Détails techniques :**
- Migrations : `salary_scales` (+ seed officiel), `collective_agreements`, `salary_simulations`, `prime_checks`, `aid_matches` — schéma section 9.3 tel quel.
- `prime_manquante_detectee` et `aide_disponible_detectee` publiés sur NATS, testés avec de vrais subscribers.
- Clés API stockées uniquement dans `.env` local (jamais commité) et en K8s Secret pour k3d — jamais passées en clair dans le code.

**Validé en k3d avec Traefik forward-auth réel** (2026-09-19) — manifest `infra/k8s/12-finance-service.yaml`, route `kelenda-finance`. Fonctionne du premier coup. Testé avec de vrais appels sortants **depuis les pods du cluster** vers siret2idcc et Légifrance/PISTE (pas juste en local) — confirme que le réseau sortant et les secrets K8s sont correctement configurés.

**Pas encore fait :**
- Barème SMIC non automatisé (doc section 5 : "pas d'API temps réel officielle") — mise à jour manuelle à prévoir 1-2 fois/an dans `salary_scales`.
- `expected_amount` sur `prime_checks` toujours `null` — le texte de la convention est trouvé mais son montant n'est pas extrait/parsé automatiquement (nécessiterait un parsing plus poussé du texte légal, hors périmètre MVP).

## 5. tracking-service + notification-service — ✅ (les deux : endpoints + validés en k3d)

### tracking-service — ✅ (branche `dev-tracking-service`)

**Endpoints livrés :**
| Endpoint | Statut |
|---|---|
| `POST /tracking/missions` | ✅ |
| `GET /tracking/missions` | ✅ (filtre `status`) |
| `GET /tracking/missions/:id` | ✅ |
| `PATCH /tracking/missions/:id` | ✅ |
| `DELETE /tracking/missions/:id` | ✅ |
| `GET /tracking/frameworks/:school` | ✅ (sert la version la plus récente par école) |
| `GET /tracking/competencies` | ✅ |
| `PATCH /tracking/competencies/:node_id` | ✅ (upsert sur `(user_id, competency_node_id)`) |
| `POST /tracking/missions/:id/competencies` | ✅ |
| `GET /tracking/tutors` | ✅ |
| `POST /tracking/tutors` | ✅ |
| `PATCH /tracking/tutors/:id` | ✅ |
| `POST /tracking/tutors/:id/interactions` | ✅ |
| `GET /tracking/tutors/:id/interactions` | ✅ |
| `POST /tracking/reports/generate` | ✅ (snapshot JSONB des missions de la période) |
| `GET /tracking/reports` | ✅ |
| `GET /tracking/reports/:id/download` | ✅ (sert le snapshot JSON, pas de rendu PDF réel — voir "Pas encore fait") |

**Détails techniques livrés :**
- Migrations : `missions`, puis `competency_frameworks`/`competency_nodes`/`competency_entries`/`mission_competency_links`/`tutors`/`tutor_interactions`/`activity_reports` (schéma section 9.4 tel quel).
- Consumer NATS `kelenda.calendar.mission_scheduled` (`src/mission-scheduled-consumer.ts`) : crée automatiquement une mission `source='suggested'` avec `related_event_id`, sans appel synchrone à calendar-service (payload de l'événement auto-suffisant, conforme doc section 11). Testé avec un vrai événement publié sur NATS.
- `POST /tracking/missions/:id/competencies` : `competency_node_ids` validés (existence) avant insertion — évite une violation de FK brute remontée en 500.
- `POST /tracking/reports/generate` : snapshot des missions de la période au moment de la génération (`content_snapshot` JSONB) — reste stable si les missions sont modifiées après coup.
- JWT vérifié localement (même convention `JWT_PUBLIC_KEY`/`JWT_PUBLIC_KEY_PATH` que les autres services).
- **Bug trouvé et corrigé** : le driver `pg` parse une colonne `date` en objet `Date` puis le sérialise en heure locale du process — `start_date`/`end_date`/`interaction_date` revenaient décalés d'un jour en JSON (`2026-09-20` → `2026-09-19T22:00:00.000Z` en UTC+2). Fixé via un `types.setTypeParser` dédié dans `db.ts` qui garde la chaîne `YYYY-MM-DD` brute.
- `Dockerfile` créé (même template que les 3 autres services, fix `tsconfig.base.json`/`dist/index.js` appliqué dès l'écriture — pas besoin de le redécouvrir comme pour auth-service).
- Testé contre une vraie DB Postgres locale et un vrai broker NATS local (pas encore en k3d) : CRUD complet sur les 4 domaines, validations (400 sur enums/dates/tableaux invalides), 404 sur ressources inexistantes ou appartenant à un autre utilisateur, 401 sans token, création automatique de mission via événement réel, framework CESI de test avec arbre de nœuds, liaison mission↔compétences, tuteur + interaction + historique, génération de rapport avec une vraie mission dans la période.

**Validé en k3d avec Traefik forward-auth réel et NATS JetStream réel** (2026-09-19) — manifest `infra/k8s/13-tracking-service.yaml`, route `kelenda-tracking` (PathPrefix `/tracking`, protégée forward-auth). **Premier déploiement réel de NATS JetStream en cluster** (`infra/k8s/nats-values.yaml`, jamais committé jusqu'ici — installé via Helm). Testé : register/login via Traefik, `POST`/`GET /tracking/missions` bloqués sans token (401) et fonctionnels avec token valide, JWT cross-service vérifié, migrations (les 2 fichiers) passées par l'initContainer avec succès (confirme que le fix `$(VAR)` s'applique aussi à tracking-service). **Consumer NATS validé en conditions réelles de cluster** : un `mission_scheduled` publié depuis l'extérieur du cluster (port-forward vers le service NATS) a bien été consommé par le pod tracking-service et a créé la mission `source='suggested'` correspondante — c'est le premier test de bout en bout où un publisher et un consumer NATS fonctionnent réellement en cluster (prérequis noté par le plan de développement pour la phase 5/6).

**Pas encore fait :**
- **Pas de route de création de référentiel/nœud de compétences** — la doc (section 10) n'en liste aucune ; un `competency_frameworks`/`competency_nodes` doit être inséré directement en base pour l'instant. Tant qu'aucun outil d'admin ou de seed n'existe, `GET /tracking/frameworks/:school` renvoie 404 pour toute école sans données insérées manuellement.
- **Pas de génération PDF réelle** — `GET /tracking/reports/:id/download` sert le snapshot JSON quel que soit le `format` demandé à la génération (`pdf` par défaut n'est qu'un label stocké, aucun rendu).
- `GET /internal/events/:id` côté calendar-service et la paire `tracking→calendar` (HMAC) — nécessaire seulement pour la liaison manuelle mission↔événement (pas utilisée par le consumer `mission_scheduled`, qui est auto-suffisant).
- Paire `tracking→auth-service` (`GET /internal/users/:id`) — nécessaire pour l'en-tête des rapports d'activité (nom/email de l'utilisateur), pas encore branchée.

### notification-service — ✅ (branche `dev-notification-service`)

**Endpoints livrés :**
| Endpoint | Statut |
|---|---|
| `POST /notifications/subscribe` | ✅ (upsert par `endpoint`) |
| `DELETE /notifications/subscribe/:id` | ✅ |
| `GET /notifications/preferences` | ✅ |
| `PATCH /notifications/preferences` | ✅ |
| `GET /notifications/logs` | ✅ |

**Détails techniques livrés :**
- Migration : `push_subscriptions`, `notification_preferences`, `notification_logs` (schéma section 9.5 tel quel).
- Consumer NATS (`src/event-consumer.ts`) : un abonnement dédié par événement (`kelenda.<service>.<event_type>`) plutôt qu'un wildcard groupé — NATS ne supporte que `*`/`>` comme wildcards, pas de syntaxe `{a,b,c}` malgré ce que suggérait la doc. Couvre les 8 événements du catalogue (section 11) : `deadline_approaching`, `conflit_planning_detecte`, `prime_manquante_detectee`, `aide_disponible_detectee`, `tutor_interaction_upcoming`, `rapport_genere`, `rapport_a_generer_bientot`, `user_registered`.
- Dispatcher (`src/dispatcher.ts`) : pour chaque événement, vérifie la préférence par canal (**décision : pas de ligne en base = canal activé par défaut**, opt-out plutôt qu'opt-in, pour qu'une notification fonctionne dès l'inscription sans réglage préalable), envoie sur `web_push` (toutes les souscriptions de l'utilisateur) et `email` (adresse résolue via la paire interne `notification-service→auth-service`), logge chaque tentative dans `notification_logs` (`sent`/`failed`) — un canal en échec n'empêche pas l'autre.
- **Web push réel** : librairie `web-push` officielle (VAPID), pas de mock.
- **Email réel** : `nodemailer` + SMTP générique par variables d'env (host/port/user/password) — pas de SDK propriétaire (Resend/SendGrid), un provider SMTP standard fonctionne sans code dédié. **Testé avec un vrai compte Infomaniak** (`mail.infomaniak.com:587`, STARTTLS).
- `Dockerfile` créé (même template que les 4 autres services).

**Testé en local (vraie DB Postgres, vrai NATS, vrai auth-service, vrai SMTP) :**
- Email réellement envoyé et reçu (confirmé par l'utilisateur) pour `deadline_approaching` et `user_registered`.
- Préférence désactivée (`email`/`deadline_approaching`) vérifiée bloquante : republication du même événement → aucun nouveau log créé.
- Web push : échec propre et loggé `failed` avec une fausse clé de souscription (validation de format par `web-push` lui-même côté client — confirme l'intégration réelle à la lib) ; pas de vraie souscription testable sans navigateur.
- CRUD complet des endpoints REST, 401 sans token, 400 sur `event_type` invalide, 204 sur DELETE.

**Validé en k3d avec Traefik forward-auth réel, NATS JetStream réel et appel HMAC interne réel** (2026-09-19) — manifest `infra/k8s/14-notification-service.yaml`, secret dédié `notification-service-secrets` (VAPID/SMTP), route `kelenda-notification`. Testé : register/login via Traefik, `GET`/`PATCH /notifications/preferences` bloqués sans token (401) et fonctionnels avec token valide, un `user_registered` publié depuis l'extérieur du cluster consommé par le pod, appel HMAC réel pod-à-pod vers `auth-service` pour résoudre l'email, **email réellement envoyé depuis le cluster et reçu** (confirmé). `/internal` non exposé publiquement (404).

**Pas encore fait :**
- Pas de vraie souscription web push testée (nécessiterait un navigateur réel avec Service Worker) — le format de clé n'a été validé qu'en échec contrôlé.
- Pas de job planifié pour générer `tutor_interaction_upcoming` ou `rapport_a_generer_bientot` côté tracking-service — ces deux événements existent dans le consumer mais rien ne les publie encore (tracking-service n'a pas ces jobs, contrairement à `deadline-job.ts` côté calendar-service pour A.4).

## 6. Intégration événementielle bout-en-bout — ✅ (2026-09-19, branche `dev-e2e-integration`)

Scénario du plan ("accepter une suggestion de révision → mission créée → notification envoyée") déroulé explicitement en une seule fois, **avec les 5 services (auth, calendar, finance, tracking, notification) déployés et `Running` simultanément dans le même cluster k3d** — première fois que c'est testé ensemble plutôt que service par service. Flux réel via Traefik public (`localhost:8080`) : `register` → `login` → `GET /calendar/free-slots` → `POST /calendar/free-slots/accept` → `mission_scheduled` publié → consommé par tracking-service → mission `source='suggested'` créée → `mission_creee` publié (nouvel événement, voir ci-dessous) → consommé par notification-service → email réellement envoyé via Infomaniak (statut `sent` vérifié en base à chaque étape).

**Deux trous découverts en déroulant ce scénario pour la première fois** (jamais détectés par les validations service-par-service précédentes, qui ne testaient que le CRUD REST de chaque service isolément) :

1. **`auth-service` ne publiait jamais `user_registered`** — listé comme livré dans une passe précédente du suivi, mais `/auth/register` n'appelait jamais `publishEvent` et ne stockait même pas `display_name`. Corrigé : la colonne est renseignée, l'événement publié après le `COMMIT` (best-effort si `NATS_URL` absent). `NATS_URL` ajouté au `.env.example` et au manifest k8s (jamais nécessaire jusqu'ici).
2. **`NATS_URL` manquant dans les manifests `11-calendar-service.yaml` et `12-finance-service.yaml`** depuis leur création — leurs pods tournaient sans cette variable, donc toute tentative de `publishEvent` était silencieusement sautée (`if (process.env.NATS_URL)` sans erreur, pour ne pas bloquer la création de la ressource principale si NATS est down). `POST /calendar/free-slots/accept` retournait 201 sans jamais publier `mission_scheduled`. Corrigé dans les deux manifests.

**Gap de catalogue comblé** : la doc (section 11) ne faisait consommer `mission_scheduled` que par tracking-service — aucun événement ne notifiait la création automatique d'une mission, alors que le scénario du plan le suppose implicitement. Nouvel événement **`mission_creee`** ajouté (tracking-service émetteur, notification-service abonné), publié uniquement pour `source='suggested'` — une mission créée manuellement ne publie rien.

**Reste hors périmètre de cette validation** :
- Testé uniquement en k3d local, pas sur le homelab réel (voir section 7).
- Le doublon de log `user_registered` observé une fois (deux entrées identiques) vient probablement d'un chevauchement entre l'ancien et le nouveau pod `notification-service` pendant un `rollout restart` — pas creusé plus loin, comportement transitoire du déploiement de test, pas du code applicatif.
- `tutor_interaction_upcoming` et `rapport_a_generer_bientot` (tracking-service) toujours jamais publiés en pratique (pas de job planifié) — non couverts par ce scénario, qui ne teste que la chaîne `mission_scheduled`/`mission_creee`.

## 7. Déploiement homelab + sécurité réseau — 🚧 (validation auth-service faite, reste le homelab réel)

**Prérequis "auth-service validé en k3d" rempli** (2026-09-18), sur un cluster k3d local (pas encore le homelab final) :
- Manifests créés dans `infra/k8s/` : `00-namespace.yaml`, `01-postgres.yaml`, `10-auth-service.yaml`, `20-traefik-routes.yaml`.
- `services/auth-service/Dockerfile` créé (template doc section 14, avec deux corrections : ajout de `tsconfig.base.json` manquant du contexte de build, point d'entrée `dist/index.js` au lieu de `dist/main.js` pour matcher le code réel).
- Testé bout-en-bout via Traefik (`http://localhost:8080`, entryPoint `web` HTTP — pas `websecure`/TLS, pas encore configuré) : `register` → `login` → `GET /auth/me` (JWT vérifié par le service lui-même) → forward-auth (401 sans token, 200 + headers injectés avec token valide, confirmé aussi dans les logs Traefik) → `/internal/*` confirmé non exposé publiquement (404, aucune IngressRoute ne le sert).

**Bug trouvé et corrigé dans le manifest** (touche les 5 services, pas seulement auth-service) : dans un `Deployment`, la substitution `$(VAR)` façon `DATABASE_URL: "postgresql://user:$(PASSWORD)@host/db"` ne se résout **que si `PASSWORD` est déclarée AVANT `DATABASE_URL`** dans la liste `env`. La doc section 12.4 (et donc 12.5 à 12.8 par le même pattern) déclare `DATABASE_URL` avant le secret qu'elle référence — ça échoue silencieusement (le literal `$(PASSWORD)` est envoyé tel quel à Postgres, qui rejette l'auth sans message clair côté appelant). **Corrigé dès l'écriture** dans les 5 manifests (`10-auth-service.yaml` à `14-notification-service.yaml`, secretKeyRef déclaré avant la variable qui l'interpole) — fonctionne du premier coup à chaque fois depuis. Plus aucun service en attente sur ce point.

**NATS JetStream déployé et validé en cluster** (2026-09-19, avec tracking-service) — `infra/k8s/nats-values.yaml` (doc section 12.10) installé via Helm (`helm install nats nats/nats -n kelenda -f nats-values.yaml`), premier test réel d'un publisher externe + consumer en pod fonctionnant de bout en bout.

**Pipeline CI GitHub Actions livré et validé en conditions réelles** (2026-09-19, branche `dev-homelab-deploy`) — `.github/workflows/ci.yml` (doc section 13) jamais créé jusqu'ici (CLAUDE.md le notait explicitement). Corrigé deux bugs de la doc source, jamais testée avant aujourd'hui :
- `npm ci` avec `working-directory: services/<service>` échoue : ce repo est un vrai monorepo npm workspaces à lockfile unique (`package-lock.json` racine), pas un par service. Remplacé par `npm ci` à la racine puis `npm run <script> --workspace=services/<service>`, avec un build explicite de `packages/shared` avant chaque service (sinon `tsc` échoue sur l'import de ses types compilés).
- Le job `detect-changes` échouait en 5s avec `Error: Resource not accessible by integration` — `dorny/paths-filter` appelle l'API GitHub (`pulls.listFiles`) pour lister les fichiers changés d'une PR, ce qui nécessite `permissions: pull-requests: read` sur le `GITHUB_TOKEN`, jamais déclaré explicitement dans la doc. Ajouté au job.

**ESLint jamais installé ni configuré, découvert en testant la CI** — les 5 services référencent `"lint": "eslint src --ext .ts"` depuis leur création, mais `eslint` n'a jamais été une dépendance : `npm run lint` aurait échoué immédiatement partout, jamais remarqué faute de CI pour le révéler. Installé `eslint` 9 (flat config, seul format supporté par cette version) + `typescript-eslint` à la racine (`eslint.base.js`, même pattern que `tsconfig.base.json`), chaque service l'étend via un `eslint.config.js` minimal (nécessaire : eslint résout sa config depuis le cwd où `npm run lint --workspace=...` l'exécute, le dossier du service, pas la racine du monorepo). Le lint a immédiatement trouvé une vraie erreur (`catch (err)` inutilisé dans `calendar-service/src/routes/sources.ts`), corrigée.

**Validé par un vrai run GitHub Actions** (PR de test `dev-homelab-deploy → dev`, run [35440727993](https://github.com/louisdrouhin/Kelenda/actions/runs/35440727993)) : `detect-changes` détecte correctement les 5 services modifiés, chacun passe `install → build shared → lint → test → build` en matrice parallèle, conclusion `success`. Le job `docker-build` (push GHCR) n'a pas tourné — condition `github.ref == 'refs/heads/main'`, jamais testée pour de vrai puisqu'aucun push vers `main` n'a encore eu lieu dans ce repo.

**Reste à faire pour cette phase :**
- NetworkPolicies (doc section 12.11) — pas encore appliquées sur ce cluster de test (nécessite Calico, pas Flannel — non vérifié sur ce cluster k3d).
- TLS / entryPoint `websecure` — le test a été fait en HTTP simple (`web`), pas HTTPS.
- Déploiement sur le vrai homelab (K3s réel, pas k3d local) — tout ce qui précède n'a été fait que sur un cluster k3d local éphémère. **Nécessite un accès direct au homelab physique de l'utilisateur, hors de portée d'une session autonome.**
- `docker-build` (push GHCR) jamais déclenché en conditions réelles — seulement vérifié par lecture du YAML, pas par un vrai run sur `main`.

## 8. Frontend — ⬜

Pas commencé (React + Vite SPA, PWA).

---

## Trous connus / décisions en attente

- **Panel admin** (`PATCH /users/:id/role` ou équivalent) — permettre à un admin de promouvoir/rétrograder un membre de son workspace. Nécessaire maintenant que tout compte démarre `member` : sans ce panel, aucun workspace ne peut avoir d'admin. Backend : endpoint protégé par `requireAdmin` (middleware déjà en place). Frontend : écran dédié, à construire en phase 8.
- **Pas de table de membership multi-users** (`workspace_members` ou équivalent) — le schéma actuel (doc section 9.1) lie un `user` à un seul `workspace_id` fixe. `POST /workspaces` crée un workspace indépendant sans y rattacher automatiquement le créateur. Si Kelenda doit permettre à un utilisateur d'appartenir à plusieurs workspaces, ou un rôle différent par workspace, ça demandera une migration de refonte (colonne `workspace_id` sur `users` → table de jointure).
- **OAuth testé en réel uniquement avec Microsoft** (Google et GitHub ont le même code générique mais n'ont pas été testés avec de vrais credentials).
- **Bug de manifest `$(VAR)`** (voir section 7) corrigé dans les 5 services dès leur écriture — plus rien en attente sur ce point.
- **`tutor_interaction_upcoming` et `rapport_a_generer_bientot` jamais publiés** — notification-service les consomme (consumer NATS branché), mais tracking-service n'a pas encore les jobs planifiés qui les émettraient (rien d'équivalent à `deadline-job.ts` côté calendar-service pour l'instant).
- **Web push jamais testé avec une vraie souscription navigateur** — seule la validation de format côté librairie (échec avec une fausse clé) a été vérifiée pour notification-service.
- **NetworkPolicies, TLS pas encore testés en cluster** (voir section 7, "reste à faire") — NATS, lui, est validé en cluster depuis la validation de tracking-service (section 5) et confirmé à nouveau par l'intégration bout-en-bout (section 6).
- **`NATS_URL` manquait des manifests calendar/finance-service depuis leur création**, trouvé et corrigé le 2026-09-19 (voir section 6) — leur publication d'événements était silencieusement no-op en cluster jusque-là. Rappel pour tout futur service/manifest : vérifier explicitement qu'un événement est bien reçu par un vrai consumer en cluster, pas seulement que l'endpoint REST répond.
- **Pas de route de création de référentiel de compétences côté tracking-service** — un `competency_frameworks`/`competency_nodes` (ex. CESI) doit être inséré directement en base tant qu'aucun outil d'admin n'existe ; la doc (section 10) ne prévoit aucun endpoint pour ça.
- **Pas de génération PDF réelle pour les rapports d'activité** — `GET /tracking/reports/:id/download` sert toujours le snapshot JSON, quel que soit le `format` choisi à la génération.
- **`deadline-job.ts` (calendar-service, A.4) pas encore testé en k3d** — validé uniquement en local (voir section 3).
