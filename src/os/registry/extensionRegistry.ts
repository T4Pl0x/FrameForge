export type ExtensionEntry = {
  id: string;
  icon?: string;
  activate: (kernel: any) => {
    routes?: Record<string, React.ReactNode>;
    commands?: { title: string; run: () => void }[];
  };
};

const _exts: Record<string, ExtensionEntry> = {};

export function registerExtension(ext: ExtensionEntry) {
  _exts[ext.id] = ext;
}

export function listExtensions() {
  return Object.values(_exts);
}