import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "react-i18next";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

const ChatArea = styled.div`
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
  background: var(--background);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-inner);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--gray-100);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--gray-300);
    border-radius: 3px;
    
    &:hover {
      background: var(--gray-400);
    }
  }
`;

const MessageContainer = styled.div`
  margin: 1rem 0;
  animation: ${props => props.sender === "bot" ? slideIn : slideInRight} 0.4s ease-out;
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.sender === "bot" ? "flex-start" : "flex-end"};
  max-width: ${props => props.isAsianLanguage ? '70%' : '80%'};
  margin: ${props => props.sender === "bot" ? "0 0 0 0" : "0 0 0 auto"};
`;

const MessageBubble = styled.div`
  background: ${props => props.sender === "bot" ? "var(--surface)" : "linear-gradient(135deg, var(--primary), var(--secondary))"};
  color: ${props => props.sender === "bot" ? "var(--text-primary)" : "white"};
  padding: 1rem 1.5rem;
  border-radius: ${props => props.sender === "bot" ? "var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)" : "var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)"};
  box-shadow: var(--shadow-sm);
  border: ${props => props.sender === "bot" ? "1px solid var(--border-light)" : "none"};
  position: relative;
  word-break: ${props => props.isAsianLanguage ? 'break-word' : 'keep-all'};
  line-height: 1.6;
  
  &::before {
    content: '';
    position: absolute;
    ${props => props.sender === "bot" ? "left: -8px; top: 12px;" : "right: -8px; top: 12px;"}
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-${props => props.sender === "bot" ? "right" : "left"}-color: ${props => props.sender === "bot" ? "var(--surface)" : "var(--primary)"};
  }
`;

const MessageSender = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: ${props => props.sender === "bot" ? "var(--text-secondary)" : "var(--primary)"};
`;

const ImageContainer = styled.div`
  margin-top: 1rem;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: var(--transition-normal);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const StyledImage = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  transition: var(--transition-normal);
  cursor: pointer;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: var(--shadow-lg);
  }
`;

const ImageModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalImage = styled.img`
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  animation: ${scaleIn} 0.3s ease-out;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-normal);
  
  &:hover {
    background: white;
    transform: scale(1.1);
  }
