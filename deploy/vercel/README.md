# HongBookStore 프런트엔드 Vercel 배포
React + Vite 프런트엔드를 Vercel에 배포하는 과정을 정리

## 프로젝트 설정
1. Git 저장소를 Vercel 프로젝트로 연결
2. **Root Directory**는 `frontend`로 지정
3. 프레임워크는 기본 Vite 프리셋(또는 Other)을 사용
4. Build command: `npm run build`
5. Output directory: `dist`

## 환경변수 (Vercel → Project → Settings → Environment Variables)
| Scope              | Key                                                        | Value                                               | 설명                                 |
|--------------------|------------------------------------------------------------|-----------------------------------------------------|------------------------------------|
| Frontend/Edge      | `VITE_API_BASE`                                            | `/api`                                              | 프런트엔드가 항상 동일 오리진의 `/api`로 호출하도록 고정 |
| Edge Function      | `BACKEND_ORIGIN`                                           | `https://<cloud-run-url>` 또는 `http://<GCE_IP>:8080` | `/api/*` 요청을 전달할 업스트림              |
| Edge Function (선택) | `EDGE_SHARED_SECRET`                                       | 충분히 강한 랜덤 문자열                                       | 백엔드가 검증 시 `x-edge-key` 헤더로 전달      |
| Frontend (선택)      | `VITE_NAVER_MAP_CLIENT_ID`, `VITE_NAVER_MAP_CLIENT_SECRET` | 제공받은 키                                              | 클라이언트 측 지도 위젯이 필요할 때 설정            |

운영/스테이징 값을 각각 등록해 두면 롤백이나 프리뷰 환경을 쉽게 분리 가능

## 프록시 동작
- `frontend/api/[...path].js`는 모든 `/api/*` 요청을 `BACKEND_ORIGIN`으로 그대로 전달
- Authorization, Cookie 등 모든 헤더를 유지
- `EDGE_SHARED_SECRET`이 설정돼 있으면 `x-edge-key` 헤더를 추가

## OAuth 리다이렉트
- 백엔드가 소셜 로그인을 완료하면 프런트엔드의 `/oauth/callback`으로 리다이렉트
- 백엔드 런타임 환경변수 `APP_FRONTEND_BASE_URL`을 실제 Vercel 도메인(예: `https://hong-book-store.vercel.app`)으로

## 로컬 개발 팁
- 기본 `VITE_API_BASE`는 `/api`이므로, 개발 서버에서 프록시가 없으면 404가 발생
- 로컬에서는 `.env`에 `VITE_API_BASE=http://localhost:8080/api` 를 지정하거나 Vite dev 서버 프록시 설정을 추가

## CI / 자동화
- Vercel Git 연동 또는 `npm run build`를 실행하는 간단한 GitHub Action을 구성해 프리뷰 빌드를 자동화할 수 있습니다.
