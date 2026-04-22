# quittance-app

MVP Next.js mobile-first pour gérer des biens, des locataires et générer des quittances de loyer PDF, avec accès protégé par mot de passe et Firestore verrouillé sur une session propriétaire unique.

## Ce qui a été sécurisé

- page de mot de passe avant d'entrer dans l'application
- cookie de session `HttpOnly` signé côté serveur
- accès Firestore réservé à un token Firebase custom émis par le serveur
- règles Firestore plus strictes sur les droits et la forme des données
- plus d'authentification anonyme publique côté client

## Architecture retenue

- `app/login` : page d'entrée protégée par mot de passe
- `app/(protected)` : application réelle derrière le verrou
- `app/api/auth/login` : validation du mot de passe et création de session
- `app/api/firebase/token` : émission d'un token Firebase custom
- `firebase/admin.ts` : Firebase Admin SDK côté serveur
- `lib/security/site-auth.ts` : signature et vérification de session
- `firestore.rules` : contrôle d'accès Firestore

## Schéma Firestore

### `landlord_settings/primary`

- `companyName`
- `addressLine1`
- `addressLine2`
- `postalCode`
- `city`
- `signatureLabel`
- `createdAt`
- `updatedAt`

### `properties/{propertyId}`

- `residenceName`
- `addressLine1`
- `addressLine2`
- `postalCode`
- `city`
- `entryDate`
- `technicalReference`
- `baseRent`
- `charges`
- `createdAt`
- `updatedAt`

### `tenants/{tenantId}`

- `propertyId`
- `title`
- `firstName`
- `lastName`
- `order`
- `createdAt`
- `updatedAt`

## Variables d'environnement

Crée `.env.local` à la racine du projet.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

SITE_PASSWORD=
SITE_SESSION_SECRET=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

### Notes importantes

- `SITE_PASSWORD` : le mot de passe que tu tapes pour ouvrir le site
- `SITE_SESSION_SECRET` : une longue clé secrète aléatoire pour signer la session
- `FIREBASE_ADMIN_PRIVATE_KEY` : colle la clé privée de service account en gardant les retours à la ligne sous forme `\n`

Exemple :

```bash
SITE_PASSWORD=MonMotDePasseTresFort
SITE_SESSION_SECRET=un-secret-long-et-aleatoire-ici
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
```

## Setup Firebase

### 1. Projet Firebase

- crée ton projet Firebase
- active `Cloud Firestore`
- ajoute une application web et récupère les variables `NEXT_PUBLIC_FIREBASE_*`

### 2. Service account Firebase Admin

Dans Firebase :

- `Project settings`
- `Service accounts`
- `Generate new private key`

Puis reporte dans `.env.local` :

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

### 3. Firestore Rules

Publie les règles de [firestore.rules](/Users/aicha/Documents/quittance-app/firestore.rules).

Ces règles autorisent uniquement :

- le propriétaire authentifié par token custom
- les documents conformes à la structure attendue

### 4. Authentication Firebase

L'application n'utilise plus l'auth anonyme comme mécanisme principal de sécurité.

Tu peux :

- laisser Authentication activé dans Firebase
- ne pas exposer d'écran de login Firebase

Le token est généré côté serveur via Firebase Admin après validation du mot de passe du site.

## Lancement local

```bash
cd /Users/aicha/Documents/quittance-app
npm install
npm run dev
```

Application ensuite sur [http://localhost:3000](http://localhost:3000).

## Vérifications utiles

```bash
npm run lint
npm run build
```

## Ce que couvre le MVP

- CRUD biens
- CRUD locataires
- paramètres bailleur
- recherche simple
- sélection mois / année
- génération PDF à la volée
- aperçu PDF intégré
- téléchargement et impression
- accès protégé par mot de passe

## Limites volontaires

- pas d'historique des quittances
- pas de stockage cloud des PDF
- pas d'envoi email
- pas de multi-utilisateur
- pas de back-office complexe

## Améliorations possibles ensuite

- bouton de déconnexion explicite
- App Check Firebase pour durcir encore l'accès
- limitation de tentatives sur la page mot de passe
- déploiement Vercel avec secrets d'environnement
