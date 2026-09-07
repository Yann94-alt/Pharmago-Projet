import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PharmacyProvider } from './context/PharmacyContext.jsx'
import './index.css'

// Enregistrement du Service Worker de PharmaGo
registerSW({
  immediate: true,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PharmacyProvider>
          <App />
        </PharmacyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
