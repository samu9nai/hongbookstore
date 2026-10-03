const fs = require('fs');
const path = require('path');

const languages = ['ko', 'en', 'ja', 'zh'];
const files = {};

// 모든 번역 파일 읽기
console.log('=== 번역 파일 읽기 ===');
languages.forEach(lang => {
  try {
    const filePath = path.join(lang, 'translation.json');
    const content = fs.readFileSync(filePath, 'utf8');
    files[lang] = JSON.parse(content);
    console.log(`✅ ${lang}: ${Object.keys(files[lang]).length} 최상위 키`);
  } catch (error) {
    console.log(`❌ ${lang}: 파일 읽기 오류 - ${error.message}`);
  }
});

// 키 구조 비교
const getAllKeys = (obj, prefix = '') => {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
};

const allKeys = {};
languages.forEach(lang => {
  if (files[lang]) {
    allKeys[lang] = getAllKeys(files[lang]);
  }
});

// 누락된 키 찾기
console.log('\n=== 키 비교 결과 ===');
languages.forEach(lang => {
  if (!allKeys[lang]) return;
  
  console.log(`\n--- ${lang.toUpperCase()} ---`);
  const otherLangs = languages.filter(l => l !== lang && allKeys[l]);
  
  otherLangs.forEach(otherLang => {
    const missingInThis = allKeys[otherLang].filter(key => !allKeys[lang].includes(key));
    const missingInOther = allKeys[lang].filter(key => !allKeys[otherLang].includes(key));
    
    if (missingInThis.length > 0) {
      console.log(`❌ ${lang}에 없는 키들 (vs ${otherLang}):`);
      missingInThis.slice(0, 10).forEach(key => console.log(`  - ${key}`));
      if (missingInThis.length > 10) console.log(`  ... 그리고 ${missingInThis.length - 10}개 더`);
    }
    
    if (missingInOther.length > 0) {
      console.log(`❌ ${otherLang}에 없는 키들 (vs ${lang}):`);
      missingInOther.slice(0, 10).forEach(key => console.log(`  - ${key}`));
      if (missingInOther.length > 10) console.log(`  ... 그리고 ${missingInOther.length - 10}개 더`);
    }
    
    if (missingInThis.length === 0 && missingInOther.length === 0) {
      console.log(`✅ ${lang}과 ${otherLang}은 동일한 키 구조`);
    }
  });
});

// 전체 키 개수 비교
console.log('\n=== 전체 키 개수 ===');
languages.forEach(lang => {
  if (allKeys[lang]) {
    console.log(`${lang}: ${allKeys[lang].length}개 키`);
  }
});
