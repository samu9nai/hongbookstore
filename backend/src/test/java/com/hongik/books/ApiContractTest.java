package com.hongik.books;

import com.hongik.books.auth.jwt.JwtTokenProvider;
import com.hongik.books.auth.jwt.JwtTokenRedisRepository;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.domain.UserRole;
import com.hongik.books.domain.user.repository.UserRepository;
import com.hongik.books.domain.wanted.domain.Wanted;
import com.hongik.books.domain.wanted.repository.WantedRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Spring Boot 3.5.10에서 관찰한 HTTP 응답 모양을 고정한다(#77).
 * 프론트엔드가 읽는 필드 이름·날짜 형식·인증 거절 방식이 프레임워크 업그레이드로 바뀌지 않았는지 확인한다.
 */
@SpringBootTest
@ActiveProfiles("test")
class ApiContractTest {

    private static final String LOCAL_DATE_TIME = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?";

    @Autowired WebApplicationContext context;
    @Autowired UserRepository userRepository;
    @Autowired WantedRepository wantedRepository;
    @Autowired JwtTokenProvider jwtTokenProvider;

    @MockitoBean JwtTokenRedisRepository jwtTokenRedisRepository;

    MockMvc mvc;
    User user;
    Wanted wanted;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        wantedRepository.deleteAll();
        userRepository.deleteAll();
        user = userRepository.save(User.builder()
                .email("contract@example.com")
                .username("contract")
                .role(UserRole.STUDENT)
                .studentVerified(true)
                .build());
        wanted = wantedRepository.save(Wanted.builder()
                .requester(user)
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
    void 공개_목록은_Page를_그대로_직렬화한다() throws Exception {
        mvc.perform(get("/api/wanted"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(wanted.getId()))
                .andExpect(jsonPath("$.content[0].title").value("자료구조"))
                .andExpect(jsonPath("$.content[0].condition").value("상"))
                .andExpect(jsonPath("$.content[0].hasToxicContent").value(false))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(12))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(true))
                .andExpect(jsonPath("$.pageable.pageNumber").value(0));
    }

    @Test
    void LocalDateTime은_offset_없는_ISO_문자열이고_null_필드도_보낸다() throws Exception {
        mvc.perform(get("/api/wanted/" + wanted.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requesterId").value(user.getId()))
                .andExpect(jsonPath("$.createdAt").value(matchesPattern(LOCAL_DATE_TIME)))
                .andExpect(jsonPath("$.updatedAt").value(matchesPattern(LOCAL_DATE_TIME)))
                .andExpect(content().string(containsString("\"contentToxicLevel\":null")));
    }

    @Test
    void 없는_글은_400과_ApiResponse_실패_본문을_돌려준다() throws Exception {
        mvc.perform(get("/api/wanted/999999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("구해요 글을 찾을 수 없습니다: 999999"))
                .andExpect(content().string(containsString("\"data\":null")));
    }

    @Test
    void 토큰_없이_인증_API를_부르면_로그인_화면으로_보낸다() throws Exception {
        mvc.perform(get("/api/my/profile"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "http://localhost/login"));
    }

    @Test
    void Bearer_토큰으로_내_프로필을_ApiResponse로_받는다() throws Exception {
        String token = jwtTokenProvider.createAccessToken(user.getId());
        mvc.perform(get("/api/my/profile").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(user.getId()))
                .andExpect(jsonPath("$.data.username").value("contract"))
                .andExpect(jsonPath("$.data.email").value("contract@example.com"))
                .andExpect(jsonPath("$.data.studentVerified").value(true))
                .andExpect(content().string(containsString("\"univEmail\":null")));
    }

    @Test
    void SSE_구독은_이름있는_이벤트와_ISO_Instant를_보낸다() throws Exception {
        String token = jwtTokenProvider.createAccessToken(user.getId());
        String body = mvc.perform(get("/api/notifications/stream").param("token", token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(body).contains("\nevent:notification\n");
        assertThat(body).contains("data:{\"id\":");
        assertThat(body).contains("\"type\":\"PING\"");
        assertThat(body).containsPattern("\"createdAt\":\"\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z\"");
        assertThat(body).contains("\"link\":null");
    }
}
