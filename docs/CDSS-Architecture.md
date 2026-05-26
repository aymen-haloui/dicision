# Architecture du Moteur Clinique Intelligent (CDSS)

## Dossier d'architecture hospitalière

**Auteur :** Architecte logiciel senior — Conception technique et orientée production  
**Date :** 2026-05-26

---

## Résumé exécutif

Ce document présente l'architecture complète d'un moteur clinique intelligent conçu pour un usage hospitalier réel, avec les contraintes qui caractérisent ce type de système : hétérogénéité des sources, dépendance forte au contexte clinique, nécessité de décisions explicables, et obligation d'une traçabilité médico‑légale irréprochable. L'intention n'est pas de décrire un prototype académique, mais bien une plateforme de raisonnement clinique apte à s'insérer dans des circuits de soins exigeants, où chaque règle doit pouvoir être justifiée, rejouée et auditée.

L'architecture repose sur un découpage strict entre le profil patient, le cas clinique, le référentiel médicament, le moteur de règles, les pipelines d'évaluation et la couche d'explicabilité. Cette séparation n'est pas un choix de confort technique ; elle permet de préserver la cohérence du raisonnement clinique, de limiter les effets de bord, et de conserver une base stable malgré l'évolution continue des référentiels thérapeutiques et toxicologiques. Le document détaille également les mécanismes de scoring, les règles d'urgence, la toxicologie, le sandbox de simulation et la logique d'évolution future vers l'interopérabilité hospitalière et l'intelligence clinique augmentée.

Dans sa forme actuelle, le système doit être compris comme une plateforme de production modulaire : les décisions sont déterministes, les règles sont versionnées, les sorties sont explicables, et les décisions de sécurité sont conservatrices. C'est précisément cette discipline architecturale qui rend le moteur crédible dans un environnement hospitalier.


## Table des matières

1. Introduction générale
2. Philosophie globale de l'architecture
3. Structure complète des paramètres patients
4. Cas clinique temps réel
5. Architecture des médicaments
6. Système d'interactions médicamenteuses
7. Architecture du moteur de règles
8. Familles de règles
9. Pipelines cliniques
Workflow opérationnel
Résultats cliniques
10. Système d'explicabilité
11. Sandbox clinique
12. Audit et traçabilité
13. Évolutivité future
14. Conclusion

Annexes

---

## 1. Introduction générale

### Contexte et besoin

Dans un établissement de santé, la décision clinique ne peut pas être ramenée à un mécanisme de filtrage simple. Une prescription, une alerte, une recommandation de dosage ou un signal de toxicité doivent être interprétés à la lumière d'un ensemble de paramètres qui évoluent vite : état hémodynamique, fonction rénale, exposition médicamenteuse, antécédents, âge physiologique, statut reproductif, comorbidités et contexte de prise en charge. C'est précisément là que les systèmes statiques montrent leurs limites. Ils savent signaler une interaction connue ou une contre-indication générique, mais ils savent rarement arbitrer correctement entre un profil patient fragile, un contexte aigu et une logique de priorisation médicale.

Un CDSS moderne doit donc faire davantage que stocker des règles. Il doit organiser le raisonnement, le contextualiser et le rendre intelligible. Cela implique une architecture capable d'absorber des entrées hétérogènes, de produire une lecture clinique cohérente, puis d'expliquer pourquoi une décision a été retenue, pourquoi une autre a été écartée, et à quel niveau de criticité elle doit être présentée à l'utilisateur.

### Enjeux hospitaliers

La difficulté n'est pas seulement technique. Elle est aussi organisationnelle et médico‑légale. En milieu hospitalier, l'outil est attendu sur trois fronts simultanés : réduction du risque iatrogène, amélioration de la qualité du triage, et soutien à la standardisation des pratiques sans déresponsabiliser le clinicien. Le moteur doit donc rester un aide‑à‑la‑décision, jamais une boîte noire prescriptive. Chaque résultat doit rester contestable, vérifiable et réversible.

### Gouvernance clinique et explicabilité

Le système est pensé autour d'un principe simple : une décision médicale n'a de valeur opérationnelle que si elle peut être expliquée après coup. La gouvernance clinique repose ainsi sur la combinaison de trois éléments indissociables : des règles versionnées, des inputs tracés, et une restitution lisible du chemin de décision. C'est cette chaîne qui permet au comité médical de valider un comportement, à l'équipe de soins de comprendre une alerte, et à l'organisation de conserver un historique défendable en cas d'analyse qualité ou d'audit.

### Nécessité d'un moteur contextuel

Le moteur a été conçu pour être contextuel par construction. Il ne déclenche pas des règles en vase clos ; il reconstruit le terrain patient, lit le cas clinique courant, agrège les médicaments actifs et évalue le tout à travers des pipelines spécialisés. Cette contextualisation est essentielle car le même médicament, le même dosage ou le même symptôme peuvent changer de signification selon l'âge, la fonction rénale, la grossesse, la présence d'une infection, ou l'existence d'une interaction pharmacologique connue. Sans ce niveau de contexte, le système perd sa valeur clinique.

### Limites des approches statiques

Les systèmes statiques échouent dans trois situations majeures : variations du profil patient non prises en compte, données dynamiques non intégrées, et interactions complexes multi‑médicaments. Un moteur configurable et modulable est donc nécessaire pour la sécurité clinique et l'adoption par les équipes soignantes.

Cette limite devient particulièrement visible dans les environnements où l'activité clinique est dense et où les profils de patients sont hétérogènes. Dans un service d'urgence, un même symptôme peut correspondre à des tableaux radicalement différents selon l'âge, les traitements en cours, la fonction organique et l'histoire médicale récente. Un système statique n'a pas la finesse nécessaire pour différencier une fièvre banale d'un sepsis débutant, ni pour distinguer une douleur médicamenteuse d'une toxicité émergente. C'est précisément pour combler cet écart que l'architecture décrite ici combine profil patient, contexte dynamique et moteur de règles déclaratif.

Dans une logique hospitalière, cela signifie aussi que le CDSS ne doit jamais produire une simple réponse binaire. Il doit mettre en perspective le résultat, indiquer le niveau de confiance de la recommandation, et signaler les éléments de contexte qui ont pesé dans la décision. C'est cette capacité à contextualiser qui transforme un système de règles en outil clinique crédible.


## 2. Philosophie globale de l'architecture

### Principes directeurs

- Modularité : séparation nette entre modèle patient, instance de cas, référentiel médicaments, base de règles, moteur d'exécution, couche d'explicabilité et composantes d'audit.
- Données patient comme pivot durable ; cas clinique comme contexte temporel et éphémère.
- Règles déclaratives : toute logique clinique est exprimée via des artefacts versionnés et testables, non hardcodés.
- Extensibilité : insertion de nouveaux modules (toxicologie, ML, connecteurs FHIR) sans modification profonde du noyau.

