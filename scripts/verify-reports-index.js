#!/usr/bin/env node
/**
 * Verify one or more CDN reports index.json endpoints and (optionally)
 * check individual report asset URLs return 200 (HEAD preferred, fallback GET).
 *
 * Examples:
 *  node scripts/verify-reports-index.js \
 *    --urls https://cdn-a.example.com/builds/$BUILD/reports/index.json,https://cdn-b.example.com/builds/$BUILD/reports/index.json \
 *    --retries 10 --delayMs 3000 --timeoutMs 5000 \
 *    --requireKeys reportsUrl,testsReport,a11yReport,lintBuild \
 *    --checkAssets
 */

const { argv, exit } = process;

function arg(name, def) {
  const i = argv.indexOf(`--${name}`);
  return i > -1 ? argv[i + 1] : def;
}
function list(name) {
  const v = arg(name, "");
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}
const urls = list("urls");
const singleUrl = arg("url", "");
if (!urls.length && singleUrl) urls.push(singleUrl);

const retries = parseInt(arg("retries", "8"), 10);
const delayMs = parseInt(arg("delayMs", "2500"), 10);
const timeoutMs = parseInt(arg("timeoutMs", "4000"), 10);
const requireKeys = list("requireKeys").length ? list("requireKeys") : ["reportsUrl"];
const checkAssets = argv.includes("--checkAssets");

if (!urls.length) {
  console.error("[verify-reports-index] --urls or --url is required");
  exit(2);
}

async function fetchWithTimeout(resource, options = {}) {
  const to = options.timeout ?? timeoutMs;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), to);
  try {
    return await fetch(resource, { ...options, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(t);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function verifyOne(url) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json().catch(() => {
        throw new Error('Invalid JSON body');
      });

      for (const k of requireKeys) {
        if (!(k in body) || !String(body[k]).trim()) throw new Error(`Missing required key: ${k}`);
      }
      if (body.reportsUrl && !/^https?:\/\//i.test(String(body.reportsUrl))) {
        throw new Error(`reportsUrl is not absolute: ${body.reportsUrl}`);
      }

      if (checkAssets) {
        const assetKeys = ['testsReport', 'a11yReport', 'lintBuild'].filter((k) => body[k]);
        for (const k of assetKeys) {
          const u = String(body[k]);
          let ok = false;
          try {
            const head = await fetchWithTimeout(u, { method: 'HEAD' });
            ok = head.ok;
          } catch {}
          if (!ok) {
            const get = await fetchWithTimeout(u, { method: 'GET' });
            ok = get.ok;
          }
          if (!ok) throw new Error(`Asset ${k} not reachable: ${u}`);
        }
      }

      console.log(`[verify-reports-index] OK: ${url}`);
      return { ok: true, data: body };
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(delayMs * attempt, 10000);
      console.warn(`[verify-reports-index] ${url} attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) await sleep(backoff);
    }
  }
  return { ok: false, error: lastErr };
}

(async function main() {
  let allOk = true;
  for (const u of urls) {
    const r = await verifyOne(u);
    if (!r.ok) {
      allOk = false;
      console.error(`[verify-reports-index] FAILED for ${u}: ${r.error?.message || r.error}`);
    }
  }
  exit(allOk ? 0 : 1);
})().catch((e) => {
  console.error(e);
  exit(1);
});

