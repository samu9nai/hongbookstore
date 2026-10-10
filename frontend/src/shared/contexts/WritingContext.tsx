import React, {
  createContext,
  useContext,
  useState,
  type ReactNode
} from 'react'

/** 작성 중인 글의 종류. 'sale'은 판매글, 'wanted'는 구해요 글이다 */
export type WritingType = 'sale' | 'wanted'

export interface WritingContextValue {
  isWriting: boolean
  writingType: WritingType | null
  hasUnsavedChanges: boolean
  startWriting: (type: WritingType) => void
  stopWriting: () => void
  setUnsavedChanges: (hasChanges: boolean) => void
}

const WritingContext = createContext<WritingContextValue | undefined>(undefined)

// oxlint-disable-next-line react/only-export-components -- 컨텍스트 훅을 Provider와 같은 파일에 둔다
export const useWriting = () => {
  const context = useContext(WritingContext)
  if (!context) {
    throw new Error('useWriting must be used within a WritingProvider')
  }
  return context
}

export const WritingProvider = ({ children }: { children?: ReactNode }) => {
  const [isWriting, setIsWriting] = useState(false)
  const [writingType, setWritingType] = useState<WritingType | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const startWriting = (type: WritingType) => {
    setIsWriting(true)
    setWritingType(type)
  }

  const stopWriting = () => {
    setIsWriting(false)
    setWritingType(null)
    setHasUnsavedChanges(false)
  }

  const setUnsavedChanges = (hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges)
  }

  const value: WritingContextValue = {
    isWriting,
    writingType,
    hasUnsavedChanges,
    startWriting,
    stopWriting,
    setUnsavedChanges
  }

  return (
    <WritingContext.Provider value={value}>{children}</WritingContext.Provider>
  )
}
