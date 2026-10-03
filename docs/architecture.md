# 홍책방 구조 개요

이 문서를 읽으면 홍책방의 구성 요소와 주요 요청 흐름을 파악하고, 고칠 코드의 위치를 빠르게 찾을 수 있다.
각 흐름 끝의 "알려진 결함"은 [backlog.md](backlog.md)의 항목 ID다.

기준 커밋: `9752da9` (2026-10-03). 코드가 바뀌면 이 문서도 함께 고친다.

## 구성 요소

```
브라우저 (React + Vite, Vercel 배포)
  │  /api/*  → Vercel rewrite → Spring 백엔드
  │  /ws-stomp (STOMP over WebSocket), /api/notifications/stream (SSE)
  ▼
Spring Boot 백엔드 (Cloud Run, 최대 인스턴스 1개)
  ├─ MySQL       : 업무 데이터 (JPA)
  ├─ Redis       : 로그아웃한 access 토큰 블랙리스트
  ├─ 이미지 저장소 : local(./uploads) 또는 GCP Cloud Storage (STORAGE_MODE)
  ├─ toxic-filter : 유해 표현 판정 (별도 저장소, Flask + KcBERT)
  └─ 외부 API     : Kakao 책 검색, Naver 장소·길찾기, 기상청(KMA), Gmail SMTP
```

## 백엔드 패키지

루트는 `src/main/java/com/hongik/books`다.

| 패키지 | 역할 |
|---|---|
| `auth` | JWT 발급·검증 필터, 로그아웃, 탈퇴 사용자 차단 필터 |
| `security/oauth` | Google·Naver·Kakao 소셜 로그인, 인가 요청 쿠키 저장소 |
| `config` | Security·CORS·WebSocket·Redis·저장소 설정 |
| `common` | `ApiResponse`, 전역 예외 처리, 이미지 저장소 구현, 지도 API 프록시 |
| `moderation` | 필드별 검사 정책(BLOCK/WARN/OFF)과 toxic-filter 클라이언트 |
| `domain/post` | 판매글, 이미지, 찜, 최근 본 글 |
| `domain/wanted`, `domain/comment` | 구해요 게시판과 익명 댓글 |
| `domain/chat` | 채팅방, 메시지(STOMP), 거래 예약 |
| `domain/notification` | SSE 알림 구독·전송 (프로세스 메모리에 emitter 보관) |
| `domain/user`, `domain/mypage` | 회원, 재학생 메일 인증, 프로필, 탈퇴 |
| `domain/review` | 장소 리뷰, 거래 상대 평가, 평가 요약 |
| `domain/place`, `domain/location`, `domain/usercategory` | 지도 장소, 내 위치, 사용자 장소 분류 |
| `domain/book`, `domain/weather`, `domain/report` | 책 검색·카테고리, 주간 날씨, 신고 |

## 프론트엔드

루트는 `src/main/frontend/src`다.

- 라우팅은 `App.jsx` 한 파일에 있다. 주요 화면은 `pages/` 아래 화면별 폴더에 있다.
- API 호출은 `lib/api.js`의 axios 인스턴스, `api/` 폴더의 함수, 화면 안의 직접 `fetch`가 섞여 있다.
- 인증 상태는 `contexts/AuthContext.jsx`가 관리한다. 토큰은 `localStorage`의 `accessToken`, `refreshToken`에 있다.
- 다국어 문구는 `locales/{ko,en,ja,zh}/translation.json`에 있다.
- 스타일은 styled-components를 쓴다.

## 주요 흐름

### 로그인

1. 프론트가 `/oauth2/authorization/{provider}`로 이동한다.
2. 백엔드는 인가 요청을 쿠키(`oauth2_auth_request`)에 저장하고 provider로 보낸다.
3. 콜백에서 `CustomOAuth2UserService`가 **이메일로** 회원을 찾거나 새로 만든다.
4. `OAuth2LoginSuccessHandler`가 access·refresh 토큰을 만들어 `{FRONTEND_BASE_URL}/oauth/callback?accessToken=…&refreshToken=…`로 보낸다.
5. 이후 요청은 `Authorization: Bearer` 헤더로 인증한다. `JwtAuthFilter`가 매 요청마다 회원을 DB에서 읽는다.

권한은 `USER`(가입) → `STUDENT`(홍익대 메일 인증 완료) → `ADMIN` 순이다. 글쓰기 대부분은 `STUDENT` 이상이 필요하다.

알려진 결함: SEC-01, SEC-05, SEC-06, SEC-07, SEC-08.

### 채팅과 거래 예약

1. 구매자가 판매글에서 채팅방을 만든다 (`POST /api/chat/rooms`).
2. 프론트는 `/ws-stomp/websocket`에 STOMP로 연결하고 `/sub/chat/room/{roomId}`를 구독한다.
3. 메시지는 `/pub/chat.sendMessage`로 보낸다. 서버는 유해 표현을 검사하고 저장한 뒤 방 구독자에게 전달하고, 수신자에게 SSE 알림을 보낸다.
4. 예약은 REST(`/api/chat/rooms/{roomId}/reservation`)로 요청 → 수락 → 완료 또는 취소한다.
5. 판매글 상태(`for_sale`, `reserved`, `sold_out`)는 **프론트가 예약 API 다음에 따로 호출해서** 바꾼다.

알려진 결함: SEC-04, TXN-01, TXN-02, TXN-03, TXN-04.

### 유해 표현 검사

1. 게시·댓글·채팅·리뷰 저장 전에 `ModerationService.checkOrThrow`가 필드별 정책을 적용한다 (`application.yml`의 `moderation.policy`).
2. `ToxicFilterClient`가 toxic-filter의 `POST /predict`를 부른다. 제한 시간은 70초다.
3. 호출이 실패하면 **허용**(fail-open)으로 처리한다.

알려진 결함: MOD-01 ~ MOD-05.

### 알림 (SSE)

`EventSource`는 헤더를 붙일 수 없어서 토큰을 쿼리(`?token=`)로 보낸다.
서버는 emitter를 메모리에 보관하므로 인스턴스가 1개라는 전제에서만 동작한다.

알려진 결함: SEC-03, OPS-03.

## 배포

- 백엔드: `Dockerfile`로 이미지를 만들어 Cloud Run에 배포한다. 설정은 `deploy/cloudrun/`에 있다. 요청 제한 시간 60초, 최대 인스턴스 1개.
- 프론트: Vercel. `vercel.json`이 `/api/*`를 Cloud Run 주소로 rewrite한다. `api/[...path].js` 서버리스 프록시도 함께 있다.
- 스키마 마이그레이션 도구는 없다. 개발 프로필은 `ddl-auto: update`, 기본값은 `none`이다.
