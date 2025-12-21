#!/usr/bin/env node
/*
Debug redeem by calling the deployed redeem endpoint with a session cookie.
Usage:
  node scripts/debug-redeem.js https://<SITE> THE_CODE "treefi_session=..."

This script simply forwards the POST to the redeem endpoint and prints the response.
*/

import fetch from 'node-fetch';

const [,, site, code, cookie] = process.argv;
if (!site || !code) {
  console.error('Usage: node scripts/debug-redeem.js https://<SITE> THE_CODE "treefi_session=<cookie>"');
  process.exit(1);
}

const url = `${site.replace(/\/$/, '')}/.netlify/functions/redeem-gift-code`;
(async () => {
  console.log('Calling redeem endpoint:', url);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { 'Cookie': cookie } : {}),
    },
    body: JSON.stringify({ code }),
  });
  const text = await res.text();
  console.log('Status:', res.status);
  try {
    console.log('Response JSON:', JSON.stringify(JSON.parse(text), null, 2));
  } catch (_) {
    console.log('Response text:', text);
  }
})();
