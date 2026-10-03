package com.hongik.books.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * application.yml의 kakao.api.book 설정을 객체로 바인딩하기 위한 클래스
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "kakao.api.book")
public class KakaoApiProperties {
    private String url;
    private String restApiKey;
}
