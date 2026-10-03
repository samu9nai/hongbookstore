// src/components/Comments/WantedComments.jsx
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FaReply, FaTrash, FaUser, FaClock } from 'react-icons/fa';
import { displayMaskedName } from '../../utils/nameMask';

const Box = styled.div`
    margin-top: 18px;
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 14px;
    padding: 22px;
`;

const Title = styled.h3`
    margin: 0 0 12px 0; font-size: 1.15rem; color: #333;
`;

const EditorRow = styled.div`
    display: flex; gap: 8px; align-items: flex-start; margin-bottom: 12px;
`;

const Textarea = styled.textarea`
    flex: 1; min-height: 90px; resize: vertical;
    border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px;
    outline: none; font-size: .95rem;
    &:focus { border-color: #0d6efd; }
`;

const Button = styled.button`
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid ${p => (p.$variant === 'danger' ? '#dc3545' : '#e5e7eb')};
    background: ${p => (p.$variant === 'primary' ? '#0d6efd' : p.$variant === 'danger' ? '#fff5f5' : '#fff')};
    color: ${p => (p.$variant === 'primary' ? '#fff' : p.$variant === 'danger' ? '#dc3545' : '#111')};
    font-weight: 700;
    cursor: pointer;
    transition: .15s ease;
    &:hover{ transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
    &:disabled{ opacity: .6; cursor: not-allowed; transform:none; box-shadow:none; }
`;

const List = styled.ul`
    list-style: none; margin: 0; padding: 0;
`;

const Item = styled.li`
    padding: 14px 0;
    border-top: 1px solid #f1f3f5;
    &:first-child { border-top: 0; }
`;

const RepliesList = styled.ul`
    list-style: none;
    margin: 10px 0 0 26px;
    padding-left: 12px;
    border-left: 3px solid #eef2f6;
`;

const Meta = styled.div`
    display: flex; gap: 10px; align-items: center; color: #6b7280; font-size: .9rem; margin-bottom: 6px;
`;

const Content = styled.div`
    white-space: pre-wrap; color: ${p => p.$deleted ? '#9aa0a6' : '#222'};
`;

const Actions = styled.div`
    display: flex; gap: 8px; margin-top: 6px;
`;

const ReplyBox = styled.div`
    margin-top: 10px; margin-left: 26px;
`;

/* ----------------------------- helpers ----------------------------- */
// 토큰 정규화
function normalizeBearer(raw) {
    if (!raw) return '';
    let t = String(raw).trim();
    if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1); // JSON 저장 흔적 제거
    if (t.toLowerCase().startsWith('bearer ')) t = t.slice(7);
    return t;
}

function getXsrfTokenFromCookie() {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? m[1] : null;
}
function xsrfHeader() {
    const v = getXsrfTokenFromCookie();
    return v ? { 'X-XSRF-TOKEN': v } : {};
}

// GET: 최소 헤더 + 쿠키 포함(세션 로그인 지원)
function publicInit() {
    return { headers: { Accept: 'application/json' }, credentials: 'include' };
}

// POST/DELETE: ASCII 헤더 + 쿠키 포함
function authInit(bodyObj) {
    const tokenRaw = localStorage.getItem('accessToken') || '';
    const token = normalizeBearer(tokenRaw);
    const uidRaw = localStorage.getItem('userId') || '';
    const uid = /^\d+$/.test(uidRaw) ? uidRaw : '';

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(uid ? { 'X-USER-ID': uid } : {}), // 대문자, ASCII만
        ...xsrfHeader(),
    };

    const init = {
        method: bodyObj ? 'POST' : 'DELETE',
        headers,
        credentials: 'include', // ✅ 세션 쿠키 동봉
    };
    if (bodyObj) init.body = JSON.stringify(bodyObj);
    return init;
}

function toJsonSafely(res) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return Promise.resolve(null);
}

// 다양한 응답 모양 방어
function normalizeApiData(json) {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.comments)) return json.comments;
    if (json.data && Array.isArray(json.data.comments)) return json.data.comments;
    return [];
}

