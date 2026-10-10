import api from './client'

// 타입은 백엔드 PeerReviewDtos·PeerReview.TargetRole·RatingLabel과 맞춘다

export type PeerReviewRole = 'BUYER' | 'SELLER'
export type RatingLabel = 'WORST' | 'BAD' | 'GOOD' | 'BEST'

export interface PeerReview {
  reviewId: number
  postId: number
  reviewerId: number
  reviewerNickname: string | null
  ratingLabel: RatingLabel
  ratingScore: number
  ratingKeywords: string[] | null
  /** LocalDateTime(오프셋 없는 ISO 문자열) */
  createdAt: string
}

export interface PeerReviewPage {
  content: PeerReview[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface PeerReviewSummary {
  averageScore: number | null
  reviewCount: number
}

export interface CreatePeerReviewInput {
  postId: number | string
  ratingLabel: RatingLabel
  ratingScore: number
  ratingKeywords?: string[]
  role: PeerReviewRole
}

// Create peer review with role (BUYER|SELLER)
export const createPeerReview = ({
  postId,
  ratingLabel,
  ratingScore,
  ratingKeywords,
  role
}: CreatePeerReviewInput): Promise<unknown> => {
  const body = { postId, ratingLabel, ratingScore, ratingKeywords }
  return api.post('/peer-reviews', body, { params: { role } })
}

// List reviews for a target user with role
export const getUserPeerReviews = (
  userId: number | string,
  role: PeerReviewRole,
  page = 0,
  size = 10
) =>
  api.get<PeerReviewPage>(`/peer-reviews/users/${userId}`, {
    params: { role, page, size }
  })

// Summary for a target user with role
export const getUserPeerSummary = (
  userId: number | string,
  role: PeerReviewRole
) =>
  api.get<PeerReviewSummary>(`/peer-reviews/users/${userId}/summary`, {
    params: { role }
  })

// My received reviews with role
export const getMyReceivedPeerReviews = (
  role: PeerReviewRole,
  page = 0,
  size = 10
) =>
  api.get<PeerReviewPage>('/peer-reviews/my-received', {
    params: { role, page, size }
  })
