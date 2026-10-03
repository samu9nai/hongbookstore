package com.hongik.books.domain.user.controller;

import com.hongik.books.auth.jwt.JwtTokenProvider;
import com.hongik.books.common.dto.ApiResponse;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.dto.LoginResponseDTO;
import com.hongik.books.domain.user.dto.UserResponseDTO;
import com.hongik.books.domain.user.dto.UserRequestDTO;
import com.hongik.books.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 일반 사용자 및 인증 관련 공용 기능을 담당하는 컨트롤러
 * (회원가입, 로그인, 이메일 인증 확인 등)
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Validated
public class UserController {
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    // TODO: 여기에 회원가입, 아이디/이메일 중복 체크 등 인증이 필요 없는 공용 API들이 위치

    /**
     * 특정 사용자 정보를 조회하는 API (주로 관리자용 또는 공개 프로필용)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getUser(@PathVariable Long userId) {
        ApiResponse<UserResponseDTO> response = userService.getUserById(userId);
        if (response.success()) {
            return ResponseEntity.ok().body(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    /**
     * 특정 사용자 정보를 수정하는 API (주로 관리자용)
     */
    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UserRequestDTO request) {
        try {
            ApiResponse<UserResponseDTO> response = userService.updateUser(userId, request);
            return ResponseEntity.ok().body(response);
        } catch (IllegalStateException e) {
            ApiResponse<UserResponseDTO> errorResponse = new ApiResponse<>(
                    false,
                    e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            ApiResponse<UserResponseDTO> errorResponse = new ApiResponse<>(
                    false,
                    "회원 정보 수정 중 오류가 발생했습니다.",
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 특정 사용자를 삭제하는 API (주로 관리자용)
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long userId) {
        ApiResponse<String> response = userService.deleteUser(userId);

        if (response.success()) {
            return ResponseEntity.ok().body(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    /**
     * 사용자가 이메일에서 링크를 클릭했을 때, 토큰을 검증하고 새 JWT를 반환하는 API
     */
    @GetMapping("/verify-student/confirm")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> confirmVerification(@RequestParam("token") String token) {
        // 1. 서비스 호출: DB에 역할 변경을 요청하고, 최신 User 정보를 받는다.
        ApiResponse<User> verificationResponse = userService.confirmStudentVerification(token);

        if (!verificationResponse.success()) {
            // 인증 실패 시, 실패 응답을 그대로 전달
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, verificationResponse.message(), null));
        }

        // 2. 토큰 생성: 서비스로부터 받은 '최신' User 정보로 새 토큰을 만든다.
        User verifiedUser = verificationResponse.data();
        String newAccessToken = jwtTokenProvider.createAccessToken(verifiedUser.getId());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(verifiedUser.getId());

        LoginResponseDTO newTokens = new LoginResponseDTO(newAccessToken, newRefreshToken);

        // 3. 최종 성공 응답: 새 토큰을 담아서 클라이언트에게 전달
        ApiResponse<LoginResponseDTO> finalResponse = new ApiResponse<>(
                true,
                verificationResponse.message(), // 서비스가 전달한 성공 메시지 사용
                newTokens
        );

        return ResponseEntity.ok(finalResponse);
    }
}