### Flux conceptuel

Patient → Cas Clinique → Médicaments → Interactions → Évaluation (moteur règles & scoring) → Résultats (findings, recommandations, urgence) → Audit & Explicabilité

### Séparation Patient / Cas Clinique

- Cohérence temporelle : un patient génère de multiples cas (visites, urgences) ; permettre reconstitution.
- Réutilisabilité : profil patient centralisé (allergies, comorbidités) partagé entre services.
- Historique & simulation : re‑exécution de règles sur cas historiques.
- Sécurité des écritures : isoler mises à jour temporaires des attributs persistants.

### Contrats et API

Chaque couche expose un contrat (types, SLAs, timeouts). Ces contrats sont testés via mocks et tests d'intégration pour garantir isolabilité.

L'intérêt d'un tel découpage n'est pas seulement la propreté du code. Dans un système médical de cette nature, il s'agit d'une mesure de sécurité. Quand une couche change, elle ne doit pas contaminer le reste du raisonnement. Une évolution dans la structure du patient ne doit pas déstabiliser l'évaluation des interactions, et une mise à jour des règles de toxicologie ne doit pas casser le pipeline d'urgence. Le contrat sert de frontière de sécurité entre des domaines qui doivent dialoguer sans se confondre.


## 3. Structure complète des paramètres patients

Le profil patient constitue le socle du raisonnement clinique. Dans ce type de système, il n'est pas un simple enregistrement administratif ; il représente le terrain physiologique, pathologique et comportemental à partir duquel la décision sera interprétée. C'est cette couche qui fixe le niveau de prudence du moteur, qui influence la sensibilité des alertes et qui donne sa cohérence aux scores produits par les pipelines.

En pratique, le profil patient sert de référentiel stable. Il contient les variables qui ne changent pas à chaque consultation ou qui ne changent que lentement : âge, morphologie, antécédents, allergies, traitements de fond, statut reproductif, habitudes de vie, exposition toxique, fonction rénale ou hépatique connue. Ces éléments ne sont pas décoratifs ; ils modifient la façon dont le moteur lit les cas cliniques et évalue les risques. Un même signal clinique n'a pas la même portée chez un adulte sain, chez un patient insuffisant rénal, chez une femme enceinte, ou chez un enfant de six ans.

Le moteur exploite ces paramètres selon plusieurs modalités. Certains alimentent directement les conditions de règles, d'autres modulent les scores de risque, d'autres encore servent de facteurs de pondération dans les pipelines spécialisés. Cette logique explique pourquoi le modèle patient doit être riche, structuré et validé : un champ absent ou approximatif peut altérer la qualité d'une recommandation, et dans un contexte hospitalier, cette dérive n'est jamais anodine.

### Modèle de données (synthèse)

- Identité et métadonnées : id (UUID), nom, identifiant médical, sexe légal/biologique, date de naissance.
- Anthropométrie : poids_kg, taille_cm, IMC dérivé.
- Statut reproductif : grossesse (stade), allaitement.
- Mode de vie : tabagisme (pack‑years), consommation d'alcool (units/week), activité physique, sommeil, régime alimentaire, phytothérapie.
- Comorbidités : liste codée (ICD/SNOMED).
- Immunodépression : type, degré.
- Allergies : agent, type, sévérité, manifestation.
- Médicaments usuels : liste structurée avec dosage, fréquence, voie.
- Facteurs toxicologiques : expositions professionnelles, substances illicites, plantes médicinales.
- Biologie de base : créatinine, clairance (CrCl), AST/ALT, bilirubine, électrolytes.
- Données socio‑administratives : adhérence, support.

Chaque paramètre porte métadonnées : timestamp, source (DME, patient, device), quality/confidence.

### Influence clinique et exemples

Pour chaque famille de paramètres, l'impact sur le moteur est systématiquement décrit :

- Poids & taille : doses pédiatriques et seuils mg/kg ; distribution des molécules lipophiles ; exemples de règles (antibiotiques dosés en mg/kg).
- Âge : adjustments pédiatriques/geriatrics ; retrait des seuils ; exemple : anticoagulants et risque hémorragique.
- Grossesse & allaitement : catégo ries et contre‑indications formelles ; recommandations alternatives.
- Insuffisance rénale (CrCl) : ajustement de dose, contre‑indications (metformin en insuffisance rénale avancée), risk scores rénaux.
- Allergies : déclenchement de CI et alternatives.
- Phytothérapie : interactions (millepertuis – CYP3A4), recommandations d'arrêt.

### Gestion des données manquantes ou incertaines

- Marqueurs `unknown` / `estimated` et règles prudentes (fail‑safe).
- Confirmation utilisateur pour données critiques.
- Politique de repli : lorsqu'une donnée critique est absente, produire une recommandation conservatrice plutôt qu'aucune recommandation.

### Stockage et validation

- Base Postgres primaire, colonnes typées et `JSONB` pour `extended_profile`.
- Validation à l'ingestion via JSON Schema / Zod.
- Chiffrement de champs sensibles si requis.

### Lecture clinique approfondie du profil patient

Le moteur interprète l'âge comme un paramètre de reconfiguration globale. Ce n'est pas seulement une information démographique ; c'est un indicateur de cinétique, de réserve physiologique et de vulnérabilité. Chez l'enfant, les volumes de distribution, l'immaturité enzymatique et la variabilité des poids imposent une lecture de la dose complètement différente. Chez le sujet âgé, la logique s'inverse : la masse maigre baisse, l'eau corporelle diminue, la fonction rénale peut être surévaluée si elle est estimée de façon naïve, et la sensibilité à certains psychotropes ou antihypertenseurs augmente. Le moteur ne traite donc pas l'âge comme une simple borne de seuil, mais comme un facteur qui reparamètre les autres règles, en particulier celles liées au dosage, à la toxicité et à l'urgence.

Le poids et la taille ont une influence directe sur la pharmacologie appliquée. Le poids alimente les calculs mg/kg, les seuils pédiatriques, les ajustements en fonction du surpoids ou de la dénutrition, et certaines règles de tolérance. La taille, combinée au poids, sert à dériver un IMC ou parfois une surface corporelle quand la situation le requiert. Un IMC élevé n'est pas uniquement un marqueur métabolique ; il modifie l'exposition à certains médicaments lipophiles, le risque thromboembolique, la charge de travail cardiorespiratoire, et peut perturber l'interprétation d'un tableau clinique si la défaillance d'organe est déjà installée. Inversement, un patient dénutri ou déshydraté ne doit pas être évalué comme un adulte standard : la marge de sécurité thérapeutique est réduite, et la toxicité peut apparaître plus tôt.

