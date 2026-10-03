package com.hongik.books.domain.user.service;

import com.hongik.books.domain.review.place.repository.PlaceReviewRepository;
import com.hongik.books.domain.user.domain.DeactivatedUser;
import com.hongik.books.domain.user.repository.DeactivatedUserRepository;
import com.hongik.books.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AccountDeactivationService {

    private final DeactivatedUserRepository deactivatedRepo;
    private final UserRepository userRepository;
    private final PlaceReviewRepository placeReviewRepository;

    @Transactional
    public void deactivate(Long userId, String reason) {
        if (deactivatedRepo.existsByUserId(userId)) {
            // 이미 처리됨 - 멱등
            return;
        }
        deactivatedRepo.save(DeactivatedUser.builder()
                .userId(userId)
                .reason(reason)
                .deactivatedAt(LocalDateTime.now())
                .build());

        // 닉네임 마스킹(고유 보장), 이미지/인증 정보 제거
        final String maskedUsername = "탈퇴회원#" + userId;
        userRepository.maskForDeactivation(userId, maskedUsername);

        // 과거 장소 리뷰의 작성자명도 '탈퇴한 회원'으로 일괄 마스킹
        placeReviewRepository.maskUserNamesByUserId(userId, "탈퇴한 회원");
    }
}
