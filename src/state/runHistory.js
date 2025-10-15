let api = null;
function ensureApi() { if (api) return api; try { api = (window && window.__ff_kernel_api) || null; } catch { api = null; } return api; }

const MAX = 50;
let buf = [];
const subs = new Set();
export function getRunHistory() { return buf.slice().reverse(); }
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
function notify() { subs.forEach((fn) => { try { fn(); } catch {} }); }

// Filter state (session)
let filter = (() => { try { return sessionStorage.getItem('ff.runhistory.filter') || 'all'; } catch { return 'all'; } })();
const filterSubs = new Set();
export function getFilter() { return filter; }
export function setFilter(val) { filter = val; try { sessionStorage.setItem('ff.runhistory.filter', val); } catch {} filterSubs.forEach((f)=>{ try { f(); } catch {} }); }
export function subscribeFilter(fn) { filterSubs.add(fn); return () => filterSubs.delete(fn); }

// Sampling guard
const SAMPLE = { thresholdPerSec: 40, sampleEvery: 5 };
try { window.__ff_historySample = SAMPLE; } catch {}
let tsWindow = [];
let sampleCounter = 0;
let samplingOn = false;
const samplingSubs = new Set();
export function getSamplingOn() { return samplingOn; }
export const isSamplingOn = getSamplingOn;
export function subscribeSampling(fn) { samplingSubs.add(fn); return () => samplingSubs.delete(fn); }
function setSampling(on) {
  if (on === samplingOn) return;
  samplingOn = on;
  samplingSubs.forEach((f)=>{ try { f(); } catch {} });
  // marker event
  const evt = { ts: new Date().toISOString(), type: 'history.sampling', status: on ? 'on' : 'off' };
  buf.push(evt);
  if (buf.length > MAX) buf.splice(0, buf.length - MAX);
}

let unlisten = null;
export function startRunHistoryTap() {
  const kapi = ensureApi();
  if (!kapi || unlisten) return;
  const off1 = kapi.events.subscribe('proposal.*', onEvent);
  const off2 = kapi.events.subscribe('apply.*', onEvent);
  const off3 = kapi.events.subscribe('gate.*', onEvent);
  unlisten = () => { off1?.(); off2?.(); off3?.(); };
}

function onEvent(e) {
  const now = Date.now();
  tsWindow.push(now);
  // prune >1s
  while (tsWindow.length && (now - tsWindow[0] > 1000)) tsWindow.shift();
  const rate = tsWindow.length;
  const mustKeep = e.type === 'apply.succeeded';
  const over = rate > (window.__ff_historySample?.thresholdPerSec || SAMPLE.thresholdPerSec);
  setSampling(over);
  let keep = true;
  if (over && !mustKeep) {
    sampleCounter = (sampleCounter + 1) % (window.__ff_historySample?.sampleEvery || SAMPLE.sampleEvery);
    keep = sampleCounter === 0;
  }
  if (!keep) return;
  const evt = { ts: new Date().toISOString(), type: e.type, trace_id: e.trace_id, proposal_id: e.proposal_id, status: e.status, target: e.target };
  buf.push(evt);
  if (buf.length > MAX) buf.splice(0, buf.length - MAX);
  notify();
}
