# TreeFi - Web3 Farming Game

## ⚠️ CRITICAL SETUP STEPS

Before running the app, you MUST complete these steps:

### 1. Set up Supabase Database

Create a Supabase project at https://supabase.com and get your credentials:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `SUPABASE_ANON_KEY` - Anonymous key (client-side)

**Run the database migration:**
```sql
-- Copy and paste the entire contents of supabase/migrations/001_init_schema.sql
-- into the Supabase SQL Editor and execute
```

Or use Supabase CLI:
```bash
pnpm install -D @supabase/cli
supabase link  # Link to your project
supabase db push  # Push migrations
```

### 2. Set up Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:
```bash
cp .env.example .env.local
```

**Required environment variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only key (keep secret!)
- `SUPABASE_ANON_KEY` - Client-side key
- `APP_DOMAIN` - http://localhost:5173 (or your deployed domain)
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- `BNB_RPC_URL` - BNB Chain RPC (get from Alchemy, Infura, or use https://bsc-dataseed.bnbchain.org/)
- `ALCHEMY_KEY` - Optional: Alchemy API key for better RPC reliability
- `NODE_ENV` - `development` or `production`

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Locally

**Terminal 1 - Frontend & Backend (single command):**
```bash
netlify dev
```

This starts:
- Vite dev server on http://localhost:5173 (frontend)
- Netlify Functions on http://localhost:8888 (backend, proxied through Vite)

> **Note:** Both servers run together with `netlify dev`. If you need separate terminals, run `pnpm dev` in one and `netlify dev` in another.

---

## Testing Wallet Connection

### Prerequisites
1. **MetaMask Extension**: Install from https://metamask.io/
2. **Backend Functions Running**: `netlify dev` must be active (all functions loaded)
3. **Environment Variables**: `.env.local` configured with at least `JWT_SECRET` and `APP_DOMAIN`

### Step-by-Step Testing

#### 1. Verify MetaMask is Installed
Open browser DevTools (F12) and run:
```javascript
window.ethereum
```
Expected: Should see a `MetaMaskInpageProvider` object (not undefined)

#### 2. Click "Connect Wallet" Button
- Button is in the top navbar
- If MetaMask is detected, you'll see "Connect Wallet" button
- If MetaMask is missing, you'll see a red alert with install link

#### 3. Follow MetaMask Popup
- MetaMask should show: "Account access request"
- Select account → Click "Next" → Click "Connect"

#### 4. Sign SIWE Message
- MetaMask popup: "Signature request"
- Message will include your address, nonce, domain, and timestamp
- Click "Sign" to authorize

#### 5. Confirm Connection
- After signing, wallet address displays in navbar (shortened: `0x1234...5678`)
- Balance shown below address (e.g., `0 BNB`)
- "Disconnect" button replaces "Connect Wallet"

### Troubleshooting Wallet Connection

| Issue | Solution |
|-------|----------|
| "MetaMask is not installed" | Install MetaMask from https://metamask.io/ and refresh page |
| MetaMask window doesn't open when connecting | Check browser extensions; MetaMask may be disabled. Enable it. |
| "Nonce request failed" | Ensure `netlify dev` is running and backend functions are loaded. Check terminal output. |
| "SIWE verify failed" | Ensure `JWT_SECRET` and `APP_DOMAIN` are set in `.env.local`. Check browser console for details. |
| Signature request never completes | Reject and try again, or restart MetaMask |
| "Invalid nonce" or "nonce expired" | The nonce is reused within 10 minutes. Try again after 10 minutes. |

### Backend Flow (What Happens Behind the Scenes)

1. **Request Nonce**: `POST /api/auth/nonce`
  - Frontend sends: `{ "address": "0x123..." }`
  - Backend returns: `{ "nonce": "a1b2c3..." }` (stored in memory or Supabase)

2. **Build SIWE Message**: Frontend constructs message with nonce
  - Example format: `domain wants you to sign in with Ethereum to the app: [address] ... Nonce: [nonce] ...`

3. **Sign Message**: User signs via MetaMask
  - Returns: signature from `signer.signMessage(message)`

4. **Verify Signature**: `POST /api/auth/verify`
  - Frontend sends: `{ "message": "...", "signature": "0x..." }`
  - Backend verifies signature matches address and nonce
  - Backend creates JWT session and returns `Set-Cookie` header
  - Session cookie automatically stored in browser (HttpOnly, secure)

5. **Logged In**: Session maintained via cookie for subsequent requests

### Testing Without Supabase (Development Mode)

If you haven't set up Supabase yet, the auth functions automatically fall back to **in-memory storage**:
- ✅ Nonces are generated and validated in memory
- ✅ JWT sessions are created and signed  
- ✅ Full wallet connection flow works locally

**Limitations (in-memory mode):**
- Nonces are cleared when backend restarts
- Data isn't persisted between backend restarts
- User data isn't stored

**To enable full persistence**: Set up Supabase and add credentials to `.env.local`

---

## technology stack

This project is built with:

- Vite - Fast build tool
- TypeScript - Type safety
- React 19 - UI framework
- shadcn-ui - Component library
- Tailwind CSS - Styling
- Ethers.js v6 - Web3 library
- MetaMask - Wallet integration
- SIWE (EIP-4361) - Ethereum signing
- Supabase - Database & storage
- Netlify Functions - Serverless backend

## File Structure

- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration file
- `tailwind.config.js` - Tailwind CSS configuration file
- `package.json` - NPM dependencies and scripts
- `src/app.tsx` - Root component of the project
- `src/main.tsx` - Project entry point
- `src/index.css` - Existing CSS configuration
- `src/pages/Index.tsx` - Home page logic

## Components

- All shadcn/ui components are pre-downloaded and available at `@/components/ui`

## Styling

- Add global styles to `src/index.css` or create new CSS files as needed
- Use Tailwind classes for styling components

## Development

- Import components from `@/components/ui` in your React components
- Customize the UI by modifying the Tailwind configuration

## Note

- The `@/` path alias points to the `src/` directory
- In your typescript code, don't re-export types that you're already importing

# Commands

**Install Dependencies**

```shell
pnpm i
```

**Add Dependencies**

```shell
pnpm add some_new_dependency

**Start Preview**

```shell
pnpm run dev
```

**To build**

```shell
pnpm run build
```






.......................``` backend promt``` ..........


One-liner: below is a complete, copy-pasteable backend prompt you can give to a developer or AI to implement a secure backend for your TreeFi project using Supabase, BNB Chain, and MetaMask (SIWE). It includes architecture, APIs, DB schema, security controls, deployment, and acceptance criteria.

Backend Implementation Prompt

Project: TreeFi — Web3 farming game backend
Stack: Supabase (Postgres + Auth + Storage + Edge Functions), Node/TypeScript (optional, for any custom business logic), Ethers.js (BNB Chain RPC interaction), Sign-In With Ethereum (SIWE) via MetaMask
Goal: Build a secure, production-ready backend for user auth, NFT management, item/shop purchases, fusion mechanics, claims, and integration with BNB Chain for on-chain receipts. Use Supabase as the primary backend and storage. Provide secure APIs, RLS policies, and logging/monitoring.
High-level requirements

Use SIWE (EIP-4361) to authenticate wallet owners via MetaMask; persist users in Supabase users table and create sessions.
Store NFT metadata and app-only state in Supabase Postgres; images stored in Supabase Storage (private/public buckets).
Handle fusion, chest opening, claims, purchases server-side (via Supabase Edge Functions or a small Node server) to avoid exposing business logic and secrets to the client.
Integrate with BNB Chain RPC (Alchemy/Infura or public RPC) only for verification / signatures / optionally sending transactions (if required).
Secure everything: HTTPS-only, CORS, CSP, RLS, environment secrets stored in Supabase/Secrets Manager, nonces for SIWE, rate limiting, input validation, and auditing.
Deliverables

Supabase project schema (SQL migration) with RLS policies.
Edge functions (or server endpoints) for: auth nonce + verify (SIWE), getNFTs, createNFT, fuse, openChest, purchaseItem, consumeItem, getClaimable, claim, webhooks for on-chain events (optional).
Postgres schema & indices (users, nfts, items, inventories, transactions, fusion_history, sessions).
Supabase storage setup (buckets & recommended ACLs).
Sample client-server contract of SIWE flow (frontend helper + backend verify).
Security checklist, env var list, and deployment steps.
Documentation: API spec, example requests/responses, Postman/Insomnia collection (or OpenAPI), and acceptance tests.
API Spec (concise)
Note: prefer implementing via Supabase Edge Functions or serverless endpoints. Use JWT or Supabase session cookie after SIWE.

POST /api/auth/nonce

Request: { address }
Response: { nonce }
Purpose: produce a one-time nonce string stored server-side (or in DB) for SIWE.
POST /api/auth/verify

Request body: { message, signature } (the EIP-4361 message & signature)
Behavior: Verify signature/nonce, create or update user in users table, return Supabase session JWT (or set secure HttpOnly cookie) and user profile.
Response: { session: {...}, user: {...} }
GET /api/nfts?owner=<address>

Protected: optional read-only for all; return list of NFT metadata rows (image URL, rarity, power, yield, id, owner)
POST /api/nft/create

Protected: server-only (admin or via signed transaction); creates NFT record, optionally moves image to storage; returns created NFT.
POST /api/fuse

Protected: requires authenticated session + signature confirmation (optional)
Request: { nftIds: [id1, id2, id3] }
Behavior: validate ownership via DB, validate rarities (all same), compute resulting rarity, create new NFT record, burn/mark input NFTs as fused/consumed, persist fusion_history, return new NFT metadata. Use DB transaction.
POST /api/chest/open

Protected: user auth
Request: { type?: 'standard' | 'premium' }
Behavior: apply server-side RNG, pick rarity, create NFT record, return NFT metadata.
GET /api/items

Public: returns shop catalog (items with price, id, etc.)
POST /api/shop/purchase

Protected: { itemId, qty } → create transactions row, deduct balance in DB (or record on-chain payment), update inventory.
POST /api/claim

Protected: { nftId } → compute claimable using CLAIM_FEE_SCHEDULE, apply fee, persist ledger (transactions), return amount.
POST /api/webhooks/bsc (optional)

Verify incoming webhooks (via signature) from a relayer or service notifying of on-chain events (e.g., tx confirmations).
Security requirements per endpoint:

Validate inputs strictly (Zod/TypeBox/Joi).
Require authentication for state-changing endpoints, and verify ownership (e.g., nft.owner === authenticated address) at server side.
Wrap state changes in a DB transaction; on error, rollback.
Rate-limit fusion/openChest/purchase endpoints per account & IP.
Database Schema (recommended, simplified)

users (id UUID PK, wallet_address text unique, created_at, profile JSONB, last_seen, email (optional))
nfts (id serial PK, owner_address text, rarity text, level int, power int, daily_yield numeric, health int, image_url text, metadata JSONB, status text ('active','burned'), created_at)
items (id text PK, name, description, price numeric, image_url text, type enum)
inventories (id PK, user_id FK -> users.id, item_id FK -> items.id, qty int)
transactions (id PK, user_id FK, type enum, amount numeric, metadata JSONB, created_at)
fusion_history (id PK, user_id, input_nft_ids JSONB, result_nft_id FK, cost numeric, created_at)
nonces (address PK, nonce text, expires_at timestamp) — or store nonces in Redis if available
Indices: index on nfts.owner_address, transactions.user_id, etc.
Supabase configuration & security

Enable Row Level Security (RLS) on tables. Default deny; create policies:
users: allow auth.uid() equals users.id for updates & reads (or permit safe reads).
nfts: allow SELECT to all (if public marketplace); allow UPDATE/DELETE only where owner_address = auth.jwt().wallet or via server role.
inventories: allow read/write only when auth.uid() = user_id.
Use Supabase Storage buckets:
public-nft-images (public read) — for images used widely. OR
private-nft-images (private) — use signed URLs to deliver images to clients for limited time.
Use Supabase Edge Functions for server-side logic: keep secrets (BNB Chain RPC keys, private relayer keys) in Supabase secrets.
Use Supabase Auth for sessions (but SIWE needs custom verification): After successful SIWE, create (or upsert) Supabase user row and issue a Supabase session by calling Supabase Admin API or set session cookie from Edge Function.
Recommended: Use import.meta.env / Supabase secrets for RPC keys, Alchemy/Infura keys.
Authentication & Wallet flow (detailed SIWE)

Client requests nonce: POST /api/auth/nonce { address } → server generates cryptographically random nonce (e.g., 24+ chars), store with address and expiry (5–15 minutes).
Client constructs SIWE message, signs via MetaMask: signMessage(signatureMessage).
Client sends message + signature to /api/auth/verify.
Server verifies:
Use EIP-4361 message parsing (library: siwe for Node).
Verify signature matches message and message.nonce equals stored nonce for address and message.origin matches your domain.
If verified → upsert user in users table and create a session token (JWT or Supabase session).
Clear nonce.
Respond with secure HttpOnly cookie with session (if using your server session) or return a short-lived JWT. Prefer HttpOnly cookie for web apps to avoid XSS token theft.
Security details for SIWE:

Use strict domain and chainId checking.
Nonce must be one-time and have an expiry.
Ensure message.issuedAt and message.expirationTime checks.
Do not rely only on client-side proof; always re-verify server-side.
BNB Chain integration details

Use Ethers.js for RPC calls: const provider = new ethers.providers.JsonRpcProvider(process.env.BNB_RPC_URL)
Use it for: verifying transaction receipts, reading contract state, or sending transactions (if backend is expected to sign — avoid holding keys in backend unless necessary).
If on-chain payments are required: prefer user-signed transactions that are later verified by backend (by querying receipt and checking event logs), rather than holding a server private key to transfer funds.
For any webhook based confirmations, always re-check RPC node yourself to avoid trusting external relayers.
Security Checklist / Best Practices

HTTPS everywhere (managed by hosting provider).
CSP and secure headers (use helmet if using Node or set headers in Edge Functions).
CORS: restrict origins to your frontend domain(s) only.
Rate limiting: add per-IP and per-account rate-limits for heavy endpoints (/api/fuse, /api/chest/open, /api/shop/purchase).
Secrets: store SUPABASE_SERVICE_KEY, BNB_RPC_URL, ALCHEMY_KEY in Supabase secrets or a managed secrets store. Rotate keys periodically.
Database: enable automatic backups & point-in-time recovery if available.
RLS: enforce row-level settings on Postgres; use server role for admin tasks only.
Parameterized DB queries and strong input validation on all APIs.
Logging: centralize logs and include requestId, userId, and sanitized payloads. Keep audit trail for financial operations.
Monitoring & Alerts: set up uptime checks, error monitoring (Sentry), and alerts for failed claims or suspicious activity.
Data retention & privacy: keep PII minimal, and document data retention policy.
Operational & Deployment

Supabase: host DB and Storage on Supabase; deploy Edge Functions within Supabase for server logic.
CI/CD: use GitHub Actions to run lint, tests, and deploy Edge Functions & schema migrations.
Env vars required:
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
BNB_RPC_URL / ALCHEMY_KEY
APP_DOMAIN (for SIWE domain verification)
JWT_SECRET (if issuing your own JWTs)
Migrations: store SQL schema in supabase/migrations and apply via GitHub Actions.
Testing & QA

Unit tests: cover all business logic (fusion rules, chest RNG distribution, claim computation).
Integration tests: simulate SIWE flow, create user, create NFTs, perform fusion, purchase item flows using test wallets (Ganache/BNB testnet).
Security tests: run basic fuzzing, check RLS policies using non-authenticated requests.
Run load tests for heavy endpoints (simulate many concurrent chest opening/fusion actions).
Acceptance Criteria

SIWE authentication works end-to-end: nonce generation, message signing, server verification, and authenticated sessions.
NFTs returned by GET /api/nfts show correct image_url resolving to Supabase Storage URLs (no external DiceBear links).
Fusion endpoint: returns a valid new NFT, invalid inputs rejected, and DB state consistent (transactional).
Purchase flows: create transactions rows and update inventories correctly.
RLS policies enforced: clients cannot update other users’ data directly via DB.
All secrets are not kept in client code and are stored in Supabase/secret manager.
No open CORS to *, only allowed origins.
Basic load: endpoints handle expected demo load without errors.
Example checklist to hand to dev/AI

 Create SQL migrations for all tables.
 Implement nonce + verify SIWE endpoints using siwe library.
 Upsert Supabase users row on first SIWE login.
 Implement generateMockNFTs, fuse, openChest as Edge Functions (transactional).
 Add RLS policies and test them.
 Configure Supabase Storage & move sample images to appropriate buckets; ensure image_url uses storage URL.
 Add monitoring, logging, and error tracking.
 Write integration tests that simulate full user flows.
 Document environment variables and deployment steps in README.md.
\n## Netlify Functions (SIWE + Supabase)
This project includes example Netlify Functions to handle SIWE (Sign-In With Ethereum) and Supabase integration.

- Local dev: install Netlify CLI and run functions locally:

```powershell
pnpm add -D netlify-cli
npx netlify dev
```

- Deploy: set the following environment variables in Netlify Dashboard under Site → Settings → Build & deploy → Environment:

  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `SUPABASE_ANON_KEY`
  - `BNB_RPC_URL`
  - `ALCHEMY_KEY` (optional)
  - `APP_DOMAIN`
  - `JWT_SECRET` (if issuing custom tokens)

Netlify routes `/api/*` to the functions in `netlify/functions` per `netlify.toml`.
Short implementation notes & sample libs

Node/TypeScript libraries:
siwe (EIP-4361)
ethers
zod or joi/@hapi/joi for validation
pg client or use Supabase JS client for DB operations
Supabase Edge Functions (Deno/TS) if using Supabase native
SIWE helper pattern (pseudocode):
Generate nonce: crypto.randomBytes(16).toString('hex')
Persist nonce with address and expires_at
Verify: use new SiweMessage(message).verify({ signature, domain, nonce })




.......... AMEND ...........


Amended Backend Implementation Prompt (Netlify Functions)

One-liner: below is a complete, copy-pasteable backend prompt you can give to a developer or AI to implement a secure backend for your TreeFi project using Netlify Serverless Functions (Node/TypeScript), Supabase (Postgres + Storage), BNB Chain (Ethers.js), and MetaMask (SIWE). It includes architecture, APIs, DB schema, security controls, deployment, and acceptance criteria.

Project: TreeFi — Web3 farming game backend
Stack: Netlify Functions (Node/TypeScript) for server-side logic, Supabase (Postgres + Auth + Storage) as the DB and storage provider, Ethers.js (BNB Chain RPC interaction), Sign-In With Ethereum (SIWE / EIP-4361) via MetaMask

Goal: Build a secure, production-ready backend for user auth, NFT management, shop purchases, fusion mechanics, claims, and BNB Chain verification. Use Supabase for authoritative storage and metadata; deploy server-side business logic as Netlify Functions so secrets and logic stay on the server.

High-level requirements

Use SIWE (EIP-4361) to authenticate wallet owners via MetaMask; persist users in the Supabase users table and issue a session (cookie or JWT).
Store NFT metadata and app-only state in Supabase Postgres; images in Supabase Storage (public or private buckets).
Implement fusion, chest opening, claims, and purchases server-side as Netlify Functions to avoid exposing business logic and secrets on the client.
Use Ethers.js + BNB Chain RPC (Alchemy/Infura or other) only for verification of receipts or reading on-chain state; do not store persistent private keys unless required.
Secure endpoints (HTTPS enforced by Netlify), enforce CORS, CSP, RLS on Postgres, input validation, rate limiting, and logging/auditing.
Deliverables

Postgres schema (SQL migrations) with RLS policies.
Netlify Functions (serverless) for: auth nonce + verify (SIWE), getNFTs, createNFT, fuse, openChest, purchaseItem, consumeItem, getClaimable, claim, and optional webhooks for on-chain events.
Supabase storage setup guidance (buckets & ACL recommendations).
Sample client-server contract for SIWE flow (frontend helper + server verify).
Security checklist, env var list, and Netlify-specific deployment steps and netlify.toml example.
Documentation: API spec, example requests/responses, OpenAPI or Postman collection, and acceptance tests.
API Spec (Netlify Functions)
Note: Map each serverless function to an /api/* route via netlify.toml (examples below). Functions run under netlify/functions by default.

POST /api/auth/nonce

Request: { address }
Response: { nonce }
Purpose: produce a one-time nonce stored server-side (or in DB) for SIWE. Store nonce in nonces table (Supabase) or Redis.
POST /api/auth/verify

Request: { message, signature }
Behavior: Verify SIWE message and nonce; upsert user in users table; create a server session (issue Supabase session via service role or set secure HttpOnly cookie). Return user profile and session (or set cookie).
Response: { session: {...}, user: {...} }
GET /api/nfts?owner=<address>

Protected: read-only; returns list of NFT metadata rows (image_url, rarity, power, yield, id, owner)
POST /api/nft/create

Protected: admin/server-only; creates NFT record in DB, optionally moves image to storage; returns created NFT.
POST /api/fuse

Protected: authenticated user
Request: { nftIds: [id1, id2, id3] }
Behavior: validate ownership in DB, validate rarities (if required), compute resulting rarity, create result NFT row, mark inputs as burned/consumed, persist fusion_history. Use DB transaction.
POST /api/chest/open

Protected: authenticated user
Request: { type?: 'standard' | 'premium' }
Behavior: server-side RNG, pick rarity, create NFT row, return metadata.
GET /api/items

Public: returns shop catalog
POST /api/shop/purchase

Protected: { itemId, qty } → create transaction row, deduct balance (DB) or verify on-chain payment, update inventory.
POST /api/claim

Protected: { nftId } → compute claimable per schedule, apply fee, persist transaction, return result.
POST /api/webhooks/bsc (optional)

Verify incoming webhooks (signature) from relayers; always re-verify receipts using your BNB Chain RPC provider.
Netlify-specific architecture & deployment notes

Functions location: place server code in netlify/functions or configure a different folder in netlify.toml.
Local dev: use the Netlify CLI netlify dev to run functions locally and test endpoints.
Routing: create netlify.toml rewrites so /api/* maps to /.netlify/functions/* (example below).
Secrets & env vars: set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, BNB_RPC_URL, ALCHEMY_KEY, APP_DOMAIN, JWT_SECRET, etc., in the Netlify Dashboard under Site Settings → Build & deploy → Environment.
Long tasks: Netlify Functions are limited in execution time. For longer jobs, use background functions, queue work (e.g., using Redis/Upstash), or offload to external worker services.
Consider Netlify Edge Functions if you need tiny latency-critical logic at the CDN edge (Deno runtime), but use normal Netlify Functions (Node) for SIWE and DB transactions because they require Node libs and likely the Supabase client.
Example netlify.toml

Provide in repo root:
[build]
  command = "pnpm build"
  functions = "netlify/functions"
  publish = "dist" # or your build output

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

  Environment variables (Netlify Dashboard)

SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY (server-only; never expose to client)
SUPABASE_ANON_KEY
BNB_RPC_URL
ALCHEMY_KEY
APP_DOMAIN
JWT_SECRET (if you issue custom tokens)
RATE_LIMIT_REDIS_URL / REDIS_PASSWORD (if using Redis-based rate limit)
Security & Best Practices (Netlify + Supabase)

HTTPS is automatic on Netlify.
Use strict CORS allowing only your frontend origin.
Use CSP and secure headers; Netlify allows custom headers via _headers or netlify.toml.
Store secrets in Netlify environment variables (never in client code).
Use Supabase RLS on tables: default deny and create minimal policies.
For SIWE nonce store: either use a dedicated nonces table in Supabase or an external Redis (Upstash). Avoid in-memory per-function counters (stateless functions).
Rate-limiting: use an external store (Redis / Upstash) or implement per-account throttling via DB counters; per-IP throttles should use a distributed store.
Input validation: use zod or joi.
Wrap modifications in Postgres transactions; rollback on failure.
Audit logs: persist important actions (purchases, fusions, chest openings) in transactions table.
Logging: send function logs to Netlify logs + optionally to external logger (Sentry).
DB Schema (recommended simplified)

users (id UUID PK, wallet_address text unique, created_at, profile JSONB, last_seen)
nfts (id serial PK, owner_address text, rarity text, level int, power int, daily_yield numeric, health int, image_url text, metadata JSONB, status text, created_at)
items (id text PK, name, description, price numeric, image_url text, type enum)
inventories (id PK, user_id FK -> users.id, item_id FK -> items.id, qty int)
transactions (id PK, user_id FK, type enum, amount numeric, metadata JSONB, created_at)
fusion_history (id PK, user_id, input_nft_ids JSONB, result_nft_id FK, cost numeric, created_at)
nonces (address PK, nonce text, expires_at timestamp)
Indices: nfts.owner_address, transactions.user_id, etc.
Implementation guidance / Serverless code notes

Use @supabase/supabase-js with the service role key from your Netlify Function (server only) for DB changes needing elevated privileges.
For SIWE verification, use siwe library in the function that handles auth/verify.
Set cookies from Netlify Functions by returning Set-Cookie headers. For example, set HttpOnly, Secure, SameSite=Strict, Path=/, and set an expiration.
To create a Supabase session from server: either call Supabase REST or use the Admin APIs or issue your own JWT signed with JWT_SECRET.
Keep the Supabase service role key only in Netlify env vars.
Sample Netlify Function pseudocode (TypeScript, simplified)

netlify/functions/auth-nonce.ts (generate & return nonce)

import { Handler } from "@netlify/functions";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const handler: Handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const address = (body.address || "").toLowerCase();
  if (!address) return { statusCode: 400, body: JSON.stringify({ error: "address required" }) };

  const nonce = crypto.randomBytes(16).toString("hex");
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // Persist nonce in Supabase nonces table
  await supabase.from("nonces").upsert({ address, nonce, expires_at }, { onConflict: ["address"] });

  return { statusCode: 200, body: JSON.stringify({ nonce }) };
};


netlify/functions/auth-verify.ts (verify SIWE + create session)

import { Handler } from "@netlify/functions";
import { SiweMessage } from "siwe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const handler: Handler = async (event) => {
  const { message, signature } = JSON.parse(event.body || "{}");
  if (!message || !signature) return { statusCode: 400, body: JSON.stringify({ error: "missing" }) };

  const siweMessage = new SiweMessage(message);
  try {
    const fields = await siweMessage.validate(signature);
    const stored = await supabase.from("nonces").select("nonce").eq("address", fields.address).single();
    if (!stored.data || stored.data.nonce !== fields.nonce) {
      return { statusCode: 401, body: JSON.stringify({ error: "invalid nonce" }) };
    }

    // Upsert user
    const profile = { wallet_address: fields.address, last_seen: new Date().toISOString() };
    await supabase.from("users").upsert({ wallet_address: fields.address, profile }, { onConflict: ["wallet_address"] });

    // Option A: create your own session cookie (signed JWT) and set Set-Cookie header
    // Option B: call Supabase Admin API to create a session (requires using Supabase Auth Admin APIs)
    // Example (pseudo): const session = createSessionForUser(fields.address);

    // Clear nonce
    await supabase.from("nonces").delete().eq("address", fields.address);

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": "treefi_session=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600"
      },
      body: JSON.stringify({ ok: true, user: { address: fields.address } })
    };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: "siwe verification failed", details: String(err) }) };
  }
};


Notes:

The examples above are simplified. Implement robust error handling, domain/chainId checks, time checks, and CSRF protections.
If you issue your own JWT, sign with JWT_SECRET and set cookies with HttpOnly + Secure flags.
If you prefer Supabase sessions, use the Admin API to create a session after verification.
Rate-limiting, anti-abuse, and scaling

Use Upstash Redis or a managed Redis to implement per-address and per-IP rate-limiting for heavy endpoints (/api/fuse, /api/chest/open, /api/shop/purchase).
Implement a simple leaky-bucket algorithm stored in Redis.
Avoid relying on in-memory per-function counters (cold-starts and statelessness).
Consider per-user daily quotas and fraud detection patterns (e.g., rapid chest opens, many fusions).
Testing & QA

Unit tests for core business logic: fusion rules, RNG distribution, claim calculations.
Integration tests using Netlify CLI: netlify dev + test suite that hits function endpoints.
Security tests: validate RLS policies by attempting unauthorized DB operations, SIWE replay attacks, and CORS misconfigurations.
Load testing: simulate concurrent chest opens and fusions using a load test tool; ensure DB connections and function concurrency are sufficient.
Acceptance Criteria

SIWE authentication works end-to-end: nonce generation, signing, server verification, and authenticated session cookie or token.
NFT metadata returned by /api/nfts uses Supabase Storage URLs (no external DiceBear links).
Fusion endpoint returns a valid new NFT, rejects invalid inputs, and DB state remains consistent (transactional).
Purchase flows create transaction rows and update inventories correctly.
RLS policies enforced so clients cannot update other users’ data directly via Supabase.
No secrets in client code. Netlify environment variables used for service keys.
No open CORS; only allowed origins permitted.
Checklist to hand to a developer or AI

Create SQL migrations for all tables and RLS policies.
Implement auth-nonce and auth-verify as Netlify Functions using siwe and Supabase service role key.
Implement getNFTs, fuse, openChest as Netlify Functions with DB transactions.
Implement storage flow: move sample images to Supabase Storage and ensure image_url uses storage URLs.
Add rate-limiting via Upstash/Redis or DB counters.
Add logging, monitoring (Sentry), and alerts.
Write integration tests that simulate full flows.
Add Netlify deployment docs and add required env vars in Netlify dashboard.
Quick Netlify dev commands

Install Netlify CLI: pnpm add -D netlify-cli
Run locally: npx netlify dev
Deploy: connect repo to Netlify and push; or netlify deploy --prod (use Netlify CLI docs)
If you want, I can:

Create the netlify.toml and example Netlify function files (netlify/functions/auth-nonce.ts, netlify/functions/auth-verify.ts) in your repo.
Add recommended NPM dependencies to package.json (e.g., siwe, @supabase/supabase-js, ethers, zod, upstash-redis).
Implement a DB migration SQL file template in supabase/migrations.
Would you like me to generate the netlify.toml and the two example function files now?