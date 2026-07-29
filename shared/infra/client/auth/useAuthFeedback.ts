'use client';

import { useCallback } from 'react';
import { useClick } from '@/shared/hooks/generic/useAudio';
import {
  hapticImpact,
  hapticNotify,
} from '@/shared/infra/client/native/haptics';

/**
 * Unified tactile/audio feedback for auth interactions: reuses the app's own
 * click sound and adds native haptics so the login/signup screens feel exactly
 * like the rest of KanaDojo.
 */
export function useAuthFeedback() {
  const { playClick } = useClick();

  const tap = useCallback(() => {
    playClick();
    void hapticImpact('light');
  }, [playClick]);

  const success = useCallback(() => {
    void hapticNotify('success');
  }, []);

  const error = useCallback(() => {
    void hapticNotify('error');
  }, []);

  return { tap, success, error };
}
