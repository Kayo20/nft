Quick manual test cases (curl) — run after starting Netlify dev or deploying functions

1) Get nonce

curl -X POST http://localhost:8888/.netlify/functions/auth-nonce -H 'Content-Type: application/json' -d '{"address":"0xabc..."}' -c cookies.txt

2) Sign message and verify (use your wallet to sign the message returned by step 1). Then post signature:

curl -X POST http://localhost:8888/.netlify/functions/auth-verify -H 'Content-Type: application/json' -d '{"message":"<SIWE message>","signature":"<sig>"}' -b cookies.txt -c cookies.txt

3) Fetch user profile (cookie included)

curl -X GET http://localhost:8888/.netlify/functions/user-profile -b cookies.txt

4) Fetch inventory (protected)

curl -X GET http://localhost:8888/.netlify/functions/user-inventory -b cookies.txt

5) Purchase item (example)

curl -X POST http://localhost:8888/.netlify/functions/shop-purchase -H 'Content-Type: application/json' -d '{"itemId":"water","qty":1,"txHash":"0x..."}' -b cookies.txt

Notes:
- The cookie file is important to include the treefi_session cookie set by auth-verify.
- For local testing you may use the mock DB mode if SUPABASE_URL / KEYS are not set.
- If you want to test client-side hooks, open the app and call the hooks from components (they are implemented at `src/hooks`).
