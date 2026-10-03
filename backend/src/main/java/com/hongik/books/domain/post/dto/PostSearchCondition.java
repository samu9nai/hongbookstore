package com.hongik.books.domain.post.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostSearchCondition {
    @Size(max = 200)
    private String query; // 검색어 (책 제목, 글 제목, 저자 등)
    @Size(max = 100)
    private String category; // 카테고리
    @Min(0)
    @Max(1_000_000_000)
    private Integer minPrice; // 최소 가격
    @Min(0)
    @Max(1_000_000_000)
    private Integer maxPrice; // 최대 가격
    // 필요에 따라 다른 필터 조건을 추가

    @AssertTrue(message = "minPrice는 maxPrice보다 작거나 같아야 합니다.")
    public boolean isValidRange() {
        if (minPrice == null || maxPrice == null) return true;
        return minPrice <= maxPrice;
    }
}
