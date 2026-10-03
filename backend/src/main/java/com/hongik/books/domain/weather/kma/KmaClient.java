package com.hongik.books.domain.weather.kma;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
@Slf4j
public class KmaClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper om = new ObjectMapper();

    @Value("${weather.kma.base-url}") private String baseUrl;
    @Value("${weather.kma.auth-key}") private String authKey;
    @Value("${weather.kma.path.vilage}") private String pathVilage;
    @Value("${weather.kma.path.midland-url}") private String pathMidlandUrl;

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    /** 단기예보(동네예보) JSON – POP 카테고리 포함 */
    public JsonNode getVilageFcstPOP(int nx, int ny, LocalDate baseDate, String baseTime) {
        String baseDateStr = baseDate.format(DATE);
        String url = UriComponentsBuilder
                .fromHttpUrl(baseUrl + pathVilage)
                .queryParam("authKey", authKey)
                .queryParam("dataType", "JSON")
                .queryParam("base_date", baseDateStr)
                .queryParam("base_time", baseTime)  // HHmm (예: 0800)
                .queryParam("nx", nx)
                .queryParam("ny", ny)
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", 1000)
                .toUriString();

        String body = restTemplate.getForObject(url, String.class);
        try {
            // API 허브는 JSON을 돌려줘야 정상. 혹시 XML이 오면 에러 원인 로깅
            if (body != null && body.trim().startsWith("<")) {
                log.error("KMA HUB returned XML for VilageFcst. body(head): {}", body.substring(0, Math.min(200, body.length())));
            }
            return om.readTree(body);
        } catch (Exception e) {
            log.error("Failed to parse VilageFcst JSON", e);
            return null;
        }
    }

    /** 중기예보 URL(전문) – 텍스트 표 그대로 */
    public String getMidLandTable(String tmFc) {
        String url = UriComponentsBuilder
                .fromHttpUrl(baseUrl + pathMidlandUrl)
                .queryParam("authKey", authKey)
                .queryParam("tmFc", tmFc)  // yyyyMMddHHmm (06:00/18:00)
                .toUriString();

        String body = restTemplate.getForObject(url, String.class);
        if (body != null && !body.contains("#START") && !body.contains("#7777END")) {
            log.warn("Unexpected MidLand table response: {}", body.substring(0, Math.min(200, body.length())));
        }
        return body;
    }
}
