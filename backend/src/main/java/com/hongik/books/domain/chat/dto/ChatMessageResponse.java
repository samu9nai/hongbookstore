package com.hongik.books.domain.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatMessageResponse {
    private Long messageId;
    private Long salePostId;
    private Long senderId;
    private Long receiverId;
    private String message;
    private boolean isRead;
    private LocalDateTime sentAt;
}

