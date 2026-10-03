import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getMyInfo, logout as apiLogout } from '../api/auth';
import api from '../lib/api';

// Context의 기본 모양을 정의
export const AuthCtx = createContext({
  token: null,
  user: null,
  isLoggedIn: false,
  isLoading: true, // 사용자 정보를 불러오는 중인지 확인하는 상태
  login: (token, refreshToken) => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateUser: (partial) => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuthHeader = useCallback((value) => {
    if (value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${value}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  // 토큰이 있으면 서버에 내 정보를 물어보는 useEffect
  useEffect(() => {
    setAuthHeader(token);

    const fetchUser = async () => {
      if (token) {
        try {
          const raw = await getMyInfo();
          const normalized = {
            ...raw,
            // 호환성: 헤더 등에서 `profileImage`를 참조하므로 alias 제공
            profileImage: raw?.profileImage ?? raw?.profileImageUrl ?? raw?.profileImagePath ?? null,
          };
          setUser(normalized);
          localStorage.setItem('user', JSON.stringify(normalized));
        }  catch (error) {
          // 실패 시 토큰을 지우고 로그아웃 처리
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setToken(null);
          setUser(null);
          setAuthHeader(null);
        }
      }
      setIsLoading(false); // 정보 조회가 끝나면 로딩 상태 해제
    };

    fetchUser();
  }, [token, setAuthHeader]); // 이 effect는 'token' 상태가 바뀔 때마다 실행

  const isLoggedIn = !!token && !!user;

  // 소셜 로그인 콜백 페이지에서 토큰을 저장할 때 사용할 함수
  const login = (newToken, newRefreshToken) => {
    if (!newToken) {
      return;
    }
    localStorage.setItem('accessToken', newToken);
    setAuthHeader(newToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    setToken(newToken); // 토큰 상태를 업데이트하면, 위의 useEffect가 자동으로 실행
    setIsLoading(true);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      try {
        const uid = (user && user.id) ? String(user.id) : null;
        if (uid) {
          localStorage.removeItem(`userLocations:${uid}`);
          localStorage.removeItem(`userLocation:${uid}`);
        }
        // 과거 공용 키가 남아있을 수 있으므로 함께 정리
        localStorage.removeItem('userLocations');
        localStorage.removeItem('userLocation');
      } catch (_) {}
      setAuthHeader(null);
      setToken(null);
      setUser(null);
      localStorage.removeItem('user'); // 추가!
    }
  };

  // 수동 새로고침
  const refreshUser = async () => {
    if (!token) return;
    try {
      const raw = await getMyInfo();
      const normalized = {
        ...raw,
        profileImage: raw?.profileImage ?? raw?.profileImageUrl ?? raw?.profileImagePath ?? null,
      };
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
    } catch (e) {
    }
  };

  // 부분 업데이트(닉네임/이미지 등 클라이언트 선반영)
  const updateUser = (partial) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(partial || {}) };
      // alias 동기화
      if (partial?.profileImageUrl && !partial?.profileImage) {
        next.profileImage = partial.profileImageUrl;
      }
      if (partial?.profileImage && !partial?.profileImageUrl) {
        next.profileImageUrl = partial.profileImage;
      }
      try { localStorage.setItem('user', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const contextValue = {
    token,
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
    refreshUser,
    updateUser,
  };

  return (
      <AuthCtx.Provider value={contextValue}>
        {/* 로딩 중일 때는 아무것도 안 보여주거나 로딩 스피너 */}
        {!isLoading && children}
      </AuthCtx.Provider>
  );
}
