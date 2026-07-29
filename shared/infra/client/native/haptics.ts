'use client';

import { isNativeApp } from './initNative';

/**
 * Thin wrappers around the Capacitor Haptics plugin. All are no-ops on the web
 * (and safely swallow errors), so callers can fire them unconditionally.
 */
export async function hapticImpact(
  strength: 'light' | 'medium' | 'heavy' = 'light',
): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const style =
      strength === 'heavy'
        ? ImpactStyle.Heavy
        : strength === 'medium'
          ? ImpactStyle.Medium
          : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch {
    /* haptics unavailable */
  }
}

export async function hapticNotify(
  kind: 'success' | 'warning' | 'error' = 'success',
): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    const type =
      kind === 'error'
        ? NotificationType.Error
        : kind === 'warning'
          ? NotificationType.Warning
          : NotificationType.Success;
    await Haptics.notification({ type });
  } catch {
    /* haptics unavailable */
  }
}

export async function hapticSelection(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  } catch {
    /* haptics unavailable */
  }
}
