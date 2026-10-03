package com.hongik.books.domain.report.domain;

import java.util.Locale;

public enum ReportReason {
    ABUSE("욕설/비방"),
    FRAUD("사기/허위매물"),
    SPAM("스팸/광고"),
    OTHER("기타");

    private final String label;
    ReportReason(String label) { this.label = label; }

    /** Kotlin/Java 명명 규칙과 호환: 기존 호출부 대비 */
    public String getLabel() { return label; }
    /** 과거 코드 호환용 */
    public String label() { return label; }

    /** 클라이언트에서 보낸 문자열을 한글 라벨 또는 enum 이름으로 안전 파싱 */
    public static ReportReason from(String raw) {
        if (raw == null) return null;
        final String s = raw.trim();
        // 1) 한글 라벨 매칭
        for (ReportReason r : values()) {
            if (r.label.equalsIgnoreCase(s)) return r;
        }
        // 2) ENUM 이름 매칭(대소문자 무시)
        try {
            return valueOf(s.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
