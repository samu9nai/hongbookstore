// com/hongik/books/domain/report/service/ReportService.java
package com.hongik.books.domain.report.service;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.chat.domain.ChatRoom;
import com.hongik.books.domain.chat.repository.ChatRoomRepository;
import com.hongik.books.domain.post.domain.SalePost;
import com.hongik.books.domain.post.repository.SalePostRepository;
import com.hongik.books.domain.report.domain.Report;
import com.hongik.books.domain.report.domain.ReportReason;
import com.hongik.books.domain.report.domain.ReportType;
import com.hongik.books.domain.report.dto.ReportDtos;
import com.hongik.books.domain.report.repository.ReportRepository;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.repository.UserRepository;
import com.hongik.books.domain.wanted.domain.Wanted;
import com.hongik.books.domain.wanted.repository.WantedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final SalePostRepository salePostRepository;
    private final WantedRepository wantedRepository;
    private final ChatRoomRepository chatRoomRepository;

    public ReportDtos.SimpleRes create(ReportDtos.CreateReq req, LoginUserDTO loginUser) {
        // 0) 인증 검사
        if (loginUser == null || loginUser.id() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        final Long reporterId = loginUser.id();
        final User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));

        // 1) 타입 파싱 (CHAT 호환)
        if (req.getType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "신고 타입(type)이 필요합니다.");
        }
        String typeStr = req.getType().trim().toUpperCase(Locale.ROOT);
        if ("CHAT".equals(typeStr)) typeStr = "CHAT_ROOM"; // 호환
        final ReportType type;
        try {
            type = ReportType.valueOf(typeStr);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 신고 타입입니다.");
        }

        if (req.getTargetId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetId가 필요합니다.");
        }

        // 2) 이유 파싱(한글 라벨 또는 ENUM 이름 모두 허용)
        final ReportReason reason = ReportReason.from(req.getReason());
        if (reason == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 신고 사유입니다.");
        }
        // 2-1) 기타면 detail 필수
        final String detail = req.getDetail() != null ? req.getDetail().trim() : null;
        if (reason == ReportReason.OTHER && (detail == null || detail.isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기타 사유를 선택한 경우 상세 사유(detail)가 필요합니다.");
        }

        // 3) 대상 매핑
        Report.ReportBuilder builder = Report.builder()
                .reporter(reporter)
                .type(type)
                .reason(reason)
                .detail(detail)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now());

        User reportedUser = null;
        SalePost salePost = null;
        Wanted wanted = null;
        ChatRoom chatRoom = null;

        switch (type) {
            case CHAT_ROOM -> {
                if (req.getChatRoomId() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "chatRoomId가 필요합니다.");
                }
                chatRoom = chatRoomRepository.findById(req.getChatRoomId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
                reportedUser = userRepository.findById(req.getTargetId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "대상 사용자를 찾을 수 없습니다."));
            }
            case SALE_POST -> {
                salePost = salePostRepository.findById(req.getTargetId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "판매글을 찾을 수 없습니다."));
                if (salePost.getSeller() != null) reportedUser = salePost.getSeller();
            }
            case WANTED -> {
                wanted = wantedRepository.findById(req.getTargetId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "구함글을 찾을 수 없습니다."));
                if (wanted.getRequester() != null) reportedUser = wanted.getRequester();
            }
        }

        builder.reportedUser(reportedUser);
        builder.salePost(salePost);
        builder.wanted(wanted);
        builder.chatRoom(chatRoom);

        Report saved = reportRepository.save(builder.build());

        return new ReportDtos.SimpleRes(
                saved.getId(),
                saved.getType().name(),
                saved.getReporter() != null ? saved.getReporter().getId() : null,
                saved.getReportedUser() != null ? saved.getReportedUser().getId() : null,
                saved.getSalePost() != null ? saved.getSalePost().getId() : null,
                saved.getWanted() != null ? saved.getWanted().getId() : null,
                saved.getReason().name(),
                saved.getDetail(),
                saved.getCreatedAt()
        );
    }

    /** ADMIN 전용 목록 */
    @Transactional(readOnly = true)
    public Page<ReportDtos.SimpleRes> list(Pageable pageable) {
        return reportRepository.findAll(pageable)
                .map(saved -> new ReportDtos.SimpleRes(
                        saved.getId(),
                        saved.getType().name(),
                        saved.getReporter() != null ? saved.getReporter().getId() : null,
                        saved.getReportedUser() != null ? saved.getReportedUser().getId() : null,
                        saved.getSalePost() != null ? saved.getSalePost().getId() : null,
                        saved.getWanted() != null ? saved.getWanted().getId() : null,
                        saved.getReason().name(),
                        saved.getDetail(),
                        saved.getCreatedAt()
                ));
    }
}
