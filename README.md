# Vinci Arena

`cae-group-21` est une application web de gestion de membres et d'equipes pour un projet CAE. Le repo contient une API REST Spring Boot et un frontend React/Vite permettant de gérer l'authentification JWT, le profil utilisateur, les demandes d'adhesion a une team, les notifications et l'administration.

## Fonctionnalites

- Inscription et connexion via JWT.
- Choix d'une specialite et d'un avatar a l'inscription.
- Consultation et mise a jour du profil utilisateur.
- Ajout d'indisponibilites.
- Creation d'une team, demande d'adhesion, acceptation/refus via notifications, designation d'un co-responsable et depart d'une team.
- Consultation et lecture des notifications.
- Promotion et retrogradation d'administrateurs depuis une interface dediee.

## Architecture

### Backend

- Framework : Spring Boot 3.3
- Langage : Java 21
- Base de donnees : PostgreSQL
- Authentification : JWT
- Build et tests : Maven Wrapper

### Frontend

- Framework : React 18
- Build tool : Vite
- Langage : TypeScript
- UI : Material UI
- Tests : Vitest

### Structure du depot

```text
.
├── api/        # API Spring Boot + PostgreSQL + tests HTTP
└── frontend/   # SPA React/Vite
```

Le frontend appelle l'API via le prefixe `/api`. En developpement, Vite proxy les requetes vers l'API locale a partir de la variable `API_PORT`.

## Prerequis

- Java 21
- Node.js 18+ et npm
- Docker et Docker Compose

## Installation et demarrage

### 1. Configurer le backend

Depuis `api/`, cree un fichier `.env` a partir du modele :

```bash
cd api
cp .env.example .env
```

Renseigne au minimum :

- la base de donnees PostgreSQL
- le secret JWT
- le port de l'API

Pour les tests e2e, cree aussi un environnement dedie :

```bash
cd api
cp .env.test.example .env.test
```

`api/.env` sert au run local normal.
`api/.env.test` sert uniquement au lancement du profil Spring `test` pour les e2e.

### 2. Lancer PostgreSQL

Depuis `api/`, pour l'environnement normal :

```bash
docker compose up -d db
```

Pour l'environnement e2e, utilisez la base Docker dediee :

```bash
docker compose --env-file .env.test up -d db_test
```

### 3. Demarrer l'API

Depuis `api/` :

```bash
./mvnw spring-boot:run
```

Par defaut, l'API lit sa configuration dans `.env` et expose le serveur sur `API_PORT`.

### 4. Installer et lancer le frontend

Depuis `frontend/` :

```bash
npm install
API_PORT=3000 npm run dev
```

Si ton backend tourne sur un autre port, il faut fournir exactement la meme valeur au frontend. Exemple si `api/.env` contient `API_PORT=3001` :

```bash
API_PORT=3001 npm run dev
```

Le frontend sera ensuite accessible via l'URL affichee par Vite, generalement `http://localhost:5173`.

## Variables d'environnement

Le backend attend les variables suivantes :

| Variable | Description |
| --- | --- |
| `DB_HOST` | Hote PostgreSQL |
| `DB_PORT` | Port PostgreSQL expose localement |
| `DB_NAME` | Nom de la base de donnees |
| `DB_USER` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `JWT_SECRET` | Secret utilise pour signer les JWT |
| `PGRES_CONTAINER_NAME` | Nom du conteneur PostgreSQL |
| `API_PORT` | Port HTTP de l'API |

Important : si `API_PORT` n'est pas `3000`, le frontend doit etre lance avec la meme valeur pour que le proxy Vite redirige correctement `/api`.

Pour les e2e, l'API utilise un second jeu de variables :

| Variable | Description |
| --- | --- |
| `TEST_DB_HOST` | Hote PostgreSQL de la base e2e |
| `TEST_DB_PORT` | Port PostgreSQL de la base e2e |
| `TEST_DB_NAME` | Nom de la base e2e |
| `TEST_DB_USER` | Utilisateur PostgreSQL e2e |
| `TEST_DB_PASSWORD` | Mot de passe PostgreSQL e2e |
| `TEST_PGRES_CONTAINER_NAME` | Nom du conteneur PostgreSQL e2e |

Note importante pour les e2e : le profil Spring `test` ne doit jamais lire `DB_*`. Il doit viser uniquement `TEST_DB_*`, afin qu'un lancement e2e ne puisse pas toucher la base locale normale `cae_db`.

## Donnees de demonstration

Au demarrage, l'API seed automatiquement :

- 7 specialites : `Architecte`, `Executeur`, `Tacticien`, `Gardien`, `Catalyseur`, `Perturbateur`, `Guerisseur`
- une liste d'avatars DiceBear
- 2 teams : `TEAM_ALPHA` et `TEAM_OMEGA`

Comptes de demonstration :

| Email | Tag | Role | Team | Mot de passe |
| --- | --- | --- | --- | --- |
| `lea@mail.com` | `Lynx` | utilisateur, responsable principal | `TEAM_ALPHA` | `password` |
| `tom@mail.com` | `Rogue` | utilisateur | `TEAM_ALPHA` | `password` |
| `ines@mail.com` | `Pulse` | administratrice | `TEAM_ALPHA` | `password` |
| `tibo@mail.com` | `Iron` | administrateur, responsable principal | `TEAM_OMEGA` | `password` |

## Routes frontend

Routes actuellement exposees par l'application :

- `/`
- `/register`
- `/login`
- `/profile`
- `/notifications`
- `/teams`
- `/teams/:teamId`
- `/administration` (reserve aux administrateurs)

## Vue d'ensemble de l'API

Le README documente les domaines publics de l'API sans recopier une specification exhaustive :

