package com.hongik.books.auth.jwt;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.user.domain.CustomUserDetails;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// JWT 토큰을 사용해 인증을 처리하는 필터
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtTokenRedisRepository jwtTokenRedisRepository;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // JWT 토큰 추출
        final String token = jwtTokenProvider.resolveToken(request);

        try {
            // JWT 토큰 추출
            if (token != null && jwtTokenProvider.validateToken(token)) {
                // Redis에 해당 토큰이 블랙리스트(로그아웃 또는 사용 완료)로 등록되어 있는지 확인
                if (jwtTokenRedisRepository.hasKey(token)) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "사용할 수 없는 토큰입니다.");
                    return;
                }

                // 토큰에서 사용자 ID (Primary Key)를 직접 추출
                Long userId = jwtTokenProvider.getUserIdFromToken(token); // (❗️ JwtTokenProvider에 이 메서드 추가 필요)

                // ID를 사용하여 데이터베이스에서 사용자 정보를 직접 조회
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new UsernameNotFoundException("해당 ID의 사용자를 찾을 수 없습니다: " + userId));

                // 조회된 User 엔티티로 인증 객체 생성
                CustomUserDetails userDetails = new CustomUserDetails(user);

                // 인증 객체 생성
                // LoginUserDTO 에는 사용자의 고유 ID와 식별 가능한 정보(예: 이메일)
                LoginUserDTO loginUser = new LoginUserDTO(userDetails.getUser().getId(), userDetails.getUser().getEmail());
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        loginUser, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // SecurityContext에 인증 객체 설정
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (ExpiredJwtException e) {
            // 액세스 토큰 만료 시 리프레시 토큰으로 재발급 로직
            logger.warn("만료된 JWT 토큰입니다.", e);
        } catch (Exception e) {
            logger.error("JWT 필터에서 오류가 발생했습니다.", e);
            SecurityContextHolder.clearContext();
        }

        // 다음 필터로 요청 전달
        filterChain.doFilter(request, response);
    }
}
