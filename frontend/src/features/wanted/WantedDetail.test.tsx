// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WritingProvider } from '@/shared/contexts/WritingContext'
import WantedDetail from './WantedDetail'

// 작성자 본인으로 보이도록 id가 1인 JWT 모양의 토큰을 둔다(서명은 검사하지 않는다)
const payload = btoa(JSON.stringify({ id: 1, nickname: 'writer' }))
const token = `e30.${payload}.sig`

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

describe('WantedDetail 삭제', () => {
  let container: HTMLDivElement
  let root: Root
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    ;(
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    localStorage.setItem('accessToken', token)
    fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE')
        return Promise.resolve(new Response(null, { status: 204 }))
      if (url.endsWith('/comments')) return Promise.resolve(json([]))
      return Promise.resolve(
        json({ data: { id: 7, requesterId: 1, title: '자료구조 책 구해요' } })
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  const deleteCalls = () =>
    fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === 'DELETE'
    )

  const clickButton = (text: string) => {
    const button = [...container.querySelectorAll('button')].find(
      b => b.textContent?.trim() === text
    )
    expect(button, `${text} 버튼`).toBeTruthy()
    act(() => button!.click())
  }

  it('삭제 버튼은 확인 모달을 열고, 확인을 눌러야 삭제 요청을 보낸다', async () => {
    await act(async () => {
      root.render(
        <WritingProvider>
          <MemoryRouter initialEntries={['/wanted/7']}>
            <Routes>
              <Route
                path="/wanted/:id"
                element={<WantedDetail />}
              />
              <Route
                path="/wanted"
                element={<div>목록</div>}
              />
            </Routes>
          </MemoryRouter>
        </WritingProvider>
      )
    })

    clickButton('wantedDetail.delete')
    expect(deleteCalls()).toHaveLength(0)
    expect(container.textContent).toContain('wantedDetail.deleteModal.title')

    await act(async () => clickButton('wantedDetail.deleteModal.confirm'))
    expect(deleteCalls()).toHaveLength(1)
  })
})
