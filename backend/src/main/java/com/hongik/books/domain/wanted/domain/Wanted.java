package com.hongik.books.domain.wanted.domain;

import com.hongik.books.domain.user.domain.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Check;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Check(constraints = "price >= 0 AND price <= 1000000000")
@Table(name = "wanted")
public class Wanted {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author; // 교재 저자

    @Column(name = "desired_condition")
    private String desiredCondition;

    @Column(nullable = false)
    private int price;

    /** "전공" | "교양" */
    @Column(nullable = false)
    private String category;

    /** 전공일 때만 채우는 학과 */
    @Column(name = "department")
    private String department;

    @Column(columnDefinition = "TEXT")
    private String content;

    // Moderation flags for content
    @Column(nullable = false)
    private boolean contentToxic = false;
    private String contentToxicLevel;
    private Double contentToxicMalicious;
    private Double contentToxicClean;
    private String contentToxicReason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void update(String title, String author, String condition, int price,
                       String category, String department, String content) {
        this.title = title;
        this.author = author;
        this.desiredCondition = condition;
        this.price = price;
        this.category = category;
        this.department = department;
        this.content = content;
        validateInvariants();
    }

    public void applyContentModeration(String level, Double malicious, Double clean, boolean toxic, String reason) {
        this.contentToxic = toxic;
        this.contentToxicLevel = level;
        this.contentToxicMalicious = malicious;
        this.contentToxicClean = clean;
        this.contentToxicReason = reason;
    }

    private static final int PRICE_MIN = 0;
    private static final int PRICE_MAX = 1_000_000_000;

    @PrePersist
    @PreUpdate
    private void onPersistOrUpdate() { validateInvariants(); }

    private void validateInvariants() {
        if (this.price < PRICE_MIN) throw new IllegalArgumentException("희망 가격은 0원 이상이어야 합니다.");
        if (this.price > PRICE_MAX) throw new IllegalArgumentException("희망 가격이 너무 큽니다. 최대 1,000,000,000원까지 입력 가능합니다.");
        if (this.title == null || this.title.isBlank()) throw new IllegalArgumentException("제목은 필수입니다.");
        if (this.author == null || this.author.isBlank()) throw new IllegalArgumentException("저자는 필수입니다.");
        if (this.category == null || this.category.isBlank()) throw new IllegalArgumentException("카테고리는 필수입니다.");
    }
}
