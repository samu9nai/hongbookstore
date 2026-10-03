package com.hongik.books.security.oauth.handler;

import com.hongik.books.auth.jwt.JwtTokenProvider;

import com.hongik.books.security.oauth.CustomOAuth2User;
import com.hongik.books.security.oauth.repository.HttpCookieOAuth2AuthorizationRequestRepository;
import com.hongik.books.domain.user.domain.CustomUserDetails;
import com.hongik.books.domain.user.domain.User;
import org.springframework.beans.factory.annotation.Value;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JwtTokenProvider jwtTokenProvider;
    private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;

    // 프론트엔드 베이스 URL (예: https://<project>.vercel.app)
    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        // Authentication 객체에서 Principal(사용자 정보)을 꺼낸다.
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();

        // Principal에서 우리 서비스의 사용자 고유 ID(PK)를 추출
        Long userId = oAuth2User.getUser().getId();

        // 추출한 사용자 ID를 사용하여 JWT 토큰을 생성
        String accessToken = jwtTokenProvider.createAccessToken(userId);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);
        log.info("소셜 로그인 성공. 사용자 ID: {}, Access Token 발급 완료.", userId);

        // 프론트엔드로 리다이렉트할 URL에 토큰들을 쿼리 파라미터로 추가
        String targetUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/oauth/callback")
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        authorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        // 생성된 URL로 리다이렉트
        // clearAuthenticationAttributes(request); // 로그인 과정에서 생성된 임시 세션 정보를 삭제
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
