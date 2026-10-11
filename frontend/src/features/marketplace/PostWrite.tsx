import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import {
  LucideArrowLeft,
  LucideBook,
  LucideCamera,
  LucideImage,
  LucideInfo,
  LucideMapPin,
  LucideSave,
  LucideSearch,
  LucideX
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import WarningModal from '@/shared/layout/WarningModal'
import { useWriting } from '@/shared/contexts/WritingContext'
import api from '@/shared/api/client'

/* ----------------------- 스타일 ----------------------- */

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.3s;
  box-sizing: border-box;

  &:focus {
    border-color: #007bff;
  }
`

const WriteContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
  padding-top: 96px;
  @media (max-width: 900px) {
    padding-top: 72px;
    padding: 1rem;
  }
  @media (max-width: 600px) {
    padding-top: 56px;
    padding: 0.5rem;
  }
`

const WriteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`

const BackButton = styled.button`
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

  &:hover {
    background: #5a6268;
  }
`

const WriteTitle = styled.h1`
  font-size: 1.8rem;
  color: #333;
  margin: 0;
`

const WriteForm = styled.form`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  @media (max-width: 600px) {
    padding: 1rem;
  }
`

const FormSection = styled.div`
  margin-bottom: 2rem;
`

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.5rem;
`

const Required = styled.span`
  color: #dc3545;
  margin-left: 0.25rem;
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
  }
`

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  background: white;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
  }
`

const ToggleContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`

const ToggleOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid ${props => (props.$checked ? '#007bff' : '#ddd')};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => (props.$checked ? '#f8f9ff' : 'white')};

  &:hover {
    border-color: #007bff;
  }

  input[type='radio'],
  input[type='checkbox'] {
    display: none;
  }
`

const ToggleText = styled.span`
  font-size: 0.9rem;
  color: ${props => (props.$checked ? '#007bff' : '#666')};
  font-weight: ${props => (props.$checked ? '600' : 'normal')};
`

const ImageSection = styled.div`
  margin-bottom: 1.5rem;
`

const ImageUploadArea = styled.div`
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
  background: #f8f9fa;

  &:hover {
    border-color: #007bff;
    background: #f0f8ff;
  }
`

const ImageUploadIcon = styled.div`
  font-size: 2rem;
  color: #999;
  margin-bottom: 1rem;
`

const ImageUploadText = styled.p`
  color: #666;
  margin-bottom: 0.5rem;
`

const ImageUploadButton = styled.button`
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;

  &:hover {
    background: #0056b3;
  }
`

const ImagePreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`

const ImagePreviewItem = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
`

const ImagePreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #dc3545;
  font-size: 0.8rem;
  transition: background 0.2s;

  &:hover {
    background: white;
  }
`

const ConditionSection = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`

const ConditionOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;

  &:hover {
    border-color: #007bff;
  }

  input[type='radio'] {
    display: none;
  }

  input[type='radio']:checked + span {
    color: #007bff;
    font-weight: 600;
  }

  input[type='radio']:checked ~ & {
    border-color: #007bff;
    background: #f8f9ff;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #5a6268;
  }
`

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #218838;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #0056b3;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
`

const HelpText = styled.div`
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
`

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
`

const SwitchButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  min-width: 100px;

  &.active {
    border-color: #007bff;
    background: #007bff;
    color: white;
  }

  &:hover {
    border-color: #007bff;
  }
`

const SwitchLabel = styled.span`
  font-size: 0.9rem;
  color: #666;
  margin-right: 0.5rem;
`

const PriceRecommendation = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
`

const RecommendationText = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
`

const DiscountText = styled.div`
  font-size: 0.85rem;
  color: #007bff;
  font-weight: 500;
`

const OriginalPriceInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  margin-bottom: 0.5rem;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
  }
`

const InputTypeSelector = styled.div`
  margin-bottom: 1rem;
`

const InputTypeButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`

const InputTypeButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => (props.$active ? '#007bff' : '#ddd')};
  background: ${props => (props.$active ? '#007bff' : 'white')};
  color: ${props => (props.$active ? 'white' : '#333')};
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    border-color: #007bff;
    background: ${props => (props.$active ? '#0056b3' : '#f8f9ff')};
  }
`

const BookSearchModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const BookSearchContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`

const BookList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`

const BookItem = styled.div`
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #007bff;
    background: #f8f9ff;
  }

  &.selected {
    border-color: #007bff;
    background: #e3f2fd;
  }
`

const BookItemTitle = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`

const BookInfo = styled.div`
  color: #666;
  font-size: 0.9rem;
`

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`

const ModalButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

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
`

const SelectedBookDisplay = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border: 2px solid #007bff;
  border-radius: 8px;
  margin-bottom: 1rem;
`

const DiscountInfo = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
`

const ButtonSection = styled.div`
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`

const SaveDraftButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #218838;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`

const InfoButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  margin-left: 0.5rem;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  padding: 0;
  transition: color 0.2s;
  &:hover {
    color: #0056b3;
  }
`

const InfoModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`

const InfoModalContent = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  text-align: center;
`

const InfoTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.98rem;
  th,
  td {
    border: 1px solid #eee;
    padding: 0.5rem 0.75rem;
  }
  th {
    background: #f8f9fa;
    font-weight: 600;
  }
`

const InfoModalClose = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1.2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    background: #0056b3;
  }
`

// 카테고리 전용 스타일
const CategoryRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const CategorySelect = styled.select`
  padding: 0.6rem 0.8rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  background: #fff;
  color: #333;
  min-width: 140px;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const RecommendButton = styled.button`
  margin-left: 0.5rem;
  padding: 0.3rem 0.8rem;
  background: #f1f3f9;
  color: #007bff;
  border: 1px solid #cce1ff;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
  &:hover {
    background: #e3f0ff;
    color: #0056b3;
  }
`

const InfoDescription = styled.div`
  margin-bottom: 1rem;
  text-align: left;
`

const InfoNote = styled.div`
  margin-top: 1rem;
  text-align: left;
`

// 책 검색 버튼 (누락 방지)
const BookSearchButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
  &:hover {
    background: #0056b3;
  }
