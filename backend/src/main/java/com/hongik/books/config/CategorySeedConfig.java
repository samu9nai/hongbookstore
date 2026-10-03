package com.hongik.books.config;

import com.hongik.books.domain.book.domain.Category;
import com.hongik.books.domain.book.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class CategorySeedConfig {

    private final CategoryRepository categoryRepository;

    @Bean
    public CommandLineRunner seedCategoriesRunner() {
        return args -> seedCategories();
    }

    @Transactional
    void seedCategories() {
        // 최상위: 전공, 교양
        Category major = ensureRoot("전공");
        Category liberal = ensureRoot("교양");

        // 전공 트리
        ensureChildren(major, "경영대학", List.of("경영학부"));
        ensureChildren(major, "공과대학", List.of("전자전기공학부", "신소재공학전공", "화학공학전공", "컴퓨터공학과", "산업데이터공학과", "기계시스템디자인공학과", "건설환경공학과"));
        ensureChildren(major, "법과대학", List.of("법학부"));
        ensureChildren(major, "미술대학", List.of("동양학과", "회화과", "판화과", "조소과", "시각디자인전공", "산업디자인전공", "금속조형디자인과", "도예유리과", "목조형가구학과", "섬유미술패션디자인과", "예술학과"));
        ensureChildren(major, "디자인,예술경영학부", List.of("디자인경영전공", "예술경영전공"));
        ensureChildren(major, "공연예술학부", List.of("뮤지컬전공", "실용음악전공"));
        ensureChildren(major, "경제학부", List.of("경제학전공"));
        ensureChildren(major, "사범대학", List.of("수학교육과", "국어교육과", "영어교육과", "역사교육과", "교육학과"));
        ensureChildren(major, "문과대학", List.of("영어영문학과", "독어독문학과", "불어불문학과", "국어국문학과"));
        ensureChildren(major, "건축도시대학", List.of("건축학전공", "실내건축학전공", "도시공학과"));

        // 교양 트리
        ensureChildren(liberal, "ABEEK 교양", List.of("ABEEK 교양"));
        ensureChildren(liberal, "인문계열", List.of("인문계열"));
        ensureChildren(liberal, "영어계열", List.of("영어계열"));
        ensureChildren(liberal, "사회계열", List.of("사회계열"));
        ensureChildren(liberal, "제2외국어계열", List.of("제2외국어계열"));
        ensureChildren(liberal, "자연계열", List.of("자연계열"));
        ensureChildren(liberal, "예체능계열", List.of("예체능계열"));
        ensureChildren(liberal, "교직", List.of("교직"));
    }

    private Category ensureRoot(String name) {
        return categoryRepository.findByNameAndParentIsNull(name)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(name).parent(null).build()));
    }

    private Category ensureChild(Category parent, String name) {
        return categoryRepository.findByNameAndParent(name, parent)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(name).parent(parent).build()));
    }

    private void ensureChildren(Category parent, String groupName, List<String> children) {
        Category group = ensureChild(parent, groupName);
        for (String c : children) {
            ensureChild(group, c);
        }
    }
}

