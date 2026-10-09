// 앱에서 읽는 Vite 환경 변수와 브라우저 전역 값의 타입

interface ImportMetaEnv {
  /** API 기본 경로. 없으면 '/api'를 쓴다 */
  readonly VITE_API_BASE?: string
  /** SSE 알림 스트림을 붙일 백엔드 오리진 */
  readonly VITE_BACKEND_ORIGIN?: string
  /** STOMP 웹소켓 기본 주소 */
  readonly VITE_WS_BASE?: string
  readonly VITE_NAVER_MAP_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** 다음 우편번호 서비스가 oncomplete로 넘기는 값 중 앱이 읽는 필드 */
interface DaumPostcodeData {
  address?: string
  roadAddress?: string
  [key: string]: unknown
}

interface Window {
  /** 다음 우편번호 스크립트가 로드되면 생긴다 */
  daum?: {
    Postcode: new (options: {
      oncomplete: (data: DaumPostcodeData) => void
    }) => {
      open: () => void
    }
  }
  /** 네이버 지도 스크립트가 로드되면 생긴다. 타입은 @types/navermaps에 있다 */
  naver?: typeof naver
  /** ChatRoom이 웹소켓 주소에서 뽑아 둔 백엔드 호스트 */
  __HBS_BACKEND_HOST__?: string
}
