package com.hongik.books.security.oauth.info;

import java.util.Map;

public class NaverOAuth2UserInfo extends OAuth2UserInfo {
    public NaverOAuth2UserInfo(Map<String, Object> attributes) {
        // 네이버의 경우 attributes 내부에 "response" 라는 키로 실제 사용자 정보가 들어있습니다.
        // 따라서 super 생성자를 호출할 때 "response" 맵을 넘겨줍니다.
        super((Map<String, Object>) attributes.get("response"));
    }

    @Override
    public String getId() {
        return (String) attributes.get("id");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getPicture() {
        return (String) attributes.get("profile_image");
    }
}
