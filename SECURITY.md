# Security notes and guidelines for TreeFi Netlify Backend

## Session Verification

All protected endpoints now verify the session JWT from the `treefi_session` cookie. The verification helper is in `netlify/functions/_utils/auth.ts` and should be used in any new protected endpoint:

```typescript
import { verifySession } from "./_utils/auth";

const session = verifySession(event.headers.cookie);
if (!session) return { statusCode: 401, body: JSON.stringify({ error: "not authenticated" }) };
const address = session.address; // guaranteed lowercase Ethereum address
```

## Input Validation

All endpoints validate input using Zod schemas in `netlify/functions/_utils/validation.ts`. Example:

```typescript
import { NonceRequestSchema, validateRequest } from "./_utils/validation";

const validation = validateRequest(NonceRequestSchema, parsedBody);
if (!validation.valid) {
  return { statusCode: 400, body: JSON.stringify({ error: validation.error }) };
}
const { address } = validation.data!;
```

## CORS and Security Headers

All endpoints include CORS headers (restricted to `APP_DOMAIN`) and security headers (HSTS, CSP-like headers, X-Frame-Options, etc.) via helpers in `_utils/auth.ts`:

```typescript
const headers = { ...corsHeaders(), ...securityHeaders() };
return { statusCode: 200, headers, body: JSON.stringify({ ... }) };
```

## Rate Limiting

Rate limiting is not yet implemented but should be added for high-risk endpoints (`/api/fuse`, `/api/open-chest`, `/api/shop-purchase`). Options:

1. **Upstash Redis**: recommended for production (scalable, distributed).
2. **Database counters**: alternative using Supabase `rate_limits` table (simple, suitable for MVP).
3. **Per-IP + Per-Account**: throttle both by client IP (from `event.headers['client-ip']`) and by authenticated address.

Example Redis-based approach (add to any function):
```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const key = `rate:${address}:${endpoint}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 60); // 1 minute window
if (count > 5) return { statusCode: 429, body: JSON.stringify({ error: "rate limited" }) };
```

## Database Transactions

Current implementation uses sequential Supabase calls (not transactional). For atomicity, refactor to use Postgres transactions:

```typescript
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  // perform operations
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}
```

## Checklist

- [ ] Enable CORS only for your frontend origin (set `APP_DOMAIN`).
- [ ] Set `JWT_SECRET` to a strong random value (use `openssl rand -base64 32`).
- [ ] Use `NODE_ENV=production` in production to enable secure cookie flag.
- [ ] Implement rate limiting for high-risk endpoints.
- [ ] Add database transaction support for multi-step operations.
- [ ] Enable Supabase Row Level Security (RLS) on all tables.
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` regularly.
- [ ] Monitor logs for failed SIWE verifications or repeated rate limit hits.
- [ ] Add IP-based DDoS protection at Netlify or CDN level.
