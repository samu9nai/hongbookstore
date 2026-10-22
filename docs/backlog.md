# 리팩토링 백로그

이 문서는 홍책방에서 알려진 결함과 개선 작업의 단일 목록이다. 작업을 고를 때와 새 결함을 찾았을 때 이 문서를 고친다.

- 항목의 근거는 [reviews/](reviews/)의 분석 문서에 있다. 출처 열의 `C-`는 Claude 분석, `H-`·`T-`는 Codex 분석의 항목 번호다.
- 위치는 커밋 `9752da9` 기준이다. 이후 저장소 레이아웃이 바뀌었다(D-F). 백엔드 경로는 앞에 `backend/`를 붙이고, `src/main/frontend/`는 `frontend/`로 읽는다. #54 이후 `frontend/src`의 옛 경로는 [architecture.md](architecture.md#프론트엔드)의 대응표로 찾는다.
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

1. **SEC-01, SEC-02, SEC-04의 REST 부분**: 인증 주체를 `LoginUserDTO` 하나로 통일하고, 다른 사용자 ID로 요청하면 403이 나는 테스트를 쓴다.
2. **SEC-04의 STOMP 부분, SEC-03, SEC-05, SEC-09**: 실시간 채널 인증과 남은 인증 경로를 막는다.
3. **SEC-06, SEC-07**: 토큰 구조를 다시 설계한다. D-03 결정이 필요하다.

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
| SEC-10 | P1 | 대기 | 업로드 파일의 확장자와 Content-Type을 클라이언트 값 그대로 저장한다 | `common/util/LocalStorageUtil.java:38` (GCS 구현은 #71에서 지웠다) | C-10 |
| SEC-11 | P2 | 대기 | 외부 지도 API 프록시(`/api/naver/**`, `/api/directions/**`)를 로그인 없이 호출할 수 있어 API 쿼터를 소모시킬 수 있다 | `config/SecurityConfig.java` | C-11 |
| SEC-12 | P2 | 대기 | 기본 프로필이 `dev`이고, dev 프로필은 actuator 엔드포인트를 모두 노출한다 | `src/main/resources/application.yml:5`, `:252` | C |
| SEC-13 | P1 | 완료 (#25) | 프론트 직접 의존성의 공개 취약점(GHSA) 49건. next-auth(3건)·http-proxy-middleware(2건)는 패키지를 지워서(#23), vite 7.3.5(5건)·axios 1.20.0(35건)·postcss 8.5.23(4건)은 Renovate 보안 PR(#22, #21, #19)로 고쳤다. Dependency Dashboard의 OSV 조회 결과 0건이다 | `frontend/package.json`, `pnpm-lock.yaml` | Renovate OSV 조회(#15) |
| SEC-14 | P1 | 완료 (#27) | 전이 의존성의 공개 취약점 26건(high 15, moderate 8, low 3). Renovate OSV는 직접 의존성만 조회해서 잡지 못한다. 기록한 25건에 styled-components 경유 source-map-js 1.2.1(1건)이 더해졌다. lockfile만 고쳐서 semver 범위 안에서 모두 해소했다: react-router 7.18.4(12건), styled-components 6.5.3으로 postcss 8.4.49 의존 제거(postcss 4건, nanoid 3건, source-map-js 1건), vite 7.3.6·esbuild 0.28.2(1건), rollup 4.64.0(1건), @babel/core 7.29.7(1건), browserslist 4.29.3(2건), baseline-browser-mapping 2.11.27(1건). `pnpm audit` 결과 0건이다 | `pnpm-lock.yaml` | `pnpm audit` (#24) |
| SEC-15 | P1 | 완료 (#78) | 백엔드 런타임 의존성의 공개 취약점. 의존성 수는 Gradle이 `runtimeClasspath`에서 고른 아티팩트의 고유 모듈(BOM 제외) 기준이고, 측정 스크립트는 [PR #72 리뷰](reviews/2026-10-22-codex-pr72.md#로컬-자동-검사)에 있다. 이 모듈 좌표 전체를 OSV querybatch로 조회했다. 2026-10-22 Spring Boot 3.5.10 기준으로 모듈 218개 가운데 32개 패키지에서 고유 권고 115건(critical 11, high 42, moderate 53, low 9)이 나온다. Tomcat·Netty·Jackson·Spring Framework·Spring Security·Spring Data에 몰려 있다. Spring Framework 6.2의 critical 일부는 OSS 7.0.9에서만 고쳐져 Boot 4.x 전환(OPS-08)이 필요하다. GCS 의존성을 지운 뒤(OPS-10) 다시 측정했다: 모듈 129개, 취약 패키지 30개, 고유 권고 113건(critical 11, high 42, moderate 51, low 9). opentelemetry-api·commons-lang3의 moderate 2건만 사라졌다. 임시 사본에서 Boot 3.5.16으로 올리면 모듈 129개 가운데 취약 패키지 11개, 고유 권고 32건(critical 7, high 10, moderate 15)이 남는다. 남는 critical은 Tomcat 10.1.55(3건, 10.1.58에서 수정), Netty 4.1.135(1건, 4.1.137에서 수정), Spring Framework 6.2.19(3건, 7.0.9에서만 수정)다. Boot 4.1.1로 올린 뒤(#77) 모듈 167개 가운데 취약 패키지 5개, 고유 권고 10건(critical 3, high 5, moderate 2)이 남았다. Tomcat 11.0.24와 Jackson 3.1.5·2.21.5다. 같은 minor 안의 패치(Tomcat 11.0.27, Jackson 3.1.8·2.21.8)로 덮어쓴 뒤 다시 조회한 결과 0건이다(D-U) | `backend/build.gradle.kts` | OSV querybatch (#71, #77) |
| SEC-16 | P1 | 완료 (#74) | Node.js 런타임 24.21.0이 2026-10-21 보안 릴리스의 CVE 10건 가운데 8건(high 4, medium 3, low 1)에 해당한다. Brotli 디코더의 범위 밖 쓰기(CVE-2026-111497)와 TLS 인증서 호스트명 검사 우회 2건이 포함된다. 24.x 수정 버전은 24.22.1, 26.x는 26.12.1이다. 26.12.1로 올린다(D-S) | `.node-version`, `package.json` | nodejs.org 보안 릴리스 공지 (#73) |

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
| FE-10 | P2 | 완료 (#43) | 구해요 상세의 삭제 버튼이 확인 모달 없이 바로 삭제했다. 버튼이 확인 모달을 열고 확인해야 삭제하도록 고치고 재현 테스트(`WantedDetail.test.tsx`)를 더했다. 채팅방의 재전송 버튼·모달은 `failed` 상태를 만드는 코드가 없어 나타나지 않았으므로 지웠다(D-M). #37 커밋 메시지의 "재전송 모달은 열리지 않았다"는 틀린 설명이다 | `pages/WantedDetail/WantedDetail.jsx`, `pages/Chat/ChatRoom.jsx` | #37 |
| FE-11 | P2 | 완료 (#45, #47, #53, #57, #59, #61, #63, #65, #67, #69) | 프론트엔드 소스가 JavaScript다(JS·JSX 60개, TS는 테스트 2개). 단계별로 TypeScript로 옮긴다: ① `utils`·`lib`·`api` ② `contexts`·`styles`·`components/ui` ③ 나머지 `components` ④ `pages`(영역별) ⑤ `App`·`main`·`i18n`, `allowJs` 끄기. 기본값은 decisions.md의 "확인이 필요한 제안". ① 완료(#45): 9개 모듈과 `env.d.ts`, `strict` 명시. ② 완료(#47): 14개 모듈. ③ 완료(#53): 12개 모듈, 네이버 지도 타입(`@types/navermaps`). ④는 FE-19로 옮긴 `features/<기능>` 단위 PR로 나눈다(D-P). ④ 진행: 기능 폴더 6개 중 auth 완료(#57). 쓰지 않는 `Register` 화면은 옮기지 않고 지웠다. map 완료(#59). account 완료(#61). wanted 완료(#63). marketplace 완료(#65). chat 완료(#67). 4단계 완료. ⑤ 완료(#69): `app`의 `App`·`main`·`i18n`을 옮기고 `allowJs`를 껐다 | `frontend/src` | D-N |
| FE-12 | P3 | 대기 | `api/chat`의 `getOrCreateChatRoom`이 실제 API 대신 가짜 응답(`chat_<bookId>_<시각>`)을 돌려준다. `ChatList`의 `?bookId=` 처리가 이 값으로 존재하지 않는 채팅방으로 이동한다. 지금은 이 주소를 만드는 링크가 없다 | `api/chat.ts`, `pages/Chat/ChatList.jsx:600` | #44 |
| FE-13 | P3 | 대기 | 쓰이지 않는 모듈이 있다: `api/reservations.ts`(ChatRoom은 자체 함수를 쓴다), `utils/daumPostcode.ts`(#37에서 마지막 사용처가 사라졌다), `api/auth`의 `deleteAccount`, `api/chat`의 `getOrCreateChatRoom` 외 함수 4개. TS 전환 1단계에서 동작 변경과 섞지 않으려고 그대로 옮겼다. `components/ui`도 같다: `Button`·`Input`과 `Form`·`CommonCard`·`Layout`의 export 대부분을 쓰는 곳이 없다(2단계, #46). `ui/index`는 `Card`를 `Card.tsx`에서 내보내므로 `CommonCard`의 `Card`·`CardHeader`는 index로 가져올 수 없다. `Search`·`Wanted`는 index의 `Card`와 `CommonCard`의 `CardTitle`을 함께 쓴다. 3단계(#52)에서 찾은 것: `PlaceTypeFilter`를 쓰는 곳이 없다. 컴포넌트가 읽지 않는 props가 있다: `NaverMap`의 `userLocation`·`routePath`·`showMyLocation`, `ChatBotContent`의 `onClose`. 페이지가 컴포넌트에 없는 props를 넘긴다: `Map`→`UserCategory`의 `loading`·`onSelectCategory`, `Login`·`Register`→`Header`의 `lang`·`onLangChange`. 4단계 auth(#56)에서 쓰지 않는 `Register` 화면(`Register.jsx`·`Register.css`)을 지우고, `Login`이 `Header`에 넘기던 `lang`·`onLangChange`를 지웠다. 4단계 map(#58)에서 `Map`이 `UserCategory`에 넘기던 `loading`·`onSelectCategory`를 지웠다. 4단계 account(#60)에서 찾은 것: `MyPage`의 사진 메뉴(`showPhotoMenu`)와 편집 취소 모달(`showEditCancelConfirm`)은 여는 코드가 없다. 편집 취소 모달이 부르던 `cancelEditNow`의 정의되지 않은 `setEditResults` 호출은 #60에서 지웠다. 4단계 wanted(#62)에서 찾은 것: `WantedWrite`의 `handleBookSelect`는 검색 결과의 `category`·`department`를 읽지만 `normalizeBook`이 두 값을 만들지 않아 카테고리 추론 분기가 늘 기본값으로 간다. `WantedDetail`의 사이드바 처리 함수에 있는 `comments`·`detail` 메뉴는 사이드바가 보내지 않는다. 4단계 marketplace(#64)에서 찾은 것: `MyBookstore`는 `react-qr-code`의 `QRCode`를 가져오기만 하고 쓰지 않는다. TS 변환이 이 import를 지워 번들에서 `react-qr-code`·`qr.js`·`prop-types`가 빠졌다. 다른 곳은 이 패키지를 쓰지 않으므로 import 문과 `package.json` 의존성을 지울 수 있다. 4단계 chat(#66)에서 찾은 것: `App.jsx`는 `ChatRoomWrapper`에 `<ChatRoom />`을 children으로 넘기지만 래퍼는 children을 그리지 않고 자기 `ChatRoom`을 그린다. 래퍼가 `ChatRoom`에 넘기던, 받지 않는 `chatId`·`username`은 #66에서 지웠다. 이제 래퍼는 `ChatRoom`만 그리므로 라우트에서 바로 `ChatRoom`을 써도 된다 | `frontend/src/api`, `frontend/src/utils`, `frontend/src/components`, `features/account/MyPage.tsx`, `features/wanted/WantedWrite.tsx:744`, `features/wanted/WantedDetail.tsx:526`, `features/marketplace/MyBookstore.tsx:16`, `app/App.jsx:193` | #44, #46, #52, #56, #58, #60, #62, #64, #66 |
| FE-14 | P3 | 완료 (#49) | 브라우저 탭의 Vite 아이콘과 manifest의 Create React App 이름·아이콘을 교체한다. 사용자가 7안을 확정했다(D-O). 정본에서 favicon·홈 화면 아이콘을 생성하고 HTML·manifest에 연결했다. 다른 시안은 폐기했다 | `frontend/index.html`, `frontend/public/manifest.json`, `frontend/public/`, `frontend/src/assets/brand/hongbookstore-master.png` | #48 |
| FE-15 | P3 | 대기 | 사이드 메뉴가 현재 메뉴를 강조하지 않는다. `SubMenuButton`의 배경·글자색·테두리는 `active`를 읽지만 `SidebarMenu`는 `$active`만 넘겨서 그림자만 바뀐다 | `components/SidebarMenu/SidebarMenu.tsx` | #52 (소스 확인) |
| FE-16 | P3 | 대기 | 장소 상세에서 카테고리에 장소를 담아도 선택한 카테고리 목록이 바로 갱신되지 않는다. `PlaceDetailModal`은 선택 상자 값(문자열)을 넘기고 `Map`의 `selectedUserCategoryId`는 숫자라 `handleAddPlaceToCategory`의 비교가 항상 거짓이다. #58에서 TS로 옮기며 이 비교에 `@ts-expect-error`를 달았다 | `features/map/Map.tsx:562`, `features/map/PlaceDetailModal.tsx` | #52 (소스 확인) |
| FE-17 | P3 | 대기 | 장소 상세의 길찾기 탭이 `naver.maps.LatLngBounds`를 인자 없이 만든 뒤 `extend`한다. `@types/navermaps`는 두 꼭짓점을 요구해서 `@ts-expect-error`로 두었다. 실제 지도에서 출발지·도착지에 맞게 화면이 잡히는지 확인해야 한다. 인자 없는 생성이 실패하면 경로 그리기는 `catch`가 삼키고, 위치 맞춤은 `setTimeout` 안이라 잡히지 않은 오류가 난다 | `components/PlaceDetailModal/PlaceDetailModal.tsx` | #52 (위험 추론) |
| FE-18 | P3 | 완료 (#53) | #53에서 추가한 `MapPlace`의 `category`·`description`은 `string` 또는 생략만 허용했지만, 백엔드 `Place`는 null을 허용하고 `PlaceDto.Response`가 값을 그대로 전달한다. null 응답 모양을 넣은 임시 타입 검사에서 TS2322 2건을 확인했다. 두 필드와 이를 받는 헬퍼(`getCategoryIcon`, `getTypeName`)의 인자에 null을 더했다. 실제 API·DB 왕복은 미검증이다 | `components/NaverMap/Navermap.tsx:23`, `domain/place/domain/Place.java:32`, `domain/place/dto/PlaceDto.java:49` | [PR #53 리뷰](reviews/2026-10-09-codex-pr51-pr53.md) (소스·타입 검사 확인) |
| FE-19 | P3 | 완료 (#55) | 프론트엔드 소스가 파일 종류별 폴더(`api`·`lib`·`utils`·`contexts`·`styles`·`components`·`pages`)에 나뉘어 화면 하나를 고칠 때 여러 폴더를 오간다. `app`·`features`·`shared` 세 층으로 옮긴다(D-P). 옮길 파일의 기준선 린트 오류 29개를 함께 고치고, 쓰지 않는 `pages/Frontend/Hero/Hero.jsx`를 지운다. 옮긴 `features/auth/Register.css`도 import하는 곳이 없다 | `frontend/src` | 사용자 요청 |
| FE-20 | P2 | 완료 (#55) | 폴더 이동 후 `features/auth/Login.jsx`와 `Register.jsx`가 `app/i18n.js`를 가져와 D-P의 의존 방향을 어긴다. `app/App.jsx`가 이미 초기화 모듈을 가져오므로 auth의 두 side-effect import를 지웠다. 압축 번들 해시는 수정 전과 같다. 주소로 바로 들어온 로그인 화면이 번역 문구를 보이는지 e2e로 확인한다 | `frontend/src/features/auth/Login.jsx:3`, `frontend/src/features/auth/Register.jsx:3` | [PR #55 리뷰](reviews/2026-10-10-codex-pr55.md) (소스 확인) |
| FE-21 | P3 | 대기 | 사용자 프로필의 이름 찾기가 `GET /api/users/{userId}` 응답을 사용자 객체로 읽는다. 백엔드는 `ApiResponse`로 감싸 보내므로 이름을 찾지 못하고, 판매글이 있는 사용자만 판매글 목록의 `sellerNickname`으로 이름을 얻는다. 이전 화면이 이름을 넘기지 않으면 판매글이 없는 사용자는 `사용자 #<id>`로 보인다 | `features/account/UserProfile.tsx:155`, `domain/user/controller/UserController.java:35` | #60 (소스 확인) |
| FE-22 | P3 | 대기 | 마이페이지에서 최근 본 게시글을 누르면 "게시글로 이동할까요?" 확인 모달이 두 번 겹쳐 렌더링된다. 같은 `confirmPost` 조건의 JSX가 두 벌 있다 | `features/account/MyPage.tsx:1804`, `:1842` | #60 (소스 확인) |
| FE-23 | P3 | 대기 | 구해요 상세의 작성자가 항상 익명으로 보이고 조회수가 보이지 않는다. 화면은 `requesterNickname`·`views` 등을 찾지만 백엔드 `WantedDetailResponseDTO`는 `requesterId`만 보내고 이름과 조회수 필드가 없다 | `features/wanted/WantedDetail.tsx:781`, `:898`, `domain/wanted/dto/WantedDetailResponseDTO.java` | #62 (소스 확인) |
| FE-24 | P3 | 대기 | 책 검색 화면의 페이지 정보 초깃값이 `currentPage` 대신 `number` 키를 쓴다. 첫 응답을 받기 전이나 목록 요청이 실패하면 `currentPage`가 없어 이전·다음 버튼이 활성 상태로 보이고 눌러도 동작하지 않는다 | `features/marketplace/Search.tsx:251` | #64 (소스 확인) |
| FE-25 | P3 | 대기 | 나의 책방에서 판매중·예약중·판매완료 탭이 비어 있으면 상태 이름 대신 "알 수 없는 상태" 문구가 들어간다. 탭 이름(`selling` 등)으로 서버 상태 키(`FOR_SALE` 등)의 문구 표를 찾는다 | `features/marketplace/MyBookstore.tsx:1206` | #64 (소스 확인) |
| FE-26 | P3 | 대기 | 판매글 상세의 `SUBWAY_MAP`과 `ONCAMPUS_PLACE_LABELS`가 "생략" 주석만 있는 빈 객체다. 교외 거래역의 호선이 표시되지 않고, 교내 거래 장소는 코드(`A` 등) 그대로 보인다. 작성 화면(`PostWrite`)에는 노선 표가 있다 | `features/marketplace/PostDetail.tsx:768`, `:772` | #64 (소스 확인) |
| FE-27 | P3 | 대기 | 판매글 수정 화면이 책 정보와 카테고리를 제대로 불러오지 못한다. 백엔드 상세 응답에 `isbn`이 없어 항상 직접 입력 모드로 열리고, 책 제목·저자·출판사 입력 칸이 보이지만 수정 요청(`SalePostUpdateRequestDTO`)은 이 값을 보내지 않아 고쳐도 반영되지 않는다. 카테고리 값은 폼에서 빠져 선택 상자가 비어 보인다 | `features/marketplace/PostWrite.tsx:1869`, `domain/post/dto/SalePostUpdateRequestDTO.java` | #64 (소스 확인) |
| FE-28 | P3 | 대기 | 채팅 목록에 상대방 이름이 보이지 않고 아바타가 `?`로 나온다. `normalizeRoom`은 `buyerName`·`buyer.username` 등을 찾지만 백엔드 `ChatRoomResponse`는 `buyerNickname`·`sellerNickname`을 보낸다. 마지막 메시지·안 읽은 수도 백엔드가 보내지 않아 비어 있다 | `features/chat/ChatList.tsx:574`, `domain/chat/dto/ChatRoomResponse.java` | #66 (소스 확인) |
| FE-29 | P3 | 대기 | 채팅방 헤더의 상대 이름이 항상 `학생`이고, 책 제목 자리에 첫 메시지 문장이 보인다. 헤더는 서버가 보내지 않는 `messages[0].sender`로 `김학생`/`학생`을 고르고, 첫 메시지를 ` - `로 잘라 책 제목으로 쓴다. 가짜 응답을 넣은 브라우저에서 확인했다 | `features/chat/ChatRoom.tsx:2868` | #66 (실행 확인) |
| FE-30 | P3 | 대기 | 번역 키 비교 스크립트 `check_keys.js`가 실행되지 않는다. `frontend/package.json`이 `"type": "module"`인데 스크립트는 `require`를 써서 `node check_keys.js`가 `ReferenceError: require is not defined in ES module scope`로 끝난다. 앱이 가져오지 않는 Node 스크립트라 TS 전환과 `allowJs` 해제(#68)에서 빠졌다. 고칠지(ESM·TS로 바꾸고 `src` 밖으로 옮기기) 지울지 정해야 한다 | `frontend/src/app/locales/check_keys.js` | #68 (실행 확인) |

## 백엔드·운영 (BE, OPS)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 |
|---|---|---|---|---|---|
| BE-01 | P1 | 대기 | 닉네임 컬럼은 25자인데 가입 로직은 최대 50자로 만든다. 이메일 앞부분이 25자를 넘으면 가입이 실패한다 | `domain/user/domain/User.java:20`, `security/oauth/CustomOAuth2UserService.java:109` | C |
| BE-02 | P3 | 대기 | README는 JWT 비밀값을 base64라고 설명하지만 코드는 문자열의 UTF-8 바이트를 그대로 쓴다 | `auth/jwt/JwtTokenProvider.java:34`, `README.md` | C |
| BE-03 | P1 | 대기 | 백엔드 테스트가 `contextLoads` 1개뿐이다. OPS-04에서 분리했다. #77에서 Boot 4.1 전환 전후를 비교하려고 API 응답 모양 회귀 테스트 6개(`ApiContractTest`)를 더했다. 서비스 로직·권한 검사 테스트는 여전히 없다 | `backend/src/test` | C, H-07 |
| BE-04 | P3 | 대기 | 삭제한 로컬 이미지 URL을 다시 조회하면 404 대신 500을 반환한다. 포괄 예외 처리기가 `NoResourceFoundException`을 서버 오류로 바꾼다. PR #72의 기준 `11c8b6e`와 head `413fdee`에서 같은 MockMvc 검사로 재현했으며 이번 PR의 회귀는 아니다 | `common/exception/GlobalExceptionHandler.java:115` | [PR #72 리뷰](reviews/2026-10-22-codex-pr72.md) (실행 확인) |
| BE-05 | P3 | 완료 (#78) | PR #78의 인증 거절 테스트가 `Location`을 `endsWith("/login")`으로 검사해 `/other/login`·다른 origin·query 끝의 `/login`도 통과한다. Hamcrest 3.0 matcher로 반례 4개를 확인했다. 실제 서버의 잘못된 리다이렉트를 재현한 것은 아니다. 절대·상대 URI를 요청 URI에 대해 해석한 뒤 목적지 전체를 비교한다. MockMvc가 돌려주는 두 표기 `/login`(Boot 4.1.1)과 `http://localhost/login`(Boot 3.5.10)만 정확히 허용하도록 고쳤다 | `backend/src/test/java/com/hongik/books/ApiContractTest.java:111-117` (`af85792`) | [PR #78 리뷰](reviews/2026-10-22-codex-pr78.md) (실행 확인), #77 |
| OPS-01 | P2 | 대기 | 스키마 마이그레이션 도구가 없다 | `src/main/resources/application.yml` | C, H-06 |
| OPS-02 | P2 | 대기 | DB 트랜잭션 안에서 외부 저장소에 업로드하고, 커밋 전에 알림을 보낸다 | `domain/post/service/SalePostService.java:41`, `:332`, `domain/chat/service/ChatReservationService.java` | H-06 |
| OPS-03 | P2 | 대기 | STOMP simple broker와 SSE emitter가 프로세스 메모리에 있어 인스턴스 1개에서만 동작한다. 이 전제를 문서와 설정에 명시해야 한다 | `config/WebSocketConfig.java`, `domain/notification/sse/EmitterRepository.java` | H-06 |
| OPS-04 | P1 | 완료 (#14) | 활성 CI가 없다 | `.github/` | C, H-07 |
| OPS-05 | P2 | 대기 | WebClient 하나를 위해 webflux 전체를 쓴다. macOS 전용 netty 의존성이 운영 빌드에 들어간다. `RestTemplate`에 제한 시간이 없다 | `build.gradle`, `config/RestTemplateConfig.java` | C |
| OPS-06 | P3 | 대기 | Vercel `rewrite`와 서버리스 프록시가 함께 있고, 프록시가 보내는 `x-edge-key`를 백엔드가 검증하지 않는다. Cloud Run 주소가 하드코딩돼 있다 | `src/main/frontend/vercel.json`, `src/main/frontend/api/[...path].js`, `application.yml:201` | C |
| OPS-07 | P3 | 대기 | 코드 위생: `DepartmentNormalizer` 중복, `weather/utill` 오타, `catch (Exception …)` 44곳, 작업 지시용 주석 | 여러 곳 | C |
| OPS-08 | P2 | 완료 (#78) | Spring Boot 3.5.x의 OSS 지원이 2026-06-30에 끝났다(api.spring.io 기준, 최신 패치 3.5.16). 현재 3.5.10이다. 4.x는 major 업그레이드라 기능 변경과 섞지 않는다. 3.5 라인의 마지막 OSS 릴리스는 3.5.16(2026-06-25)이고, SEC-15의 Spring Framework critical 3건은 7.x에서만 고쳐진다. 2026-10-22 사용자가 3.5.16 패치를 건너뛰고 4.1로 바로 옮기기로 정했다. 4.1.1로 올렸다(D-U, #77) | `backend/build.gradle.kts` | |
| OPS-09 | P2 | 완료 (#51) | Husky의 `core.hooksPath=.husky/_`가 `.git/hooks/pre-push`의 Git LFS 업로드 훅을 대신하지만 `.husky/pre-push`가 없다. 새 LFS 이미지 7개를 포함한 push가 GH008로 거절됐다. `git lfs push origin feature/#48-brand-icons`로 이미지를 올린 뒤 재시도해 해결했다. `.husky/pre-push`에서 `git lfs pre-push`를 실행한다 | `.husky/`, `.gitattributes` | #48, PR #49 (실행 확인) |
| OPS-10 | P2 | 완료 (#72) | 이미지 저장소의 `gcp` 모드가 `spring-cloud-gcp` 관련 모듈 89개를 런타임에 끌어온다(SEC-15의 집계 기준). 로컬에서만 실행하는 이 프로젝트(D-06)는 `local` 모드만 쓴다. `gcp` 모드와 의존성을 지운다(D-R) | `backend/build.gradle.kts`, `common/util/GcpStorageUtil.java`, `config/GcpStorageConfig.java`, `application.yml` | OSV querybatch (#71) |
| OPS-11 | P3 | 대기 | Boot 4.1 전환(#77)에서 동작에 필요한 것만 고치고 남긴 정리 작업이다. ① Jackson 2 databind를 직접 쓰는 4개 파일(`WantedCommentService`·`KmaClient`·`PlaceService`는 `new ObjectMapper()`를 만들고, `WeatherService`는 `KmaClient`가 돌려준 Jackson 2 `JsonNode`를 읽는다)과 Boot 4가 쓰지 않는 Jackson 2 모듈 의존성(`jackson-module-parameter-names`, `jackson-datatype-jsr310`) ② `build.gradle.kts`의 Tomcat·Jackson 버전 덮어쓰기(D-U). Renovate가 `extra[...]` 값을 올리지 못할 수 있다 ③ 4.1에서 새로 생긴 deprecated 경고: `ValueOperations.set(K,V,long,TimeUnit)`, Hibernate `@Check` ④ 테스트 로그의 `Serializing PageImpl instances as-is is not supported` 경고. `Page`를 그대로 응답하는 API(`/api/wanted` 등)의 JSON 계약을 정해야 한다 | `backend/build.gradle.kts`, `auth/jwt/JwtTokenRedisRepository.java:22`, `domain/post/domain/SalePost.java:26`, `domain/wanted/controller/WantedController.java:19` | #77 (실행 확인) |

## 문서 (DOC)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 |
|---|---|---|---|---|---|
| DOC-01 | P3 | 대기 | 영역별 개발 컨벤션 문서가 없다. NA-WA의 프론트엔드·백엔드 컨벤션은 Vue·MyBatis 기준이라 React·Spring Data JPA에 맞게 다시 써야 한다. TS 전환을 시작할 때 실제 코드를 보고 쓴다 | `frontend/docs/`, `backend/docs/` | #11 |
| DOC-02 | P3 | 완료 (#72) | PR #72는 런타임 의존성을 212→120개, 제거 92개로 기록했지만 Gradle이 선택한 실제 아티팩트의 고유 모듈은 218→129개, 제거 89개다. 트리 텍스트의 좌표 문자열 집계로 PR 수치를 재현하면 직접 모듈 10개가 빠지고 BOM이 포함된다. 집계 기준과 문서 수치를 정정하고 OSV 조회 대상도 선택된 전체 좌표인지 확인해야 한다. 원본 OSV 입력이 없어 취약점 수 오류까지 확정하지는 않았다. 작성자가 같은 기준으로 다시 세어 모듈 218→129개(제거 89개, 추가 0개)를 재현했다. 옛 집계는 `group:artifact -> version` 형식의 줄을 놓쳐 OSV 조회에서도 `spring-boot-devtools`·`spring-boot-starter-actuator`·`spring-boot-starter-mail`이 빠졌다. 다시 조회한 결과로 SEC-15·OPS-10·D-R을 고쳤다 | `docs/backlog.md:45,119`, `docs/decisions.md:34` (PR #72 head `413fdee`) | [PR #72 리뷰](reviews/2026-10-22-codex-pr72.md) (실행 확인) |
