package com.hongik.books.domain.review.peer.service;

import com.hongik.books.domain.post.domain.SalePost;
import com.hongik.books.domain.post.repository.SalePostRepository;
import com.hongik.books.domain.review.peer.domain.PeerReview;
import com.hongik.books.domain.review.peer.domain.PeerReview.TargetRole;
import com.hongik.books.domain.review.peer.dto.PeerReviewDtos;
import com.hongik.books.domain.review.peer.repository.PeerReviewRepository;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.hongik.books.moderation.ModerationPolicyProperties;
import com.hongik.books.moderation.ModerationService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PeerReviewService {
    private final PeerReviewRepository peerReviewRepository;
    private final UserRepository userRepository;
    private final SalePostRepository salePostRepository;
    private final com.hongik.books.moderation.toxic.ToxicFilterClient toxicFilterClient;
    private final ModerationService moderationService;
    private final ModerationPolicyProperties moderationPolicy;

    public void createReview(Long reviewerId, PeerReviewDtos.CreateRequest request, TargetRole role) {
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        SalePost salePost = salePostRepository.findById(request.postId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        if (salePost.getStatus() != SalePost.SaleStatus.SOLD_OUT) {
            throw new IllegalStateException("거래가 완료된 게시글에만 후기를 남길 수 있습니다.");
        }
        if (salePost.getBuyer() == null) {
            throw new IllegalStateException("거래의 구매자 정보가 없습니다. SOLD_OUT 시 buyer를 설정하세요.");
        }

        // 역할에 따라 대상/권한 결정
        User target;
        if (role == TargetRole.SELLER) { // 구매자 -> 판매자
            if (!salePost.getBuyer().getId().equals(reviewer.getId())) {
                throw new SecurityException("구매자만 판매자에 대한 후기를 작성할 수 있습니다.");
            }
            target = salePost.getSeller();
        } else { // BUYER: 판매자 -> 구매자
            if (!salePost.getSeller().getId().equals(reviewer.getId())) {
                throw new SecurityException("판매자만 구매자에 대한 후기를 작성할 수 있습니다.");
            }
            target = salePost.getBuyer();
        }

        if (peerReviewRepository.existsByReviewerIdAndSalePostIdAndTargetRole(reviewer.getId(), salePost.getId(), role)) {
            throw new IllegalStateException("이미 해당 거래에 대한 후기를 작성했습니다.");
        }

        // 유해 표현 검사 (키워드 각각 검사, 정책 기반)
        var mode = moderationPolicy.getPeerReview().getRatingKeywords();
        if (request.ratingKeywords() != null) {
            for (String kw : request.ratingKeywords()) {
                if (kw != null && !kw.isBlank()) {
                    moderationService.checkOrThrow(kw, mode, "ratingKeywords");
                }
            }
        }

        String keywords = request.ratingKeywords() == null || request.ratingKeywords().isEmpty()
                ? null
                : String.join(",", request.ratingKeywords());

        var entity = PeerReview.builder()
                .targetUser(target)
                .targetRole(role)
                .reviewer(reviewer)
                .salePost(salePost)
                .ratingLabel(request.ratingLabel())
                .ratingScore(request.ratingScore() == null ? null : request.ratingScore().setScale(2, RoundingMode.HALF_UP))
                .ratingKeywords(keywords)
                .build();
        peerReviewRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public PeerReviewDtos.PageRes getReviewsForTarget(Long targetUserId, TargetRole role, int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page), Math.min(size, 50));
        var p = peerReviewRepository.findByTargetUserIdAndTargetRoleOrderByCreatedAtDesc(targetUserId, role, pageable);
        var content = p.getContent().stream().map(r -> new PeerReviewDtos.Response(
                r.getId(),
                r.getSalePost().getId(),
                r.getReviewer().getId(),
                r.getReviewer().getUsername(),
                r.getRatingLabel(),
                r.getRatingScore() == null ? BigDecimal.ZERO : r.getRatingScore().setScale(2, RoundingMode.HALF_UP),
                r.getRatingKeywords() == null || r.getRatingKeywords().isBlank() ? List.of() : Arrays.stream(r.getRatingKeywords().split(",")).map(String::trim).toList(),
                r.getCreatedAt()
        )).collect(Collectors.toList());
        return new PeerReviewDtos.PageRes(content, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages(), p.isLast());
    }

    @Transactional(readOnly = true)
    public PeerReviewDtos.Summary getSummary(Long targetUserId, TargetRole role) {
        Double avg = peerReviewRepository.findAverageScoreByTargetUserAndRole(targetUserId, role);
        long cnt = peerReviewRepository.countByTargetUserIdAndTargetRole(targetUserId, role);
        BigDecimal avgBd = BigDecimal.valueOf(avg == null ? 0.0 : avg).setScale(2, RoundingMode.HALF_UP);
        return new PeerReviewDtos.Summary(avgBd, cnt);
    }
}
