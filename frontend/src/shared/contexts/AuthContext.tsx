import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react'
import { getMyInfo, logout as apiLogout, type MyInfo } from '../api/auth'
import api from '../api/client'

/** 로그인한 사용자. 서버는 profileImageUrl만 보내고, 나머지 두 이름은 예전 코드가 대비하던 별칭이다 */
export interface AuthUser extends MyInfo {
  /** 헤더 등이 읽는 프로필 이미지 주소 */
  profileImage?: string | null
  profileImagePath?: string | null
}

export interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isLoggedIn: boolean
  /** 사용자 정보를 불러오는 중인지 나타낸다 */
  isLoading: boolean
  login: (token: string | null, refreshToken?: string | null) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (partial: Partial<AuthUser>) => void
}

// Context의 기본 모양을 정의
// oxlint-disable-next-line react/only-export-components -- 컨텍스트를 Provider와 같은 파일에 둔다
export const AuthCtx = createContext<AuthContextValue>({
  token: null,
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateUser: () => {}
})

export function AuthProvider({ children }: { children?: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setAuthHeader = useCallback((value: string | null) => {
    if (value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${value}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [])

  // 토큰이 있으면 서버에 내 정보를 물어보는 useEffect
  useEffect(() => {
    setAuthHeader(token)

    const fetchUser = async () => {
      if (token) {
        try {
          const raw: AuthUser | undefined = await getMyInfo()
          const normalized = {
            ...raw,
            // 호환성: 헤더 등에서 `profileImage`를 참조하므로 alias 제공
            profileImage:
              raw?.profileImage ??
              raw?.profileImageUrl ??
              raw?.profileImagePath ??
              null
          }
          setUser(normalized)
          localStorage.setItem('user', JSON.stringify(normalized))
        } catch {
          // 실패 시 토큰을 지우고 로그아웃 처리
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          setToken(null)
          setUser(null)
          setAuthHeader(null)
        }
      }
      setIsLoading(false) // 정보 조회가 끝나면 로딩 상태 해제
    }

    void fetchUser()
  }, [token, setAuthHeader]) // 이 effect는 'token' 상태가 바뀔 때마다 실행

  const isLoggedIn = !!token && !!user

  // 소셜 로그인 콜백 페이지에서 토큰을 저장할 때 사용할 함수
  const login = (newToken: string | null, newRefreshToken?: string | null) => {
    if (!newToken) {
      return
    }
    localStorage.setItem('accessToken', newToken)
    setAuthHeader(newToken)
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken)
    }
    setToken(newToken) // 토큰 상태를 업데이트하면, 위의 useEffect가 자동으로 실행
    setIsLoading(true)
  }

  const logout = async () => {
    try {
      await apiLogout()
    } finally {
      try {
        const uid = user && user.id ? String(user.id) : null
        if (uid) {
          localStorage.removeItem(`userLocations:${uid}`)
          localStorage.removeItem(`userLocation:${uid}`)
        }
        // 과거 공용 키가 남아있을 수 있으므로 함께 정리
        localStorage.removeItem('userLocations')
        localStorage.removeItem('userLocation')
      } catch {}
      setAuthHeader(null)
      setToken(null)
      setUser(null)
      localStorage.removeItem('user') // 추가!
    }
  }

  // 수동 새로고침
  const refreshUser = async () => {
    if (!token) return
    try {
      const raw: AuthUser | undefined = await getMyInfo()
      const normalized = {
        ...raw,
        profileImage:
          raw?.profileImage ??
          raw?.profileImageUrl ??
          raw?.profileImagePath ??
          null
      }
      setUser(normalized)
      localStorage.setItem('user', JSON.stringify(normalized))
    } catch {}
  }

  // 부분 업데이트(닉네임/이미지 등 클라이언트 선반영)
  const updateUser = (partial: Partial<AuthUser>) => {
    setUser(prev => {
      const next: AuthUser = { ...prev, ...partial }
      // alias 동기화
      if (partial?.profileImageUrl && !partial?.profileImage) {
        next.profileImage = partial.profileImageUrl
      }
      if (partial?.profileImage && !partial?.profileImageUrl) {
        next.profileImageUrl = partial.profileImage
      }
      try {
        localStorage.setItem('user', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const contextValue: AuthContextValue = {
    token,
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
    refreshUser,
    updateUser
  }

  return (
    <AuthCtx.Provider value={contextValue}>
      {/* 로딩 중일 때는 아무것도 안 보여주거나 로딩 스피너 */}
      {!isLoading && children}
    </AuthCtx.Provider>
  )
}
