package com.hongik.books.domain.book.controller;

import com.hongik.books.domain.book.dto.CategoryCreateRequestDTO;
import com.hongik.books.domain.book.dto.CategoryResponseDTO;
import com.hongik.books.domain.book.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * 카테고리 관련 API 요청을 처리하는 컨트롤러
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    /**
     * 새 카테고리를 생성하는 API
     * [POST] /api/categories
     * 참고: 실제 서비스에서는 관리자(ADMIN) 권한이 있는 사용자만 호출할 수 있도록 Spring Security로 제어해야 합니다.
     */
    @PostMapping
    public ResponseEntity<Void> createCategory(@RequestBody CategoryCreateRequestDTO request) {
        Long categoryId = categoryService.createCategory(request);
        // 생성된 리소스의 URI를 Location 헤더에 담아 201 Created 응답 반환
        return ResponseEntity.created(URI.create("/api/categories/" + categoryId)).build();
    }

    /**
     * 전체 카테고리를 계층 구조로 조회하는 API
     * [GET] /api/categories
     */
    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getCategoryTree() {
        List<CategoryResponseDTO> categoryTree = categoryService.getCategoryTree();
        return ResponseEntity.ok(categoryTree);
    }
}
