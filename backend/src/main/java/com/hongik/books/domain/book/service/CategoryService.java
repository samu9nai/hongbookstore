package com.hongik.books.domain.book.service;

import com.hongik.books.domain.book.domain.Category;
import com.hongik.books.domain.book.dto.CategoryCreateRequestDTO;
import com.hongik.books.domain.book.dto.CategoryResponseDTO;
import com.hongik.books.domain.book.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 카테고리 관련 비즈니스 로직을 처리하는 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {
    private final CategoryRepository categoryRepository;

    /**
     * 새로운 카테고리를 생성합니다.
     * @param request 생성할 카테고리 정보 DTO
     * @return 생성된 카테고리의 ID
     */
    @Transactional
    public Long createCategory(CategoryCreateRequestDTO request) {
        Category parent = null;
        if (request.getParentId() != null) {
            // 부모 ID가 있다면 찾아서 설정. 없으면 예외 발생 (EntityNotFoundException 등)
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부모 카테고리 ID입니다."));
        }

        Category newCategory = Category.builder()
                .name(request.getName())
                .parent(parent)
                .build();

        Category savedCategory = categoryRepository.save(newCategory);
        return savedCategory.getId();
    }

    /**
     * 전체 카테고리를 계층 구조(Tree)로 조회합니다.
     * @return 최상위 카테고리 목록 (각 카테고리는 자식 카테고리 목록을 포함)
     */
    public List<CategoryResponseDTO> getCategoryTree() {
        // 1. 모든 카테고리를 DB에서 한 번에 가져옵니다. (N+1 문제 방지)
        List<Category> allCategories = categoryRepository.findAll();

        // 2. DTO로 변환하고, ID를 key로 하는 Map을 만들어 쉽게 찾을 수 있도록 합니다.
        Map<Long, CategoryResponseDTO> categoryMap = allCategories.stream()
                .map(CategoryResponseDTO::fromEntity)
                .collect(Collectors.toMap(CategoryResponseDTO::getId, dto -> dto));

        // 3. 각 카테고리를 순회하며 부모-자식 관계를 설정합니다.
        allCategories.forEach(category -> {
            if (category.getParent() != null) {
                CategoryResponseDTO parentDto = categoryMap.get(category.getParent().getId());
                CategoryResponseDTO childDto = categoryMap.get(category.getId());
                if (parentDto != null) {
                    parentDto.getChildren().add(childDto);
                }
            }
        });

        // 4. 부모가 없는 최상위 카테고리(root)만 필터링하여 반환합니다.
        return allCategories.stream()
                .filter(category -> category.getParent() == null)
                .map(category -> categoryMap.get(category.getId()))
                .collect(Collectors.toList());
    }
}
