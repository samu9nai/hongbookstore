import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import {
  LucideArrowRight,
  LucideBook,
  LucideClock,
  LucideEye,
  LucideHeart,
  LucideSearch,
  LucideSquarePen,
  LucideTrash,
  LucideUser
} from 'lucide-react'
import SidebarMenu, { MainContent } from '@/shared/layout/SidebarMenu'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'
import axios from 'axios'
import { getMyReceivedPeerReviews } from '@/shared/api/peerReviews'
import { useTranslation } from 'react-i18next'
import { Loading } from '@/shared/ui'

const PageWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
`

const BookstoreContainer = styled.div`
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
`

const BookstoreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
`

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

const BookstoreTitle = styled.h1`
  font-size: 2.5rem;
  color: #333;
`

const AddBookButton = styled.button`
  display: flex !important;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #007bff !important;
  color: white !important;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  position: relative;
  z-index: 10;
  min-width: 120px;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);

  &:hover {
    background: #0056b3 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  }
`

const TabSection = styled.div`
  margin-bottom: 30px;
`

const TabList = styled.div`
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 20px;
`

const Tab = styled.button`
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: ${props => (props.$active ? '#007bff' : '#666')};
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  margin-bottom: -2px;

  &:hover {
    color: #007bff;
  }

  ${props =>
    props.$active &&
    `
    border-bottom-color: #007bff;
    font-weight: 600;
  `}
`

const BookGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  @media (max-width: 900px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`

const BookCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 16px;
  position: relative;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  overflow: hidden; /* 버튼이 카드 밖으로 나가지 않도록 */

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 600px) {
    padding: 12px;
    font-size: 0.95rem;
  }
`

const BookImage = styled.div`
  width: 100%;
  height: 200px;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  color: #999;
  overflow: hidden; /* 이미지가 컨테이너를 넘지 않도록 */
`

/* BookImage 안에 들어갈 실제 이미지 스타일 */
const BookImageImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
`

const BookCardTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: #333;
`

const BookMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 10px;
`

const BookPrice = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 10px;
`

const BookStatus = styled.span`
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 600;

  ${props => {
    switch (props.$status) {
      case 'FOR_SALE':
        return 'background: #d4edda; color: #155724;'
      case 'RESERVED':
        return 'background: #fff3cd; color: #856404;'
      case 'SOLD_OUT':
        return 'background: #f8d7da; color: #721c24;'
      default:
        return 'background: #e2e3e5; color: #383d41;'
    }
  }}
`

const BookActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 15px;
  justify-content: flex-start;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
  flex-shrink: 0;
  white-space: nowrap;

  &:hover {
    background: #f8f9fa;
    border-color: #007bff;
    color: #007bff;
  }
  &.delete:hover {
    border-color: #dc3545;
    color: #dc3545;
  }

  @media (max-width: 600px) {
    padding: 4px 8px;
    font-size: 0.75rem;
    gap: 3px;
  }
`

const NoBooks = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`

// --- Reviews styles ---
const ReviewSection = styled.div`
  margin-top: 10px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 16px;
`
const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`
const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`
const ReviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
`
const ReviewBadge = styled.span`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: ${props =>
    props.$label === 'best'
      ? '#28a745'
      : props.$label === 'good'
        ? '#17a2b8'
        : props.$label === 'bad'
          ? '#ffc107'
          : '#dc3545'};
`

const SectionContainer = styled.div`
  margin-bottom: 40px;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
`

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
`

const ViewMoreButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background: #f8f9fa;
  color: #007bff;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;

  &:hover {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
`

const FloatingHeartButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
  z-index: 2;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: scale(1.08);
  }

  svg {
    font-size: 1.7rem;
    color: #e91e63;
    transition: color 0.2s;
  }
`

const CompactBookCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  position: relative;
  overflow: hidden; /* 버튼이 카드 밖으로 나가지 않도록 */

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }
`

const CompactBookImage = styled.div`
  width: 60px;
  height: 80px;
  background: #f0f0f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  flex-shrink: 0;
  overflow: hidden; /* 이미지가 컨테이너를 넘지 않도록 */

  /* 내부 이미지 스타일 */
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 6px;
  }
