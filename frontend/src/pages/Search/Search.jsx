import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaSearch, FaFilter, FaBook, FaUser, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Grid, Card, CardTitle, CardMeta, MetaLabel, MetaValue } from '../../components/ui';

const SearchContainer = styled.div`
  max-width: 1600px;
  width: 100vw;
  margin: 0 auto;
  padding: 32px;
  box-sizing: border-box;
  padding-top: 24px;
  @media (max-width: 900px) {
    padding: 16px 8px;
    padding-top: 16px;
  }
  @media (max-width: 600px) {
    padding: 8px 2px;
    padding-top: 12px;
  }
`;

const SearchHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const SearchTitle = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
`;

const SearchSubtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 15px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: #007bff;
  }
`;

const SearchButton = styled.button`
  padding: 15px 25px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
  &:hover {
    background: #0056b3;
  }
`;

const FilterSection = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
`;

const FilterTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: #333;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  color: #555;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterSelect = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: white;
`;

const FilterInput = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
`;

const ResultsSection = styled.div`
  margin-top: 30px;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ResultsCount = styled.p`
  color: #666;
  font-size: 1.1rem;
`;

const SortSelect = styled.select`
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: white;
`;

const BookImageImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const BookPrice = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 10px;
`;

const BookStatus = styled.span`
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 600;
  
  ${props => {
    switch(props.$status) {
      case 'FOR_SALE': return 'background: #d4edda; color: #155724;';
      case 'RESERVED': return 'background: #fff3cd; color: #856404;';
      case 'SOLD_OUT': return 'background: #f8d7da; color: #721c24;';
      default: return 'background: #e2e3e5; color: #383d41;';
    }
  }}
`;

const NoResults = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
  gap: 0.5rem;
`;
const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: ${props => props.$active ? '#007bff' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: ${props => props.$active ? '600' : '400'};
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

// 백엔드 Enum을 프론트엔드 텍스트로 변환하는 헬퍼
const statusMap = {
  'FOR_SALE': '판매중',
  'RESERVED': '예약중',
  'SOLD_OUT': '판매완료'
};

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    // TODO: 필터 기능은 백엔드 API에 해당 파라미터가 추가된 후 구현
    sortBy: 'createdAt,desc' // 기본 정렬: 최신순
  });


  const navigate = useNavigate();

  // API 데이터를 저장할 상태
  const [posts, setPosts] = useState([]);
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 1, number: 0 }); // 페이지네이션 정보
  const [loading, setLoading] = useState(false);
  
  // 검색 및 필터 조건을 하나의 상태 객체로 관리
  const [searchParams, setSearchParams] = useState({
    query: '',
    sort: 'createdAt,desc',
    page: 0,
  });
  const [searchInput, setSearchInput] = useState(''); // 사용자가 입력하는 검색어

  // API 호출 로직
  const fetchPosts = useCallback(async (params) => {
    setLoading(true);
    try {
      const activeParams = {
        page: params.page,
        size: 20,
        sort: params.sort,
      };
      if (params.query) activeParams.query = params.query;
      
      const response = await axios.get('/api/posts', { params: activeParams });
      setPosts(response.data.content);
      setPageInfo({
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
        currentPage: response.data.number,
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  // 검색 조건(searchParams)이 바뀔 때마다 API를 다시 호출
  useEffect(() => {
    fetchPosts(searchParams);
  }, [fetchPosts, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, query: searchInput, page: 0 }));
  };
  
  const handleSortChange = (e) => {
    setSearchParams(prev => ({ ...prev, sort: e.target.value, page: 0 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pageInfo.totalPages) {
      setSearchParams(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleBookClick = (postId) => {
    navigate(`/posts/${postId}`);
  };

  // 페이지네이션 버튼들을 동적으로 생성하는 함수
  const renderPaginationButtons = () => {
    if (!pageInfo || pageInfo.totalPages <= 1) return null;

    const buttons = [];
    const startPage = Math.floor(pageInfo.currentPage / 5) * 5;
    const endPage = Math.min(startPage + 5, pageInfo.totalPages);

    for (let i = startPage; i < endPage; i++) {
      buttons.push(
        <PageButton
          key={i}
          $active={pageInfo.currentPage === i}
          onClick={() => handlePageChange(i)}
        >
          {i + 1}
        </PageButton>
      );
    }
    return buttons;
  };

  return (
    <>
      <div className="header-spacer" />
      <SearchContainer>
        <SearchHeader>
          <SearchTitle>책 검색</SearchTitle>
          <SearchSubtitle>원하는 책을 찾아보세요</SearchSubtitle>
        </SearchHeader>

        <SearchForm onSubmit={handleSearch}>
          <SearchInput
            type="text"
            placeholder="책 제목, 저자, 글 제목으로 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <SearchButton type="submit">
            <FaSearch />
          </SearchButton>
        </SearchForm>

        <ResultsSection>
          <ResultsHeader>
            <ResultsCount>총 {pageInfo.totalElements}개의 게시글</ResultsCount>
            <SortSelect value={searchParams.sort} onChange={handleSortChange}>
              <option value="createdAt,desc">최신순</option>
              <option value="price,asc">낮은 가격순</option>
              <option value="price,desc">높은 가격순</option>
              {/* TODO: 조회수순 정렬은 백엔드에 기능 추가 후 활성화 */}
            </SortSelect>
          </ResultsHeader>

          {loading ? (
            <NoResults>검색 중...</NoResults>
          ) : posts.length > 0 ? (
            <Grid>
              {posts.map(post => (
                <Card key={post.postId} onClick={() => handleBookClick(post.postId)}>
                  <Card.Image>
                    {post.thumbnailUrl ? (
                      <BookImageImg src={post.thumbnailUrl} alt={post.postTitle} />
                    ) : (
                      <FaBook size={40} />
                    )}
                  </Card.Image>
                  <CardTitle>{post.postTitle}</CardTitle>
                  <CardMeta>
                    <MetaLabel>
                    <FaUser size={12} />
                    {post.author}
                    </MetaLabel>
                    <MetaValue>
                      <FaUser size={12} />
                      판매자: {post.sellerNickname}
                    </MetaValue>
                  </CardMeta>
                  <BookPrice>{post.price.toLocaleString()}원</BookPrice>
                  <BookStatus $status={post.status}>
                    {statusMap[post.status]}
                  </BookStatus>
                </Card>
              ))}
            </Grid>
          ) : (
            <NoResults>
              <FaBook size={60} style={{marginBottom: '20px', opacity: 0.5}} />
              <h3>검색 결과가 없습니다</h3>
              <p>다른 검색어를 시도해보세요</p>
            </NoResults>
          )}
        </ResultsSection>
        
        <PaginationContainer>
          <PageButton onClick={() => handlePageChange(pageInfo.currentPage - 1)} disabled={pageInfo.currentPage <= 0}>이전</PageButton>
          {renderPaginationButtons()}
          <PageButton onClick={() => handlePageChange(pageInfo.currentPage + 1)} disabled={pageInfo.currentPage >= pageInfo.totalPages - 1}>다음</PageButton>
        </PaginationContainer>
      </SearchContainer>
    </>
  );
};

export default Search;