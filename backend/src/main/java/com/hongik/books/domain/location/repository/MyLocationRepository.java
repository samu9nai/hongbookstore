package com.hongik.books.domain.location.repository;

import com.hongik.books.domain.location.domain.MyLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MyLocationRepository extends JpaRepository<MyLocation, Long> {
    List<MyLocation> findByUser_IdOrderByIsDefaultDescCreatedAtDesc(Long userId);
    Optional<MyLocation> findByIdAndUser_Id(Long id, Long userId);
    long countByUser_Id(Long userId);
    Optional<MyLocation> findByUser_IdAndIsDefaultTrue(Long userId);
    boolean existsByUser_IdAndNameIgnoreCase(Long userId, String name);
    boolean existsByUser_IdAndNameIgnoreCaseAndIdNot(Long userId, String name, Long id);
}
