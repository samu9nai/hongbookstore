# Cloud Run 배포 (Spring Boot 백엔드)

이 디렉터리는 백엔드를 Cloud Run에 배포하는 데 필요한 모든 자료를 담고 있습니다.

## 포함 파일
- `deploy.sh` — `gcloud builds submit`과 `gcloud run deploy`를 묶어 실행하며, 기본값은 최소/최대 인스턴스 0/1, 동시 처리 80, 1 vCPU / 512MiB.
- `service.yaml` — GitOps 스타일로 `gcloud run services replace`를 사용할 때 참고할 수 있는 선언형 스펙
- `secrets.list` — Secret Manager에 저장할 키 목록. `deploy.sh --use-secrets` 옵션이 읽어 Cloud Run에 매핑.
- `SECRET_MANAGER.md` — Secret Manager 운영 메모.

## 일반 배포 흐름
1. 스크립트 실행 전에 필요한 환경변수를 지정.
   ```bash
    export PROJECT_ID=your-gcp-project
    export REGION=us-west1
    export REPO=containers
    export SERVICE_ACCOUNT=cr-hongbook@${PROJECT_ID}.iam.gserviceaccount.com
   ```
2. `.env`를 준비. CI 환경에서는 Secret Manager나 CI의 시크릿 저장소를 사용.

3. 배포 명령을 실행.
   ```bash
    ./deploy/cloudrun/deploy.sh \
    --allow-unauthenticated \
    --use-secrets \
    --env-file ./deploy/cloudrun/.env.sample
   ```
   내부 서비스라면 `--allow-unauthenticated` 옵션을 제거하고 IAM으로 접근 권한을 제어

4. 필요하면 먼저 시크릿을 생성/갱신.
   ```bash
    ./deploy/cloudrun/deploy.sh \
    --bootstrap-secrets --use-secrets \
    --env-file ./deploy/cloudrun/.env.sample \
    --service-account $SERVICE_ACCOUNT
   ```
5. 배포가 끝난 뒤 상태를 확인.
   ```bash
    gcloud run services describe hongbookstore \
    --project $PROJECT_ID --region $REGION \
    --format='value(status.url)'
   ```

## 참고 사항
- 도커 이미지는 `backend/Dockerfile`을 사용하며, 멀티 스테이지 빌드와 Spring Boot 레이어 추출이 적용됨.
- Actuator 헬스 체크는 `/actuator/health/{liveness,readiness}`에서 제공되며, `service.yaml`에 이미 프로브 설정이 되어 있음.
- 애플리케이션에서 새로운 민감 정보가 필요해지면 `secrets.list`를 업데이트해 CI/CD와 동기화.
- 실제 `.env` 파일은 버전 관리에 포함하지 말고, `.dockerignore`를 이용해 도커 이미지에도 포함되지 않도록 유지.
