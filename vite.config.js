import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use `netlify dev` for local development — it starts Vite internally and
// routes /api/jira/* through the local function, matching production exactly.
// Running `npm run dev` directly works for UI iteration but Jira calls will fail
// without the proxy function running.
export default defineConfig({
  plugins: [react()],
});
