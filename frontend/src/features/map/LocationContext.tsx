import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode
} from 'react'
import api from '@/shared/api/client'
import { AuthCtx } from '@/shared/contexts/AuthContext'

/**
 * 저장한 위치. 서버 응답은 MyLocationDto.Response와 같다.
 * 로그인하지 않았을 때는 localStorage에만 저장하므로 좌표가 없을 수 있다
 */
export interface SavedLocation {
  id: number
  name: string
  address: string
  lat?: number | null
  lng?: number | null
  isDefault: boolean
}

/** 지도가 중심으로 쓰는 현재 위치 */
export interface UserLocation {
  lat?: number | null
  lng?: number | null
  name: string
  address: string
}

/** 위치를 추가할 때 받는 값 */
export type NewLocation = Omit<SavedLocation, 'id' | 'isDefault'>

/** 서버는 배열을 보낸다. { data }는 예전 코드가 대비하던 모양이다 */
type LocationsResponse = SavedLocation[] | { data?: SavedLocation[] }

export interface LocationContextValue {
  userLocation: UserLocation | null
  /** 기본 위치가 먼저, 나머지는 이름순이다 */
  locations: SavedLocation[]
  setDefaultLocation: (locationId: number) => Promise<void>
  addLocation: (location: NewLocation) => Promise<void>
  deleteLocation: (locationId: number) => Promise<void>
  updateCurrentLocation: (
    lat: number | null | undefined,
    lng: number | null | undefined,
    name: string,
    address: string
  ) => void
  getDefaultLocation: () => SavedLocation | undefined
  updateLocation: (id: number, partial: Partial<NewLocation>) => Promise<void>
}

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined
)

// oxlint-disable-next-line react/only-export-components -- 컨텍스트 훅을 Provider와 같은 파일에 둔다
export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}

