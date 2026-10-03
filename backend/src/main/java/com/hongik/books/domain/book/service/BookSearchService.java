package com.hongik.books.domain.book.service;

import com.hongik.books.domain.book.client.KakaoBookApiClient;
import com.hongik.books.domain.book.dto.KakaoBookSearchResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * 책 검색 관련 비즈니스 로직을 처리하는 서비스
 */
@Service
@RequiredArgsConstructor
public class BookSearchService {
    private final KakaoBookApiClient kakaoBookApiClient;

    public Mono<KakaoBookSearchResponseDTO> searchBooksByExternalApi(String query) {
        return kakaoBookApiClient.searchBooks(query);
    }
}
