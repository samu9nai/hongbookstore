import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 2rem;
  text-align: center;
`;

const ResultBox = styled.div`
  background-color: white;
  padding: 3rem 4rem;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  width: 100%;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Loader = styled.div`
  border: 4px solid #e9ecef;
  border-top: 4px solid #7c3aed;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 1.5rem auto;
`;

const StatusIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: ${props => (props.status === 'success' ? '#28a745' : '#dc3545')};
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: #343a40;
  margin-bottom: 0.5rem;
`;

const Message = styled.p`
  font-size: 1rem;
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const StyledLink = styled(Link)`
  display: inline-block;
  background-color: #7c3aed;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #6d28d9;
  }
`;

function VerificationConfirmPage() {
  // URL의 쿼리 파라미터(?token=...)를 쉽게 다루기 위한 훅
  const [searchParams] = useSearchParams();
  
  // 인증 상태를 관리 (verifying: 확인 중, success: 성공, error: 실패)
  const [status, setStatus] = useState('verifying');
  
  // 사용자에게 보여줄 메시지
  const [message, setMessage] = useState('재학생 인증 정보를 확인하고 있습니다...');

  const navigate = useNavigate();

  useEffect(() => {
    // 1. URL에서 'token' 값을 꺼내온다.
    const token = searchParams.get('token');

    // 토큰이 없으면 잘못된 접근이므로 에러 처리
    if (!token) {
      setStatus('error');
      setMessage('인증 토큰이 없습니다. 이메일의 링크가 올바른지 확인해주세요.');
      return;
    }

    // 2. 백엔드에 토큰 검증을 요청하는 함수
    const confirmVerification = async () => {
      try {
        // 우리 백엔드 API (GET /api/users/verify-student/confirm) 호출
        const response = await axios.get(`/api/users/verify-student/confirm?token=${token}`);

        // 백엔드 응답에 따라 상태와 메시지를 업데이트
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);

           // 새 토큰 저장 및 리다이렉트 로직
          const newTokens = response.data.data;
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('refreshToken', newTokens.refreshToken);

          // 2초 후에 마이페이지로 자동 이동
          setTimeout(() => {
            window.location.href = '/mypage';
          }, 2000);

        } else {
          setStatus('error');
          setMessage(response.data.message || '알 수 없는 오류로 인증에 실패했습니다.');
        }
      } catch (err) {
        // 네트워크 오류나 서버 에러(500 등) 발생 시
        setStatus('error');
        const errorMessage = err.response?.data?.message || '인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        setMessage(errorMessage);
      }
    };

    // 페이지가 로드될 때 검증 함수를 실행
    confirmVerification();
  }, [searchParams, navigate]); // 이 effect는 searchParams가 변경될 때만 다시 실행 (사실상 한번만 실행)

  // 3. 현재 상태(status)에 따라 다른 UI를 보여준다.
  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <>
            <StatusIcon status="success">
              <i className="fas fa-check-circle"></i>
            </StatusIcon>
            <Title>인증 완료!</Title>
            <Message>
              {message}<br />
              이제부터 재학생 전용 서비스를 이용할 수 있습니다.
              잠시 후 마이페이지로 이동합니다.
            </Message>
            {/* 2초의 리다이렉트 시간을 시각적으로 보여주는 프로그레스 바 */}
            <div style={{ width: '100%', background: '#e9ecef', borderRadius: '4px', height: '4px', marginTop: '1rem', overflow: 'hidden' }}>
              <div style={{ width: '100%', background: '#7c3aed', height: '100%', borderRadius: '4px', animation: 'progress 2s linear forwards' }}></div>
            </div>
            <style>{`
              @keyframes progress {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
              }
            `}</style>
          </>
        );
      case 'error':
        return (
          <>
            <StatusIcon status="error">
              <i className="fas fa-times-circle"></i>
            </StatusIcon>
            <Title>인증 실패</Title>
            <Message>
              {message}<br />
              이메일의 인증 링크가 만료되었거나 올바르지 않을 수 있습니다.
            </Message>
            <StyledLink to="/mypage">마이페이지에서 다시 시도하기</StyledLink>
          </>
        );
      default: // 'verifying' 상태
        return (
          <>
            <Loader />
            <Title>인증 확인 중</Title>
            <Message>
              이메일 링크의 유효성을 확인하고 있습니다. <br />
              페이지를 닫지 말고 잠시만 기다려주세요.
            </Message>
          </>
        );
    }
  };

  return (
    <PageContainer>
      <ResultBox>
        {renderContent()}
      </ResultBox>
    </PageContainer>
  );
}

export default VerificationConfirmPage;
