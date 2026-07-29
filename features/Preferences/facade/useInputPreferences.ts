'use client';

import { useMemo } from 'react';
import usePreferencesStore from '../store/usePreferencesStore';

export interface InputPreferences {
  hotkeysOn: boolean;
  setHotkeys: (hotkeys: boolean) => void;
}

/**
 * Input Preferences Facade
 *
 * Provides access to input-related preferences (hotkeys, etc.)
 */
export function useInputPreferences(): InputPreferences {
  const hotkeysOn = usePreferencesStore(state => state.hotkeysOn);
  const setHotkeys = usePreferencesStore(state => state.setHotkeys);

  return useMemo<InputPreferences>(
    () => ({
      hotkeysOn,
      setHotkeys,
    }),
    [hotkeysOn, setHotkeys],
  );
}
