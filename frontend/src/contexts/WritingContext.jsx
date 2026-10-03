import React, { createContext, useContext, useState } from 'react';

const WritingContext = createContext();

export const useWriting = () => {
  const context = useContext(WritingContext);
  if (!context) {
    throw new Error('useWriting must be used within a WritingProvider');
  }
  return context;
};

export const WritingProvider = ({ children }) => {
  const [isWriting, setIsWriting] = useState(false);
  const [writingType, setWritingType] = useState(null); // 'sale' or 'wanted'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const startWriting = (type) => {
    setIsWriting(true);
    setWritingType(type);
  };

  const stopWriting = () => {
    setIsWriting(false);
    setWritingType(null);
    setHasUnsavedChanges(false);
  };

  const setUnsavedChanges = (hasChanges) => {
    setHasUnsavedChanges(hasChanges);
  };

  const value = {
    isWriting,
    writingType,
    hasUnsavedChanges,
    startWriting,
    stopWriting,
    setUnsavedChanges
  };

  return (
    <WritingContext.Provider value={value}>
      {children}
    </WritingContext.Provider>
  );
}; 