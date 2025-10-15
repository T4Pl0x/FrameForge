#!/usr/bin/env node
/**
 * Verify that a public CDN reports index.json is reachable and sane.
 *
 * Usage:
 *  node scripts/verify-reports-index.js \
 *    --url https://cdn.example.com/builds/$BUILD_ID/reports/index.json \
 *    --retries 10 --delayMs 3000 --timeoutMs 5000 \
 *    --requireKeys reportsUrl testsReport a11yReport lintBuild
 *
 * Exits non-zero on error.
 */
const { argv, exit } = process;

function arg(name, def) {
  const i = argv.indexOf(`--${name}`);
  return i > -1 ? argv[i + 1] : def;
}
function listArg(name) {
  const v = arg(name, "");
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

const url = arg("url");
const retries = parseInt(arg("retries", "8"), 10);
const delayMs = parseInt(arg("delayMs", "2500"), 10);
const timeoutMs = parseInt(arg("timeoutMs", "4000"), 10);
const requireKeys = listArg("requireKeys").length
  ? listArg("requireKeys")
  : (argv.includes("--requireKeys") ? [] : ["reportsUrl"]); // default sanity

if (!url) {
  console.error("[verify-reports-index] --url is required");
  exit(2);
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = timeoutMs, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, { ...rest, signal: controller.signal, cache: "no-store" });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async function main() {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get("content-type") || "";
      if (!type.includes("application/json")) {
        // not fatal—some CDNs don’t set proper type
        console.warn(`[verify-reports-index] warning: unexpected content-type: ${type}`);
      }
      const data = await res.json().catch(() => { throw new Error("Invalid JSON body"); });

      // Basic shape checks
      for (const k of requireKeys) {
        if (!(k in data) || !String(data[k]).trim()) {
          throw new Error(`Missing required key: ${k}`);
        }
      }
      // Optional: quick URL sanity for reportsUrl
      if (data.reportsUrl && !/^https?:\/\//i.test(String(data.reportsUrl))) {
        throw new Error(`reportsUrl is not absolute: ${data.reportsUrl}`);
      }

      console.log(`[verify-reports-index] OK on attempt ${attempt}: ${url}`);
      console.log(`[verify-reports-index] keys: ${Object.keys(data).join(", ")}`);
      return;
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(delayMs * attempt, 10000);
      console.warn(`[verify-reports-index] attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        await sleep(backoff);
        continue;
      }
    }
  }
  console.error(`[verify-reports-index] FAILED after ${retries} attempts: ${lastErr?.message || lastErr}`);
  exit(1);
})().catch((e) => { console.error(e); exit(1); });

