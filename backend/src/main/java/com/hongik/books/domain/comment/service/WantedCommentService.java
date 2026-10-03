package com.hongik.books.domain.comment.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hongik.books.domain.comment.domain.WantedComment;
import com.hongik.books.domain.comment.dto.CommentCreateRequest;
import com.hongik.books.domain.comment.dto.WantedCommentDto;
import com.hongik.books.domain.comment.repository.WantedCommentRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import com.hongik.books.moderation.ModerationPolicyProperties;
import com.hongik.books.moderation.ModerationService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
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
    public WantedCommentDto addRoot(Long wantedId, CommentCreateRequest req, Long userId, String nickname) {
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
                .nickname(nickname)
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
    public WantedCommentDto addReply(Long wantedId, Long parentId, CommentCreateRequest req, Long userId, String nickname) {
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
                .nickname(nickname)
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

    public record CurrentUser(Long id, String nickname) {}

    /** 컨트롤러에서 사용: 로그인 사용자 가져오기(없으면 예외) */
    public CurrentUser getCurrentUserOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new SecurityException("로그인이 필요합니다.");
        }
        Object principal = auth.getPrincipal();

        Long id = null;
        String nick = null;

        // 1) 커스텀 UserDetails
        if (principal instanceof UserDetails ud) {
            nick = safeFirstNonBlank(ud.getUsername(), null, null, null);
        }

        // 2) OAuth2User
        if (principal instanceof OAuth2User oau) {
            Map<String, Object> attrs = oau.getAttributes();
            id = asLong(attrs.get("id"));
            nick = resolveNicknameFromMap(attrs);
        }

        // 3) 커스텀 Principal (getId, getUserId 등 관용명 시도)
        if (id == null) {
            id = invokeLong(principal, "getId");
            if (id == null) id = invokeLong(principal, "getUserId");
            if (id == null) id = invokeLong(principal, "getMemberId");
        }
        if (nick == null || nick.isBlank()) {
            nick = invokeString(principal, "getNickname");
            if (nick == null || nick.isBlank()) nick = invokeString(principal, "getName");
            if (nick == null || nick.isBlank()) nick = invokeString(principal, "getUsername");
            if (nick == null || nick.isBlank()) nick = "익명";
        }

        // 4) 헤더 보조 (프론트가 X-USER-ID, X-USER-NICKNAME 보낼 때)
        HttpServletRequest request = currentRequest();
        if (request != null) {
            if (id == null) {
                String hId = request.getHeader("X-USER-ID");
                if (hId != null && !hId.isBlank()) {
                    try { id = Long.parseLong(hId.trim()); } catch (Exception ignored) {}
                }
            }
            if (nick == null || nick.isBlank()) {
                String hNick = request.getHeader("X-USER-NICKNAME");
                nick = (hNick == null || hNick.isBlank()) ? "익명" : hNick;
            }
        }

        if (id == null) throw new SecurityException("사용자 식별을 할 수 없습니다.");
        if (nick == null || nick.isBlank()) nick = "익명";
        return new CurrentUser(id, nick);
    }

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

    private HttpServletRequest currentRequest() {
        var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs == null ? null : attrs.getRequest();
    }

    private Long invokeLong(Object target, String methodName) {
        try {
            var m = target.getClass().getMethod(methodName);
            Object v = m.invoke(target);
            return asLong(v);
        } catch (Exception ignore) {
            return null;
        }
    }

    private String invokeString(Object target, String methodName) {
        try {
            var m = target.getClass().getMethod(methodName);
            Object v = m.invoke(target);
            return asString(v);
        } catch (Exception ignore) {
            return null;
        }
    }

    private String safeFirstNonBlank(String a, String b, String c, String d) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        if (c != null && !c.isBlank()) return c;
        if (d != null && !d.isBlank()) return d;
        return null;
    }

    private String resolveNicknameFromMap(Map<String, Object> attrs) {
        if (attrs == null) return null;
        try {
            String nickname = asString(attrs.get("nickname"));
            String preferred_username = asString(attrs.get("preferred_username"));
            String name = asString(attrs.get("name"));
            String pu = asString(attrs.get("pu"));
            if (nickname != null && !nickname.isBlank()) return nickname;
            if (preferred_username != null && !preferred_username.isBlank()) return preferred_username;
            if (name != null && !name.isBlank()) return name;
            if (pu != null && !pu.isBlank()) return pu;
            return null;
        } catch (Exception e) {
            return null;
        }
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

    private Long asLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(String.valueOf(v)); } catch (Exception e) { return null; }
    }

    private String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}
