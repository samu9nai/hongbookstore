package com.hongik.books.domain.place.dto;

import com.hongik.books.domain.place.domain.Place; // 수정된 엔티티 경로를 import 합니다.
import lombok.Getter;
import lombok.NoArgsConstructor;

public class PlaceDto {

    // 장소를 저장할 때 프론트엔드에서 보낼 데이터 형식
    @Getter
    @NoArgsConstructor
    public static class SaveRequest {
        private String name;
        private String address;
        private Double lat;
        private Double lng;
        private String category;
        private String description;

        public Place toEntity() {
            return Place.builder()
                    .name(name)
                    .address(address)
                    .lat(lat)
                    .lng(lng)
                    .category(category)
                    .description(description)
                    .build();
        }
    }

    // DB에 저장된 장소 정보를 프론트엔드로 보낼 데이터 형식
    @Getter
    public static class Response {
        private Long id;
        private String name;
        private String address;
        private Double lat;
        private Double lng;
        private String category;
        private String description;

        public Response(Place entity) {
            this.id = entity.getId();
            this.name = entity.getName();
            this.address = entity.getAddress();
            this.lat = entity.getLat();
            this.lng = entity.getLng();
            this.category = entity.getCategory();
            this.description = entity.getDescription();
        }
    }
}
