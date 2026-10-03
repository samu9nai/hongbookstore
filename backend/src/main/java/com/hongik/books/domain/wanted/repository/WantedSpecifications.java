package com.hongik.books.domain.wanted.repository;

import com.hongik.books.domain.wanted.domain.Wanted;
import org.springframework.data.jpa.domain.Specification;

public final class WantedSpecifications {
    private WantedSpecifications() {}

    public static Specification<Wanted> categoryEquals(String category) {
        return (root, cq, cb) ->
                (category == null || category.isBlank()) ? cb.conjunction()
                        : cb.equal(root.get("category"), category);
    }

    public static Specification<Wanted> departmentEquals(String department) {
        return (root, cq, cb) ->
                (department == null || department.isBlank()) ? cb.conjunction()
                        : cb.equal(root.get("department"), department);
    }

    public static Specification<Wanted> keywordContains(String keyword) {
        return (root, cq, cb) -> {
            if (keyword == null || keyword.isBlank()) return cb.conjunction();
            String like = "%" + keyword.trim() + "%";
            return cb.or(
                    cb.like(root.get("title"), like),
                    cb.like(root.get("author"), like),
                    cb.like(root.get("content"), like)
            );
        };
    }
}
