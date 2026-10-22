# 리팩토링 백로그

이 문서는 홍책방에서 알려진 결함과 개선 작업의 단일 목록이다. 작업을 고를 때와 새 결함을 찾았을 때 이 문서를 고친다.

- 항목의 근거는 [reviews/](reviews/)의 분석·리뷰 문서에 있다. 출처 열의 `C-`는 Claude 분석, `H-`·`T-`는 Codex 분석의 항목 번호다.
- 위치는 2026-10-22 `main`(`6cb28fb`) 기준이다. 백엔드 Java 파일은 `backend/src/main/java/com/hongik/books/` 아래 경로로, 나머지 파일은 저장소 루트 기준 경로로 적는다.
- 정책 결정이 필요한 항목은 [decisions.md](decisions.md)의 결정 ID를 함께 적었다. 결정 전에는 구현하지 않는다.

## 우선순위와 상태

| 우선순위 | 뜻 |
|---|---|
| P0 | 다른 사용자의 데이터를 읽거나 바꿀 수 있다. 재배포 전에 반드시 고친다 |
| P1 | 데이터 불일치, 인증 약점, 검사 우회. 다음 단계에서 고친다 |
| P2 | 운영 안정성, 유지보수성 |
| P3 | 정리 |

상태: `대기` → `진행`(Issue 번호) → `완료`(PR 번호). 진행 중인 항목은 한 에이전트만 맡는다. 작업은 Issue로 시작한다([CONTRIBUTING.md](../CONTRIBUTING.md)).
항목이 끝나면 [완료](#완료) 절로 옮기고 한 줄 요약과 PR 번호만 남긴다. 작업 과정과 측정값은 PR 본문과 리뷰 문서에 적는다.

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
| SEC-10 | P1 | 대기 | 업로드 파일의 확장자와 Content-Type을 클라이언트 값 그대로 저장한다. GCS 구현은 #72에서 지웠다 | `common/util/LocalStorageUtil.java:38` | C-10 |
| SEC-11 | P2 | 대기 | 외부 지도 API 프록시(`/api/naver/**`, `/api/directions/**`)를 로그인 없이 호출할 수 있어 API 쿼터를 소모시킬 수 있다 | `config/SecurityConfig.java` | C-11 |
| SEC-12 | P2 | 대기 | 기본 프로필이 `dev`이고, dev 프로필은 actuator 엔드포인트를 모두 노출한다 | `backend/src/main/resources/application.yml:5`, `:234` | C |

## 거래 정합성 (TXN)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 | 결정 |
|---|---|---|---|---|---|---|
| TXN-01 | P1 | 대기 | 예약 상태와 판매글 상태를 프론트가 두 번의 요청으로 따로 바꾼다. 수락·거절 흐름은 두 번째 요청의 실패를 무시한다 | `frontend/src/features/chat/ChatRoom.tsx:1671`, `:2517` | H-03 | |
| TXN-02 | P1 | 대기 | 화면은 판매자만 거래를 완료하게 하지만 서버는 방 참가자 누구나 허용한다 | `domain/chat/service/ChatReservationService.java:152` | H-03 | D-01 |
| TXN-03 | P1 | 대기 | 예약 요청이 호출마다 새 행을 만든다. 낙관적 잠금·유일성 제약이 없다 | `domain/chat/service/ChatReservationService.java:46`, `domain/chat/domain/ChatReservation.java` | H-03 | D-02 |
| TXN-04 | P2 | 대기 | 예약 시각의 offset을 버린다. 현재 화면은 offset 없는 값만 보내므로 잠재 결함이다 | `domain/chat/service/ChatReservationService.java:207` | H-04 | |

## 유해 표현 검사 (MOD)

MOD-03 ~ MOD-05는 지금 [toxic-filter](https://github.com/HongikBookStore/toxic-filter) 저장소에 있는 코드의 결함이다. 이 서비스는 개편해서 이 저장소로 들여온다(D-V, MOD-06).

| ID | 우선 | 상태 | 문제 | 위치 | 출처 | 결정 |
|---|---|---|---|---|---|---|
| MOD-01 | P1 | 대기 | 본문은 5,000자까지 받지만 toxic-filter는 2,000자를 넘으면 413을 돌려준다. 모델은 128토큰 뒤를 잘라 검사하지 않는다 | `domain/post/dto/SalePostCreateRequestDTO.java:27`, toxic-filter `app.py` | T-01, T-03 | |
| MOD-02 | P1 | 대기 | 검사 실패(시간 초과·인증 오류·모델 오류)를 "비속어 아님"과 같은 허용으로 처리한다. 클라이언트 제한 시간 70초가 Cloud Run 요청 제한 60초보다 길고, 채팅 전송 스레드를 막는다 | `moderation/toxic/ToxicFilterClient.java:39`, `:45` | C, T-02 | D-04 |
| MOD-03 | P1 | 대기 | 완성형 한글이 없는 입력(자모 `ㅅㅂ`, 영어)을 모델에 넣지 않고 정상으로 판정한다 | toxic-filter `app.py` 114행 부근 | C, T-03 | |
| MOD-04 | P2 | 대기 | 응답 계약: 판정값이 한국어 문자열이고, 백엔드가 기대하는 `flagged` 필드가 없다. health와 readiness가 섞여 있고 일부 잘못된 요청이 500을 돌려준다 | toxic-filter `app.py` | C, T-04, T-05 | |
| MOD-05 | P2 | 대기 | 모델 아티팩트·학습 코드·평가 결과가 없어 품질을 검증할 수 없다. `gunicorn==22.0.0`의 알려진 취약점 여부를 확인해야 한다 | toxic-filter `Dockerfile`, `requirements-server.txt` | C, T-06 | D-05 |
| MOD-06 | P2 | 대기 | toxic-filter가 별도 저장소에 있다. 이 저장소의 `toxic-filter/`로 들여오되 그대로 옮기지 않고 리팩토링 목적에 맞게 개편한다. 기존 코드·모델을 일부 재사용할지 새로 만들지는 이 작업에서 정한다. MOD-03 ~ MOD-05를 함께 다룬다. 모델 유지·교체는 D-05가 정해야 한다 | `toxic-filter/` (새 경로) | D-F, D-V | D-05 |

## 프론트엔드 (FE)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 |
|---|---|---|---|---|---|
| FE-02 | P2 | 대기 | `AuthProvider`가 두 번 감싸져 있다 | `frontend/src/app/main.tsx:10`, `frontend/src/app/App.tsx:88` | H-05 |
| FE-03 | P2 | 대기 | API 접근 방식이 axios 인스턴스·직접 axios·`fetch`로 나뉜다. `localStorage.getItem('accessToken')`을 51곳에서 직접 부른다(2026-10-22) | `frontend/src` 전반 | C, H-05 |
| FE-05 | P2 | 대기 | 유지보수가 끝난 `stompjs` 2.3.3을 쓰고, 연결할 때 인증 헤더를 보내지 않는다 | `frontend/src/features/chat/ChatRoom.tsx:20`, `:2116` | C |
| FE-06 | P2 | 대기 | 2,000줄이 넘는 화면 컴포넌트(PostWrite, ChatRoom)와 약 1,038 kB 메인 JS 청크. 라우트 단위 코드 분할이 없다 | `frontend/src/features/marketplace/PostWrite.tsx`, `frontend/src/features/chat/ChatRoom.tsx`, `frontend/src/app/App.tsx` | C, H-05 |
| FE-08 | P3 | 대기 | Vite+(`vp`)로 옮길지 검토한다. 지금 쓰는 Vite·Vitest·oxlint·tsgolint가 Vite+에 들어 있어 `vp migrate`로 옮길 수 있다. oxfmt 1.0과 Vite+ 안정화 이후에 판단한다 | `frontend/` | D-H |
| FE-12 | P3 | 대기 | `getOrCreateChatRoom`이 실제 API 대신 가짜 응답(`chat_<bookId>_<시각>`)을 돌려준다. `ChatList`의 `?bookId=` 처리가 이 값으로 존재하지 않는 채팅방으로 이동한다. 지금은 이 주소를 만드는 링크가 없다 | `frontend/src/features/chat/api/chat.ts:7`, `frontend/src/features/chat/ChatList.tsx:676` | #44 |
| FE-13 | P3 | 대기 | 쓰이지 않는 코드와 어긋난 props가 남아 있다. 목록은 [FE-13 상세](#fe-13-상세)에 있다. TS 전환(FE-11)에서 동작 변경과 섞지 않으려고 그대로 옮겼다 | [FE-13 상세](#fe-13-상세) | #44, #46, #52, #60, #62, #64, #66 |
| FE-15 | P3 | 대기 | 사이드 메뉴가 현재 메뉴를 강조하지 않는다. `SubMenuButton`의 배경·글자색·테두리는 `active`를 읽지만 `SidebarMenu`는 `$active`만 넘겨서 그림자만 바뀐다 | `frontend/src/shared/layout/SidebarMenu.tsx:34` | #52 (소스 확인) |
| FE-16 | P3 | 대기 | 장소 상세에서 카테고리에 장소를 담아도 선택한 카테고리 목록이 바로 갱신되지 않는다. `PlaceDetailModal`은 선택 상자 값(문자열)을 넘기고 `Map`의 `selectedUserCategoryId`는 숫자라 `handleAddPlaceToCategory`의 비교가 항상 거짓이다. #58에서 TS로 옮기며 이 비교에 `@ts-expect-error`를 달았다 | `frontend/src/features/map/Map.tsx:562`, `frontend/src/features/map/PlaceDetailModal.tsx` | #52 (소스 확인) |
| FE-17 | P3 | 대기 | 장소 상세의 길찾기 탭이 `naver.maps.LatLngBounds`를 인자 없이 만든 뒤 `extend`한다. `@types/navermaps`는 두 꼭짓점을 요구해서 `@ts-expect-error`로 두었다. 실제 지도에서 출발지·도착지에 맞게 화면이 잡히는지 확인해야 한다. 인자 없는 생성이 실패하면 경로 그리기는 `catch`가 삼키고, 위치 맞춤은 `setTimeout` 안이라 잡히지 않은 오류가 난다 | `frontend/src/features/map/PlaceDetailModal.tsx:891`, `:972` | #52 (위험 추론) |
| FE-21 | P3 | 대기 | 사용자 프로필의 이름 찾기가 `GET /api/users/{userId}` 응답을 사용자 객체로 읽는다. 백엔드는 `ApiResponse`로 감싸 보내므로 이름을 찾지 못하고, 판매글이 있는 사용자만 판매글 목록의 `sellerNickname`으로 이름을 얻는다. 이전 화면이 이름을 넘기지 않으면 판매글이 없는 사용자는 `사용자 #<id>`로 보인다 | `frontend/src/features/account/UserProfile.tsx:155`, `domain/user/controller/UserController.java:35` | #60 (소스 확인) |
| FE-22 | P3 | 대기 | 마이페이지에서 최근 본 게시글을 누르면 "게시글로 이동할까요?" 확인 모달이 두 번 겹쳐 렌더링된다. 같은 `confirmPost` 조건의 JSX가 두 벌 있다 | `frontend/src/features/account/MyPage.tsx:1803`, `:1841` | #60 (소스 확인) |
| FE-23 | P3 | 대기 | 구해요 상세의 작성자가 항상 익명으로 보이고 조회수가 보이지 않는다. 화면은 `requesterNickname`·`views` 등을 찾지만 백엔드 `WantedDetailResponseDTO`는 `requesterId`만 보내고 이름과 조회수 필드가 없다 | `frontend/src/features/wanted/WantedDetail.tsx:781`, `:898`, `domain/wanted/dto/WantedDetailResponseDTO.java` | #62 (소스 확인) |
| FE-24 | P3 | 대기 | 책 검색 화면의 페이지 정보 초깃값이 `currentPage` 대신 `number` 키를 쓴다. 첫 응답을 받기 전이나 목록 요청이 실패하면 `currentPage`가 없어 이전·다음 버튼이 활성 상태로 보이고 눌러도 동작하지 않는다 | `frontend/src/features/marketplace/Search.tsx:251` | #64 (소스 확인) |
| FE-25 | P3 | 대기 | 나의 책방에서 판매중·예약중·판매완료 탭이 비어 있으면 상태 이름 대신 "알 수 없는 상태" 문구가 들어간다. 탭 이름(`selling` 등)으로 서버 상태 키(`FOR_SALE` 등)의 문구 표를 찾는다 | `frontend/src/features/marketplace/MyBookstore.tsx:1208` | #64 (소스 확인) |
| FE-26 | P3 | 대기 | 판매글 상세의 `SUBWAY_MAP`과 `ONCAMPUS_PLACE_LABELS`가 "생략" 주석만 있는 빈 객체다. 교외 거래역의 호선이 표시되지 않고, 교내 거래 장소는 코드(`A` 등) 그대로 보인다. 작성 화면(`PostWrite`)에는 노선 표가 있다 | `frontend/src/features/marketplace/PostDetail.tsx:768`, `:772` | #64 (소스 확인) |
| FE-27 | P3 | 대기 | 판매글 수정 화면이 책 정보와 카테고리를 제대로 불러오지 못한다. 백엔드 상세 응답에 `isbn`이 없어 항상 직접 입력 모드로 열리고, 책 제목·저자·출판사 입력 칸이 보이지만 수정 요청(`SalePostUpdateRequestDTO`)은 이 값을 보내지 않아 고쳐도 반영되지 않는다. 카테고리 값은 폼에서 빠져 선택 상자가 비어 보인다 | `frontend/src/features/marketplace/PostWrite.tsx:1869`, `domain/post/dto/SalePostUpdateRequestDTO.java` | #64 (소스 확인) |
| FE-28 | P3 | 대기 | 채팅 목록에 상대방 이름이 보이지 않고 아바타가 `?`로 나온다. `normalizeRoom`은 `buyerName`·`buyer.username` 등을 찾지만 백엔드 `ChatRoomResponse`는 `buyerNickname`·`sellerNickname`을 보낸다. 마지막 메시지·안 읽은 수도 백엔드가 보내지 않아 비어 있다 | `frontend/src/features/chat/ChatList.tsx:574`, `domain/chat/dto/ChatRoomResponse.java` | #66 (소스 확인) |
| FE-29 | P3 | 대기 | 채팅방 헤더의 상대 이름이 항상 `학생`이고, 책 제목 자리에 첫 메시지 문장이 보인다. 헤더는 서버가 보내지 않는 `messages[0].sender`로 `김학생`/`학생`을 고르고, 첫 메시지를 ` - `로 잘라 책 제목으로 쓴다. 가짜 응답을 넣은 브라우저에서 확인했다 | `frontend/src/features/chat/ChatRoom.tsx:2868` | #66 (실행 확인) |
| FE-30 | P3 | 대기 | 번역 키 비교 스크립트 `check_keys.js`가 실행되지 않는다. `frontend/package.json`이 `"type": "module"`인데 스크립트는 `require`를 써서 `node check_keys.js`가 `ReferenceError: require is not defined in ES module scope`로 끝난다. 앱이 가져오지 않는 Node 스크립트라 TS 전환과 `allowJs` 해제(#68)에서 빠졌다. 고칠지(ESM·TS로 바꾸고 `src` 밖으로 옮기기) 지울지 정해야 한다 | `frontend/src/app/locales/check_keys.js` | #68 (실행 확인) |

### FE-13 상세

경로는 모두 `frontend/src/` 아래다. 괄호 안은 찾은 작업의 Issue 번호다.

- 쓰는 곳이 없는 모듈과 함수
  - `features/chat/api/reservations.ts`. `ChatRoom`은 자체 함수를 쓴다 (#44)
  - `shared/lib/daumPostcode.ts`. #37에서 마지막 사용처가 사라졌다 (#44)
  - `shared/api/auth.ts`의 `deleteAccount`, `features/chat/api/chat.ts`의 `getOrCreateChatRoom` 외 함수 4개 (#44)
  - `shared/ui`의 `Button`·`Input`, `Form`·`CommonCard`·`Layout`의 export 대부분 (#46)
  - `features/map/PlaceTypeFilter.tsx` (#52)
- export 구조: `shared/ui/index.ts`는 `Card.tsx`의 `Card`를 이름을 붙여 내보내므로, `export *`로 다시 내보내는 `CommonCard`의 같은 이름 `Card`는 가려져 index로 가져올 수 없다. `CardHeader` 등 나머지 `CommonCard` export는 index로 가져올 수 있다. `Search`·`Wanted`는 index의 `Card`와 `CommonCard`의 `CardTitle`을 함께 쓴다 (#46)
- 컴포넌트가 읽지 않는 props: `features/map/Navermap.tsx`의 `userLocation`·`routePath`·`showMyLocation`, `features/chatbot/ChatBotContent.tsx`의 `onClose` (#52)
- 여는 코드가 없는 UI: `features/account/MyPage.tsx`의 사진 메뉴(`showPhotoMenu`)와 편집 취소 모달(`showEditCancelConfirm`) (#60)
- 늘 같은 분기로 가는 코드
  - `features/wanted/WantedWrite.tsx:744`의 `handleBookSelect`는 검색 결과의 `category`·`department`를 읽지만 `normalizeBook`이 두 값을 만들지 않아 카테고리 추론 분기가 늘 기본값으로 간다 (#62)
  - `features/wanted/WantedDetail.tsx:526`의 사이드바 처리 함수에 있는 `comments`·`detail` 메뉴는 사이드바가 보내지 않는다 (#62)
- 쓰지 않는 import와 의존성: `features/marketplace/MyBookstore.tsx:16`은 `react-qr-code`를 가져오기만 한다. TS 변환이 이 import를 번들에서 지웠으므로 import 문과 `frontend/package.json`의 의존성을 지울 수 있다 (#64)
- 라우트: `app/App.tsx:192`는 `ChatRoomWrapper`만 그린다. 래퍼는 `ChatRoom`만 그리므로 라우트에서 바로 `ChatRoom`을 써도 된다 (#66)

지금까지 지운 것(PR 번호): 쓰지 않는 `Register` 화면과 `Login`이 `Header`에 넘기던 props(#57), `Map`이 `UserCategory`에 넘기던 props(#59), `MyPage`의 정의되지 않은 `setEditResults` 호출(#61), 래퍼가 `ChatRoom`에 넘기던 props(#67).

## 백엔드·운영 (BE, OPS)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 |
|---|---|---|---|---|---|
| BE-01 | P1 | 대기 | 닉네임 컬럼은 25자인데 가입 로직은 최대 50자로 만든다. 이메일 앞부분이 25자를 넘으면 가입이 실패한다 | `domain/user/domain/User.java:20`, `security/oauth/CustomOAuth2UserService.java:109` | C |
| BE-02 | P3 | 대기 | README는 JWT 비밀값을 base64라고 설명하지만 코드는 문자열의 UTF-8 바이트를 그대로 쓴다 | `auth/jwt/JwtTokenProvider.java:34`, `README.md` | C |
| BE-03 | P1 | 대기 | 백엔드 테스트가 `contextLoads`와 API 응답 모양 회귀 테스트 6개(`ApiContractTest`, #78)뿐이다. 서비스 로직·권한 검사 테스트가 없다. #78 리뷰가 제안한 보완: 응답 `Content-Type` 검사, 실제 알림 SSE 페이로드 검사 | `backend/src/test` | C, H-07, [PR #78 리뷰](reviews/2026-10-22-codex-pr78.md) |
| BE-04 | P3 | 대기 | 삭제한 로컬 이미지 URL을 다시 조회하면 404 대신 500을 반환한다. 포괄 예외 처리기가 `NoResourceFoundException`을 서버 오류로 바꾼다. PR #72의 기준 `11c8b6e`와 head `413fdee`에서 같은 MockMvc 검사로 재현했으며 #72의 회귀는 아니다 | `common/exception/GlobalExceptionHandler.java:115` | [PR #72 리뷰](reviews/2026-10-22-codex-pr72.md) (실행 확인) |
| OPS-01 | P2 | 대기 | 스키마 마이그레이션 도구가 없다 | `backend/src/main/resources/application.yml` | C, H-06 |
| OPS-02 | P2 | 대기 | DB 트랜잭션 안에서 외부 저장소에 업로드하고, 커밋 전에 알림을 보낸다 | `domain/post/service/SalePostService.java:41`, `:332`, `domain/chat/service/ChatReservationService.java` | H-06 |
| OPS-03 | P2 | 대기 | STOMP simple broker와 SSE emitter가 프로세스 메모리에 있어 인스턴스 1개에서만 동작한다. 이 전제를 문서와 설정에 명시해야 한다 | `config/WebSocketConfig.java`, `domain/notification/sse/EmitterRepository.java` | H-06 |
| OPS-05 | P2 | 대기 | WebClient 하나를 위해 webflux 전체를 쓴다. Boot 4.1에서 `spring-boot-starter-webclient`를 더했지만 webflux도 남아 있다(#78). macOS 전용 netty 의존성이 운영 빌드에 들어간다. `RestTemplate`에 제한 시간이 없다 | `backend/build.gradle.kts:36`, `:39`, `config/RestTemplateConfig.java` | C |
| OPS-06 | P3 | 대기 | Vercel `rewrite`와 서버리스 프록시가 함께 있고, 프록시가 보내는 `x-edge-key`를 백엔드가 검증하지 않는다. Cloud Run 주소가 하드코딩돼 있다 | `frontend/vercel.json`, `frontend/api/[...path].js`, `backend/src/main/resources/application.yml:190` | C |
| OPS-07 | P3 | 대기 | 코드 위생: `DepartmentNormalizer` 중복, `weather/utill` 오타, `catch (Exception …)` 43곳(2026-10-22), 작업 지시용 주석 | 여러 곳 | C |
| OPS-11 | P3 | 대기 | Boot 4.1 전환(#78)에서 동작에 필요한 것만 고치고 남긴 정리 작업이다. ① Jackson 2 databind를 직접 쓰는 4개 파일(`WantedCommentService`·`KmaClient`·`PlaceService`는 `new ObjectMapper()`를 만들고, `WeatherService`는 `KmaClient`가 돌려준 Jackson 2 `JsonNode`를 읽는다)과 Boot 4가 쓰지 않는 Jackson 2 모듈 의존성(`jackson-module-parameter-names`, `jackson-datatype-jsr310`) ② `build.gradle.kts`의 Tomcat·Jackson 버전 덮어쓰기(D-U). 다음 Boot 패치가 해당 보안 수정 이상을 관리하는지 확인한 뒤 줄별로 지운다. Renovate가 `extra[...]` 값을 올리지 못할 수 있다 ③ 4.1에서 새로 생긴 deprecated 경고: `ValueOperations.set(K,V,long,TimeUnit)`, Hibernate `@Check` ④ 테스트 로그의 `Serializing PageImpl instances as-is is not supported` 경고. `Page`를 그대로 응답하는 API(`/api/wanted` 등)의 JSON 계약을 정해야 한다 | `backend/build.gradle.kts`, `auth/jwt/JwtTokenRedisRepository.java:22`, `domain/post/domain/SalePost.java:26`, `domain/wanted/controller/WantedController.java:19` | #78 (실행 확인), [PR #78 리뷰](reviews/2026-10-22-codex-pr78.md) |

## 문서 (DOC)

| ID | 우선 | 상태 | 문제 | 위치 | 출처 |
|---|---|---|---|---|---|
| DOC-01 | P3 | 대기 | 영역별 개발 컨벤션 문서가 없다. NA-WA의 프론트엔드·백엔드 컨벤션은 Vue·MyBatis 기준이라 React·Spring Data JPA에 맞게 다시 써야 한다. TS 전환(FE-11)이 끝났으므로 실제 코드를 보고 쓴다 | `frontend/docs/`, `backend/docs/` | #11 |

## 완료

끝난 항목의 요약이다. 작업 과정과 측정값은 PR과 근거 문서에 있다.

| ID | PR | 요약 | 근거 |
|---|---|---|---|
| SEC-13 | #25 | 프론트 직접 의존성의 공개 취약점 49건을 패키지 제거(#23)와 Renovate 보안 PR로 고쳤다 | Renovate OSV 조회(#15) |
| SEC-14 | #27 | 전이 의존성의 공개 취약점 26건을 lockfile 갱신만으로 고쳤다. `pnpm audit` 0건 | `pnpm audit` (#24) |
| SEC-15 | #78 | 백엔드 런타임 의존성의 공개 취약점. 집계 기준은 Gradle `runtimeClasspath`에서 고른 아티팩트의 고유 모듈(BOM 제외)이고, 측정 스크립트는 PR #72 리뷰에 있다. Boot 3.5.10의 모듈 129개, 고유 권고 113건(critical 11)이 Boot 4.1.1과 같은 minor 패치 덮어쓰기 뒤 0건이 됐다(D-R, D-U) | [PR #72 리뷰](reviews/2026-10-22-codex-pr72.md#로컬-자동-검사), OSV querybatch (#71, #77) |
| SEC-16 | #74 | Node.js 24.21.0이 2026-10-21 보안 릴리스의 CVE 8건에 해당해 26.12.1로 올렸다(D-S) | nodejs.org 보안 릴리스 공지 (#73) |
| FE-01 | #37 | 닫힌 장소 상세 모달을 다시 열면 나던 "Rendered more hooks" 오류를 고치고 재현 테스트를 더했다 | H-05 |
| FE-04 | #23 | 쓰지 않는 의존성 6개(`next-auth` 등)를 지웠다 | C, H-05 |
| FE-07 | #33 | CRA 잔재 파일과 `web-vitals` 의존성을 지웠다 | C, H-07 |
| FE-09 | #29 | `i18next` 26·`react-i18next` 17로 올려 TypeScript 7과의 peer 충돌을 없앴다 | D-H |
| FE-10 | #43 | 구해요 글 삭제가 확인 모달을 거치게 했다. 나타나지 않던 채팅 재전송 UI를 지웠다(D-M) | #37 |
| FE-11 | #45, #47, #53, #57, #59, #61, #63, #65, #67, #69 | 프론트엔드 앱 소스를 5단계로 TypeScript로 옮기고 `allowJs`를 껐다(D-N) | D-N |
| FE-14 | #49 | 브라우저 탭·manifest 아이콘을 확정한 브랜드 아이콘으로 바꿨다(D-O) | #48 |
| FE-18 | #53 | `MapPlace`의 `category`·`description` 타입에 null을 더했다 | [PR #53 리뷰](reviews/2026-10-09-codex-pr51-pr53.md) (소스·타입 검사 확인) |
| FE-19 | #55 | 프론트엔드 `src`를 `app`·`features`·`shared` 세 층으로 옮겼다(D-P) | 사용자 요청 |
| FE-20 | #55 | auth 화면이 `app/i18n`을 가져와 D-P의 의존 방향을 어기던 import를 지웠다 | [PR #55 리뷰](reviews/2026-10-10-codex-pr55.md) (소스 확인) |
| BE-05 | #78 | 인증 거절 테스트의 `Location` 단언이 다른 경로·origin도 통과시키던 문제를 두 표기만 정확히 허용하도록 고쳤다 | [PR #78 리뷰](reviews/2026-10-22-codex-pr78.md) (실행 확인) |
| OPS-04 | #14 | 활성 CI를 만들었다 | C, H-07 |
| OPS-08 | #78 | OSS 지원이 끝난 Spring Boot 3.5.10을 4.1.1로 올렸다(D-U) | api.spring.io |
| OPS-09 | #51 | Husky가 Git LFS push 훅을 가리던 문제를 `.husky/pre-push`로 고쳤다 | #48, PR #49 (실행 확인) |
| OPS-10 | #72 | 이미지 저장소의 `gcp` 모드와 `spring-cloud-gcp` 의존성을 지웠다(D-R) | OSV querybatch (#71) |
| DOC-02 | #72 | PR #72의 의존성 수 집계 오류(212→120개)를 실제 고유 모듈 기준(218→129개)으로 바로잡았다 | [PR #72 리뷰](reviews/2026-10-22-codex-pr72.md) (실행 확인) |