`;

const OptionsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const OptionButton = styled.button`
  padding: 1rem 1.25rem;
  background: var(--surface);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-xl);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-normal);
  text-align: left;
  word-break: keep-all;
  line-height: 1.4;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: var(--transition-normal);
  }
  
  &:hover {
    border-color: var(--primary);
    background: var(--surface-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const ResetButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: var(--surface);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-xl);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-normal);
  text-align: center;
  width: 100%;
  margin-top: 1rem;
  
  &:hover {
    border-color: var(--primary);
    background: var(--surface-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const BackButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: var(--surface);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-xl);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-normal);
  text-align: center;
  width: 100%;
  margin-top: 1rem;
  
  &:hover {
    border-color: var(--primary);
    background: var(--surface-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const ChatBotContent = ({ onClose, messages, setMessages, onReset }) => {
  const { t, i18n } = useTranslation();
  const [currentOptions, setCurrentOptions] = useState([]);
  const [optionHistory, setOptionHistory] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // 현재 언어가 일본어 또는 중국어인지 확인
  const isAsianLanguage = i18n.language === 'ja' || i18n.language === 'zh';

  // 번역된 옵션들을 생성하는 함수
  const getTranslatedOptions = () => [
    {
      label: t("chatbot.questions.sellBook"),
      answer: t("chatbot.answers.sellBook")
      // image: "/images/book-register-guide.png",
      // image2: "/images/book-register-guide2.png"
    },
    {
      label: t("chatbot.questions.buyBook"),
      answer: t("chatbot.answers.buyBook")
      // image: "/images/trade-guide.png",
      // image2: "/images/trade-guide2.png"
    },
    {
      label: t("chatbot.questions.safeTrade"),
      answer: t("chatbot.answers.safeTrade")
    },
    {
      label: t("chatbot.questions.bookPrice"),
      answer: t("chatbot.answers.bookPrice")
    },
    {
      label: t("chatbot.questions.accountIssues"),
      answer: t("chatbot.answers.accountIssues"),
      subOptions: [
        {
          label: t("chatbot.subQuestions.withdraw"),
          answer: t("chatbot.subAnswers.withdraw")
          // image: "/images/register-withdraw.png"
        },
        {
          label: t("chatbot.subQuestions.signupLogin"),
          answer: t("chatbot.subAnswers.signupLogin")
        },
        {
          label: t("chatbot.subQuestions.studentVerification"),
          answer: t("chatbot.subAnswers.studentVerification")
        }
      ]
    },
    {
      label: t("chatbot.questions.wantedBoard"),
      answer: t("chatbot.answers.wantedBoard")
    },
    {
      label: t("chatbot.questions.myBookstore"),
      answer: t("chatbot.answers.myBookstore")
    },
    {
      label: t("chatbot.questions.tradeChat"),
      answer: t("chatbot.answers.tradeChat")
    },
    {
      label: t("chatbot.questions.forgotTrade"),
      answer: t("chatbot.answers.forgotTrade")
    },
    {
      label: t("chatbot.questions.mapFeature"),
      answer: t("chatbot.answers.mapFeature")
    }
  ];

  // 언어 변경 시 옵션 업데이트 및 히스토리 초기화
  useEffect(() => {
    setCurrentOptions(getTranslatedOptions());
    setOptionHistory([]); // 언어 변경 시 옵션 히스토리 초기화
  }, [t]);

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  const handleOptionClick = (option) => {
    if (option.subOptions) {
      // 서브 옵션이 있는 경우
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: option.label },
        { sender: "bot", text: option.answer }
      ]);
      setCurrentOptions(option.subOptions);
      setOptionHistory((prev) => [...prev, { 
        options: getTranslatedOptions(), 
        message: option.label,
        hasSubOptions: true,
        messageCount: 2 // 사용자 메시지 + 봇 답변
      }]);
    } else {
      // 일반 옵션인 경우
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: option.label },
        { sender: "bot", text: option.answer, image: option.image, image2: option.image2 }
      ]);
    }
  };

  const handleBackClick = () => {
    if (optionHistory.length > 0) {
      const lastHistory = optionHistory[optionHistory.length - 1];
      setCurrentOptions(lastHistory.options);
      setOptionHistory((prev) => prev.slice(0, -1));
      
      // 메시지는 삭제하지 않고 옵션 리스트만 이전으로 돌아감
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <ChatArea>
        {messages.map((msg, idx) => (
          <MessageContainer key={idx} sender={msg.sender}>
            <Message sender={msg.sender} isAsianLanguage={isAsianLanguage}>
              <MessageSender sender={msg.sender}>
                {msg.sender === "bot" ? t("chatbot.title") : t("common.me")}
              </MessageSender>
              <MessageBubble sender={msg.sender} isAsianLanguage={isAsianLanguage}>
                {msg.text.split('\n').map((line, index) => (
                  <div key={index} style={{ marginBottom: line === '' ? '0.5rem' : '0' }}>
                    {line}
                  </div>
                ))}
              </MessageBubble>
              {msg.image && (
                <ImageContainer>
                  <StyledImage 
                    src={msg.image} 
                    alt="안내 이미지"
                    onClick={() => handleImageClick(msg.image)}
                  />
                </ImageContainer>
              )}
              {msg.image2 && (
                <ImageContainer>
                  <StyledImage 
                    src={msg.image2} 
                    alt="안내 이미지 2"
                    onClick={() => handleImageClick(msg.image2)}
                  />
                </ImageContainer>
              )}
            </Message>
          </MessageContainer>
        ))}
      </ChatArea>
      
      {optionHistory.length > 0 && (
        <BackButton onClick={handleBackClick}>
          {t("chatbot.back")}
        </BackButton>
      )}
      
      <OptionsContainer>
        {currentOptions.map((option, idx) => (
          <OptionButton 
            key={idx} 
            onClick={() => handleOptionClick(option)}
          >
            {option.label}
          </OptionButton>
        ))}
      </OptionsContainer>
      
      {messages.length > 1 && (
        <ResetButton onClick={onReset}>
          {t("chatbot.reset")}
        </ResetButton>
      )}

      {selectedImage && (
        <ImageModal onClick={handleCloseImageModal}>
          <ModalImage 
            src={selectedImage} 
            alt="확대된 이미지"
            onClick={(e) => e.stopPropagation()}
          />
          <CloseButton onClick={handleCloseImageModal}>×</CloseButton>
        </ImageModal>
      )}
    </>
  );
};

export default ChatBotContent; 