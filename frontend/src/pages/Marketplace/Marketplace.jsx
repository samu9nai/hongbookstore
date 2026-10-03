
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SidebarMenu, { MainContent } from '../../components/SidebarMenu/SidebarMenu';
import { SearchButton as OriginalSearchButton, FilterButton as OriginalFilterButton, Loading } from '../../components/ui';
import axios from 'axios';

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const MarketplaceContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 32px;
  box-sizing: border-box;
  padding-top: 0;
  @media (max-width: 900px) {
    padding: 16px 8px;
    padding-top: 0;
  }
  @media (max-width: 600px) {
    padding: 8px 2px;
    padding-top: 0;
  }
`;

const Header = styled.div`
  margin-bottom: 3rem;
  text-align: center;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Description = styled.p`
  font-size: 1.25rem;
  color: var(--text-light);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
  padding-bottom: 0.3em;
  word-break: keep-all;
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
  animation: ${fadeIn} 0.6s ease-out 0.2s backwards;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchBar = styled.div`
  flex: 1;
  max-width: 500px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  input {
    flex: 1;
    padding: 1.25rem 1.5rem;
    padding-left: 4rem;
    border: 2px solid var(--border);
    border-radius: var(--radius-xl);
    font-size: 1.1rem;
    transition: var(--transition);
    background: var(--surface);
    box-shadow: var(--shadow-sm);
    color: var(--text);

    &::placeholder {
      color: var(--text-light);
      font-weight: 400;
    }

    &:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
      transform: translateY(-1px);
    }

    &:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow);
    }
  }
`;

const SearchButton = styled(OriginalSearchButton)``;
const FilterButton = styled(OriginalFilterButton)``;

const SearchIcon = styled.div`
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-shadow: var(--shadow-sm);

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border: 2px solid white;
    border-radius: 50%;
    position: relative;
  }

  &::after {
    content: '';
    width: 2px;
    height: 6px;
    background: white;
    position: absolute;
    bottom: 6px;
    right: 6px;
    transform: rotate(45deg);
  }
`;

const FilterIcon = styled.div`
  width: 20px;
  height: 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: currentColor;
    border-radius: 2px;
    box-shadow: 0 6px 0 currentColor, 0 12px 0 currentColor;
  }
`;

const FilterPopover = styled.div`
  position: absolute;
  top: 110%;
  right: 0;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  z-index: 10;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 1rem;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 0.5rem;
`;

const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1.5px solid #E5E7EB;
  font-size: 0.95rem;
  font-weight: 500;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }

  &:hover {
    border-color: #D1D5DB;
  }
`;

const PriceInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PriceInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid #E5E7EB;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  text-align: right;
  -moz-appearance: textfield; /* Firefox */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const FilterApplyButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
`;

const CategoryContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    gap: 0.75rem;
    width: 100%;
    justify-content: flex-start;
  }
`;

const CategorySelect = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: var(--transition);
  min-width: 150px;
  font-weight: 500;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }

  &:hover {
    border-color: var(--primary);
  }

  @media (max-width: 768px) {
    min-width: 120px;
    font-size: 0.9rem;
  }
`;

const BookGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  width: 100%;
  animation: ${fadeIn} 0.6s ease-out 0.4s backwards;
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const BookCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
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
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: var(--primary);
  }
`;

const BookImage = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease;
  box-shadow: var(--shadow-sm);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover::after {
    transform: translateX(100%);
  }
`;

const BookInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const BookCardTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BookSeller = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
`;

const BookAuthor = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
`;

const BookPrice = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
`;

const LikeCount = styled.span`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: var(--text-light);
  &::before { content: '❤'; color: #ff4757; }
`;

const SkeletonCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const SkeletonImage = styled.div`
  width: 100%;
  height: 200px;
  background: rgba(240, 240, 240, 0.8);
  animation: ${shimmer} 1.5s infinite;
  border-radius: 12px;
  margin-bottom: 1rem;
`;

