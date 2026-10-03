package com.hongik.books.domain.post.controller;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.post.dto.*;
import com.hongik.books.domain.post.service.SalePostService;
import com.hongik.books.domain.post.service.RecentlyViewedPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Sort;

import java.io.IOException;
import java.net.URI;
import java.util.List;

/**
 * 판매 게시글 관련 API 요청을 처리하는 컨트롤러
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class SalePostController {
    private final SalePostService salePostService;
    private final RecentlyViewedPostService recentlyViewedPostService;

    /**
     * 판매 게시글 목록을 페이지네이션및 동적 조건으로 조회하는 API
     * [GET] /api/posts?query=자바&page=0&size=10&sort=createdAt,desc
     */
    @GetMapping
    public ResponseEntity<Page<SalePostSummaryResponseDTO>> getSalePosts(
            @Validated @ModelAttribute PostSearchCondition condition, // @ModelAttribute로 검색 조건 DTO를 받음
            @PageableDefault(size = 10, sort = "createdAt,desc") Pageable pageable) {

        Page<SalePostSummaryResponseDTO> posts = salePostService.getSalePosts(condition, pageable);
        return ResponseEntity.ok(posts);
    }

    /**
     * 특정 판매 게시글의 상세 정보를 조회하는 API
     * [GET] /api/posts/{postId}
     * @param postId URL 경로에 포함된 게시글 ID
     */
    @GetMapping("/{postId}")
    public ResponseEntity<SalePostDetailResponseDTO> getSalePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal LoginUserDTO loginUser) {
        SalePostDetailResponseDTO response = salePostService.getSalePostById(postId);
        // 로그인 사용자라면 최근 본 게시글 기록 (실패해도 본문 응답은 유지)
        if (loginUser != null) {
            try {
                recentlyViewedPostService.recordView(loginUser.id(), postId);
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(response);
    }

    /**
     * 내 최근 본 판매 게시글 목록 조회 (최대 10개)
     * [GET] /api/posts/recent?limit=10
     */
    @GetMapping("/recent")
    public ResponseEntity<List<SalePostSummaryResponseDTO>> getMyRecentlyViewed(
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @AuthenticationPrincipal LoginUserDTO loginUser) {
        if (loginUser == null) {
            return ResponseEntity.ok(List.of());
        }
        List<SalePostSummaryResponseDTO> list = recentlyViewedPostService.list(loginUser.id(), Math.min(Math.max(limit, 5), 10));
        return ResponseEntity.ok(list);
    }

    /**
     * [ISBN 조회된 책]으로 새 판매 게시글을 생성하는 API
     * [POST] /api/posts
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> createSalePostFromSearch(
            @RequestPart("request") @Valid SalePostCreateRequestDTO request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal LoginUserDTO loginUser) throws IOException{
        // 실제 로그인한 사용자의 ID를 서비스에 전달
        Long postId = salePostService.createSalePostFromSearch(request, images, loginUser.id());
        return ResponseEntity.created(URI.create("/api/posts/" + postId)).build();
    }

    /**
     * ISBN 없는 경우 (프린트물 교재 등)
     * [직접 등록]으로 새 판매 게시글을 생성하는 API
     * [POST] /api/posts/custom
     */
    @PostMapping(value = "/custom", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> createSalePostCustom(
            @RequestPart("request") @Valid SalePostCustomCreateRequestDTO request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal LoginUserDTO loginUser) throws IOException {
        Long postId = salePostService.createSalePostCustom(request, images, loginUser.id());
        return ResponseEntity.created(URI.create("/api/posts/" + postId)).build();
    }

    /**
     * 내 판매글 목록을 조회하는 API
     * [GET] /api/my/posts
     */
    @GetMapping("/my")
    public ResponseEntity<List<MyPostSummaryResponseDTO>> getMySalePosts(@AuthenticationPrincipal LoginUserDTO loginUser) {
        List<MyPostSummaryResponseDTO> myPosts = salePostService.getMySalePosts(loginUser.id());
        return ResponseEntity.ok(myPosts);
    }

    /**
     * 특정 판매 게시글을 수정하는 API
     * [PATCH] /api/posts/{postId}
     */
    @PatchMapping("/{postId}")
    public ResponseEntity<Void> updateSalePost(
            @PathVariable Long postId,
            @RequestBody @Valid SalePostUpdateRequestDTO request,
            @AuthenticationPrincipal LoginUserDTO loginUser) {
        salePostService.updateSalePost(postId, request, loginUser.id());
        return ResponseEntity.ok().build();
    }

    /**
     * 판매 게시글 수정 시, 이미지 추가 업로드 전용 API
     * [POST] /api/posts/{postId}/images
     */
    @PostMapping(value = "/{postId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> addSalePostImages(
            @PathVariable Long postId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal LoginUserDTO loginUser) throws IOException {
        salePostService.addImagesToPost(postId, images, loginUser.id());
        return ResponseEntity.ok().build();
    }

    /**
     * 특정 판매 게시글을 삭제하는 API
     * [DELETE] /api/posts/{postId}
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deleteSalePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal LoginUserDTO loginUser) {

        salePostService.deleteSalePost(postId, loginUser.id());
        return ResponseEntity.noContent().build(); // 내용 없이 성공(204 No Content) 응답
    }

    /**
     * 판매 게시글의 상태를 변경하는 API
     * [PATCH] /api/posts/{postId}/status
     */
    @PatchMapping("/{postId}/status")
    public ResponseEntity<Void> updateSalePostStatus(
            @PathVariable Long postId,
            @RequestBody SalePostStatusUpdateRequestDTO request,
            @AuthenticationPrincipal LoginUserDTO loginUser) {
        salePostService.updateSalePostStatus(postId, request, loginUser.id());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<SalePostSummaryResponseDTO>> getSellerPosts(
            @PathVariable Long sellerId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(salePostService.getSellerPosts(sellerId, limit));
    }

}
