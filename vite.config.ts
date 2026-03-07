import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3568,
        host: '0.0.0.0',
        allowedHosts: ['comedu_spot_mission.gloomn.site'],
        proxy: {
          '/socket.io': {
            target: 'http://127.0.0.1:3567',
            ws: true,
          },
          // 🟢 파일 업로드 및 조회 프록시 추가
          '/api': {
            target: 'http://127.0.0.1:3567',
            changeOrigin: true,
          },
          '/uploads': {
            target: 'http://127.0.0.1:3567',
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});