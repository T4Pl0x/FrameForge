#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const root = process.cwd();
const proposalsDir = path.join(root, 'frameforge', 'reports', 'proposals');

const rfc6902Op = {
  type: 'object',
  required: ['op', 'path'],
  properties: {
    op: { type: 'string' },
    path: { type: 'string' },
    from: { type: 'string' },
    value: {}
  },
  additionalProperties: true
};

const proposalSchema = {
  $id: '/schemas/proposal.schema.json',
  type: 'object',
  required: ['ticketId', 'createdAt', 'patches'],
  properties: {
    ticketId: { type: 'string', minLength: 1 },
    createdAt: { type: 'string', format: 'date-time' },
    patches: { type: 'array', items: rfc6902Op }
  },
  additionalProperties: true
};

ajv.addSchema(proposalSchema);

async function main() {
  let ok = true;
  try {
    const files = await fs.readdir(proposalsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (!jsonFiles.length) {
      console.log('ℹ No proposals found; skipping proposals validation');
      return;
    }
    for (const f of jsonFiles) {
      const full = path.join(proposalsDir, f);
      try {
        const raw = await fs.readFile(full, 'utf8');
        const doc = JSON.parse(raw);
        const valid = ajv.validate(proposalSchema.$id, doc);
        if (!valid) {
          ok = false;
          console.error(`✖ Proposal invalid: ${f}`);
          for (const err of ajv.errors || []) {
            console.error(`  - ${err.instancePath} ${err.message}`);
          }
        } else {
          console.log(`✓ ${f} validated`);
        }
      } catch (e) {
        ok = false;
        console.error(`✖ Failed ${f}: ${e.message}`);
      }
    }
  } catch {
    console.log('ℹ Proposals directory not found; skipping proposals validation');
  }
  if (!ok) process.exit(1);
  console.log('Proposals validation completed');
}

main().catch((e) => { console.error(e); process.exit(1); });

