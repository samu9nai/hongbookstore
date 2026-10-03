package com.hongik.books.domain.review.peer.domain;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum RatingLabel {
    WORST,
    BAD,
    GOOD,
    BEST;

    @JsonCreator
    public static RatingLabel from(Object value) {
        if (value == null) return null;
        String s = value.toString().trim();
        if (s.isEmpty()) return null;
        // 대소문자 구분 없이 매핑
        switch (s.toUpperCase()) {
            case "WORST": return WORST;
            case "BAD": return BAD;
            case "GOOD": return GOOD;
            case "BEST": return BEST;
            default:
                // 숫자/문자 등 다른 입력이 와도 안전하게 실패
                throw new IllegalArgumentException("Unsupported ratingLabel: " + s);
        }
    }
}

