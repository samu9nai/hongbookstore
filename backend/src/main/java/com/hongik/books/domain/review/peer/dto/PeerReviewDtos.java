package com.hongik.books.domain.review.peer.dto;

import com.hongik.books.domain.review.peer.domain.RatingLabel;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PeerReviewDtos {

    public record CreateRequest(
            @NotNull Long postId,
            @NotNull RatingLabel ratingLabel,
            @NotNull
            @DecimalMin(value = "0.00", inclusive = true)
            @DecimalMax(value = "5.00", inclusive = true)
            @Digits(integer = 1, fraction = 2)
            BigDecimal ratingScore,
            List<String> ratingKeywords
    ) {}

    public record Response(
            Long reviewId,
            Long postId,
            Long reviewerId,
            String reviewerNickname,
            RatingLabel ratingLabel,
            BigDecimal ratingScore,
            List<String> ratingKeywords,
            LocalDateTime createdAt
    ) {}

    public record Summary(
        BigDecimal averageScore,
        long reviewCount
    ) {}

    @SuppressWarnings("ClassCanBeRecord")
    public static class PageRes {
        public List<Response> content;
        public int page;
        public int size;
        public long totalElements;
        public int totalPages;
        public boolean last;

        public PageRes() {}

        public PageRes(List<Response> content, int page, int size, long totalElements, int totalPages, boolean last) {
            this.content = content;
            this.page = page;
            this.size = size;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
            this.last = last;
        }
    }
}
