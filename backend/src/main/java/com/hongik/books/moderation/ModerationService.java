package com.hongik.books.moderation;

import com.hongik.books.common.exception.ModerationException;
import com.hongik.books.moderation.toxic.ToxicFilterClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final ToxicFilterClient toxicFilterClient;

    /**
     * 정책 모드에 따라 검사/차단을 수행하고, 결과를 반환합니다.
     * - OFF: null 반환(검사 생략)
     * - WARN: check() 결과 반환(차단하지 않음)
     * - BLOCK: 차단 기준을 충족하면 ModerationException 발생, 아니면 결과 반환
     */
    public ToxicFilterClient.Result checkOrThrow(String text, ModerationPolicyProperties.Mode mode, String fieldName) {
        if (mode == ModerationPolicyProperties.Mode.OFF) {
            return null; // 검사 생략
        }

        ToxicFilterClient.Result r = toxicFilterClient.check(text);
        if (mode == ModerationPolicyProperties.Mode.BLOCK && r.blocked()) {
            // 도메인 공통 예외 형태 유지
            throw new ModerationException(
                    "부적절한 표현이 감지되었습니다.",
                    fieldName,
                    r.predictionLevel(),
                    r.malicious(),
                    r.clean(),
                    r.reason(),
                    r.text(),
                    r.flaggedSegments()
            );
        }
        return r; // WARN 또는 BLOCK-허용
    }
}
