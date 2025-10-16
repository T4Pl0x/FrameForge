import { FLAGS } from "../flags";
import { Launcher } from "../os/Launcher";
import { Tray } from "../os/Tray";

export function BottomBar() {
  return (
    <footer className="bottom">
      <span className="muted">Bottom Bar • status & prompts</span>
      {FLAGS.OS_LAUNCHER && <Launcher />}
      {FLAGS.OS_TRAY && <Tray />}
    </footer>
  );
}
