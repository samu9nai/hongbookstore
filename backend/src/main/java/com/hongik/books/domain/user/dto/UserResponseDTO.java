package com.hongik.books.domain.user.dto;

public record UserResponseDTO(
        Long id,
        String username,
        String email,
        boolean studentVerified,
        String univEmail,
        String profileImageUrl
) {
}
