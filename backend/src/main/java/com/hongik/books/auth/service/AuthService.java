package com.hongik.books.auth.service;

import com.hongik.books.auth.jwt.JwtTokenProvider;
import com.hongik.books.auth.jwt.JwtTokenRedisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtTokenRedisRepository jwtTokenRedisRepository;

    /**
     * 로그아웃 처리
     * 전달받은 액세스 토큰을 Redis 블랙리스트에 추가
     * @param accessToken 로그아웃할 사용자의 액세스 토큰
     */
    public void logout(String accessToken) {
        // 토큰 유효성 검증
        if (!jwtTokenProvider.validateToken(accessToken)) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }

        // 토큰의 남은 유효 시간을 계산
        long expiration = jwtTokenProvider.getExpiration(accessToken);
        // 만료된 토큰이면 블랙리스트에 넣을 필요가 없음
        if (expiration <= 0) {
            return;
        }

        // Redis에 블랙리스트로 등록 (남은 유효 시간만큼만 저장하여 메모리 관리)
        jwtTokenRedisRepository.set(accessToken, "logout", expiration);
    }
}
