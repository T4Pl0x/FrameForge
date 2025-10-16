import React from 'react';
import type { WinId } from '@frameforge/os';
import { WM } from '@frameforge/os';
import { kernel } from '../kernel';

const windowNodes = new Map<WinId, React.ReactNode>();

export function getWindowNode(id: WinId){
  return windowNodes.get(id) || null;
}

export interface ExtHost {
  openWindow(opts: { title: string; render?: () => React.ReactNode; component?: React.FC }): WinId;
  proposals: { submit: typeof kernel.host.proposals.submit };
}

export function createExtHost(): ExtHost {
  return {
    openWindow(opts){
      const id = WM.open('logs', { title: opts.title }); // use generic app slot; content is injected
      const node = opts.render ? opts.render() : (opts.component ? React.createElement(opts.component) : null);
      if (node) windowNodes.set(id, node);
      return id;
    },
    proposals: { submit: kernel.host.proposals.submit.bind(kernel.host.proposals) }
  };
}
