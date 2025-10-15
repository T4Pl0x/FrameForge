import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-Refactored.jsx'
import { KernelProvider } from './kernel/KernelProvider.jsx'
import AgentsEntry from './components/AgentsEntry.jsx'
import ProposalsEntry from './components/ProposalsEntry.jsx'
import GhostLayer from './components/GhostLayer.jsx'
import Toasts from './components/Toasts.jsx'
import RunHistoryPanel from './components/RunHistoryPanel.jsx'
import { startGateToastTap } from './state/runHistoryGateTap.js'

startGateToastTap()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KernelProvider>
      <App />
      <AgentsEntry />
      <ProposalsEntry />
      <GhostLayer />
      <RunHistoryPanel />
      <Toasts />
    </KernelProvider>
  </React.StrictMode>
)

