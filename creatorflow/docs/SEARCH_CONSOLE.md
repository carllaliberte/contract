# Google Search Console — CreatorFlow

Guide pour indexer la landing CreatorFlow sur GitHub Pages.

**URL de production :** https://carllaliberte.github.io/contract/creatorflow/

## 1. Ajouter la propriété

1. Ouvrir [Google Search Console](https://search.google.com/search-console).
2. **Ajouter une propriété** → type **Préfixe d’URL**.
3. Entrer : `https://carllaliberte.github.io/contract/creatorflow/`

## 2. Vérifier le domaine (balise HTML)

1. Choisir la méthode **Balise HTML**.
2. Copier la valeur `content` du meta tag fourni (ex. `abc123…`).
3. Dans `creatorflow/index.html`, décommenter et remplacer `CONTENT_ID` :

```html
<meta name="google-site-verification" content="VOTRE_CODE_ICI" />
```

4. Déployer (`push` sur `main` → workflow Deploy CreatorFlow).
5. Retourner dans Search Console et cliquer **Vérifier**.

## 3. Soumettre le sitemap

Après vérification :

1. **Sitemaps** → ajouter :
   `https://carllaliberte.github.io/contract/creatorflow/sitemap.xml`
2. Confirmer l’état **Réussite**.

## 4. Contrôles utiles

| Ressource | URL |
| --- | --- |
| Landing (FR) | https://carllaliberte.github.io/contract/creatorflow/ |
| Landing (EN) | https://carllaliberte.github.io/contract/creatorflow/?lang=en |
| `robots.txt` | https://carllaliberte.github.io/contract/creatorflow/robots.txt |
| `sitemap.xml` | https://carllaliberte.github.io/contract/creatorflow/sitemap.xml |

## 5. Bonnes pratiques

- Ne pas indexer `/app/*` : le meta `robots` passe à `noindex, nofollow` dans l’app (démo).
- La landing est prerenderée (`npm run build:seo`) pour que les crawlers voient le H1 et le contenu.
- FAQ : section visible `#faq` + JSON-LD `FAQPage` injecté côté client (capturé au prerender).
- PWA : `manifest.webmanifest` lié dans `index.html` (install optionnelle, pas requis pour l’indexation).

## 6. Dépannage

- **404 sur routes profondes** : GitHub Pages sert `404.html` (copie de `index.html` au build).
- **Contenu vide pour Google** : vérifier que le deploy utilise `npm run build:seo`, pas seulement `build`.
- **Hreflang** : FR par défaut ; EN via `?lang=en` (déclaré dans `index.html` et `sitemap.xml`).
