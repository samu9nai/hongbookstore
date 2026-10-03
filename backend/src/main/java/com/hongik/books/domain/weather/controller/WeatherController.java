package com.hongik.books.domain.weather.controller;

import com.hongik.books.domain.weather.dto.WeeklyWeatherResponse;
import com.hongik.books.domain.weather.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/weather")
public class WeatherController {
    private final WeatherService weatherService;

    // 예: /api/weather/weekly?lat=37.5665&lng=126.9780&sido=서울
    @GetMapping("/weekly")
    public WeeklyWeatherResponse weekly(@RequestParam double lat,
                                        @RequestParam double lng,
                                        @RequestParam(required = false) String sido) {
        return weatherService.getWeeklyByLatLng(lat, lng, sido);
    }
}