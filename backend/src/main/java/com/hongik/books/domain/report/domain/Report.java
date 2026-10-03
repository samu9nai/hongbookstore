package com.hongik.books.domain.report.domain;

import com.hongik.books.domain.chat.domain.ChatRoom;
import com.hongik.books.domain.post.domain.SalePost;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.wanted.domain.Wanted;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "report",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_type_reporter_sale_post",
                        columnNames = {"type", "reporter_id", "sale_post_id"}),
                @UniqueConstraint(name = "uk_type_reporter_wanted",
                        columnNames = {"type", "reporter_id", "wanted_id"}),
                @UniqueConstraint(name = "uk_type_reporter_user_chat",
                        columnNames = {"type", "reporter_id", "reported_user_id", "chat_room_id"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== 공통 감사 필드 (BaseEntity 없이 직접 관리) =====
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        final LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    // ===============================================

    // 누가 신고했는지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    // (선택) 피신고자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    // (선택) 판매글 신고
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_post_id")
    private SalePost salePost;

    // (선택) 구함글 신고
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wanted_id")
    private Wanted wanted;

    // ✅ (선택) 채팅방 신고
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id")
    private ChatRoom chatRoom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReportType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReportReason reason;

    @Column(columnDefinition = "TEXT")
    private String detail;
}
