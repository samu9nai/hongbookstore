package com.hongik.books.domain.chat.repository;

import com.hongik.books.domain.chat.domain.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // 판매글 + 구매자 기준으로 중복 채팅방 탐색
    Optional<ChatRoom> findBySalePostIdAndBuyerId(Long salePostId, Long buyerId);

    // 3개 모두 일치하는 채팅방만 찾기!
    Optional<ChatRoom> findBySalePostIdAndBuyerIdAndSellerId(Long salePostId, Long buyerId, Long sellerId);

    List<ChatRoom> findAllByBuyerIdOrSellerId(Long buyerId, Long sellerId);

    // ✅ 목록 조회용: salePost를 fetch join으로 함께 로드 (제목 가져오려고)
    @Query("""
        select cr
        from ChatRoom cr
        join fetch cr.salePost sp
        where cr.buyer.id = :userId or cr.seller.id = :userId
        order by cr.id desc
    """)
    List<ChatRoom> findAllWithSalePostByUser(@Param("userId") Long userId);
}
