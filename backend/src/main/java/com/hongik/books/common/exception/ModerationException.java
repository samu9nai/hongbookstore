package com.hongik.books.common.exception;

import com.hongik.books.moderation.toxic.ToxicFilterClient;
import lombok.Getter;

import java.util.List;

@Getter
public class ModerationException extends RuntimeException {
    private final String field;
    private final String predictionLevel;
    private final Double malicious;
    private final Double clean;
    private final String reason; // disabled | blank | unavailable | error | null
    private final String offendingText;
    private final List<ToxicFilterClient.FlaggedSegment> flaggedSegments;

    public ModerationException(String message, String field, String predictionLevel, Double malicious, Double clean, String reason, String offendingText, List<ToxicFilterClient.FlaggedSegment> flaggedSegments) {
        super(message);
        this.field = field;
        this.predictionLevel = predictionLevel;
        this.malicious = malicious;
        this.clean = clean;
        this.reason = reason;
        this.offendingText = offendingText;
        this.flaggedSegments = flaggedSegments;
    }

}
