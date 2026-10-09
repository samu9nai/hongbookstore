import { expect, test } from '@playwright/test'

test('백엔드 없이 홈 화면을 띄운다', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', error => pageErrors.push(error))

  // '**/api/**'로 쓰면 개발 서버의 src/shared/api/*.ts 같은 모듈 요청까지 가로챈다.
  await page.route(
    url => url.pathname.startsWith('/api/'),
    route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}'
      })
  )

  await page.goto('/')

  await expect(page).toHaveTitle('홍책방 - HongBookStore')
  await expect(page.locator('#root')).not.toBeEmpty()
  expect(pageErrors).toEqual([])
})
