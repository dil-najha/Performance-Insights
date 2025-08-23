import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 🚨 PERFORMANCE ISSUE: React 18 Concurrent Features not utilized properly
// Using legacy render mode instead of concurrent features

const root = ReactDOM.createRoot(document.getElementById('root'))

// 🚨 PERFORMANCE ISSUE: No error boundary, no performance monitoring
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
