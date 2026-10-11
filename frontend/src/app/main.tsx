import React from 'react'
import ReactDOM from 'react-dom/client'
import { LucideProvider } from 'lucide-react'
import { AuthProvider } from '@/shared/contexts/AuthContext'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    {/* 아이콘 기본 크기를 글자 크기(1em)에 맞춘다. size를 직접 준 아이콘은 그 값을 쓴다 */}
    <LucideProvider size="1em">
      <App />
    </LucideProvider>
  </AuthProvider>
)
