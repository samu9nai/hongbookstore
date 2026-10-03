// com/hongik/books/domain/report/dto/ReportDtos.java
package com.hongik.books.domain.report.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

public class ReportDtos {

    @Getter @Setter
    public static class CreateReq {
        /** 'SALE_POST' | 'WANTED' | 'CHAT_ROOM'  (※ 구버전 'CHAT'도 서비스에서 호환 처리) */
        private String type;
        /** 대상 ID (SALE_POST: postId, WANTED: wantedId, CHAT_ROOM: 신고 대상 사용자 userId) */
        private Long targetId;
        /** '욕설/비방' | '사기/허위매물' | '스팸/광고' | '기타' 또는 ENUM 이름('ABUSE','FRAUD','SPAM','OTHER') */
        private String reason;
        /** '기타'일 때 상세 사유 */
        private String detail;
        /** 채팅 신고 시 필수(해당 방 기준으로 묶기 위함) */
        private Long chatRoomId;
    }

    @Getter
    public static class SimpleRes {
        private final Long id;
        private final String type;
        private final Long reporterId;
        private final Long reportedUserId;
        private final Long salePostId;
        private final Long wantedId;
        private final String reason;
        private final String detail;
        private final LocalDateTime createdAt;

        public SimpleRes(Long id, String type, Long reporterId, Long reportedUserId,
                         Long salePostId, Long wantedId, String reason, String detail, LocalDateTime createdAt) {
            this.id = id;
            this.type = type;
            this.reporterId = reporterId;
            this.reportedUserId = reportedUserId;
            this.salePostId = salePostId;
            this.wantedId = wantedId;
            this.reason = reason;
            this.detail = detail;
            this.createdAt = createdAt;
        }
    }
}
