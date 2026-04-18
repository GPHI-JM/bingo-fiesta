import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    {
      name: 'clean-and-copy',
      enforce: 'pre',
      configResolved(config) {
        // Clean dist folder before build starts
        const distPath = join(process.cwd(), 'dist')
        if (existsSync(distPath)) {
          rmSync(distPath, { recursive: true, force: true })
          console.log('Cleaned dist folder before build')
        }
      },
      writeBundle() {
        // Copy Facebook bundle config to dist after build
        const srcPath = join(process.cwd(), 'public', 'fbapp-config.json')
        const destPath = join(process.cwd(), 'dist', 'fbapp-config.json')
        try {
          copyFileSync(srcPath, destPath)
          console.log('Copied fbapp-config.json to dist')
        } catch (e) {
          console.error('Failed to copy fbapp-config.json:', e)
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
