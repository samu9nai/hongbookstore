import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GlobalStyles from './styles/GlobalStyles.js';
import Header from './components/Header/Header.jsx';
import i18n from './i18n.js';
import Hero from './components/Hero/Hero.jsx';
import Footer from './components/Footer/Footer.jsx';
import { Loading } from './components/ui';

import Marketplace from './pages/Marketplace/Marketplace.jsx';
import MyPage from './pages/MyPage/MyPage.jsx';
import Login from './pages/Login/Login.jsx';
import Search from './pages/Search/Search.jsx';

import Wanted from './pages/Wanted/Wanted.jsx';
import WantedWrite from './pages/WantedWrite/WantedWrite.jsx';
import WantedDetail from './pages/WantedDetail/WantedDetail.jsx';

import MyBookstore from './pages/MyBookstore/MyBookstore.jsx';

import PostWrite from './pages/PostWrite/PostWrite.jsx';
import PostDetail from './pages/PostDetail/PostDetail.jsx';

import ChatList from './pages/Chat/ChatList.jsx';
import ChatRoomWrapper from './pages/Chat/ChatRoomWrapper.jsx';
import ChatRoom from './pages/Chat/ChatRoom.jsx';

import MapPage from './pages/Map/Map.jsx';

import UserProfile from './pages/UserProfile/UserProfile.jsx';
import VerificationConfirmPage from './pages/VerificationConfirmPage/VerificationConfirmPage.jsx';
import OAuth2RedirectHandler from './pages/Login/OAuth2RedirectHandler.jsx';

import FloatingChatBot from './components/ui/FloatingChatBot.jsx';

import { AuthProvider } from './contexts/AuthContext';
import { WritingProvider } from './contexts/WritingContext';
import { LocationProvider } from './contexts/LocationContext';

import RequireAuth from './components/RequireAuth/RequireAuth.jsx';

import AccountDeactivate from './pages/AccountDeactivate/AccountDeactivate.jsx'; // ← 추가

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);

    useEffect(() => {
        // 언어 설정 복원
        const savedLang = localStorage.getItem('lang');
        if (savedLang) {
            i18n.changeLanguage(savedLang);
        }

        // 온보딩(임시 false)
        setOnboardingCompleted(false);

        // 만료된 토큰 정리
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp && payload.exp < now) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    // 토큰 만료 시 로그인 페이지로
                    window.location.href = '/login';
                }
            }
        } catch (e) {
            console.error('토큰 파싱 에러:', e);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return <Loading fullScreen />;
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
                                        <Navigate to="/marketplace" replace />
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
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Navigate to="/login" replace />} />
                            <Route path="/verify-student" element={<VerificationConfirmPage />} />
                            <Route path="/oauth/callback" element={<OAuth2RedirectHandler />} />
                            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
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
                            <Route path="*" element={<Navigate to="/" replace />} />
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
    );
}

export default App;
