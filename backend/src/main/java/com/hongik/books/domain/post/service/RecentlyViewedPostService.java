package com.hongik.books.domain.post.service;

import com.hongik.books.domain.post.domain.RecentlyViewedPost;
import com.hongik.books.domain.post.domain.SalePost;
import com.hongik.books.domain.post.dto.SalePostSummaryResponseDTO;
import com.hongik.books.domain.post.repository.RecentlyViewedPostRepository;
import com.hongik.books.domain.post.repository.SalePostRepository;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RecentlyViewedPostService {

    private final RecentlyViewedPostRepository recentlyViewedPostRepository;
    private final UserRepository userRepository;
    private final SalePostRepository salePostRepository;

    // 보관 최대 개수 (서버단 안전장치)
    private static final int MAX_RECENT = 50;

    public void recordView(Long userId, Long postId) {
        if (userId == null || postId == null) return;

        Optional<RecentlyViewedPost> existing = recentlyViewedPostRepository.findByUserIdAndSalePostId(userId, postId);
        if (existing.isPresent()) {
            existing.get().touchViewedAt();
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
            SalePost post = salePostRepository.findById(postId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글 ID입니다."));
            RecentlyViewedPost newRec = new RecentlyViewedPost(user, post);
            recentlyViewedPostRepository.save(newRec);
        }

        trimIfNeeded(userId);
    }

    @Transactional(readOnly = true)
    public List<SalePostSummaryResponseDTO> list(Long userId, int limit) {
        if (userId == null) return List.of();
        List<RecentlyViewedPost> records = (limit <= 5)
                ? recentlyViewedPostRepository.findTop5ByUserIdOrderByViewedAtDesc(userId)
                : recentlyViewedPostRepository.findTop10ByUserIdOrderByViewedAtDesc(userId);

        return records.stream()
                .map(r -> SalePostSummaryResponseDTO.fromEntity(r.getSalePost()))
                .collect(Collectors.toList());
    }

    private void trimIfNeeded(Long userId) {
        long count = recentlyViewedPostRepository.countByUserId(userId);
        if (count <= MAX_RECENT) return;
        List<Long> ids = recentlyViewedPostRepository.findIdsByUserOrderByViewedAtDesc(userId);
        // 보관 상위 MAX_RECENT만 유지, 나머지 삭제
        List<Long> toDelete = ids.subList(MAX_RECENT, ids.size());
        recentlyViewedPostRepository.deleteAllById(toDelete);
    }
}

