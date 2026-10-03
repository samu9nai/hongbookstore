# 홍책방 리팩토링 분석 및 독립 검토 요청

> 보관 메모(2026-10-03, Claude): 이 문서는 저장소 루트의 `REFACTORING_REVIEW.md`에서 옮겼다. 저장소를 `samu9nai/hongbookstore`로 이전했으므로 소스 링크의 저장소 경로만 바꿨다. 링크가 가리키는 커밋 `dab60c9`는 새 저장소에도 있다. 본문 내용은 바꾸지 않았다. 이 문서에 대한 Claude의 검토는 [2026-10-03-claude-review.md](2026-10-03-claude-review.md)에 있다.

분석 기준일: 2026-10-03, Asia/Seoul  
작성: Codex가 저장소를 읽고 수행한 분석과 로컬 검증 결과를 정리함  
목적: Claude가 기존 결론에 동의하거나 반박하고, 리팩토링 범위와 우선순위를 독립적으로 검토할 수 있도록 근거를 제공함

**1. 배경과 검토 요청**

사용자는 2025년에 진행한 홍익대학교 중고 교재 거래 프로젝트를 현재 시점에 맞게 리팩토링하려고 한다. 당시 Gemini 2.5와 GPT-4o를 활용해 개발했으며, 구현의 완성도를 다시 점검하고자 한다. 사용한 모델의 세대만으로 코드 품질이나 결함의 원인을 단정하지 않는다. 실제 코드, 명시된 계약, 실행 결과를 근거로 판단한다.

다음 저장소를 함께 검토했다.

