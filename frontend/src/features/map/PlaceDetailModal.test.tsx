// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PlaceDetailModal from './PlaceDetailModal'

const place = { id: 1, name: '테스트 장소', lat: 37.55, lng: 126.92 }
// Map.jsx가 넘기는 props와 같은 모양
const props = {
  place,
  onClose: () => {},
  userCategories: [],
  onAddToCategory: () => {},
  userLocation: null
}

describe('PlaceDetailModal', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    // 리뷰 목록 요청이 네트워크로 나가지 않게 빈 응답을 돌려준다
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
      )
    )
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it('닫힌 상태로 렌더링한 뒤 열어도 Hook 순서 오류 없이 내용을 보여 준다', async () => {
    act(() => {
      root.render(
        <PlaceDetailModal
          {...props}
          isOpen={false}
        />
      )
    })
    expect(container.innerHTML).toBe('')

    await act(async () => {
      root.render(
        <PlaceDetailModal
          {...props}
          isOpen
        />
      )
    })
    expect(container.textContent).toContain('테스트 장소')
  })
})