`

/* ----------------------- 상수/도우미 ----------------------- */

// 프론트엔드 상태값 -> 백엔드 Enum 값으로 변환
const CONDITION_MAP = {
  상: 'HIGH',
  중: 'MEDIUM',
  하: 'LOW'
}

// 상수 추출
const MAX_IMAGES = 3
const DRAFT_STORAGE_KEY = 'postWriteDraft'
const DRAFT_EXPIRY_HOURS = 24

// 가격 한도(백엔드와 통일)
const PRICE_MIN = 0
const PRICE_MAX = 1_000_000_000 // 판매가 한도
const ORIGINAL_PRICE_MAX = 2_000_000_000 // 원가 한도

const clampInt = (val, min, max) => {
  if (val === '' || val === null || typeof val === 'undefined') return ''
  let n = Math.floor(Number(val))
  if (!Number.isFinite(n)) return ''
  if (n < min) n = min
  if (n > max) n = max
  return String(n)
}

// 카테고리 데이터 (현재 미사용이나 유지)
const CATEGORIES = {
  전공: {
    경영대학: ['경영학부'],
    공과대학: [
      '전자전기공학부',
      '신소재공학전공',
      '화학공학전공',
      '컴퓨터공학과',
      '산업데이터공학과',
      '기계시스템디자인공학과',
      '건설환경공학과'
    ],
    법과대학: ['법학부'],
    미술대학: [
      '동양학과',
      '회화과',
      '판화과',
      '조소과',
      '시각디자인전공',
      '산업디자인전공',
      '금속조형디자인과',
      '도예유리과',
      '목조형가구학과',
      '섬유미술패션디자인과',
      '예술학과'
    ],
    '디자인,예술경영학부': ['디자인경영전공', '예술경영전공'],
    공연예술학부: ['뮤지컬전공', '실용음악전공'],
    경제학부: ['경제학전공'],
    사범대학: [
      '수학교육과',
      '국어교육과',
      '영어교육과',
      '역사교육과',
      '교육학과'
    ],
    문과대학: ['영어영문학과', '독어독문학과', '불어불문학과', '국어국문학과'],
    건축도시대학: ['건축학전공', '실내건축학전공', '도시공학과']
  },
  교양: {
    'ABEEK 교양': ['ABEEK 교양'],
    인문계열: ['인문계열'],
    영어계열: ['영어계열'],
    사회계열: ['사회계열'],
    제2외국어계열: ['제2외국어계열'],
    자연계열: ['자연계열'],
    예체능계열: ['예체능계열'],
    교직: ['교직']
  }
}

const mapServerTree = nodes =>
  Array.isArray(nodes)
    ? nodes.map(n => ({
        name: n.name,
        children: mapServerTree(n.children || [])
      }))
    : []
const buildTreeFromConst = () =>
  Object.keys(CATEGORIES).map(main => ({
    name: main,
    children: Object.keys(CATEGORIES[main] || {}).map(sub => ({
      name: sub,
      children: (CATEGORIES[main][sub] || []).map(d => ({
        name: d,
        children: []
      }))
    }))
  }))

// ✅ 교내 드롭다운: addEdge 데이터에서 중복 제거한 코드 목록
const ONCAMPUS_CODES = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'X',
  'Z1',
  'Z2',
  'Z3',
  'Z4',
  'MH',
  '신기숙사'
]

// ✅ 교외 드롭다운: 노선 → 역
const SUBWAY_MAP = {
  '1호선': [
    '소요산',
    '동두천',
    '보산',
    '지행',
    '덕정',
    '양주',
    '녹양',
    '가능',
    '의정부',
    '회룡',
    '망월사',
    '도봉산',
    '도봉',
    '방학',
    '창동',
    '녹천',
    '월계',
    '광운대',
    '석계',
    '신이문',
    '외대앞',
    '회기',
    '청량리',
    '제기동',
    '신설동',
    '동묘앞',
    '동대문',
    '종로5가',
    '종로3가',
    '종각',
    '서울역',
    '남영',
    '용산',
    '노량진',
    '대방',
    '신길',
    '영등포',
    '신도림',
    '구로',
    '가산디지털단지',
    '독산',
    '금천구청',
    '광명',
    '석수',
    '관악',
    '안양',
    '명학',
    '금정',
    '군포',
    '당정',
    '의왕',
    '성균관대',
    '화서',
    '수원',
    '세류',
    '병점',
    '세마',
    '오산대',
    '오산',
    '진위',
    '송탄',
    '서정리',
    '지제',
    '평택',
    '성환',
    '직산',
    '두정',
    '천안',
    '봉명',
    '쌍용',
    '아산',
    '배방',
    '온양온천',
    '신창'
  ],
  '2호선': [
    '시청',
    '을지로입구',
    '을지로3가',
    '을지로4가',
    '동대문역사문화공원',
    '신당',
    '상왕십리',
    '왕십리',
    '한양대',
    '뚝섬',
    '성수',
    '건대입구',
    '구의',
    '강변',
    '잠실나루',
    '잠실',
    '잠실새내',
    '종합운동장',
    '삼성',
    '선릉',
    '역삼',
    '강남',
    '교대',
    '서초',
    '방배',
    '사당',
    '낙성대',
    '서울대입구',
    '봉천',
    '신림',
    '신대방',
    '구로디지털단지',
    '대림',
    '신도림',
    '문래',
    '영등포구청',
    '당산',
    '합정',
    '홍대입구',
    '신촌',
    '이대',
    '아현',
    '충정로',
    '시청'
  ],
  '3호선': [
    '대화',
    '주엽',
    '정발산',
    '마두',
    '백석',
    '대곡',
    '원흥',
    '삼송',
    '지축',
    '구파발',
    '연신내',
    '불광',
    '녹번',
    '홍제',
    '무악재',
    '독립문',
    '경복궁',
    '안국',
    '종로3가',
    '충무로',
    '동대입구',
    '약수',
    '금호',
    '옥수',
    '압구정',
    '신사',
    '잠원',
    '고속터미널',
    '교대',
    '남부터미널',
    '양재',
    '매봉',
    '도곡',
    '대치',
    '학여울',
    '대청',
    '일원',
    '수서',
    '가락시장',
    '경찰병원',
    '오금'
  ],
  '4호선': [
    '당고개',
    '상계',
    '노원',
    '창동',
    '쌍문',
    '수유',
    '미아',
    '미아사거리',
    '길음',
    '성신여대입구',
    '한성대입구',
    '혜화',
    '동대문',
    '종로3가',
    '서울역',
    '숙대입구',
    '삼각지',
    '신용산',
    '이촌',
    '동작',
    '이수',
    '사당',
    '남태령',
    '선바위',
    '경마공원',
    '대공원',
    '과천',
    '정부과천청사',
    '인덕원',
    '평촌',
    '범계',
    '금정',
    '산본',
    '수리산',
    '대야미',
    '반월',
    '상록수',
    '한대앞',
    '중앙',
    '고잔',
    '초지',
    '안산',
    '신길온천',
    '정왕',
    '오이도'
  ],
  '5호선': [
    '방화',
    '개화산',
    '김포공항',
    '송정',
    '마곡',
    '발산',
    '우장산',
    '화곡',
    '까치산',
    '신정',
    '목동',
    '오목교',
    '양평',
    '영등포구청',
    '여의도',
    '신길',
    '영등포시장',
    '당산',
    '합정',
    '망원',
    '마포구청',
    '공덕',
    '애오개',
    '충정로',
    '서대문',
    '광화문',
    '종로3가',
    '을지로4가',
    '동대문역사문화공원',
    '청구',
    '신금호',
    '행당',
    '왕십리',
    '마장',
    '답십리',
    '장한평',
    '군자',
    '아차산',
    '광나루',
    '천호',
    '강동',
    '길동',
    '굽은다리',
    '명일',
    '고덕',
    '상일동',
    '강일',
    '미사',
    '하남풍산',
    '하남시청',
    '하남검단산'
  ],
  '6호선': [
    '응암',
    '역촌',
    '불광',
    '독바위',
    '연신내',
    '구산',
    '디지털미디어시티',
    '월드컵경기장',
    '마포구청',
    '망원',
    '합정',
    '상수',
    '광흥창',
    '대흥',
    '공덕',
    '효창공원앞',
    '삼각지',
    '녹사평',
    '이태원',
    '한강진',
    '버티고개',
    '약수',
    '청구',
    '신당',
    '동묘앞',
    '창신',
    '보문',
    '안암',
    '고려대',
    '월곡',
    '상월곡',
    '돌곶이',
    '석계',
    '태릉입구',
    '화랑대',
    '봉화산'
  ],
  '7호선': [
    '장암',
    '도봉산',
    '수락산',
    '마들',
    '노원',
    '중계',
    '하계',
    '공릉',
    '태릉입구',
    '먹골',
    '중화',
    '상봉',
    '면목',
    '사가정',
    '용마산',
    '중곡',
    '군자',
    '어린이대공원',
    '건대입구',
    '뚝섬유원지',
    '청담',
    '강남구청',
    '학동',
    '논현',
    '반포',
    '고속터미널',
    '내방',
    '이수',
    '남성',
    '숭실대입구',
    '상도',
    '장승배기',
    '신대방삼거리',
    '보라매',
    '신풍',
    '대림',
    '남구로',
    '가산디지털단지',
    '철산',
    '광명사거리',
    '천왕',
    '온수',
    '오류동',
    '개봉',
    '구일'
  ],
  '8호선': [
    '암사',
    '천호',
    '강동구청',
    '몽촌토성',
    '잠실',
    '석촌',
    '송파',
    '가락시장',
    '문정',
    '장지',
    '복정',
    '산성',
    '남한산성입구',
    '단대오거리',
    '신흥',
    '수진',
    '모란'
  ],
  '9호선': [
    '개화',
    '김포공항',
    '공항시장',
    '신방화',
    '마곡나루',
    '양천향교',
    '가양',
    '증미',
    '등촌',
    '염창',
    '신목동',
    '선유도',
    '당산',
    '국회의사당',
    '여의도',
    '샛강',
    '노량진',
    '노들',
    '흑석',
    '동작',
    '구반포',
    '신반포',
    '고속터미널',
    '사평',
    '신논현',
    '언주',
    '선정릉',
    '삼성중앙',
    '봉은사',
    '종합운동장'
  ],
  경의중앙선: [
    '문산',
    '파주',
    '금촌',
    '금릉',
    '운정',
    '야당',
    '탄현',
    '일산',
    '풍산',
    '백마',
    '곡산',
    '대곡',
    '능곡',
    '행신',
    '강매',
    '화전',
    '수색',
    '디지털미디어시티',
    '가좌',
    '신촌(경의중앙선)',
    '서울역',
    '용산',
    '이촌',
    '서빙고',
    '한남',
    '옥수',
    '응봉',
    '왕십리',
    '청량리',
    '회기',
    '중랑',
    '상봉',
    '망우',
    '양원',
    '구리',
    '도농',
    '덕소',
    '도심',
    '팔당',
    '운길산',
    '양수',
    '신원',
    '국수',
    '아신',
    '오빈',
    '양평',
    '원덕',
    '용문',
    '지평'
  ],
  공항철도: [
    '서울역',
    '공덕',
    '홍대입구',
    '디지털미디어시티',
    '마곡나루',
    '김포공항',
    '계양',
    '검암',
    '청라국제도시',
    '영종',
    '운서',
    '공항화물청사',
    '인천공항1터미널',
    '인천공항2터미널'
  ],
  신분당선: [
    '강남',
    '양재',
    '양재시민의숲',
    '청계산입구',
    '판교',
    '정자',
    '미금',
    '동천',
    '수지구청',
    '성복',
    '상현',
    '광교중앙',
    '광교'
  ],
  수인분당선: [
    '인천',
    '신포',
    '숭의',
    '인하대',
    '송도',
    '연수',
    '원인재',
    '남동인더스파크',
    '호구포',
    '인천논현',
    '소래포구',
    '월곶',
    '달월',
    '오이도',
    '정왕',
    '신길온천',
    '안산',
    '한대앞',
    '중앙',
    '고잔',
    '초지',
    '금정',
    '범계',
    '평촌',
    '인덕원',
    '정부과천청사',
    '과천',
    '대공원',
    '경마공원',
    '선바위',
    '남태령',
    '수원',
    '매교',
    '수원시청',
    '매탄권선',
    '망포',
    '영통',
    '청명',
    '상갈',
    '기흥',
    '신갈',
    '구성',
    '보정',
    '죽전',
    '오리',
    '미금',
    '정자',
    '수내',
    '서현',
    '이매',
    '야탑',
    '모란'
  ]
}

// 인증 토큰을 가져오는 헬퍼 함수
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 카카오/다음 책 검색 응답을 내부 표준 구조로 정규화
const toBookArray = data => {
  if (!data) return []
  if (Array.isArray(data.documents)) return data.documents
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data)) return data
  return []
}

// 공백 구분된 ISBN에서 우선순위 선택
const pickIsbn = raw => {
  const tokens = String(raw || '')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => t.replace(/[^\dXx]/g, ''))
  const isbn13 = tokens.find(t => /^\d{13}$/.test(t))
  const isbn10 = tokens.find(t => /^\d{9}[\dXx]$/.test(t))
  return isbn13 || isbn10 || tokens[0] || ''
}

// 문서 → 화면/상태에서 쓰는 표준 속성으로 매핑
const normalizeBook = doc => ({
  title: doc?.title ?? '',
  author: Array.isArray(doc?.authors)
    ? doc.authors.filter(Boolean).join(', ')
    : (doc?.author ?? ''),
  publisher: doc?.publisher ?? '',
  isbn: pickIsbn(doc?.isbn),
  thumbnail: doc?.thumbnail ?? ''
})

const PostWrite = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  // WritingContext 사용
  const { startWriting, stopWriting, setUnsavedChanges } = useWriting()

  // 모든 필드 명시적으로 정의
  const [formData, setFormData] = useState({
    // Book 정보
    isbn: '',
    bookTitle: '',
    author: '',
    publisher: '',
    originalPrice: '',

    // SalePost 정보
    postTitle: '',
    postContent: '',
    price: '',
    writingCondition: '상',
    tearCondition: '상',
    waterCondition: '상',
    negotiable: true,

    // 거래 기준 위치(판매자)
    oncampusPlaceCode: '',
    offcampusStationCode: '',
    // 카테고리
    mainCategory: '',
    subCategory: '',
    detailCategory: ''
  })

  const [images, setImages] = useState([]) // 다중 이미지 파일 관리
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const [inputType, setInputType] = useState('search') // 'search' or 'custom'
  const [unknownOriginalPrice, setUnknownOriginalPrice] = useState(false) // custom 모드에서 정가 없음/모름
  const [showBookSearch, setShowBookSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false) // 검색 로딩 상태

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)

  // ✅ 교외 2단 드롭다운 상태
  const [offcampusLine, setOffcampusLine] = useState('')
  // 카테고리 트리: 서버 우선, 실패 시 상수 폴백
  const [catTree, setCatTree] = useState([])
  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get('/categories')
        const arr = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : []
        const tree = mapServerTree(arr)
        setCatTree(tree && tree.length ? tree : buildTreeFromConst())
      } catch {
        setCatTree(buildTreeFromConst())
      }
    })()
  }, [])

  const imageInputRef = useRef(null)

  // 최신 변경 상태/함수 접근을 위한 ref (이벤트 리스너 안정화)
  const hasUnsavedChangesRef = useRef(false)
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  const clearErrors = useCallback(fieldName => {
    setErrors(prev => {
      if (prev[fieldName]) {
        const rest = { ...prev }
        delete rest[fieldName]
        return rest
      }
      return prev
    })
  }, [])

  // 임시저장 로직을 별도 함수로 분리
  const loadDraftData = useCallback(() => {
    if (isEdit) return

    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!savedDraft) return

      const draftData = JSON.parse(savedDraft)
      const draftAge = new Date() - new Date(draftData.timestamp)
      const expiryTime = DRAFT_EXPIRY_HOURS * 60 * 60 * 1000

      if (draftAge < expiryTime) {
        // 임시저장된 데이터가 있으면 자동으로 불러오기 (팝업 없이)
        const dataWithoutTimestamp = { ...draftData }
        delete dataWithoutTimestamp.timestamp
        setFormData(prev => ({
          ...prev,
          ...dataWithoutTimestamp
        }))
        if (draftData.images) {
          setImages(draftData.images)
        }
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [isEdit])

  // 컴포넌트 마운트 시 글쓰기 시작 및 임시저장 데이터 불러오기
  useEffect(() => {
    startWriting('sale')
    // oxlint-disable-next-line react/set-state-in-effect -- 마운트할 때 임시저장한 글을 폼에 불러온다
    loadDraftData()

    return () => {
      stopWriting()
    }
  }, [startWriting, stopWriting, loadDraftData])

  // 폼 데이터 변경 감지
  useEffect(() => {
    const hasChanges =
      Object.values(formData).some(
        value => value && value.toString().trim() !== ''
      ) || images.length > 0
    // 임시저장 뒤 false로 되돌리는 경로가 있어 파생값으로 바꾸지 않는다
    // oxlint-disable-next-line react/set-state-in-effect -- 폼 내용이 바뀔 때 미저장 상태를 맞춘다
    setHasUnsavedChanges(hasChanges)
    setUnsavedChanges(hasChanges)
  }, [formData, images, setUnsavedChanges])

  // 메모리 누수 방지: unmount 시 blob URL 해제
  const imagesRef = useRef(images)
  useEffect(() => {
    imagesRef.current = images
  }, [images])
  useEffect(() => {
    return () => {
      imagesRef.current.forEach(img => {
        const url = img?.preview
        if (!url || img.isUploaded) return
        if (typeof url !== 'string' || !url.startsWith('blob:')) return
        try {
          URL.revokeObjectURL(url)
        } catch {
          if (typeof console !== 'undefined') {
          }
        }
      })
    }
  }, [])

  // 임시저장
  const handleSaveDraft = useCallback(async () => {
    try {
      const draftData = {
        ...formData,
        images: images,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData))
      await new Promise(resolve => setTimeout(resolve, 500))
      setHasUnsavedChanges(false)
      setUnsavedChanges(false)
      alert(t('postWrite.draftSaved'))
    } catch {
      alert(t('postWrite.draftSaveFailed'))
    }
  }, [formData, images, setUnsavedChanges, t])

  const handleSaveDraftRef = useRef(handleSaveDraft)
  useEffect(() => {
    handleSaveDraftRef.current = handleSaveDraft
  }, [handleSaveDraft])

  // 브라우저 이벤트 처리
  useEffect(() => {
    const handleBeforeUnload = e => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    const handlePopState = e => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        setPendingNavigation('/marketplace')
        setShowWarningModal(true)
        window.history.pushState(null, '', window.location.pathname)
      }
    }

    const handleSaveDraftEvent = async () => {
      await handleSaveDraft()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('saveDraft', handleSaveDraftEvent)
    window.history.pushState(null, '', window.location.pathname)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('saveDraft', handleSaveDraftEvent)
    }
  }, [hasUnsavedChanges, handleSaveDraft])

  // 수정 모드 데이터 로딩
  useEffect(() => {
    if (!isEdit) return

    const fetchPostForEdit = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`/api/posts/${id}`, {
          headers: getAuthHeader()
        })
        const postData = response.data

        setFormData({
          isbn: postData.isbn || '',
          bookTitle: postData.bookTitle || '',
          author: postData.author || '',
          publisher: postData.publisher || '',
          originalPrice: postData.originalPrice?.toString() || '',

          postTitle: postData.postTitle || '',
          postContent: postData.postContent || '',
          price: postData.price?.toString() || '',
          writingCondition:
            Object.keys(CONDITION_MAP).find(
              key => CONDITION_MAP[key] === postData.writingCondition
            ) || '상',
          tearCondition:
            Object.keys(CONDITION_MAP).find(
              key => CONDITION_MAP[key] === postData.tearCondition
            ) || '상',
          waterCondition:
            Object.keys(CONDITION_MAP).find(
              key => CONDITION_MAP[key] === postData.waterCondition
            ) || '상',
          negotiable: postData.negotiable ?? true,

          oncampusPlaceCode: postData.oncampusPlaceCode || '',
          offcampusStationCode: postData.offcampusStationCode || ''
        })

        if (postData.postImageUrls?.length > 0) {
          setImages(
            postData.postImageUrls.map((url, index) => ({
              id: `uploaded_${index}_${Date.now()}`,
              preview: url,
              isUploaded: true
            }))
          )
        }

        setInputType(postData.isbn ? 'search' : 'custom')
      } catch {
        alert('게시글 정보를 불러올 수 없어! 🥺')
        void navigate('/marketplace')
      } finally {
        setLoading(false)
      }
    }

    void fetchPostForEdit()
  }, [id, isEdit, navigate])

  // ✅ 수정모드에서 저장된 역 이름을 보고 호선 자동 세팅
  useEffect(() => {
    if (!formData.offcampusStationCode || offcampusLine) return
    const found = Object.keys(SUBWAY_MAP).find(line =>
      SUBWAY_MAP[line].includes(formData.offcampusStationCode)
    )
    // 임시저장 복원에서도 역 코드만 들어오므로 effect에서 맞춘다
    // oxlint-disable-next-line react/set-state-in-effect -- 저장된 역 코드로 호선을 자동 선택한다
    if (found) setOffcampusLine(found)
  }, [formData.offcampusStationCode, offcampusLine])

  // 할인율 계산
  const calculateDiscountRate = useCallback(() => {
    const WEIGHTS = { writing: 0.15, tear: 0.35, water: 0.5 }
    const DISCOUNT_RATES = { 상: 0.15, 중: 0.35, 하: 0.55 }
    const BASE_DISCOUNT = 0.1

    let totalDiscount = 0
    totalDiscount += WEIGHTS.writing * DISCOUNT_RATES[formData.writingCondition]
    totalDiscount += WEIGHTS.tear * DISCOUNT_RATES[formData.tearCondition]
    totalDiscount += WEIGHTS.water * DISCOUNT_RATES[formData.waterCondition]
    totalDiscount += BASE_DISCOUNT
    return Math.round(totalDiscount * 100)
  }, [
    formData.writingCondition,
    formData.tearCondition,
    formData.waterCondition
  ])

  const getRecommendedPrice = useCallback(() => {
    if (!formData.originalPrice) return null
    const originalPrice = parseInt(formData.originalPrice, 10)
    if (Number.isNaN(originalPrice) || originalPrice <= 0) return null
    const discountRate = calculateDiscountRate()
    const recommendedPrice = Math.round(
      originalPrice * (1 - discountRate / 100)
    )
    return { discountRate, recommendedPrice }
  }, [formData.originalPrice, calculateDiscountRate])

  // 입력 핸들러
  const handleInputChange = useCallback(
    e => {
      const { name, value, type, checked } = e.target
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
      clearErrors(name)
    },
    [clearErrors]
  )

  // 원가 변경 핸들러
  const handleOriginalPriceChange = useCallback(
    e => {
      const { value } = e.target
      const clamped = clampInt(value, PRICE_MIN, ORIGINAL_PRICE_MAX)
      setFormData(prev => ({ ...prev, originalPrice: clamped }))
      clearErrors('originalPrice')
    },
    [clearErrors]
  )

  const handlePriceChange = useCallback(
    e => {
      const { value } = e.target
      const clamped = clampInt(value, PRICE_MIN, PRICE_MAX)
      setFormData(prev => ({ ...prev, price: clamped }))
      clearErrors('price')
    },
    [clearErrors]
  )

  // 이미지 업로드
  const handleImageUpload = useCallback(
    e => {
      const files = Array.from(e.target.files)
      if (images.length + files.length > MAX_IMAGES) {
        alert(`이미지는 최대 ${MAX_IMAGES}개까지 업로드할 수 있어! 📸`)
        return
      }
      const validFiles = files.filter(file => {
        const isValidType = file.type.startsWith('image/')
        const isValidSize = file.size <= 5 * 1024 * 1024
        if (!isValidType) {
          alert(`${file.name}은(는) 이미지 파일이 아니야! 🖼️`)
          return false
        }
        if (!isValidSize) {
          alert(`${file.name}은(는) 5MB를 초과해! 더 작은 파일로 올려줘 📏`)
          return false
        }
        return true
      })

      const newImages = validFiles.map(file => ({
        id: `${Date.now()}_${file.name}`,
        file,
        preview: URL.createObjectURL(file)
      }))
      setImages(prev => [...prev, ...newImages])
      if (imageInputRef.current) imageInputRef.current.value = ''
    },
    [images.length]
  )

  const handleRemoveImage = useCallback(imageId => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId)
      if (imageToRemove && imageToRemove.preview && !imageToRemove.isUploaded) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }, [])

  // 책 검색
  const handleBookSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      alert(t('postWrite.enterSearchQuery'))
      return
    }

    setSearchLoading(true)
    try {
      const response = await axios.get('/api/search/books', {
        params: { query: searchQuery.trim() },
        headers: getAuthHeader()
      })
      const raw = response?.data
      const results = toBookArray(raw).map(normalizeBook)
      setSearchResults(results)
      if (results.length === 0) {
        alert(t('postWrite.noSearchResults'))
      }
    } catch {
      alert(t('postWrite.searchError'))
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [searchQuery, t])

  const handleBookSelect = useCallback(book => {
    setFormData(prev => ({
      ...prev,
      isbn: book.isbn || '',
      bookTitle: book.title || '',
      author: book.author || '',
      publisher: book.publisher || ''
    }))
    setShowBookSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }, [])

  // 검증
  const validateForm = useCallback(() => {
    const newErrors = {}

    if (inputType === 'search' && !formData.isbn.trim()) {
      newErrors.bookTitle = '책을 검색에서 선택해줘! (ISBN 필요) 📚'
    }
    if (inputType === 'custom') {
      if (!formData.bookTitle.trim())
        newErrors.bookTitle = '책 제목을 입력해줘! 📖'
      if (!formData.author.trim()) newErrors.author = '저자를 입력해줘! ✍️'
    }

    if (!formData.postTitle.trim()) {
      newErrors.postTitle = '글 제목을 입력해줘! 📝'
    } else if (formData.postTitle.trim().length < 5) {
      newErrors.postTitle = '글 제목은 최소 5자 이상 입력해줘! 📏'
    }

    const originalPrice = parseInt(formData.originalPrice, 10)
    const price = parseInt(formData.price, 10)

    // 원가 필수 여부: 검색 모드에서는 필수, 직접 입력(custom)에서는 선택
    // 원가: 0~2,000,000,000 범위로 통일 (입력했을 경우만 체크)
    if (inputType === 'search') {
      if (
        formData.originalPrice === '' ||
        Number.isNaN(originalPrice) ||
        originalPrice < PRICE_MIN ||
        originalPrice > ORIGINAL_PRICE_MAX
      ) {
        newErrors.originalPrice = `원가는 ${PRICE_MIN.toLocaleString()}~${ORIGINAL_PRICE_MAX.toLocaleString()}원 범위로 입력해줘! 💰`
      }
    } else {
      // custom 모드: 사용자가 원가를 적어준 경우에만 유효성 검사
      if (!unknownOriginalPrice && formData.originalPrice !== '') {
        if (
          Number.isNaN(originalPrice) ||
          originalPrice < PRICE_MIN ||
          originalPrice > ORIGINAL_PRICE_MAX
        ) {
          newErrors.originalPrice = `원가는 ${PRICE_MIN.toLocaleString()}~${ORIGINAL_PRICE_MAX.toLocaleString()}원 범위로 입력해줘! 💰`
        }
      }
    }

    if (
      formData.price === '' ||
      Number.isNaN(price) ||
      price < PRICE_MIN ||
      price > PRICE_MAX
    ) {
      newErrors.price = `판매가는 ${PRICE_MIN.toLocaleString()}~${PRICE_MAX.toLocaleString()}원 범위로 입력해줘! 💵`
    } else if (
      formData.originalPrice &&
      !Number.isNaN(originalPrice) &&
      price > originalPrice
    ) {
      // 원가가 있을 때만 비교
      newErrors.price = '판매가가 원가보다 클 수 없어! 🤔'
    }

    if (!['상', '중', '하'].includes(formData.writingCondition)) {
      newErrors.writingCondition = '필기 상태를 선택해줘! ✏️'
    }
    if (!['상', '중', '하'].includes(formData.tearCondition)) {
      newErrors.tearCondition = '찢어짐 정도를 선택해줘! 📄'
    }
    if (!['상', '중', '하'].includes(formData.waterCondition)) {
      newErrors.waterCondition = '물기 상태를 선택해줘! 💧'
    }

    // ✅ 교내: 드롭다운 목록에서 선택
    if (!formData.oncampusPlaceCode.trim()) {
      newErrors.oncampusPlaceCode = '교내 기본 위치를 선택해줘! 🏫'
    } else if (!ONCAMPUS_CODES.includes(formData.oncampusPlaceCode.trim())) {
      newErrors.oncampusPlaceCode = '목록에서 선택해줘! 🏫'
    }

    // ✅ 교외: 호선/역 검증
    if (!offcampusLine) {
      newErrors.offcampusStationCode = '호선을 먼저 선택해줘! 🚇'
    } else if (!formData.offcampusStationCode.trim()) {
      newErrors.offcampusStationCode = '역을 선택해줘! 🚇'
    } else if (
      !SUBWAY_MAP[offcampusLine]?.includes(formData.offcampusStationCode.trim())
    ) {
      newErrors.offcampusStationCode = '목록에서 선택해줘! 🚇'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, inputType, offcampusLine, unknownOriginalPrice])

  // 제출
  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()
      if (!validateForm()) {
        alert('입력 정보를 다시 확인해줘! 🔍')
        return
      }
      setLoading(true)

      try {
        if (isEdit) {
          // 수정 로직 (위치 코드는 현재 수정 DTO에 없음 → 필요 시 별도 API)
          const payload = {
            postTitle: formData.postTitle.trim(),
            postContent: formData.postContent.trim(),
            price: parseInt(formData.price, 10),
            writingCondition: CONDITION_MAP[formData.writingCondition],
            tearCondition: CONDITION_MAP[formData.tearCondition],
            waterCondition: CONDITION_MAP[formData.waterCondition],
            negotiable: formData.negotiable
          }

          await axios.patch(`/api/posts/${id}`, payload, {
            headers: getAuthHeader()
          })

          // 새로 추가된 이미지가 있으면 별도 업로드 엔드포인트 호출
          const newImageFiles = images
            .filter(img => img.file && !img.isUploaded)
            .map(img => img.file)
          if (newImageFiles.length > 0) {
            const fd = new FormData()
            newImageFiles.forEach(f => fd.append('images', f))

            await axios.post(`/api/posts/${id}/images`, fd, {
              headers: { ...getAuthHeader() }
            })
          }

          alert('게시글이 성공적으로 수정됐어! 🎉')
          localStorage.removeItem(DRAFT_STORAGE_KEY)
          void navigate(`/posts/${id}`)
        } else {
          // 생성 로직
          const apiData = new FormData()
          let endpoint = ''
          let requestJson = {}

          const baseData = {
            bookTitle: formData.bookTitle.trim(),
            author: formData.author.trim(),
            publisher: formData.publisher.trim(),
            postTitle: formData.postTitle.trim(),
            postContent: formData.postContent.trim(),
            price: parseInt(formData.price, 10),
            writingCondition: CONDITION_MAP[formData.writingCondition],
            tearCondition: CONDITION_MAP[formData.tearCondition],
            waterCondition: CONDITION_MAP[formData.waterCondition],
            negotiable: formData.negotiable,

            // 서버로 전송
            oncampusPlaceCode: formData.oncampusPlaceCode.trim(),
            offcampusStationCode: formData.offcampusStationCode.trim(),
            // 카테고리 전송
            mainCategory: formData.mainCategory,
            subCategory: formData.subCategory,
            detailCategory: formData.detailCategory
          }

          if (inputType === 'search') {
            endpoint = '/api/posts'
            requestJson = {
              ...baseData,
              isbn: formData.isbn.trim(),
              originalPrice: parseInt(formData.originalPrice, 10)
            }
          } else {
            endpoint = '/api/posts/custom'
            // custom 모드: 원가는 선택 사항. 입력이 없거나 '정가 없음/모름'이면 0으로 전송
            const parsedOriginal = parseInt(formData.originalPrice, 10)
            requestJson = {
              ...baseData,
              originalPrice:
                !unknownOriginalPrice &&
                formData.originalPrice &&
                !Number.isNaN(parsedOriginal) &&
                parsedOriginal > 0
                  ? parsedOriginal
                  : 0
            }
          }

          // JSON 파트는 명시적으로 파일명을 지정해 Content-Type 힌트를 강화합니다.
          apiData.append(
            'request',
            new Blob([JSON.stringify(requestJson)], {
              type: 'application/json'
            }),
            'request.json'
          )

          // 새 이미지만 전송
          images.forEach(img => {
            if (img.file && !img.isUploaded) {
              apiData.append('images', img.file)
            }
          })

          await axios.post(endpoint, apiData, {
            // Content-Type은 브라우저가 boundary 포함해 자동 설정하도록 둡니다.
            headers: {
              ...getAuthHeader()
            }
          })

          alert('게시글이 성공적으로 등록됐어! 🎉')
          localStorage.removeItem(DRAFT_STORAGE_KEY)
          void navigate('/marketplace')
        }
      } catch (error) {
        const serverData = error.response?.data
        const serverMessage = serverData?.message

        // 모더레이션 차단: 필드 에러로 표시
        if (
          error.response?.status === 400 &&
          serverData?.success === false &&
          serverData?.data?.field
        ) {
          const d = serverData.data // ModerationErrorDTO
          const lvl = d.predictionLevel
            ? ` (${d.predictionLevel}${typeof d.malicious === 'number' ? `, ${Math.round(d.malicious * 100)}%` : ''})`
            : ''
          const msg = (serverMessage || '부적절한 표현이 감지되었습니다.') + lvl
          setErrors(prev => ({ ...prev, [d.field]: msg }))
          // 해당 필드 포커스
          const el = document.querySelector(`[name="${d.field}"]`)
          if (el && typeof el.focus === 'function') el.focus()
          return
        }

        if (error.response?.status === 401) {
          alert(serverMessage || '로그인이 필요해! 다시 로그인해줘 🔐')
          void navigate('/login')
        } else if (error.response?.status === 403) {
          alert(serverMessage || t('noPermission'))
        } else if (error.response?.status === 400) {
          // 용량 초과, 잘못된 포맷 등 서버 메시지를 우선 표시
          alert(serverMessage || '입력 정보에 문제가 있어! 다시 확인해줘 📝')
        } else if (error.response?.status === 415) {
          alert(
            serverMessage ||
              '업로드 형식이 올바르지 않아! multipart/form-data로 다시 시도해줘 📎'
          )
        } else {
          alert(serverMessage || '오류가 발생했어! 잠시 후 다시 시도해줘 🔄')
        }
      } finally {
        setLoading(false)
      }
    },
    [
      formData,
      images,
      isEdit,
      id,
      inputType,
      unknownOriginalPrice,
      validateForm,
      navigate,
      t
    ]
  )

  // 안전한 네비게이션
  const safeNavigate = useCallback(
    path => {
      if (hasUnsavedChanges) {
        setPendingNavigation(path)
        setShowWarningModal(true)
      } else {
        void navigate(path)
      }
    },
    [hasUnsavedChanges, navigate]
  )

  const handleConfirmExit = useCallback(() => {
    setShowWarningModal(false)
    const targetPath = pendingNavigation || '/marketplace'
    void navigate(targetPath)
    setPendingNavigation(null)
  }, [navigate, pendingNavigation])

  const handleCancelExit = useCallback(() => {
    setShowWarningModal(false)
    setPendingNavigation(null)
  }, [])

  const handleSaveDraftAndExit = useCallback(async () => {
    try {
      await handleSaveDraft()
      setShowWarningModal(false)
      const targetPath = pendingNavigation || '/marketplace'
      void navigate(targetPath)
      setPendingNavigation(null)
    } catch {
      setShowWarningModal(false)
      const targetPath = pendingNavigation || '/marketplace'
      void navigate(targetPath)
      setPendingNavigation(null)
    }
  }, [handleSaveDraft, navigate, pendingNavigation])

  const handleCancel = useCallback(
    e => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      safeNavigate('/marketplace')
    },
    [safeNavigate]
  )

  const handleCloseBookSearch = useCallback(() => {
    setShowBookSearch(false)
    setSearchQuery('')
    setSearchResults([])
    setSearchLoading(false)
  }, [])

  const recommended = getRecommendedPrice()

  if (loading && isEdit) {
    return (
      <WriteContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>{t('postWrite.loadingPost')}</p>
        </div>
      </WriteContainer>
    )
  }

  return (
    <>
      <div className="header-spacer" />
      <WriteContainer>
        <WriteHeader>
          <BackButton
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              setPendingNavigation('/marketplace')
              setShowWarningModal(true)
            }}>
            <LucideArrowLeft /> {t('postWrite.backButton')}
          </BackButton>
          <WriteTitle>
            {isEdit ? t('postWrite.editTitle') : t('postWrite.title')}
          </WriteTitle>
        </WriteHeader>

        <WriteForm onSubmit={handleSubmit}>
          {!isEdit && (
            <FormSection>
              <SectionTitle>
                <LucideBook /> {t('postWrite.registrationMethod')}
              </SectionTitle>
              <InputTypeButtons>
                <InputTypeButton
                  type="button"
                  $active={inputType === 'search'}
                  onClick={() => {
                    // 검색 방식으로 바꾸면 정가 없음 플래그를 해제한다
                    setInputType('search')
                    setUnknownOriginalPrice(false)
                  }}>
                  {t('postWrite.bookSearch')}
                </InputTypeButton>
                <InputTypeButton
                  type="button"
                  $active={inputType === 'custom'}
                  onClick={() => setInputType('custom')}>
                  {t('postWrite.directInput')}
                </InputTypeButton>
              </InputTypeButtons>
            </FormSection>
          )}

          {/* --- 책 정보 섹션 --- */}
          <FormSection>
            <SectionTitle>📖 {t('postWrite.bookInfo')}</SectionTitle>
            {inputType === 'search' ? (
              <>
                {!isEdit && (
                  <FormGroup>
                    <Label>
                      {t('postWrite.bookSearch')} <Required>*</Required>
                    </Label>
                    <BookSearchButton
                      type="button"
                      onClick={() => setShowBookSearch(true)}>
                      <LucideSearch /> {t('postWrite.bookSearchButton')}
                    </BookSearchButton>
                  </FormGroup>
                )}
                {formData.bookTitle && (
                  <SelectedBookDisplay>
                    <BookItemTitle>{formData.bookTitle}</BookItemTitle>
                    <BookInfo>
                      {t('postWrite.author')}: {formData.author} |{' '}
                      {t('postWrite.publisher')}: {formData.publisher}
                    </BookInfo>
                  </SelectedBookDisplay>
                )}
              </>
            ) : (
              <>
                <FormGroup>
                  <Label>
                    {t('postWrite.bookTitle')} <Required>*</Required>
                  </Label>
                  <Input
                    name="bookTitle"
                    value={formData.bookTitle}
                    onChange={handleInputChange}
                    placeholder={t('postWrite.bookSearchPlaceholder')}
                  />
                  {errors.bookTitle && (
                    <ErrorMessage>{errors.bookTitle}</ErrorMessage>
                  )}
                </FormGroup>
                <FormGroup>
                  <Label>
                    {t('postWrite.author')} <Required>*</Required>
                  </Label>
                  <Input
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder={t('postWrite.authorPlaceholder')}
                  />
                  {errors.author && (
                    <ErrorMessage>{errors.author}</ErrorMessage>
                  )}
                </FormGroup>
                <FormGroup>
                  <Label>{t('postWrite.publisher')}</Label>
                  <Input
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                    placeholder={t('postWrite.publisherPlaceholder')}
                  />
                </FormGroup>
              </>
            )}
          </FormSection>

          <FormSection>
            <SectionTitle>
              <LucideCamera /> {t('postWrite.photoRegistration')} (
              {t('postWrite.maxPhotos')})
            </SectionTitle>
            <input
              ref={imageInputRef}
              id="imageInput"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {images.length < MAX_IMAGES && (
              <ImageUploadArea
                onClick={() =>
                  imageInputRef.current && imageInputRef.current.click()
                }>
                <ImageUploadIcon>
                  <LucideImage />
                </ImageUploadIcon>
                <ImageUploadText>
                  {t('postWrite.clickToUpload')}
                </ImageUploadText>
                <HelpText>{t('postWrite.photoHelp')}</HelpText>
              </ImageUploadArea>
            )}
            {images.length > 0 && (
              <ImagePreview>
                {images.map(image => (
                  <ImagePreviewItem key={image.id}>
                    <ImagePreviewImg
                      src={image.preview}
                      alt={t('common.preview')}
                    />
                    <RemoveImageButton
                      onClick={() => handleRemoveImage(image.id)}>
                      <LucideX />
                    </RemoveImageButton>
                  </ImagePreviewItem>
                ))}
              </ImagePreview>
            )}
          </FormSection>

          {/* --- 판매글 정보 섹션 --- */}
          <FormSection>
            <SectionTitle>📝 {t('postWrite.postInfo')}</SectionTitle>
            <FormGroup>
              <Label>
                {t('postWrite.category')} <Required>*</Required>
              </Label>
              <CategoryRow>
                <CategorySelect
                  value={formData.mainCategory}
                  onChange={e => {
                    const main = e.target.value
                    const mainNode = (catTree || []).find(m => m.name === main)
                    const firstSub = mainNode?.children?.[0]?.name || ''
                    const firstDetail = firstSub
                      ? mainNode.children.find(s => s.name === firstSub)
                          ?.children?.[0]?.name || ''
                      : ''
                    setFormData(prev => ({
                      ...prev,
                      mainCategory: main,
                      subCategory: firstSub,
                      detailCategory: firstDetail
                    }))
                    clearErrors('category')
                  }}>
                  <option value="">{t('postWrite.mainCategory')}</option>
                  {(catTree || []).map(node => (
                    <option
                      key={node.name}
                      value={node.name}>
                      {t(node.name)}
                    </option>
                  ))}
                </CategorySelect>
                <CategorySelect
                  value={formData.subCategory}
                  onChange={e => {
                    const sub = e.target.value
                    const mainNode = (catTree || []).find(
                      m => m.name === formData.mainCategory
                    )
                    const firstDetail = sub
                      ? mainNode?.children?.find(s => s.name === sub)
                          ?.children?.[0]?.name || ''
                      : ''
                    setFormData(prev => ({
                      ...prev,
                      subCategory: sub,
                      detailCategory: firstDetail
                    }))
                    clearErrors('category')
                  }}
                  disabled={!formData.mainCategory}>
                  <option value="">{t('postWrite.subCategory')}</option>
                  {(() => {
                    const mainNode = (catTree || []).find(
                      m => m.name === formData.mainCategory
                    )
                    return (mainNode?.children || []).map(s => (
                      <option
                        key={s.name}
                        value={s.name}>
                        {t(s.name)}
                      </option>
                    ))
                  })()}
                </CategorySelect>
                <CategorySelect
                  value={formData.detailCategory}
                  onChange={e => {
                    setFormData(prev => ({
                      ...prev,
                      detailCategory: e.target.value
                    }))
                    clearErrors('category')
                  }}
                  disabled={!formData.subCategory}>
                  <option value="">{t('postWrite.detailCategory')}</option>
                  {(() => {
                    const mainNode = (catTree || []).find(
                      m => m.name === formData.mainCategory
                    )
                    const subNode = mainNode?.children?.find(
                      s => s.name === formData.subCategory
                    )
                    return (subNode?.children || []).map(d => (
                      <option
                        key={d.name}
                        value={d.name}>
                        {t(d.name)}
                      </option>
                    ))
                  })()}
                </CategorySelect>
              </CategoryRow>
              {errors.category && (
                <ErrorMessage>{errors.category}</ErrorMessage>
              )}
            </FormGroup>
            <FormGroup>
              <Label>
                {t('postWrite.postTitle')} <Required>*</Required>
              </Label>
              <Input
                name="postTitle"
                value={formData.postTitle}
                onChange={handleInputChange}
                placeholder={t('postWrite.postTitlePlaceholder')}
              />
              {errors.postTitle && (
                <ErrorMessage>{errors.postTitle}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>
                {t('postWrite.writingCondition')} <Required>*</Required>
              </Label>
              <ToggleContainer>
                {['상', '중', '하'].map(condition => (
                  <ToggleOption
                    key={condition}
                    $checked={formData.writingCondition === condition}>
                    <input
                      type="radio"
                      name="writingCondition"
                      value={condition}
                      checked={formData.writingCondition === condition}
                      onChange={handleInputChange}
                    />
                    <ToggleText
                      $checked={formData.writingCondition === condition}>
                      {condition} (
                      {condition === '상'
                        ? t('postWrite.writingHigh')
                        : condition === '중'
                          ? t('postWrite.writingMedium')
                          : t('postWrite.writingLow')}
                      )
                    </ToggleText>
                  </ToggleOption>
                ))}
              </ToggleContainer>
              {errors.writingCondition && (
                <ErrorMessage>{errors.writingCondition}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>
                {t('postWrite.tearCondition')} <Required>*</Required>
              </Label>
              <ToggleContainer>
                {['상', '중', '하'].map(condition => (
                  <ToggleOption
                    key={condition}
                    $checked={formData.tearCondition === condition}>
                    <input
                      type="radio"
                      name="tearCondition"
                      value={condition}
                      checked={formData.tearCondition === condition}
                      onChange={handleInputChange}
                    />
                    <ToggleText $checked={formData.tearCondition === condition}>
                      {condition} (
                      {condition === '상'
                        ? t('postWrite.tearHigh')
                        : condition === '중'
                          ? t('postWrite.tearMedium')
                          : t('postWrite.tearLow')}
                      )
                    </ToggleText>
                  </ToggleOption>
                ))}
              </ToggleContainer>
              {errors.tearCondition && (
                <ErrorMessage>{errors.tearCondition}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>
                {t('postWrite.waterCondition')} <Required>*</Required>
              </Label>
              <ToggleContainer>
                {['상', '중', '하'].map(condition => (
                  <ToggleOption
                    key={condition}
                    $checked={formData.waterCondition === condition}>
                    <input
                      type="radio"
                      name="waterCondition"
                      value={condition}
                      checked={formData.waterCondition === condition}
                      onChange={handleInputChange}
                    />
                    <ToggleText
                      $checked={formData.waterCondition === condition}>
                      {condition} (
                      {condition === '상'
                        ? t('postWrite.waterHigh')
                        : condition === '중'
                          ? t('postWrite.waterMedium')
                          : t('postWrite.waterLow')}
                      )
                    </ToggleText>
                  </ToggleOption>
                ))}
              </ToggleContainer>
              {errors.waterCondition && (
                <ErrorMessage>{errors.waterCondition}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>{t('postWrite.negotiable')}</Label>
              <ToggleContainer>
                <ToggleOption $checked={formData.negotiable === true}>
                  <input
                    type="radio"
                    name="negotiable"
                    value={true}
                    checked={formData.negotiable === true}
                    onChange={() =>
                      setFormData(prev => ({ ...prev, negotiable: true }))
                    }
                  />
                  <ToggleText $checked={formData.negotiable === true}>
                    {t('postWrite.negotiableYes')}
                  </ToggleText>
                </ToggleOption>
                <ToggleOption $checked={formData.negotiable === false}>
                  <input
                    type="radio"
                    name="negotiable"
                    value={false}
                    checked={formData.negotiable === false}
                    onChange={() =>
                      setFormData(prev => ({ ...prev, negotiable: false }))
                    }
                  />
                  <ToggleText $checked={formData.negotiable === false}>
                    {t('postWrite.negotiableNo')}
                  </ToggleText>
                </ToggleOption>
              </ToggleContainer>
            </FormGroup>

            <FormGroup>
              <Label>
                {t('postWrite.originalPrice')} <Required>*</Required>
              </Label>
              <Input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleOriginalPriceChange}
                placeholder={t('postWrite.originalPricePlaceholder')}
                min={PRICE_MIN}
                max={ORIGINAL_PRICE_MAX}
                step={1}
              />
              {errors.originalPrice && (
                <ErrorMessage>{errors.originalPrice}</ErrorMessage>
              )}
              <HelpText>{t('postWrite.originalPriceHelp')} </HelpText>
            </FormGroup>

            <FormGroup>
              <Label>
                {t('postWrite.sellingPrice')} <Required>*</Required>
              </Label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handlePriceChange}
                placeholder={t('postWrite.sellingPricePlaceholder')}
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={1}
              />
              {errors.price && <ErrorMessage>{errors.price}</ErrorMessage>}

              {formData.originalPrice && recommended && (
                <DiscountInfo>
                  {t('postWrite.discountRate')}: {recommended.discountRate}% (
                  {(
                    parseInt(formData.originalPrice) -
                    recommended.recommendedPrice
                  ).toLocaleString()}
                  {t('postWrite.discountAmount')})
                  <br />
                  <strong>
                    {t('postWrite.recommendedPrice')}:{' '}
                    {recommended.recommendedPrice.toLocaleString()}원
                  </strong>
                  <RecommendButton
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        price: recommended.recommendedPrice.toString()
                      }))
                    }>
                    {t('postWrite.useRecommendedPrice')}
                  </RecommendButton>
                  <InfoButton
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    title={t('postWrite.priceInfo')}>
                    <LucideInfo />
                  </InfoButton>
                </DiscountInfo>
              )}
            </FormGroup>

            <FormGroup>
              <Label>{t('postWrite.description')}</Label>
              <TextArea
                name="postContent"
                value={formData.postContent}
                onChange={handleInputChange}
                placeholder={t('postWrite.descriptionPlaceholder')}
              />
              <HelpText>{t('postWrite.descriptionHelp')}</HelpText>
            </FormGroup>
          </FormSection>

          {/* ✅ 거래 기준 위치(필수) 섹션 */}
          <FormSection>
            <SectionTitle>
              <LucideMapPin /> {t('postWrite.tradeLocation')}{' '}
              <Required>*</Required>
            </SectionTitle>

            {/* 교내: 드롭다운 */}
            <FormGroup>
              <Label>
                {t('postWrite.onCampusLocation')} <Required>*</Required>
              </Label>
              <Select
                name="oncampusPlaceCode"
                value={formData.oncampusPlaceCode}
                onChange={handleInputChange}>
                <option value="">{t('postWrite.selectBuilding')}</option>
                {ONCAMPUS_CODES.map(code => (
                  <option
                    key={code}
                    value={code}>
                    {code}
                  </option>
                ))}
              </Select>
              {errors.oncampusPlaceCode && (
                <ErrorMessage>{errors.oncampusPlaceCode}</ErrorMessage>
              )}
              <HelpText>{t('postWrite.onCampusHelp')}</HelpText>
            </FormGroup>

            {/* 교외: 호선 → 역 2단 드롭다운 */}
            <FormGroup>
              <Label>
                {t('postWrite.offCampusLocation')} <Required>*</Required>
              </Label>

              {/* 1) 호선 */}
              <Select
                value={offcampusLine}
                onChange={e => {
                  setOffcampusLine(e.target.value)
                  setFormData(prev => ({ ...prev, offcampusStationCode: '' }))
                  clearErrors('offcampusStationCode')
                }}>
                <option value="">{t('postWrite.selectLine')}</option>
                {Object.keys(SUBWAY_MAP).map(line => (
                  <option
                    key={line}
                    value={line}>
                    {line}
                  </option>
                ))}
              </Select>

              {/* 2) 역 */}
              <div style={{ marginTop: 8 }} />
              <Select
                name="offcampusStationCode"
                value={formData.offcampusStationCode}
                onChange={handleInputChange}
                disabled={!offcampusLine}>
                <option value="">
                  {offcampusLine
                    ? t('postWrite.selectStation')
                    : t('postWrite.selectLineFirst')}
                </option>
                {(SUBWAY_MAP[offcampusLine] || []).map(st => (
                  <option
                    key={st}
                    value={st}>
                    {st}
                  </option>
                ))}
              </Select>

              {errors.offcampusStationCode && (
                <ErrorMessage>{errors.offcampusStationCode}</ErrorMessage>
              )}
              <HelpText>{t('postWrite.offCampusHelp')}</HelpText>
            </FormGroup>
          </FormSection>

          {/* 버튼 영역 */}
          <ButtonSection>
            <ButtonGroup>
              <CancelButton
                type="button"
                onClick={handleCancel}>
                {t('postWrite.cancel')}
              </CancelButton>

              {!isEdit && (
                <SaveDraftButton
                  type="button"
                  onClick={handleSaveDraftAndExit}>
                  <LucideSave /> {t('postWrite.saveDraft')}
                </SaveDraftButton>
              )}

              <SubmitButton
                type="submit"
                disabled={loading}>
                {loading
                  ? isEdit
                    ? t('postWrite.editing')
                    : t('postWrite.submitting')
                  : isEdit
                    ? t('postWrite.edit')
                    : t('postWrite.submit')}
              </SubmitButton>
            </ButtonGroup>
          </ButtonSection>
        </WriteForm>
      </WriteContainer>

      {/* 책 검색 모달 */}
      {showBookSearch && (
        <BookSearchModal>
          <BookSearchContent>
            <h3>📚 {t('postWrite.bookSearchModal')}</h3>

            {/* ISBN 입력 가이드 */}
            <div
              style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                border: '1px solid #bbdefb',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#1976d2'
              }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>💡</span>
                <span>{t('ISBNWithoutHyphen')}</span>
              </div>
            </div>

            <SearchInput
              type="text"
              placeholder={t('postWrite.searchPlaceholder')}
              value={searchQuery}
              onChange={e => {
                // ISBN 입력 시 자동으로 하이픈 제거
                const value = e.target.value.replace(/-/g, '')
                setSearchQuery(value)
              }}
              onKeyDown={e =>
                e.key === 'Enter' && !searchLoading && handleBookSearch()
              }
            />
            <BookSearchButton
              type="button"
              onClick={handleBookSearch}
              disabled={searchLoading}>
              <LucideSearch />{' '}
              {searchLoading
                ? t('postWrite.searching')
                : t('postWrite.searchButton')}
            </BookSearchButton>

            {searchLoading && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                {t('postWrite.searchingText')}
              </div>
            )}

            <BookList>
              {(Array.isArray(searchResults) ? searchResults : []).map(
                (book, index) => (
                  <BookItem
                    key={index}
                    onClick={() => handleBookSelect(book)}>
                    {book.thumbnail && (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        style={{
                          width: 48,
                          height: 70,
                          objectFit: 'cover',
                          marginRight: 8,
                          borderRadius: 4
                        }}
                      />
                    )}
                    <div>
                      <BookItemTitle>{book.title}</BookItemTitle>
                      <BookInfo>
                        {t('postWrite.author')}:{' '}
                        {book.author || t('postWrite.noAuthor')} |{' '}
                        {t('postWrite.publisher')}:{' '}
                        {book.publisher || t('postWrite.noPublisher')}
                      </BookInfo>
                      {book.isbn && <BookInfo>ISBN: {book.isbn}</BookInfo>}
                    </div>
                  </BookItem>
                )
              )}
            </BookList>

            <ModalButtons>
              <ModalButton
                type="button"
                className="secondary"
                onClick={handleCloseBookSearch}>
                {t('postWrite.close')}
              </ModalButton>
            </ModalButtons>
          </BookSearchContent>
        </BookSearchModal>
      )}

      {/* 경고 모달 */}
      <WarningModal
        isOpen={showWarningModal}
        onClose={handleCancelExit}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        onSaveDraft={handleSaveDraftAndExit}
        type="sale"
        showSaveDraft={!isEdit}
      />

      {/* 정보 모달 */}
      {showInfoModal && (
        <InfoModalOverlay onClick={() => setShowInfoModal(false)}>
          <InfoModalContent onClick={e => e.stopPropagation()}>
            <h3>{t('postWrite.priceCalculationTitle')}</h3>
            <InfoDescription>
              <p>{t('postWrite.priceCalculationDesc')}</p>
              <p>{t('postWrite.priceCalculationNote')}</p>
            </InfoDescription>
            <InfoTable>
              <thead>
                <tr>
                  <th>{t('postWrite.evaluationItem')}</th>
                  <th>{t('postWrite.weight')}</th>
                  <th>{t('postWrite.discountByStatus')}</th>
                  <th>{t('postWrite.description')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{t('postWrite.writingStatus')}</strong>
                  </td>
                  <td>15%</td>
                  <td>
                    {t('상')}: 2.25% / {t('중')}: 5.25% / {t('하')}: 8.25%
                  </td>
                  <td>{t('used1')}</td>
                </tr>
                <tr>
                  <td>
                    <strong>{t('postWrite.tearStatus')}</strong>
                  </td>
                  <td>35%</td>
                  <td>
                    {t('상')}: 5.25% / {t('중')}: 12.25% / {t('하')}: 19.25%
                  </td>
                  <td>{t('used2')}</td>
                </tr>
                <tr>
                  <td>
                    <strong>{t('postWrite.waterStatus')}</strong>
                  </td>
                  <td>50%</td>
                  <td>
                    {t('상')}: 7.5% / {t('중')}: 17.5% / {t('하')}: 27.5%
                  </td>
                  <td>{t('used3')}</td>
                </tr>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <td>
                    <strong>{t('postWrite.usedBookDiscount')}</strong>
                  </td>
                  <td>-</td>
                  <td>10%</td>
                  <td>{t('used4')}</td>
                </tr>
                <tr style={{ backgroundColor: '#e3f2fd', fontWeight: 'bold' }}>
                  <td colSpan={2}>
                    <strong>{t('postWrite.maxDiscount')}</strong>
                  </td>
                  <td>
                    <strong>{t('about')} 65%</strong>
                  </td>
                  <td>
                    <strong>{t('postWrite.allLow')}</strong>
                  </td>
                </tr>
              </tbody>
            </InfoTable>
            <InfoNote>
              <p>
                <strong>{t('postWrite.priceNote')}</strong>
              </p>
              <ul>
                <li>{t('postWrite.priceNote1')}</li>
                <li>{t('postWrite.priceNote2')}</li>
                <li>{t('postWrite.priceNote3')}</li>
                <li>{t('postWrite.priceNote4')}</li>
              </ul>
            </InfoNote>
            <InfoModalClose onClick={() => setShowInfoModal(false)}>
              {t('postWrite.confirm')}
            </InfoModalClose>
          </InfoModalContent>
        </InfoModalOverlay>
      )}
    </>
  )
}

export default PostWrite
