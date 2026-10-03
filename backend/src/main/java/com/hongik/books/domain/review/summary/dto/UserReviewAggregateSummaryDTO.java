package com.hongik.books.domain.review.summary.dto;

import java.math.BigDecimal;

public record UserReviewAggregateSummaryDTO(
        BigDecimal sellerAverage,
        long sellerCount,
        BigDecimal buyerAverage,
        long buyerCount,
        BigDecimal overallAverage,
        long totalCount
) {}

