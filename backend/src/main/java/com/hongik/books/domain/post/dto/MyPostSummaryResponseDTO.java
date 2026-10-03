package com.hongik.books.domain.post.dto;

import com.hongik.books.domain.post.domain.SalePost;

import java.time.LocalDateTime;

/**
 * '내 판매글 목록' 조회를 위한 요약 정보 응답 DTO
 */
public record MyPostSummaryResponseDTO(
        Long postId,
        String bookTitle,
        int price,
        SalePost.SaleStatus status,
        String thumbnailUrl,
        LocalDateTime createdAt
) {
    public static MyPostSummaryResponseDTO fromEntity(SalePost salePost) {
        String thumbnailUrl = salePost.getPostImages().isEmpty()
                ? null // 이미지가 없으면 null
                : salePost.getPostImages().getFirst().getImageUrl();

        return new MyPostSummaryResponseDTO(
                salePost.getId(),
                salePost.getBook().getTitle(),
                salePost.getPrice(),
                salePost.getStatus(),
                thumbnailUrl,
                salePost.getCreatedAt()
        );
    }
}