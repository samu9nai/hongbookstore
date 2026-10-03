package com.hongik.books.domain.post.domain;

import com.hongik.books.domain.book.domain.Book;
import com.hongik.books.domain.post.dto.SalePostUpdateRequestDTO;
import com.hongik.books.domain.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.Check;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 판매 게시글 정보를 담는 SalePost Entity
 */
@Getter @Entity
@Check(constraints = "price >= 0 AND price <= 1000000000")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SalePost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long id;

    // PostImage와의 1:N 관계 설정
    @OneToMany(mappedBy = "salePost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostImage> postImages = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    // 거래 완료 시 실제 구매자 기록 (null 가능)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id")
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(nullable = false)
    private String postTitle;

    @Lob
    @Column(nullable = false)
    private String postContent;

    @Column(nullable = false)
    private Integer price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SaleStatus status;

    // 책 상태 필드들
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Condition writingCondition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Condition tearCondition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Condition waterCondition;

    // 가격 협의 가능 여부
    @Column(nullable = false)
    private boolean negotiable;

    // Moderation flags for content
    @Column(nullable = false)
    private boolean contentToxic = false;

    private String contentToxicLevel;   // "확실한 비속어", "애매한 비속어", "비속어 아님"
    private Double contentToxicMalicious;
    private Double contentToxicClean;
    private String contentToxicReason;  // disabled | blank | unavailable | error | null

    // 조회수
    @Column(nullable = false)
    @ColumnDefault("0")
    private int views = 0;

    // 해당 게시글을 찜한 수 (정렬용 가상 컬럼)
    @Formula("(select count(pl.post_like_id) from post_like pl where pl.post_id = post_id)")
    private long likeCount;

    private String locationName;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    // ✅ 추가: 교내/교외 기본 위치 코드
    @Column(length = 64, nullable = false)
    private String oncampusPlaceCode;

    @Column(length = 64, nullable = false)
    private String offcampusStationCode;

    // ✅ 추가: 카테고리(엔티티에 실제로 보관)
    @Column(name = "main_category", length = 20)
    private String mainCategory;

    @Column(name = "sub_category", length = 50)
    private String subCategory;

    @Column(name = "detail_category", length = 100)
    private String detailCategory;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Builder
    public SalePost(User seller, Book book, String postTitle, String postContent,
                    Integer price, SaleStatus status, String locationName,
                    BigDecimal latitude, BigDecimal longitude,
                    Condition writingCondition, Condition tearCondition, Condition waterCondition,
                    boolean negotiable,
                    String oncampusPlaceCode, String offcampusStationCode,
                    String mainCategory, String subCategory, String detailCategory) {
        this.seller = seller;
        this.book = book;
        this.postTitle = postTitle;
        this.postContent = postContent;
        this.price = price;
        this.status = status;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.writingCondition = writingCondition;
        this.tearCondition = tearCondition;
        this.waterCondition = waterCondition;
        this.negotiable = negotiable;
        this.oncampusPlaceCode = oncampusPlaceCode;
        this.offcampusStationCode = offcampusStationCode;
        this.mainCategory = trimToNull(mainCategory);
        this.subCategory = trimToNull(subCategory);
        this.detailCategory = trimToNull(detailCategory);
    }

    public enum SaleStatus {
        FOR_SALE, RESERVED, SOLD_OUT
    }

    public void update(SalePostUpdateRequestDTO request) {
        this.postTitle = request.getPostTitle();
        this.postContent = request.getPostContent();
        this.price = request.getPrice();
        this.writingCondition = request.getWritingCondition();
        this.tearCondition = request.getTearCondition();
        this.waterCondition = request.getWaterCondition();
        this.negotiable = request.isNegotiable();
        validateInvariants();
    }

    public void applyContentModeration(String level, Double malicious, Double clean, boolean toxic, String reason) {
        this.contentToxic = toxic;
        this.contentToxicLevel = level;
        this.contentToxicMalicious = malicious;
        this.contentToxicClean = clean;
        this.contentToxicReason = reason;
    }

    public void increaseViewCount() { this.views++; }

    public void addPostImage(PostImage postImage) { this.postImages.add(postImage); }

    public void changeStatus(SaleStatus newStatus) { this.status = newStatus; }

    public void setBuyer(User buyer) { this.buyer = buyer; }

    // --- Invariants ---
    private static final int PRICE_MIN = 0;
    private static final int PRICE_MAX = 1_000_000_000;

    @PrePersist @PreUpdate
    private void onPersistOrUpdate() { validateInvariants(); }

    private void validateInvariants() {
        if (this.price == null) throw new IllegalArgumentException("가격은 필수입니다.");
        if (this.price < PRICE_MIN) throw new IllegalArgumentException("가격은 0원 이상이어야 합니다.");
        if (this.price > PRICE_MAX) throw new IllegalArgumentException("가격이 너무 큽니다. 최대 1,000,000,000원까지 입력 가능합니다.");
    }

    private static String trimToNull(String v){
        return (v == null || v.trim().isEmpty()) ? null : v.trim();
    }
}
