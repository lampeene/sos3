# SOS Permis à Points – v2 (Refonte complète)

Application moderne de gestion de stages de récupération de points.

## Stack

| Couche     | Technologie              |
|------------|--------------------------|
| Frontend   | Next.js 14 + Tailwind    |
| Backend    | NestJS 10                |
| Database   | PostgreSQL + Prisma 5    |
| Auth       | JWT (Passport)           |
| Paiements  | PayPlug (squelette)      |
| Emails     | MailService (squelette)  |

## Structure

```
sos-points/
├── apps/
│   ├── web/          → Next.js (site public + admin)
│   └── api/          → NestJS API
├── packages/
│   └── database/     → Prisma schema + client
└── package.json      → Workspaces
```

## Démarrage rapide

### 1. Prérequis
- Node.js ≥ 20
- PostgreSQL
- npm 10+

### 2. Installation
```bash
cd sos-points
npm install
```

### 3. Configuration
```bash
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Éditer les fichiers .env (surtout JWT_SECRET et DATABASE_URL)
```

### 4. Base de données
```bash
cd packages/database
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Lancer
```bash
# Terminal 1 – API
cd apps/api && npm run dev   # http://localhost:4000

# Terminal 2 – Frontend
cd apps/web && npm run dev   # http://localhost:3000
```

## Ce qui est prêt

### Backend
- Auth (login JWT)
- Users (CRUD + recherche)
- Places (CRUD + recherche)
- Sessions / Stages (CRUD + liste publique)
- Registrations (création multi-documents)
- Payments (création + IPN PayPlug)
- Mail (squelette prêt à brancher)

### Frontend
- Accueil (hero + étapes + CTA)
- /stages (liste + recherche, connecté à l’API)
- /inscription (formulaire 4 étapes)
- /login (connecté à l’API)
- /admin (protégé Admin uniquement)

### Transverse
- Client API centralisé (`lib/api.ts`)
- Gestion auth (`lib/auth.ts`)
- ProtectedRoute pour l’admin
- Variables d’environnement documentées

## Points restants pour la production

1. Brancher le SDK PayPlug réel
2. Upload Cloudinary des documents
3. Implémenter les emails (Nodemailer / Resend)
4. Seed admin + rôles
5. Tests + CI/CD
6. Migration des données de l’ancienne version

---
Projet initial : Wild Code School Bordeaux 2017-2018  
Refonte : 2026

## Seed (données de démo)

```bash
cd packages/database
npx prisma db seed
```

Comptes créés :
| Rôle    | Email                     | Mot de passe |
|---------|---------------------------|--------------|
| Admin   | admin@sos-point.com       | Admin123!    |
| User    | jean.dupont@example.com   | User123!     |
| Psy     | psy@sos-point.com         | User123!     |
| Trainer | formateur@sos-point.com   | User123!     |

+ 3 lieux (Bordeaux, Nantes, Lyon) + 4 stages à venir

## Emails (Nodemailer)

Configurer dans `apps/api/.env` :
```env
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=...
MAIL_PASSWORD=...
MAIL_FROM=noreply@sos-point.com
MAIL_ADMIN=admin@sos-point.com
```

Sans config SMTP, les emails sont **loggés en console** (mode mock).

Emails envoyés automatiquement :
- Confirmation d'inscription (après paiement SUCCESS)
- Échec de paiement
- Notification admin (nouvelle inscription)
- Validation de compte / reset password (prêts à brancher)
