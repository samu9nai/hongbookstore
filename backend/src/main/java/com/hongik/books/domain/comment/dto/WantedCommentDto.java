package com.hongik.books.domain.comment.dto;

import com.hongik.books.domain.comment.domain.WantedComment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder(toBuilder = true)   // ✅ toBuilder 활성화
public class WantedCommentDto {
    private Long id;
    private Long wantedId;
    private Long parentId;
    private Integer depth;
    private String content;
    private Long userId;
    private String nickname;        // 화면 표기용
    private String authorNickname;  // NOT NULL 보장
    private boolean deleted;
    // Moderation (optional in WARN)
    private boolean contentToxic;
    private String contentToxicLevel;
    private Double contentToxicMalicious;
    private Double contentToxicClean;
    private String contentToxicReason;
    private LocalDateTime createdAt;

    public static WantedCommentDto from(WantedComment c) {
        return WantedCommentDto.builder()
                .id(c.getId())
                .wantedId(c.getWantedId())
                .parentId(c.getParentId())
                .depth(c.getDepth())
                .content(c.getContent())
                .userId(c.getUserId())
                .nickname(c.getNickname())
                .authorNickname(c.getAuthorNickname())
                .deleted(c.isDeleted())
                .contentToxic(c.isContentToxic())
                .contentToxicLevel(c.getContentToxicLevel())
                .contentToxicMalicious(c.getContentToxicMalicious())
                .contentToxicClean(c.getContentToxicClean())
                .contentToxicReason(c.getContentToxicReason())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
