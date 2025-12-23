# Gift Codes Normalization & Migration

This document explains the migration steps and tools included to move your gift codes to a normalized, production-safe format stored in Supabase.

Goals
- Normalize `code` values to trimmed uppercase (e.g., `OG-TREE-00001-ABCD`) and store as `normalized_code`.
- Deduplicate any duplicated codes.
- Enforce uniqueness on `normalized_code` via an index.
- Ensure Netlify functions use Supabase in production (avoid in-memory fallback).

Included artifacts
- `supabase/migrations/20251221_normalize_gift_codes.sql` — migration that adds `normalized_code`, populates values, and attempts to add a unique index (only if no duplicates).
- `scripts/backfill-normalize-gift-codes.js` — Node script that reports duplicates and (with `--fix`) will normalize codes and delete duplicates. Claim history is now recorded in `transactions` and a migration will move any existing per-claim rows into `transactions` before dropping the old table.
- `scripts/check-gift-code.js` — quick helper to look up a code using the service role key.
- `netlify/functions/_utils/gift_codes.ts` — updated to use `normalized_code` for lookups and to perform id-based claim updates.

Safe migration steps
1. Run a dry-check to list duplicates:
   ```bash
   npm run normalize-gift-codes-report
   ```
   Review the output and fix any problematic duplicates if you prefer manual review.

2. If the results look good, run the automatic fix:
   ```bash
   npm run normalize-gift-codes-fix
   ```
   This will:
   - Normalize all `code` values to trimmed uppercase and set `normalized_code`.
   - Merge duplicate groups by keeping the lowest `id` as the keeper.
   - Move any references in `gift_code_claims` to the keeper where possible.
   - Delete duplicate rows.
   - Attempt to create a unique index on `normalized_code`.

3. Run a few spot checks:
   ```bash
   npm run check-gift-code -- THE_CODE
   ```

4. Deploy updated site (if you haven’t already) with `REQUIRE_SUPABASE=true` set in Netlify env to ensure no in-memory fallback.

Notes & safety
- The `--fix` operation tries to be conservative: it keeps the lowest id as the canonical row and attempts to preserve claims and references; still **review database state** after running.
- If you have custom tables referencing `gift_codes` by `code` (not `id`), review and adjust those relationships.
- Back up your database before running destructive operations.
