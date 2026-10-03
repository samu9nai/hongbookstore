package com.hongik.books.domain.post.controller;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.post.service.PostLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * '찜하기' 관련 API 요청을 처리하는 컨트롤러
 */
@RestController
@RequestMapping("/api/posts/{postId}/like")
@RequiredArgsConstructor
public class PostLikeController {

    private final PostLikeService postLikeService;

    /**
     * 게시글을 찜하는 API
     * [POST] /api/posts/{postId}/like
     */
    @PostMapping
    public ResponseEntity<Void> likePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal LoginUserDTO loginUser) {
        postLikeService.likePost(postId, loginUser.id());
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글 찜을 취소하는 API
     * [DELETE] /api/posts/{postId}/like
     */
    @DeleteMapping
    public ResponseEntity<Void> unlikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal LoginUserDTO loginUser) {
        postLikeService.unlikePost(postId, loginUser.id());
        return ResponseEntity.noContent().build();
    }
}