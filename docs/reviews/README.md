# 분석·리뷰 문서 목차

이 목차를 보면 리뷰 문서마다 무엇을 검토했고, 어떤 판정을 내렸고, 어떤 백로그 항목으로 이어졌는지 파일을 열지 않고 찾을 수 있다.

- 리뷰 문서는 작성 당시의 기록이다. 나중에 규칙이나 코드가 바뀌어도 본문을 고치지 않는다. 현재 규칙은 [AGENTS.md](../../AGENTS.md)와 [decisions.md](../decisions.md)가 정본이다.
- 새 리뷰 문서를 추가하면 이 표에 한 줄을 더한다. 파일 이름과 본문 형식은 [AGENTS.md의 에이전트 협업](../../AGENTS.md#에이전트-협업)을 따른다.
- "이어진 항목"은 그 리뷰가 [backlog.md](../backlog.md)에 새로 더한 항목이다.

| 문서 | 작성 | 대상 | 판정 | 이어진 항목 |
|---|---|---|---|---|
| [2026-10-03-codex-initial-analysis.md](2026-10-03-codex-initial-analysis.md) | Codex | 원본 저장소 `dab60c9` 전체 | 리팩토링 범위와 우선순위의 잠정 결론. 항목 번호 `H-01` ~ `H-07`, `T-01` ~ `T-06` | 백로그의 출처 열이 `H-`·`T-`인 항목 |
| [2026-10-03-claude-review.md](2026-10-03-claude-review.md) | Claude | 위 Codex 초기 분석 | 틀린 주장 없음, 과장 1건(H-04). Codex가 놓친 결함 `C-1` ~ `C-11`을 더했다 | 백로그의 출처 열이 `C-`인 항목, D-05의 평가 자료 목록 |
| [2026-10-09-codex-pr51-pr53.md](2026-10-09-codex-pr51-pr53.md) | Codex | PR #51(LFS push 훅), PR #53(TS 전환 3단계) | #51 결함 없음. #53 P3 타입 계약 1건 | FE-18 |
| [2026-10-10-codex-pr55.md](2026-10-10-codex-pr55.md) | Codex | PR #55(`app`·`features`·`shared` 폴더 이동) | 부분 동의. D-P 의존 방향 위반 1건(P2) | FE-20 |
| [2026-10-10-codex-pr57.md](2026-10-10-codex-pr57.md) | Codex | PR #57(TS 전환 4단계 auth) | 동의 | 없음 |
| [2026-10-11-codex-pr59.md](2026-10-11-codex-pr59.md) | Codex | PR #59(TS 전환 4단계 map) | 동의 | 없음 |
| [2026-10-22-codex-pr72.md](2026-10-22-codex-pr72.md) | Codex | PR #72(GCS 저장소 모드 제거) | 기능 결함 없음. P3 문서 수치 오류 1건 | DOC-02, BE-04 |
| [2026-10-22-codex-pr78.md](2026-10-22-codex-pr78.md) | Codex | PR #78(Spring Boot 4.1 전환) | 기능 회귀 없음. P3 테스트 단언 1건. 버전 덮어쓰기 유지 권고 | BE-05 |
| [2026-10-22-codex-pr80.md](2026-10-22-codex-pr80.md) | Codex | PR #80(에이전트 협업 문서 정리) | 동의. 신규 지적 없음. 기존 FE-13의 CardHeader 설명 오류는 참고사항 | 없음 |
