import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function spaFallback404(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    enforce: 'post',
    writeBundle(options) {
      if (!options.dir) return
      copyFileSync(join(options.dir, 'index.html'), join(options.dir, '404.html'))
    },
  }
}

function redirectRootToBase(base: string): Plugin {
  const target = base.endsWith('/') ? base : `${base}/`
  return {
    name: 'redirect-root-to-base',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '/'
        if (url === '/' || url.startsWith('/?')) {
          res.writeHead(302, { Location: target })
          res.end()
          return
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '/'
        if (url === '/' || url.startsWith('/?')) {
          res.writeHead(302, { Location: target })
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || '/admin/'

  return {
    base,
    plugins: [react(), tailwindcss(), redirectRootToBase(base), spaFallback404()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  }
})
