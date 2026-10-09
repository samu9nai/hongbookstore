import api, { type ApiResponse } from '@/shared/api/client'

/**
 * 계정 탈퇴(소프트 삭제). 성공 시 서버가 토큰을 블랙리스트 처리하고,
 * 프런트에서는 추가로 로컬 토큰을 지웁니다.
 */
export const deactivateAccount = async (reason?: string): Promise<unknown> => {
  const payload = reason ? { reason } : {}
  const res = await api.post<Partial<ApiResponse> | undefined>(
    '/my/deactivate',
    payload
  )
  return res?.data
}
