# 배포에 필요한 스크립트와 문서 모음
- `cloudrun/` — 백엔드(Spring Boot) Cloud Run 배포용
  - `deploy.sh`: Cloud Build로 이미지 빌드 후 Cloud Run에 배포하고 시크릿을 연결하는 헬퍼 스크립트
  - `service.yaml`: `gcloud run services replace`로 사용할 수 있는 선언형 서비스 템플릿
  - `secrets.list`: Secret Manager에 저장할 키 목록, `deploy.sh --use-secrets`가 참조
  - `SECRET_MANAGER.md`: GCP Secret Manager 운영 가이드
- `vercel/` — 프론트엔드(React + Vite) Vercel 설정 (`README.md`)

백엔드 도커 관련 파일(`Dockerfile`, `.dockerignore`)은 `backend/`에 유지</br>
실제 자격 증명은 `.env` 등 개인 파일에 보관, 버전 관리에서 제외되어 있으니 건드리지 않아도 됨.
