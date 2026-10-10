import { expect, test } from '@playwright/test'

// 로그인 화면은 i18n 초기화를 app 층에 맡긴다(D-P). 주소로 바로 들어와도
// 번역 문구가 보이는지 확인한다.
test('로그인 화면이 번역 문구를 보여 준다', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', error => pageErrors.push(error))

  await page.route(
    url => url.pathname.startsWith('/api/'),
    route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}'
      })
  )

  await page.goto('/login')

  await expect(
    page.getByRole('heading', { name: 'SNS 계정으로 시작하기' })
  ).toBeVisible()
  expect(pageErrors).toEqual([])
})
