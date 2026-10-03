import api from '../lib/api';

// 채팅방 목록 조회
export const getChatRooms = () => api.get('/chat/rooms');

// 특정 책에 대한 채팅방 조회 또는 생성
export const getOrCreateChatRoom = (bookId) => {
  // 임시로 모의 응답 반환 (실제 API가 구현되면 주석 처리)
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      id: `chat_${bookId}_${Date.now()}`,
      bookId: bookId,
      participants: ['current_user', 'seller_user'],
      createdAt: new Date().toISOString()
    })
  });
  
  // 실제 API 호출 (백엔드 구현 후 사용)
  // return api.post(`/chat/rooms/book/${bookId}`);
};

// 채팅방 메시지 조회
export const getChatMessages = (chatId) => api.get(`/chat/rooms/${chatId}/messages`);

// 메시지 전송
export const sendMessage = (chatId, message) => api.post(`/chat/rooms/${chatId}/messages`, { content: message });

// 채팅방 정보 조회
export const getChatRoomInfo = (chatId) => api.get(`/chat/rooms/${chatId}`); 