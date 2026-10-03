import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getUserPeerReviews, getUserPeerSummary } from '../../api/peerReviews';

const Container = styled.div`
  max-width: 1100px; margin: 0 auto; padding: 32px 16px; padding-top: 96px;
`;
const Header = styled.div`display:flex; align-items:center; justify-content:space-between; margin-bottom: 16px;`;
const Title = styled.h1`font-size:1.6rem; color:#333; margin:0;`;
const Tabs = styled.div`display:flex; gap:8px; margin: 10px 0 16px;`;
const TabBtn = styled.button`
  padding: 8px 14px; border-radius: 16px; border:1px solid ${p=>p.$active?'#1976d2':'#e0e0e0'};
  background:${p=>p.$active?'#1976d2':'#fff'}; color:${p=>p.$active?'#fff':'#333'}; cursor:pointer;
`;
const Summary = styled.div`display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;`;
const Badge = styled.div`padding:6px 10px; border:1px solid #e0e0e0; border-radius:8px; background:#f8f9fa;`;
const List = styled.ul`list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px;`;
const Item = styled.li`display:flex; justify-content:space-between; border:1px solid #e0e0e0; border-radius:8px; padding:10px 12px;`;
const Pager = styled.div`display:flex; gap:8px; justify-content:flex-end; margin-top:12px;`;
const SmallBtn = styled.button`padding:6px 10px; border-radius:8px; border:1px solid #e0e0e0; background:#f8f9fa; cursor:pointer;`;

