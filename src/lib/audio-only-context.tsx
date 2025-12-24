'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AudioOnlyContextType {
  isAudioOnly: boolean;
  setIsAudioOnly: (value: boolean) => void;
  isHydrated: boolean;
}

const AudioOnlyContext = createContext<AudioOnlyContextType | undefined>(undefined);

interface AudioOnlyProviderProps {
  children: ReactNode;
}

export function AudioOnlyProvider({ children }: AudioOnlyProviderProps) {
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem('audioOnlyMode');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAudioOnly(JSON.parse(saved));
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('audioOnlyMode', JSON.stringify(isAudioOnly));
    }
  }, [isAudioOnly, isHydrated]);

  return (
    <AudioOnlyContext.Provider value={{ isAudioOnly, setIsAudioOnly, isHydrated }}>
      {children}
    </AudioOnlyContext.Provider>
  );
}

export function useAudioOnly() {
  const context = useContext(AudioOnlyContext);
  if (context === undefined) {
    throw new Error('useAudioOnly must be used within an AudioOnlyProvider');
  }
  return context;
}