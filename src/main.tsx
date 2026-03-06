import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Expose Firebase helpers for e2e tests in dev mode
if (import.meta.env.DEV) {
  import('./lib/firebase').then(({ db }) => {
    import('firebase/database').then(({ ref, update, push, get, remove }) => {
      (window as any).__e2e = { db, ref, update, push, get, remove };
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
