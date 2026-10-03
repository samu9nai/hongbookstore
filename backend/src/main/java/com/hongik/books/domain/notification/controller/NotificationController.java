package com.hongik.books.domain.notification.controller;

import com.hongik.books.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * NOTE:
 * - EventSource는 Authorization 헤더를 못 붙입니다.
 * - 우선은 토큰 서명검증 없이 payload만 디코딩해서 userId를 얻어 구독시킵니다.
 * - 운영 전에는 JwtTokenProvider로 검증하도록 리팩토링 권장(같은 엔드포인트로 교체 가능).
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam(value = "token", required = false) String token,
                             HttpServletRequest request) {
        Long userId = extractUserIdFromJwtWithoutVerify(token);
        if (userId == null) {
            // 401로 명확히 내려서 프론트 재연결 루프가 불필요하게 500을 반복하지 않게 함
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or missing token");
        }
        log.debug("[SSE] subscribe userId={}", userId);
        return notificationService.subscribe(userId);
    }

    /**
     * JWT 서명 검증 없이 payload 부분만 디코딩해서 userId를 추출합니다.
     * 우선순위: "userId" -> "id" -> "sub"
     */
    @SuppressWarnings("unchecked")
    private Long extractUserIdFromJwtWithoutVerify(String token) {
        try {
            if (token == null || token.isBlank()) return null;
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);

            // 아주 가벼운 파서: jackson 없이도 동작하도록 Map 파싱은 생략하고 직접 찾기
            // 다만 유지보수 편의 위해 간단한 방식으로 키 값을 뽑습니다.
            // 가능하면 프로젝트의 ObjectMapper를 써도 됩니다.
            Map<String, Object> claims = SimpleJson.minParse(payloadJson);

            Object v = claims.get("userId");
            if (v == null) v = claims.get("id");
            if (v == null) v = claims.get("sub");
            if (v == null) return null;

            String s = String.valueOf(v);
            // "123" 또는 "email"일 수 있음. 숫자만 허용(우리 알림은 userId(Long) 기준)
            if (!s.matches("^\\d+$")) {
                return null; // 숫자 id가 아니면 구독 불가(보안상 안전)
            }
            return Long.parseLong(s);
        } catch (Exception e) {
            log.warn("[SSE] JWT payload parse failed: {}", e.toString());
            return null;
        }
    }

    /**
     * 외부 의존 없이 아주 얕게 JSON을 Map으로 파싱하는 유틸(따옴표/쉼표 기준 단순 파싱).
     * 복잡한 JWT 클레임 구조가 아니라면 충분합니다.
     * 유지보수 시 ObjectMapper로 교체 가능.
     */
    static class SimpleJson {
        static Map<String, Object> minParse(String json) {
            // 중괄호 제거
            String s = json.trim();
            if (s.startsWith("{")) s = s.substring(1);
            if (s.endsWith("}")) s = s.substring(0, s.length() - 1);

            java.util.Map<String, Object> map = new java.util.HashMap<>();
            // 아주 단순한 split: json 내부에 중첩이 없다는 가정(일반적인 JWT 클레임은 평탄)
            for (String pair : s.split(",")) {
                String[] kv = pair.split(":", 2);
                if (kv.length != 2) continue;
                String k = stripQuotes(kv[0].trim());
                String vraw = kv[1].trim();
                Object v;
                if (vraw.startsWith("\"") && vraw.endsWith("\"")) {
                    v = stripQuotes(vraw);
                } else if (vraw.matches("^-?\\d+$")) {
                    v = Long.parseLong(vraw);
                } else if ("true".equalsIgnoreCase(vraw) || "false".equalsIgnoreCase(vraw)) {
                    v = Boolean.parseBoolean(vraw);
                } else {
                    // 기타 값은 문자열로 처리
                    v = vraw;
                }
                map.put(k, v);
            }
            return map;
        }

        private static String stripQuotes(String s) {
            if (s.startsWith("\"") && s.endsWith("\"") && s.length() >= 2) {
                return s.substring(1, s.length() - 1);
            }
            return s;
        }
    }
}
