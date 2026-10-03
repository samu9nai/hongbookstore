package com.hongik.books.domain.review.place.service;

import com.hongik.books.domain.review.place.domain.PlaceReview;
import com.hongik.books.domain.review.place.domain.ReviewPhoto;
import com.hongik.books.domain.review.place.domain.ReviewReaction;
import com.hongik.books.domain.review.place.dto.ReviewDtos;
import com.hongik.books.domain.review.place.repository.PlaceReviewRepository;
import com.hongik.books.domain.review.place.repository.ReviewReactionRepository;
import com.hongik.books.moderation.ModerationPolicyProperties;
import com.hongik.books.moderation.ModerationService;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.List;

@RequiredArgsConstructor
@Service
public class PlaceReviewService {
    private final PlaceReviewRepository reviewRepo;
    private final ReviewReactionRepository reactionRepo;
    private final ReviewReactionRepository photoRepo;   // ✅ 추가
    private final UserRepository userRepository;
    private final ModerationService moderationService;
    private final ModerationPolicyProperties moderationPolicy;

    @Transactional
    public Long createReview(Long placeId, Long userId, int rating, String content, List<String> photoUrls) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user not found"));

        // 1인 1리뷰 (중복 방지)
        if (reviewRepo.existsByPlaceIdAndUserId(placeId, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 이 장소에 리뷰를 작성하셨습니다.");
        }

        // ✅ 사진/미디어 개수 제한: 최대 3
        if (photoUrls != null && photoUrls.size() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사진/GIF는 최대 3개까지만 업로드 가능합니다.");
        }

        // 유해표현 검사
        var mode = moderationPolicy.getPlaceReview().getContent();
        moderationService.checkOrThrow(content, mode, "content");

        PlaceReview review = PlaceReview.builder()
                .placeId(placeId)
                .userId(user.getId())
                .userName(user.getUsername())
                .rating(Math.max(1, Math.min(5, rating)))
                .content(content == null ? "" : content.trim())
                .likesCount(0)
                .dislikesCount(0)
                .build();

        // 사진 세팅
        if (photoUrls != null) {
            int order = 0;
            for (String url : photoUrls) {
                if (url == null || url.isBlank()) continue;
                ReviewPhoto p = ReviewPhoto.builder()
                        .url(url)
                        .sortOrder(order++)
                        .build();
                review.addPhoto(p);
            }
        }

        reviewRepo.save(review);
        return review.getId();
    }

    @Transactional
    public void react(Long reviewId, Long userId, ReviewReaction.ReactionType type) {
        var review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("review not found"));

        reactionRepo.findByReviewIdAndUserId(reviewId, userId).ifPresentOrElse(
                r -> {
                    if (r.getReaction() == type) {
                        reactionRepo.delete(r);
                    } else {
                        r.setReaction(type);
                        reactionRepo.save(r);
                    }
                },
                () -> reactionRepo.save(ReviewReaction.builder()
                        .review(review)
                        .userId(userId)
                        .reaction(type)
                        .build())
        );

        review.setLikesCount((int) reactionRepo.countByReviewIdAndReaction(reviewId, ReviewReaction.ReactionType.LIKE));
        review.setDislikesCount((int) reactionRepo.countByReviewIdAndReaction(reviewId, ReviewReaction.ReactionType.DISLIKE));
        reviewRepo.save(review);
    }

    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        var review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다."));
        if (!review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 리뷰만 삭제할 수 있습니다.");
        }

        // ✅ 자식 먼저 제거 → 부모 삭제
        reactionRepo.deleteByReviewId(reviewId);
        photoRepo.deleteByReviewId(reviewId);
        reviewRepo.delete(review);
    }

    // (선택) placeId까지 확인하는 오버로드
    @Transactional
    public void deleteReview(Long placeId, Long reviewId, Long userId) {
        var review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다."));
        if (!review.getPlaceId().equals(placeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "장소와 리뷰 정보가 일치하지 않습니다.");
        }
        if (!review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 리뷰만 삭제할 수 있습니다.");
        }

        // ✅ 자식 먼저 제거 → 부모 삭제
        reactionRepo.deleteByReviewId(reviewId);
        photoRepo.deleteByReviewId(reviewId);
        reviewRepo.delete(review);
    }

    @Transactional
    public ReviewDtos.ListRes listByPlace(Long placeId, Long loginUserId, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        var slice = reviewRepo.findByPlaceIdOrderByCreatedAtDesc(placeId, pageable);

        double avg = reviewRepo.avgByPlace(placeId);
        long cnt = reviewRepo.countByPlaceId(placeId);

        var res = new ReviewDtos.ListRes();
        res.setAverageRating(avg);
        res.setReviewCount(cnt);
        var dtf = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        res.setReviews(slice.getContent().stream().map(r ->
                ReviewDtos.ReviewRes.builder()
                        .id(r.getId())
                        .userName(r.getUserName())
                        .userId(r.getUserId())
                        .rating(r.getRating())
                        .content(r.getContent())
                        .likes(r.getLikesCount())
                        .dislikes(r.getDislikesCount())
                        .createdAt(r.getCreatedAt().format(dtf))
                        .photos(
                                (r.getPhotos() == null ? List.<ReviewDtos.ReviewPhotoDto>of() :
                                        r.getPhotos().stream()
                                                .map(p -> new ReviewDtos.ReviewPhotoDto(p.getId(), p.getUrl(), p.getSortOrder()))
                                                .toList())
                        )
                        .build()
        ).toList());
        return res;
    }
}
