package com.hongik.books.domain.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hongik.books.domain.notification.dto.NotificationEvent;
import com.hongik.books.domain.notification.sse.EmitterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.hongik.books.domain.user.repository.UserRepository;
import com.hongik.books.domain.user.domain.User;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final long DEFAULT_TIMEOUT = 30 * 60 * 1000L; // 30분

    private final EmitterRepository emitterRepository;
    private final ObjectMapper objectMapper;

    private final Optional<UserRepository> userRepository;

    @PostConstruct
    void initMapper() {
        try { objectMapper.findAndRegisterModules(); } catch (Exception ignore) {}
    }

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        emitterRepository.add(userId, emitter);

        try {
            NotificationEvent ping = NotificationEvent.builder()
                    .id(UUID.randomUUID().toString())
                    .type("PING")
                    .title("connected")
                    .message("SSE connected")
                    .link(null)
                    .createdAt(Instant.now())
                    .build();
            sendInternal(emitter, ping);
        } catch (Exception e) {
        }
        return emitter;
    }

    // ====== 기존 알림 ======
    public void notifyChatMessage(Long userId, Long roomId, Long salePostId, String senderNameOrEmail, String message) {
        String display = resolveDisplayName(senderNameOrEmail);
        NotificationEvent evt = NotificationEvent.builder()
                .id(UUID.randomUUID().toString())
                .type("CHAT")
                .title("새 채팅 메시지")
                .message((display != null ? display + ": " : "") + safe(message))
                .link("/chat/" + roomId + (salePostId != null ? ("?post=" + salePostId) : ""))
                .createdAt(Instant.now())
                .roomId(roomId)
                .salePostId(salePostId)
                .build();
        sendToUser(userId, evt);
    }

    public void notifyWantedComment(Long ownerUserId, Long wantedId, String commenterAliasOrEmail, String commentSnippet) {
        String display = resolveDisplayName(commenterAliasOrEmail);
        NotificationEvent evt = NotificationEvent.builder()
                .id(UUID.randomUUID().toString())
                .type("WANTED_COMMENT")
                .title("구해요 댓글")
                .message((display != null ? display + "님의 새 댓글: " : "새 댓글: ")
                        + truncate(safe(commentSnippet), 80))
                .link("/wanted/" + wantedId)
                .createdAt(Instant.now())
                .build();
        sendToUser(ownerUserId, evt);
    }

    // ====== 🔔 예약 알림 추가 ======

    public void notifyReservationRequested(
            Long targetUserId, Long roomId, Long reservationId, Long salePostId,
            String placeLabel, Instant reservedAt
    ) {
        NotificationEvent evt = NotificationEvent.builder()
                .id(UUID.randomUUID().toString())
                .type("RESERVATION_REQUESTED")
                .title("예약 요청")
                .message("새 예약 요청이 도착했어요.")
                .link("/chat/" + roomId + (salePostId != null ? ("?post=" + salePostId) : ""))
                .createdAt(Instant.now())
                .roomId(roomId)
                .reservationId(reservationId)
                .salePostId(salePostId)
                .status("REQUESTED")
                .placeLabel(placeLabel)
                .reservedAt(reservedAt)
                .build();
        sendToUser(targetUserId, evt);
    }

    public void notifyReservationConfirmed(
            Long targetUserId, Long roomId, Long reservationId, Long salePostId
    ) {
        NotificationEvent evt = NotificationEvent.builder()
                .id(UUID.randomUUID().toString())
                .type("RESERVATION_CONFIRMED")
                .title("예약 확정")
                .message("예약이 수락되어 확정되었습니다.")
                .link("/chat/" + roomId + (salePostId != null ? ("?post=" + salePostId) : ""))
                .createdAt(Instant.now())
                .roomId(roomId)
                .reservationId(reservationId)
                .salePostId(salePostId)
                .status("CONFIRMED")
                .build();
        sendToUser(targetUserId, evt);
    }

    public void notifyReservationCanceled(
            Long targetUserId, Long roomId, Long reservationId, Long salePostId, String reason
    ) {
        NotificationEvent evt = NotificationEvent.builder()
                .id(UUID.randomUUID().toString())
                .type("RESERVATION_CANCELED")
                .title("예약 취소")
                .message("예약이 취소되었습니다.")
                .link("/chat/" + roomId + (salePostId != null ? ("?post=" + salePostId) : ""))
                .createdAt(Instant.now())
                .roomId(roomId)
                .reservationId(reservationId)
                .salePostId(salePostId)
                .status("CANCELED")
                .reason(safe(reason))
                .build();
        sendToUser(targetUserId, evt);
    }

    public void notifyReservationCompleted(
            Long targetUserId, Long roomId, Long reservationId, Long salePostId
    ) {
        NotificationEvent evt = NotificationEvent.builder()
                .id(UUID.randomUUID().toString())
                .type("RESERVATION_COMPLETED")
                .title("거래 완료")
                .message("거래가 완료되었습니다.")
                .link("/chat/" + roomId + (salePostId != null ? ("?post=" + salePostId) : ""))
                .createdAt(Instant.now())
                .roomId(roomId)
                .reservationId(reservationId)
                .salePostId(salePostId)
                .status("COMPLETED")
                .build();
        sendToUser(targetUserId, evt);
    }

    // ====== 공통 전송 ======
    public void sendToUser(Long userId, NotificationEvent event) {
        Map<String, SseEmitter> map = emitterRepository.get(userId);
        if (map.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : map.values()) {
            try {
                sendInternal(emitter, event);
            } catch (Exception e) {
                emitterRepository.remove(userId, emitter);
            }
        }
    }

    private void sendInternal(SseEmitter emitter, NotificationEvent event) throws IOException {
        emitter.send(SseEmitter.event()
                .id(event.getId())
                .name("notification") // 🔔 이름있는 이벤트로 보냄
                .data(objectMapper.writeValueAsString(event)));
    }

    // ====== 표시명 유틸 ======
    private String resolveDisplayName(String raw) {
        if (raw == null || raw.isBlank()) return "사용자";
        String s = raw.trim();
        if (looksLikeEmail(s)) {
            String localPart = s.substring(0, s.indexOf('@'));
            try {
                if (userRepository != null && userRepository.isPresent()) {
                    return userRepository.get().findByEmail(s)
                            .map(this::userDisplayName)
                            .orElse(localPart);
                }
            } catch (Exception ignore) {}
            return localPart;
        }
        return s;
    }
    private boolean looksLikeEmail(String s) {
        return s.contains("@") && !s.startsWith("@") && s.indexOf('@') < s.length() - 1;
    }
    private String userDisplayName(User u) {
        String name = firstNonBlank(u.getUsername(), tryNickname(u));
        return name != null ? name : "사용자";
    }
    private String tryNickname(User u) {
        try { return (String) User.class.getMethod("getNickname").invoke(u); }
        catch (Exception e) { return null; }
    }
    private String firstNonBlank(String... arr) {
        if (arr == null) return null;
        for (String s : arr) if (s != null && !s.isBlank()) return s.trim();
        return null;
    }
    private String safe(String s) { return s == null ? "" : s; }
    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
