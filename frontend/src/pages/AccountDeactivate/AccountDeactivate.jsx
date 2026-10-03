import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { AuthCtx } from '../../contexts/AuthContext';
import { deactivateAccount } from '../../api/users';
import { useNavigate } from 'react-router-dom';

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 96px 16px 48px;
`;
const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
`;
const Title = styled.h1`font-size: 20px; margin: 0 0 12px;`;
const Desc = styled.p`color: #6b7280; line-height: 1.6;`;
const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  margin-top: 16px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  resize: vertical;
`;
const Danger = styled.button`
  margin-top: 20px;
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-radius: 12px;
  background: #ef4444;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
`;
const Note = styled.div`margin-top: 8px; font-size: 13px; color: #9ca3af;`;

export default function AccountDeactivate() {
    const [reason, setReason] = useState('');
    const { logout } = useContext(AuthCtx);
    const navigate = useNavigate();

    const onSubmit = async () => {
        if (!window.confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        try {
            await deactivateAccount(reason.trim() || undefined);
        } catch (e) {
            // 서버 실패해도 프런트는 반드시 로그아웃 진행
        } finally {
            await logout();
            navigate('/');
        }
    };

    return (
        <Wrap>
            <Card>
                <Title>회원 탈퇴</Title>
                <Desc>탈퇴 시 작성하신 글/댓글은 삭제되지 않으며, 작성자 이름은 ‘탈퇴한 회원’(또는 ‘탈퇴회원#ID’)으로 표시됩니다.</Desc>
                <Textarea
                    placeholder="(선택) 탈퇴 이유를 알려주세요. 서비스 개선에 참고하겠습니다."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                <Danger onClick={onSubmit}>정말 탈퇴하기</Danger>
                <Note>탈퇴 후에는 다시 로그인할 수 없습니다.</Note>
            </Card>
        </Wrap>
    );
}
