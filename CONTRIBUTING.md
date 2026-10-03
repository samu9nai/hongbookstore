# 홍책방 협업 가이드

이 문서는 홍책방의 Issue, 브랜치, 커밋, PR, 병합 규칙을 정한다. 작업을 시작하기 전에 전체 흐름을 확인한다.
코딩 에이전트는 이 문서와 함께 [AGENTS.md](./AGENTS.md)의 코드 규칙과 검증 기준선을 따른다.

규칙은 [T-ravelers/NA-WA의 협업 가이드](https://github.com/T-ravelers/NA-WA/blob/main/CONTRIBUTING.md)를 바탕으로 했다.
병합 방식과 백로그 연결은 이 저장소에 맞게 바꿨다.

## 1. 작업 흐름

> [!IMPORTANT]
> 모든 작업은 Issue를 만든 뒤 시작한다.

작업 흐름은 `Issue → 작업 브랜치 → main 대상 PR → 리뷰 → merge commit`이다.

1. `New issue`에서 작업 성격에 맞는 양식을 고른다. 한 Issue에는 주요 목적 하나만 둔다.
2. [docs/backlog.md](./docs/backlog.md)에 있는 항목이면 Issue의 "백로그 항목"에 ID를 적는다.
   백로그에서 그 항목의 상태를 `진행`으로 바꾸고 Issue 번호를 적는다.
3. 최신 `main`에서 Issue 번호가 들어간 작업 브랜치를 만든다.
4. API, 환경 변수, 배포 방식, 공통 계약을 바꾸면 관련 문서도 같은 PR에서 고친다.
5. 정책 결정이 필요하면 구현을 멈추고 [docs/decisions.md](./docs/decisions.md)의 미결정 항목을 확인한다.

기본 브랜치는 `main`이다. `develop` 브랜치는 쓰지 않는다.

## 2. Issue 작성

제목은 `[Type] 한글 설명` 형식으로 쓴다.

```text
[Feat] 판매글 이미지 순서 변경 기능 추가
[Fix] 다른 회원의 프로필 수정 차단
[Docs] 프론트엔드 개발 규칙 정리
```

| 양식 | 제목 머리 | 쓰는 경우 |
| --- | --- | --- |
| 기능 개발 | `[Feat]` | 새 기능을 만든다 |
| 버그 수정 | `[Fix]` | 잘못된 동작을 재현하고 고친다 |
| 리팩터링 | `[Refactor]` | 동작을 유지하면서 구조를 바꾼다 |
| 일반 작업 | `[Docs]`, `[Chore]`, `[Test]` | 문서, 설정, 의존성, 테스트, CI/CD, 배포 |

다른 사람이 Issue만 읽어도 작업 범위와 완료 여부를 판단할 수 있게 쓴다. 보안 취약점의 재현 방법과
개인정보, 인증정보는 Issue에 쓰지 않는다.

## 3. 브랜치 만들기

브랜치 이름은 `<type>/#<issue-number>-<short-description>` 형식으로 쓴다. 설명은 영문 kebab-case로 짧게 쓴다.

| Type | 용도 |
| --- | --- |
| `feature` | 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 동작을 유지하는 구조 개선 |
| `chore` | 설정, 의존성, 빌드, 인프라 |
| `test` | 테스트 추가·수정 |
| `docs` | 문서만 변경 |

```text
feature/#12-reorder-post-images
fix/#27-block-profile-update
docs/#31-frontend-convention
```

`main`에 직접 push하지 않는다. 모든 변경은 PR로 합친다.

## 4. 커밋 작성

커밋 메시지 첫 줄은 `<type>(<scope>): <한글 요약> (#<issue-number>)` 형식으로 쓴다.
영역을 나눌 필요가 없으면 scope를 생략한다.

- type: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`
- scope: `frontend`, `backend`, `toxic-filter`, `deploy`

```text
feat(frontend): 판매글 이미지 순서 변경 UI 추가 (#12)
fix(backend): 다른 회원의 프로필 수정을 403으로 막는다 (#27)
docs: 프론트엔드 개발 규칙 정리 (#31)
```

- 커밋 하나에는 논리적인 변경 하나만 담는다.
- 따로 설명하거나 되돌릴 수 있는 변경은 커밋을 나눈다. 예: 파일 이동, 일괄 서식 적용, 기능 변경, 문서.
- 파일 이동이나 일괄 서식 적용은 내용 변경과 섞지 않는다. 이력 추적(`git log --follow`)과
  `.git-blame-ignore-revs`가 그 커밋을 따로 가리킬 수 있어야 한다.
- 본문에는 무엇을 왜 바꿨는지 쓴다. 의미 없는 중간 커밋은 PR을 열기 전에 정리한다.
- 민감정보, 빌드 산출물, 개인 IDE 설정을 커밋하지 않는다.

커밋하면 pre-commit 훅이 스테이징한 프론트엔드 파일에 oxlint와 Prettier를 실행한다. 오류가 남으면 커밋이 막힌다.

## 5. PR 작성

PR 제목은 Issue와 같은 `[Type] 한글 설명` 형식으로 쓴다. 본문은 [PR 양식](./.github/pull_request_template.md)의
모든 항목을 채운다.

- `main` 대상 PR에는 `Closes #<issue-number>`를 쓴다.
- 다른 PR 위에 쌓은 PR에는 `Refs #<issue-number>`를 쓰고, `main`에 들어가는 PR에서 Issue를 닫는다.
- 실행하지 못한 검증을 성공으로 적지 않는다. 로컬 결과와 CI 결과를 구분한다.
- 리뷰가 필요한 결정과 알려진 제약을 숨기지 않는다.
- 관련 없는 프론트엔드·백엔드 변경을 한 PR에 섞지 않는다.

## 6. 변경 검증

변경한 영역의 검증을 모두 실행한다. 현재 기준선(통과 여부, 린트 오류 수)은
[AGENTS.md의 검증 명령](./AGENTS.md#검증-명령)에 있다.

### Frontend

저장소 루트에서 실행한다. Node 24.21.0(`.node-version`)과 pnpm 12.8.1(`corepack enable pnpm`)이 필요하다.

```shell
pnpm install
pnpm format:check
pnpm lint
pnpm type-check
pnpm test:unit --run
pnpm build
```

사용자 흐름을 바꿨다면 Playwright 테스트도 실행한다. 처음 한 번은 브라우저를 설치한다.

```shell
pnpm --filter @hongbookstore/frontend exec playwright install chromium
pnpm test:e2e
```

### Backend

```shell
cd backend
./gradlew test
```

문서만 바꿨더라도 링크, 명령, 코드 예시가 실제 저장소와 맞는지 확인한다.

## 7. 리뷰하고 병합하기

- PR을 열기 전에 바뀐 파일과 비밀정보 포함 여부를 확인한다.
- 리뷰 피드백을 반영하거나, 반영하지 않는 이유를 답글로 남긴다.
- 필수 검증이 실패한 상태로 병합하지 않는다.
- **`Create a merge commit`으로 병합한다.** squash와 rebase merge는 쓰지 않는다(D-I).
  PR 안에서 목적별로 나눈 커밋을 그대로 남기고, `.git-blame-ignore-revs`가 가리키는 커밋 해시를 유지하기 위해서다.
  저장소 설정에서 막지는 않으므로 병합할 때 직접 확인한다.
- 다른 PR 위에 쌓은 PR은 아래 PR부터 차례로 병합한다. 병합하면서 브랜치를 지우면 GitHub가 다음 PR의 base를
  `main`으로 바꾼다.
- 병합한 뒤 원격 작업 브랜치를 지운다.

## 8. 문서 작성

새 문서를 만들거나 기존 문서를 고칠 때 [토스 테크니컬 라이팅 가이드](https://technical-writing.dev/)를 참고한다.

- 제목 바로 아래에 대상 독자와 문서를 읽고 할 수 있는 일을 쓴다.
- 한 문서는 주요 목적 하나에 집중한다. 같은 설명을 반복하지 않고 기준 문서로 연결한다.
- 한 문장에는 생각 하나만 담는다. 같은 개념에는 같은 용어를 쓴다.
- 명령, 경로, 버전, 코드 예시는 이 저장소에서 확인한 값만 쓴다.
- 현재 구현과 앞으로의 계획을 구분한다.

## 9. 보안과 환경 변수

- 토큰, 비밀번호, OAuth secret, DB 접속정보, 개인 식별정보를 코드·로그·문서에 남기지 않는다.
- 백엔드 비밀값은 `backend/.env`에 두고 커밋하지 않는다.
- 브라우저에 전달되는 `VITE_*` 환경 변수에는 공개해도 되는 값만 쓴다.
- 인증 토큰 저장 위치는 아직 정하지 않았다(D-03). 새 코드에서 토큰 저장 방식을 바꾸지 않는다.
- 새 코드는 [AGENTS.md의 보안 불변식](./AGENTS.md#보안-불변식)을 지킨다.