L'insuffisance rénale constitue l'un des pivots les plus structurants du moteur. Elle intervient à plusieurs niveaux : ajustement direct de dose, interdiction de certaines molécules, relecture du risque d'accumulation, et majoration du score de toxicité. Le moteur ne se contente pas d'un seuil arbitraire ; il prend en compte la clairance, la dynamique de la créatinine lorsqu'elle est disponible, et le profil de traitement. Un patient chronique sous diurétiques, antihypertenseurs ou AINS n'a pas le même risque qu'un patient avec une insuffisance rénale documentée mais stable. C'est pourquoi les pipelines de toxicologie et de dosage s'appuient sur cette donnée comme sur une variable de hiérarchisation majeure.

L'insuffisance hépatique agit différemment mais avec autant d'importance. Elle modifie la clairance hépatique, la transformation de nombreuses molécules et la capacité du patient à métaboliser des substances potentiellement toxiques. Le moteur doit ici prendre en compte la sévérité, le stade et le type d'atteinte quand cette information existe. Une hépatopathie sévère n'a pas seulement un effet sur la dose : elle reconfigure le risque d'hypersédation, de surdosage et d'effet prolongé, notamment pour les molécules à forte extraction hépatique ou à demi-vie déjà longue.

La grossesse et l'allaitement imposent une logique d'architecture spécifique. Le moteur ne peut pas se contenter de labels génériques ; il doit raisonner sur le stade, le contexte, la molécule, la disponibilité d'alternatives et le niveau d'urgence clinique. Une patiente enceinte avec une infection sévère ne reçoit pas le même arbitrage qu'une patiente en suivi chronique stable. Le moteur doit donc distinguer contre-indication absolue, prudence renforcée et recommandation substitutive. L'allaitement, de son côté, n'est pas un simple booléen ; il conditionne la compatibilité d'un traitement avec l'exposition néonatale, la demi-vie de la molécule et le risque d'accumulation dans le lait.

Le tabagisme, l'alcool, les drogues et l'automédication cachée constituent une autre zone de haute sensibilité. Ils modifient le métabolisme enzymatique, la compliance, la probabilité de toxicité et parfois la perception même du symptôme. Un patient qui consomme de l'alcool de manière régulière et prend du paracétamol n'a pas le même risque qu'un patient sans exposition hépatotoxique. Un tabagisme chronique peut augmenter ou diminuer l'exposition à certaines molécules par induction enzymatique. Quant aux substances non déclarées, elles représentent un enjeu crucial de sécurité car elles échappent à la lecture administrative classique. Le moteur doit donc intégrer des mécanismes de détection indirecte et de prudence renforcée lorsqu'une discordance clinique suggère une exposition cachée.

L'immunodépression, qu'elle soit iatrogène, oncologique ou liée à une maladie chronique, change la gravité attendue de nombreux tableaux. Une simple fièvre n'a pas la même portée chez un patient immunodéprimé que chez un patient sans facteur de risque. Le moteur l'utilise donc comme un amplificateur de criticité, notamment dans les pipelines d'urgence et de toxicologie. Cette logique est essentielle pour éviter une sous-estimation des tableaux infectieux ou inflammatoires.

Les données biologiques ne servent pas uniquement à confirmer une hypothèse ; elles alimentent les mécanismes de requalification du risque. Une créatinine, une bilirubine, des transaminases, un sodium, un potassium ou des lactates peuvent suffire à changer le statut d'une alerte. Le moteur doit être capable de lire ces paramètres comme des marqueurs de fonction et non comme des valeurs isolées. De même, une déshydratation ou une dénutrition documentée doivent être interprétées comme des facteurs de fragilité systémique qui réduisent la tolérance au traitement et augmentent le risque d'accumulation.

Enfin, la polymédication constitue l'un des scénarios les plus structurants de la plateforme. Elle augmente la densité des interactions, la probabilité d'erreur, le risque de duplication thérapeutique et la difficulté de lecture clinique. C'est pour cette raison que le moteur ne traite jamais une molécule de manière isolée lorsque la liste thérapeutique dépasse un certain niveau de complexité. Il réévalue le terrain, les combinaisons, les effets cumulés et la probabilité de toxicité additive. Cette capacité à voir le patient comme un système thérapeutique complet, et non comme une collection de prescriptions, est l'une des raisons d'être de l'architecture.


## 4. Cas clinique temps réel

### Rôle du cas clinique

Le cas est un instantané dynamique associé à un événement clinique. Il contient symptômes, constantes, examens, et constitue le contexte d'évaluation immédiate.

### Données dynamiques

- Symptômes structurés et codés.
- Constantes vitales : SpO2, température, tension artérielle (syst/dias), fréquence cardiaque, fréquence respiratoire, score de Glasgow.
- Examens biologiques : valeurs + timestamps (créatinine, lactates, etc.).
- Signes d'urgence : détresse respiratoire, convulsions, saignement.

Chaque donnée porte son origine et sa confiance : device > praticien > patient.

### Impact sur le moteur

Données critiques modifiant immédiatement :
- Urgence (triage). 
- Priorité d'exécution des pipelines.
- Recommandations et prescriptions immédiates.

### Orchestration runtime et cohérence temporelle

Le cas clinique runtime est traité comme une séquence d'événements et non comme un simple objet figé. Chaque nouvelle observation peut réorienter le moteur : une saturation qui chute, une tension qui s'effondre ou une douleur qui s'intensifie changent instantanément le niveau de gravité. L'architecture doit donc préserver la cohérence temporelle des signaux, car un résultat biologique ancien n'a pas le même poids qu'une donnée recueillie à l'instant. Le moteur conserve cette hiérarchie temporelle pour éviter de surévaluer une information périmée ou de sous‑estimer une aggravation récente.

L'ingestion des données se fait par agrégation contrôlée. Les signaux bruts peuvent provenir d'un monitor, d'une saisie manuelle, d'un dossier de soins ou d'un système tiers. Avant toute décision, ils sont normalisés, timestampés, validés et classés par niveau de fiabilité. Cette étape est déterminante : une donnée manquante ou incohérente ne doit pas produire un faux sentiment de sécurité. Dans ce type de moteur, l'absence d'information est elle-même une information, et elle doit parfois déclencher une prudence accrue.

La priorisation des pipelines s'appuie sur la criticité du cas. Un épisode respiratoire aigu, une convulsion, une hypotension sévère ou une suspicion d'intoxication imposent une exécution rapide des règles d'urgence avant les traitements plus analytiques. À l'inverse, une consultation stable peut enrichir le raisonnement avec des pipelines plus fins de dosage ou d'interactions. Cette orchestration est une pièce centrale de la résilience clinique : elle permet de répondre rapidement aux situations vitales sans sacrifier la profondeur de l'analyse sur les cas moins instables.