`

const CompactBookInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const CompactBookTitle = styled.h4`
  font-size: 1rem;
  margin-bottom: 5px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CompactBookMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  color: #666;
  font-size: 0.8rem;
  margin-bottom: 5px;
`

const CompactBookPrice = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #007bff;
`

const CompactBookStatus = styled.span`
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;

  ${props => {
    switch (props.$status) {
      case 'FOR_SALE':
        return 'background: #d4edda; color: #155724;'
      case 'RESERVED':
        return 'background: #fff3cd; color: #856404;'
      case 'SOLD_OUT':
        return 'background: #f8d7da; color: #721c24;'
      default:
        return 'background: #e2e3e5; color: #383d41;'
    }
  }}
`

const CompactBookActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-start;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
`

const EmptyIcon = styled.div`
  font-size: 2rem;
  color: #ccc;
  margin-bottom: 10px;
`

const CompactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const WantedCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }
`

const WantedIcon = styled.div`
  width: 50px;
  height: 50px;
  background: #fff3cd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #856404;
  flex-shrink: 0;
`

const WantedInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const WantedTitle = styled.h4`
  font-size: 1rem;
  margin-bottom: 5px;
  color: #333;
`

const WantedMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  color: #666;
  font-size: 0.8rem;
`

const WantedBudget = styled.div`
  font-size: 1rem;
  font-weight: bold;
  color: #28a745;
`

const CircleIconButton = styled.button`
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  font-size: 1.3rem;
  margin: 0 4px;
  position: relative;
  transition:
    box-shadow 0.2s,
    background 0.2s,
    color 0.2s,
    transform 0.15s;

  &:hover {
    background: #f8f9fa;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.13);
    transform: scale(1.08);
  }

  &::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.3s,
      visibility 0.3s;
    z-index: 1000;
    margin-bottom: 5px;
    pointer-events: none;
  }
  &:hover::before {
    opacity: 1;
    visibility: visible;
  }
`

/* 로딩 스피너 컴포넌트 */
const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
`

// 모달 공통 스타일
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`
const ModalBox = styled.div`
  background: #fff;
  border-radius: 12px;
  width: 420px;
  max-width: 92vw;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`
const ModalTitle = styled.h3`
  margin: 0 0 10px;
  color: #333;
