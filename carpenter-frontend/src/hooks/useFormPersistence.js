import { useState, useEffect, useCallback, useRef } from 'react';
import { syncManager } from '../utils/SyncManager';

/**
 * PRODUCTION-GRADE: Persistence hook with versioning and background sync
 */
export const useFormPersistence = (key, initialState, user) => {
  
  // Load initial state + metadata
  const getStoredData = () => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          data: parsed.data || initialState,
          version: parsed.version || 0,
          idempotencyKey: parsed.idempotencyKey || crypto.randomUUID()
        };
      }
    } catch (e) {
      console.error('Failed to load persisted data', e);
    }
    return { data: initialState, version: 0, idempotencyKey: crypto.randomUUID() };
  };

  const [state, setState] = useState(getStoredData);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle background conflicts (e.g. server newer)
  useEffect(() => {
    const handleConflict = (e) => {
      if (e.detail.key === key) {
        // In a real app, you might show a modal to the user.
        // For simplicity, we'll mark that a refresh is needed.
        console.warn("Server data is newer. Refresh recommended.");
      }
    };
    window.addEventListener('sync-conflict', handleConflict);
    return () => window.removeEventListener('sync-conflict', handleConflict);
  }, [key]);

  // Persist to localStorage + Queue for background sync
  const updateData = useCallback((newDataOrFn) => {
    setState((prev) => {
      const nextData = typeof newDataOrFn === 'function' ? newDataOrFn(prev.data) : newDataOrFn;
      const nextVersion = prev.version + 1;
      
      const nextState = {
        ...prev,
        data: nextData,
        version: nextVersion
      };

      // 1. Immediate Local Save
      localStorage.setItem(key, JSON.stringify(nextState));

      // 2. Queue for Background Sync (if user logged in)
      if (user) {
        syncManager.addTask(key, nextData, nextVersion);
      }
      
      return nextState;
    });
  }, [key, user]);

  const clearData = useCallback(() => {
    localStorage.removeItem(key);
    setState({ data: initialState, version: 0, idempotencyKey: crypto.randomUUID() });
  }, [key, initialState]);

  const forceSetState = useCallback((newState) => {
      localStorage.setItem(key, JSON.stringify(newState));
      setState(newState);
  }, [key]);

  return [state.data, updateData, clearData, { 
    version: state.version, 
    idempotencyKey: state.idempotencyKey,
    forceSetState
  }];
};
