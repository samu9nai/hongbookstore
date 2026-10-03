package com.hongik.books.domain.review.place.repository;

import com.hongik.books.domain.review.place.domain.PlaceReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlaceReviewRepository extends JpaRepository<PlaceReview, Long> {

    boolean existsByPlaceIdAndUserId(Long placeId, Long userId);
    java.util.Optional<PlaceReview> findByPlaceIdAndUserId(Long placeId, Long userId);
    java.util.Optional<PlaceReview> findByIdAndUserId(Long id, Long userId);

    // 리뷰 목록 N+1 방지
    @EntityGraph(attributePaths = "photos")
    Page<PlaceReview> findByPlaceIdOrderByCreatedAtDesc(Long placeId, Pageable pageable);

    @Query("select coalesce(avg(r.rating),0) from PlaceReview r where r.placeId = :placeId")
    double avgByPlace(@Param("placeId") Long placeId);

    long countByPlaceId(Long placeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ReviewPhoto rp where rp.review.id = :reviewId")
    void deleteByReviewId(@Param("reviewId") Long reviewId);

    // ⭐ 탈퇴 사용자 표시명 마스킹
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update PlaceReview r set r.userName = :masked where r.userId = :userId")
    int maskUserNamesByUserId(@Param("userId") Long userId, @Param("masked") String masked);
}
