# <InternalPageTitle> Où sauvegarder de l'info dans un browser ? </InternalPageTitle>

Nous avons vu qu'une des exigences associées à la création d'une application selon l'architecture REST, c'est qu'elle soit **stateless** : l'API ne peut pas garder l'état du client, sa session, côté serveur.

C'est donc au client de sauvegarder ses données de session.

Mais où pouvons nous sauvegarder des données de manière persistante côté client ?

Il existe deux façons principales de sauvegarder de l'info dans un browser :

- le **web storage** ;
- les **cookies**.

Dans le cadre de ce cours, nous allons principalement voir comment sauvegarder de l'info à l'aide du **web storage**. Dans la partie du cours sur la gestion de l'authentification et l'autorisation d'utilisateurs, vous pourrez optionnellement voir comment les cookies peuvent être utilisés pour sauvegarder des données de session côté client.

NB : le browser met à disposition d'autres API un peu moins connues pour sauvegarder des infos. Nous ne les verrons pas dans le cadre de ce cours, mais il reste néanmoins intéressant de lire très rapidement de quoi il s'agit :

- **IndexedDB API** : permet de sauvegarder côté client de grandes quantités d'infos structurées, incluant des fichiers ; c'est une base de données orientée objets en JS qui permet les transactions.
- **Cache API** : permet d'enregistrer et retrouver des requêtes et leur réponses. Bien qu'à la base créé pour pouvoir fournir des réponses plus rapides à certaines requêtes, cette API peut aussi être utilisée comme mécanisme général de stockage.

# <InternalPageTitle> Persistance de données de session via le web storage </InternalPageTitle>

## Introduction

Le **Web Storage API** fournit un mécanisme permettant aux browser d'enregistrer des paires **clé / valeur** d'une manière plus intuitive que l'utilisation de cookies.

Il existe deux mécanismes au sein du web storage :

- **sessionStorage** :
  - offre un espace de stockage séparé pour chaque origine pour la durée de la session d'une page, tant que le browser est ouvert.
  - les clés / valeurs y sont enregistrées sous forme de string uniquement ;
  - met à disposition un espace de stockage plus grand qu'un cookie, ~5MB maximum par origine ;
- **localStorage** :
  - offre aussi un espace de stockage séparé pour chaque origine, mais les données persistent quand le browser est fermé et réouvert ;
  - est un espace de stockage plus grand qu'un cookie, limité à ~10MB en cas de crash/restart du browser.

Les principales méthodes offertes par **sessionStorage** et **localStorage** sont les mêmes. Voici quelques exemples de codes par méthode.

## `setItem()`

Cette méthode permet d'enregistrer, pour une clé donnée, la valeur associée :

```ts numbered highlighting="5"
const storeName = 'user';

const setUserSessionData = (user) => {
  const storageValue = JSON.stringify(user);
  localStorage.setItem(storeName, storageValue);
};
```

Pour enregistrer un objet JS sous forme de string, il suffit de le sérialiser à l'aide de la méthode `JSON.stringify()`.

## `getItem()`

Cette méthode permet d'obtenir la valeur associée à la clé donnée en argument :

```ts numbered highlighting="4"
const storeName = 'user';

const getUserSessionData = () => {
  const retrievedUser = localStorage.getItem(storeName);
  if (!retrievedUser) return;
  return JSON.parse(retrievedUser);
};
```

Pour cet exemple, comme la valeur a été sérialisée, nous pouvons récupérer l'objet grâce à la méthode **`JSON.parse()`**.

## `removeITem()`

Cette méthode permet d'effacer une clé / valeur :

```ts numbered highlighting="4"
const storeName = 'user';

const removeSessionData = () => {
  localStorage.removeItem(storeName);
};
```

## `clear()`

Cette méthode permet d'effacer tout l'espace de stockage pour une origine donnée.

