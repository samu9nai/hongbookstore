package com.hongik.books.domain.post.dto;

import com.hongik.books.domain.post.domain.Condition;
import com.hongik.books.domain.post.domain.PostImage;
import com.hongik.books.domain.post.domain.SalePost;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter
public class SalePostDetailResponseDTO {

    // SalePost 정보
    private final Long postId;
    private final String postTitle;
    private final String postContent;
    private final int price;
    private final SalePost.SaleStatus status;
    private final LocalDateTime createdAt;
    private final Condition writingCondition;
    private final Condition tearCondition;
    private final Condition waterCondition;
    private final boolean negotiable;
    private final int views;

    // Moderation info
    private final boolean contentToxic;
    private final String contentToxicLevel;
    private final Double contentToxicMalicious;
    private final Double contentToxicClean;
    private final String contentToxicReason;

    // ✅ 위치
    private final String oncampusPlaceCode;
    private final String offcampusStationCode;

    // ✅ 카테고리
    private final String mainCategory;
    private final String subCategory;
    private final String detailCategory;
    /** 프론트 편의: "전공 > 공과대학 > 컴퓨터공학과" */
    private final String categoryPath;

    // Book
    private final Long bookId;
    private final String bookTitle;
    private final String author;
    private final String publisher;
    private final Integer originalPrice;

    // User
    private final Long sellerId;
    private final String sellerNickname;
    private final String sellerProfileImageUrl;

    // Images
    private final List<String> postImageUrls;

    public static SalePostDetailResponseDTO fromEntity(SalePost salePost) {
        return new SalePostDetailResponseDTO(salePost);
    }

    private SalePostDetailResponseDTO(SalePost salePost) {
        // SalePost
        this.postId = salePost.getId();
        this.postTitle = salePost.getPostTitle();
        this.postContent = salePost.getPostContent();
        this.price = salePost.getPrice();
        this.status = salePost.getStatus();
        this.createdAt = salePost.getCreatedAt();
        this.writingCondition = salePost.getWritingCondition();
        this.tearCondition = salePost.getTearCondition();
        this.waterCondition = salePost.getWaterCondition();
        this.negotiable = salePost.isNegotiable();
        this.views = salePost.getViews();

        // Moderation
        this.contentToxic = salePost.isContentToxic();
        this.contentToxicLevel = salePost.getContentToxicLevel();
        this.contentToxicMalicious = salePost.getContentToxicMalicious();
        this.contentToxicClean = salePost.getContentToxicClean();
        this.contentToxicReason = salePost.getContentToxicReason();

        // 위치
        this.oncampusPlaceCode = salePost.getOncampusPlaceCode();
        this.offcampusStationCode = salePost.getOffcampusStationCode();

        // ✅ 카테고리
        this.mainCategory   = salePost.getMainCategory();
        this.subCategory    = salePost.getSubCategory();
        this.detailCategory = salePost.getDetailCategory();
        this.categoryPath = Stream.of(mainCategory, subCategory, detailCategory)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(" > "));

        // Book
        this.bookId = salePost.getBook().getId();
        this.bookTitle = salePost.getBook().getTitle();
        this.author = salePost.getBook().getAuthor();
        this.publisher = salePost.getBook().getPublisher();
        this.originalPrice = salePost.getBook().getOriginalPrice();

        // 판매자
        this.sellerId = salePost.getSeller().getId();
        this.sellerNickname = salePost.getSeller().getUsername();
        this.sellerProfileImageUrl = salePost.getSeller().getProfileImagePath();

        // 이미지
        this.postImageUrls = salePost.getPostImages().stream()
                .map(PostImage::getImageUrl)
                .collect(Collectors.toList());
    }
}