Lorsqu'un événement critique survient, le moteur ne se contente pas d'ajouter une alerte. Il recalcule le score de risque, réévalue les recommandations et propage l'information vers les couches qui doivent réagir, y compris l'explicabilité. Le résultat doit donc rester cohérent d'un bout à l'autre du cycle de vie du cas. C'est cette discipline qui évite les contradictions entre une règle d'urgence, une recommandation thérapeutique et un diagnostic de toxicologie.

### Exemples cliniques

- SpO2 < 90% : escalade d'urgence, proposition d'oxygénothérapie.
- Température > 39°C : suspicion infection grave, proposition d'hémocultures et antibiothérapie empirique selon contexte.


## 5. Architecture des médicaments

### Modèle de données

- id, nom_commercial, substance_active (INN), code ATC, formes galéniques.
- posologie_std : adult/child, plage mg/kg, dose_max.
- métabolisme : CYP enzymes, fraction éliminée.
- seuils_toxicité : mg/kg et valeurs plasmatiques lorsque pertinentes.
- ajustements : règles par CrCl/âge/HEP.
- interactions_known : références par id.
- evidence & provenance.

### Toxicité et gestion des seuils

- Seuils absolus et relatifs, exprimés via expressions (AST) permettant f(x) où x = poids, CrCl.
- Gestion d'alertes et backfill pour tests biologiques.

### Ajustement populationnel

- Enfant : mg/kg ou BSA ; règles d'arrondi et limites.
- Senior : barèmes de réduction et contre‑indications spécifiques.
- Insuffisance rénale / hépatique : tables d'ajustement applicables dynamiquement.

### Versioning

- Chaque médicament a un historigramme : changements de seuils, nouvelles CI, mises à jour d'evidence.

### Lecture pharmacologique approfondie

La structure médicament du système n'est pas un catalogue figé. C'est un référentiel pharmacologique opérationnel, pensé pour supporter la variation des pratiques, des connaissances et des niveaux de preuve. Chaque médicament porte une identité commerciale et une substance active, mais sa valeur réelle pour le moteur se joue dans les attributs qui conditionnent le risque : demi-vie, voie d'élimination, potentiel d'accumulation, métabolisme hépatique, sensibilité aux inhibiteurs ou inducteurs enzymatiques, et seuils toxicologiques pertinents selon la population.

La pharmacocinétique occupe ici une place centrale. Un médicament à demi-vie longue ne doit pas être évalué comme une molécule à élimination rapide, car les erreurs de dose s'additionnent différemment. Une molécule qui dépend fortement de l'élimination rénale devient beaucoup plus sensible aux variations de la fonction rénale, même modérées. Le moteur n'interprète donc pas une dose comme une simple quantité administrée, mais comme une exposition potentielle à mettre en relation avec les capacités d'absorption, de transformation et d'élimination du patient.

La pharmacodynamie complète cette lecture. Certaines associations ne sont pas dangereuses parce qu'elles changent la concentration plasmatique, mais parce qu'elles additionnent les effets : sédation, hypotension, allongement du QT, risque hémorragique, hyperkaliémie, hypoglycémie ou dépression respiratoire. C'est pourquoi le référentiel médicament doit décrire non seulement les seuils de toxicité, mais aussi les effets attendus, leurs conditions d'apparition et leurs effets cumulés lorsqu'une classe thérapeutique est combinée à une autre.

Le moteur tient également compte du CYP450 et des grandes familles d'interactions métaboliques. Un inducteur enzymatique peut exposer à une sous‑efficacité thérapeutique, tandis qu'un inhibiteur peut conduire à une accumulation toxique. Le système doit donc stocker ces informations à un niveau exploitable par les règles, afin qu'une interaction pharmacocinétique ne soit pas réduite à un simple avertissement générique mais déclenche un raisonnement contextualisé, avec adaptation posologique ou substitution thérapeutique si nécessaire.

Les seuils mg/kg et les limites maximales ne sont jamais interprétés de façon abstraite. Ils doivent toujours être réévalués à l'aune du patient, de son âge, de son poids réel, de sa fonction organique et du contexte clinique. Chez l'enfant, l'impact d'une erreur de calcul est immédiat ; chez le sujet âgé, le risque d'accumulation peut rester silencieux plusieurs heures ou plusieurs jours avant de se déclarer. Le système doit donc distinguer les médicaments à fenêtre thérapeutique étroite, ceux qui sont sensibles à la clairance rénale, et ceux dont la tolérance dépend surtout du terrain hépatique ou neurologique.

Le versioning clinique du médicament n'est pas un luxe documentaire. Il conditionne la reproductibilité de toutes les décisions. Si une dose maximale change, si une contre-indication est mise à jour ou si une recommandation de surveillance devient plus stricte, le moteur doit conserver la trace de la version appliquée au moment de la décision. Sans cette discipline, aucune analyse rétrospective n'est sérieuse et aucune gouvernance médicale n'est réellement défendable.


## 6. Système d'interactions médicamenteuses

### Types d'interactions

- Pharmacocinétiques (PK) : induction/inhibition enzymatique.
- Pharmacodynamiques (PD) : effets additifs ou antagonistes.
- Toxicologiques : synergies délétères.

### Modèle d'interaction