function getAuthHeaders() {
  const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('JWT') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function pickDisplayName(u, fallbackId) {
  if (!u) return '';
  const emailName = typeof u.email === 'string' ? u.email.split('@')[0] : '';
  return (
      u.nickname ||
      u.username ||
      u.userName ||
      u.name ||
      u.fullName ||
      u.displayName ||
      u.profile?.nickname ||
      u.profile?.name ||
      emailName ||
      (fallbackId ? `사용자 #${fallbackId}` : '')
  );
}

/** 가능한 기존 엔드포인트만 시도 (백엔드 추가 없음) */
async function resolveUserName(uid) {
  const headers = getAuthHeaders();

  // 1) 일반 사용자 조회가 이미 있다면 (있을 수도/없을 수도)
  const userEndpoints = [
    `/api/users/${uid}`,
    `/api/user/${uid}`,
    `/api/users/${uid}/profile`,
  ];
  for (const url of userEndpoints) {
    try {
      const r = await axios.get(url, { headers, timeout: 7000 });
      const name = pickDisplayName(r?.data, uid);
      if (name && !/^사용자\s?#?\d+$/i.test(name)) return name;
    } catch {}
  }

  // 2) 판매자 글 목록에서 sellerNickname 얻기 (이미 프로젝트에 존재)
  try {
    const r = await axios.get(`/api/posts/seller/${uid}?page=0&size=1`, { headers, timeout: 7000 });
    const first = Array.isArray(r?.data) ? r.data[0] : null;
    const name =
        first?.sellerNickname ||
        first?.sellerName ||
        first?.sellerUsername ||
        first?.seller?.nickname ||
        first?.seller?.username;
    if (name) return name;
  } catch {}

  // 3) 리뷰 API에서 소유자/대상 닉네임이 내려온다면 활용 (있으면 쓰고, 없으면 패스)
  try {
    const data = await getUserPeerReviews(uid, 'SELLER', 0, 1);
    const one = Array.isArray(data?.content) ? data.content[0] : null;
    const name =
        one?.targetNickname ||
        one?.ownerNickname ||
        one?.userNickname ||
        one?.sellerNickname;
    if (name) return name;
  } catch {}

  return '';
}

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // 🔹 PostDetail에서 넘어온 값 즉시 사용
  const nameFromState =
      location.state?.username ||
      location.state?.name ||
      location.state?.nickname ||
      '';

  const [role, setRole] = useState('SELLER');
  const [sumSeller, setSumSeller] = useState(null);
  const [sumBuyer, setSumBuyer] = useState(null);
  const [list, setList] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState(nameFromState);
  const [userNameLoading, setUserNameLoading] = useState(false);

  const fetchUserName = useCallback(async (uid) => {
    if (!uid) { setUserName(''); return; }
    setUserNameLoading(true);
    try {
      const display = await resolveUserName(uid);
      if (display) setUserName(display);
    } finally {
      setUserNameLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (uid) => {
    try {
      const [s1, s2] = await Promise.all([
        getUserPeerSummary(uid, 'SELLER'),
        getUserPeerSummary(uid, 'BUYER')
      ]);
      setSumSeller(s1); setSumBuyer(s2);
    } catch { setSumSeller(null); setSumBuyer(null); }
  }, []);

  const fetchList = useCallback(async (uid, r, p=0, z=size) => {
    setLoading(true); setError('');
    try {
      const data = await getUserPeerReviews(uid, r, p, z);
      setList(Array.isArray(data.content) ? data.content : []);
      setPage(typeof data.page === 'number' ? data.page : p);
      setSize(typeof data.size === 'number' ? data.size : z);
      setLast(Boolean(data.last));
    } catch (e) {
      setList([]); setError(e?.response?.data?.message || t('userProfile.error.loadReviews'));
    } finally { setLoading(false); }
  }, [size, t]);

  // 최초 로드: state 이름 먼저 보여주고, 비동기 보강
  useEffect(() => {
    if (!userId) return;
    if (nameFromState && !userName) setUserName(nameFromState);
    fetchUserName(userId);
    fetchSummary(userId);
    fetchList(userId, role, 0, size);
  }, [userId, role, size, nameFromState, userName, fetchUserName, fetchSummary, fetchList]);

  // 탭 전환 시 목록만 새로고침
  useEffect(() => {
    if (!userId) return;
    fetchList(userId, role, 0, size);
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
      <Container>
        <Header>
          <Title>
            {userNameLoading ? t('userProfile.loading') : (userName || `사용자 #${userId}`)}
          </Title>
          <SmallBtn onClick={() => navigate(-1)}>{t('userProfile.back')}</SmallBtn>
        </Header>

        <Summary>
          <Badge>{t('userProfile.sellerAverage', { score: Number(sumSeller?.averageScore ?? 0).toFixed(2), count: sumSeller?.reviewCount ?? 0 })}</Badge>
          <Badge>{t('userProfile.buyerAverage', { score: Number(sumBuyer?.averageScore ?? 0).toFixed(2), count: sumBuyer?.reviewCount ?? 0 })}</Badge>
        </Summary>

        <Tabs>
          <TabBtn $active={role==='SELLER'} onClick={() => setRole('SELLER')}>{t('userProfile.sellerReviews')}</TabBtn>
          <TabBtn $active={role==='BUYER'} onClick={() => setRole('BUYER')}>{t('userProfile.buyerReviews')}</TabBtn>
        </Tabs>

        {loading ? (
            <div style={{color:'#666'}}>{t('userProfile.loading')}</div>
        ) : error ? (
            <div style={{color:'#d32f2f'}}>{error}</div>
        ) : list.length === 0 ? (
            <div style={{color:'#666'}}>{t('userProfile.noReviews')}</div>
        ) : (
            <List>
              {list.map(rv => (
                  <Item key={rv.reviewId}>
                    <div>
                      <div style={{fontWeight:600}}>{rv.reviewerNickname || t('userProfile.defaultUser')}</div>
                      {Array.isArray(rv.ratingKeywords) && rv.ratingKeywords.length > 0 && (
                          <div style={{fontSize:'0.9rem', color:'#666'}}>{rv.ratingKeywords.join(', ')}</div>
                      )}
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <span style={{fontSize:'0.85rem', color:'#555'}}>{rv.createdAt ? new Date(rv.createdAt).toLocaleDateString('ko-KR') : ''}</span>
                      <span style={{color:'#007bff', fontWeight:700}}>{Number(rv.ratingScore).toFixed(2)}★</span>
                    </div>
                  </Item>
              ))}
            </List>
        )}

        <Pager>
          <SmallBtn onClick={() => fetchList(userId, role, Math.max(0, page-1), size)} disabled={page<=0}>{t('userProfile.previous')}</SmallBtn>
          <SmallBtn onClick={() => !last && fetchList(userId, role, page+1, size)} disabled={last}>{t('userProfile.next')}</SmallBtn>
        </Pager>
      </Container>
  );
};

export default UserProfile;
