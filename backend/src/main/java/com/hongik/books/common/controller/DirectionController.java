package com.hongik.books.common.controller;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * NAVER Directions 15 (자동차 길찾기) 프록시
 * - 프론트에 키 노출 방지
 * - 호출 예: GET /api/directions/driving?start=127.1058342,37.359708&goal=129.075986,35.179470&option=traoptimal
 */
@Slf4j
@RestController
@RequestMapping("/api/directions")
@RequiredArgsConstructor
public class DirectionController {

    private final RestTemplate restTemplate;

    @Value("${naver.api.client-id}")
    private String clientId;

    @Value("${naver.api.client-secret}")
    private String clientSecret;

    private static final String NAVER_DRIVING_V15 = "https://maps.apigw.ntruss.com/map-direction-15/v1/driving";

    @PostConstruct
    public void checkKeys() {
        // 값 출력 금지
        // 필요하면 디버그 레벨에서 마스킹만
        if (log.isDebugEnabled()) {
            log.debug("Naver keys loaded. clientId(masked)={}, clientSecret(masked)={}",
                    mask(clientId), mask(clientSecret));
        }
    }
    private String mask(String v) {
        if (v == null) return "null";
        int n = v.length();
        if (n <= 4) return "*".repeat(n);
        return v.substring(0, 2) + "*".repeat(n - 4) + v.substring(n - 2);
    }

    @GetMapping("/driving")
    public ResponseEntity<String> driving(
            @RequestParam String start,
            @RequestParam String goal,
            @RequestParam(required = false, defaultValue = "traoptimal") String option
    ) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(NAVER_DRIVING_V15)
                .queryParam("start", start)
                .queryParam("goal", goal)
                .queryParam("option", option);

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-NCP-APIGW-API-KEY-ID", clientId);
        headers.set("X-NCP-APIGW-API-KEY", clientSecret);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> res = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            return ResponseEntity.status(res.getStatusCode()).body(res.getBody());
        } catch (HttpClientErrorException e) {
            // 네이버에서 온 에러 바디 그대로 넘겨서 프론트에서 디버깅 가능
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        }
    }

}
