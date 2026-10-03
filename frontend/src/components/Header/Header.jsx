import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { AuthCtx } from '../../contexts/AuthContext';
import { useWriting } from '../../contexts/WritingContext';
import WarningModal from '../WarningModal/WarningModal';
import { FaBell, FaComment, FaHeart, FaTag } from 'react-icons/fa';
import { startNotificationStream } from '../../api/notifications';

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-100%); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const notificationPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: var(--z-fixed);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${slideDown} 0.6s ease-out;
  transition: var(--transition-normal);
  &:hover { box-shadow: var(--shadow-md); }
`;

const NavContainer = styled.nav`
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-16);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  @media (max-width: 1440px) { padding: 0 var(--space-12); }
  @media (max-width: 1024px) { padding: 0 var(--space-8); }
  @media (max-width: 900px) { padding: 0 var(--space-2); }
`;

const FlexRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 48px;
  padding: var(--space-1) 0 var(--space-1) 0;
  @media (max-width: 900px) {
    min-height: 40px;
    padding: var(--space-1) 0;
  }
`;

const LeftBox = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-5);
`;

const LangSelectBox = styled.div`
  display: flex;
  align-items: center;
  margin-right: var(--space-5);
  position: relative;
`;

const LangSelect = styled.select`
  background: var(--primary-50);
  border: 1px solid var(--primary-200);
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-4);
  font-size: 0.9rem;
  color: var(--primary-700);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--space-2) center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: var(--space-8);
  &:hover { background-color: var(--primary-100); border-color: var(--primary-300); transform: translateY(-1px); }
  &:focus { outline: none; box-shadow: 0 0 0 3px var(--primary-100); border-color: var(--primary-500); }
  .lang-text { display: inline; }
  @media (max-width: 768px) {
    padding: var(--space-2) var(--space-3); font-size: 0.8rem;
    .lang-text { display: none; }
    option { font-size: 0.8rem; }
  }
  @media (max-width: 600px) {
    padding: var(--space-2); min-width: 60px;
    .lang-text { display: none; }
    option { font-size: 0.75rem; }
  }
  @media (max-width: 480px) {
    padding: var(--space-1) var(--space-2); min-width: 50px; font-size: 0.75rem;
    .lang-text { display: none; }
    option { font-size: 0.7rem; }
  }
`;

const Logo = styled(Link)`
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  transition: var(--transition-normal);
  position: relative;
  min-width: 0;
  flex-shrink: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { transform: translateY(-1px); filter: brightness(1.1); }
  @media (max-width: 900px) { font-size: 1.2rem; }
  @media (max-width: 600px) { font-size: 1.1rem; }
`;

const NavLinks = styled.ul`
  display: flex;
  align-items: center;
  gap: var(--space-8);
  list-style: none;
  margin: 0;
  padding: 0;
  @media (max-width: 900px) { display: none; }
`;

const NavLink = styled.li` position: relative; `;

const NavLinkItem = styled(Link)`
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  transition: var(--transition-normal);
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  &:hover { color: var(--primary); background-color: var(--primary-50); transform: translateY(-1px); }
  &.active { color: var(--primary); background-color: var(--primary-100); font-weight: 600; }
`;

const RightBox = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4);
`;

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  @media (max-width: 900px) { display: none; }
`;

const Button = styled.button`
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: 500;
  font-size: 0.9rem;
  transition: var(--transition-normal);
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: rgba(255, 255, 255, 0.1); transition: var(--transition-normal);
  }
  &:hover::before { left: 100%; }
`;

const LoginButton = styled(Link)`
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: 500;
  font-size: 0.9rem;
  transition: var(--transition-normal);
  cursor: pointer;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  text-decoration: none;
  display: flex; align-items: center; gap: var(--space-2);
  position: relative; overflow: hidden; z-index: 10; pointer-events: auto;
  &::before {
    content: ''; position: absolute; top: 0; left: -100%;
    width: 100%; height: 100%; background: rgba(255, 255, 255, 0.1);
    transition: var(--transition-normal);
  }
  &:hover {
    background: var(--primary-50); border-color: var(--primary-300);
    transform: translateY(-1px); box-shadow: var(--shadow-sm);
    text-decoration: none; color: var(--primary);
  }
  &:hover::before { left: 100%; }
