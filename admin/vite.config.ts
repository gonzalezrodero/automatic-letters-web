import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
    plugins: [react(), tailwindcss(), redirectRootToBase(base)],
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
