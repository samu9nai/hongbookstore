package com.hongik.books.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record StudentVerificationRequestDTO(
        @NotBlank(message = "학교 이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        // @mail.hongik.ac.kr 와 @g.hongik.ac.kr 도메인을 모두 허용
        @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@(mail\\.hongik\\.ac\\.kr|g\\.hongik\\.ac\\.kr)$",
                message = "홍익대학교 메일(@mail.hongik.ac.kr 또는 @g.hongik.ac.kr) 형식이어야 합니다.")
        String univEmail) {
}
