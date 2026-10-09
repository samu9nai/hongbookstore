import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  memo
} from 'react'
import type { UserLocation } from '../../contexts/LocationContext'

// 스크립트가 중복 로드되는 것을 방지하기 위한 전역 플래그
let isNaverMapScriptLoaded = false

/**
 * 지도에 표시하는 장소. 저장한 장소는 백엔드 PlaceDto.Response와 같고,
 * 검색 결과는 id가 문자열이다
 */
export interface MapPlace {
  id: number | string
  name: string
  address?: string
  lat: number
  lng: number
  category?: string
  description?: string
}

/** 장소 유형. 마커 색을 정한다 */
export interface MapCategory {
  id: string
  name: string
  icon: string
  color: string
}

/** ref로 부르는 지도 조작 함수 */
export interface NaverMapHandle {
  moveToLocation: (lat: number, lng: number, zoom?: number) => void
  zoomIn: () => void
  zoomOut: () => void
  setZoom: (zoom: number) => void
  getMap: () => naver.maps.Map | null
}

export interface NaverMapProps {
  places?: MapPlace[]
  categories?: MapCategory[]
  onMapClick?: (lat: number, lng: number) => void
  onPlaceClick?: (place: MapPlace) => void
  /** 지금은 읽지 않는다 */
  userLocation?: UserLocation | null
  /** 지금은 읽지 않는다 */
  routePath?: unknown
  /** 지금은 읽지 않는다 */
  showMyLocation?: boolean
}

