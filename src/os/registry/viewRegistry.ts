const _views: Record<string, React.ReactNode> = {};

export function registerView(key: string, node: React.ReactNode) {
  _views[key] = node;
}

export function getViews() {
  return _views;
}