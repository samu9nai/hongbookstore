package com.hongik.books.domain.chat.repository;

import com.hongik.books.domain.chat.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    //List<ChatMessage> findAllBySalePostIdOrderBySentAtAsc(Long salePostId);

    List<ChatMessage> findAllByChatRoomIdOrderBySentAtAsc(Long roomId);
}