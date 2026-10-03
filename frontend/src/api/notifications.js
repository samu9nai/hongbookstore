let _es = null;          // 단일 SSE 연결
let _retryTimer = null;  // 재연결 타이머

function safeEnv() {
    try {
        return import.meta?.env ?? {};
    } catch {
        return {};
    }
}

function resolveBackendOrigin() {
    const env = safeEnv();
    const pageHttps = (typeof window !== 'undefined' && window.location.protocol === 'https:');

    // ChatRoom 등에서 WS_ENDPOINT로부터 심어둔 백엔드 host 재사용
    const fromWsGlobal =
        (typeof window !== 'undefined' && window.__HBS_BACKEND_HOST__)
            ? ((pageHttps ? 'https:' : 'http:') + '//' + window.__HBS_BACKEND_HOST__)
            : null;

    // 우선순위: VITE_BACKEND_ORIGIN > VITE_API_BASE > VITE_WS_BASE(스킴 전환) > 전역 WS 호스트 > (로컬) localhost
    const candidates = [
        env.VITE_BACKEND_ORIGIN,
        env.VITE_API_BASE,
        env.VITE_WS_BASE,
        fromWsGlobal,
        (typeof window !== 'undefined' && window.location.port === '5173') ? 'http://localhost:8080' : null,
    ].filter(Boolean);

    for (const raw of candidates) {
        try {
            const base = (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
            const u = new URL(raw, base);

            // ws/wss로 들어오면 http/https로 전환(페이지 스킴 기준)
            if (u.protocol === 'ws:' || u.protocol === 'wss:') {
                u.protocol = pageHttps ? 'https:' : 'http:';
            }
            return `${u.protocol}//${u.host}`; // 경로/쿼리 제거, host만 사용
        } catch {
            // 다음 후보 시도
        }
    }

    // 백엔드 후보를 못 찾은 경우(배포 오리진으로 붙지 않도록 null)
    if (typeof window !== 'undefined' && /\.vercel\.app$/i.test(window.location.hostname)) {
        return null;
    }

    // 마지막 폴백: 현재 오리진
    return (typeof window !== 'undefined') ? window.location.origin : null;
}

function buildStreamUrl(token) {
    const origin = resolveBackendOrigin();
    if (!origin) return null;
    const base = origin.replace(/\/+$/, '');
    return `${base}/api/notifications/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

export function startNotificationStream(onEvent, onError) {
    // 브라우저 환경 가드
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
        return null;
    }

    // 이미 열려있으면 그대로 반환(중복 연결 방지)
    if (_es) return _es;

    const token =
        (typeof localStorage !== 'undefined' && (
            localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt') ||
            localStorage.getItem('token')
        )) || '';

    const url = buildStreamUrl(token);
    if (!url) return null;

    try {
        _es = new EventSource(url, { withCredentials: false });
    } catch (err) {
        onError?.(err);
        return null;
    }

    // 서버가 "notification" 타입 이벤트를 보낼 때
    const handleNotification = (e) => {
        try { onEvent?.(JSON.parse(e.data)); }
        catch { onEvent?.(e.data); }
    };
    _es.addEventListener('notification', handleNotification);

    // 기본 message 핸들링
    _es.onmessage = (e) => {
        try { onEvent?.(JSON.parse(e.data)); }
        catch { onEvent?.(e.data); }
    };

    _es.onerror = (err) => {
        try { _es.close(); } catch {}
        _es = null;

        if (_retryTimer) clearTimeout(_retryTimer);
        _retryTimer = setTimeout(() => {
            _retryTimer = null;
            startNotificationStream(onEvent, onError);
        }, 3000);

        onError?.(err);
    };

    return _es;
}

export function stopNotificationStream() {
    if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null; }
    if (_es) {
        try { _es.close(); } catch {}
        _es = null;
    }
}