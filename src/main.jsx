import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ProfileProvider } from './contexts/ProfileContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </ThemeProvider>
  </React.StrictMode>,
)