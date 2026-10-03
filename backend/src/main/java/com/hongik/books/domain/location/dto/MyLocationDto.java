package com.hongik.books.domain.location.dto;

import com.hongik.books.domain.location.domain.MyLocation;
import lombok.Builder;

public class MyLocationDto {

    @Builder
    public record SaveRequest(
            String name,
            String address,
            Double lat,
            Double lng,
            Boolean makeDefault
    ) {}

    @Builder
    public record Response(
            Long id,
            String name,
            String address,
            Double lat,
            Double lng,
            boolean isDefault
    ) {
        public Response(MyLocation e) {
            this(e.getId(), e.getName(), e.getAddress(), e.getLat(), e.getLng(), e.isDefault());
        }
    }
}

