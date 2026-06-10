# Stack technique et hébergement

Ce document résume la pile technique et l’infrastructure utilisée pour la plateforme LUREXIS.

## Stack technique

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript
- **UI** : Tailwind CSS, shadcn/ui, composants Radix UI
- **Backend** : API Routes Next.js
- **Base de données** : PostgreSQL gérée via Neon
- **ORM / accès données** : Prisma
- **Authentification** : NextAuth.js (Credentials Provider)
- **Sécurité mot de passe** : bcryptjs
- **Validation et utilitaires** : Zod, date-fns, clsx, tailwind-merge
- **Graphiques et composants avancés** : Recharts, lucide-react, Sonner
- **Gestion des paquets** : pnpm

## Hébergement

- **Application web** : déployée sur **Vercel**
- **Analyse et suivi** : intégration de **Vercel Analytics**
- **Base de données** : hébergée sur **Neon PostgreSQL**

## Sécurité et confidentialité des données

La plateforme met l’accent sur la protection des données de santé, la maîtrise des accès et la continuité de service. Les axes suivants peuvent être présentés comme les engagements principaux du projet :

1. **Chiffrement des données médicales** pour garantir la confidentialité, l’intégrité et la protection des informations sensibles lors du stockage et de la transmission.
2. **Accès sécurisé basé sur une authentification renforcée**, avec contrôle des droits et prévention des usages non autorisés.
3. **Stockage sécurisé des données de santé dans des bases structurées**, afin d’assurer leur intégrité, leur disponibilité et une gestion efficace.
4. **Sauvegardes régulières des données** pour limiter les pertes d’informations critiques et assurer la continuité des services en cas de panne ou de cyberattaque.
5. **Interopérabilité sécurisée** permettant l’échange et la mise à jour des données médicales entre différents systèmes de santé, tout en préservant leur confidentialité et leur sécurité.

## Architecture résumée

- Le frontend et les routes API sont servis par Next.js.
- Les données cliniques, patients, cas et règles sont stockées dans PostgreSQL.
- Prisma sert de couche d’accès à la base de données et de génération du client.
- L’authentification repose sur NextAuth.js avec des comptes à mot de passe.

## Variables d’environnement principales

- `DATABASE_URL` : connexion à la base PostgreSQL
- `NEXTAUTH_SECRET` : secret de session NextAuth
- `NEXTAUTH_URL` : URL publique de l’application

