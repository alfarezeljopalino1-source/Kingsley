import { defineConfig } from 'vite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'build-stamp',
      closeBundle() {
        try {
          const distDir = path.join(__dirname, 'dist')
          if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true })
          }
          fs.writeFileSync(
            path.join(distDir, 'build-stamp.json'),
            JSON.stringify({ timestamp: Date.now(), iso: new Date().toISOString() }, null, 2)
          )
        } catch {}
      },
    },
    electron({
      main: {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['node-pty'],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'src/preload/index.ts'),
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'index.cjs',
              },
            },
          },
        },
      },
      renderer: {},
    }),
  ],
  define: {
    'process.platform': JSON.stringify(process.platform),
    'process.env': {},
    '__APP_BUILD_TIME__': JSON.stringify(new Date().toISOString()),
    '__APP_VERSION__': JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src'),
      '@shared': path.resolve(__dirname, './src/preload'),
    },
  },
})
