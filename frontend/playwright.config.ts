import process from 'node:process'

import { defineConfig, devices } from '@playwright/test'

const isCi = Boolean(process.env.CI)
const baseURL = isCi ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi ? 'line' : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],
  webServer: {
    command: isCi
      ? 'pnpm build && pnpm preview --host 127.0.0.1'
      : 'pnpm dev --host 127.0.0.1',
    url: baseURL,
    reuseExistingServer: !isCi,
    timeout: 180_000,
    env: {
      // API를 같은 출처의 /api로 부른다. 스펙이 page.route로 API를 가로채므로
      // 백엔드가 떠 있을 필요가 없다. 로컬 .env의 VITE_API_BASE가 다른 출처를
      // 가리키면 결과가 백엔드 상태에 따라 달라지므로 여기서 덮어쓴다.
      VITE_API_BASE: '/api'
    }
  }
})
