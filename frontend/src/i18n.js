import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko/translation.json';
import en from './locales/en/translation.json';
import ja from './locales/ja/translation.json';
import zh from './locales/zh/translation.json';

// 안전한 언어 설정 함수
const getInitialLanguage = () => {
  try {
    const savedLang = localStorage.getItem('lang');
    if (savedLang && ['ko', 'en', 'ja', 'zh'].includes(savedLang)) {
      return savedLang;
    }
  } catch (error) {
    console.warn('Failed to get language from localStorage:', error);
  }
  return 'ko'; // 기본값은 한국어
};

// i18n 초기화를 즉시 실행
const initI18n = () => {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        ko: { translation: ko },
        en: { translation: en },
        ja: { translation: ja },
        zh: { translation: zh },
      },
      lng: getInitialLanguage(),
      fallbackLng: 'ko',
      interpolation: { escapeValue: false },
      react: {
        useSuspense: false,
      },
    });
};

// 즉시 초기화 실행
initI18n();

// 개발 환경에서 전역으로 노출 (디버깅용)
if (process.env.NODE_ENV === 'development') {
  window.i18n = i18n;
}

export default i18n; 