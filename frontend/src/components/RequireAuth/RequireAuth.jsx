import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthCtx } from '../../contexts/AuthContext';
import { Loading } from '../ui';

/**
 * 비로그인 사용자의 보호 라우트 접근을 차단하는 가드.
 * - 로딩 중이면 로딩 표시
 * - 비로그인이면 /login으로 리다이렉트 (이동 전 페이지는 state.from으로 보관)
 */
export default function RequireAuth({ children }) {
    const { isLoggedIn, isLoading } = useContext(AuthCtx);
    const location = useLocation();

    if (isLoading) {
        return <Loading fullScreen />;
    }
    if (!isLoggedIn) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }
    return children;
}
