import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ChatBotContent from '../ChatBotModal/ChatBotContent';
import { useTranslation } from 'react-i18next';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideInFromRight = keyframes`
  from { 
    transform: translateX(100%); 
    opacity: 0; 
  }
  to { 
    transform: translateX(0); 
    opacity: 1; 
  }
`;

const slideOutToRight = keyframes`
  from { 
    transform: translateX(0); 
    opacity: 1; 
  }
  to { 
    transform: translateX(100%); 
    opacity: 0; 
  }
`;

const FloatingButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 9999;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 60px;
    height: 60px;
  }
`;

const SideModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 10000;
  pointer-events: none;
`;

const SideModalContent = styled.div`
  position: fixed;
  top: 50%;
  right: 2rem;
  transform: translateY(-50%);
  width: 350px;
  max-height: 80vh;
  background: var(--surface);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: ${slideInFromRight} 0.3s ease-out;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  pointer-events: auto;
  
  @media (max-width: 768px) {
    width: 90vw;
    right: 1rem;
    left: 1rem;
    max-height: 70vh;
  }
`;

const SideModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-light);
  background: var(--surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
`;

const SideModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
  
  &:hover {
    background: var(--gray-100);
    color: var(--text-primary);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const SideModalBody = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
  
  @media (max-width: 768px) {
    max-height: calc(70vh - 80px);
  }
`;

const FloatingChatBot = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: t("chatbot.welcome") }
  ]);
  const [chatKey, setChatKey] = useState(0); // ChatBotContent의 상태를 관리하기 위한 key

  // 언어 변경 시 초기 메시지 업데이트
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === "bot") {
      setMessages([
        { sender: "bot", text: t("chatbot.welcome") }
      ]);
    }
  }, [i18n.language, t]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleReset = () => {
    setMessages([
      { sender: "bot", text: t("chatbot.welcome") }
    ]);
    // ChatBotContent의 상태도 초기화하기 위해 key를 변경
    setChatKey(prev => prev + 1);
  };

  return (
    <>
      <FloatingButton onClick={handleOpen}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
          <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12Z" fill="currentColor"/>
        </svg>
      </FloatingButton>
      
      {isOpen && (
        <SideModalOverlay>
          <SideModalContent>
            <SideModalHeader>
              <SideModalTitle>{t("chatbot.title")}</SideModalTitle>
              <CloseButton onClick={handleClose}>×</CloseButton>
            </SideModalHeader>
            <SideModalBody>
              <ChatBotContent 
                key={chatKey} // ChatBotContent의 상태를 관리하기 위해 key 추가
                onClose={handleClose} 
                messages={messages}
                setMessages={setMessages}
                onReset={handleReset}
              />
            </SideModalBody>
          </SideModalContent>
        </SideModalOverlay>
      )}
    </>
  );
};

export default FloatingChatBot; 