| 저장소 | 역할 | 분석한 커밋 및 상태 |
|---|---|---|
| [HongikBookStore/HongBookStore](https://github.com/HongikBookStore/HongBookStore) | 원본 Spring Boot 백엔드와 React 프론트엔드 | `dab60c98c8c9547843af051aea452a5030a2aaa9`, main, archived |
| [samu9nai/hongbookstore-rev](https://github.com/samu9nai/hongbookstore-rev) | 개인 리팩토링용 포크와 로컬 작업 대상 | 원본과 동일한 커밋, main, 보관 처리되지 않음 |
| [HongikBookStore/toxic-filter](https://github.com/HongikBookStore/toxic-filter) | KcBERT 기반 유해 표현 추론 API | `812e89576a08b03ad41cb877201d60aac85a8ec6`, main, 보관 처리되지 않음 |

원본과 rev의 원격 HEAD, 로컬 HEAD가 같았다. 원본과 로컬 `src`의 291개 파일은 SHA-256 비교에서도 전부 같았다. 분석 시점의 rev에는 원본과 구분되는 리팩토링 구현이 없었다. 이 문서의 소스 링크는 분석한 커밋으로 고정했다. 이후 변경된 코드를 검토한다면 먼저 차이를 확인해야 한다.

Claude에게 요청하는 것은 분석의 독립 검토다. 코드 수정, 배포, 저장소 이름 변경은 이 문서의 요청 범위에 포함하지 않는다. 현재 결론을 정답으로 전제하지 말고, 근거가 약한 항목과 놓친 위험을 구분해 검토해 주길 바란다.

**2. Codex의 잠정 결론**

기존 React/Vite와 Spring Boot 구조를 유지하면서 핵심 거래 흐름부터 단계적으로 개선하는 방향을 추천한다. 우선순위는 권한·인증, 거래 상태의 일관성, 유해 표현 검사 계약, 회귀 테스트다. 전면 재작성이나 프레임워크 교체가 필요한 근거는 아직 확보하지 못했다.

유지할 기반도 있다. 백엔드는 도메인별 패키지와 서비스·저장소를 구분한다. `ImageStorage`는 local/GCP 구현을 분리한다. 기본 JPA 설정의 `open-in-view`는 false다. 예약 서비스에는 구매자·판매자·참가자 검사가 일부 구현돼 있다. 리팩토링은 이런 기반 위에서 누락된 계약과 경계를 보완하는 방식으로 진행할 수 있다.

| 영역 | 확인한 구성 |
|---|---|
| 백엔드 | Java 21, Spring Boot 3.5.10, Gradle Wrapper 9.2.1, Spring Security, JPA, WebClient, STOMP, SSE |
| 데이터·파일 | MySQL, Redis, local/GCP 이미지 저장소 |
| 프론트엔드 | React 19.2.4, Vite 7.2.4, JavaScript/JSX, React Router, styled-components |
| 추론 API | Python 3.13 계열 설정, Flask 3.1.2, PyTorch 2.8.0, Transformers 4.55.4, CPU 동적 양자화 시도 |
| 배포 파일 | 홍책방: Cloud Run·Vercel 관련 설정, 추론 API: Docker·Gunicorn |

**3. 근거를 읽는 기준**

- **실행 확인**: 해당 명령이나 임시 검사를 실제로 실행해 결과를 확인했다.
- **소스 확인**: 분석한 커밋의 구현이나 설정에서 직접 확인했다. 실제 서비스에서 같은 결과가 발생했음을 뜻하지 않는다.
- **위험 추론**: 구현에서 발생 가능한 실패를 도출했다. 통합·동시성·부하 검증이 추가로 필요하다.
- **제안**: 아직 구현하거나 확정하지 않은 개선 방향이다.

이 분석은 전수 보안 감사나 운영 품질 인증이 아니다. npm audit 결과도 서비스에서 악용 가능한 취약점 수와 같지 않다. 모델을 대체한 API 검사는 실제 모델의 정확도·성능을 검증하지 않는다.

**4. 홍책방에서 확인한 문제**

**H-01. 채팅의 사용자 식별과 방 참가자 검사 부족 — 최우선**

- 소스 확인: 메시지 이력 조회는 `roomId`로 데이터를 조회하며 로그인 사용자가 방 참가자인지 검사하지 않는다.
- 소스 확인: 메시지 전송은 요청 DTO의 `senderId`, `receiverId`, `roomId`, `salePostId`를 각각 조회한다. 발신자를 인증 주체에서 결정하지 않는다. `Principal`은 유해 표현 오류 응답에 사용한다.
- 소스 확인: `/ws-stomp/**`는 공개 경로다. WebSocket 설정은 모든 origin을 허용하며, 저장소 검색에서 CONNECT·SEND·SUBSCRIBE 권한을 검사하는 inbound interceptor나 메시지 보안 설정을 찾지 못했다.
- 위험 추론: 인증 여부와 별개로 타인의 방 조회·구독·발신자 위조를 막는 계약이 부족하다. 실제 공격이나 운영 서비스 접근으로 재현하지 않았다.
- 제안: 인증 주체에서 발신자를 결정하고, 이력 조회·SEND·SUBSCRIBE 각각에 방 참가자 검사를 적용한다. 요청의 방·판매글·수신자 관계도 서버에서 검증한다.

근거: [ChatMessageController.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/domain/chat/controller/ChatMessageController.java#L44), [WebSocketConfig.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/config/WebSocketConfig.java#L12), [SecurityConfig.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/config/SecurityConfig.java#L60)

**H-02. Access/Refresh 토큰의 용도와 수명주기 미분리 — 최우선**

- 소스 확인: Access와 Refresh 토큰은 같은 서명 키·생성 함수·클레임 구조를 사용하고 유효기간만 다르다. 일반 API 인증 필터는 토큰 종류를 검사하지 않는다.
- 위험 추론: 유효한 Refresh 토큰도 일반 API 인증 조건을 만족하는 구조다. 일반 API에 실제 Refresh 토큰을 보내는 통합 재현은 하지 않았다.
- 소스 확인: 로그인 성공 핸들러는 두 토큰을 URL query로 전달하고 프론트엔드는 localStorage에 저장한다. 재발급 API는 찾지 못했다. 로그아웃은 전달받은 Access 토큰을 Redis 블랙리스트에 등록한다.
- 제안: 토큰 용도 검증, 재발급·회전·폐기 정책을 먼저 정의한다. URL에 토큰을 싣는 흐름을 바꾸고 저장 방식도 검토한다. 쿠키를 선택한다면 배포 도메인·CSRF·SameSite 정책을 함께 설계한다.

근거: [JwtTokenProvider.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/auth/jwt/JwtTokenProvider.java#L43), [JwtAuthFilter.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/auth/jwt/JwtAuthFilter.java#L38), [OAuth2LoginSuccessHandler.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/security/oauth/handler/OAuth2LoginSuccessHandler.java#L45), [AuthService.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/auth/service/AuthService.java)

**H-03. 예약·판매글 상태 변경이 분리되고 권한 계약이 다름 — 높음**

- 소스 확인: 프론트엔드는 예약 확정·취소·완료 요청 뒤에 판매글 상태 변경 API를 별도로 호출한다. 확정·취소 흐름에는 두 번째 요청의 오류를 무시하는 코드가 있다. 완료 흐름은 오류를 알리지만 앞선 예약 완료를 되돌리지 않는다.
- 소스 확인: 화면은 판매자에게만 거래 완료를 허용하지만, 예약 서비스의 완료 메서드는 구매자를 포함한 방 참가자에게 허용한다. 어느 쪽이 의도한 정책인지 결정이 필요하다.
- 소스 확인: 예약 `upsert`는 호출마다 새 예약을 생성한다. 예약 엔티티에 `@Version`이 없고 저장소에 잠금 조회가 없다.
- 위험 추론: 두 번째 요청 실패 시 상태 불일치, 동시 상태 변경 시 경합, 중복 요청 시 예약 중복 가능성이 있다. 실제 DB 동시성 검증은 하지 않았다.
- 제안: 서버의 하나의 업무 명령·트랜잭션에서 예약과 판매글 상태를 함께 변경한다. 완료 권한, 활성 예약의 유일성, 허용 상태 전이, 멱등성 기준을 정한 뒤 낙관적 잠금이나 조건부 갱신 등을 선택한다.

근거: [ChatRoom.jsx](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/frontend/src/pages/Chat/ChatRoom.jsx#L1282), [ChatReservationService.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/domain/chat/service/ChatReservationService.java#L46), [예약 완료 권한](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/domain/chat/service/ChatReservationService.java#L152), [ChatReservation.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/domain/chat/domain/ChatReservation.java)

**H-04. 예약 시간의 offset 손실 — 높음**

- 소스 확인: `OffsetDateTime.parse(iso).toLocalDateTime()`으로 offset을 버린다. 알림용 Instant로 바꿀 때는 서버의 `ZoneId.systemDefault()`를 붙인다.
- 위험 추론: `12:30Z`를 서울 서버의 `12:30`으로 재해석하면 원래 시각과 9시간 차이가 난다. 이는 코드 경로에서 도출한 예시이며 실제 예약 화면·DB 통합 재현은 하지 않았다.
- 제안: 저장·전송 시각의 의미를 명시하고 Instant 등으로 통일한다. 표시할 때만 사용자 또는 서비스 시간대를 적용한다. 같은 순간을 나타내는 `Z`와 `+09:00` 입력을 비교하는 테스트가 필요하다.

근거: [ChatReservationService.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/domain/chat/service/ChatReservationService.java#L207)

**H-05. 프론트엔드 상태·API 접근 분산과 Hook 규칙 위반 — 높음**

- 실행 확인: ESLint가 장소 상세 모달의 조건부 Hook 호출 4건을 보고했다. 소스에서도 조기 반환 뒤 Hook 호출을 확인했다. 브라우저에서 모달을 열고 닫으며 재현하지는 않았다.
- 소스 확인: `AuthProvider`가 `main.jsx`와 `App.jsx`에 중복된다. 공통 Axios 클라이언트·직접 Axios 호출·fetch가 섞이고, 여러 페이지가 localStorage에서 사용자 정보와 토큰을 개별 해석한다.
- 소스 확인: PostWrite 2,180줄, ChatRoom 2,162줄, MyPage 1,730줄이다. 스타일·API 호출·인증·업무 상태·화면 표현을 함께 처리한다. 줄 수 자체보다 책임 혼합이 문제다.
- 소스 확인: React Query·Zod·NextAuth 의존성이 있지만 실제 사용을 소스에서 찾지 못했다. NextAuth의 peer dependency로 Next도 설치돼 있다.
- 제안: Hook 위반을 먼저 수정한다. 인증 상태와 API 접근을 단일화하고, 기능별 업무 Hook·화면 컴포넌트를 분리한다. TypeScript는 API DTO와 핵심 거래 기능부터 적용한다. 사용하지 않는 의존성은 사용 여부를 재확인한 뒤 제거한다.

근거: [PlaceDetailModal.jsx](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/frontend/src/components/PlaceDetailModal/PlaceDetailModal.jsx#L229), [main.jsx](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/frontend/src/main.jsx#L10), [App.jsx](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/frontend/src/App.jsx#L86), [package.json](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/frontend/package.json)

**H-06. DB·외부 저장소·알림의 운영 계약 부족 — 중간**

- 소스 확인: 기본 `ddl-auto`는 none, 개발 프로필은 update다. 추적 파일과 의존성에서 Flyway/Liquibase 또는 SQL 마이그레이션을 찾지 못했다.
- 소스 확인: 판매글 서비스는 DB 트랜잭션 안에서 외부 이미지 업로드를 수행한다. 외부 저장소는 DB 롤백에 참여하지 않는다. IOException 같은 checked exception의 롤백 정책도 검토해야 한다.
- 소스 확인: 예약 서비스는 트랜잭션 커밋 전에 알림을 호출한다. STOMP는 simple broker, SSE emitter는 프로세스 메모리에 보관한다.
- 범위 구분: Cloud Run YAML은 최대 인스턴스 1개다. 다중 인스턴스 메시지 전달은 확장 전 과제이며, 현재 운영 중 메시지가 유실됐다고 확인한 것은 아니다.
- 제안: 마이그레이션 기준선, 업로드 실패 보상, 커밋 후 알림을 먼저 마련한다. 초기 단일 인스턴스 운영 조건을 명시하고, 확장 요구가 생기면 pub/sub와 outbox의 필요성을 검토한다.

근거: [application.yml](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/resources/application.yml#L93), [SalePostService.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/domain/post/service/SalePostService.java#L41), [EmitterRepository.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/domain/notification/sse/EmitterRepository.java), [Cloud Run 설정](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/deploy/cloudrun/service.yaml#L14)

**H-07. 테스트·CI·의존성 관리 기반 부족 — 높음**

- 소스 및 실행 확인: 유일한 백엔드 테스트는 `contextLoads()`다. 프론트엔드 `App.test.js`는 CRA의 `learn react` 기본 테스트가 남아 있고, test script와 testing-library 의존성이 없다.
- 소스 확인: 활성 `.github/workflows`가 없고 배포 workflow는 비활성 폴더에 있다. rev의 Actions API 조회 결과 실행 기록은 0건이었다.
- 실행 확인: npm audit는 25개 취약 패키지 항목을 보고했다. 개발 도구·미사용 의존성·전이 의존성을 포함하므로 실행 경로별 분류가 필요하다.
- 호환성 검토: Gradle Wrapper는 9.2.1이다. 조회한 Spring Boot 3.5 공식 문서의 명시적 Gradle 지원 범위는 7·8이다. 이번 로컬 테스트 통과와 공식 지원 조합 여부는 구분해야 한다.
- 제안: 재현 가능한 실행 환경과 CI를 먼저 마련한다. 버전 업데이트는 업무 로직 변경과 분리한다. 권한·예약 전이·검사 실패 정책을 회귀 테스트로 고정한다.

근거: [백엔드 테스트](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/test/java/com/hongik/books/HongBookStoreApplicationTests.java), [프론트 테스트](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/frontend/src/App.test.js), [Gradle Wrapper](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/gradle/wrapper/gradle-wrapper.properties), [Spring Boot 3.5 시스템 요구사항](https://docs.spring.io/spring-boot/3.5/system-requirements.html)

추가 소스 관찰: CORS 환경변수를 읽지만 실제 허용 origin은 하드코딩돼 있다. 메인 JS 번들이 크고 페이지를 정적으로 import한다. 이 항목들은 권한·정합성 수정 후 설정 계약 정리와 라우트 분할 대상으로 다룰 수 있다.

근거: [CORS 설정](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/config/SecurityConfig.java#L134)

**5. toxic-filter와 홍책방 연동에서 확인한 문제**

이 저장소는 저장된 Hugging Face 분류 모델을 불러와 추론하는 API다. 저장소에서 모델 파일, 학습 코드, 데이터셋, 정량 평가 결과를 찾지 못했다. 학습을 하지 않았다는 뜻은 아니며, 저장소만으로 학습 과정과 품질을 검증할 수 없다는 뜻이다.

**T-01. 입력 길이 제한과 실패 처리의 결합 — 높음**

- 소스 확인: 홍책방 판매글 본문은 최대 5,000자를 허용한다. 추론 API는 2,000자 초과 입력에 413을 반환한다.
- 실행 확인: 실제 Flask 라우팅에 모델 부분을 대체한 검사에서 2,001자 입력의 413 응답을 확인했다.
- 소스 확인: 홍책방 WebClient는 오류 응답을 빈 결과로 바꾸고, `blocked=false`, `predictionLevel="비속어 아님"`, `reason="unavailable"`로 반환한다.
- 범위 구분: 본문에 WARN 정책을 적용한 경우 원래도 차단하지 않는다. 핵심 문제는 2,001~5,000자 본문을 정상적으로 검사하지 못한다는 점이다. 같은 클라이언트는 BLOCK 정책에서도 검사 실패를 허용한다. Spring↔Flask 실제 통합 재현은 하지 않았다.
- 제안: 입력 길이·토큰 범위를 맞추거나 분할 검사 정책을 정한다. 정상 판정과 검사 불가를 분리한다.

근거: [홍책방 본문 제한](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/domain/post/dto/SalePostCreateRequestDTO.java#L25), [추론 API 제한](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/app.py#L187), [홍책방 실패 처리](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/moderation/toxic/ToxicFilterClient.java#L39)

**T-02. 검사 불가를 정상 판정처럼 표현 — 높음**

- 소스 확인: 인증 오류, 모델 오류, 시간 초과 등의 결과를 홍책방이 허용으로 처리한다. reason은 남지만 판정 문자열은 정상으로 바뀐다.
- 소스 확인: 홍책방 필터 호출 timeout은 70초, 홍책방 Cloud Run YAML의 요청 제한 시간은 60초다. 추론 서버 Gunicorn timeout은 120초다. 실제 배포 설정은 확인하지 않았다.
- 제안: 검사 결과와 게시 허용 결정을 분리한다. `CLEAN`, `TOXIC`, `UNAVAILABLE`, `UNSUPPORTED` 같은 기계 판독용 결과를 정의하고, 기능별 fail-open·차단·대기 정책을 결정한다. 외부 호출 제한 시간은 상위 요청의 시간 예산 안에 맞춘다. 구체적인 enum 이름은 제안이다.

근거: [Result.allowed](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/moderation/toxic/ToxicFilterClient.java#L117), [ModerationService.java](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/moderation/ModerationService.java), [추론 서버 Dockerfile](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/Dockerfile)

**T-03. 지원 언어와 실제 검사 범위가 정상 응답에 드러나지 않음 — 높음**

- 소스 확인: 완성형 한글 음절이 없으면 모델 추론 없이 정상 확률 1.0을 반환한다. 영어와 자모만 있는 입력도 해당한다.
- 실행 확인: 모델을 대체한 상태에서 영어 욕설과 `ㅅㅂ` 입력이 해당 분기로 들어가 정상 응답을 반환했다. 실제 모델의 탐지 능력을 검사한 결과가 아니다.
- 소스 확인: tokenizer에 `truncation=True`, `max_length=128`을 적용한다. 2,000자 이하라도 128토큰을 넘는 부분은 검사 대상에서 잘릴 수 있다.
- 제안: 한국어 전용인지 다국어까지 지원할지 결정한다. 미지원 언어를 정상으로 단정하지 않는다. 자모 정규화와 긴 글 분할은 오탐·문맥 손실까지 평가한 뒤 적용한다.

근거: [언어 분기와 토큰 제한](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/app.py#L114)

**T-04. 모델 준비 상태·입력 검증·HTTP 오류 계약 부족 — 높음/중간**

실제 Flask 테스트 클라이언트로 다음 동작을 확인했다. Torch/Transformers와 백그라운드 모델 로딩은 대체했다.

| 입력 또는 상태 | 관찰한 응답·동작 | 검토할 계약 |
|---|---|---|
| 모델이 준비되지 않은 `/health` | 200, `model_ready=false` | 생존 확인과 준비 상태 확인 분리 |
| API_KEY 설정 후 키 없는 `/health` | 401 | 배포 프로브와 인증 정책 일치 |
| API_KEY 설정 후 브라우저 preflight | 401 | 브라우저 직접 호출을 지원할지 결정. 현재 Spring 서버 간 호출에는 preflight가 없음 |
| `/predict`에 JSON 배열 전송 | 500 | 객체 형태 검증 후 400 |
| 존재하지 않는 경로 | 500 | HTTP 예외의 404 상태 보존 |
| 모델 미준비 상태에서 잘못된 입력 | 모델 로드 시도 후 400 | 저비용 입력 검증을 로드보다 먼저 수행 |

근거: [인증 검사](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/app.py#L97), [헬스체크](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/app.py#L155), [요청·오류 처리](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/app.py#L172)

**T-05. 모델 판정과 화면의 설명 근거가 다름 — 중간**

- 소스 확인: 추론 API는 text, prediction_level, probabilities만 반환한다. 문제 단어·구간을 나타내는 flagged는 제공하지 않는다.
- 소스 확인: 홍책방은 flagged 필드를 받을 수 있게 구현돼 있다. 프론트엔드는 구간이 없으면 자체 정규식으로 문제 단어를 추측한다.
- 위험 추론: 사용자가 화면의 단어 표시를 모델이 실제로 판단한 근거로 오해할 수 있다. 실제 화면 표현은 브라우저로 확인하지 않았다.
- 제안: 문장 분류 결과와 규칙 기반 강조 표시를 구분한다. 모델이 제공하지 않는 설명을 확정적인 판정 근거로 표시하지 않는다.

근거: [추론 응답](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/app.py#L197), [홍책방 수신 DTO](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/java/com/hongik/books/moderation/toxic/ToxicFilterClient.java#L125), [프론트의 단어 탐색](https://github.com/samu9nai/hongbookstore/blob/dab60c98c8c9547843af051aea452a5030a2aaa9/src/main/frontend/src/pages/Chat/ChatRoom.jsx#L2013)

**T-06. 모델 품질·배포 재현성의 근거 부족 — 중간**

- 소스 확인: 서버의 기본 임계치는 확실 0.999, 애매 0.9다. 예제 스크립트는 argmax로 판정하므로 기준이 다르다. 임계치를 선택한 평가 자료는 저장소에서 찾지 못했다.
- 소스 확인: 라벨 순서를 0=악성, 1=정상으로 가정한다. 모델 아티팩트가 없어 실제 설정과 일치하는지 확인하지 못했다.
- 소스 확인: 서버는 CPU 동적 양자화를 시도하며 실패 시 예외를 무시하고 계속한다. 양자화 전후 품질·처리량 자료는 없다.
- 소스 확인: Docker 빌드는 저장소에 없는 `kcbert_model.tar.gz`를 요구한다. 모델 위치·체크섬·버전·사용 조건을 재현할 정보가 추가로 필요하다.
- 소스 확인: pyproject/uv.lock과 Docker용 requirements-server.txt가 별도로 존재한다. smoke_test.sh는 결과를 출력하지만 기대 판정·HTTP 상태를 검증하지 않는다. health 실패를 무시하고 API 키도 health 요청에는 전달하지 않는다.
- 제안: 모델 버전·라벨·임계치·의존성을 함께 관리한다. 교재명, 인용문, 자모, 다국어, 긴 글을 포함한 평가셋에서 오탐·미탐을 측정한다. 그 결과로 현재 모델 유지·재학습·교체를 결정한다.

근거: [모델 로드와 양자화](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/app.py#L49), [예제 판정](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/example_prediction.py), [Dockerfile](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/Dockerfile), [smoke_test.sh](https://github.com/HongikBookStore/toxic-filter/blob/812e89576a08b03ad41cb877201d60aac85a8ec6/scripts/smoke_test.sh)

**6. 실제 수행한 검증과 한계**

아래 결과는 이 문서를 작성하기 전 같은 분석 세션에서 실행한 결과다. 문서 작성 때문에 모든 검사를 재실행하지는 않았다.

| 검사 | 결과 | 결과가 보장하지 않는 것 |
|---|---|---|
| 원격 저장소 메타데이터·HEAD 조회 | 원본·rev·toxic-filter 기준 커밋 확인 | 원격 배포 상태 |
| 원본과 로컬 src 해시 비교 | 291개 파일 모두 일치 | 저장소 밖의 DB·모델·운영 설정 일치 |
| `./gradlew test --no-daemon` | 테스트 1개 통과, 실패 0개. H2 테스트 프로필의 contextLoads | 실제 MySQL/Redis 업무 흐름, 권한, 동시성 |
| `npm ci --ignore-scripts --no-audit --no-fund` | lockfile 기준 설치 완료 | 설치 스크립트가 필요한 모든 도구의 동작 |
| `npm run build` | 통과. 메인 JS 1,048.21 kB, gzip 308.36 kB | 브라우저 기능·성능·접근성 |
| 프론트 빌드 경고 | 500 kB 초과 청크, stompjs의 Node `net` 모듈 참조 경고 | 실제 채팅 연결 실패를 확인한 것은 아님 |
| `npm run lint -- --format json` | 68개 파일 검사, 37개 파일에서 문제. 오류 227개·경고 24개 | 모든 항목이 런타임 버그라는 뜻은 아님 |
| `npm audit --json` | 25개 패키지 항목: critical 2, high 16, moderate 6, low 1 | 운영 중 악용 가능한 취약점 25건이라는 뜻은 아님 |
| toxic-filter 임시 동작 검사 | 10개 검사에서 예상한 현재 동작 재현 | 모델 정확도·Torch 실행·전체 서비스 품질 |
| rev Actions 기록 조회 | 실행 기록 0건 | CI 통과를 주장할 수 없음 |

린트에는 환경 설정으로 인한 `process`·테스트 전역 변수 오류, 미사용 변수, 빈 catch, Hook 관련 항목이 섞여 있다. 전체 건수를 동일한 심각도로 다루지 않는다. 조건부 Hook 4건은 별도 수정 대상으로 확인했다.

npm audit의 critical 항목은 next·next-auth였다. 해당 앱은 Vite를 사용하며 소스에서 NextAuth 사용을 찾지 못했다. 불필요한 의존성 여부와 실제 실행 경로를 확인한 뒤 제거·업데이트해야 한다. 자동 수정은 실행하지 않았다.

toxic-filter 검사는 Python 3.13.5 임시 환경에 Flask 3.1.2와 flask-cors 6.0.1을 설치해 수행했다. Torch/Transformers 모듈과 백그라운드 warmup은 대체했다. 검사 10개는 다음 현재 동작을 확인하도록 작성했다.

1. text 누락 → 400.
2. 2,001자 입력 → 413.
3. JSON 배열 입력 → 500.
4. 모델 미준비 health → 200과 model_ready=false.
5. API 키 설정 시 키 없는 health → 401.
6. API 키 설정 시 인증 키 없는 preflight → 401.
7. 없는 경로 → 500.
8. 자모만 있는 입력 → 추론 없이 정상 확률 1.0.
9. 영어 입력 → 추론 없이 정상 판정, flagged 없음.
10. 잘못된 입력도 검증 전에 모델 로드를 시도함.

이 검사들의 통과는 결함이 없다는 뜻이 아니다. 일부 검사는 문제로 지적한 현재 동작을 재현하도록 작성했다. 저장소의 정식 회귀 테스트로 추가하거나 수정한 것은 아니다.

실행하지 않은 검증과 이유는 다음과 같다.

- 프론트 기능 테스트: 실행 스크립트와 필요한 testing-library 의존성이 없다.
- 실제 MySQL·Redis 통합, OAuth 로그인, 브라우저 전체 거래 흐름: 독립된 테스트 데이터·서비스 환경을 구성하지 않았다.
- 예약 동시성·부하·다중 인스턴스 전달: 해당 시나리오를 구성하거나 실행하지 않았다.
- 실제 모델 추론·정확도·양자화 품질·처리량: 모델 아티팩트와 평가 데이터가 제공되지 않았다.
- Docker 이미지·원격 배포·Spring↔Flask 실통합: 실행하지 않았다. 실제 클라우드 설정을 저장소 설정과 대조하지 않았다.
- 백엔드 의존성의 전수 취약점 검사: 수행하지 않았다.

**7. 제안하는 리팩토링 순서와 완료 기준**

| 단계 | 작업 범위 | 검증 기준 |
|---|---|---|
| 1. 재현 기준 확보 | 로컬 환경·DB 초기화·CI 정리, 주요 동작의 회귀 테스트 작성 | 새 환경에서 동일 명령으로 실행·테스트 재현. build/lint/test 결과를 구분해 기록 |
| 2. 권한·인증 수정 | 채팅 참가자 검사, 서버 기준 발신자 식별, 토큰 용도·재발급·폐기 | 비참가자의 조회·구독·전송 차단. Refresh 토큰의 일반 API 인증 차단 |
| 3. 거래 규칙 통합 | 예약·판매 상태의 원자적 변경, 완료 권한·멱등성·시간대·동시성 처리 | 중간 실패에도 상태 일치. 중복·동시 요청 결과가 정의한 규칙을 만족. 동치 시각 입력 결과 일치 |
| 4. 검사 API 계약 정리 | 길이·토큰 범위, 검사 불가 상태, 장애 정책, readiness, 응답 스키마 | 2,001~5,000자·미지원 언어·API 인증 실패·모델 미준비·timeout을 정상 판정과 구분 |
| 5. 프론트 구조 개선 | 단일 인증 상태·API 접근, Hook 수정, 기능별 분리, 점진적 TypeScript | 모달·로그인·게시·예약 핵심 흐름 회귀 테스트 통과. 실제 Hook 규칙 위반 제거 |
| 6. 운영·모델·성능 개선 | DB 마이그레이션, 외부 저장소 실패 보상, 커밋 후 알림, 라우트 분할, 의존성 정리, 모델 평가 | 재시작·업로드 실패·외부 장애 시나리오 검증. 오탐·미탐·추론 지연의 기준선 확보 |

단계는 큰 방향이며, 최우선 권한 수정은 최소한의 재현 테스트를 확보하는 즉시 진행할 수 있다. 모든 기반 작업이 끝날 때까지 미룰 필요는 없다. 기능 변경과 프레임워크 메이저 업데이트는 별도 변경으로 검증한다.

**8. 저장소 이름 제안**

| 후보 | 판단 |
|---|---|
| `hongbookstore` | 1순위. 제품 이름을 유지하고 장기 개발에 사용하기 좋다. 원본과는 소유자 경로로 구분할 수 있다 |
| `hongbookstore-renewal` | 2순위. 개인 고도화 프로젝트임을 이름에서 드러내고 싶을 때 적합하다 |
| `hongbookstore-rev` | 사용할 수 있지만 revision·revamp 등 의미가 모호하다 |
| `hongbookstore-v2` / `hongbookstore-rebuild` | 새 버전 또는 전면 재작성이라는 인상이 강하다. 해당 범위를 확정한 뒤 선택하는 편이 좋다 |

제안 설명: “홍책방 고도화 — 중고 교재 거래의 권한·정합성·운영 안정성 개선”. 이름 변경은 실행하지 않았다.

**9. Claude에게 받고 싶은 검토 결과**

1. H-01~H-07, T-01~T-06 각각에 대해 동의·부분 동의·반박을 구분해 달라. 결함, 의도된 정책, 검증이 필요한 가정을 분리해 달라.
2. 위 분석에서 과장했거나 잘못 해석한 항목을 찾아 달라. 가능한 경우 해당 커밋의 파일·라인과 반례를 제시해 달라.
3. 놓친 높은 우선순위의 문제를 제시해 달라. 단순 스타일 선호와 사용자·데이터에 영향을 주는 문제를 구분해 달라.
4. 기존 스택 유지와 단계적 개선이 적절한지 평가해 달라. 전면 재작성이나 다른 프레임워크가 필요하다면 비용·이득·전환 위험을 근거로 설명해 달라.
5. 첫 세 개의 변경 단위에 무엇을 담을지 제안해 달라. 각 변경의 범위, 선행 결정, 완료 테스트를 적어 달라.
6. 거래 완료 권한, 활성 예약 유일성, 인증 저장 방식, 검사 장애 시 게시 허용 정책에서 사용자가 결정해야 할 내용을 추려 달라.
7. toxic-filter 모델을 유지·재학습·교체하기 전에 확보해야 할 아티팩트와 평가 기준을 제안해 달라. 모델 성능은 아직 확인되지 않았다는 전제를 지켜 달라.
8. 저장소 이름 제안도 평가해 달라.

소스를 직접 확인하지 못한 항목은 문서에 근거한 잠정 의견이라고 표시해 주길 바란다. 테스트·실제 DB·브라우저·원격 배포 결과는 각각 구분하고, 실행하지 않은 검증을 성공으로 표현하지 않는다.

**10. 변경 및 검토 이력**

- 최초 분석과 후속 toxic-filter 분석에서는 애플리케이션 소스·설정·lockfile을 변경하지 않았다. 검사용 의존성, 빌드 산출물, 임시 저장소 복제본·검사 도구만 생성했다.
- 원본 저장소 분석은 사용자의 승인을 받아 서브에이전트가 수행했다. 부모 에이전트는 로컬 구현과 검증 결과를 함께 검토했다.
- 이번 요청으로 추가한 산출물은 이 Markdown 문서다. 분석 결과의 확정 범위를 넓히는 새로운 런타임 주장은 추가하지 않았다.
- 비밀값이나 실제 DB 접속정보는 문서에 포함하지 않았다. Claude에게 직접 전송하거나 게시하지 않았다.