`;

const RegisterButton = styled(Link)`
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: 500;
  font-size: 0.9rem;
  transition: var(--transition-normal);
  cursor: pointer;
  border: 1px solid var(--primary);
  background: var(--primary);
  color: white;
  text-decoration: none;
  display: flex; align-items: center; gap: var(--space-2);
  position: relative; overflow: hidden; z-index: 10; pointer-events: auto;
  &::before {
    content: ''; position: absolute; top: 0; left: -100%;
    width: 100%; height: 100%; background: rgba(255, 255, 255, 0.1);
    transition: var(--transition-normal);
  }
  &:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
    text-decoration: none;
    color: white;
  }
  &:hover::before { left: 100%; }
`;

const UserMenu = styled.div`
  display: flex; align-items: center; gap: var(--space-3); position: relative;
  @media (max-width: 900px) { display: none; }
`;

const UserAvatar = styled.div`
  width: 40px; height: 40px; border-radius: var(--radius-full);
  background: var(--primary); display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 600; font-size: 1rem; cursor: pointer;
  transition: var(--transition-normal);
  border: 2px solid var(--primary-100);
  &:hover { transform: scale(1.05); box-shadow: var(--shadow-md); }
`;

const UserDropdown = styled.div`
  position: absolute; top: 100%; right: 0; margin-top: var(--space-2);
  background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light); min-width: 200px;
  opacity: 0; visibility: hidden; transform: translateY(-10px);
  transition: var(--transition-normal); z-index: var(--z-dropdown);
  ${({ $isOpen }) => $isOpen && `opacity: 1; visibility: visible; transform: translateY(0);`}
`;

const DropdownItem = styled(Link)`
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--text-secondary); text-decoration: none;
  transition: var(--transition-fast); border-bottom: 1px solid var(--border-light);
  &:last-child { border-bottom: none; }
  &:hover { background: var(--gray-50); color: var(--primary); }
`;

const LogoutButton = styled.button`
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); color: var(--error);
  background: none; border: none; width: 100%; text-align: left; cursor: pointer;
  transition: var(--transition-fast);
  &:hover { background: var(--error-50); }
`;

const MobileMenuButton = styled.button`
  display: none; background: none; border: none; color: var(--text-secondary);
  font-size: 1.5rem; cursor: pointer; padding: var(--space-2); border-radius: var(--radius-lg);
  transition: var(--transition-normal);
  &:hover { background: var(--gray-100); color: var(--primary); }
  @media (max-width: 900px) { display: flex; align-items: center; justify-content: center; }
`;

const MobileMenu = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
  z-index: var(--z-modal-backdrop); opacity: 0; visibility: hidden;
  transition: var(--transition-normal);
  ${({ $isOpen }) => $isOpen && `opacity: 1; visibility: visible;`}
`;

const MobileMenuContent = styled.div`
  position: absolute; top: 0; right: 0; width: 300px; height: 100%;
  background: white; padding: var(--space-6);
  transform: translateX(100%); transition: var(--transition-normal);
  overflow-y: auto;
  ${({ $isOpen }) => $isOpen && `transform: translateX(0);`}
`;

const MobileMenuHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: var(--space-6); padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-light);
`;

const MobileMenuClose = styled.button`
  background: none; border: none; font-size: 1.5rem; color: var(--text-secondary);
  cursor: pointer; padding: var(--space-2); border-radius: var(--radius-lg);
  transition: var(--transition-normal);
  &:hover { background: var(--gray-100); color: var(--error); }
`;

const MobileNavLinks = styled.ul`
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: var(--space-2);
`;

const MobileNavLink = styled(Link)`
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--text-secondary); text-decoration: none; border-radius: var(--radius-lg);
  transition: var(--transition-normal); font-weight: 500;
  &:hover { background: var(--gray-50); color: var(--primary); }
  &.active { background: var(--primary-50); color: var(--primary); font-weight: 600; }
