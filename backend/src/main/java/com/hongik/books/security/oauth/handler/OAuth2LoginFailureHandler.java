package com.hongik.books.security.oauth.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.hongik.books.security.oauth.repository.HttpCookieOAuth2AuthorizationRequestRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {
    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;
    private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        // 1. 실패 원인은 서버 로그에 자세히 기록하여 개발자가 확인할 수 있도록 합니다.
        log.error("소셜 로그인에 실패했습니다. 에러 메시지: {}", exception.getMessage());
        log.error("에러 스택 트레이스:", exception);

        authorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        // 2. JSON 응답 대신, 프론트엔드의 로그인 페이지로 리다이렉트 시킵니다.
        //    에러 정보를 쿼리 파라미터로 전달하여 프론트에서 활용할 수 있도록 합니다.
        String baseUrl = frontendBaseUrl != null && frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
        String targetUrl = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/login")
                .queryParam("error", "social_login_failed") // 에러 코드나 메시지를 전달
                .build().toUriString();

        // 3. 생성된 URL로 리다이렉트 실행
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