const SkeletonText = styled.div`
  height: 1rem;
  background: rgba(240, 240, 240, 0.8);
  animation: ${shimmer} 1.5s infinite;
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;

  &:nth-child(2) {
    width: 70%;
  }

  &:nth-child(3) {
    width: 50%;
  }
`;

const CurrentPrice = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary);
`;

const OriginalPrice = styled.span`
  font-size: 0.9rem;
  color: var(--text-light);
  text-decoration: line-through;
`;

const DiscountBadge = styled.span`
  background: #ff6b6b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const LikeButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: ${props => props.$liked ? '#ff4757' : '#666'};
  box-shadow: var(--shadow);
  z-index: 2;

  &:hover {
    background: white;
    transform: scale(1.1);
    box-shadow: var(--shadow-lg);
  }

  &::before {
    content: ${props => props.$liked ? '"❤️"' : '"🤍"'};
    font-size: 1.2rem;
  }
`;

const BookMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
`;

const Condition = styled.span`
  background: ${props => props.$bgColor};
  color: ${props => props.$color};
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid ${props => props.$color}20;
`;

const Location = styled.span`
  color: var(--text-light);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &::before {
    content: '📍';
  }
`;

const LoadingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  width: 100%;
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-light);
  font-size: 1.1rem;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border);
  margin: 2rem 0;
  
  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--text-light);
  }
  
  .title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text);
  }
  
  .description {
    color: var(--text-light);
    line-height: 1.6;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
  gap: 0.5rem;
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: ${props => props.$active ? 'var(--primary)' : 'white'};
  color: ${props => props.$active ? 'white' : 'var(--text)'};
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: ${props => props.$active ? '600' : '400'};
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const SectionContainer = styled.div`
  background: #f8f9fa;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

const PopularSectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

// 할인율에 따른 책 상태 반환 함수
// 현재는 할인율을 기준으로 책 상태를 자동 판단:
// - 할인율 20% 이하: 상 (좋은 상태)
// - 할인율 21-40%: 중 (보통 상태)  
// - 할인율 41% 이상: 하 (낮은 상태)
// 
// TODO: 실제 구현 시에는 사용자가 직접 책 상태를 평가할 수 있도록 별도의 상태 입력 필드를 제공
const getBookCondition = (discountRate, t) => {
  if (discountRate <= 30) return { text: t('marketplace.bookCondition.excellent'), color: '#28a745', bgColor: '#d4edda' };
  if (discountRate <= 50) return { text: t('marketplace.bookCondition.good'), color: '#ffc107', bgColor: '#fff3cd' };
  return { text: t('marketplace.bookCondition.fair'), color: '#dc3545', bgColor: '#f8d7da' };
};

// 에러 메시지 컴포넌트
const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #dc3545;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 1rem;
  margin: 2rem 0;
  font-size: 1rem;
  line-height: 1.5;
`;

// 로딩 메시지 컴포넌트
const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
  font-size: 1.1rem;
`;

const getCategories = (t) => ({
  [t('categories.Major')]: {
    [t('categories.colleges.business')]: [t('categories.departments.business')],
    [t('categories.colleges.engineering')]: [t('categories.departments.electronics'), t('categories.departments.materials'), t('categories.departments.chemical'), t('categories.departments.computer'), t('categories.departments.industrial'), t('categories.departments.mechanical'), t('categories.departments.civil')],
    [t('categories.colleges.law')]: [t('categories.departments.law')],
    [t('categories.colleges.art')]: [t('categories.departments.eastern'), t('categories.departments.painting'), t('categories.departments.printmaking'), t('categories.departments.sculpture'), t('categories.departments.visualDesign'), t('categories.departments.industrialDesign'), t('categories.departments.metalwork'), t('categories.departments.ceramics'), t('categories.departments.woodwork'), t('categories.departments.textile'), t('categories.departments.artHistory')],
    [t('categories.colleges.design')]: [t('categories.departments.designManagement'), t('categories.departments.artManagement')],
    [t('categories.colleges.performing')]: [t('categories.departments.musical'), t('categories.departments.practicalMusic')],
    [t('categories.colleges.economics')]: [t('categories.departments.economics')],
    [t('categories.colleges.education')]: [t('categories.departments.mathEducation'), t('categories.departments.koreanEducation'), t('categories.departments.englishEducation'), t('categories.departments.historyEducation'), t('categories.departments.education')],
    [t('categories.colleges.liberalArts')]: [t('categories.departments.englishLiterature'), t('categories.departments.germanLiterature'), t('categories.departments.frenchLiterature'), t('categories.departments.koreanLiterature')],
    [t('categories.colleges.architecture')]: [t('categories.departments.architecture'), t('categories.departments.interiorArchitecture'), t('categories.departments.urbanPlanning')]
  },
  [t('categories.liberal')]: {
    [t('categories.liberalArts.abeek')]: [t('categories.liberalArts.abeek')],
    [t('categories.liberalArts.humanities')]: [t('categories.liberalArts.humanities')],
    [t('categories.liberalArts.english')]: [t('categories.liberalArts.english')],
    [t('categories.liberalArts.social')]: [t('categories.liberalArts.social')],
    [t('categories.liberalArts.secondLanguage')]: [t('categories.liberalArts.secondLanguage')],
    [t('categories.liberalArts.natural')]: [t('categories.liberalArts.natural')],
    [t('categories.liberalArts.physical')]: [t('categories.liberalArts.physical')],
    [t('categories.liberalArts.teaching')]: [t('categories.liberalArts.teaching')]
  }
});

// Handle both Spring Page<T> and array responses so the UI always receives a safe list.
const normalizePostListResponse = (payload, pageSize) => {
  if (payload && typeof payload === 'object') {
    const directContent = Array.isArray(payload.content) ? payload.content : null;
    const wrappedContent = Array.isArray(payload?.data?.content) ? payload.data.content : null;
    const fallbackArray = Array.isArray(payload.data) ? payload.data : null;

    const items = (directContent || wrappedContent || fallbackArray || []).filter(Boolean);

    if (directContent || wrappedContent || fallbackArray) {
      const source = directContent ? payload : payload?.data ?? {};
      if (typeof source.last === 'boolean') {
        return { items, isLast: source.last };
      }
      if (typeof source.number === 'number' && typeof source.totalPages === 'number' && source.totalPages > 0) {
        return { items, isLast: source.number + 1 >= source.totalPages };
      }
      if (typeof source.totalElements === 'number' && typeof source.size === 'number' && source.size > 0) {
        const fetched = (source.number ?? 0) * source.size + items.length;
        return { items, isLast: fetched >= source.totalElements };
      }
      if (pageSize) {
        return { items, isLast: items.length < pageSize };
      }
      return { items, isLast: true };
    }
  }

  const arrayPayload = Array.isArray(payload) ? payload.filter(Boolean) : [];
  if (pageSize) {
    return { items: arrayPayload, isLast: arrayPayload.length < pageSize };
  }
  return { items: arrayPayload, isLast: true };
};

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ViewMoreButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
  position: relative;
  overflow: hidden;

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

const PopularBooksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 900px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const SearchResultsSection = styled.div`
  margin-top: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const SearchResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border);
