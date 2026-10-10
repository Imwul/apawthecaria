/* eslint-disable react-refresh/only-export-components */
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './feature-layout.css'
import './workspace.css'
import './mystic-folio.css'

const App = lazy(() => import('./App.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<main className="app-loading" role="status"><span aria-hidden="true">✿</span> 숲으로 가는 일지를 펼치고 있어요…</main>}>
      <App />
    </Suspense>
  </StrictMode>,
)
