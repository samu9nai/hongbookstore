import React from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const ModalOverlay = styled.div`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const WarningIcon = styled.div`
  color: #ffc107;
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
`;

const ModalMessage = styled.p`
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;

  &.primary {
    background: #007bff;
    color: white;

    &:hover {
      background: #0056b3;
    }
  }

  &.secondary {
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
    }
  }

  &.danger {
    background: #dc3545;
    color: white;

    &:hover {
      background: #c82333;
    }
  }

  &.success {
    background: #28a745;
    color: white;

    &:hover {
      background: #218838;
    }
  }
`;

const WarningModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onCancel, 
  onSaveDraft,
  type = 'wanted', // 'wanted' or 'sale'
  title = '',
  message = '',
  confirmText = '',
  cancelText = '',
  showSaveDraft = false 
}) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  const getDefaultContent = () => {
    if (type === 'wanted') {
      return {
        title: t('warningModal.unsavedChanges.title'),
        message: t('warningModal.unsavedChanges.wantedMessage')
      };
    } else {
      return {
        title: t('warningModal.unsavedChanges.title'),
        message: t('warningModal.unsavedChanges.saleMessage')
      };
    }
  };

  const content = {
    title: title || getDefaultContent().title,
    message: message || getDefaultContent().message
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <WarningIcon>
          <FaExclamationTriangle />
        </WarningIcon>
        
        <ModalTitle>{content.title}</ModalTitle>
        <ModalMessage>{content.message}</ModalMessage>
        
        <ButtonGroup>
          {showSaveDraft && type === 'sale' && (
            <Button 
              className="success" 
              onClick={onSaveDraft}
            >
              {t('warningModal.unsavedChanges.saveDraft')}
            </Button>
          )}
          
          <Button 
            className="secondary" 
            onClick={onCancel}
          >
            {cancelText || t('warningModal.unsavedChanges.continueWriting')}
          </Button>
          
          <Button 
            className="danger" 
            onClick={onConfirm}
          >
            {confirmText || t('warningModal.unsavedChanges.exit')}
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default WarningModal; 