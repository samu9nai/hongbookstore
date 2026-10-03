import React from 'react';
import ChatRoom from './ChatRoom';
import { useParams } from 'react-router-dom';

const ChatRoomWrapper = () => {
    // ✅ 반드시 chatId로 꺼내야 맞음!
    const { chatId } = useParams();

    const userJson = localStorage.getItem('user');
    let username = '익명';

    if (userJson) {
        try {
            const userObj = JSON.parse(userJson);
            username = userObj.username || '익명';
        } catch (e) {
        }
    }

    return <ChatRoom chatId={chatId} username={username} />;
};

export default ChatRoomWrapper;
