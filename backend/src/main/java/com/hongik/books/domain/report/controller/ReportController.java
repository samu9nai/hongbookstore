// com/hongik/books/domain/report/controller/ReportController.java
package com.hongik.books.domain.report.controller;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.report.dto.ReportDtos;
import com.hongik.books.domain.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** ADMIN 전용: 신고 목록 조회 */
    @GetMapping
    public ResponseEntity<Page<ReportDtos.SimpleRes>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        int p = Math.max(0, page);
        int s = Math.min(Math.max(size, 1), 200);
        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(reportService.list(pageable));
    }

    /** 로그인 사용자: 신고 생성 */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody ReportDtos.CreateReq req) {
        LoginUserDTO loginUser = currentLoginUserOrNull();
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.create(req, loginUser));
    }

    /** SecurityContext에서 LoginUserDTO 추출 (필요 최소한) */
    private LoginUserDTO currentLoginUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof LoginUserDTO dto) return dto;
        try {
            Long id = null;
            try { id = (Long) principal.getClass().getMethod("getId").invoke(principal); } catch (NoSuchMethodException ignored) {}
            if (id == null) { try { id = (Long) principal.getClass().getMethod("id").invoke(principal); } catch (NoSuchMethodException ignored) {} }
            String email = null;
            try { email = (String) principal.getClass().getMethod("getEmail").invoke(principal); } catch (NoSuchMethodException ignored) {}
            if (id != null) return new LoginUserDTO(id, email);
        } catch (Exception ignored) {}
        return null;
    }
}
