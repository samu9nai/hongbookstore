package com.hongik.books.domain.chat.dto;

import lombok.Builder;

@Builder
public record ChatReservationRequest(
        String meetType,
        String reservedAt,           // ISO-8601 문자열 (예: 2025-08-29T12:30:00Z)
        String placeLabel,
        String oncampusPlaceCode,
        String offcampusStationCode
) {}
