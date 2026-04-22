# quittance-app

MVP Next.js mobile-first pour gérer des biens, des locataires et générer des quittances de loyer PDF sans login visible.

## Architecture retenue

- `app/` : 4 écrans maximum
  - `/` génération
  - `/biens`
  - `/locataires`
  - `/parametres`
- `components/` : shell mobile, formulaires, cartes, aperçu PDF
- `firebase/` : configuration Firebase web + auth anonyme invisible
- `services/` : CRUD Firestore séparés
- `hooks/` : abonnements temps réel Firestore
- `pdf/` : document React PDF + helpers téléchargement / impression
- `types/` : modèles TypeScript stricts
- `validations/` : schémas Zod

## Schéma Firestore exact

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

## Installation

```bash
cd /Users/aicha/Documents/quittance-app
cp .env.example .env.local
npm install
npm run dev
```

Application accessible ensuite sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement attendues

Renseigne les valeurs issues de ton projet Firebase web dans `.env.local` :

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Firebase à configurer

1. Créer un projet Firebase.
2. Activer `Authentication > Anonymous`.
3. Créer une base `Cloud Firestore`.
4. Coller les règles de [firestore.rules](/Users/aicha/Documents/quittance-app/firestore.rules).
5. Ajouter l'application web Firebase et reporter les variables dans `.env.local`.

## Commandes utiles

```bash
npm run dev
npm run lint
npm run build
```

## MVP inclus

- CRUD biens
- CRUD locataires
- paramètres globaux bailleur
- recherche simple
- sélection mois / année
- génération PDF à la volée
- aperçu PDF intégré
- téléchargement et impression
- auth anonyme Firebase invisible

## Limites volontaires du MVP

- pas d'historique des quittances
- pas de stockage des PDF
- pas d'envoi email
- pas de multi-utilisateur
- pas de tableau de bord avancé

## Améliorations possibles ensuite

- meilleure mise en page du PDF
- App Check Firebase pour durcir l'accès
- duplication d'impression par colocataire si besoin métier
- préremplissage du bien le plus souvent utilisé
