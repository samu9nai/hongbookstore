package com.hongik.books.domain.weather.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyPopDto {
    private String date;     // YYYY-MM-DD
    private Integer popAm;   // 중기 오전 POP(%) - null 가능
    private Integer popPm;   // 중기 오후 POP(%) - null 가능
    private Integer popAvg;  // 일 평균(단기: 시간별 평균 / 중기: (am+pm)/2)
    private boolean best;    // 추천일 표시
}