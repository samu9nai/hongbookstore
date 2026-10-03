package com.hongik.books.domain.review.peer.controller;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.review.peer.domain.PeerReview.TargetRole;
import com.hongik.books.domain.review.peer.dto.PeerReviewDtos;
import com.hongik.books.domain.review.peer.service.PeerReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/peer-reviews")
@RequiredArgsConstructor
public class PeerReviewController {

    private final PeerReviewService peerReviewService;

    // 통합 생성: role을 쿼리 파라미터로 지정(BUYER|SELLER)
    @PostMapping
    public ResponseEntity<Void> create(@AuthenticationPrincipal LoginUserDTO loginUser,
                                       @RequestParam("role") TargetRole role,
                                       @Validated @RequestBody PeerReviewDtos.CreateRequest request) {
        peerReviewService.createReview(loginUser.id(), request, role);
        return ResponseEntity.ok().build();
    }

    // 특정 사용자(대상)에 대한 후기 목록
    @GetMapping("/users/{userId}")
    public ResponseEntity<PeerReviewDtos.PageRes> listByUser(@PathVariable Long userId,
                                                             @RequestParam("role") TargetRole role,
                                                             @RequestParam(defaultValue = "0") int page,
                                                             @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(peerReviewService.getReviewsForTarget(userId, role, page, size));
    }

    // 특정 사용자(대상)에 대한 요약
    @GetMapping("/users/{userId}/summary")
    public ResponseEntity<PeerReviewDtos.Summary> summaryByUser(@PathVariable Long userId,
                                                                @RequestParam("role") TargetRole role) {
        return ResponseEntity.ok(peerReviewService.getSummary(userId, role));
    }

    // 내가 받은 후기 목록
    @GetMapping("/my-received")
    public ResponseEntity<PeerReviewDtos.PageRes> myReceived(@AuthenticationPrincipal LoginUserDTO loginUser,
                                                             @RequestParam("role") TargetRole role,
                                                             @RequestParam(defaultValue = "0") int page,
                                                             @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(peerReviewService.getReviewsForTarget(loginUser.id(), role, page, size));
    }
}

