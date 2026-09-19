# Kelenda — Suivi du projet

SaaS de gestion de vie pour alternants — synthèse de la réflexion et périmètre fonctionnel détaillé.

**Porteur du projet :** Louis Drouhin (Beta)
**Statut :** phase d'idéation et de validation utilisateur

---

## 1. Origine du projet

L'idée est née d'une tentative de déploiement d'outils webmail self-hosted (Kurrier, puis SnappyMail) pour centraliser des boîtes mail personnelles et professionnelles. Après plusieurs blocages techniques (authentification, restrictions OAuth2 imposées par Microsoft 365 sur les comptes professionnels), le projet a été abandonné au profit d'une réflexion plus large : plutôt que d'adapter un outil existant à ses besoins, construire un outil sur-mesure.

Le point de départ s'est ensuite précisé autour d'un vrai problème personnel : jongler entre le rythme des cours (CESI) et celui de l'alternance (Partner Informatique), avec deux emplois du temps qui ne communiquent jamais entre eux.

---

## 2. Problème identifié (recherche)

Une recherche a permis de confirmer que ce problème dépasse le cas personnel et touche largement la population des alternants/apprentis en France :

- **Gestion du temps entre école et entreprise** — cité comme LE problème n°1 dans la quasi-totalité des témoignages d'alternants trouvés.
- **Procrastination des révisions** — repoussées faute de visibilité sur les créneaux libres, menant à des sessions de révision de dernière minute.
- **Rémunération mal comprise** — barème dépendant de l'âge et de l'année de contrat, changements réglementaires fréquents (charges, exonérations).
- **Droits conventionnels méconnus** — primes prévues par certaines conventions collectives (ex. prime de vacances Syntec) souvent ignorées des alternants.
- **Aides financières sous-utilisées** — APL, prime d'activité, Mobili-Jeune, aides régionales, peu connues ou oubliées.
- **Temps de trajet** — cité comme facteur de rupture de contrat quand trop long, et comme temps mort à valoriser (révision, podcasts).

Aucun outil généraliste existant (Google Agenda, Notion, Trello, Todoist) ne résout ces problèmes de façon automatique ou spécifique au double rythme école/entreprise.

---

## 3. Périmètre fonctionnel détaillé

Cette section recense l'ensemble des fonctionnalités envisagées au fil de la réflexion, avec pour chacune une description concrète, sa justification, et son statut actuel. Aucune priorisation n'est faite ici : l'objectif est d'avoir une carte complète du champ des possibles avant de trancher quoi que ce soit sur le MVP.

### Domaine A — Organisation du temps

**A.1 — Calendrier fusionné**
- *Ce que ça fait :* Import automatique de deux flux ICS (planning école type Hyperplanning/EDT, planning entreprise type Outlook) et affichage en une seule vue jour/semaine/mois. Les événements perso/couple viennent s'ajouter via un calendrier CalDAV dédié.
- *Pourquoi :* Cité comme LE problème n°1 dans la quasi-totalité des témoignages d'alternants recueillis en recherche. Aucun outil généraliste ne le fait automatiquement.
- *Statut :* Piste forte pour le MVP — à confirmer par le sondage.

**A.2 — Détection des créneaux libres + suggestions de révision**
- *Ce que ça fait :* Le système repère les trous disponibles dans la semaine (compte tenu des deux plannings fusionnés) et propose automatiquement quand caser les révisions ou devoirs, en évitant les jours déjà chargés.
- *Pourquoi :* 5 à 8h/semaine en moyenne sont consacrées aux devoirs/révisions en plus des cours et de l'entreprise — mais sans visibilité claire sur quand les placer, ce temps est souvent mal réparti ou repoussé au dernier moment.
- *Statut :* Piste forte pour le MVP — à confirmer par le sondage.

