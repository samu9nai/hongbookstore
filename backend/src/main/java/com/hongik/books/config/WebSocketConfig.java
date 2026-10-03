package com.hongik.books.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker // ✅ 이게 있어야 함!
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns("*") // 필요 시 프론트 포트
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/sub", "/queue"); // 일반 구독 + 유저 큐 지원
        registry.setApplicationDestinationPrefixes("/pub"); // 클라이언트가 보낼 때 prefix
        registry.setUserDestinationPrefix("/user"); // convertAndSendToUser 대상 접두사
    }
}
