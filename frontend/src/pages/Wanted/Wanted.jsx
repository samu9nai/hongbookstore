import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import SidebarMenu, {
  MainContent
} from '../../components/SidebarMenu/SidebarMenu'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Card,
  CardTitle,
  CardMeta,
  MetaLabel,
  MetaValue,
  FilterSection,
  FilterButton,
  SearchButton,
  Loading
} from '../../components/ui'

const WantedContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 32px;
  box-sizing: border-box;
  padding-top: 0;
  @media (max-width: 900px) {
    padding: 16px 8px;
    padding-top: 0;
  }
  @media (max-width: 600px) {
    padding: 8px 2px;
    padding-top: 0;
  }
`

const WantedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
`

const WantedTitle = styled.h1`
  font-size: 2.5rem;
  color: #333;
`

const WriteButton = styled.button`
  display: flex !important;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #007bff !important;
  color: white !important;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  position: relative;
  z-index: 10;
  min-width: 120px;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);

  &:hover {
    background: #0056b3 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  }
`

const SearchSection = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
`

const SearchForm = styled.form`
  display: flex;
  gap: 10px;
  align-items: center;
`

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 20px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: #007bff;
  }
`

/* 🔹 추가: 상단 검색박스 안에 얹는 고급 필터 바 (전공/학과/정렬) */
const FiltersRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr 160px 100px;
  gap: 10px;
  margin-top: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
`

const FilterSelect = styled.select`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 25px;
  background: #fff;
  font-size: 0.95rem;
  outline: none;

  &:focus {
    border-color: #007bff;
  }
`

const NoWanted = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`

const PageWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
`

const ClickableCard = styled.div`
  cursor: pointer;
  outline: none;
  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.4);
    border-radius: 12px;
  }
