# AGENTS.md — 홍책방 저장소 작업 규칙

이 문서는 이 저장소에서 일하는 모든 코딩 에이전트(Claude Code, Codex 등)와 사람이 따르는 규칙의 정본이다.
`CLAUDE.md`는 이 문서를 불러오기만 한다. 규칙을 바꿀 때는 이 문서만 고친다.

## 프로젝트 한 줄 요약

홍익대학교 학생 전용 중고 교재 거래 플랫폼이다. 2025학년도 졸업프로젝트
[HongikBookStore/HongBookStore](https://github.com/HongikBookStore/HongBookStore)(보관됨)를 이어받아
보안·정합성·운영 안정성을 단계적으로 고도화한다. 전면 재작성이나 프레임워크 교체는 하지 않는다.

## 먼저 읽을 문서

| 문서 | 언제 읽는가 |
|---|---|
| [docs/architecture.md](docs/architecture.md) | 코드 구조와 요청 흐름을 파악할 때 |
| [docs/backlog.md](docs/backlog.md) | 작업을 고르거나, 고치려는 코드에 알려진 결함이 있는지 확인할 때 |
| [docs/decisions.md](docs/decisions.md) | 정책이 걸린 코드를 바꾸기 전에. **미결정 항목을 임의로 정하지 않는다** |
| [docs/reviews/](docs/reviews/) | 이전 분석·리뷰의 근거를 확인할 때 |

## 저장소 구성

| 경로 | 내용 |
|---|---|
| `backend/src/main/java/com/hongik/books` | Spring Boot 백엔드 (Java 21, Boot 3.5) |
| `backend/src/main/resources/application.yml` | 백엔드 설정. 비밀값은 `backend/.env`(커밋 금지)에서 읽는다 |
| `backend/src/test` | 백엔드 테스트. `test` 프로필은 H2를 쓴다 |
| `frontend` | React 19 + Vite 8 프론트엔드. JavaScript/JSX에서 TypeScript로 옮기는 중이다(FE-11) |
| `package.json`, `pnpm-workspace.yaml` | pnpm 워크스페이스 루트. husky·lint-staged 커밋 훅을 둔다 |
| `renovate.json` | 의존성 업데이트 설정. 월 1회, 새 버전은 3일 뒤에 제안한다. major는 Dependency Dashboard에서 승인해야 PR이 열리고, 보안 수정은 일정과 대기 없이 바로 열린다 |
| `deploy/` | Cloud Run·Vercel 배포 스크립트와 가이드 |
| `.github/workflows/ci.yml` | PR과 `main` push마다 백엔드 테스트, 프론트 검사, e2e를 실행한다 |
| `.github/workflows-disabled/` | 비활성 배포 workflow |

유해 표현 검사 API는 별도 저장소 [HongikBookStore/toxic-filter](https://github.com/HongikBookStore/toxic-filter)에 있다.

## 검증 명령

코드를 바꾸면 해당 영역의 명령을 실행한 뒤에 완료를 보고한다.

| 영역 | 명령 | 현재 기준선 (2026-10-03) |
|---|---|---|
| 백엔드 컴파일·테스트 | `cd backend && ./gradlew test` | 통과. 테스트는 `contextLoads` 1개뿐이다 |
| 프론트 설치 | `pnpm install` (저장소 루트) | Node 24.21.0(`.node-version`), pnpm 12.8.1(`packageManager`, corepack) |
| 프론트 빌드 | `pnpm build` | 통과. 메인 JS 청크 약 1,056 kB |
| 프론트 타입 검사 | `pnpm type-check` | 통과. TypeScript 7이 `.ts`·`.tsx`만 `strict`로 검사한다(`allowJs`, `checkJs: false`). 앱이 읽는 환경 변수와 전역 값의 타입은 `src/env.d.ts`에 있다 |
| 프론트 린트 | `pnpm lint` | **오류 51개, 경고 2개** (oxlint type-aware). 바꾼 파일의 오류·경고는 0건으로 만든다(D-L) |
| 프론트 서식 | `pnpm format:check` | 통과 (Prettier) |
| 프론트 단위 테스트 | `pnpm test:unit --run` | 통과. Vitest 테스트 7개. DOM이 필요한 테스트는 파일 첫 줄에 `// @vitest-environment jsdom`을 적는다 |
| 프론트 e2e | `pnpm test:e2e` | 통과. 백엔드 없는 홈 화면 스모크 1개(Chromium). 처음 한 번 `pnpm --filter @hongbookstore/frontend exec playwright install chromium`이 필요하다 |

- 커밋하면 pre-commit 훅이 스테이징한 프론트 파일에 oxlint `--fix`와 Prettier를 실행한다. 오류가 남으면 커밋을 막는다.
- CI는 위 명령을 같은 순서로 실행한다. 린트만은 기준선 오류 때문에 전체가 아니라 PR에서 추가·수정한 JS·TS 파일만 검사한다.

- 로컬 실행에는 MySQL·Redis와 `.env`가 필요하다. 필요한 키는 `README.md`의 환경 변수 절에 있다.
- 실행하지 못한 검증은 성공으로 적지 않는다. 무엇을 왜 못 했는지 적는다.
- 버그를 고칠 때는 먼저 재현 테스트를 쓰고, 그 테스트가 통과하게 만든다.

## 코드 규칙

### 보안 불변식

아래 규칙은 새 코드에 반드시 적용한다. 기존 코드에는 이를 어기는 곳이 남아 있다(`docs/backlog.md`의 SEC 항목).
기존 위반을 고치는 것은 해당 백로그 작업으로 따로 한다.

1. **사용자 식별은 인증 주체에서만 한다.** 컨트롤러는 `@AuthenticationPrincipal LoginUserDTO`로 사용자를 받는다.
   요청 헤더(`X-User-Id` 등), 바디, 쿼리, 경로 변수의 사용자 ID를 신원으로 믿지 않는다.
2. **리소스 접근 권한은 서버에서 검사한다.** 수정·삭제는 소유자, 채팅·예약은 방 참가자인지 확인한다.
   프론트에서 버튼을 숨기는 것은 권한 검사가 아니다.
3. **JWT는 항상 서명을 검증한다.** 페이로드만 디코딩해서 신원을 얻지 않는다.
4. **사용자 입력을 Java 역직렬화하지 않는다.**
5. **비밀값을 코드·설정·문서·로그에 넣지 않는다.** `.env`, 서비스 계정 키, 실제 DB 접속정보를 커밋하지 않는다.

### 일반 규칙

- 요청받은 범위만 바꾼다. 관련 없는 정리·리팩터링은 하지 말고 보고 끝에 제안한다.
- 주변 코드의 스타일을 따른다. 작업 지시용 주석(`// ✅ 추가`, `// ❗️ 이 메서드 추가 필요` 등)을 남기지 않는다.
- 예외를 `catch (Exception e)`로 삼켜 정상처럼 처리하지 않는다. 실패와 "검사 불가"를 정상 결과와 구분한다.
- 시각은 offset이 있는 값(Instant 또는 OffsetDateTime)으로 다루고, 표시할 때만 시간대를 적용한다.
- 메이저 버전 업그레이드(Spring Boot, Java, React 등)는 기능 변경과 같은 변경에 섞지 않는다.

## Git 규칙

Issue, 브랜치, 커밋, PR, 병합 규칙의 정본은 [CONTRIBUTING.md](CONTRIBUTING.md)다. 에이전트가 특히 지킬 것은 아래와 같다.

- 작업은 Issue로 시작한다. 백로그 항목이면 Issue에 ID를 적는다(D-J).
- `main`에 직접 push하지 않는다. 브랜치를 만들고 PR로 합친다. PR 병합은 사용자가 한다.
- 브랜치 이름은 `<type>/#<issue-number>-<short-description>`, 커밋 첫 줄은
  `<type>(<scope>): <한글 요약> (#<issue-number>)` 형식이다(D-K).
- 병합은 merge commit으로 한다(D-I). 그래서 PR 안의 커밋을 목적별로 나눠 둔다.
- AI 에이전트가 작성한 커밋에는 `Co-Authored-By` 트레일러를, PR 본문에는 에이전트 서명 줄을 붙여도 된다.
  이 저장소에서만 허용하는 규칙이다.
- PR 본문은 `.github/pull_request_template.md` 형식을 따른다.

## 에이전트 협업

- **결정이 필요하면 멈춘다.** `docs/decisions.md`의 미결정 항목에 걸리는 작업은 구현하지 말고 사용자에게 묻는다.
  사용자가 정하면 그 결정을 `docs/decisions.md`에 기록한다.
- **백로그를 갱신한다.** 작업을 시작하면 `docs/backlog.md`의 상태를 `진행`으로 바꾸고 Issue 번호를 적는다. 끝나면 PR 번호를 적는다.
  새 결함을 찾으면 근거와 함께 항목을 추가한다.
- **리뷰는 문서로 남긴다.** 다른 에이전트의 분석이나 PR을 검토한 결과는
  `docs/reviews/YYYY-MM-DD-<에이전트>-<주제>.md`에 쓴다. 리뷰 문서에는 아래 내용을 적는다.
  - 대상(PR 번호 또는 문서)과 기준 커밋
  - 항목별 판정: 동의 / 부분 동의 / 반박
  - 근거 수준: **실행 확인**(명령·테스트로 확인) / **소스 확인**(코드에서 확인) / **위험 추론**(코드에서 도출, 미재현)
  - 근거 위치: `파일:라인`과 커밋
  - 실행하지 못한 검증과 그 이유
- **한 PR은 한 에이전트가 쓰고, 다른 에이전트가 검토한다.** 같은 브랜치를 두 에이전트가 동시에 고치지 않는다.

## 완료 보고 형식

작업을 마치면 다음을 구분해서 보고한다. PR 템플릿도 같은 구조다.

1. 무엇을 바꿨는가
2. 어떤 계약과 결정을 지켰는가
3. 실행한 자동 테스트와 그 결과
4. 실행한 수동·통합·브라우저·DB 검증
5. 실행하지 못한 검증과 그 이유
6. 남은 위험, 후속 이슈, 리뷰가 필요한 결정

CI 결과와 로컬 결과를 구분한다. 확인하지 않은 원격·런타임 결과를 성공했다고 쓰지 않는다.