`;

const WritingIndicator = styled.div`
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background: var(--warning-50); color: var(--warning-700);
  border: 1px solid var(--warning-200); border-radius: var(--radius-full);
  font-size: 0.8rem; font-weight: 500; animation: ${pulse} 2s ease-in-out infinite;
  @media (max-width: 900px) { display: none; }
`;

// 알림 관련 스타일
const NotificationContainer = styled.div`
  position: relative; margin-right: var(--space-4);
  @media (max-width: 768px) { margin-right: var(--space-2); }
`;

const NotificationButton = styled.button`
  background: none; border: none; color: var(--text);
  font-size: 1.2rem; cursor: pointer; padding: var(--space-2);
  border-radius: var(--radius-full); transition: var(--transition-normal);
  position: relative; display: flex; align-items: center; justify-content: center;
  &:hover { background: var(--surface); color: var(--primary); transform: translateY(-1px); }
  @media (max-width: 768px) { font-size: 1.1rem; padding: var(--space-1); }
`;

const NotificationBadge = styled.div`
  position: absolute; top: 0; right: 0; background: var(--error); color: white;
  border-radius: var(--radius-full); width: 18px; height: 18px; font-size: 0.7rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  animation: ${notificationPulse} 2s ease-in-out infinite;
  @media (max-width: 768px) { width: 16px; height: 16px; font-size: 0.6rem; }
`;

const NotificationDropdown = styled.div`
  position: absolute; top: 100%; right: 0; background: white;
  border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
  min-width: 320px; max-width: 400px; max-height: 400px; overflow-y: auto; z-index: var(--z-dropdown);
  animation: ${fadeIn} 0.2s ease-out;
  @media (max-width: 768px) { min-width: 280px; max-width: 320px; right: -50px; }
`;

const NotificationHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border);
  background: var(--surface); border-radius: var(--radius-lg) var(--radius-lg) 0 0;
`;

const NotificationTitle = styled.h3`
  font-size: 1rem; font-weight: 600; color: var(--text); margin: 0;
`;

const ClearAllButton = styled.button`
  background: none; border: none; color: var(--text-light); font-size: 0.8rem;
  cursor: pointer; padding: var(--space-1) var(--space-2); border-radius: var(--radius-md);
  transition: var(--transition-normal);
  &:hover { background: var(--surface); color: var(--text); }
`;

const NotificationList = styled.div` max-height: 300px; overflow-y: auto; `;

const NotificationItem = styled.div`
  padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-light);
  cursor: pointer; transition: var(--transition-normal);
  display: flex; align-items: flex-start; gap: var(--space-3);
  &:hover { background: var(--surface); }
  &:last-child { border-bottom: none; }
  &.unread { background: var(--primary-50); }
`;

const NotificationIcon = styled.div`
  width: 32px; height: 32px; border-radius: var(--radius-full);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 0.9rem; color: white;
  background: ${props => {
    switch (props.type) {
      case 'chat': return 'var(--primary)';
      case 'price': return 'var(--warning)';
      case 'system': return 'var(--success)';
      default: return 'var(--text-light)';
    }
  }};
`;

const NotificationContent = styled.div` flex: 1; min-width: 0; `;
const NotificationText = styled.div` font-size: 0.9rem; color: var(--text); line-height: 1.4; margin-bottom: var(--space-1); `;
const NotificationTime = styled.div` font-size: 0.8rem; color: var(--text-light); `;
const NotificationEmpty = styled.div` padding: var(--space-6) var(--space-4); text-align: center; color: var(--text-light); font-size: 0.9rem; `;
const UnreadDot = styled.div` width: 8px; height: 8px; background: var(--primary); border-radius: var(--radius-full); flex-shrink: 0; margin-top: var(--space-1); `;

