import React, { useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { AuthCtx } from '../../contexts/AuthContext';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Sidebar = styled.div`
  min-width: 200px;
  max-width: 220px;
  margin-right: 2rem;
  position: sticky;
  top: 120px;
  height: fit-content;
  z-index: 2;
`;

const SubMenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 1.5rem 1rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  animation: ${fadeIn} 0.6s ease-out 0.3s backwards;
`;

const SubMenuButton = styled.button`
  background: ${props => props.active ? 'var(--primary)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text)'};
  border: 2px solid ${props => props.active ? 'transparent' : 'var(--border)'};
  border-radius: var(--radius-lg);
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: ${props => props.$active ? 'var(--shadow-lg)' : 'none'};
  min-width: 140px;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-100%);
    transition: 0.6s;
  }

  &:hover::before {
    transform: translateX(100%);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    ${props => !props.active && `
      border-color: var(--primary);
      color: var(--primary);
      background: rgba(0, 123, 255, 0.05);
    `}
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    filter: grayscale(0.2);
  }

  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }
`;

const SidebarMenu = ({ active, onMenuClick }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthCtx);
  
  const menus = [
    { key: 'bookstore/add', label: t('sidebar.sellBook'), disabled: !user?.studentVerified, title: !user?.studentVerified ? t('noPermission') : undefined },
    { key: 'wanted', label: t('sidebar.wantedBoard') },
    { key: 'mybookstore', label: t('sidebar.myBookstore') },
    { key: 'chat', label: t('sidebar.chat') },
  ];

  return (
    <Sidebar>
      <SubMenuContainer>
        {menus.map(menu => (
          <SubMenuButton
            key={menu.key}
            $active={active === menu.key}
            onClick={() => onMenuClick(menu.key)}
            disabled={menu.disabled}
            title={menu.title}
          >
            {menu.label}
          </SubMenuButton>
        ))}
      </SubMenuContainer>
    </Sidebar>
  );
};

export const MainContent = styled.div`
  flex: 1;
  min-width: 0;
  padding: 4rem 0 2rem 0; // 적절한 상단 패딩 추가
  width: 100%;
`;

export default SidebarMenu; 