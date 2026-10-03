package com.hongik.books.domain.chat.service;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.chat.domain.ChatReservation;
import com.hongik.books.domain.chat.domain.ChatReservationStatus;
import com.hongik.books.domain.chat.domain.ChatRoom;
import com.hongik.books.domain.chat.dto.ChatReservationRequest;
import com.hongik.books.domain.chat.dto.ChatReservationResponse;
import com.hongik.books.domain.chat.repository.ChatReservationRepository;
import com.hongik.books.domain.chat.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hongik.books.domain.notification.service.NotificationService;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatReservationService {

    private final ChatReservationRepository reservationRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final NotificationService notificationService;

    /* ------------------------------- 조회 ------------------------------- */

    @Transactional(readOnly = true)
    public Optional<ChatReservationResponse> getCurrent(Long roomId, LoginUserDTO user) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));
        ensureParticipant(room, user);

        return reservationRepository.findTopByChatRoomIdOrderByIdDesc(roomId)
                .map(this::toDto);
    }

    /* ------------------------------ 예약요청 ------------------------------ */
    // 구매자만 호출. 상태는 무조건 REQUESTED 로 저장
    public ChatReservationResponse upsert(Long roomId, ChatReservationRequest req, LoginUserDTO user) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));

        // 구매자만 예약 요청 가능
        if (!user.id().equals(room.getBuyer().getId())) {
            throw new IllegalArgumentException("구매자만 예약을 요청할 수 있습니다.");
        }

        // 시간 파싱 (ISO-8601 가정: 2025-08-29T12:30:00Z, 또는 로컬 시각)
        LocalDateTime reservedAt = parseToLocalDateTime(req.reservedAt());

        ChatReservation r = ChatReservation.builder()
                .chatRoom(room)
                .status(ChatReservationStatus.REQUESTED)
                .reservedAt(reservedAt)
                .meetType(req.meetType())
                .placeLabel(req.placeLabel())
                .oncampusPlaceCode(req.oncampusPlaceCode())
                .offcampusStationCode(req.offcampusStationCode())
                .cancelReason(null)
                .createdByUserId(user.id())
                .build();

        reservationRepository.save(r);

        // 🔔 판매자에게 "예약 요청" 알림
        notificationService.notifyReservationRequested(
                room.getSeller().getId(),
                roomId,
                r.getId(),
                resolveSalePostId(room),
                r.getPlaceLabel(),
                toInstant(r.getReservedAt())
        );

        return toDto(r);
    }

    /* ------------------------------ 예약 수락 ------------------------------ */
    // 판매자만 호출. REQUESTED -> CONFIRMED
    public ChatReservationResponse accept(Long roomId, Long reservationId, LoginUserDTO user) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));
        // 판매자만 가능
        if (!user.id().equals(room.getSeller().getId())) {
            throw new IllegalArgumentException("판매자만 예약을 수락할 수 있습니다.");
        }

        ChatReservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));
        if (!r.getChatRoom().getId().equals(roomId)) {
            throw new IllegalArgumentException("채팅방이 일치하지 않습니다.");
        }
        if (r.getStatus() != ChatReservationStatus.REQUESTED) {
            throw new IllegalStateException("요청 상태의 예약만 수락할 수 있습니다.");
        }

        r.setStatus(ChatReservationStatus.CONFIRMED);
        r.setCancelReason(null);

        // 🔔 구매자에게 "예약 확정" 알림
        notificationService.notifyReservationConfirmed(
                room.getBuyer().getId(),
                roomId,
                r.getId(),
                resolveSalePostId(room)
        );

        return toDto(r);
    }

    /* -------------------------------- 취소 -------------------------------- */
    // 구매자/판매자 모두 가능. REQUESTED/CONFIRMED 상태에서 취소 가능
    public ChatReservationResponse cancel(Long roomId, Long reservationId, LoginUserDTO user, String reason) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));
        ensureParticipant(room, user);

        ChatReservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));
        if (!r.getChatRoom().getId().equals(roomId)) {
            throw new IllegalArgumentException("채팅방이 일치하지 않습니다.");
        }
        if (r.getStatus() == ChatReservationStatus.COMPLETED) {
            throw new IllegalStateException("완료된 예약은 취소할 수 없습니다.");
        }

        r.setStatus(ChatReservationStatus.CANCELED);
        r.setCancelReason((reason == null || reason.isBlank()) ? "취소됨" : reason.trim());

        // 🔔 상대방에게 "예약 취소" 알림
        boolean canceledBySeller = user.id().equals(room.getSeller().getId());
        Long targetUserId = canceledBySeller ? room.getBuyer().getId() : room.getSeller().getId();
        notificationService.notifyReservationCanceled(
                targetUserId,
                roomId,
                r.getId(),
                resolveSalePostId(room),
                r.getCancelReason()
        );

        return toDto(r);
    }

    /* ------------------------------- 거래완료 ------------------------------- */
    // (프런트에서는 판매자만 버튼 노출) - 방 참가자만 완료 가능하도록 유지
    public ChatReservationResponse complete(Long roomId, Long reservationId, LoginUserDTO user) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방이 존재하지 않습니다."));
        ensureParticipant(room, user);

        ChatReservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));
        if (!r.getChatRoom().getId().equals(roomId)) {
            throw new IllegalArgumentException("채팅방이 일치하지 않습니다.");
        }
        if (r.getStatus() != ChatReservationStatus.CONFIRMED) {
            throw new IllegalStateException("확정된 예약만 완료할 수 있습니다.");
        }

        r.setStatus(ChatReservationStatus.COMPLETED);
        r.setCancelReason(null);

        // 🔔 구매자에게 "거래 완료" 알림 (둘 다 필요하면 판매자 대상으로 한 번 더 호출)
        notificationService.notifyReservationCompleted(
                room.getBuyer().getId(),
                roomId,
                r.getId(),
                resolveSalePostId(room)
        );

        return toDto(r);
    }

    /* ------------------------------ 내부 유틸 ------------------------------ */

    private void ensureParticipant(ChatRoom room, LoginUserDTO user) {
        Long uid = user.id();
        if (!uid.equals(room.getBuyer().getId()) && !uid.equals(room.getSeller().getId())) {
            throw new IllegalArgumentException("채팅방 참가자만 수행할 수 있습니다.");
        }
    }

    private ChatReservationResponse toDto(ChatReservation r) {
        return ChatReservationResponse.builder()
                .id(r.getId())
                .chatRoomId(r.getChatRoom().getId())
                .status(r.getStatus().name())
                .reservedAt(r.getReservedAt() != null ? r.getReservedAt().toString() : null)
                .meetType(r.getMeetType())
                .placeLabel(r.getPlaceLabel())
                .oncampusPlaceCode(r.getOncampusPlaceCode())
                .offcampusStationCode(r.getOffcampusStationCode())
                .createdByUserId(r.getCreatedByUserId())
                .cancelReason(r.getCancelReason())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null)
                .updatedAt(r.getUpdatedAt() != null ? r.getUpdatedAt().toString() : null)
                .build();
    }

    private LocalDateTime parseToLocalDateTime(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try {
            // 1) with offset (Z, +09:00 등)
            return OffsetDateTime.parse(iso).toLocalDateTime();
        } catch (DateTimeParseException ignore) {}
        try {
            // 2) plain local datetime
            return LocalDateTime.parse(iso);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("시간 포맷이 올바르지 않습니다. (ISO-8601)", e);
        }
    }

    private Instant toInstant(LocalDateTime ldt) {
        if (ldt == null) return null;
        return ldt.atZone(ZoneId.systemDefault()).toInstant();
    }

    /**
     * salePostId 안전 추출:
     * - ChatRoom에 getSalePost()가 있으면 그걸로, 없으면 getSalePostId()가 있으면 그걸로.
     * - 둘 다 없으면 null.
     */
    private Long resolveSalePostId(ChatRoom room) {
        try {
            Object salePost = ChatRoom.class.getMethod("getSalePost").invoke(room);
            if (salePost != null) {
                Object id = salePost.getClass().getMethod("getId").invoke(salePost);
                if (id instanceof Long) return (Long) id;
            }
        } catch (Exception ignore) {}
        try {
            Object id = ChatRoom.class.getMethod("getSalePostId").invoke(room);
            if (id instanceof Long) return (Long) id;
        } catch (Exception ignore) {}
        return null;
    }
}
