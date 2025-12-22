Summary of changes and manual test steps

✅ What I added
- `src/lib/supabaseClient.ts` — frontend Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (falls back to `VITE_*` env vars).
- `src/lib/ipfs.ts` — `resolveIpfsMetadata(uriOrCid)` helper to fetch metadata from IPFS gateways.
- `src/hooks/useWalletConnect.tsx` — `handleWalletConnect()` hook implementing the Metamask → nonce → sign → verify SIWE flow (calls `/api/auth/nonce` and `/api/auth/verify`). After verify it fetches profile via `GET /api/user/profile` (session cookie is used).
- `src/hooks/useNFTs.tsx` — fetch NFTs by owner and resolve IPFS metadata when present.
- `src/hooks/useItems.tsx` — simple public `.select()` for `items`.
- `src/hooks/useUser.tsx` — combined user-level fetching that calls protected endpoints (`/api/user/profile`, `/api/user/inventory`).
- Server function fixes: refactored `shop-purchase`, `open-chest`, `user-inventory`, and `fuse` to use `users.id` (user_id) when inserting into `inventories`, `transactions`, and `fusion_history`.

⚠️ Notes on RLS and Auth
- Protected reads/writes that require `auth.uid()` are handled server-side via existing Netlify functions (`/api/*`) that verify the `treefi_session` cookie set by `/api/auth/verify`.
- Client hooks rely on server endpoints for RLS-protected data (inventory, transactions, farming state). Public data (items, nfts) are fetched directly via the frontend Supabase client.
- If you want full client-side RLS (i.e., supabase-js `auth` session + `auth.uid()`), you'll need to implement a server endpoint that signs a Supabase auth session token (or create a Supabase user on auth and return session) — that was not added here to avoid adding sensitive flows without confirmation.

Manual test steps
1. Ensure env vars are set: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `VITE_*` equivalents as fallback).
2. Start the app and open console.
3. Call `handleWalletConnect()` (exposed by `useWalletConnect`) and confirm the flow:
   - Metamask prompts account connect
   - `/api/auth/nonce` returns a nonce
   - User signs and `/api/auth/verify` returns 200 and sets `treefi_session` cookie
   - `GET /api/user/profile` returns the users row (includes `id` UUID)
4. Test protected endpoints:
   - `GET /api/user/inventory` should return items mapped to `user_id` values
   - `POST /api/shop/purchase` should succeed and create rows in `inventories` and `transactions` with `user_id` set
5. Test public endpoints:
   - `useItems()` should list items via `supabase.from('items').select('*')`
   - `useNFTs(address)` should return NFTs and if image metadata is an `ipfs://...` URI, `resolveIpfsMetadata` will fetch and attach JSON

Follow-ups (optional)
- Implement a server endpoint that creates/returns a Supabase Auth session/token after SIWE (so `supabase.auth.setSession()` can be used client-side and true `auth.uid()` will be available in browser symmetrically).
- Add automated tests for the hooks and server function behavior.

If you want, I can create the Supabase-auth exchange endpoint next (it requires adding server code to create a Supabase user/session using service role).