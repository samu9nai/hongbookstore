package com.hongik.books.domain.book.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 카카오 책 검색 API의 응답을 담을 DTO
 */
@Getter
@NoArgsConstructor
@ToString
public class KakaoBookSearchResponseDTO {
    @JsonProperty("meta")
    private Meta meta;

    @JsonProperty("documents")
    private List<Document> documents;

    @Getter
    @NoArgsConstructor
    @ToString
    public static class Meta {
        @JsonProperty("total_count")
        private Integer totalCount;

        @JsonProperty("pageable_count")
        private Integer pageableCount;

        @JsonProperty("is_end")
        private Boolean isEnd;
    }

    @Getter
    @NoArgsConstructor
    @ToString
    public static class Document {
        private String title;
        private String contents;
        private String url;
        private String isbn;
        private OffsetDateTime datetime;
        private List<String> authors;
        private String publisher;
        private List<String> translators;
        private Integer price;

        @JsonProperty("sale_price")
        private Integer salePrice;

        private String thumbnail;
        private String status;
    }
}
