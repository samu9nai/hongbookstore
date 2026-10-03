package com.hongik.books.domain.wanted.dto;

import com.hongik.books.domain.wanted.domain.Wanted;

public record WantedSummaryResponseDTO(
        Long id,
        String title,
        String author,
        String condition,
        int price,
        String category,
        String department,
        boolean hasToxicContent
) {
    public static WantedSummaryResponseDTO from(Wanted w) {
        return new WantedSummaryResponseDTO(
                w.getId(),
                w.getTitle(),
                w.getAuthor(),
                w.getDesiredCondition(),
                w.getPrice(),
                w.getCategory(),
                w.getDepartment(),
                w.isContentToxic()
        );
    }
}
