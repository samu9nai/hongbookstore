import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import styled from 'styled-components';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../contexts/LocationContext'; // TODO: 위치 관리 기능 구현
import axios from 'axios';
import { getUserPeerReviews, getUserPeerSummary } from '../../api/peerReviews';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import Loading from '../../components/ui/Loading';
// 지도 선택 기능 제거로 NaverMap import 불필요
import { openDaumPostcode } from '../../utils/daumPostcode';
import { AuthCtx } from '../../contexts/AuthContext';
import AdminReportCard from './AdminReportCard.jsx';


const MyPageContainer = styled.div`
  padding: 2rem 1rem 4rem;
  max-width: 1200px;
  width: 100%;  
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: var(--background);
  min-height: 100vh;
  
  @media (min-width: 768px) {
    padding: 3rem 2rem 4rem;
    gap: 2.5rem;
  }
  
  @media (min-width: 1024px) {
    padding: 4rem 3rem 4rem;
    gap: 3rem;
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    grid-template-columns: minmax(540px, 1fr) 1fr;
    grid-template-rows: auto;
    align-items: start;
  }
`;
// 왼쪽/오른쪽 칼럼 래퍼
const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (min-width: 1024px) { grid-column: 1 / 2; }
`;

const RightColumn = styled.div`
  @media (min-width: 1024px) { grid-column: 2 / 3; }
`;

const ProfileCard = styled.div`
  background: var(--surface);
  border-radius: 1.25rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
  
  @media (min-width: 1024px) {
    flex-direction: column;
    text-align: center;
    padding: 2.5rem;
    gap: 2rem;
  }
`;

const ProfileInfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  text-align: center;
`;

const ProfileNameRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
`;

const ProfileNameLeft = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;
// ---
const ProfileNameRightCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
`;

const ProfileNameRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
`;

const ProfileEmail = styled.div`
  color: var(--text-light);
  font-size: 1.02rem;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;
// ---

const ProfileImageBig = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: visible;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  position: relative;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      var(--score-color, #D97706) 0deg var(--score-percentage, 306deg),
      #e5e7eb var(--score-percentage, 306deg) 360deg
    );
    z-index: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    background: white;
    z-index: 1;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    position: relative;
    z-index: 2;
  }
  
  i {
    font-size: 48px;
    color: var(--primary);
    position: relative;
    z-index: 2;
  }
  
  @media (max-width: 1024px) {
    width: 100px;
    height: 100px;
    
    i {
      font-size: 40px;
    }
  }
`;

const StyledPhotoChangeButton = styled.button`
  position: absolute;
  right: -5px;
  bottom: -5px;
  background: none;
  color: var(--primary);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.05rem;
  z-index: 5;
  transition: all 0.2s;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: var(--primary-dark);
  }
  @media (max-width: 600px) {
    right: -4px;
    bottom: -4px;
    font-size: 0.04rem;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

// ---
const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.5rem;
  h2 {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
  }
`;

const RatingSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--background);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius);
  box-shadow: none;
  z-index: 1;
`;

const AverageRating = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${props => {
    const rating = props.rating;
    if (rating >= 7) return 'var(--primary)';
    if (rating >= 4) return 'var(--secondary)';
    return 'var(--accent)';
  }};
`;

const RatingCount = styled.span`
  font-size: 0.75rem;
  color: var(--text-light);
`;

const ProfileStats = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const StatItem = styled.div`
  text-align: center;

  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
  }

  .label {
    font-size: 0.875rem;
    color: var(--text-light);
  }
`;

const TabContainer = styled.div`
  margin-bottom: 2rem;
  width: 100%;
`;

const TabList = styled.div`
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2rem;
  justify-content: center;
`;

const TabButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.$active ? 'var(--primary)' : 'var(--text-light)'};
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? 'var(--primary)' : 'transparent'};
  cursor: pointer;
  transition: var(--transition);

  &:hover {
    color: var(--primary);
  }
`;
// ---

const SettingsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  
  @media (min-width: 1024px) {
    gap: 2.5rem;
    grid-column: 2 / 3;   /* 오른쪽 칼럼 고정 */
  }
`;

const SettingsSection = styled.div`
  background: var(--surface);
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .verification-status {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    background: var(--surface);
    border: 2px solid var(--border);
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    &.verified {
      color: #ffffff;
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      border-color: #7c3aed;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }
    
    &.not-verified {
      color: #ffffff;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      border-color: #f97316;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
    }
    
    i {
      font-size: 1rem;
    }
  }
  
  p {
    color: var(--text-light);
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    
    h3 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }
  }
  
  @media (min-width: 1024px) {
    padding: 2.5rem;
    
    h3 {
      font-size: 1.35rem;
      margin-bottom: 2rem;
    }
  }
`;

// 최근 본 게시글 카드 스타일
const RecentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
`;

