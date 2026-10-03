package com.hongik.books.domain.review.place.controller;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.review.place.domain.ReviewReaction;
import com.hongik.books.domain.review.place.dto.ReviewDtos;
import com.hongik.books.domain.review.place.service.PlaceReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
public class PlaceReviewController {

    private final PlaceReviewService service;

    // 목록
    @GetMapping("/api/places/{placeId}/reviews")
    public ResponseEntity<ReviewDtos.ListRes> list(
            @PathVariable Long placeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal LoginUserDTO loginUser
    ) {
        Long uid = (loginUser == null ? null : loginUser.id());
        return ResponseEntity.ok(service.listByPlace(placeId, uid, page, size));
    }

    // 작성
    @PostMapping("/api/places/{placeId}/reviews")
    public ResponseEntity<?> create(
            @PathVariable Long placeId,
            @RequestBody ReviewDtos.CreateReq req,
            @AuthenticationPrincipal LoginUserDTO loginUser
    ) {
        try {
            Long id = service.createReview(
                    placeId, loginUser.id(), req.getRating(), req.getContent(), req.getPhotoUrls()
            );
            return ResponseEntity.ok(java.util.Map.of("id", id));
        } catch (IllegalStateException dup) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("success", false, "message", "이미 이 장소에 리뷰를 작성하셨습니다."));
        }
    }

    // 삭제 (리뷰 소유자만)
    @DeleteMapping("/api/places/reviews/{reviewId}")
    public ResponseEntity<?> delete(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal LoginUserDTO loginUser
    ) {
        service.deleteReview(reviewId, loginUser.id());
        return ResponseEntity.noContent().build();
    }

    // 리액션
    @PostMapping("/api/places/reviews/{reviewId}/reactions")
    public ResponseEntity<Void> react(
            @PathVariable Long reviewId,
            @RequestParam("type") ReviewReaction.ReactionType type,
            @AuthenticationPrincipal LoginUserDTO loginUser
    ) {
        service.react(reviewId, loginUser.id(), type);
        return ResponseEntity.ok().build();
    }
}
