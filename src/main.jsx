import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme, getInitialTheme } from './lib/theme'
import './index.css'
import App from './App.jsx'

applyTheme(getInitialTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
