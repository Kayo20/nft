import { test, expect } from 'vitest';
import { getCodeRecord, claimCode, listAllCodes } from '../netlify/functions/_utils/gift_codes';

test('gift codes can be listed and validated', async () => {
  const codes = await listAllCodes();
  expect(codes.length).toBe(100);
  expect(codes[0].code).toMatch(/OG-TREE-\d{5}-[A-Z0-9]{4}/);
});

test('gift code claim flow works', async () => {
  const codes = await listAllCodes();
  const code = codes.find((c: any) => !c.claimed)?.code;
  expect(code).toBeDefined();

  // Verify code exists and is unclaimed
  const record = await getCodeRecord(code!);
  expect(record).toBeDefined();
  expect(record?.claimed).toBe(false);

  // Claim the code
  const result = await claimCode(code!, '0xTESTADDRESS123');
  expect(result.success).toBe(true);
  expect(result.message).toMatch(/Code claimed/);

  // Verify it's now claimed
  const claimed = await getCodeRecord(code!);
  expect(claimed?.claimed).toBe(true);
  expect(claimed?.claimedBy).toBe('0xTESTADDRESS123');
});

test('claiming a code twice fails', async () => {
  const codes = await listAllCodes();
  const code = codes.find((c: any) => c.claimed)?.code || codes[codes.length - 1].code;

  // Try to claim an already claimed code
  const result = await claimCode(code, '0xANOTHER');
  expect(result.success).toBe(false);
  expect(result.message).toMatch(/Already claimed/);
});
