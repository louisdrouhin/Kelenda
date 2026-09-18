# Kelenda — Plan de développement

Ordre des phases basé sur les dépendances réelles entre composants (impossible de tester `calendar-service` sans un `auth-service` fonctionnel, par exemple), pas sur un simple découpage arbitraire.

**Point transverse, ne bloque rien** : le questionnaire de validation (toujours en attente, voir section 4 et 7 de `Kelenda_Documentation_Complete.md`) tourne en parallèle. S'il change la priorité entre calendar/finance/tracking, ça peut réordonner les phases 3 à 5 ci-dessous, mais ça ne remet pas en cause les phases 1, 2, 6, 7 ni le frontend.

---

## 1. Fondations du repo

Créer le repo Git avec la structure monorepo (`services/`, `packages/`, `infra/`, `docs/`, `.github/`), le `package.json` racine (npm workspaces), et le squelette de `packages/shared` (enveloppe d'événement NATS, signature HMAC).

Ajouter un `docker-compose.yml` pour PostgreSQL + NATS — pas encore fait à ce stade du projet, mais indispensable pour coder localement avant même que les services applicatifs existent.

## 2. auth-service en premier

Convertir le schéma SQL (section 9 de la documentation) en fichiers de migration `node-pg-migrate`. Implémenter les endpoints (`register`, `login`, OAuth avec liaison manuelle, `/auth/verify`, `workspaces`), la signature JWT RS256.

C'est la fondation dont tous les autres services dépendent — à valider en k3d avec Traefik (forward-auth réel) avant de continuer sur le reste.

## 3. calendar-service (cœur du MVP)

Parsing ICS, synchronisation CalDAV, détection de créneaux libres + endpoint d'acceptation (déclenche l'événement `mission_scheduled`), détection de conflits (index GiST sur `tstzrange`).

Porte les features A.1/A.2, les pistes les plus fortes pressenties pour le MVP.

## 4. finance-service

Simulateur de salaire (intégration API Légifrance/Entreprise), vérification des primes conventionnelles, matching des aides financières.

Indépendant de `calendar-service` — peut avancer en parallèle si tu es plusieurs sur le projet, sinon à la suite.

## 5. tracking-service + notification-service

`tracking-service` (missions, compétences, tuteurs, rapports — consomme `mission_scheduled`) et `notification-service` (consomme tous les événements du catalogue, envoie push/email).

Peuvent avancer ensemble une fois le broker NATS validé par les services précédents (au moins un publisher et un consumer qui fonctionnent réellement).

## 6. Intégration événementielle bout-en-bout

Déployer les 5 services + NATS sur k3d et valider le flux complet de bout en bout : accepter une suggestion de révision → mission créée automatiquement dans `tracking-service` → notification envoyée.

C'est le vrai test que l'architecture événementielle fonctionne dans son ensemble, pas seulement que chaque service marche isolément.

## 7. Déploiement homelab + sécurité réseau

Réinstaller K3s avec Calico (les NetworkPolicies de la section 12.11 ne sont appliquées qu'à cette condition), déployer les manifests de la section 12 sur le vrai cluster homelab, activer le pipeline CI réel (secrets GitHub configurés, push vers GHCR fonctionnel).

## 8. Frontend

Scaffold React + Vite, flux d'authentification côté client (stockage du token, rafraîchissement automatique), vue calendrier fusionné (A.1) et suggestions de révision (A.2) en priorité, configuration PWA (manifest, service worker).

Peut démarrer dès que `auth-service` et `calendar-service` exposent une API stable — pas besoin d'attendre que les 5 services soient terminés.

---

*Document de suivi vivant — à mettre à jour au fil de l'avancement du développement.*
