import styled from 'styled-components';

// 공통 컨테이너
export const Container = styled.div`
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-16);
  box-sizing: border-box;

  @media (max-width: 1440px) {
    padding: 0 var(--space-12);
  }

  @media (max-width: 1024px) {
    padding: 0 var(--space-8);
  }

  @media (max-width: 768px) {
    padding: 0 var(--space-6);
  }

  @media (max-width: 480px) {
    padding: 0 var(--space-4);
  }
`;

// 페이지 컨테이너
export const PageContainer = styled.div`
  padding: 2rem;
  box-sizing: border-box;
  padding-top: 96px;
  background: var(--background);
  min-height: 100vh;
  
  @media (max-width: 900px) {
    padding-top: 72px;
    padding: 1rem;
  }
  
  @media (max-width: 600px) {
    padding-top: 56px;
    padding: 0.5rem;
  }
`;

// 폼 컨테이너
export const FormContainer = styled.div`
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
  
  @media (max-width: 600px) {
    padding: 4rem 0.5rem 2rem;
    max-width: 98vw;
  }
`;

// 그리드 레이아웃
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

// 플렉스 레이아웃
export const Flex = styled.div`
  display: flex;
  align-items: ${props => props.align || 'center'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => props.gap || '0'};
  flex-direction: ${props => props.direction || 'row'};
  flex-wrap: ${props => props.wrap || 'nowrap'};
`;

// 섹션
export const Section = styled.section`
  margin-bottom: ${props => props.marginBottom || '2rem'};
  padding: ${props => props.padding || '0'};
`;

// 헤더
export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
`;

// 뒤로가기 버튼
export const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
  margin-bottom: 1rem;

  &:hover {
    background: #5a6268;
  }
`;

// 제목
export const Title = styled.h2`
  font-size: ${props => props.size || '2rem'};
  font-weight: ${props => props.weight || '600'};
  color: ${props => props.color || 'var(--text-primary)'};
  margin-bottom: ${props => props.marginBottom || '1rem'};
  text-align: ${props => props.align || 'left'};
`;

// 빈 상태
export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

export const EmptyIcon = styled.div`
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 20px;
`; 