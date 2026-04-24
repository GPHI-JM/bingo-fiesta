import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { rmSync, existsSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    {
      name: 'clean-dist',
      enforce: 'pre',
      configResolved(config) {
        // Clean dist folder before build starts
        const distPath = join(process.cwd(), 'dist')
        if (existsSync(distPath)) {
          rmSync(distPath, { recursive: true, force: true })
          console.log('Cleaned dist folder before build')
        }
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://docking-635955947416.asia-east1.run.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
