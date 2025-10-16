import { FLAGS } from "./flags";
import { Dock } from "./workspace/Dock";
import { Surface } from "./workspace/Surface";
import { BottomBar } from "./workspace/BottomBar";
import { Drawer } from "./workspace/Drawer";
import { ApprovalsDrawer } from "./approvals/ApprovalsDrawer";
import { GateBadges } from "./gates/GateBadges";
import { AgentPanel } from "./agents/AgentPanel";
import { ToolHub } from "./tools/ToolHub";
import { RagPanel } from "./rag/RagPanel";

export default function AppFrame() {
  return (
    <div className="min-h-screen">
      {FLAGS.WORKSPACE_SHELL && <Dock />}

      <Surface>
        {/* Top-of-surface widgets */}
        {FLAGS.GATES_BADGES && <GateBadges />}

        {/* Panels */}
        {FLAGS.AGENT_PANEL && <section className="mt-4"><AgentPanel /></section>}
        {FLAGS.TOOL_HUB && <section className="mt-4"><ToolHub /></section>}
        {FLAGS.RAG && <section className="mt-4"><RagPanel /></section>}

        {/* Broker note (debug) */}
        {FLAGS.BROKER && <p className="mt-4 text-xs opacity-70">Broker: enabled (mock)</p>}
      </Surface>

      {FLAGS.WORKSPACE_SHELL && <BottomBar />}

      {/* Drawers */}
      {FLAGS.APPROVALS_DRAWER && (
        <Drawer title="Approvals">
          <ApprovalsDrawer />
          {FLAGS.DEV_AUTO_APPROVE && (
            <div className="mt-2 text-[11px] opacity-70">Dev auto-approve: ON</div>
          )}
        </Drawer>
      )}
    </div>
  );
}

