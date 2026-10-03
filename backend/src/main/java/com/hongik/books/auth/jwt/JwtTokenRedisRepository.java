package com.hongik.books.auth.jwt;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class JwtTokenRedisRepository {
    private final StringRedisTemplate redisTemplate;

    /**
     * Redis에 데이터를 저장 (주로 블랙리스트 토큰 저장용)
     *
     * @param key Redis 키 (JWT 토큰)
     * @param value 저장할 값 (ex: "logout", "used")
     * @param expirationMillis 유효 시간 (밀리초)
     */
    public void set(String key, String value, long expirationMillis) {
        redisTemplate.opsForValue().set(key, value, expirationMillis, TimeUnit.MILLISECONDS);
    }

    /**
     * 주어진 키(JWT 토큰)가 Redis에 존재하는지 확인
     *
     * @param key 확인할 키 (JWT 토큰)
     * @return 존재 여부 (true/false)
     */
    public boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }
}
