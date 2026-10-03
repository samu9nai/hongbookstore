package com.hongik.books.domain.chat.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChatMessageRequest {
    private Long roomId;
    private Long salePostId;      // 게시글 기준 방번호 (roomId 사용 시 roomId로 대체)
    private Long senderId;
    private Long receiverId;
    private String message;
    private String sentAt;
}
