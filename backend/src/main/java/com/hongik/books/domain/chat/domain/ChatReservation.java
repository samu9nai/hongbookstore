package com.hongik.books.domain.chat.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
@Table(name = "chat_reservation")
public class ChatReservation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_room_id")
    private ChatRoom chatRoom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatReservationStatus status;

    // 약속 시간(로컬)
    @Column(nullable = false)
    private LocalDateTime reservedAt;

    // "on" | "off" (교내/교외)
    @Column(length = 10)
    private String meetType;

    // 화면에 보여줄 장소 라벨 (예: "교내 · MH 학생회관")
    @Column(length = 255)
    private String placeLabel;

    // 선택적으로 저장할 코드들
    @Column(length = 64)
    private String oncampusPlaceCode;

    @Column(length = 64)
    private String offcampusStationCode;

    // 누가 생성/수정했는지
    private Long createdByUserId;

    @Column(length = 255)
    private String cancelReason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
