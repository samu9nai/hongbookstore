# 리팩토링 백로그

이 문서는 홍책방에서 알려진 결함과 개선 작업의 단일 목록이다. 작업을 고를 때와 새 결함을 찾았을 때 이 문서를 고친다.

- 항목의 근거는 [reviews/](reviews/)의 분석 문서에 있다. 출처 열의 `C-`는 Claude 분석, `H-`·`T-`는 Codex 분석의 항목 번호다.
- 위치는 커밋 `9752da9` 기준이다. 이후 저장소 레이아웃이 바뀌었다(D-F). 백엔드 경로는 앞에 `backend/`를 붙이고, `src/main/frontend/`는 `frontend/`로 읽는다.
- 정책 결정이 필요한 항목은 [decisions.md](decisions.md)의 결정 ID를 함께 적었다. 결정 전에는 구현하지 않는다.

## 우선순위와 상태

| 우선순위 | 뜻 |
|---|---|
| P0 | 다른 사용자의 데이터를 읽거나 바꿀 수 있다. 재배포 전에 반드시 고친다 |
| P1 | 데이터 불일치, 인증 약점, 검사 우회. 다음 단계에서 고친다 |
| P2 | 운영 안정성, 유지보수성 |
| P3 | 정리 |

상태: `대기` → `진행`(Issue 번호) → `완료`(PR 번호). 진행 중인 항목은 한 에이전트만 맡는다. 작업은 Issue로 시작한다([CONTRIBUTING.md](../CONTRIBUTING.md)).

## 다음 작업 순서 (제안)

1. **FE-04 + OPS-04**: 미사용 의존성을 지우고 최소 CI(`./gradlew test`, `pnpm build`)를 만든다.
2. **SEC-01, SEC-02, SEC-04의 REST 부분**: 인증 주체를 `LoginUserDTO` 하나로 통일하고, 다른 사용자 ID로 요청하면 403이 나는 테스트를 쓴다.
3. **SEC-04의 STOMP 부분, SEC-03, SEC-05, SEC-09**: 실시간 채널 인증과 남은 인증 경로를 막는다.
4. **SEC-06, SEC-07**: 토큰 구조를 다시 설계한다. D-03 결정이 필요하다.

