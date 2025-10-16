import { FLAGS } from "../flags";
import { Tray } from "@frameforge/os";
import { AppLauncher } from "../os/AppLauncher";

export function BottomBar() {
  return (
    <footer className="bottom">
      <span className="muted">Bottom Bar • status & prompts</span>
      {FLAGS.OS_LAUNCHER && <AppLauncher />}
      {FLAGS.OS_TRAY && <Tray />}
    </footer>
  );
}
