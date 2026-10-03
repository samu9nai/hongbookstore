package com.hongik.books.domain.place.controller;

import com.hongik.books.domain.place.dto.PlaceDto;
import com.hongik.books.domain.place.service.PlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;

    // 🔍 네이버 장소 검색 (홍대 거리순 재정렬된 JSON 반환)
    @GetMapping(value = "/search", produces = "application/json")
    public ResponseEntity<String> searchPlaces(@RequestParam String query) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().body("{\"items\":[]}");
        }
        String resultJson = placeService.searchPlaces(query);
        return ResponseEntity
                .ok()
                .header("Content-Type", "application/json; charset=UTF-8")
                .body(resultJson);
    }


    // 📦 DB에서 저장된 장소 전부 조회
    @GetMapping
    public ResponseEntity<List<PlaceDto.Response>> getAllPlaces() {
        return ResponseEntity.ok(placeService.getAllPlaces());
    }

    // ➕ 새로운 장소 DB 저장
    @PostMapping
    public ResponseEntity<PlaceDto.Response> savePlace(@RequestBody PlaceDto.SaveRequest request) {
        PlaceDto.Response saved = placeService.savePlace(request);
        return ResponseEntity.ok(saved);
    }

    // 🗺️ 좌표를 도로명 주소로 변환
    @GetMapping("/geocode")
    public ResponseEntity<Map<String, String>> getAddressFromCoordinates(
            @RequestParam double lat,
            @RequestParam double lng) {
        Map<String, String> addressData = placeService.getAddressFromCoordinates(lat, lng);
        return ResponseEntity.ok(addressData);
    }

    // 🧭 주소 → 좌표 (Forward Geocoding)
    @GetMapping("/geocode/forward")
    public ResponseEntity<Map<String, Object>> forwardGeocode(@RequestParam("query") String query) {
        return ResponseEntity.ok(placeService.forwardGeocode(query));
    }
}
