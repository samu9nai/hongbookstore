import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../i18n.js';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header.jsx';

const LoginContainer = styled.div`
  padding: 8rem 2rem 4rem;
  max-width: 500px;
  margin: 0 auto;
  background: var(--background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 2.5rem;
  font-family: 'Pretendard', 'Noto Sans', 'Apple SD Gothic Neo', sans-serif;
  border-radius: 1rem;
  letter-spacing: -1px;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-light);
  margin-bottom: 3rem;
  font-family: 'Pretendard', 'Noto Sans', 'Apple SD Gothic Neo', sans-serif;
  line-height: 1.6;
`;

const SocialButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const SocialButton = styled.button`
  width: 60px;
  height: 60px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: white;
  cursor: pointer;
  transition: var(--transition);
  letter-spacing: -0.5px;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  
  img {
    width: 32px;
    height: 32px;
    object-fit: contain;

    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  &:hover {
    background: var(--primary-dark);
    transform: translateY(-2px) scale(1.03);
  }
`;

const SocialSection = styled.div`
  margin-top: 2.5rem;
  text-align: center;
  width: 100%;
`;

const SocialTitle = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-weight: 500;
`;

const SocialButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 1rem;
`;

const SocialBtn = styled.button`
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1rem;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  img {
    width: 24px;
    height: 24px;
    transition: transform 0.2s ease;
    object-fit: contain;
  }
  
  &:hover img {
    transform: scale(1.1);
  }
  
  /* 네이버 버튼 스타일 */
  &[type="naver"] {
    background: #03C75A;
    color: white;
    &:hover {
      background: #02A94A;
    }
  }
  
  /* 카카오 버튼 스타일 */
  &[type="kakao"] {
    background: #FEE500;
    color: #3C1E1E;
    &:hover {
      background: #FDD835;
    }
  }
  
  /* 구글 버튼 스타일 */
  &[type="google"] {
    background: white;
    color: #757575;
    border: 1px solid #dadce0;
    &:hover {
      background: #f8f9fa;
      border-color: #c6c6c6;
    }
  }
`;

const SocialBtnText = styled.span`
  font-family: 'Pretendard', 'Noto Sans', 'Apple SD Gothic Neo', sans-serif;
  font-weight: 600;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.9rem;
  margin-top: 2rem;
  padding: 0.75rem 1.25rem;
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 0.5rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
`;

function Login() {
  const { t, i18n } = useTranslation();
  const [errorMsg, setErrorMsg] = useState('');
  const [searchParams] = useSearchParams(); // URL 파라미터 읽기

  const [lang, setLang] = useState(i18n.language || 'ko');

  // 소셜 로그인 실패 시, URL에 담겨온 에러 메시지를 화면에 표시
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setErrorMsg(t('loginNs.socialLoginFailed'));
    }
  }, [searchParams]);

  // 소셜 로그인 버튼 클릭 시, 백엔드의 인증 URL로 이동시키는 함수
  const handleSocialLogin = (provider) => {
    if (typeof window === 'undefined') return;

    const env = import.meta.env || {};
    const isLocalDev = window.location.port === '5173';
    const currentOrigin = `${window.location.protocol}//${window.location.host}`;
    const backendOrigin = env?.VITE_BACKEND_ORIGIN
      ? env.VITE_BACKEND_ORIGIN.replace(/\/$/, '')
      : '';

    const devFallbackOrigin = (() => {
      if (backendOrigin) return backendOrigin;
      if (env?.VITE_API_BASE) {
        try {
          return new URL(env.VITE_API_BASE, window.location.origin).origin;
        } catch (_) {
          return '';
        }
      }
      return '';
    })();

    if (isLocalDev) {
      const origin = devFallbackOrigin || 'http://localhost:8080';
      window.location.href = `${origin}/oauth2/authorization/${provider}`;
      return;
    }

    if (backendOrigin && backendOrigin !== currentOrigin) {
      // Production(frontend)과 백엔드 오리진이 다르면 백엔드 도메인으로 바로 이동해야 쿠키가 올바르게 저장됨
      window.location.href = `${backendOrigin}/oauth2/authorization/${provider}`;
      return;
    }

    if (backendOrigin) {
      window.location.href = `/oauth2/authorization/${provider}`;
      return;
    }

    window.location.href = `/api/oauth2/authorization/${provider}`;
  };

  // 언어 변경 핸들러
  const handleLangChange = e => {
    setLang(e.target.value);
    i18n.changeLanguage(e.target.value);
  };

  return (
    <>
      <Header lang={lang} onLangChange={handleLangChange} />
      <LoginContainer>
        <Title>{t('socialLoginTitle')}</Title>
        <Subtitle>
          {t('socialLoginDesc')}
        </Subtitle>

        {errorMsg && <ErrorMessage>{errorMsg}</ErrorMessage>}
        
        <SocialButtonContainer>
        <SocialButton aria-label={t('loginNs.loginWithNaver')} onClick={() => handleSocialLogin('naver')}>
          <img src="/images/naver.png" alt="Naver" />
        </SocialButton>
          
        <SocialButton aria-label={t('loginNs.loginWithKakao')} onClick={() => handleSocialLogin('kakao')}>
          <img src="/images/kakao.png" alt="Kakao" />
        </SocialButton>
          
        <SocialButton aria-label={t('loginNs.loginWithGoogle')} onClick={() => handleSocialLogin('google')}>
          <img src="/images/google.png" alt="Google" />
        </SocialButton>
        </SocialButtonContainer>
      </LoginContainer>
    </>
  );
}

export default Login; 
