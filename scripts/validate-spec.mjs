import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv from 'ajv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const files = [
  ['ui', 'spec/ui.json', 'schemas/ui.schema.json'],
  ['logic', 'spec/logic.json', 'schemas/logic.schema.json'],
  ['data', 'spec/data.json', 'schemas/data.schema.json'],
  ['theme', 'spec/theme.json', 'schemas/theme.schema.json'],
  ['overlays', 'spec/overlays.json', 'schemas/overlays.schema.json'],
  ['tests', 'spec/tests.json', 'schemas/tests.schema.json'],
  ['meta', 'spec/meta.json', 'schemas/meta.schema.json'],
  ['analysis', 'spec/analysis.json', 'schemas/analysis.schema.json'],
];

async function main() {
  const ajv = new Ajv({ strict: false, allErrors: true, meta: false });
  let ok = true;
  for (const [name, specPath, schemaPath] of files) {
    const schema = JSON.parse(await readFile(path.join(root, schemaPath), 'utf8'));
    delete schema.$schema;
    ajv.addSchema(schema, schema.$id || name);
  }
  for (const [name, specPath, schemaPath] of files) {
    const schema = JSON.parse(await readFile(path.join(root, schemaPath), 'utf8'));
    delete schema.$schema;
    const data = JSON.parse(await readFile(path.join(root, specPath), 'utf8'));
    const validate = ajv.getSchema(schema.$id) || ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
      ok = false;
      console.error(`Spec ${name} invalid:`);
      for (const err of validate.errors || []) {
        console.error(` - ${err.instancePath} ${err.message}`);
      }
    } else {
      console.log(`Spec ${name} OK`);
    }
  }
  if (!ok) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
