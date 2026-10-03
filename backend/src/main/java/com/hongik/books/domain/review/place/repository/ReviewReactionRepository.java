package com.hongik.books.domain.review.place.repository;

import com.hongik.books.domain.review.place.domain.ReviewReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewReactionRepository extends JpaRepository<ReviewReaction, Long> {
    Optional<ReviewReaction> findByReviewIdAndUserId(Long reviewId, Long userId);
    long countByReviewIdAndReaction(Long reviewId, ReviewReaction.ReactionType reaction);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ReviewReaction rr where rr.review.id = :reviewId")
    void deleteByReviewId(@Param("reviewId") Long reviewId);
}