**A.3 — Détection de conflits d'emploi du temps**
- *Ce que ça fait :* Alerte automatique si un événement du planning école chevauche un événement du planning entreprise (ou l'inverse).
- *Pourquoi :* Permet d'anticiper une demande d'aménagement avant que le conflit ne devienne problématique.
- *Statut :* Complémentaire — à évaluer après le cœur du calendrier fusionné.

**A.4 — Notifications progressives avant deadlines/examens**
- *Ce que ça fait :* Rappels envoyés plusieurs jours avant une échéance importante (pas seulement la veille), avec un compte à rebours visuel.
- *Pourquoi :* Les nuits blanches avant examens et le syndrome "tout à la dernière minute" sont cités comme conséquences directes du manque d'anticipation.
- *Statut :* Complémentaire — dépend de la mise en place d'un système de notifications push.

**A.5 — Optimisation des trajets**
- *Ce que ça fait :* Affichage du temps de trajet estimé avant le prochain événement, avec suggestion d'utiliser ce temps mort (podcast, fiches de révision).
- *Pourquoi :* Le temps de trajet est cité à la fois comme facteur de rupture de contrat (quand trop long) et comme temps mort à valoriser.
- *Statut :* Idée secondaire — pertinence à valider, faible priorité technique.

### Domaine B — Rémunération et droits

**B.1 — Simulateur de salaire**
- *Ce que ça fait :* Calcul du salaire minimum légal net/brut selon l'âge, l'année de contrat, le diplôme préparé et la convention collective de l'entreprise (via SIRET, API Entreprise).
- *Pourquoi :* Rémunération jugée insuffisante, citée comme deuxième cause de rupture de contrat d'apprentissage ; barème complexe (âge x année x diplôme) et sujet à des changements réglementaires fréquents (ex. réforme des exonérations de charges, mars 2025).
- *Statut :* Piste forte pour le MVP — à confirmer par le sondage.

**B.2 — Vérification des primes conventionnelles**
- *Ce que ça fait :* Consultation du texte de la convention collective applicable (via API Légifrance / base KALI) pour repérer des primes obligatoires potentiellement dues et non versées (ex. prime de vacances de la convention Syntec).
- *Pourquoi :* Point de départ personnel du projet (question restée ouverte sur le versement de la prime de vacances chez Partner Informatique) — signal que ce type de droit est mal connu, y compris par des alternants dans le secteur IT.
- *Statut :* Piste forte pour le MVP — à confirmer par le sondage.

**B.3 — Repérage des aides financières**
- *Ce que ça fait :* À partir de quelques critères (âge, revenus, ville, statut), liste des aides potentiellement mobilisables (APL, prime d'activité CAF, Mobili-Jeune, aides régionales), avec redirection vers les simulateurs officiels plutôt qu'un recalcul interne.
- *Pourquoi :* Les aides existantes sont explicitement citées comme "peu connues" et sous-utilisées par les alternants dans plusieurs sources.
- *Statut :* Piste forte pour le MVP — à confirmer par le sondage. Pas de source officielle unique identifiée pour automatiser l'éligibilité (voir section 5).

### Domaine C — Suivi de parcours

**C.1 — Générateur de rapport d'activité**
- *Ce que ça fait :* Compilation automatique d'un rapport mensuel/trimestriel à partir de tâches ou missions notées au fil de l'eau par l'alternant, au format attendu par l'école.
- *Pourquoi :* Ce rapport est une obligation quasi universelle en alternance, très souvent rédigé dans l'urgence faute de suivi régulier des missions réalisées.
- *Statut :* Fonctionnalité différenciante forte — nécessite de définir un format d'entrée de données au fil de l'eau (peu de friction pour l'utilisateur).

**C.2 — Suivi de compétences / livret d'apprentissage**
- *Ce que ça fait :* Grille de compétences (type référentiel CESI) mise à jour au fil de l'eau, avec historique des missions rattachées à chaque compétence.
- *Pourquoi :* Les grilles de compétences sont généralement en Excel, complexes et mises à jour seulement en catastrophe avant évaluation.
- *Statut :* Fonctionnalité différenciante — dépend fortement du référentiel de chaque école, donc plus complexe à généraliser.

**C.3 — Suivi tuteur entreprise / tuteur pédagogique**
- *Ce que ça fait :* Contacts et disponibilités des deux tuteurs, rappels avant chaque visite/bilan, historique des échanges pour préparer les bilans.
- *Pourquoi :* Les deux tuteurs sont souvent chacun de leur côté, sans vue d'ensemble côté alternant ; utile aussi si les missions réalisées ne correspondent pas à ce qui était annoncé, pour objectiver et remonter le problème.
- *Statut :* Fonctionnalité complémentaire, priorité plus faible.

### Domaine D — Fonctionnalités transverses / secondaires

**D.1 — Vue partagée avec un proche (couple/famille)**
- *Ce que ça fait :* Accès partagé à certains événements (ex. calendrier couple), sans exposer le détail des plannings cours/entreprise si l'utilisateur souhaite garder ça privé.
- *Pourquoi :* Besoin exprimé au fil de la réflexion personnelle, hors du cadre strict "alternance" — utile pour la rétention/l'usage quotidien au-delà du seul contexte professionnel.
- *Statut :* Idée à garder pour une phase ultérieure, non prioritaire pour valider le problème "alternant".

**D.2 — Widget écran d'accueil / PWA installable**
- *Ce que ça fait :* Interface installable sur iPhone (PWA avec manifest propre) pour un accès direct sans passer par Safari, éventuellement complétée par un widget iOS (via Scriptable) affichant les prochains événements.
- *Pourquoi :* Besoin d'un accès rapide et fluide, identifié comme critère important pour l'adoption quotidienne de l'outil.
- *Statut :* Prérequis technique du frontend plutôt qu'une feature à part — à intégrer dès la conception de l'interface.

**D.3 — Météo / petits extras contextuels**
- *Ce que ça fait :* Affichage de la météo du jour ou d'un compte à rebours vers un événement important, en complément de la vue calendrier.
- *Pourquoi :* Amélioration de confort, sans lien direct avec un problème identifié en recherche.
- *Statut :* Non prioritaire — bonus si le temps de développement le permet.

---

## 4. Périmètre du MVP — en attente de validation

Le choix définitif du périmètre MVP est volontairement mis en attente des résultats du questionnaire (section 7). Cinq fonctionnalités des domaines A et B (A.1, A.2, B.1, B.2, B.3) se sont dégagées comme pistes fortes lors de la réflexion initiale, mais aucune priorisation finale n'est actée.

> La priorisation finale (quelles fonctionnalités entrent dans la v1, dans quel ordre de développement) dépendra directement de ce que révèlera le sondage.

---

## 5. Choix techniques

### Architecture générale

**Décision prise :** architecture en **microservices**, déployée sur **Kubernetes** (K3s envisagé pour le homelab). Choix motivé principalement par un objectif de montée en compétence sur cet écosystème technique, cohérent avec l'orientation DevOps/administration système visée.

Le découpage précis des services a été affiné pour intégrer le domaine C (suivi de parcours), avec un service dédié :

- **auth-service** — comptes utilisateurs, authentification (JWT), workspaces. Base de données dédiée.
- **calendar-service** — fetch/parse des flux ICS, stockage CalDAV perso, détection de créneaux libres, suggestions de révision, détection de conflits, optimisation des trajets (A.1, A.2, A.3, A.5). Base de données dédiée.
- **finance-service** — barèmes SMIC/URSSAF, appels API Légifrance/Entreprise, calcul salaire, vérification primes, repérage des aides (B.1, B.2, B.3). Base de données dédiée.
- **tracking-service** — rapport d'activité, suivi de compétences/livret d'apprentissage, suivi tuteur entreprise/pédagogique (C.1, C.2, C.3). Base de données dédiée.
- **notification-service** — envoi de rappels/notifications (Web Push), déclenché par événements publiés par les autres services via le message broker. Pas de logique métier propre, DB minimale (état des envois).
- **api-gateway** — point d'entrée unique pour le frontend, vérification de token, routage, rate limiting.

Cette segmentation sera affinée une fois le périmètre du MVP confirmé.

> **Point de vigilance :** le principal risque en microservices n'est pas la technologie mais le découpage des frontières entre services (couplage caché, données dupliquées qui divergent). Règle à respecter : une base de données par service, jamais de DB partagée entre deux services. À traiter avec soin au moment de figer la segmentation définitive.

### Communication inter-services (événements)

**Décision prise :** communication asynchrone via un **message broker**, pour découpler les services métier du service de notification (et plus largement, éviter que les services s'appellent directement en synchrone pour tout).

**Broker retenu : NATS + JetStream**, plutôt que RabbitMQ, pour trois raisons :
- Besoin réel limité à du pub/sub d'événements simples (pas de routage complexe type exchanges/bindings) ;
- Empreinte ressources bien plus légère (binaire Go unique) qu'une VM Erlang, adaptée au homelab K3s à ressources contraintes ;
- Cohérence avec l'objectif de montée en compétence cloud-native (NATS est un projet CNCF, pensé Kubernetes-natif dès le départ).
- **Point de vigilance :** NATS "core" ne persiste pas les messages (fire-and-forget) — **JetStream doit être activé** pour garantir la fiabilité des événements (deadlines, primes manquantes, etc.), sinon un message émis pendant qu'un service est down est perdu.

**Format d'événement standardisé (à figer avant développement) :**
```
{
  event_type: string,   // ex: "mission_scheduled", "deadline_approaching"
  version: string,      // versionning du schéma de l'événement
  timestamp: datetime,
  payload: { ... }
}
```

**Pattern de transfert de données — hybride retenu :**
- L'événement porte l'identifiant + les champs strictement nécessaires au traitement immédiat par l'abonné (pas de payload complet dupliqué systématiquement).
- Si le service abonné a besoin de plus de contexte, il rappelle le service émetteur en synchrone via une API interne (ex. `GET /missions/42` sur calendar-service depuis tracking-service).
- Objectif : éviter à la fois la duplication de données à grande échelle (risque de drift) et le sur-couplage réseau (rappel API pour chaque miette d'info).

**À faire avant développement :** lister les événements concrets à faire transiter (ex. `mission_scheduled`, `deadline_approaching`, `prime_manquante_detectee`, `conflit_planning_detecte`...) et figer leur schéma de payload minimal.

### Stack technique des services

**Framework backend : Express pour les 5 services**, plutôt que NestJS ou un mix. Pas de contrainte d'uniformité imposée par l'architecture (chaque microservice est déployé indépendamment, rien n'empêche de mélanger), mais choix assumé de rester sur un seul framework simple pour tout le MVP :
- NestJS apporterait de la structure (DI, décorateurs) et une intégration native avec NATS (`@nestjs/microservices`), mais représente une couche d'abstraction supplémentaire à apprendre alors que beaucoup de nouveauté est déjà absorbée côté infra (K3s, Traefik, NATS, PostgreSQL avancé, signature HMAC, CI/CD) ;
- le bénéfice de mutualisation du câblage NATS entre services s'obtient aussi bien via un module partagé (`packages/shared/nats.ts` — `publishEvent()` / `subscribeToEvent()` encapsulant le client `nats.js` et le format d'enveloppe standard) sans dépendre du framework ;
- Express reste plus simple à déboguer (moins de "magie"), avec une communauté immense.

Rien n'empêche de repartir sur NestJS plus tard pour un service précis si un besoin réel apparaît (ex. `auth-service` si la gestion multi-provider OAuth devient complexe) — décision réversible service par service, pas une contrainte figée pour tout le projet.

**API gateway : Traefik**, plutôt qu'un gateway applicatif codé à la main (Express + proxy middleware). Raisons :
- Traefik est déjà l'ingress controller par défaut de K3s — aucun composant supplémentaire à ajouter à la stack ;
- routage, rate limiting et vérification JWT (via forward-auth vers auth-service) gérés en configuration déclarative plutôt qu'en code applicatif à maintenir ;
- outil largement utilisé en entreprise, cohérent avec l'objectif de montée en compétence DevOps.

### Environnements de développement

Trois environnements distincts, à ne pas confondre :

- **Docker Compose** — boucle de développement quotidienne sur la logique métier d'un service (routes, DB, business logic), avec hot-reload. Ne teste pas Traefik ni les manifests K8s.
- **k3d (ou kind)** — cluster Kubernetes léger local, pour valider régulièrement les manifests (Deployment/Service/Ingress), les règles de routage Traefik et la communication inter-services avant de toucher au homelab. Compromis fidélité/vitesse entre Compose et le vrai cluster.
- **K3s homelab** — environnement cible réel (ressources, réseau, stockage persistant). Réservé à la validation d'incréments fonctionnels complets et à la mise en prod personnelle, pas au dev au jour le jour.

Workflow retenu : Compose pour coder → k3d pour valider l'intégration K8s/Traefik → K3s homelab pour la validation finale et le déploiement.

### Choix de base de données

**Décision prise : PostgreSQL pour tous les services du MVP**, une instance partagée avec une base séparée par service (jamais de tables croisées entre services), plutôt qu'un moteur différent par service (approche polyglotte écartée pour limiter la charge opérationnelle sur le homelab).

PostgreSQL couvre les besoins de chaque service actuel :
- **auth-service** — cas relationnel classique (comptes, tokens, workspaces) ;
- **calendar-service** — les types `tstzrange` + index GiST sont particulièrement adaptés à la détection de chevauchements d'horaires (A.3) ;
- **finance-service** — ACID important pour les calculs de salaire, JSONB pour versionner les barèmes dans le temps ;
- **tracking-service** — JSONB absorbe la variabilité du référentiel de compétences selon l'école, sans schéma rigide ;
- **notification-service** — usage minimal (statut d'envoi, déduplication), aucun moteur dédié nécessaire.

**Extensions possibles si le projet grandit (non nécessaires pour le MVP) :**
- **Redis** — cache de session, rate limiting plus fin que celui de Traefik ;
- **PostGIS** (extension PostgreSQL, pas un moteur à part) — si l'optimisation de trajets (A.5) évolue vers du calcul géospatial en local plutôt qu'un simple appel à une API externe.

Ces ajouts n'impliqueraient pas de remettre en cause les bases existantes — Redis serait un composant d'infra de plus, PostGIS une simple extension à activer.

### Outillage de migration DB

**Décision prise : node-pg-migrate**, plutôt qu'un ORM avec migrations intégrées (Prisma, Drizzle). Raisons :
- Les 5 schémas SQL déjà écrits (section 9) restent utilisables quasiment tels quels, découpés en migrations numérotées — aucune traduction dans un DSL propriétaire ;
- Les fonctionnalités Postgres spécifiques déjà utilisées (index GiST sur `calendar-service`, colonne générée `tstzrange`, contraintes CHECK) sont du SQL brut nativement supporté, alors qu'elles nécessitent des échappatoires SQL manuelles avec Prisma ou Drizzle ;
- Agnostique au framework — reste valable même si un service passe à autre chose qu'Express plus tard.

**Point non couvert par ce choix :** node-pg-migrate gère uniquement le versionnement du schéma, pas les requêtes applicatives du quotidien. Chaque service devra choisir séparément son client de requêtes (driver `pg` brut, ou un query builder léger type Kysely pour du typage TypeScript) — décision indépendante, à faire au moment de l'implémentation de chaque service.

### Sources de données pour le simulateur salaire/droits

- **API Légifrance** (portail PISTE) — accès à la base KALI (textes des conventions collectives), gratuite après inscription, mise à jour quotidienne. **Implémenté et validé en réel (2026-09-19)** — endpoints exacts (`POST /consult/kaliContIdcc`, `POST /search` fond KALI) documentés dans `Kelenda_Suivi_Implementation.md`.
- **API Entreprise** (entreprise.api.gouv.fr) — à partir d'un SIRET, renvoie automatiquement la convention collective applicable. **Remplacée en implémentation (2026-09-19)** par **siret2idcc** (SocialGouv, `https://siret2idcc.fabrique.social.gouv.fr`) : l'API Entreprise exige une authentification ProConnect réservée aux agents publics/organismes habilités, inaccessible pour un projet en phase de dev. siret2idcc est gratuite, sans authentification, mêmes données officielles (DSN/KALI). Détails dans `Kelenda_Suivi_Implementation.md`.
- **Barèmes SMIC/URSSAF** — pas d'API temps réel officielle disponible ; config versionnée et sourcée, mise à jour manuelle 1 à 2 fois par an. **Barème apprentis implémenté** (service-public.fr, migration `1700000001000_seed_salary_scales`).
- **Aides (CAF, région)** — pas de source officielle fiable identifiée pour automatiser l'éligibilité ; prévoir des liens vers les simulateurs officiels existants plutôt qu'un recalcul interne pour le MVP. **Implémenté** avec les 3 aides citées ci-dessus (heuristiques simples + redirection).

Choix assumé d'éviter le scraping de sites tiers non officiels, au profit de sources gouvernementales stables, pour la fiabilité juridique et la pérennité technique.

### Déploiement

- **K3s** envisagé sur le homelab (distribution Kubernetes légère, apprentissage transférable vers un vrai cluster en entreprise).
- Chaque microservice conteneurisé indépendamment, manifests K8s (Deployment, Service, Ingress, ConfigMaps/Secrets) à définir une fois le découpage final arrêté.
- **NATS JetStream** déployé comme composant d'infrastructure partagé du cluster (Helm chart), au même titre que les bases de données par service.

### Dimensionnement des ressources et scalabilité

**Budget alloué : 3-4 vCPU / 5 Go RAM** sur le homelab pour le cluster K3s de ce projet (VM Ubuntu Server headless, sans interface graphique).

**Estimation détaillée (requests, charge légère perso/MVP) :**

| Composant | CPU | RAM |
|---|---|---|
| K3s (control plane + containerd + coredns) | ~300-500m | ~700 Mo-1 Go |
| Traefik | ~100m | ~100 Mo |
| NATS + JetStream | ~100m | ~128 Mo |
| PostgreSQL (une instance, plusieurs bases) | ~250m | ~512 Mo-1 Go |
| 5 services Node (150m × 5, 150 Mo × 5) | ~750m | ~750 Mo |
| OS Ubuntu Server headless | négligeable | ~250 Mo |
| **Total estimé** | **~1,5-1,7 vCPU** | **~2,5-3,2 Go** |

**Verdict : tient largement**, avec ~40-50 % du budget utilisé au repos — de la marge pour les pics (rebuilds, migrations, tests de charge légers).

**Deux points de vigilance :**
- **Pas d'observabilité lourde pour l'instant** — Prometheus + Grafana ajouteraient 500 Mo à 1 Go de plus rien que pour ça. Faisable si ajouté plus tard, mais plus tendu ; à réévaluer le jour où le monitoring devient nécessaire.
- **Le swap doit être désactivé sur le nœud** — c'est une exigence du kubelet, pas une simple recommandation de perf. Donc pas de filet de sécurité en cas de dépassement RAM : au-delà du budget, les pods se font évincer par l'OOM killer plutôt que de swapper.

**Si le projet grandit : passage à plusieurs VMs.** L'architecture n'a pas besoin de changer, K3s gère nativement l'ajout d'un nœud :
- La première VM reste le nœud **server** (control plane). Une deuxième VM rejoint le cluster comme nœud **agent** via `k3s agent --server https://<ip-node1>:6443 --token <token>`.
- **Le réseau overlay (Flannel par défaut) gère la communication entre pods automatiquement**, peu importe sur quel nœud ils tournent — un service sur la VM1 appelle un service sur la VM2 exactement pareil qu'en local, via son nom DNS interne (`calendar-service.kelenda.svc.cluster.local`). Aucun changement de code applicatif nécessaire.
- Ports réseau à ouvrir entre les nœuds : 6443 (API server), 8472/UDP (VXLAN Flannel), 10250 (kubelet).

**Le vrai piège à anticiper : le stockage persistant.** Par défaut, K3s utilise `local-path-provisioner`, qui crée le volume **sur le disque du nœud où tourne le pod**. Si un pod avec état (PostgreSQL, NATS JetStream) est recréé sur l'autre nœud (crash, rééquilibrage), il ne retrouve pas ses données — elles sont restées sur le premier disque. Deux solutions :
- **Épingler les pods avec état à un nœud précis** via `nodeAffinity` — simple, mais perte de la tolérance de panne sur ce nœud pour ce composant précis ;
- **Stockage distribué** (Longhorn, qui réplique les volumes entre nœuds) — plus robuste, mais une brique d'infrastructure de plus à opérer, à réserver au moment où la charge le justifie réellement.

Sur un homelab Proxmox avec plusieurs nœuds physiques, une alternative consiste aussi à pointer vers du stockage Proxmox partagé plutôt que du `local-path`, selon ce que le cluster Proxmox expose déjà.

### Stack frontend

**Décision prise : React + Vite**, plutôt que Next.js ou Vue. Raisons :
- **Le SSR de Next.js n'apporte rien ici** — Kelenda est presque entièrement une app derrière authentification (dashboard, calendrier, missions, simulations), du contenu privé et personnalisé, pas du contenu public à indexer. Le pré-rendu serveur ne change rien : les données sont chargées côté client après vérification du token de toute façon.
- **Coût d'infra évité** — Next.js en SSR nécessite un process Node tournant en continu (un 6ᵉ workload K3s de plus, sur un budget déjà serré de 3-4 vCPU/5 Go). Une SPA Vite compile en fichiers statiques, servables par un simple conteneur nginx léger.
- **PWA plus simple à configurer** avec `vite-plugin-pwa` (référence stable pour manifest + service worker) qu'avec l'écosystème PWA de Next.js, moins mature.
- Entre React et Vue (tous deux compatibles avec ces contraintes), choix de **React** pour sa communauté plus large et son employabilité, malgré quelques décisions annexes supplémentaires à trancher plus tard (routing, state management — pas de standard officiel unique côté React, contrairement à Vue Router/Pinia).

**Reste à définir** (à traiter au fil de l'implémentation) : librairie de routing (probablement React Router), gestion des appels API/cache (ex. TanStack Query), stratégie de stockage du token côté client (cohérente avec le flux d'auth de la section 5 — access token court + refresh), configuration précise du manifest PWA (D.2).

---

## 6. Nom du projet

Une vingtaine de noms ont été explorés et vérifiés (recherche web, conflits de marque/produit connus). La plupart des noms évocateurs courts se sont révélés déjà pris, y compris des approches par métaphore indirecte (mythologie : Janus, Kairos — tous deux déjà utilisés par des produits SaaS existants, dont un concurrent direct pour Kairos).

**Nom retenu : Kelenda**

✅ **Vérification officielle INPI effectuée** (data.inpi.fr, base Entreprises + Marques) : 13 résultats trouvés pour "Kelenda", tous correspondant à des **patronymes de personnes physiques** (dirigeants d'entreprises individuelles dans des secteurs sans rapport : architecture, taxi, soins de beauté, immobilier, conseil). **Aucune marque déposée** sous ce nom (onglet "Marques" : 0 résultat). Le nom est donc considéré comme **validé** pour un dépôt de marque dans les classes logiciel/SaaS (classes 9/42).

**Noms de domaine :**
- `kelenda.fr` — ✅ **Libre**
- `kelenda.com` — ⚠️ Enregistré depuis mars 2018 par **HugeDomains.com** (un des plus gros acteurs mondiaux du domain investing/parking), en vente au prix catalogue affiché à **~3000€**. Vérification WHOIS confirmée (who.is) : le domaine n'a jamais servi à un site actif, aucune activité commerciale réelle sous ce nom — donc aucun conflit de marque, juste un actif spéculatif en stock. Prix généralement négociable en direct auprès de HugeDomains. **Décision reportée** : le `.fr` gratuit suffit pour lancer et valider le projet ; rachat du `.com` à envisager plus tard si le produit rencontre son marché.

### Autres candidats "propres" identifiés (non retenus)

Altigère, Altenor, Chronalt, Novaltern, Manaltis, Dualtis, AltGer, ManAltGer, Aveltis.

---

## 7. Démarche de validation utilisateur

Un questionnaire de validation a été créé (Jotform) et diffusé sur un serveur Discord, afin de recueillir le ressenti d'alternants réels avant d'investir dans le développement.

Le questionnaire couvre :
- Le profil du répondant (alternant actuel, ancien, ou jamais).
- Une question ouverte sur les objectifs d'organisation au quotidien.
- Le plus gros problème vécu avec le double rythme école/entreprise.
- Les outils actuellement utilisés pour gérer son emploi du temps.
- Le niveau de difficulté ressenti pour caser révisions/devoirs.
- La connaissance de ses droits salariaux et conventionnels.
- L'intérêt pour chacune des fonctionnalités envisagées.
- La disposition à payer, et à quel niveau de prix.

**Lien du formulaire :** https://www.jotform.com/build/262585680107057

**Statut :** questionnaire diffusé, en attente des premières réponses.

---

## 8. Prochaines étapes

- [ ] Collecter et analyser les réponses au questionnaire.
- [ ] Sur cette base, arrêter le périmètre du MVP (choix des features prioritaires — voir section 4).
- [ ] Figer le découpage définitif des microservices (voir section 5) — base : auth, calendar, finance, tracking, notification, api-gateway.
- [x] Lister et figer le schéma des événements transitant par NATS JetStream (voir `Kelenda_Evenements_NATS.md`).
- [x] Concevoir les schémas de base de données PostgreSQL par service (voir les fichiers `*-service_schema.sql`).
- [x] Définir tous les endpoints API par service, y compris les routes internes et leur authentification (voir `Kelenda_Endpoints_API.md`).
- [x] Écrire les manifests K8s (Deployment/Service/Ingress/ConfigMap/Secret) pour chaque service + Traefik + NATS + PostgreSQL (voir section 12).
- [x] Écrire la config Traefik déclarative (règles de routage, middleware forward-auth vers `/auth/verify`, rate limiting) (voir section 12.9).
- [x] Choisir l'outillage de migration DB (node-pg-migrate — voir section 5).
- [x] Écrire le pipeline CI (GitHub Actions, build ciblé par service — voir section 13).
- [x] Choisir le framework backend (Express pour les 5 services — voir section 5) et écrire les `Dockerfile` (voir section 14).
- [x] Sécuriser le réseau inter-services : NetworkPolicies + bascule Flannel→Calico (voir section 12.11), vérification JWT locale en filet de sécurité dans chaque service.
- [x] Câbler l'exécution réelle des migrations node-pg-migrate (initContainer par service — voir sections 12.4 à 12.8 et 14).
- [ ] Écrire les fichiers de migration node-pg-migrate proprement dits dans `services/<nom>/migrations/` (adapter les schémas de la section 9 à son format attendu).
- [x] Définir la stack frontend (React + Vite — voir section 5). Reste à trancher : routing, gestion des appels API/cache, PWA/manifest, service worker.
- [ ] Réserver le nom de domaine `kelenda.fr` (libre, gratuit à l'enregistrement).
- [ ] Déposer la marque "Kelenda" à l'INPI (190€ pour 1 classe + 40€/classe supplémentaire, protection 10 ans renouvelable) — **décision : reporté après le lancement**, une fois une vraie traction confirmée. Pas de dépôt tant que le produit n'a pas prouvé son intérêt.
- [ ] Racheter `kelenda.com` plus tard si le produit rencontre son marché (actuellement chez HugeDomains, ~3000€, négociable).
- [ ] Démarrer le développement du MVP.


---

## 9. Schémas de base de données par service


### 9.1 auth-service

```sql
-- ============================================================
-- auth-service — base dédiée (auth_db)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- email insensible à la casse

-- Fonction utilitaire réutilisée pour updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- workspaces
-- ------------------------------------------------------------
CREATE TABLE workspaces (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email         citext NOT NULL UNIQUE,
    display_name  text,
    role          text NOT NULL DEFAULT 'member'
                  CHECK (role IN ('admin', 'member')),
    status        text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended')),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_workspace_id ON users(workspace_id);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

**Rôles (ajouté après la spec initiale, migration `1700000001000_add_user_role`) :** `role` distingue `admin` / `member` au sein d'un workspace. Tout nouveau compte (`register` ou premier login OAuth) démarre en `member` — il n'y a **pas** de promotion automatique en admin. La promotion se fera via un **panel d'administration à construire** (probablement `PATCH /users/:id/role`, protégé par le middleware `requireAdmin` déjà en place côté auth-service, plus l'écran frontend correspondant) — voir le fichier de suivi de projet pour le statut. Tant que ce panel n'existe pas, un premier admin ne peut être créé que manuellement en base.

```sql

-- ------------------------------------------------------------
-- credentials (auth locale — 0..1 par user)
-- ------------------------------------------------------------
CREATE TABLE credentials (
    user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_credentials_updated_at
    BEFORE UPDATE ON credentials
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- identities (providers OAuth — liaison manuelle uniquement)
-- ------------------------------------------------------------
CREATE TABLE identities (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider                text NOT NULL
                            CHECK (provider IN ('google', 'microsoft', 'github')),
    provider_user_id        text NOT NULL,
    -- Tokens chiffrés (chiffrement applicatif recommandé avant insertion,
    -- ex. AES-256-GCM avec clé gérée hors DB / KMS ; bytea = résultat chiffré).
    access_token_encrypted  bytea,
    refresh_token_encrypted bytea,
    token_expires_at        timestamptz,
    linked_at               timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_identities_user_id ON identities(user_id);

-- ------------------------------------------------------------
-- sessions (refresh tokens)
-- ------------------------------------------------------------
CREATE TABLE sessions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash  text NOT NULL,
    device_info         text,
    expires_at          timestamptz NOT NULL,
    revoked_at          timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ------------------------------------------------------------
-- revoked_tokens (blocklist JWT, optionnel — invalidation avant expiration naturelle)
-- ------------------------------------------------------------
CREATE TABLE revoked_tokens (
    jti         uuid PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revoked_at  timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz NOT NULL  -- pour un job de nettoyage périodique
);

```


### 9.2 calendar-service

```sql
-- ============================================================
-- calendar-service — base dédiée (calendar_db)
-- Note : user_id fait référence logique à auth-service.users.id
--        (pas de FK réelle possible entre bases distinctes)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- calendar_sources
-- ------------------------------------------------------------
CREATE TABLE calendar_sources (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               uuid NOT NULL,  -- réf. logique auth-service
    type                  text NOT NULL
                          -- 'interne' : source virtuelle, un seul par utilisateur, pour les
                          -- événements créés par Kelenda lui-même (ex. suggestion de révision
                          -- acceptée) — aucun flux externe, pas de sync associée.
                          CHECK (type IN ('ics_ecole', 'ics_entreprise', 'caldav_perso', 'interne')),
    label                 text,
    url                   text,
    credentials_encrypted bytea,          -- pour CalDAV authentifié
    last_synced_at        timestamptz,
    sync_status           text NOT NULL DEFAULT 'pending'
                          CHECK (sync_status IN ('pending', 'ok', 'error')),
    created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_sources_user_id ON calendar_sources(user_id);
```

**`caldav_perso` — décision d'implémentation (2026-09-18) :** Kelenda **héberge son propre serveur CalDAV** (RFC 4791 + RFC 6578 sync-collection) plutôt que de se connecter en lecture à un calendrier externe (symétrique à `ics_ecole`/`ics_entreprise`) — un vrai client (app Calendrier iPhone/macOS, Google Calendar) s'y connecte et y synchronise ses événements perso. Cette source n'est plus créable manuellement via `POST /calendar/sources` : elle est créée automatiquement au premier accès CalDAV authentifié. Détails complets dans `docs/Kelenda_Suivi_Implementation.md`, section calendar-service.

```sql
-- ------------------------------------------------------------
-- events
-- ------------------------------------------------------------
CREATE TABLE events (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id      uuid NOT NULL REFERENCES calendar_sources(id) ON DELETE CASCADE,
    external_uid   text,                  -- UID ICS, pour dédup au resync
    title          text NOT NULL,
    description    text,
    location       text,
    start_at       timestamptz NOT NULL,
    end_at         timestamptz NOT NULL,
    all_day        boolean NOT NULL DEFAULT false,
    category       text NOT NULL
                   CHECK (category IN ('ecole', 'entreprise', 'personnel')),
    raw_ics_data   jsonb,
    -- colonne générée pour la détection de chevauchements (index GiST)
    -- '[)' (fermé-ouvert) : un événement qui finit à 12h00 et un autre qui commence à 12h00
    -- ne sont PAS considérés en conflit (convention standard Postgres pour les intervalles temporels)
    during         tstzrange GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source_id, external_uid)
);

CREATE INDEX idx_events_source_id ON events(source_id);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_during_gist ON events USING gist (during);

CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- detected_conflicts (persisté avec statut — évite de re-notifier)
-- ------------------------------------------------------------
CREATE TABLE detected_conflicts (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_a_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_b_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status       text NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'resolved', 'dismissed')),
    detected_at  timestamptz NOT NULL DEFAULT now(),
    resolved_at  timestamptz,
    CHECK (event_a_id <> event_b_id),
    UNIQUE (event_a_id, event_b_id)
);

CREATE INDEX idx_detected_conflicts_status ON detected_conflicts(status);

-- ------------------------------------------------------------
-- commute_estimates (cache — évite de rappeler l'API trajet à chaque lecture)
-- ------------------------------------------------------------
CREATE TABLE commute_estimates (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    to_event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    duration_minutes int NOT NULL,
    mode             text NOT NULL DEFAULT 'driving',
    computed_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (from_event_id, to_event_id)
);

```


### 9.3 finance-service

```sql
-- ============================================================
-- finance-service — base dédiée (finance_db)
-- Note : user_id fait référence logique à auth-service.users.id
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- salary_scales (barèmes SMIC/URSSAF — config versionnée dans le temps)
-- ------------------------------------------------------------
CREATE TABLE salary_scales (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    age_min          int NOT NULL,
    age_max          int,
    contract_year    int NOT NULL CHECK (contract_year BETWEEN 1 AND 4),
    diploma_level    text,
    smic_percentage  numeric(5,2),   -- ex: 43.00 = 43% du SMIC
    fixed_amount     numeric(10,2),  -- alternative si montant fixe
    valid_from       date NOT NULL,
    valid_to         date,
    source           text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    CHECK (smic_percentage IS NOT NULL OR fixed_amount IS NOT NULL)
);

CREATE INDEX idx_salary_scales_lookup ON salary_scales(contract_year, age_min, age_max);

-- ------------------------------------------------------------
-- collective_agreements (conventions collectives, via API Légifrance/KALI)
-- ------------------------------------------------------------
CREATE TABLE collective_agreements (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idcc_code   text NOT NULL UNIQUE,
    name        text NOT NULL,
    source_ref  text,
    fetched_at  timestamptz
);

-- ------------------------------------------------------------
-- salary_simulations (historique conservé)
-- ------------------------------------------------------------
CREATE TABLE salary_simulations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL,  -- réf. logique auth-service
    agreement_id    uuid REFERENCES collective_agreements(id),
    input_params    jsonb NOT NULL,  -- age, contract_year, diploma_level, siret...
    computed_gross  numeric(10,2) NOT NULL,
    computed_net    numeric(10,2) NOT NULL,
    computed_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_salary_simulations_user_id ON salary_simulations(user_id);

-- ------------------------------------------------------------
-- prime_checks
-- ------------------------------------------------------------
CREATE TABLE prime_checks (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL,
    agreement_id    uuid NOT NULL REFERENCES collective_agreements(id),
    prime_type      text NOT NULL,  -- ex: 'prime_vacances'
    expected_amount numeric(10,2),
    status          text NOT NULL DEFAULT 'detected'
                    CHECK (status IN ('detected', 'confirmed_missing', 'resolved')),
    detected_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prime_checks_user_id ON prime_checks(user_id);

-- ------------------------------------------------------------
-- aid_matches
-- ------------------------------------------------------------
CREATE TABLE aid_matches (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL,
    input_params     jsonb NOT NULL,  -- âge, revenus, ville, statut fournis pour ce matching
    aid_name         text NOT NULL,  -- APL, prime_activite, mobili_jeune...
    eligibility_hint jsonb,
    redirect_url     text,
    matched_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_aid_matches_user_id ON aid_matches(user_id);

```


### 9.4 tracking-service

```sql
-- ============================================================
-- tracking-service — base dédiée (tracking_db)
-- Note : user_id et related_event_id sont des références logiques
--        (auth-service.users.id et calendar-service.events.id)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- missions
-- ------------------------------------------------------------
CREATE TABLE missions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL,  -- réf. logique auth-service
    title             text NOT NULL,
    description       text,
    start_date        date NOT NULL,
    end_date          date,
    status            text NOT NULL DEFAULT 'in_progress'
                      CHECK (status IN ('in_progress', 'done', 'cancelled')),
    related_event_id  uuid,  -- réf. logique calendar-service.events.id (optionnel)
    source            text NOT NULL DEFAULT 'manual'
                      CHECK (source IN ('manual', 'suggested')),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_missions_user_id ON missions(user_id);

CREATE TRIGGER trg_missions_updated_at
    BEFORE UPDATE ON missions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- competency_frameworks (référentiel par école, ex. CESI)
-- ------------------------------------------------------------
CREATE TABLE competency_frameworks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name text NOT NULL,
    version     text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (school_name, version)
);

-- ------------------------------------------------------------
-- competency_nodes (structure arborescente : domaine > sous-domaine > compétence)
-- ------------------------------------------------------------
CREATE TABLE competency_nodes (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id  uuid NOT NULL REFERENCES competency_frameworks(id) ON DELETE CASCADE,
    parent_id     uuid REFERENCES competency_nodes(id) ON DELETE CASCADE,
    code          text NOT NULL,
    label         text NOT NULL,
    UNIQUE (framework_id, code)
);

CREATE INDEX idx_competency_nodes_parent_id ON competency_nodes(parent_id);

-- ------------------------------------------------------------
-- competency_entries (progression de l'utilisateur)
-- ------------------------------------------------------------
CREATE TABLE competency_entries (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL,
    competency_node_id  uuid NOT NULL REFERENCES competency_nodes(id) ON DELETE CASCADE,
    level_achieved      text,
    last_updated_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, competency_node_id)
);

CREATE INDEX idx_competency_entries_user_id ON competency_entries(user_id);

-- ------------------------------------------------------------
-- mission_competency_links (many-to-many)
-- ------------------------------------------------------------
CREATE TABLE mission_competency_links (
    mission_id          uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    competency_node_id  uuid NOT NULL REFERENCES competency_nodes(id) ON DELETE CASCADE,
    PRIMARY KEY (mission_id, competency_node_id)
);

-- ------------------------------------------------------------
-- tutors
-- ------------------------------------------------------------
CREATE TABLE tutors (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL,
    type                text NOT NULL CHECK (type IN ('entreprise', 'pedagogique')),
    name                text NOT NULL,
    email               text,
    phone               text,
    availability_notes  text
);

CREATE INDEX idx_tutors_user_id ON tutors(user_id);

-- ------------------------------------------------------------
-- tutor_interactions
-- ------------------------------------------------------------
CREATE TABLE tutor_interactions (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id         uuid NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    interaction_date date NOT NULL,
    type             text NOT NULL CHECK (type IN ('visite', 'bilan', 'echange')),
    notes            text,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tutor_interactions_tutor_id ON tutor_interactions(tutor_id);

-- ------------------------------------------------------------
-- activity_reports
-- ------------------------------------------------------------
CREATE TABLE activity_reports (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL,
    period_start      date NOT NULL,
    period_end        date NOT NULL,
    generated_at      timestamptz NOT NULL DEFAULT now(),
    format            text NOT NULL DEFAULT 'pdf',
    content_snapshot  jsonb  -- missions incluses au moment de la génération
);

CREATE INDEX idx_activity_reports_user_id ON activity_reports(user_id);

```


### 9.5 notification-service

```sql
-- ============================================================
-- notification-service — base dédiée (notification_db)
-- Note : user_id fait référence logique à auth-service.users.id
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- push_subscriptions
-- ------------------------------------------------------------
CREATE TABLE push_subscriptions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL,
    endpoint      text NOT NULL UNIQUE,
    p256dh_key    text NOT NULL,
    auth_key      text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    last_used_at  timestamptz
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- ------------------------------------------------------------
-- notification_preferences
-- ------------------------------------------------------------
CREATE TABLE notification_preferences (
    user_id     uuid NOT NULL,
    event_type  text NOT NULL,
    channel     text NOT NULL CHECK (channel IN ('web_push', 'email')),
    enabled     boolean NOT NULL DEFAULT true,
    PRIMARY KEY (user_id, event_type, channel)
);

-- ------------------------------------------------------------
-- notification_logs
-- ------------------------------------------------------------
CREATE TABLE notification_logs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL,
    event_type        text NOT NULL,
    channel           text NOT NULL,
    status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'sent', 'failed')),
    payload_snapshot  jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    sent_at           timestamptz
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);

```


---

## 10. Endpoints API par service


Convention : les endpoints exposés au frontend passent par l'**api-gateway** (Traefik), qui vérifie le JWT avant de router. Les endpoints marqués **[interne]** ne sont jamais exposés publiquement — ils sont appelés service à service (pattern hybride événement fin + rappel API défini en section 5 du suivi de projet).

Chaque service expose en plus un `GET /health` (sans auth, aucune logique métier — juste utilisé par les probes `readiness`/`liveness` de Kubernetes, voir `infra/k8s/`). Non listé dans les tableaux ci-dessous pour ne pas alourdir, et non routé via l'api-gateway.

---

### auth-service

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| POST | `/auth/register` | Créer un compte (email + mot de passe) | Non |
| POST | `/auth/login` | Connexion email/mot de passe | Non |
| GET | `/auth/login/:provider` | Initier une connexion OAuth (redirect) | Non |
| GET | `/auth/callback/:provider` | Callback OAuth, crée session + JWT | Non |
| POST | `/auth/link/:provider` | Lier un provider à un compte déjà connecté (liaison manuelle) | Oui |
| DELETE | `/auth/link/:provider` | Délier un provider | Oui |
| POST | `/auth/refresh` | Renouveler l'access token via le refresh token | Non (refresh token) |
| POST | `/auth/logout` | Révoquer la session courante | Oui |
| POST | `/auth/logout-all` | Révoquer toutes les sessions actives | Oui |
| GET | `/auth/me` | Infos du compte courant | Oui |
| PATCH | `/auth/me` | Modifier son profil | Oui |
| GET | `/auth/sessions` | Lister les sessions actives | Oui |
| DELETE | `/auth/sessions/:id` | Révoquer une session précise | Oui |
| POST | `/workspaces` | Créer un workspace | Oui |
| GET | `/workspaces/:id` | Détail d'un workspace | Oui |
| PATCH | `/workspaces/:id` | Modifier un workspace | Oui |
| GET | `/internal/users/:id` | **[interne]** Récupérer les infos d'un utilisateur | Service-to-service |
| GET | `/auth/verify` | **[gateway uniquement]** Vérifie la signature du JWT, renvoie 200 + `X-User-Id`/`X-Workspace-Id` ou 401 — appelé par le middleware forward-auth de Traefik | Appelant : Traefik uniquement |
| PATCH | `/users/:id/role` | **[à construire]** Panel admin — promouvoir/rétrograder un utilisateur (`admin`/`member`) au sein de son workspace | Oui, `requireAdmin` |

*Tous les endpoints ci-dessus sont implémentés dans `services/auth-service` sauf `PATCH /users/:id/role`, marqué **[à construire]** — voir `docs/Kelenda_Suivi_Implementation.md` pour le statut à jour.*

---

### calendar-service

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| POST | `/calendar/sources` | Ajouter une source (ICS ou CalDAV) | Oui |
| GET | `/calendar/sources` | Lister les sources de l'utilisateur | Oui |
| PATCH | `/calendar/sources/:id` | Modifier une source | Oui |
| DELETE | `/calendar/sources/:id` | Supprimer une source | Oui |
| POST | `/calendar/sources/:id/sync` | Forcer une resynchronisation | Oui |
| GET | `/calendar/events` | Lister les événements (filtrable par période/catégorie) | Oui |
| GET | `/calendar/events/:id` | Détail d'un événement | Oui |
| GET | `/calendar/free-slots` | Calculer les créneaux libres sur une période | Oui |
| POST | `/calendar/free-slots/accept` | Accepter une suggestion de révision (crée l'événement, catégorie `personnel`, source `interne` ; publie `mission_scheduled`) | Oui |
| GET | `/calendar/conflicts` | Lister les conflits détectés (filtrable par statut) | Oui |
| PATCH | `/calendar/conflicts/:id` | Changer le statut d'un conflit (résolu/ignoré) | Oui |
| GET | `/calendar/commute` | Estimation de trajet entre deux événements | Oui |
| GET | `/internal/events/:id` | **[interne]** Détail complet d'un événement | Service-to-service |
| PATCH | `/calendar/events/:id` | **[ajouté, hors doc initiale]** Marquer/démarquer un événement comme deadline (A.4, `is_deadline`) | Oui |
| POST/GET/DELETE | `/calendar/caldav/*`, `PROPFIND`/`REPORT`/`PUT`/`DELETE` | **[ajouté, hors doc initiale]** Serveur CalDAV complet (RFC 4791 + RFC 6578) — voir note sous `calendar_sources` (section 9.2) | Basic Auth dédiée |

*`GET /calendar/commute` (A.5) et `GET /internal/events/:id` (paire `tracking→calendar`) ne sont pas encore implémentés — voir `Kelenda_Suivi_Implementation.md`.*

---

### finance-service

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| POST | `/finance/simulate-salary` | Lancer une simulation de salaire | Oui |
| GET | `/finance/simulations` | Historique des simulations | Oui |
| GET | `/finance/simulations/:id` | Détail d'une simulation | Oui |
| GET | `/finance/prime-checks` | Lister les vérifications de primes | Oui |
| POST | `/finance/prime-checks/check` | Déclencher une vérification pour une convention | Oui |
| PATCH | `/finance/prime-checks/:id` | Mettre à jour le statut (confirmé manquant/résolu) | Oui |
| GET | `/finance/aids` | Lister les aides potentielles matchées | Oui |
| POST | `/finance/aids/check` | Déclencher un matching d'aides à partir de critères (âge, revenus, ville, statut) | Oui |
| GET | `/finance/collective-agreements/:siret` | Convention applicable (proxy API Entreprise) | Oui |

---

### tracking-service

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| POST | `/tracking/missions` | Créer une mission | Oui |
| GET | `/tracking/missions` | Lister les missions | Oui |
| GET | `/tracking/missions/:id` | Détail d'une mission | Oui |
| PATCH | `/tracking/missions/:id` | Modifier une mission | Oui |
| DELETE | `/tracking/missions/:id` | Supprimer une mission | Oui |
| GET | `/tracking/frameworks/:school` | Récupérer le référentiel de compétences | Oui |
| GET | `/tracking/competencies` | Progression de l'utilisateur sur son référentiel | Oui |
| PATCH | `/tracking/competencies/:node_id` | Mettre à jour son niveau sur une compétence | Oui |
| POST | `/tracking/missions/:id/competencies` | Lier une mission à des compétences | Oui |
| GET | `/tracking/tutors` | Lister les tuteurs | Oui |
| POST | `/tracking/tutors` | Ajouter un tuteur | Oui |
| PATCH | `/tracking/tutors/:id` | Modifier un tuteur | Oui |
| POST | `/tracking/tutors/:id/interactions` | Ajouter un échange/bilan | Oui |
| GET | `/tracking/tutors/:id/interactions` | Historique des échanges avec un tuteur | Oui |
| POST | `/tracking/reports/generate` | Générer un rapport d'activité (période) | Oui |
| GET | `/tracking/reports` | Lister les rapports générés | Oui |
| GET | `/tracking/reports/:id/download` | Télécharger un rapport | Oui |

*(Pas d'endpoint interne exposé par tracking-service pour l'instant — aucun consommateur identifié dans les paires ci-dessous. À ajouter avec sa paire de secret dédiée si un besoin réel apparaît.)*

---

### notification-service

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| POST | `/notifications/subscribe` | Enregistrer un abonnement push (endpoint + clés) | Oui |
| DELETE | `/notifications/subscribe/:id` | Désinscrire un abonnement push | Oui |
| GET | `/notifications/preferences` | Lister les préférences de notification | Oui |
| PATCH | `/notifications/preferences` | Modifier une préférence (event_type/canal/activé) | Oui |
| GET | `/notifications/logs` | Historique des notifications envoyées | Oui |

Ce service n'expose pas d'endpoint interne : il ne fait que consommer les événements du broker (NATS JetStream) publiés par les autres services, il n'est jamais appelé en synchrone par eux.

---

### Note sur les endpoints internes

Les routes `/internal/*` ne doivent **pas** passer par l'api-gateway public — elles sont accessibles uniquement depuis le réseau interne du cluster (ClusterIP, pas d'Ingress). C'est la partie "rappel API" du pattern hybride défini pour les événements : un service abonné qui a besoin de plus de contexte que ce que porte l'événement va chercher le détail via une de ces routes.

**Cas particulier de `/auth/verify` :** ce n'est pas un appel de ce type — il n'est pas déclenché par un service métier qui a besoin de contexte, mais par **Traefik lui-même** (le gateway) pour chaque requête publique entrante. La frontière de confiance est différente (gateway ↔ auth-service, pas service métier ↔ service métier) : il n'est donc pas protégé par le mécanisme de secret par paire décrit ci-dessous, mais par le seul fait qu'il n'est joignable que depuis le pod Traefik au niveau réseau (même principe d'isolation ClusterIP).

#### Authentification service-à-service

**Décision prise : un secret dédié par paire de services**, plutôt qu'un secret partagé unique ou une émission centralisée via auth-service — le nombre de paires réelles reste faible, et ça évite qu'auth-service devienne un point de défaillance unique pour tous les appels internes.

**Paires concrètes identifiées (MVP) :**
- `tracking-service` → `calendar-service` (`GET /internal/events/:id`) — **usage :** valider qu'un `related_event_id` fourni par l'utilisateur lors d'une liaison manuelle mission↔événement existe bien et appartient au même utilisateur (garde-fou d'intégrité, vu l'absence de FK réelle entre les deux bases). *Ne sert pas à enrichir `mission_scheduled`, dont le payload est déjà auto-suffisant.*
- `tracking-service` → `auth-service` (`GET /internal/users/:id`) — **usage :** récupérer le nom/email de l'utilisateur pour l'en-tête d'un rapport d'activité généré.
- `notification-service` → `auth-service` (`GET /internal/users/:id`) — **usage :** récupérer l'adresse email de l'utilisateur quand le canal de notification est `email` (le `push_subscriptions` de notification-service ne contient pas cette donnée).

**Stockage :** chaque secret est généré une fois (`openssl rand -hex 32`) et stocké comme **Kubernetes Secret**, monté en variable d'environnement dans les deux pods concernés — jamais en base Postgres, ce n'est pas une donnée applicative.

**Convention de requête signée (résout le problème du secret statique qui ne périme jamais) :**

Plutôt que d'envoyer le secret brut à chaque appel (qui resterait valide indéfiniment s'il fuite via une capture réseau), le service appelant signe chaque requête :

```
X-Calling-Service : tracking-service
X-Timestamp       : 1732000000          (epoch, secondes)
X-Signature       : HMAC-SHA256(secret, méthode + chemin + timestamp + body)
```

Le service appelé :
1. va chercher **le secret qu'il attend spécifiquement pour cet appelant** (`X-Calling-Service`) ;
2. recalcule la signature et la compare en temps constant ;
3. **rejette si `X-Timestamp` a plus de 30 secondes d'écart** avec l'heure serveur (protection anti-rejeu — une requête interceptée ne peut pas être renvoyée telle quelle plus tard).

Le secret lui-même ne transite jamais sur le réseau, seule une signature dérivée le fait — ça réduit fortement la fenêtre d'exposition en cas d'interception, sans passer par une expiration type JWT.

**Attention — ce que le HMAC protège et ce qu'il ne protège pas :** il existe deux vecteurs de fuite distincts, et la signature n'en couvre qu'un seul.
- **Interception réseau / logs** (le secret circulerait en clair sur le fil, ou traînerait dans un log d'accès) → neutralisé par le HMAC : une signature capturée est à sens unique, on ne peut pas en retrouver le secret, et le rejeu est bloqué par l'horodatage (fenêtre de 30s).
- **Compromission du secret à la source** (mauvais RBAC sur le Kubernetes Secret, pod compromis qui lit sa propre variable d'environnement, commit accidentel dans un repo Git, sauvegarde etcd mal protégée) → **le HMAC ne protège de rien ici** : avec le secret en main, un attaquant signe des requêtes valides à volonté. Sur ce vecteur, la rotation reste le seul rempart, exactement comme avec un secret envoyé en clair.

**Hygiène à respecter dès l'implémentation pour limiter ce second vecteur :**
- RBAC Kubernetes restrictif sur chaque Secret : seuls les deux pods de la paire concernée doivent pouvoir le lire (pas de `Role` trop large qui donnerait accès à tous les Secrets du namespace).
- Ne jamais logger la valeur du secret, à aucun niveau applicatif (même en debug).
- `.gitignore` strict sur tout fichier local qui contiendrait des valeurs de secrets en clair (`.env`, etc.) — ne jamais les committer, même dans un repo privé.

**Rotation :** recommandé tous les 90 jours par défaut, ou immédiatement en cas de doute sur une fuite. Régénérer le secret, mettre à jour le Kubernetes Secret, puis redéployer les deux pods concernés (un outil comme **Reloader** peut automatiser ce redémarrage au changement du Secret, à considérer si la rotation manuelle devient pénible).


---

## 11. Événements NATS JetStream


Format d'enveloppe standard (voir section 5 du suivi de projet) :

```json
{
  "event_type": "string",
  "version": "string",
  "timestamp": "datetime",
  "payload": { }
}
```

Convention de subject NATS : `kelenda.<service_emetteur>.<event_type>` (ex. `kelenda.calendar.deadline_approaching`).

---

### calendar-service (émetteur)

#### `deadline_approaching`
- **Déclencheur :** job planifié qui scanne les `events` à venir (échéances/examens) selon la fenêtre de notification progressive (A.4).
- **Abonné :** notification-service
- **Payload :**
```json
{
  "user_id": "uuid",
  "event_id": "uuid",
  "event_title": "string",
  "event_start_at": "datetime",
  "days_before": "int"
}
```
*(titre et date inclus directement — évite un aller-retour vers calendar-service pour construire le message de notification)*

#### `conflit_planning_detecte`
- **Déclencheur :** création d'une ligne `detected_conflicts` (status=open).
- **Abonné :** notification-service
- **Payload :**
```json
{
  "user_id": "uuid",
  "conflict_id": "uuid",
  "event_a_id": "uuid",
  "event_b_id": "uuid",
  "event_a_title": "string",
  "event_b_title": "string"
}
```

#### `mission_scheduled`
- **Déclencheur :** appel utilisateur à `POST /calendar/free-slots/accept` (acceptation explicite d'une suggestion de révision, A.2) — calendar-service crée alors l'événement (source `interne`) et publie l'événement.
- **Abonné :** tracking-service — crée automatiquement une `Mission` avec `source='suggested'` et `related_event_id` pointant vers l'événement calendrier. Relie directement les suggestions de révision (A.2) au suivi d'activité (C.1) sans saisie manuelle.
- **Payload :**
```json
{
  "user_id": "uuid",
  "event_id": "uuid",
  "title": "string",
  "start_at": "datetime",
  "end_at": "datetime"
}
```

---

### finance-service (émetteur)

#### `prime_manquante_detectee`
- **Déclencheur :** création d'un `prime_checks` avec status=detected.
- **Abonné :** notification-service
- **Payload :**
```json
{
  "user_id": "uuid",
  "prime_check_id": "uuid",
  "prime_type": "string",
  "expected_amount": "numeric"
}
```

#### `aide_disponible_detectee`
- **Déclencheur :** création d'un `aid_matches` (nouvelle aide potentielle repérée pour l'utilisateur).
- **Abonné :** notification-service
- **Payload :**
```json
{
  "user_id": "uuid",
  "aid_match_id": "uuid",
  "aid_name": "string",
  "redirect_url": "string"
}
```

---

### tracking-service (émetteur)

#### `mission_creee`
- **Déclencheur :** création automatique d'une `missions` avec `source='suggested'`, suite à la consommation de `mission_scheduled` (calendar-service). Ajouté après coup (2026-09-19) pour que le scénario "accepter un créneau libre → mission créée → notification envoyée" (`Kelenda_Plan_Developpement.md`, section 6) soit réellement couvert par le catalogue — jusqu'ici `mission_scheduled` n'était consommé que par tracking-service, aucun événement ne notifiait la création de la mission elle-même. Uniquement pour `source='suggested'` (création automatique) — une mission créée manuellement via `POST /tracking/missions` ne publie rien, l'utilisateur vient de l'action lui-même.
- **Abonné :** notification-service
- **Payload :**
```json
{
  "user_id": "uuid",
  "mission_id": "uuid",
  "title": "string",
  "start_date": "date"
}
```

#### `tutor_interaction_upcoming`
- **Déclencheur :** job planifié sur `tutor_interactions` dont `interaction_date` approche.
- **Abonné :** notification-service
- **Payload :**
```json
{
  "user_id": "uuid",
  "tutor_id": "uuid",
  "tutor_name": "string",
  "interaction_date": "date",
  "type": "string"
}
```

#### `rapport_genere`
- **Déclencheur :** fin de génération d'un `activity_reports`.
- **Abonné :** notification-service
- **Payload :**
```json
{
  "user_id": "uuid",
  "report_id": "uuid",
  "period_start": "date",
  "period_end": "date"
}
```

#### `rapport_a_generer_bientot`
- **Déclencheur :** job planifié en fin de période (mois/trimestre) sans rapport généré pour cette période.
- **Abonné :** notification-service
- **Payload :**
```json
{
  "user_id": "uuid",
  "period_start": "date",
  "period_end": "date"
}
```

---

### auth-service (émetteur)

#### `user_registered`
- **Déclencheur :** création d'un `users`.
- **Abonné :** notification-service (message de bienvenue)
- **Payload :**
```json
{
  "user_id": "uuid",
  "email": "string",
  "display_name": "string"
}
```

---

### Récapitulatif des abonnements

Pour le MVP, **notification-service est l'unique abonné** de tous les événements ci-dessus (sauf `mission_scheduled`, consommé par tracking-service) — pas de fan-out multi-abonnés à gérer pour l'instant. Ça simplifie la première implémentation : un seul consumer JetStream à configurer par événement, potentiellement un seul consumer durable filtrant sur `kelenda.*.{deadline_approaching,conflit_planning_detecte,prime_manquante_detectee,aide_disponible_detectee,tutor_interaction_upcoming,rapport_genere,rapport_a_generer_bientot,user_registered,mission_creee}` côté notification-service.


---

## 12. Manifests Kubernetes


### 12.1 Namespace (`infra/k8s/00-namespace.yaml`)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kelenda

```


### 12.2 PostgreSQL (`infra/k8s/01-postgres.yaml`)

```yaml
# ============================================================
# PostgreSQL — instance unique, une base + un rôle par service
# (décision : cf. section 5 du suivi de projet — jamais de DB
# partagée, mais une seule instance pour limiter la charge
# opérationnelle sur le homelab).
# ============================================================
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secrets
  namespace: kelenda
type: Opaque
stringData:
  POSTGRES_SUPERUSER_PASSWORD: "CHANGE_ME"
  AUTH_DB_PASSWORD: "CHANGE_ME"
  CALENDAR_DB_PASSWORD: "CHANGE_ME"
  FINANCE_DB_PASSWORD: "CHANGE_ME"
  TRACKING_DB_PASSWORD: "CHANGE_ME"
  NOTIFICATION_DB_PASSWORD: "CHANGE_ME"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-init-scripts
  namespace: kelenda
data:
  # Exécuté automatiquement au premier démarrage par l'image officielle postgres
  # (tout script .sh placé dans /docker-entrypoint-initdb.d est lancé une fois).
  init-databases.sh: |
    #!/bin/bash
    set -e
    for pair in "auth:$AUTH_DB_PASSWORD" \
                "calendar:$CALENDAR_DB_PASSWORD" \
                "finance:$FINANCE_DB_PASSWORD" \
                "tracking:$TRACKING_DB_PASSWORD" \
                "notification:$NOTIFICATION_DB_PASSWORD"; do
      svc="${pair%%:*}"
      pass="${pair##*:}"
      psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE USER ${svc}_service WITH PASSWORD '${pass}';
        CREATE DATABASE ${svc}_db OWNER ${svc}_service;
        REVOKE ALL ON DATABASE ${svc}_db FROM PUBLIC;
        GRANT ALL PRIVILEGES ON DATABASE ${svc}_db TO ${svc}_service;
	EOSQL
    done
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: kelenda
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: postgres
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef: { name: postgres-secrets, key: POSTGRES_SUPERUSER_PASSWORD }
            - name: AUTH_DB_PASSWORD
              valueFrom:
                secretKeyRef: { name: postgres-secrets, key: AUTH_DB_PASSWORD }
            - name: CALENDAR_DB_PASSWORD
              valueFrom:
                secretKeyRef: { name: postgres-secrets, key: CALENDAR_DB_PASSWORD }
            - name: FINANCE_DB_PASSWORD
              valueFrom:
                secretKeyRef: { name: postgres-secrets, key: FINANCE_DB_PASSWORD }
            - name: TRACKING_DB_PASSWORD
              valueFrom:
                secretKeyRef: { name: postgres-secrets, key: TRACKING_DB_PASSWORD }
            - name: NOTIFICATION_DB_PASSWORD
              valueFrom:
                secretKeyRef: { name: postgres-secrets, key: NOTIFICATION_DB_PASSWORD }
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
              subPath: pgdata   # évite le souci lost+found au premier init
            - name: init-scripts
              mountPath: /docker-entrypoint-initdb.d
          resources:
            requests: { cpu: 250m, memory: 512Mi }
            limits: { cpu: 500m, memory: 1Gi }
          readinessProbe:
            exec: { command: ["pg_isready", "-U", "postgres"] }
            initialDelaySeconds: 5
          livenessProbe:
            exec: { command: ["pg_isready", "-U", "postgres"] }
            initialDelaySeconds: 15
            periodSeconds: 20
      volumes:
        - name: init-scripts
          configMap:
            name: postgres-init-scripts
            defaultMode: 0755
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests: { storage: 5Gi }
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: kelenda
spec:
  clusterIP: None   # headless — un seul pod, pas besoin de load-balancing
  selector:
    app: postgres
  ports:
    - port: 5432

```


### 12.3 Secrets applicatifs (template) (`infra/k8s/02-secrets-template.yaml`)

```yaml
# ============================================================
# Secrets applicatifs — TEMPLATE
# À remplir avec de vraies valeurs générées (jamais celles-ci)
# puis appliqué directement avec `kubectl apply`, ou converti
# en SealedSecret/SOPS avant d'être commité dans le repo.
# Génération des clés : openssl genrsa -out jwt-private.pem 2048
#                        openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
#                        openssl rand -hex 32   (pour chaque secret interne / clé de chiffrement)
# ============================================================
apiVersion: v1
kind: Secret
metadata:
  name: auth-service-secrets
  namespace: kelenda
type: Opaque
stringData:
  JWT_PRIVATE_KEY: |
    CHANGE_ME_RSA_PRIVATE_KEY
  JWT_PUBLIC_KEY: |
    CHANGE_ME_RSA_PUBLIC_KEY
  OAUTH_TOKEN_ENCRYPTION_KEY: "CHANGE_ME_32_BYTES_HEX"
---
# Secrets par paire de services (cf. Kelenda_Endpoints_API.md,
# section "Authentification service-à-service") — un secret
# généré une fois par paire, monté dans les DEUX pods concernés.
apiVersion: v1
kind: Secret
metadata:
  name: internal-pair-tracking-calendar
  namespace: kelenda
type: Opaque
stringData:
  secret: "CHANGE_ME_32_BYTES_HEX"
---
apiVersion: v1
kind: Secret
metadata:
  name: internal-pair-tracking-auth
  namespace: kelenda
type: Opaque
stringData:
  secret: "CHANGE_ME_32_BYTES_HEX"
---
apiVersion: v1
kind: Secret
metadata:
  name: internal-pair-notification-auth
  namespace: kelenda
type: Opaque
stringData:
  secret: "CHANGE_ME_32_BYTES_HEX"

```


### 12.4 auth-service (`infra/k8s/10-auth-service.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: kelenda
spec:
  replicas: 1
  selector:
    matchLabels: { app: auth-service }
  template:
    metadata:
      labels: { app: auth-service }
    spec:
      initContainers:
        - name: migrate
          image: registry.example.com/kelenda/auth-service:latest   # même image que le conteneur principal
          command: ["npx", "node-pg-migrate", "up", "--migrations-dir", "services/auth-service/migrations"]
          env:
            - name: DATABASE_URL
              value: "postgresql://auth_service:$(AUTH_DB_PASSWORD)@postgres:5432/auth_db"
            - name: AUTH_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: AUTH_DB_PASSWORD } }
      containers:
        - name: auth-service
          image: registry.example.com/kelenda/auth-service:latest   # à remplacer une fois la CI en place
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
            - name: NATS_URL
              value: "nats://nats:4222"
            - name: DATABASE_URL
              value: "postgresql://auth_service:$(AUTH_DB_PASSWORD)@postgres:5432/auth_db"
            - name: AUTH_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: AUTH_DB_PASSWORD } }
            - name: JWT_PRIVATE_KEY
              valueFrom: { secretKeyRef: { name: auth-service-secrets, key: JWT_PRIVATE_KEY } }
            - name: JWT_PUBLIC_KEY
              valueFrom: { secretKeyRef: { name: auth-service-secrets, key: JWT_PUBLIC_KEY } }
            - name: OAUTH_TOKEN_ENCRYPTION_KEY
              valueFrom: { secretKeyRef: { name: auth-service-secrets, key: OAUTH_TOKEN_ENCRYPTION_KEY } }
            # Secrets internes : auth-service est l'appelé (callee) dans ces deux paires
            - name: INTERNAL_SECRET_TRACKING
              valueFrom: { secretKeyRef: { name: internal-pair-tracking-auth, key: secret } }
            - name: INTERNAL_SECRET_NOTIFICATION
              valueFrom: { secretKeyRef: { name: internal-pair-notification-auth, key: secret } }
          resources:
            requests: { cpu: 100m, memory: 150Mi }
            limits: { cpu: 300m, memory: 300Mi }
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: kelenda
spec:
  selector: { app: auth-service }
  ports:
    - port: 80
      targetPort: 3000

```


### 12.5 calendar-service (`infra/k8s/11-calendar-service.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: calendar-service
  namespace: kelenda
spec:
  replicas: 1
  selector:
    matchLabels: { app: calendar-service }
  template:
    metadata:
      labels: { app: calendar-service }
    spec:
      initContainers:
        - name: migrate
          image: registry.example.com/kelenda/calendar-service:latest
          command: ["npx", "node-pg-migrate", "up", "--migrations-dir", "services/calendar-service/migrations"]
          env:
            - name: DATABASE_URL
              value: "postgresql://calendar_service:$(CALENDAR_DB_PASSWORD)@postgres:5432/calendar_db"
            - name: CALENDAR_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: CALENDAR_DB_PASSWORD } }
      containers:
        - name: calendar-service
          image: registry.example.com/kelenda/calendar-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
            - name: NATS_URL
              value: "nats://nats:4222"
            - name: DATABASE_URL
              value: "postgresql://calendar_service:$(CALENDAR_DB_PASSWORD)@postgres:5432/calendar_db"
            - name: CALENDAR_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: CALENDAR_DB_PASSWORD } }
            # Vérification JWT locale en filet de sécurité (défense en profondeur) :
            # le service ne se fie pas uniquement à X-User-Id injecté par Traefik,
            # il revérifie la signature lui-même et en dérive le user_id.
            - name: JWT_PUBLIC_KEY
              valueFrom: { secretKeyRef: { name: auth-service-secrets, key: JWT_PUBLIC_KEY } }
            # Secret interne : calendar-service est l'appelé (callee) — tracking-service le contacte
            # via GET /internal/events/:id pour valider un related_event_id saisi manuellement.
            - name: INTERNAL_SECRET_TRACKING
              valueFrom: { secretKeyRef: { name: internal-pair-tracking-calendar, key: secret } }
          resources:
            requests: { cpu: 150m, memory: 150Mi }
            limits: { cpu: 400m, memory: 300Mi }
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: calendar-service
  namespace: kelenda
spec:
  selector: { app: calendar-service }
  ports:
    - port: 80
      targetPort: 3000

```


### 12.6 finance-service (`infra/k8s/12-finance-service.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service
  namespace: kelenda
spec:
  replicas: 1
  selector:
    matchLabels: { app: finance-service }
  template:
    metadata:
      labels: { app: finance-service }
    spec:
      initContainers:
        - name: migrate
          image: registry.example.com/kelenda/finance-service:latest
          command: ["npx", "node-pg-migrate", "up", "--migrations-dir", "services/finance-service/migrations"]
          env:
            - name: DATABASE_URL
              value: "postgresql://finance_service:$(FINANCE_DB_PASSWORD)@postgres:5432/finance_db"
            - name: FINANCE_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: FINANCE_DB_PASSWORD } }
      containers:
        - name: finance-service
          image: registry.example.com/kelenda/finance-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
            - name: NATS_URL
              value: "nats://nats:4222"
            - name: DATABASE_URL
              value: "postgresql://finance_service:$(FINANCE_DB_PASSWORD)@postgres:5432/finance_db"
            - name: FINANCE_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: FINANCE_DB_PASSWORD } }
            # Vérification JWT locale en filet de sécurité (défense en profondeur).
            - name: JWT_PUBLIC_KEY
              valueFrom: { secretKeyRef: { name: auth-service-secrets, key: JWT_PUBLIC_KEY } }
            # Aucune paire de secret interne : finance-service n'appelle et n'est appelé
            # par aucun autre service en synchrone pour l'instant.
          resources:
            requests: { cpu: 150m, memory: 150Mi }
            limits: { cpu: 400m, memory: 300Mi }
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: finance-service
  namespace: kelenda
spec:
  selector: { app: finance-service }
  ports:
    - port: 80
      targetPort: 3000

```


### 12.7 tracking-service (`infra/k8s/13-tracking-service.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tracking-service
  namespace: kelenda
spec:
  replicas: 1
  selector:
    matchLabels: { app: tracking-service }
  template:
    metadata:
      labels: { app: tracking-service }
    spec:
      initContainers:
        - name: migrate
          image: registry.example.com/kelenda/tracking-service:latest
          command: ["npx", "node-pg-migrate", "up", "--migrations-dir", "services/tracking-service/migrations"]
          env:
            - name: DATABASE_URL
              value: "postgresql://tracking_service:$(TRACKING_DB_PASSWORD)@postgres:5432/tracking_db"
            - name: TRACKING_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: TRACKING_DB_PASSWORD } }
      containers:
        - name: tracking-service
          image: registry.example.com/kelenda/tracking-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
            - name: NATS_URL
              value: "nats://nats:4222"
            - name: DATABASE_URL
              value: "postgresql://tracking_service:$(TRACKING_DB_PASSWORD)@postgres:5432/tracking_db"
            - name: TRACKING_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: TRACKING_DB_PASSWORD } }
            # tracking-service est l'appelant (caller) dans ces deux paires :
            # → calendar-service (validation de related_event_id)
            # → auth-service (nom/email pour l'en-tête des rapports d'activité)
            - name: INTERNAL_SECRET_CALENDAR
              valueFrom: { secretKeyRef: { name: internal-pair-tracking-calendar, key: secret } }
            - name: INTERNAL_SECRET_AUTH
              valueFrom: { secretKeyRef: { name: internal-pair-tracking-auth, key: secret } }
            # Vérification JWT locale en filet de sécurité (défense en profondeur).
            - name: JWT_PUBLIC_KEY
              valueFrom: { secretKeyRef: { name: auth-service-secrets, key: JWT_PUBLIC_KEY } }
          resources:
            requests: { cpu: 150m, memory: 150Mi }
            limits: { cpu: 400m, memory: 300Mi }
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: tracking-service
  namespace: kelenda
spec:
  selector: { app: tracking-service }
  ports:
    - port: 80
      targetPort: 3000

```


### 12.8 notification-service (`infra/k8s/14-notification-service.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
  namespace: kelenda
spec:
  replicas: 1
  selector:
    matchLabels: { app: notification-service }
  template:
    metadata:
      labels: { app: notification-service }
    spec:
      initContainers:
        - name: migrate
          image: registry.example.com/kelenda/notification-service:latest
          command: ["npx", "node-pg-migrate", "up", "--migrations-dir", "services/notification-service/migrations"]
          env:
            - name: DATABASE_URL
              value: "postgresql://notification_service:$(NOTIFICATION_DB_PASSWORD)@postgres:5432/notification_db"
            - name: NOTIFICATION_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: NOTIFICATION_DB_PASSWORD } }
      containers:
        - name: notification-service
          image: registry.example.com/kelenda/notification-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
            - name: NATS_URL
              value: "nats://nats:4222"
            - name: DATABASE_URL
              value: "postgresql://notification_service:$(NOTIFICATION_DB_PASSWORD)@postgres:5432/notification_db"
            - name: NOTIFICATION_DB_PASSWORD
              valueFrom: { secretKeyRef: { name: postgres-secrets, key: NOTIFICATION_DB_PASSWORD } }
            # notification-service est l'appelant (caller) — récupère l'email utilisateur
            # auprès d'auth-service quand le canal de notification est 'email'.
            - name: INTERNAL_SECRET_AUTH
              valueFrom: { secretKeyRef: { name: internal-pair-notification-auth, key: secret } }
            # Vérification JWT locale en filet de sécurité (défense en profondeur).
            - name: JWT_PUBLIC_KEY
              valueFrom: { secretKeyRef: { name: auth-service-secrets, key: JWT_PUBLIC_KEY } }
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits: { cpu: 250m, memory: 256Mi }
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: notification-service
  namespace: kelenda
spec:
  selector: { app: notification-service }
  ports:
    - port: 80
      targetPort: 3000

```


### 12.9 Routage Traefik (`infra/k8s/20-traefik-routes.yaml`)

```yaml
# ============================================================
# Routage Traefik (CRDs IngressRoute/Middleware — Traefik est déjà
# l'ingress controller par défaut de K3s, rien à déployer en plus).
# ============================================================

# --- Middlewares ---------------------------------------------

apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: forward-auth
  namespace: kelenda
spec:
  forwardAuth:
    address: "http://auth-service.kelenda.svc.cluster.local/auth/verify"
    authResponseHeaders:
      - X-User-Id
      - X-Workspace-Id
---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit
  namespace: kelenda
spec:
  rateLimit:
    average: 100
    burst: 50
---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit-auth-strict
  namespace: kelenda
spec:
  # Limite basse spécifique à /auth/login et /auth/register — protection brute-force.
  rateLimit:
    average: 5
    burst: 10

# --- Routes ----------------------------------------------------
# Note : /auth/register et /auth/login sont volontairement séparés du
# reste de /auth — impossible d'appliquer forward-auth avant d'avoir un
# token. Les routes /auth protégées (me, sessions, link...) sont
# vérifiées par auth-service lui-même, qui a déjà toute la logique JWT
# nécessaire — pas besoin de la dupliquer via un forward-auth vers lui-même.

---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: kelenda-auth-public
  namespace: kelenda
spec:
  entryPoints: [websecure]
  routes:
    - match: Path(`/auth/register`) || Path(`/auth/login`) || PathPrefix(`/auth/login/`) || PathPrefix(`/auth/callback/`) || Path(`/auth/refresh`)
      kind: Rule
      middlewares:
        - name: rate-limit-auth-strict
      services:
        - name: auth-service
          port: 80
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: kelenda-auth-rest
  namespace: kelenda
spec:
  entryPoints: [websecure]
  routes:
    - match: PathPrefix(`/auth`) || PathPrefix(`/workspaces`)
      kind: Rule
      middlewares:
        - name: rate-limit
      services:
        - name: auth-service
          port: 80
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: kelenda-calendar
  namespace: kelenda
spec:
  entryPoints: [websecure]
  routes:
    - match: PathPrefix(`/calendar`)
      kind: Rule
      middlewares:
        - name: forward-auth
        - name: rate-limit
      services:
        - name: calendar-service
          port: 80
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: kelenda-finance
  namespace: kelenda
spec:
  entryPoints: [websecure]
  routes:
    - match: PathPrefix(`/finance`)
      kind: Rule
      middlewares:
        - name: forward-auth
        - name: rate-limit
      services:
        - name: finance-service
          port: 80
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: kelenda-tracking
  namespace: kelenda
spec:
  entryPoints: [websecure]
  routes:
    - match: PathPrefix(`/tracking`)
      kind: Rule
      middlewares:
        - name: forward-auth
        - name: rate-limit
      services:
        - name: tracking-service
          port: 80
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: kelenda-notifications
  namespace: kelenda
spec:
  entryPoints: [websecure]
  routes:
    - match: PathPrefix(`/notifications`)
      kind: Rule
      middlewares:
        - name: forward-auth
        - name: rate-limit
      services:
        - name: notification-service
          port: 80

```


### 12.10 NATS (valeurs Helm) (`infra/k8s/nats-values.yaml`)

```yaml
# Valeurs pour le chart Helm officiel NATS
# https://github.com/nats-io/k8s/tree/main/helm/charts/nats
#
# Installation :
#   helm repo add nats https://nats-io.github.io/k8s/helm/charts/
#   helm install nats nats/nats -n kelenda -f nats-values.yaml

config:
  jetstream:
    enabled: true
    fileStore:
      pvc:
        size: 2Gi
  cluster:
    enabled: false   # instance unique — suffisant pour le MVP homelab

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 250m
    memory: 256Mi

```


---

### 12.11 NetworkPolicies (`infra/k8s/21-network-policies.yaml`)

**Trouvé en audit :** toute la sécurité du flux d'autorisation décrit plus haut repose sur l'idée qu'un service métier peut faire confiance à l'en-tête `X-User-Id` injecté par Traefik, parce qu'aucun autre pod ne peut l'atteindre directement. Sans NetworkPolicy, cette hypothèse est fausse — n'importe quel pod du cluster peut appeler `calendar-service` directement et forger cet en-tête, contournant complètement l'authentification.

**Prérequis bloquant : K3s utilise Flannel comme CNI par défaut, qui n'applique pas du tout les NetworkPolicy** (elles seraient créées mais silencieusement ignorées). Il faut installer K3s avec Flannel désactivé et **Calico** à la place :

```
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--flannel-backend=none --disable-network-policy" sh -
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/<version>/manifests/calico.yaml
```

*(vérifier la dernière version stable sur la doc officielle de Calico avant d'appliquer — pas de bascule à chaud possible sur un cluster déjà installé avec Flannel, il faut réinstaller K3s avec ces flags).*

**Défense en profondeur complémentaire :** en plus de Calico, chaque service vérifie désormais lui-même la signature du JWT (`JWT_PUBLIC_KEY` ajoutée aux 4 services autres qu'auth-service, voir sections 12.5 à 12.8) plutôt que de faire une confiance aveugle à `X-User-Id`. Même si une NetworkPolicy était mal configurée ou contournée, un appelant sans JWT valide ne pourrait pas se faire passer pour un utilisateur.

```yaml
# ============================================================
# NetworkPolicies — ferme le trou identifié en audit : sans ça,
# n'importe quel pod du cluster peut appeler directement un
# service (ex. calendar-service) et forger un en-tête X-User-Id,
# contournant complètement Traefik et l'authentification JWT.
#
# ATTENTION — prérequis obligatoire : K3s utilise Flannel comme
# CNI par défaut, qui N'APPLIQUE PAS les NetworkPolicy (elles
# seraient créées mais silencieusement ignorées). Il faut
# installer K3s avec Flannel désactivé et Calico à la place :
#
#   curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--flannel-backend=none --disable-network-policy" sh -
#   kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/<version>/manifests/calico.yaml
#   (vérifier la dernière version stable sur docs.tigera.io avant d'appliquer)
#
# Sur un cluster déjà installé avec Flannel, il faut réinstaller
# K3s avec ces flags — pas de bascule à chaud.
#
# Le label exact du pod Traefik peut varier selon la version de
# K3s : vérifier avec `kubectl get pods -n kube-system --show-labels`
# et ajuster le podSelector ci-dessous si besoin.
# ============================================================

# --- Filet de sécurité par défaut : tout ce qui n'a pas de règle
#     explicite ci-dessous est refusé en entrée ---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: kelenda
spec:
  podSelector: {}
  policyTypes: [Ingress]

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-auth-service
  namespace: kelenda
spec:
  podSelector:
    matchLabels: { app: auth-service }
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
          podSelector: { matchLabels: { app.kubernetes.io/name: traefik } }
      ports: [{ port: 3000 }]
    # Appelants internes : tracking-service et notification-service
    # (GET /internal/users/:id)
    - from:
        - podSelector: { matchLabels: { app: tracking-service } }
        - podSelector: { matchLabels: { app: notification-service } }
      ports: [{ port: 3000 }]

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-calendar-service
  namespace: kelenda
spec:
  podSelector:
    matchLabels: { app: calendar-service }
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
          podSelector: { matchLabels: { app.kubernetes.io/name: traefik } }
      ports: [{ port: 3000 }]
    # Appelant interne : tracking-service (GET /internal/events/:id)
    - from:
        - podSelector: { matchLabels: { app: tracking-service } }
      ports: [{ port: 3000 }]

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-finance-service
  namespace: kelenda
spec:
  podSelector:
    matchLabels: { app: finance-service }
  policyTypes: [Ingress]
  ingress:
    # Aucun appelant interne — uniquement Traefik.
    - from:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
          podSelector: { matchLabels: { app.kubernetes.io/name: traefik } }
      ports: [{ port: 3000 }]

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-tracking-service
  namespace: kelenda
spec:
  podSelector:
    matchLabels: { app: tracking-service }
  policyTypes: [Ingress]
  ingress:
    # Aucun appelant interne identifié à ce jour (voir section 10 —
    # aucun endpoint /internal/* exposé par tracking-service pour l'instant).
    - from:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
          podSelector: { matchLabels: { app.kubernetes.io/name: traefik } }
      ports: [{ port: 3000 }]

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-notification-service
  namespace: kelenda
spec:
  podSelector:
    matchLabels: { app: notification-service }
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
          podSelector: { matchLabels: { app.kubernetes.io/name: traefik } }
      ports: [{ port: 3000 }]

---
# PostgreSQL : uniquement joignable par les 5 services applicatifs,
# jamais directement depuis Traefik ni depuis l'extérieur du cluster.
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-postgres
  namespace: kelenda
spec:
  podSelector:
    matchLabels: { app: postgres }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector: { matchLabels: { app: auth-service } }
        - podSelector: { matchLabels: { app: calendar-service } }
        - podSelector: { matchLabels: { app: finance-service } }
        - podSelector: { matchLabels: { app: tracking-service } }
        - podSelector: { matchLabels: { app: notification-service } }
      ports: [{ port: 5432 }]
```

---

## 13. Pipeline CI (GitHub Actions)

### Fonctionnement

- **Détection ciblée** (`dorny/paths-filter`) : seuls les services dont le dossier `services/<nom>/` a changé sont testés/buildés à chaque push — pas les 5 systématiquement.
- **Cas particulier `packages/shared`** : si ce package commun (enveloppe d'événement NATS, signature/vérification HMAC des appels internes) change, tous les services en dépendent potentiellement, donc les 5 sont rebuild par sécurité plutôt que de risquer un service tournant avec une version obsolète du code partagé.
- **Convention requise dans chaque service** : exposer les mêmes scripts npm `lint`, `test`, `build` dans son `package.json` — désormais surtout une bonne pratique qu'une nécessité stricte vu que les 5 services sont en Express, mais ça reste ce qui permettrait à la CI d'absorber sans changement un futur service dans un autre framework.
- **Build Docker** uniquement sur `main` (pas sur les PR), poussé vers **GHCR** (registre GitHub, gratuit pour du privé), taggé `latest` + SHA du commit.

**Le framework étant maintenant tranché (Express pour les 5 services — voir section 5), les `Dockerfile` peuvent être écrits** : une seule structure d'image à définir plutôt que deux différentes.

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      services: ${{ steps.matrix.outputs.services }}
    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            shared: 'packages/shared/**'
            auth: 'services/auth-service/**'
            calendar: 'services/calendar-service/**'
            finance: 'services/finance-service/**'
            tracking: 'services/tracking-service/**'
            notification: 'services/notification-service/**'

      # Si packages/shared change, tous les services en dépendent potentiellement :
      # on les rebuild tous par sécurité plutôt que de risquer un service qui tourne
      # avec une version obsolète du package partagé.
      - name: Construire la liste des services à builder
        id: matrix
        run: |
          if [[ "${{ steps.filter.outputs.shared }}" == "true" ]]; then
            services='["auth-service","calendar-service","finance-service","tracking-service","notification-service"]'
          else
            list=()
            [[ "${{ steps.filter.outputs.auth }}" == "true" ]] && list+=("auth-service")
            [[ "${{ steps.filter.outputs.calendar }}" == "true" ]] && list+=("calendar-service")
            [[ "${{ steps.filter.outputs.finance }}" == "true" ]] && list+=("finance-service")
            [[ "${{ steps.filter.outputs.tracking }}" == "true" ]] && list+=("tracking-service")
            [[ "${{ steps.filter.outputs.notification }}" == "true" ]] && list+=("notification-service")
            services=$(printf '%s\n' "${list[@]}" | jq -R . | jq -s -c .)
          fi
          echo "services=$services" >> "$GITHUB_OUTPUT"

  build-and-test:
    needs: detect-changes
    if: needs.detect-changes.outputs.services != '[]'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: ${{ fromJson(needs.detect-changes.outputs.services) }}
      fail-fast: false
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: services/${{ matrix.service }}/package-lock.json

      # Les 5 services étant en Express, les scripts npm lint/test/build sont
      # identiques partout — cette convention resterait valable si un futur
      # service adoptait un autre framework.
      - name: Install
        working-directory: services/${{ matrix.service }}
        run: npm ci

      - name: Lint
        working-directory: services/${{ matrix.service }}
        run: npm run lint

      - name: Test
        working-directory: services/${{ matrix.service }}
        run: npm test

      - name: Build
        working-directory: services/${{ matrix.service }}
        run: npm run build

  docker-build:
    needs: [detect-changes, build-and-test]
    if: github.ref == 'refs/heads/main' && needs.detect-changes.outputs.services != '[]'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: ${{ fromJson(needs.detect-changes.outputs.services) }}
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          context: .
          file: services/${{ matrix.service }}/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/kelenda-${{ matrix.service }}:latest
            ghcr.io/${{ github.repository_owner }}/kelenda-${{ matrix.service }}:${{ github.sha }}
```

---

## 14. Dockerfiles par service

### Prérequis : npm workspaces à la racine

Les services important `packages/shared` (module NATS mutualisé), le monorepo doit être configuré en **npm workspaces** pour que la résolution du package fonctionne, aussi bien en développement qu'au build Docker.

`package.json` (racine) :
```json
{
  "name": "kelenda",
  "private": true,
  "workspaces": [
    "services/*",
    "packages/*"
  ]
}
```

`.dockerignore` (racine) :
```
**/node_modules
**/dist
.git
*.log
.env
.env.*
docker-compose.yml
infra/
docs/
```

### Point important : le build se fait depuis la racine, pas depuis le dossier du service

Chaque Dockerfile suit un pattern multi-stage identique (deps → build → runtime, utilisateur non-root). **Le contexte de build doit être la racine du monorepo**, jamais `services/<nom>/` seul — sinon Docker ne peut pas voir `packages/shared`, qui est hors de ce dossier :

```
docker build -f services/auth-service/Dockerfile -t kelenda-auth-service .
```

C'est exactement ce que corrige `context: .` + `file: services/${{ matrix.service }}/Dockerfile` dans le job `docker-build` de la CI (section 13) — la version précédente (`context: services/${{ matrix.service }}`) aurait échoué dès qu'un service importait le module partagé.

### Migrations : exécutées via initContainer, pas manuellement

Chaque Deployment (section 12.4 à 12.8) a maintenant un `initContainer` qui exécute `npx node-pg-migrate up` contre la base du service, avant que le conteneur principal ne démarre — même image que le conteneur principal, juste une commande différente. Deux conséquences sur chaque service :

- **`node-pg-migrate` doit être une dépendance normale** (`dependencies`, pas `devDependencies`) dans le `package.json` de chaque service, sinon il serait absent de l'image de production et l'initContainer échouerait.
- **Convention de dossier : `services/<nom>/migrations/`**, copié dans l'image runtime (voir les `COPY` ci-dessous). Pour le premier déploiement, chaque fichier `*-service_schema.sql` de la section 9 peut servir de première migration (à renommer/adapter au format attendu par node-pg-migrate — voir sa documentation pour la syntaxe exacte des fichiers `.sql` en mode "run once"). Les évolutions suivantes du schéma s'ajoutent en fichiers numérotés après celui-ci.

### `services/auth-service/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo (pas depuis services/auth-service/),
# pour que packages/shared soit dans le contexte :
#   docker build -f services/auth-service/Dockerfile -t kelenda-auth-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/auth-service/package.json services/auth-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/auth-service services/auth-service
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
CMD ["node", "services/auth-service/dist/main.js"]
```

### `services/calendar-service/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo :
#   docker build -f services/calendar-service/Dockerfile -t kelenda-calendar-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/calendar-service/package.json services/calendar-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/calendar-service services/calendar-service
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
CMD ["node", "services/calendar-service/dist/main.js"]
```

### `services/finance-service/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo :
#   docker build -f services/finance-service/Dockerfile -t kelenda-finance-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/finance-service/package.json services/finance-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/finance-service services/finance-service
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
CMD ["node", "services/finance-service/dist/main.js"]
```

### `services/tracking-service/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo :
#   docker build -f services/tracking-service/Dockerfile -t kelenda-tracking-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/tracking-service/package.json services/tracking-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/tracking-service services/tracking-service
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
EXPOSE 3000
CMD ["node", "services/tracking-service/dist/main.js"]
```

### `services/notification-service/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
#
# Build à lancer depuis la RACINE du monorepo :
#   docker build -f services/notification-service/Dockerfile -t kelenda-notification-service .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/notification-service/package.json services/notification-service/package.json
RUN npm ci

FROM deps AS build
COPY packages/shared packages/shared
COPY services/notification-service services/notification-service
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
EXPOSE 3000
CMD ["node", "services/notification-service/dist/main.js"]
```

---

*Document de suivi vivant — à mettre à jour au fil de l'avancement du projet.*
