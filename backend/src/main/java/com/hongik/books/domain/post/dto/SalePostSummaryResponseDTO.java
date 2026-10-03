package com.hongik.books.domain.post.dto;

import com.hongik.books.domain.post.domain.SalePost;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 판매 게시글 목록 조회를 위한 요약 정보 응답 DTO
 */
@Getter
public class SalePostSummaryResponseDTO {

    private final Long postId;
    private final String postTitle;
    private final String author; // 저자 정보
    private final int price;
    private final String thumbnailUrl; // 대표 이미지 URL
    private final SalePost.SaleStatus status;
    private final LocalDateTime createdAt;
    private final String sellerNickname;
    private final long likeCount;
    private final boolean hasToxicContent;

    public static SalePostSummaryResponseDTO fromEntity(SalePost salePost) {
        return new SalePostSummaryResponseDTO(salePost);
    }

    private SalePostSummaryResponseDTO(SalePost salePost) {
        this.postId = salePost.getId();
        this.postTitle = salePost.getPostTitle();
        this.author = salePost.getBook().getAuthor(); // 저자 정보 매핑
        this.price = salePost.getPrice();
        // PostImages 목록에서 첫 번째 이미지를 썸네일로 사용
        // 이미지가 없는 경우를 대비해 null 체크
        this.thumbnailUrl = salePost.getPostImages().isEmpty()
                ? null // 또는 기본 이미지 URL
                : salePost.getPostImages().getFirst().getImageUrl();
        this.status = salePost.getStatus();
        this.createdAt = salePost.getCreatedAt();
        this.sellerNickname = salePost.getSeller().getUsername();
        this.likeCount = salePost.getLikeCount();
        this.hasToxicContent = salePost.isContentToxic();
    }
}