// ====== ✅ 사용자별 localStorage 저장/복원 유틸 ======
const storageKeyForUser = (user) => {
  const id = user?.id ?? user?.userId ?? user?.seq ?? null; // 프로젝트의 사용자 키에 맞춰 자동 대응
  return id ? `notif:${id}` : null;
};

const loadSaved = (user) => {
  try {
    const key = storageKeyForUser(user);
    if (!key) return [];
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSaved = (user, list) => {
  try {
    const key = storageKeyForUser(user);
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(list ?? []));
  } catch {}
};

const clearSaved = (user) => {
  try {
    const key = storageKeyForUser(user);
    if (!key) return;
    localStorage.removeItem(key);
  } catch {}
};

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isLoggedIn, user, logout } = useContext(AuthCtx);
  const { isWriting, writingType } = useWriting();
  const userMenuRef = useRef(null);
  const isHome = location.pathname === '/';
  
  
  // 외부 클릭 시 유저 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      alert("로그아웃 중 문제가 발생했습니다.");
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const safeNavigate = (path) => {
    if (isWriting) {
      setPendingNavigation(path);
      setShowWarningModal(true);
    } else {
      navigate(path);
    }
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const handleConfirmExit = () => {
    setShowWarningModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    } else {
      navigate('/marketplace');
    }
  };

  const handleCancelExit = () => {
    setShowWarningModal(false);
    setPendingNavigation(null);
  };

  const handleSaveDraftAndExit = async () => {
    try {
      window.dispatchEvent(new CustomEvent('saveDraft'));
      setShowWarningModal(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      setShowWarningModal(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
    }
  };

  const getDefaultAvatar = () => {
    if (user && user.username) return user.username.charAt(0).toUpperCase();
    try {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        if (parsedUser && parsedUser.username) return parsedUser.username.charAt(0).toUpperCase();
      }
    } catch (error) {
    }
    return 'U';
  };

  const getUserInfo = () => {
    if (user) return user;
    try {
      const localUser = localStorage.getItem('user');
      return localUser ? JSON.parse(localUser) : null;
    } catch (error) {
      return null;
    }
  };

  const currentUser = getUserInfo();

  // ====== ✅ 로그인 시: 저장된 알림 복원
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const saved = loadSaved(currentUser);
    if (Array.isArray(saved) && saved.length) {
      setNotifications(saved);
    }
  }, [isLoggedIn, currentUser?.id]);

  // ====== ✅ 알림 변경 시: 사용자별 자동 저장
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    saveSaved(currentUser, notifications);
  }, [notifications, isLoggedIn, currentUser?.id]);

  const toggleNotifications = () => setShowNotifications(!showNotifications);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, unread: false } : n)
    );
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);
    if (notification.link) navigate(notification.link);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // 외부 클릭 시 알림 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [showNotifications]);

  // ====== ✅ 전체 삭제 (localStorage 동기화)
  const clearAllNotifications = () => {
    setNotifications([]);
    if (currentUser) clearSaved(currentUser);
  };

  // 시간 표시 포맷터
  const formatTime = (iso) => {
    try {
      const d = iso ? new Date(iso) : new Date();
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '방금 전';
    }
  };

  // ====== ✅ SSE 구독 (중복 방지 포함)
  useEffect(() => {
    if (!isLoggedIn) return;
    const es = startNotificationStream(
        (evt) => {
          if (!evt || evt.type === 'PING') return;

          const mappedType = evt.type === 'CHAT' ? 'chat' : 'system';
          const text = evt.title
              ? `${evt.title}${evt.message ? ' · ' + evt.message : ''}`
              : (evt.message || '새 알림');

          // 안정적인 ID (백엔드에서 id 주면 최우선 사용)
          const stableId = evt.id || `${evt.type}-${evt.createdAt || ''}-${evt.link || ''}`;

          const item = {
            id: stableId,
            type: mappedType,
            text,
            time: (() => {
              try {
                const d = evt.createdAt ? new Date(evt.createdAt) : new Date();
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } catch {
                return '방금 전';
              }
            })(),
            unread: true,
            link: evt.link || null
          };

          setNotifications((prev) => {
            const idx = prev.findIndex((n) => n.id === item.id);
            if (idx >= 0) {
              // 이미 있으면 맨 위로 갱신
              const next = [...prev];
              next.splice(idx, 1);
              return [item, ...next].slice(0, 50);
            }
            return [item, ...prev].slice(0, 50);
          });
        },
        () => {} // 오류/재연결은 내부에서 처리
    );
    return () => { try { es && es.close(); } catch {} };
  }, [isLoggedIn]);

  return (
      <>
        <HeaderContainer>
          <NavContainer>
            <FlexRow>
              <LeftBox>
                <LangSelectBox>
                  <LangSelect value={i18n.language} onChange={handleLangChange}>
                    <option value="ko">🇰🇷 한국어</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="ja">🇯🇵 日本語</option>
                    <option value="zh">🇨🇳 中文</option>
                  </LangSelect>
                </LangSelectBox>
                <Logo to="/" onClick={(e) => { e.preventDefault(); safeNavigate('/'); }}>
                  {t('title')}
                </Logo>
              </LeftBox>

              {!isHome && (
                  <NavLinks>
                    <NavLinkItem
                        to="/marketplace"
                        className={location.pathname === '/marketplace' ? 'active' : ''}
                        onClick={(e) => { e.preventDefault(); safeNavigate('/marketplace'); }}
                    >
                      {t('navigation.bookTradingBoard')}
                    </NavLinkItem>
                    <NavLinkItem
                        to="/bookstore"
                        className={location.pathname === '/bookstore' ? 'active' : ''}
                        onClick={(e) => { e.preventDefault(); safeNavigate('/bookstore'); }}
                    >
                      {t('myTransactions')}
                    </NavLinkItem>
                    <NavLinkItem
                        to="/hongikmap"
                        className={location.pathname === '/hongikmap' ? 'active' : ''}
                        onClick={(e) => { e.preventDefault(); safeNavigate('/hongikmap'); }}
                    >
                      {t('navigation.map')}
                    </NavLinkItem>
                  </NavLinks>
              )}

              <RightBox>
                {isLoggedIn && (
                    <NotificationContainer className="notification-container">
                      <NotificationButton onClick={toggleNotifications}>
                        <FaBell />
                        {unreadCount > 0 && (
                            <NotificationBadge>
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </NotificationBadge>
                        )}
                      </NotificationButton>

                      {showNotifications && (
                          <NotificationDropdown>
                            <NotificationHeader>
                              <NotificationTitle>{t('notifications')}</NotificationTitle>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <ClearAllButton onClick={clearAllNotifications}>
                                  {t('clearAll')}
                                </ClearAllButton>
                              </div>
                            </NotificationHeader>

                            <NotificationList>
                              {notifications.length > 0 ? (
                                  notifications.map(notification => (
                                      <NotificationItem
                                          key={notification.id}
                                          className={notification.unread ? 'unread' : ''}
                                          onClick={() => handleNotificationClick(notification)}
                                      >
                                        <NotificationIcon type={notification.type}>
                                          {notification.type === 'chat' && <FaComment />}
                                          {notification.type === 'price' && <FaTag />}
                                          {notification.type === 'system' && <FaHeart />}
                                        </NotificationIcon>
                                        <NotificationContent>
                                          <NotificationText>{notification.text}</NotificationText>
                                          <NotificationTime>{notification.time}</NotificationTime>
                                        </NotificationContent>
                                        {notification.unread && <UnreadDot />}
                                      </NotificationItem>
                                  ))
                              ) : (
                                  <NotificationEmpty>
                                    <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>🔔</div>
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{t('noNotifications')}</div>
                                    <div style={{ fontSize: '0.8rem' }}>{t('notificationDesc')}</div>
                                  </NotificationEmpty>
                              )}
                            </NotificationList>
                          </NotificationDropdown>
                      )}
                    </NotificationContainer>
                )}

                {isLoggedIn ? (
                    <UserMenu ref={userMenuRef}>
                      <UserAvatar onClick={() => setIsDropdownOpen(prev => !prev)} title="사용자 메뉴">
                        {user && user.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt="Profile"
                                style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                            />
                        ) : (
                            <div className="default-avatar">{getDefaultAvatar()}</div>
                        )}
                      </UserAvatar>
                      <UserDropdown $isOpen={isDropdownOpen}>
                        <DropdownItem to="/mypage" onClick={(e) => { e.preventDefault(); safeNavigate('/mypage'); }}>
                          {t('mypageTitle')}
                        </DropdownItem>
                        <DropdownItem to="/bookstore" onClick={(e) => { e.preventDefault(); safeNavigate('/bookstore'); }}>
                          {t('myTransactions')}
                        </DropdownItem>
                        <LogoutButton onClick={handleLogout}>
                          {t('logout')}
                        </LogoutButton>
                      </UserDropdown>
                    </UserMenu>
                ) : (
                    <AuthButtons>
                      <LoginButton
                          to="/login"
                          onClick={(e) => { e.preventDefault(); safeNavigate('/login'); }}
                      >
                        {t('loginButton')}
                      </LoginButton>
                      <RegisterButton
                          to="/register"
                          onClick={(e) => { e.preventDefault(); safeNavigate('/register'); }}
                      >
                        {t('signup')}
                      </RegisterButton>
                    </AuthButtons>
                )}
              </RightBox>

              <MobileMenuButton onClick={toggleMobileMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </MobileMenuButton>
            </FlexRow>
          </NavContainer>
        </HeaderContainer>

        <MobileMenu $isOpen={isMobileMenuOpen} onClick={toggleMobileMenu}>
          <MobileMenuContent $isOpen={isMobileMenuOpen} onClick={(e) => e.stopPropagation()}>
            <MobileMenuHeader>
              <h3>{t('menu')}</h3>
              <MobileMenuClose onClick={toggleMobileMenu}>×</MobileMenuClose>
            </MobileMenuHeader>
            <MobileNavLinks>
              <MobileNavLink
                  to="/marketplace"
                  onClick={(e) => { e.preventDefault(); safeNavigate('/marketplace'); }}
                  style={{
                    fontWeight: '700',
                    color: 'var(--primary)',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    background: 'var(--primary-50)',
                    borderRadius: 'var(--radius-xl)',
                    marginBottom: 'var(--space-4)'
                  }}
              >
                {t('getStarted')} <span style={{marginLeft: 4}}>→</span>
              </MobileNavLink>
              {isLoggedIn ? (
                  <>
                    <MobileNavLink to="/mypage" onClick={(e) => { e.preventDefault(); safeNavigate('/mypage'); }}>
                      {t('mypageTitle')}
                    </MobileNavLink>
                    <MobileNavLink to="/bookstore" onClick={(e) => { e.preventDefault(); safeNavigate('/bookstore'); }}>
                      {t('myTransactions')}
                    </MobileNavLink>
                    <MobileNavLink as="button" onClick={handleLogout}>
                      {t('logout')}
                    </MobileNavLink>
                  </>
              ) : (
                  <>
                    <MobileNavLink to="/login" onClick={(e) => { e.preventDefault(); safeNavigate('/login'); }}>
                      {t('loginButton')}
                    </MobileNavLink>
                    <MobileNavLink to="/register" onClick={(e) => { e.preventDefault(); safeNavigate('/register'); }}>
                      {t('signup')}
                    </MobileNavLink>
                  </>
              )}
            </MobileNavLinks>
          </MobileMenuContent>
        </MobileMenu>

        <WarningModal
            isOpen={showWarningModal}
            onClose={handleCancelExit}
            onConfirm={handleConfirmExit}
            onCancel={handleCancelExit}
            onSaveDraft={handleSaveDraftAndExit}
            type={writingType}
            showSaveDraft={writingType === 'sale'}
        />
      </>
  );
};

export default Header;
