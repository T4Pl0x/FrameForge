import { useEffect, useMemo, useState } from "react";
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
import { installHotkeys } from "./hotkeys";
import { Breadcrumb } from "./ui/Breadcrumb";
import { ShortcutsModal } from "./ui/ShortcutsModal";
import { Desktop, WM, setDockOffset, Notifs } from "@frameforge/os";
import { osDevBoot } from "./os/bootstrap";
import { Toaster } from "./os/Toaster";
import { Composer as PromptComposer } from "./prompt-lab/Composer";
import { getWindowNode } from "./os/extHost";
import { Builder } from "./builder/Builder";
import { ApprovalsCard } from "./approvals/ApprovalsCard";

function useQueryFlag(name: string){
  return useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get(name) === '1' || p.get(name) === 'true';
  }, []);
}

function DebugOverlay({ flags, route }:{ flags:any; route:string }){
  const debugOn = useQueryFlag('debug');
  if (!debugOn) return null;
  return (
    <div className="debug">
      <div className="widget-title">Debug</div>
      <pre>{JSON.stringify({ route, flags }, null, 2)}</pre>
    </div>
  );
}

export default function AppFrame() {
  const [route, setRoute] = useState<string>('/');
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const uninstall = installHotkeys({
      navigate: (p) => setRoute(p),
      openShortcuts: () => setShowShortcuts(true),
      os: (FLAGS.OS_DESKTOP || FLAGS.OS_WINDOWS) ? {
        nextWindow: () => WM.nextWindow(),
        snapActive: (pos) => { const id = WM.getActive(); if (id) WM.snap(id, pos); },
        openApp: (app) => {
          // try to focus existing window of same app; else open
          const list = WM.list().filter(w => w.app === app && !w.minimized);
          if (list.length) WM.focus(list[list.length-1].id); else WM.open(app);
        }
      } : undefined
    });
    return uninstall;
  }, []);

  useEffect(() => {
    if ((FLAGS.OS_DESKTOP || FLAGS.OS_WINDOWS) && FLAGS.OS_NOTIFS) {
      osDevBoot();
    }
  }, []);

  const showDock = FLAGS.WORKSPACE_SHELL && !(FLAGS.OS_DESKTOP || FLAGS.OS_WINDOWS || FLAGS.OS_LAUNCHER);

  useEffect(() => { setDockOffset(showDock ? 240 : 0); }, [showDock]);

  return (
    <div className={"app-grid" + (showDock ? "" : " no-dock") }>
      {showDock && <Dock active={route} onNavigate={setRoute} />}

      {(FLAGS.OS_DESKTOP || FLAGS.OS_WINDOWS) ? (
        <Desktop noDock={!showDock} renderContent={(w)=>{
          // Simple mapper for demo content; app integrates its own panels here
          switch (w.app){
            case 'agents': return <AgentPanel/>;
            case 'tools': return <ToolHub/>;
            case 'settings': return <div className="muted">Settings (control center stub)</div>;
            case 'processes': return <div className="muted">Processes (runs list stub)</div>;
            case 'logs': return <div className="muted">Kernel Logs (debug stub)</div>;
            case 'approvals': return <div className="widget"><ApprovalsCard/></div>;
            case 'prompt-lab': return <PromptComposer/>;
            case 'builder': return <Builder/>;
            default: return getWindowNode(w.id) || <div className="muted">{w.title}</div>;
          }
        }} />
      ) : (
      <Surface>
        <Breadcrumb path={route} />
        {FLAGS.GATES_BADGES && (
          <section className="widget">
            <div className="widget-title">Gates</div>
            <div className="badge-row"><GateBadges /></div>
          </section>
        )}

        {FLAGS.APPROVALS_DRAWER && (
          <section className="widget">
            <ApprovalsCard />
          </section>
        )}

        {FLAGS.AGENT_PANEL && (
          <section className="widget">
            <div className="widget-title">Agents</div>
            <AgentPanel />
          </section>
        )}
        {FLAGS.TOOL_HUB && (
          <section className="widget">
            <div className="widget-title">Tools</div>
            <ToolHub />
          </section>
        )}
        {FLAGS.RAG && (
          <section className="widget">
            <div className="widget-title">RAG</div>
            <RagPanel />
          </section>
        )}

        {FLAGS.BROKER && <p className="muted" style={{marginTop:12}}>Broker: enabled (mock)</p>}
      </Surface>
      )}

      {FLAGS.WORKSPACE_SHELL && <BottomBar />}

      {/* Approvals now shown as a widget card; drawer intentionally not rendered */}

      <DebugOverlay flags={FLAGS} route={route} />
      {FLAGS.OS_NOTIFS && <Toaster />}
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
