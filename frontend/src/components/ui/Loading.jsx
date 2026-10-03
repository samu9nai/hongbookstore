import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const bookFlip = keyframes`
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
`;

const bookStack = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(2deg);
  }
  50% {
    transform: translateY(-5px) rotate(-1deg);
  }
  75% {
    transform: translateY(-8px) rotate(1deg);
  }
`;

const textTyping = keyframes`
  0%, 50%, 100% {
    opacity: 1;
  }
  25%, 75% {
    opacity: 0.3;
  }
`;

const floating = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const Spinner = styled.div`
  width: ${props => props.$size || '24px'};
  height: ${props => props.$size || '24px'};
  border: 2px solid var(--border-light);
  border-top: 2px solid var(--primary);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Dots = styled.div`
  display: flex;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  animation: ${bounce} 1.4s ease-in-out infinite both;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }
`;

const Pulse = styled.div`
  width: ${props => props.$size || '24px'};
  height: ${props => props.$size || '24px'};
  border-radius: 50%;
  background: var(--primary);
  animation: ${pulse} 1s ease-in-out infinite;
`;

const Shimmer = styled.div`
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  animation: shimmer 1.5s infinite;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;

  ${props => props.$fullScreen && css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    z-index: var(--z-modal);
  `}

  ${props => props.$overlay && css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(2px);
    z-index: 1;
  `}
`;

const LoadingText = styled.span`
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
`;

// 홍책방 전용 로딩 컴포넌트들
const BookIcon = styled.div`
  font-size: ${props => props.$size || '32px'};
  animation: ${floating} 2s ease-in-out infinite;
  color: var(--primary);
`;

const BookStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const Book = styled.div`
  width: ${props => props.$size || '24px'};
  height: ${props => props.$size || '18px'};
  background: linear-gradient(135deg, var(--primary), #8B5CF6);
  border-radius: 2px;
  animation: ${bookStack} 1.5s ease-in-out infinite;
  animation-delay: ${props => props.$delay || '0s'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HongBookLoading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
`;

const HongBookText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  
  .dot {
    animation: ${textTyping} 1.5s ease-in-out infinite;
    animation-delay: ${props => props.$delay || '0s'};
  }
`;

const HongBookSubtext = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.4;
`;

const BookFlip = styled.div`
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '30px'};
  background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
  border-radius: 4px;
  animation: ${bookFlip} 2s ease-in-out infinite;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
    border-radius: 4px;
  }
`;

const Loading = ({ 
  type = 'hongbook', 
  size = 'md', 
  text, 
  fullScreen = false, 
  overlay = false,
  className,
  subtext
}) => {
  const { t } = useTranslation();
  const sizeMap = {
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px'
  };

  const renderLoader = () => {
    switch (type) {
      case 'hongbook':
        return (
          <HongBookLoading>
            <BookIcon $size={sizeMap[size]}>📚</BookIcon>
            <HongBookText>
              {t('title')}
              <span className="dot">.</span>
              <span className="dot" style={{animationDelay: '0.2s'}}>.</span>
              <span className="dot" style={{animationDelay: '0.4s'}}>.</span>
            </HongBookText>
            {subtext && <HongBookSubtext>{subtext}</HongBookSubtext>}
          </HongBookLoading>
        );
      case 'bookstack':
        return (
          <HongBookLoading>
            <BookStack>
              <Book $size={sizeMap[size]} $delay="0s" />
              <Book $size={sizeMap[size]} $delay="0.1s" />
              <Book $size={sizeMap[size]} $delay="0.2s" />
            </BookStack>
            <HongBookText>
              {t('searchingBooks')}
              <span className="dot">.</span>
              <span className="dot" style={{animationDelay: '0.2s'}}>.</span>
              <span className="dot" style={{animationDelay: '0.4s'}}>.</span>
            </HongBookText>
            {subtext && <HongBookSubtext>{subtext}</HongBookSubtext>}
          </HongBookLoading>
        );
      case 'bookflip':
        return (
          <HongBookLoading>
            <BookFlip $size={sizeMap[size]} />
            <HongBookText>
              {t('flipPage')}
              <span className="dot">.</span>
              <span className="dot" style={{animationDelay: '0.2s'}}>.</span>
              <span className="dot" style={{animationDelay: '0.4s'}}>.</span>
            </HongBookText>
            {subtext && <HongBookSubtext>{subtext}</HongBookSubtext>}
          </HongBookLoading>
        );
      case 'dots':
        return (
          <Dots>
            <Dot />
            <Dot />
            <Dot />
          </Dots>
        );
      case 'pulse':
        return <Pulse $size={sizeMap[size]} />;
      case 'shimmer':
        return <Shimmer />;
      case 'spinner':
      default:
        return <Spinner $size={sizeMap[size]} />;
    }
  };

  // 홍책방 스타일 로딩은 별도 컨테이너 사용
  if (['hongbook', 'bookstack', 'bookflip'].includes(type)) {
    return (
      <LoadingContainer 
        $fullScreen={fullScreen} 
        $overlay={overlay}
        className={className}
      >
        {renderLoader()}
      </LoadingContainer>
    );
  }

  return (
    <LoadingContainer 
      $fullScreen={fullScreen} 
      $overlay={overlay}
      className={className}
    >
      {renderLoader()}
      {text && <LoadingText>{text}</LoadingText>}
    </LoadingContainer>
  );
};

export default Loading; 