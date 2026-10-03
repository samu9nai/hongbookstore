package com.hongik.books.domain.book.repository;

import com.hongik.books.domain.book.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Category 엔티티를 위한 JPA 레포지토리
 */
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // 필요에 따라 사용자 정의 쿼리 메서드를 추가할 수 있습니다.
    // 예: 최상위 카테고리만 찾는 메서드
    List<Category> findByParentIsNull();

    Optional<Category> findByNameAndParentIsNull(String name);
    Optional<Category> findByNameAndParent(String name, Category parent);
}