`;

const SearchResultsTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  
  .search-term {
    color: var(--primary);
    font-weight: 800;
  }
  
  .result-count {
    color: var(--text-light);
    font-weight: 400;
    font-size: 1rem;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    transform: translateY(-1px);
  }
  
  .icon {
    font-size: 1.1rem;
  }
`;

// 인증 토큰을 가져오는 헬퍼 함수
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// 이미지 로딩 실패 시 안정적으로 대체 컨텐츠를 보여주기 위한 별도 컴포넌트
const BookImageWithFallback = ({ src, alt, t }) => {
  const [hasError, setHasError] = useState(false);

  // 부모 컴포넌트에서 src prop이 변경될 때마다 에러 상태를 초기화
  useEffect(() => {
    if (src) {
      setHasError(false);
    }
  }, [src]);

  const handleError = () => {
    setHasError(true);
  };

  return (
    <BookImage className="book-image">
      {src && !hasError ? (
        <img src={src} alt={alt} onError={handleError} />
        ) : (
            <div style={{ color: 'white', textAlign: 'center' }}>📚<br/>{t('marketplace.noImage')}</div>
        )}
    </BookImage>
  );
};

const Marketplace = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 사이드바 메뉴 핸들러
  const handleSidebarMenu = (menu) => {
    switch (menu) {
      case 'bookstore/add':
        navigate('/bookstore/add');
        break;
      case 'wanted':
        navigate('/wanted');
        break;
      case 'mybookstore':
        navigate('/bookstore');
        break;
      case 'chat':
        navigate('/chat');
        break;
      default:
        break;
    }
  };

  // API 데이터 상태
  const [posts, setPosts] = useState([]); // API로부터 받아온 게시글 목록
  const [page, setPage] = useState(0); // 현재 페이지 번호 (무한 스크롤용)
  const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지 여부
  const [isLoading, setIsLoading] = useState(true); // 데이터 로딩 상태
  const [likedPostIds, setLikedPostIds] = useState(new Set()); // 찜한 게시글 ID Set
  const [error, setError] = useState(''); // 에러 상태

  // 검색어 입력 상태 분리
  const [searchQuery, setSearchQuery] = useState(''); // 사용자가 입력하는 검색어 (UI 표시용)

  // 검색 및 필터 상태
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'createdAt,desc',
  });

  // '적용하기'를 누르기 전 임시 필터 값
  const [tempFilters, setTempFilters] = useState({
    minPrice: '',
    maxPrice: '',
  });
  
  const [filterOpen, setFilterOpen] = useState(false); // 필터 팝오버 표시 여부
  const filterRef = useRef();
  const observerRef = useRef(); // Intersection Observer를 위한 ref

  // 내가 찜한 글 목록을 불러와서 Set에 저장하는 함수
  const fetchMyLikes = useCallback(async () => {
    // 로그인 상태가 아니면 실행하지 않음
    if (!localStorage.getItem('accessToken')) return;
    try {
      const response = await axios.get('/api/my/likes', { headers: getAuthHeader() });
      const likedIds = new Set(response.data.map(post => post.postId));
      setLikedPostIds(likedIds);
    } catch (error) {
    }
  }, []);

  // API 호출 로직
  const fetchPosts = useCallback(async (params, pageToFetch = 0) => {
    setIsLoading(true);
    if (pageToFetch === 0) {
      setError('');
    }
    try {
      const activeParams = {
        page: pageToFetch,
        size: 12,
        sort: params.sort,
      };
      if (params.query) activeParams.query = params.query;
      if (params.category) activeParams.category = params.category;
      if (params.minPrice) activeParams.minPrice = params.minPrice;
      if (params.maxPrice) activeParams.maxPrice = params.maxPrice;

      const { data } = await axios.get('/api/posts', {
        params: activeParams,
        timeout: 10000
      });

      const { items, isLast } = normalizePostListResponse(data, activeParams.size);
      const safeItems = Array.isArray(items) ? items : [];
      const expectedPageSize = typeof activeParams.size === 'number' ? activeParams.size : (safeItems.length || 0);
      const hasMoreFallback = expectedPageSize > 0 ? safeItems.length >= expectedPageSize : false;
      const shouldContinue = typeof isLast === 'boolean' ? !isLast : hasMoreFallback;

      setPosts(prev => pageToFetch === 0 ? safeItems : [...prev, ...safeItems]);
      setHasMore(shouldContinue);
      setPage(pageToFetch + 1);

    } catch (error) {
      if (pageToFetch === 0) {
        setPosts([]);
      }
      setHasMore(false);

      if (error.code === 'ECONNABORTED') {
        setError('요청 시간이 초과되었어요. 네트워크 상태를 확인해주세요 📡');
      } else if (error.response?.status === 404) {
        setError('해당 페이지를 찾을 수 없어요 🤔');
      } else if (error.response?.status >= 500) {
        setError('서버에 문제가 발생했어요. 잠시 후 다시 시도해주세요 🛠️');
      } else {
        setError('게시글을 불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해주세요 😅');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 검색 조건이 바뀔 때마다, 데이터를 초기화하고 첫 페이지부터 다시 로드
  useEffect(() => {
    setPosts([]); // 기존 목록 비우기
    setPage(0);   // 페이지 번호 0으로 초기화
    setHasMore(true); // 더 불러올 데이터가 있다고 가정
    fetchPosts(searchParams, 0); // 새 검색으로 API 호출
  }, [searchParams, fetchPosts]);

  // 컴포넌트가 처음 마운트될 때 찜 목록도 함께 불러옴
  useEffect(() => {
    fetchMyLikes();
  }, [fetchMyLikes]);

  // 무한 스크롤을 위한 Intersection Observer 설정
  useEffect(() => {
    const currentObserverRef = observerRef.current; // cleanup을 위한 ref 저장

    const observer = new IntersectionObserver(
      (entries) => {
        // 타겟 요소가 화면에 보이고, 더 불러올 데이터가 있으며, 로딩 중이 아닐 때 다음 페이지 로드
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchPosts(searchParams, page); // 현재 page 사용
        }
      },
      { threshold: 0.5 } // 타겟이 50% 보였을 때 실행
    );

    if (currentObserverRef) observer.observe(currentObserverRef);
    
    return () => {
      // cleanup 시 저장된 ref 사용
      if (currentObserverRef) observer.unobserve(currentObserverRef);
    };

  }, [hasMore, isLoading, fetchPosts, searchParams, page]);

  // 찜하기/찜취소 핸들러
  const handleLikeToggle = async (e, postId) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (!localStorage.getItem('accessToken')) {
      alert("로그인이 필요한 기능이에요! 😊");
      navigate('/login');
      return;
    }

    const isLiked = likedPostIds.has(postId);
    
    // UI 낙관적 업데이트
    setLikedPostIds(prev => {
      const newSet = new Set(prev);
      if (isLiked) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
    // 목록 카드의 찜 수를 낙관적으로 반영
    setPosts(prev => prev.map(p => {
      if (p.postId !== postId) return p;
      const current = p.likeCount ?? 0;
      const next = isLiked ? Math.max(0, current - 1) : current + 1;
      return { ...p, likeCount: next };
    }));
    // 많이 찜한 순 정렬 중이면, 현재 페이지 데이터만 즉시 재정렬
    if (searchParams.sort === 'likeCount,desc') {
      setPosts(prev => {
        const next = [...prev];
        next.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
        return next;
      });
    }

    try {
      if (isLiked) {
        await axios.delete(`/api/posts/${postId}/like`, { 
          headers: getAuthHeader(),
          timeout: 5000 
      });
      } else {
        await axios.post(`/api/posts/${postId}/like`, null, { 
          headers: getAuthHeader(),
          timeout: 5000
        });
      }
    } catch (error) {
      // API 실패 시 UI 원상 복구
      setLikedPostIds(prev => {
        const newSet = new Set(prev);
        if (isLiked) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
      // likeCount도 원상 복구
      setPosts(prev => prev.map(p => {
        if (p.postId !== postId) return p;
        const current = p.likeCount ?? 0;
        const next = isLiked ? current + 1 : Math.max(0, current - 1);
        return { ...p, likeCount: next };
      }));
      if (searchParams.sort === 'likeCount,desc') {
        setPosts(prev => {
          const next = [...prev];
          next.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
          return next;
        });
      }
      alert("찜하기 처리 중 오류가 발생했어요. 다시 시도해주세요! 😅");
    }
  };

  const handleBookClick = (postId) => navigate(`/posts/${postId}`);
  
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, query: searchQuery }));
  };

  // 검색어 입력 핸들러 추가
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e) => {
    setSearchParams(prev => ({...prev, sort: e.target.value}));
  };

  const handleCategoryChange = (e) => {
    setSearchParams(prev => ({...prev, category: e.target.value}));
  }

  const handleApplyFilters = () => {
    setSearchParams(prev => ({
      ...prev,
      minPrice: tempFilters.minPrice,
      maxPrice: tempFilters.maxPrice,
    }));
    setFilterOpen(false);
  };

  // 스켈레톤 카드 렌더링 함수
  const renderSkeletonCards = (count = 4) => (
    <LoadingGrid>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={`skeleton-${index}`}>
          <SkeletonImage />
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
        </SkeletonCard>
      ))}
    </LoadingGrid>
  );

  // 카테고리 옵션 생성 함수
  const renderCategoryOptions = () => {
    const options = [];
    const categories = getCategories(t);
    Object.keys(categories).forEach(majorCategory => {
      Object.keys(categories[majorCategory]).forEach(college => {
        categories[majorCategory][college].forEach(department => {
          options.push(
            <option key={`${majorCategory}-${college}-${department}`} value={department}>
              {majorCategory} &gt; {college} &gt; {department}
            </option>
          );
        });
      });
    });
    return options;
  };

  // 책 카드 렌더링 함수
  const renderBookCard = (post) => (
    <BookCard key={post.postId} onClick={() => handleBookClick(post.postId)}>
      <BookImageWithFallback src={post.thumbnailUrl} alt={post.postTitle} t={t} />
      <LikeButton
        $liked={likedPostIds.has(post.postId)}
        onClick={(e) => handleLikeToggle(e, post.postId)}
      />
      <BookInfo>
        <BookCardTitle>{post.postTitle}</BookCardTitle>
        {post.author && <BookAuthor>{post.author}</BookAuthor>}
        <BookPrice>
          {post.price?.toLocaleString() || '0'}{t('marketplace.currency')}
          <LikeCount>{(post.likeCount ?? 0).toLocaleString()}</LikeCount>
        </BookPrice>
      </BookInfo>
    </BookCard>
  );

  // 필터 팝오버 외부 클릭 시 닫기 핸들러
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };

    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [filterOpen]);

  // Enter 키로 검색 실행하는 핸들러
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchParams(prev => ({ ...prev, query: searchQuery }));
    }
  };

  return (
    <PageWrapper>
      <SidebarMenu active={'bookstore/add'} onMenuClick={(menu) => navigate(`/${menu}`)} />
      <MainContent>
        <MarketplaceContainer>
          <Header>
            <Title>{t('marketplace.title')}</Title>
            <Description>{t('marketplace.description')}</Description>
          </Header>
            <Controls>
              <SearchBar as="form" onSubmit={handleSearch}>
                <SearchIcon />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={handleSearchKeyPress}
                    placeholder={t('marketplace.searchPlaceholder')}
                />
                <SearchButton type="submit">{t('marketplace.searchButton')}</SearchButton>
            </SearchBar>
            <div style={{ position: 'relative' }} ref={filterRef}>
              <FilterButton onClick={() => setFilterOpen(v => !v)}>
                <FilterIcon />
                {t('marketplace.filterAndSort')}
              </FilterButton>
              {filterOpen && (
                <FilterPopover>
                  <FilterSection>
                    <FilterLabel>{t('marketplace.sortBy')}</FilterLabel>
                    <FilterSelect value={searchParams.sort} onChange={handleSortChange}>
                      <option value="createdAt,desc">{t('marketplace.sortOptions.newest')}</option>
                      <option value="price,asc">{t('marketplace.sortOptions.priceLow')}</option>
                      <option value="price,desc">{t('marketplace.sortOptions.priceHigh')}</option>
                      <option value="views,desc">{t('marketplace.sortOptions.views')}</option>
                      <option value="likeCount,desc">{t('marketplace.sortOptions.likes')}</option>
                    </FilterSelect>
                  </FilterSection>
                  <FilterSection>
                    <FilterLabel>{t('marketplace.priceRange')}</FilterLabel>
                    <PriceInputGroup>
                      <PriceInput 
                        type="number" 
                        placeholder={t('marketplace.minPrice')} 
                        value={tempFilters.minPrice} 
                        onChange={e => setTempFilters(p => ({...p, minPrice: e.target.value}))} 
                      />
                      <span>~</span>
                      <PriceInput 
                        type="number" 
                        placeholder={t('marketplace.maxPrice')} 
                        value={tempFilters.maxPrice} 
                        onChange={e => setTempFilters(p => ({...p, maxPrice: e.target.value}))} 
                      />
                    </PriceInputGroup>
                  </FilterSection>
                  <FilterApplyButton onClick={handleApplyFilters}>{t('marketplace.apply')}</FilterApplyButton>
                </FilterPopover>
              )}
            </div>
          </Controls>

          <CategoryContainer>
            <CategorySelect onChange={handleCategoryChange} value={searchParams.category}>
              <option value="">{t('marketplace.allCategories')}</option>
              {/* 카테고리 옵션 동적 생성 - 실제로 렌더링되도록 함수 호출 */}
              {renderCategoryOptions()}
            </CategorySelect>
          </CategoryContainer>

          {/* 에러 메시지 표시 */}
          {error && (
            <ErrorMessage>
              <div>{error}</div>
              <button 
                onClick={() => {
                  setError('');
                  fetchPosts(searchParams, 0);
                }}
                style={{ 
                  marginTop: '1rem', 
                  padding: '0.5rem 1rem', 
                  background: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
                  >
                    {t('marketplace.retryButton')}
                  </button>
            </ErrorMessage>
          )}

          {/* 게시글 목록 표시 */}
          {posts.length > 0 && <BookGrid>{posts.map(renderBookCard)}</BookGrid>}

          {/* 로딩 및 결과 없음 상태 표시 */}
            {isLoading && posts.length === 0 && (
                <LoadingMessage>
                  <Loading type="bookstack" size="lg" subtext={t('marketplace.loadingMessage')} />
                </LoadingMessage>
            )}

          {!isLoading && posts.length === 0 && !error && (
            <NoResultsMessage>
              <div className="icon">🔍</div>
              <div className="title">{t('marketplace.noResults.title')}</div>
              <div className="description">
                {t('marketplace.noResults.description')}<br/>
                혹시 새로운 책을 등록해보는 건 어떨까요? 😊
              </div>
            </NoResultsMessage>
          )}
          
          {/* 무한 스크롤 로딩 표시 */}
          {isLoading && posts.length > 0 && (
            <>
              {renderSkeletonCards(4)}
              <LoadingMessage>
                <Loading type="hongbook" size="md" subtext={t('marketplace.loadingMessage')} />
              </LoadingMessage>
            </>
          )}
          
          {/* 무한 스크롤 트리거 요소 */}
          <div 
            ref={observerRef} 
            style={{ 
              height: '50px', 
              display: hasMore ? 'block' : 'none' 
            }} 
          />
          
          {/* 더 이상 불러올 데이터가 없을 때 메시지 */}
          {!hasMore && posts.length > 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: 'var(--text-light)',
              borderTop: '1px solid var(--border)',
              marginTop: '2rem'
            }}>
              🎉 모든 책을 다 보셨네요! 새로운 책들이 올라오면 알려드릴게요.
            </div>
          )}
        </MarketplaceContainer>
      </MainContent>
    </PageWrapper>
  );
};

export default Marketplace;
