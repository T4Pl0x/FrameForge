export function Drawer({ children, title = "Drawer" }:{
  children?: React.ReactNode; title?: string;
}) {
  return (
    <aside className="fixed right-0 top-0 h-full w-[360px] border-l bg-background p-3">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="text-sm">{children ?? "Empty"}</div>
    </aside>
  );
}

