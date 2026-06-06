# Supabase Vocab Migration

This project can now read vocab from the `vocab_entries` table in Supabase
instead of bundling JSON from
[`/Users/testing/Desktop/torah-lev/lib/data/vocab`](/Users/testing/Desktop/torah-lev/lib/data/vocab).

## 1. Create the table

Run:

```bash
pnpm run db:push
```

That will create the new `vocab_entries` table from
[`/Users/testing/Desktop/torah-lev/db/schema.ts`](/Users/testing/Desktop/torah-lev/db/schema.ts).

## 2. Configure media URLs

Add this env var if your vocab images/audio live in a public Supabase bucket:

```bash
NEXT_PUBLIC_SUPABASE_VOCAB_BUCKET=vocab-media
```

The app will turn stored paths like `awb/awb1/good tov.mp3` into:

`https://<your-project>.supabase.co/storage/v1/object/public/<bucket>/awb/awb1/good tov.mp3`

If the env var is missing, the app falls back to local-style paths like
`/awb/...`.

## 3. Sync vocab rows

Run:

```bash
pnpm run db:syncVocab
```

That script:

- imports every file from
  [`/Users/testing/Desktop/torah-lev/lib/data/vocab`](/Users/testing/Desktop/torah-lev/lib/data/vocab)
- upserts rows into `vocab_entries`
- preserves the full original entry in the `payload` column
- stores image/audio references as bucket-relative paths

## 4. Move media into Supabase Storage

Use one public bucket for vocab media, for example `vocab-media`, and upload
files so their object paths match the stored refs:

- `awb/awb1/good tov.mp3`
- `english/atm.mp3`
- `awb1/bull par.jpg`

You can automate this with:

```bash
pnpm run storage:uploadVocabMedia
```

That script:

- creates the bucket if it does not exist
- scans the vocab JSON files for referenced image/audio paths
- uploads matching files from `public/`
- prints any missing local files at the end

Once the files are in the bucket and `NEXT_PUBLIC_SUPABASE_VOCAB_BUCKET` is set,
the app will serve them from Supabase automatically.

## Rollout behavior

The new loaders in
[`/Users/testing/Desktop/torah-lev/lib/server/vocab.ts`](/Users/testing/Desktop/torah-lev/lib/server/vocab.ts)
are safe to deploy before data migration:

- if `vocab_entries` exists and has rows, the app uses Supabase
- if the table is empty or unavailable, the app falls back to the existing local
  JSON files
