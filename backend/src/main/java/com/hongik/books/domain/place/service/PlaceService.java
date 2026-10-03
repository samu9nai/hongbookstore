package com.hongik.books.domain.place.service;

import com.hongik.books.domain.place.domain.Place;
import com.hongik.books.domain.place.dto.PlaceDto;
import com.hongik.books.domain.place.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlaceService {

    // Naver Local Search (openapi.naver.com)
    @Value("${naver.place.api.key.id}")
    private String clientId;

    @Value("${naver.place.api.secret}")
    private String clientSecret;

    // Naver Map Geocode/Reverse Geocode (apigw.ntruss.com)
    @Value("${naver.api.client-id}")
    private String routeClientId;

    @Value("${naver.api.client-secret}")
    private String routeClientSecret;

    private final RestTemplate restTemplate;
    private final PlaceRepository placeRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 🧭 홍익대학교(정문 부근)
    private static final double HONGIK_LAT = 37.5513;
    private static final double HONGIK_LNG = 126.9246;

    /* =========================================================
     * 1) 네이버 장소 검색 5개 유지 + "홍대까지의 실제 거리"로 재정렬
     *    - 네이버 Local의 mapx/mapy는 TM 좌표라 그대로는 거리 계산 불가
     *    - 각 아이템의 주소(도로명/지번)를 "포워드 지오코딩" 해서 위경도를 얻은 뒤
     *      하버사인으로 홍대 거리 계산 → 가까운 순 정렬 → 5개 반환
     * ========================================================= */
    // 1) 네이버 장소 검색 5개 유지 + "홍대 바이어스 쿼리" 우선 + 실제 거리로 재정렬
    public String searchPlaces(String query) {
        // 0) 바이어스 쿼리들
        String q1 = (query == null ? "" : query.trim());
        String bias1 = q1.isBlank() ? "" : (q1 + " 홍대입구");
        String bias2 = q1.isBlank() ? "" : (q1 + " 마포구");

        // 1) 네이버 호출: 홍대입구 → 마포구 → 원쿼리 순서로 시도
        List<JsonNode> items = new ArrayList<>();
        if (!bias1.isBlank()) items = fetchNaverItems(bias1);
        if ((items == null || items.isEmpty()) && !bias2.isBlank()) items = fetchNaverItems(bias2);
        if (items == null || items.isEmpty()) items = fetchNaverItems(q1);
        if (items == null) items = List.of();

        // 2) 각 아이템의 실제 위/경도 계산(주소 기반 지오코딩) + 홍대 거리 붙이기
        List<ObjectNode> enriched = new ArrayList<>();
        for (JsonNode it : items) {
            ObjectNode obj = it.deepCopy();
            String road  = textOrEmpty(it.path("roadAddress"));
            String addr  = textOrEmpty(it.path("address"));
            String title = stripTags(textOrEmpty(it.path("title")));
            String geocodeQuery = !road.isBlank() ? road : (!addr.isBlank() ? addr : title);

            Double[] latlng = forwardGeocodeToLatLng(geocodeQuery);
            double distKm = (latlng != null)
                    ? haversine(HONGIK_LAT, HONGIK_LNG, latlng[0], latlng[1])
                    : Double.MAX_VALUE;

            obj.put("___hongik_distance_km", distKm);
            enriched.add(obj);
        }

        // 3) 거리순 정렬 → 상위 5개 제한
        enriched.sort(Comparator.comparingDouble(n -> n.path("___hongik_distance_km").asDouble(Double.MAX_VALUE)));
        List<ObjectNode> top5 = enriched.stream().limit(5).collect(Collectors.toList());

        // 4) JSON으로 반환 (items만 교체)
        ArrayNode newItems = objectMapper.createArrayNode();
        top5.forEach(newItems::add);

        ObjectNode out = objectMapper.createObjectNode();
        out.set("items", newItems);
        removeDebugField(newItems, "___hongik_distance_km"); // 클라이언트에 디버그필드 숨김
        return out.toString();
    }

    // 네이버 Local 검색 호출 → items 배열을 List<JsonNode>로 반환
    private List<JsonNode> fetchNaverItems(String q) {
        try {
            String apiUrl = "https://openapi.naver.com/v1/search/local.json";
            URI uri = UriComponentsBuilder.fromUriString(apiUrl)
                    .queryParam("query", q)
                    .queryParam("display", 5)  // 5개 유지
                    .queryParam("start", 1)
                    .queryParam("sort", "sim")
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Naver-Client-Id", clientId);
            headers.set("X-Naver-Client-Secret", clientSecret);
            headers.set("User-Agent", "Mozilla/5.0");
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            ResponseEntity<String> res = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class
            );

            String body = res.getBody();
            if (body == null || body.isBlank()) return List.of();

            JsonNode root = objectMapper.readTree(body);
            JsonNode itemsNode = root.path("items");
            if (!itemsNode.isArray()) return List.of();

            List<JsonNode> items = new ArrayList<>();
            itemsNode.forEach(items::add);
            return items;
        } catch (Exception e) {
            return List.of();
        }
    }

    // ===== DB API 유지 =====

    @Transactional(readOnly = true)
    public List<PlaceDto.Response> getAllPlaces() {
        return placeRepository.findAll().stream()
                .map(PlaceDto.Response::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public PlaceDto.Response savePlace(PlaceDto.SaveRequest request) {
        Place place = placeRepository.save(Place.builder()
                .name(request.getName())
                .category(request.getCategory())
                .address(request.getAddress())
                .description(request.getDescription())
                .lat(request.getLat())
                .lng(request.getLng())
                .build());
        return new PlaceDto.Response(place);
    }

    // ===== 역/정방향 지오코딩 =====

    // 좌표 -> 주소
    public Map<String, String> getAddressFromCoordinates(double lat, double lng) {
        String coords = lng + "," + lat; // "경도,위도"
        String apiUrl = "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc";

        URI uri = UriComponentsBuilder.fromUriString(apiUrl)
                .queryParam("coords", coords)
                .queryParam("sourcecrs", "epsg:4326")
                .queryParam("targetcrs", "epsg:4326")
                .queryParam("orders", "roadaddr")
                .queryParam("output", "json")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-NCP-APIGW-API-KEY-ID", routeClientId);
        headers.set("X-NCP-APIGW-API-KEY", routeClientSecret);
        headers.set("Content-Type", "application/json");

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class
            );

            String responseBody = response.getBody();
            Map<String, String> out = new HashMap<>();
            if (responseBody != null && responseBody.contains("\"status\":{\"code\":0")) {
                if (responseBody.contains("\"roadAddress\":")) {
                    out.put("address", extractJsonValue(responseBody, "roadAddress"));
                } else if (responseBody.contains("\"jibunAddress\":")) {
                    out.put("address", extractJsonValue(responseBody, "jibunAddress"));
                }
                if (responseBody.contains("\"buildingName\":")) {
                    out.put("detailedAddress", extractJsonValue(responseBody, "buildingName"));
                }
                return out;
            }
            out.put("address", String.format("위도: %.6f, 경도: %.6f", lat, lng));
            return out;
        } catch (Exception e) {
            Map<String, String> fallback = new HashMap<>();
            fallback.put("address", String.format("위도: %.6f, 경도: %.6f", lat, lng));
            return fallback;
        }
    }

    // 주소 -> 위경도 (성공 시 [lat, lng] 반환, 실패 시 null)
    private Double[] forwardGeocodeToLatLng(String query) {
        if (query == null || query.isBlank()) return null;

        String apiUrl = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode";
        URI uri = UriComponentsBuilder.fromUriString(apiUrl)
                .queryParam("query", query)
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-NCP-APIGW-API-KEY-ID", routeClientId);
        headers.set("X-NCP-APIGW-API-KEY", routeClientSecret);
        headers.set("Content-Type", "application/json");

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class
            );
            String body = response.getBody();
            if (body == null || body.isBlank()) return null;

            JsonNode root = objectMapper.readTree(body);
            JsonNode arr = root.path("addresses");
            if (arr.isArray() && arr.size() > 0) {
                JsonNode a = arr.get(0);
                String x = textOrNull(a.path("x")); // 경도
                String y = textOrNull(a.path("y")); // 위도
                if (x != null && y != null) {
                    return new Double[]{Double.parseDouble(y), Double.parseDouble(x)};
                }
            }
        } catch (Exception ignore) {}
        return null;
    }

    // ===== 헬퍼 =====
    private String textOrEmpty(JsonNode n) { return (n == null || n.isNull()) ? "" : n.asText(); }
    private String textOrNull(JsonNode n)  { return (n == null || n.isNull()) ? null : n.asText(); }

    private String stripTags(String s) {
        return (s == null) ? "" : s.replaceAll("<[^>]*>?", "");
    }

    private void removeDebugField(ArrayNode arr, String field) {
        for (JsonNode n : arr) {
            if (n.isObject()) ((ObjectNode) n).remove(field);
        }
    }

    private String extractJsonValue(String json, String fieldName) {
        String pattern = "\"" + fieldName + "\":\"";
        int startIndex = json.indexOf(pattern);
        if (startIndex == -1) return "";
        startIndex += pattern.length();
        int endIndex = json.indexOf("\"", startIndex);
        if (endIndex == -1) return "";
        return json.substring(startIndex, endIndex);
    }

    // 하버사인 거리(km)
    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0088; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // 주소(쿼리) -> 위경도/주소 정보 (기존 시그니처 유지)
    public Map<String, Object> forwardGeocode(String query) {
        String apiUrl = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode";

        URI uri = UriComponentsBuilder.fromUriString(apiUrl)
                .queryParam("query", query)
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-NCP-APIGW-API-KEY-ID", routeClientId);
        headers.set("X-NCP-APIGW-API-KEY", routeClientSecret);
        headers.set("Content-Type", "application/json");

        Map<String, Object> result = new HashMap<>();
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class
            );

            String body = response.getBody();
            if (body != null && !body.isBlank()) {
                JsonNode root = objectMapper.readTree(body);
                JsonNode arr = root.path("addresses");
                if (arr.isArray() && arr.size() > 0) {
                    JsonNode a = arr.get(0);
                    String x = a.path("x").asText(null); // 경도
                    String y = a.path("y").asText(null); // 위도
                    String roadAddr = a.path("roadAddress").asText("");
                    String jibunAddr = a.path("jibunAddress").asText("");
                    if (x != null && y != null) {
                        result.put("lng", Double.parseDouble(x));
                        result.put("lat", Double.parseDouble(y));
                    }
                    result.put("address", !roadAddr.isEmpty() ? roadAddr : jibunAddr);
                    return result;
                }
            }
            // 무결과/실패 폴백
            result.put("address", query);
            return result;
        } catch (Exception e) {
            // 실패 시에도 기존 시그니처 유지
            result.put("address", query);
            return result;
        }
    }

}
