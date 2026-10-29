package com.hongik.books;

import com.hongik.books.auth.jwt.JwtTokenProvider;
import com.hongik.books.auth.jwt.JwtTokenRedisRepository;
import com.hongik.books.domain.comment.domain.WantedComment;
import com.hongik.books.domain.comment.repository.WantedCommentRepository;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.domain.UserRole;
import com.hongik.books.domain.user.repository.UserRepository;
import com.hongik.books.domain.wanted.domain.Wanted;
import com.hongik.books.domain.wanted.repository.WantedRepository;
import com.hongik.books.moderation.ModerationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 구해요 글·댓글의 작성자를 요청 헤더가 아니라 인증 주체로 정하는지 확인한다(SEC-02, #81).
 * 다른 사용자의 토큰에 작성자 ID 헤더를 붙여 보내도 작성자로 인정하지 않아야 한다.
 */
@SpringBootTest
@ActiveProfiles("test")
class WantedOwnershipTest {

    private static final String UPDATE_BODY = """
            {"title":"바뀐 제목","condition":"상","price":5000,"category":"교양","content":"수정"}
            """;

    @Autowired WebApplicationContext context;
    @Autowired UserRepository userRepository;
    @Autowired WantedRepository wantedRepository;
    @Autowired WantedCommentRepository commentRepository;
    @Autowired JwtTokenProvider jwtTokenProvider;

    @MockitoBean JwtTokenRedisRepository jwtTokenRedisRepository;
    @MockitoBean ModerationService moderationService;

    MockMvc mvc;
    User owner;
    User other;
    Wanted wanted;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        commentRepository.deleteAll();
        wantedRepository.deleteAll();
        userRepository.deleteAll();
        owner = saveStudent("owner@example.com", "owner");
        other = saveStudent("other@example.com", "other");
        wanted = wantedRepository.save(Wanted.builder()
                .requester(owner)
                .title("자료구조")
                .author("홍길동")
                .desiredCondition("상")
                .price(10000)
                .category("전공")
                .department("컴퓨터공학과")
                .content("구해요")
                .build());
    }

    @Test
    void 다른_사용자는_작성자_ID_헤더를_보내도_구해요_글을_수정할_수_없다() throws Exception {
        mvc.perform(put("/api/wanted/" + wanted.getId())
                        .header("Authorization", bearer(other))
                        .header("X-User-Id", owner.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(UPDATE_BODY))
                .andExpect(status().isForbidden());

        assertThat(wantedRepository.findById(wanted.getId()).orElseThrow().getTitle()).isEqualTo("자료구조");
    }

    @Test
    void 다른_사용자는_작성자_ID_헤더를_보내도_구해요_글을_삭제할_수_없다() throws Exception {
        mvc.perform(delete("/api/wanted/" + wanted.getId())
                        .header("Authorization", bearer(other))
                        .header("X-User-Id", owner.getId()))
                .andExpect(status().isForbidden());

        assertThat(wantedRepository.existsById(wanted.getId())).isTrue();
    }

    @Test
    void 작성자는_헤더_없이_구해요_글을_수정하고_삭제한다() throws Exception {
        mvc.perform(put("/api/wanted/" + wanted.getId())
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(UPDATE_BODY))
                .andExpect(status().isNoContent());
        assertThat(wantedRepository.findById(wanted.getId()).orElseThrow().getTitle()).isEqualTo("바뀐 제목");

        mvc.perform(delete("/api/wanted/" + wanted.getId())
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isNoContent());
        assertThat(wantedRepository.existsById(wanted.getId())).isFalse();
    }

    @Test
    void 구해요_글_작성자는_헤더가_아니라_로그인한_사용자다() throws Exception {
        mvc.perform(post("/api/wanted")
                        .header("Authorization", bearer(other))
                        .header("X-User-Id", owner.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(UPDATE_BODY))
                .andExpect(status().isCreated());

        assertThat(wantedRepository.findAll())
                .filteredOn(w -> "바뀐 제목".equals(w.getTitle()))
                .singleElement()
                .satisfies(w -> assertThat(w.getRequester().getId()).isEqualTo(other.getId()));
    }

    @Test
    void 댓글_작성자는_헤더가_아니라_로그인한_사용자다() throws Exception {
        mvc.perform(post("/api/wanted/" + wanted.getId() + "/comments")
                        .header("Authorization", bearer(other))
                        .header("X-USER-ID", owner.getId())
                        .header("X-USER-NICKNAME", "owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"팔아요\"}"))
                .andExpect(status().isCreated());

        WantedComment saved = commentRepository.findAll().getFirst();
        assertThat(saved.getUserId()).isEqualTo(other.getId());
        assertThat(saved.getNickname()).isEqualTo("익명");
    }

    @Test
    void 답글_작성자는_헤더가_아니라_로그인한_사용자다() throws Exception {
        WantedComment parent = commentRepository.save(WantedComment.builder()
                .wantedId(wanted.getId())
                .depth(0)
                .deleted(false)
                .content("팔아요")
                .userId(owner.getId())
                .authorNickname("익명1")
                .build());

        mvc.perform(post("/api/wanted/" + wanted.getId() + "/comments/" + parent.getId() + "/replies")
                        .header("Authorization", bearer(other))
                        .header("X-USER-ID", owner.getId())
                        .header("X-USER-NICKNAME", "owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"저도요\"}"))
                .andExpect(status().isCreated());

        assertThat(commentRepository.findAll())
                .filteredOn(c -> parent.getId().equals(c.getParentId()))
                .singleElement()
                .satisfies(c -> {
                    assertThat(c.getUserId()).isEqualTo(other.getId());
                    assertThat(c.getNickname()).isEqualTo("익명");
                });
    }

    @Test
    void 다른_사용자는_작성자_ID_헤더를_보내도_댓글을_삭제할_수_없다() throws Exception {
        WantedComment comment = commentRepository.save(WantedComment.builder()
                .wantedId(wanted.getId())
                .depth(0)
                .deleted(false)
                .content("팔아요")
                .userId(owner.getId())
                .authorNickname("익명1")
                .build());

        mvc.perform(delete("/api/wanted/" + wanted.getId() + "/comments/" + comment.getId())
                        .header("Authorization", bearer(other))
                        .header("X-USER-ID", owner.getId()))
                .andExpect(status().isForbidden());

        assertThat(commentRepository.findById(comment.getId()).orElseThrow().isDeleted()).isFalse();
    }

    private User saveStudent(String email, String username) {
        return userRepository.save(User.builder()
                .email(email)
                .username(username)
                .role(UserRole.STUDENT)
                .studentVerified(true)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtTokenProvider.createAccessToken(user.getId());
    }
}