Cette méthode est très utile lorsque l'on souhaite effacer toute la session d'un utilisateur, notamment lors du logout d'un utilisateur.

# <InternalPageTitle> Exercice : persistence d'un thème (ex17) </InternalPageTitle>

Veuillez continuer l'exercice précédent nommé `/exercises/XY` afin de compléter l'application `myMovies`.

Vous devez ajouter un moyen de switcher d'un thème "light" ou "dark" au sein de votre application.

Par exemple, vous pouvez le faire via un bouton dans le header ou le footer permettant de basculer d'un thème à l'autre.

Vous devez sauvegarder le thème sélectionné par l'utilisateur comme donnée de session persistante. Ainsi, vous allez sauvegarder l'information du thème dans le `localStorage`.

Au redémarrage du browser, ou lors du refresh du frontend, l'application doit toujours afficher ses écrans selon le dernier thème sélectionné : veuillez donc changer les couleurs de certains backgrounds et certains textes en fonction du thème.

Une fois tout fonctionel, veuillez faire un commit avec le message suivant : "new:exXY".

# <InternalPageTitle> Authentification d'un utilisateur via une IHM & JWT </InternalPageTitle>

Pour authentifier un utilisateur via une IHM, il suffit de faire une requête à une RESTful API.

Généralement, l'utilisateur devra d'abord créer son compte. Il utilisera un formulaire demandant au minimum un identifiant (username, adresse e-mail ou autres) et un password.  
Dans le cadre d'une SPA, l'IHM fera appel à une opération de type `register` lorsque l'utilisateur soumet le formulaire.

Par la suite, lorsque le compte de l'utilisateur existe, l'IHM fera appel à une opération de type `login` lorsque l'utilisateur tentera de se connecter à l'aide d'un formulaire.

Dans les deux cas, `register` ou `login`, le développeur devra connaître les opérations mises à disposition par l'API.

Dans le cadre du site de la pizzeria, nous savons que l'API met à disposition ces deux opérations :

| URI                  | Méthode HTTP | Opération                                                                                                                   |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **`auths/login`**    | **POST**     | Vérifier les credentials d'une ressource de type "users" et renvoyer le username et un token JWT si les credentials sont OK |
| **`auths/register`** | **POST**     | Créer une ressource de type "users" et renvoyer le username et un token JWT                                                 |

<br/>

Pour ce nouveau tutoriel, veuillez créer un projet nommé `session-jwt` sur base du projet `fetch-proxy`.