const NaverMapComponent = forwardRef<NaverMapHandle, NaverMapProps>(
  ({ places = [], categories = [], onMapClick, onPlaceClick }, ref) => {
    const mapElementRef = useRef<HTMLDivElement>(null) // 지도를 담을 div 엘리먼트에 대한 ref
    const mapInstanceRef = useRef<naver.maps.Map | null>(null) // 생성된 네이버 지도 인스턴스에 대한 ref
    const markersRef = useRef<naver.maps.Marker[]>([])
    const infoWindowsRef = useRef<naver.maps.InfoWindow[]>([])
    const selectionMarkerRef = useRef<naver.maps.Marker | null>(null)
    const clickListenerRef = useRef<naver.maps.MapEventListener | null>(null)
    const onMapClickRef = useRef(onMapClick)

    // 최신 onMapClick 콜백을 보관해 비동기 로딩 후에도 참조되도록 함
    useEffect(() => {
      onMapClickRef.current = onMapClick
    }, [onMapClick])

    const getCategoryIcon = (categoryId?: string) => {
      switch (categoryId) {
        case 'restaurant':
          return '🍽️'
        case 'cafe':
          return '☕'
        case 'partner':
          return '🤝'
        case 'convenience':
          return '🏪'
        case 'other':
          return '📍'
        default:
          return '📍'
      }
    }

    useImperativeHandle(ref, () => ({
      moveToLocation: (lat: number, lng: number, zoom = 16) => {
        if (mapInstanceRef.current && window.naver && window.naver.maps) {
          mapInstanceRef.current.setCenter(
            new window.naver.maps.LatLng(lat, lng)
          )
          mapInstanceRef.current.setZoom(zoom)
        }
      },
      zoomIn: () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1)
        }
      },
      zoomOut: () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1)
        }
      },
      setZoom: (zoom: number) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(zoom)
        }
      },
      getMap: () => mapInstanceRef.current
    }))

    // 지도 초기화 로직 (최초 1회만 실행)
    useEffect(() => {
      if (!mapElementRef.current) return

      const initMap = () => {
        if (mapInstanceRef.current || !window.naver || !window.naver.maps)
          return
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.5665, 126.978),
          zoom: 15
        }
        // effect 시작에서 엘리먼트를 확인했다
        const map = new window.naver.maps.Map(
          mapElementRef.current!,
          mapOptions
        )
        mapInstanceRef.current = map

        // 지도가 준비되면 클릭 리스너 바로 연결 (스크립트 지연 로딩 대비)
        try {
          if (clickListenerRef.current) {
            window.naver.maps.Event.removeListener(clickListenerRef.current)
            clickListenerRef.current = null
          }
          clickListenerRef.current = window.naver.maps.Event.addListener(
            map,
            'click',
            (e: { coord: naver.maps.LatLng }) => {
              const lat = e.coord.lat()
              const lng = e.coord.lng()
              if (!selectionMarkerRef.current) {
                selectionMarkerRef.current = new window.naver.maps.Marker({
                  position: new window.naver.maps.LatLng(lat, lng),
                  map,
                  icon: {
                    content:
                      '<div style="transform:translate(-50%,-100%);">📍</div>'
                  }
                })
              } else {
                selectionMarkerRef.current.setPosition(
                  new window.naver.maps.LatLng(lat, lng)
                )
                selectionMarkerRef.current.setMap(map)
              }
              if (onMapClickRef.current) onMapClickRef.current(lat, lng)
            }
          )
        } catch {}
      }

      if (window.naver && window.naver.maps) {
        initMap()
      } else {
        const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID
        if (!clientId) {
          return
        }
        if (!isNaverMapScriptLoaded) {
          isNaverMapScriptLoaded = true
          const script = document.createElement('script')
          script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`
          script.async = true
          script.onerror = () => {
            isNaverMapScriptLoaded = false
          }
          script.onload = () => initMap()
          document.head.appendChild(script)
        } else {
          // 스크립트 로딩 중이거나 이미 로드됨: 준비될 때까지 대기
          const timer = setInterval(() => {
            if (window.naver && window.naver.maps) {
              clearInterval(timer)
              initMap()
            }
          }, 50)
          return () => clearInterval(timer)
        }
      }
      return () => {
        // 언마운트 시 리스너 정리
        try {
          if (clickListenerRef.current) {
            window.naver.maps.Event.removeListener(clickListenerRef.current)
            clickListenerRef.current = null
          }
        } catch {}
      }
    }, [])

    // 기존 의존성 문제로 클릭 리스너가 누락되는 것을 방지하기 위해
    // 초기화 이펙트에서 리스너를 연결하도록 변경(위 로직).

    // 외부에서 전달한 선택 좌표(pin) 반영 (선택사항)
    useEffect(() => {
      if (!mapInstanceRef.current || !window.naver || !window.naver.maps) return
      // prop으로 제어하려면 향후 pinLatLng 지원 추가 가능
    }, [])

    // 장소 마커 업데이트 로직
    useEffect(() => {
      if (!mapInstanceRef.current || !window.naver || !window.naver.maps) return

      // 기존 마커 정리
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
      infoWindowsRef.current.forEach(infoWindow => infoWindow.close())
      infoWindowsRef.current = []

      // 새 마커 추가
      places.forEach(place => {
        const category = categories.find(cat => cat.id === place.category)
        const markerColor = category ? category.color : '#FF6B6B'

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(place.lat, place.lng),
          // effect 시작에서 지도 인스턴스를 확인했다
          map: mapInstanceRef.current!,
          icon: {
            content: `<div style="background-color:${markerColor};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;">${getCategoryIcon(place.category)}</div>`,
            anchor: new window.naver.maps.Point(12, 12)
          }
        })

        // 마커 클릭 시 장소 상세 모달 열기
        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (onPlaceClick) {
            onPlaceClick(place)
          }
        })

        markersRef.current.push(marker)
      })
    }, [places, categories, onPlaceClick])

    // 클릭 모드에 따른 커서 스타일 변경 제거
    // useEffect(() => {
    //     if (!mapInstanceRef.current) return;
    //     const mapEl = mapInstanceRef.current.getElement();
    //     if (mapEl) {
    //         mapEl.style.cursor = mapClickMode ? 'crosshair' : 'grab';
    //     }
    // }, [mapClickMode]);

    return (
      <div
        id="map"
        ref={mapElementRef}
        style={{ width: '100%', height: '100%' }}
      />
    )
  }
)

const MemoizedNaverMap = memo(NaverMapComponent)

export default MemoizedNaverMap
