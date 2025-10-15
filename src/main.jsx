import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-Refactored.jsx'
import { KernelProvider } from './kernel/KernelProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KernelProvider>
      <App />
    </KernelProvider>
  </React.StrictMode>
)

