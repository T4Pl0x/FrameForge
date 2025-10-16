#!/usr/bin/env node
const modeIdx = process.argv.indexOf('--mode');
const mode = modeIdx !== -1 ? process.argv[modeIdx+1] : 'one';
console.log(`emit-build-summary: mode=${mode} (stub)`);

