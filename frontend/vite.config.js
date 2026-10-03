import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: '/src' }
    ]
  },
  server: {
    proxy: {
      // 소셜 로그인 엔드포인트는 Vercel에서 /api/oauth2 → Cloud Run 프록시를 타므로, 로컬에서도 같은 경로로 맞춘다
      '/api/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/oauth2/, '/oauth2'),
      },
      // '/api'로 시작하는 일반 API 요청은 백엔드 서버(8080)로 전달
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true, // CORS 문제를 해결하기 위해 오리진을 변경
      },
      // '/oauth2'로 시작하는 소셜 로그인 요청도 백엔드 서버로 전달
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true, // 이 옵션이 아주 중요해요!
      },
      '/ws-stomp': {
        target: 'ws://localhost:8080',
        ws: true,          // 반드시 있어야 함!
        changeOrigin: true,
      },
    }
  }
})
