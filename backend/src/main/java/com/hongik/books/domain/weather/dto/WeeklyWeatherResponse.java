package com.hongik.books.domain.weather.dto;

import lombok.*;
import java.util.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WeeklyWeatherResponse {
    private String baseTimeShort;
    private String baseTimeMid;
    private List<DailyPopDto> days;
    private String recommendation;
}