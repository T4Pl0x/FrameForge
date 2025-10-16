export function Surface({ children }: { children?: React.ReactNode }) {
  return <main className="surface">{children ?? <p className="muted">Surface</p>}</main>;
}
