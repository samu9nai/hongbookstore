package com.hongik.books.domain.post.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 책의 상태(상, 중, 하)를 나타내는 Enum
 */
@Getter
@RequiredArgsConstructor
public enum Condition {
    HIGH("상"),
    MEDIUM("중"),
    LOW("하");

    private final String description;
}
