// src/pages/PostDetail/PostDetail.jsx
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { FaHeart, FaShare, FaMapMarkerAlt, FaUser, FaCalendar, FaEye, FaArrowLeft, FaPhone, FaComment, FaStar, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthCtx } from '../../contexts/AuthContext';
import { createPeerReview } from '../../api/peerReviews';
import axios from 'axios';

const DetailContainer = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
  padding-top: 96px;
  background: #f8f9fa;
  min-height: 100vh;
  @media (max-width: 900px) {
    padding-top: 72px;
    padding: 1rem;
  }
  @media (max-width: 600px) {
    padding-top: 56px;
    padding: 0.5rem;
  }
`;

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
  margin-bottom: 1rem;

  &:hover {
    background: #5a6268;
  }
`;

const PostDetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-top: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const ImageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MainImage = styled.div`
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
  background: #eee;
  border-radius: 12px;
  overflow: hidden;
  margin: 0 auto;
`;

const MainImageImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbnailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
  max-width: 400px;
  margin: 0 auto;
`;

const Thumbnail = styled.div`
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid ${props => props.$active ? '#007bff' : 'transparent'};
  overflow: hidden;
`;

const ThumbnailImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const BookTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

/* 👉 제목 우측 액션 컨테이너 */
const TitleActions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 480px) {
    gap: 0.4rem;
  }
`;

const BookAuthor = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin: 0;
`;

const PriceSection = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
`;

const PriceLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const Price = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #007bff;
`;

const OriginalPrice = styled.div`
  font-size: 1rem;
  color: #999;
  text-decoration: line-through;
`;

const DiscountRate = styled.div`
  font-size: 1rem;
  color: #e74c3c;
  font-weight: 600;
`;

const OverallConditionSection = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
`;

const OverallConditionTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin: 0;
  margin-bottom: 0.5rem;
`;

const OverallConditionBadge = styled.div`
  background: ${props => props.$bgColor};
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$color};
  margin-bottom: 0.5rem;
`;

const OverallConditionDescription = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const ConditionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ConditionTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin: 0;
`;

const ConditionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
`;

const ConditionItem = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const ConditionLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const ConditionValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => {
    if (props.$condition === 'HIGH') return '#28a745';
    if (props.$condition === 'MEDIUM') return '#ffc107';
    if (props.$condition === 'LOW') return '#dc3545';
    return '#666';
  }};
`;

const BookInfoSection = styled.div`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
`;

const InfoTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin: 0 0 1rem 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: #333;
  font-weight: 500;
`;

const SellerSection = styled.div`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 1.5rem;
`;

const SellerTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin: 0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SellerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const SellerAvatar = styled.div`
  width: 50px;
  height: 50px;
  background: #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const SellerDetails = styled.div`
  flex: 1;
`;

const SellerName = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const SellerLocation = styled.div`
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
`;

const SellerRating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const Stars = styled.div`
  display: flex;
  align-items: center;
  gap: 0.1rem;
`;

const Star = styled(FaStar)`
  color: ${props => props.filled ? '#ffc107' : '#e0e0e0'};
  font-size: 0.9rem;
`;

const RatingText = styled.div`
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
`;

const SalesCount = styled.div`
  font-size: 0.85rem;
  color: #999;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ViewOtherBooksButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--surface);
  color: var(--text);
  border: 2px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
`;

const ReportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: #fff5f5;
  color: #dc2626;
  border: 2px solid #fecaca;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.2s;
  &:hover{ background:#dc2626; color:#fff; border-color:#dc2626; transform: translateY(-1px); }
`;

const OtherBooksSection = styled.div`
  margin-top: 2rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--surface);
`;

const OtherBooksTitle = styled.h3`
  font-size: 1.3rem;
  color: var(--text);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  gap: 1rem;

  h2 {
    color: #dc3545;
    margin: 0;
  }

  button {
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background: #0056b3;
    }
  }
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    filter: grayscale(0.2);
  }
`;

const ChatButton = styled(ActionButton)`
  background: #007bff;
  color: white;

  &:hover {
    background: #0056b3;
  }
`;

const CallButton = styled(ActionButton)`
  background: #28a745;
  color: white;

  &:hover {
    background: #218838;
  }
`;

