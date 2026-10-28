package com.hongik.books;

import com.hongik.books.auth.jwt.JwtTokenProvider;
import com.hongik.books.auth.jwt.JwtTokenRedisRepository;
import com.hongik.books.domain.book.domain.Book;
import com.hongik.books.domain.book.repository.BookRepository;
import com.hongik.books.domain.chat.domain.ChatRoom;
import com.hongik.books.domain.chat.repository.ChatMessageRepository;
import com.hongik.books.domain.chat.repository.ChatRoomRepository;
import com.hongik.books.domain.post.domain.Condition;
import com.hongik.books.domain.post.domain.SalePost;
import com.hongik.books.domain.post.repository.SalePostRepository;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.domain.UserRole;
import com.hongik.books.domain.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 채팅 REST API가 방 참가자만 방 정보와 메시지 이력을 보여 주고,
 * 채팅방의 구매자를 요청 값이 아니라 인증 주체로 정하는지 확인한다(SEC-04 REST 부분, #83).
 */
@SpringBootTest
@ActiveProfiles("test")
class ChatRoomAccessTest {

    @Autowired WebApplicationContext context;
    @Autowired UserRepository userRepository;
    @Autowired BookRepository bookRepository;
    @Autowired SalePostRepository salePostRepository;
    @Autowired ChatRoomRepository chatRoomRepository;
    @Autowired ChatMessageRepository chatMessageRepository;
    @Autowired JwtTokenProvider jwtTokenProvider;

    @MockitoBean JwtTokenRedisRepository jwtTokenRedisRepository;

    MockMvc mvc;
    User seller;
    User buyer;
    User stranger;
    SalePost salePost;
    ChatRoom room;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        cleanUp();
        seller = saveStudent("seller@example.com", "seller");
        buyer = saveStudent("buyer@example.com", "buyer");
        stranger = saveStudent("stranger@example.com", "stranger");
        Book book = bookRepository.save(Book.builder()
                .title("자료구조")
                .author("홍길동")
                .publisher("홍익출판")
                .isCustom(true)
                .build());
        salePost = salePostRepository.save(SalePost.builder()
                .seller(seller)
                .book(book)
                .postTitle("자료구조 팝니다")
                .postContent("깨끗해요")
                .price(10000)
                .status(SalePost.SaleStatus.FOR_SALE)
                .writingCondition(Condition.HIGH)
                .tearCondition(Condition.HIGH)
                .waterCondition(Condition.HIGH)
                .negotiable(false)
                .oncampusPlaceCode("A")
                .offcampusStationCode("HONGIK")
                .build());
        room = chatRoomRepository.save(ChatRoom.builder()
                .salePost(salePost)
                .buyer(buyer)
                .seller(seller)
                .userAId(seller.getId())
                .userBId(buyer.getId())
                .build());
    }

    // 다른 테스트 클래스가 같은 H2 DB에서 회원을 지우므로, 회원을 참조하는 행을 남기지 않는다.
    @AfterEach
    void cleanUp() {
        chatMessageRepository.deleteAll();
        chatRoomRepository.deleteAll();
        salePostRepository.deleteAll();
        bookRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void 참가자가_아니면_채팅방_정보를_볼_수_없다() throws Exception {
        mvc.perform(get("/api/chat/rooms/" + room.getId())
                        .header("Authorization", bearer(stranger)))
                .andExpect(status().isForbidden());
    }

    @Test
    void 참가자가_아니면_메시지_이력을_볼_수_없다() throws Exception {
        mvc.perform(get("/api/chat/room/" + room.getId() + "/messages")
                        .header("Authorization", bearer(stranger)))
                .andExpect(status().isForbidden());
    }

    @Test
    void 구매자와_판매자는_채팅방_정보와_메시지_이력을_본다() throws Exception {
        for (User participant : new User[]{buyer, seller}) {
            mvc.perform(get("/api/chat/rooms/" + room.getId())
                            .header("Authorization", bearer(participant)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(room.getId()));
            mvc.perform(get("/api/chat/room/" + room.getId() + "/messages")
                            .header("Authorization", bearer(participant)))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void 채팅방_구매자는_buyerId_파라미터가_아니라_로그인한_사용자다() throws Exception {
        mvc.perform(post("/api/chat/rooms")
                        .header("Authorization", bearer(stranger))
                        .param("salePostId", salePost.getId().toString())
                        .param("buyerId", buyer.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.not(room.getId().intValue())))
                .andExpect(jsonPath("$.buyerId").value(stranger.getId()));
    }

    @Test
    void buyerId_없이_채팅방을_만들고_같은_요청은_기존_방을_돌려준다() throws Exception {
        mvc.perform(post("/api/chat/rooms")
                        .header("Authorization", bearer(buyer))
                        .param("salePostId", salePost.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(room.getId()))
                .andExpect(jsonPath("$.buyerId").value(buyer.getId()));
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