export const LocationProvider = ({ children }: { children?: ReactNode }) => {
  const { user, token } = useContext(AuthCtx)
  const userKey = user?.id ? String(user.id) : 'guest'
  const LS_LOCATIONS_KEY = `userLocations:${userKey}`
  const LS_LOCATION_KEY = `userLocation:${userKey}`

  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => {
    // localStorage에서 저장된 위치 정보 불러오기
    try {
      const saved = localStorage.getItem(LS_LOCATION_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [locations, setLocations] = useState<SavedLocation[]>(() => {
    // localStorage에서 저장된 위치 목록 불러오기
    try {
      const saved = localStorage.getItem(LS_LOCATIONS_KEY)
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 1,
              name: '홍익대학교 정문',
              address: '서울특별시 마포구 와우산로 94',
              lat: 37.5519,
              lng: 126.9259,
              isDefault: true
            }
          ]
    } catch {
      return [
        {
          id: 1,
          name: '홍익대학교 정문',
          address: '서울특별시 마포구 와우산로 94',
          lat: 37.5519,
          lng: 126.9259,
          isDefault: true
        }
      ]
    }
  })

  // 위치 정보가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem(LS_LOCATION_KEY, JSON.stringify(userLocation))
    }
  }, [userLocation, LS_LOCATION_KEY])

  useEffect(() => {
    localStorage.setItem(LS_LOCATIONS_KEY, JSON.stringify(locations))
  }, [locations, LS_LOCATIONS_KEY])

  // 서버 동기화: 로그인 상태면 서버에서 목록을 불러와 반영
  useEffect(() => {
    const currentToken = token || localStorage.getItem('accessToken')
    if (!currentToken || !user?.id) return // 비로그인 시 로컬 유지
    void (async () => {
      try {
        const res = await api.get<LocationsResponse>('/my/locations')
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : []
        if (Array.isArray(list) && list.length > 0) {
          setLocations(list)
          const def = list.find(l => l.isDefault) || list[0]
          setUserLocation(
            def
              ? {
                  lat: def.lat,
                  lng: def.lng,
                  name: def.name,
                  address: def.address
                }
              : null
          )
        }
      } catch {}
    })()
  }, [user?.id, token])

  // 사용자 변경 시, 사용자별 저장소에서 최신 로컬값 로드
  useEffect(() => {
    try {
      const savedLocs = localStorage.getItem(LS_LOCATIONS_KEY)
      // oxlint-disable-next-line react/set-state-in-effect -- 사용자가 바뀌면 그 사용자의 저장값으로 바꾼다
      if (savedLocs) setLocations(JSON.parse(savedLocs))
      const savedLoc = localStorage.getItem(LS_LOCATION_KEY)
      if (savedLoc) setUserLocation(JSON.parse(savedLoc))
    } catch {}
  }, [LS_LOCATIONS_KEY, LS_LOCATION_KEY])

  // 기본 위치 설정
  const setDefaultLocation = async (locationId: number) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        await api.patch(`/my/locations/${locationId}/default`)
        const server = await api.get<LocationsResponse>('/my/locations')
        const list = Array.isArray(server) ? server : server?.data
        setLocations(list || [])
        const def = (list || []).find(l => l.isDefault) || (list || [])[0]
        if (def)
          setUserLocation({
            lat: def.lat,
            lng: def.lng,
            name: def.name,
            address: def.address
          })
        return
      } catch {}
    }
    // 로컬 폴백
    setLocations(prev =>
      prev.map(loc => ({ ...loc, isDefault: loc.id === locationId }))
    )
    const defaultLoc = locations.find(loc => loc.id === locationId)
    if (defaultLoc)
      setUserLocation({
        lat: defaultLoc.lat,
        lng: defaultLoc.lng,
        name: defaultLoc.name,
        address: defaultLoc.address
      })
  }

  // 위치 추가
  const addLocation = async (location: NewLocation) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        const payload = {
          name: location.name,
          address: location.address,
          lat: location.lat ?? null,
          lng: location.lng ?? null,
          makeDefault: locations.length === 0
        }
        await api.post('/my/locations', payload)
        const server = await api.get<LocationsResponse>('/my/locations')
        const list = Array.isArray(server) ? server : server?.data
        setLocations(list || [])
        const def = (list || []).find(l => l.isDefault) || (list || [])[0]
        if (def)
          setUserLocation({
            lat: def.lat,
            lng: def.lng,
            name: def.name,
            address: def.address
          })
        return
      } catch {}
    }
    // 로컬 폴백
    const newLocation = {
      ...location,
      id: Date.now(),
      isDefault: locations.length === 0
    }
    setLocations(prev => [...prev, newLocation])
    if (locations.length === 0)
      setUserLocation({
        lat: newLocation.lat,
        lng: newLocation.lng,
        name: newLocation.name,
        address: newLocation.address
      })
  }

  // 위치 삭제
  const deleteLocation = async (locationId: number) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        await api.delete(`/my/locations/${locationId}`)
        const server = await api.get<LocationsResponse>('/my/locations')
        const list = Array.isArray(server) ? server : server?.data
        setLocations(list || [])
        const def = (list || []).find(l => l.isDefault) || (list || [])[0]
        if (def)
          setUserLocation({
            lat: def.lat,
            lng: def.lng,
            name: def.name,
            address: def.address
          })
        else setUserLocation(null)
        return
      } catch {}
    }
    // 로컬 폴백
    const locationToDelete = locations.find(loc => loc.id === locationId)
    setLocations(prev => prev.filter(loc => loc.id !== locationId))
    if (
      locationToDelete &&
      userLocation &&
      locationToDelete.lat === userLocation.lat &&
      locationToDelete.lng === userLocation.lng
    ) {
      const defaultLoc = locations.find(
        loc => loc.id !== locationId && loc.isDefault
      )
      if (defaultLoc)
        setUserLocation({
          lat: defaultLoc.lat,
          lng: defaultLoc.lng,
          name: defaultLoc.name,
          address: defaultLoc.address
        })
    }
  }

  // 현재 위치 업데이트
  const updateCurrentLocation: LocationContextValue['updateCurrentLocation'] = (
    lat,
    lng,
    name,
    address
  ) => {
    setUserLocation({ lat, lng, name, address })
  }

  // 기본 위치 가져오기
  const getDefaultLocation = () => {
    return locations.find(loc => loc.isDefault) || locations[0]
  }

  const value: LocationContextValue = {
    userLocation,
    locations: [...locations].sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        String(a.name || '').localeCompare(String(b.name || ''))
    ),
    setDefaultLocation,
    addLocation,
    deleteLocation,
    updateCurrentLocation,
    getDefaultLocation,
    updateLocation: async (id, partial) => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          await api.patch(`/my/locations/${id}`, partial)
          const server = await api.get<LocationsResponse>('/my/locations')
          const list = Array.isArray(server) ? server : server?.data
          setLocations(list || [])
          const def = (list || []).find(l => l.isDefault) || (list || [])[0]
          if (def)
            setUserLocation({
              lat: def.lat,
              lng: def.lng,
              name: def.name,
              address: def.address
            })
          return
        } catch {}
      }
      // 로컬 폴백 업데이트
      setLocations(prev =>
        prev.map(l => (l.id === id ? { ...l, ...partial } : l))
      )
    }
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}
