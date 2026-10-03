# Codex 초기 분석에 대한 Claude 검토

- 대상: [2026-10-03-codex-initial-analysis.md](2026-10-03-codex-initial-analysis.md)
- 기준 커밋: `dab60c9` (원본 HongBookStore main과 같다)
- 작성: Claude, 2026-10-03
- 함께 본 자료: 같은 날 Claude가 따로 수행한 저장소 분석. 그 분석의 보안 항목 번호를 `C-1` ~ `C-11`로 적는다.

이 문서를 읽으면 두 분석이 어디서 일치하고 어디서 갈리는지, 그리고 [backlog.md](../backlog.md)의 우선순위가 왜 그렇게 정해졌는지 알 수 있다.

## 1. 결론

Codex 분석에서 틀린 주장은 찾지 못했다. 과장된 항목은 H-04 하나다.
다만 **다른 사용자의 데이터를 바꾸거나 읽을 수 있는 결함 여러 개(C-1 ~ C-5)를 놓쳤고**, 이 결함들이 H-01보다 먼저다.
반대로 거래 정합성(H-03)과 검사 범위(T-01, T-03)는 Codex가 Claude 분석보다 깊게 봤다.

## 2. 항목별 판정

근거 수준: **실행** = 명령으로 확인, **소스** = 코드에서 확인, **추론** = 코드에서 도출했고 재현하지 않음.

| 항목 | 판정 | 근거 수준 | 근거 |
|---|---|---|---|
| H-01 채팅 참가자 검사 | 동의. 심각도는 더 높다 | 소스 | STOMP에는 참가자 검사뿐 아니라 인증 자체가 없다. 클라이언트도 `stomp.connect({})`로 헤더 없이 연결한다 (`ChatRoom.jsx:1010`) |
| H-02 토큰 용도 미분리 | 동의 | 소스 | C-6, C-7과 같다 |
| H-03 예약·판매글 상태 분리 | 동의 | 소스 | 수락·거절 흐름이 두 번째 요청의 실패를 빈 `catch`로 삼킨다. `upsert`는 매번 새 행을 만든다. `ChatReservation`에 `@Version`·유일성 제약이 없다 |
| H-04 예약 시각 offset 손실 | 부분 동의. 심각도 과장 | 소스 | 코드 경로는 맞다 (`ChatReservationService.java:207`). 그러나 현재 화면은 `normalizeDateTime()`으로 `YYYY-MM-DDT12:00:00`처럼 offset 없는 값만 보낸다. 운영 컨테이너도 `TZ=Asia/Seoul`이다. 현재 흐름에서는 오차가 생기지 않는 잠재 결함이다 |
| H-05 프론트 Hook·상태 분산 | 동의 | 실행 | eslint로 조건부 Hook 4건을 재현했다 (`PlaceDetailModal.jsx:522`, `:545`, `:588`, `:671`). `AuthProvider` 이중 감싸기도 확인했다 |
| H-06 운영 계약 | 동의 | 소스 | `SalePostService`는 클래스 단위 `@Transactional` 안에서 `uploadImage`를 호출한다 |
| H-07 테스트·CI | 동의 | 실행 | Gradle 9 지원 범위에 대한 주장은 확인하지 못했다. 로컬 `./gradlew test`는 통과한다 |
| T-01 길이 불일치 | 동의 | 소스 | 본문 `@Size(max = 5000)`은 `SalePostCreateRequestDTO.java:27`에 있다 (문서의 `:25`가 아니다) |
| T-02 검사 불가를 정상으로 표현 | 동의 | 소스 | Cloud Run `timeoutSeconds: 60` < 클라이언트 70초를 확인했다 |
| T-03 언어 범위·토큰 절단 | 동의 | 소스 | 128토큰 절단은 Claude 분석이 놓쳤다 |
| T-04 HTTP 오류 계약 | 동의 | 확인 안 함 | Codex의 Flask 테스트를 다시 실행하지 않았다 |
| T-05 flagged 불일치 | 동의 | 소스 | |
| T-06 모델 재현성 | 동의 | 소스 | |

## 3. Codex 분석이 놓친 결함

