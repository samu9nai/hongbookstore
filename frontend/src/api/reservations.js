export async function getCurrentReservation(roomId) {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`/api/chat/rooms/${roomId}/reservation`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 204) return null;
    if (!res.ok) throw new Error('예약 조회 실패');
    return res.json();
}

export async function upsertReservation(roomId, payload) {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`/api/chat/rooms/${roomId}/reservation`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('예약 저장 실패');
    return res.json();
}

export async function cancelReservation(roomId, reservationId, reason) {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`/api/chat/rooms/${roomId}/reservation/${reservationId}/cancel`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('예약 취소 실패');
    return res.json();
}

export async function completeReservation(roomId, reservationId) {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`/api/chat/rooms/${roomId}/reservation/${reservationId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('거래 완료 처리 실패');
    return res.json();
}
