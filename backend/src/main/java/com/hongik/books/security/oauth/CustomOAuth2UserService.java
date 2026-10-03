package com.hongik.books.security.oauth;

import com.hongik.books.security.oauth.info.OAuth2UserInfo;
import com.hongik.books.security.oauth.info.OAuth2UserInfoFactory;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.domain.UserRole;
import com.hongik.books.domain.user.repository.UserRepository;
import com.hongik.books.common.util.ImageStorage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final ImageStorage imageStorage;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 기본 OAuth2UserService를 사용하여 OAuth2User 객체를 로드
        OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);

        // 현재 로그인 진행 중인 서비스를 구분 (google, naver, kakao...)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // OAuth2 사용자 정보에서 고유 식별자(PK)로 사용될 속성 이름을 가져옴
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        // OAuth2UserInfoFactory를 사용하여, 서비스에 맞는 OAuth2UserInfo 구현체를 가져옴
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());

        // UserInfo를 바탕으로 DB에서 사용자를 찾거나, 없으면 새로 생성(회원가입)하고, 그 결과를 User 객체로
        User user = saveOrUpdateUser(userInfo);

        // 최종적으로 우리 서비스의 User 엔티티를 담은 CustomOAuth2User 객체를 생성하여 반환
        // 이 객체가 Spring Security의 인증 객체(Authentication)에 담겨 SuccessHandler로 전달
        return new CustomOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(user.getRoleKey())), // 사용자의 권한 정보
                oAuth2User.getAttributes(),
                userNameAttributeName,
                user // DB에 저장된 최종 User 엔티티
        );
    }

    /**
     * 소셜 로그인 정보를 바탕으로 사용자를 저장하거나 업데이트
     * @param userInfo 소셜 서비스에서 받아온 사용자 정보
     * @return 저장되거나 업데이트된 User 엔티티
     */
    private User saveOrUpdateUser(OAuth2UserInfo userInfo) {
        // 이메일로 사용자를 찾기
        User user = userRepository.findByEmail(userInfo.getEmail())
                .map(entity -> {
                    // 기존 유저: 닉네임은 유지, 프로필 이미지가 비어있다면 provider 이미지를 GCS로 업로드 후 세팅
                    if ((entity.getProfileImagePath() == null || entity.getProfileImagePath().isBlank())
                            && userInfo.getPicture() != null && !userInfo.getPicture().isBlank()) {
                        String gcs = tryUploadProviderImage(userInfo.getPicture());
                        if (gcs != null) entity.setProfileImagePath(gcs);
                    }
                    // 이름/실명으로 닉네임을 덮어쓰지 않음
                    return entity;
                })
                .orElseGet(() -> createNewUser(userInfo));

        return userRepository.save(user); // 저장 후 User 엔티티를 반환
    }

    /**
     * 소셜 로그인 정보를 바탕으로 새로운 사용자를 생성
     * @param userInfo 소셜 서비스에서 받아온 사용자 정보
     * @return 새로 생성된 User 엔티티
     */
    private User createNewUser(OAuth2UserInfo userInfo) {
        log.info("신규 회원가입을 시작합니다: {}", userInfo.getEmail());
        String email = userInfo.getEmail();
        String baseName = deriveNicknameFromEmail(email);
        String uniqueName = ensureUniqueUsername(baseName);
        String gcsImage = tryUploadProviderImage(userInfo.getPicture());
        return User.builder()
                .username(uniqueName)
                .email(userInfo.getEmail())
                .profileImagePath(gcsImage)
                .role(UserRole.USER) // 기본 역할
                .studentVerified(false) // 재학생 인증은 아직 안 된 상태
                .build();
    }

    // 사용자명이 중복일 경우 -1, -2 ... 식으로 접미사를 붙여 고유화
    private String ensureUniqueUsername(String base) {
        String candidate = (base == null || base.isBlank()) ? "user" : base.trim();
        int i = 0;
        while (userRepository.existsByUsername(candidate)) {
            i++;
            String suffix = "-" + i;
            int maxLen = 50; // User.username 컬럼 길이
            int allowed = Math.max(1, maxLen - suffix.length());
            String head = candidate.length() > allowed ? candidate.substring(0, allowed) : candidate;
            candidate = head + suffix;
            if (i > 9999) break; // 비정상 루프 보호
        }
        return candidate;
    }

    private String safeTrim(String s, int maxLen) {
        if (s == null) return "";
        String t = s.trim();
        return t.length() > maxLen ? t.substring(0, maxLen) : t;
    }

    private String deriveNicknameFromEmail(String email) {
        String fallback = "user";
        if (email == null || email.isBlank() || !email.contains("@")) return fallback;
        String local = email.substring(0, email.indexOf('@'));
        // 허용 문자만 남기고, 빈 값이면 fallback
        String sanitized = local.replaceAll("[^a-zA-Z0-9._-]", "");
        if (sanitized.isBlank()) sanitized = fallback;
        // 길이 제한 고려해 트림
        return safeTrim(sanitized, 40);
    }

    private String tryUploadProviderImage(String providerUrl) {
        if (providerUrl == null || providerUrl.isBlank()) return null;
        try {
            return imageStorage.uploadImageFromUrl(providerUrl, "profile-images");
        } catch (Exception e) {
            log.warn("Failed to upload provider image to GCS: {}", e.getMessage());
            return null;
        }
    }
}
