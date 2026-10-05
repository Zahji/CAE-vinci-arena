# Vinci Arena

Application web de gestion d'équipes et de tournois e-sport. Les joueurs créent leur profil, rejoignent une équipe, s'inscrivent à des tournois et suivent leurs matchs jusqu'à la finale.

Projet de groupe réalisé dans le cadre du cours CAE à l'IPL Vinci (Haute École Léonard de Vinci, Bruxelles).

## Fonctionnalités

**Joueurs**
- Inscription et connexion (JWT), avec choix d'une spécialité et d'un avatar
- Profil : mot de passe, spécialité, avatar, indisponibilités
- Page membre publique avec historique d'activité et anciennes équipes
- Notifications

**Équipes**
- Création d'une équipe, demandes d'adhésion, acceptation ou refus
- Désignation d'un co-responsable, renonciation au rôle de responsable, départ d'une équipe

**Tournois et matchs**
- Création, modification et suppression de tournois
- Inscription des équipes à un tournoi
- Génération automatique des matchs et affichage du tableau (bracket)
- Sélection des joueurs pour chaque match
- Encodage des scores, validation ou contestation du résultat, forfait

**Administration**
- Promotion et rétrogradation d'administrateurs
- Bannissement de membres

## Stack technique

| | |
| --- | --- |
| Backend | Java 21, Spring Boot 3.3, Spring Data JPA, JWT |
| Base de données | PostgreSQL |
| Frontend | React 18, TypeScript, Vite, Material UI |
| Tests | JUnit, Mockito, JaCoCo (API) · Vitest, React Testing Library (front) · Playwright (E2E) |
| Qualité | Checkstyle, ESLint, Prettier, Husky |
| Déploiement | Docker, Docker Compose, Nginx, GitLab CI |

## Structure du dépôt

```text
.
├── api/        # API REST Spring Boot
├── frontend/   # Application React
├── e2e/        # Tests end-to-end Playwright
├── docker-compose.yaml
└── nginx.conf  # Reverse proxy : /api vers l'API, le reste vers le front
```

## Lancer le projet avec Docker

Prérequis : Docker et Docker Compose.

```bash
cp .env.example .env    # puis remplir les valeurs
docker compose up --build
```

L'application est ensuite disponible sur http://localhost.

## Lancer le projet en développement

Prérequis : Java 21, Node.js 18+, Docker.

**1. Base de données et API**

```bash
cd api
cp .env.example .env    # puis remplir les valeurs
docker compose up -d db
./mvnw spring-boot:run
```

L'API tourne sur le port défini par `API_PORT` (3000 par défaut).

**2. Frontend**

```bash
cd frontend
npm install
API_PORT=3000 npm run dev
```

Le front est disponible sur http://localhost:5173. `API_PORT` doit correspondre au port de l'API.

### Variables d'environnement

| Variable | Description |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Connexion PostgreSQL |
| `DB_USER`, `DB_PASSWORD` | Identifiants PostgreSQL |
| `PGRES_CONTAINER_NAME` | Nom du conteneur PostgreSQL |
| `JWT_SECRET` | Secret de signature des tokens (`openssl rand -base64 64`) |
| `API_PORT` | Port de l'API |

## Tests

```bash
# API : tests unitaires et rapport de couverture
cd api && ./mvnw test

# Frontend : lint et tests avec couverture
cd frontend && npm run lint && npm run coverage

# E2E (API et front lancés)
cd e2e && npm install && npx playwright install chromium && npm test
```

La pipeline GitLab CI lance les tests de l'API et du front, build les deux projets puis construit les images Docker.

## Comptes de démonstration

Au démarrage, l'API crée des données de test (spécialités, avatars, deux équipes). Comptes disponibles, mot de passe `password` :

| Email | Rôle |
| --- | --- |
| `lea@mail.com` | Utilisatrice, responsable de TEAM_ALPHA |
| `tom@mail.com` | Utilisateur |
| `ines@mail.com` | Administratrice |
| `tibo@mail.com` | Administrateur, responsable de TEAM_OMEGA |

## Équipe

- Zahra Hajji
- Simon Storme
- Adrian Kajewski
- Tiago Laranjeira
- Jordi van Cuijlenborg
- Hadjé Abakar