const RecentCard = styled.div`
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  padding: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    border-color: var(--primary);
  }
`;

const RecentThumb = styled.div`
  width: 100%;
  height: 120px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  overflow: hidden;
  margin-bottom: 0.5rem;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const RecentTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const RecentMeta = styled.div`
  font-size: 0.8rem;
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

// 확인 모달 스타일
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  width: min(520px, 92vw);
  background: var(--surface);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.25);
  border: 1px solid var(--border);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  font-weight: 700;
  color: var(--text);
`;

const ModalBody = styled.div`
  padding: 1rem 1.25rem;
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 1rem;
`;

const ModalThumb = styled.div`
  width: 96px;
  height: 96px;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const ModalInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  .title { font-weight: 700; color: var(--text); line-height: 1.3; }
  .meta { font-size: 0.9rem; color: var(--text-light); }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem 1.25rem;
`;

const ModalButton = styled.button`
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  font-weight: 600;
  color: var(--text);
  transition: all 0.15s;
  &:hover { background: #f8fafc; }
  &.primary {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
  }
  &.primary:hover { filter: brightness(0.95); }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: var(--primary);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
  }

  &.danger {
    background: var(--accent);
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2);

    &:hover {
      background: #ea580c;
      box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);
    }
  }
`;

const LocationSection = styled(SettingsSection)`
  .location-list {
    margin-bottom: 2rem;
  }

  .location-item {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--background);
    border-radius: 1rem;
    border: 1px solid var(--border);
    margin-bottom: 1rem;
    transition: all 0.2s ease;

    &:last-child {
      margin-bottom: 0;
    }
    
    &:hover {
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .location-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .location-name {
        font-weight: 600;
        color: var(--text);
        font-size: 1.125rem;
      }

      .location-address {
        font-size: 0.875rem;
        color: var(--text-light);
      }
    }

    .location-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  }

  .add-location {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }

  .add-location-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    
    @media (max-width: 480px) {
      flex-direction: column;
    }
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  background: var(--background);
  color: var(--text);
  font-size: 1rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    background: var(--surface);
  }
  
  &::placeholder {
    color: #adb5bd;
    opacity: 0.7;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    color: var(--primary);
    background: rgba(124, 58, 237, 0.1);
    transform: scale(1.1);
  }

  &.danger:hover {
    color: var(--accent);
    background: rgba(249, 115, 22, 0.1);
  }
`;

const VerificationForm = styled.div`
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0.15) 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 1rem;
  border: none;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 6px 25px rgba(124, 58, 237, 0.2);
    transform: translateY(-1px);
  }
`;

// ---
const InputGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const VerificationInput = styled(Input)`
  flex: 1;
  font-size: 1.25rem;
  text-align: center;
  letter-spacing: 0.5rem;
  font-weight: 600;
  color: var(--text);
  padding: 1rem;
  height: 3.5rem;

  &::placeholder {
    letter-spacing: normal;
    font-size: 1rem;
    font-weight: normal;
  }
`;
// ---

const VerificationMessage = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &.success {
    background: rgba(124, 58, 237, 0.1);
    color: var(--primary);
    border: 1px solid rgba(124, 58, 237, 0.2);
  }

  &.error {
    background: rgba(249, 115, 22, 0.1);
    color: var(--accent);
    border: 1px solid rgba(249, 115, 22, 0.2);
  }

  &.info {
    background: rgba(14, 165, 233, 0.1);
    color: var(--secondary);
    border: 1px solid rgba(14, 165, 233, 0.2);
  }
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: var(--transition);

  &:hover {
    color: var(--primary-dark);
  }

  &:disabled {
    color: var(--text-light);
    cursor: not-allowed;
  }
`;

const VerificationSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-light);
  margin-bottom: 1rem;

  .step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &.active {
      color: var(--primary);
      font-weight: 600;
    }

    &.completed {
      color: var(--text);
    }
  }

  .step-divider {
    flex: 1;
    height: 1px;
    background: var(--border);
    margin: 0 0.5rem;
  }
`;

const SettingsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const SettingsItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);
  font-size: 1rem;
  transition: background-color 0.2s ease;
  
  &:last-child { 
    border-bottom: none; 
  }
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
    margin: 0 -1rem;
    padding: 1rem;
    border-radius: 0.5rem;
  }
`;

const SmallButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.5em 1.2em;
  font-size: 0.9rem;
  font-weight: 500;
  color: #4B5563;
  background: #F3F4F6;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: none;
  outline: none;
  
  &:hover {
    background: #E5E7EB;
    color: #374151;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &.danger {
    color: #DC2626;
    background: #FEF2F2;
    border-color: #FCA5A5;
    
    &:hover { 
      background: #DC2626;
      color: white;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    }
  }
