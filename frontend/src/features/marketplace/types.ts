// 판매글 화면들이 함께 쓰는 서버 응답 타입. 백엔드 domain/post의 DTO와 맞춘다

/** 판매 상태. 백엔드 SalePost.SaleStatus와 같다 */
export type SaleStatus = 'FOR_SALE' | 'RESERVED' | 'SOLD_OUT'

/** 책 상태. 백엔드 Condition과 같다 */
export type BookCondition = 'HIGH' | 'MEDIUM' | 'LOW'

/** 판매글 목록 항목. 백엔드 SalePostSummaryResponseDTO와 같다 */
export interface SalePostSummary {
  postId: number
  postTitle: string
  /** 책 저자 */
  author: string | null
  price: number
  thumbnailUrl: string | null
  status: SaleStatus
  /** LocalDateTime(오프셋 없는 ISO 문자열) */
  createdAt: string
  sellerNickname: string
  likeCount: number
  hasToxicContent: boolean
}

/** Spring Data의 Page 응답에서 화면이 읽는 필드 */
export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  last: boolean
}
