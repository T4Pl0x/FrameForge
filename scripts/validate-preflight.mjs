#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const schemaPath = path.resolve('frameforge/schemas/preflight.json');
const candidates = [
  path.resolve('reports/preflight.json'),
  path.resolve('spec/reports/preflight.json'),
];

const reportPath = candidates.find((p) => fs.existsSync(p));
if (!reportPath) {
  console.error('❌ preflight.json not found in /reports or /spec/reports');
  process.exit(2);
}

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const ok = validate(data);
if (!ok) {
  console.error('❌ Preflight schema validation failed:');
  for (const err of validate.errors) {
    console.error(` - ${err.instancePath} ${err.message}`);
  }
  process.exit(1);
}

const s = data.summary || { blocking: 0, major: 0, minor: 0, waived: 0 };
console.log(`✅ Preflight OK — blocking:${s.blocking} major:${s.major} minor:${s.minor} waived:${s.waived}`);
process.exit(0);

