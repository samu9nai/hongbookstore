package com.hongik.books.domain.chat.controller;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.chat.dto.ChatReservationCancelRequest;
import com.hongik.books.domain.chat.dto.ChatReservationRequest;
import com.hongik.books.domain.chat.dto.ChatReservationResponse;
import com.hongik.books.domain.chat.service.ChatReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/chat/rooms/{roomId}/reservation")
@RequiredArgsConstructor
public class ChatReservationController {

    private final ChatReservationService service;

    /** 현재 예약(최근 1건) */
    @GetMapping
    public ResponseEntity<?> getCurrent(
            @PathVariable Long roomId,
            @AuthenticationPrincipal LoginUserDTO user
    ) {
        return service.getCurrent(roomId, user)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** 예약 요청(구매자만) -> 상태는 REQUESTED */
    @PostMapping
    public ResponseEntity<ChatReservationResponse> upsert(
            @PathVariable Long roomId,
            @RequestBody ChatReservationRequest req,
            @AuthenticationPrincipal LoginUserDTO user
    ) {
        ChatReservationResponse created = service.upsert(roomId, req, user);
        return ResponseEntity.created(URI.create("/api/chat/rooms/" + roomId + "/reservation/" + created.id()))
                .body(created);
    }

    /** 예약 수락(판매자만) -> REQUESTED -> CONFIRMED */
    @PatchMapping("/{reservationId}/accept")
    public ResponseEntity<ChatReservationResponse> accept(
            @PathVariable Long roomId,
            @PathVariable Long reservationId,
            @AuthenticationPrincipal LoginUserDTO user
    ) {
        return ResponseEntity.ok(service.accept(roomId, reservationId, user));
    }

    /** 예약 취소(양측 가능) */
    @PatchMapping("/{reservationId}/cancel")
    public ResponseEntity<ChatReservationResponse> cancel(
            @PathVariable Long roomId,
            @PathVariable Long reservationId,
            @AuthenticationPrincipal LoginUserDTO user,
            @RequestBody ChatReservationCancelRequest req
    ) {
        return ResponseEntity.ok(service.cancel(roomId, reservationId, user, req.reason()));
    }

    /** 거래 완료(확정건만) */
    @PatchMapping("/{reservationId}/complete")
    public ResponseEntity<ChatReservationResponse> complete(
            @PathVariable Long roomId,
            @PathVariable Long reservationId,
            @AuthenticationPrincipal LoginUserDTO user
    ) {
        return ResponseEntity.ok(service.complete(roomId, reservationId, user));
    }
}
