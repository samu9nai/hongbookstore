package com.hongik.books.domain.post.dto;

import com.hongik.books.domain.post.domain.Condition;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SalePostUpdateRequestDTO {
    @NotBlank
    @Size(max = 100)
    private String postTitle;
    @NotBlank
    @Size(max = 5000)
    private String postContent;
    @PositiveOrZero
    @Max(1_000_000_000)
    private int price;
    @NotNull
    private Condition writingCondition; // 필기 상태
    @NotNull
    private Condition tearCondition;    // 찢어짐 상태
    @NotNull
    private Condition waterCondition;   // 물흘림 상태
    private boolean negotiable;         // 가격 협의 여부
}
