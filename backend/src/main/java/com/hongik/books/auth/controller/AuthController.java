package com.hongik.books.auth.controller;

import com.hongik.books.common.dto.ApiResponse;
import com.hongik.books.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    /**
     * 로그아웃을 처리
     * @param authorizationHeader "Authorization" 헤더 (Bearer 토큰 포함)
     * @return 성공 응답
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        // "Bearer " 접두사 제거하여 순수 액세스 토큰 추출
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "잘못된 토큰 형식입니다.", null));
        }
        String accessToken = authorizationHeader.substring(7);

        // AuthService의 logout 메서드 호출 (Redis에 토큰을 블랙리스트로 등록)
        authService.logout(accessToken);

        // 성공 응답 반환
        ApiResponse<Void> response = new ApiResponse<>(true, "성공적으로 로그아웃되었습니다.", null);
        return ResponseEntity.ok(response);
    }
}
