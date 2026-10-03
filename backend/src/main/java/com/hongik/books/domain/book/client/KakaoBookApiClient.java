package com.hongik.books.domain.book.client;

import com.hongik.books.config.KakaoApiProperties;
import com.hongik.books.domain.book.dto.KakaoBookSearchResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * 카카오 책 검색 API를 실제로 호출하는 클라이언트
 */
@Slf4j
@Component
public class KakaoBookApiClient {
    private final WebClient webClient;

    public KakaoBookApiClient(WebClient.Builder webClientBuilder, KakaoApiProperties properties) {
        this.webClient = webClientBuilder
                .baseUrl(properties.getUrl())
                .defaultHeader("Authorization", "KakaoAK " + properties.getRestApiKey())
                .build();
    }

    /**
     * 키워드로 책을 검색
     * @param query 검색어
     * @return 검색 결과 Mono 객체
     */
    public Mono<KakaoBookSearchResponseDTO> searchBooks(String query) {
        log.info("카카오 책 검색 API 호출: query={}", query);
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.queryParam("query", query).build())
                .retrieve()
                .bodyToMono(KakaoBookSearchResponseDTO.class);
    }
}
