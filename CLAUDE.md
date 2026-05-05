# Bibs — mémoire projet partagée

Ce fichier est la source de vérité pour le projet **Bibs** (tracker de biberons). Il est partagé entre les deux parents et Claude. Toute session future de Claude doit relire ce fichier avant d'agir.

---

## Workflow imposé à Claude (lis-moi à chaque session)

À chaque demande qui touche au code de cette app, Claude DOIT, dans cet ordre :

1. **Plan d'abord.** Avant toute modification de code, présenter un plan via `ExitPlanMode` (plan mode). Interdiction d'écrire/éditer un fichier de code avant que le plan ait été validé par l'utilisateur.
2. **Tests d'abord.** Pour toute logique métier nouvelle ou modifiée, écrire/mettre à jour les tests Vitest **avant** l'implémentation. Voir section « Tests ».
3. **Implémentation minimale.** Faire juste ce qui est demandé. Pas de refactor opportuniste, pas de features bonus, pas d'abstractions prématurées.
4. **Vérification.** Lancer `pnpm test` et `pnpm typecheck` (ou équivalents) avant de dire que c'est fini. Pour les changements UI, lancer le dev server et vérifier dans un navigateur ; sinon, le dire explicitement.
5. **Commit + push** sur la branche `claude/baby-bottle-tracker-HpSq1`. Messages courts et descriptifs.

Si une demande est ambiguë, utiliser `AskUserQuestion` plutôt que de deviner.

---

## Spec figée v1

### Concept
App web ultra-simple pour suivre les biberons d'**un seul bébé** (notre fille). Hébergée sur Vercel, installable comme app sur téléphone (PWA). Pas de login : qui a l'URL accède directement. URL `*.vercel.app` standard.

### Définition d'une journée
Figée de **6h00 à 6h00**. Les biberons de nuit avant 6h comptent pour la veille. Fuseau horaire = celui du téléphone (auto). Tous les calculs de regroupement quotidien s'appuient là-dessus.

### Pages

**1. Accueil — Aujourd'hui**
- Gros chiffre : total ml bus aujourd'hui (DB vide → simplement « 0 ml »).
- Sous-titre : heure + quantité du dernier biberon (ex. « Dernier : 90 ml à 03h12 »).
- Bouton **+ Ajouter un biberon**.

**2. Saisie d'un biberon (modal ou page)**
- **Slider 0–210 ml par pas de 10**.
- **Heure** pré-remplie (now) mais à **confirmer/modifier obligatoirement**.
- **Note** libre, optionnelle.
- Enregistrer → retour accueil.

**3. Historique**
- Liste de tous les biberons groupés par journée (6h–6h), du plus récent au plus ancien.
- Tap sur un biberon → éditer (slider + heure + note) ou supprimer.
- **Suppression avec dialogue de confirmation.**
- Scroll infini vers le passé.

**4. Stats**
- Graphique en barres : total ml/jour sur les 7 derniers jours (Recharts).

### Hors v1 (ne pas implémenter)
- Pas d'authentification, pas de comptes utilisateurs.
- Pas de plusieurs profils bébés.
- Pas d'objectif quotidien / jauge.
- Pas de tracking préparé vs bu.
- Pas de réglages utilisateur (heure de bascule, fuseau, etc.).
- Pas de Realtime live entre appareils (concurrence optimiste, last-write-wins).

### Style
- Multi-pastel (rose / bleu / pêche, doux).
- Gros chiffres lisibles, focus sur la donnée (style Apple Health version pastel).
- Langue : **Français** uniquement.
- PWA installable : icône d'écran d'accueil, plein écran, manifest, splash.

### Hors-ligne (PWA)
- Service worker avec **file d'attente offline** : ajout possible sans connexion, sync auto au retour de la connexion. Crucial pour 3h du matin sans wifi.

---

## Stack technique

- **Next.js (App Router) + TypeScript + Tailwind**
- **Supabase (Postgres)** pour la persistance (clé anon côté client)
- **Recharts** pour le graphique
- **Vitest** pour les tests unitaires
- **next-pwa** ou équivalent pour le service worker / file d'attente offline
- Hébergement : **Vercel**
- Package manager : **pnpm**

### Schéma DB (Supabase)

Une seule table `bottles` :

```sql
create table bottles (
  id uuid primary key default gen_random_uuid(),
  drunk_at timestamptz not null,
  amount_ml integer not null check (amount_ml between 0 and 210),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bottles_drunk_at_idx on bottles (drunk_at desc);
```

Pas de RLS ouverte côté client : à minima, les politiques doivent autoriser select/insert/update/delete avec la clé anon (URL publique, mais pas de vraie protection — accepté).

### Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Tests

Niveau « simple ». Vitest uniquement, sur la **logique métier** :

- `dayBucket(date, tz)` — retourne la « journée » à laquelle un timestamp appartient (bascule 6h locale).
- `totalForDay(bottles, day, tz)` — somme des ml pour une journée donnée.
- `groupByDay(bottles, tz)` — regroupement pour l'historique et le graphe.
- `last7Days(bottles, today, tz)` — dataset prêt pour Recharts.

Cas obligatoires à couvrir :
- Biberon à 02h30 → compte pour la veille.
- Biberon à 06h00 pile → compte pour le nouveau jour.
- Biberon à 23h59 → compte pour le jour en cours.
- Changement d'heure été/hiver (fuseau du device).

Pas de tests E2E, pas de tests de composants. Si un bug UI nous mord, on ajoutera ciblé.

---

## Branche & déploiement

- Branche de dev : `claude/baby-bottle-tracker-HpSq1`
- Tous les commits y vont, push à chaque étape stable.
- Pas de PR sauf demande explicite.
- Le déploiement Vercel se fait via la connexion GitHub (à configurer côté Vercel manuellement par l'humain).
