package com.hongik.books.auth.filter;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.user.repository.DeactivatedUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class DeactivatedUserBlockFilter extends OncePerRequestFilter {

    private final DeactivatedUserRepository deactivatedUserRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof LoginUserDTO loginUser) {
            Long userId = loginUser.id();
            if (userId != null && deactivatedUserRepository.existsByUserId(userId)) {
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"success\":false,\"message\":\"탈퇴 처리된 계정입니다. 다시 로그인할 수 없습니다.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
