let daumPostcodeLoading = null;

const DAUM_POSTCODE_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

function loadDaumPostcode() {
  if (window.daum && window.daum.Postcode) return Promise.resolve();
  if (daumPostcodeLoading) return daumPostcodeLoading;
  daumPostcodeLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = DAUM_POSTCODE_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
  return daumPostcodeLoading;
}

export async function openDaumPostcode() {
  await loadDaumPostcode();
  return new Promise((resolve) => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        resolve(data);
      },
      // autoClose는 팝업형에서만 유효; Vite dev에서는 별도 설정 없이 창이 열림.
    }).open();
  });
}

