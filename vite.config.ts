import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Data is kept in localStorage, which the browser scopes to the origin —
  // port included. A fixed port keeps that store stable between runs.
  server: { port: 5174, strictPort: true },
})
