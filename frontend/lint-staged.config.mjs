// 작업은 저장소 루트에서 실행된다. lint-staged는 frontend/의 bin을 PATH에 넣지 않으므로 경로를 적는다.
/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx,js,jsx,mjs,cjs}': [
    'frontend/node_modules/.bin/oxlint -c frontend/.oxlintrc.json --type-aware --fix --max-warnings=0',
    'frontend/node_modules/.bin/prettier --write'
  ],
  '*.{css,html,json,md,yml,yaml}': 'frontend/node_modules/.bin/prettier --write'
}
