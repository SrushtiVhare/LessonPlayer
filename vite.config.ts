import type { IncomingMessage, ServerResponse } from 'node:http'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Connect, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

type LessonServer = ViteDevServer | PreviewServer

function attachLessonApi(server: LessonServer, env: Record<string, string>) {
  server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    const path = req.url?.split('?')[0]
    const tutor = path === '/api/tutor'
    if ((path !== '/api/generate-lesson' && path !== '/api/next-question' && !tutor) || req.method !== 'POST') {
      next()
      return
    }
    try {
      const body = await readBody(req)
      if (!('ssrLoadModule' in server)) {
        throw new Error('New puzzles need npm run dev.')
      }
      const result = tutor
        ? await (await server.ssrLoadModule('/src/server/handle-tutor.ts') as {
            handleTutor: (input: unknown, runtimeEnv: Record<string, string>) => Promise<{ status: number; body: unknown }>
          }).handleTutor(body, env)
        : await (async () => {
            const loaded = await server.ssrLoadModule('/src/server/handle-generate.ts') as {
              handleGenerateLesson: (input: unknown, runtimeEnv: Record<string, string>) => Promise<{ status: number; body: unknown }>
              handleNextQuestion: (input: unknown, runtimeEnv: Record<string, string>) => Promise<{ status: number; body: unknown }>
            }
            return path === '/api/next-question' ? loaded.handleNextQuestion(body, env) : loaded.handleGenerateLesson(body, env)
          })()
      res.statusCode = result.status
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(result.body))
    } catch (error) {
      console.error(tutor ? 'tutor failed' : 'generate-lesson failed', error)
      const detail = error instanceof Error ? error.message : 'Unknown error'
      const safe = env.GEMINI_API_KEY ? detail.replaceAll(env.GEMINI_API_KEY, '') : detail
      res.statusCode = 500
      res.setHeader('content-type', 'application/json')
      const lead = tutor ? 'The tutor needs a moment.' : 'The puzzle machine hit a problem.'
      res.end(JSON.stringify({ error: `${lead} ${safe}`.slice(0, 240) }))
    }
  })
}

function lessonApiPlugin(): Plugin {
  const attach = (server: LessonServer) => {
    const env = loadEnv(server.config.mode, server.config.envDir || process.cwd(), '')
    attachLessonApi(server, env)
  }
  return {
    name: 'lesson-api',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), lessonApiPlugin()],
})
