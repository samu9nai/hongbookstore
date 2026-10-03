package com.hongik.books.domain.chat.domain;

public enum ChatReservationStatus {
    REQUESTED,   // ✅ 구매자 요청만 한 상태 (판매자 수락 대기)
    CONFIRMED,   // ✅ 판매자가 수락해 예약 확정
    CANCELED,    // 취소됨
    COMPLETED    // 거래 완료
}
