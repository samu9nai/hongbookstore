package com.hongik.books.domain.notification.dto;

import lombok.*;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {
    private String id;          // SSE 이벤트 고유 ID
    private String type;        // "CHAT", "WANTED_COMMENT", "PING", "RESERVATION_*"
    private String title;       // 짧은 제목
    private String message;     // 상세 메시지
    private String link;        // 프론트에서 이동할 경로
    private Instant createdAt;  // 생성 시각

    // 🔽 프론트 실사용을 위해 추가한 필드들
    private Long roomId;
    private Long reservationId;
    private Long salePostId;
    private String status;         // REQUESTED/CONFIRMED/CANCELED/COMPLETED
    private String placeLabel;     // 예약 장소(옵션)
    private Instant reservedAt;    // 예약 시각(옵션)
    private String reason;         // 취소 사유(옵션)
}
