import { useEffect, useState } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import GlobalStyles from './GlobalStyles'
import Header from '@/shared/layout/Header'
import i18n from './i18n.js'
import Hero from '@/features/home/Hero'
import Footer from '@/shared/layout/Footer'
import { Loading } from '@/shared/ui'

import Marketplace from '@/features/marketplace/Marketplace.jsx'
import MyPage from '@/features/account/MyPage.jsx'
import Login from '@/features/auth/Login'
import Search from '@/features/marketplace/Search.jsx'

import Wanted from '@/features/wanted/Wanted.jsx'
import WantedWrite from '@/features/wanted/WantedWrite.jsx'
import WantedDetail from '@/features/wanted/WantedDetail.jsx'

import MyBookstore from '@/features/marketplace/MyBookstore.jsx'

import PostWrite from '@/features/marketplace/PostWrite.jsx'
import PostDetail from '@/features/marketplace/PostDetail.jsx'

import ChatList from '@/features/chat/ChatList.jsx'
import ChatRoomWrapper from '@/features/chat/ChatRoomWrapper.jsx'
import ChatRoom from '@/features/chat/ChatRoom.jsx'

import MapPage from '@/features/map/Map.jsx'

import UserProfile from '@/features/account/UserProfile.jsx'
import VerificationConfirmPage from '@/features/auth/VerificationConfirmPage'
import OAuth2RedirectHandler from '@/features/auth/OAuth2RedirectHandler'

import FloatingChatBot from '@/features/chatbot/FloatingChatBot'

import { AuthProvider } from '@/shared/contexts/AuthContext'
import { WritingProvider } from '@/shared/contexts/WritingContext'
import { LocationProvider } from '@/features/map/LocationContext'

import RequireAuth from './RequireAuth'

import AccountDeactivate from '@/features/account/AccountDeactivate.jsx' // ← 추가

function App() {
  const [isLoading, setIsLoading] = useState(true)
  // 온보딩(임시 false)
  const [onboardingCompleted] = useState(false)

  useEffect(() => {
    // 언어 설정 복원
    const savedLang = localStorage.getItem('lang')
    if (savedLang) {
      void i18n.changeLanguage(savedLang)
    }

    // 만료된 토큰 정리
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          // 토큰 만료 시 로그인 페이지로
          window.location.href = '/login'
        }
      }
    } catch (e) {
      console.error('토큰 파싱 에러:', e)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return <Loading fullScreen />
  }

  return (
    <AuthProvider>
      <LocationProvider>
        <WritingProvider>
          <Router>
            <GlobalStyles />
            <Routes>
              {/* 랜딩 */}
              <Route
                path="/"
                element={
                  onboardingCompleted ? (
                    <Navigate
                      to="/marketplace"
                      replace
                    />
                  ) : (
                    <>
                      <Header />
                      <Hero />
                    </>
                  )
                }
              />

              {/* 공개 페이지 */}
              <Route
                path="/marketplace"
                element={
                  <>
                    <Header />
                    <Marketplace />
                  </>
                }
              />
              <Route
                path="/search"
                element={
                  <>
                    <Header />
                    <Search />
                  </>
                }
              />
              {/* 판매 글 상세: 로그인 없이 열람 허용 */}
              <Route
                path="/marketplace/:id"
                element={
                  <>
                    <Header />
                    <PostDetail />
                  </>
                }
              />
              {/* 일부 프로젝트에서 /posts/:id 도 사용하길래 같이 열어둠 */}
              <Route
                path="/posts/:id"
                element={
                  <>
                    <Header />
                    <PostDetail />
                  </>
                }
              />

              {/* 원티드 목록/상세: 공개 */}
              <Route
                path="/wanted"
                element={
                  <>
                    <Header />
                    <Wanted />
                  </>
                }
              />
              <Route
                path="/wanted/:id"
                element={
                  <>
                    <Header />
                    <WantedDetail />
                  </>
                }
              />

              {/* 보호 라우트: 비로그인 접근 불가 */}
              {/* chat 관련 */}
              <Route
                path="/chat"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <ChatList />
                    </>
                  </RequireAuth>
                }
              />
              <Route
                path="/chat/:chatId"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      {/* 프로젝트 구조에 맞게 래퍼 사용 */}
                      <ChatRoomWrapper>
                        <ChatRoom />
                      </ChatRoomWrapper>
                    </>
                  </RequireAuth>
                }
              />

              {/* map 관련 */}
              <Route
                path="/hongikmap"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <MapPage />
                    </>
                  </RequireAuth>
                }
              />

              {/* mybookstore 관련 (별칭 포함) */}
              <Route
                path="/mybookstore"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <MyBookstore />
                    </>
                  </RequireAuth>
                }
              />
              <Route
                path="/bookstore"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <MyBookstore />
                    </>
                  </RequireAuth>
                }
              />
              <Route
                path="/bookstore/add"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <PostWrite />
                    </>
                  </RequireAuth>
                }
              />

              {/* mypage */}
              <Route
                path="/mypage"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <MyPage />
                    </>
                  </RequireAuth>
                }
              />

              {/* postwrite */}
              <Route
                path="/post-write"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <PostWrite />
                    </>
                  </RequireAuth>
                }
              />
              <Route
                path="/postwrite/:id"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <PostWrite />
                    </>
                  </RequireAuth>
                }
              />

              {/* wantedwrite */}
              <Route
                path="/wanted/write"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <WantedWrite />
                    </>
                  </RequireAuth>
                }
              />
              <Route
                path="/wanted/write/:id"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <WantedWrite />
                    </>
                  </RequireAuth>
                }
              />

              {/* 로그인/검증/프로필 등 공개 라우트 */}
              <Route
                path="/login"
                element={<Login />}
              />
              <Route
                path="/register"
                element={
                  <Navigate
                    to="/login"
                    replace
                  />
                }
              />
              <Route
                path="/verify-student"
                element={<VerificationConfirmPage />}
              />
              <Route
                path="/oauth/callback"
                element={<OAuth2RedirectHandler />}
              />
              <Route
                path="/oauth2/redirect"
                element={<OAuth2RedirectHandler />}
              />
              <Route
                path="/users/:userId"
                element={
                  <>
                    <Header />
                    <UserProfile />
                  </>
                }
              />

              {/* Fallback */}
              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />
              <Route
                path="/my/deactivate"
                element={
                  <RequireAuth>
                    <>
                      <Header />
                      <AccountDeactivate />
                    </>
                  </RequireAuth>
                }
              />
            </Routes>

            <FloatingChatBot />
            <Footer />
          </Router>
        </WritingProvider>
      </LocationProvider>
    </AuthProvider>
  )
}

export default App
