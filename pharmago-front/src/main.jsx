import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PharmacyProvider } from './context/PharmacyContext.jsx'
import './index.css'

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
