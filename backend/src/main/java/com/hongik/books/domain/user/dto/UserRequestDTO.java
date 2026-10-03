package com.hongik.books.domain.user.dto;

import jakarta.validation.constraints.*;

/**
 * 사용자 프로필 정보 수정을 위한 DTO
 * 회원가입이 아닌, 정보 수정에 사용
 */
public record UserRequestDTO(
        @Size(min = 2, max = 25, message = "닉네임은 2자 이상 25자 이하로 입력해주세요.")
        String username, // 선택 입력: 닉네임 변경 시 제공

        String profileImagePath // 선택 입력: 프로필 이미지 URL 변경 시 제공
        ) {
}
