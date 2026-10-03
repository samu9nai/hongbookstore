package com.hongik.books.domain.book.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 카테고리 생성을 요청할 때 사용하는 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor // 테스트나 직접 생성 시 편의성
public class CategoryCreateRequestDTO {
    @NotBlank(message = "카테고리 이름은 필수입니다.")
    private String name;
    private Long parentId; // 부모 카테고리가 없을 경우 null (root 카테고리)

    // 비즈니스 로직 메서드 추가 가능
    public boolean isRootCategory() {
        return parentId == null;
    }
}