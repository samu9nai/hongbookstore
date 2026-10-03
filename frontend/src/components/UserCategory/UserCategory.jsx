import React, { useState } from 'react';
import styled from 'styled-components';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { useTranslation } from 'react-i18next';

const UserCategory = ({ categories, onAddCategory, onDeleteCategory, onUpdateCategory }) => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddModal(false);
    }
  };

  const handleStartEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onUpdateCategory(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setNewCategoryName('');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewCategoryName('');
  };

  return (
    <CategoryContainer>
      <CategoryHeader>
        <h3>{t('map.myCategories')}</h3>
        <AddCategoryButton onClick={openAddModal}>
          <FaPlus /> {t('map.addCategory')}
        </AddCategoryButton>
      </CategoryHeader>

      <CategoryList>
        {categories.map((category) => (
          <CategoryItem key={category.id}>
            {editingId === category.id ? (
              <EditForm>
                <EditInput
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
                <EditButton onClick={handleSaveEdit}>
                  <FaCheck />
                </EditButton>
                <CancelButton onClick={handleCancelEdit}>
                  <FaTimes />
                </CancelButton>
              </EditForm>
            ) : (
              <>
                <CategoryName>{category.name}</CategoryName>
                <CategoryActions>
                  <EditButton onClick={() => handleStartEdit(category)}>
                    <FaEdit />
                  </EditButton>
                  <DeleteButton onClick={() => onDeleteCategory(category.id)}>
                    <FaTrash />
                  </DeleteButton>
                </CategoryActions>
              </>
            )}
          </CategoryItem>
        ))}
      </CategoryList>

      {/* 카테고리 추가 모달 */}
      {showAddModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>{t('map.addNewCategory')}</h3>
              <CloseButton onClick={closeAddModal}>
                <IoMdClose />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <Input
                type="text"
                placeholder={t('map.enterCategoryName')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                autoFocus
              />
              <ButtonGroup>
                <CancelModalButton onClick={closeAddModal}>
                  {t('common.cancel')}
                </CancelModalButton>
                <AddModalButton onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  {t('map.add')}
                </AddModalButton>
              </ButtonGroup>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </CategoryContainer>
  );
};

const CategoryContainer = styled.div`
  margin-bottom: 20px;
`;

const CategoryHeader = styled.div`
  margin-bottom: 15px;
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
`;

const AddCategoryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #0056b3;
  }
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CategoryItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
`;

const CategoryName = styled.span`
  font-size: 14px;
  color: #333;
  flex: 1;
`;

const CategoryActions = styled.div`
  display: flex;
  gap: 4px;
`;

const EditForm = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
`;

const EditInput = styled.input`
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const EditButton = styled.button`
  padding: 6px 8px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background: #218838;
  }
`;

const CancelButton = styled.button`
  padding: 6px 8px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background: #5a6268;
  }
`;

const DeleteButton = styled.button`
  padding: 6px 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background: #c82333;
  }
`;

// 모달 스타일
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
  margin-bottom: 24px;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const CancelModalButton = styled.button`
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    background: #5a6268;
  }
`;

const AddModalButton = styled.button`
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background: #0056b3;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export default UserCategory; 