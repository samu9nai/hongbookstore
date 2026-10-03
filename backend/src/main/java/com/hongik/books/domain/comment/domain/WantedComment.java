package com.hongik.books.domain.comment.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wanted_comment")
public class WantedComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 '구해요' 글에 달린 댓글인지
    @Column(name = "wanted_id", nullable = false)
    private Long wantedId;

    // 부모 댓글 (null이면 루트 댓글)
    @Column(name = "parent_id")
    private Long parentId;

    // 0 = 루트, 1 = 대댓글 (필요 시 2,3 확장 가능)
    @Column(nullable = false)
    private Integer depth;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 댓글 작성자 식별(로그인 사용자)
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 노출 닉네임(화면 표기용)
    @Column(name = "nickname")
    private String nickname;

    // DB 제약(널 허용 X). 저장 시 반드시 채움.
    @Column(name = "author_nickname", nullable = false)
    private String authorNickname;

    @Column(nullable = false)
    private boolean deleted;

    // Moderation flags for content (WARN 모드 시 기록)
    @Column(nullable = false)
    private boolean contentToxic = false;
    private String contentToxicLevel;
    private Double contentToxicMalicious;
    private Double contentToxicClean;
    private String contentToxicReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void softDelete() {
        this.deleted = true;
        this.content = "(삭제된 댓글입니다)";
    }

    public void applyContentModeration(String level, Double malicious, Double clean, boolean toxic, String reason) {
        this.contentToxic = toxic;
        this.contentToxicLevel = level;
        this.contentToxicMalicious = malicious;
        this.contentToxicClean = clean;
        this.contentToxicReason = reason;
    }
}
