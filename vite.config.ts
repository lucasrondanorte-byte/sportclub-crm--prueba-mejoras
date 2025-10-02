// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/sportclub-crm--prueba-mejoras/', // 👈 importante para GH Pages
  plugins: [react()],
})

