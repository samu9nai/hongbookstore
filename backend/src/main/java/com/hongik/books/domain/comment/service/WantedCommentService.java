package com.hongik.books.domain.comment.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hongik.books.domain.comment.domain.WantedComment;
import com.hongik.books.domain.comment.dto.CommentCreateRequest;
import com.hongik.books.domain.comment.dto.WantedCommentDto;
import com.hongik.books.domain.comment.repository.WantedCommentRepository;
import lombok.RequiredArgsConstructor;
import com.hongik.books.moderation.ModerationPolicyProperties;
import com.hongik.books.moderation.ModerationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hongik.books.domain.notification.service.NotificationService;
import com.hongik.books.domain.wanted.repository.WantedRepository;


import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 구해요 댓글/대댓글 서비스
 * - 같은 글(wantedId) 안에서 사용자(userId) 등장 순서대로 익명 번호(익명1, 익명2, …)를 부여해서 보여준다
 * - 응답 DTO에는 authorNickname = 익명N 으로만 내려주고, 기존 nickname(이메일/실명 등)은 숨긴다(null)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WantedCommentService {

    private final WantedCommentRepository commentRepository;
    private final WantedRepository wantedRepository;
    private final NotificationService notificationService;
    private final com.hongik.books.moderation.toxic.ToxicFilterClient toxicFilterClient;
    private final ModerationService moderationService;
    private final ModerationPolicyProperties moderationPolicy;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /* =========================
       조회
       ========================= */
    @Transactional(readOnly = true)
    public List<WantedCommentDto> getList(Long wantedId) {
        var comments = commentRepository.findByWantedIdOrderByCreatedAtAsc(wantedId); // ✅ 삭제 포함

        // userId 등장 순서 기반 매핑: userId -> 번호(1부터)
        Map<Long, Integer> orderMap = new LinkedHashMap<>();
        int next = 1;
        for (var c : comments) {
            Long uid = c.getUserId();
            if (uid == null) continue;
            if (!orderMap.containsKey(uid)) {
                orderMap.put(uid, next++);
            }
        }

        // DTO 변환 시 authorNickname을 "익명N"으로, raw nickname은 숨김(null)
        List<WantedCommentDto> list = new ArrayList<>(comments.size());
        for (var c : comments) {
            Integer no = (c.getUserId() == null) ? null : orderMap.get(c.getUserId());
            String alias = (no == null) ? "익명" : ("익명" + no);

            var base = WantedCommentDto.from(c);
            list.add(
                    WantedCommentDto.builder()
                            .id(base.getId())
                            .wantedId(base.getWantedId())
                            .parentId(base.getParentId())
                            .depth(base.getDepth())
                            .content(base.getContent())
                            .userId(base.getUserId())
                            .nickname(null)                // 실닉 숨김
                            .authorNickname(alias)         // 익명N 노출
                            .deleted(base.isDeleted())
                            .contentToxic(base.isContentToxic())
                            .contentToxicLevel(base.getContentToxicLevel())
                            .contentToxicMalicious(base.getContentToxicMalicious())
                            .contentToxicClean(base.getContentToxicClean())
                            .contentToxicReason(base.getContentToxicReason())
                            .createdAt(base.getCreatedAt())
                            .build()
            );
        }
        return list;
    }

    /* =========================
       생성
       ========================= */
    @Transactional
    public WantedCommentDto addRoot(Long wantedId, CommentCreateRequest req, Long userId) {
        var mode = moderationPolicy.getComment().getContent();
        var modResult = moderationService.checkOrThrow(req.getContent(), mode, "content");

        String alias = computeAliasForUser(wantedId, userId);

        WantedComment toSave = WantedComment.builder()
                .wantedId(wantedId)
                .parentId(null)
                .depth(0)
                .deleted(false)
                .content(req.getContent())
                .userId(userId)
                .nickname("익명")             // 실닉은 저장하지 않는다(#81)
                .authorNickname(alias)
                .build();

        if (modResult != null) {
            toSave.applyContentModeration(
                    modResult.predictionLevel(),
                    modResult.malicious(),
                    modResult.clean(),
                    modResult.blocked(),
                    modResult.reason()
            );
        }

        WantedComment saved = commentRepository.save(toSave);

        // ✅ 자기 자신에게는 알림을 보내지 않도록 체크
        try {
            var wanted = wantedRepository.findById(wantedId).orElse(null);
            if (wanted != null && wanted.getRequester() != null) {
                Long ownerId = wanted.getRequester().getId();
                if (!Objects.equals(ownerId, userId)) { // 🔑 작성자와 댓글 작성자가 다를 때만 알림 발송
                    notificationService.notifyWantedComment(
                            ownerId,
                            wantedId,
                            alias,
                            req.getContent()
                    );
                }
            }
        } catch (Exception ignore) {}

        return WantedCommentDto.from(saved).toBuilder()
                .nickname(null)
                .authorNickname(alias)
                .build();
    }

    @Transactional
    public WantedCommentDto addReply(Long wantedId, Long parentId, CommentCreateRequest req, Long userId) {
        var mode = moderationPolicy.getComment().getContent();
        var modResult = moderationService.checkOrThrow(req.getContent(), mode, "content");

        String alias = computeAliasForUser(wantedId, userId);

        WantedComment toSave2 = WantedComment.builder()
                .wantedId(wantedId)
                .parentId(parentId)
                .depth(1)
                .deleted(false)
                .content(req.getContent())
                .userId(userId)
                .nickname("익명")             // 실닉은 저장하지 않는다(#81)
                .authorNickname(alias)
                .build();

        if (modResult != null) {
            toSave2.applyContentModeration(
                    modResult.predictionLevel(),
                    modResult.malicious(),
                    modResult.clean(),
                    modResult.blocked(),
                    modResult.reason()
            );
        }

        WantedComment saved = commentRepository.save(toSave2);

        // ✅ 자기 자신 제외 로직 추가
        try {
            var wanted = wantedRepository.findById(wantedId).orElse(null);
            if (wanted != null && wanted.getRequester() != null) {
                Long ownerId = wanted.getRequester().getId();
                if (!Objects.equals(ownerId, userId)) {
                    notificationService.notifyWantedComment(
                            ownerId,
                            wantedId,
                            alias,
                            req.getContent()
                    );
                }
            }
        } catch (Exception ignore) {}

        return WantedCommentDto.from(saved).toBuilder()
                .nickname(null)
                .authorNickname(alias)
                .build();
    }

    /* =========================
       삭제(소프트)
       ========================= */
    @Transactional
    public void delete(Long wantedId, Long commentId, Long userId) {
        // 본인 댓글인지 가볍게 체크 (강화하고 싶으면 별도 권한 로직 추가)
        int mine = commentRepository.countByIdAndUserId(commentId, userId);
        if (mine == 0) {
            throw new SecurityException("본인 댓글만 삭제할 수 있습니다.");
        }
        WantedComment c = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다."));
        if (!Objects.equals(c.getWantedId(), wantedId)) {
            throw new IllegalArgumentException("잘못된 요청입니다.");
        }
        c.softDelete(); // 내용 "(삭제된 댓글입니다)" 로 교체 + deleted=true
        // JPA dirty checking
    }

    /* =========================
       유틸/보안 보조
       ========================= */

    /** 같은 글에서 해당 userId에게 부여될 익명 별칭(익명N) 계산 — 등장 순서 기준 */
    private String computeAliasForUser(Long wantedId, Long userId) {
        var comments = commentRepository.findByWantedIdOrderByCreatedAtAsc(wantedId); // ✅ 삭제 포함
        Map<Long, Integer> orderMap = new LinkedHashMap<>();
        int num = 1;
        for (var c : comments) {
            Long uid = c.getUserId();
            if (uid == null) continue;
            if (!orderMap.containsKey(uid)) {
                orderMap.put(uid, num++);
            }
        }
        Integer order = orderMap.get(userId);
        return (order == null) ? "익명" : ("익명" + order);
    }

    /** (선택) Authorization: Bearer <jwt> 를 파싱해야 할 때 사용할 수 있는 보조 */
    private JwtPayload parseJwt(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            String payload = parts[1];
            int mod = payload.length() % 4;
            if (mod > 0) payload += "====".substring(mod);
            byte[] json = Base64.getUrlDecoder().decode(payload.getBytes(StandardCharsets.UTF_8));
            Map<String, Object> map = MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
            return new JwtPayload(map);
        } catch (Exception e) {
            return null;
        }
    }

    public static class JwtPayload {
        private final Map<String, Object> map;
        public JwtPayload(Map<String, Object> map) { this.map = map; }
        public Long getLong(String k) { return map == null ? null : asLongStatic(map.get(k)); }
        public String getString(String k) { return map == null ? null : asStringStatic(map.get(k)); }
        private static Long asLongStatic(Object v) {
            if (v == null) return null;
            if (v instanceof Number n) return n.longValue();
            try { return Long.parseLong(String.valueOf(v)); } catch (Exception e) { return null; }
        }
        private static String asStringStatic(Object v) { return v == null ? null : String.valueOf(v); }
    }
}
