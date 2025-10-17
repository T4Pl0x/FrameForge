#!/usr/bin/env node

/**
 * Validate proposal files against schema
 * This script validates proposal artifacts but always exits 0
 * to avoid breaking CI builds - only logs warnings
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const PROPOSAL_SCHEMA = 'shared/schema/proposal.schema.json';
const PROPOSALS_DIR = 'frameforge/reports/proposals';

async function main() {
  console.log('🔍 Validating proposal artifacts...\n');

  let warningCount = 0;
  let proposalCount = 0;

  try {
    // Load AJV for JSON schema validation
    const { default: Ajv } = await import('ajv');
    const ajv = new Ajv({
      allErrors: true,
      formats: { 'date-time': true }
    });

    // Load proposal schema
    const schemaPath = join(process.cwd(), PROPOSAL_SCHEMA);
    const schemaContent = await readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    const validate = ajv.compile(schema);

    // Check if proposals directory exists
    let proposalFiles = [];
    try {
      const files = await readdir(PROPOSALS_DIR, { withFileTypes: true });
      proposalFiles = files
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
        .map(dirent => dirent.name);
    } catch (error) {
      // Directory doesn't exist yet - that's OK
      console.log(`ℹ️  No proposals directory found at ${PROPOSALS_DIR}`);
      console.log('');
      return;
    }

    for (const filename of proposalFiles) {
      const proposalPath = join(PROPOSALS_DIR, filename);

      try {
        const proposalContent = await readFile(proposalPath, 'utf8');
        const proposal = JSON.parse(proposalContent);

        proposalCount++;

        // Validate against schema
        const valid = validate(proposal);
        if (!valid) {
          warningCount++;
          console.log(`⚠️  ${filename}:`);
          if (validate.errors && validate.errors.length > 0) {
            for (const error of validate.errors.slice(0, 3)) { // Show first 3 errors
              console.log(`   • ${error.instancePath || '/'} ${error.message}`);
            }
            if (validate.errors.length > 3) {
              console.log(`   • ... and ${validate.errors.length - 3} more errors`);
            }
          }
          console.log('');
        }

        // Additional validations that the schema can't easily express
        const patches = proposal.patches || [];

        // Check for whitelist violations (though schema handles this too)
        for (const patch of patches) {
          if (patch.path && !patch.path.startsWith('/tools/registry.json')) {
            warningCount++;
            console.log(`⚠️  ${filename}:`);
            console.log(`   • Patch targets non-whitelisted path: ${patch.path}`);
            console.log(`   • Only /tools/registry.json paths are allowed`);
            console.log('');
            break; // Only show once per proposal
          }
        }

        // Check for duplicate patches (same op + path)
        const seen = new Set();
        for (const patch of patches) {
          const key = `${patch.op}:${patch.path}`;
          if (seen.has(key)) {
            warningCount++;
            console.log(`⚠️  ${filename}:`);
            console.log(`   • Duplicate patch: ${key}`);
            console.log('');
            break; // Only show once per proposal
          }
          seen.add(key);
        }

      } catch (error) {
        warningCount++;
        console.log(`⚠️  ${filename}:`);
        console.log(`   • Failed to parse or validate: ${error.message}`);
        console.log('');
      }
    }

    console.log(`📊 Validated ${proposalCount} proposal${proposalCount === 1 ? '' : 's'}`);
    if (warningCount > 0) {
      console.log(`⚠️  Found ${warningCount} warning${warningCount === 1 ? '' : 's'} in proposal validation`);
      console.log('   Proposal schema validation is warn-only to allow incremental fixes.');
    } else {
      console.log('✅ All proposals are valid');
    }

  } catch (error) {
    console.log(`❌ Proposal validation setup failed: ${error.message}`);
    console.log('   This is non-blocking - build will continue.');
  }

  // Always exit 0 to avoid breaking builds
  console.log('');
  process.exit(0);
}

main().catch(error => {
  console.log(`💥 Unexpected error in proposal validation: ${error.message}`);
  console.log('   This is non-blocking - build will continue.');
  process.exit(0);
});
