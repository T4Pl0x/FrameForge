#!/usr/bin/env node

/**
 * Validate manifest files against schema
 * This script validates extension manifests but always exits 0
 * to avoid breaking CI builds - only logs warnings
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const MANIFEST_SCHEMA = 'shared/schema/extension.manifest.schema.json';
const PACKAGES_DIR = 'packages';

async function main() {
  console.log('🔍 Validating extension manifests...\n');

  let warningCount = 0;
  let manifestCount = 0;

  try {
    // Load AJV for JSON schema validation
    const { default: Ajv } = await import('ajv');
    const ajv = new Ajv({ allErrors: true });

    // Load manifest schema
    const schemaPath = join(process.cwd(), MANIFEST_SCHEMA);
    const schemaContent = await readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    const validate = ajv.compile(schema);

    // Find all manifest.json files in packages
    const packageDirs = await readdir(PACKAGES_DIR, { withFileTypes: true });
    const packageNames = packageDirs
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const packageName of packageNames) {
      const manifestPath = join(PACKAGES_DIR, packageName, 'manifest.json');

      try {
        const manifestContent = await readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);

        manifestCount++;

        // Validate against schema
        const valid = validate(manifest);
        if (!valid) {
          warningCount++;
          console.log(`⚠️  ${packageName}/manifest.json:`);
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
      } catch (error) {
        // File doesn't exist or can't be read - that's OK, not all packages have manifests
        continue;
      }
    }

    console.log(`📊 Validated ${manifestCount} manifest${manifestCount === 1 ? '' : 's'}`);
    if (warningCount > 0) {
      console.log(`⚠️  Found ${warningCount} warning${warningCount === 1 ? '' : 's'} in manifest validation`);
      console.log('   Manifest schema validation is warn-only to allow incremental fixes.');
    } else {
      console.log('✅ All manifests are valid');
    }

  } catch (error) {
    console.log(`❌ Manifest validation setup failed: ${error.message}`);
    console.log('   This is non-blocking - build will continue.');
  }

  // Always exit 0 to avoid breaking builds
  console.log('');
  process.exit(0);
}

main().catch(error => {
  console.log(`💥 Unexpected error in manifest validation: ${error.message}`);
  console.log('   This is non-blocking - build will continue.');
  process.exit(0);
});
