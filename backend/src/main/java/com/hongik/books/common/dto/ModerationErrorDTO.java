package com.hongik.books.common.dto;

import com.hongik.books.moderation.toxic.ToxicFilterClient;

import java.util.List;

public record ModerationErrorDTO(
        String field,
        String predictionLevel,
        Double malicious,
        Double clean,
        String reason,
        String offendingText,
        List<ToxicFilterClient.FlaggedSegment> flagged
) {}
