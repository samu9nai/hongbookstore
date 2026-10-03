package com.hongik.books.domain.mypage.controller;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.common.dto.ApiResponse;
import com.hongik.books.domain.post.dto.MyLikedPostResponseDTO;
import com.hongik.books.domain.post.dto.MyPostSummaryResponseDTO;
import com.hongik.books.domain.post.service.PostLikeService;
import com.hongik.books.domain.post.service.SalePostService;
import com.hongik.books.domain.user.dto.StudentVerificationRequestDTO;
import com.hongik.books.domain.user.dto.UserRequestDTO;
import com.hongik.books.domain.user.dto.UserResponseDTO;
import com.hongik.books.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpHeaders; // ← 추가

import java.io.IOException;
import java.util.List;

/**
 * '나의 정보' 관련 API 요청을 처리하는 컨트롤러
 * 모든 API는 @AuthenticationPrincipal을 통해 인증된 사용자 정보를 기반으로 동작
 */
@RestController
@RequestMapping("/api/my") // '나의' 정보 관련 API는 /api/my 경로로 그룹화
@RequiredArgsConstructor
public class MyPageController {

    private final UserService userService;
    private final SalePostService salePostService;
    private final PostLikeService postLikeService;

    private final com.hongik.books.domain.user.service.AccountDeactivationService accountDeactivationService;
    private final com.hongik.books.auth.service.AuthService authService;

    /**
     * 내 프로필 정보를 조회하는 API
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getMyProfile(
            @AuthenticationPrincipal LoginUserDTO loginUser) {
        ApiResponse<UserResponseDTO> response = userService.getUserById(loginUser.id());
        return ResponseEntity.ok(response);
    }

    /**
     * 내 프로필(닉네임/프로필 이미지 URL)을 수정하는 API
     * - 파일 업로드가 필요한 경우 먼저 /api/my/profile-image로 이미지 업로드 후 반환된 URL을 전달하세요.
     */
    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateMyProfile(
            @AuthenticationPrincipal LoginUserDTO loginUser,
            @Valid @RequestBody UserRequestDTO request) {
        ApiResponse<UserResponseDTO> response = userService.updateUser(loginUser.id(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * 내가 쓴 판매글 목록을 조회하는 API
     */
    @GetMapping("/posts")
    public ResponseEntity<List<MyPostSummaryResponseDTO>> getMySalePosts(
            @AuthenticationPrincipal LoginUserDTO loginUser) {
        List<MyPostSummaryResponseDTO> myPosts = salePostService.getMySalePosts(loginUser.id());
        return ResponseEntity.ok(myPosts);
    }

    /**
     * 내가 찜한 모든 게시글 목록을 조회하는 API
     */
    @GetMapping("/likes")
    public ResponseEntity<List<MyLikedPostResponseDTO>> getMyLikedPosts(
            @AuthenticationPrincipal LoginUserDTO loginUser) {
        List<MyLikedPostResponseDTO> myLikedPosts = postLikeService.getMyLikedPosts(loginUser.id());
        return ResponseEntity.ok(myLikedPosts);
    }

    /**
     * 학생 인증을 위한 이메일 발송을 요청하는 API
     */
    @PostMapping("/verification/request-code")
    public ResponseEntity<ApiResponse<Void>> requestVerification(
            @AuthenticationPrincipal LoginUserDTO loginUser,
            @Valid @RequestBody StudentVerificationRequestDTO request) {
        ApiResponse<Void> response = userService.requestStudentVerification(loginUser.id(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * 내 프로필 이미지를 변경하는 API (이미지 업로드)
     */
    @PostMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updateProfileImage(
            @RequestPart("image") MultipartFile image,
            @AuthenticationPrincipal LoginUserDTO loginUser) throws IOException {
        String newImageUrl = userService.updateProfileImage(loginUser.id(), image);
        return ResponseEntity.ok(newImageUrl);
    }

    @PostMapping("/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(
            @AuthenticationPrincipal LoginUserDTO loginUser,
            @RequestBody(required = false) com.hongik.books.domain.user.dto.AccountDeactivateRequestDTO request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
    ) {
        String reason = (request != null) ? request.getReason() : null;
        accountDeactivationService.deactivate(loginUser.id(), reason);

        // 현재 액세스 토큰 블랙리스트 등록(서버측 로그아웃)
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            try { authService.logout(authorizationHeader.substring(7)); } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "계정이 탈퇴 처리되었습니다.", null));
    }

}
