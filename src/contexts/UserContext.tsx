import React, { createContext, useContext, useState, useEffect } from 'react';
import localforage from 'localforage';

export interface Child {
  id: string;
  name: string;
  age: number;
  strengths: string[];
  challenges: string[];
}

export interface UserPreferences {
  kids: Child[];
  savedLibrary: any[];
  cache: Record<string, any>;
  userStyle: 'practical' | 'analytical' | 'simulation';
}

interface UserContextType {
  preferences: UserPreferences;
  addChild: (child: Child) => void;
  updateChild: (id: string, child: Partial<Child>) => void;
  removeChild: (id: string) => void;
  addToLibrary: (item: any, tabId?: string) => void;
  removeFromLibrary: (item: any) => void;
  setCacheItem: (key: string, value: any) => void;
  getCacheItem: (key: string) => any;
  setUserStyle: (style: 'practical' | 'analytical' | 'simulation') => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({ 
    kids: [], 
    savedLibrary: [], 
    cache: {},
    userStyle: 'practical'
  });

  useEffect(() => {
    localforage.getItem<UserPreferences>('userPreferences').then(saved => {
      if (saved) {
        // Migration: ensure userStyle exists
        if (!saved.userStyle) {
          saved.userStyle = 'practical';
        }
        setPreferences(saved);
      }
    });
  }, []);

  useEffect(() => {
    localforage.setItem('userPreferences', preferences);
  }, [preferences]);

  const addChild = (child: Child) => setPreferences(p => ({ ...p, kids: [...p.kids, child] }));
  const updateChild = (id: string, child: Partial<Child>) => 
      setPreferences(p => ({ ...p, kids: p.kids.map(c => c.id === id ? { ...c, ...child } : c) }));
  const removeChild = (id: string) => 
      setPreferences(p => ({ ...p, kids: p.kids.filter(c => c.id !== id) }));
  
  const setUserStyle = (style: 'practical' | 'analytical' | 'simulation') => 
    setPreferences(p => ({ ...p, userStyle: style }));

  const addToLibrary = (item: any, tabId?: string) => setPreferences(p => {
    let newItem = item;
    if (item && typeof item === 'object' && tabId) {
      newItem = { ...item, tabId };
    }
    if (!p.savedLibrary || !Array.isArray(p.savedLibrary)) {
      return { ...p, savedLibrary: [newItem] };
    }
    const isDuplicate = p.savedLibrary.some(stored => {
        // Simple heuristic: compare IDs, or stringified objects, or raw values
        if (stored.id && newItem.id) return stored.id === newItem.id;
        return JSON.stringify(stored) === JSON.stringify(newItem);
    });
    if (isDuplicate) return p;
    return { ...p, savedLibrary: [...p.savedLibrary, newItem] };
  });

  const removeFromLibrary = (itemToRemove: any) => setPreferences(p => {
    if (!p.savedLibrary || !Array.isArray(p.savedLibrary)) {
      return { ...p, savedLibrary: [] };
    }
    return { 
      ...p, 
      savedLibrary: p.savedLibrary.filter(stored => {
        if (stored.id && itemToRemove.id) return stored.id !== itemToRemove.id;
        return JSON.stringify(stored) !== JSON.stringify(itemToRemove);
      }) 
    };
  });
  
  const setCacheItem = (key: string, value: any) => setPreferences(p => ({ ...p, cache: { ...p.cache, [key]: value } }));
  const getCacheItem = (key: string) => preferences.cache[key];
  
  return (
    <UserContext.Provider value={{ preferences, addChild, updateChild, removeChild, addToLibrary, removeFromLibrary, setCacheItem, getCacheItem, setUserStyle }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};
