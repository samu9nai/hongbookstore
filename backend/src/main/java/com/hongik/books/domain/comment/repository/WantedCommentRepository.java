package com.hongik.books.domain.comment.repository;

import com.hongik.books.domain.comment.domain.WantedComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WantedCommentRepository extends JpaRepository<WantedComment, Long> {

    // ✅ 기존에 쓰던 "삭제 제외" 조회 메서드는 남겨두되,
    //    트리 보존을 위해 "삭제 포함" 버전을 사용하도록 서비스 쪽을 교체한다.
    List<WantedComment> findByWantedIdAndDeletedFalseOrderByCreatedAtAsc(Long wantedId);

    // ✅ 트리 보존용: 삭제 포함 전체 조회
    List<WantedComment> findByWantedIdOrderByCreatedAtAsc(Long wantedId);

    int countByIdAndUserId(Long id, Long userId);

    // (구해요 글 삭제 시) 자식 → 부모 순서로 물리 삭제 (self-FK 충돌 예방)
    @Modifying
    @Query(value =
            "DELETE FROM wanted_comment " +
                    "WHERE wanted_id = :wantedId AND parent_id IS NOT NULL",
            nativeQuery = true)
    void deleteChildrenByWantedId(@Param("wantedId") Long wantedId);

    @Modifying
    @Query(value =
            "DELETE FROM wanted_comment " +
                    "WHERE wanted_id = :wantedId AND parent_id IS NULL",
            nativeQuery = true)
    void deleteParentsByWantedId(@Param("wantedId") Long wantedId);
}
