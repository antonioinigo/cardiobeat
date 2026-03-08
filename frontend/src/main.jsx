import React from 'react'
import ReactDOM from 'react-dom/client'
import './lib/http'
import App from './App.jsx'
import './styles/unified.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
