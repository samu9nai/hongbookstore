package com.hongik.books.domain.review.peer.repository;

import com.hongik.books.domain.review.peer.domain.PeerReview;
import com.hongik.books.domain.review.peer.domain.PeerReview.TargetRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PeerReviewRepository extends JpaRepository<PeerReview, Long> {
    Page<PeerReview> findByTargetUserIdAndTargetRoleOrderByCreatedAtDesc(Long userId, TargetRole role, Pageable pageable);

    boolean existsByReviewerIdAndSalePostIdAndTargetRole(Long reviewerId, Long postId, TargetRole role);

    @Query("select coalesce(avg(r.ratingScore),0) from PeerReview r where r.targetUser.id = :userId and r.targetRole = :role")
    Double findAverageScoreByTargetUserAndRole(Long userId, TargetRole role);

    long countByTargetUserIdAndTargetRole(Long userId, TargetRole role);
}