Veuillez démarrer la version **`/web2/tutorials/pizzeria/api/safe`** de la RESTful API de la pizzeria. En cas de souci, vous pouvez utiliser ce code-ci :
[api-safe](https://github.com/e-vinci/js-demos/tree/main/backend-restful-api/restful-api-essentials/safe).

Pour notre tutoriel, nous avons besoin de créer deux nouvelles pages :

- `RegisterPage` qui offrira un formulaire pour créer un compte utilisateur ; nous considérons qu'un utilisateur qui vient d'être créé est connecté (il ne doit donc pas se logguer).
- `LoginPage` qui offrira un formulaire pour se connecter à son compte utilisateur.

Nous allons commencer par `RegisterPage`.

💭 Très souvent, nous allons devoir penser si c'est à `RegisterPage` de faire le fetch des données, ou si ce fetch doit être fait ailleurs.

S'il n'y a pas d'état associé à un Register, alors tout semble OK de le faire dans `RegisterPage`. Néanmoins, si un utilisateur est connecté, il va falloir mettre jour la `Navbar`... et qui dit mise à jour de la UI, dit gestion de l'état...  
Ainsi, nous nous rendons compte qu'il est important de définir une variable d'état qui correspondra à l'utilisateur connecté, et qui nous permettra notamment d'afficher le nom de l'utilisateur connecté, d'afficher dynamiquement la `Navbar` (quand on est connecté, les options de créer un compte ou de se connecter doivent disparaître...).

Notons que nous souhaitons appliquer le même format à tous les formulaires de chacune des pages. Dès lors, le plus direct est de renommer `AddPizzaPage.css` en `index.css`. Nous allons utiliser `index.css` tant dans `AddPizzaPage` que `RegisterPage` (et plus tard `LoginPage`).

Ainsi, nous allons définir le fetch du register au sein de `App` en y ajoutant la nouvelle fonction `registerUser`, en mettant à jour le contexte, et en créant une nouvelle variable d'état `authenticatedUser` (associé à un nouveau type `AuthenticatedUser` et qui pourra aussi être associé à un type `MaybeAuthenticatedUser`) :

```tsx
// code existant
const [authenticatedUser, setAuthenticatedUser] =
  useState<MaybeAuthenticatedUser>(undefined);
// ...
const registerUser = async (newUser: NewUser) => {
  try {
    const options = {
      method: 'POST',
      body: JSON.stringify(newUser),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch('/api/auths/register', options);

    if (!response.ok)
      throw new Error(
        `fetch error : ${response.status} : ${response.statusText}`,
      );

    const createdUser: AuthenticatedUser = await response.json();

    setAuthenticatedUser(createdUser);
    console.log('createdUser: ', createdUser);
  } catch (err) {
    console.error('registerUser::error: ', err);
    throw err;
  }
};
// reste du code

const fullPizzaContext: PizzeriaContext = {
  addPizza,
  pizzas,
  setPizzas,
  actionToBePerformed,
  setActionToBePerformed,
  clearActionToBePerformed,
  drinks,
  registerUser,
};
```

Comme le contexte a été mis à jour, nous devons mettre à jour le type associé `PizzeriaContext`, ainsi que créer :

- un nouveau type `User`
- un nouveau type `AuthenticatedUser`
- un nouveau type `MaybeAuthenticatedUser`

Pour cela, veuillez mettre à jour `/src/types.ts` :

```ts
interface PizzeriaContext {
  pizzas: Pizza[];
  setPizzas: (pizzas: Pizza[]) => void;
  actionToBePerformed: boolean;
  setActionToBePerformed: (actionToBePerformed: boolean) => void;
  clearActionToBePerformed: () => void;
  drinks: Drink[];
  addPizza: (newPizza: NewPizza) => Promise<void>;
  registerUser: (newUser: User) => Promise<void>;
}

interface User {
  username: string;
  password: string;
}

interface AuthenticatedUser {
  username: string;
  token: string;
}

type MaybeAuthenticatedUser = AuthenticatedUser | undefined;

export type {
  Pizza,
  NewPizza,
  Drink,
  PizzeriaContext,
  User,
  AuthenticatedUser,
  MaybeAuthenticatedUser,
};
```

Et voici le code de la nouvelle `RegisterPage` qui fait appel au contexte pour récupérer la fonction `registerUser` :

```tsx numbered
import { useState, SyntheticEvent } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PizzeriaContext } from '../../types';

const RegisterPage = () => {
  const { registerUser }: PizzeriaContext = useOutletContext();

  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    registerUser({ username, password });
    navigate('/');
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    try {
      await registerUser({ username, password });
      navigate('/');
    } catch (err) {
      console.error('RegisterPage::error: ', err);
    }
  };

  const handlePasswordChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setPassword(input.value);
  };

  return (
    <div>
      <h1>Ajoutez un utilisateur</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          value={username}
          type="text"
          id="username"
          name="username"
          onChange={handleUsernameInputChange}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          value={password}
          type="text"
          id="password"
          name="password"
          onChange={handlePasswordChange}
          required
        />
        <button type="submit">Créer le compte</button>
      </form>
    </div>
  );
};

export default RegisterPage;
```

Maintenant nous devons mettre à jour la configuration de notre router pour offrir la `RegisterPage` : pour ce faire, veuillez mettre à jour `/src/main.tsx` :

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <HomePage />,
      },
      {
        path: 'add-pizza',
        element: <AddPizzaPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
]);
```

Il faut aussi mettre à jour la `Navbar` :

```tsx
interface NavBarProps {
  authenticatedUser: MaybeAuthenticatedUser;
}

