import React from 'react'
import ReactDOM from 'react-dom/client'
import { LucideProvider } from 'lucide-react'
import { AuthProvider } from '@/shared/contexts/AuthContext'
import './index.css'
import App from './App'

// index.html에 #root가 있다
ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    {/* 아이콘 기본 크기를 글자 크기(1em)에 맞춘다. size를 직접 준 아이콘은 그 값을 쓴다 */}
    {/* @ts-expect-error -- LucideProvider 타입은 size를 숫자로만 받지만 아이콘은 문자열 크기를 width·height에 그대로 쓴다 */}
    <LucideProvider size="1em">
      <App />
    </LucideProvider>
  </AuthProvider>
)
