#!/usr/bin/env node

/**
 * Generate Gift Codes Locally (no DB)
 * Usage:
 *   node scripts/generate-gift-codes.js [count] [outPath]
 * Example:
 *   node scripts/generate-gift-codes.js 150 scripts/generated-gift-codes.csv
 *
 * Writes a CSV and JSON file (default: scripts/generated-gift-codes.csv/.json)
 */

import fs from 'fs';
import path from 'path';

function randSuffix(len = 4) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < len; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}

function generateCode(index) {
  const suffix = randSuffix(4);
  return `OG-TREE-${String(index).padStart(5, '0')}-${suffix}`;
}

const countArg = parseInt(process.argv[2] || '150', 10);
const desired = Number.isFinite(countArg) && countArg > 0 ? countArg : 150;
const outPathArg = process.argv[3] || 'scripts/generated-gift-codes.csv';

const outCsv = path.resolve(process.cwd(), outPathArg);
const outJson = outCsv.replace(/\.csv$/i, '.json');

const codes = [];
for (let i = 1; i <= desired; i++) {
  codes.push(generateCode(i));
}

// Ensure folder exists
fs.mkdirSync(path.dirname(outCsv), { recursive: true });

// Write CSV (header + code)
const csvLines = ['code', ...codes];
fs.writeFileSync(outCsv, csvLines.join('\n'));

// Write JSON
fs.writeFileSync(outJson, JSON.stringify(codes, null, 2));

console.log(`✅ Generated ${codes.length} gift codes`);
console.log(`CSV: ${outCsv}`);
console.log(`JSON: ${outJson}`);
console.log('Tip: add these files to .gitignore if they contain secrets.');
