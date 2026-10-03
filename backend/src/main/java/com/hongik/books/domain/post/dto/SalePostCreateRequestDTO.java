package com.hongik.books.domain.post.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.hongik.books.domain.post.domain.Condition;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Arrays;

@Getter
@NoArgsConstructor
public class SalePostCreateRequestDTO {
    // Book 정보
    private String isbn;
    private String bookTitle;
    private String author;
    private String publisher;
    @PositiveOrZero @Max(2_000_000_000)
    private int originalPrice; // 정가

    // SalePost 정보
    @NotBlank @Size(max = 100)
    private String postTitle;
    @NotBlank @Size(max = 5000)
    private String postContent;
    @PositiveOrZero @Max(1_000_000_000)
    private int price;
    @NotNull private Condition writingCondition;
    @NotNull private Condition tearCondition;
    @NotNull private Condition waterCondition;
    private boolean negotiable;

    // 위치 코드
    @NotBlank private String oncampusPlaceCode;     // 예: "R"
    @NotBlank private String offcampusStationCode;  // 예: "HONGDAE_2"

    // ---- 카테고리 입력(여러 이름 허용) ----
    /** 프론트가 snake_case로 보내도 수신되도록 alias */
    @Size(max = 20)  @JsonAlias({"main_category"})   @Setter private String mainCategory;
    @Size(max = 50)  @JsonAlias({"sub_category"})    @Setter private String subCategory;
    @Size(max = 100) @JsonAlias({"detail_category"}) @Setter private String detailCategory;

    /** 단일 문자열로 오는 경우 (예: 상세만 보내는 프론트) */
    @JsonAlias({"category"}) @Setter private String category;

    /** "전공 > 공과대학 > 컴퓨터공학과" 같이 오는 경우 */
    @JsonAlias({"categoryPath","category_path"}) @Setter private String categoryPath;

    // ---- 정규화 헬퍼 ----
    public String getMainCategoryOrDerived() {
        normalizeIfNeeded();
        return emptyToNull(mainCategory);
    }
    public String getSubCategoryOrDerived() {
        normalizeIfNeeded();
        return emptyToNull(subCategory);
    }
    public String getDetailCategoryOrDerived() {
        normalizeIfNeeded();
        return emptyToNull(detailCategory);
    }

    // JSON 역직렬화 시점 혹은 서비스에서 최초 접근 시 파싱
    private boolean normalized = false;
    private void normalizeIfNeeded() {
        if (normalized) return;
        normalized = true;

        // 1) categoryPath가 있다면 우선 분해 (A > B > C)
        if (!isBlank(categoryPath)) {
            String[] parts = Arrays.stream(categoryPath.split(">"))
                    .map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);
            if (parts.length >= 1 && isBlank(mainCategory))  mainCategory  = parts[0];
            if (parts.length >= 2 && isBlank(subCategory))   subCategory   = parts[1];
            if (parts.length >= 3 && isBlank(detailCategory)) detailCategory = parts[2];
        }

        // 2) 단일 category가 있으면 detail로 보강
        if (isBlank(detailCategory) && !isBlank(category)) {
            detailCategory = category.trim();
        }

        // 3) 공백은 null 처리
        mainCategory   = emptyToNull(mainCategory);
        subCategory    = emptyToNull(subCategory);
        detailCategory = emptyToNull(detailCategory);
    }

    private static boolean isBlank(String s){ return s == null || s.trim().isEmpty(); }
    private static String emptyToNull(String v){ return isBlank(v) ? null : v.trim(); }

    // (선택) 외부에서 categoryPath로 세팅될 때 즉시 파싱하고 싶다면:
    @JsonSetter("categoryPath")
    public void _setCategoryPath(String path){
        this.categoryPath = path;
        this.normalized = false; // 다시 파싱하도록
    }
}
