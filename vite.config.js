import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cross-origin isolation headers so onnxruntime-web can use SharedArrayBuffer /
// multithreaded WASM (much faster background removal). `credentialless` keeps
// cross-origin CDN assets (fonts, the @imgly model) loading without CORP headers.
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
