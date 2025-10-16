import React from "react";
import type { ExtensionEntry } from "@shared/extension"; // your shared contract
const Main: React.FC = () => <div style={{padding:12}}>demoapp • generated (web)</div>;
export const entry: ExtensionEntry = { mount(ctx){ ctx.openWindow({ title: "demoapp", component: Main }); } };