const LikeButton = styled.button`
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #ddd;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: ${props => props.$liked ? '#ff4757' : '#666'};
  font-size: 1.2rem;

  &:hover {
    background: white;
    transform: scale(1.1);
    border-color: #ff4757;
  }
`;

const ModalOverlay = styled.div`
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
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    color: #333;
  }
`;

const OtherBooksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const OtherBookCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #007bff;
  }
`;

const OtherBookImage = styled.div`
  width: 100%;
  height: 120px;
  background: #f8f9fa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  text-align: center;
  padding: 0.5rem;
`;

const OtherBookTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.3rem;
  line-height: 1.3;
`;

const OtherBookPrice = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #007bff;
  margin-bottom: 0.5rem;
`;

const OtherBookCondition = styled.div`
  background: ${props => props.$bgColor};
  color: ${props => props.$color};
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-block;
`;

// 인증 토큰을 가져오는 헬퍼 함수
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ✅ 역 이름으로 호선을 찾아주는 헬퍼 (중복 시 최초 매칭 반환)
const SUBWAY_MAP = { /* ...생략: 네가 쓰던 맵 그대로... */ };

const ONCAMPUS_PLACE_LABELS = { /* ...생략: 네가 쓰던 라벨 그대로... */ };

const getLineByStation = (stationName) => {
  if (!stationName) return null;
  for (const [line, stations] of Object.entries(SUBWAY_MAP)) {
    if (stations.includes(stationName)) return line;
  }
  return null;
};

// ✅ 위치 필드 추출 유틸
const deriveTradeLocations = (p = {}) => {
  const onRaw =
      p.oncampusPlaceCode ??
      p.oncampusPlace ??
      p.onCampusPlaceCode ??
      p.onCampus?.placeCode ??
      p.oncampus?.placeCode ??
      null;

  const offRaw =
      p.offcampusStationCode ??
      p.offcampusStation ??
      p.offCampusStationCode ??
      p.offCampus?.stationCode ??
      p.offcampus?.stationCode ??
      null;

  const onLabel = onRaw ? (ONCAMPUS_PLACE_LABELS[onRaw] || onRaw) : null;
  const offStation = offRaw || null;
  const offLine = offStation ? getLineByStation(offStation) : null;

  return { onRaw, onLabel, offRaw, offStation, offLine };
};

// ✅ 응답 정규화(서버 DTO가 달라도 카드 렌더링 가능하게)
const normalizePostSummary = (raw) => {
  const id = raw?.id ?? raw?.postId ?? raw?.salePostId;
  const title = raw?.bookTitle ?? raw?.title ?? raw?.postTitle ?? '';
  const author = raw?.author ?? raw?.bookAuthor ?? '';
  const price = raw?.price ?? 0;
  const originalPrice = raw?.originalPrice ?? raw?.book?.originalPrice ?? 0;
  const postImageUrls =
      raw?.postImageUrls ??
      raw?.imageUrls ??
      raw?.images ??
      (raw?.thumbnailUrl ? [raw.thumbnailUrl] : []);
  const discountRate = raw?.discountRate ?? (originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  return { id, title, author, price, originalPrice, postImageUrls: postImageUrls || [], discountRate };
};

// ✅ 탈퇴 판매자 판별 & 표시명/클릭 가능 여부
const isSellerDeactivated = (p) =>
    Boolean(p?.sellerDeactivated) ||
    /^탈퇴회원#/i.test(String(p?.sellerNickname ?? '')) ||
    (p?.sellerId == null && /^탈퇴회원#/i.test(String(p?.sellerUsername ?? '')));

const getDisplaySellerName = (p) =>
    isSellerDeactivated(p)
        ? '탈퇴한 회원'
        : (p?.sellerNickname || p?.sellerUsername || p?.sellerName || '익명 사용자');

const isSellerClickable = (p) =>
    !isSellerDeactivated(p) && !!p?.sellerId;

const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthCtx);
  const { t } = useTranslation();

  const getStatusMap = () => ({
    'FOR_SALE': t('postDetail.statusLabels.forSale'),
    'RESERVED': t('postDetail.statusLabels.reserved'),
    'SOLD_OUT': t('postDetail.statusLabels.soldOut')
  });

  const getBookCondition = (discountRate) => {
    // 할인율이 낮을수록 상태가 좋음: ≤30 상, ≤50 중, 그 외 하
    if (discountRate <= 30) return { text: t('postDetail.bookCondition.excellent'), color: '#28a745', bgColor: '#d4edda' };
    if (discountRate <= 50) return { text: t('postDetail.bookCondition.good'), color: '#ffc107', bgColor: '#fff3cd' };
    return { text: t('postDetail.bookCondition.fair'), color: '#dc3545', bgColor: '#f8d7da' };
  };

  const conditionMap = {
    'HIGH': t('postDetail.bookCondition.excellent'),
    'MEDIUM': t('postDetail.bookCondition.good'),
    'LOW': t('postDetail.bookCondition.fair')
  };

  // --- 상태 관리 ---
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStar, setReviewStar] = useState(null);
  const [reviewKeywords, setReviewKeywords] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [showOtherBooks, setShowOtherBooks] = useState(false);
  const [sellerOtherBooks, setSellerOtherBooks] = useState([]);
  const [loadingOtherBooks, setLoadingOtherBooks] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportEtcText, setReportEtcText] = useState('');
  const [showReportDoneModal, setShowReportDoneModal] = useState(false);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/posts/${id}`, { headers: getAuthHeader() });
      setPost(response.data);
      setSelectedImageIndex(0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchMyLikes = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) return;
    try {
      const response = await axios.get('/api/my/likes', { headers: getAuthHeader() });
      const likedIds = new Set(response.data.map(p => p.postId ?? p.id));
      setLiked(likedIds.has(parseInt(id)));
    } catch {}
  }, [id]);

  // ✅ 판매자 다른 책 불러오기 (엔드포인트 다양성 대응 + 필드 정규화)
  const fetchSellerOtherBooks = useCallback(async (sellerId) => {
    if (!sellerId) return;
    setLoadingOtherBooks(true);
    const tryFetch = async (url, cfg) => {
      try {
        const res = await axios.get(url, cfg);
        return res.data;
      } catch {
        return null;
      }
    };

    // 1차: /api/posts/seller/{sellerId}
    let data =
        await tryFetch(`/api/posts/seller/${sellerId}`) ||
        // 2차(대체): /api/users/{sellerId}/posts
        await tryFetch(`/api/users/${sellerId}/posts`) ||
        // 3차(대체): 검색 API에 sellerId 지원할 때
        await tryFetch(`/api/posts`, { params: { sellerId } });

    try {
      const list = Array.isArray(data) ? data : (data?.content || []); // Page일 수도 있음
      const normalized = list
          .map(normalizePostSummary)
          .filter(b => (b.id ?? 0) !== Number(id));
      setSellerOtherBooks(normalized);
    } finally {
      setLoadingOtherBooks(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
    fetchMyLikes();
  }, [fetchPost, fetchMyLikes]);

  const handleLikeToggle = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) {
      alert(t('postDetail.loginRequired'));
      navigate('/login');
      return;
    }
    const newLikedState = !liked;
    setLiked(newLikedState);
    try {
      if (newLikedState) {
        await axios.post(`/api/posts/${id}/like`, null, { headers: getAuthHeader() });
      } else {
        await axios.delete(`/api/posts/${id}/like`, { headers: getAuthHeader() });
      }
    } catch {
      setLiked(!newLikedState);
      alert('오류가 발생했습니다.');
    }
  }, [liked, id, navigate, t]);

  const handleChat = useCallback(async () => {
    if (isSellerDeactivated(post)) {
      alert('탈퇴한 회원과는 채팅을 시작할 수 없습니다.');
      return;
    }
    const salePostId = id;
    const buyerId = user?.id;
    if (!buyerId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    if (!user?.studentVerified) {
        alert('학생 인증이 필요한 기능입니다.');
        return;
    }
    try {
      const response = await axios.post(`/api/chat/rooms?salePostId=${salePostId}&buyerId=${buyerId}`, {}, { headers: getAuthHeader() });
      const chatRoom = response.data;
      navigate(`/chat/${chatRoom.id}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || '채팅방을 열 수 없습니다. 잠시 후 다시 시도해주세요.';
      alert(errorMessage);
    }
  }, [id, user, navigate, post]);

  const handleCall = useCallback(() => {
    alert(t('postDetail.phone.notAvailable'));
  }, [t]);

  const handleViewOtherBooks = useCallback(() => {
    if (isSellerDeactivated(post)) return;
    setShowOtherBooks(prev => !prev);
    if (!showOtherBooks && post?.sellerId) {
      fetchSellerOtherBooks(post.sellerId);
    }
  }, [showOtherBooks, post, fetchSellerOtherBooks]);

  // ✅ 라우팅 경로 수정: 상세 페이지로 이동
  const handleOtherBookClick = useCallback((bookId) => {
    if (bookId !== parseInt(id)) {
      navigate(`/posts/${bookId}`, { replace: true });
      setShowOtherBooks(false);
    }
  }, [id, navigate]);

  const handleRetry = useCallback(() => {
    fetchPost();
    fetchMyLikes();
  }, [fetchPost, fetchMyLikes]);

  const canLeaveReview = !!post && post.status === 'SOLD_OUT' && !!user;
  const openReview = () => {
    if (!canLeaveReview) return;
    setReviewOpen(true);
    setReviewStar(null);
    setReviewKeywords('');
  };
  const submitReview = async () => {
    if (!reviewStar) return;
    const role = user?.id === post?.sellerId ? 'BUYER' : 'SELLER';
    const ratingScore = Number(Number(reviewStar).toFixed(2));
    const ratingLabel = ratingScore < 1.5 ? 'worst' : ratingScore < 2.5 ? 'bad' : ratingScore < 3.5 ? 'good' : 'best';
    const kw = reviewKeywords.split(',').map(s => s.trim()).filter(Boolean);
    try {
      setReviewSubmitting(true);
      await createPeerReview({
        postId: post.id ?? post.postId ?? Number(id),
        ratingLabel,
        ratingScore,
        ratingKeywords: kw,
        role
      });
      alert('후기가 저장되었습니다.');
      setReviewOpen(false);
    } catch (e) {
      alert(e.response?.data?.message || t('postDetail.review.saveError'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const discountRate = useMemo(() => {
    if (!post) return 0;
    return post.originalPrice > 0
        ? Math.round(((post.originalPrice - post.price) / post.originalPrice) * 100)
        : 0;
  }, [post]);

  const bookCondition = useMemo(() => {
    if (!post) return null;
    return getBookCondition(post.discountRate || discountRate);
  }, [post, discountRate]);

  const { onLabel: oncampusLabel, offStation: offcampusStation, offLine: offcampusLine } = useMemo(
      () => deriveTradeLocations(post || {}),
      [post]
  );

  const isOwner = useMemo(() => {
    const me = user?.id;
    const seller = post?.sellerId ?? post?.userId;
    return !!me && !!seller && me === seller;
  }, [user?.id, post?.sellerId, post?.userId]);

  const openReport = () => {
    setReportReason('');
    setReportEtcText('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    try {
      // i18n 라벨을 백엔드 ENUM으로 매핑
      const OTHER_LABEL = t('postDetail.reportModal.options.other');
      const ABUSE_LABEL = t('postDetail.reportModal.options.abuse');
      const FRAUD_LABEL = t('postDetail.reportModal.options.fraud');
      const SPAM_LABEL  = t('postDetail.reportModal.options.spam');

      const reasonEnum = (() => {
        if (!reportReason) return null;
        const val = reportReason.toString().toUpperCase();
        if (reportReason === ABUSE_LABEL || val === 'ABUSE') return 'ABUSE';
        if (reportReason === FRAUD_LABEL || val === 'FRAUD') return 'FRAUD';
        if (reportReason === SPAM_LABEL  || val === 'SPAM')  return 'SPAM';
        if (reportReason === OTHER_LABEL || val === 'OTHER' || val === 'OTHER_REASON' || val === 'OTHER_LABEL') return 'OTHER';
        // 한국어 라벨 직접 비교(호환)
        if (reportReason === '욕설/비방') return 'ABUSE';
        if (reportReason === '사기/허위매물') return 'FRAUD';
        if (reportReason === '스팸/광고') return 'SPAM';
        if (reportReason === '기타' || val === 'OTHER') return 'OTHER';
        return reportReason; // 이미 ENUM일 가능성
      })();

      const reasonText = reportReason === t('postDetail.reportModal.options.other')
          ? (reportEtcText || t('postDetail.reportModal.options.other'))
          : reportReason;
      const payload = {
        type: 'SALE_POST',
        targetId: Number(id),
        reason: reasonEnum,
        ...(reasonEnum === 'OTHER' ? { detail: reportEtcText.trim() } : {})
      };
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      }).catch(() => null);
    } catch {}
  };

  const onReportSubmit = async (e) => {
    e.preventDefault();
    // 필수값 검증
    const OTHER_LABEL = t('postDetail.reportModal.options.other');
    if (!reportReason) return;
    if ((reportReason === OTHER_LABEL || reportReason === '기타' || reportReason.toString().toUpperCase() === 'OTHER')
        && !reportEtcText.trim()) return;
    setShowReportModal(false);
    await submitReport();
    setShowReportDoneModal(true);
  };

  if (loading) {
    return (
        <DetailContainer>
          <LoadingContainer>
            <div>{t('postDetail.loading')}</div>
          </LoadingContainer>
        </DetailContainer>
    );
  }

  if (error || !post) {
    return (
        <DetailContainer>
          <ErrorContainer>
            <h2>{t('postDetail.error.title')}</h2>
            <p>{t('postDetail.error.message')}</p>
            <button onClick={handleRetry}>{t('postDetail.error.retry')}</button>
          </ErrorContainer>
        </DetailContainer>
    );
  }

  const safeDiscountRate = post.discountRate ?? discountRate;

  return (
      <>
        <div className="header-spacer" />
        <DetailContainer>
          <BackButton onClick={() => navigate(-1)}>
            <FaArrowLeft /> {t('postDetail.back')}
          </BackButton>

          <PostDetailGrid>
            <ImageSection>
              <MainImage>
                {post.postImageUrls && post.postImageUrls.length > 0 ? (
                    <MainImageImg src={post.postImageUrls[selectedImageIndex]} alt={post.bookTitle} />
                ) : (
                    <span>이미지 없음</span>
                )}
              </MainImage>
              {post.postImageUrls && post.postImageUrls.length > 1 && (
                  <ThumbnailGrid>
                    {post.postImageUrls.map((imageUrl, index) => (
                        <Thumbnail
                            key={index}
                            $active={selectedImageIndex === index}
                            onClick={() => setSelectedImageIndex(index)}
                        >
                          <ThumbnailImg src={imageUrl} alt={`${post.bookTitle} ${index + 1}`} />
                        </Thumbnail>
                    ))}
                  </ThumbnailGrid>
              )}
            </ImageSection>

            <InfoSection>
              <div>
                <BookTitle>
                  {post.bookTitle}
                  <TitleActions>
                    {!isOwner && (
                        <ReportButton onClick={openReport} title={t('postDetail.report')}>
                          <FaExclamationTriangle />
                          {t('postDetail.report')}
                        </ReportButton>
                    )}
                    <LikeButton $liked={liked} onClick={handleLikeToggle}>♥</LikeButton>
                  </TitleActions>
                </BookTitle>
                <BookAuthor>{post.author}</BookAuthor>
              </div>

              <PriceSection>
                <PriceLabel>{t('postDetail.price.sellingPrice')}</PriceLabel>
                <Price>{post.price.toLocaleString()}{t('marketplace.currency')}</Price>
                {post.originalPrice && (
                    <>
                      <OriginalPrice>{post.originalPrice.toLocaleString()}{t('marketplace.currency')}</OriginalPrice>
                      <DiscountRate>{discountRate}% 할인</DiscountRate>
                    </>
                )}
              </PriceSection>

              <OverallConditionSection>
                <OverallConditionTitle>{t('postDetail.bookCondition.overallCondition')}</OverallConditionTitle>
                <OverallConditionBadge
                    $bgColor={getBookCondition(safeDiscountRate).bgColor}
                    $color={getBookCondition(safeDiscountRate).color}
                >
                  {getBookCondition(safeDiscountRate).text}
                </OverallConditionBadge>
                <OverallConditionDescription>
                  {safeDiscountRate <= 30 && t('postDetail.bookCondition.description.excellent', { rate: safeDiscountRate })}
                  {safeDiscountRate > 30 && safeDiscountRate <= 50 && t('postDetail.bookCondition.description.good', { rate: safeDiscountRate })}
                  {safeDiscountRate > 50 && t('postDetail.bookCondition.description.fair', { rate: safeDiscountRate })}
                </OverallConditionDescription>
              </OverallConditionSection>

              <ConditionSection>
                <ConditionTitle>{t('postDetail.bookCondition.title')}</ConditionTitle>
                <ConditionGrid>
                  <ConditionItem>
                    <ConditionLabel>{t('postDetail.bookCondition.noteCondition')}</ConditionLabel>
                    <ConditionValue $condition={post.writingCondition}>{conditionMap[post.writingCondition]}</ConditionValue>
                  </ConditionItem>
                  <ConditionItem>
                    <ConditionLabel>{t('postDetail.bookCondition.tearCondition')}</ConditionLabel>
                    <ConditionValue $condition={post.tearCondition}>{conditionMap[post.tearCondition]}</ConditionValue>
                  </ConditionItem>
                  <ConditionItem>
                    <ConditionLabel>{t('postDetail.bookCondition.waterCondition')}</ConditionLabel>
                    <ConditionValue $condition={post.waterCondition}>{conditionMap[post.waterCondition]}</ConditionValue>
                  </ConditionItem>
                </ConditionGrid>
              </ConditionSection>

              {/* 상세 설명 */}
              <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('postDetail.description')}</div>
                {post.contentToxic && (
                    <div style={{
                      marginBottom: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: '#fff3cd',
                      color: '#856404',
                      fontSize: '0.9rem',
                      border: '1px solid #ffeeba'
                    }}>
                      ⚠️ {t('postDetail.inappropriateContent')}{post.contentToxicLevel ? ` (${post.contentToxicLevel}${typeof post.contentToxicMalicious === 'number' ? `, ${Math.round(post.contentToxicMalicious*100)}%` : ''})` : ''}.
                    </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#333' }}>
                  {post.postContent || t('postDetail.noDescription')}
                </div>
              </div>

              <BookInfoSection>
                <InfoTitle>{t('postDetail.bookInfo')}</InfoTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>{t('postDetail.category')}</InfoLabel>
                    <InfoValue>
                      {
                        post.categoryPath 
                        ? post.categoryPath.split(' > ').map(part => t(part)).join(' > ')
                        : t('postDetail.noInfo')
                      }
                    </InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>{t('postDetail.onCampusLocation')}</InfoLabel>
                    <InfoValue>{oncampusLabel || t('postDetail.noInfo')}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>{t('postDetail.offCampusLocation')}</InfoLabel>
                    <InfoValue>
                      {offcampusStation
                          ? `${offcampusLine ? `${offcampusLine} · ` : ''}${offcampusStation}`
                          : t('postDetail.noInfo')}
                    </InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>{t('postDetail.price.negotiable')}</InfoLabel>
                    <InfoValue>{post.negotiable ? t('postDetail.price.negotiable') : t('postDetail.price.notNegotiable')}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>{t('postDetail.statusLabels.forSale')}</InfoLabel>
                    <InfoValue>{getStatusMap()[post.status] || t('postDetail.statusLabels.forSale')}</InfoValue>
                  </InfoItem>

                  {canLeaveReview && (
                      <InfoItem>
                        <InfoLabel>{t('postDetail.review.title')}</InfoLabel>
                        <div>
                          <button onClick={openReview} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#007bff', color: '#fff', cursor: 'pointer' }}>{t('postDetail.review.writeReview')}</button>
                        </div>
                      </InfoItem>
                  )}

                  <InfoItem>
                    <InfoLabel>{t('postDetail.registrationDate')}</InfoLabel>
                    <InfoValue>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>{t('postDetail.viewCount')}</InfoLabel>
                    <InfoValue>{post.views?.toLocaleString() || 0}</InfoValue>
                  </InfoItem>
                </InfoGrid>
              </BookInfoSection>

              <SellerSection>
                <SellerTitle><FaUser /> {t('postDetail.seller.title')}</SellerTitle>
                <SellerInfo>
                  <SellerAvatar>
                    {post.sellerProfileImageUrl ? (
                        <img src={post.sellerProfileImageUrl} alt={post.sellerNickname} />
                    ) : (
                        post.sellerNickname?.charAt(0) || '?'
                    )}
                  </SellerAvatar>
                  <SellerDetails>
                    <SellerName>{getDisplaySellerName(post)}</SellerName>
                    <SellerLocation>
                      <FaMapMarkerAlt />
                      {post.sellerLocation || '위치 정보 없음'}
                    </SellerLocation>
                    {typeof post.sellerRating === 'number' && (
                        <SellerRating>
                          <Stars>
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} filled={i < Math.floor(post.sellerRating)} />
                            ))}
                          </Stars>
                          <RatingText>{post.sellerRating.toFixed(1)}</RatingText>
                        </SellerRating>
                    )}
                    <div>
                      <button
                          onClick={() =>
                              isSellerClickable(post) &&
                              navigate(`/users/${post.sellerId}`, {
                                state: { username: post.sellerNickname || post.sellerUsername || post.sellerName || '' }
                              })
                          }
                          disabled={!isSellerClickable(post)}
                          style={{
                            padding:'6px 10px',
                            border:'1px solid #e0e0e0',
                            borderRadius:8,
                            background: isSellerClickable(post) ? '#f8f9fa' : '#f1f3f5',
                            color: isSellerClickable(post) ? 'inherit' : '#9ca3af',
                            cursor: isSellerClickable(post) ? 'pointer' : 'not-allowed'
                          }}
                      >
                        {t('postDetail.seller.profile')}
                      </button>
                    </div>
                    {post.sellerSalesCount && (
                        <SalesCount>{t('postDetail.seller.salesCount', { count: post.sellerSalesCount })}</SalesCount>
                    )}
                  </SellerDetails>
                </SellerInfo>
                <ActionButtons>
                  <ChatButton
                      onClick={handleChat}
                      disabled={isSellerDeactivated(post) || isOwner || !user?.studentVerified}
                      title={
                        isOwner
                            ? t?.('postDetail.cannotChatOwnPost') || '내가 작성한 게시글에는 채팅을 시작할 수 없습니다.'
                            : !user?.studentVerified
                            ? '학생 인증이 필요한 기능입니다.'
                            : undefined
                      }
                  >
                    <FaComment />
                    {t('postDetail.contact')}
                  </ChatButton>
                  <ViewOtherBooksButton
                    onClick={handleViewOtherBooks}
                    disabled={isSellerDeactivated(post)}
                  >
                    <FaUser />
                    {t('postDetail.viewOtherBooks')} {sellerOtherBooks.length > 0 && `(${sellerOtherBooks.length})`}
                  </ViewOtherBooksButton>
                </ActionButtons>
              </SellerSection>
            </InfoSection>
          </PostDetailGrid>
        </DetailContainer>

        {showOtherBooks && (
            <ModalOverlay onClick={() => setShowOtherBooks(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <ModalTitle>
                    <FaUser /> {getDisplaySellerName(post)}{t('postDetail.seller.otherBooks')}
                  </ModalTitle>
                  <CloseButton onClick={() => setShowOtherBooks(false)}>
                    <FaTimes />
                  </CloseButton>
                </ModalHeader>

                {loadingOtherBooks ? (
                    <LoadingContainer>
                      <div>{t('postDetail.seller.loadingOtherBooks')}</div>
                    </LoadingContainer>
                ) : sellerOtherBooks.length > 0 ? (
                    <OtherBooksGrid>
                      {sellerOtherBooks.map(book => {
                        const bookConditionInfo = getBookCondition(book.discountRate ?? 0);
                        return (
                            <OtherBookCard
                                key={book.id}
                                onClick={() => handleOtherBookClick(book.id)}
                                style={{
                                  borderColor: book.id === parseInt(id) ? '#007bff' : '#e0e0e0',
                                  backgroundColor: book.id === parseInt(id) ? '#f8f9fa' : 'white',
                                }}
                            >
                              {book.id === parseInt(id) && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    background: '#007bff',
                                    color: 'white',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    zIndex: 1
                                  }}>
                                    현재
                                  </div>
                              )}
                              <OtherBookImage>
                                {book.postImageUrls && book.postImageUrls.length > 0 ? (
                                    <img
                                        src={book.postImageUrls[0]}
                                        alt={book.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                                    />
                                ) : (
                                    book.title
                                )}
                              </OtherBookImage>
                              <OtherBookTitle>{book.title}</OtherBookTitle>
                              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                                {book.author}
                              </div>
                              <OtherBookPrice>{book.price.toLocaleString()}{t('marketplace.currency')}</OtherBookPrice>
                              <OtherBookCondition
                                  $bgColor={bookConditionInfo.bgColor}
                                  $color={bookConditionInfo.color}
                              >
                                {bookConditionInfo.text}
                              </OtherBookCondition>
                            </OtherBookCard>
                        );
                      })}
                    </OtherBooksGrid>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      {t('noOtherSell')}
                    </div>
                )}
              </ModalContent>
            </ModalOverlay>
        )}

        {/* ✅ 후기 모달 */}
        {reviewOpen && (
            <ModalOverlay onClick={() => setReviewOpen(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <ModalTitle>후기 남기기</ModalTitle>
                  <CloseButton onClick={() => setReviewOpen(false)}><FaTimes /></CloseButton>
                </ModalHeader>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 6, color: '#555' }}>별점(1~5)</div>
                  <input type="number" min="1" max="5" step="0.5" value={reviewStar ?? ''}
                         onChange={e => setReviewStar(e.target.value ? Number(e.target.value) : null)}
                         style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: 8 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 6, color: '#555' }}>키워드(쉼표로 구분, 선택)</div>
                  <input type="text" value={reviewKeywords}
                         onChange={e => setReviewKeywords(e.target.value)}
                         placeholder="친절함, 시간엄수"
                         style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: 8 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setReviewOpen(false)} disabled={reviewSubmitting} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#6c757d', color: '#fff' }}>취소</button>
                  <button onClick={submitReview} disabled={!reviewStar || reviewSubmitting} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#007bff', color: '#fff' }}>{reviewSubmitting ? t('postDetail.review.saving') : t('postDetail.review.save')}</button>
                </div>
              </ModalContent>
            </ModalOverlay>
        )}

        {/* ✅ 신고 모달 */}
        {showReportModal && (
            <ModalOverlay onClick={() => setShowReportModal(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <ModalTitle>{t('postDetail.reportModal.selectReason')}</ModalTitle>
                  <CloseButton onClick={() => setShowReportModal(false)}><FaTimes /></CloseButton>
                </ModalHeader>

                <form onSubmit={onReportSubmit}>
                  <div style={{ display:'grid', gap:10, marginBottom: 12 }}>
                    {[
                      t('postDetail.reportModal.options.abuse'),
                      t('postDetail.reportModal.options.fraud'),
                      t('postDetail.reportModal.options.spam'),
                      t('postDetail.reportModal.options.other')
                    ].map(opt => (
                        <label key={opt} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                          <input
                              type="radio"
                              name="report"
                              value={opt}
                              checked={reportReason === opt}
                              onChange={(e) => setReportReason(e.target.value)}
                          />
                          {opt}
                        </label>
                    ))}
                  </div>

                  {reportReason === t('postDetail.reportModal.options.other') && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ marginBottom: 6, fontSize: '.92rem', color: '#555' }}>{t('postDetail.reportModal.detailedReason')}</div>
                        <textarea
                            value={reportEtcText}
                            onChange={e => setReportEtcText(e.target.value)}
                            placeholder={t('postDetail.reportModal.detailedReasonPlaceholder')}
                            rows={4}
                            style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius: 8, padding: 10, resize: 'vertical' }}
                        />
                      </div>
                  )}

                  <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
                    <button
                        type="button"
                        onClick={() => setShowReportModal(false)}
                        style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #ddd', background:'#f1f3f5', cursor:'pointer' }}
                    >
                      {t('postDetail.reportModal.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={!reportReason || (reportReason === t('postDetail.reportModal.options.other') && !reportEtcText.trim())}
                        style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #0d6efd', background:'#0d6efd', color:'#fff', cursor:'pointer' }}
                    >
                      {t('postDetail.reportModal.submit')}
                    </button>
                  </div>
                </form>
              </ModalContent>
            </ModalOverlay>
        )}

        {showReportDoneModal && (
            <ModalOverlay onClick={() => setShowReportDoneModal(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <ModalTitle>{t('postDetail.reportModal.submitted')}</ModalTitle>
                  <CloseButton onClick={() => setShowReportDoneModal(false)}><FaTimes /></CloseButton>
                </ModalHeader>
                <div style={{ color:'#333', lineHeight:1.6 }}>
                  {t('postDetail.reportModal.thankYou')}
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
                  <button
                      onClick={() => setShowReportDoneModal(false)}
                      style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #ddd', background:'#0d6efd', color:'#fff', cursor:'pointer' }}
                  >
                    {t('postDetail.reportModal.close')}
                  </button>
                </div>
              </ModalContent>
            </ModalOverlay>
        )}
      </>
  );
};

export default PostDetail;
