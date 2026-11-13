import './assets/jcat.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WIN_CAPTION_HEIGHT } from '@shared/windowBounds'
import App from './App'

const platform = window.jcat.platform
document.body.classList.add(platform === 'darwin' ? 'mac' : platform === 'win32' ? 'win' : platform)
if (platform === 'win32') {
  document.documentElement.style.setProperty('--title-h', `${WIN_CAPTION_HEIGHT}px`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
