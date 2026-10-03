// 탈퇴 회원/마스킹 안전 처리 유틸

export const isDeactivatedName = (raw) => {
    const s = String(raw ?? '').trim();
    return s === '탈퇴한 회원' || /^탈퇴회원#/i.test(s);
};

/**
 * 표시용 이름 계산
 * - 서버가 deactivated 플래그를 주면 true면 무조건 '탈퇴한 회원'
 * - 닉네임이 '탈퇴회원#123' 형태거나 이미 '탈퇴한 회원'이면 그대로 '탈퇴한 회원'
 * - 그 외엔 기존 마스킹 규칙(첫 글자 + **)
 */
export const displayMaskedName = (raw, deactivated = false) => {
    const name = String(raw ?? '').trim();

    if (deactivated || isDeactivatedName(name)) return '탈퇴한 회원';
    if (!name) return '사용자';

    // 기존 마스킹 규칙 (필요시 너네 규칙으로 수정)
    if (name.length === 1) return `${name}*`;
    return `${name[0]}**`;
};

/** 링크/버튼 활성화 여부 (탈퇴 회원은 비활성화) */
export const isClickableUser = (raw, deactivated = false) => {
    if (deactivated) return false;
    if (isDeactivatedName(raw)) return false;
    return true;
};
