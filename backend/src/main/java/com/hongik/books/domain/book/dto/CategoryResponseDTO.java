package com.hongik.books.domain.book.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hongik.books.domain.book.domain.Category;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY) // 비어있는 리스트는 json 응답에 포함하지 않음
public class CategoryResponseDTO {
    private Long id;
    private String name;
    private List<CategoryResponseDTO> children;

    // Entity를 DTO로 변환하는 정적 팩토리 메서드
    public static CategoryResponseDTO fromEntity(Category category) {
        return new CategoryResponseDTO(
                category.getId(),
                category.getName(),
                new ArrayList<>() // children은 서비스 레이어에서 채워줄 것이므로 비워둠
        );
    }
}
