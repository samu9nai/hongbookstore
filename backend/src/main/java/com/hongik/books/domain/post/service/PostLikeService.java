package com.hongik.books.domain.post.service;

import com.hongik.books.domain.post.domain.PostLike;
import com.hongik.books.domain.post.domain.SalePost;
import com.hongik.books.domain.post.dto.MyLikedPostResponseDTO;
import com.hongik.books.domain.post.repository.PostLikeRepository;
import com.hongik.books.domain.post.repository.SalePostRepository;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * '찜하기' 관련 비즈니스 로직을 처리하는 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본적으로 읽기 전용으로 설정
public class PostLikeService {

    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    private final SalePostRepository salePostRepository;

    /**
     * 게시글을 찜하기
     */
    @Transactional
    public void likePost(Long postId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        SalePost salePost = salePostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        // 이미 찜한 게시물인지 확인
        if (postLikeRepository.findByUserIdAndSalePostId(userId, postId).isPresent()) {
            // 이미 찜했다면 아무것도 하지 않거나, 예외를 던질 수 있습니다.
            return;
        }

        PostLike postLike = PostLike.builder()
                .user(user)
                .salePost(salePost)
                .build();

        postLikeRepository.save(postLike);
    }

    /**
     * 게시글 찜을 취소
     */
    @Transactional
    public void unlikePost(Long postId, Long userId) {
        PostLike postLike = postLikeRepository.findByUserIdAndSalePostId(userId, postId)
                .orElseThrow(() -> new IllegalArgumentException("찜하지 않은 게시글입니다."));

        postLikeRepository.delete(postLike);
    }

    /**
     * 내가 찜한 모든 게시글 목록을 조회
     */
    public List<MyLikedPostResponseDTO> getMyLikedPosts(Long userId) {
        // 1. 사용자 ID로 모든 찜 정보를 가져오기
        List<PostLike> myLikes = postLikeRepository.findAllByUserId(userId);

        // 2. 각 찜 정보(PostLike)를 MyLikedPostResponse DTO로 변환하여 리스트로 반환
        return myLikes.stream()
                .map(MyLikedPostResponseDTO::from)
                .collect(Collectors.toList());
    }
}
