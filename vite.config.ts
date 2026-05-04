import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Same-origin /api in dev → avoids browser CORS blocks to localhost backend */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = (env.VITE_API_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
