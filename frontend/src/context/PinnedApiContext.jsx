import React, { createContext, useContext, useEffect, useState } from 'react';

const PinnedApiContext = createContext();

export function PinnedApiProvider({ children }) {
  const [pinnedApis, setPinnedApis] = useState(() => {
    try {
      const stored = localStorage.getItem('pinnedApis');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('pinnedApis', JSON.stringify(pinnedApis));
  }, [pinnedApis]);

  return (
    <PinnedApiContext.Provider value={{ pinnedApis, setPinnedApis }}>
      {children}
    </PinnedApiContext.Provider>
  );
}

export function usePinnedApis() {
  return useContext(PinnedApiContext);
}
