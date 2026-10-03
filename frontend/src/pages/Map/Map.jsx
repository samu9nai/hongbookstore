import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { FaPlus, FaSearch, FaMapMarkerAlt, FaChevronDown, FaSyncAlt, FaTrash, FaTimes, FaMinus, FaTrashAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import NaverMap from '../../components/NaverMap/Navermap';
import UserCategory from '../../components/UserCategory/UserCategory';
import PlaceDetailModal from '../../components/PlaceDetailModal/PlaceDetailModal';
import { useLocation } from '../../contexts/LocationContext';
import { Loading } from '../../components/ui';
import api from '../../lib/api';


// 공용 axios 인스턴스(`src/lib/api.js`)를 그대로 사용 
// 모든 요청은 '/api'를 자동 프록시 경유하므로 로컬과 배포 환경 모두 동일하게 동작
/* ==================== 백엔드 API ==================== */

const HONGIK_CENTER = { lat: 37.5513, lng: 126.9246 };

// 장소 검색
const searchPlacesFromBackend = async (query) => {
  if (!query.trim()) return [];
  try {
    const data = await api.get('/places/search', { params: { query } });
    const res = typeof data === 'string' ? JSON.parse(data) : data;
    if (res && Array.isArray(res.items)) {
      return res.items.map(item => ({
        id: item.address + item.title,
        name: item.title.replace(/<[^>]*>?/g, ''),
        address: item.roadAddress || item.address,
        lat: Number(item.mapy) * 0.0000001,
        lng: Number(item.mapx) * 0.0000001,
        category: item.category,
      }));
    }
    return [];
  } catch (e) {
    return [];
  }
};

// 저장된 장소 전체
const getPlacesFromBackend = async () => {
  try {
    const data = await api.get('/places');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    alert('저장된 장소를 불러오는 데 실패했습니다.');
    return [];
  }
};

// 장소 저장
const savePlaceToBackend = async (placeData) => {
  try {
    const data = await api.post('/places', placeData);
    return data;
  } catch (e) {
    alert('장소 저장에 실패했습니다.');
    return null;
  }
};

// 좌표 -> 주소 (미사용 보류)
const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const data = await api.get('/places/geocode', { params: { lat, lng } });
    return data;
  } catch (e) {
    return null;
  }
};

// 사용자 카테고리
const getUserCategories = async () => {
  const data = await api.get('/user-categories');
  return Array.isArray(data) ? data : [];
};

// 카테고리 생성 (서버는 JSON {name} 기대)
const createUserCategory = async (name) => {
  const data = await api.post('/user-categories', { name });
  return data;
};

const renameUserCategory = async (id, name) => {
  const data = await api.patch(`/user-categories/${id}`, { name });
  return data;
};

const deleteUserCategory = async (id) => {
  await api.delete(`/user-categories/${id}`);
};

const addPlaceIntoUserCategory = async (categoryId, placeId) => {
  try {
    await api.post(`/user-categories/${categoryId}/places/${placeId}`);
  } catch {
    await api.post(`/user-categories/${categoryId}/places`, { placeId });
  }
};

const removePlaceFromUserCategory = async (categoryId, placeId) => {
  try {
    await api.delete(`/user-categories/${categoryId}/places/${placeId}`);
  } catch {
    await api.delete(`/user-categories/${categoryId}/places`, { data: { placeId } });
  }
};

