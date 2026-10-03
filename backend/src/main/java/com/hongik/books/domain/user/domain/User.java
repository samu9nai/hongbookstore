package com.hongik.books.domain.user.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder @AllArgsConstructor @Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email; // 소셜 로그인 제공자로부터 받은 이메일, 주요 식별자 역할

    @Column(nullable = false, length = 25, unique = true)
    private String username; // '로그인 아이디'가 아닌 '닉네임'으로 사용

    private String profileImagePath; // 프로필 이미지 경로

    // 역할(Role) 필드
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    private String emailVerificationToken; // 이메일 인증 위한 임시 토큰

    private LocalDateTime emailVerificationTokenExpiresAt; // 인증 토큰 만료 시각

    @Column(unique = true) // 한 학교 이메일로 한 계정만 인증 가능하도록 unique 설정
    private String univEmail; // 인증받을 대학교 이메일

    @Builder.Default
    @Column(nullable = false)
    private boolean studentVerified = false;

    @CreationTimestamp // INSERT 시 자동 세팅
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp // UPDATE 쿼리가 발생할 때, 현재 시간을 자동으로 저장
    private LocalDateTime updatedAt; // 마지막으로 수정한 시간

    // 닉네임, 프로필 이미지 등 간단한 정보 수정
    public void updateProfile(String newUsername, String newProfileImagePath) {
        if (newUsername != null && !newUsername.isBlank()) {
            this.username = newUsername;
        }
        if (newProfileImagePath != null) {
            this.profileImagePath = newProfileImagePath;
        }
    }

    // 소셜 로그인 시 닉네임은 변경하지 않고, 프로필 이미지는 이미 설정되어 있지 않은 경우에만 반영
    public User updateOAuthInfo(String name, String picture) {
        if ((this.profileImagePath == null || this.profileImagePath.isBlank()) && picture != null && !picture.isBlank()) {
            this.profileImagePath = picture;
        }
        return this;
    }

    public void setProfileImagePath(String url) {
        this.profileImagePath = url;
    }

    /**
     * 재학생 인증을 시작할 때, 사용자가 입력한 학교 이메일과 발급된 인증 토큰을 저장
     */
    public void startStudentVerification(String univEmail, String verificationToken, LocalDateTime expiresAt) {
        this.univEmail = univEmail;
        this.emailVerificationToken = verificationToken;
        this.emailVerificationTokenExpiresAt = expiresAt;
    }

    /**
     * 이메일 링크 클릭 시, 인증을 완료 처리
     * 재사용을 막기 위해 토큰은 null로
     */
    public void completeStudentVerification() {
        this.studentVerified = true;
        this.emailVerificationToken = null;
        this.emailVerificationTokenExpiresAt = null;
    }

    /**
     * 사용자의 역할을 USER에서 STUDENT로 업그레이드
     * 이미 학생이거나 관리자인 경우엔 변경하지 않습니다.
     */
    public void upgradeToStudentRole() {
        if (this.role == UserRole.USER) {
            this.role = UserRole.STUDENT;
        }
    }

    // Spring Security에서 사용자의 권한 키를 가져갈 수 있도록 getter를 제공
    public String getRoleKey() {
        return this.role.getKey();
    }
}
