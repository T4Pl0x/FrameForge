import React from 'react'
import ReactDOM from 'react-dom/client'
import { KernelProvider } from './kernel/KernelProvider.jsx'
import Shell from './os/Shell.jsx'
import { startGateToastTap } from './state/runHistoryGateTap.js'

startGateToastTap()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KernelProvider>
      <Shell />
    </KernelProvider>
  </React.StrictMode>
)

