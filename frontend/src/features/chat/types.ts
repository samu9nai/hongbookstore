// 채팅 화면들이 함께 쓰는 서버 응답 타입. 백엔드 domain/chat의 DTO와 맞춘다

/** 내 채팅방. 백엔드 ChatRoomResponse와 같다 */
export interface ChatRoomResponse {
  id: number
  salePostId: number
  buyerId: number
  sellerId: number
  bookTitle: string | null
  buyerNickname: string | null
  sellerNickname: string | null
  buyerProfileImageUrl: string | null
  sellerProfileImageUrl: string | null
}

/** 예약 상태. 백엔드 ChatReservationStatus와 같다 */
export type ReservationStatus =
  'REQUESTED' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED'

/** 채팅방 예약. 백엔드 ChatReservationResponse와 같다 */
export interface ChatReservation {
  id: number
  chatRoomId: number
  status: ReservationStatus
  /** ISO-8601 문자열 */
  reservedAt: string | null
  meetType: string | null
  placeLabel: string | null
  oncampusPlaceCode: string | null
  offcampusStationCode: string | null
  createdByUserId: number | null
  cancelReason: string | null
  createdAt: string | null
  updatedAt: string | null
}
