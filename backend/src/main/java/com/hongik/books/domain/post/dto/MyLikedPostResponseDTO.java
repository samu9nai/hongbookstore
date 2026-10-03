package com.hongik.books.domain.post.dto;

import com.hongik.books.domain.post.domain.PostLike;
import com.hongik.books.domain.post.domain.SalePost;

import java.time.LocalDateTime;

/**
 * '내가 찜한 글 목록' 조회를 위한 응답 DTO
 */
public record MyLikedPostResponseDTO(
        Long postId,
        String postTitle,
        int price,
        SalePost.SaleStatus status,
        String thumbnailUrl,
        String sellerNickname,
        LocalDateTime createdAt
) {
    public static MyLikedPostResponseDTO from(PostLike postLike) {
        SalePost salePost = postLike.getSalePost();
        String thumbnailUrl = salePost.getPostImages().isEmpty()
                ? null
                : salePost.getPostImages().getFirst().getImageUrl();

        return new MyLikedPostResponseDTO(
                salePost.getId(),
                salePost.getPostTitle(),
                salePost.getPrice(),
                salePost.getStatus(),
                thumbnailUrl,
                salePost.getSeller().getUsername(),
                salePost.getCreatedAt()
        );
    }
}