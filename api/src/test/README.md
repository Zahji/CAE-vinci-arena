# Configuration HTTP Client - Tests API

## Vue d'ensemble

Ce dossier contient les fichiers de test HTTP pour tester les endpoints de l'API. Pour que les tests fonctionnent correctement avec les variables d'environnement, vous devez configurer le fichier `http-client.private.env.json`.

## Fichier d'environnement : `http-client.private.env.json`

### Structure du fichier

```json
{
  "development": {
    "baseUrl": "http://localhost:3000",
    "adminToken": "<REPLACE ME: demo admin token used for admin.http>",
    "token": "<REPLACE ME: token used for profiles.http test>"
  }
}
```

### Variables disponibles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `baseUrl` | L'URL de base de votre API locale | `http://localhost:3000` |
| `adminToken` | Token d'authentification pour les requêtes admin | Token JWT obtenu après login admin |
| `token` | Token d'authentification pour les tests utilisateurs | Token JWT obtenu après login utilisateur |

## Créer le fichier d'environnement

1. **Dupliquer le fichier exemple** :
   ```bash
   cp http-client.private.env.example.json http-client.private.env.json
   ```

2. **Remplir les valeurs** :
   - Remplacez `<demo admin token>` par un vrai token admin
   - Remplacez `<token used for profiles.http test>` par un vrai token utilisateur

   Ces tokens peuvent être obtenus en se connectant à votre API via des requêtes de login.

3. ** Important** : Le fichier `http-client.private.env.json` est **privé** et ne doit pas être commité dans Git. Il est listé dans `.gitignore`.

## Configuration dans IntelliJ IDEA / WebStorm

### Option 1 : Configuration automatique (recommandée)

1. Ouvrez un fichier `.http` dans IntelliJ
2. IntelliJ détecte automatiquement le fichier `http-client.private.env.json` dans le même dossier
3. **Sélectionnez l'environnement** : En haut à droite des fichiers `.http`, cliquez sur le sélecteur d'environnement
4. Choisissez `development`

### Option 2 : Configuration manuelle

1. Allez dans **File** → **Settings** -> **Tools** -> **HTTP Client** (ou **Preferences** sur macOS)
2. Sous **Environment**, cliquez sur le fichier d'environnement à utiliser
3. Sélectionnez `http-client.private.env.json`
4. Cliquez sur **OK**

## Utiliser les variables dans les requêtes

### Exemple dans un fichier `.http`

```http
### Get current profile
GET {{baseUrl}}/api/profiles/me
Authorization: Bearer {{token}}
```

```http
### Delete a team (admin only)
DELETE {{baseUrl}}/api/teams/123
Authorization: Bearer {{adminToken}}
```

### Syntaxe des variables

- Les variables d'environnement sont encadrées par `{{ }}` (double accolade)
- Les variables personnalisées sont précédées par `@` dans le fichier `.http`

## Sécurité

- **Ne commitez JAMAIS** `http-client.private.env.json` dans Git
- Utilisez `http-client.private.env.example.json` comme modèle pour documenter la structure
- Les tokens doivent être générés localement ou dans un environnement de test sécurisé
- Changez régulièrement vos tokens de test

## Fichiers de test disponibles

- `admin.http` - Endpoints d'administration
- `profiles.http` - Tests des profils utilisateurs
- `teams.http` - Tests de gestion des équipes
- `notifs.http` - Tests des notifications

## Dépannage

**Problème** : Les variables ne sont pas remplacées dans les requêtes
- ✓ Vérifiez que le fichier `http-client.private.env.json` existe
- ✓ Vérifiez l'orthographe exacte des variables
- ✓ Sélectionnez l'environnement `development` dans IntelliJ

**Problème** : Erreur 401 (Unauthorized)
- ✓ Assurez-vous que les tokens sont valides et à jour
- ✓ Vérifiez que le token n'a pas expiré
- ✓ Confirmer que le token correspond à l'utilisateur testé

**Problème** : Connexion refusée
- ✓ Assurez-vous que votre API est en cours d'exécution sur le `baseUrl`
- ✓ Vérifiez le port (par défaut 3000)

## Ressources utiles

- [Documentation IntelliJ HTTP Client](https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html)
- [Guide des environnements HTTP Client](https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html#manage-environment)
