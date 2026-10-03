package com.hongik.books.auth.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;


/**
 * JWT 토큰 생성 및 검증을 담당하는 컴포넌트
 * - HS256 대칭키로 JWT 발급
 * - 토큰 유효성 검증 및 사용자 정보 추출
 */
@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey secretKey;

    @Value("${jwt.token-validity-in-seconds}")
    private long accessTokenValiditySeconds;

    @Value("${jwt.refresh-token-validity-in-seconds}")
    private long refreshTokenValiditySeconds;

    // 생성자에서 비밀키 초기화 - 의존성 주입
    public JwtTokenProvider(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

    }

    /**
     * Authentication 객체 대신 사용자의 고유 ID(PK)를 직접 받아서 토큰을 생성
     * 이 메서드는 OAuth2 로그인 성공 핸들러(OAuth2LoginSuccessHandler)에서 호출
     */
    // Access JWT 토큰을 생성
    public String createAccessToken(Long userId) {
        return generateToken(userId.toString(), accessTokenValiditySeconds * 1000L);
    }

    // Refresh JWT 토큰을 생성
    public String createRefreshToken(Long userId) {
        return generateToken(userId.toString(), refreshTokenValiditySeconds * 1000L);
    }

    // JWT 토큰의 유효성 검사
    // 유효한 토큰일 경우 true, 그렇지 않으면 false 리턴
    public boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.debug("토큰 검증 실패: {}", e.getMessage());
            return false;
        }
    }

    // 토큰에서 사용자 ID(PK)를 추출
    public Long getUserIdFromToken(String token) {
        String subject = getSubjectFromToken(token);
        try {
            return Long.parseLong(subject);
        } catch (NumberFormatException e) {
            log.error("토큰의 subject를 Long 타입으로 변환할 수 없습니다: {}", subject);
            throw new IllegalArgumentException("유효하지 않은 토큰의 subject 입니다.", e);
        }
    }

    // 토큰의 'subject' 클레임을 문자열 그대로 반환
    public String getSubjectFromToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("토큰이 null이거나 비어 있습니다.");
        }

        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (Exception e) {
            log.error("토큰에서 subject 추출 실패: {}", e.getMessage());
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.", e);
        }
    }

    // 토큰 만료 시간 계산 (로그아웃 시 Redis에 TTL 설정할 때 필요)
    public long getExpiration(String token) {
        Date expirationDate = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
        long now = new Date().getTime();
        return expirationDate.getTime() - now;
    }

    // 요청 헤더에서 JWT 토큰을 추출
    public String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7).trim(); // Bearer 토큰을 제외한 JWT 토큰 리턴
        }
        return null;
    }

    // JWT 토큰 생성
    private String generateToken(String subject, long validityMilliseconds) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityMilliseconds);

        return Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(validity)
                .signWith(this.secretKey)
                .compact();
    }
}