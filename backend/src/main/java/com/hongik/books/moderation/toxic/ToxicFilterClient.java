package com.hongik.books.moderation.toxic;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ToxicFilterClient {

    private final WebClient client;
    private final ToxicFilterProperties properties;

    public ToxicFilterClient(WebClient.Builder builder, ToxicFilterProperties properties) {
        this.properties = properties;
        WebClient.Builder b = builder.baseUrl(properties.getBaseUrl());
        if (properties.getApiKey() != null && !properties.getApiKey().isBlank()) {
            b.defaultHeader("X-API-Key", properties.getApiKey());
        }
        this.client = b.defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json").build();
    }

    public Result check(String text) {
        if (!properties.isEnabled()) {
            return Result.allowed(text, null, null, "disabled", List.of());
        }
        if (text == null || text.isBlank()) {
            return Result.allowed(text, null, null, "blank", List.of());
        }
        try {
            ResponseBody body = client.post()
                    .uri("/predict")
                    .bodyValue(Map.of("text", text))
                    .retrieve()
                    .bodyToMono(ResponseBody.class)
                    .timeout(Duration.ofSeconds(70))
                    .onErrorResume(ex -> {
                        log.warn("toxic-filter call failed: {}", ex.toString());
                        return Mono.empty();
                    })
                    .block();

            if (body == null) {
                // Fail-open: treat as allowed but mark reason
                return Result.allowed(text, null, null, "unavailable", List.of());
            }

            boolean block;
            ToxicFilterProperties.BlockLevel level = properties.getBlockLevel();
            String pred = body.getPredictionLevel();
            if (level == ToxicFilterProperties.BlockLevel.NONE) {
                block = false;
            } else if (level == ToxicFilterProperties.BlockLevel.CERTAIN) {
                block = "확실한 비속어".equals(pred);
            } else { // AMBIGUOUS
                block = "확실한 비속어".equals(pred) || "애매한 비속어".equals(pred);
            }

            Double malicious = body.getProbabilities() != null ? body.getProbabilities().getMalicious() : null;
            Double clean = body.getProbabilities() != null ? body.getProbabilities().getClean() : null;
            List<FlaggedSegment> flagged = body.getFlagged() != null ? body.getFlagged().stream()
                    .map(f -> new FlaggedSegment(f.getWord(), f.getStart(), f.getEnd(), f.getSentence()))
                    .toList() : List.of();
            return new Result(text, pred, malicious, clean, block, null, flagged);
        } catch (Exception e) {
            log.warn("toxic-filter unexpected error: {}", e.toString());
            return Result.allowed(text, null, null, "error", List.of());
        }
    }

    public void assertAllowed(String text) {
        Result r = check(text);
        if (r.blocked()) {
            throw new IllegalArgumentException("부적절한 표현이 감지되었습니다: " + r.predictionLevel +
                    (r.malicious != null ? String.format(" (malicious=%.4f)", r.malicious) : ""));
        }
    }

    public void assertAllowed(String text, String fieldName) {
        Result r = check(text);
        if (r.blocked()) {
            throw new com.hongik.books.common.exception.ModerationException(
                    "부적절한 표현이 감지되었습니다.",
                    fieldName,
                    r.predictionLevel,
                    r.malicious,
                    r.clean,
                    r.reason,
                    r.text,
                    r.flaggedSegments
            );
        }
    }

    /**
     * @param predictionLevel "확실한 비속어" | "애매한 비속어" | "비속어 아님"
     * @param reason          disabled | blank | unavailable | error | null
     */
    public record Result(
            String text,
            String predictionLevel,
            Double malicious,
            Double clean,
            boolean blocked,
            String reason,
            List<FlaggedSegment> flaggedSegments) {

        public static Result allowed(String text, Double malicious, Double clean, String reason, List<FlaggedSegment> flagged) {
                return new Result(text, "비속어 아님", malicious, clean, false, reason, flagged);
            }
        }

    public record FlaggedSegment(String word, Integer start, Integer end, String sentence) {
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ResponseBody {
        private String text;

        @JsonProperty("prediction_level")
        private String predictionLevel;

        private Probabilities probabilities;
        private List<FlaggedDto> flagged;

        @Getter
        @JsonIgnoreProperties(ignoreUnknown = true)
        static class Probabilities {
            private Double malicious;
            private Double clean;
        }

        @Getter
        @JsonIgnoreProperties(ignoreUnknown = true)
        static class FlaggedDto {
            private String word;
            private Integer start;
            private Integer end;
            private String sentence;
        }
    }
}