const NavBar = ({ authenticatedUser }: NavBarProps) => {
  const navigate = useNavigate();

  if (authenticatedUser) {
    return (
      <nav>
        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/add-pizza')}>
          Ajouter une pizza
        </button>
      </nav>
    );
  }

  return (
    <nav>
      <button onClick={() => navigate('/')}>Home</button>
      <button onClick={() => navigate('/register')}>
        Créer un utilisateur
      </button>
      <button onClick={() => navigate('/login')}>Se connecter</button>
    </nav>
  );
};
```

Ici nous avons ajouté un paramètre qui contiendra, l'éventuel `authenticatedUser` si l'utilisateur vient de créer son compte (ou s'il s'est loggué, mais nous verrons ça plus tard).

Nous mettons donc à jour le `return` de `App` afin de passer cette variable `authenticatedUser` à la `Navbar` :

```tsx
return (
  <div className="page">
    <Header
      title="We love Pizza"
      version={0 + 1}
      handleHeaderClick={handleHeaderClick}
    />
    <main>
      <NavBar authenticatedUser={authenticatedUser} />
      <Outlet context={fullPizzaContext} />
    </main>
    <Footer />
  </div>
);
```

Veuillez exécuter le frontend et vous assurer que l'utilisateur que vous tentez de créer est bien créé par votre API.

Veuillez utiliser le formulaire de création de compte et vérifier que cela fonctionne. Une fois un nouveau compte créé, votre `Navbar` ne devrait plus afficher `Créer un utilisateur`.

Nous allons maintenant apporter des modifications quasi identiques pour gérer la page de Login.

Commençons par créer la fonction `loginUser` dans `App` :

```tsx
const loginUser = async (user: User) => {
  try {
    const options = {
      method: 'POST',
      body: JSON.stringify(user),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch('/api/auths/login', options);

    if (!response.ok)
      throw new Error(
        `fetch error : ${response.status} : ${response.statusText}`,
      );

    const authenticatedUser: AuthenticatedUser = await response.json();
    console.log('authenticatedUser: ', authenticatedUser);

    setAuthenticatedUser(authenticatedUser);
  } catch (err) {
    console.error('loginUser::error: ', err);
    throw err;
  }
};

// Reste du code

const fullPizzaContext: PizzeriaContext = {
  addPizza,
  pizzas,
  setPizzas,
  actionToBePerformed,
  setActionToBePerformed,
  clearActionToBePerformed,
  drinks,
  registerUser,
  loginUser,
};
```

Comme le contexte a été mis à jour, nous devons mettre à jour le type associé `PizzeriaContext` au sein de `/src/types.ts` :

```ts
interface PizzeriaContext {
  pizzas: Pizza[];
  setPizzas: (pizzas: Pizza[]) => void;
  actionToBePerformed: boolean;
  setActionToBePerformed: (actionToBePerformed: boolean) => void;
  clearActionToBePerformed: () => void;
  drinks: Drink[];
  addPizza: (newPizza: NewPizza) => Promise<void>;
  registerUser: (newUser: User) => Promise<void>;
  loginUser: (user: User) => Promise<void>;
}
```

Et voici le code de la nouvelle `LoginPage` qui fait appel au contexte pour récupérer la fonction `loginUser` :

```tsx numbered
import { useState, SyntheticEvent } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PizzeriaContext } from '../../types';

