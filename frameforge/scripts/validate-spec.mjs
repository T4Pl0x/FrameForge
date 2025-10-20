#!/usr/bin/env node
/**
 * Minimal spec validator using AJV.
 * Scans ./spec for .json files and validates them against ./schemas/<name>.schema.json if present.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_DIR = path.resolve(__dirname, '../../spec');
const SCHEMAS_DIR = path.resolve(__dirname, '../../schemas');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

async function loadSchemas() {
  try {
    const files = await fs.readdir(SCHEMAS_DIR);
    for (const f of files.filter(x => x.endsWith('.json'))) {
      const content = JSON.parse(await fs.readFile(path.join(SCHEMAS_DIR, f), 'utf8'));
      ajv.addSchema(content, `/${f}`);
    }
  } catch (err) {
    // no schemas dir -> nothing to load
  }
}

async function main() {
  await loadSchemas();
  let ok = true;
  try {
    const files = await fs.readdir(SPEC_DIR);
    const jsonFiles = files.filter(x => x.endsWith('.json'));
    for (const file of jsonFiles) {
      const p = path.join(SPEC_DIR, file);
      const raw = await fs.readFile(p, 'utf8');
      let doc;
      try {
        doc = JSON.parse(raw);
      } catch (e) {
        console.error(`✖ Invalid JSON: ${file}: ${e.message}`);
        ok = false;
        continue;
      }
      const targetSchema = `/${file.replace(/\.json$/, '.schema.json')}`;
      const validate = ajv.getSchema(targetSchema);
      if (validate) {
        const valid = validate(doc);
        if (!valid) {
          console.error(`✖ Schema validation failed for ${file}:`);
          for (const err of validate.errors || []) {
            console.error(`  - ${err.instancePath} ${err.message}`);
          }
          ok = false;
        } else {
          console.log(`✓ ${file} validated`);
        }
      } else {
        console.log(`ℹ No schema for ${file} (skipping schema validation)`);
      }
    }
  } catch (err) {
    console.error('Error scanning spec:', err);
    process.exit(2);
  }
  if (!ok) process.exit(1);
  console.log('Spec validation completed');
}

main();