`

/* 🔹 전공 학과 옵션(필요한 만큼 추가/수정 가능) */
const DEPARTMENTS = [
  '컴퓨터공학과',
  '전자전기공학부',
  '신소재공학전공',
  '화학공학전공',
  '산업데이터공학과',
  '기계시스템디자인공학과',
  '건설환경공학과',
  '경영학부',
  '경제학전공',
  '수학교육과',
  '국어교육과',
  '영어교육과',
  '역사교육과',
  '건축학전공',
  '실내건축학전공',
  '도시공학과'
]

const Wanted = () => {
  const { t } = useTranslation()
  const [wantedPosts, setWantedPosts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔹 추가: 서버 필터 파라미터
  const [category, setCategory] = useState('') // '', '전공', '교양'
  const [department, setDepartment] = useState('') // 전공일 때만
  const [sort, setSort] = useState('latest') // latest|oldest|priceDesc|priceAsc

  const navigate = useNavigate()

  // 공통 페치 함수 (Page or Array 양쪽 모두 대응)
  const fetchWanted = async (overrides = {}) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      const keyword = (overrides.keyword ?? searchTerm).trim()
      const cat = overrides.category ?? category
      const dept = overrides.department ?? department
      const s = overrides.sort ?? sort

      if (keyword) qs.set('keyword', keyword)
      if (cat) qs.set('category', cat)
      if (dept && cat === '전공') qs.set('department', dept)
      if (s) qs.set('sort', s)
      qs.set('page', '0')
      qs.set('size', '12')

      const res = await fetch(`/api/wanted?${qs.toString()}`)
      const contentType = res.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')

      if (!res.ok) {
        const errTxt = isJson
          ? JSON.stringify(await res.json()).slice(0, 500)
          : (await res.text()).slice(0, 500)
        throw new Error(
          `${t('wanted.error.fetchFailed')} (${res.status}) ${errTxt}`
        )
      }

      const payload = isJson ? await res.json() : null

      let list = []
      if (payload?.data?.content) list = payload.data.content
      else if (payload?.content) list = payload.content
      else if (Array.isArray(payload)) list = payload

      setWantedPosts(Array.isArray(list) ? list : [])
    } catch {
      setWantedPosts([])
    } finally {
      setLoading(false)
    }
  }

  // 최초 로드
  useEffect(() => {
    void fetchWanted()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 검색 제출 → 서버 쿼리(keyword, category/department/sort)
  const handleSearch = async e => {
    e.preventDefault()
    void fetchWanted({}) // state값 사용
  }

  const handlePostClick = postId => {
    if (!postId) return
    void navigate(`/wanted/${postId}`)
  }

  const handleWriteClick = () => {
    void navigate('/wanted/write')
  }

  const handleSidebarMenu = menu => {
    switch (menu) {
      case 'bookstore/add':
        void navigate('/bookstore/add')
        break
      case 'wanted':
        void navigate('/wanted')
        break
      case 'mybookstore':
        void navigate('/bookstore')
        break
      case 'chat':
        void navigate('/chat')
        break
      default:
        break
    }
  }

  return (
    <PageWrapper>
      <SidebarMenu
        active="wanted"
        onMenuClick={handleSidebarMenu}
      />
      <MainContent>
        <WantedContainer>
          <WantedHeader>
            <WantedTitle>{t('wanted.title')}</WantedTitle>
            <WriteButton onClick={handleWriteClick}>
              <FaPlus /> {t('wanted.write')}
            </WriteButton>
          </WantedHeader>

          {/* 기존 검색 박스 유지 */}
          <SearchSection>
            <SearchForm onSubmit={handleSearch}>
              <SearchInput
                type="text"
                placeholder={t('wanted.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <SearchButton type="submit">
                <FaSearch />
              </SearchButton>
            </SearchForm>

            {/* 🔹 추가: 전공/학과/정렬 고급 필터 (레이아웃만 살짝 얹음) */}
            <FiltersRow>
              <FilterSelect
                value={category}
                onChange={e => {
                  const v = e.target.value
                  setCategory(v)
                  if (v !== '전공') setDepartment('')
                }}>
                <option value="">{t('wanted.category.all')}</option>
                <option value="전공">{t('wanted.category.major')}</option>
                <option value="교양">{t('wanted.category.general')}</option>
              </FilterSelect>

              {category === '전공' ? (
                <FilterSelect
                  value={department}
                  onChange={e => setDepartment(e.target.value)}>
                  <option value="">{t('wanted.department.all')}</option>
                  {DEPARTMENTS.map(d => (
                    <option
                      key={d}
                      value={d}>
                      {t(d)}
                    </option>
                  ))}
                </FilterSelect>
              ) : (
                <div />
              )}

              <FilterSelect
                value={sort}
                onChange={e => setSort(e.target.value)}>
                <option value="latest">{t('wanted.sort.latest')}</option>
                <option value="oldest">{t('wanted.sort.oldest')}</option>
                <option value="priceDesc">{t('wanted.sort.priceHigh')}</option>
                <option value="priceAsc">{t('wanted.sort.priceLow')}</option>
              </FilterSelect>

              <SearchButton
                type="button"
                onClick={() => fetchWanted({})}>
                {t('wanted.apply')}
              </SearchButton>
            </FiltersRow>
          </SearchSection>

          {/* 기존 태그 필터 섹션은 그대로 두고 keyword로만 매핑 */}
          {loading ? (
            <NoWanted>
              <Loading
                type="bookflip"
                size="lg"
                subtext={t('wanted.loading')}
              />
            </NoWanted>
          ) : wantedPosts.length > 0 ? (
            <Grid>
              {wantedPosts.map(post => {
                const priceNum = Number(post?.price ?? 0)
                const priceText = Number.isFinite(priceNum)
                  ? `${priceNum.toLocaleString()}${t('wanted.currency')}`
                  : '-'

                // 표시용: category + department 조합
                const cat = (post?.category || '').trim() // "전공" | "교양" | (과거 데이터 문자열)
                const catSimple = cat.split('>')[0]?.trim() || cat // 과거 데이터 대응

                // 카테고리 번역
                const translatedCat =
                  catSimple === '전공'
                    ? t('wanted.category.major')
                    : catSimple === '교양'
                      ? t('wanted.category.general')
                      : catSimple

                // 학과명 번역
                // 'department' 필드가 있으면 우선적으로 번역해서 사용
                let departmentName = post?.department
                  ? t(`departments.${post.department}`) || post.department
                  : null

                // 'department' 필드가 없고, 레거시 형식 ('>') 데이터인 경우, '>' 뒤의 값을 사용
                if (!departmentName && cat.includes('>')) {
                  departmentName = cat.split('>')[1]?.trim()
                }

                // 최종 표시 문자열 조합
                // 학과명이 있으면 "카테고리 / 학과명" 형식으로, 없으면 카테고리만 표시
                const displayCat = departmentName
                  ? `${translatedCat} / ${departmentName}`
                  : translatedCat || '-' // translatedCat이 없을 경우를 대비해 '-' 처리

                return (
                  <ClickableCard
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handlePostClick(post.id)}
                    onKeyDown={e =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      handlePostClick(post.id)
                    }>
                    <Card>
                      <CardTitle>
                        {post.title || '-'}
                        {post.hasToxicContent && (
                          <span
                            style={{
                              marginLeft: 6,
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: 6,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: '#fff3cd',
                              color: '#856404',
                              border: '1px solid #ffeeba'
                            }}>
                            {t('wanted.warning')}
                          </span>
                        )}
                      </CardTitle>

                      <CardMeta>
                        <MetaLabel>{t('wanted.author')}</MetaLabel>
                        <MetaValue>{post.author || '-'}</MetaValue>
                      </CardMeta>

                      <CardMeta>
                        <MetaLabel>{t('wanted.condition')}</MetaLabel>
                        <MetaValue>
                          {(() => {
                            // 영어 값들
                            if (post.condition === 'HIGH')
                              return t('wantedWrite.condition.high')
                            if (post.condition === 'MEDIUM')
                              return t('wantedWrite.condition.medium')
                            if (post.condition === 'LOW')
                              return t('wantedWrite.condition.low')

                            // 한국어 값들
                            if (post.condition === '상')
                              return t('wantedWrite.condition.high')
                            if (post.condition === '중')
                              return t('wantedWrite.condition.medium')
                            if (post.condition === '하')
                              return t('wantedWrite.condition.low')

                            return post.condition || '-'
                          })()}
                        </MetaValue>
                      </CardMeta>

                      <CardMeta>
                        <MetaLabel>{t('wanted.desiredPrice')}</MetaLabel>
                        <MetaValue>{priceText}</MetaValue>
                      </CardMeta>

                      <CardMeta>
                        <MetaLabel>{t('wanted.categoryLabel')}</MetaLabel>
                        <MetaValue>{displayCat}</MetaValue>
                      </CardMeta>
                    </Card>
                  </ClickableCard>
                )
              })}
            </Grid>
          ) : (
            <NoWanted>{t('wanted.noPosts')}</NoWanted>
          )}
        </WantedContainer>
      </MainContent>
    </PageWrapper>
  )
}

export default Wanted
