import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { openRouterPlugin } from './openrouter-plugin.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), openRouterPlugin(env.OPENROUTER_API_KEY)],
  }
})
