export function Surface({ children }: { children?: React.ReactNode }) {
  return <div className="p-4">{children ?? <p className="opacity-70">Surface</p>}</div>;
}

