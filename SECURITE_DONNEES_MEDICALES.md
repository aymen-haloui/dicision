# Sécurité et protection des données médicales

Ce document détaille les mécanismes de sécurité et de protection des données utilisés dans la plateforme LUREXIS. Il relie chaque engagement aux composants techniques réellement présents dans le projet.

## 1. Chiffrement des données médicales

La plateforme s’appuie sur PostgreSQL via Neon pour le stockage des données sensibles, avec Prisma comme couche d’accès aux données. Dans le code, les informations médicales sont manipulées côté serveur via les routes API Next.js et les accès base de données ne sont jamais exposés directement au navigateur.

Pour la protection des secrets applicatifs, la configuration repose sur des variables d’environnement telles que `DATABASE_URL`, `NEXTAUTH_SECRET` et `NEXTAUTH_URL`. L’authentification et les sessions sont gérées côté serveur, ce qui limite l’exposition des données sensibles. Les mots de passe ne sont jamais stockés en clair : ils sont hachés avec `bcryptjs` avant enregistrement.

## 2. Accès sécurisé avec authentification multifacteurs

À ce stade, la plateforme utilise `NextAuth.js` avec le `Credentials Provider` pour l’authentification des utilisateurs. Le flux de connexion vérifie l’email et le mot de passe côté serveur, puis compare le mot de passe fourni avec le hash stocké en base à l’aide de `bcryptjs`. Les sessions reposent sur un mode JWT avec une durée de vie contrôlée.

Cela constitue une base d’accès sécurisé, mais l’authentification multifacteurs n’est pas encore visible comme fonctionnalité native dans le code actuel. Si l’objectif est de renforcer davantage l’accès aux données médicales, la MFA doit être ajoutée comme couche supplémentaire, en complément de l’authentification par identifiants.

## 3. Stockage sécurisé des données de santé

Les données de santé et les données des patients sont structurées dans PostgreSQL à travers Prisma. Le schéma définit des entités claires pour les patients, les cas cliniques, les médicaments, les allergies, les traitements, les règles cliniques et les journaux d’audit. Cette structuration améliore l’intégrité des données, la cohérence des relations et la disponibilité des informations médicales.

Le modèle de données utilise des clés UUID, des relations explicites et des contraintes de relation avec cascade lorsque cela est nécessaire. Les champs médicaux sont typés, normalisés et répartis dans des tables dédiées, ce qui facilite la gestion des dossiers patients, la traçabilité des mises à jour et la prévention des incohérences.

## 4. Sauvegarde régulière des données

La continuité de service repose sur la présence d’une base PostgreSQL hébergée sur Neon et d’une application déployée sur Vercel. Dans cette architecture, la sécurité opérationnelle dépend de la capacité à conserver des sauvegardes de la base et à restaurer rapidement les données en cas d’incident, de panne ou d’attaque.

Le projet doit donc s’appuyer sur des sauvegardes régulières de la base PostgreSQL, en complément de la séparation entre l’application et la couche de données. Cette approche réduit le risque de perte d’informations critiques et permet de remettre le service en état plus rapidement après un incident.

## 5. Interopérabilité sécurisée

L’interopérabilité sécurisée repose sur les routes API Next.js, Prisma et le schéma PostgreSQL structuré. Les données peuvent ainsi être lues, mises à jour et échangées via des endpoints contrôlés plutôt que par des accès directs non maîtrisés.

Le projet utilise également Zod pour la validation des entrées, ce qui contribue à sécuriser les échanges entre les interfaces, les routes API et la base de données. Cette combinaison permet de transporter les données médicales entre les différents modules applicatifs tout en limitant les risques d’injection, de corruption ou de mauvaise interprétation des champs.

## Conclusion

La sécurité de la plateforme repose aujourd’hui sur un socle concret composé de Next.js, NextAuth.js, bcryptjs, Prisma et PostgreSQL/Neon. Ces briques assurent la protection des accès, la structuration des données et le contrôle des échanges. L’ajout d’une vraie authentification multifacteurs et la formalisation d’une politique de sauvegarde renforceraient encore ce socle.