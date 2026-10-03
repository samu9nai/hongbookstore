package com.hongik.books.domain.user.dto;

/**
 * 로그인 성공 또는 토큰 재발급 시,
 * 새로운 토큰 정보를 담아 클라이언트에 응답하기 위한 DTO
 * @param accessToken 새로 발급된 액세스 토큰
 * @param refreshToken 새로 발급된 리프레시 토큰
 */
public record LoginResponseDTO(
        String accessToken,
        String refreshToken
) {
}