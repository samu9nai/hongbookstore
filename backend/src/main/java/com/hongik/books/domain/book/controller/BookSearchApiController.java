package com.hongik.books.domain.book.controller;

import com.hongik.books.domain.book.dto.KakaoBookSearchResponseDTO;
import com.hongik.books.domain.book.service.BookSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * 책 검색 API 요청을 처리하는 컨트롤러
 */
@RestController
@RequestMapping("/api/search/books")
@RequiredArgsConstructor
public class BookSearchApiController {
    private final BookSearchService bookSearchService;

    /**
     * 외부 API를 통해 책을 검색하는 API
     * [GET] /api/search/books?query=자바
     */
    @GetMapping
    public Mono<ResponseEntity<KakaoBookSearchResponseDTO>> searchBooks(@RequestParam String query) {
        return bookSearchService.searchBooksByExternalApi(query)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
