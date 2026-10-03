package com.hongik.books.domain.weather.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.*;

public final class KmaMidUrlParser {
    private KmaMidUrlParser() {}
    private static final Pattern TOKEN = Pattern.compile("\"([^\"]*)\"|(\\S+)");
    private static final DateTimeFormatter YMDH = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
    private static final DateTimeFormatter YMD  = DateTimeFormatter.ofPattern("yyyyMMdd");

    /** 표 문자열에서 특정 regId만 골라 날짜별 [am, pm] 강수확률을 만든다. am=00:00, pm=12:00 */
    public static Map<LocalDate, int[]> parseAmPmByDate(String tableText, String regId) {
        Map<LocalDate, int[]> map = new HashMap<>();
        if (tableText == null) return map;

        String[] lines = tableText.split("\\R");
        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty() || line.startsWith("#")) continue;

            // 토큰화 (공백 분리 + 따옴표 유지)
            Matcher m = TOKEN.matcher(line);
            List<String> t = new ArrayList<>();
            while (m.find()) t.add(m.group(1) != null ? m.group(1) : m.group(2));
            if (t.size() < 11) continue;

            // 컬럼: REG_ID, TM_FC, TM_EF, MOD, STN, C, SKY, PRE, CONF, WF, RN_ST
            String reg = t.get(0);
            if (!reg.equals(regId)) continue;

            String tmEf = t.get(2);   // yyyyMMddHHmm
            String rn   = t.get(10);  // 강수확률
            if (tmEf.length() != 12) continue;

            LocalDate date = LocalDate.parse(tmEf.substring(0, 8), YMD);
            String hhmm = tmEf.substring(8); // 0000 or 1200
            int rnSt;
            try { rnSt = Integer.parseInt(rn); } catch (Exception e) { continue; }

            int[] ampm = map.computeIfAbsent(date, d -> new int[]{-1, -1});
            if ("0000".equals(hhmm))      ampm[0] = rnSt;   // AM
            else if ("1200".equals(hhmm)) ampm[1] = rnSt;   // PM
        }
        return map;
    }
}
