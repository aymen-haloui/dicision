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


## 14. Conclusion

La plateforme décrite favorise sécurité, auditabilité, modularité et explicabilité. Elle met le clinicien au centre des décisions et offre un parcours d'évolution contrôlé vers l'IA et l'intégration hospitalière.


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