| 번호 | 결함 | 위치 | 백로그 |
|---|---|---|---|
| C-1 | 로그인한 사용자는 누구나 다른 회원을 수정·삭제할 수 있고, 조회로 다른 회원의 email·univEmail을 얻는다 | `UserController.java:47`, `:74` | SEC-01 |
| C-2 | 구해요 글·댓글이 요청 헤더 `X-User-Id`로 작성자를 정한다 | `WantedController.java:40`, `WantedCommentService.java:268` | SEC-02 |
| C-3 | SSE 구독이 JWT 서명을 검증하지 않는다 | `NotificationController.java:34` | SEC-03 |
| C-4 | STOMP 인증·인가가 없다 (H-01과 겹친다) | `WebSocketConfig.java:14` | SEC-04 |
| C-5 | OAuth 인가 요청 쿠키를 Java 역직렬화한다 | `CookieUtils.java:52` | SEC-05 |
| C-6 | 토큰을 URL 쿼리로 전달한다 (H-02와 겹친다) | `OAuth2LoginSuccessHandler.java:52` | SEC-06 |
| C-7 | refresh 토큰으로 일반 API를 호출할 수 있다 (H-02와 겹친다) | `JwtTokenProvider.java:48` | SEC-07 |
| C-8 | CORS가 `https://*.vercel.app`을 credentials와 함께 허용한다. Codex는 "설정 계약 정리"로 낮게 분류했다 | `SecurityConfig.java:144` | SEC-09 |
| C-9 | 소셜 계정을 이메일만으로 합친다 | `CustomOAuth2UserService.java:66` | SEC-08 |
| C-10 | 업로드 파일 형식을 검증하지 않는다 | `GcpStorageUtil.java:45` | SEC-10 |
| C-11 | 외부 지도 API 프록시가 공개돼 있다 | `SecurityConfig.java` | SEC-11 |

이 밖에 닉네임 길이 불일치(BE-01)와 `gunicorn==22.0.0` 버전(MOD-05)을 추가로 찾았다.

C-1, C-2, C-3의 공통 원인은 **인증 주체를 얻는 방법이 세 가지로 갈린 것**이다.
`@AuthenticationPrincipal LoginUserDTO`, 리플렉션으로 `getId()`를 추측하는 코드, 요청 헤더가 섞여 있다.
`LoginUserDTO`는 record라서 `getId()`가 없고, 리플렉션이 실패하면 헤더 값을 쓴다.
그래서 첫 보안 작업은 이 경로를 하나로 통일하는 것이다.

## 4. 스택 유지 판단

기존 React/Vite + Spring Boot를 유지하고 단계적으로 고치자는 Codex의 결론에 동의한다.
찾은 결함은 모두 빠진 검사와 갈라진 계약이고, 프레임워크의 한계에서 온 것이 아니다.
메이저 업그레이드를 기능 변경과 분리하자는 원칙에도 동의한다.

## 5. 작업 순서

Codex는 "재현 기준 확보(CI 등)"를 1단계로 두었다. Claude는 최소 CI를 첫 변경에 함께 넣고 바로 권한 수정으로 가는 순서를 제안한다.
P0 결함은 수정 범위가 작고 MockMvc 테스트로 고정하기 쉽기 때문이다.
현재 합의된 순서는 [backlog.md의 다음 작업 순서](../backlog.md#다음-작업-순서-제안)에 있다.

사용자가 정해야 하는 정책은 [decisions.md](../decisions.md)의 D-01 ~ D-07로 옮겼다.

## 6. toxic-filter 모델 판단 전에 확보할 것

모델 성능은 아직 누구도 확인하지 않았다는 전제에서 정리한다.

- **아티팩트**: 모델 tarball과 체크섬, 베이스 모델·데이터셋의 출처와 라이선스, `config.json`의 `id2label`(0=악성 가정 확인), 학습 스크립트와 하이퍼파라미터.
- **평가셋**: 서비스 도메인 문장을 넣는다. 교재 제목(예: "죽음의 수용소에서"), 인용문, 자모·초성 욕설, 숫자를 섞은 변형, 영어, 128토큰을 넘는 긴 글.
- **지표**: 임계치 0.9와 0.999에서의 정밀도·재현율, 미탐 사례 목록, CPU p95 지연, 양자화 전후 정확도 차이.

이 지표가 나온 뒤에 유지·재학습·교체를 비교한다 (D-05).

## 7. 저장소 이름

Codex가 추천한 `hongbookstore`에 동의한다. 단계적 개선이라면 `-v2`는 재작성이라는 인상을 준다.
2026-10-03에 `samu9nai/hongbookstore`로 이전했다 (D-A).

## 8. 검증 범위

- 실행: `./gradlew test`, `npm run build`, `npm run lint`, `npm audit --omit=dev`, `PlaceDetailModal.jsx` eslint.
- 소스 확인: 2절과 3절의 모든 위치.
- 실행하지 않음: toxic-filter 동작 검사(모델 아티팩트 없음, Codex 검사 재실행 안 함), 실제 MySQL·Redis 통합, 브라우저, 원격 배포, 공격 요청 재현.
- 확인하지 못한 외부 사실: Gradle 9와 Spring Boot 3.5의 공식 지원 범위, `gunicorn` 22.0.0의 취약점.
