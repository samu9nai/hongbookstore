package com.hongik.books.domain.weather.util;

import java.util.Map;

public class MidLandRegion {
    public static final Map<String,String> SIDO_TO_REGID = Map.ofEntries(
            Map.entry("서울","11B00000"), Map.entry("인천","11B00000"), Map.entry("경기","11B00000"),
            Map.entry("강원영서","11D10000"), Map.entry("강원영동","11D20000"),
            Map.entry("충북","11C10000"), Map.entry("대전","11C20000"), Map.entry("세종","11C20000"), Map.entry("충남","11C20000"),
            Map.entry("전북","11F10000"), Map.entry("광주","11F20000"), Map.entry("전남","11F20000"),
            Map.entry("대구","11H10000"), Map.entry("경북","11H10000"),
            Map.entry("부산","11H20000"), Map.entry("울산","11H20000"), Map.entry("경남","11H20000"),
            Map.entry("제주","11G00000")
    );

    public static String guessRegIdFromSido(String sido) {
        if (sido == null) return null;
        sido = sido.replace("특별시","").replace("광역시","").replace("특별자치시","").replace("특별자치도","").trim();
        if (sido.startsWith("강원")) return "11D10000"; // 기본 영서
        return SIDO_TO_REGID.getOrDefault(sido, null);
    }
}