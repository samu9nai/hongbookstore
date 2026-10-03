package com.hongik.books.domain.chat.dto;

import lombok.Builder;

@Builder
public record ChatReservationResponse(
        Long id,
        Long chatRoomId,
        String status,
        String reservedAt,
        String meetType,
        String placeLabel,
        String oncampusPlaceCode,
        String offcampusStationCode,
        Long createdByUserId,
        String cancelReason,
        String createdAt,
        String updatedAt
) {}
