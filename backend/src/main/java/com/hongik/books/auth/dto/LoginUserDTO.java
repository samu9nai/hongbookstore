package com.hongik.books.auth.dto;

/**
 * @AuthenticationPrincipal 로 주입받을 사용자 정보 객체
 * SecurityContext에 저장될 Principal 역할
 */
public record LoginUserDTO(
        Long id,
        String email
) {
    public LoginUserDTO {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Invalid user id: " + id);
        }
    }
}
