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
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('apiNotes') || '{}');
    } catch {
      return {};
    }
  });

  // Reload state from localStorage on mount (for hot reloads, tab sync, etc)
  useEffect(() => {
    try {
      const storedPins = localStorage.getItem('pinnedApis');
      if (storedPins) setPinnedApis(JSON.parse(storedPins));
    } catch {}
    try {
      const storedNotes = localStorage.getItem('apiNotes');
      if (storedNotes) setNotes(JSON.parse(storedNotes));
    } catch {}
  }, []);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem('pinnedApis', JSON.stringify(pinnedApis));
  }, [pinnedApis]);
  useEffect(() => {
    localStorage.setItem('apiNotes', JSON.stringify(notes));
  }, [notes]);

  // Pin/unpin API with notification
  const pinApi = (apiId) => {
    console.log('[PinnedApiContext] pinApi called for', apiId);
    setPinnedApis((prev) => {
      if (prev.includes(apiId)) return prev;
      setNotification({ type: 'pin', apiId });
      return [...prev, apiId];
    });
  };
  const unpinApi = (apiId) => {
    console.log('[PinnedApiContext] unpinApi called for', apiId);
    setPinnedApis((prev) => {
      if (!prev.includes(apiId)) return prev;
      setNotification({ type: 'unpin', apiId });
      return prev.filter((id) => id !== apiId);
    });
  };

  // Notes logic: one note per API (string, not array) -> now array of objects
  const addNote = (apiId, note) => {
    if (!note || !note.trim()) return;
    const newNoteObj = { text: note, date: new Date().toISOString() };
    setNotes((prev) => {
      const existing = prev[apiId];
      if (Array.isArray(existing)) {
        return { ...prev, [apiId]: [...existing, newNoteObj] };
      } else if (existing && typeof existing === 'string') {
        return { ...prev, [apiId]: [{ text: existing, date: null }, newNoteObj] };
      }
      return { ...prev, [apiId]: [newNoteObj] };
    });
  };
  const updateNote = (apiId, note) => {
    // legacy updateNote
    setNotes((prev) => ({ ...prev, [apiId]: note }));
  };
  const removeNote = (apiId) => setNotes((prev) => {
    const n = { ...prev };
    delete n[apiId];
    return n;
  });

  // Clear notification after 2 seconds
  useEffect(() => {
    if (notification) {
      console.log('[PinnedApiContext] notification set:', notification);
      const timer = setTimeout(() => setNotification(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <PinnedApiContext.Provider value={{ pinnedApis, setPinnedApis, pinApi, unpinApi, notes, addNote, updateNote, removeNote, notification }}>
      {children}
    </PinnedApiContext.Provider>
  );
}

export function usePinnedApis() {
  return useContext(PinnedApiContext);
}
