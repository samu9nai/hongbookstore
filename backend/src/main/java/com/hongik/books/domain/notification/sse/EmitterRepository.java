package com.hongik.books.domain.notification.sse;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class EmitterRepository {

    private final Map<Long, Map<String, SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter add(Long userId, SseEmitter emitter) {
        emitters.computeIfAbsent(userId, k -> new ConcurrentHashMap<>())
                .put(emitter.toString(), emitter);
        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(e -> remove(userId, emitter));
        return emitter;
    }

    public Map<String, SseEmitter> get(Long userId) {
        return emitters.getOrDefault(userId, Map.of());
    }

    public void remove(Long userId, SseEmitter emitter) {
        Map<String, SseEmitter> map = emitters.get(userId);
        if (map != null) {
            map.remove(emitter.toString());
            if (map.isEmpty()) {
                emitters.remove(userId);
            }
        }
    }
}
