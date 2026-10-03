import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const Card = styled.div`
    background: var(--surface);
    border-radius: 1.25rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    padding: 1.25rem;
    margin-top: 1rem;
`;
const Header = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    gap: .75rem; margin-bottom: .75rem;
    h3 { display: flex; gap: .5rem; font-size: 1.05rem; margin: 0; }
`;
const Row = styled.div`
    border-top: 1px dashed #e5e7eb; padding: .75rem 0;
    display: grid; grid-template-columns: 120px 1fr 120px 120px; gap: .75rem; align-items: center;
    &:first-of-type { border-top: none; }
    @media (max-width: 720px) { grid-template-columns: 1fr; gap: .5rem; }
`;
const Badge = styled.span`
    display: inline-flex; align-items: center; justify-content: center;
    padding: .25rem .5rem; border-radius: .5rem; font-size: .8rem;
    background: #eef2ff; color: #3730a3; white-space: nowrap;
`;
const Muted = styled.span` color: #6b7280; font-size: .85rem; `;
const Actions = styled.div` display: flex; gap: .5rem; justify-content: flex-end; `;
const Btn = styled.button`
    padding: .4rem .7rem; border-radius: .5rem; border: 1px solid #e5e7eb; background: white;
    cursor: pointer; transition: background .15s ease; &:hover { background: #f9fafb; }
`;

function fmt(dt) {
    if (!dt) return '-';
    try {
        const d = new Date(String(dt).includes('T') ? dt : String(dt).replace(' ', 'T'));
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        const hh = String(d.getHours()).padStart(2,'0');
        const mi = String(d.getMinutes()).padStart(2,'0');
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    } catch { return String(dt); }
}

const reasonLabel = (r) => ({ ABUSE:'욕설/비방', FRAUD:'사기/허위매물', SPAM:'스팸/광고', OTHER:'기타' }[r] || r);

/** axios 인스턴스가 무엇을 반환하든 안전하게 리스트를 뽑아내기 */
function normalizeList(input) {
    const p = input && input.data !== undefined && (typeof input.status === 'number' || input.headers)
        ? input.data       // axios 원본 response
        : input;           // 인터셉터로 data만 반환하는 경우

    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (Array.isArray(p.data)) return p.data;               // { data: [...] }
    if (p.content && Array.isArray(p.content)) return p.content; // Spring Page
    if (p.items && Array.isArray(p.items)) return p.items;
    if (p.data && p.data.content && Array.isArray(p.data.content)) return p.data.content;
    return [];
}

export default function AdminReportCard() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [checking, setChecking] = useState(true);
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState('desc');
    const navigate = useNavigate();

    // ADMIN 여부 확인: 성공만 하면 ADMIN으로 간주
    useEffect(() => {
        let active = true;
        (async () => {
            setChecking(true);
            try {
                await api.get('/reports', { params: { page: 0, size: 1 }});
                if (!active) return;
                setIsAdmin(true);
            } catch {
                if (!active) return;
                setIsAdmin(false);
            } finally {
                if (active) setChecking(false);
            }
        })();
        return () => { active = false; };
    }, []);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports', { params: { page: 0, size: 100 }});
            // ⬇️ 여기! res가 곧 데이터일 수 있으므로 res 자체를 normalize
            const items = normalizeList(res);
            setList(items || []);
        } catch {
            setList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin, fetchAll]);

    const sorted = useMemo(() => {
        const arr = [...list];
        arr.sort((a,b) => {
            const da = new Date(a?.createdAt || 0).getTime();
            const db = new Date(b?.createdAt || 0).getTime();
            return order === 'desc' ? db - da : da - db;
        });
        return arr;
    }, [list, order]);

    if (checking || !isAdmin) return null;

    return (
        <Card>
            <Header>
                <h3><i className="fas fa-flag" /> 신고 내역 <Muted>({sorted.length}건)</Muted></h3>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <Btn onClick={() => setOrder(o => o === 'desc' ? 'asc' : 'desc')}>
                        {order === 'desc' ? '최신순' : '오래된순'}
                    </Btn>
                    <Btn onClick={fetchAll}>새로고침</Btn>
                </div>
            </Header>

            {loading ? (
                <div style={{padding:'1rem 0'}}>불러오는 중…</div>
            ) : sorted.length === 0 ? (
                <div style={{padding:'1rem 0'}}>신고 내역이 없습니다.</div>
            ) : (
                <>
                    <Row>
                        <strong>구분</strong>
                        <strong>사유/내용</strong>
                        <strong>생성일</strong>
                        <strong style={{textAlign:'right'}}>바로가기</strong>
                    </Row>
                    {sorted.map((it) => {
                        const type = it?.type || '-';
                        const reason = it?.reason || '-';
                        const detail = it?.detail || '';
                        const salePostId = it?.salePostId || null;
                        const wantedId = it?.wantedId || null;
                        const link = salePostId
                            ? `/posts/${salePostId}`  // 혹은 /marketplace/${salePostId} 프로젝트 라우팅에 맞춰 바꿔도 OK
                            : (wantedId ? `/wanted/${wantedId}` : (String(type).startsWith('CHAT') ? '/chat' : null));
                        return (
                            <Row key={it?.id || Math.random()}>
                                <div><Badge>{type}</Badge></div>
                                <div>
                                    <div style={{marginBottom:4}}><strong>{reasonLabel(reason)}</strong></div>
                                    {detail ? <div style={{whiteSpace:'pre-wrap'}}><Muted>{detail}</Muted></div> : null}
                                </div>
                                <div><Muted>{fmt(it?.createdAt)}</Muted></div>
                                <Actions>
                                    {link ? <Btn onClick={() => navigate(link)}>열기</Btn> : <Muted>-</Muted>}
                                </Actions>
                            </Row>
                        );
                    })}
                </>
            )}
        </Card>
    );
}
