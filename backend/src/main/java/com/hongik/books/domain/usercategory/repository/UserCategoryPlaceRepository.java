package com.hongik.books.domain.usercategory.repository;

import com.hongik.books.domain.usercategory.domain.UserCategoryPlace;
import com.hongik.books.domain.usercategory.domain.UserCategoryPlaceId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCategoryPlaceRepository extends JpaRepository<UserCategoryPlace, UserCategoryPlaceId> {
    List<UserCategoryPlace> findByUserCategoryId(Long userCategoryId);
    void deleteByUserCategoryIdAndPlaceId(Long userCategoryId, Long placeId);
    boolean existsByUserCategoryIdAndPlaceId(Long userCategoryId, Long placeId);
}
