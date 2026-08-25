# Google Play — META Dashboard

Package : `com.carllaliberte.meta`  
Version : `1.0` (versionCode `1`)

## Fiche store (FR)

**Titre** : META Token Dashboard  
**Description courte** : Consultez le token METAVERSE (META) sur la blockchain.  
**Description complète** :

Application en lecture seule pour consulter les métadonnées et balances du contrat ERC-20 META (METAVERSE) depuis le dépôt GitHub carllaliberte/contract.

Fonctionnalités :
- Nom, symbole, supply, frais, owner du token
- Recherche de balance par adresse de portefeuille
- Aucune transaction, aucun compte requis

**Catégorie** : Finance  
**Politique de confidentialité** : https://carllaliberte.github.io/contract/privacy.html  
**Site web** : https://carllaliberte.github.io/contract/

## Assets

| Asset | Fichier |
|-------|---------|
| Icône Play Store (512×512) | `google-app/public/icons/play-store-512.png` |
| Générer toutes les icônes | `npm run generate-icons` |

Captures d’écran : prendre 2–4 screenshots du dashboard sur un téléphone ou émulateur (1080×1920 ou 1080×2340).

## Fork GitHub (important)

Ce dépôt est un **fork** de `metaverse-eth/contract`. GitHub **ne transmet pas les secrets** aux workflows d’un fork (sécurité).

Pour que l’upload Play automatique fonctionne :
1. https://github.com/carllaliberte/contract/settings
2. Section **Danger Zone** → **Leave fork network** (quitter le réseau de fork)
3. Relancer le workflow Android

Sans cela, ajoutez les secrets ne suffit pas — le CI ne les verra jamais.


1. [Google Play Console](https://play.google.com/console) — inscription **25 USD** (une fois).
2. Compléter le profil développeur (identité, contact).

## Étape 2 — Créer l’application

1. Play Console → **Créer une application**
2. Nom : **META Token Dashboard**
3. Type : **Application** / **Gratuit**
4. Lors de la configuration du package, utiliser exactement : `com.carllaliberte.meta`
   - Le package ne peut pas être changé après création.

## Étape 3 — Keystore de signature (obligatoire)

Sur votre machine (une seule fois — **sauvegardez le fichier keystore**) :

```bash
ANDROID_KEYSTORE_PASSWORD='votre-mot-de-passe-store' \
ANDROID_KEY_PASSWORD='votre-mot-de-passe-cle' \
ANDROID_KEY_ALIAS='meta-upload' \
bash scripts/generate-android-keystore.sh
```

Le script affiche le Base64 pour GitHub. Pour un rappel des secrets :

```bash
bash scripts/prepare-play-github-secrets.sh
```

## Étape 4 — Secrets GitHub Actions

Dans [Settings → Secrets → Actions](https://github.com/carllaliberte/contract/settings/secrets/actions) :

| Secret | Contenu |
|--------|---------|
| `ANDROID_KEYSTORE_BASE64` | Base64 du fichier `release.keystore` (ligne entière) |
| `ANDROID_KEYSTORE_PASSWORD` | Mot de passe du keystore |
| `ANDROID_KEY_ALIAS` | `meta-upload` (ou votre alias) |
| `ANDROID_KEY_PASSWORD` | Mot de passe de la clé |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Contenu complet du fichier JSON du compte de service |

## Étape 5 — Compte de service Google Play API

### Option A — Cloud Shell (recommandé si vous êtes dans Google Cloud Console)

1. Ouvrir **Cloud Shell** (icône `>_` en haut à droite).
2. Cloner ou copier le script, puis exécuter :

```bash
curl -fsSL https://raw.githubusercontent.com/carllaliberte/contract/main/scripts/setup-gcp-play-api.sh -o setup-gcp-play-api.sh
bash setup-gcp-play-api.sh
```

Ou depuis un clone local : `bash scripts/setup-gcp-play-api.sh`

3. Suivre les instructions affichées pour l’invitation Play Console (étape 3 ci-dessous).

### Option B — Console web

1. [Google Cloud Console](https://console.cloud.google.com/) → créer ou choisir un projet.
2. **APIs & Services → Library** → activer **Google Play Android Developer API**.
3. **IAM → Service Accounts** → **Create service account** (ex. `play-upload`).
4. **Keys** → **Add key** → **JSON** → télécharger le fichier.

### Étape 5b — Inviter le compte de service dans Play Console

1. Play Console → **Users and permissions** → **Invite new users**.
2. Email : `play-upload@VOTRE-PROJECT-ID.iam.gserviceaccount.com`
3. Permissions : **View app information** + **Release to testing tracks** (ou **Admin** la première fois).
4. **Send invite**.

### Étape 5c — Secrets GitHub (étape 4 automatisée)

Sur votre machine (avec `gh` connecté en admin du dépôt) :

```bash
git clone https://github.com/carllaliberte/contract.git && cd contract
ANDROID_KEYSTORE_PASSWORD='...' ANDROID_KEY_PASSWORD='...' bash scripts/generate-android-keystore.sh
PLAY_KEY_FILE=play-upload-key.json bash scripts/apply-github-secrets.sh
```

`play-upload-key.json` = fichier téléchargé depuis Cloud Shell ou Google Cloud.

## Étape 6 — Téléverser l’AAB (automatique ou manuel)

### Automatique (recommandé)

Après les secrets :

1. [Actions → Build Android release](https://github.com/carllaliberte/contract/actions/workflows/android-play-release.yml)
2. **Run workflow** sur `main`
3. CI build un AAB **signé** et le pousse sur la piste **internal** (tests internes).

### Manuel

1. Télécharger l’artifact `meta-dashboard-aab` depuis une exécution CI réussie.
2. Play Console → **Testing → Internal testing** → **Create new release** → upload AAB.

## Étape 7 — Formulaires Play Console (avant publication)

| Section | Réponse suggérée |
|---------|----------------|
| **Fiche Play Store** | Texte ci-dessus + icône + screenshots |
| **Politique de confidentialité** | https://carllaliberte.github.io/contract/privacy.html |
| **Sécurité des données** | Aucune collecte ; requêtes RPC lecture seule vers blockchain publique ; pas de compte |
| **Classification du contenu** | Questionnaire IARC — app finance lecture seule, sans achats intégrés |
| **Cible et contenu** | Tous publics ou 13+ selon votre choix ; pas de contenu sensible |
| **Publicité** | Non |
| **Achats intégrés** | Non |

## Étape 8 — Publication

1. **Internal testing** : disponible en quelques minutes pour testeurs invités.
2. Promouvoir vers **Production** quand la fiche et les formulaires sont complets.
3. Revue Google : typiquement **1–7 jours** pour une nouvelle app.

## Vérification

- Site web : https://carllaliberte.github.io/contract/
- Package Android : `com.carllaliberte.meta`
- Workflow CI : `.github/workflows/android-play-release.yml`