function buildTree(list) {
    const byId = new Map();
    list.forEach(c => {
        const id = c.id ?? c.commentId ?? c.cid;
        byId.set(id, { ...c, id, children: [] });
    });
    const roots = [];
    list.forEach(c => {
        const id = c.id ?? c.commentId ?? c.cid;
        const node = byId.get(id);
        const pid = c.parentId ?? c.parentCommentId ?? null;
        if (pid) {
            const p = byId.get(pid);
            if (p) p.children.push(node);
            else roots.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
}

/** 작성자 id를 '엄격한' 후보에서만 추출 */
function extractAuthorIdStrict(c) {
    const candidates = [
        c.userId, c.authorId, c.writerId, c.commenterId, c.createdById, c.ownerId, c.commentUserId, c.createdBy
    ];
    for (const v of candidates) {
        if (v == null) continue;
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return null;
}

/** 서버가 명시 boolean을 주면 우선 사용 */
function computeMine(c, myId) {
    if (c.isMine === true || c.mine === true) return true;
    if (c.canDelete === true && c.role !== 'ADMIN') return true;
    const aid = extractAuthorIdStrict(c);
    return myId != null && aid != null && Number(aid) === Number(myId);
}

/* 작성자(배우) 객체의 탈퇴 여부만 본다. */
function isDeactivatedFromComment(c) {
    const U = v => (v ?? '').toString().toUpperCase();
    const actors = [c?.author, c?.writer, c?.commenter]; // user는 제외(모호)
    for (const a of actors) {
        if (!a || typeof a !== 'object') continue;
        const s = U(a.status || a.accountStatus || a.userStatus || a.authorStatus);
        if (['DEACTIVATED','WITHDRAWN','WITHDRAW','DELETED'].includes(s)) return true;
        if (a.deactivated || a.isDeactivated || a.withdrawn || a.isWithdrawn ||
            a.isDeleted || a.deletedUser || a.userDeleted || a.deleted) return true;
        if (a.deactivatedAt || a.withdrawnAt || a.deletedAt) return true;
    }
    const top = U(c?.authorStatus);
    if (['DEACTIVATED','WITHDRAWN','WITHDRAW','DELETED'].includes(top)) return true;
    if (c?.authorDeactivated) return true;
    if (c?.authorDeletedAt) return true;
    return false;
}

function looksAnonymousName(name, t) {
    const n = (name ?? '').toString().trim();
    if (!n) return false;
    const anonKo = (t?.('common.anonymous') || '익명').toString();
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reKo = /^익명\s*\d*$/i;
    const reI18n = new RegExp(`^${esc(anonKo)}\\s*\\d*$`, 'i');
    const reEn = /^anonymous\s*\d*$/i;
    return reKo.test(n) || reI18n.test(n) || reEn.test(n);
}

/* 표시용 이름 */
function nameForComment(c, t) {
    if (isDeactivatedFromComment(c)) return '탈퇴된 회원';
    const raw =
        c?.authorNickname ?? c?.nickname ?? c?.username ??
        c?.authorName ?? c?.userName ?? c?.displayName ??
        c?.author?.nickname ?? c?.author?.name ?? '';
    const name = (raw || '').toString().trim();
    if (!name) return t('common.anonymous') || '익명';
    if (looksAnonymousName(name, t)) return name;
    const masked = displayMaskedName(name, false);
    return masked || (t('common.anonymous') || '익명');
}

/* ----------------------------- component ----------------------------- */
export default function WantedComments({ wantedId }) {
    const { t } = useTranslation();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState('');
    const [textError, setTextError] = useState('');
    const [replyFor, setReplyFor] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replyError, setReplyError] = useState('');

    const myId = (() => {
        const v = localStorage.getItem('userId');
        if (!/^\d+$/.test(v || '')) return null;
        return Number(v);
    })();

    const tree = useMemo(() => buildTree(list), [list]);

    async function fetchList() {
        setLoading(true);
        try {
            // ✅ GET도 쿠키 포함(세션 로그인이면 목록에 권한 플래그 내려올 수 있음)
            const res = await fetch(`/api/wanted/${wantedId}/comments`, publicInit());
            if (!res.ok) throw new Error(`목록 실패 (${res.status})`);
            const json = await toJsonSafely(res);
            setList(normalizeApiData(json));
        } catch (e) {
            console.error('[comments:list]', e);
            setList([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchList(); }, [wantedId]);

    async function submitRoot() {
        const body = { content: text.trim() };
        if (!body.content) return;
        try {
            setTextError('');
            const res = await fetch(`/api/wanted/${wantedId}/comments`, authInit(body));
            const json = await toJsonSafely(res);
            if (!res.ok) {
                if (res.status === 400 && json?.success === false && json?.data?.field) {
                    const d = json.data;
                    const lvl = d.predictionLevel ? ` (${d.predictionLevel}${typeof d.malicious === 'number' ? `, ${Math.round(d.malicious*100)}%` : ''})` : '';
                    setTextError((json.message || '부적절한 표현이 감지되었습니다.') + lvl);
                    return;
                }
                throw new Error(json?.message || t('wantedComments.error.createFailed', { status: res.status }));
            }
            setText('');
            await fetchList();
        } catch (e) {
            alert(e.message || t('wantedComments.error.createFailed'));
        }
    }

    async function submitReply(parentId) {
        const body = { content: replyText.trim() };
        if (!body.content) return;
        try {
            setReplyError('');
            const res = await fetch(`/api/wanted/${wantedId}/comments/${parentId}/replies`, authInit(body));
            const json = await toJsonSafely(res);
            if (!res.ok) {
                if (res.status === 400 && json?.success === false && json?.data?.field) {
                    const d = json.data;
                    const lvl = d.predictionLevel ? ` (${d.predictionLevel}${typeof d.malicious === 'number' ? `, ${Math.round(d.malicious*100)}%` : ''})` : '';
                    setReplyError((json.message || '부적절한 표현이 감지되었습니다.') + lvl);
                    return;
                }
                throw new Error(json?.message || t('wantedComments.error.replyFailed', { status: res.status }));
            }
            setReplyFor(null);
            setReplyText('');
            await fetchList();
        } catch (e) {
            alert(e.message || t('wantedComments.error.replyFailed'));
        }
    }

    async function remove(commentId) {
        if (!window.confirm(t('wantedComments.confirmDelete'))) return;
        try {
            const res = await fetch(`/api/wanted/${wantedId}/comments/${commentId}`, authInit());
            if (!res.ok && res.status !== 204) {
                const json = await toJsonSafely(res);
                throw new Error(json?.message || t('wantedComments.error.deleteFailed', { status: res.status }));
            }
            await fetchList();
        } catch (e) {
            console.error(e);
            alert(e.message || t('wantedComments.error.deleteFailed'));
        }
    }

    const renderItem = (c) => {
        const created = c.createdAt ? new Date(c.createdAt) : null;
        const mine = computeMine(c, myId);
        const displayName = nameForComment(c, t);

        const key = c.id ?? c.commentId ?? c.cid;

        return (
            <Item key={key}>
                <Meta>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
            <FaUser/>{displayName}
          </span>
                    {created && (
                        <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <FaClock/>{created.toLocaleString('ko-KR')}
            </span>
                    )}
                </Meta>

                {c.contentToxic && (
                    <div style={{
                        marginBottom: 6,
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#fff3cd',
                        color: '#856404',
                        border: '1px solid #ffeeba'
                    }}>
                        경고
                    </div>
                )}

                <Content $deleted={c.deleted}>
                    {c.deleted ? t('wantedComments.deletedComment') : c.content}
                </Content>

                <Actions>
                    <Button onClick={() => { setReplyFor(key); setReplyText(''); }}>
                        <FaReply/> {t('wantedComments.reply')}
                    </Button>
                    {mine && (
                        <Button $variant="danger" onClick={() => remove(key)}>
                            <FaTrash/> {t('wantedComments.delete')}
                        </Button>
                    )}
                </Actions>

                {replyFor === key && (
                    <ReplyBox>
                        <EditorRow>
                            <Textarea
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder={t('wantedComments.replyPlaceholder')}
                            />
                            {replyError && (
                                <div style={{ color:'#dc3545', fontSize:'.9rem', marginTop: 6 }}>{replyError}</div>
                            )}
                            <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                <Button $variant="primary" onClick={() => submitReply(key)}>{t('wantedComments.submit')}</Button>
                                <Button onClick={() => { setReplyFor(null); setReplyText(''); }}>{t('wantedComments.cancel')}</Button>
                            </div>
                        </EditorRow>
                    </ReplyBox>
                )}

                {c.children && c.children.length > 0 && (
                    <RepliesList>
                        {c.children.map(ch => renderItem(ch))}
                    </RepliesList>
                )}
            </Item>
        );
    };

    return (
        <Box>
            <Title>{t('wantedComments.title')}</Title>

            <EditorRow>
                <Textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={t('wantedComments.commentPlaceholder')}
                />
                {textError && (
                    <div style={{ color:'#dc3545', fontSize:'.9rem', marginTop: 6 }}>{textError}</div>
                )}
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <Button $variant="primary" onClick={submitRoot}>{t('wantedComments.submit')}</Button>
                    <Button onClick={() => setText('')}>{t('wantedComments.cancel')}</Button>
                </div>
            </EditorRow>

            {loading ? (
                <div style={{color:'#6b7280'}}>{t('wantedComments.loading')}</div>
            ) : (
                <List>
                    {tree.length === 0 ? (
                        <li style={{color:'#6b7280'}}>{t('wantedComments.noComments')}</li>
                    ) : (
                        tree.map(renderItem)
                    )}
                </List>
            )}
        </Box>
    );
}
