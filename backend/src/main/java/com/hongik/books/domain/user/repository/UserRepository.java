package com.hongik.books.domain.user.repository;

import com.hongik.books.domain.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);

    /**
     * 이메일 인증 토큰으로 사용자를 찾기
     */
    Optional<User> findByEmailVerificationToken(String token);

    /**
     * 이미 해당 학교 이메일로 인증을 완료한 사용자가 있는지 확인
     */
    boolean existsByUnivEmailAndStudentVerifiedIsTrue(String univEmail);

    /**
     * 탈퇴 처리 시 개인정보 노출을 최소화하기 위한 마스킹
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update User u
           set u.username = :username,
               u.profileImagePath = null,
               u.studentVerified = false,
               u.univEmail = null,
               u.emailVerificationToken = null,
               u.emailVerificationTokenExpiresAt = null
         where u.id = :userId
    """)
    int maskForDeactivation(@Param("userId") Long userId, @Param("username") String username);
}
