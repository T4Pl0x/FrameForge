import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-Refactored.jsx'
import { KernelProvider } from './kernel/KernelProvider.jsx'
import AgentsEntry from './components/AgentsEntry.jsx'
import ProposalsEntry from './components/ProposalsEntry.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KernelProvider>
      <App />
      <AgentsEntry />
      <ProposalsEntry />
    </KernelProvider>
  </React.StrictMode>
)

