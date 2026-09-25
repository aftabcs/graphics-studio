import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cross-origin isolation headers so onnxruntime-web can use SharedArrayBuffer /
// multithreaded WASM (much faster background removal). Fonts and the @imgly model
// are now self-hosted (same-origin), so the app runs fully offline; a production
// host must send these same two headers for multithreading to stay enabled.
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
})