- `auths` : inscription, connexion, refresh du token
- `users/me` : profil courant, mot de passe, specialite, photo de profil, indisponibilites
- `teams` : liste, detail, creation, designation d'un co-responsable, depart d'une team
- `teams/memberships` : demande d'adhesion, lecture de la membership courante, membres d'une team, acceptation et refus
- `notifications` : liste, detail, marquage comme lu
- `administrators` : listing des admins, listing des non-admins, promotion, retrogradation
- `specialities` : lecture des specialites disponibles
- `profile-pictures` : lecture des avatars disponibles

Les actions backend non exposees dans l'interface actuelle ne sont pas presentees comme des fonctionnalites UI disponibles.

## Configuration IntelliJ IDEA

Cette section s'adresse aux contributeurs qui developpent le backend avec IntelliJ IDEA Ultimate ou Community.

### 1. Ouvrir le projet

`File > Open` → selectionner le dossier `api/` (pas la racine du depot).
IntelliJ detecte automatiquement le `pom.xml` Maven et importe les dependances.

### 2. Configurer le SDK Java

`File > Project Structure > Project` → selectionner ou telecharger **Java 21**.

### 3. Creer une Run Configuration Spring Boot

1. `Run > Edit Configurations > + > Spring Boot`
2. **Main class** : `be.vinci.ipl.cae.demo.DemoApplication`
3. Onglet **Environment variables** : charger les variables depuis `api/.env`.
   - Avec le plugin **EnvFile** (recommande) : cocher *Enable EnvFile* et ajouter le fichier `api/.env`.
   - Sans plugin : copier-coller chaque variable (`DB_HOST`, `DB_PORT`, etc.) dans le champ *Environment variables* de la Run Configuration.
4. Cliquer **OK** puis lancer avec le bouton ▶.

**Plugin recommande** : [EnvFile](https://plugins.jetbrains.com/plugin/7861-envfile) — permet de pointer directement vers un fichier `.env` sans saisie manuelle.

### 4. Lancer les tests JUnit

Les tests JUnit se lancent depuis l'icone ▶ dans l'editeur a cote de chaque classe ou methode, ou via `Run > Run All Tests`.

Pour les tests e2e, creer une Run Configuration separee avec les variables de `api/.env.test` et le profil Spring `test` ajoute dans *Active profiles*.

## Commandes utiles

### Backend

```bash
cd api
./mvnw spring-boot:run
./mvnw test
./mvnw package
```

### Frontend

```bash
cd frontend
npm install
API_PORT=3000 npm run dev
npm run build
npm run test
npm run coverage
```

### E2E

```bash
cd e2e
npm install
npx playwright install chromium
npm test
npm run test:ui
npm run test:report
```

## Environnement e2e

Le lancement e2e utilise :

- `api/.env.test` pour les variables d'environnement backend
- `application-test.properties` pour le profil Spring `test`
- le service Docker `db_test`
- la base PostgreSQL dediee `cae_e2e`

Le but est d'eviter qu'un lancement e2e ne reutilise accidentellement `api/.env`, les variables `DB_*` normales, ou le service PostgreSQL de developpement.

Preparation :

```bash
cd api
cp .env.test.example .env.test
```

Le fichier `api/.env.test` est prive et ne doit pas etre committe. Le fichier `api/.env.test.example` documente la structure attendue.

Configuration attendue :

- dev :
  - conteneur `postgres_container`
  - port `5433`
  - base `cae_db`
- e2e :
  - conteneur `postgres_test_container`
  - port `5434`
  - base `cae_e2e`

## Tests et outillage

- L'API contient des tests JUnit ainsi que des fichiers `.http` dans `api/src/test` pour tester les endpoints manuellement.
- Le frontend contient des tests Vitest pour les contexts, services et pages principales.
- Un projet Playwright se trouve dans `e2e/` pour les tests e2e `register` et `login`.
- La couverture backend est generee par JaCoCo pendant `./mvnw test`.

## Tests e2e

Les tests e2e Playwright vivent dans `e2e/tests` et ciblent `chromium` uniquement pour eviter les collisions de donnees.

Avant de les lancer :

1. demarrer la base e2e `db_test` depuis `api/`
2. charger explicitement `api/.env.test`
3. demarrer l'API avec le profil `test`
4. demarrer le frontend avec le meme `API_PORT`

Exemple :

```bash
cd api
docker compose --env-file .env.test up -d db_test
set -a
source .env.test
set +a
./mvnw spring-boot:run -Dspring-boot.run.profiles=test
```

Dans un second terminal :

```bash
cd frontend
npm install
API_PORT=3000 npm run dev
```

Dans un troisieme terminal :

```bash
cd e2e
npm install
npx playwright install chromium
npm test
```

Le profil Spring `test` recree le schema de la base cible a chaque demarrage. Il pointe vers `TEST_DB_*`, donc vers la base dediee `cae_e2e` exposee par `db_test`, jamais vers `cae_db`. Une fois `api/.env.test` charge, vous repartez d'un etat stable avec les donnees seedees par `DemoApplication`, notamment `lea@mail.com / password`.

## Notes importantes

- L'API lit actuellement le JWT brut dans l'en-tete `Authorization`, sans prefixe `Bearer`.
- Le frontend suppose que le port configure via `API_PORT` correspond bien au port reel de l'API.
- Le fichier `api/documentation.yaml` n'est pas une source fiable pour decrire l'etat actuel de l'application.
- Le frontend impose une politique de mot de passe a l'inscription : au moins 8 caracteres, 1 majuscule, 1 minuscule et 1 chiffre.
- Les comptes seedes utilisent toutefois le mot de passe `password` pour faciliter les tests locaux.
