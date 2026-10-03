package com.hongik.books.domain.user.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserRole {
    // Spring Security에서는 역할 앞에 "ROLE_" 접두사를 붙여줘야 인식
    USER("ROLE_USER", "일반 사용자"),
    STUDENT("ROLE_STUDENT", "홍익대생 인증 완료"),
    ADMIN("ROLE_ADMIN", "관리자");

    private final String key;
    private final String title;
}
