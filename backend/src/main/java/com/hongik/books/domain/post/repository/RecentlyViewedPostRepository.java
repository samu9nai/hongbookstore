package com.hongik.books.domain.post.repository;

import com.hongik.books.domain.post.domain.RecentlyViewedPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecentlyViewedPostRepository extends JpaRepository<RecentlyViewedPost, Long> {
    Optional<RecentlyViewedPost> findByUserIdAndSalePostId(Long userId, Long postId);

    List<RecentlyViewedPost> findTop10ByUserIdOrderByViewedAtDesc(Long userId);

    List<RecentlyViewedPost> findTop5ByUserIdOrderByViewedAtDesc(Long userId);

    long countByUserId(Long userId);

    @Query("select r.id from RecentlyViewedPost r where r.user.id = :userId order by r.viewedAt desc")
    List<Long> findIdsByUserOrderByViewedAtDesc(@Param("userId") Long userId);
}

