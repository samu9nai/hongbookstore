package com.hongik.books.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableRedisRepositories
public class RedisConfig {
    /**
     * JWT 같은 순수 문자열이면 더 라이트한 StringRedisTemplate 주입
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory cf) {
        StringRedisTemplate redisTemplate = new StringRedisTemplate(cf);
        redisTemplate.setConnectionFactory(cf);
        redisTemplate.setKeySerializer(new StringRedisSerializer());       // key 는 항상 String
        redisTemplate.setValueSerializer(new StringRedisSerializer());     // 토큰 → String
        return redisTemplate;
    }
}