`;

const EmailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const SchoolRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

// 인증 토큰을 가져오는 헬퍼 함수
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// 작성자 표시: 탈퇴회원# 패턴 또는 백엔드 플래그(authorDeactivated) 감지
const getDisplayAuthor = (author, authorDeactivated) => {
  const name = String(author ?? '');
  if (authorDeactivated) return '탈퇴한 회원';
  if (/^탈퇴회원#/i.test(name)) return '탈퇴한 회원';
  return name || '사용자';
};


const MyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const { updateUser } = useContext(AuthCtx);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [univEmail, setUnivEmail] = useState(''); // 사용자가 입력할 학교 이메일
  // 인증 요청 후 서버 메시지를 담을 상태
  const [verificationMessage, setVerificationMessage] = useState({ type: '', text: '' }); 
  const [isSubmitting, setIsSubmitting] = useState(false); // API 호출 중복 방지

  const { locations, setDefaultLocation, addLocation, deleteLocation, updateLocation } = useLocation();


  const [profileImage, setProfileImage] = useState(null);
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [newLocation, setNewLocation] = useState({ name: '', address: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  // 우편번호 전용으로 단순화: 주소 검색 관련 상태 제거

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', address: '', lat: null, lng: null });
  const [showEditCancelConfirm, setShowEditCancelConfirm] = useState(false);

  // 지도 선택 제거

  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const photoMenuRef = useRef();
  const [editingName, setEditingName] = useState(false);
  const [profileName, setProfileName] = useState(t('profileName', 'John Doe'));
  const pendingNameRef = useRef(null);

  // 닉네임 저장 API 호출
  const saveProfileName = async () => {
    const current = profile?.username ?? '';
    const next = (profileName ?? '').trim();
    if (!next || next.length < 2) {
      // 최소 길이 검증과 동일하게 처리
      setProfileName(current);
      return;
    }
    if (next === current) return; // 변경 없음

    // 중복 호출 방지 (blur와 enter 동시 트리거 등을 대비)
    if (pendingNameRef.current === next) return;
    pendingNameRef.current = next;

    try {
      const res = await axios.patch('/api/my/profile', { username: next }, { headers: getAuthHeader() });
      if (res?.data?.success) {
        const updated = res.data.data;
        setProfile(updated);
        setProfileName(updated.username);
        // 로컬 사용자 정보도 동기화 (헤더/채팅 등에서 참조)
        try {
          const userJson = localStorage.getItem('user');
          const userObj = userJson ? JSON.parse(userJson) : {};
          localStorage.setItem('user', JSON.stringify({ ...userObj, username: updated.username }));
        } catch (_) {}
        try { updateUser?.({ username: updated.username }); } catch (_) {}
      } else {
        alert(res?.data?.message || t('mypage.nicknameChangeFailed'));
        setProfileName(current);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || t('mypage.nicknameChangeError');
      alert(msg);
      setProfileName(current);
    } finally {
      pendingNameRef.current = null;
    }
  };
  const nameInputRef = useRef();
  
  // 평점에 따른 색상 계산 함수
  const getScoreColor = (score) => {
    if (score <= 25) return '#FEF3C7'; // 연노랑
    if (score <= 50) return '#FDE68A'; // 노랑
    if (score <= 75) return '#F59E0B'; // 주황
    return '#D97706'; // 진주황
  };
  
  // 거래 평점 요약 상태
  const [ratingSummary, setRatingSummary] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState('');
  // 통합 Peer 리뷰 탭 상태
  const [reviewTab, setReviewTab] = useState('SELLER'); // SELLER | BUYER
  const [roleReviews, setRoleReviews] = useState([]);
  const [rolePage, setRolePage] = useState(0);
  const [roleSize, setRoleSize] = useState(5);
  const [roleTotal, setRoleTotal] = useState(0);
  const [roleLast, setRoleLast] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [roleSummary, setRoleSummary] = useState({ SELLER: null, BUYER: null });

  const fetchProfile = useCallback(async () => {
    // 페이지가 로드될 때마다 항상 최신 정보를 가져오도록 setLoading(true) 추가
    setLoading(true); 
    try {
      const response = await axios.get('/api/my/profile', { headers: getAuthHeader() });
      if (response.data.success) {
        const userProfile = response.data.data;
        setProfile(userProfile);
        setProfileName(userProfile.username); // 닉네임 수정용 상태에도 반영
        if (userProfile.univEmail) {
          setUnivEmail(userProfile.univEmail);
        }
      }
    } catch (error) {
      // 토큰 만료 등의 이유로 실패 시 로그인 페이지로 이동
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 최근 본 게시글 목록
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const routerNavigate = useRouterNavigate();
  const [confirmPost, setConfirmPost] = useState(null);

  const fetchRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await axios.get('/api/posts/recent?limit=10', { headers: getAuthHeader() });
      setRecentPosts(res.data || []);
    } catch (e) {
      setRecentPosts([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const openConfirm = (post) => setConfirmPost(post);
  const closeConfirm = () => setConfirmPost(null);
  const goToPost = () => {
    if (confirmPost) {
      const id = confirmPost.postId;
      setConfirmPost(null);
      routerNavigate(`/posts/${id}`);
    }
  };

  // 프로필 로드 후 거래 평점 요약 조회
  useEffect(() => {
    const fetchRating = async (uid) => {
      setRatingLoading(true);
      setRatingError('');
      try {
        const res = await axios.get(`/api/reviews/summary/users/${uid}`, { headers: getAuthHeader() });
        setRatingSummary(res.data);
      } catch (e) {
        setRatingError(e.response?.data?.message || t('mypage.ratingLoadFailed'));
      } finally {
        setRatingLoading(false);
      }
    };
    if (profile?.id) {
      fetchRating(profile.id);
    }
  }, [profile?.id]);

  // 역할별 요약/목록 조회
  const fetchRoleData = useCallback(async (uid, role, page = 0, size = roleSize) => {
    if (!uid) return;
    setRoleLoading(true);
    setRoleError('');
    try {
      const [sum, list] = await Promise.all([
        getUserPeerSummary(uid, role),
        getUserPeerReviews(uid, role, page, size)
      ]);
      setRoleSummary(prev => ({ ...prev, [role]: sum }));
      const data = list || {};
      setRoleReviews(Array.isArray(data.content) ? data.content : []);
      setRolePage(typeof data.page === 'number' ? data.page : page);
      setRoleSize(typeof data.size === 'number' ? data.size : size);
      setRoleTotal(typeof data.totalElements === 'number' ? data.totalElements : (Array.isArray(data.content) ? data.content.length : 0));
      setRoleLast(Boolean(data.last));
    } catch (e) {
      setRoleError(e.response?.data?.message || t('mypage.reviewListLoadFailed'));
      setRoleReviews([]);
    } finally {
      setRoleLoading(false);
    }
  }, [roleSize]);

  useEffect(() => {
    if (profile?.id) fetchRoleData(profile.id, reviewTab, 0, roleSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, reviewTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (photoMenuRef.current && !photoMenuRef.current.contains(event.target)) {
        setShowPhotoMenu(false);
      }
    }
    if (showPhotoMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPhotoMenu]);

  const handleSetDefault = (locationId) => {
    setDefaultLocation(locationId);
  };

  const handleDeleteLocation = (locationId) => {
    deleteLocation(locationId);
  };

  const handleAddLocation = async () => {
    const name = (newLocation.name || '').trim();
    const address = (newLocation.address || '').trim();
    if (name.length < 2) { alert(t('mypage.locationNameMinLength')); return; }
    if (address.length < 3) { alert(t('mypage.addressMinLength')); return; }
    if (locations.some(l => String(l.name||'').toLowerCase() === name.toLowerCase())) {
      alert(t('mypage.locationNameExists'));
      return;
    }

    let lat = newLocation.lat ?? null;
    let lng = newLocation.lng ?? null;
    if (lat == null || lng == null) {
      try {
        // 우편번호/주소 선택으로 채워졌을 수 있는 roadAddress를 우선 지오코딩
        const geo = await axios.get('/api/places/geocode/forward', { params: { query: newLocation.address } });
        const g = typeof geo.data === 'string' ? JSON.parse(geo.data) : geo.data;
        if (g && typeof g.lat === 'number' && typeof g.lng === 'number') {
          lat = g.lat; lng = g.lng;
        } else {
          // 폴백: 기존 로컬 검색 사용
          const res = await axios.get('/api/places/search', { params: { query: newLocation.address } });
          const raw = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          const item = Array.isArray(raw?.items) && raw.items.length > 0 ? raw.items[0] : null;
          if (item) {
            lat = Number(item.mapy) * 0.0000001;
            lng = Number(item.mapx) * 0.0000001;
          }
        }
      } catch (_) {}
    }

    await addLocation({
      name: newLocation.name,
      address: newLocation.address,
      lat,
      lng,
    });
    setNewLocation({ name: '', address: '' });
    setShowAddForm(false);
  };

  // 우편번호(다음) 검색으로 주소 선택 → 좌표 자동 보강
  const handlePostcodeSelect = async (forEdit = false) => {
    try {
      const data = await openDaumPostcode();
      const road = data.roadAddress || data.address || '';
      if (!road) return;
      if (forEdit) {
        setEditDraft(prev => ({ ...prev, address: road }));
      } else {
        setNewLocation(prev => ({ ...prev, address: road }));
      }
      try {
        const geo = await axios.get('/api/places/geocode/forward', { params: { query: road } });
        const g = typeof geo.data === 'string' ? JSON.parse(geo.data) : geo.data;
        if (typeof g?.lat === 'number' && typeof g?.lng === 'number') {
          if (forEdit) {
            setEditDraft(prev => ({ ...prev, lat: g.lat, lng: g.lng }));
          } else {
            setNewLocation(prev => ({ ...prev, lat: g.lat, lng: g.lng }));
          }
        }
      } catch (e) {
      }
    } catch (e) {
      // 사용자가 창을 닫은 경우 등 무시
    }
  };

  // 주소 검색 기능 제거

  const beginEdit = (loc) => {
    setEditingId(loc.id);
    setEditDraft({ name: loc.name || '', address: loc.address || '', lat: loc.lat ?? null, lng: loc.lng ?? null });
  };
  const hasEditChanged = () => {
    const original = locations.find(l => l.id === editingId) || {};
    return (
      (original.name || '') !== (editDraft.name || '') ||
      (original.address || '') !== (editDraft.address || '') ||
      (original.lat ?? null) !== (editDraft.lat ?? null) ||
      (original.lng ?? null) !== (editDraft.lng ?? null)
    );
  };
  const cancelEditNow = () => { setEditingId(null); setEditDraft({ name: '', address: '', lat: null, lng: null }); setEditResults([]); };
  const requestCancelEdit = () => {
    if (!hasEditChanged()) return cancelEditNow();
    setShowEditCancelConfirm(true);
  };
  const saveEdit = async () => {
    const name = (editDraft.name || '').trim();
    const address = (editDraft.address || '').trim();
    if (name.length < 2) { alert(t('mypage.locationNameMinLength')); return; }
    if (address.length < 3) { alert(t('mypage.addressMinLength')); return; }
    if (locations.some(l => l.id !== editingId && String(l.name||'').toLowerCase() === name.toLowerCase())) {
      alert(t('mypage.locationNameExists'));
      return;
    }
    try {
      await updateLocation(editingId, { name, address, lat: editDraft.lat, lng: editDraft.lng });
      cancelEdit();
    } catch (e) {
      alert(e?.response?.data?.message || t('mypage.locationUpdateError'));
    }
  };

  const handlePhotoMenuClick = () => {
    setShowPhotoMenu((prev) => !prev);
  };

  const handlePhotoMenuSelect = (option) => {
    setShowPhotoMenu(false);
    if (option === 'default') {
      setProfileImage(null);
    } else if (option === 'upload') {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await axios.post('/api/my/profile-image', form, {
        headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.data; // 백엔드가 String URL을 반환
      setProfile((prev) => ({ ...(prev || {}), profileImageUrl: newUrl }));
      setProfileImage(newUrl);
      // 전역 사용자 정보 동기화
      try { updateUser?.({ profileImageUrl: newUrl, profileImage: newUrl }); } catch (_) {}
      try {
        const userJson = localStorage.getItem('user');
        const userObj = userJson ? JSON.parse(userJson) : {};
        localStorage.setItem('user', JSON.stringify({ ...userObj, profileImage: newUrl, profileImageUrl: newUrl }));
      } catch (_) {}
    } catch (err) {
      alert(err?.response?.data?.message || t('mypage.profileImageUploadError'));
    } finally {
      // 같은 파일 재선택 가능하도록 input 리셋
      e.target.value = '';
    }
  };

  const handleSendVerification = async () => {
    setIsSubmitting(true);
    setVerificationMessage({ type: '', text: '' });

    // 이메일 형식 검증 (두 도메인 모두 허용)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(mail\.hongik\.ac\.kr|g\.hongik\.ac\.kr)$/;
    if (!emailRegex.test(univEmail)) {
      setVerificationMessage({ type: 'error', text: t('mypage.invalidEmailFormat') });
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post('/api/my/verification/request-code', { univEmail }, { headers: getAuthHeader() });
      setVerificationMessage({ type: 'info', text: t('mypage.verificationEmailSent', { email: univEmail }) });
      setShowVerificationForm(false); // 성공 시 폼 숨기기
    } catch (error) {
      const message = error.response?.data?.message || t('mypage.verificationEmailError');
      setVerificationMessage({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !profile) {
    return (
      <Loading type="hongbook" size="xl" subtext="프로필을 불러오고 있어요" fullScreen />
    );
  }

  // 프로필 링(원형) 표시를 위한 퍼센트(0~100) 계산: 0~5 ★ → ×20
  const overall = Number(ratingSummary?.overallAverage ?? 0);
  const overallPercent = Math.max(0, Math.min(100, overall * 20));

  return (
    <MyPageContainer>
      <LeftColumn>
      <ProfileCard>
        <ProfileImageBig style={{
          '--score-color': getScoreColor(overallPercent),
          '--score-percentage': `${overallPercent * 3.6}deg`
        }}>
          {profile.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt="Profile" />
          ) : (
            <i className="fas fa-user" style={{ fontSize: '48px', color: 'var(--primary)' }}></i>
          )}
          <StyledPhotoChangeButton type="button" onClick={() => fileInputRef.current.click()}>
            <i className="fas fa-camera-retro" style={{ position: 'relative', zIndex: 6, fontSize: '16px' }}></i>
          </StyledPhotoChangeButton>
          {showPhotoMenu && (
            <div ref={photoMenuRef} style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              zIndex: 10,
              minWidth: '160px',
              padding: '0.75rem 0',
              overflow: 'hidden',
            }}>
              <button style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '0.75rem 1.25rem',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s ease',
                borderBottom: '1px solid #f1f5f9',
              }} 
              onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
              onClick={() => handlePhotoMenuSelect('default')}>
                <i className="fas fa-user" style={{ color: 'var(--primary)', fontSize: '1rem' }}></i> 
                기본 아이콘
              </button>
              <button style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '0.75rem 1.25rem',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s ease',
              }} 
              onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
              onClick={() => handlePhotoMenuSelect('upload')}>
                <i className="fas fa-upload" style={{ color: 'var(--primary)', fontSize: '1rem' }}></i> 
                사진 업로드
              </button>
            </div>
          )}
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
        </ProfileImageBig>
        <ProfileInfoBox>
          <ProfileNameRow>
            <ProfileNameLeft>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                {editingName ? (
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    onBlur={async () => {
                      await saveProfileName();
                      setEditingName(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        (async () => {
                          await saveProfileName();
                          setEditingName(false);
                        })();
                      }
                    }}
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                      border: '1.5px solid var(--primary)',
                      borderRadius: 6,
                      padding: '0.2rem 0.5rem',
                      outline: 'none',
                      minWidth: 80,
                      marginRight: 2,
                    }}
                    autoFocus
                  />
                ) : (
                  <>
                    <h2 style={{margin:0}}>{profileName}</h2>
                    <SmallButton style={{marginLeft:2}} onClick={() => setEditingName(true)}>
                      <i className="fas fa-pen"></i>
                    </SmallButton>
                  </>
                )}
              </div>

            </ProfileNameLeft>
          </ProfileNameRow>
          {/* 거래 평점 표시 */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6, width:'100%', marginTop:8}}>
            {ratingLoading ? (
              <div style={{color:'#666'}}>{t('mypage.loadingRating')}</div>
            ) : ratingError ? (
              <div style={{color:'#d32f2f'}}>{ratingError}</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{fontWeight:700,color:'#333'}}>
                  {t('mypage.transactionRating')}: {overall.toFixed(2)}★
                  <span style={{color:'#777',fontWeight:500}}> / 5.00 ({t('mypage.total')} {ratingSummary?.totalCount ?? 0}{t('mypage.cases')})</span>
                </div>
                <div style={{fontSize:'0.92rem',color:'#555'}}>
                  {t('mypage.seller')}: {Number(ratingSummary?.sellerAverage ?? 0).toFixed(2)}★ · {ratingSummary?.sellerCount ?? 0}{t('mypage.cases')}
                  {"  |  "}
                  {t('mypage.buyer')}: {Number(ratingSummary?.buyerAverage ?? 0).toFixed(2)}★ · {ratingSummary?.buyerCount ?? 0}{t('mypage.cases')}
                </div>
              </div>
            )}
          </div>
        </ProfileInfoBox>
      </ProfileCard>

      <AdminReportCard />
      </LeftColumn>

      {/* 오른쪽 열 - 설정 섹션들 */}
      <SettingsContainer>
        {/* 거래 후기 섹션 (판매자/구매자 탭) */}
        <SettingsSection>
          <h3><i className="fas fa-star" style={{color: 'var(--primary)'}}></i> {t('mypage.transactionReview')}</h3>
          <TabContainer>
            <TabList>
              <TabButton $active={reviewTab === 'SELLER'} onClick={() => setReviewTab('SELLER')}>{t('mypage.sellerReview')}</TabButton>
              <TabButton $active={reviewTab === 'BUYER'} onClick={() => setReviewTab('BUYER')}>{t('mypage.buyerReview')}</TabButton>
            </TabList>
          </TabContainer>
          {/* 요약 배지 */}
          <div style={{ display:'flex', gap: 12, marginBottom: 12 }}>
            {reviewTab === 'SELLER' && (
              <div style={{padding:'6px 10px', border:'1px solid var(--border)', borderRadius:8, background:'var(--background)'}}>
                {t('mypage.average')} {Number(roleSummary.SELLER?.averageScore ?? 0).toFixed(2)}★ · {roleSummary.SELLER?.reviewCount ?? 0}{t('mypage.cases')}
              </div>
            )}
            {reviewTab === 'BUYER' && (
              <div style={{padding:'6px 10px', border:'1px solid var(--border)', borderRadius:8, background:'var(--background)'}}>
                {t('mypage.average')} {Number(roleSummary.BUYER?.averageScore ?? 0).toFixed(2)}★ · {roleSummary.BUYER?.reviewCount ?? 0}{t('mypage.cases')}
              </div>
            )}
          </div>
          {/* 목록 */}
          {roleLoading ? (
            <div style={{color:'#666'}}>{t('mypage.loadingReviews')}</div>
          ) : roleError ? (
            <div style={{color:'#d32f2f'}}>{roleError}</div>
          ) : roleReviews.length === 0 ? (
            <div style={{color:'#666'}}>아직 후기가 없습니다.</div>
          ) : (
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 }}>
              {roleReviews.map(rv => (
                <li key={rv.reviewId} style={{ display:'flex', justifyContent:'space-between', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                  <div>
                    <div style={{fontWeight:600}}>{rv.reviewerNickname || '사용자'}</div>
                    {Array.isArray(rv.ratingKeywords) && rv.ratingKeywords.length > 0 && (
                      <div style={{fontSize:'0.9rem', color:'#666'}}>{rv.ratingKeywords.join(', ')}</div>
                    )}
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{fontSize:'0.85rem', color:'#555'}}>{new Date(rv.createdAt).toLocaleDateString('ko-KR')}</span>
                    <span style={{color:'#007bff', fontWeight:700}}>{Number(rv.ratingScore).toFixed(2)}★</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {/* 페이지 네비게이션 */}
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
            <SmallButton onClick={() => fetchRoleData(profile.id, reviewTab, Math.max(0, rolePage - 1), roleSize)} disabled={rolePage <= 0}>{t('common.previous')}</SmallButton>
            <SmallButton onClick={() => !roleLast && fetchRoleData(profile.id, reviewTab, rolePage + 1, roleSize)} disabled={roleLast}>{t('common.next')}</SmallButton>
          </div>
        </SettingsSection>
        <SettingsSection>
          <h3><i className="fas fa-history" style={{color: 'var(--primary)'}}></i> {t('mypage.recentlyViewedPosts')}</h3>
          {recentLoading ? (
            <div style={{ padding: '0.5rem', color: 'var(--text-light)' }}>{t('mypage.loading')}</div>
          ) : recentPosts.length === 0 ? (
            <div style={{ padding: '0.5rem', color: 'var(--text-light)' }}>{t('mypage.noRecentlyViewedPosts')}</div>
          ) : (
            <RecentGrid>
              {recentPosts.map(p => (
                <RecentCard key={p.postId} onClick={() => openConfirm(p)}>
                  <RecentThumb>
                    {p.thumbnailUrl ? (
                      <img src={p.thumbnailUrl} alt={p.postTitle} />
                    ) : (
                      <span>{p.postTitle}</span>
                    )}
                  </RecentThumb>
                  <RecentTitle>{p.postTitle}</RecentTitle>
                  <RecentMeta>
                    <span>{(p.price ?? 0).toLocaleString()}{t('common.won')}</span>
                    <span style={{ fontSize: '0.75rem' }}>
                      {getDisplayAuthor(p.author, p.authorDeactivated)}
                    </span>
                  </RecentMeta>
                </RecentCard>
              ))}
            </RecentGrid>
          )}
        </SettingsSection>

        {confirmPost && (
          <ModalOverlay onClick={closeConfirm}>
            <ModalBox onClick={(e) => e.stopPropagation()}>
              <ModalHeader>게시글로 이동할까요?</ModalHeader>
              <ModalBody>
                <ModalThumb>
                  {confirmPost.thumbnailUrl ? (
                    <img src={confirmPost.thumbnailUrl} alt={confirmPost.postTitle} />
                  ) : (
                    <span>{confirmPost.postTitle}</span>
                  )}
                </ModalThumb>
                <ModalInfo>
                  <div className="title">{confirmPost.postTitle}</div>
                  <div className="meta">{confirmPost.author}</div>
                  <div className="meta">{(confirmPost.price ?? 0).toLocaleString()}{t('common.won')}</div>
                </ModalInfo>
              </ModalBody>
              <ModalActions>
                <ModalButton onClick={closeConfirm}>{t('common.cancel')}</ModalButton>
                <ModalButton className="primary" onClick={goToPost}>{t('common.move')}</ModalButton>
              </ModalActions>
            </ModalBox>
          </ModalOverlay>
        )}

        {confirmPost && (
          <ModalOverlay onClick={closeConfirm}>
            <ModalBox onClick={(e) => e.stopPropagation()}>
              <ModalHeader>게시글로 이동할까요?</ModalHeader>
              <ModalBody>
                <ModalThumb>
                  {confirmPost.thumbnailUrl ? (
                    <img src={confirmPost.thumbnailUrl} alt={confirmPost.postTitle} />
                  ) : (
                    <span>{confirmPost.postTitle}</span>
                  )}
                </ModalThumb>
                <ModalInfo>
                  <div className="title">{confirmPost.postTitle}</div>
                  <div className="meta">{confirmPost.author}</div>
                  <div className="meta">{(confirmPost.price ?? 0).toLocaleString()}{t('common.won')}</div>
                </ModalInfo>
              </ModalBody>
              <ModalActions>
                <ModalButton onClick={closeConfirm}>{t('common.cancel')}</ModalButton>
                <ModalButton className="primary" onClick={goToPost}>{t('common.move')}</ModalButton>
              </ModalActions>
            </ModalBox>
          </ModalOverlay>
        )}
        <SettingsSection>
          <h3>{t('mypage.accountInfo')}</h3>
          <SettingsList>
            <SettingsItem>
              <span><i className="fas fa-envelope" style={{marginRight:8, color: '#6B7280'}}></i>{profile.email}</span>
            </SettingsItem>
          </SettingsList>
        </SettingsSection>

        <SettingsSection>
          <h3><i className="fas fa-graduation-cap" style={{color: 'var(--primary)'}}></i> {t('mypage.studentVerification')}</h3>
          <SettingsList>
            <SettingsItem>
              <span><i className="fas fa-university" style={{marginRight:8, color: '#6B7280'}}></i>{t('mypage.currentStudentVerification')}</span>
              <span className={`verification-status ${profile.studentVerified ? 'verified' : 'not-verified'}`}>
                <i className={`fas fa-${profile.studentVerified ? 'check-circle' : 'exclamation-circle'}`}></i>
                {profile.studentVerified ? t('mypage.verificationComplete') : t('mypage.notVerified')}
              </span>
              {!profile.studentVerified && !showVerificationForm && (
                <SmallButton onClick={() => setShowVerificationForm(true)}>{t('mypage.verify')}</SmallButton>
              )}
            </SettingsItem>
          </SettingsList>

          {showVerificationForm && !profile.studentVerified && (
            <VerificationForm style={{padding:'1rem 0.5rem', marginTop:'0.5rem'}}>
              <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1rem'}}>
                학교 이메일(@g.hongik.ac.kr / @mail.hongik.ac.kr)을 입력하고 '인증 메일 발송' 버튼을 누르세요. 메일함의 링크를 클릭하면 인증이 완료됩니다.
              </p>
              <Input
                type="email"
                placeholder={t('mypage.emailPlaceholder')}
                value={univEmail}
                onChange={(e) => setUnivEmail(e.target.value)}
                disabled={isSubmitting}
                style={{
                  background: '#f8f9fa',
                  border: '2px solid #e9ecef',
                  color: '#495057'
                }}
              />
              <SmallButton onClick={handleSendVerification} disabled={isSubmitting}>
                {isSubmitting ? '전송 중...' : '인증 메일 발송'}
              </SmallButton>
            </VerificationForm>
          )}

          {/* 서버 응답 메시지 표시 UI */}
          {verificationMessage.text && (
            <VerificationMessage className={verificationMessage.type}>
              <i className={`fas fa-${verificationMessage.type === 'success' || verificationMessage.type === 'info' ? 'check-circle' : 'exclamation-circle'}`}></i>
              {verificationMessage.text}
            </VerificationMessage>
          )}

          {profile.studentVerified && (
            <VerificationMessage className="success">
              <i className="fas fa-check-circle"></i>
              {t('mypage.verificationCompleteMessage', {email: profile.univEmail})}
            </VerificationMessage>
          )}
        </SettingsSection>

        <SettingsSection>
          <SettingsList>
            <SettingsItem>
              <span>
                <i className="fas fa-user-slash" style={{ marginRight: 6 }}></i>
                {t('deleteAccount')}
              </span>
              {/* ✅ 여기 onClick 추가 */}
              <SmallButton
                  className="danger"
                  onClick={() => navigate('/my/deactivate')}
              >
                {t('deleteAccount')}
              </SmallButton>
            </SettingsItem>
          </SettingsList>
        </SettingsSection>

      </SettingsContainer>

      {/* 편집 취소 확인 모달 */}
      <Modal isOpen={showEditCancelConfirm} onClose={() => setShowEditCancelConfirm(false)} title={t('confirm')}>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div>변경 사항이 저장되지 않습니다. 취소하시겠습니까?</div>
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button onClick={() => setShowEditCancelConfirm(false)} className="btn-secondary">{t('cancel')}</button>
            <button onClick={() => { setShowEditCancelConfirm(false); cancelEditNow(); }} className="btn-primary">{t('confirm')}</button>
          </div>
        </div>
      </Modal>

      {/* 지도 선택 기능 제거됨 */}
    </MyPageContainer>
  );
};

export default MyPage; 