// 카테고리에 속한 장소 목록 불러오기 (여러 스펙 대응)
const getPlacesOfUserCategory = async (categoryId) => {
  const tryList = [
    () => api.get(`/user-categories/${categoryId}/places`),
    () => api.get(`/user-categories/${categoryId}`),             // { id, name, places: [...] } 가능성
    () => api.get(`/user-categories/${categoryId}/place-list`),
  ];
  let lastErr;
  for (const fn of tryList) {
    try {
      const data = await fn();
      // 응답 정규화
      const arr = Array.isArray(data) ? data
          : Array.isArray(data?.places) ? data.places
              : Array.isArray(data?.items) ? data.items
                  : [];

      // 요소 정규화: {id, name, address, lat, lng} 로 맞춤
      const norm = arr.map((raw) => {
        const p = raw?.place || raw; // { place: {...} } 형태 대응
        const id = p.id ?? p.placeId ?? p.place_id;
        const name = p.name ?? p.placeName ?? p.title ?? '';
        const address = p.address ?? p.roadAddress ?? p.addr ?? '';
        const lat = typeof p.lat === 'number' ? p.lat : (typeof p.latitude === 'number' ? p.latitude : null);
        const lng = typeof p.lng === 'number' ? p.lng : (typeof p.longitude === 'number' ? p.longitude : null);
        return { id, name, address, lat, lng };
      });
      return norm;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

/* ==================== 컴포넌트 ==================== */

const MapPage = () => {
  const { t } = useTranslation();
  const { userLocation } = useLocation();
  const mapRef = useRef(null);

  // 장소 유형 필터(고정 목록)
  const [selectedType, setSelectedType] = useState('all');
  const categories = useMemo(() => [
    { id: 'restaurant', name: t('map.restaurant'), icon: '🍽️', color: '#FF6B6B' },
    { id: 'cafe', name: t('map.cafe'), icon: '☕', color: '#4ECDC4' },
    { id: 'partner', name: t('map.partner'), icon: '🤝', color: '#FFB3BA' },
    { id: 'convenience', name: t('map.convenience'), icon: '🏪', color: '#FFD93D' },
    { id: 'other', name: t('map.other'), icon: '📍', color: '#9E9E9E' }
  ], [t]);

  // DB 장소
  const [places, setPlaces] = useState([]);

  // 사용자 카테고리 & 선택 상태
  const [userCategories, setUserCategories] = useState([]);
  const [selectedUserCategoryId, setSelectedUserCategoryId] = useState(null);
  const [selectedUserCategoryName, setSelectedUserCategoryName] = useState('');
  const [selectedCategoryPlaces, setSelectedCategoryPlaces] = useState([]);
  const [loadingSelectedCat, setLoadingSelectedCat] = useState(false);

  // 기타 UI 상태
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [newPlace, setNewPlace] = useState({
    name: '', category: 'restaurant', address: '', detailedAddress: '',
    description: '', photos: [], coordinates: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [loadingDB, setLoadingDB] = useState(false);
  const [loadingCats, setLoadingCats] = useState(false);

  // 초기 로드
  useEffect(() => {
    const loadPlaces = async () => {
      setLoadingDB(true);
      const savedPlaces = await getPlacesFromBackend();
      setPlaces(savedPlaces);
      setLoadingDB(false);
    };
    const loadUserCats = async () => {
      setLoadingCats(true);
      try {
        const cats = await getUserCategories();
        setUserCategories(cats || []);
      } catch (e) {
        setUserCategories([]);
      } finally {
        setLoadingCats(false);
      }
    };
    loadPlaces();
    loadUserCats();

    // 초기 지도 위치(상수역)
    const sangsuStation = { lat: 37.5484, lng: 126.9244 };
    const timer = setTimeout(() => {
      mapRef.current?.moveToLocation(sangsuStation.lat, sangsuStation.lng, 16);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 장소 재조회
  const refreshFromDB = async () => {
    setLoadingDB(true);
    const savedPlaces = await getPlacesFromBackend();
    setPlaces(savedPlaces);
    setLoadingDB(false);
    // 선택된 사용자 카테고리도 갱신
    if (selectedUserCategoryId) {
      await handleSelectUserCategory(selectedUserCategoryId, selectedUserCategoryName);
    }
  };

  // 검색 디바운스 (검색 시작 시 지도 중심을 홍대로 이동)
  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          // 지도 컴포넌트 ref가 있다면, 홍익대 중심으로 이동(줌은 프로젝트 컨벤션에 맞게)
          if (mapRef?.current?.moveToLocation) {
            mapRef.current.moveToLocation(HONGIK_CENTER.lat, HONGIK_CENTER.lng, 15);
          }
          setIsSearching(true);
          const results = await searchPlacesFromBackend(searchQuery);
          setSearchResults(results);     // 백엔드가 이미 홍대 근접 순으로 5개 정렬
          setShowSearchResults(true);
        } catch (e) {
          setSearchResults([]);
          setShowSearchResults(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);


  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTypeDropdown && !event.target.closest('.type-filter-dropdown')) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTypeDropdown]);

  const handleSearchResultClick = (place) => {
    setShowSearchResults(false);
    setSearchQuery('');
    mapRef.current?.moveToLocation(place.lat, place.lng, 16);
    setNewPlace({
      name: place.name,
      category: 'restaurant',
      address: place.address,
      detailedAddress: '',
      description: '',
      photos: [],
      coordinates: { lat: place.lat, lng: place.lng }
    });
    setShowAddPlace(true);
  };

  // 장소 저장
  const addPlace = async () => {
    if (!newPlace.name.trim() || !newPlace.address.trim()) {
      alert(t('map.enterPlaceNameAndAddress'));
      return;
    }
    const fullAddress = newPlace.detailedAddress.trim()
        ? `${newPlace.address} - ${newPlace.detailedAddress}`
        : newPlace.address;

    const coordinates = newPlace.coordinates;
    if (!coordinates) {
      alert('좌표가 없습니다. 검색을 통해 위치를 먼저 지정하세요.');
      return;
    }

    const placeData = {
      name: newPlace.name,
      category: newPlace.category,
      address: fullAddress,
      description: newPlace.description,
      lat: coordinates.lat,
      lng: coordinates.lng
    };

    const savedPlace = await savePlaceToBackend(placeData);
    if (!savedPlace) return;

    setPlaces(prev => [...prev, savedPlace]);
    setSelectedType('all');
    mapRef.current?.moveToLocation(savedPlace.lat, savedPlace.lng, 16);

    setNewPlace({
      name: '', category: 'restaurant', address: '', detailedAddress: '',
      description: '', photos: [], coordinates: null
    });
    setShowAddPlace(false);
  };

  const handleMapClick = useCallback((lat, lng) => {
  }, []);

  // 장소 유형 필터
  const typeFilteredPlaces = places.filter(place => {
    if (selectedType === 'all') return true;
    return place.category === selectedType;
  });

  // 사용자 카테고리 선택/해제
  const handleSelectUserCategory = async (categoryId, categoryName) => {
    setSelectedUserCategoryId(categoryId);
    setSelectedUserCategoryName(categoryName ?? (userCategories.find(c => c.id === categoryId)?.name || ''));
    setLoadingSelectedCat(true);
    try {
      const list = await getPlacesOfUserCategory(categoryId);
      setSelectedCategoryPlaces(list);
    } catch (e) {
      setSelectedCategoryPlaces([]);
      alert('카테고리에 담긴 장소를 불러오지 못했습니다.');
    } finally {
      setLoadingSelectedCat(false);
    }
  };

  const clearSelectedUserCategory = () => {
    setSelectedUserCategoryId(null);
    setSelectedUserCategoryName('');
    setSelectedCategoryPlaces([]);
  };

  // 최종 맵 표시 목록 = 장소유형 필터 + (선택된 사용자 카테고리 필터)
  const finalPlaceList = (() => {
    if (!selectedUserCategoryId) return typeFilteredPlaces;
    const idset = new Set(selectedCategoryPlaces.map(p => p.id));
    const filtered = typeFilteredPlaces.filter(p => idset.has(p.id));
    return filtered;
  })();

  // 사용자 카테고리 조작
  const handleAddUserCategory = async (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    try {
      const created = await createUserCategory(trimmed);
      setUserCategories(prev => [...prev, created]);
    } catch (e) {
      alert(t('map.categoryAddFailed'));
    }
  };

  const handleDeleteUserCategory = async (categoryId) => {
    try {
      await deleteUserCategory(categoryId);
      setUserCategories(prev => prev.filter(cat => cat.id !== categoryId));
      if (selectedUserCategoryId === categoryId) clearSelectedUserCategory();
    } catch (e) {
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  const handleUpdateUserCategory = async (categoryId, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) return;
    try {
      const updated = await renameUserCategory(categoryId, trimmed);
      setUserCategories(prev => prev.map(cat => cat.id === categoryId ? updated : cat));
      if (selectedUserCategoryId === categoryId) setSelectedUserCategoryName(updated.name);
    } catch (e) {
      alert('카테고리 이름 변경에 실패했습니다.');
    }
  };

  const handleAddPlaceToCategory = async (placeId, categoryId) => {
    try {
      await addPlaceIntoUserCategory(categoryId, placeId);
      if (selectedUserCategoryId === categoryId) {
        // 선택된 카테고리일 경우 즉시 반영
        await handleSelectUserCategory(categoryId, selectedUserCategoryName);
      }
    } catch (e) {
      alert('카테고리에 장소를 담는 데 실패했습니다.');
    }
  };

  const handleRemovePlaceFromSelectedCategory = async (placeId) => {
    if (!selectedUserCategoryId) return;
    try {
      await removePlaceFromUserCategory(selectedUserCategoryId, placeId);
      setSelectedCategoryPlaces(prev => prev.filter(p => p.id !== placeId));
    } catch (e) {
      alert('카테고리에서 장소 제거에 실패했습니다.');
    }
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setShowPlaceDetail(true);
  };

  // 사이드바 보조 드롭다운(백업 UI): onSelectCategory 콜백이 없을 경우 대비
  const handleBackupSelectChange = async (e) => {
    const value = e.target.value;
    if (value === '') {
      clearSelectedUserCategory();
    } else {
      const id = Number(value);
      const name = userCategories.find(c => c.id === id)?.name || '';
      await handleSelectUserCategory(id, name);
    }
  };

  return (
      <MapPageContainer>
        <Sidebar>
          <SidebarHeader>
            <h2>{t('map.title')}</h2>
            <HeaderButtons>
              <AddButton onClick={refreshFromDB} title="DB에서 새로고침">
                <FaSyncAlt /> {loadingDB ? t('map.loading') : t('map.refresh')}
              </AddButton>
            </HeaderButtons>

            {!loadingCats && userCategories.length === 0 && (
                <HintBanner>
                  {t('map.noCategoriesMessage')}
                </HintBanner>
            )}
          </SidebarHeader>

          {/* 사용자 카테고리 리스트 (기존 컴포넌트).
            아이템 클릭 시 props.onSelectCategory?.(category) 만 호출해주면 즉시 연동됩니다. */}
          <UserCategory
              categories={userCategories}
              onAddCategory={handleAddUserCategory}
              onDeleteCategory={handleDeleteUserCategory}
              onUpdateCategory={handleUpdateUserCategory}
              loading={loadingCats}
              onSelectCategory={(cat) => handleSelectUserCategory(cat.id, cat.name)}
          />

          {/* 백업 UI: 드롭다운으로도 선택 가능 (onSelectCategory가 없을 때 사용) */}
          {userCategories.length > 0 && (
              <BackupSelectWrap>
                <label>{t('map.selectedCategoryFilter')}</label>
                <select value={selectedUserCategoryId ?? ''} onChange={handleBackupSelectChange}>
                  <option value="">-- {t('map.allDeselect')} --</option>
                  {userCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </BackupSelectWrap>
          )}

          {/* 선택한 카테고리의 장소 목록 표시 */}
          {selectedUserCategoryId && (
              <SelectedCategoryPanel>
                <SelectedCatHeader>
                  <span>{t('map.selectedCategory')}: <b>{selectedUserCategoryName}</b></span>
                  <SelectedCatButtons>
                    <SmallBtn onClick={() => handleSelectUserCategory(selectedUserCategoryId, selectedUserCategoryName)}>
                      {t('map.refresh')}
                    </SmallBtn>
                    <SmallBtn onClick={clearSelectedUserCategory}>{t('map.deselect')}</SmallBtn>
                  </SelectedCatButtons>
                </SelectedCatHeader>

                {loadingSelectedCat ? (
                    <EmptyText>
                      <Loading type="hongbook" size="sm" subtext="장소를 불러오고 있어요" />
                    </EmptyText>
                ) : selectedCategoryPlaces.length === 0 ? (
                    <EmptyText>{t('map.noPlacesInCategory')}</EmptyText>
                ) : (
                    <PlaceList>
                      {selectedCategoryPlaces.map(p => {
                        // DB에서 전체 places와 매칭 (좌표 보정)
                        const full = places.find(pp => String(pp.id) === String(p.id)) || p;
                        return (
                            <PlaceItem key={p.id}>
                              <PlaceMain onClick={() => {
                                if (full?.lat && full?.lng) {
                                  mapRef.current?.moveToLocation(full.lat, full.lng, 16);
                                }
                                const openObj = full?.id ? full : null;
                                if (openObj) handlePlaceClick(full);
                              }}>
                                <FaMapMarkerAlt />
                                <div>
                                  <div className="name">{full?.name || p.name}</div>
                                  <div className="addr">{full?.address || p.address}</div>
                                </div>
                              </PlaceMain>
                              <RemoveBtn title="카테고리에서 제거" onClick={() => handleRemovePlaceFromSelectedCategory(p.id)}>
                                <FaTrashAlt />
                                삭제
                              </RemoveBtn>
                            </PlaceItem>
                        );
                      })}
                    </PlaceList>
                )}
              </SelectedCategoryPanel>
          )}
        </Sidebar>

        <StyledMapContainer>
          <MapSearchContainer>
            <MapSearchInput
                placeholder={t('map.searchPlace')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <MapSearchIcon><FaSearch /></MapSearchIcon>
          </MapSearchContainer>

          <TypeFilterDropdown className="type-filter-dropdown">
            <TypeFilterButton onClick={() => setShowTypeDropdown(!showTypeDropdown)}>
              <span>{selectedType === 'all' ? t('map.all') : (categories.find(cat => cat.id === selectedType)?.name || t('map.all'))}</span>
              <FaChevronDown />
            </TypeFilterButton>
            {showTypeDropdown && (
                <TypeDropdownMenu>
                  <TypeDropdownItem
                      $isSelected={selectedType === 'all'}
                      onClick={() => { setSelectedType('all'); setShowTypeDropdown(false); }}
                  >
                    {t('map.all')}
                  </TypeDropdownItem>
                  {categories.map(category => (
                      <TypeDropdownItem
                          key={category.id}
                          $isSelected={selectedType === category.id}
                          onClick={() => { setSelectedType(category.id); setShowTypeDropdown(false); }}
                      >
                        {category.name}
                      </TypeDropdownItem>
                  ))}
                </TypeDropdownMenu>
            )}
          </TypeFilterDropdown>

          <SearchResultsContainer $show={showSearchResults}>
            <SearchResultsHeader>
              <SearchResultsTitle>
                {isSearching ? '검색 중...' : `검색 결과 (${searchResults.length})`}
              </SearchResultsTitle>
              <CloseSearchButton onClick={() => setShowSearchResults(false)}><FaTimes /></CloseSearchButton>
            </SearchResultsHeader>
            <SearchResultsList>
              {isSearching ? (
                  <SearchLoadingItem>
                    <SearchLoadingText>검색 중...</SearchLoadingText>
                  </SearchLoadingItem>
              ) : searchResults.length > 0 ? (
                  searchResults.map(place => (
                      <SearchResultItem key={place.id} onClick={() => handleSearchResultClick(place)}>
                        <SearchResultHeader>
                          <SearchResultName>{place.name}</SearchResultName>
                          <SearchResultCategory>{(place.category || '').split('>').pop() || t('map.noInfo')}</SearchResultCategory>
                        </SearchResultHeader>
                        <SearchResultAddress><FaMapMarkerAlt /> {place.address}</SearchResultAddress>
                      </SearchResultItem>
                  ))
              ) : (searchQuery.trim() ? (
                  <SearchEmptyItem>
                    <SearchEmptyText>검색 결과가 없습니다.</SearchEmptyText>
                    <SearchEmptySubText>다른 키워드로 검색해보세요.</SearchEmptySubText>
                  </SearchEmptyItem>
              ) : null)}
            </SearchResultsList>
          </SearchResultsContainer>

          <NaverMap
              ref={mapRef}
              places={finalPlaceList}
              categories={categories}
              onMapClick={handleMapClick}
              userLocation={userLocation}
              onPlaceClick={handlePlaceClick}
          />
        </StyledMapContainer>

        {showAddPlace && (
            <Modal>
              <ModalContent>
                <ModalHeader>
                  <h3>{t('map.addNewPlace')}</h3>
                  <CloseButton onClick={() => setShowAddPlace(false)}><FaTimes /></CloseButton>
                </ModalHeader>
                <ModalBody>
                  <Input
                      placeholder={t('map.placeName')}
                      value={newPlace.name}
                      onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                  />

                  <CategorySection>
                    <CategoryLabel>장소 유형 선택 *</CategoryLabel>
                    <CategoryGrid>
                      {categories.map(category => (
                          <CategoryButton
                              key={category.id}
                              $isSelected={newPlace.category === category.id}
                              onClick={() => setNewPlace({ ...newPlace, category: category.id })}
                          >
                            <CategoryIcon>{category.icon}</CategoryIcon>
                            <CategoryName>{category.name}</CategoryName>
                          </CategoryButton>
                      ))}
                    </CategoryGrid>
                  </CategorySection>

                  <Input
                      placeholder={t('map.roadAddress')}
                      value={newPlace.address}
                      onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                  />
                  <Input
                      placeholder={t('map.detailedAddress')}
                      value={newPlace.detailedAddress}
                      onChange={(e) => setNewPlace({ ...newPlace, detailedAddress: e.target.value })}
                  />
                  <TextArea
                      placeholder={t('map.enterPlaceDescription')}
                      value={newPlace.description}
                      onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })}
                  />
                  <Button onClick={addPlace} disabled={isGeocoding}>
                    {isGeocoding ? t('map.convertingAddress') : t('map.addPlace')}
                  </Button>
                </ModalBody>
              </ModalContent>
            </Modal>
        )}

        {showPlaceDetail && selectedPlace && (
            <PlaceDetailModal
                place={selectedPlace}
                isOpen={showPlaceDetail}
                onClose={() => setShowPlaceDetail(false)}
                userCategories={userCategories}
                onAddToCategory={handleAddPlaceToCategory}
                userLocation={userLocation}
            />
        )}
      </MapPageContainer>
  );
};

export default MapPage;

/* ==================== styled-components ==================== */

const MapPageContainer = styled.div`
  display: flex;
  width: 100%;
  height: calc(100vh - 60px);
`;

const Sidebar = styled.div`
  width: 360px;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  border-right: 1px solid #eee;
  background-color: white;
  box-sizing: border-box;
`;

const StyledMapContainer = styled.div`
  flex: 1;
  position: relative;
  height: 100%;
`;

const MapSearchContainer = styled.div`
  position: absolute;
  top: 80px;
  left: 20px;
  width: 320px;
  max-width: calc(40vw - 40px);
  min-width: 280px;
  z-index: 100;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 25px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.12);
  border: 1px solid rgba(0, 0, 0, 0.05);

  @media (max-width: 1200px) { max-width: calc(35vw - 40px); }
  @media (max-width: 900px) { max-width: calc(30vw - 40px); }
  @media (max-width: 768px) {
    width: calc(100vw - 40px);
    max-width: calc(100vw - 40px);
    left: 20px; right: 20px;
  }
`;

const SidebarHeader = styled.div`
  margin-bottom: 16px;

  h2 {
    margin: 0 0 15px 0;
    font-size: 24px;
    font-weight: 700;
    color: #333;
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;
  &:hover { background: #0056b3; }
`;

const HintBanner = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  background: #fff4e5;
  border: 1px solid #ffe0b2;
  border-radius: 8px;
  color: #8a6d3b;
`;

const BackupSelectWrap = styled.div`
  margin-top: 12px;
  display: grid;
  gap: 6px;
  label { font-size: 13px; color: #444; }
  select {
    padding: 8px 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    outline: none;
  }
`;

const SelectedCategoryPanel = styled.div`
  margin-top: 14px;
  border: 1px solid #eee;
  border-radius: 10px;
  background: #fafafa;
`;

const SelectedCatHeader = styled.div`
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  display: flex; align-items: center; justify-content: space-between;
  b { color: #222; }
`;

const SelectedCatButtons = styled.div`
  display: flex; gap: 8px;
`;

const SmallBtn = styled.button`
  padding: 6px 10px;
  font-size: 12px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: #f1f3f5; }
`;

const PlaceList = styled.div`
  max-height: 240px;
  overflow: auto;
`;

const PlaceItem = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px;
  border-top: 1px solid #f0f0f0;
  &:first-child { border-top: none; }
`;

const PlaceMain = styled.div`
  display: flex; gap: 10px; align-items: flex-start;
  cursor: pointer;
  svg { margin-top: 3px; min-width: 16px; }
  .name { font-weight: 600; font-size: 14px; color: #222; }
  .addr { font-size: 12px; color: #666; margin-top: 2px; }
  &:hover .name { text-decoration: underline; }
`;

const RemoveBtn = styled.button`
  display: inline-flex; 
  align-items: center; 
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #dc3545; 
  background: #dc3545; 
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  
  svg {
    width: 12px;
    height: 12px;
  }
  
  &:hover { 
    background: #c82333; 
    border-color: #c82333;
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const MapSearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
`;

const MapSearchIcon = styled.div`
  padding: 0 16px;
  color: #666;
  font-size: 16px;
`;

const TypeFilterDropdown = styled.div`
  position: absolute;
  top: 80px;
  right: 20px;
  z-index: 1000;
  @media (max-width: 768px) { top: 160px; right: 20px; }
`;

const TypeFilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  color: #333;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  &:hover {
    background: #f8f9fa;
    border-color: rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  svg { transition: transform 0.3s ease; }
  &:hover svg { transform: rotate(180deg); }
`;

const TypeDropdownMenu = styled.div`
  position: absolute;
  top: 100%; right: 0;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  z-index: 1001;
  margin-top: 4px;
`;

const TypeDropdownItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
  background: ${props => props.$isSelected ? '#007bff' : 'transparent'};
  color: ${props => props.$isSelected ? 'white' : '#333'};
  &:first-child { border-radius: 8px 8px 0 0; }
  &:last-child { border-radius: 0 0 8px 8px; }
  &:hover { background: ${props => props.$isSelected ? '#007bff' : '#f8f9fa'}; }
`;

const SearchResultsContainer = styled.div`
  position: absolute;
  top: 140px;
  left: 20px;
  width: 320px;
  max-width: calc(40vw - 40px);
  min-width: 280px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  z-index: 100;
  display: ${props => props.$show ? 'block' : 'none'};
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 6px 24px rgba(0,0,0,0.12);
  @media (max-width: 1200px) { max-width: calc(35vw - 40px); }
  @media (max-width: 900px) { max-width: calc(30vw - 40px); }
  @media (max-width: 768px) {
    top: 220px;
    width: calc(100vw - 40px);
    max-width: calc(100vw - 40px);
    left: 20px; right: 20px;
  }
`;

const SearchResultsHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
`;

const SearchResultsTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const CloseSearchButton = styled.button`
  background: none; border: none;
  font-size: 18px; color: #666;
  cursor: pointer; padding: 4px;
  &:hover { color: #333; }
`;

const SearchResultsList = styled.div``;

const SearchResultItem = styled.div`
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  &:hover { background: #f8f9fa; }
  &:last-child { border-bottom: none; }
`;

const SearchResultHeader = styled.div`
  display: flex; justify-content: space-between;
  align-items: flex-start; margin-bottom: 8px;
`;

const SearchResultName = styled.h4`
  margin: 0; font-size: 16px; font-weight: 600; color: #333;
`;

const SearchResultCategory = styled.span`
  font-size: 12px; color: #666; background: #e9ecef;
  padding: 2px 8px; border-radius: 12px;
`;

const SearchResultAddress = styled.p`
  margin: 5px 0 0; color: #666; font-size: 14px;
  display: flex; align-items: center; gap: 6px;
`;

const SearchLoadingItem = styled.div`
  padding: 20px; text-align: center; color: #666;
`;

const SearchLoadingText = styled.div`
  font-size: 14px; color: #666;
`;

const SearchEmptyItem = styled.div`
  padding: 30px 20px; text-align: center; color: #666;
`;

const SearchEmptyText = styled.div`
  font-size: 16px; font-weight: 500; color: #333; margin-bottom: 8px;
`;

const SearchEmptySubText = styled.div`
  font-size: 14px; color: #999;
`;

const Modal = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white; padding: 24px; border-radius: 12px;
  width: 450px; max-width: 90%;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
`;

const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 24px;
  h3 { margin: 0; font-size: 20px; font-weight: 600; color: #333; }
`;

const CloseButton = styled.button`
  background: none; border: none; font-size: 20px; color: #666;
  cursor: pointer; padding: 4px;
  &:hover { color: #333; }
`;

const ModalBody = styled.div`
  display: flex; flex-direction: column; gap: 16px;
`;

const Input = styled.input`
  width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px;
  box-sizing: border-box; font-size: 14px;
  &:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(0,123,255,0.1); }
`;

const TextArea = styled.textarea`
  width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px;
  min-height: 100px; font-size: 14px; resize: vertical;
  &:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(0,123,255,0.1); }
`;

const Button = styled.button`
  width: 100%; padding: 12px 16px; background: #007bff;
  color: white; border: none; border-radius: 8px; cursor: pointer;
  font-size: 16px; font-weight: 500; transition: background-color 0.2s ease;
  &:hover { background: #0056b3; }
`;

const EmptyText = styled.div`
  padding: 16px 12px;
  color: #666;
  font-size: 13px;
`;

const CategorySection = styled.div` margin-bottom: 16px; `;
const CategoryLabel = styled.label`
  display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #333;
`;
const CategoryGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;
`;
const CategoryButton = styled.button`
  display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 16px;
  background: ${props => props.$isSelected ? '#007bff' : '#f0f0f0'};
  color: ${props => props.$isSelected ? 'white' : '#333'};
  border: 1px solid ${props => props.$isSelected ? '#007bff' : '#ddd'};
  border-radius: 10px; cursor: pointer; font-size: 14px;
  font-weight: ${props => props.$isSelected ? '600' : '400'};
  transition: all 0.2s ease;
  box-shadow: ${props => props.$isSelected ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'};
  text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  &:hover { background: #007bff; color: white; border-color: #007bff; }
`;
const CategoryIcon = styled.span` font-size: 24px; `;
const CategoryName = styled.span` font-size: 12px; `;
