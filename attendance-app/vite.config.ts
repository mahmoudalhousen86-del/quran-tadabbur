import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages: https://mahmoudalhousen86-del.github.io/quran-tadabbur/attendance/
  base: '/quran-tadabbur/attendance/',
})
