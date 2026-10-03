package com.hongik.books.domain.post.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 판매 게시글에 첨부된 이미지를 저장하는 Entity
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
public class PostImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_image_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private SalePost salePost; // 이 이미지가 속한 판매 게시글

    @Column(nullable = false, length = 2048)
    private String imageUrl; // GCP에 저장된 이미지 URL

    @Builder
    public PostImage(SalePost salePost, String imageUrl) {
        this.salePost = salePost;
        this.imageUrl = imageUrl;
    }
}
