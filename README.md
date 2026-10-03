# Hongik Book Store : 홍책방


<div align="center">

**홍익대학교 학생 전용 중고 교재 거래 및 정보 공유 플랫폼**

</div>

---

### Introduction
> 2025학년도 홍익대학교 컴퓨터공학과 졸업프로젝트 <br/>
> 프로젝트 기간: 2025.03 ~ 2025.11

이 저장소는 보관된 원본 [HongikBookStore/HongBookStore](https://github.com/HongikBookStore/HongBookStore)를 이어받아 개인적으로 고도화합니다.
원본의 커밋 히스토리와 작성자 정보는 그대로 유지합니다. 팀원별 기여는 원본 저장소의 기여자 목록에서 확인할 수 있습니다.

### Tech Stacks
> Frontend: <br/>
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=JavaScript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

> Backend: <br/>
![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=Spring-Security&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)

> DB: <br/>
![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)

> Others: <br/>
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

---

## 프로젝트 개요
HongBookStore는 **홍익대학교 학생 전용 중고 교재 거래 및 정보 공유 플랫폼**입니다.  
단일 레포지토리 안에 **백엔드(Spring Boot)**와 **프론트엔드(React + Vite)**가 함께 구성되어 있습니다.

### 핵심 기능
- 중고 교재 판매글: 검색/필터/정렬, ISBN 기반 등록/직접 등록, 이미지 업로드, 상태 변경, 찜하기, 최근 본 글
- 구해요 게시판: 글 작성/수정/삭제, 댓글/대댓글
- 실시간 채팅: STOMP WebSocket, 채팅방, 메시지, 거래 예약(요청/수락/취소/완료), SSE 알림
- 사용자/인증: OAuth2(구글/네이버/카카오), JWT, 학생 인증 메일, 프로필/이미지 변경, 계정 탈퇴
- 리뷰/후기: 장소 리뷰(이미지/리액션), 거래 상대 평가(판매자/구매자) 및 요약
- 지도/장소: 네이버 장소 검색, 좌표/주소 변환, 길찾기 프록시
- 외부 연동: Kakao Books 검색, KMA 주간 날씨, 유해 표현 필터(Toxic Filter)
- 운영 기능: 신고(Admin), 알림 스트림, Actuator 헬스체크

### 시스템 구성
- Frontend: React 19 + Vite, React Router, React Query, styled-components
- Backend: Spring Boot 3.5 (Java 21), Spring Security, WebSocket(STOMP), JPA, WebFlux(WebClient)
- Data: MySQL, Redis
- Storage: GCP Cloud Storage
- Monitoring: Spring Boot Actuator
- Deployment: Docker, GCP Cloud Run, Vercel

### 프로젝트 구조
```
backend/src/main/java/com/hongik/books   # Spring Boot 백엔드
backend/src/main/resources              # application.yml, 템플릿, GCP 키(개발용)
backend/Dockerfile                      # 백엔드 컨테이너 빌드
frontend                                # React + Vite 프론트엔드
deploy                                  # 배포 스크립트/가이드 (Cloud Run, Vercel)
```

### 환경 변수
**백엔드 (backend/.env)**  
`application.yml`이 `.env`를 자동으로 읽습니다.
```bash
# DB
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=hongbookstore
MYSQL_USERNAME=hongik
MYSQL_PASSWORD=secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET_KEY=base64-encoded-secret

# OAuth2 (Google/Naver/Kakao)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# Mail (Gmail SMTP)
MAIL_USERNAME=
MAIL_PASSWORD=

# External APIs
KAKAO_API_REST_KEY=
NAVER_SEARCH_ID=
NAVER_SEARCH_SECRET=
NAVER_ROUTE_ID=
NAVER_ROUTE_SECRET=
KMA_APIHUB_KEY=

# GCP Storage
GCP_PROJECT_ID=
GCP_BUCKET_NAME=
GCP_CREDENTIALS_LOCATION= # 필요 시 file:/path/to/key.json

# CORS/Origin
FRONTEND_BASE_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

# Server
PORT=8080
MANAGEMENT_PORT=8080

# Toxic Filter (옵션)
TOXIC_FILTER_API_KEY=
```

**프론트엔드 (frontend/.env)**  
```bash
VITE_API_BASE=http://localhost:8080/api
VITE_BACKEND_ORIGIN=http://localhost:8080
VITE_WS_BASE=ws://localhost:8080
VITE_NAVER_MAP_CLIENT_ID=
VITE_NAVER_MAP_CLIENT_SECRET=
```

### 로컬 실행
**Backend**
1. `cd backend`
2. `./gradlew bootRun`

**Frontend** (Node 24.21.0, pnpm 12.8.1. `corepack enable pnpm` 후 저장소 루트에서 실행)
1. `pnpm install`
2. `pnpm dev`

### Docker
1. `docker build -t hongbookstore backend`
2. `docker run --env-file backend/.env -p 8080:8080 hongbookstore`

### 배포
- 백엔드: `deploy/cloudrun/README.md`
- 프론트엔드: `deploy/vercel/README.md`
- 프록시/리라이트: `frontend/vercel.json`

### 테스트/품질
- Backend 테스트: `cd backend && ./gradlew test`
- Frontend 타입 검사·린트·서식: `pnpm type-check`, `pnpm lint`, `pnpm format:check`
- Frontend 테스트: `pnpm test:unit --run`, `pnpm test:e2e`
