package com.hongik.books.domain.wanted.dto;

import com.hongik.books.domain.wanted.domain.Wanted;

import java.time.LocalDateTime;

public record WantedDetailResponseDTO(
        Long id,
        String title,
        String author,
        String condition,
        int price,
        String category,
        String department,
        String content,
        // Moderation info
        boolean contentToxic,
        String contentToxicLevel,
        Double contentToxicMalicious,
        Double contentToxicClean,
        String contentToxicReason,
        Long requesterId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static WantedDetailResponseDTO from(Wanted w) {
        return new WantedDetailResponseDTO(
                w.getId(),
                w.getTitle(),
                w.getAuthor(),
                w.getDesiredCondition(),
                w.getPrice(),
                w.getCategory(),
                w.getDepartment(),
                w.getContent(),
                w.isContentToxic(),
                w.getContentToxicLevel(),
                w.getContentToxicMalicious(),
                w.getContentToxicClean(),
                w.getContentToxicReason(),
                w.getRequester().getId(),
                w.getCreatedAt(),
                w.getUpdatedAt()
        );
    }
}