const LoginPage = () => {
  const { loginUser }: PizzeriaContext = useOutletContext();

  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    try {
      await loginUser({ username, password });
      navigate('/');
    } catch (err) {
      console.error('LoginPage::error: ', err);
    }
  };

  const handleUsernameInputChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setUsername(input.value);
  };

  const handlePasswordChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setPassword(input.value);
  };

  return (
    <div>
      <h1>Connectez un utilisateur</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          value={username}
          type="text"
          id="username"
          name="username"
          onChange={handleUsernameInputChange}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          value={password}
          type="text"
          id="password"
          name="password"
          onChange={handlePasswordChange}
          required
        />
        <button type="submit">S'authentifier</button>
      </form>
    </div>
  );
};

export default LoginPage;
```

Maintenant nous devons mettre à jour la configuration de notre router pour offrir la `LoginPage` : pour ce faire, veuillez mettre à jour `/src/main.tsx` :

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <HomePage />,
      },
      {
        path: 'add-pizza',
        element: <AddPizzaPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
    ],
  },
]);
```

Il faut aussi mettre à jour la `Navbar` :

```tsx
const NavBar = ({ authenticatedUser }: NavBarProps) => {
  const navigate = useNavigate();

  if (authenticatedUser) {
    return (
      <nav>
        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/add-pizza')}>
          Ajouter une pizza
        </button>
      </nav>
    );
  }

  return (
    <nav>
      <button onClick={() => navigate('/')}>Home</button>
      <button onClick={() => navigate('/register')}>
        Créer un utilisateur
      </button>
      <button onClick={() => navigate('/login')}>Se connecter</button>
    </nav>
  );
};
```

Veuillez exécuter le frontend et vous assurer que pour l'utilisateur préalablement créé, vous pouvez l'utiliser pour vous logguer.

## Sauvegarde des données de session

Maintenant, bien que l'utilisateur soit connecté et donc authentifié, si nous faisons un refresh de la page, nous perdons les données de session.

Nous allons donc voir comment sauvegarder `authenticatedUser` dans le `localStorage`.

💭 Mais quel est le format d'un `AuthenticatedUser` ?  
Celui-ci est fixé par notre API et nous l'avons déjà défini dans `types.ts`... Voici un exemple de sa forme :

```json
{
  "username": "me",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im1lIiwiaWF0IjoxNzE5ODIxMTEwLCJleHAiOjE4MDYyMjExMTB9.cyw8HYhLxEWIsdAJQ0dO_wuokib20zTNxqYLpj74Wp4"
}
```

💭 A quel moment sauvegarder les données de session ?  
Ici, l'utilisateur est connecté lors du register, ou lors du login. C'est donc à se moment là qu'il faut sauvegarder ses données dans le `localStorage`.  
Commme nous allons réutiliser un même traitement (tant dans login que dans register), nous pouvons directement éviter une duplication de code en créant une fonction `storeAuthenticatedUser`. De plus, nous avons besoin d'une fonction qui nous permettra de récupérer l'utilisateur authentifié du `localStorage`.

Veuillez créer un nouveau script `/src/utils/session.ts` et y ajouter ce code-ci :

```ts
import { AuthenticatedUser, MaybeAuthenticatedUser } from '../types';

const storeAuthenticatedUser = (authenticatedUser: AuthenticatedUser) => {
  localStorage.setItem('authenticatedUser', JSON.stringify(authenticatedUser));
};

const getAuthenticatedUser = (): MaybeAuthenticatedUser => {
  const authenticatedUser = localStorage.getItem('authenticatedUser');

  if (!authenticatedUser) return undefined;

  return JSON.parse(authenticatedUser);
};

export { storeAuthenticatedUser, getAuthenticatedUser };
```

Veuillez mettre à jour `App` afin de faire appelle à `storeAuthenticatedUser` lors du login et du register :

