package com.hongik.books.domain.comment.controller;

import com.hongik.books.common.dto.ApiResponse; // ⬅️ 네 패키지에 맞춤
import com.hongik.books.domain.comment.dto.CommentCreateRequest;
import com.hongik.books.domain.comment.dto.WantedCommentDto;
import com.hongik.books.domain.comment.service.WantedCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/wanted")
public class WantedCommentController {

    private final WantedCommentService commentService;

    /** 댓글 목록 */
    @GetMapping("/{wantedId}/comments")
    public ApiResponse<List<WantedCommentDto>> list(@PathVariable Long wantedId) {
        var list = commentService.getList(wantedId);
        return new ApiResponse<>(true, "OK", list);
    }

    /** 원댓글 작성 */
    @PostMapping("/{wantedId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WantedCommentDto> createRoot(
            @PathVariable Long wantedId,
            @RequestBody CommentCreateRequest req
    ) {
        var user = commentService.getCurrentUserOrThrow();
        var saved = commentService.addRoot(wantedId, req, user.id(), user.nickname());
        return new ApiResponse<>(true, "CREATED", saved);
    }

    /** 대댓글 작성 */
    @PostMapping("/{wantedId}/comments/{parentId}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WantedCommentDto> createReply(
            @PathVariable Long wantedId,
            @PathVariable Long parentId,
            @RequestBody CommentCreateRequest req
    ) {
        var user = commentService.getCurrentUserOrThrow();
        var saved = commentService.addReply(wantedId, parentId, req, user.id(), user.nickname());
        return new ApiResponse<>(true, "CREATED", saved);
    }

    /** 댓글 삭제(소프트 삭제) — 204 반환 */
    @DeleteMapping("/{wantedId}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long wantedId,
            @PathVariable Long commentId
    ) {
        var user = commentService.getCurrentUserOrThrow();
        commentService.delete(wantedId, commentId, user.id());
    }
}
