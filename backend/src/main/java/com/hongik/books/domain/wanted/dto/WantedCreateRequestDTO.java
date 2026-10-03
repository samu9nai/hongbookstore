package com.hongik.books.domain.wanted.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WantedCreateRequestDTO {
    @Size(max = 200)
    private String title;   // 선택 입력: 비워두면 서버에서 content로 보강
    @Size(max = 200)
    private String author;  // 선택 입력: 비워두면 서버에서 '미상'으로 보강
    @NotBlank
    @Size(max = 50)
    private String condition;
    @PositiveOrZero
    @Max(1_000_000_000)
    private int price;
    @NotBlank
    @Pattern(regexp = "전공|교양", message = "category는 전공 또는 교양이어야 합니다.")
    private String category;    // "전공" | "교양"
    private String department;  // 전공일 때만 사용
    @Size(max = 5000)
    private String content;
}