```tsx
const registerUser = async (newUser: User) => {
  try {
    const options = {
      method: 'POST',
      body: JSON.stringify(newUser),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch('/api/auths/register', options);

    if (!response.ok)
      throw new Error(
        `fetch error : ${response.status} : ${response.statusText}`,
      );

    const createdUser: AuthenticatedUser = await response.json();

    setAuthenticatedUser(createdUser);
    storeAuthenticatedUser(createdUser);

    console.log('createdUser: ', createdUser);
  } catch (err) {
    console.error('registerUser::error: ', err);
    throw err;
  }
};

const loginUser = async (user: User) => {
  try {
    const options = {
      method: 'POST',
      body: JSON.stringify(user),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch('/api/auths/login', options);

    if (!response.ok)
      throw new Error(
        `fetch error : ${response.status} : ${response.statusText}`,
      );

    const authenticatedUser: AuthenticatedUser = await response.json();
    console.log('authenticatedUser: ', authenticatedUser);

    setAuthenticatedUser(authenticatedUser);
    storeAuthenticatedUser(authenticatedUser);
  } catch (err) {
    console.error('loginUser::error: ', err);
    throw err;
  }
};
```

💭 A quel moment devons nous faire appel à `getAuthenticatedUser` pour récupérer les données du `localStorage` ?  
En fait, cela doit se faire au chargement de la page. Et nous souhaitons, si nous récupérons un utilisateur authentifié, passer cet utilisateur à la `Navbar`. Une façon simple de réaliser cette action, c'est la toute première fois que `App` est appelé, en utilisant son `useEffect`. Veuillez donc mettre à jour le `useEffect` de `App` :

```tsx
useEffect(() => {
  fetchPizzas();
  const authenticatedUser = getAuthenticatedUser();
  if (authenticatedUser) {
    setAuthenticatedUser(authenticatedUser);
  }
}, []);
```

Veuillez connecter un utilisateur et faire un refresh de la page... Et voila, vous devriez rester connecté : )

N'hésitez pas à aller voir le `localStorage` de votre browser. Pour Chrome, dans vos outils de développeurs, celui-ci se trouve dans l'onglet `Application`.

## Déconnecter un utilisateur

Il est à noter que pour avoir une application complète, il va aussi falloir penser à faire effacer les données de session.

Nous allons ajouter un élément à la `Navbar` qui se nomme `Se déconnecter`. Lorsqu'on cliquera sur cet élément, nous devons mettre à jour la variable d'état `authenticatedUser` qui se trouve dans `App` et nous devons effacer les données de session du `localStorage`. Comme l'état est géré dans le composant "parent" de la `Navbar`, nous allons créer une fonction dans `App` qui permette d'agir sur cet état.

Veuillez donc mettre à jour `App` en lui ajoutant cette fonction `clearUser` et en passant cette fonction à la `Navbar` :

```tsx
//....
const clearUser = () => {
  clearAuthenticatedUser();
  setAuthenticatedUser(undefined);
};
// ... reste du code
return (
  <div className="page">
    <Header
      title="We love Pizza"
      version={0 + 1}
      handleHeaderClick={handleHeaderClick}
    />
    <main>
      <NavBar authenticatedUser={authenticatedUser} clearUser={clearUser} />
      <Outlet context={fullPizzaContext} />
    </main>
    <Footer />
  </div>
);
```

Voici le code de la `Navbar` mis à jour pour ajouter l'élement de déconnexion et l'action associée :

```tsx
interface NavBarProps {
  authenticatedUser: MaybeAuthenticatedUser;
  clearUser: () => void;
}

const NavBar = ({ authenticatedUser, clearUser }: NavBarProps) => {
  const navigate = useNavigate();

  if (authenticatedUser) {
    return (
      <nav>
        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/add-pizza')}>
          Ajouter une pizza
        </button>
        <button onClick={() => clearUser()}>Se déconnecter</button>
      </nav>
    );
  }

  return (
    <nav>
      <button onClick={() => navigate('/')}>Home</button>
      <button onClick={() => navigate('/register')}>
        Créer un utilisateur
      </button>
      <button onClick={() => navigate('/login')}>Se connecter</button>
    </nav>
  );
};
```

