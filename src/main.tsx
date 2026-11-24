import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/playfair-display/latin-900.css'
import '@fontsource/special-elite/latin-400.css'
import '@fontsource/caveat/latin-600.css'
import './styles.css'
import App from './App'
import { StoreProvider } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
