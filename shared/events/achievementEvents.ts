// ============================================================================
// Achievement Event System
// ============================================================================

export interface AchievementEvent {
  type: 'check' | 'unlock';
  achievementId?: string;
  timestamp: number;
}

class AchievementEventBus {
  private listeners: Set<(event: AchievementEvent) => void> = new Set();

  subscribe(listener: (event: AchievementEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: AchievementEvent): void {
    this.listeners.forEach(listener => listener(event));
  }
}

export const achievementEvents = new AchievementEventBus();

export const achievementApi = {
  triggerCheck() {
    achievementEvents.emit({ type: 'check', timestamp: Date.now() });
  },

  recordUnlock(achievementId: string) {
    achievementEvents.emit({
      type: 'unlock',
      achievementId,
      timestamp: Date.now(),
    });
  },
};
