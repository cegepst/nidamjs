# Example App (Vite + Tailwind + NidamJS)

Cette démo utilise désormais **Vite** pour orchestrer le développement de la bibliothèque et de l'application de test en temps réel.

## Procédure de lancement

Pour lancer l'application d'exemple avec le rechargement à chaud (HMR) :

```bash
# À la racine du projet
bun run dev

```

Ouvrez ensuite votre navigateur sur `http://localhost:8080`.

## Fonctionnement technique

Le projet utilise maintenant une structure de développement intégrée :

1. **Serveur de Dev** : Vite sert le dossier `examples/app` comme racine.
2. **Résolution des Modules** : Grâce aux alias configurés dans `vite.config.js`, l'application importe la bibliothèque directement depuis `/src/index.js` et les styles depuis `/src/styles/styles.css`.
3. **Tailwind CSS 4** : Les styles sont compilés à la volée par le plugin `@tailwindcss/vite`.

## Routes (Simulées ou API)

- `GET /` : Page d'accueil gérée par `examples/app/index.html`.
- `API /page-one` : Contenu de la première fenêtre (géré par votre serveur de routes).
- `API /page-two` : Contenu de la seconde fenêtre.

## Configuration WindowManager

La démo utilise la configuration par défaut de `createNidamApp()`, stabilisée pour le rendu dynamique :

- `layoutStabilizationMs: 650` : Assure que les fenêtres sont correctement centrées même si les styles Tailwind mettent quelques millisecondes à s'appliquer.

## Nouvelle structure de fichiers

```text
. (racine du projet)
├── src/                    # Code source de la librairie NidamJS
├── dist/                   # Fichiers compilés (générés via bun run build)
├── vite.config.js          # Configuration centrale (Alias, Dev server, Build)
└── examples/app/           # Application de test
    ├── index.html          # Point d'entrée principal
    └── main.js             # Import de nidamjs et nidamjs/style.css

```

## Notes de développement

- **Import Direct** : Dans `main.js`, on utilise `import 'nidamjs'` au lieu de chemins relatifs complexes.
- **Indépendance CSS** : Le fichier de style doit être importé manuellement via `import 'nidamjs/style.css'` pour simuler une utilisation réelle par un utilisateur final.
- **Production** : Pour tester la version compilée, lancez `bun run build` puis servez le dossier `dist`.