`
const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
`
const ModalButton = styled.button`
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
  background: #007bff;
  color: #fff;
  &.cancel {
    background: #6c757d;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

// 인증 토큰을 가져오는 헬퍼 함수
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const MyBookstore = () => {
  const { t } = useTranslation()

  // 백엔드 Enum을 프론트엔드 텍스트로 변환하는 헬퍼
  const statusMap = {
    FOR_SALE: t('myBookstore.forSale'),
    RESERVED: t('myBookstore.reserved'),
    SOLD_OUT: t('myBookstore.soldOut')
  }
  const [activeTab, setActiveTab] = useState('all') // 기본 탭을 '전체'로
  const [myPosts, setMyPosts] = useState([])

  const [showAllMyBooks, setShowAllMyBooks] = useState(false)
  const [wishlist, setWishlist] = useState([]) // 찜 목록 상태
  const [loading, setLoading] = useState({ myPosts: true, wishlist: true })
  const [error, setError] = useState({ myPosts: null, wishlist: null }) // 에러 상태 관리
  const navigate = useNavigate()

  // 받은 거래 후기 상태 (페이지네이션 + 요약)
  const [myReviews, setMyReviews] = useState([])
  const [myReviewsTotal, setMyReviewsTotal] = useState(0)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [errorReviews, setErrorReviews] = useState('')
  const [reviewPage, setReviewPage] = useState(0)
  const [reviewSize, setReviewSize] = useState(5)
  const [reviewTotalPages, setReviewTotalPages] = useState(0)
  const [reviewLast, setReviewLast] = useState(true)
  const [overallAvg, setOverallAvg] = useState(null)
  const [profileId, setProfileId] = useState(null)

  // 내 판매글 목록을 불러오는 API 호출 함수
  const fetchMyPosts = useCallback(async () => {
    setLoading(prev => ({ ...prev, myPosts: true }))
    setError(prev => ({ ...prev, myPosts: null })) // 에러 초기화
    try {
      const response = await axios.get('/api/my/posts', {
        headers: getAuthHeader()
      })
      setMyPosts(response.data)
    } catch {
      setError(prev => ({ ...prev, myPosts: t('myBookstore.fetchPostsError') })) // 에러 상태 설정
    } finally {
      setLoading(prev => ({ ...prev, myPosts: false }))
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- t는 오류 문구에만 쓴다. 넣으면 언어를 바꿀 때 목록을 다시 불러온다
  }, [])

  // 내 찜 목록을 불러오는 API 호출 함수
  const fetchWishlist = useCallback(async () => {
    setLoading(prev => ({ ...prev, wishlist: true }))
    setError(prev => ({ ...prev, wishlist: null })) // 에러 초기화
    try {
      const response = await axios.get('/api/my/likes', {
        headers: getAuthHeader()
      })
      setWishlist(response.data)
    } catch {
      setError(prev => ({
        ...prev,
        wishlist: t('myBookstore.fetchWishlistError')
      })) // 에러 상태 설정
    } finally {
      setLoading(prev => ({ ...prev, wishlist: false }))
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- t는 오류 문구에만 쓴다. 넣으면 언어를 바꿀 때 목록을 다시 불러온다
  }, [])

  const fetchMyReviews = useCallback(
    async (page = 0, size = reviewSize) => {
      setLoadingReviews(true)
      setErrorReviews('')
      try {
        // 판매자로서 받은 후기
        const data = await getMyReceivedPeerReviews('SELLER', page, size)
        setMyReviews(Array.isArray(data.content) ? data.content : [])
        setMyReviewsTotal(
          typeof data.totalElements === 'number'
            ? data.totalElements
            : Array.isArray(data.content)
              ? data.content.length
              : 0
        )
        setReviewPage(typeof data.page === 'number' ? data.page : page)
        setReviewSize(typeof data.size === 'number' ? data.size : size)
        setReviewTotalPages(
          typeof data.totalPages === 'number' ? data.totalPages : 0
        )
        setReviewLast(Boolean(data.last))
      } catch {
        setErrorReviews('myBookstore.fetchReviewsError')
      } finally {
        setLoadingReviews(false)
      }
    },
    [reviewSize]
  )

  // 컴포넌트 마운트 시 API 호출
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 목록을 불러오는 동안 로딩 상태를 먼저 켠다
    void fetchMyPosts()
    void fetchWishlist()
    void fetchMyReviews(0, reviewSize)
    // 후기는 마운트할 때 첫 페이지만 불러온다. fetchMyReviews는 서버 응답으로 reviewSize를 바꿔
    // 의존성에 넣으면 페이지 크기가 바뀔 때 첫 페이지를 다시 불러온다
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- 마운트할 때 한 번만 실행한다
  }, [fetchMyPosts, fetchWishlist])

  // 내 프로필 ID → 전체 요약 불러오기
  const fetchProfileId = useCallback(async () => {
    try {
      const response = await axios.get('/api/my/profile', {
        headers: getAuthHeader()
      })
      const uid = response?.data?.data?.id
      if (uid) setProfileId(uid)
    } catch {}
  }, [])

  useEffect(() => {
    void fetchProfileId()
  }, [fetchProfileId])

  useEffect(() => {
    const fetchSummary = async uid => {
      try {
        const res = await axios.get(`/api/reviews/summary/users/${uid}`, {
          headers: getAuthHeader()
        })
        setOverallAvg(res.data?.overallAverage ?? null)
      } catch {
        setOverallAvg(null)
      }
    }
    if (profileId) void fetchSummary(profileId)
  }, [profileId])

  // 탭에 따라 게시글을 필터링하는 함수
  const getFilteredBooks = () => {
    if (activeTab === 'all') return myPosts
    // 백엔드 status (FOR_SALE, RESERVED, SOLD_OUT)와 프론트엔드 탭(selling, reserved, sold)을 매핑
    const statusMapping = {
      selling: 'FOR_SALE',
      reserved: 'RESERVED',
      sold: 'SOLD_OUT'
    }
    return myPosts.filter(post => post.status === statusMapping[activeTab])
  }

  const handleEditBook = postId => {
    void navigate(`/postwrite/${postId}`)
  }

  // 게시글 삭제 핸들러
  const handleDeleteBook = async postId => {
    if (window.confirm(t('myBookstore.deleteConfirm'))) {
      try {
        await axios.delete(`/api/posts/${postId}`, { headers: getAuthHeader() })
        alert(t('myBookstore.deleteSuccess'))
        void fetchMyPosts() // 목록 새로고침
      } catch {
        alert(t('myBookstore.deleteError'))
      }
    }
  }

  const handleViewBook = postId => navigate(`/posts/${postId}`)

  // 찜 해제 핸들러
  const handleRemoveFromWishlist = async postId => {
    if (window.confirm('찜을 해제하시겠습니까?')) {
      try {
        await axios.delete(`/api/posts/${postId}/like`, {
          headers: getAuthHeader()
        })
        alert('찜이 해제되었습니다.')
        void fetchWishlist() // 찜 목록 새로고침
      } catch {
        alert('찜 해제 중 오류가 발생했습니다.')
      }
    }
  }

  const filteredBooks = getFilteredBooks()

  // --- 판매 상태 변경: 예약중/판매완료 ---
  const [buyerModal, setBuyerModal] = useState({ open: false, postId: null })
  const [buyerCandidates, setBuyerCandidates] = useState([])
  const [selectedBuyerId, setSelectedBuyerId] = useState(null)
  const [buyerLoading, setBuyerLoading] = useState(false)
  const [buyerError, setBuyerError] = useState('')
  const [confirmingBuyer, setConfirmingBuyer] = useState(false)

  const handleStatusChange = async (postId, status) => {
    if (
      !window.confirm(
        t('myBookstore.statusChangeConfirm', {
          status:
            status === 'SOLD_OUT'
              ? t('myBookstore.soldOut')
              : t('myBookstore.reserved')
        })
      )
    )
      return

    if (status === 'SOLD_OUT') {
      // 채팅방 기반 구매자 선택 모달
      setBuyerModal({ open: true, postId })
      setSelectedBuyerId(null)
      setBuyerError('')
      setBuyerLoading(true)
      try {
        const res = await axios.get('/api/chat/rooms/me', {
          headers: getAuthHeader()
        })
        const rooms = Array.isArray(res.data) ? res.data : []
        const candidates = rooms
          .filter(r => r.salePostId === postId)
          .map(r => ({
            buyerId: r.buyerId,
            buyerNickname: r.buyerNickname,
            buyerProfileImageUrl: r.buyerProfileImageUrl
          }))
          .filter(
            (v, i, arr) => arr.findIndex(x => x.buyerId === v.buyerId) === i
          )
        setBuyerCandidates(candidates)
      } catch (e) {
        setBuyerCandidates([])
        setBuyerError(
          e.response?.data?.message ||
            '채팅방 정보를 불러오지 못했습니다. 구매자 ID를 직접 입력해 주세요.'
        )
      } finally {
        setBuyerLoading(false)
      }
      return
    }

    try {
      await axios.patch(
        `/api/posts/${postId}/status`,
        { status },
        { headers: getAuthHeader() }
      )
      alert(t('myBookstore.statusChangeSuccess'))
      void fetchMyPosts()
    } catch (e) {
      alert(e.response?.data?.message || t('myBookstore.statusChangeError'))
    }
  }

  const closeBuyerModal = () => {
    setBuyerModal({ open: false, postId: null })
    setBuyerCandidates([])
    setSelectedBuyerId(null)
    setBuyerError('')
  }

  const handleConfirmBuyer = async () => {
    if (!selectedBuyerId) {
      alert(t('myBookstore.buyerSelectError'))
      return
    }
    try {
      setConfirmingBuyer(true)
      await axios.patch(
        `/api/posts/${buyerModal.postId}/status`,
        { status: 'SOLD_OUT', buyerId: selectedBuyerId },
        { headers: getAuthHeader() }
      )
      alert(t('myBookstore.statusChangedToSold'))
      closeBuyerModal()
      void fetchMyPosts()
    } catch (e) {
      alert(e.response?.data?.message || t('myBookstore.buyerConfirmError'))
    } finally {
      setConfirmingBuyer(false)
    }
  }

  const handleSidebarMenu = menu => {
    switch (menu) {
      case 'bookstore/add':
        void navigate('/bookstore/add')
        break
      case 'wanted':
        void navigate('/wanted')
        break
      case 'mybookstore':
        void navigate('/bookstore')
        break
      case 'chat':
        void navigate('/chat')
        break
      default:
        break
    }
  }

  return (
    <PageWrapper>
      <SidebarMenu
        active="mybookstore"
        onMenuClick={handleSidebarMenu}
      />
      <MainContent>
        <BookstoreContainer>
          <BookstoreHeader>
            <BookstoreTitle>{t('myBookstore.title')}</BookstoreTitle>
            <HeaderButtons></HeaderButtons>
          </BookstoreHeader>

          {/* 1. 내가 등록한 책 */}
          <SectionContainer>
            <SectionHeader>
              <SectionTitle>
                <LucideBook /> {t('myBookstore.myRegisteredBooks')}
              </SectionTitle>
              <ViewMoreButton
                onClick={() => setShowAllMyBooks(!showAllMyBooks)}>
                {showAllMyBooks ? t('common.collapse') : t('common.viewMore')}
                <LucideArrowRight
                  style={{
                    transform: showAllMyBooks ? 'rotate(90deg)' : 'none'
                  }}
                />
              </ViewMoreButton>
            </SectionHeader>

            <TabSection>
              <TabList>
                <Tab
                  $active={activeTab === 'all'}
                  onClick={() => setActiveTab('all')}>
                  {t('myBookstore.all')} ({myPosts.length})
                </Tab>
                <Tab
                  $active={activeTab === 'selling'}
                  onClick={() => setActiveTab('selling')}>
                  {t('myBookstore.forSale')} (
                  {myPosts.filter(p => p.status === 'FOR_SALE').length})
                </Tab>
                <Tab
                  $active={activeTab === 'reserved'}
                  onClick={() => setActiveTab('reserved')}>
                  {t('myBookstore.reserved')} (
                  {myPosts.filter(p => p.status === 'RESERVED').length})
                </Tab>
                <Tab
                  $active={activeTab === 'sold'}
                  onClick={() => setActiveTab('sold')}>
                  {t('myBookstore.soldOut')} (
                  {myPosts.filter(p => p.status === 'SOLD_OUT').length})
                </Tab>
              </TabList>

              {/* 로딩과 에러 상태를 더 명확하게 처리 */}
              {loading.myPosts ? (
                <LoadingSpinner>
                  <Loading
                    type="bookstack"
                    size="md"
                    subtext={t('myBookstore.loadingBooks')}
                  />
                </LoadingSpinner>
              ) : error.myPosts ? (
                <EmptyState>
                  <EmptyIcon>
                    <LucideBook />
                  </EmptyIcon>
                  <h3>{error.myPosts}</h3>
                  <button
                    onClick={fetchMyPosts}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                    {t('common.retry')}
                  </button>
                </EmptyState>
              ) : filteredBooks.length > 0 ? (
                <BookGrid>
                  {filteredBooks.map(post => (
                    <BookCard key={post.postId}>
                      <BookImage>
                        {post.thumbnailUrl ? (
                          <BookImageImg
                            src={post.thumbnailUrl}
                            alt={post.bookTitle}
                          />
                        ) : (
                          <LucideBook size={40} />
                        )}
                      </BookImage>

                      <BookCardTitle>{post.bookTitle}</BookCardTitle>

                      <BookMeta>
                        <span>
                          <LucideClock size={12} />{' '}
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        {/* <span><LucideEye size={12} /> {post.views}</span> */}
                      </BookMeta>

                      <BookPrice>
                        {post.price.toLocaleString()}
                        {t('common.won')}
                      </BookPrice>

                      <BookStatus $status={post.status}>
                        {statusMap[post.status]}
                      </BookStatus>

                      <BookActions>
                        <ActionButton
                          onClick={() => handleViewBook(post.postId)}>
                          <LucideSearch /> {t('common.view')}
                        </ActionButton>
                        {post.status === 'FOR_SALE' && (
                          <ActionButton
                            onClick={() => handleEditBook(post.postId)}>
                            <LucideSquarePen /> {t('common.edit')}
                          </ActionButton>
                        )}
                        {post.status === 'FOR_SALE' && (
                          <ActionButton
                            onClick={() =>
                              handleStatusChange(post.postId, 'RESERVED')
                            }>
                            {t('myBookstore.reserved')}
                          </ActionButton>
                        )}
                        {post.status === 'RESERVED' && (
                          <ActionButton
                            onClick={() =>
                              handleStatusChange(post.postId, 'FOR_SALE')
                            }>
                            {t('myBookstore.unreserve')}
                          </ActionButton>
                        )}
                        {(post.status === 'FOR_SALE' ||
                          post.status === 'RESERVED') && (
                          <ActionButton
                            onClick={() =>
                              handleStatusChange(post.postId, 'SOLD_OUT')
                            }>
                            {t('myBookstore.soldOut')}
                          </ActionButton>
                        )}
                        <ActionButton
                          className="delete"
                          onClick={() => handleDeleteBook(post.postId)}>
                          <LucideTrash /> {t('common.delete')}
                        </ActionButton>
                      </BookActions>
                    </BookCard>
                  ))}
                </BookGrid>
              ) : (
                <NoBooks>
                  <EmptyIcon>
                    <LucideBook />
                  </EmptyIcon>
                  {/* 탭에 따른 메시지 조건 수정 */}
                  <h3>
                    {activeTab === 'all'
                      ? t('myBookstore.noRegisteredBooks')
                      : t('myBookstore.noBooksInStatus', {
                          status:
                            statusMap[activeTab] ||
                            t('myBookstore.unknownStatus')
                        })}
                  </h3>
                </NoBooks>
              )}
            </TabSection>
          </SectionContainer>

          {/* 3. 받은 거래 후기 */}
          <SectionContainer>
            <SectionHeader>
              <SectionTitle>{t('myBookstore.receivedReviews')}</SectionTitle>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <ViewMoreButton onClick={() => fetchMyReviews(0, reviewSize)}>
                  {t('common.refresh')}
                </ViewMoreButton>
                <ViewMoreButton
                  onClick={() =>
                    reviewPage > 0 && fetchMyReviews(reviewPage - 1, reviewSize)
                  }
                  disabled={reviewPage <= 0}>
                  {t('common.previous')}
                </ViewMoreButton>
                <ViewMoreButton
                  onClick={() =>
                    !reviewLast && fetchMyReviews(reviewPage + 1, reviewSize)
                  }
                  disabled={reviewLast}>
                  {t('common.next')}
                </ViewMoreButton>
              </div>
            </SectionHeader>
            <ReviewSection>
              {loadingReviews ? (
                <LoadingSpinner>
                  {t('myBookstore.loadingReviews')}
                </LoadingSpinner>
              ) : t(errorReviews) ? (
                <EmptyState>
                  <EmptyIcon>😥</EmptyIcon>
                  <h3>{t(errorReviews)}</h3>
                </EmptyState>
              ) : myReviews.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>🙂</EmptyIcon>
                  <h3>{t('myBookstore.noReviewsYet')}</h3>
                </EmptyState>
              ) : (
                <>
                  <div
                    style={{
                      marginBottom: 12,
                      color: '#333',
                      fontWeight: 600
                    }}>
                    {t('myBookstore.pageAverage')}:{' '}
                    {(
                      myReviews.reduce(
                        (acc, r) => acc + (Number(r.ratingScore) || 0),
                        0
                      ) / (myReviews.length || 1)
                    ).toFixed(2)}{' '}
                    / 5.00
                    {overallAvg != null && (
                      <span
                        style={{
                          marginLeft: 12,
                          color: '#555',
                          fontWeight: 500
                        }}>
                        {t('myBookstore.overallAverage')}:{' '}
                        {Number(overallAvg).toFixed(2)} / 5.00
                      </span>
                    )}
                    <span style={{ marginLeft: 12 }}>
                      {t('myBookstore.total')} {myReviewsTotal}
                      {t('myBookstore.items')}
                    </span>
                    <span style={{ marginLeft: 12 }}>
                      {t('myBookstore.page')} {reviewPage + 1} /{' '}
                      {Math.max(reviewTotalPages, 1)}
                    </span>
                  </div>
                  <ReviewList>
                    {myReviews.slice(0, 5).map(rv => (
                      <ReviewItem key={rv.reviewId}>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {rv.reviewerNickname || '구매자'}
                          </div>
                          {rv.ratingKeywords &&
                            rv.ratingKeywords.length > 0 && (
                              <div
                                style={{ fontSize: '0.9rem', color: '#666' }}>
                                {rv.ratingKeywords.join(', ')}
                              </div>
                            )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                          <ReviewBadge
                            $label={(rv.ratingLabel || '')
                              .toString()
                              .toLowerCase()}>
                            {rv.ratingLabel}
                          </ReviewBadge>
                          <div style={{ color: '#007bff', fontWeight: 700 }}>
                            {Number(rv.ratingScore).toFixed(2)}★
                          </div>
                        </div>
                      </ReviewItem>
                    ))}
                  </ReviewList>
                </>
              )}
            </ReviewSection>
          </SectionContainer>

          {/* 2. 찜한 책 */}
          <SectionContainer>
            <SectionHeader>
              <SectionTitle>
                <LucideHeart /> {t('myBookstore.wishlist')} (
                {Array.isArray(wishlist) ? wishlist.length : 0})
              </SectionTitle>{' '}
              {/* 배열 체크 추가 */}
            </SectionHeader>
            {/* 수정: 로딩과 에러 상태를 더 명확하게 처리 */}
            {loading.wishlist ? (
              <LoadingSpinner>
                <Loading
                  type="hongbook"
                  size="md"
                  subtext={t('myBookstore.loadingWishlist')}
                />
              </LoadingSpinner>
            ) : error.wishlist ? (
              <EmptyState>
                <EmptyIcon>
                  <LucideHeart />
                </EmptyIcon>
                <h3>{error.wishlist}</h3>
                <button
                  onClick={fetchWishlist}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                  {t('common.retry')}
                </button>
              </EmptyState>
            ) : Array.isArray(wishlist) && wishlist.length > 0 ? (
              // 배열 체크 추가
              <CompactList>
                {wishlist.map(item => (
                  <CompactBookCard key={item.postId}>
                    <CompactBookImage>
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.postTitle}
                        />
                      ) : (
                        <LucideBook size={20} />
                      )}
                    </CompactBookImage>
                    <CompactBookInfo>
                      <CompactBookTitle>{item.postTitle}</CompactBookTitle>
                      <CompactBookMeta>
                        <span>
                          <LucideUser size={10} /> {item.sellerNickname}
                        </span>
                        <span>
                          <LucideClock size={10} />{' '}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </CompactBookMeta>
                      <CompactBookPrice>
                        {item.price.toLocaleString()}
                        {t('common.won')}
                      </CompactBookPrice>
                    </CompactBookInfo>
                    <BookActions>
                      <ActionButton onClick={() => handleViewBook(item.postId)}>
                        <LucideEye /> {t('common.view')}
                      </ActionButton>
                      <ActionButton
                        className="delete"
                        onClick={() => handleRemoveFromWishlist(item.postId)}>
                        <LucideHeart /> {t('myBookstore.removeFromWishlist')}
                      </ActionButton>
                    </BookActions>
                  </CompactBookCard>
                ))}
              </CompactList>
            ) : (
              <EmptyState>
                <EmptyIcon>
                  <LucideHeart />
                </EmptyIcon>
                <h3>{t('myBookstore.noWishlist')}</h3>
              </EmptyState>
            )}
          </SectionContainer>

          {/* TODO: 최근 본 책, 구해요 글 섹션은 각각의 API가 만들어진 후에 연동 */}

          {/* 3. 최근 본 책 */}

          {/* 4. 구해요 글 */}

          {/* 구매자 선택 모달 */}
          {buyerModal.open && (
            <ModalOverlay>
              <ModalBox>
                <ModalTitle>구매자 선택</ModalTitle>
                {buyerLoading ? (
                  <div style={{ margin: '8px 0 16px', color: '#555' }}>
                    후보를 불러오는 중...
                  </div>
                ) : buyerCandidates.length === 0 ? (
                  <div style={{ margin: '8px 0 16px', color: '#555' }}>
                    연결된 채팅방에서 구매자 후보를 찾지 못했습니다. 아래에
                    구매자 ID를 직접 입력해 주세요.
                  </div>
                ) : (
                  <div style={{ margin: '8px 0 16px' }}>
                    아래 후보 중 구매자를 선택해 주세요.
                  </div>
                )}
                {buyerError && (
                  <div style={{ margin: '0 0 12px', color: '#d32f2f' }}>
                    {buyerError}
                  </div>
                )}
                {!buyerLoading && buyerCandidates.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      maxHeight: 180,
                      overflowY: 'auto',
                      marginBottom: 12
                    }}>
                    {buyerCandidates.map(c => (
                      <label
                        key={c.buyerId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                        <input
                          type="radio"
                          name="buyer"
                          value={c.buyerId}
                          checked={selectedBuyerId === c.buyerId}
                          onChange={() => setSelectedBuyerId(c.buyerId)}
                        />
                        {c.buyerProfileImageUrl ? (
                          <img
                            src={c.buyerProfileImageUrl}
                            alt="buyer"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid #eee'
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: '#eee',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              color: '#666'
                            }}>
                            👤
                          </span>
                        )}
                        <span>
                          구매자 ID: {c.buyerId}
                          {c.buyerNickname
                            ? ` (닉네임: ${c.buyerNickname})`
                            : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="number"
                    placeholder="직접 입력: 구매자 ID"
                    value={selectedBuyerId ?? ''}
                    onChange={e =>
                      setSelectedBuyerId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 8
                    }}
                  />
                </div>
                <ModalActions>
                  <ModalButton
                    className="cancel"
                    onClick={closeBuyerModal}
                    disabled={confirmingBuyer}>
                    {t('common.cancel')}
                  </ModalButton>
                  <ModalButton
                    onClick={handleConfirmBuyer}
                    disabled={!selectedBuyerId || confirmingBuyer}>
                    {confirmingBuyer ? '처리 중...' : '확인'}
                  </ModalButton>
                </ModalActions>
              </ModalBox>
            </ModalOverlay>
          )}
        </BookstoreContainer>
      </MainContent>
    </PageWrapper>
  )
}

export default MyBookstore

// 구매자 선택 모달 (간단 내장형)
// 파일 하단에 렌더되도록 별도 컴포넌트 없이 조건부 렌더링
// 위 상태와 핸들러를 그대로 사용
