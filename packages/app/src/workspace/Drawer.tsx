export function Drawer({ children, title = "Drawer" }:{ children?: React.ReactNode; title?: string; }) {
  return (
    <aside className="drawer">
      <div className="drawer-title">{title}</div>
      <div className="drawer-body">{children ?? "Empty"}</div>
    </aside>
  );
}
