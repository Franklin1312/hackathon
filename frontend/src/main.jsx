import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#fefcf8',
            color: '#2d1f0e',
            border: '1px solid rgba(101,78,51,0.15)',
            borderRadius: '12px',
            fontFamily: 'Jost, sans-serif',
            fontSize: '13px',
            boxShadow: '0 8px 32px rgba(50,35,15,0.12)',
          },
          success: { iconTheme: { primary: '#4a7c59', secondary: '#fefcf8' } },
          error:   { iconTheme: { primary: '#c0392b', secondary: '#fefcf8' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