Veuillez tester l'application, vous connecter, déconnecter... Cela devrait bien fonctionner.

Il nous reste à faire en sorte que l'on puisse autoriser l'opération de création de pizza.

# <InternalPageTitle> Autorisation de l'appel à une opération protégée </InternalPageTitle>

Veuillez connecter un utilisateur, cliquer sur `Ajouter une pizza`, compléter le formulaire d'ajout d'une pizza, cliquer sur `Ajouter` et regarder dans la console : il devrait y avoir une erreur qui s'affiche avec le "status code" **`401 : Unauthorized`**.  
En effet, l'API attend un token pour autoriser l'opération de création d'une pizza.

Nous allons donc mettre à jour la fonction permettant de créer une pizza qui est définie dans `App` pour ajouter le token de l'utilisateur authentifié au sein du header de la requête :

```tsx numbered highlighting="1"
 const addPizza = async (newPizza: NewPizza) => {
    try {
      if(!authenticatedUser)  {
        throw new Error("You must be authenticated to add a pizza");
      }
      const options = {
        method: "POST",
        body: JSON.stringify(newPizza),
        headers: {
          "Content-Type": "application/json",
          Authorization: authenticatedUser.token,
        },
      };
      // Suite du code
```

Veuillez vous connecter à l'IHM à l'aide du compte **`manager`** et tenter d'ajouter une pizza. Cela ne devrait toujours pas fonctionner. Veuillez regarder dans la console : il devrait y avoir une erreur qui s'affiche avec le "status code" **`403 : Forbidden`**.  
En effet, l'API attend un token pour autoriser l'opération de création d'une pizza, mais seulement **`admin`** a le privilège d'ajouter une pizza au menu !

Déconnectez-vous, reconnectez-vous à l'aide du compte **`admin`** (password `admin` par défaut ; ), et ajoutez une pizza.
Voila ! Le site devrait être entièrement fonctionnel !

💭 Est-ce que c'est "safe" que notre IHM affiche le menu "Ajouter une pizza" pour un utilisateur qui n'est pas l'admin ?  
_En fait oui, c'est "safe", vous l'avez testé. L'API ne doit jamais faire confiance aux applications clientes pour appliquer la sécurité. Ainsi, même si le frontend autorise l'accès à des opérations qui ne devraient pas être permises, au regard des autorisations appliquées par l'API, ça n'a pas d'importance point de vue sécurité.  
De la même façon, c'est pour ça qu'une API doit aussi toujours valider les paramètres qu'elle reçoit. Elle ne peut pas faire confiance aux applications clientes, comme par exemple à une application web tournant dans un browser, pour valider tous les champs d'un formulaire.  
La raison est simple, l'API est développée indépendamment des applications clientes, elle ne peut pas supposer que les requêtes seront toujours bien construites._

💭 OK, tout est "safe" si l'API fait toutes les vérifications nécessaires. Néanmoins, n'y a-t-il pas des règles de bonnes pratiques au niveau des IHM, pour ne pas permettre de faire n'importe quelles requêtes vers des API ?  
_Et bien oui, au niveau des IHM, pour des questions d'**ergonomie**, d'expérience utilisateur, on va faire en sorte :_

- _de ne pas offrir des opérations qui ne seront pas autorisées. Par exemple, dans le cadre de ce tutoriel sur un site permettant de gérer une pizzeria, il ne faut pas "frustrer" les utilisateurs en leur faisant croire qu'ils ont accès à l'opération de créer une pizza ! Imaginez-vous, vous créez une nouvelle pizza de 32 ingrédients, et lors de la soumission, vous recevez un message comme quoi vous n'êtes pas l'admin du site et que vous n'avez donc pas le droit de créer une pizza 😲!_
- _de ne pas demander du travail à une API quand l'IHM peut détecter que ce n'est pas utile.
  Ainsi, quand une IHM offre des formulaires, qui amèneront à des requêtes vers des API, on évitera d'autoriser la soumission des données tant que les champs n'ont pas été validés. Tout ce que l'IHM peut valider côté client, elle doit le faire. Le feedback sera plus rapide pour l'utilisateur, et les ressources de l'API seront économisées (pas d'appel inutile)._

