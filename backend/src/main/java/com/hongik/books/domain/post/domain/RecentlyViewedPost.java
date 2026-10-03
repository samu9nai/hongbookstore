package com.hongik.books.domain.post.domain;

import com.hongik.books.domain.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "recently_viewed_post",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_recent_user_post", columnNames = {"user_id", "post_id"})
        },
        indexes = {
                @Index(name = "idx_recent_user_viewed_at", columnList = "user_id, viewed_at DESC")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecentlyViewedPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recent_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private SalePost salePost;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;

    public RecentlyViewedPost(User user, SalePost salePost) {
        this.user = user;
        this.salePost = salePost;
    }

    public void touchViewedAt() {
        this.viewedAt = LocalDateTime.now();
    }
}

