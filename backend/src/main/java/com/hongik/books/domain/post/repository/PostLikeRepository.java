package com.hongik.books.domain.post.repository;

import com.hongik.books.domain.post.domain.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * PostLike 엔티티를 위한 JPA 레포지토리
 */
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    // 사용자와 게시글로 찜 정보를 찾음 (찜 여부 확인, 찜 취소 시 사용)
    Optional<PostLike> findByUserIdAndSalePostId(Long userId, Long postId);

    // 특정 사용자가 찜한 모든 게시글 목록을 조회
    List<PostLike> findAllByUserId(Long userId);
}
