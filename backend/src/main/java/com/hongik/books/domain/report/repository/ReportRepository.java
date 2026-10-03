package com.hongik.books.domain.report.repository;

import com.hongik.books.domain.report.domain.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporter_IdAndSalePost_Id(Long reporterId, Long salePostId);

    boolean existsByReporter_IdAndWanted_Id(Long reporterId, Long wantedId);

    // ✅ 새로 추가: 신고자 × 채팅방 중복 여부
    boolean existsByReporter_IdAndChatRoom_Id(Long reporterId, Long chatRoomId);
}
