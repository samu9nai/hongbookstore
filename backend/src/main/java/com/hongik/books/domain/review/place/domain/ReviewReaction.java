package com.hongik.books.domain.review.place.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "review_reactions",
        uniqueConstraints = @UniqueConstraint(name = "uq_review_user", columnNames = {"review_id", "user_id"}))
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class ReviewReaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_reaction_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private PlaceReview review;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReactionType reaction;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum ReactionType { LIKE, DISLIKE }

    @PrePersist
    public void onCreate() { createdAt = LocalDateTime.now(); }
}
