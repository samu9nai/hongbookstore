package com.hongik.books.domain.chat.repository;

import com.hongik.books.domain.chat.domain.ChatReservation;
import com.hongik.books.domain.chat.domain.ChatReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface ChatReservationRepository extends JpaRepository<ChatReservation, Long> {
    Optional<ChatReservation> findTopByChatRoomIdOrderByIdDesc(Long chatRoomId);
    Optional<ChatReservation> findTopByChatRoomIdAndStatusInOrderByIdDesc(Long chatRoomId, Collection<ChatReservationStatus> statuses);
}
