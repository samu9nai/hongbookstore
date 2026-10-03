import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthCtx } from '../../contexts/AuthContext'; // 전역 상태 관리를 위한 Context
import styled, { keyframes } from 'styled-components';

// 스타일 정의
const FullPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f8f9fa;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Loader = styled.div`
  border: 5px solid #e9ecef;
  border-top: 5px solid #7c3aed;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  margin-top: 1.5rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: #495057;
`;

/**
 * OAuth2 소셜 로그인 성공 시, 백엔드로부터 리다이렉트되는 컴포넌트
 * URL에 담겨온 토큰을 처리하고 최종 로그인 절차를 완료
 */
function OAuth2RedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthCtx);

  useEffect(() => {
      // URL에서 accessToken과 refreshToken을 추출
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken) {
    // 토큰이 있으면, AuthProvider의 login 함수를 호출하여 토큰을 저장
    //사용자 정보 조회는 AuthProvider가 알아서 처리
    login(accessToken, refreshToken);
      
    // 모든 처리가 끝나면 사용자를 홈페이지로
    // history에 현재 페이지를 남기지 않기 위해 replace: true 옵션을 사용.
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=token_missing', { replace: true });
    }
    // useEffect의 의존성 배열을 명확하게 설정
  }, [navigate, login, searchParams]);

  // 이 컴포넌트는 로직만 처리하고 바로 다른 곳으로 이동하므로, 사용자에게는 이 로딩 화면만 잠깐 보이거나 아예 보이지 않을 수 있다.
  return (
    <FullPageContainer>
      <Loader />
      <LoadingText>로그인 정보를 처리 중입니다...</LoadingText>
    </FullPageContainer>
  );
}

export default OAuth2RedirectHandler;