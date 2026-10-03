import styled from 'styled-components';

// 기본 카드
export const Card = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }

  @media (max-width: 600px) {
    padding: 12px;
    font-size: 0.95rem;
  }
`;

// 컴팩트 카드
export const CompactCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
`;

// 카드 헤더
export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
`;

// 카드 제목
export const CardTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 8px;
  flex: 1;
`;

// 카드 메타 정보
export const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 0.3rem;
`;

// 메타 라벨
export const MetaLabel = styled.span`
  font-weight: 600;
  color: #333;
  min-width: 80px;
`;

// 메타 값
export const MetaValue = styled.span`
  color: #444;
`;



// 카드 가격
export const CardPrice = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #007bff;
`;

// 카드 상태
export const CardStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  background: ${props => {
    switch (props.status) {
      case 'RESERVED': return '#e3f2fd';
      case 'COMPLETED': return '#e8f5e8';
      case 'CANCELLED': return '#ffebee';
      case 'SALE': return '#d4edda';
      case 'SOLD': return '#f8d7da';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'RESERVED': return '#1976d2';
      case 'COMPLETED': return '#2e7d32';
      case 'CANCELLED': return '#d32f2f';
      case 'SALE': return '#155724';
      case 'SOLD': return '#721c24';
      default: return '#666';
    }
  }};
`;

// 카드 액션
export const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

// 액션 버튼
export const ActionButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.variant === 'primary' ? '#007bff' : '#6c757d'};
  color: white;

  &:hover {
    background: ${props => props.variant === 'primary' ? '#0056b3' : '#5a6268'};
    transform: translateY(-1px);
  }
`; 