type ComponentProps = {
  type: string;
  props: Record<string, any>;
  themeTokens?: Record<string, string>;
};

const toHex = (s: any): string | undefined => {
  if (typeof s !== 'string') return undefined;
  const m = s.trim().toLowerCase();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(m) ? m : undefined;
};

export function resolveFgColor(input: ComponentProps): string | undefined {
  const { props, themeTokens } = input;
  const direct = toHex(props.color) || toHex(props.fg) || toHex(props.textColor);
  if (direct) return direct;
  const tokenKey = props.colorToken || props.fgToken || props.textToken;
  if (tokenKey && themeTokens && themeTokens[tokenKey]) return toHex(themeTokens[tokenKey]);
  if (props.variant === 'primary' && themeTokens && themeTokens['color.text.onPrimary']) {
    return toHex(themeTokens['color.text.onPrimary']);
  }
  if (props.useCurrentColor && themeTokens && themeTokens['color.current']) {
    return toHex(themeTokens['color.current']);
  }
  return undefined;
}

export function isLargeTextFromProps(input: ComponentProps): boolean {
  const px = (() => {
    const v = input.props.fontSizePx ?? input.props.fontSize;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const m = v.match(/([0-9]+(\.[0-9]+)?)px/);
      return m ? parseFloat(m[1]) : Number(v);
    }
    return 0;
  })();
  const weight = Number(input.props.fontWeight ?? 400);
  return px >= 24 || (px >= 18.66 && weight >= 700);
}

export function isIconOnlyFromProps(input: ComponentProps): boolean {
  const p = input.props || {};
  if (p.iconOnly === true) return true;
  const isIconType = /icon/i.test(input.type);
  const hasText = Boolean(p.label || p.text || p.childrenText);
  const labeled = Boolean(p['aria-label'] || p['aria-labelledby']);
  return isIconType && !hasText && !labeled;
}

