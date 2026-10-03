package com.hongik.books.config;

import com.hongik.books.auth.jwt.JwtAuthFilter;
import com.hongik.books.security.oauth.CustomOAuth2UserService;
import com.hongik.books.security.oauth.handler.OAuth2LoginFailureHandler;
import com.hongik.books.security.oauth.handler.OAuth2LoginSuccessHandler;
import com.hongik.books.security.oauth.repository.HttpCookieOAuth2AuthorizationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;


@Configuration
@RequiredArgsConstructor
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final OAuth2LoginFailureHandler oAuth2LoginFailureHandler;
    private final CustomOAuth2UserService customOAuth2UserService;
    // 상단 필드 부분에 한 줄 추가
    private final com.hongik.books.auth.filter.DeactivatedUserBlockFilter deactivatedUserBlockFilter;
    private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOriginsCsv;

    @Bean // 필터 체인 구성
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // REST API에서는 불필요한 CSRF 보안 비활성화
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                // JWT 토큰 인증 시스템을 사용할 것이기에 서버가 세션을 생성하지 않도록
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // HTTP 요청에 대한 인가 규칙 설정
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        // --- 누구나 접근 가능한 API ---
                        .requestMatchers(
                                "/ws-stomp/**",
                                "/actuator/health",
                                "/actuator/health/**",
                                "/uploads/**",
                                "/api/directions/**",
                                "/api/notifications/stream", // 👈 추가
                                "/", "/login", "/oauth2/**", "/error"
                        ).permitAll()
                        // 인증 관련 API는 모두 허용
                        .requestMatchers("/api/auth/**").permitAll()
                        // 학생 인증 확인 링크는 허용
                        .requestMatchers("/api/users/verify-student/confirm").permitAll()
                        // 게시글 조회(GET)와 책 검색 API는 모두 허용
                        .requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/**").permitAll()
                        // (통합으로 대체) 기존 seller/buyer-reviews 공개 경로 제거
                        // 통합 Peer 리뷰 조회(공개)
                        .requestMatchers(HttpMethod.GET, "/api/peer-reviews/users/**").permitAll()
                        // 통합 요약(공개)
                        .requestMatchers(HttpMethod.GET, "/api/reviews/summary/users/**").permitAll()
                        .requestMatchers("/api/search/**").permitAll()

                        // --- 로그인이 필요한 API ---
                        // '나의' 정보와 관련된 모든 API는 인증 필요
                        .requestMatchers("/api/my/**").authenticated()
                        // 게시글 생성, 수정, 삭제, 찜하기 등은 인증 필요
                        .requestMatchers("/api/posts/**").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers("/api/naver/**").permitAll()
                        .requestMatchers("/api/directions/**").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/places/search",
                                "/api/places/geocode",
                                "/api/places/geocode/forward",
                                "/api/places"            // 저장된 장소 목록 조회를 공개로 둘지 정책에 맞게 유지
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/places").hasAnyRole("STUDENT","ADMIN")
                        .requestMatchers(HttpMethod.GET,"/api/places/*/reviews", "/api/places/reviews/**").authenticated()
                        .requestMatchers(HttpMethod.POST,"/api/places/*/reviews", "/api/places/reviews/**").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(HttpMethod.PUT,"/api/places/*/reviews", "/api/places/reviews/**").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE,"/api/places/*/reviews", "/api/places/reviews/**").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers("/api/peer-reviews/my-received").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/peer-reviews").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/reviews/images").hasAnyRole("STUDENT", "ADMIN")
                        // 판매자/구매자 후기 작성/내가 받은 후기는 인증 필요
                        // (통합으로 대체) 기존 seller/buyer-reviews 인증 경로 제거

                        .requestMatchers(HttpMethod.POST, "/api/reviews/images").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers("/api/user-categories/**").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/wanted/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/wanted/**").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/wanted/**").hasAnyRole("STUDENT", "ADMIN")

                        .requestMatchers(HttpMethod.POST,   "/api/reports/**").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/reports/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET,    "/api/reports/**").hasRole("ADMIN")

                        // 그 외 요청은 인증 필요
                        .anyRequest().authenticated())
                // OAuth 로그인 설정
                .oauth2Login(o -> o
                        .authorizationEndpoint(auth -> auth
                                .authorizationRequestRepository(authorizationRequestRepository))
                        .successHandler(oAuth2LoginSuccessHandler)
                        .failureHandler(oAuth2LoginFailureHandler)
                        .userInfoEndpoint(u -> u
                                .userService(customOAuth2UserService))
                        .loginPage("/login") // 프론트엔드의 소셜 로그인 버튼이 있는 페이지
                )
                // JWT 인증 필터 추가
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(deactivatedUserBlockFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // CORS 전역 설정 Bean
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        // 로컬/프리뷰/배포 전부 커버
        cfg.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://hong-book-store.vercel.app",
                "https://*.vercel.app"
        ));

        // 메서드/헤더 전부 허용 (+ preflight)
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*")); // Authorization, X-USER-ID 포함
        cfg.setExposedHeaders(List.of("Authorization","Location","Link"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
