package com.hongik.books.common.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * 네이버 API 호출을 위한 프록시 컨트롤러
 */
@RestController
@RequestMapping("/api/naver")
@RequiredArgsConstructor
public class NaverApiController {
    
    private final RestTemplate restTemplate;
    
    @Value("${naver.map.client-id:n1y8pc9hl8}")
    private String clientId;
    
    @Value("${naver.map.client-secret:}")
    private String clientSecret;
    
    /**
     * 좌표를 주소로 변환하는 API
     * [GET] /api/naver/reverse-geocode
     */
    @GetMapping("/reverse-geocode")
    public ResponseEntity<String> reverseGeocode(
            @RequestParam("coords") String coords,
            @RequestParam(value = "sourcecrs", defaultValue = "epsg:4326") String sourcecrs,
            @RequestParam(value = "targetcrs", defaultValue = "epsg:4326") String targetcrs,
            @RequestParam(value = "orders", defaultValue = "roadaddr") String orders,
            @RequestParam(value = "output", defaultValue = "json") String output
    ) {
        try {
            String url = String.format(
                "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=%s&sourcecrs=%s&targetcrs=%s&orders=%s&output=%s",
                coords, sourcecrs, targetcrs, orders, output
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-NCP-APIGW-API-KEY-ID", clientId);
            headers.set("X-NCP-APIGW-API-KEY", clientSecret);
            headers.set("Content-Type", "application/json");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\": \"주소 변환 중 오류가 발생했습니다.\"}");
        }
    }
} 