package com.hongik.books.domain.review.summary.controller;

import com.hongik.books.domain.review.peer.domain.PeerReview.TargetRole;
import com.hongik.books.domain.review.peer.repository.PeerReviewRepository;
import com.hongik.books.domain.review.summary.dto.UserReviewAggregateSummaryDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;

@RestController
@RequestMapping("/api/reviews/summary")
@RequiredArgsConstructor
public class ReviewSummaryController {
    private final PeerReviewRepository peerReviewRepository;

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserReviewAggregateSummaryDTO> getUserAggregate(@PathVariable Long userId) {
        Double sellerAvgD = peerReviewRepository.findAverageScoreByTargetUserAndRole(userId, TargetRole.SELLER);
        long sellerCnt = peerReviewRepository.countByTargetUserIdAndTargetRole(userId, TargetRole.SELLER);
        Double buyerAvgD = peerReviewRepository.findAverageScoreByTargetUserAndRole(userId, TargetRole.BUYER);
        long buyerCnt = peerReviewRepository.countByTargetUserIdAndTargetRole(userId, TargetRole.BUYER);

        BigDecimal sellerAvg = BigDecimal.valueOf(sellerAvgD == null ? 0.0 : sellerAvgD).setScale(2, RoundingMode.HALF_UP);
        BigDecimal buyerAvg = BigDecimal.valueOf(buyerAvgD == null ? 0.0 : buyerAvgD).setScale(2, RoundingMode.HALF_UP);
        long total = sellerCnt + buyerCnt;
        BigDecimal overall = total == 0 ? BigDecimal.ZERO :
                sellerAvg.multiply(BigDecimal.valueOf(sellerCnt))
                        .add(buyerAvg.multiply(BigDecimal.valueOf(buyerCnt)))
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

        return ResponseEntity.ok(new UserReviewAggregateSummaryDTO(
                sellerAvg, sellerCnt, buyerAvg, buyerCnt, overall, total
        ));
    }
}
