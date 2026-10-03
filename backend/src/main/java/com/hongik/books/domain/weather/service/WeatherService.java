package com.hongik.books.domain.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hongik.books.domain.weather.dto.DailyPopDto;
import com.hongik.books.domain.weather.dto.WeeklyWeatherResponse;
import com.hongik.books.domain.weather.kma.KmaClient;
import com.hongik.books.domain.weather.util.KmaGridConverter;
import com.hongik.books.domain.weather.util.KmaMidUrlParser;
import com.hongik.books.domain.weather.util.MidLandRegion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeatherService {
    private final KmaClient kma;

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter YMD  = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public WeeklyWeatherResponse getWeeklyByLatLng(double lat, double lng, String sido) {
        LocalDateTime now = LocalDateTime.now(KST);

        // 1) 좌표 → 격자
        KmaGridConverter.Grid g = KmaGridConverter.toGrid(lat, lng);

        // 2) 단기예보 POP (오늘~+2일)
        BaseDateTime shortBase = nearestVilageBase(now);
        JsonNode shortJ = null;
        try {
            // KmaClient 시그니처: (nx, ny, baseDate(LocalDate), baseTime(String))
            shortJ = kma.getVilageFcstPOP(g.nx, g.ny, shortBase.date, shortBase.time);
        } catch (Exception ignore) {}
        String baseShort = extractShortBase(shortJ);

        // 시간별 POP → 날짜별 평균
        Map<String, List<Integer>> popByDate = new HashMap<>();
        if (shortJ != null) {
            JsonNode items = shortJ.at("/response/body/items/item");
            if (items.isArray()) {
                for (JsonNode it : items) {
                    if (!"POP".equals(it.path("category").asText(""))) continue;
                    String fcstDate = it.path("fcstDate").asText();
                    int pop = it.path("fcstValue").asInt(0);
                    popByDate.computeIfAbsent(fcstDate, k -> new ArrayList<>()).add(pop);
                }
            }
        }
        Map<String, Integer> dailyAvg = new HashMap<>();
        for (var e : popByDate.entrySet()) {
            int avg = (int)Math.round(e.getValue().stream().mapToInt(i -> i).average().orElse(0));
            dailyAvg.put(e.getKey(), avg);
        }

        // 3) 중기예보 POP (D+3 ~ D+7) – URL(전문) 테이블 파싱
        String regId = MidLandRegion.guessRegIdFromSido(sido);
        String baseMid = null; // URL 전문에는 명시적 base가 없어 우리가 사용한 tmFc를 기록
        Map<LocalDate, int[]> midByDate = new HashMap<>();
        if (regId != null && !regId.isBlank()) {
            String tmFc = midTmFc(now); // yyyyMMddHHmm (06:00/18:00 중 최근)
            try {
                String table = kma.getMidLandTable(tmFc);
                midByDate = KmaMidUrlParser.parseAmPmByDate(table, regId);
                baseMid = tmFc;
            } catch (Exception ignore) {}
        }

        // 4) 0~7일 조립
        List<DailyPopDto> days = new ArrayList<>();
        for (int d = 0; d <= 7; d++) {
            LocalDate date = now.toLocalDate().plusDays(d);
            String key = DATE.format(date);

            Integer avg = (d <= 2) ? dailyAvg.getOrDefault(key, null) : null; // 단기 평균
            Integer am = null, pm = null;

            if (d >= 3) {
                int[] arr = midByDate.get(date);
                if (arr != null) {
                    if (arr[0] >= 0) am = arr[0];
                    if (arr[1] >= 0) pm = arr[1];
                    if (avg == null && am != null && pm != null) avg = Math.round((am + pm) / 2f);
                    if (avg == null && am != null) avg = am;
                    if (avg == null && pm != null) avg = pm;
                }
            }

            days.add(DailyPopDto.builder()
                    .date(YMD.format(date))
                    .popAm(am)
                    .popPm(pm)
                    .popAvg(avg)
                    .best(false)
                    .build());
        }

        // 5) 추천일(강수확률 최저)
        OptionalInt min = days.stream()
                .filter(d -> d.getPopAvg() != null)
                .mapToInt(DailyPopDto::getPopAvg)
                .min();

        String rec = "추천일 계산 불가 (데이터 부족)";
        if (min.isPresent()) {
            int best = min.getAsInt();
            List<DailyPopDto> bestDays = days.stream()
                    .filter(d -> Objects.equals(d.getPopAvg(), best))
                    .collect(Collectors.toList());
            bestDays.forEach(d -> d.setBest(true));

            LocalDate ld = LocalDate.parse(bestDays.get(0).getDate());
            String[] dows = {"일", "월", "화", "수", "목", "금", "토"};
            String dow = dows[ld.getDayOfWeek().getValue() % 7] + "요일";
            rec = String.format("가장 좋은 날: %d/%d(%s), 강수확률 %d%%",
                    ld.getMonthValue(), ld.getDayOfMonth(), dow, best);
        }

        return WeeklyWeatherResponse.builder()
                .baseTimeShort(baseShort)  // 예: 202508150800
                .baseTimeMid(baseMid)      // 예: 202508150600 / 202508151800
                .days(days)
                .recommendation(rec)
                .build();
    }

    // === 헬퍼들 ===

    private String extractShortBase(JsonNode j) {
        try {
            if (j == null) return null;
            if (!"00".equals(j.path("response").path("header").path("resultCode").asText())) return null;
            JsonNode items = j.at("/response/body/items/item");
            if (items.isArray() && items.size() > 0) {
                String bd = items.get(0).path("baseDate").asText();
                String bt = items.get(0).path("baseTime").asText();
                if (!bd.isEmpty() && !bt.isEmpty()) return bd + bt; // yyyyMMdd + HHmm
            }
        } catch (Exception ignore) {}
        return null;
    }

    /** 단기예보 발표 기준시각: 02,05,08,11,14,17,20,23시 */
    private BaseDateTime nearestVilageBase(LocalDateTime now) {
        String[] slots = {"0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"};
        String hhmmNow = String.format("%02d%02d", now.getHour(), now.getMinute());
        for (int i = slots.length - 1; i >= 0; i--) {
            if (hhmmNow.compareTo(slots[i]) >= 0) {
                return new BaseDateTime(now.toLocalDate(), slots[i]);
            }
        }
        return new BaseDateTime(now.toLocalDate().minusDays(1), "2300");
    }

    /** 중기예보 발표시각: 06:00 / 18:00 중 최근 */
    private String midTmFc(LocalDateTime now) {
        LocalDate date = now.toLocalDate();
        int h = now.getHour();
        if (h >= 18) return DATE.format(date) + "1800";
        if (h >= 6)  return DATE.format(date) + "0600";
        LocalDate prev = date.minusDays(1);
        return DATE.format(prev) + "1800";
    }

    // 보조 타입
    private static class BaseDateTime {
        final LocalDate date;
        final String time; // HHmm
        BaseDateTime(LocalDate date, String time) {
            this.date = date;
            this.time = time;
        }
    }
}
