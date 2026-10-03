package com.hongik.books.domain.post.repository;

import com.hongik.books.domain.book.domain.Book;
import com.hongik.books.domain.book.domain.BookCategory;
import com.hongik.books.domain.book.domain.Category;
import com.hongik.books.domain.post.domain.SalePost;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * SalePost에 대한 동적 쿼리를 생성하기 위한 Specification 클래스
 * 각 메서드가 검색 조건 '레고 블록' 하나에 해당
 */
public class PostSpecification {
    // 검색어(query)로 필터링하는 Specification
    public static Specification<SalePost> hasQuery(String query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            if (!StringUtils.hasText(query)) {
                return null; // 검색어가 없으면 조건을 적용하지 않음
            }
            // Book 엔티티와 조인
            Join<SalePost, Book> book = root.join("book");

            // 1. 게시글 제목에서 검색
            Predicate postTitleLike = criteriaBuilder.like(root.get("postTitle"), "%" + query + "%");
            // 2. 책 제목에서 검색
            Predicate bookTitleLike = criteriaBuilder.like(book.get("title"), "%" + query + "%");
            // 3. 저자 이름에서 검색
            Predicate authorLike = criteriaBuilder.like(book.get("author"), "%" + query + "%");

            // 위 3가지 조건을 OR로 결합하여 반환
            return criteriaBuilder.or(postTitleLike, bookTitleLike, authorLike);
        };
    }

    // 카테고리로 필터링하는 Specification
    public static Specification<SalePost> inCategory(String categoryName) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            if (!StringUtils.hasText(categoryName)) {
                return null;
            }
            // SalePost -> Book -> BookCategory -> Category 조인
            Join<SalePost, Book> bookJoin = root.join("book");
            Join<Book, BookCategory> bookCategoryJoin = bookJoin.join("bookCategories");
            Join<BookCategory, Category> categoryJoin = bookCategoryJoin.join("category");

            return criteriaBuilder.equal(categoryJoin.get("name"), categoryName);
        };
    }

    // 가격 범위로 필터링하는 Specification
    public static Specification<SalePost> priceBetween(Integer minPrice, Integer maxPrice) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (predicates.isEmpty()) {
                return null;
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