## 보안 (SEC)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 |
|---|---|---|---|---|---|
| SEC-01 | P0 | 대기 | 로그인한 사용자는 누구나 다른 회원을 수정·삭제할 수 있다. 조회는 다른 회원의 email·univEmail을 돌려준다 | `domain/user/controller/UserController.java:34`, `:47`, `:74` | C-1 |
| SEC-02 | P0 | 대기 | 구해요 글과 댓글이 요청 헤더 `X-User-Id`로 작성자를 정한다. 헤더를 바꾸면 다른 사람의 글·댓글을 수정·삭제할 수 있다. `LoginUserDTO`가 record라 리플렉션 `getId()`가 실패해서 항상 헤더 값을 쓴다 | `domain/wanted/controller/WantedController.java:40`, `domain/comment/service/WantedCommentService.java:268` | C-2 |
| SEC-03 | P0 | 대기 | SSE 구독이 JWT 서명을 검증하지 않고 페이로드만 디코딩한다. 위조 토큰으로 다른 사람의 채팅 알림을 받을 수 있다 | `domain/notification/controller/NotificationController.java:34` | C-3 |
| SEC-04 | P0 | 대기 | STOMP 연결에 인증이 없고, SEND·SUBSCRIBE에 방 참가자 검사가 없다. 발신자 ID를 요청 값에서 읽는다. REST 메시지 이력·방 조회도 참가자를 검사하지 않고, 방 생성은 `buyerId`를 요청 값으로 받는다 | `config/WebSocketConfig.java:14`, `domain/chat/controller/ChatMessageController.java:44`, `:84`, `domain/chat/controller/ChatRoomController.java:34` | C-4, H-01 |
| SEC-05 | P1 | 대기 | OAuth 인가 요청 쿠키를 Java 역직렬화한다 | `security/oauth/util/CookieUtils.java:52` | C-5 |
| SEC-06 | P1 | 대기 | 로그인 성공 시 access·refresh 토큰을 URL 쿼리로 전달하고 프론트가 localStorage에 저장한다 | `security/oauth/handler/OAuth2LoginSuccessHandler.java:52` | C-6, H-02 |
| SEC-07 | P1 | 대기 | access·refresh 토큰의 형식이 같아 refresh 토큰으로 일반 API를 호출할 수 있다. 재발급 API가 없다 | `auth/jwt/JwtTokenProvider.java:48` | C-7, H-02 |
| SEC-08 | P1 | 대기 | 소셜 계정을 이메일만으로 합친다. provider·providerId를 저장하지 않고, Kakao의 이메일 인증 여부를 확인하지 않는다 | `security/oauth/CustomOAuth2UserService.java:66` | C-9 |
| SEC-09 | P1 | 대기 | CORS가 `https://*.vercel.app`을 credentials와 함께 허용한다. `ALLOWED_ORIGINS` 설정은 읽기만 하고 쓰지 않는다 | `config/SecurityConfig.java:43`, `:144` | C-8 |
| SEC-10 | P1 | 대기 | 업로드 파일의 확장자와 Content-Type을 클라이언트 값 그대로 저장한다 | `common/util/GcpStorageUtil.java:45`, `common/util/LocalStorageUtil.java:38` | C-10 |
| SEC-11 | P2 | 대기 | 외부 지도 API 프록시(`/api/naver/**`, `/api/directions/**`)를 로그인 없이 호출할 수 있어 API 쿼터를 소모시킬 수 있다 | `config/SecurityConfig.java` | C-11 |
| SEC-12 | P2 | 대기 | 기본 프로필이 `dev`이고, dev 프로필은 actuator 엔드포인트를 모두 노출한다 | `src/main/resources/application.yml:5`, `:252` | C |
| SEC-13 | P1 | 완료 (#25) | 프론트 직접 의존성의 공개 취약점(GHSA) 49건. next-auth(3건)·http-proxy-middleware(2건)는 패키지를 지워서(#23), vite 7.3.5(5건)·axios 1.20.0(35건)·postcss 8.5.23(4건)은 Renovate 보안 PR(#22, #21, #19)로 고쳤다. Dependency Dashboard의 OSV 조회 결과 0건이다 | `frontend/package.json`, `pnpm-lock.yaml` | Renovate OSV 조회(#15) |
| SEC-14 | P1 | 완료 (#27) | 전이 의존성의 공개 취약점 26건(high 15, moderate 8, low 3). Renovate OSV는 직접 의존성만 조회해서 잡지 못한다. 기록한 25건에 styled-components 경유 source-map-js 1.2.1(1건)이 더해졌다. lockfile만 고쳐서 semver 범위 안에서 모두 해소했다: react-router 7.18.4(12건), styled-components 6.5.3으로 postcss 8.4.49 의존 제거(postcss 4건, nanoid 3건, source-map-js 1건), vite 7.3.6·esbuild 0.28.2(1건), rollup 4.64.0(1건), @babel/core 7.29.7(1건), browserslist 4.29.3(2건), baseline-browser-mapping 2.11.27(1건). `pnpm audit` 결과 0건이다 | `pnpm-lock.yaml` | `pnpm audit` (#24) |

## 거래 정합성 (TXN)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 | 결정 |
|---|---|---|---|---|---|---|
| TXN-01 | P1 | 대기 | 예약 상태와 판매글 상태를 프론트가 두 번의 요청으로 따로 바꾼다. 수락·거절 흐름은 두 번째 요청의 실패를 무시한다 | `frontend/src/pages/Chat/ChatRoom.jsx:1282` 부근 | H-03 | |
| TXN-02 | P1 | 대기 | 화면은 판매자만 거래를 완료하게 하지만 서버는 방 참가자 누구나 허용한다 | `domain/chat/service/ChatReservationService.java:152` | H-03 | D-01 |
| TXN-03 | P1 | 대기 | 예약 요청이 호출마다 새 행을 만든다. 낙관적 잠금·유일성 제약이 없다 | `domain/chat/service/ChatReservationService.java:46`, `domain/chat/domain/ChatReservation.java` | H-03 | D-02 |
| TXN-04 | P2 | 대기 | 예약 시각의 offset을 버린다. 현재 화면은 offset 없는 값만 보내므로 잠재 결함이다 | `domain/chat/service/ChatReservationService.java:207` | H-04 | |

## 유해 표현 검사 (MOD)

MOD-03 ~ MOD-05는 [toxic-filter](https://github.com/HongikBookStore/toxic-filter) 저장소의 작업이다.

| ID | 우선 | 상태 | 문제 | 위치 | 출처 | 결정 |
|---|---|---|---|---|---|---|
| MOD-01 | P1 | 대기 | 본문은 5,000자까지 받지만 toxic-filter는 2,000자를 넘으면 413을 돌려준다. 모델은 128토큰 뒤를 잘라 검사하지 않는다 | `domain/post/dto/SalePostCreateRequestDTO.java:27`, toxic-filter `app.py` | T-01, T-03 | |
| MOD-02 | P1 | 대기 | 검사 실패(시간 초과·인증 오류·모델 오류)를 "비속어 아님"과 같은 허용으로 처리한다. 클라이언트 제한 시간 70초가 Cloud Run 요청 제한 60초보다 길고, 채팅 전송 스레드를 막는다 | `moderation/toxic/ToxicFilterClient.java:39`, `:45` | C, T-02 | D-04 |
| MOD-03 | P1 | 대기 | 완성형 한글이 없는 입력(자모 `ㅅㅂ`, 영어)을 모델에 넣지 않고 정상으로 판정한다 | toxic-filter `app.py` 114행 부근 | C, T-03 | |
| MOD-04 | P2 | 대기 | 응답 계약: 판정값이 한국어 문자열이고, 백엔드가 기대하는 `flagged` 필드가 없다. health와 readiness가 섞여 있고 일부 잘못된 요청이 500을 돌려준다 | toxic-filter `app.py` | C, T-04, T-05 | |
| MOD-05 | P2 | 대기 | 모델 아티팩트·학습 코드·평가 결과가 없어 품질을 검증할 수 없다. `gunicorn==22.0.0`의 알려진 취약점 여부를 확인해야 한다 | toxic-filter `Dockerfile`, `requirements-server.txt` | C, T-06 | D-05 |

## 프론트엔드 (FE)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 |
|---|---|---|---|---|---|
| FE-01 | P1 | 완료 (#37) | 조기 반환 뒤에 Hook을 호출해, 닫힌 장소 상세 모달을 다시 열면 "Rendered more hooks" 오류가 났다. 조기 반환을 Hook 뒤로 옮기고 재현 테스트(`PlaceDetailModal.test.tsx`)를 더했다 | `components/PlaceDetailModal/PlaceDetailModal.jsx` | H-05 |
| FE-02 | P2 | 대기 | `AuthProvider`가 두 번 감싸져 있다 | `main.jsx:10`, `App.jsx:86` | H-05 |
| FE-03 | P2 | 대기 | API 접근 방식이 axios 인스턴스·직접 axios·`fetch`로 나뉘고, `localStorage`의 토큰을 52곳에서 직접 읽는다 | `src/main/frontend/src` 전반 | C, H-05 |
| FE-04 | P1 | 완료 (#23) | 쓰지 않는 의존성: `next-auth`(→`next`), `http-proxy-middleware`, `dotenv`, `zod`, `@tanstack/react-query`, `react-kakao-maps-sdk`. `npm audit`의 critical 2건이 모두 `next-auth` 경로다 | `src/main/frontend/package.json` | C, H-05 |
| FE-05 | P2 | 대기 | 유지보수가 끝난 `stompjs` 2.3.3을 쓰고, 연결할 때 인증 헤더를 보내지 않는다 | `pages/Chat/ChatRoom.jsx:9`, `:1010` | C |
| FE-06 | P2 | 대기 | 2,000줄이 넘는 화면 컴포넌트(PostWrite, ChatRoom)와 1 MB 단일 번들. 라우트 단위 코드 분할이 없다 | `pages/PostWrite`, `pages/Chat`, `App.jsx` | C, H-05 |
| FE-07 | P3 | 완료 (#33) | CRA 잔재(`index.js`, `reportWebVitals.js`, `App.test.js`, `setupTests.js`)와 이 파일만 쓰던 `web-vitals` 의존성을 지웠다. 앱 진입점은 `main.jsx`라 빌드 결과물은 바뀌지 않았다 | `frontend/src` | C, H-07 |
| FE-08 | P3 | 대기 | Vite+(`vp`)로 옮길지 검토한다. 지금 쓰는 Vite·Vitest·oxlint·tsgolint가 Vite+에 들어 있어 `vp migrate`로 옮길 수 있다. oxfmt 1.0과 Vite+ 안정화 이후에 판단한다 | `frontend/` | D-H |
| FE-09 | P3 | 완료 (#29) | `i18next` 25·`react-i18next` 16의 선택적 peer가 TypeScript `^5`라 TS 7과 맞지 않았다. `i18next` 26.4.2·`react-i18next` 17.0.15로 올려 `pnpm peers check` 결과 0건이다 | `frontend/package.json` | D-H |
| FE-10 | P2 | 대기 | 열 수 없는 모달이 남아 있다. 구해요 상세의 삭제 모달은 여는 함수(`openDelete`)를 부르는 곳이 없었고, 채팅방의 재전송 모달도 여는 함수(`handleRetryClick`)를 부르는 곳이 없었다. 두 함수는 린트 정리(#37)에서 지웠고 모달 JSX는 남아 있다. 연결할지 지울지 정해야 한다 | `pages/WantedDetail/WantedDetail.jsx`, `pages/Chat/ChatRoom.jsx` | #37 |

## 백엔드·운영 (BE, OPS)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 |
|---|---|---|---|---|---|
| BE-01 | P1 | 대기 | 닉네임 컬럼은 25자인데 가입 로직은 최대 50자로 만든다. 이메일 앞부분이 25자를 넘으면 가입이 실패한다 | `domain/user/domain/User.java:20`, `security/oauth/CustomOAuth2UserService.java:109` | C |
| BE-02 | P3 | 대기 | README는 JWT 비밀값을 base64라고 설명하지만 코드는 문자열의 UTF-8 바이트를 그대로 쓴다 | `auth/jwt/JwtTokenProvider.java:34`, `README.md` | C |
| BE-03 | P1 | 대기 | 백엔드 테스트가 `contextLoads` 1개뿐이다. OPS-04에서 분리했다 | `backend/src/test` | C, H-07 |
| OPS-01 | P2 | 대기 | 스키마 마이그레이션 도구가 없다 | `src/main/resources/application.yml` | C, H-06 |
| OPS-02 | P2 | 대기 | DB 트랜잭션 안에서 외부 저장소에 업로드하고, 커밋 전에 알림을 보낸다 | `domain/post/service/SalePostService.java:41`, `:332`, `domain/chat/service/ChatReservationService.java` | H-06 |
| OPS-03 | P2 | 대기 | STOMP simple broker와 SSE emitter가 프로세스 메모리에 있어 인스턴스 1개에서만 동작한다. 이 전제를 문서와 설정에 명시해야 한다 | `config/WebSocketConfig.java`, `domain/notification/sse/EmitterRepository.java` | H-06 |
| OPS-04 | P1 | 완료 (#14) | 활성 CI가 없다 | `.github/` | C, H-07 |
| OPS-05 | P2 | 대기 | WebClient 하나를 위해 webflux 전체를 쓴다. macOS 전용 netty 의존성이 운영 빌드에 들어간다. `RestTemplate`에 제한 시간이 없다 | `build.gradle`, `config/RestTemplateConfig.java` | C |
| OPS-06 | P3 | 대기 | Vercel `rewrite`와 서버리스 프록시가 함께 있고, 프록시가 보내는 `x-edge-key`를 백엔드가 검증하지 않는다. Cloud Run 주소가 하드코딩돼 있다 | `src/main/frontend/vercel.json`, `src/main/frontend/api/[...path].js`, `application.yml:201` | C |
| OPS-07 | P3 | 대기 | 코드 위생: `DepartmentNormalizer` 중복, `weather/utill` 오타, `catch (Exception …)` 44곳, 작업 지시용 주석 | 여러 곳 | C |
| OPS-08 | P2 | 대기 | Spring Boot 3.5.x의 OSS 지원이 2026-06-30에 끝났다(api.spring.io 기준, 최신 패치 3.5.16). 현재 3.5.10이다. 4.x는 major 업그레이드라 기능 변경과 섞지 않는다 | `backend/build.gradle.kts` | |

## 문서 (DOC)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 |
|---|---|---|---|---|---|
| DOC-01 | P3 | 대기 | 영역별 개발 컨벤션 문서가 없다. NA-WA의 프론트엔드·백엔드 컨벤션은 Vue·MyBatis 기준이라 React·Spring Data JPA에 맞게 다시 써야 한다. TS 전환을 시작할 때 실제 코드를 보고 쓴다 | `frontend/docs/`, `backend/docs/` | #11 |
