package com.hongik.books.domain.review.peer.domain;

import com.hongik.books.domain.post.domain.SalePost;
import com.hongik.books.domain.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "peer_reviews",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_reviewer_post_role", columnNames = {"reviewer_id", "post_id", "target_role"})
       },
       indexes = {
           @Index(name = "idx_peer_reviews_target_user", columnList = "target_user_id"),
           @Index(name = "idx_peer_reviews_post_id", columnList = "post_id"),
           @Index(name = "idx_peer_reviews_target_created", columnList = "target_user_id, created_at")
       })
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PeerReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "peer_review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id", nullable = false)
    private User targetUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_role", nullable = false, length = 16)
    private TargetRole targetRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private SalePost salePost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RatingLabel ratingLabel;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal ratingScore;

    @Lob
    private String ratingKeywords;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum TargetRole { BUYER, SELLER }

    @Builder
    public PeerReview(User targetUser, TargetRole targetRole, User reviewer, SalePost salePost,
                      RatingLabel ratingLabel, BigDecimal ratingScore, String ratingKeywords) {
        this.targetUser = targetUser;
        this.targetRole = targetRole;
        this.reviewer = reviewer;
        this.salePost = salePost;
        this.ratingLabel = ratingLabel;
        this.ratingScore = ratingScore;
        this.ratingKeywords = ratingKeywords;
    }
}