N'hésitez donc pas à mettre à jour ce tutoriel pour faire en sorte de n'afficher "Ajouter une pizza" que si l'utilisateur est **`admin`**.

💭 Ca n'est pas un peu "cheap" que seul l'utilisateur **`admin`** puisse avoir le privilège d'administrateur du site ?  
_Hé bien oui, c'est "cheap". Généralement, dans le cadre d'applications plus robustes, nous allons ajouter un ou plusieurs rôle(s) aux utilisateurs. Par exemple, dans le cadre d'applications où les rôles sont simples, qu'il n'y a jamais qu'un seul rôle associé à un utilisateur, il suffirait d'ajouter au niveau de l'API la propriété **`role`** aux utilisateurs. La majorité des utilisateurs pourrait avoir un rôle dont la valeur serait **`default`**, et une minorité d'utilisateur auraient le rôle d'**`admin`**..._

On n'affiche actuellement **pas de message d'erreur** à l'utilisateur lorsque la réponse d'une API renvoie une erreur. Pour améliorer l'expérience de l'utilisateur, ce serait une amélioration à faire.

# Exercice : Authentification et appel d'opérations protégées par JWT (ex18)

Veuillez continuer l'exercice précédent nommé `/exercises/XY` afin de compléter l'application `myMovies`.

## Authentification et appel d'opérations nécessitant une autorisation JWT

Veuillez implémenter ces cas d'utilisation :

- **`register`** : les utilisateurs doivent pouvoir créer un compte.
- **`login`** : les utilisateur doivent pouvoir se loguer.
- **`logout`** : les utilisateurs doivent pouvoir se déconnecter.

N'hésitez pas à reprendre le code du tutoriel ; )

Votre application doit maintenant autoriser les opérations suivantes que pour des utilisateurs authentifiés :

- UC2 : l'ajout d'une ressource de type films via un formulaire d'ajout d'un film.
- UC3 : la suppression d'un film.
- UC4 : la mise à jour des données d'un film (à l'exception de l'id associé à un film).

Comme auparavant, cette opération est permise pour tous les utilisateurs, anonymes ou authentifiés :

- UC1 : l'affichage, sous forme de tableau, de toutes les ressources de type films.

Pensez à bien mettre à jour votre **`Navbar`** pour afficher les bons éléments en fonction que l'utilisateur est authentifié ou pas.

Faites attention, il n'est pas autorisé, pour des raisons d'ergonomie, que le frontend offre les fonctionnalités d'écriture de ressources pour les utilisateur non authentifiés. Vous devez donc rendre invisible les opérations non autorisées aux utilisateurs.

UC2 (create), UC3 (delete) et UC4 (update) doivent donc être invisibles pour les utilisateurs anonymes.

Veuillez faire en sorte de rajouter dans le web storage ces nouvelles données de session lors du login ou du register : le token et le username.

#### 🤝 Tips

- 💭 Comment rendre invisible les opérations d'écriture de certaines ressources au sein du frontend ?  
  Par exemple, vous pourriez afficher des boutons de type **`Effacerr`** ou **`Sauver`** que si l'utilisateur est authentifié.  
  De même, si l'utilisateur est anonyme, les ressources ne devraient pas être éditables.

## 🍬 Gestion de session & remember me

Vous pourriez ajouter une fonction "remember me" à votre formulaire de "login" et de "register" et faire en sorte que vos données de session soient sauvegardées :

- dans le **`localStorage`** si l'on clique sur une checkbox "Remember me" ;
- dans le **`sessionStorage`** si l'on ne clique pas sur la checkbox "Remember me" lors du login ou du register.
