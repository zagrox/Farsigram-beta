import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from .env files and the process environment.
  // Set the third parameter to '' to load all env vars, not just those prefixed with VITE_.
  // FIX: Cast `process` to `any` to resolve TypeScript error about missing `cwd` property.
  // This is a workaround for a potential TS configuration issue where Node.js types are not recognized.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Expose the API key to the client-side code.
      // It will try to use API_KEY first, and fall back to VITE_GEMINI_API_KEY.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY),
    }
  }
})