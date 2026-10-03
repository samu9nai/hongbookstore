package com.hongik.books.domain.review.place.dto;

import lombok.*;
import java.util.List;

public class ReviewDtos {
    @Getter @Setter
    public static class CreateReq {
        private int rating;
        private String content;
        private List<String> photoUrls;
    }

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
    public static class ReviewPhotoDto {
        private Long id;
        private String url;
        private Integer sortOrder;
    }

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
    public static class ReviewRes {
        private Long id;
        private Long userId;      // ⬅️ 프론트에서 내 리뷰 식별용으로 추가
        private String userName;
        private int rating;
        private String content;
        private int likes;
        private int dislikes;
        private String createdAt;
        private List<ReviewPhotoDto> photos;
    }

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
    public static class ListRes {
        private double averageRating;
        private long reviewCount;
        private java.util.List<ReviewRes> reviews;
    }
}
