# Bibs

Suivi de biberons ultra-simple, déployable sur Vercel + Supabase.

> Spec et workflow détaillés dans `CLAUDE.md`.

## Setup local

1. Cloner et installer :

   ```bash
   pnpm install
   ```

2. Créer un projet Supabase, ouvrir le SQL editor, copier-coller le contenu de `supabase/schema.sql` et l'exécuter.

3. Récupérer dans Supabase → Project Settings → API :
   - `Project URL`
   - `anon public` key

4. Copier `.env.local.example` en `.env.local` et remplir :

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

5. Lancer :

   ```bash
   pnpm dev
   ```

   Ouvre http://localhost:3000.

## Scripts

- `pnpm dev` — serveur de dev
- `pnpm build` — build production
- `pnpm start` — sert le build production
- `pnpm test` — tests Vitest (logique 6h-6h, totaux, 7 jours)
- `pnpm typecheck` — `tsc --noEmit`

## Déploiement Vercel

1. Pousser le repo sur GitHub.
2. Sur Vercel : Import → choisir le repo.
3. Dans Environment Variables, ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. Le service worker n'est actif qu'en production.

## Architecture

- `app/` — pages App Router (Aujourd'hui, Historique, Stats) + manifest et icônes générés.
- `components/` — UI React (BottleSheet, BottleSlider, BottomNav, ConfirmDialog, BottlesProvider, SwRegistrar).
- `lib/day.ts` — logique 6h-6h, totaux, regroupement, série 7 jours. Couvert par Vitest.
- `lib/bottles.ts` — CRUD Supabase. Si network error, enfile dans la queue offline.
- `lib/offlineQueue.ts` — IndexedDB. Drain auto au retour de connexion.
- `public/sw.js` — service worker minimal pour cache shell.
- `supabase/schema.sql` — table `bottles` + RLS permissives.

## Notes de sécurité

L'URL Vercel est publique : qui a le lien peut lire et écrire. C'est assumé pour la v1. Pour durcir : remplacer la politique RLS par une politique conditionnée à un cookie/header partagé, ou mettre l'app derrière Vercel Authentication.
