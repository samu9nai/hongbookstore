let daumPostcodeLoading: Promise<void> | null = null

const DAUM_POSTCODE_SRC =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

function loadDaumPostcode(): Promise<void> {
  if (window.daum && window.daum.Postcode) return Promise.resolve()
  if (daumPostcodeLoading) return daumPostcodeLoading
  daumPostcodeLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = DAUM_POSTCODE_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = e => reject(e)
    document.head.appendChild(script)
  })
  return daumPostcodeLoading
}

export async function openDaumPostcode(): Promise<DaumPostcodeData> {
  await loadDaumPostcode()
  return new Promise(resolve => {
    // 스크립트 onload 뒤에는 window.daum이 있다
    new window.daum!.Postcode({
      oncomplete: data => {
        resolve(data)
      }
      // autoClose는 팝업형에서만 유효; Vite dev에서는 별도 설정 없이 창이 열림.
    }).open()
  })
}