- id, med_a, med_b, mécanisme, sévérité, clinical_impact, recommendation_template.
- Agrégation multi‑médicament (somme pondérée des contributions par classe d'effet).

### Évaluation et exemples

- Exemple 1 : Millepertuis induit CYP3A4 → risque échec tacrolimus.
- Exemple 2 : SSRIs + triptans → risque sérotoninergique ; règle produit warning + monitoring.

### Maintenance du référentiel

- Connecteurs aux bases standards (Micromedex, CredibleMeds) ; validation locale par comité.


## 7. Architecture du moteur de règles

### Principes

- Règles déclaratives, testables, versionnées.
- Moteur déterministe, stateless, exécutable en parallèle.
- Règles contiennent conditions, outputs, priority, explain_template.

### Format et exemple

Voir annexe pour un exemple complet JSON.

### Exécution

- Engine évalue des `facts` (patient + case + meds). 
- Expressions supportent opérations numériques, textuelles, temporelles et fonctions utilitaires (ex: `contains_class`, `trendIncrease`).

### Conflits et priorités

- Priorités numériques et `trigger_type` (hard_stop, advisory, info).
- Politique : hard_stop > contraindication > major > moderate > minor.

### Scalabilité

- Stateless → scale horizontal. 
- Cache des règles en mémoire et invalidation via webhooks.

### Sécurité

- Sandbox des expressions, timeouts, quotas CPU/mem.

### Architecture critique du moteur de règles

Le moteur de règles constitue le centre de gravité du système. C'est lui qui transforme un ensemble de données cliniques hétérogènes en une décision exploitable, tout en conservant un comportement prévisible et auditable. Dans une architecture hospitalière sérieuse, ce moteur ne peut pas être conçu comme un simple interpréteur d'expressions. Il doit fonctionner comme un orchestrateur clinique : il reçoit un contexte, le décompose en faits, fait circuler ces faits dans plusieurs pipelines spécialisés, puis agrège les résultats selon une logique déterministe. Cette séquence est essentielle, car le risque principal dans un CDSS n'est pas seulement de se tromper ; c'est de se tromper de façon non reproductible.

Le déterminisme est donc un principe de sécurité. À contexte identique, version de règles identique et snapshot patient identique, la sortie doit être la même. Cela permet de rejouer une décision, de la comparer à une autre version et d'expliquer pourquoi une alerte a été émise ou non. Le moteur stocke ainsi non seulement les résultats finaux, mais aussi la trace d'exécution qui relie chaque finding aux conditions ayant conduit à son apparition. Cette traçabilité est une condition de confiance pour les cliniciens comme pour les équipes qualité.

L'isolation des pipelines est tout aussi importante. Les règles d'urgence ne doivent pas dépendre d'un traitement analytique lent ; les règles de toxicologie ne doivent pas être contaminées par des heuristiques de confort ; les règles de dosage doivent pouvoir être évaluées sans attendre la totalité des enrichissements secondaires. L'architecture sépare donc les domaines de décision pour éviter qu'un retard de calcul ou une indisponibilité locale ne dégrade la sécurité clinique globale.

L'explainability graph représente le raisonnement sous forme de graphe plutôt que de texte brut. Cette modélisation permet de relier un résultat à ses causes profondes : une fonction rénale altérée, une grossesse, une interaction, une dose excessive ou une donnée vitale anormale. Le graphe est particulièrement utile dans les revues de cas et les audits car il permet d'isoler les branches de raisonnement déterminantes. Les équipes médicales ne lisent pas un moteur de règles comme un développeur lit du code ; elles ont besoin de voir le chemin qui a conduit à l'alerte. C'est précisément le rôle de cette couche.

Le cache des règles ne doit pas être vu comme un simple optimisation. Dans un environnement critique, il sert à garantir la stabilité des évaluations tout en évitant des accès répétés à la couche de persistance. Les règles peuvent être chargées en mémoire avec un mécanisme de versionning strict et d'invalidation contrôlée. Cette stratégie réduit la latence sans compromettre la reproductibilité, à condition que le snapshot de version soit conservé dans chaque évaluation.

L'emergency override est la dernière ligne de défense. Il permet au moteur de forcer une élévation de criticité lorsque certains patterns cliniques l'exigent, par exemple un état hémodynamique instable, une détresse respiratoire, une convulsion ou un surdosage manifeste. Ce mécanisme ne remplace pas les règles ; il les complète pour éviter qu'un tableau critique soit dilué dans une lecture trop générale. Il doit toutefois rester rare, explicite et lui-même audit-able, car une architecture hospitalière ne peut accepter d'exception silencieuse.


## 8. Familles de règles

Pour chaque famille : objectif, paramètres, exemples.

### CONTRAINDICATION

- Objectif : détecter CI formelles (p. ex. teratogènes en grossesse).
- Exemples : isotretinoïne en grossesse → CI absolue.

### INTERACTION

- Objectif : PK/PD alerts.
- Exemples : amiodarone + fluoroquinolone → QT prolongation.

### TOXICOLOGY

- Objectif : prise en charge intoxications.
- Exemples : paracétamol surdosage et décision NAC.

### OVERDOSE

- Objectif : prise en charge surdosage aigu.
- Exemples : opioïdes → naloxone.

### EMERGENCY

- Objectif : triage et actions immédiates.
- Exemples : SpO2 < 85% → alerte réanimation.

### THERAPEUTIC

- Objectif : suggestions thérapeutiques.
- Exemples : alternative antibiothérapie selon allergies.

### DOSING

- Objectif : calcul posologique précis.
- Exemples : gentamicine mg/kg avec monitor trough.

Ces familles ne constituent pas seulement une classification documentaire. Elles traduisent une hiérarchie clinique. Une règle de contre-indication a une valeur d'arrêt, tandis qu'une règle thérapeutique propose une alternative ou une orientation. Une règle de dosage ajuste la façon de prescrire ; une règle de toxicologie interroge la sécurité d'une exposition ; une règle d'urgence priorise le temps. Cette distinction permet au moteur d'attribuer le bon niveau de criticité, de produire le bon message et de savoir si l'utilisateur doit agir immédiatement ou simplement réévaluer le contexte.

La famille CONTRAINDICATION joue le rôle de garde-fou. Elle protège contre les expositions clairement incompatibles avec l'état du patient : grossesse, allergie connue, atteinte d'organe sévère, antécédent d'intolérance grave. Dans la logique du moteur, cette famille doit être traitée avec une priorité supérieure, car elle correspond à des situations où l'erreur est difficilement acceptable.

La famille INTERACTION s'intéresse à la combinatoire des traitements. C'est une famille particulièrement importante dans les patients polymédiqués ou insuffisants organiques, car le risque ne vient pas d'une molécule isolée mais de leur combinaison. Le moteur doit y traiter les interactions connues, les synergies pharmacodynamiques, les incompatibilités métaboliques et les cumuls de toxicité. La notion de sévérité est ici déterminante : toutes les interactions ne justifient pas le même niveau d'interruption clinique, et le moteur doit être capable d'exprimer cette nuance.

La famille TOXICOLOGY traite les expositions qui sortent du cadre thérapeutique standard ou qui deviennent dangereuses par accumulation. Elle inclut les intoxications aiguës, les expositions répétées et les syndromes toxiques mixtes. L'intérêt d'isoler cette famille est de lui permettre de travailler avec des seuils, des fenêtres temporelles et des symptômes évocateurs propres, sans être diluée dans les autres règles de sécurité.

La famille OVERDOSE intervient lorsque la dose, la fréquence ou la durée dépassent le cadre attendu. Elle doit savoir distinguer un surdosage accidentel d'une surcharge cumulative, et prendre en compte les particularités pédiatriques et gériatriques. Cette famille est souvent la plus sensible en termes d'urgence opérationnelle, car un surdosage ne devient pas nécessairement clinique immédiatement ; le moteur doit donc savoir anticiper la dégradation avant qu'elle ne soit visible.

La famille EMERGENCY concentre les situations où la priorité n'est plus l'optimisation thérapeutique mais la protection immédiate du patient. Une saturation basse, une altération de conscience, une hypotension sévère ou une hyperthermie majeure peuvent suffire à déclencher ce niveau. Le moteur doit alors basculer dans un mode d'alerte plus direct, en réduisant les analyses non essentielles et en mettant en avant les actions concrètes.

La famille THERAPEUTIC encadre les choix de traitement, les alternatives et les arbitrages contextuels. Elle est particulièrement utile lorsque le moteur doit éviter une molécule à risque et proposer une option plus compatible avec le terrain clinique. Cette famille ne doit pas être perçue comme accessoire : dans une architecture hospitalière, la qualité d'une recommandation thérapeutique pèse autant que la capacité à détecter un danger.

La famille DOSING relie la pharmacologie au terrain. Elle traduit les paramètres patient en dose praticable, en rappelant qu'un dosage valide sur le plan théorique peut être inadapté chez un patient fragilisé, insuffisant rénal, dénutri, ou porteur d'une fonction hépatique altérée. C'est l'une des familles les plus concrètes pour les équipes de soins, car elle transforme une abstraction pharmacologique en prescription opérationnelle.


## 9. Pipelines cliniques

### Architecture

Normalisation → Baseline → Interactions → Toxicologie → Overdose → Urgence → Therapeutic → Aggregation & Scoring → Audit/Explicabilité

### Rôles

- Pipeline Baseline : règles patient‑centrées.
- Pipeline Interactions : pairwise + aggregation.
- Pipeline Toxicologie : dépistage substances dangereuses.
- Pipeline Urgence : règles temps réel et escalation.
- Pipeline Overdose : protocole antidote.
- Pipeline Therapeutic/Dosing : recommandations adaptées.

### Isolement et avantages

- Indépendance et possibilité d'échelle spécifique par pipeline.
- Rollback localisé.

### Performance

- Chemins critiques exécutés synchronously, autres asynchrones.

### Orchestration et agrégation clinique

Les pipelines cliniques ne sont pas des étapes cosmétiques ; ils organisent le chemin de décision pour éviter que toutes les logiques ne soient évaluées au même niveau. Le pipeline baseline installe le terrain clinique et produit une première image du risque. Le pipeline urgence vient ensuite surcharger cette lecture lorsque les données temps réel l'exigent. Les pipelines toxicologie et overdose approfondissent les situations d'exposition dangereuse, alors que les pipelines therapeutic et dosing assurent la finesse du choix médicamenteux. Cette architecture par couches évite le mélange des priorités et permet au moteur d'être à la fois rapide sur l'essentiel et précis sur le reste.

L'agrégation finale n'est pas une simple somme. Le moteur doit fusionner des résultats de natures différentes : des alertes, des contributions au score, des recommandations, des contre-indications, des observations de monitoring et parfois des signaux contradictoires. Pour rester fiable, il applique des règles d'arbitrage explicites. Un finding critique peut dominer plusieurs recommandations mineures ; une urgence respiratoire peut reléguer au second plan une optimisation posologique ; un score rénal peut être renforcé par une exposition médicamenteuse cumulative. Le but n'est pas d'avoir la décision la plus longue, mais la décision la plus juste pour le contexte.

La parallélisation est utile tant qu'elle ne compromet pas la lecture clinique. Certaines analyses peuvent être menées en même temps, mais leur résultat doit ensuite être ordonné dans un graphe de dépendances clair. Le moteur doit éviter le piège classique des systèmes trop distribués, où la vitesse de calcul augmente mais où la cohérence de la sortie se dégrade. Ici, la performance n'a de valeur que si la reproductibilité est préservée.

Les scénarios de propagation des risques doivent également être maîtrisés. Un problème de dosage peut faire monter le score toxico, ce qui peut ensuite impacter la recommandation thérapeutique et la surveillance. Une détresse respiratoire peut faire basculer une recommandation de simple avertissement vers une alerte critique. Cette propagation doit rester compréhensible ; c'est le sens du moteur d'explicabilité. Sans cette continuité entre calcul et restitution, l'utilisateur final n'aurait qu'un empilement d'alertes sans hiérarchie claire.


## Workflow opérationnel

Le workflow opérationnel décrit la manière dont la plateforme se comporte au quotidien, depuis la collecte d'un profil patient jusqu'à la restitution d'une décision exploitable par l'équipe soignante. Ce chapitre est important parce qu'il relie l'architecture abstraite à la réalité d'un service clinique. Un moteur peut être techniquement solide et pourtant mal opéré s'il ne s'insère pas correctement dans la chronologie d'une prise en charge. C'est pourquoi le workflow est pensé comme une chaîne de responsabilités clairement ordonnée, où chaque étape enrichit la précédente sans la contredire.

L'exécution commence au moment où un patient est identifié dans le système. Le moteur consolide alors les informations persistantes issues du profil patient, qu'il s'agisse de facteurs de terrain, d'antécédents, d'allergies ou de traitements de fond. Ce premier travail de consolidation n'est pas seulement administratif ; il permet d'établir la base sur laquelle toutes les évaluations suivantes seront interprétées. Dans un dossier hospitalier, cette étape joue le rôle d'une photographie clinique de référence. Si elle est incomplète, le reste du raisonnement perd en précision.

Une fois le profil établi, le cas clinique temps réel prend le relais. Les symptômes saisis, les constantes vitales, les examens biologiques et les événements de prise en charge sont ingérés dans l'ordre où ils apparaissent, avec leur horodatage et leur provenance. Le moteur ne traite pas ces entrées comme un flux indifférencié ; il les met en relation avec l'état antérieur du patient et avec les règles susceptibles de réagir à un changement de contexte. C'est ici que l'orchestration runtime devient essentielle. Elle garantit que les données les plus critiques remontent d'abord vers les pipelines d'urgence, tandis que les enrichissements plus analytiques suivent sans perturber la lecture immédiate.

Dans un service aigu, le workflow doit être capable de basculer très vite d'un mode de surveillance à un mode d'alerte. Si une saturation diminue, si la conscience se dégrade ou si une douleur inhabituelle suggère une complication toxique, le moteur doit réorienter la séquence de traitement. Les pipelines les plus critiques sont alors priorisés, les règles de sécurité sont évaluées en premier, et les recommandations produites doivent pouvoir être diffusées sans attendre une analyse exhaustive de l'ensemble des branches. Cette logique hiérarchisée permet de préserver la sécurité du patient sans ralentir inutilement l'activité du service.

Le workflow opérationnel doit aussi gérer les cas où certaines données sont absentes ou incertaines. En pratique hospitalière, l'absence d'une valeur biologique, d'un poids récent ou d'une information sur l'automédication est fréquente. Le moteur n'interprète pas cette absence comme une neutralité ; il la traite comme une zone d'incertitude qui doit influencer le niveau de prudence. Cela peut conduire à recommander un contrôle complémentaire, à maintenir un dosage conservateur ou à privilégier une alternative plus sûre. Le workflow n'essaie donc jamais de masquer les lacunes de données ; il les intègre explicitement dans la décision.

La phase finale du workflow consiste à restituer une décision exploitable. La sortie n'est pas un simple verdict, mais une synthèse articulée autour des risques, des recommandations et de l'explication. Le moteur doit dire ce qu'il a vu, ce qu'il a interprété et ce qu'il propose. Cette restitution doit rester compréhensible pour un clinicien qui travaille sous contrainte de temps. Elle doit aussi être suffisamment structurée pour permettre l'audit, la relecture et l'amélioration continue. C'est dans cette dernière phase que le système montre sa maturité : il ne se contente pas de calculer, il aide réellement à décider.


## Résultats cliniques

Les résultats cliniques sont la forme visible du travail du moteur. Ils représentent le point de rencontre entre le raisonnement algorithmique et l'usage médical réel. Dans une architecture hospitalière, un résultat n'a de valeur que s'il traduit correctement la gravité du contexte, s'il reste cohérent avec les entrées qui l'ont produit et s'il peut être compris sans ambiguïté par l'utilisateur final. Cette exigence explique pourquoi la couche de résultats ne doit jamais être traitée comme un simple écran de sortie.

Le premier niveau de résultat concerne le score global. Ce score ne constitue pas une vérité absolue ; il synthétise l'intensité du risque observé à travers les différents pipelines. Sa fonction est d'orienter rapidement le niveau d'attention. Un score bas ne signifie pas l'absence de vigilance, mais une situation où le moteur n'a pas identifié de menace majeure immédiate. À l'inverse, un score élevé signale une combinaison de facteurs qui mérite une réévaluation clinique rapide. Ce score est particulièrement utile lorsqu'il est mis en perspective avec les sous-scores rénaux, toxiques, cardiovasculaires ou médicamenteux, car il permet de comprendre ce qui a motivé l'augmentation du niveau de criticité.

Le deuxième niveau de résultat concerne les findings. Chaque finding doit être lu comme un élément clinique interprétable, et non comme une simple alerte technique. Un finding peut signaler une contre-indication, une interaction, un risque d'accumulation, une anomalie biologique ou une urgence respiratoire. Son intérêt est de formaliser le problème détecté dans un langage suffisamment précis pour être réutilisable par l'équipe soignante. Dans un dossier hospitalier bien structuré, le finding devient une pièce de raisonnement ; il peut être relu, comparé, historisé et corrélé à d'autres décisions.

Le troisième niveau est celui des recommandations. Elles constituent le pont entre le diagnostic de risque et l'action clinique. Une recommandation peut suggérer une surveillance rapprochée, une réduction de dose, une alternative thérapeutique, un complément d'examen ou une action urgente. Elles doivent être formulées avec tact, car leur qualité influence directement la confiance des utilisateurs. Une recommandation trop générique perd sa valeur opérationnelle ; une recommandation trop prescriptive peut être perçue comme intrusive. Le moteur doit donc trouver un équilibre entre précision et lisibilité.

La lecture des résultats doit toujours s'inscrire dans la temporalité du cas. Une alerte qui se déclenche sur un événement transitoire n'a pas le même poids qu'une tendance persistante. Un score qui évolue à la hausse doit attirer l'attention sur une aggravation potentielle, tandis qu'un résultat stable peut rassurer sans autoriser la négligence. C'est pourquoi la plateforme conserve la trace des évaluations successives. Les résultats ne sont pas seulement affichés ; ils sont comparés, interprétés et réinscrits dans l'évolution clinique.

Enfin, les résultats cliniques doivent pouvoir être utilisés à plusieurs niveaux. Pour le clinicien, ils éclairent la décision immédiate. Pour le pharmacien ou le comité médicamenteux, ils constituent un support d'analyse des prescriptions. Pour l'équipe qualité, ils documentent la gouvernance du système. Et pour les responsables techniques, ils forment un signal utile sur la performance, la stabilité et la pertinence du moteur. C'est cette capacité à servir plusieurs couches de l'organisation qui fait d'un CDSS enterprise un outil réellement hospitalier.


## 10. Système d'explicabilité

### Objectifs

- Permettre au clinicien de comprendre chaque recommandation : quelles règles, quelles valeurs, quelles preuves.

### Composants

- Trace d'exécution (rule_id, version, matched_conditions). 
- Templates d'explication intégrés aux règles.
- UI : timeline des déclenchements, contribution au score.

### Format d'un explain

`finding`: { id, description, triggered_by: [{ rule_id, rule_version, matched_conditions }], evidence: [...], contribution_score }

### Conservation

- Stockage du explain dans `risk_assessments` ou dans `rule_execution_trace` pour audit.

### Explicabilité et audit replay

L'explicabilité n'est pas un embellissement de l'interface. C'est une exigence de sécurité clinique. Un médecin doit pouvoir comprendre pourquoi le moteur a recommandé de suspendre un traitement, pourquoi un dosage a été réduit, ou pourquoi une alerte d'urgence a été déclenchée. Cette compréhension repose sur trois niveaux complémentaires : le résultat final, le graphe de contribution, et la trace d'exécution complète. Le système doit montrer non seulement la décision, mais aussi les raisons intermédiaires qui ont conduit à cette décision.

L'audit replay est la conséquence logique de cette philosophie. Lorsqu'un cas est réévalué, le moteur doit être capable de recréer l'environnement de décision tel qu'il existait au moment de l'évaluation initiale. Cela implique de conserver le snapshot patient, la version des règles, les conditions d'exécution et le contexte clinique. Une plateforme hospitalière sérieuse ne se contente pas de dire qu'une alerte a été déclenchée ; elle doit pouvoir démontrer qu'elle l'aurait déclenchée à l'époque avec les mêmes éléments d'entrée.

Le rule execution trace est donc un objet de gouvernance autant qu'un artefact technique. Il enregistre les conditions remplies, les conditions non remplies, les scores partiels, les règles ignorées et les règles dominantes. Il permet d'expliquer les divergences entre une alerte générée et une alerte attendue, ce qui est essentiel pour le comité médical, les équipes qualité et les responsables de sécurité des soins.


## 11. Sandbox clinique

### Fonctionnalités

- Import de profils (dé‑identifiés), construction de timelines, exécution de versions multiples de règles, comparaisons.

### Sécurité

- Environnement isolé, accès restreint.

### Cas d'usage

- Validation de nouvelles règles, A/B testing clinique, stress tests.


## 12. Audit et traçabilité

### Exigences

- Historisation immuable de toutes les décisions.
- Rétention configurée selon juridiction.

### Modèle d'audit

`audit_event`: { id, case_id, patient_id, timestamp, actor, action, payload (immutable), rule_snapshot_hash }

### Reproductibilité

- Re‑exécution des décisions sur snapshot de données et version de règles identique.


## 13. Évolutivité future

### Vue stratégique

Le système est conçu pour évoluer vers l'intégration de ML explicable, standards FHIR, monitoring temps réel, NLP médical et connecteurs externes.

### Phases recommandées

- Data collection & featurization pour ML; méthodes explainables (SHAP). 
- APIs FHIR (Patient, Encounter, Observation, MedicationRequest). 
- Monitoring et drift detection.
- Connexions à référentiels toxico/pharma.

### Roadmap future et trajectoire d'industrialisation

L'évolution de la plateforme ne doit pas être pensée comme une succession de fonctionnalités décoratives, mais comme un chemin de maturation clinique et technique. L'intégration FHIR viendra naturellement lorsque l'architecture devra dialoguer plus finement avec les systèmes hospitaliers. À ce stade, il ne s'agit pas seulement d'échanger des objets techniques ; il faut traduire des concepts médicaux de manière stable, normalisée et interopérable. Le moteur devra alors savoir consommer des ressources Patient, Encounter, Observation ou MedicationRequest sans perdre sa logique interne.

Les connecteurs hospitaliers permettront ensuite de réduire la fragmentation des sources. Dans la pratique, une plateforme clinique gagne en robustesse lorsqu'elle est capable d'absorber des flux venant du DPI, du laboratoire, de la pharmacie, du monitoring ou d'un système de prescription. Cette fédération des sources ne doit toutefois pas conduire à une dilution du modèle ; au contraire, elle doit renforcer la qualité du contexte et permettre au moteur de travailler avec une image plus complète du patient.

Le monitoring temps réel ouvre la porte à une lecture plus dynamique des risques. Une plateforme mature peut suivre des tendances plutôt que des valeurs isolées, ce qui améliore la détection précoce de la dégradation clinique. L'important sera alors de préserver la même exigence d'explicabilité : un score prédictif ne doit pas masquer le raisonnement qui l'a produit.

L'IA explicable et le NLP médical doivent être envisagés comme des couches d'enrichissement, jamais comme un remplacement brutal des règles. Le moteur peut à terme apprendre à extraire des entités depuis des notes cliniques, à proposer des priorisations ou à prédire certaines évolutions, mais ces capacités devront rester contraintes par des garde-fous cliniques et des mécanismes d'audit. Dans un environnement hospitalier, la confiance ne se décrète pas ; elle se construit par la lisibilité, la validation clinique et la stabilité des comportements.

Enfin, la fédération multi‑hôpitaux et l'analytics avancé ouvriront des perspectives d'analyse épidémiologique, d'optimisation des pratiques et de surveillance des tendances. Là encore, la priorité restera la sécurité des soins et la protection des données. Une architecture clinique enterprise ne devient vraiment utile à l'échelle qu'à condition de rester gouvernée, auditable et conforme aux exigences institutionnelles.


## 14. Conclusion

La plateforme décrite favorise sécurité, auditabilité, modularité et explicabilité. Elle met le clinicien au centre des décisions et offre un parcours d'évolution contrôlé vers l'IA et l'intégration hospitalière.

À ce niveau d'architecture, la valeur du système ne réside pas seulement dans sa capacité à produire des alertes justes, mais dans sa capacité à le faire de façon défendable, reproductible et contextualisée. C'est cette exigence de rigueur qui distingue une plateforme médicale enterprise d'un simple moteur de règles. Dans un environnement hospitalier, l'enjeu n'est pas de multiplier les signaux ; il est de produire les bons signaux, au bon moment, avec la bonne justification et au bon niveau de criticité.

Le système tel qu'il est décrit ici repose sur une discipline architecturale volontaire : séparation des responsabilités, versionning strict, explicabilité structurée, pipelines spécialisés et logique de sécurité conservatrice. Cette discipline permet d'absorber les évolutions futures sans fragiliser le socle clinique. Elle constitue aussi la meilleure réponse aux impératifs de traçabilité, de résilience et de gouvernance que l'on attend d'une plateforme hospitalière sérieuse.


---

## Annexes

### Annexe A — Exemple de règle (JSON)

```json
{
  "id": "INTERACT-CKD-001",
  "version": "2026-05-20",
  "family": "INTERACTION",
  "priority": 900,
  "enabled": true,
  "conditions": {
    "all": [
      { "fact": "patient.renal_creatinine_clearance", "operator": "<", "value": 30 },
      { "any": [
          { "fact": "medications", "operator": "contains", "value": "NSAID" },
          { "fact": "medications", "operator": "contains_class", "value": "NEPHROTOXIC" }
      ]}
    ]
  },
  "outputs": {
    "findings": [
      { "type": "nephrotoxicity_risk", "severity": "high", "description": "Patient with CrCl < 30 on nephrotoxic agent" }
    ],
    "recommendations": [
      "Evaluer la fonction renale, envisager alternative non‑nephrotoxique, monitorer creatinine sous 48h"
    ],
    "risk_scores": { "renal": 30 }
  }
}
```

### Annexe B — Schéma conceptuel (extrait)

- Table `patients`: id, first_name, last_name, date_of_birth, sex, weight_kg, height_cm, renal_creatinine_clearance, hepatic_status, allergies JSONB, current_medications JSONB, extended_profile JSONB.
- Table `cases`: id, patient_id, user_id, chief_complaint, symptoms, vital_signs JSONB, labs JSONB, created_at.
- Table `medications`: id, name, inn, atc, dosage JSONB, thresholds JSONB, interactions JSONB.
- Table `risk_assessments`: id, case_id, total_risk_score numeric, risk_scores JSONB, findings JSONB, recommendations JSONB, rule_execution_trace JSONB, created_at.

### Annexe C — Scénario clinique illustratif

Patient: 78 ans, 72 kg, CrCl calculé 28 ml/min, traitements: ibuprofène, metformine, warfarine.

Cas: douleur abdominale aiguë, T 38.9°C, SpO2 94%, TA 100/60.

Pipeline résumé:
- Baseline: âge > 75.
- Interactions: NSAID + warfarine → risque hémorragique.
- Renal: CrCl < 30 + NSAID → nephrotoxicity_risk → recommendation: stopper NSAID, monitorer créatinine.
- Aggregation: total_risk_score = 50 → classification "high".

---

*Document généré à des fins techniques. Pour conversion finale en PDF et mise en page réglementaire, appliquer feuille de styles et vérifier la présence d'un comité médical pour validation du contenu clinique.*
