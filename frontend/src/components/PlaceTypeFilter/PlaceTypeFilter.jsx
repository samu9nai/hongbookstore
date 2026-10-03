import React from 'react'
import styled from 'styled-components'

const PlaceTypeFilter = ({ selectedType, onTypeSelect }) => {
  const placeTypes = [
    { id: 'all', name: '전체', icon: '📍', color: '#6c757d' },
    { id: 'restaurant', name: '식당', icon: '🍽️', color: '#FF6B6B' },
    { id: 'cafe', name: '카페', icon: '☕', color: '#4ECDC4' },
    { id: 'partner', name: '홍익대 제휴', icon: '🤝', color: '#FFB3BA' },
    { id: 'print', name: '인쇄', icon: '🖨️', color: '#A8E6CF' },
    { id: 'bookstore', name: '서점', icon: '📚', color: '#45B7D1' },
    { id: 'entertainment', name: '놀거리', icon: '🎮', color: '#FFEAA7' },
    { id: 'other', name: '기타', icon: '📌', color: '#96CEB4' }
  ]

  return (
    <FilterContainer>
      <FilterTitle>장소 유형</FilterTitle>
      <FilterGrid>
        {placeTypes.map(type => (
          <FilterButton
            key={type.id}
            $isSelected={selectedType === type.id}
            onClick={() => onTypeSelect(type.id)}
            $color={type.color}>
            <TypeIcon $isSelected={selectedType === type.id}>
              {type.icon}
            </TypeIcon>
            <TypeName>{type.name}</TypeName>
          </FilterButton>
        ))}
      </FilterGrid>
    </FilterContainer>
  )
}

const FilterContainer = styled.div`
  margin-bottom: 0;
`

const FilterTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  text-align: center;
  letter-spacing: 0.3px;
  opacity: 0.8;
`

const FilterGrid = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 580px;
`

const FilterButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 6px;
  background: ${props => (props.$isSelected ? props.$color : 'rgba(255, 255, 255, 0.7)')};
  color: ${props => (props.$isSelected ? 'white' : '#444')};
  border: 1.5px solid
    ${props => (props.$isSelected ? props.$color : 'rgba(0, 0, 0, 0.06)')};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 10px;
  min-width: 50px;
  position: relative;
  overflow: hidden;

  &:hover {
    background: ${props => (props.$isSelected ? props.$color : 'rgba(255, 255, 255, 0.9)')};
    transform: translateY(-1px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    border-color: ${props => (props.$isSelected ? props.$color : 'rgba(0, 0, 0, 0.1)')};
  }

  &:active {
    transform: translateY(0);
  }
`

const TypeIcon = styled.span`
  font-size: 16px;
  margin-bottom: 3px;
  filter: ${props => (props.$isSelected ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none')};
`

const TypeName = styled.span`
  font-weight: 500;
  font-size: 9px;
  letter-spacing: 0.2px;
`

export default PlaceTypeFilter
