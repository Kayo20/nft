#!/usr/bin/env node
/*
End-to-end auth test:
  - Requests a nonce for a test wallet
  - Builds a SIWE-style message and signs it
  - Calls verify endpoint and checks response
  - Verifies a user row exists in Supabase

Usage:
  TEST_PRIVATE_KEY=0xabc... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/e2e-auth-test.js https://localhost:8888

Defaults:
  - site: http://localhost:8888
  - origin: http://localhost:5173 (used in Origin header and message domain)

NOTE: This test will create a user row in your Supabase `users` table (wallet_address, profile).
*/

import 'dotenv/config';
import { Wallet } from 'ethers';
import { createClient } from '@supabase/supabase-js';

const site = process.argv[2] || 'http://localhost:8888';
const origin = process.env.TEST_ORIGIN || 'http://localhost:5173';
const privateKey = process.env.TEST_PRIVATE_KEY || null;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

(async () => {
  const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
  console.log('Using test wallet:', wallet.address);

  // Step 1: request nonce
  const nonceRes = await fetch(`${site.replace(/\/$/, '')}/.netlify/functions/auth-nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': origin },
    body: JSON.stringify({ address: wallet.address }),
  });

  if (!nonceRes.ok) {
    console.error('auth-nonce failed', nonceRes.status, await nonceRes.text());
    process.exit(1);
  }

  const nonceJson = await nonceRes.json();
  const nonce = nonceJson.nonce;
  const setCookie = nonceRes.headers.get('set-cookie') || '';
  console.log('Received nonce and cookie (cookie omitted in logs)');

  // Step 2: build SIWE-like message
  const buildSiweMessage = ({ domain, address, statement, uri, version, chainId, nonce }) => {
    const issuedAt = new Date().toISOString();
    return `${domain} wants you to sign in with Ethereum to the app:\n\n${address}\n\n${statement}\n\nURI: ${uri}\nVersion: ${version}\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
  };

  const message = buildSiweMessage({ domain: new URL(origin).host, address: wallet.address, statement: 'Test sign-in', uri: origin, version: '1', chainId: 56, nonce });
  const signature = await wallet.signMessage(message);

  // Step 3: call verify (include cookie so the function can read treefi_nonce)
  const cookieHeader = setCookie.split(';')[0] || `treefi_nonce=${nonce}`;
  const verifyRes = await fetch(`${site.replace(/\/$/, '')}/.netlify/functions/auth-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader, 'Origin': origin },
    body: JSON.stringify({ message, signature }),
  });

  const verifyText = await verifyRes.text();
  if (!verifyRes.ok) {
    console.error('auth-verify failed', verifyRes.status, verifyText);
    process.exit(1);
  }
  console.log('auth-verify response:', verifyText);

  // Step 4: check Supabase users table
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('users').select('*').eq('wallet_address', wallet.address.toLowerCase()).limit(1).single();
  if (error) {
    console.error('Failed to query users:', error);
    process.exit(1);
  }
  if (!data) {
    console.error('User row not found for address:', wallet.address);
    process.exit(1);
  }

  console.log('User row found:', JSON.stringify(data, null, 2));
  console.log('E2E auth test: SUCCESS');
  process.exit(0);
})();
