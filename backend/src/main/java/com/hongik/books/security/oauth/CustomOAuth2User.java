package com.hongik.books.security.oauth;

import com.hongik.books.domain.user.domain.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

import java.util.Collection;
import java.util.Map;

@Getter
public class CustomOAuth2User extends DefaultOAuth2User {
    // 우리 서비스의 User 엔티티를 필드로 가짐
    private final User user;

    /**
     * Constructs a new {@code CustomOAuth2User}.
     *
     * @param authorities      the authorities granted to the user
     * @param attributes       the attributes about the user
     * @param nameAttributeKey the key used to access the user's name from the attributes map
     * @param user             우리 애플리케이션의 User 엔티티
     */
    public CustomOAuth2User(Collection<? extends GrantedAuthority> authorities,
                            Map<String, Object> attributes, String nameAttributeKey,
                            User user) {
        super(authorities, attributes, nameAttributeKey);
        this.user = user;
    }

    // 편의를 위해 User의 이메일을 바로 가져오는 getter를 추가할 수 있습니다.
    public String getEmail() {
        return user.getEmail();
    }
}
