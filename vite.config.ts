// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👇 IMPORTANTE: el nombre del repo entre barras
export default defineConfig({
  plugins: [react()],
  base: '/sportclub-crm--prueba-mejoras/',
})
