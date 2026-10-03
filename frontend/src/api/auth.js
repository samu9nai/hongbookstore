import api from '../lib/api';

/**
 * 현재 로그인한 사용자의 정보를 서버에서 가져옵니다.
 * 페이지 새로고침이나 마이페이지 접근 시 사용됩니다.
 */
export const getMyInfo = async () => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    return Promise.reject(new Error('인증 토큰이 없습니다.'));
  }

  try {
    const response = await api.get('/my/profile');


    if (response && response.success) {
      return response.data;  // 이게 이미 UserResponseDTO면 OK!
    } else if (response && response.data && response.data.data) {
      // 혹시 axios 기본구조면 이렇게:
      return response.data.data;
    } else {
      throw new Error(response?.message || '내 정보 조회에 실패했습니다.');
    }
  } catch (error) {
    throw error;
  }

};

/**
 * 현재 로그인된 계정을 탈퇴
 * 소셜 로그인 환경이므로 비밀번호 확인 절차는 제거
 * (실제 서비스라면 '탈퇴' 버튼을 누르면 경고 모달을 한 번 더 띄워주는 것이 좋습니다.)
 */
export const deleteAccount = async () => {
  try {
    // 비밀번호 없이, 현재 로그인한 유저의 토큰을 기반으로 탈퇴를 요청
    const response = await api.delete('/my/profile');

    if (response && response.success) {
      return response.data;
    } else {
      throw new Error(response?.message || '계정 탈퇴에 실패했습니다.');
    }
  } catch (error) {
    throw error;
  }
};

/**
 * 로그아웃을 처리
 * 서버에 현재 Token을 보내 블랙리스트 처리를 요청
 * 로컬 스토리지에서 모든 인증 정보를 삭제
 */
export const logout = async () => {
  const accessToken = localStorage.getItem('accessToken');

  try {
    // 서버에 로그아웃 요청 시, Authorization 헤더에 Access Token을 보내야 합니다.
    // (api 인스턴스에 인터셉터가 설정되어 있다면 자동으로 처리됩니다.)
    if (accessToken) {
      await api.post('/auth/logout'); // 우리 백엔드 API는 헤더의 토큰을 읽음
    }
  } catch (error) {
    // 서버 요청이 실패하더라도 클라이언트의 로그아웃은 진행
  } finally {
    // 서버 요청의 성공/실패 여부와 관계없이 로컬 스토리지의 토큰들은 반드시 삭제
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); // 사용자 정보도 함께 삭제

    // 로그아웃 후 로그인 페이지로 이동시키는 것이 일반적
    window.location.href = '/login'; 
  }
};