import { FLAGS } from "../flags";
import { Tray } from "@frameforge/os";
import { AppLauncher } from "../os/AppLauncher";

type Props = { onOpenAgents?: () => void; agentStatus?: 'green'|'red'|'yellow'|'unknown' };

export function BottomBar({ onOpenAgents, agentStatus = 'unknown' }: Props) {
  const dotStyle = {
    display: 'inline-block', width: 8, height: 8, borderRadius: 9999, marginRight: 6
  } as React.CSSProperties;
  const color = agentStatus === 'green' ? '#10B981' : agentStatus === 'red' ? '#ef4444' : agentStatus === 'yellow' ? '#F59E0B' : '#9CA3AF';
  return (
    <footer className="bottom">
      <span className="muted">Bottom Bar — status & prompts</span>
      {FLAGS.OS_LAUNCHER && <AppLauncher />}
      <button className="chip" onClick={onOpenAgents} title="Open Agents">
        <span style={{ ...dotStyle, background: color }} /> Agents
      </button>
      {FLAGS.OS_TRAY && <Tray />}
    </footer>
  );
}
