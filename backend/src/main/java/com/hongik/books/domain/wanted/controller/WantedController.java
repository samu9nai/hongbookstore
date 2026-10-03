package com.hongik.books.domain.wanted.controller;

import com.hongik.books.domain.wanted.dto.*;
import com.hongik.books.domain.wanted.service.WantedService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wanted")
@RequiredArgsConstructor
public class WantedController {

    private final WantedService wantedService;

    /** 목록 조회 + 필터/정렬 */
    @GetMapping
    public Page<WantedSummaryResponseDTO> list(
            @RequestParam(required = false) String category,     // 전공|교양
            @RequestParam(required = false) String department,   // 전공일 때만
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "latest") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size
    ) {
        return wantedService.search(category, department, keyword, page, size, sort);
    }

    /** 상세 조회 */
    @GetMapping("/{id}")
    public WantedDetailResponseDTO detail(@PathVariable Long id) {
        return wantedService.getDetail(id);
    }

    /** 생성 (예시는 임시로 헤더에서 userId 수신) */
    @PostMapping
    public ResponseEntity<Long> create(
            @RequestHeader("X-User-Id") Long userId,  // 프로젝트 인증 방식에 맞게 교체 가능
            @RequestBody @Valid WantedCreateRequestDTO dto
    ) {
        Long id = wantedService.create(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @RequestBody @Valid WantedUpdateRequestDTO dto
    ) {
        wantedService.update(userId, id, dto);
        return ResponseEntity.noContent().build();
    }

    /** 삭제 */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id
    ) {
        wantedService.delete(userId, id);
    }
}
