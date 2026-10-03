package com.hongik.books.domain.post.support;

import java.util.HashMap;
import java.util.Map;

/**
 * 프런트가 어떤 언어(ja/en/zh/ko, 그리고 'department.' 같은 프리픽스 포함)로 보내더라도
 * DB 저장/검색 시에는 항상 한국어 학과명으로 정규화합니다.
 */
public final class DepartmentNormalizer {

    private static final Map<String, String> TO_KO = new HashMap<>();

    static {
        // ===== 주요 학과/전공 매핑 (ja/en/zh + prefix 포함) =====
        // 컴퓨터공학과
        map("컴퓨터공학과", "コンピュータ工学科", "Computer Science", "计算机工学科");
        // 산업데이터공학과
        map("산업데이터공학과", "産業データ工学科", "Industrial Data Engineering", "产业数据工学科");
        // 전자전기공학부
        map("전자전기공학부", "電子電気工学部", "Electronic & Electrical Engineering", "电子电气工学部");
        // 경영학부
        map("경영학부", "経営学部", "Business Administration", "经营学部");
        // 신소재공학전공
        map("신소재공학전공", "新素材工学科", "Advanced Materials Engineering", "新材料工学科");
        // 화학공학전공
        map("화학공학전공", "化学工学科", "Chemical Engineering", "化学工学科");
        // 기계시스템디자인공학과
        map("기계시스템디자인공학과", "機械システムデザイン工学科", "Mechanical System Design Engineering", "机械系统设计工学科");
        // 건설환경공학과
        map("건설환경공학과", "建設環境工学科", "Civil & Environmental Engineering", "建设环境工学科");

        // 건축/도시/실내
        map("건축학전공", "建築学専攻", "Architecture", "建筑学专攻");
        map("실내건축학전공", "インテリア建築学専攻", "Interior Architecture", "室内建筑学专攻");
        map("도시공학과", "都市工学科", "Urban Engineering", "城市工程学科");

        // 인문/사회/교양 계열 (필요 시 확장)
        map("법학부", "法学部", "School of Law", "法学部(中文)");
        map("동양학과", "東洋学科", "Oriental Studies", "东方学科");
        map("경제학전공", "経済学専攻", "Economics", "经济学专攻");
        map("영어영문학과", "英語英文学科", "English Language & Literature", "英语英文学科");
        map("독어독문학과", "独語独文学科", "German Language & Literature", "德语德文学科");
        map("불어불문학과", "仏語仏文学科", "French Language & Literature", "法语法文学科");
        map("국어국문학과", "国語国文学科", "Korean Language & Literature", "国语国文学科");

        // 사범대
        map("수학교육과", "数学教育科", "Mathematics Education", "数学教育科");
        map("국어교육과", "国語教育科", "Korean Language Education", "国语教育科");
        map("영어교육과", "英語教育科", "English Education", "英语教育科");
        map("역사교육과", "歴史教育科", "History Education", "历史教育科");
        map("교육학과", "教育学科", "Education", "教育学科");

        // 미술/디자인/예술
        map("회화과", "絵画科", "Painting", "绘画科");
        map("판화과", "版画科", "Printmaking", "版画科");
        map("조소과", "彫塑科", "Sculpture", "雕塑科");
        map("시각디자인전공", "視覚デザイン専攻", "Visual Design", "视觉设计专攻");
        map("산업디자인전공", "インダストリアルデザイン専攻", "Industrial Design", "工业设计专攻");
        map("금속조형디자인과", "金属造形デザイン科", "Metal Art & Design", "金属造型设计科");
        map("도예유리과", "陶芸ガラス科", "Ceramics & Glass", "陶艺玻璃科");
        map("목조형가구학과", "木造形家具学科", "Woodworking & Furniture", "木造型家具学科");
        map("섬유미술패션디자인과", "繊維美術ファッションデザイン科", "Textile Art & Fashion Design", "纤维美术时尚设计科");
        map("예술학과", "芸術学科", "Art Studies", "艺术学科");
        map("디자인경영전공", "デザイン経営専攻", "Design Management", "设计经营专攻");
        map("예술경영전공", "芸術経営専攻", "Arts Management", "艺术经营专攻");
        map("뮤지컬전공", "ミュージカル専攻", "Musical", "音乐剧专攻");
        map("실용음악전공", "実用音楽専攻", "Practical Music", "实用音乐专攻");

        // 교양 카테고리명(실제 department 저장값으로 쓰지는 않지만, prefix 제거용 안전장치)
        simple("ABEEK 교양");
        simple("인문계열"); simple("영어계열"); simple("사회계열");
        simple("제2외국어계열"); simple("자연계열"); simple("예체능계열"); simple("교직");
    }

    private DepartmentNormalizer() {}

    private static void simple(String ko) {
        TO_KO.put(ko, ko);
        TO_KO.put("department." + ko, ko);
        TO_KO.put("departments." + ko, ko);
    }

    private static void map(String ko, String ja, String en, String zh) {
        // ko
        TO_KO.put(ko, ko);
        TO_KO.put("department." + ko, ko);
        TO_KO.put("departments." + ko, ko);
        // ja / en / zh (원문 & prefix)
        if (ja != null) {
            TO_KO.put(ja, ko);
            TO_KO.put("department." + ja, ko);
            TO_KO.put("departments." + ja, ko);
        }
        if (en != null) {
            TO_KO.put(en, ko);
            TO_KO.put("department." + en, ko);
            TO_KO.put("departments." + en, ko);
        }
        if (zh != null) {
            TO_KO.put(zh, ko);
            TO_KO.put("department." + zh, ko);
            TO_KO.put("departments." + zh, ko);
        }
    }

    /**
     * 입력 문자열을 한국어 학과명으로 정규화한다.
     * - 'department.' / 'departments.' prefix 제거
     * - ja/en/zh → ko 매핑
     * - 이미 한글이면 그대로(다만 prefix는 제거)
     */
    public static String toKoreanOrNull(String value) {
        if (value == null || value.isBlank()) return null;
        String v = value.trim();

        // 바로 매핑 시도
        String mapped = TO_KO.get(v);
        if (mapped != null) return mapped;

        // prefix만 제거한 후 재시도
        if (v.startsWith("department.") || v.startsWith("departments.")) {
            String noPrefix = v.substring(v.indexOf('.') + 1);
            mapped = TO_KO.get(noPrefix);
            if (mapped != null) return mapped;
            // 한글이면 prefix만 제거된 값 반환
            if (hasHangul(noPrefix)) return noPrefix;
        }

        // 한글이면 원문 유지
        if (hasHangul(v)) return v;

        // 못 찾으면 일단 원문(서비스에서 최종 null 처리 여부 결정)
        return v;
    }

    private static boolean hasHangul(String s) {
        return s.codePoints().anyMatch(cp -> {
            Character.UnicodeBlock b = Character.UnicodeBlock.of(cp);
            return b == Character.UnicodeBlock.HANGUL_SYLLABLES
                    || b == Character.UnicodeBlock.HANGUL_JAMO
                    || b == Character.UnicodeBlock.HANGUL_COMPATIBILITY_JAMO;
        });
    }
}
