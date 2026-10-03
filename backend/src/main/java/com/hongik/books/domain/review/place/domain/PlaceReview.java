package com.hongik.books.domain.review.place.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "place_reviews",
        indexes = {
                @Index(name = "idx_place_reviews_place_id", columnList = "place_id"),
                @Index(name = "idx_place_reviews_place_created", columnList = "place_id, created_at")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_place_user", columnNames = {"place_id","user_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @Column(name = "place_id", nullable = false)
    private Long placeId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // ⬇️ DB의 컬럼에 맞춰 언더스코어 없는 `username`으로 매핑
    @Column(name = "username", nullable = false, length = 100)
    private String userName;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "likes_count", nullable = false)
    private int likesCount;

    @Column(name = "dislikes_count", nullable = false)
    private int dislikesCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    @Builder.Default
    private List<ReviewPhoto> photos = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (likesCount < 0) likesCount = 0;
        if (dislikesCount < 0) dislikesCount = 0;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 양방향 연관관계 편의 메서드
    public void addPhoto(ReviewPhoto photo) {
        if (photo == null) return;
        photo.setReview(this);
        this.photos.add(photo);
    }
}
