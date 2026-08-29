# Quittentia

A mobile-first web application built to streamline rent receipt generation for landlords and property managers.

Developed as a freelance MVP for a real estate professional, the project replaces a manual Excel-based workflow with a faster, cleaner, and more accessible web experience.

## Overview

Quittentia is designed as a lightweight internal tool to generate rent receipts quickly from both mobile and desktop.

The app allows users to manage properties and tenants, handle shared rentals, and generate ready-to-print PDF rent receipts in just a few steps.

## Features

- Property management
- Tenant management
- Shared rental / co-living support
- Instant rent receipt PDF generation
- Built-in PDF preview, download, and print
- Mobile-first responsive interface
- Password-protected access
- Firebase / Firestore data storage

## Tech Stack

- Next.js
- React
- TypeScript
- Firebase
- Cloud Firestore
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- PDF generation and preview

## Architecture

- `app/login`: password-protected entry page
- `app/(protected)`: main application behind the access gate
- `app/api/auth/login`: password validation and session creation
- `app/api/firebase/token`: Firebase custom token issuance
- `firebase/admin.ts`: Firebase Admin SDK configuration
- `lib/security/site-auth.ts`: session signing and verification
- `firestore.rules`: Firestore access control

## Firestore Schema

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
- `technicalReference`
- `baseRent`
- `charges`
- `createdAt`
- `updatedAt`

### `tenants/{tenantId}`

- `propertyId`
- `tenantType`
- `title`
- `companyName`
- `firstName`
- `lastName`
- `entryDate`
- `entryDateDetail`
- `createdAt`
- `updatedAt`

## Environment Variables

Create a `.env.local` file at the project root:

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
