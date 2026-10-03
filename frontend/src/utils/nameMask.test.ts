import { describe, expect, it } from 'vitest'

import {
  displayMaskedName,
  isClickableUser,
  isDeactivatedName
} from './nameMask'

describe('isDeactivatedName', () => {
  it('탈퇴 회원 닉네임 형식을 알아본다', () => {
    expect(isDeactivatedName('탈퇴한 회원')).toBe(true)
    expect(isDeactivatedName('탈퇴회원#123')).toBe(true)
    expect(isDeactivatedName('홍길동')).toBe(false)
    expect(isDeactivatedName(null)).toBe(false)
  })
})

describe('displayMaskedName', () => {
  it('첫 글자만 남기고 가린다', () => {
    expect(displayMaskedName('홍길동')).toBe('홍**')
    expect(displayMaskedName('홍')).toBe('홍*')
  })

  it('탈퇴 회원은 이름 대신 탈퇴한 회원으로 보여 준다', () => {
    expect(displayMaskedName('홍길동', true)).toBe('탈퇴한 회원')
    expect(displayMaskedName('탈퇴회원#7')).toBe('탈퇴한 회원')
  })

  it('빈 이름은 사용자로 보여 준다', () => {
    expect(displayMaskedName('  ')).toBe('사용자')
    expect(displayMaskedName(undefined)).toBe('사용자')
  })
})

describe('isClickableUser', () => {
  it('탈퇴 회원은 누를 수 없다', () => {
    expect(isClickableUser('홍길동')).toBe(true)
    expect(isClickableUser('홍길동', true)).toBe(false)
    expect(isClickableUser('탈퇴한 회원')).toBe(false)
  })
})
