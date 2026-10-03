package com.hongik.books.domain.post.dto;

import com.hongik.books.domain.post.domain.SalePost;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 판매 상태 변경을 요청할 때 사용하는 DTO
 */
@Getter
@NoArgsConstructor
public class SalePostStatusUpdateRequestDTO {
    private SalePost.SaleStatus status;
    // SOLD_OUT으로 변경 시 최종 구매자 ID 전달
    private Long buyerId;
}
