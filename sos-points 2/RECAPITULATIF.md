# SOS Permis à Points – Récapitulatif de la refonte v2

Date : septembre 2026  
Projet d’origine : Wild Code School Bordeaux 2017-2018 (AngularJS + Express)

---

## 1. Objectif

Moderniser l’application de stages de récupération de points :
- Sécurité et dépendances à jour
- Architecture maintenable
- Admin complet
- Paiements, uploads, emails, logs, monitoring

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | NestJS 10 |
| Base de données | PostgreSQL + Prisma 5 |
| Auth | JWT (Passport) |
| Paiements | PayPlug (API REST) |
| Stockage fichiers | Cloudinary |
| Emails | Nodemailer |
| Logs | Winston + corrélation requestId |
| Observabilité | ELK (Elasticsearch, Logstash, Kibana, Filebeat) |

---

## 3. Structure du monorepo

```
sos-points/
├── apps/
│   ├── api/          → NestJS (API REST)
│   └── web/          → Next.js (site public + admin)
├── packages/
│   └── database/     → Prisma schema + seed
├── deploy/
│   └── elk/          → Docker Compose ELK + configs
├── package.json      → Workspaces npm
└── README.md
```

---

## 4. Fonctionnalités livrées

### Backend API
- [x] Auth JWT (login)
- [x] Users CRUD + recherche
- [x] Places (centres) CRUD
- [x] Sessions (stages) CRUD + liste publique
- [x] Registrations (inscriptions multi-documents)
- [x] Payments PayPlug (création + IPN)
- [x] Storage Cloudinary (signature + upload)
- [x] Validation documents par cas (1–4)
- [x] Emails (confirmation, échec, admin, reset)
- [x] Gestion d’erreurs unifiée
- [x] Logging structuré JSON + requestId
- [x] Rotation des logs + intégration ELK

### Frontend public
- [x] Accueil (charte SOS)
- [x] Liste des stages + recherche
- [x] Inscription multi-étapes + PayPlug
- [x] Login
- [x] Pages succès / annulation paiement

### Admin
- [x] Dashboard protégé
- [x] Utilisateurs : liste, créer, modifier, supprimer
- [x] Lieux : liste, créer, modifier, supprimer
- [x] Stages : liste, créer, modifier, supprimer

### Données
- [x] Schéma Prisma complet
- [x] Seed (admin, users, lieux, stages)

---

## 5. Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@sos-point.com | Admin123! |
| User | jean.dupont@example.com | User123! |
| Psy | psy@sos-point.com | User123! |
| Trainer | formateur@sos-point.com | User123! |

---

## 6. Déploiement OVH – options

### A. VPS OVH (recommandé)

1. Créer un VPS (Ubuntu 22.04+)
2. Installer Node 20, PostgreSQL, Nginx
3. Cloner / uploader le projet
4. Configurer les `.env`
5. `npm install` + `prisma migrate` + `prisma db seed`
6. PM2 pour API + Next.js
7. Nginx en reverse proxy + HTTPS (Let’s Encrypt)

### B. Hébergement web OVH classique

- **Peu adapté** : pas de Node.js long-running, pas de PostgreSQL natif sur l’offre mutualisée basique.
- Préférer un **VPS** ou **Web Cloud Databases** + un runtime Node (ou déployer front sur Vercel / back sur le VPS).

### C. Hybride

- Front (Next.js) → Vercel ou Netlify  
- API (NestJS) → VPS OVH  
- PostgreSQL → OVH Managed Databases ou VPS  

---

## 7. Variables d’environnement minimales (production)

```env
# API
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=<secret long et aléatoire>
FRONTEND_URL=https://ton-domaine.fr
API_URL=https://api.ton-domaine.fr

PAYPLUG_SECRET_KEY=sk_live_...
PAYPLUG_PUBLIC_KEY=pk_live_...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

MAIL_HOST=...
MAIL_USER=...
MAIL_PASSWORD=...

LOG_FORMAT=json
LOG_LEVEL=info
LOG_ROTATE_DAILY=true
```

```env
# Web
NEXT_PUBLIC_API_URL=https://api.ton-domaine.fr/api
```

---

## 8. Commandes de démarrage

```bash
cd sos-points
npm install

# Base de données
cd packages/database
cp .env.example .env   # éditer DATABASE_URL
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# API
cd ../../apps/api
cp .env.example .env   # éditer secrets
npm run dev            # ou build + start en prod

# Frontend
cd ../web
cp .env.example .env.local
npm run dev            # ou build + start en prod
```

---

## 9. Prochaines étapes possibles

1. Déployer sur VPS OVH (Nginx + PM2 + SSL)
2. Brancher les clés PayPlug / Cloudinary / SMTP réelles
3. Formulaire d’édition des documents côté inscription (Cloudinary déjà branché)
4. Tests automatisés (Jest / Playwright)
5. CI/CD (GitHub Actions)

---

## 10. Note importante

Ce dépôt est une **base de refonte complète**, prête à être finalisée et mise en production.  
Il ne remplace pas encore l’ancien site tant que la migration des données et les tests métier n’ont pas été validés.
