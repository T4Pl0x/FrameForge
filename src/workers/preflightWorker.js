/* eslint-disable no-restricted-globals */

// Lightweight color utilities
function clamp01(x) { return Math.min(1, Math.max(0, x)); }
function srgbToLin(c) {
  const v = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return v;
}
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b, a: 1 };
}
function parseColor(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    const rgb = hexToRgb(input);
    if (rgb) return rgb;
    // rudimentary rgb() parser
    const m = input.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?\)/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 };
  }
  if (typeof input === 'object' && input.r != null) return input;
  return null;
}
function relativeLuminance(rgb) {
  const r = srgbToLin(clamp01(rgb.r / 255));
  const g = srgbToLin(clamp01(rgb.g / 255));
  const b = srgbToLin(clamp01(rgb.b / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(c1, c2) {
  const L1 = relativeLuminance(c1);
  const L2 = relativeLuminance(c2);
  const [light, dark] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

const INTERACTIVE_TYPES = new Set(['Button', 'Input', 'Select', 'Switch', 'Checkbox', 'Radio', 'Tabs', 'Breadcrumb', 'Pagination', 'Link']);

function isLargeText(node) {
  const sizePx = Number(node?.props?.fontSize) || (node?.type === 'Title' ? 24 : 14);
  const weight = String(node?.props?.fontWeight || (node?.type === 'Title' ? 700 : 400));
  const isBold = /[6-9]00/.test(weight) || /bold/i.test(weight);
  // 18pt ≈ 24px regular OR 14pt ≈ 18.66px bold -> use 24px and 18px as crude thresholds
  return sizePx >= 24 || (isBold && sizePx >= 18);
}

function computeTapSize(node) {
  const w = Number(node?.props?.width) || 0;
  const h = Number(node?.props?.height) || 0;
  const padding = Number(node?.props?.padding) || 0;
  const hit = node?.props?.hitSlop || 0;
  const hitPad = typeof hit === 'number' ? hit : 0;
  return { width: w + padding * 2 + hitPad * 2, height: h + padding * 2 + hitPad * 2 };
}

function hasAccessibleName(node) {
  const visible = (node?.content && String(node.content).trim().length > 0);
  const aria = (node?.props?.ariaLabel || node?.props?.ariaLabelledBy);
  return Boolean(visible || aria);
}

function isFocusable(node) {
  if (node?.props?.ariaHidden === true) return false;
  if (INTERACTIVE_TYPES.has(node?.type)) return true;
  if (node?.props?.tabIndex != null) return Number(node.props.tabIndex) >= 0;
  return false;
}

function tokenLike(value) {
  return typeof value === 'string' && /\{[\w.-]+\}/.test(value);
}

function resolveColorToken(value, theme) {
  if (!tokenLike(value)) return value;
  const m = value.match(/\{([\w.-]+)\}/);
  if (!m) return value;
  const path = m[1].split('.');
  let cur = theme;
  for (const key of path) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, key)) cur = cur[key];
    else return null;
  }
  return cur;
}

function evaluate(doc, theme, profiles) {
  const issues = [];
  const frames = Array.isArray(doc?.frames) ? doc.frames : [];
  const screens = Array.isArray(doc?.screens) ? doc.screens : [];
  const screenIds = new Set(screens.map(s => s.id));
  const framesById = new Map(frames.map(f => [f.id, f]));

  // Unreachable screens (screen graph via navigateTo)
  const defaultScreen = screens.find(s => s.isDefault) || screens[0];
  if (defaultScreen) {
    const adj = new Map(screens.map(s => [s.id, new Set()]));
    frames.forEach((f) => {
      (f.nodes || []).forEach((n) => {
        const nav = n?.props?.navigateTo;
        if (nav?.type === 'screen' && nav?.targetId) adj.get(f.screenId)?.add(nav.targetId);
      });
    });
    const seen = new Set();
    const stack = [defaultScreen.id];
    while (stack.length) {
      const s = stack.pop();
      if (seen.has(s)) continue;
      seen.add(s);
      (adj.get(s) || []).forEach(t => { if (!seen.has(t)) stack.push(t); });
    }
    screens.forEach(s => {
      if (s.id !== defaultScreen.id && !seen.has(s.id)) {
        issues.push({ code: 'reachability.unreachableScreen', severity: 'major', screenId: s.id, message: `Screen is unreachable: ${s.name}` });
      }
    });
  }

  // Iterate frames/nodes for checks
  frames.forEach((f) => {
    const bg = parseColor(resolveColorToken(f.background || theme?.surface, theme) || theme?.surface || '#ffffff') || { r: 255, g: 255, b: 255, a: 1 };

    (f.nodes || []).forEach((n) => {
      // Binding integrity
      const nav = n?.props?.navigateTo;
      const pop = n?.props?.openPopup;
      if (nav?.type === 'screen' && (!nav.targetId || !screenIds.has(nav.targetId))) {
        issues.push({ code: 'link.missingScreen', severity: 'block', frameId: f.id, nodeId: n.id, message: 'Navigation points to missing screen' });
      }
      if (nav?.type === 'modal') {
        const target = nav?.targetId ? framesById.get(nav.targetId) : null;
        if (!target || target.kind !== 'modal') issues.push({ code: 'link.missingModal', severity: 'block', frameId: f.id, nodeId: n.id, message: 'Navigation points to missing modal' });
      }
      if (pop && (!pop.targetId || !framesById.get(pop.targetId))) {
        issues.push({ code: 'link.missingPopup', severity: 'block', frameId: f.id, nodeId: n.id, message: 'openPopup target does not exist' });
      }

      // Orphan interactive
      if (INTERACTIVE_TYPES.has(n.type)) {
        if (!nav && !pop && !n?.props?.onClick && !n?.props?.action) {
          issues.push({ code: 'interactive.orphan', severity: 'major', frameId: f.id, nodeId: n.id, message: `${n.type} has no action (link or popup)` });
        }
      }

      // Keyboard focus & accessible name
      if (INTERACTIVE_TYPES.has(n.type)) {
        if (!isFocusable(n)) issues.push({ code: 'a11y.notFocusable', severity: 'block', frameId: f.id, nodeId: n.id, message: 'Interactive element is not focusable', suggestedFix: { action: 'addTabIndex', value: 0 } });
        if (!hasAccessibleName(n)) issues.push({ code: 'a11y.missingName', severity: 'block', frameId: f.id, nodeId: n.id, message: 'Interactive element has no accessible name', suggestedFix: { action: 'setAriaLabel', value: n?.type || 'Control' } });
      }

      // Tap/Click target size across profiles (worst case wins)
      if (INTERACTIVE_TYPES.has(n.type)) {
        const { width, height } = computeTapSize(n);
        let worstSeverity = null;
        for (const profile of profiles || ['mobilePortrait', 'desktop']) {
          const min = profile === 'mobilePortrait' ? 40 : 24; // desktop lenient
          const ok = width >= min && height >= min;
          const sev = ok ? null : (profile === 'mobilePortrait' ? 'block' : 'minor');
          if (sev && (worstSeverity === null || (sev === 'block' && worstSeverity !== 'block'))) worstSeverity = sev;
        }
        // Dense-table exception
        let waiverHint = undefined;
        let inTable = false;
        let rowHeight = 0;
        if (worstSeverity === 'block') {
          inTable = n?.props?.container === 'Table' || n?.props?.inTable === true || n?.props?.listDensity === 'dense';
          rowHeight = Number(n?.props?.rowHeight) || 0;
          const denseEnough = rowHeight > 0 && rowHeight <= 40;
          const manyCells = Number(n?.props?.interactiveCellsPerViewport || 0) >= 6;
          if (inTable && (denseEnough || manyCells)) {
            worstSeverity = 'major';
            waiverHint = 'Dense table pattern detected. Consider bulk actions or increase row height.';
          }
        }
        if (worstSeverity) {
          issues.push({ code: 'tapTarget.tooSmall', severity: worstSeverity, frameId: f.id, nodeId: n.id, message: `Tap target too small (${Math.round(width)}x${Math.round(height)})`, required: '40x40', context: inTable ? { container: 'Table', rowHeight: Number(n?.props?.rowHeight) || undefined, density: n?.props?.listDensity || (rowHeight && rowHeight <= 40 ? 'dense' : undefined) } : undefined, waiverHint, suggestedFix: { action: 'addHitSlop', delta: { hitSlop: { top: 6, right: 6, bottom: 6, left: 6 } } } });
        }
      }

      // Contrast checks for text/icon vs background across states
      const states = ['default', 'hover', 'focus', 'pressed', 'disabled'];
      let worstText = null;
      for (const st of states) {
        if (st === 'disabled') continue; // exempt
        const stateColor = n?.props?.[`color${st[0].toUpperCase() + st.slice(1)}`] || n?.props?.color || theme?.text;
        const fgResolved = resolveColorToken(stateColor, theme) || theme?.text || '#111111';
        const fg = parseColor(fgResolved) || { r: 17, g: 17, b: 17, a: 1 };
        const ratio = contrastRatio(fg, bg);
        const large = isLargeText(n);
        const required = large ? 3.0 : 4.5;
        if ((n.type === 'Title' || n.type === 'Paragraph' || n.type === 'Button') && ratio < required) {
          const entry = { code: 'contrast.text', severity: 'block', frameId: f.id, nodeId: n.id, message: `Text contrast ${ratio.toFixed(2)}:1 below ${required}:1`, state: st, ratio: Number(ratio.toFixed(2)), required, colors: { fg: fgResolved, bg: f.background || theme?.surface || '#ffffff' }, suggestedFix: { strategy: 'raiseForegroundToken', fallback: 'raiseSurface', candidates: [{ token: 'colors.textHigh', expectedRatio: Number(Math.max(3.0, ratio + 1).toFixed(1)) }] } };
          if (!worstText || entry.ratio < worstText.ratio) worstText = entry;
        }
      }
      if (worstText) issues.push(worstText);

      // Icon-only controls contrast
      const role = n?.props?.role || (n.type === 'Button' ? 'button' : undefined);
      const hasVisibleText = Boolean(n?.content && String(n.content).trim().length > 0);
      const iconOnly = (role === 'button' || role === 'link' || role === 'menuitem') && !hasVisibleText || n?.props?.iconOnly === true;
      if (iconOnly) {
        let worstIcon = null;
        for (const st of states) {
          if (st === 'disabled') continue;
          const iconColor = n?.props?.[`iconColor${st[0].toUpperCase() + st.slice(1)}`] || n?.props?.iconColor || n?.props?.color || theme?.text;
          const fgResolved = resolveColorToken(iconColor, theme) || theme?.text || '#111111';
          const fg = parseColor(fgResolved) || { r: 17, g: 17, b: 17, a: 1 };
          const ratio = contrastRatio(fg, bg);
          const required = 3.0;
          if (ratio < required) {
            const entry = { code: 'contrast.iconOnly', severity: 'block', frameId: f.id, nodeId: n.id, message: `Icon contrast ${ratio.toFixed(2)}:1 below ${required}:1`, state: st, ratio: Number(ratio.toFixed(2)), required, colors: { fg: fgResolved, bg: f.background || theme?.surface || '#ffffff' }, suggestedFix: { strategy: 'raiseForegroundToken', fallback: 'raiseSurface', candidates: [{ token: 'colors.textHigh', expectedRatio: Number((ratio + 2).toFixed(1)) }, { token: 'colors.accent', expectedRatio: Number((ratio + 1.2).toFixed(1)) }] } };
            if (!worstIcon || entry.ratio < worstIcon.ratio) worstIcon = entry;
          }
        }
        if (worstIcon) issues.push(worstIcon);
      }

      // Focus ring contrast with band luminance approximation + thickness rule
      let worstRing = null;
      for (const st of states) {
        if (st !== 'focus') continue;
        const ringColor = n?.props?.ringColor || n?.props?.focusRingColor || theme?.focusRing || '#4C7DFF';
        const ringResolved = resolveColorToken(ringColor, theme) || ringColor;
        const ring = parseColor(ringResolved) || { r: 76, g: 125, b: 255, a: 1 };
        const ringThicknessPx = Number(n?.props?.ringThicknessPx || n?.props?.focusRingThicknessPx || 1);
        const ringOffsetPx = Number(n?.props?.ringOffsetPx || n?.props?.focusRingOffsetPx || 0);
        const bandWidthPx = Math.max(4, Math.ceil(ringThicknessPx));
        // Approximate surrounding luminance using background; support override via props.surroundingLuminance
        const surroundingL = (typeof n?.props?.surroundingLuminance === 'number') ? n.props.surroundingLuminance : relativeLuminance(bg);
        const ratio = (Math.max(relativeLuminance(ring), surroundingL) + 0.05) / (Math.min(relativeLuminance(ring), surroundingL) + 0.05);
        const required = 3.0;
        const baseEntry = {
          code: 'contrast.focusRing',
          severity: ratio < required ? 'block' : null,
          frameId: f.id,
          nodeId: n.id,
          message: `Focus ring contrast ${ratio.toFixed(2)}:1 ${ratio < required ? 'below' : 'meets'} ${required}:1`,
          state: 'focus',
          ratio: Number(ratio.toFixed(2)),
          required,
          ring: { color: ringResolved, thicknessPx: ringThicknessPx, offsetPx: ringOffsetPx },
          surroundingBand: { widthPx: bandWidthPx, luminance: Number(surroundingL.toFixed(3)) },
          suggestedFix: { strategy: 'increaseRingContrast', options: [{ ringToken: 'colors.focusStrong', thicknessPx: Math.max(2, ringThicknessPx) }, { ringToken: 'colors.accentHighContrast', thicknessPx: Math.max(2, ringThicknessPx), offsetPx: Math.max(1, ringOffsetPx) }] },
        };
        // Thickness rule
        const density = n?.props?.density || f?.props?.density || doc?.ui?.density;
        if (ringThicknessPx < 2) {
          const thinEntry = { ...baseEntry, code: 'contrast.focusRing', message: 'Focus ring thickness below 2px', ratio: baseEntry.ratio, required: baseEntry.required };
          if (density === 'compact' && ringThicknessPx >= 1.5) {
            thinEntry.severity = 'major';
            thinEntry.waiverHint = 'Compact density: 1.5px ring allowed with waiver.';
          } else {
            thinEntry.severity = 'block';
          }
          thinEntry.suggestedFix = { strategy: 'increaseThickness', options: [{ thicknessPx: 2 }, { thicknessPx: 3, offsetPx: Math.max(1, ringOffsetPx) }] };
          if (!worstRing || (thinEntry.severity === 'block' && worstRing.severity !== 'block') || thinEntry.ratio < (worstRing.ratio || Infinity)) worstRing = thinEntry;
        }
        if (baseEntry.severity === 'block') {
          if (!worstRing || baseEntry.ratio < (worstRing.ratio || Infinity)) worstRing = baseEntry;
        }
      }
      if (worstRing) issues.push(worstRing);

      // Theme token resolution
      const tokens = [];
      const scan = (obj, path = []) => {
        if (!obj) return;
        if (typeof obj === 'string' && tokenLike(obj)) tokens.push({ path: path.join('.') });
        else if (typeof obj === 'object') {
          for (const k of Object.keys(obj)) scan(obj[k], path.concat(k));
        }
      };
      scan(n?.props, ['props']);
      if (tokenLike(f.background)) tokens.push({ path: 'frame.background' });
      tokens.forEach(t => {
        issues.push({ code: 'theme.unresolvedToken', severity: 'major', frameId: f.id, nodeId: n.id, message: `Unresolved token at ${t.path}`, failingPath: t.path, suggestedFix: { action: 'resolveToken', strategy: 'useBaseTheme' } });
      });
    });

    // Modal a11y
    if (f.kind === 'modal') {
      const role = f?.props?.role || f?.role;
      const ariaModal = f?.props?.ariaModal ?? f?.ariaModal;
      const label = f?.props?.ariaLabel || f?.props?.ariaLabelledBy || f?.ariaLabel || f?.ariaLabelledBy;
      if (role !== 'dialog') issues.push({ code: 'modal.role', severity: 'block', frameId: f.id, message: 'Modal should have role="dialog"', suggestedFix: { action: 'setRoleDialog' } });
      if (ariaModal !== true) issues.push({ code: 'modal.ariaModal', severity: 'block', frameId: f.id, message: 'Modal should set aria-modal="true"', suggestedFix: { action: 'setAriaModalTrue' } });
      if (!label) issues.push({ code: 'modal.label', severity: 'block', frameId: f.id, message: 'Modal requires an accessible label', suggestedFix: { action: 'setAriaLabel', value: 'Dialog' } });
      // Focus trap cannot be validated without runtime; assume missing
      if (!f?.props?.trapFocus) issues.push({ code: 'modal.focusTrap', severity: 'block', frameId: f.id, message: 'Modal should trap focus and restore on close', suggestedFix: { action: 'enableFocusTrap' } });
    }
  });

  return { issues };
}

self.onmessage = (ev) => {
  const { type, doc, theme, profiles } = ev.data || {};
  if (type !== 'run') return;
  try {
    const t = theme || { text: '#111111', textHigh: '#0B0B0B', surface: '#ffffff' };
    const p = Array.isArray(profiles) ? profiles : ['mobilePortrait', 'desktop'];
    const result = evaluate(doc || {}, t, p);
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, error: String(error && error.message ? error.message : error) });
  }
};
