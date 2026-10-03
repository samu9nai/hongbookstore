package com.hongik.books.domain.place.repository;

import com.hongik.books.domain.place.domain.Place; // 수정된 엔티티 경로를 import 합니다.
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaceRepository extends JpaRepository<Place, Long> {
    // JpaRepository를 상속받는 것만으로 기본적인 CRUD 기능이 모두 구현됩니다.
}
