package com.hongik.books.domain.place.domain; // 패키지 경로를 domain으로 수정했습니다.

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "places")
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "place_id")
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 512)
    private String address;

    @Column(nullable = false)
    private Double lat; // 위도

    @Column(nullable = false)
    private Double lng; // 경도

    private String category;

    @Column(length = 1000)
    private String description;

    // photos, reviews 등 다른 필드들도 필요에 따라 추가할 수 있습니다.

    @Builder
    public Place(String name, String address, Double lat, Double lng, String category, String description) {
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
        this.category = category;
        this.description = description;
    }
}
