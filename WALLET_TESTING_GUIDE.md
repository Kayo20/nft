# MetaMask Wallet Connection Testing Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- ✅ MetaMask extension installed (https://metamask.io/)
- ✅ `netlify dev` running in terminal (backend functions loaded)
- ✅ Browser open to `http://localhost:5173`

### Test Steps

1. **Verify MetaMask is Loaded**
   - Open DevTools (F12) → Console tab
   - Paste: `window.ethereum`
   - Should see object like: `MetaMaskInpageProvider {isConnected: false, ...}`
   - If undefined: Install or enable MetaMask

2. **Click "Connect Wallet" in Navbar**
   - Top right corner
   - Should show blue button with wallet icon

3. **MetaMask Popup #1: Account Access**
   - Select your account
   - Click "Next" 
   - Click "Connect"

4. **MetaMask Popup #2: Sign Message**
   - Shows SIWE message (includes address, nonce, domain)
   - Review message (verify domain is `localhost:5173`)
   - Click "Sign"

5. **Verify Connected**
   - Navbar shows: `0x1234...5678` (shortened address)
   - Below: `0 MATIC` (balance)
   - Button changed to "Disconnect"

✅ **Success!** Wallet connected via SIWE

---

## 🔧 Backend Services Verification

### Check Functions are Loaded
Run this in the terminal where `netlify dev` is running:
```
Loaded function auth-nonce
Loaded function auth-verify  
Loaded function auth-logout
... (and other functions)
```

If missing, functions didn't compile. Check for errors with:
```powershell
cd "c:\Users\ICTRC\Desktop\nft v2"
pnpm build
```

### Test Auth Endpoint Directly
Open browser console and test:
```javascript
// Request nonce
const res1 = await fetch('/api/auth/nonce', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: '0x1234567890123456789012345678901234567890' })
});
const data1 = await res1.json();
console.log('Nonce:', data1); // Should see { nonce: "a1b2c3..." }
```

Expected: `{ nonce: "abc123..." }`
If error: Check terminal output from `netlify dev`

---

## 🐛 Troubleshooting

### Problem: "MetaMask is not installed"
**Solutions:**
1. Install MetaMask: https://metamask.io/
2. If installed, enable it: Chrome Settings → Extensions → MetaMask → Enable
3. Refresh page (Ctrl+R)
4. Check DevTools: `window.ethereum` should exist

### Problem: MetaMask popup doesn't appear
**Solutions:**
1. Check if MetaMask extension is enabled (puzzle icon in Chrome)
2. Check browser console for errors (F12)
3. Try disconnecting and reconnecting
4. Close and reopen MetaMask

### Problem: "Nonce request failed"
**Solutions:**
1. Verify `netlify dev` is running
2. Check terminal shows `Loaded function auth-nonce`
3. Check environment variables: `JWT_SECRET` and `APP_DOMAIN` must be set
4. Open DevTools Network tab, click "Connect Wallet", watch `/api/auth/nonce` request
   - Should see: Status 200, Response `{ "nonce": "..." }`
   - If 500: Check `netlify dev` terminal for error details

### Problem: "SIWE verify failed"
**Solutions:**
1. Check `.env.local` has: `JWT_SECRET=<some-value>`
2. Verify domain in message matches your app
3. Check browser console error details
4. In `netlify dev` terminal, look for `auth-verify error` logs

### Problem: "Invalid nonce" or "Nonce expired"
**Reason:** Nonce is only valid for 10 minutes and single-use
**Solutions:**
1. Wait 10 minutes and try again
2. Restart backend: Stop `netlify dev`, run again
3. Clear browser cache: DevTools → Application → Storage → Clear All

---

## 🔍 What's Happening Behind the Scenes

### Network Requests (View in DevTools)
1. **POST /api/auth/nonce**
   - Request: `{"address":"0x123..."}`
   - Response: `{"nonce":"abc123..."}`
   
2. **POST /api/auth/verify**
   - Request: `{"message":"localhost:5173 wants you to sign...","signature":"0x..."}`
   - Response: `{"ok":true,"address":"0x123..."}`
   - Sets: `Set-Cookie: treefi_session=...`

### Session Management
- Session stored as **HttpOnly cookie** (can't be accessed by JavaScript)
- Expires in 7 days
- Automatically sent with future requests to backend
- Cookie name: `treefi_session`

### Local Storage
- Key: `walletConnected`
- Value: `"true"` (when connected)
- Used for auto-reconnect on page reload

---

## 📋 Development Mode (No Supabase Required)

The backend **automatically falls back to in-memory storage** if Supabase credentials aren't set:

**What Works:**
- ✅ Nonce generation and validation
- ✅ SIWE signature verification  
- ✅ JWT session creation
- ✅ Full wallet connection flow

**What's Limited:**
- ❌ Nonces lost when backend restarts
- ❌ User data not persisted
- ❌ No NFT or inventory storage

**To Enable Full Features:** Configure Supabase in `.env.local`

---

## 📝 Environment Checklist

For wallet connection to work, ensure these are set in `.env.local`:

```dotenv
# Required
APP_DOMAIN=http://localhost:5173
JWT_SECRET=your-secret-here

# Optional (for Supabase persistence)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
SUPABASE_ANON_KEY=your-key-here

# Optional (for Polygon operations)
POLYGON_RPC_URL=https://polygon-rpc.com
```

Generate JWT_SECRET in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ Success Indicators

When wallet connection works:
- [ ] MetaMask popup appears when clicking "Connect Wallet"
- [ ] Signature request shows correct domain and nonce
- [ ] After signing, address appears in navbar
- [ ] "Disconnect" button shows instead of "Connect Wallet"
- [ ] DevTools Network shows POST `/api/auth/nonce` and `/api/auth/verify` with status 200
- [ ] Session cookie set (DevTools → Application → Cookies)

---

## 🆘 Getting Help

**Check logs:**
1. Browser DevTools Console (F12) - Client-side errors
2. `netlify dev` terminal output - Server-side errors
3. DevTools Network tab (F12) - HTTP request/response details

**Common error patterns:**
- `TypeError: fetch failed` = Backend not running or endpoint not found
- `CORS error` = Netlify CORS middleware issue (shouldn't happen with current setup)
- `signature verification failed` = Invalid signature or corrupted message
- `nonce expired` = Nonce too old (regenerate with new request)
