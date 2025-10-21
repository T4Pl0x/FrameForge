#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const root = process.cwd();

const agentsManifestSchema = {
  $id: '/schemas/agents.manifest.schema.json',
  type: 'object',
  required: ['version', 'agents'],
  properties: {
    version: { type: 'string', minLength: 1 },
    agents: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'entry'],
        properties: {
          id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          owner: { type: 'string' },
          permissions: { type: 'array', items: { type: 'string' } },
          entry: { type: 'string', minLength: 1 },
          notes: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
};

ajv.addSchema(agentsManifestSchema);

async function validateAgentsManifest() {
  const file = path.join(root, 'agents', 'manifest.json');
  try {
    const raw = await fs.readFile(file, 'utf8');
    const json = JSON.parse(raw);
    const ok = ajv.validate(agentsManifestSchema.$id, json);
    if (!ok) {
      console.error(`✖ agents/manifest.json invalid:`);
      for (const err of ajv.errors || []) {
        console.error(`  - ${err.instancePath} ${err.message}`);
      }
      return false;
    }
    console.log('✓ agents/manifest.json validated');
    // validate entries exist
    for (const a of json.agents) {
      const entryPath = path.join(root, a.entry);
      try {
        await fs.access(entryPath);
      } catch {
        console.error(`✖ Missing agent entry file: ${a.entry}`);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error(`✖ Failed to read agents/manifest.json: ${e.message}`);
    return false;
  }
}

async function main() {
  let ok = true;
  ok = (await validateAgentsManifest()) && ok;
  if (!ok) process.exit(1);
  console.log('Manifests validation completed');
}

main().catch((e) => { console.error(e); process.exit(1); });

